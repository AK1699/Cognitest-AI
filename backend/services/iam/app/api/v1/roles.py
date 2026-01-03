from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from sqlalchemy.orm import selectinload
from typing import List
from uuid import UUID
import uuid

from ...core.deps import get_db, get_current_user
from ...models.user import User
from ...models.role import (
    ProjectRole,
    Permission,
    UserProjectRole,
    GroupProjectRole,
    role_permissions,
)
from ...models.group import Group, user_groups
from ...models.project import Project
from ...schemas.role import (
    ProjectRoleCreate,
    ProjectRoleUpdate,
    ProjectRole as ProjectRoleSchema,
    ProjectRoleWithPermissions,
    ProjectRoleList,
    Permission as PermissionSchema,
    PermissionList,
    PermissionCreate,
    UserProjectRoleCreate,
    UserProjectRole as UserProjectRoleSchema,
    UserProjectRoleWithDetails,
    UserProjectRoleList,
    GroupProjectRoleCreate,
    GroupProjectRole as GroupProjectRoleSchema,
    GroupProjectRoleWithDetails,
    GroupProjectRoleList,
    PermissionCheckRequest,
    PermissionCheckResponse,
    UserPermissionsResponse,
    InitializeRolesRequest,
    InitializeRolesResponse,
)

router = APIRouter()

# Default roles configuration - Enterprise Project Roles (based on role-based.md)
# Maps to ProjectRoleType enum: project_admin, qa_lead, tester, auto_eng, dev_ro, viewer
DEFAULT_ROLES = {
    "project_admin": {
        "name": "Project Admin",
        "role_type": "project_admin",
        "description": "Full project control — can manage billing, delete the project, assign roles, and configure settings",
        "permissions": ["all"],  # Gets all permissions
        "color": "#DC2626",  # Red
    },
    "qa_lead": {
        "name": "QA Lead",
        "role_type": "qa_lead",
        "description": "Test strategy owner — designs test plans, manages QA assignments, and reviews technical execution",
        "permissions": [
            "create_test_artifact", "read_test_artifact", "update_test_artifact", "delete_test_artifact",
            "create_test_cycle", "read_requirement", "link_requirement",
            "read_automation_flow", "execute_automation_flow", "execute_flow_dev", "execute_flow_staging",
            "execute_manual_test", "record_evidence",
            "comment_finding", "export_sarif_non_pii",
            "read_dashboard", "read_project",
            "approve_test_artifact", # Authority to approve plans
        ],
        "color": "#1E40AF",  # Blue
    },
    "qa_engineer": {
        "name": "QA Engineer",
        "role_type": "qa_engineer",
        "description": "Creates and executes tests, records evidence, runs automation flows",
        "permissions": [
            # Test Artifacts
            "create_test_artifact", "read_test_artifact", "update_test_artifact", "delete_test_artifact",
            "create_test_cycle",  # Can create test cycles
            "read_requirement",  # Read-only requirement linking
            # Automation
            "read_automation_flow", "execute_automation_flow",  # Read + Execute only
            "execute_flow_dev", "execute_flow_staging",
            # Execution
            "execute_manual_test", "record_evidence",
            # Security
            "comment_finding",  # Can only comment on findings
            "export_sarif_non_pii",  # Non-PII exports only
            # Dashboards
            "read_dashboard",
            "read_project",
        ],
        "color": "#059669",  # Green
    },
    "auto_eng": {
        "name": "Automation Engineer",
        "role_type": "auto_eng",
        "description": "Manages automation flows, k6 scripts, accepts self-healing suggestions",
        "permissions": [
            # Test Artifacts - Update only
            "update_test_artifact", "read_test_artifact",
            "link_requirement",
            # Automation - Full control
            "create_automation_flow", "read_automation_flow", "update_automation_flow", "delete_automation_flow",
            "execute_flow_dev", "execute_flow_staging", "execute_flow_prod", "accept_self_heal",
            # Execution
            "execute_manual_test", "record_evidence",
            # Security
            "update_finding", "export_sarif",
            # Performance
            "create_k6_script", "read_k6_script", "update_k6_script", "delete_k6_script",
            "execute_load_10k", "execute_load_100k",
            # Dashboards
            "read_dashboard", "create_dashboard",
            "read_project",
        ],
        "color": "#7C3AED",  # Purple
    },
    "technical_lead": {
        "name": "Technical Lead",
        "role_type": "technical_lead",
        "description": "Technical reviewer — validates testing approach, environment readiness, and technical strategy",
        "permissions": [
            "read_test_artifact", "read_requirement", "link_requirement",
            "read_automation_flow", "read_execution", "record_evidence",
            "read_finding", "export_sarif",
            "read_k6_script", "read_dashboard", "read_project",
            "approve_test_artifact", # Authority for technical review
        ],
        "color": "#92400E",  # Amber/Ochre
    },
    "product_owner": {
        "name": "Product Owner",
        "role_type": "product_owner",
        "description": "Business stakeholder — validates scenarios, reviews requirements coverage, and performs business sign-off",
        "permissions": [
            "read_test_artifact", "read_requirement",
            "read_execution", "read_dashboard", "read_project",
            "approve_test_artifact", # Authority for business sign-off
        ],
        "color": "#DB2777",  # Pink
    },
    "developer": {
        "name": "Developer",
        "role_type": "developer",
        "description": "Read-only access to test artifacts, can record evidence and view dashboards",
        "permissions": [
            # Test Artifacts - Read only
            "read_test_artifact",
            "link_requirement",
            # Automation - Read only
            "read_automation_flow",
            # Execution - Read only
            "read_execution",
            "record_evidence",  # Can record evidence
            # Security - Read only
            "read_finding",
            "export_sarif",
            # Performance - Read only
            "read_k6_script",
            # Dashboards - Read only
            "read_dashboard",
            "read_project",
        ],
        "color": "#0891B2",  # Cyan
    },
    "viewer": {
        "name": "Viewer",
        "role_type": "viewer",
        "description": "Read-only access to view tests, results, and dashboards",
        "permissions": [
            # Test Artifacts - Read only
            "read_test_artifact",
            # Automation - Read only
            "read_automation_flow",
            # Security - Read only
            "read_finding",
            "export_sarif",
            # Performance - Read only
            "read_k6_script",
            # Dashboards - Read only
            "read_dashboard",
            "read_project",
        ],
        "color": "#6B7280",  # Gray
    },
}

