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


# Default PROJECT roles configuration - 6 Enterprise Project Roles
# These are created for each organization to assign users to projects
DEFAULT_PROJECT_ROLES = {
    "project_admin": {
        "name": "Project Admin",
        "description": "Full project control — can manage billing, delete the project, assign roles, and configure settings",
        "role_type": "project_admin",
        "permissions": ["all"],
    },
    "qa_lead": {
        "name": "QA Lead",
        "description": "Test strategy owner — designs test plans, manages QA assignments, and reviews technical execution",
        "role_type": "qa_lead",
        "permissions": ["read_test_management", "write_test_management", "execute_test_management", "read_automation_hub", "execute_automation_hub", "read_security_testing", "read_performance_testing", "read_api_testing"],
    },
    "qa_engineer": {
        "name": "QA Engineer",
        "description": "Creates and executes tests, records evidence, runs automation flows",
        "role_type": "qa_engineer",
        "permissions": ["read_test_management", "write_test_management", "execute_test_management", "read_automation_hub", "execute_automation_hub"],
    },
    "auto_eng": {
        "name": "Automation Engineer",
        "description": "Manages automation flows, AI scripts, and continuous testing pipelines",
        "role_type": "auto_eng",
        "permissions": ["read_automation_hub", "write_automation_hub", "execute_automation_hub", "manage_automation_hub", "read_test_management", "read_performance_testing", "write_performance_testing", "execute_performance_testing"],
    },
    "technical_lead": {
        "name": "Technical Lead",
        "description": "Technical reviewer — validates testing approach, environment readiness, and technical strategy",
        "role_type": "technical_lead",
        "permissions": ["read_test_management", "read_automation_hub", "read_security_testing", "read_performance_testing", "read_api_testing"],
    },
    "product_owner": {
        "name": "Product Owner",
        "description": "Business stakeholder — validates scenarios, reviews requirements coverage, and performs business sign-off",
        "role_type": "product_owner",
        "permissions": ["read_test_management", "read_automation_hub"],
    },
    "developer": {
        "name": "Developer",
        "description": "Read-only access to test artifacts, record evidence, and view dashboards",
        "role_type": "developer",
        "permissions": ["read_test_management", "read_automation_hub", "read_security_testing", "read_performance_testing"],
    },
    "viewer": {
        "name": "Viewer",
        "description": "Has view-only access to dashboards, reports, and analytics",
        "role_type": "viewer",
        "permissions": ["read_test_management", "read_automation_hub"],
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

    for role_key, role_data in DEFAULT_PROJECT_ROLES.items():
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
    Only owners and admins can access this endpoint.
    """
    # Check if user has access to this org (is owner or admin)
    from app.models.organisation import UserOrganisation
    
    # First check if user is member of this org
    membership_result = await db.execute(
        select(UserOrganisation).where(
            UserOrganisation.organisation_id == organisation_id,
            UserOrganisation.user_id == current_user.id
        )
    )
    membership = membership_result.scalar_one_or_none()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organisation not found or you don't have permission"
        )
    
    # Check role - only owner and admin can list users
    if membership.role not in ['owner', 'admin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to list organisation users"
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
    - Simplified organization roles (Owner, Admin, Member, Viewer)
    - Free subscription plan
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

    # Initialize simplified organization roles
    from app.models.organisation import DEFAULT_SYSTEM_ROLES, OrgRoleType, OrganizationRole, DEFAULT_ROLE_PERMISSIONS
    owner_role_id = None
    try:
        print(f"[create_organisation] Creating org roles for org {new_organisation.id}")
        for role_data in DEFAULT_SYSTEM_ROLES:
            role = OrganizationRole(
                id=uuid.uuid4(),
                organisation_id=new_organisation.id,
                name=role_data["name"],
                role_type=role_data["role_type"],  # Use string directly
                description=role_data.get("description", ""),
                color=role_data.get("color", "#6B7280"),
                is_system_role=True,
                is_default=role_data.get("is_default", False),
                permissions=role_data.get("permissions", {})
            )
            db.add(role)
            if role_data["role_type"] == "owner":
                owner_role_id = role.id
                print(f"[create_organisation] Owner role created with id {owner_role_id}")
        
        await db.flush()
        print(f"[create_organisation] Created {len(DEFAULT_SYSTEM_ROLES)} org roles successfully")
    except Exception as e:
        print(f"[create_organisation] ERROR creating org roles: {e}")
        import traceback
        traceback.print_exc()

    # Add owner to user_organisations table with the owner role
    from sqlalchemy import text
    try:
        print(f"[create_organisation] Adding user {current_user.id} as owner to org {new_organisation.id}")
        await db.execute(
            text(
                "INSERT INTO user_organisations (user_id, organisation_id, role, role_id, added_by, is_active, joined_at) "
                "VALUES (:user_id, :org_id, :role, :role_id, :added_by, :is_active, NOW())"
            ),
            {
                "user_id": str(current_user.id),
                "org_id": str(new_organisation.id),
                "role": "owner",
                "role_id": str(owner_role_id) if owner_role_id else None,
                "added_by": str(current_user.id),
                "is_active": True
            }
        )
        print(f"[create_organisation] User membership created successfully")
    except Exception as e:
        print(f"[create_organisation] ERROR creating user membership: {e}")
        import traceback
        traceback.print_exc()

    # Initialize free subscription for the new organization
    try:
        # Get free plan
        free_plan_result = await db.execute(
            text("SELECT id FROM subscription_plans WHERE name = 'free' LIMIT 1")
        )
        free_plan = free_plan_result.fetchone()
        if free_plan:
            await db.execute(
                text("""
                    INSERT INTO organization_subscriptions (id, organisation_id, plan_id, status, billing_cycle, created_at, updated_at)
                    VALUES (:id, :org_id, :plan_id, 'active', 'monthly', NOW(), NOW())
                """),
                {
                    "id": str(uuid.uuid4()),
                    "org_id": str(new_organisation.id),
                    "plan_id": str(free_plan[0])
                }
            )
    except Exception as e:
        # If subscription creation fails, log but don't fail org creation
        print(f"Warning: Failed to create subscription for org {new_organisation.id}: {e}")

    # Automatically initialize default project roles for the new organisation
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
    try:
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
    except Exception as e:
        print(f"[list_organisations] ERROR for user {current_user.id}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error loading organisations: {str(e)}")

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
