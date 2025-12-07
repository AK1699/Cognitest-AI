"""Add subscription and pricing plan tables

Revision ID: add_subscription_tables
Revises: 84013e6827da
Create Date: 2024-12-08

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_subscription_tables'
down_revision = '84013e6827da'  # This should point to the merge migration
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create subscription_plans table
    op.create_table(
        'subscription_plans',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(50), unique=True, nullable=False),
        sa.Column('display_name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('max_users', sa.Integer(), nullable=False, server_default='3'),
        sa.Column('max_projects', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('max_test_cases', sa.Integer(), nullable=False, server_default='50'),
        sa.Column('max_test_executions_per_month', sa.Integer(), nullable=True),
        sa.Column('features', postgresql.JSON(), nullable=False, server_default='[]'),
        sa.Column('price_monthly', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('price_yearly', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('is_public', sa.Boolean(), server_default='true'),
        sa.Column('sort_order', sa.Integer(), server_default='0'),
        sa.Column('stripe_price_id_monthly', sa.String(255), nullable=True),
        sa.Column('stripe_price_id_yearly', sa.String(255), nullable=True),
        sa.Column('stripe_product_id', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    
    # Create organization_subscriptions table
    op.create_table(
        'organization_subscriptions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('organisation_id', postgresql.UUID(as_uuid=True), 
                  sa.ForeignKey('organisations.id', ondelete='CASCADE'), 
                  nullable=False, unique=True),
        sa.Column('plan_id', postgresql.UUID(as_uuid=True), 
                  sa.ForeignKey('subscription_plans.id'), 
                  nullable=False),
        sa.Column('status', sa.String(50), nullable=False, server_default='active'),
        sa.Column('billing_cycle', sa.String(20), server_default='monthly'),
        sa.Column('current_period_start', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('current_period_end', sa.DateTime(timezone=True), nullable=True),
        sa.Column('trial_start', sa.DateTime(timezone=True), nullable=True),
        sa.Column('trial_end', sa.DateTime(timezone=True), nullable=True),
        sa.Column('stripe_customer_id', sa.String(255), nullable=True),
        sa.Column('stripe_subscription_id', sa.String(255), nullable=True),
        sa.Column('cancel_at_period_end', sa.Boolean(), server_default='false'),
        sa.Column('cancelled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    
    # Create indexes
    op.create_index('ix_subscription_plans_name', 'subscription_plans', ['name'])
    op.create_index('ix_organization_subscriptions_org_id', 'organization_subscriptions', ['organisation_id'])
    op.create_index('ix_organization_subscriptions_status', 'organization_subscriptions', ['status'])


def downgrade() -> None:
    op.drop_index('ix_organization_subscriptions_status', 'organization_subscriptions')
    op.drop_index('ix_organization_subscriptions_org_id', 'organization_subscriptions')
    op.drop_index('ix_subscription_plans_name', 'subscription_plans')
    op.drop_table('organization_subscriptions')
    op.drop_table('subscription_plans')