# Role hierarchy for project roles (higher number = more privilege)
PROJECT_ROLE_HIERARCHY = {
    "project_admin": 100,
    "qa_lead": 90,
    "technical_lead": 85,
    "auto_eng": 80,
    "qa_engineer": 70,
    "product_owner": 60,
    "developer": 40,
    "viewer": 10,
}

# Mapping from legacy roles to new enterprise roles
LEGACY_ROLE_MAPPING = {
    "owner": "project_admin",
    "admin": "project_admin",
    "qa_manager": "qa_lead",
    "qa_lead": "qa_lead",
    "qa_engineer": "qa_engineer",
    "tester": "qa_engineer",
    "product_owner": "product_owner",
    "dev_ro": "developer",
    "viewer": "viewer",
}


# ==================== Permission Endpoints ====================

@router.get("/permissions", response_model=PermissionList)
async def list_permissions(
    skip: int = 0,
    limit: int = 100,
    resource: str = None,
    action: str = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List all available permissions.

    - **resource**: Filter by resource type (optional)
    - **action**: Filter by action type (optional)
    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum number of records to return
    """
    query = select(Permission)

    if resource:
        query = query.where(Permission.resource == resource)
    if action:
        query = query.where(Permission.action == action)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Get permissions with pagination
    query = query.offset(skip).limit(limit).order_by(Permission.resource, Permission.action)
    result = await db.execute(query)
    permissions = result.scalars().all()

    return PermissionList(permissions=permissions, total=total)


@router.post("/permissions", response_model=PermissionSchema, status_code=status.HTTP_201_CREATED)
async def create_permission(
    permission_data: PermissionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new custom permission.

    - **name**: Permission name (required, must be unique)
    - **resource**: Resource type (required)
    - **action**: Action type (required)
    - **description**: Permission description (optional)
    """
    # Check if permission already exists
    result = await db.execute(
        select(Permission).where(Permission.name == permission_data.name)
    )
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Permission '{permission_data.name}' already exists"
        )

    # Create new permission
    new_permission = Permission(
        name=permission_data.name,
        resource=permission_data.resource,
        action=permission_data.action,
        description=permission_data.description,
        is_system_permission=permission_data.is_system_permission
    )

    db.add(new_permission)
    await db.commit()
    await db.refresh(new_permission)

    return new_permission


