"""
Setup RBAC (Role-Based Access Control) System
Creates tables and initializes default roles and permissions for User Group Management
"""

import asyncio
import sys
from pathlib import Path

# Add the parent directory to the Python path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.core.database import Base
from app.core.config import settings
import uuid

# Import all models
from app.models import (
    Group,
    ProjectRole,
    Permission,
    UserProjectRole,
    GroupProjectRole,
    ProjectRoleType,
    PermissionAction,
    PermissionResource,
    user_groups,
    role_permissions,
)


# Define default permissions
DEFAULT_PERMISSIONS = [
    # Project permissions
    {"name": "create_project", "resource": "project", "action": "create", "description": "Create new projects"},
    {"name": "read_project", "resource": "project", "action": "read", "description": "View project details"},
    {"name": "update_project", "resource": "project", "action": "update", "description": "Edit project settings"},
    {"name": "delete_project", "resource": "project", "action": "delete", "description": "Delete projects"},
    {"name": "manage_project", "resource": "project", "action": "manage", "description": "Full project management access"},

    # Test Plan permissions
    {"name": "create_test_plan", "resource": "test_plan", "action": "create", "description": "Create test plans"},
    {"name": "read_test_plan", "resource": "test_plan", "action": "read", "description": "View test plans"},
    {"name": "update_test_plan", "resource": "test_plan", "action": "update", "description": "Edit test plans"},
    {"name": "delete_test_plan", "resource": "test_plan", "action": "delete", "description": "Delete test plans"},

    # Test Suite permissions
    {"name": "create_test_suite", "resource": "test_suite", "action": "create", "description": "Create test suites"},
    {"name": "read_test_suite", "resource": "test_suite", "action": "read", "description": "View test suites"},
    {"name": "update_test_suite", "resource": "test_suite", "action": "update", "description": "Edit test suites"},
    {"name": "delete_test_suite", "resource": "test_suite", "action": "delete", "description": "Delete test suites"},

    # Test Case permissions
    {"name": "create_test_case", "resource": "test_case", "action": "create", "description": "Create test cases"},
    {"name": "read_test_case", "resource": "test_case", "action": "read", "description": "View test cases"},
    {"name": "update_test_case", "resource": "test_case", "action": "update", "description": "Edit test cases"},
    {"name": "delete_test_case", "resource": "test_case", "action": "delete", "description": "Delete test cases"},

    # Test Execution permissions
    {"name": "execute_test", "resource": "test_execution", "action": "execute", "description": "Execute test cases"},
    {"name": "read_test_execution", "resource": "test_execution", "action": "read", "description": "View test execution results"},

    # User permissions
    {"name": "create_user", "resource": "user", "action": "create", "description": "Create users"},
    {"name": "read_user", "resource": "user", "action": "read", "description": "View user details"},
    {"name": "update_user", "resource": "user", "action": "update", "description": "Edit user details"},
    {"name": "delete_user", "resource": "user", "action": "delete", "description": "Delete users"},
    {"name": "manage_user", "resource": "user", "action": "manage", "description": "Full user management access"},

    # Group permissions
    {"name": "create_group", "resource": "group", "action": "create", "description": "Create groups"},
    {"name": "read_group", "resource": "group", "action": "read", "description": "View groups"},
    {"name": "update_group", "resource": "group", "action": "update", "description": "Edit groups"},
    {"name": "delete_group", "resource": "group", "action": "delete", "description": "Delete groups"},
    {"name": "manage_group", "resource": "group", "action": "manage", "description": "Full group management access"},

    # Role permissions
    {"name": "create_role", "resource": "role", "action": "create", "description": "Create roles"},
    {"name": "read_role", "resource": "role", "action": "read", "description": "View roles"},
    {"name": "update_role", "resource": "role", "action": "update", "description": "Edit roles"},
    {"name": "delete_role", "resource": "role", "action": "delete", "description": "Delete roles"},
    {"name": "manage_role", "resource": "role", "action": "manage", "description": "Full role management access"},

    # Settings permissions
    {"name": "read_settings", "resource": "settings", "action": "read", "description": "View project settings"},
    {"name": "manage_settings", "resource": "settings", "action": "manage", "description": "Manage project settings"},
]


