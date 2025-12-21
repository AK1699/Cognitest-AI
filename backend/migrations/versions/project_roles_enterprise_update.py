"""
Project Roles Enterprise Update Migration

This migration:
1. Updates existing legacy project roles to new enterprise role types
2. Adds new enterprise project roles to organizations that don't have them
3. Updates user role assignments to use new role types

Revision ID: project_roles_enterprise_update
Revises: enterprise_rbac_001
Create Date: 2025-12-20
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid
from datetime import datetime

# revision identifiers
revision = 'project_roles_enterprise_update'
down_revision = 'enterprise_rbac_001'
branch_labels = None
depends_on = None

# Legacy to Enterprise role mapping
LEGACY_ROLE_MAPPING = {
    "owner": "project_admin",
    "admin": "project_admin",
    "qa_manager": "qa_lead",
    "qa_lead": "qa_lead",
    "qa_engineer": "tester",
    "product_owner": "dev_ro",
    "viewer": "viewer",
}

# New enterprise project roles
ENTERPRISE_PROJECT_ROLES = [
    {
        "name": "Project Admin",
        "role_type": "project_admin",
        "description": "Full project control - manages all test artifacts, approvals, automation, and security scans",
        "is_system_role": True,
    },
    {
        "name": "QA Lead",
        "role_type": "qa_lead",
        "description": "Leads testers, approves test cases, creates test cycles, and validates AI-generated fixes",
        "is_system_role": True,
    },
    {
        "name": "Tester",
        "role_type": "tester",
        "description": "Creates and executes tests, records evidence, runs automation flows",
        "is_system_role": True,
    },
    {
        "name": "Automation Engineer",
        "role_type": "auto_eng",
        "description": "Manages automation flows, k6 scripts, accepts self-healing suggestions",
        "is_system_role": True,
    },
    {
        "name": "Developer",
        "role_type": "dev_ro",
        "description": "Read-only access to test artifacts, can record evidence and view dashboards",
        "is_system_role": True,
    },
    {
        "name": "Viewer",
        "role_type": "viewer",
        "description": "Read-only access to view tests, results, and dashboards",
        "is_system_role": True,
    },
]


def upgrade():
    """Upgrade to enterprise project roles"""
    conn = op.get_bind()
    
    # Step 1: Update existing legacy roles to new role_types
    print("Step 1: Mapping legacy role_types to enterprise role_types...")
    for old_type, new_type in LEGACY_ROLE_MAPPING.items():
        result = conn.execute(
            sa.text("""
                UPDATE project_roles 
                SET role_type = :new_type
                WHERE role_type = :old_type
            """),
            {"old_type": old_type, "new_type": new_type}
        )
        if result.rowcount > 0:
            print(f"  Mapped {result.rowcount} roles from '{old_type}' to '{new_type}'")
    
    # Step 2: Update role names to match new naming convention
    print("\nStep 2: Updating role names...")
    name_updates = [
        ("owner", "Project Admin"),
        ("admin", "Project Admin"),  # Note: will be skipped if already updated
        ("qa_manager", "QA Lead"),
        ("qa_engineer", "Tester"),
        ("product_owner", "Developer"),
    ]
    
    for old_name_type, new_name in name_updates:
        # Update by role_type (after mapping)
        new_type = LEGACY_ROLE_MAPPING.get(old_name_type, old_name_type)
        result = conn.execute(
            sa.text("""
                UPDATE project_roles 
                SET name = :new_name
                WHERE role_type = :role_type 
                AND name IN ('Owner', 'Admin', 'QA Manager', 'QA Engineer', 'Product Owner')
            """),
            {"new_name": new_name, "role_type": new_type}
        )
    
    # Step 3: Get all organizations
    print("\nStep 3: Adding missing enterprise roles to organizations...")
    orgs = conn.execute(sa.text("SELECT id FROM organisations")).fetchall()
    
    for org in orgs:
        org_id = org[0]
        
        # Check which roles this org already has
        existing_types = conn.execute(
            sa.text("""
                SELECT DISTINCT role_type FROM project_roles 
                WHERE organisation_id = :org_id
            """),
            {"org_id": org_id}
        ).fetchall()
        existing_type_set = {r[0] for r in existing_types}
        
        # Add missing roles
        for role_data in ENTERPRISE_PROJECT_ROLES:
            if role_data["role_type"] not in existing_type_set:
                role_id = str(uuid.uuid4())
                conn.execute(
                    sa.text("""
                        INSERT INTO project_roles (id, organisation_id, name, role_type, description, is_system_role, is_active, created_by, created_at)
                        VALUES (:id, :org_id, :name, :role_type, :description, :is_system, TRUE, 'system_migration', NOW())
                    """),
                    {
                        "id": role_id,
                        "org_id": org_id,
                        "name": role_data["name"],
                        "role_type": role_data["role_type"],
                        "description": role_data["description"],
                        "is_system": role_data["is_system_role"],
                    }
                )
                print(f"  Added '{role_data['name']}' to org {str(org_id)[:8]}...")
    
    # Note: Skipping cleanup of duplicate roles to avoid FK constraint violations
    # Existing roles that are referenced by group_type_roles etc. will remain
    
    print("\n✅ Enterprise project roles migration complete!")


def downgrade():
    """Downgrade back to legacy roles (best effort)"""
    conn = op.get_bind()
    
    # Reverse the role_type mapping
    reverse_mapping = {
        "project_admin": "owner",
        "tester": "qa_engineer",
        "auto_eng": "qa_engineer",  # No direct equivalent
        "dev_ro": "product_owner",
    }
    
    for new_type, old_type in reverse_mapping.items():
        conn.execute(
            sa.text("""
                UPDATE project_roles 
                SET role_type = :old_type
                WHERE role_type = :new_type
            """),
            {"old_type": old_type, "new_type": new_type}
        )
    
    print("Downgraded project roles (note: some roles may not map exactly)")
