from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from typing import List
from uuid import UUID
import uuid

from app.core.deps import get_db, get_current_active_user
from app.core.cache import CacheService, invalidate_cache_pattern
from app.models.organisation import Organisation
from app.models.user import User
from app.models.role import ProjectRole, Permission, role_permissions
from app.schemas.organisation import OrganisationCreate, OrganisationUpdate, OrganisationResponse

router = APIRouter()

# Cache TTL settings
ORG_CACHE_TTL = 300  # 5 minutes
ORG_DETAIL_CACHE_TTL = 600  # 10 minutes


async def invalidate_org_caches(org_id: str, user_id: str = None):
    """Invalidate cache entries for an organization."""
    await invalidate_cache_pattern(f"org:{org_id}:*")
    if user_id:
        await invalidate_cache_pattern(f"orgs:user:{user_id}")

# Default roles configuration
DEFAULT_ROLES = {
    "owner": {
        "name": "Owner",
        "role_type": "owner",
        "description": "Has full control — can manage billing, delete the organization, assign roles, and configure SSO",
        "permissions": ["all"]
    },
    "admin": {
        "name": "Admin",
        "role_type": "admin",
        "description": "Manages organization settings, users, integrations, and platform operations",
        "permissions": ["all"]
    },
    "qa_manager": {
        "name": "QA Manager",
        "role_type": "qa_manager",
        "description": "Manages QA teams, assigns testers, oversees test execution, and reviews results",
        "permissions": [
            "read_project", "update_project", "manage_project",
            "create_test_plan", "read_test_plan", "update_test_plan", "delete_test_plan",
            "create_test_suite", "read_test_suite", "update_test_suite", "delete_test_suite",
            "read_test_case", "read_test_execution",
            "read_user", "update_user", "manage_user",
            "read_group", "update_group", "manage_group",
            "read_role",
            "read_settings", "manage_settings",
        ]
    },
    "qa_lead": {
        "name": "QA Lead",
        "role_type": "qa_lead",
        "description": "Leads QA engineers, approves test cases, and validates AI-generated fixes",
        "permissions": [
            "read_project",
            "create_test_plan", "read_test_plan", "update_test_plan",
            "create_test_suite", "read_test_suite", "update_test_suite",
            "create_test_case", "read_test_case", "update_test_case", "delete_test_case",
            "execute_test", "read_test_execution",
            "read_user", "manage_user",
            "read_group", "manage_group",
            "read_role",
            "read_settings",
        ]
    },
    "qa_engineer": {
        "name": "QA Engineer",
        "role_type": "qa_engineer",
        "description": "Creates, executes, and maintains automated and manual tests",
        "permissions": [
            "read_project",
            "read_test_plan",
            "read_test_suite",
            "create_test_case", "read_test_case", "update_test_case",
            "execute_test", "read_test_execution",
            "read_user", "read_group", "read_role",
            "read_settings",
        ]
    },
    "product_owner": {
        "name": "Product Owner",
        "role_type": "product_owner",
        "description": "Represents business interests, reviews reports and KPIs, ensures testing aligns with product goals",
        "permissions": [
            "read_project",
            "read_test_plan",
            "read_test_suite",
            "read_test_case",
            "read_test_execution",
            "read_user", "read_group", "read_role",
            "read_settings",
        ]
    },
    "viewer": {
        "name": "Viewer",
        "role_type": "viewer",
        "description": "Has view-only access to dashboards, reports, and analytics",
        "permissions": [
            "read_project",
            "read_test_plan",
            "read_test_suite",
            "read_test_case",
            "read_test_execution",
            "read_user", "read_group", "read_role",
            "read_settings",
        ]
    },
}


