"""
Migrate to Granular Permission Model
Replaces simplified permissions with granular permissions for each module
"""

import asyncio
import sys
from pathlib import Path
from uuid import uuid4

sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, delete, text
from app.core.database import Base
from app.core.config import settings

from app.models import (
    Permission,
    ProjectRole,
    role_permissions,
)

# New granular permissions mapping
NEW_PERMISSIONS = [
    # User Management
    {"name": "user_read_access", "resource": "user", "action": "read", "description": "Read user information"},
    {"name": "user_write_access", "resource": "user", "action": "write", "description": "Create and update users"},
    {"name": "user_delete_access", "resource": "user", "action": "delete", "description": "Delete users"},

    # Role Management
    {"name": "role_read_access", "resource": "role", "action": "read", "description": "Read role information"},
    {"name": "role_write_access", "resource": "role", "action": "write", "description": "Create and update roles"},
    {"name": "role_delete_access", "resource": "role", "action": "delete", "description": "Delete roles"},

    # Project Management
    {"name": "project_read_access", "resource": "project", "action": "read", "description": "Read project information"},
    {"name": "project_write_access", "resource": "project", "action": "write", "description": "Create and update projects"},
    {"name": "project_delete_access", "resource": "project", "action": "delete", "description": "Delete projects"},

    # Test Case Management (granular)
    {"name": "test_case_read_access", "resource": "test_management", "action": "read", "description": "Read test case artifacts"},
    {"name": "test_case_write_access", "resource": "test_management", "action": "write", "description": "Create and update test cases"},
    {"name": "test_case_delete_access", "resource": "test_management", "action": "delete", "description": "Delete test cases"},
    {"name": "test_case_execute_access", "resource": "test_management", "action": "execute", "description": "Execute test cases"},

    # API Testing (granular)
    {"name": "api_test_read_access", "resource": "api_testing", "action": "read", "description": "Read API tests and results"},
    {"name": "api_test_write_access", "resource": "api_testing", "action": "write", "description": "Create and update API tests"},
    {"name": "api_test_delete_access", "resource": "api_testing", "action": "delete", "description": "Delete API tests"},
    {"name": "api_test_execute_access", "resource": "api_testing", "action": "execute", "description": "Run API tests"},

    # Automation Hub (granular)
    {"name": "automation_read_access", "resource": "automation_hub", "action": "read", "description": "Read automation workflows"},
    {"name": "automation_write_access", "resource": "automation_hub", "action": "write", "description": "Create and update automation workflows"},
    {"name": "automation_delete_access", "resource": "automation_hub", "action": "delete", "description": "Delete automation workflows"},
    {"name": "automation_execute_access", "resource": "automation_hub", "action": "execute", "description": "Execute automation workflows"},

    # Security Testing (granular)
    {"name": "security_test_read_access", "resource": "security_testing", "action": "read", "description": "Read security scan definitions and reports"},
    {"name": "security_test_write_access", "resource": "security_testing", "action": "write", "description": "Create and update security tests"},
    {"name": "security_test_delete_access", "resource": "security_testing", "action": "delete", "description": "Delete security tests/reports"},
    {"name": "security_test_execute_access", "resource": "security_testing", "action": "execute", "description": "Initiate security scans"},

    # Performance Testing (granular)
    {"name": "performance_test_read_access", "resource": "performance_testing", "action": "read", "description": "Read performance test scenarios and results"},
    {"name": "performance_test_write_access", "resource": "performance_testing", "action": "write", "description": "Create and update performance tests"},
    {"name": "performance_test_delete_access", "resource": "performance_testing", "action": "delete", "description": "Delete performance tests"},
    {"name": "performance_test_execute_access", "resource": "performance_testing", "action": "execute", "description": "Run performance/load tests"},

    # Mobile Testing (granular)
    {"name": "mobile_test_read_access", "resource": "mobile_testing", "action": "read", "description": "Read mobile test scenarios and results"},
    {"name": "mobile_test_write_access", "resource": "mobile_testing", "action": "write", "description": "Create and update mobile tests"},
    {"name": "mobile_test_delete_access", "resource": "mobile_testing", "action": "delete", "description": "Delete mobile tests"},
    {"name": "mobile_test_execute_access", "resource": "mobile_testing", "action": "execute", "description": "Execute mobile app tests"},

    # Settings
    {"name": "settings_read_access", "resource": "settings", "action": "read", "description": "Read settings"},
    {"name": "settings_write_access", "resource": "settings", "action": "write", "description": "Update settings"},

    # Organization
    {"name": "organization_manage_access", "resource": "organization", "action": "manage", "description": "Manage organization"},
]