# Define default roles with their assigned permissions
DEFAULT_ROLES = {
    "administrator": {
        "name": "Administrator",
        "role_type": "administrator",
        "description": "Full system access with all permissions",
        "permissions": [p["name"] for p in DEFAULT_PERMISSIONS]  # All permissions
    },
    "project_manager": {
        "name": "Project Manager",
        "role_type": "project_manager",
        "description": "Manage project settings, users, and test management",
        "permissions": [
            "read_project", "update_project", "manage_project",
            "create_test_plan", "read_test_plan", "update_test_plan", "delete_test_plan",
            "create_test_suite", "read_test_suite", "update_test_suite", "delete_test_suite",
            "create_test_case", "read_test_case", "update_test_case", "delete_test_case",
            "execute_test", "read_test_execution",
            "read_user", "update_user", "manage_user",
            "read_group", "update_group", "manage_group",
            "read_role", "manage_role",
            "read_settings", "manage_settings",
        ]
    },
    "developer": {
        "name": "Developer",
        "role_type": "developer",
        "description": "Create and edit test cases, execute tests",
        "permissions": [
            "read_project",
            "create_test_plan", "read_test_plan", "update_test_plan",
            "create_test_suite", "read_test_suite", "update_test_suite",
            "create_test_case", "read_test_case", "update_test_case",
            "execute_test", "read_test_execution",
            "read_user", "read_group", "read_role",
            "read_settings",
        ]
    },
    "tester": {
        "name": "Tester",
        "role_type": "tester",
        "description": "Execute tests and view test management",
        "permissions": [
            "read_project",
            "read_test_plan",
            "read_test_suite",
            "create_test_case", "read_test_case", "update_test_case",
            "execute_test", "read_test_execution",
            "read_user", "read_group", "read_role",
            "read_settings",
        ]
    },
    "viewer": {
        "name": "Viewer",
        "role_type": "viewer",
        "description": "Read-only access to project and test management",
        "permissions": [
            "read_project",
            "read_test_plan",
            "read_test_suite",
            "read_test_case",
            "read_test_execution",
            "read_user", "read_group", "read_role",
            "read_settings",
        ]
    },
}


async def create_tables(engine):
    """Create all database tables"""
    async with engine.begin() as conn:
        # Import Base from database module to get all table metadata
        await conn.run_sync(Base.metadata.create_all)
    print("✅ All tables created successfully!")


async def initialize_permissions(session: AsyncSession):
    """Create default permissions"""
    print("\n📋 Initializing permissions...")

    for perm_data in DEFAULT_PERMISSIONS:
        # Check if permission already exists
        result = await session.execute(
            select(Permission).where(Permission.name == perm_data["name"])
        )
        existing_perm = result.scalar_one_or_none()

        if not existing_perm:
            permission = Permission(
                id=uuid.uuid4(),
                name=perm_data["name"],
                resource=perm_data["resource"],
                action=perm_data["action"],
                description=perm_data["description"],
                is_system_permission=True
            )
            session.add(permission)
            print(f"  ✓ Created permission: {perm_data['name']}")
        else:
            print(f"  → Permission already exists: {perm_data['name']}")

    await session.commit()
    print("✅ Permissions initialized successfully!")
    return session


async def initialize_roles(session: AsyncSession, organisation_id: str):
    """Create default roles and assign permissions"""
    print(f"\n🎭 Initializing roles for organisation {organisation_id}...")

    for role_key, role_data in DEFAULT_ROLES.items():
        # Check if role already exists
        result = await session.execute(
            select(ProjectRole).where(
                ProjectRole.organisation_id == uuid.UUID(organisation_id),
                ProjectRole.role_type == role_data["role_type"]
            )
        )
        existing_role = result.scalar_one_or_none()

        if not existing_role:
            # Create role
            role = ProjectRole(
                id=uuid.uuid4(),
                organisation_id=uuid.UUID(organisation_id),
                name=role_data["name"],
                role_type=role_data["role_type"],
                description=role_data["description"],
                is_system_role=True,
                is_active=True,
                created_by="system"
            )
            session.add(role)
            await session.flush()  # Flush to get the role ID

            # Assign permissions to role
            for perm_name in role_data["permissions"]:
                perm_result = await session.execute(
                    select(Permission).where(Permission.name == perm_name)
                )
                permission = perm_result.scalar_one_or_none()

                if permission:
                    # Add permission to role using the association table
                    await session.execute(
                        role_permissions.insert().values(
                            id=uuid.uuid4(),
                            role_id=role.id,
                            permission_id=permission.id,
                            assigned_by="system"
                        )
                    )

            print(f"  ✓ Created role: {role_data['name']} with {len(role_data['permissions'])} permissions")
        else:
            print(f"  → Role already exists: {role_data['name']}")

    await session.commit()
    print("✅ Roles initialized successfully!")


async def main():
    """Main function to set up RBAC system"""
    print("🚀 Setting up RBAC System for Cognitest...")
    print("=" * 60)

    # Create async engine
    engine = create_async_engine(settings.DATABASE_URL, echo=False)

    # Create tables
    await create_tables(engine)

    # Create async session
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        # Initialize permissions (global)
        await initialize_permissions(session)

        # Get a sample organisation ID (you should replace this with actual organisation ID)
        # For now, we'll skip role initialization and let it be done via API
        print("\n⚠️  Note: Roles should be initialized per organisation via API")
        print("    Use the organization ID when calling the initialization endpoint")

    print("\n" + "=" * 60)
    print("✅ RBAC System setup completed successfully!")
    print("\n📝 Next steps:")
    print("   1. Start the backend server")
    print("   2. Use the API to initialize roles for each organisation")
    print("   3. Assign roles to users for specific projects")


if __name__ == "__main__":
    asyncio.run(main())
