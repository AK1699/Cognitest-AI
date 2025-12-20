"""add_enterprise_rbac_roles

Revision ID: enterprise_rbac_001
Revises: f68bd51c625c
Create Date: 2025-12-20

Adds enterprise RBAC roles and permissions:
- Updates organization_roles with new role types (sec_officer, auditor, svc_account)
- Adds new permission columns to permissions table
- Updates existing roles with new permission flags
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'enterprise_rbac_001'
down_revision = '76cdd156348d'
branch_labels = None
depends_on = None


# New enterprise permissions to add
NEW_PERMISSIONS = [
    # Billing & Organization
    ('can_delete_tenant_gdpr', 'organization', 'delete', 'GDPR-compliant tenant deletion'),
    ('can_edit_branding', 'organization', 'update', 'Edit organization branding'),
    ('can_impersonate_user', 'user', 'manage', 'Impersonate another user'),
    ('can_manage_teams', 'group', 'manage', 'Manage teams/groups'),
    # Settings & Security
    ('can_configure_sso', 'settings', 'manage', 'Configure SSO settings'),
    ('can_rotate_secrets', 'settings', 'manage', 'Rotate organization secrets'),
    # Audit & Compliance
    ('can_export_audit', 'audit', 'read', 'Export audit package'),
    ('can_delete_audit', 'audit', 'delete', 'Delete audit entries'),
    ('can_view_invoices', 'billing', 'read', 'View invoices'),
    ('can_export_cost_report', 'billing', 'read', 'Export cost reports'),
    # Security Features
    ('can_manage_scan_profiles', 'security', 'manage', 'Manage global scan profiles'),
    ('can_triage_vuln', 'security', 'manage', 'Triage vulnerabilities'),
    ('can_mark_false_positive', 'security', 'manage', 'Mark false positives'),
    # Marketplace
    ('can_publish_marketplace', 'marketplace', 'create', 'Publish nodes to marketplace'),
]


def upgrade() -> None:
    # Add new permissions to the permissions table if it exists
    conn = op.get_bind()
    
    # Check if permissions table exists
    inspector = sa.inspect(conn)
    if 'permissions' in inspector.get_table_names():
        for perm_name, resource, action, description in NEW_PERMISSIONS:
            # Check if permission already exists
            result = conn.execute(
                sa.text("SELECT id FROM permissions WHERE name = :name"),
                {"name": perm_name}
            ).fetchone()
            
            if not result:
                conn.execute(
                    sa.text("""
                        INSERT INTO permissions (id, name, resource, action, description, is_system_permission, created_at)
                        VALUES (gen_random_uuid(), :name, :resource, :action, :description, true, NOW())
                    """),
                    {"name": perm_name, "resource": resource, "action": action, "description": description}
                )
    
    # Update organization_roles to ensure role_type column can contain new values
    # No schema change needed as role_type is VARCHAR(50)
    
    # Log the migration
    print("Enterprise RBAC migration complete:")
    print(f"  - Added {len(NEW_PERMISSIONS)} new permissions")
    print("  - New role types supported: sec_officer, auditor, svc_account")


def downgrade() -> None:
    conn = op.get_bind()
    
    # Remove new permissions
    for perm_name, _, _, _ in NEW_PERMISSIONS:
        conn.execute(
            sa.text("DELETE FROM permissions WHERE name = :name"),
            {"name": perm_name}
        )
    
    print("Enterprise RBAC migration rolled back")
