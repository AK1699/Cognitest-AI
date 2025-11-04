"""Create test management tables

Revision ID: 001
Revises:
Create Date: 2024-11-02 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Test Plans Table
    op.create_table(
        'test_plans',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('objectives', postgresql.JSON(), server_default='[]'),
        sa.Column('generated_by', sa.Enum('ai', 'manual', 'hybrid', name='generationtype'), server_default='manual'),
        sa.Column('source_documents', postgresql.JSON(), server_default='[]'),
        sa.Column('confidence_score', sa.String(50), nullable=True),
        sa.Column('tags', postgresql.JSON(), server_default='[]'),
        sa.Column('meta_data', postgresql.JSON(), server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
        sa.Column('created_by', sa.String(255), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )

    # Test Suites Table
    op.create_table(
        'test_suites',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('test_plan_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('generated_by', sa.Enum('ai', 'manual', 'hybrid', name='generationtype'), server_default='manual'),
        sa.Column('execution_history', postgresql.JSON(), server_default='[]'),
        sa.Column('tags', postgresql.JSON(), server_default='[]'),
        sa.Column('meta_data', postgresql.JSON(), server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
        sa.Column('created_by', sa.String(255), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['test_plan_id'], ['test_plans.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )

    # Test Cases Table
    op.create_table(
        'test_cases',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('test_suite_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('steps', postgresql.JSON(), server_default='[]'),
        sa.Column('expected_result', sa.Text(), nullable=True),
        sa.Column('actual_result', sa.Text(), nullable=True),
        sa.Column('status', sa.Enum('draft', 'ready', 'in_progress', 'passed', 'failed', 'blocked', 'skipped', name='testcasestatus'), server_default='draft'),
        sa.Column('priority', sa.Enum('low', 'medium', 'high', 'critical', name='testcasepriority'), server_default='medium'),
        sa.Column('ai_generated', sa.Boolean(), server_default='false'),
        sa.Column('generated_by', sa.Enum('ai', 'manual', 'hybrid', name='generationtype'), server_default='manual'),
        sa.Column('confidence_score', sa.String(50), nullable=True),
        sa.Column('execution_logs', postgresql.JSON(), server_default='[]'),
        sa.Column('tags', postgresql.JSON(), server_default='[]'),
        sa.Column('attachments', postgresql.JSON(), server_default='[]'),
        sa.Column('meta_data', postgresql.JSON(), server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
        sa.Column('created_by', sa.String(255), nullable=False),
        sa.Column('assigned_to', sa.String(255), nullable=True),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['test_suite_id'], ['test_suites.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )

    # Create indexes
    op.create_index('ix_test_plans_project_id', 'test_plans', ['project_id'])
    op.create_index('ix_test_suites_project_id', 'test_suites', ['project_id'])
    op.create_index('ix_test_suites_test_plan_id', 'test_suites', ['test_plan_id'])
    op.create_index('ix_test_cases_project_id', 'test_cases', ['project_id'])
    op.create_index('ix_test_cases_test_suite_id', 'test_cases', ['test_suite_id'])
    op.create_index('ix_test_cases_status', 'test_cases', ['status'])
    op.create_index('ix_test_cases_priority', 'test_cases', ['priority'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_test_cases_priority', 'test_cases')
    op.drop_index('ix_test_cases_status', 'test_cases')
    op.drop_index('ix_test_cases_test_suite_id', 'test_cases')
    op.drop_index('ix_test_cases_project_id', 'test_cases')
    op.drop_index('ix_test_suites_test_plan_id', 'test_suites')
    op.drop_index('ix_test_suites_project_id', 'test_suites')
    op.drop_index('ix_test_plans_project_id', 'test_plans')

    # Drop tables
    op.drop_table('test_cases')
    op.drop_table('test_suites')
    op.drop_table('test_plans')