async def initialize_default_roles_for_org(
    organisation_id: UUID,
    created_by: str,
    db: AsyncSession
) -> int:
    """Initialize default roles for a new organisation"""
    roles_count = 0

    # Get all permissions
    all_permissions_result = await db.execute(select(Permission))
    all_permissions = all_permissions_result.scalars().all()
    permissions_map = {p.name: p for p in all_permissions}

    for role_key, role_data in DEFAULT_ROLES.items():
        # Check if role already exists
        result = await db.execute(
            select(ProjectRole).where(
                ProjectRole.organisation_id == organisation_id,
                ProjectRole.role_type == role_data["role_type"]
            )
        )
        existing_role = result.scalar_one_or_none()

        if existing_role:
            continue  # Skip if role already exists

        # Create role
        role = ProjectRole(
            id=uuid.uuid4(),
            organisation_id=organisation_id,
            name=role_data["name"],
            role_type=role_data["role_type"],
            description=role_data["description"],
            is_system_role=True,
            is_active=True,
            created_by=created_by
        )
        db.add(role)
        await db.flush()

        # Assign permissions to role
        perm_names = role_data["permissions"]
        if perm_names == ["all"]:
            # Administrator gets all permissions
            perm_names = list(permissions_map.keys())

        for perm_name in perm_names:
            if perm_name in permissions_map:
                permission = permissions_map[perm_name]
                await db.execute(
                    role_permissions.insert().values(
                        id=uuid.uuid4(),
                        role_id=role.id,
                        permission_id=permission.id,
                        assigned_by=created_by
                    )
                )

        roles_count += 1

    return roles_count