# ==================== Project Role Endpoints ====================

@router.post("/initialize", response_model=InitializeRolesResponse)
async def initialize_default_roles(
    request: InitializeRolesRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Initialize default roles for an organisation.

    This creates the 5 predefined roles (Administrator, Project Manager, Developer, Tester, Viewer)
    with their associated permissions.

    - **organisation_id**: Organisation ID (required)
    """
    created_roles = []
    roles_count = 0

    # Get all permissions
    all_permissions_result = await db.execute(select(Permission))
    all_permissions = all_permissions_result.scalars().all()
    permissions_map = {p.name: p for p in all_permissions}

    for role_key, role_data in DEFAULT_ROLES.items():
        # Check if role already exists
        result = await db.execute(
            select(ProjectRole).where(
                ProjectRole.organisation_id == request.organisation_id,
                ProjectRole.role_type == role_data["role_type"]
            )
        )
        existing_role = result.scalar_one_or_none()

        if existing_role:
            continue  # Skip if role already exists

        # Create role
        role = ProjectRole(
            id=uuid.uuid4(),
            organisation_id=request.organisation_id,
            name=role_data["name"],
            role_type=role_data["role_type"],
            description=role_data["description"],
            is_system_role=True,
            is_active=True,
            created_by=current_user.email
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
                        assigned_by=current_user.email
                    )
                )

        created_roles.append(role)
        roles_count += 1

    await db.commit()

    # Refresh roles to get relationships
    for role in created_roles:
        await db.refresh(role)

    return InitializeRolesResponse(
        success=True,
        roles_created=roles_count,
        message=f"Successfully initialized {roles_count} default roles",
        roles=created_roles
    )


@router.post("/", response_model=ProjectRoleWithPermissions, status_code=status.HTTP_201_CREATED)
async def create_role(
    role_data: ProjectRoleCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new custom project role.

    - **name**: Role display name (required)
    - **role_type**: Role type (required)
    - **description**: Role description (optional)
    - **organisation_id**: Organisation ID (required)
    - **permission_ids**: List of permission IDs to assign (optional)
    """
    # Create new role
    new_role = ProjectRole(
        name=role_data.name,
        role_type=role_data.role_type,
        description=role_data.description,
        organisation_id=role_data.organisation_id,
        is_system_role=False,
        is_active=True,
        meta_data={},
        created_by=current_user.email
    )

    db.add(new_role)
    await db.flush()

    # Assign permissions if provided
    if role_data.permission_ids:
        for perm_id in role_data.permission_ids:
            # Verify permission exists
            perm_result = await db.execute(
                select(Permission).where(Permission.id == perm_id)
            )
            permission = perm_result.scalar_one_or_none()

            if not permission:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Permission with id {perm_id} not found"
                )

            await db.execute(
                role_permissions.insert().values(
                    id=uuid.uuid4(),
                    role_id=new_role.id,
                    permission_id=perm_id,
                    assigned_by=current_user.email
                )
            )

    await db.commit()

    # Fetch role with permissions
    return await get_role(new_role.id, current_user, db)


