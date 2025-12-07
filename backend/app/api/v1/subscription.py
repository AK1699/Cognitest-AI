"""
Subscription API Endpoints

Provides endpoints for subscription management, plan listing, and feature access checks.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel
from decimal import Decimal

from app.core.database import get_db
from app.models.user import User
from app.models.subscription import (
    SubscriptionPlan, 
    OrganizationSubscription,
    PlanTier,
    SubscriptionStatus,
    DEFAULT_PLANS
)
from app.api.v1.auth import get_current_user

router = APIRouter()


# ==================== Schemas ====================

class PlanFeatures(BaseModel):
    """Features included in a plan"""
    features: List[str]


class PlanResponse(BaseModel):
    """Subscription plan response"""
    id: str
    name: str
    display_name: str
    description: Optional[str]
    max_users: int
    max_projects: int
    max_test_cases: int
    max_test_executions_per_month: Optional[int]
    features: List[str]
    price_monthly: Decimal
    price_yearly: Decimal
    is_current: bool = False

    class Config:
        from_attributes = True


class SubscriptionResponse(BaseModel):
    """Organization subscription response"""
    id: str
    plan_name: str
    plan_display_name: str
    status: str
    billing_cycle: str
    current_period_start: Optional[str]
    current_period_end: Optional[str]
    is_trialing: bool
    cancel_at_period_end: bool
    features: List[str]
    limits: dict

    class Config:
        from_attributes = True


class FeatureCheckRequest(BaseModel):
    """Request to check feature access"""
    feature: str


class FeatureCheckResponse(BaseModel):
    """Response for feature access check"""
    allowed: bool
    reason: Optional[str] = None
    upgrade_to: Optional[str] = None


class UsageLimitResponse(BaseModel):
    """Response for usage limits"""
    resource: str
    current: int
    limit: int
    is_unlimited: bool
    percentage_used: float


# ==================== Endpoints ====================

@router.get("/plans", response_model=List[PlanResponse])
async def list_plans(
    organisation_id: Optional[UUID] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List all available subscription plans.
    
    If organisation_id is provided, marks the current plan.
    """
    # Get all active public plans
    result = await db.execute(
        select(SubscriptionPlan)
        .where(SubscriptionPlan.is_active == True)
        .where(SubscriptionPlan.is_public == True)
        .order_by(SubscriptionPlan.sort_order)
    )
    plans = result.scalars().all()
    
    # Get current plan if org specified
    current_plan_id = None
    if organisation_id:
        sub_result = await db.execute(
            select(OrganizationSubscription)
            .where(OrganizationSubscription.organisation_id == organisation_id)
        )
        subscription = sub_result.scalar_one_or_none()
        if subscription:
            current_plan_id = subscription.plan_id
    
    return [
        PlanResponse(
            id=str(plan.id),
            name=plan.name,
            display_name=plan.display_name,
            description=plan.description,
            max_users=plan.max_users,
            max_projects=plan.max_projects,
            max_test_cases=plan.max_test_cases,
            max_test_executions_per_month=plan.max_test_executions_per_month,
            features=plan.features or [],
            price_monthly=plan.price_monthly,
            price_yearly=plan.price_yearly,
            is_current=(plan.id == current_plan_id)
        )
        for plan in plans
    ]


