"""
Organization Roles API Endpoints

Provides endpoints for managing organization roles and user role assignments.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
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
    """Permission flags for a role (enterprise RBAC)"""
    # Billing & Organization
    can_manage_billing: bool = False
    can_delete_org: bool = False
    can_delete_tenant_gdpr: bool = False
    can_edit_branding: bool = False
    # User & Team Management
    can_manage_users: bool = False
    can_impersonate_user: bool = False
    can_manage_roles: bool = False
    can_manage_teams: bool = False
    # Settings & Security
    can_manage_settings: bool = False
    can_configure_sso: bool = False
    can_rotate_secrets: bool = False
    # Projects
    can_create_projects: bool = False
    can_delete_projects: bool = False
    # Audit & Compliance
    can_view_audit_logs: bool = False
    can_export_audit: bool = False
    can_delete_audit: bool = False
    can_view_invoices: bool = False
    can_export_cost_report: bool = False
    # Security Features
    can_manage_scan_profiles: bool = False
    can_triage_vuln: bool = False
    can_mark_false_positive: bool = False
    # Integrations & Marketplace
    can_manage_integrations: bool = False
    can_publish_marketplace: bool = False
    # Testing
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
    role_type: str  # owner, admin, sec_officer, auditor, svc_account, member, viewer


# ==================== Role Management Endpoints ====================

@router.get("/{organisation_id}/org-roles", response_model=List[RoleResponse])
async def list_org_roles(
    organisation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all roles for an organization"""
    try:
        # Get all roles for this organization
        result = await db.execute(
            select(OrganizationRole)
            .where(OrganizationRole.organisation_id == organisation_id)
            .order_by(OrganizationRole.role_type.desc())
        )
        roles = result.scalars().all()
        
        # Get user counts by role (both by role_id and by role string match)
        # This handles both new assignments (role_id) and legacy assignments (role string)
        user_counts = {}
        for role in roles:
            # Count users assigned via role_id
            result_by_id = await db.execute(
                select(func.count(UserOrganisation.id))
                .where(UserOrganisation.organisation_id == organisation_id)
                .where(UserOrganisation.role_id == role.id)
            )
            count_by_id = result_by_id.scalar() or 0
            
            # Count users assigned via role string (legacy/current)
            result_by_string = await db.execute(
                select(func.count(UserOrganisation.id))
                .where(UserOrganisation.organisation_id == organisation_id)
                .where(UserOrganisation.role == role.role_type)
                .where(UserOrganisation.role_id == None)  # Only count if not already linked
            )
            count_by_string = result_by_string.scalar() or 0
            
            user_counts[str(role.id)] = count_by_id + count_by_string
        
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
                user_count=user_counts.get(str(role.id), 0)
            )
            for role in roles
        ]
    except Exception as e:
        print(f"[list_org_roles] ERROR for org {organisation_id}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching org roles: {str(e)}")



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
    try:
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
        
        members = []
        for m in memberships:
            # Skip if user is not loaded (shouldn't happen, but be safe)
            if not m.user:
                print(f"[list_org_members] WARNING: Skipping membership {m.id} - no user loaded")
                continue
            
            # Get role name - fallback to role string title-cased if no role_obj
            role_name = m.role.title() if m.role else "Member"
            role_color = None
            if m.role_obj:
                role_name = m.role_obj.name
                role_color = m.role_obj.color
            
            # Handle effective_role_type - ensure it's a string
            effective_role = m.role or "member"
            if m.role_obj and m.role_obj.role_type:
                effective_role = str(m.role_obj.role_type)
            
            members.append(UserRoleAssignment(
                user_id=str(m.user_id),
                email=m.user.email,
                username=m.user.username,
                full_name=m.user.full_name,
                role=effective_role,
                role_name=role_name,
                role_color=role_color,
                joined_at=m.joined_at.isoformat() if m.joined_at else None,
                is_active=m.is_active
            ))
        
        return members
    except Exception as e:
        print(f"[list_org_members] ERROR: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching members: {str(e)}")


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
    
    # Get current user's role
    current_user_result = await db.execute(
        select(UserOrganisation)
        .where(
            UserOrganisation.user_id == current_user.id,
            UserOrganisation.organisation_id == organisation_id
        )
    )
    current_user_membership = current_user_result.scalar_one_or_none()
    current_user_role = current_user_membership.role if current_user_membership else "member"
    
    # Owners can assign any role including owner (for ownership transfer)
    # Other users can only assign roles lower than their own
    if current_user_role != "owner":
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
    """Remove a member from the organization (or self-leave)"""
    try:
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
        
        is_self = str(current_user.id) == str(user_id)
        
        # Handle owner leaving/removal
        if membership.role == "owner":
            if not is_self:
                # Cannot remove an owner (they must leave themselves)
                raise HTTPException(status_code=400, detail="Cannot remove an organization owner. They must leave themselves.")
            
            # Self-leave: Check if there are other members and if so, require another owner
            other_members_result = await db.execute(
                select(UserOrganisation)
                .where(
                    UserOrganisation.organisation_id == organisation_id,
                    UserOrganisation.user_id != user_id
                )
            )
            other_members = other_members_result.scalars().all()
            
            if len(other_members) > 0:
                # There are other members - check if any are owners
                other_owners = [m for m in other_members if m.role == "owner"]
                if not other_owners:
                    raise HTTPException(
                        status_code=400, 
                        detail="Cannot leave organization as you are the only owner and there are other members. Please promote another member to owner first."
                    )
                
                # --- Ownership Transfer Logic ---
                # Find the organization object to update the owner_id
                org_query = await db.execute(select(Organisation).where(Organisation.id == organisation_id))
                org = org_query.scalar_one_or_none()
                
                if org and org.owner_id == user_id:
                    # Transfer ownership to one of the other owners
                    new_owner = other_owners[0]
                    print(f"[remove_member] Transferring ownership of {organisation_id} from {user_id} to {new_owner.user_id}")
                    org.owner_id = new_owner.user_id
                    db.add(org)
            # If no other members, or there are other owners, allow leaving
        else:
            # Non-owner: need permission to manage users (or be self)
            if not is_self:
                await check_org_permission(current_user, organisation_id, "can_manage_users", db)
                # Check hierarchy
                if not await check_role_hierarchy(current_user, organisation_id, membership.role, db):
                    raise PermissionDenied("You cannot remove a user with equal or higher role")
        
        # Delete membership
        await db.delete(membership)
        await db.commit()

        # Invalidate caches
        try:
            from app.core.cache import invalidate_org_caches
            await invalidate_org_caches(str(organisation_id), str(user_id))
        except Exception as cache_err:
            print(f"[remove_member] WARNING: Cache invalidation failed: {cache_err}")

        # Check if any members belong to this organization now
        members_count_result = await db.execute(
            select(func.count(UserOrganisation.id))
            .where(UserOrganisation.organisation_id == organisation_id)
        )
        members_count = members_count_result.scalar()

        if members_count == 0:
            # No members left - cleanup the entire organization and its data
            org_result = await db.execute(select(Organisation).where(Organisation.id == organisation_id))
            org = org_result.scalar_one_or_none()
            if org:
                from sqlalchemy import text
                # Force delete all dependencies
                # (This matches the logic in organisations.py:delete_organisation)
                await db.execute(text("DELETE FROM group_type_access WHERE organization_id = :o_id"), {"o_id": organisation_id})
                await db.execute(text("DELETE FROM group_types WHERE organization_id = :o_id"), {"o_id": organisation_id})
                await db.execute(text("DELETE FROM organization_roles WHERE organisation_id = :o_id"), {"o_id": organisation_id})
                
                await db.delete(org)
                await db.commit()
                return {"message": "Member removed and organization deleted as it has no more members"}
        
        return {"message": "Member removed successfully"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"[remove_member] CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        # Log to a temporary file for the user/us to see
        with open("remove_member_error.log", "a") as f:
            f.write(f"\n--- {datetime.now()} ---\n")
            f.write(f"Error removing member {user_id} from org {organisation_id}: {str(e)}\n")
            traceback.print_exc(file=f)
        raise HTTPException(status_code=500, detail=f"Internal error during removal: {str(e)}")


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
