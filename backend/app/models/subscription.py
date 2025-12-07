"""
Subscription and Pricing Plan Models

This module defines the subscription/pricing tier system for organizations.
"""

from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Boolean, Integer, Numeric, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from app.core.database import Base


class PlanTier(str, enum.Enum):
    """Subscription plan tiers"""
    FREE = "free"
    BASIC = "basic"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class SubscriptionStatus(str, enum.Enum):
    """Subscription status"""
    ACTIVE = "active"
    TRIALING = "trialing"
    PAST_DUE = "past_due"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class SubscriptionPlan(Base):
    """
    Defines a subscription plan with its features and limits.
    These are typically seeded and rarely changed.
    """
    __tablename__ = "subscription_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Plan identification
    name = Column(String(50), unique=True, nullable=False)  # free, basic, pro, enterprise
    display_name = Column(String(100), nullable=False)  # Free, Basic, Pro, Enterprise
    description = Column(Text, nullable=True)
    
    # Limits
    max_users = Column(Integer, nullable=False, default=3)
    max_projects = Column(Integer, nullable=False, default=1)
    max_test_cases = Column(Integer, nullable=False, default=50)
    max_test_executions_per_month = Column(Integer, nullable=True)  # null = unlimited
    
    # Features (list of enabled feature keys)
    features = Column(JSON, nullable=False, default=list)
    # Example: ["test_management", "api_testing", "automation_hub", "security_testing"]
    
    # Pricing
    price_monthly = Column(Numeric(10, 2), nullable=False, default=0)
    price_yearly = Column(Numeric(10, 2), nullable=False, default=0)
    
    # Settings
    is_active = Column(Boolean, default=True)
    is_public = Column(Boolean, default=True)  # Show on pricing page
    sort_order = Column(Integer, default=0)
    
    # Stripe integration (optional)
    stripe_price_id_monthly = Column(String(255), nullable=True)
    stripe_price_id_yearly = Column(String(255), nullable=True)
    stripe_product_id = Column(String(255), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    subscriptions = relationship("OrganizationSubscription", back_populates="plan")

    def __repr__(self):
        return f"<SubscriptionPlan {self.name}>"
    
    def has_feature(self, feature_key: str) -> bool:
        """Check if this plan includes a specific feature"""
        return feature_key in (self.features or [])
    
    def can_add_user(self, current_count: int) -> bool:
        """Check if plan allows adding another user"""
        return self.max_users == -1 or current_count < self.max_users
    
    def can_add_project(self, current_count: int) -> bool:
        """Check if plan allows adding another project"""
        return self.max_projects == -1 or current_count < self.max_projects


class OrganizationSubscription(Base):
    """
    Tracks an organization's subscription to a plan.
    Each organization has one active subscription at a time.
    """
    __tablename__ = "organization_subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Links
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False, unique=True)
    plan_id = Column(UUID(as_uuid=True), ForeignKey("subscription_plans.id"), nullable=False)
    
    # Status
    status = Column(String(50), nullable=False, default=SubscriptionStatus.ACTIVE.value)
    
    # Billing period
    billing_cycle = Column(String(20), default="monthly")  # monthly, yearly
    current_period_start = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    current_period_end = Column(DateTime(timezone=True), nullable=True)  # null = no expiration (free tier)
    
    # Trial
    trial_start = Column(DateTime(timezone=True), nullable=True)
    trial_end = Column(DateTime(timezone=True), nullable=True)
    
    # Stripe integration
    stripe_customer_id = Column(String(255), nullable=True)
    stripe_subscription_id = Column(String(255), nullable=True)
    
    # Cancellation
    cancel_at_period_end = Column(Boolean, default=False)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    organisation = relationship("Organisation", back_populates="subscription")
    plan = relationship("SubscriptionPlan", back_populates="subscriptions")

    def __repr__(self):
        return f"<OrganizationSubscription org={self.organisation_id} plan={self.plan_id}>"
    
    @property
    def is_active(self) -> bool:
        """Check if subscription is currently active"""
        return self.status in [SubscriptionStatus.ACTIVE.value, SubscriptionStatus.TRIALING.value]
    
    @property
    def is_trialing(self) -> bool:
        """Check if currently in trial period"""
        return self.status == SubscriptionStatus.TRIALING.value


# Default plan configurations for seeding
DEFAULT_PLANS = [
    {
        "name": "free",
        "display_name": "Free",
        "description": "For individuals and small teams getting started",
        "max_users": 3,
        "max_projects": 1,
        "max_test_cases": 50,
        "max_test_executions_per_month": 100,
        "features": ["test_management"],
        "price_monthly": 0,
        "price_yearly": 0,
        "sort_order": 1,
    },
    {
        "name": "basic",
        "display_name": "Basic",
        "description": "For growing teams with API testing needs",
        "max_users": 10,
        "max_projects": 5,
        "max_test_cases": 500,
        "max_test_executions_per_month": 1000,
        "features": ["test_management", "api_testing"],
        "price_monthly": 29,
        "price_yearly": 290,
        "sort_order": 2,
    },
    {
        "name": "pro",
        "display_name": "Pro",
        "description": "For professional teams with automation needs",
        "max_users": 50,
        "max_projects": 20,
        "max_test_cases": 5000,
        "max_test_executions_per_month": None,  # Unlimited
        "features": [
            "test_management", 
            "api_testing", 
            "automation_hub", 
            "performance_testing",
            "custom_roles",
            "audit_logs"
        ],
        "price_monthly": 99,
        "price_yearly": 990,
        "sort_order": 3,
    },
    {
        "name": "enterprise",
        "display_name": "Enterprise",
        "description": "For large organizations with advanced security needs",
        "max_users": -1,  # Unlimited
        "max_projects": -1,  # Unlimited
        "max_test_cases": -1,  # Unlimited
        "max_test_executions_per_month": None,  # Unlimited
        "features": [
            "test_management",
            "api_testing",
            "automation_hub",
            "performance_testing",
            "security_testing",
            "mobile_testing",
            "custom_roles",
            "audit_logs",
            "sso_saml",
            "priority_support"
        ],
        "price_monthly": 299,
        "price_yearly": 2990,
        "sort_order": 4,
    },
]
