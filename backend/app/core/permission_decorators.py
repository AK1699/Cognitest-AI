"""
Permission Check Decorator and Middleware

Provides decorators for FastAPI routes that enforce permission checks
based on user roles and subscription plans.
"""

from functools import wraps
from typing import Optional, List, Callable
from uuid import UUID
from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.api.v1.auth import get_current_user
from app.core.permissions import (
    check_org_permission,
    get_user_org_membership,
    get_org_subscription,
    PermissionDenied,
    FeatureNotAvailable,
)


def require_permission(permission: str, feature: Optional[str] = None):
    """
    Decorator for FastAPI route handlers that enforces permission checks.
    
    Args:
        permission: Permission key to check (e.g., 'can_manage_users')
        feature: Optional feature to check in subscription plan
        
    Usage:
        @router.post("/users")
        @require_permission("can_manage_users")
        async def create_user(
            org_id: UUID,
            current_user: User = Depends(get_current_user),
            db: AsyncSession = Depends(get_db)
        ):
            ...
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract dependencies from kwargs
            current_user = kwargs.get('current_user')
            db = kwargs.get('db')
            
            # Try to find organisation_id from various sources
            organisation_id = (
                kwargs.get('organisation_id') or
                kwargs.get('org_id') or
                kwargs.get('organization_id')
            )
            
            if not all([current_user, db, organisation_id]):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Missing required dependencies"
                )
            
            # Check permission
            await check_org_permission(
                current_user, organisation_id, permission, db, feature
            )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def require_feature(feature: str):
    """
    Decorator that only checks if a feature is available in the subscription.
    
    Usage:
        @router.get("/api-tests")
        @require_feature("api_testing")
        async def get_api_tests(...):
            ...
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_user = kwargs.get('current_user')
            db = kwargs.get('db')
            organisation_id = (
                kwargs.get('organisation_id') or
                kwargs.get('org_id') or
                kwargs.get('organization_id')
            )
            
            if not all([db, organisation_id]):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Missing required dependencies"
                )
            
            # Check feature access
            subscription = await get_org_subscription(organisation_id, db)
            if not subscription or feature not in (subscription.plan.features or []):
                raise FeatureNotAvailable(
                    f"The '{feature}' feature requires a higher subscription plan"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def require_role(min_role: str):
    """
    Decorator that checks if user has at least the specified role level.
    
    Role hierarchy (ascending): viewer < member < admin < owner
    
    Usage:
        @router.delete("/project/{id}")
        @require_role("admin")
        async def delete_project(...):
            ...
    """
    from app.models.organisation import ROLE_HIERARCHY
    
    min_level = ROLE_HIERARCHY.get(min_role, 0)
    
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_user = kwargs.get('current_user')
            db = kwargs.get('db')
            organisation_id = (
                kwargs.get('organisation_id') or
                kwargs.get('org_id') or
                kwargs.get('organization_id')
            )
            
            if not all([current_user, db, organisation_id]):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Missing required dependencies"
                )
            
            # Superusers pass all checks
            if current_user.is_superuser:
                return await func(*args, **kwargs)
            
            # Check role level
            membership = await get_user_org_membership(current_user.id, organisation_id, db)
            if not membership:
                raise PermissionDenied("You are not a member of this organization")
            
            if membership.hierarchy_level < min_level:
                raise PermissionDenied(f"This action requires at least '{min_role}' role")
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


class PermissionMiddleware:
    """
    A middleware class for more complex permission checking scenarios.
    Can be used with FastAPI's dependency injection.
    """
    
    def __init__(
        self,
        permission: Optional[str] = None,
        feature: Optional[str] = None,
        min_role: Optional[str] = None
    ):
        self.permission = permission
        self.feature = feature
        self.min_role = min_role
    
    async def __call__(
        self,
        organisation_id: UUID,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
    ):
        from app.models.organisation import ROLE_HIERARCHY
        
        # Superusers pass all checks
        if current_user.is_superuser:
            return True
        
        # Get membership
        membership = await get_user_org_membership(current_user.id, organisation_id, db)
        if not membership:
            raise PermissionDenied("You are not a member of this organization")
        
        # Check minimum role
        if self.min_role:
            min_level = ROLE_HIERARCHY.get(self.min_role, 0)
            if membership.hierarchy_level < min_level:
                raise PermissionDenied(f"This action requires at least '{self.min_role}' role")
        
        # Check permission
        if self.permission and not membership.has_permission(self.permission):
            raise PermissionDenied(f"You don't have the '{self.permission}' permission")
        
        # Check feature
        if self.feature:
            subscription = await get_org_subscription(organisation_id, db)
            if not subscription or self.feature not in (subscription.plan.features or []):
                raise FeatureNotAvailable(
                    f"The '{self.feature}' feature requires a higher subscription plan"
                )
        
        return True
