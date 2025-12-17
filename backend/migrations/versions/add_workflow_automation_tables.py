"""Add workflow automation tables

Revision ID: add_workflow_automation_tables
Revises: f68bd51c625c
Create Date: 2025-12-17

Creates tables for n8n-style workflow automation:
- workflow_definitions: Main workflow entity
- workflow_executions: Execution records
- workflow_execution_steps: Individual step results
- workflow_credentials: Encrypted credentials
- workflow_schedules: Cron-based scheduling
- workflow_webhooks: Webhook triggers
- workflow_templates: Pre-built templates
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_workflow_automation_tables'
down_revision = 'f68bd51c625c'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create ENUM types
    op.execute("""
        CREATE TYPE workflowstatus AS ENUM ('draft', 'active', 'inactive', 'archived');
        CREATE TYPE triggertype AS ENUM ('manual', 'schedule', 'webhook', 'event');
        CREATE TYPE nodetype AS ENUM ('trigger', 'action', 'condition', 'loop', 'switch', 'wait', 'set_variable', 'transform', 'filter', 'merge', 'error_handler', 'subworkflow');
        CREATE TYPE integrationnodetype AS ENUM ('http_request', 'slack', 'email', 'jira', 'github', 'gitlab', 'google_sheets', 'postgresql', 'mysql', 'mongodb', 'webhook', 'test_automation', 'custom_code');
        CREATE TYPE workflowexecutionstatus AS ENUM ('pending', 'queued', 'running', 'completed', 'failed', 'stopped', 'waiting', 'timeout');
        CREATE TYPE workflowstepstatus AS ENUM ('pending', 'running', 'completed', 'failed', 'skipped', 'waiting');
        CREATE TYPE credentialtype AS ENUM ('api_key', 'oauth2', 'basic_auth', 'bearer_token', 'custom');
    """)
    
    # Create workflow_definitions table
    op.create_table(
        'workflow_definitions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('organisation_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organisations.id', ondelete='CASCADE'), nullable=False, index=True),
        
        sa.Column('human_id', sa.String(20), unique=True, nullable=True, index=True),
        
        sa.Column('name', sa.String(500), nullable=False, index=True),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('status', postgresql.ENUM('draft', 'active', 'inactive', 'archived', name='workflowstatus', create_type=False), server_default='draft', index=True),
        
        sa.Column('trigger_type', postgresql.ENUM('manual', 'schedule', 'webhook', 'event', name='triggertype', create_type=False), server_default='manual'),
        sa.Column('trigger_config', postgresql.JSON, server_default='{}'),
        
        sa.Column('nodes_json', postgresql.JSON, server_default='[]'),
        sa.Column('edges_json', postgresql.JSON, server_default='[]'),
        sa.Column('viewport_json', postgresql.JSON, server_default='{}'),
        
        sa.Column('timeout_seconds', sa.Integer, server_default='3600'),
        sa.Column('retry_policy', postgresql.JSON, server_default='{"max_retries": 3, "retry_delay_seconds": 10, "backoff_multiplier": 2}'),
        sa.Column('error_handling', postgresql.JSON, server_default='{"on_error": "stop", "notify_on_failure": true}'),
        
        sa.Column('global_variables', postgresql.JSON, server_default='{}'),
        sa.Column('environment', sa.String(50), server_default='production'),
        
        sa.Column('total_executions', sa.Integer, server_default='0'),
        sa.Column('successful_executions', sa.Integer, server_default='0'),
        sa.Column('failed_executions', sa.Integer, server_default='0'),
        sa.Column('average_duration_ms', sa.Integer, server_default='0'),
        sa.Column('last_execution_status', sa.String(50), nullable=True),
        
        sa.Column('version', sa.String(50), server_default='1.0.0'),
        sa.Column('is_latest', sa.Boolean, server_default='true'),
        sa.Column('parent_version_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('workflow_definitions.id', ondelete='SET NULL'), nullable=True),
        
        sa.Column('tags', postgresql.JSON, server_default='[]'),
        sa.Column('category', sa.String(255), nullable=True),
        sa.Column('icon', sa.String(100), nullable=True),
        sa.Column('color', sa.String(20), nullable=True),
        
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('documentation_url', sa.String(1000), nullable=True),
        
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('last_executed_at', sa.DateTime(timezone=True), nullable=True),
    )
    
    # Create workflow_executions table
    op.create_table(
        'workflow_executions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('workflow_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('workflow_definitions.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False, index=True),
        
        sa.Column('human_id', sa.String(20), unique=True, nullable=True, index=True),
        
        sa.Column('workflow_version', sa.String(50), nullable=False),
        sa.Column('workflow_snapshot', postgresql.JSON, nullable=True),
        
        sa.Column('status', postgresql.ENUM('pending', 'queued', 'running', 'completed', 'failed', 'stopped', 'waiting', 'timeout', name='workflowexecutionstatus', create_type=False), server_default='pending', index=True),
        
        sa.Column('trigger_source', sa.String(50), nullable=False),
        sa.Column('trigger_data', postgresql.JSON, server_default='{}'),
        sa.Column('trigger_node_id', sa.String(100), nullable=True),
        
        sa.Column('output_data', postgresql.JSON, server_default='{}'),
        sa.Column('current_node_id', sa.String(100), nullable=True),
        sa.Column('execution_path', postgresql.JSON, server_default='[]'),
        
        sa.Column('error_message', sa.Text, nullable=True),
        sa.Column('error_node_id', sa.String(100), nullable=True),
        sa.Column('error_stack', sa.Text, nullable=True),
        sa.Column('retry_count', sa.Integer, server_default='0'),
        
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('duration_ms', sa.Integer, nullable=True),
        
        sa.Column('total_nodes', sa.Integer, server_default='0'),
        sa.Column('completed_nodes', sa.Integer, server_default='0'),
        sa.Column('failed_nodes', sa.Integer, server_default='0'),
        sa.Column('skipped_nodes', sa.Integer, server_default='0'),
        
        sa.Column('triggered_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('execution_context', postgresql.JSON, server_default='{}'),
        sa.Column('notes', sa.Text, nullable=True),
        
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('queued_at', sa.DateTime(timezone=True), nullable=True),
    )
    
    # Create workflow_execution_steps table
    op.create_table(
        'workflow_execution_steps',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('execution_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('workflow_executions.id', ondelete='CASCADE'), nullable=False, index=True),
        
        sa.Column('node_id', sa.String(100), nullable=False),
        sa.Column('node_type', sa.String(100), nullable=False),
        sa.Column('node_name', sa.String(500), nullable=True),
        sa.Column('step_order', sa.Integer, nullable=False),
        
        sa.Column('status', postgresql.ENUM('pending', 'running', 'completed', 'failed', 'skipped', 'waiting', name='workflowstepstatus', create_type=False), server_default='pending', index=True),
        
        sa.Column('input_data', postgresql.JSON, server_default='{}'),
        sa.Column('output_data', postgresql.JSON, server_default='{}'),
        
        sa.Column('error_message', sa.Text, nullable=True),
        sa.Column('error_stack', sa.Text, nullable=True),
        sa.Column('error_type', sa.String(100), nullable=True),
        
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('duration_ms', sa.Integer, nullable=True),
        sa.Column('retry_count', sa.Integer, server_default='0'),
        
        sa.Column('condition_result', sa.Boolean, nullable=True),
        sa.Column('condition_expression', sa.Text, nullable=True),
        
        sa.Column('loop_index', sa.Integer, nullable=True),
        sa.Column('loop_total', sa.Integer, nullable=True),
        
        sa.Column('http_status_code', sa.Integer, nullable=True),
        sa.Column('response_headers', postgresql.JSON, nullable=True),
        
        sa.Column('logs', postgresql.JSON, server_default='[]'),
        
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    
    # Create workflow_credentials table
    op.create_table(
        'workflow_credentials',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('organisation_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organisations.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=True, index=True),
        
        sa.Column('name', sa.String(255), nullable=False, index=True),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('credential_type', postgresql.ENUM('api_key', 'oauth2', 'basic_auth', 'bearer_token', 'custom', name='credentialtype', create_type=False), nullable=False),
        sa.Column('integration_type', sa.String(100), nullable=False),
        
        sa.Column('encrypted_data', sa.LargeBinary, nullable=False),
        sa.Column('metadata', postgresql.JSON, server_default='{}'),
        
        sa.Column('last_used_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('use_count', sa.Integer, server_default='0'),
        
        sa.Column('is_valid', sa.Boolean, server_default='true'),
        sa.Column('last_validation_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('validation_error', sa.Text, nullable=True),
        
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
    )
    
    # Create workflow_schedules table
    op.create_table(
        'workflow_schedules',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('workflow_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('workflow_definitions.id', ondelete='CASCADE'), nullable=False, unique=True, index=True),
        
        sa.Column('cron_expression', sa.String(100), nullable=False),
        sa.Column('timezone', sa.String(100), server_default='UTC'),
        
        sa.Column('enabled', sa.Boolean, server_default='true'),
        
        sa.Column('next_run_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_run_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_run_execution_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('workflow_executions.id', ondelete='SET NULL'), nullable=True),
        sa.Column('last_run_status', sa.String(50), nullable=True),
        
        sa.Column('total_runs', sa.Integer, server_default='0'),
        sa.Column('successful_runs', sa.Integer, server_default='0'),
        sa.Column('failed_runs', sa.Integer, server_default='0'),
        sa.Column('consecutive_failures', sa.Integer, server_default='0'),
        
        sa.Column('max_consecutive_failures', sa.Integer, server_default='5'),
        sa.Column('auto_disabled', sa.Boolean, server_default='false'),
        sa.Column('auto_disabled_at', sa.DateTime(timezone=True), nullable=True),
        
        sa.Column('trigger_data', postgresql.JSON, server_default='{}'),
        
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    
    # Create workflow_webhooks table
    op.create_table(
        'workflow_webhooks',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('workflow_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('workflow_definitions.id', ondelete='CASCADE'), nullable=False, unique=True, index=True),
        
        sa.Column('path', sa.String(255), unique=True, nullable=False, index=True),
        sa.Column('method', sa.String(10), server_default='POST'),
        
        sa.Column('secret_key', sa.String(255), nullable=True),
        sa.Column('require_auth', sa.Boolean, server_default='false'),
        sa.Column('allowed_ips', postgresql.JSON, server_default='[]'),
        
        sa.Column('response_mode', sa.String(50), server_default='immediate'),
        sa.Column('response_data', postgresql.JSON, server_default='{"message": "Workflow triggered"}'),
        
        sa.Column('enabled', sa.Boolean, server_default='true'),
        
        sa.Column('total_calls', sa.Integer, server_default='0'),
        sa.Column('successful_calls', sa.Integer, server_default='0'),
        sa.Column('failed_calls', sa.Integer, server_default='0'),
        sa.Column('last_called_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_caller_ip', sa.String(50), nullable=True),
        
        sa.Column('rate_limit_enabled', sa.Boolean, server_default='false'),
        sa.Column('rate_limit_max_calls', sa.Integer, server_default='100'),
        sa.Column('rate_limit_window_seconds', sa.Integer, server_default='60'),
        
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    
    # Create workflow_templates table
    op.create_table(
        'workflow_templates',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        
        sa.Column('name', sa.String(500), nullable=False, index=True),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('category', sa.String(100), nullable=False, index=True),
        
        sa.Column('nodes_json', postgresql.JSON, server_default='[]'),
        sa.Column('edges_json', postgresql.JSON, server_default='[]'),
        sa.Column('variables', postgresql.JSON, server_default='{}'),
        sa.Column('required_credentials', postgresql.JSON, server_default='[]'),
        
        sa.Column('icon', sa.String(100), nullable=True),
        sa.Column('color', sa.String(20), nullable=True),
        sa.Column('preview_image_url', sa.String(1000), nullable=True),
        
        sa.Column('tags', postgresql.JSON, server_default='[]'),
        sa.Column('difficulty', sa.String(50), server_default='beginner'),
        sa.Column('estimated_setup_time', sa.String(50), nullable=True),
        
        sa.Column('documentation', sa.Text, nullable=True),
        sa.Column('documentation_url', sa.String(1000), nullable=True),
        
        sa.Column('use_count', sa.Integer, server_default='0'),
        sa.Column('rating', sa.Float, nullable=True),
        sa.Column('rating_count', sa.Integer, server_default='0'),
        
        sa.Column('is_public', sa.Boolean, server_default='true'),
        sa.Column('is_featured', sa.Boolean, server_default='false'),
        sa.Column('organisation_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organisations.id', ondelete='CASCADE'), nullable=True),
        
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
    )
    
    # Create indexes for better query performance
    op.create_index('ix_workflow_definitions_status_active', 'workflow_definitions', ['status'], postgresql_where=sa.text("status = 'active'"))
    op.create_index('ix_workflow_executions_status_running', 'workflow_executions', ['status'], postgresql_where=sa.text("status IN ('pending', 'queued', 'running')"))
    op.create_index('ix_workflow_schedules_next_run', 'workflow_schedules', ['next_run_at'], postgresql_where=sa.text("enabled = true"))


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('workflow_templates')
    op.drop_table('workflow_webhooks')
    op.drop_table('workflow_schedules')
    op.drop_table('workflow_credentials')
    op.drop_table('workflow_execution_steps')
    op.drop_table('workflow_executions')
    op.drop_table('workflow_definitions')
    
    # Drop ENUM types
    op.execute("""
        DROP TYPE IF EXISTS credentialtype;
        DROP TYPE IF EXISTS workflowstepstatus;
        DROP TYPE IF EXISTS workflowexecutionstatus;
        DROP TYPE IF EXISTS integrationnodetype;
        DROP TYPE IF EXISTS nodetype;
        DROP TYPE IF EXISTS triggertype;
        DROP TYPE IF EXISTS workflowstatus;
    """)