@router.get("/", response_model=ProjectRoleList)
async def list_roles(
    organisation_id: UUID,
    skip: int = 0,
    limit: int = 100,
    is_active: bool = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List all roles for an organisation.

    - **organisation_id**: Filter by organisation (required)
    - **is_active**: Filter by active status (optional)
    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum number of records to return
    """
    query = select(ProjectRole).where(ProjectRole.organisation_id == organisation_id)

    if is_active is not None:
        query = query.where(ProjectRole.is_active == is_active)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Get roles with permissions
    query = query.options(selectinload(ProjectRole.permissions)).offset(skip).limit(limit).order_by(ProjectRole.created_at.desc())
    result = await db.execute(query)
    roles = result.scalars().all()

    # Format response with permissions
    roles_with_perms = []
    for role in roles:
        # Exclude SQLAlchemy internal fields
        role_dict = {
            k: v for k, v in role.__dict__.items() 
            if not k.startswith('_')
        }
        role_dict["permissions"] = role.permissions
        role_dict["permission_count"] = len(role.permissions)
        roles_with_perms.append(ProjectRoleWithPermissions(**role_dict))

    return ProjectRoleList(roles=roles_with_perms, total=total)


@router.get("/{role_id}", response_model=ProjectRoleWithPermissions)
async def get_role(
    role_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific role by ID with permissions.
    """
    query = select(ProjectRole).where(ProjectRole.id == role_id).options(selectinload(ProjectRole.permissions))
    result = await db.execute(query)
    role = result.scalar_one_or_none()

    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role with id {role_id} not found"
        )

    # Exclude SQLAlchemy internal fields
    role_dict = {
        k: v for k, v in role.__dict__.items() 
        if not k.startswith('_')
    }
    role_dict["permissions"] = role.permissions
    role_dict["permission_count"] = len(role.permissions)

    return ProjectRoleWithPermissions(**role_dict)


@router.put("/{role_id}", response_model=ProjectRoleWithPermissions)
async def update_role(
    role_id: UUID,
    role_data: ProjectRoleUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a role.

    - **name**: New role name (optional)
    - **description**: New description (optional)
    - **is_active**: New active status (optional)
    - **permission_ids**: New list of permission IDs (replaces existing) (optional)
    """
    # Get existing role
    result = await db.execute(select(ProjectRole).where(ProjectRole.id == role_id))
    role = result.scalar_one_or_none()

    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role with id {role_id} not found"
        )

    # Check if it's a system role
    if role.is_system_role and role_data.permission_ids is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify permissions of system roles"
        )

    # Update fields
    update_data = role_data.model_dump(exclude_unset=True, exclude={"permission_ids"})
    for field, value in update_data.items():
        setattr(role, field, value)

    # Update permissions if provided
    if role_data.permission_ids is not None:
        # Remove existing permissions
        await db.execute(
            delete(role_permissions).where(role_permissions.c.role_id == role_id)
        )

        # Add new permissions
        for perm_id in role_data.permission_ids:
            await db.execute(
                role_permissions.insert().values(
                    id=uuid.uuid4(),
                    role_id=role_id,
                    permission_id=perm_id,
                    assigned_by=current_user.email
                )
            )

    await db.commit()

    # Return updated role with permissions
    return await get_role(role_id, current_user, db)


@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_role(
    role_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a role.

    System roles cannot be deleted.
    """
    # Get existing role
    result = await db.execute(select(ProjectRole).where(ProjectRole.id == role_id))
    role = result.scalar_one_or_none()

    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role with id {role_id} not found"
        )

    # Check if it's a system role
    if role.is_system_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete system roles"
        )

    # Delete role
    await db.delete(role)
    await db.commit()

    return None


# ==================== User Project Role Assignment Endpoints ====================