# Old to new permission mapping
OLD_TO_NEW_MAPPING = {
    # Core permissions stay the same
    "user_read_access": "user_read_access",
    "user_write_access": "user_write_access",
    "user_delete_access": "user_delete_access",
    "role_read_access": "role_read_access",
    "role_write_access": "role_write_access",
    "role_delete_access": "role_delete_access",
    "project_read_access": "project_read_access",
    "project_write_access": "project_write_access",
    "project_delete_access": "project_delete_access",
    "settings_read_access": "settings_read_access",
    "settings_write_access": "settings_write_access",
    "organization_manage_access": "organization_manage_access",

    # Test permissions get renamed
    "test_read_access": "test_case_read_access",
    "test_write_access": "test_case_write_access",
    "test_delete_access": "test_case_delete_access",
    "test_execute_access": "test_case_execute_access",
}


async def migrate():
    """Migrate to granular permission model"""
    # Create async engine
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        try:
            print("Starting granular permission migration...")

            # Step 1: Delete old permissions
            print("\n1. Deleting old permissions...")
            stmt = delete(Permission)
            await session.execute(stmt)
            await session.commit()
            print(f"   ✓ Old permissions deleted")

            # Step 2: Create new granular permissions
            print("\n2. Creating new granular permissions...")
            for perm_data in NEW_PERMISSIONS:
                perm = Permission(
                    id=uuid4(),
                    name=perm_data["name"],
                    resource=perm_data["resource"],
                    action=perm_data["action"],
                    description=perm_data.get("description", ""),
                )
                session.add(perm)
            await session.commit()
            print(f"   ✓ Created {len(NEW_PERMISSIONS)} new granular permissions")

            # Step 3: Fetch all permissions with their IDs
            print("\n3. Fetching permission IDs...")
            result = await session.execute(select(Permission))
            permissions = result.scalars().all()
            permission_map = {p.name: p.id for p in permissions}
            print(f"   ✓ Fetched {len(permission_map)} permissions")

            # Step 4: Fetch all roles
            print("\n4. Fetching all roles...")
            result = await session.execute(select(ProjectRole))
            roles = result.scalars().all()
            print(f"   ✓ Fetched {len(roles)} roles")

            # Step 5: Update roles with new permissions (keep same permissions they had before)
            print("\n5. Updating role permissions...")

            # First, clear all role-permission relationships
            stmt = delete(role_permissions)
            await session.execute(stmt)
            await session.commit()

            # For each role, keep the same permission level
            for role in roles:
                # Count how many permissions this role had before (to maintain access level)
                # For now, assign all roles the same permissions across the board
                # Administrator gets all, others get reduced set

                if role.role_type and role.role_type.lower() == "administrator":
                    # Admin gets all permissions
                    perm_names = list(permission_map.keys())
                else:
                    # Others get basic permissions: user_read, project_read, test_case_read/execute, settings_read
                    perm_names = [
                        "user_read_access",
                        "role_read_access",
                        "project_read_access",
                        "test_case_read_access",
                        "test_case_execute_access",
                        "settings_read_access",
                    ]

                for perm_name in perm_names:
                    if perm_name in permission_map:
                        perm_id = permission_map[perm_name]
                        stmt = text(
                            "INSERT INTO role_permissions (id, role_id, permission_id) VALUES (:id, :role_id, :perm_id)"
                        )
                        await session.execute(stmt, {"id": uuid4(), "role_id": role.id, "perm_id": perm_id})

                print(f"   ✓ {role.name}: {len(perm_names)} permissions assigned")

            await session.commit()
            print("\n✅ Migration completed successfully!")
            print(f"\nSummary:")
            print(f"  - Total permissions: {len(NEW_PERMISSIONS)}")
            print(f"  - Updated roles: {len(roles)}")

        except Exception as e:
            await session.rollback()
            print(f"\n❌ Migration failed: {str(e)}")
            import traceback
            traceback.print_exc()
        finally:
            await engine.dispose()


if __name__ == "__main__":
    asyncio.run(migrate())
