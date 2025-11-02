"""
Apply the standardized permission matrix to all roles in the database.
This script ensures all roles have the correct permissions according to the permission matrix spec.
"""

import asyncio
import sys
from pathlib import Path

# Add the parent directory to the Python path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.core.database import Base, AsyncSessionLocal
from app.core.config import settings
from app.models.role import ProjectRole, Permission, role_permissions
import uuid

# Permission Matrix - matches frontend spec
PERMISSION_MATRIX = {
    # User Management
    'user_read_access': {'owner': True, 'admin': True, 'qa_manager': True, 'qa_lead': False, 'qa_engineer': False, 'product_owner': False, 'viewer': False},
    'user_write_access': {'owner': True, 'admin': True, 'qa_manager': False, 'qa_lead': False, 'qa_engineer': False, 'product_owner': False, 'viewer': False},
    'user_delete_access': {'owner': True, 'admin': True, 'qa_manager': False, 'qa_lead': False, 'qa_engineer': False, 'product_owner': False, 'viewer': False},

    # Role Management
    'role_read_access': {'owner': True, 'admin': True, 'qa_manager': True, 'qa_lead': False, 'qa_engineer': False, 'product_owner': False, 'viewer': False},
    'role_write_access': {'owner': True, 'admin': True, 'qa_manager': False, 'qa_lead': False, 'qa_engineer': False, 'product_owner': False, 'viewer': False},
    'role_delete_access': {'owner': True, 'admin': True, 'qa_manager': False, 'qa_lead': False, 'qa_engineer': False, 'product_owner': False, 'viewer': False},

    # Project Management
    'project_read_access': {'owner': True, 'admin': True, 'qa_manager': True, 'qa_lead': True, 'qa_engineer': True, 'product_owner': True, 'viewer': True},
    'project_write_access': {'owner': True, 'admin': True, 'qa_manager': True, 'qa_lead': True, 'qa_engineer': False, 'product_owner': False, 'viewer': False},
    'project_delete_access': {'owner': True, 'admin': True, 'qa_manager': False, 'qa_lead': False, 'qa_engineer': False, 'product_owner': False, 'viewer': False},

    # Settings
    'settings_read_access': {'owner': True, 'admin': True, 'qa_manager': True, 'qa_lead': False, 'qa_engineer': False, 'product_owner': False, 'viewer': False},
    'settings_write_access': {'owner': True, 'admin': True, 'qa_manager': False, 'qa_lead': False, 'qa_engineer': False, 'product_owner': False, 'viewer': False},

    # Organization
    'organization_manage_access': {'owner': True, 'admin': True, 'qa_manager': False, 'qa_lead': False, 'qa_engineer': False, 'product_owner': False, 'viewer': False},

    # Test Case Management
    'test_case_read_access': {'owner': True, 'admin': True, 'qa_manager': True, 'qa_lead': True, 'qa_engineer': True, 'product_owner': True, 'viewer': True},
    'test_case_write_access': {'owner': True, 'admin': True, 'qa_manager': True, 'qa_lead': True, 'qa_engineer': True, 'product_owner': False, 'viewer': False},
    'test_case_delete_access': {'owner': True, 'admin': True, 'qa_manager': True, 'qa_lead': True, 'qa_engineer': False, 'product_owner': False, 'viewer': False},
    'test_case_execute_access': {'owner': True, 'admin': True, 'qa_manager': True, 'qa_lead': True, 'qa_engineer': True, 'product_owner': False, 'viewer': False},

    # Security Testing
    'security_test_read_access': {'owner': True, 'admin': True, 'qa_manager': True, 'qa_lead': True, 'qa_engineer': True, 'product_owner': True, 'viewer': True},
    'security_test_write_access': {'owner': True, 'admin': True, 'qa_manager': True, 'qa_lead': True, 'qa_engineer': False, 'product_owner': False, 'viewer': False},
    'security_test_delete_access': {'owner': True, 'admin': True, 'qa_manager': False, 'qa_lead': False, 'qa_engineer': False, 'product_owner': False, 'viewer': False},
    'security_test_execute_access': {'owner': True, 'admin': True, 'qa_manager': True, 'qa_lead': True, 'qa_engineer': True, 'product_owner': False, 'viewer': False},

    # API Testing
    'api_test_read_access': {'owner': True, 'admin': True, 'qa_manager': True, 'qa_lead': True, 'qa_engineer': True, 'product_owner': True, 'viewer': True},
    'api_test_write_access': {'owner': True, 'admin': True, 'qa_manager': True, 'qa_lead': True, 'qa_engineer': True, 'product_owner': False, 'viewer': False},
    'api_test_delete_access': {'owner': True, 'admin': True, 'qa_manager': True, 'qa_lead': False, 'qa_engineer': False, 'product_owner': False, 'viewer': False},
    'api_test_execute_access': {'owner': True, 'admin': True, 'qa_manager': True, 'qa_lead': True, 'qa_engineer': True, 'product_owner': False, 'viewer': False},

    # Automation Hub
    'automation_read_access': {'owner': True, 'admin': True, 'qa_manager': True, 'qa_lead': True, 'qa_engineer': True, 'product_owner': True, 'viewer': True},
    'automation_write_access': {'owner': True, 'admin': True, 'qa_manager': True, 'qa_lead': True, 'qa_engineer': False, 'product_owner': False, 'viewer': False},
    'automation_delete_access': {'owner': True, 'admin': True, 'qa_manager': True, 'qa_lead': False, 'qa_engineer': False, 'product_owner': False, 'viewer': False},
    'automation_execute_access': {'owner': True, 'admin': True, 'qa_manager': True, 'qa_lead': True, 'qa_engineer': True, 'product_owner': False, 'viewer': False},
}

