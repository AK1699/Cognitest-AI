"""enhance_test_plans_with_comprehensive_fields

Revision ID: e7a337c8078b
Revises: f68bd51c625c
Create Date: 2025-11-05 15:21:47.684178

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'e7a337c8078b'
down_revision: Union[str, Sequence[str], None] = 'f68bd51c625c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - Add comprehensive test plan fields."""

    # Create new enum types
    op.execute("CREATE TYPE testplantype AS ENUM ('regression', 'sanity', 'smoke', 'uat', 'performance', 'security', 'integration', 'unit', 'e2e', 'api', 'mobile', 'other')")
    op.execute("CREATE TYPE reviewstatus AS ENUM ('draft', 'under_review', 'approved', 'rejected')")
    op.execute("CREATE TYPE reportingfrequency AS ENUM ('daily', 'weekly', 'biweekly', 'end_of_cycle', 'on_demand')")

    # Add new columns to test_plans table

    # 1. Basic Information
    op.add_column('test_plans', sa.Column('version', sa.String(length=100), nullable=True))
    op.add_column('test_plans', sa.Column('modules', sa.JSON(), nullable=True, server_default='[]'))
    op.add_column('test_plans', sa.Column('test_plan_type', sa.Enum('regression', 'sanity', 'smoke', 'uat', 'performance', 'security', 'integration', 'unit', 'e2e', 'api', 'mobile', 'other', name='testplantype'), nullable=True, server_default='regression'))

    # 2. Objectives & Scope
    op.add_column('test_plans', sa.Column('objective', sa.Text(), nullable=True))
    op.add_column('test_plans', sa.Column('scope_in', sa.JSON(), nullable=True, server_default='[]'))
    op.add_column('test_plans', sa.Column('scope_out', sa.JSON(), nullable=True, server_default='[]'))
    op.add_column('test_plans', sa.Column('assumptions', sa.Text(), nullable=True))
    op.add_column('test_plans', sa.Column('constraints_risks', sa.Text(), nullable=True))

    # 3. Test Strategy & Approach
    op.add_column('test_plans', sa.Column('testing_approach', sa.Text(), nullable=True))
    op.add_column('test_plans', sa.Column('test_levels', sa.JSON(), nullable=True, server_default='[]'))
    op.add_column('test_plans', sa.Column('test_types', sa.JSON(), nullable=True, server_default='[]'))
    op.add_column('test_plans', sa.Column('entry_criteria', sa.Text(), nullable=True))
    op.add_column('test_plans', sa.Column('exit_criteria', sa.Text(), nullable=True))
    op.add_column('test_plans', sa.Column('defect_management_approach', sa.Text(), nullable=True))

    # 4. Environment & Tools
    op.add_column('test_plans', sa.Column('test_environments', sa.JSON(), nullable=True, server_default='[]'))
    op.add_column('test_plans', sa.Column('environment_urls', sa.JSON(), nullable=True, server_default='{}'))
    op.add_column('test_plans', sa.Column('tools_used', sa.JSON(), nullable=True, server_default='[]'))
    op.add_column('test_plans', sa.Column('data_setup', sa.Text(), nullable=True))

    # 5. Roles & Responsibilities
    op.add_column('test_plans', sa.Column('test_manager_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('test_plans', sa.Column('qa_lead_ids', sa.JSON(), nullable=True, server_default='[]'))
    op.add_column('test_plans', sa.Column('qa_engineer_ids', sa.JSON(), nullable=True, server_default='[]'))
    op.add_column('test_plans', sa.Column('stakeholder_ids', sa.JSON(), nullable=True, server_default='[]'))

    # 6. Schedule & Milestones
    op.add_column('test_plans', sa.Column('planned_start_date', sa.Date(), nullable=True))
    op.add_column('test_plans', sa.Column('planned_end_date', sa.Date(), nullable=True))
    op.add_column('test_plans', sa.Column('actual_start_date', sa.Date(), nullable=True))
    op.add_column('test_plans', sa.Column('actual_end_date', sa.Date(), nullable=True))
    op.add_column('test_plans', sa.Column('milestones', sa.JSON(), nullable=True, server_default='[]'))

    # 7. Metrics & Reporting
    op.add_column('test_plans', sa.Column('test_coverage_target', sa.Float(), nullable=True))
    op.add_column('test_plans', sa.Column('automation_coverage_target', sa.Float(), nullable=True))
    op.add_column('test_plans', sa.Column('defect_density_target', sa.Float(), nullable=True))
    op.add_column('test_plans', sa.Column('reporting_frequency', sa.Enum('daily', 'weekly', 'biweekly', 'end_of_cycle', 'on_demand', name='reportingfrequency'), nullable=True, server_default='weekly'))
    op.add_column('test_plans', sa.Column('dashboard_links', sa.JSON(), nullable=True, server_default='[]'))

    # 8. Review & Approval
    op.add_column('test_plans', sa.Column('review_status', sa.Enum('draft', 'under_review', 'approved', 'rejected', name='reviewstatus'), nullable=True, server_default='draft'))
    op.add_column('test_plans', sa.Column('reviewed_by_ids', sa.JSON(), nullable=True, server_default='[]'))
    op.add_column('test_plans', sa.Column('review_comments', sa.Text(), nullable=True))
    op.add_column('test_plans', sa.Column('approval_date', sa.DateTime(timezone=True), nullable=True))

    # Audit fields
    op.add_column('test_plans', sa.Column('last_updated_by', sa.String(length=255), nullable=True))

    # Create index on name for faster lookups
    op.create_index(op.f('ix_test_plans_name'), 'test_plans', ['name'], unique=False)


def downgrade() -> None:
    """Downgrade schema - Remove comprehensive test plan fields."""

    # Drop index
    op.drop_index(op.f('ix_test_plans_name'), table_name='test_plans')

    # Remove all new columns
    op.drop_column('test_plans', 'last_updated_by')
    op.drop_column('test_plans', 'approval_date')
    op.drop_column('test_plans', 'review_comments')
    op.drop_column('test_plans', 'reviewed_by_ids')
    op.drop_column('test_plans', 'review_status')
    op.drop_column('test_plans', 'dashboard_links')
    op.drop_column('test_plans', 'reporting_frequency')
    op.drop_column('test_plans', 'defect_density_target')
    op.drop_column('test_plans', 'automation_coverage_target')
    op.drop_column('test_plans', 'test_coverage_target')
    op.drop_column('test_plans', 'milestones')
    op.drop_column('test_plans', 'actual_end_date')
    op.drop_column('test_plans', 'actual_start_date')
    op.drop_column('test_plans', 'planned_end_date')
    op.drop_column('test_plans', 'planned_start_date')
    op.drop_column('test_plans', 'stakeholder_ids')
    op.drop_column('test_plans', 'qa_engineer_ids')
    op.drop_column('test_plans', 'qa_lead_ids')
    op.drop_column('test_plans', 'test_manager_id')
    op.drop_column('test_plans', 'data_setup')
    op.drop_column('test_plans', 'tools_used')
    op.drop_column('test_plans', 'environment_urls')
    op.drop_column('test_plans', 'test_environments')
    op.drop_column('test_plans', 'defect_management_approach')
    op.drop_column('test_plans', 'exit_criteria')
    op.drop_column('test_plans', 'entry_criteria')
    op.drop_column('test_plans', 'test_types')
    op.drop_column('test_plans', 'test_levels')
    op.drop_column('test_plans', 'testing_approach')
    op.drop_column('test_plans', 'constraints_risks')
    op.drop_column('test_plans', 'assumptions')
    op.drop_column('test_plans', 'scope_out')
    op.drop_column('test_plans', 'scope_in')
    op.drop_column('test_plans', 'objective')
    op.drop_column('test_plans', 'test_plan_type')
    op.drop_column('test_plans', 'modules')
    op.drop_column('test_plans', 'version')

    # Drop enum types
    op.execute("DROP TYPE reportingfrequency")
    op.execute("DROP TYPE reviewstatus")
    op.execute("DROP TYPE testplantype")
