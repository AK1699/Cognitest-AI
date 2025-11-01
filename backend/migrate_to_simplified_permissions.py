"""
Migrate to Simplified CRUD Permission Model
Replaces complex permissions with simple read_access, write_access, delete_access, execute_access
"""

import asyncio
import sys
from pathlib import Path
from uuid import UUID, uuid4

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

# New simplified permissions
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

    # Test Modules (consolidated - covers test plans, suites, cases, execution + future modules)
    {"name": "test_read_access", "resource": "test", "action": "read", "description": "Read test artifacts"},
    {"name": "test_write_access", "resource": "test", "action": "write", "description": "Create and update test artifacts"},
    {"name": "test_delete_access", "resource": "test", "action": "delete", "description": "Delete test artifacts"},
    {"name": "test_execute_access", "resource": "test", "action": "execute", "description": "Execute tests"},

    # Settings
    {"name": "settings_read_access", "resource": "settings", "action": "read", "description": "Read settings"},
    {"name": "settings_write_access", "resource": "settings", "action": "write", "description": "Update settings"},

    # Organization
    {"name": "organization_manage_access", "resource": "organization", "action": "manage", "description": "Manage organization"},
]

# Default role permissions mapping
ROLE_PERMISSIONS = {
    "administrator": [
        "user_read_access", "user_write_access", "user_delete_access",
        "role_read_access", "role_write_access", "role_delete_access",
        "project_read_access", "project_write_access", "project_delete_access",
        "test_read_access", "test_write_access", "test_delete_access", "test_execute_access",
        "settings_read_access", "settings_write_access",
        "organization_manage_access",
    ],
    "qa_manager": [
        "user_read_access",
        "role_read_access",
        "project_read_access", "project_write_access",
        "test_read_access", "test_write_access", "test_delete_access", "test_execute_access",
        "settings_read_access",
    ],
    "qa_lead": [
        "user_read_access",
        "project_read_access", "project_write_access",
        "test_read_access", "test_write_access", "test_delete_access", "test_execute_access",
    ],
    "qa_engineer": [
        "user_read_access",
        "project_read_access",
        "test_read_access", "test_write_access", "test_execute_access",
    ],
    "project_manager": [
        "user_read_access",
        "project_read_access", "project_write_access",
        "test_read_access", "test_execute_access",
    ],
    "product_owner": [
        "project_read_access", "project_write_access",
        "test_read_access", "test_execute_access",
    ],
}


async def migrate():
    """Migrate to simplified permission model"""
    # Create async engine
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        try:
            print("Starting permission migration...")

            # Step 1: Delete old permissions
            print("\n1. Deleting old permissions...")
            stmt = delete(Permission)
            await session.execute(stmt)
            await session.commit()
            print(f"   ✓ Old permissions deleted")

            # Step 2: Create new permissions
            print("\n2. Creating new simplified permissions...")
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
            print(f"   ✓ Created {len(NEW_PERMISSIONS)} new permissions")

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

            # Step 5: Update roles with new permissions
            print("\n5. Updating role permissions...")

            # First, clear all role-permission relationships
            stmt = delete(role_permissions)
            await session.execute(stmt)
            await session.commit()

            for role in roles:
                role_type = role.role_type.lower()
                if role_type in ROLE_PERMISSIONS:
                    perm_names = ROLE_PERMISSIONS[role_type]

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