@router.get("/{organisation_id}/users", response_model=List[dict])
async def list_organisation_users(
    organisation_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List all users in an organisation (owner + members).
    Only the organisation owner can access this endpoint.
    """
    # Verify user owns the organisation
    result = await db.execute(
        select(Organisation).where(
            Organisation.id == organisation_id,
            Organisation.owner_id == current_user.id
        )
    )
    organisation = result.scalar_one_or_none()

    if not organisation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organisation not found or you don't have permission"
        )

    # Get all users in this organisation
    from sqlalchemy import text
    users_result = await db.execute(
        text("""
            SELECT DISTINCT
                u.id,
                u.email,
                u.username,
                u.full_name,
                u.is_active,
                u.created_at,
                CASE WHEN o.owner_id = u.id THEN 'owner' ELSE 'member' END as role,
                CASE WHEN o.owner_id = u.id THEN 0 ELSE 1 END as sort_order
            FROM users u
            LEFT JOIN organisations o ON o.owner_id = u.id AND o.id = :org_id
            LEFT JOIN user_organisations uo ON uo.user_id = u.id AND uo.organisation_id = :org_id
            WHERE (o.owner_id = u.id AND o.id = :org_id) OR (uo.user_id = u.id AND uo.organisation_id = :org_id)
            ORDER BY sort_order, u.created_at DESC
        """),
        {"org_id": str(organisation_id)}
    )

    users = []
    for row in users_result.fetchall():
        users.append({
            "id": str(row[0]),
            "email": row[1],
            "username": row[2],
            "full_name": row[3],
            "is_active": row[4],
            "created_at": row[5].isoformat() if row[5] else None,
            "role": row[6]
        })

    return users


@router.post("/", response_model=OrganisationResponse, status_code=status.HTTP_201_CREATED)
async def create_organisation(
    organisation_data: OrganisationCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new organisation.

    Automatically initializes:
    - Default roles (Owner, Admin, QA Manager, QA Lead, QA Engineer, Product Owner, Viewer)
    - Group types (ADMIN, QA, DEV, PRODUCT) with their associated roles
    for the new organisation.
    """
    # Create new organisation
    new_organisation = Organisation(
        name=organisation_data.name,
        website=organisation_data.website,
        description=organisation_data.description,
        owner_id=current_user.id
    )

    db.add(new_organisation)
    await db.flush()  # Flush to get the organisation ID

    # Add owner to user_organisations table
    from sqlalchemy import text
    await db.execute(
        text(
            "INSERT INTO user_organisations (user_id, organisation_id, role, added_by) "
            "VALUES (:user_id, :org_id, :role, :added_by)"
        ),
        {
            "user_id": str(current_user.id),
            "org_id": str(new_organisation.id),
            "role": "owner",
            "added_by": str(current_user.id)
        }
    )

    # Automatically initialize default roles for the new organisation
    await initialize_default_roles_for_org(
        organisation_id=new_organisation.id,
        created_by=current_user.email,
        db=db
    )

    # Automatically initialize group types (ADMIN, QA, DEV, PRODUCT)
    from app.services.group_type_service import GroupTypeService
    await GroupTypeService.initialize_group_types(db, new_organisation.id, created_by=current_user.email)

    await db.commit()
    await db.refresh(new_organisation)

    # Invalidate user's org list cache
    await invalidate_cache_pattern(f"orgs:user:{current_user.id}")

    return new_organisation

@router.get("/", response_model=List[OrganisationResponse])
async def list_organisations(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List all organisations that the current user owns, is a member of, or has admin role in.
    - Owners: See their organizations
    - Members: See organizations they're members of
    - Admins: Users with administrator role in any project of an organization can see that organization
    """

    # Get organization IDs the user has access to (owner, member, or admin)
    query = text("""
        SELECT DISTINCT o.id
        FROM organisations o
        LEFT JOIN user_organisations uo ON o.id = uo.organisation_id
        LEFT JOIN projects p ON o.id = p.organisation_id
        LEFT JOIN user_project_roles upr ON p.id = upr.project_id
        LEFT JOIN project_roles pr ON upr.role_id = pr.id
        WHERE o.owner_id = :user_id
           OR uo.user_id = :user_id
           OR (upr.user_id = :user_id AND pr.role_type = 'administrator')
    """)

    result = await db.execute(query, {"user_id": str(current_user.id)})
    org_ids = [row[0] for row in result.fetchall()]

    # Fetch full Organisation objects
    if not org_ids:
        return []

    orgs_result = await db.execute(
        select(Organisation).where(Organisation.id.in_(org_ids)).order_by(Organisation.created_at.desc())
    )
    organisations = orgs_result.scalars().all()

    return organisations

@router.get("/{organisation_id}", response_model=OrganisationResponse)
async def get_organisation(
    organisation_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific organisation by ID.
    - Owners can access any organization
    - Members can access organizations they're members of
    - Admins can access organizations where they have the administrator role in any project
    """
    result = await db.execute(
        select(Organisation).where(Organisation.id == organisation_id)
    )
    organisation = result.scalar_one_or_none()

    if not organisation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organisation not found"
        )

    # Check access: owner, member, or admin
    is_owner = organisation.owner_id == current_user.id

    if not is_owner:
        # Check if user is a member
        member_check = await db.execute(
            text("""
                SELECT 1 FROM user_organisations
                WHERE organisation_id = :org_id AND user_id = :user_id
                LIMIT 1
            """),
            {"org_id": str(organisation_id), "user_id": str(current_user.id)}
        )
        is_member = member_check.fetchone() is not None

        if not is_member:
            # Check if user is an admin in any project of this organization
            admin_check = await db.execute(
                text("""
                    SELECT 1 FROM user_project_roles upr
                    INNER JOIN project_roles pr ON upr.role_id = pr.id
                    WHERE pr.organisation_id = :org_id
                      AND pr.role_type = 'administrator'
                      AND upr.user_id = :user_id
                    LIMIT 1
                """),
                {"org_id": str(organisation_id), "user_id": str(current_user.id)}
            )
            is_admin = admin_check.fetchone() is not None

            if not is_admin:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Organisation not found or you don't have permission"
                )

    return organisation