@router.post("/assignments/users", response_model=UserProjectRoleSchema, status_code=status.HTTP_201_CREATED)
async def assign_role_to_user(
    assignment: UserProjectRoleCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Assign a role to a user for a specific project.

    - **user_id**: User ID (required)
    - **project_id**: Project ID (required)
    - **role_id**: Role ID (required)
    - **expires_at**: Expiration date (optional)
    """
    # Verify user exists
    user_result = await db.execute(select(User).where(User.id == assignment.user_id))
    if not user_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {assignment.user_id} not found"
        )

    # Verify project exists
    project_result = await db.execute(select(Project).where(Project.id == assignment.project_id))
    if not project_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with id {assignment.project_id} not found"
        )

    # Verify role exists
    role_result = await db.execute(select(ProjectRole).where(ProjectRole.id == assignment.role_id))
    if not role_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role with id {assignment.role_id} not found"
        )

    # Check if user already has a role for this project
    existing_result = await db.execute(
        select(UserProjectRole).where(
            UserProjectRole.user_id == assignment.user_id,
            UserProjectRole.project_id == assignment.project_id
        )
    )
    existing = existing_result.scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already has a role for this project. Use update endpoint to change it."
        )

    # Create assignment
    new_assignment = UserProjectRole(
        user_id=assignment.user_id,
        project_id=assignment.project_id,
        role_id=assignment.role_id,
        assigned_by=current_user.email,
        expires_at=assignment.expires_at
    )

    db.add(new_assignment)
    await db.commit()
    await db.refresh(new_assignment)

    return new_assignment


@router.get("/assignments/users", response_model=UserProjectRoleList)
async def list_user_role_assignments(
    project_id: UUID = None,
    user_id: UUID = None,
    role_id: UUID = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List user role assignments.

    - **project_id**: Filter by project (optional)
    - **user_id**: Filter by user (optional)
    - **role_id**: Filter by role (optional)
    """
    query = select(UserProjectRole, ProjectRole, User).join(
        ProjectRole, UserProjectRole.role_id == ProjectRole.id
    ).join(
        User, UserProjectRole.user_id == User.id
    )

    if project_id:
        query = query.where(UserProjectRole.project_id == project_id)
    if user_id:
        query = query.where(UserProjectRole.user_id == user_id)
    if role_id:
        query = query.where(UserProjectRole.role_id == role_id)

    # Get total count
    count_query = select(func.count()).select_from(UserProjectRole)
    if project_id:
        count_query = count_query.where(UserProjectRole.project_id == project_id)
    if user_id:
        count_query = count_query.where(UserProjectRole.user_id == user_id)
    if role_id:
        count_query = count_query.where(UserProjectRole.role_id == role_id)

    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Get assignments
    query = query.offset(skip).limit(limit).order_by(UserProjectRole.assigned_at.desc())
    result = await db.execute(query)
    data = result.all()

    # Format response
    assignments = []
    for assignment, role, user in data:
        assignments.append(UserProjectRoleWithDetails(
            id=assignment.id,
            user_id=assignment.user_id,
            project_id=assignment.project_id,
            role_id=assignment.role_id,
            assigned_at=assignment.assigned_at,
            assigned_by=assignment.assigned_by,
            expires_at=assignment.expires_at,
            role_name=role.name,
            role_type=role.role_type,
            user_email=user.email,
            user_name=user.full_name
        ))

    return UserProjectRoleList(assignments=assignments, total=total)


@router.delete("/assignments/users/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_user_role_assignment(
    assignment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Remove a user's role assignment from a project.
    """
    result = await db.execute(select(UserProjectRole).where(UserProjectRole.id == assignment_id))
    assignment = result.scalar_one_or_none()

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assignment with id {assignment_id} not found"
        )

    await db.delete(assignment)
    await db.commit()

    return None


# ==================== Group Project Role Assignment Endpoints ====================

@router.post("/assignments/groups", response_model=GroupProjectRoleSchema, status_code=status.HTTP_201_CREATED)
async def assign_role_to_group(
    assignment: GroupProjectRoleCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Assign a role to a group for a specific project.

    All users in the group will inherit this role for the project.

    - **group_id**: Group ID (required)
    - **project_id**: Project ID (required)
    - **role_id**: Role ID (required)
    - **expires_at**: Expiration date (optional)
    """
    # Verify group exists
    group_result = await db.execute(select(Group).where(Group.id == assignment.group_id))
    if not group_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Group with id {assignment.group_id} not found"
        )

    # Verify project exists
    project_result = await db.execute(select(Project).where(Project.id == assignment.project_id))
    if not project_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with id {assignment.project_id} not found"
        )

    # Verify role exists
    role_result = await db.execute(select(ProjectRole).where(ProjectRole.id == assignment.role_id))
    if not role_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role with id {assignment.role_id} not found"
        )

    # Check if group already has a role for this project
    existing_result = await db.execute(
        select(GroupProjectRole).where(
            GroupProjectRole.group_id == assignment.group_id,
            GroupProjectRole.project_id == assignment.project_id
        )
    )
    existing = existing_result.scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Group already has a role for this project. Use update endpoint to change it."
        )

    # Create assignment
    new_assignment = GroupProjectRole(
        group_id=assignment.group_id,
        project_id=assignment.project_id,
        role_id=assignment.role_id,
        assigned_by=current_user.email,
        expires_at=assignment.expires_at
    )

    db.add(new_assignment)
    await db.commit()
    await db.refresh(new_assignment)

    return new_assignment


