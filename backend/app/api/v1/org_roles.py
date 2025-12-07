"""
Organization Roles API Endpoints

Provides endpoints for managing organization roles and user role assignments.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.models.user import User
from app.models.organisation import (
    Organisation,
    OrganizationRole,
    UserOrganisation,
    OrgRoleType,
    DEFAULT_SYSTEM_ROLES,
    DEFAULT_ROLE_PERMISSIONS,
    ROLE_HIERARCHY,
)
from app.api.v1.auth import get_current_user
from app.core.permissions import (
    check_org_permission,
    check_role_hierarchy,
    PermissionDenied,
)

router = APIRouter()


# ==================== Schemas ====================

class RolePermissions(BaseModel):
    """Permission flags for a role"""
    can_manage_billing: bool = False
    can_delete_org: bool = False
    can_manage_users: bool = False
    can_manage_roles: bool = False
    can_manage_settings: bool = False
    can_create_projects: bool = False
    can_delete_projects: bool = False
    can_view_audit_logs: bool = False
    can_manage_integrations: bool = False
    can_execute_tests: bool = False
    can_write_tests: bool = False
    can_read_tests: bool = True


class RoleResponse(BaseModel):
    """Organization role response"""
    id: str
    name: str
    role_type: str
    description: Optional[str]
    color: Optional[str]
    is_system_role: bool
    is_default: bool
    permissions: dict
    user_count: int = 0

    class Config:
        from_attributes = True


class RoleCreateRequest(BaseModel):
    """Request to create a custom role"""
    name: str
    role_type: str = "member"
    description: Optional[str] = None
    color: Optional[str] = "#6B7280"
    permissions: Optional[dict] = None


class RoleUpdateRequest(BaseModel):
    """Request to update a role"""
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    permissions: Optional[dict] = None
    is_default: Optional[bool] = None


class UserRoleAssignment(BaseModel):
    """User's role assignment in organization"""
    user_id: str
    email: str
    username: str
    full_name: Optional[str]
    role: str
    role_name: str
    role_color: Optional[str]
    joined_at: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True


class AssignRoleRequest(BaseModel):
    """Request to assign a role to a user"""
    user_id: str
    role_type: str  # owner, admin, member, viewer


# ==================== Role Management Endpoints ====================

