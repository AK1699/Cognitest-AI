"""Add security testing tables

Revision ID: add_security_testing_tables
Revises: c22c105dde5c
Create Date: 2024-12-28

Enterprise Security Testing Module Tables:
- security_scans: Main scan entity
- scan_targets: URLs, repos, assets being scanned
- vulnerabilities: Detected security issues
- compliance_checks: Compliance framework mapping
- scan_schedules: Automated recurring scans
- security_assets: Registered assets for monitoring
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_security_testing_tables'
down_revision = 'c22c105dde5c'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enums
    scantype_enum = postgresql.ENUM(
        'url_security', 'repo_security', 'vapt', 'compliance', 'api_security', 'network_security',
        name='scantype', create_type=False
    )
    scanstatus_enum = postgresql.ENUM(
        'pending', 'queued', 'running', 'completed', 'failed', 'cancelled', 'paused',
        name='scanstatus', create_type=False
    )
    severitylevel_enum = postgresql.ENUM(
        'critical', 'high', 'medium', 'low', 'info',
        name='severitylevel', create_type=False
    )
    vulnerabilitycategory_enum = postgresql.ENUM(
        'A01:2021-Broken Access Control', 'A02:2021-Cryptographic Failures', 'A03:2021-Injection',
        'A04:2021-Insecure Design', 'A05:2021-Security Misconfiguration',
        'A06:2021-Vulnerable and Outdated Components', 'A07:2021-Identification and Authentication Failures',
        'A08:2021-Software and Data Integrity Failures', 'A09:2021-Security Logging and Monitoring Failures',
        'A10:2021-Server-Side Request Forgery', 'SSL/TLS Issues', 'DNS Security', 'HTTP Security Headers',
        'Subdomain Issues', 'Open Port Exposure', 'Secret Exposure', 'Dependency Vulnerability',
        'License Violation', 'Code Quality Issue', 'Firewall Configuration', 'Network Exposure', 'Other',
        name='vulnerabilitycategory', create_type=False
    )
    complianceframework_enum = postgresql.ENUM(
        'ISO 27001', 'SOC 2', 'GDPR', 'PCI DSS', 'HIPAA', 'NIST CSF', 'CIS Controls',
        name='complianceframework', create_type=False
    )
    compliancestatus_enum = postgresql.ENUM(
        'compliant', 'non_compliant', 'partial', 'not_applicable', 'not_assessed',
        name='compliancestatus', create_type=False
    )
    targettype_enum = postgresql.ENUM(
        'url', 'domain', 'ip', 'repository', 'api_endpoint', 'network_range',
        name='targettype', create_type=False
    )
    schedulefrequency_enum = postgresql.ENUM(
        'once', 'hourly', 'daily', 'weekly', 'monthly', 'custom',
        name='schedulefrequency', create_type=False
    )
    
    # Create enums in database
    scantype_enum.create(op.get_bind(), checkfirst=True)
    scanstatus_enum.create(op.get_bind(), checkfirst=True)
    severitylevel_enum.create(op.get_bind(), checkfirst=True)
    vulnerabilitycategory_enum.create(op.get_bind(), checkfirst=True)
    complianceframework_enum.create(op.get_bind(), checkfirst=True)
    compliancestatus_enum.create(op.get_bind(), checkfirst=True)
    targettype_enum.create(op.get_bind(), checkfirst=True)
    schedulefrequency_enum.create(op.get_bind(), checkfirst=True)
    
    # Create security_scans table
    op.create_table(
        'security_scans',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('organisation_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organisations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('human_id', sa.String(15), unique=True, nullable=True),
        sa.Column('name', sa.String(500), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('scan_type', scantype_enum, nullable=False),
        sa.Column('status', scanstatus_enum, default='pending'),
        sa.Column('progress_percentage', sa.Integer, default=0),
        sa.Column('config', postgresql.JSON, default={}),
        sa.Column('scan_depth', sa.String(50), default='standard'),
        sa.Column('enable_active_scanning', sa.Boolean, default=False),
        sa.Column('total_vulnerabilities', sa.Integer, default=0),
        sa.Column('critical_count', sa.Integer, default=0),
        sa.Column('high_count', sa.Integer, default=0),
        sa.Column('medium_count', sa.Integer, default=0),
        sa.Column('low_count', sa.Integer, default=0),
        sa.Column('info_count', sa.Integer, default=0),
        sa.Column('risk_score', sa.Float, default=0.0),
        sa.Column('risk_grade', sa.String(5), nullable=True),
        sa.Column('duration_ms', sa.Integer, nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('error_message', sa.Text, nullable=True),
        sa.Column('error_details', postgresql.JSON, nullable=True),
        sa.Column('tags', postgresql.JSON, default=[]),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('triggered_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('trigger_source', sa.String(100), default='manual'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_index('ix_security_scans_project_id', 'security_scans', ['project_id'])
    op.create_index('ix_security_scans_organisation_id', 'security_scans', ['organisation_id'])
    op.create_index('ix_security_scans_status', 'security_scans', ['status'])
    op.create_index('ix_security_scans_scan_type', 'security_scans', ['scan_type'])
    
    # Create scan_targets table
    op.create_table(
        'scan_targets',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('scan_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('security_scans.id', ondelete='CASCADE'), nullable=False),
        sa.Column('target_type', targettype_enum, nullable=False),
        sa.Column('target_value', sa.String(2000), nullable=False),
        sa.Column('target_name', sa.String(500), nullable=True),
        sa.Column('status', scanstatus_enum, default='pending'),
        sa.Column('ssl_certificate', postgresql.JSON, nullable=True),
        sa.Column('ssl_grade', sa.String(5), nullable=True),
        sa.Column('ssl_expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('open_ports', postgresql.JSON, default=[]),
        sa.Column('http_headers', postgresql.JSON, nullable=True),
        sa.Column('subdomains_discovered', postgresql.JSON, default=[]),
        sa.Column('dns_records', postgresql.JSON, nullable=True),
        sa.Column('repo_branch', sa.String(255), nullable=True),
        sa.Column('last_commit_sha', sa.String(100), nullable=True),
        sa.Column('dependencies_count', sa.Integer, nullable=True),
        sa.Column('secrets_found', sa.Integer, default=0),
        sa.Column('vulnerability_count', sa.Integer, default=0),
        sa.Column('risk_score', sa.Float, default=0.0),
        sa.Column('scanned_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    
    # Create vulnerabilities table
    op.create_table(
        'vulnerabilities',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('scan_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('security_scans.id', ondelete='CASCADE'), nullable=False),
        sa.Column('target_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('scan_targets.id', ondelete='CASCADE'), nullable=True),
        sa.Column('human_id', sa.String(15), unique=True, nullable=True),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('description', sa.Text, nullable=False),
        sa.Column('category', vulnerabilitycategory_enum, nullable=False),
        sa.Column('severity', severitylevel_enum, nullable=False),
        sa.Column('cvss_score', sa.Float, nullable=True),
        sa.Column('cvss_vector', sa.String(255), nullable=True),
        sa.Column('affected_component', sa.String(500), nullable=True),
        sa.Column('affected_url', sa.String(2000), nullable=True),
        sa.Column('affected_file', sa.String(1000), nullable=True),
        sa.Column('affected_line', sa.Integer, nullable=True),
        sa.Column('evidence', sa.Text, nullable=True),
        sa.Column('request', sa.Text, nullable=True),
        sa.Column('response', sa.Text, nullable=True),
        sa.Column('payload', sa.Text, nullable=True),
        sa.Column('cve_id', sa.String(50), nullable=True),
        sa.Column('cwe_id', sa.String(50), nullable=True),
        sa.Column('package_name', sa.String(255), nullable=True),
        sa.Column('package_version', sa.String(100), nullable=True),
        sa.Column('fixed_version', sa.String(100), nullable=True),
        sa.Column('remediation', sa.Text, nullable=True),
        sa.Column('remediation_complexity', sa.String(50), nullable=True),
        sa.Column('remediation_priority', sa.Integer, nullable=True),
        sa.Column('ai_remediation', sa.Text, nullable=True),
        sa.Column('ai_code_fix', sa.Text, nullable=True),
        sa.Column('references', postgresql.JSON, default=[]),
        sa.Column('is_false_positive', sa.Boolean, default=False),
        sa.Column('is_verified', sa.Boolean, default=False),
        sa.Column('is_resolved', sa.Boolean, default=False),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('resolved_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('discovered_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_index('ix_vulnerabilities_scan_id', 'vulnerabilities', ['scan_id'])
    op.create_index('ix_vulnerabilities_severity', 'vulnerabilities', ['severity'])
    op.create_index('ix_vulnerabilities_category', 'vulnerabilities', ['category'])
    
    # Create compliance_checks table
    op.create_table(
        'compliance_checks',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('scan_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('security_scans.id', ondelete='CASCADE'), nullable=False),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('framework', complianceframework_enum, nullable=False),
        sa.Column('control_id', sa.String(50), nullable=False),
        sa.Column('control_name', sa.String(500), nullable=False),
        sa.Column('control_description', sa.Text, nullable=True),
        sa.Column('status', compliancestatus_enum, default='not_assessed'),
        sa.Column('assessment_notes', sa.Text, nullable=True),
        sa.Column('evidence_provided', postgresql.JSON, default=[]),
        sa.Column('gaps_identified', postgresql.JSON, default=[]),
        sa.Column('related_vulnerabilities', postgresql.JSON, default=[]),
        sa.Column('inherent_risk', sa.String(50), nullable=True),
        sa.Column('residual_risk', sa.String(50), nullable=True),
        sa.Column('assessed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('next_review_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_index('ix_compliance_checks_project_id', 'compliance_checks', ['project_id'])
    op.create_index('ix_compliance_checks_framework', 'compliance_checks', ['framework'])
    
    # Create scan_schedules table
    op.create_table(
        'scan_schedules',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('organisation_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organisations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(500), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('scan_type', scantype_enum, nullable=False),
        sa.Column('targets', postgresql.JSON, nullable=False),
        sa.Column('scan_config', postgresql.JSON, default={}),
        sa.Column('frequency', schedulefrequency_enum, nullable=False),
        sa.Column('cron_expression', sa.String(100), nullable=True),
        sa.Column('timezone', sa.String(100), default='UTC'),
        sa.Column('is_enabled', sa.Boolean, default=True),
        sa.Column('last_run_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('next_run_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_scan_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('security_scans.id', ondelete='SET NULL'), nullable=True),
        sa.Column('total_runs', sa.Integer, default=0),
        sa.Column('notify_on_complete', sa.Boolean, default=True),
        sa.Column('notify_on_critical', sa.Boolean, default=True),
        sa.Column('notification_emails', postgresql.JSON, default=[]),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    
    # Create security_assets table
    op.create_table(
        'security_assets',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('organisation_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organisations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(500), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('asset_type', targettype_enum, nullable=False),
        sa.Column('asset_value', sa.String(2000), nullable=False),
        sa.Column('criticality', sa.String(50), default='medium'),
        sa.Column('data_classification', sa.String(100), nullable=True),
        sa.Column('owner', sa.String(255), nullable=True),
        sa.Column('current_risk_score', sa.Float, default=0.0),
        sa.Column('last_scan_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_scan_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('security_scans.id', ondelete='SET NULL'), nullable=True),
        sa.Column('vulnerability_count', sa.Integer, default=0),
        sa.Column('monitoring_enabled', sa.Boolean, default=True),
        sa.Column('ssl_monitoring_enabled', sa.Boolean, default=True),
        sa.Column('tags', postgresql.JSON, default=[]),
        sa.Column('custom_attributes', postgresql.JSON, default={}),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
    )


def downgrade() -> None:
    # Drop tables
    op.drop_table('security_assets')
    op.drop_table('scan_schedules')
    op.drop_table('compliance_checks')
    op.drop_table('vulnerabilities')
    op.drop_table('scan_targets')
    op.drop_table('security_scans')
    
    # Drop enums
    op.execute('DROP TYPE IF EXISTS schedulefrequency')
    op.execute('DROP TYPE IF EXISTS targettype')
    op.execute('DROP TYPE IF EXISTS compliancestatus')
    op.execute('DROP TYPE IF EXISTS complianceframework')
    op.execute('DROP TYPE IF EXISTS vulnerabilitycategory')
    op.execute('DROP TYPE IF EXISTS severitylevel')
    op.execute('DROP TYPE IF EXISTS scanstatus')
    op.execute('DROP TYPE IF EXISTS scantype')