@router.get("/assignments/groups", response_model=GroupProjectRoleList)
async def list_group_role_assignments(
    project_id: UUID = None,
    group_id: UUID = None,
    role_id: UUID = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List group role assignments.

    - **project_id**: Filter by project (optional)
    - **group_id**: Filter by group (optional)
    - **role_id**: Filter by role (optional)
    """
    query = select(GroupProjectRole, ProjectRole, Group).join(
        ProjectRole, GroupProjectRole.role_id == ProjectRole.id
    ).join(
        Group, GroupProjectRole.group_id == Group.id
    )

    if project_id:
        query = query.where(GroupProjectRole.project_id == project_id)
    if group_id:
        query = query.where(GroupProjectRole.group_id == group_id)
    if role_id:
        query = query.where(GroupProjectRole.role_id == role_id)

    # Get total count
    count_query = select(func.count()).select_from(GroupProjectRole)
    if project_id:
        count_query = count_query.where(GroupProjectRole.project_id == project_id)
    if group_id:
        count_query = count_query.where(GroupProjectRole.group_id == group_id)
    if role_id:
        count_query = count_query.where(GroupProjectRole.role_id == role_id)

    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Get assignments
    query = query.offset(skip).limit(limit).order_by(GroupProjectRole.assigned_at.desc())
    result = await db.execute(query)
    data = result.all()

    # Format response
    assignments = []
    for assignment, role, group in data:
        assignments.append(GroupProjectRoleWithDetails(
            id=assignment.id,
            group_id=assignment.group_id,
            project_id=assignment.project_id,
            role_id=assignment.role_id,
            assigned_at=assignment.assigned_at,
            assigned_by=assignment.assigned_by,
            expires_at=assignment.expires_at,
            role_name=role.name,
            role_type=role.role_type,
            group_name=group.name
        ))

    return GroupProjectRoleList(assignments=assignments, total=total)


@router.delete("/assignments/groups/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_group_role_assignment(
    assignment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Remove a group's role assignment from a project.
    """
    result = await db.execute(select(GroupProjectRole).where(GroupProjectRole.id == assignment_id))
    assignment = result.scalar_one_or_none()

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assignment with id {assignment_id} not found"
        )

    await db.delete(assignment)
    await db.commit()

    return None


# ==================== Permission Checking Endpoints ====================