async def apply_permission_matrix():
    """Apply the permission matrix to all roles"""
    async with AsyncSessionLocal() as db:
        try:
            # Get all roles
            result = await db.execute(select(ProjectRole))
            roles = result.scalars().all()

            print(f"📋 Found {len(roles)} roles")

            # Get all permissions
            result = await db.execute(select(Permission))
            all_permissions = result.scalars().all()

            # Create permission name to ID mapping
            perm_map = {p.name: p.id for p in all_permissions}

            print(f"📋 Found {len(all_permissions)} permissions")
            print(f"✅ Permission mapping created: {len(perm_map)} permissions available")

            # For each role, apply the correct permissions
            for role in roles:
                role_type = role.role_type
                print(f"\n🔄 Processing role: {role.name} ({role_type})")

                # Get permissions that should be assigned to this role
                role_perms_to_assign = []

                for perm_name, role_matrix in PERMISSION_MATRIX.items():
                    should_have = role_matrix.get(role_type, False)
                    perm_id = perm_map.get(perm_name)

                    if not perm_id:
                        print(f"  ⚠️  Permission '{perm_name}' not found in database")
                        continue

                    if should_have:
                        role_perms_to_assign.append(perm_id)
                        print(f"  ✅ Adding: {perm_name}")

                # Clear existing permissions for this role
                await db.execute(
                    role_permissions.delete().where(role_permissions.c.role_id == role.id)
                )

                # Add new permissions
                for perm_id in role_perms_to_assign:
                    # Use insert() instead of append to handle association table
                    await db.execute(
                        role_permissions.insert().values(role_id=role.id, permission_id=perm_id)
                    )

                print(f"  📊 Total permissions assigned: {len(role_perms_to_assign)}")

            # Commit changes
            await db.commit()
            print("\n✅ Permission matrix applied successfully!")

        except Exception as e:
            await db.rollback()
            print(f"❌ Error applying permission matrix: {e}")
            raise

if __name__ == "__main__":
    print("🚀 Applying permission matrix to all roles...")
    asyncio.run(apply_permission_matrix())