@router.get("/current/{organisation_id}", response_model=SubscriptionResponse)
async def get_current_subscription(
    organisation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get the current subscription for an organization.
    """
    result = await db.execute(
        select(OrganizationSubscription)
        .options(selectinload(OrganizationSubscription.plan))
        .where(OrganizationSubscription.organisation_id == organisation_id)
    )
    subscription = result.scalar_one_or_none()
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No subscription found for this organization"
        )
    
    plan = subscription.plan
    
    return SubscriptionResponse(
        id=str(subscription.id),
        plan_name=plan.name,
        plan_display_name=plan.display_name,
        status=subscription.status,
        billing_cycle=subscription.billing_cycle,
        current_period_start=subscription.current_period_start.isoformat() if subscription.current_period_start else None,
        current_period_end=subscription.current_period_end.isoformat() if subscription.current_period_end else None,
        is_trialing=subscription.status == SubscriptionStatus.TRIALING.value,
        cancel_at_period_end=subscription.cancel_at_period_end,
        features=plan.features or [],
        limits={
            "max_users": plan.max_users,
            "max_projects": plan.max_projects,
            "max_test_cases": plan.max_test_cases,
            "max_test_executions_per_month": plan.max_test_executions_per_month
        }
    )


@router.post("/check-feature/{organisation_id}", response_model=FeatureCheckResponse)
async def check_feature_access(
    organisation_id: UUID,
    request: FeatureCheckRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Check if an organization has access to a specific feature.
    """
    result = await db.execute(
        select(OrganizationSubscription)
        .options(selectinload(OrganizationSubscription.plan))
        .where(OrganizationSubscription.organisation_id == organisation_id)
    )
    subscription = result.scalar_one_or_none()
    
    if not subscription:
        return FeatureCheckResponse(
            allowed=False,
            reason="No active subscription",
            upgrade_to="free"
        )
    
    plan = subscription.plan
    
    # Check if feature is in plan
    if request.feature in (plan.features or []):
        return FeatureCheckResponse(allowed=True)
    
    # Find the minimum plan that has this feature
    plans_result = await db.execute(
        select(SubscriptionPlan)
        .where(SubscriptionPlan.is_active == True)
        .order_by(SubscriptionPlan.sort_order)
    )
    all_plans = plans_result.scalars().all()
    
    upgrade_to = None
    for p in all_plans:
        if request.feature in (p.features or []):
            upgrade_to = p.name
            break
    
    return FeatureCheckResponse(
        allowed=False,
        reason=f"Feature '{request.feature}' requires a higher plan",
        upgrade_to=upgrade_to
    )


@router.get("/usage/{organisation_id}", response_model=List[UsageLimitResponse])
async def get_usage_limits(
    organisation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current usage and limits for an organization.
    """
    # Get subscription with plan
    result = await db.execute(
        select(OrganizationSubscription)
        .options(selectinload(OrganizationSubscription.plan))
        .where(OrganizationSubscription.organisation_id == organisation_id)
    )
    subscription = result.scalar_one_or_none()
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No subscription found"
        )
    
    plan = subscription.plan
    
    # Count current usage (simplified - you'd need to add actual counting)
    # For now, return the limits with placeholder usage
    from app.models.organisation import UserOrganisation
    from app.models.project import Project
    from app.models.test_case import TestCase
    
    # Count users
    user_count_result = await db.execute(
        select(UserOrganisation)
        .where(UserOrganisation.organisation_id == organisation_id)
    )
    user_count = len(user_count_result.scalars().all())
    
    # Count projects
    project_count_result = await db.execute(
        select(Project)
        .where(Project.organisation_id == organisation_id)
    )
    project_count = len(project_count_result.scalars().all())
    
    # Count test cases (across all projects)
    test_case_count = 0  # Would need proper query
    
    usage = []
    
    # Users limit
    is_unlimited = plan.max_users == -1
    usage.append(UsageLimitResponse(
        resource="users",
        current=user_count,
        limit=plan.max_users if not is_unlimited else 999999,
        is_unlimited=is_unlimited,
        percentage_used=0 if is_unlimited else (user_count / plan.max_users * 100) if plan.max_users > 0 else 0
    ))
    
    # Projects limit
    is_unlimited = plan.max_projects == -1
    usage.append(UsageLimitResponse(
        resource="projects",
        current=project_count,
        limit=plan.max_projects if not is_unlimited else 999999,
        is_unlimited=is_unlimited,
        percentage_used=0 if is_unlimited else (project_count / plan.max_projects * 100) if plan.max_projects > 0 else 0
    ))
    
    # Test cases limit
    is_unlimited = plan.max_test_cases == -1
    usage.append(UsageLimitResponse(
        resource="test_cases",
        current=test_case_count,
        limit=plan.max_test_cases if not is_unlimited else 999999,
        is_unlimited=is_unlimited,
        percentage_used=0 if is_unlimited else (test_case_count / plan.max_test_cases * 100) if plan.max_test_cases > 0 else 0
    ))
    
    return usage


@router.get("/features/{organisation_id}", response_model=PlanFeatures)
async def get_org_features(
    organisation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get list of features available to an organization based on their plan.
    """
    result = await db.execute(
        select(OrganizationSubscription)
        .options(selectinload(OrganizationSubscription.plan))
        .where(OrganizationSubscription.organisation_id == organisation_id)
    )
    subscription = result.scalar_one_or_none()
    
    if not subscription:
        # Return free tier features as default
        return PlanFeatures(features=["test_management"])
    
    return PlanFeatures(features=subscription.plan.features or [])