@router.put("/{organisation_id}", response_model=OrganisationResponse)
async def update_organisation(
    organisation_id: UUID,
    organisation_data: OrganisationUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update an organisation.
    """
    result = await db.execute(
        select(Organisation).where(
            Organisation.id == organisation_id,
            Organisation.owner_id == current_user.id
        )
    )
    organisation = result.scalar_one_or_none()

    if not organisation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organisation not found"
        )

    # Update fields
    if organisation_data.name is not None:
        organisation.name = organisation_data.name
    if organisation_data.website is not None:
        organisation.website = organisation_data.website
    if organisation_data.description is not None:
        organisation.description = organisation_data.description
    if organisation_data.logo is not None:
        organisation.logo = organisation_data.logo

    await db.commit()
    await db.refresh(organisation)

    # Invalidate caches for this organization
    await invalidate_org_caches(str(organisation_id), str(current_user.id))

    return organisation

@router.put("/{organisation_id}/enabled-modules", response_model=OrganisationResponse)
async def update_enabled_modules(
    organisation_id: UUID,
    modules_data: dict,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update the enabled modules for an organisation.

    Request body:
    {
        "enabled_modules": ["api_testing", "automation_hub", "security_testing", ...]
    }
    """
    result = await db.execute(
        select(Organisation).where(
            Organisation.id == organisation_id,
            Organisation.owner_id == current_user.id
        )
    )
    organisation = result.scalar_one_or_none()

    if not organisation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organisation not found"
        )

    # Update settings with enabled_modules
    if organisation.settings is None:
        organisation.settings = {}

    enabled_modules = modules_data.get("enabled_modules", [])
    if isinstance(enabled_modules, list):
        organisation.settings["enabled_modules"] = enabled_modules

    await db.commit()
    await db.refresh(organisation)

    return organisation


@router.delete("/{organisation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_organisation(
    organisation_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete an organisation and all related data.
    This will cascade delete:
    - Projects
    - Roles
    - Groups and Group Types
    - User organisation memberships
    - And all related data
    """
    result = await db.execute(
        select(Organisation).where(
            Organisation.id == organisation_id,
            Organisation.owner_id == current_user.id
        )
    )
    organisation = result.scalar_one_or_none()

    if not organisation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organisation not found"
        )

    # Delete related data in correct order to avoid foreign key constraint violations

    # 1. Delete user organisations
    await db.execute(
        text("DELETE FROM user_organisations WHERE organisation_id = :org_id"),
        {"org_id": str(organisation_id)}
    )

    # 2. Delete group type access (has FK to group_types) - uses "organization_id" (US spelling)
    await db.execute(
        text("DELETE FROM group_type_access WHERE organization_id = :org_id"),
        {"org_id": str(organisation_id)}
    )

    # 3. Delete group type roles (has FK to group_types)
    await db.execute(
        text("""
            DELETE FROM group_type_roles
            WHERE group_type_id IN (
                SELECT id FROM group_types WHERE organization_id = :org_id
            )
        """),
        {"org_id": str(organisation_id)}
    )

    # 4. Delete group types - uses "organization_id" (US spelling)
    await db.execute(
        text("DELETE FROM group_types WHERE organization_id = :org_id"),
        {"org_id": str(organisation_id)}
    )

    # 5. Delete groups (has FK to group_types, but we already deleted group_types)
    await db.execute(
        text("""
            DELETE FROM groups
            WHERE organisation_id = :org_id
        """),
        {"org_id": str(organisation_id)}
    )

    # 6. Delete projects and all related data
    await db.execute(
        text("""
            DELETE FROM user_project_roles
            WHERE project_id IN (
                SELECT id FROM projects WHERE organisation_id = :org_id
            )
        """),
        {"org_id": str(organisation_id)}
    )

    await db.execute(
        text("""
            DELETE FROM projects
            WHERE organisation_id = :org_id
        """),
        {"org_id": str(organisation_id)}
    )

    # 7. Delete project roles
    await db.execute(
        text("""
            DELETE FROM role_permissions
            WHERE role_id IN (
                SELECT id FROM project_roles WHERE organisation_id = :org_id
            )
        """),
        {"org_id": str(organisation_id)}
    )

    await db.execute(
        text("DELETE FROM project_roles WHERE organisation_id = :org_id"),
        {"org_id": str(organisation_id)}
    )

    # 8. Finally, delete the organisation itself
    await db.delete(organisation)
    await db.commit()

    return None