@router.get("/{organisation_id}/org-roles", response_model=List[RoleResponse])
async def list_org_roles(
    organisation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all roles for an organization"""
    # Get roles with user count
    result = await db.execute(
        select(OrganizationRole)
        .options(selectinload(OrganizationRole.user_assignments))
        .where(OrganizationRole.organisation_id == organisation_id)
        .order_by(OrganizationRole.role_type.desc())
    )
    roles = result.scalars().all()
    
    return [
        RoleResponse(
            id=str(role.id),
            name=role.name,
            role_type=role.role_type,
            description=role.description,
            color=role.color,
            is_system_role=role.is_system_role,
            is_default=role.is_default,
            permissions=role.permissions or {},
            user_count=len(role.user_assignments)
        )
        for role in roles
    ]


@router.post("/{organisation_id}/org-roles", response_model=RoleResponse)
async def create_org_role(
    organisation_id: UUID,
    request: RoleCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a custom role (Pro+ plans only)"""
    # Check permission
    await check_org_permission(
        current_user, organisation_id, "can_manage_roles", db,
        require_feature="custom_roles"
    )
    
    # Create role with provided or default permissions
    permissions = request.permissions or DEFAULT_ROLE_PERMISSIONS.get(request.role_type, {})
    
    new_role = OrganizationRole(
        organisation_id=organisation_id,
        name=request.name,
        role_type=request.role_type,
        description=request.description,
        color=request.color,
        is_system_role=False,
        permissions=permissions
    )
    
    db.add(new_role)
    await db.commit()
    await db.refresh(new_role)
    
    return RoleResponse(
        id=str(new_role.id),
        name=new_role.name,
        role_type=new_role.role_type,
        description=new_role.description,
        color=new_role.color,
        is_system_role=new_role.is_system_role,
        is_default=new_role.is_default,
        permissions=new_role.permissions or {},
        user_count=0
    )


@router.put("/{organisation_id}/org-roles/{role_id}", response_model=RoleResponse)
async def update_org_role(
    organisation_id: UUID,
    role_id: UUID,
    request: RoleUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a role (cannot update system roles' permissions)"""
    await check_org_permission(current_user, organisation_id, "can_manage_roles", db)
    
    result = await db.execute(
        select(OrganizationRole)
        .options(selectinload(OrganizationRole.user_assignments))
        .where(
            OrganizationRole.id == role_id,
            OrganizationRole.organisation_id == organisation_id
        )
    )
    role = result.scalar_one_or_none()
    
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Update fields
    if request.name:
        role.name = request.name
    if request.description is not None:
        role.description = request.description
    if request.color:
        role.color = request.color
    if request.is_default is not None:
        # If setting as default, unset other defaults
        if request.is_default:
            await db.execute(
                select(OrganizationRole)
                .where(
                    OrganizationRole.organisation_id == organisation_id,
                    OrganizationRole.is_default == True
                )
            )
            # Unset all defaults first
            for r in (await db.execute(
                select(OrganizationRole).where(
                    OrganizationRole.organisation_id == organisation_id
                )
            )).scalars().all():
                r.is_default = False
        role.is_default = request.is_default
    
    # Only update permissions for non-system roles
    if request.permissions and not role.is_system_role:
        role.permissions = request.permissions
    
    await db.commit()
    await db.refresh(role)
    
    return RoleResponse(
        id=str(role.id),
        name=role.name,
        role_type=role.role_type,
        description=role.description,
        color=role.color,
        is_system_role=role.is_system_role,
        is_default=role.is_default,
        permissions=role.permissions or {},
        user_count=len(role.user_assignments)
    )


@router.delete("/{organisation_id}/org-roles/{role_id}")
async def delete_org_role(
    organisation_id: UUID,
    role_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a custom role (cannot delete system roles)"""
    await check_org_permission(current_user, organisation_id, "can_manage_roles", db)
    
    result = await db.execute(
        select(OrganizationRole)
        .options(selectinload(OrganizationRole.user_assignments))
        .where(
            OrganizationRole.id == role_id,
            OrganizationRole.organisation_id == organisation_id
        )
    )
    role = result.scalar_one_or_none()
    
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    if role.is_system_role:
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete system roles"
        )
    
    if len(role.user_assignments) > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete role with {len(role.user_assignments)} assigned users"
        )
    
    await db.delete(role)
    await db.commit()
    
    return {"message": "Role deleted successfully"}


# ==================== User Role Assignment Endpoints ====================

@router.get("/{organisation_id}/members", response_model=List[UserRoleAssignment])
async def list_org_members(
    organisation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all members of an organization with their roles"""
    result = await db.execute(
        select(UserOrganisation)
        .options(
            selectinload(UserOrganisation.user),
            selectinload(UserOrganisation.role_obj)
        )
        .where(UserOrganisation.organisation_id == organisation_id)
        .order_by(UserOrganisation.joined_at)
    )
    memberships = result.scalars().all()
    
    return [
        UserRoleAssignment(
            user_id=str(m.user_id),
            email=m.user.email,
            username=m.user.username,
            full_name=m.user.full_name,
            role=m.effective_role_type,
            role_name=m.role_obj.name if m.role_obj else m.role.title(),
            role_color=m.role_obj.color if m.role_obj else None,
            joined_at=m.joined_at.isoformat() if m.joined_at else None,
            is_active=m.is_active
        )
        for m in memberships
    ]


@router.put("/{organisation_id}/members/{user_id}/role")
async def assign_member_role(
    organisation_id: UUID,
    user_id: UUID,
    request: AssignRoleRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Change a member's role"""
    await check_org_permission(current_user, organisation_id, "can_manage_users", db)
    
    # Check hierarchy - can only assign roles lower than your own
    if not await check_role_hierarchy(current_user, organisation_id, request.role_type, db):
        raise PermissionDenied("You cannot assign a role equal to or higher than your own")
    
    # Get membership
    result = await db.execute(
        select(UserOrganisation)
        .where(
            UserOrganisation.user_id == user_id,
            UserOrganisation.organisation_id == organisation_id
        )
    )
    membership = result.scalar_one_or_none()
    
    if not membership:
        raise HTTPException(status_code=404, detail="User is not a member of this organization")
    
    # Prevent demoting owner if they're the only owner
    if membership.role == "owner" and request.role_type != "owner":
        owner_count = await db.execute(
            select(UserOrganisation)
            .where(
                UserOrganisation.organisation_id == organisation_id,
                UserOrganisation.role == "owner"
            )
        )
        if len(owner_count.scalars().all()) <= 1:
            raise HTTPException(
                status_code=400,
                detail="Cannot demote the only owner. Transfer ownership first."
            )
    
    # Update role
    membership.role = request.role_type
    
    # Find matching system role
    role_result = await db.execute(
        select(OrganizationRole)
        .where(
            OrganizationRole.organisation_id == organisation_id,
            OrganizationRole.role_type == request.role_type,
            OrganizationRole.is_system_role == True
        )
    )
    system_role = role_result.scalar_one_or_none()
    if system_role:
        membership.role_id = system_role.id
    
    await db.commit()
    
    return {"message": f"User role updated to {request.role_type}"}


@router.delete("/{organisation_id}/members/{user_id}")
async def remove_member(
    organisation_id: UUID,
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Remove a member from the organization"""
    await check_org_permission(current_user, organisation_id, "can_manage_users", db)
    
    # Get membership
    result = await db.execute(
        select(UserOrganisation)
        .where(
            UserOrganisation.user_id == user_id,
            UserOrganisation.organisation_id == organisation_id
        )
    )
    membership = result.scalar_one_or_none()
    
    if not membership:
        raise HTTPException(status_code=404, detail="User is not a member")
    
    # Cannot remove owner
    if membership.role == "owner":
        raise HTTPException(status_code=400, detail="Cannot remove organization owner")
    
    # Check hierarchy
    if not await check_role_hierarchy(current_user, organisation_id, membership.role, db):
        raise PermissionDenied("You cannot remove a user with equal or higher role")
    
    await db.delete(membership)
    await db.commit()
    
    return {"message": "Member removed successfully"}


# ==================== Role Initialization ====================

@router.post("/{organisation_id}/initialize-roles")
async def initialize_org_roles(
    organisation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Initialize default system roles for an organization"""
    # Check if roles already exist
    existing = await db.execute(
        select(OrganizationRole)
        .where(OrganizationRole.organisation_id == organisation_id)
    )
    if existing.scalars().first():
        raise HTTPException(
            status_code=400,
            detail="Roles already initialized for this organization"
        )
    
    # Create system roles
    created_roles = []
    for role_data in DEFAULT_SYSTEM_ROLES:
        role = OrganizationRole(
            organisation_id=organisation_id,
            **role_data
        )
        db.add(role)
        created_roles.append(role)
    
    await db.commit()
    
    return {
        "message": f"Created {len(created_roles)} system roles",
        "roles": [r.name for r in created_roles]
    }