@router.post("/check-permission", response_model=PermissionCheckResponse)
async def check_user_permission(
    request: PermissionCheckRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Check if a user has a specific permission for a project.

    Checks both direct user role assignments and group role assignments.

    - **user_id**: User ID (required)
    - **project_id**: Project ID (required)
    - **permission_name**: Permission name to check (required)
    """
    # Get user's direct roles for the project
    user_roles_result = await db.execute(
        select(ProjectRole, UserProjectRole)
        .join(UserProjectRole, ProjectRole.id == UserProjectRole.role_id)
        .where(UserProjectRole.user_id == request.user_id)
        .where(UserProjectRole.project_id == request.project_id)
        .options(selectinload(ProjectRole.permissions))
    )
    user_roles = user_roles_result.all()

    # Check direct role permissions
    for role, assignment in user_roles:
        for perm in role.permissions:
            if perm.name == request.permission_name:
                return PermissionCheckResponse(
                    has_permission=True,
                    reason=f"via direct role '{role.name}'"
                )

    # Get user's group roles for the project
    group_roles_result = await db.execute(
        select(ProjectRole, GroupProjectRole, Group)
        .join(GroupProjectRole, ProjectRole.id == GroupProjectRole.role_id)
        .join(Group, GroupProjectRole.group_id == Group.id)
        .join(user_groups, Group.id == user_groups.c.group_id)
        .where(user_groups.c.user_id == request.user_id)
        .where(GroupProjectRole.project_id == request.project_id)
        .options(selectinload(ProjectRole.permissions))
    )
    group_roles = group_roles_result.all()

    # Check group role permissions
    for role, assignment, group in group_roles:
        for perm in role.permissions:
            if perm.name == request.permission_name:
                return PermissionCheckResponse(
                    has_permission=True,
                    reason=f"via group '{group.name}' with role '{role.name}'"
                )

    return PermissionCheckResponse(
        has_permission=False,
        reason="User does not have this permission for the project"
    )


@router.get("/user-permissions/{user_id}/project/{project_id}", response_model=UserPermissionsResponse)
async def get_user_permissions_for_project(
    user_id: UUID,
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all permissions a user has for a specific project.

    Includes permissions from both direct role assignments and group role assignments.
    """
    all_permissions = []
    all_roles = []
    permission_ids = set()

    # Get user's direct roles for the project
    user_roles_result = await db.execute(
        select(ProjectRole)
        .join(UserProjectRole, ProjectRole.id == UserProjectRole.role_id)
        .where(UserProjectRole.user_id == user_id)
        .where(UserProjectRole.project_id == project_id)
        .options(selectinload(ProjectRole.permissions))
    )
    user_roles = user_roles_result.scalars().all()

    for role in user_roles:
        all_roles.append(role)
        for perm in role.permissions:
            if perm.id not in permission_ids:
                all_permissions.append(perm)
                permission_ids.add(perm.id)

    # Get user's group roles for the project
    group_roles_result = await db.execute(
        select(ProjectRole)
        .join(GroupProjectRole, ProjectRole.id == GroupProjectRole.role_id)
        .join(Group, GroupProjectRole.group_id == Group.id)
        .join(user_groups, Group.id == user_groups.c.group_id)
        .where(user_groups.c.user_id == user_id)
        .where(GroupProjectRole.project_id == project_id)
        .options(selectinload(ProjectRole.permissions))
    )
    group_roles = group_roles_result.scalars().all()

    for role in group_roles:
        all_roles.append(role)
        for perm in role.permissions:
            if perm.id not in permission_ids:
                all_permissions.append(perm)
                permission_ids.add(perm.id)

    return UserPermissionsResponse(
        user_id=user_id,
        project_id=project_id,
        permissions=all_permissions,
        roles=all_roles
    )


@router.get("/dynamic/{organisation_id}", response_model=dict)
async def get_dynamic_permissions(
    organisation_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get dynamic permission groups based on enabled modules in the organization.

    Returns permission groups with static permissions + dynamic permissions
    for enabled testing modules, INCLUDING permission IDs from database.
    """
    from ...utils.dynamic_permissions import (
        generate_dynamic_permission_groups,
        get_all_permissions_list_async,
        get_enabled_modules_from_organisation,
    )
    from ...models.organisation import Organisation

    # Get the organization with its settings
    org_result = await db.execute(
        select(Organisation).where(Organisation.id == organisation_id)
    )
    organisation = org_result.scalar_one_or_none()

    if not organisation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Organization with id {organisation_id} not found"
        )

    # Extract enabled modules from organization settings
    enabled_modules = list(get_enabled_modules_from_organisation(organisation))

    # Generate dynamic permission groups
    permission_groups = generate_dynamic_permission_groups(enabled_modules)

    # Get all permission details WITH IDs from database
    all_permissions = await get_all_permissions_list_async(enabled_modules, db)

    return {
        "permission_groups": permission_groups,
        "all_permissions": all_permissions,
        "enabled_modules": enabled_modules,
    }
