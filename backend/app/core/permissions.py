"""
Organization Permission Checking Utilities

Provides middleware and utilities for checking user permissions
based on their organization role and subscription plan.
"""

from typing import Optional, List
from uuid import UUID
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.user import User
from app.models.organisation import (
    Organisation,
    OrganizationRole,
    UserOrganisation,
    DEFAULT_ROLE_PERMISSIONS,
    ROLE_HIERARCHY,
)
from app.models.subscription import OrganizationSubscription
from app.api.v1.auth import get_current_user


class PermissionDenied(HTTPException):
    """Custom exception for permission denied errors"""
    def __init__(self, detail: str = "You don't have permission to perform this action"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class FeatureNotAvailable(HTTPException):
    """Custom exception for features not available in plan"""
    def __init__(self, detail: str = "This feature is not available in your current plan"):
        super().__init__(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail=detail)


async def get_user_org_membership(
    user_id: UUID,
    organisation_id: UUID,
    db: AsyncSession
) -> Optional[UserOrganisation]:
    """Get user's membership in an organization"""
    result = await db.execute(
        select(UserOrganisation)
        .options(selectinload(UserOrganisation.role_obj))
        .where(
            UserOrganisation.user_id == user_id,
            UserOrganisation.organisation_id == organisation_id,
            UserOrganisation.is_active == True
        )
    )
    return result.scalar_one_or_none()


async def get_org_subscription(
    organisation_id: UUID,
    db: AsyncSession
) -> Optional[OrganizationSubscription]:
    """Get organization's subscription with plan details"""
    result = await db.execute(
        select(OrganizationSubscription)
        .options(selectinload(OrganizationSubscription.plan))
        .where(OrganizationSubscription.organisation_id == organisation_id)
    )
    return result.scalar_one_or_none()


async def check_org_permission(
    user: User,
    organisation_id: UUID,
    permission: str,
    db: AsyncSession,
    require_feature: Optional[str] = None
) -> UserOrganisation:
    """
    Check if user has a specific permission in an organization.
    
    Args:
        user: Current user
        organisation_id: Organization ID
        permission: Permission key (e.g., 'can_manage_users')
        db: Database session
        require_feature: Optional feature to check in subscription plan
        
    Returns:
        UserOrganisation membership object if authorized
        
    Raises:
        PermissionDenied: If user doesn't have the permission
        FeatureNotAvailable: If feature not in subscription plan
    """
    # Superusers have all permissions
    if user.is_superuser:
        membership = await get_user_org_membership(user.id, organisation_id, db)
        if membership:
            return membership
        # Create a virtual membership for superuser
        class VirtualMembership:
            role = "owner"
            role_obj = None
            def has_permission(self, _): return True
        return VirtualMembership()
    
    # Get user's membership
    membership = await get_user_org_membership(user.id, organisation_id, db)
    
    if not membership:
        raise PermissionDenied("You are not a member of this organization")
    
    # Check permission
    if not membership.has_permission(permission):
        raise PermissionDenied(f"You don't have the '{permission}' permission")
    
    # Check feature if required
    if require_feature:
        subscription = await get_org_subscription(organisation_id, db)
        if not subscription or require_feature not in (subscription.plan.features or []):
            raise FeatureNotAvailable(
                f"The '{require_feature}' feature requires a higher subscription plan"
            )
    
    return membership


async def check_role_hierarchy(
    user: User,
    organisation_id: UUID,
    target_role: str,
    db: AsyncSession
) -> bool:
    """
    Check if user can manage a target role based on hierarchy.
    Owners can manage admins, admins can manage members/viewers, etc.
    
    Returns:
        True if user's role is higher in hierarchy than target role
    """
    if user.is_superuser:
        return True
    
    membership = await get_user_org_membership(user.id, organisation_id, db)
    if not membership:
        return False
    
    user_level = membership.hierarchy_level
    target_level = ROLE_HIERARCHY.get(target_role, 0)
    
    return user_level > target_level


def require_org_permission(permission: str, feature: Optional[str] = None):
    """
    Dependency factory for requiring a specific organization permission.
    
    Usage:
        @router.post("/users")
        async def create_user(
            org_id: UUID,
            membership = Depends(require_org_permission("can_manage_users")),
            db: AsyncSession = Depends(get_db)
        ):
            ...
    """
    async def dependency(
        organisation_id: UUID,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
    ) -> UserOrganisation:
        return await check_org_permission(
            current_user, organisation_id, permission, db, feature
        )
    return dependency


def require_org_member(organisation_id: UUID):
    """
    Dependency factory for requiring organization membership.
    """
    async def dependency(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
    ) -> UserOrganisation:
        membership = await get_user_org_membership(current_user.id, organisation_id, db)
        if not membership and not current_user.is_superuser:
            raise PermissionDenied("You are not a member of this organization")
        return membership
    return dependency


def require_role_level(min_role: str):
    """
    Dependency factory for requiring a minimum role level.
    
    Usage:
        @router.delete("/project/{id}")
        async def delete_project(
            org_id: UUID,
            membership = Depends(require_role_level("admin")),
        ):
            ...
    """
    min_level = ROLE_HIERARCHY.get(min_role, 0)
    
    async def dependency(
        organisation_id: UUID,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
    ) -> UserOrganisation:
        if current_user.is_superuser:
            return await get_user_org_membership(current_user.id, organisation_id, db)
        
        membership = await get_user_org_membership(current_user.id, organisation_id, db)
        if not membership:
            raise PermissionDenied("You are not a member of this organization")
        
        if membership.hierarchy_level < min_level:
            raise PermissionDenied(f"This action requires at least '{min_role}' role")
        
        return membership
    return dependency
