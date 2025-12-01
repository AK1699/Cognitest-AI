"""add web automation tables

Revision ID: web_automation_v1
Revises: f68bd51c625c
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'web_automation_v1'
down_revision = 'f68bd51c625c'
branch_labels = None
depends_on = None


def upgrade():
    # Create test_flows table
    op.create_table('test_flows',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('organisation_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=500), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.Enum('draft', 'active', 'inactive', 'archived', name='testflowstatus'), nullable=True),
        sa.Column('base_url', sa.String(length=1000), nullable=False),
        sa.Column('flow_json', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('nodes', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('edges', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('viewport', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('default_browser', sa.Enum('chrome', 'firefox', 'safari', 'edge', 'chromium', name='browsertype'), nullable=True),
        sa.Column('default_mode', sa.Enum('headed', 'headless', name='executionmode'), nullable=True),
        sa.Column('timeout', sa.Integer(), nullable=True),
        sa.Column('retry_policy', sa.String(length=50), nullable=True),
        sa.Column('max_retries', sa.Integer(), nullable=True),
        sa.Column('healing_enabled', sa.Boolean(), nullable=True),
        sa.Column('auto_update_selectors', sa.Boolean(), nullable=True),
        sa.Column('healing_confidence_threshold', sa.Float(), nullable=True),
        sa.Column('browser_options', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('tags', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('category', sa.String(length=255), nullable=True),
        sa.Column('version', sa.String(length=50), nullable=True),
        sa.Column('total_executions', sa.Integer(), nullable=True),
        sa.Column('successful_executions', sa.Integer(), nullable=True),
        sa.Column('failed_executions', sa.Integer(), nullable=True),
        sa.Column('average_duration', sa.Integer(), nullable=True),
        sa.Column('healing_success_rate', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('last_executed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['organisation_id'], ['organisations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_test_flows_project_id'), 'test_flows', ['project_id'], unique=False)
    op.create_index(op.f('ix_test_flows_organisation_id'), 'test_flows', ['organisation_id'], unique=False)

    # Create execution_runs table
    op.create_table('execution_runs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('test_flow_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('browser_type', sa.Enum('chrome', 'firefox', 'safari', 'edge', 'chromium', name='browsertype'), nullable=False),
        sa.Column('execution_mode', sa.Enum('headed', 'headless', name='executionmode'), nullable=False),
        sa.Column('status', sa.Enum('pending', 'running', 'completed', 'failed', 'stopped', 'error', name='executionrunstatus'), nullable=True),
        sa.Column('total_steps', sa.Integer(), nullable=True),
        sa.Column('passed_steps', sa.Integer(), nullable=True),
        sa.Column('failed_steps', sa.Integer(), nullable=True),
        sa.Column('skipped_steps', sa.Integer(), nullable=True),
        sa.Column('healed_steps', sa.Integer(), nullable=True),
        sa.Column('duration_ms', sa.Integer(), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('ended_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('execution_environment', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('video_url', sa.String(length=1000), nullable=True),
        sa.Column('trace_url', sa.String(length=1000), nullable=True),
        sa.Column('screenshots_dir', sa.String(length=1000), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('error_stack', sa.Text(), nullable=True),
        sa.Column('triggered_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('trigger_source', sa.String(length=100), nullable=True),
        sa.Column('tags', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['test_flow_id'], ['test_flows.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['triggered_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_execution_runs_test_flow_id'), 'execution_runs', ['test_flow_id'], unique=False)

    # Create step_results table
    op.create_table('step_results',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('execution_run_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('step_id', sa.String(length=100), nullable=False),
        sa.Column('step_name', sa.String(length=500), nullable=True),
        sa.Column('step_type', sa.String(length=100), nullable=False),
        sa.Column('step_order', sa.Integer(), nullable=False),
        sa.Column('status', sa.Enum('pending', 'running', 'passed', 'failed', 'skipped', 'healed', name='stepstatus'), nullable=True),
        sa.Column('selector_used', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('action_details', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('actual_result', sa.Text(), nullable=True),
        sa.Column('expected_result', sa.Text(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('error_stack', sa.Text(), nullable=True),
        sa.Column('duration_ms', sa.Integer(), nullable=True),
        sa.Column('retry_count', sa.Integer(), nullable=True),
        sa.Column('screenshot_url', sa.String(length=1000), nullable=True),
        sa.Column('screenshot_before_url', sa.String(length=1000), nullable=True),
        sa.Column('screenshot_after_url', sa.String(length=1000), nullable=True),
        sa.Column('was_healed', sa.Boolean(), nullable=True),
        sa.Column('healing_applied', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('console_logs', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('network_logs', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('ended_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['execution_run_id'], ['execution_runs.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_step_results_execution_run_id'), 'step_results', ['execution_run_id'], unique=False)

    # Create healing_events table
    op.create_table('healing_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('execution_run_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('step_result_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('healing_type', sa.Enum('locator', 'assertion', 'network', 'timeout', name='healingtype'), nullable=False),
        sa.Column('strategy', sa.Enum('ai', 'alternative', 'context', 'similarity', name='healingstrategy'), nullable=False),
        sa.Column('original_value', sa.Text(), nullable=False),
        sa.Column('healed_value', sa.Text(), nullable=False),
        sa.Column('step_id', sa.String(length=100), nullable=False),
        sa.Column('step_type', sa.String(length=100), nullable=False),
        sa.Column('failure_reason', sa.Text(), nullable=True),
        sa.Column('success', sa.Boolean(), nullable=False),
        sa.Column('confidence_score', sa.Float(), nullable=True),
        sa.Column('retry_attempts', sa.Integer(), nullable=True),
        sa.Column('ai_model', sa.String(length=100), nullable=True),
        sa.Column('ai_prompt', sa.Text(), nullable=True),
        sa.Column('ai_response', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('ai_reasoning', sa.Text(), nullable=True),
        sa.Column('alternatives_tried', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('dom_snapshot', sa.Text(), nullable=True),
        sa.Column('page_url', sa.String(length=1000), nullable=True),
        sa.Column('page_title', sa.String(length=500), nullable=True),
        sa.Column('healing_duration_ms', sa.Integer(), nullable=True),
        sa.Column('recorded_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['execution_run_id'], ['execution_runs.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['step_result_id'], ['step_results.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_healing_events_execution_run_id'), 'healing_events', ['execution_run_id'], unique=False)

    # Create locator_alternatives table
    op.create_table('locator_alternatives',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('test_flow_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('step_id', sa.String(length=100), nullable=False),
        sa.Column('element_identifier', sa.String(length=500), nullable=False),
        sa.Column('primary_selector', sa.Text(), nullable=False),
        sa.Column('primary_strategy', sa.String(length=50), nullable=False),
        sa.Column('alternatives', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('success_count', sa.Integer(), nullable=True),
        sa.Column('failure_count', sa.Integer(), nullable=True),
        sa.Column('last_successful_selector', sa.Text(), nullable=True),
        sa.Column('last_failed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('element_attributes', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('element_context', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('page_url_pattern', sa.String(length=1000), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['test_flow_id'], ['test_flows.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_locator_alternatives_test_flow_id'), 'locator_alternatives', ['test_flow_id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_locator_alternatives_test_flow_id'), table_name='locator_alternatives')
    op.drop_table('locator_alternatives')
    op.drop_index(op.f('ix_healing_events_execution_run_id'), table_name='healing_events')
    op.drop_table('healing_events')
    op.drop_index(op.f('ix_step_results_execution_run_id'), table_name='step_results')
    op.drop_table('step_results')
    op.drop_index(op.f('ix_execution_runs_test_flow_id'), table_name='execution_runs')
    op.drop_table('execution_runs')
    op.drop_index(op.f('ix_test_flows_organisation_id'), table_name='test_flows')
    op.drop_index(op.f('ix_test_flows_project_id'), table_name='test_flows')
    op.drop_table('test_flows')
    
    # Drop enums
    op.execute('DROP TYPE IF EXISTS healingstrategy')
    op.execute('DROP TYPE IF EXISTS healingtype')
    op.execute('DROP TYPE IF EXISTS stepstatus')
    op.execute('DROP TYPE IF EXISTS executionrunstatus')
    op.execute('DROP TYPE IF EXISTS executionmode')
    op.execute('DROP TYPE IF EXISTS browsertype')
    op.execute('DROP TYPE IF EXISTS testflowstatus')
