from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from uuid import UUID
from pydantic import BaseModel
from typing import Optional

from ..models.subscription import OrganizationSubscription, SubscriptionStatus
from ..models.organisation import UserOrganisation
from ..models.project import Project

class ResourceLimitCheckResponse(BaseModel):
    limit_reached: bool
    current: int
    limit: int
    is_unlimited: bool
    message: str
    upgrade_url: Optional[str] = None

async def check_organisation_limit(
    db: AsyncSession,
    organisation_id: UUID,
    resource: str
) -> ResourceLimitCheckResponse:
    """Check if an organisation has reached a resource limit."""
    
    # Get subscription with plan
    result = await db.execute(
        select(OrganizationSubscription)
        .options(selectinload(OrganizationSubscription.plan))
        .where(OrganizationSubscription.organisation_id == organisation_id)
    )
    subscription = result.scalar_one_or_none()
    
    if not subscription:
        return ResourceLimitCheckResponse(
            limit_reached=True,
            current=0,
            limit=0,
            is_unlimited=False,
            message="No active subscription found.",
            upgrade_url=f"/organizations/{organisation_id}/billing"
        )
    
    plan = subscription.plan
    
    # Get current count and limit based on resource type
    if resource == "users":
        count_result = await db.execute(
            select(UserOrganisation)
            .where(UserOrganisation.organisation_id == organisation_id)
        )
        current_count = len(count_result.scalars().all())
        max_limit = plan.max_users
    elif resource == "projects":
        count_result = await db.execute(
            select(Project)
            .where(Project.organisation_id == organisation_id)
        )
        current_count = len(count_result.scalars().all())
        max_limit = plan.max_projects
    else:
        return ResourceLimitCheckResponse(
            limit_reached=False,
            current=0,
            limit=0,
            is_unlimited=True,
            message=f"Unknown resource type: {resource}"
        )
    
    is_unlimited = max_limit == -1
    
    if is_unlimited:
        return ResourceLimitCheckResponse(
            limit_reached=False,
            current=current_count,
            limit=max_limit,
            is_unlimited=True,
            message="Unlimited"
        )
    
    limit_reached = current_count >= max_limit
    
    if limit_reached:
        return ResourceLimitCheckResponse(
            limit_reached=True,
            current=current_count,
            limit=max_limit,
            is_unlimited=False,
            message=f"Limit reached ({current_count}/{max_limit}). Please upgrade.",
            upgrade_url=f"/organizations/{organisation_id}/billing"
        )
    
    return ResourceLimitCheckResponse(
        limit_reached=False,
        current=current_count,
        limit=max_limit,
        is_unlimited=False,
        message=f"{current_count}/{max_limit} used"
    )
