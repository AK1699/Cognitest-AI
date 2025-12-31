"""
add security advanced tables

Revision ID: security_advanced_001
Revises: 
Create Date: 2024-12-31

Creates tables for SAST, SCA, IAST, RASP, SBOM, Policy Engine, CI/CD, and Reports
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime


# revision identifiers
revision = 'security_advanced_001'
down_revision = None  # Update this to your latest migration if needed
branch_labels = None
depends_on = None


def upgrade() -> None:
    # SAST Scans
    op.create_table(
        'sast_scans',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('project_id', UUID(as_uuid=True), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('organisation_id', UUID(as_uuid=True), sa.ForeignKey('organisations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('security_scan_id', UUID(as_uuid=True), sa.ForeignKey('security_scans.id', ondelete='CASCADE'), nullable=True),
        sa.Column('human_id', sa.String(20), unique=True, nullable=True),
        sa.Column('name', sa.String(500), nullable=False),
        sa.Column('repo_url', sa.String(2000), nullable=True),
        sa.Column('repo_branch', sa.String(255), nullable=True),
        sa.Column('commit_sha', sa.String(100), nullable=True),
        sa.Column('local_path', sa.String(2000), nullable=True),
        sa.Column('engines', sa.JSON, default=list),
        sa.Column('languages', sa.JSON, default=list),
        sa.Column('ruleset', sa.String(100), default='default'),
        sa.Column('exclude_patterns', sa.JSON, default=list),
        sa.Column('status', sa.String(50), default='pending'),
        sa.Column('total_findings', sa.Integer, default=0),
        sa.Column('critical_count', sa.Integer, default=0),
        sa.Column('high_count', sa.Integer, default=0),
        sa.Column('medium_count', sa.Integer, default=0),
        sa.Column('low_count', sa.Integer, default=0),
        sa.Column('info_count', sa.Integer, default=0),
        sa.Column('files_scanned', sa.Integer, default=0),
        sa.Column('lines_scanned', sa.Integer, default=0),
        sa.Column('duration_ms', sa.Integer, nullable=True),
        sa.Column('error_message', sa.Text, nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('created_by', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
    )
    op.create_index('ix_sast_scans_project_id', 'sast_scans', ['project_id'])
    op.create_index('ix_sast_scans_status', 'sast_scans', ['status'])
    
    # SAST Findings
    op.create_table(
        'sast_findings',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('scan_id', UUID(as_uuid=True), sa.ForeignKey('sast_scans.id', ondelete='CASCADE'), nullable=False),
        sa.Column('human_id', sa.String(20), unique=True, nullable=True),
        sa.Column('rule_id', sa.String(255), nullable=False),
        sa.Column('rule_name', sa.String(500), nullable=False),
        sa.Column('engine', sa.String(50), nullable=False),
        sa.Column('severity', sa.String(50), nullable=False),
        sa.Column('confidence', sa.String(50), nullable=True),
        sa.Column('file_path', sa.String(2000), nullable=False),
        sa.Column('start_line', sa.Integer, nullable=False),
        sa.Column('end_line', sa.Integer, nullable=True),
        sa.Column('start_column', sa.Integer, nullable=True),
        sa.Column('end_column', sa.Integer, nullable=True),
        sa.Column('code_snippet', sa.Text, nullable=True),
        sa.Column('fingerprint', sa.String(255), nullable=True),
        sa.Column('category', sa.String(255), nullable=True),
        sa.Column('cwe_id', sa.String(50), nullable=True),
        sa.Column('owasp_id', sa.String(50), nullable=True),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('remediation', sa.Text, nullable=True),
        sa.Column('references', sa.JSON, default=list),
        sa.Column('ai_fix_suggestion', sa.Text, nullable=True),
        sa.Column('ai_explanation', sa.Text, nullable=True),
        sa.Column('status', sa.String(50), default='open'),
        sa.Column('suppression_reason', sa.Text, nullable=True),
        sa.Column('suppression_expires', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_index('ix_sast_findings_scan_id', 'sast_findings', ['scan_id'])
    op.create_index('ix_sast_findings_severity', 'sast_findings', ['severity'])
    
    # SCA Scans
    op.create_table(
        'sca_scans',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('project_id', UUID(as_uuid=True), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('organisation_id', UUID(as_uuid=True), sa.ForeignKey('organisations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('security_scan_id', UUID(as_uuid=True), sa.ForeignKey('security_scans.id', ondelete='CASCADE'), nullable=True),
        sa.Column('human_id', sa.String(20), unique=True, nullable=True),
        sa.Column('name', sa.String(500), nullable=False),
        sa.Column('manifest_files', sa.JSON, default=list),
        sa.Column('repo_url', sa.String(2000), nullable=True),
        sa.Column('engines', sa.JSON, default=list),
        sa.Column('check_licenses', sa.Boolean, default=True),
        sa.Column('check_vulnerabilities', sa.Boolean, default=True),
        sa.Column('status', sa.String(50), default='pending'),
        sa.Column('total_dependencies', sa.Integer, default=0),
        sa.Column('vulnerable_dependencies', sa.Integer, default=0),
        sa.Column('license_issues', sa.Integer, default=0),
        sa.Column('critical_vulns', sa.Integer, default=0),
        sa.Column('high_vulns', sa.Integer, default=0),
        sa.Column('medium_vulns', sa.Integer, default=0),
        sa.Column('low_vulns', sa.Integer, default=0),
        sa.Column('duration_ms', sa.Integer, nullable=True),
        sa.Column('error_message', sa.Text, nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('created_by', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
    )
    op.create_index('ix_sca_scans_project_id', 'sca_scans', ['project_id'])
    
    # SCA Findings
    op.create_table(
        'sca_findings',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('scan_id', UUID(as_uuid=True), sa.ForeignKey('sca_scans.id', ondelete='CASCADE'), nullable=False),
        sa.Column('package_name', sa.String(500), nullable=False),
        sa.Column('package_version', sa.String(100), nullable=False),
        sa.Column('package_ecosystem', sa.String(50), nullable=False),
        sa.Column('manifest_file', sa.String(2000), nullable=True),
        sa.Column('is_vulnerability', sa.Boolean, default=True),
        sa.Column('cve_id', sa.String(50), nullable=True),
        sa.Column('ghsa_id', sa.String(100), nullable=True),
        sa.Column('severity', sa.String(50), nullable=False),
        sa.Column('cvss_score', sa.Float, nullable=True),
        sa.Column('cvss_vector', sa.String(255), nullable=True),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('fixed_version', sa.String(100), nullable=True),
        sa.Column('upgrade_path', sa.JSON, nullable=True),
        sa.Column('is_direct', sa.Boolean, default=True),
        sa.Column('is_license_issue', sa.Boolean, default=False),
        sa.Column('license_name', sa.String(255), nullable=True),
        sa.Column('license_risk', sa.String(50), nullable=True),
        sa.Column('references', sa.JSON, default=list),
        sa.Column('status', sa.String(50), default='open'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_sca_findings_scan_id', 'sca_findings', ['scan_id'])
    op.create_index('ix_sca_findings_severity', 'sca_findings', ['severity'])
    
    # IAST Sessions
    op.create_table(
        'iast_sessions',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('project_id', UUID(as_uuid=True), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('organisation_id', UUID(as_uuid=True), sa.ForeignKey('organisations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('human_id', sa.String(20), unique=True, nullable=True),
        sa.Column('name', sa.String(500), nullable=False),
        sa.Column('app_url', sa.String(2000), nullable=False),
        sa.Column('app_name', sa.String(255), nullable=True),
        sa.Column('status', sa.String(50), default='inactive'),
        sa.Column('session_token', sa.String(255), unique=True, nullable=True),
        sa.Column('config', sa.JSON, default=dict),
        sa.Column('detect_sql_injection', sa.Boolean, default=True),
        sa.Column('detect_xss', sa.Boolean, default=True),
        sa.Column('detect_path_traversal', sa.Boolean, default=True),
        sa.Column('detect_command_injection', sa.Boolean, default=True),
        sa.Column('requests_analyzed', sa.Integer, default=0),
        sa.Column('vulnerabilities_found', sa.Integer, default=0),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('ended_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('created_by', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
    )
    op.create_index('ix_iast_sessions_project_id', 'iast_sessions', ['project_id'])
    
    # IAST Findings
    op.create_table(
        'iast_findings',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('session_id', UUID(as_uuid=True), sa.ForeignKey('iast_sessions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('vulnerability_type', sa.String(255), nullable=False),
        sa.Column('severity', sa.String(50), nullable=False),
        sa.Column('http_method', sa.String(20), nullable=True),
        sa.Column('request_url', sa.String(2000), nullable=True),
        sa.Column('request_headers', sa.JSON, nullable=True),
        sa.Column('request_body', sa.Text, nullable=True),
        sa.Column('response_status', sa.Integer, nullable=True),
        sa.Column('response_body', sa.Text, nullable=True),
        sa.Column('tainted_input', sa.Text, nullable=True),
        sa.Column('sink_location', sa.String(500), nullable=True),
        sa.Column('data_flow', sa.JSON, nullable=True),
        sa.Column('source_file', sa.String(2000), nullable=True),
        sa.Column('source_line', sa.Integer, nullable=True),
        sa.Column('source_function', sa.String(255), nullable=True),
        sa.Column('stack_trace', sa.Text, nullable=True),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('remediation', sa.Text, nullable=True),
        sa.Column('test_case_id', UUID(as_uuid=True), nullable=True),
        sa.Column('status', sa.String(50), default='open'),
        sa.Column('detected_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_iast_findings_session_id', 'iast_findings', ['session_id'])
    
    # RASP Configs
    op.create_table(
        'rasp_configs',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('project_id', UUID(as_uuid=True), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('organisation_id', UUID(as_uuid=True), sa.ForeignKey('organisations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(500), nullable=False),
        sa.Column('is_enabled', sa.Boolean, default=True),
        sa.Column('block_sql_injection', sa.Boolean, default=True),
        sa.Column('block_xss', sa.Boolean, default=True),
        sa.Column('block_command_injection', sa.Boolean, default=True),
        sa.Column('block_path_traversal', sa.Boolean, default=True),
        sa.Column('block_ssrf', sa.Boolean, default=True),
        sa.Column('enable_rate_limiting', sa.Boolean, default=True),
        sa.Column('rate_limit_requests', sa.Integer, default=100),
        sa.Column('rate_limit_window', sa.Integer, default=60),
        sa.Column('alert_on_block', sa.Boolean, default=True),
        sa.Column('alert_emails', sa.JSON, default=list),
        sa.Column('webhook_url', sa.String(2000), nullable=True),
        sa.Column('custom_block_patterns', sa.JSON, default=list),
        sa.Column('whitelist_ips', sa.JSON, default=list),
        sa.Column('whitelist_paths', sa.JSON, default=list),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_index('ix_rasp_configs_project_id', 'rasp_configs', ['project_id'])
    
    # RASP Events
    op.create_table(
        'rasp_events',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('project_id', UUID(as_uuid=True), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('config_id', UUID(as_uuid=True), sa.ForeignKey('rasp_configs.id', ondelete='SET NULL'), nullable=True),
        sa.Column('attack_type', sa.String(50), nullable=False),
        sa.Column('severity', sa.String(50), nullable=False),
        sa.Column('was_blocked', sa.Boolean, default=True),
        sa.Column('source_ip', sa.String(50), nullable=True),
        sa.Column('user_agent', sa.String(1000), nullable=True),
        sa.Column('http_method', sa.String(20), nullable=True),
        sa.Column('request_path', sa.String(2000), nullable=True),
        sa.Column('request_headers', sa.JSON, nullable=True),
        sa.Column('request_body', sa.Text, nullable=True),
        sa.Column('attack_payload', sa.Text, nullable=True),
        sa.Column('matched_pattern', sa.String(500), nullable=True),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('occurred_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_rasp_events_project_id', 'rasp_events', ['project_id'])
    op.create_index('ix_rasp_events_occurred_at', 'rasp_events', ['occurred_at'])
    
    # SBOMs
    op.create_table(
        'sboms',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('project_id', UUID(as_uuid=True), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('organisation_id', UUID(as_uuid=True), sa.ForeignKey('organisations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('human_id', sa.String(20), unique=True, nullable=True),
        sa.Column('name', sa.String(500), nullable=False),
        sa.Column('version', sa.String(100), nullable=True),
        sa.Column('format', sa.String(50), nullable=False),
        sa.Column('spec_version', sa.String(50), nullable=True),
        sa.Column('source_type', sa.String(50), nullable=True),
        sa.Column('source_path', sa.String(2000), nullable=True),
        sa.Column('total_components', sa.Integer, default=0),
        sa.Column('direct_dependencies', sa.Integer, default=0),
        sa.Column('transitive_dependencies', sa.Integer, default=0),
        sa.Column('licenses_identified', sa.Integer, default=0),
        sa.Column('high_risk_licenses', sa.Integer, default=0),
        sa.Column('vulnerable_components', sa.Integer, default=0),
        sa.Column('raw_content', sa.Text, nullable=True),
        sa.Column('generated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('created_by', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
    )
    op.create_index('ix_sboms_project_id', 'sboms', ['project_id'])
    
    # SBOM Components
    op.create_table(
        'sbom_components',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('sbom_id', UUID(as_uuid=True), sa.ForeignKey('sboms.id', ondelete='CASCADE'), nullable=False),
        sa.Column('component_type', sa.String(50), nullable=False),
        sa.Column('name', sa.String(500), nullable=False),
        sa.Column('version', sa.String(100), nullable=True),
        sa.Column('purl', sa.String(1000), nullable=True),
        sa.Column('cpe', sa.String(500), nullable=True),
        sa.Column('swid', sa.String(500), nullable=True),
        sa.Column('ecosystem', sa.String(50), nullable=True),
        sa.Column('license_id', sa.String(100), nullable=True),
        sa.Column('license_name', sa.String(255), nullable=True),
        sa.Column('license_risk', sa.String(50), nullable=True),
        sa.Column('is_direct', sa.Boolean, default=True),
        sa.Column('parent_component', sa.String(500), nullable=True),
        sa.Column('is_vulnerable', sa.Boolean, default=False),
        sa.Column('vulnerability_count', sa.Integer, default=0),
        sa.Column('hashes', sa.JSON, default=dict),
        sa.Column('external_references', sa.JSON, default=list),
    )
    op.create_index('ix_sbom_components_sbom_id', 'sbom_components', ['sbom_id'])
    
    # Security Policies
    op.create_table(
        'security_policies',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('project_id', UUID(as_uuid=True), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=True),
        sa.Column('organisation_id', UUID(as_uuid=True), sa.ForeignKey('organisations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(500), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('is_default', sa.Boolean, default=False),
        sa.Column('is_enabled', sa.Boolean, default=True),
        sa.Column('max_critical', sa.Integer, default=0),
        sa.Column('max_high', sa.Integer, default=5),
        sa.Column('max_medium', sa.Integer, default=20),
        sa.Column('max_low', sa.Integer, nullable=True),
        sa.Column('fail_on_threshold_breach', sa.Boolean, default=True),
        sa.Column('require_sast_scan', sa.Boolean, default=False),
        sa.Column('require_sca_scan', sa.Boolean, default=False),
        sa.Column('require_secret_scan', sa.Boolean, default=True),
        sa.Column('block_high_risk_licenses', sa.Boolean, default=False),
        sa.Column('allowed_licenses', sa.JSON, default=list),
        sa.Column('blocked_licenses', sa.JSON, default=list),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
        sa.Column('created_by', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
    )
    op.create_index('ix_security_policies_project_id', 'security_policies', ['project_id'])
    op.create_index('ix_security_policies_organisation_id', 'security_policies', ['organisation_id'])
    
    # Policy Rules
    op.create_table(
        'policy_rules',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('policy_id', UUID(as_uuid=True), sa.ForeignKey('security_policies.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(500), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('is_enabled', sa.Boolean, default=True),
        sa.Column('rule_type', sa.String(50), nullable=False),
        sa.Column('pattern', sa.String(2000), nullable=True),
        sa.Column('pattern_type', sa.String(50), nullable=True),
        sa.Column('applies_to', sa.JSON, default=list),
        sa.Column('file_patterns', sa.JSON, default=list),
        sa.Column('action', sa.String(50), default='block'),
        sa.Column('severity_override', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_policy_rules_policy_id', 'policy_rules', ['policy_id'])
    
    # Policy Suppressions
    op.create_table(
        'policy_suppressions',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('policy_id', UUID(as_uuid=True), sa.ForeignKey('security_policies.id', ondelete='CASCADE'), nullable=False),
        sa.Column('suppression_type', sa.String(50), nullable=False),
        sa.Column('suppression_value', sa.String(500), nullable=False),
        sa.Column('file_pattern', sa.String(500), nullable=True),
        sa.Column('reason', sa.Text, nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_permanent', sa.Boolean, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('created_by', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
    )
    
    # CI/CD Pipelines
    op.create_table(
        'cicd_pipelines',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('project_id', UUID(as_uuid=True), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('organisation_id', UUID(as_uuid=True), sa.ForeignKey('organisations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(500), nullable=False),
        sa.Column('provider', sa.String(50), nullable=False),
        sa.Column('webhook_token', sa.String(255), unique=True, nullable=True),
        sa.Column('webhook_secret', sa.String(255), nullable=True),
        sa.Column('trigger_on_push', sa.Boolean, default=True),
        sa.Column('trigger_on_pr', sa.Boolean, default=True),
        sa.Column('trigger_branches', sa.JSON, default=list),
        sa.Column('run_sast', sa.Boolean, default=True),
        sa.Column('run_sca', sa.Boolean, default=True),
        sa.Column('run_secrets', sa.Boolean, default=True),
        sa.Column('policy_id', UUID(as_uuid=True), sa.ForeignKey('security_policies.id', ondelete='SET NULL'), nullable=True),
        sa.Column('total_runs', sa.Integer, default=0),
        sa.Column('last_run_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_enabled', sa.Boolean, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('created_by', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
    )
    op.create_index('ix_cicd_pipelines_project_id', 'cicd_pipelines', ['project_id'])
    op.create_index('ix_cicd_pipelines_webhook_token', 'cicd_pipelines', ['webhook_token'])
    
    # CI/CD Pipeline Runs
    op.create_table(
        'cicd_pipeline_runs',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('pipeline_id', UUID(as_uuid=True), sa.ForeignKey('cicd_pipelines.id', ondelete='CASCADE'), nullable=False),
        sa.Column('commit_sha', sa.String(100), nullable=True),
        sa.Column('branch', sa.String(255), nullable=True),
        sa.Column('pr_number', sa.Integer, nullable=True),
        sa.Column('author', sa.String(255), nullable=True),
        sa.Column('trigger_type', sa.String(50), nullable=False),
        sa.Column('status', sa.String(50), default='pending'),
        sa.Column('sast_scan_id', UUID(as_uuid=True), sa.ForeignKey('sast_scans.id', ondelete='SET NULL'), nullable=True),
        sa.Column('sca_scan_id', UUID(as_uuid=True), sa.ForeignKey('sca_scans.id', ondelete='SET NULL'), nullable=True),
        sa.Column('gate_passed', sa.Boolean, nullable=True),
        sa.Column('gate_details', sa.JSON, nullable=True),
        sa.Column('sarif_output', sa.Text, nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('duration_ms', sa.Integer, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_cicd_pipeline_runs_pipeline_id', 'cicd_pipeline_runs', ['pipeline_id'])
    
    # Security Reports
    op.create_table(
        'security_reports',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('project_id', UUID(as_uuid=True), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('organisation_id', UUID(as_uuid=True), sa.ForeignKey('organisations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(500), nullable=False),
        sa.Column('report_type', sa.String(50), nullable=False),
        sa.Column('format', sa.String(50), nullable=False),
        sa.Column('scan_ids', sa.JSON, default=list),
        sa.Column('date_from', sa.DateTime(timezone=True), nullable=True),
        sa.Column('date_to', sa.DateTime(timezone=True), nullable=True),
        sa.Column('file_path', sa.String(2000), nullable=True),
        sa.Column('file_size', sa.Integer, nullable=True),
        sa.Column('status', sa.String(50), default='pending'),
        sa.Column('error_message', sa.Text, nullable=True),
        sa.Column('generated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('created_by', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
    )
    op.create_index('ix_security_reports_project_id', 'security_reports', ['project_id'])
    
    # Security Tickets (Issue Tracker Integration)
    op.create_table(
        'security_tickets',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('project_id', UUID(as_uuid=True), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('finding_type', sa.String(50), nullable=False),
        sa.Column('finding_id', UUID(as_uuid=True), nullable=False),
        sa.Column('tracker_type', sa.String(50), nullable=False),
        sa.Column('external_id', sa.String(255), nullable=False),
        sa.Column('external_url', sa.String(2000), nullable=True),
        sa.Column('external_status', sa.String(100), nullable=True),
        sa.Column('last_synced_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('sync_error', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_security_tickets_project_id', 'security_tickets', ['project_id'])
    op.create_index('ix_security_tickets_finding_id', 'security_tickets', ['finding_id'])


def downgrade() -> None:
    op.drop_table('security_tickets')
    op.drop_table('security_reports')
    op.drop_table('cicd_pipeline_runs')
    op.drop_table('cicd_pipelines')
    op.drop_table('policy_suppressions')
    op.drop_table('policy_rules')
    op.drop_table('security_policies')
    op.drop_table('sbom_components')
    op.drop_table('sboms')
    op.drop_table('rasp_events')
    op.drop_table('rasp_configs')
    op.drop_table('iast_findings')
    op.drop_table('iast_sessions')
    op.drop_table('sca_findings')
    op.drop_table('sca_scans')
    op.drop_table('sast_findings')
    op.drop_table('sast_scans')
