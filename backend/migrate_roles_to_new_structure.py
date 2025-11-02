"""
Migration script to update existing roles to the new role structure.
This updates old role_type values to new ones.
"""

import asyncio
import sys
from pathlib import Path

# Add the parent directory to the Python path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, update
from app.core.config import settings
from app.models.role import ProjectRole

# Mapping of old role types to new role types
ROLE_TYPE_MAPPING = {
    "administrator": "admin",
    "project_manager": "qa_manager",
    "developer": "qa_engineer",
    "tester": "qa_engineer",
    "viewer": "viewer",
}

# New role names and descriptions
ROLE_UPDATES = {
    "administrator": {
        "name": "Admin",
        "description": "Full system access except for organization deletion"
    },
    "project_manager": {
        "name": "QA Manager",
        "description": "Manage test projects, assign testers, and review results"
    },
    "developer": {
        "name": "QA Engineer",
        "description": "Execute tests and manage test data"
    },
    "tester": {
        "name": "QA Engineer",
        "description": "Execute tests and manage test data"
    },
}


async def migrate_roles(engine):
    """Migrate existing roles to new role structure"""
    print("🔄 Starting role migration...")
    print("=" * 60)

    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        # Get all existing roles
        result = await session.execute(select(ProjectRole))
        roles = result.scalars().all()

        if not roles:
            print("❌ No roles found to migrate")
            return

        print(f"\n📋 Found {len(roles)} role(s) to migrate\n")

        migrated = 0
        for role in roles:
            old_role_type = role.role_type
            new_role_type = ROLE_TYPE_MAPPING.get(old_role_type)

            if new_role_type and old_role_type != new_role_type:
                # Get update info
                update_info = ROLE_UPDATES.get(old_role_type, {})

                print(f"  Migrating role:")
                print(f"    Name: {role.name} → {update_info.get('name', role.name)}")
                print(f"    Type: {old_role_type} → {new_role_type}")

                # Update the role
                role.role_type = new_role_type
                if 'name' in update_info:
                    role.name = update_info['name']
                if 'description' in update_info:
                    role.description = update_info['description']

                session.add(role)
                migrated += 1
                print(f"    ✓ Updated\n")
            else:
                print(f"  ⏭️  Skipping '{role.name}' - already up to date\n")

        # Commit changes
        if migrated > 0:
            await session.commit()
            print("=" * 60)
            print(f"✅ Successfully migrated {migrated} role(s)!")
        else:
            print("=" * 60)
            print("ℹ️  No roles needed migration")


async def add_missing_roles(engine):
    """Add missing roles (Owner, Product Owner) if they don't exist"""
    print("\n\n🆕 Checking for missing roles...")
    print("=" * 60)

    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        # Get all organisations
        from app.models.organisation import Organisation

        result = await session.execute(select(Organisation))
        organisations = result.scalars().all()

        if not organisations:
            print("❌ No organisations found")
            return

        print(f"\n📋 Found {len(organisations)} organisation(s)\n")

        from app.models.role import Permission, role_permissions
        import uuid

        for org in organisations:
            print(f"  Organisation: {org.name}")

            # Check if Owner role exists
            owner_result = await session.execute(
                select(ProjectRole).where(
                    ProjectRole.organisation_id == org.id,
                    ProjectRole.role_type == "owner"
                )
            )
            owner_role = owner_result.scalar_one_or_none()

            if not owner_role:
                print(f"    - Creating 'Owner' role...")

                # Get all permissions
                perms_result = await session.execute(select(Permission))
                all_perms = perms_result.scalars().all()

                owner = ProjectRole(
                    id=uuid.uuid4(),
                    organisation_id=org.id,
                    name="Owner",
                    role_type="owner",
                    description="Full organization control - manage billing, plans, delete org, and user management",
                    is_system_role=True,
                    is_active=True,
                    created_by="migration"
                )
                session.add(owner)
                await session.flush()

                # Assign all permissions to Owner
                for perm in all_perms:
                    await session.execute(
                        role_permissions.insert().values(
                            id=uuid.uuid4(),
                            role_id=owner.id,
                            permission_id=perm.id,
                            assigned_by="migration"
                        )
                    )
                print(f"      ✓ Owner role created")
            else:
                print(f"    - Owner role already exists ✓")

            # Check if Product Owner role exists
            product_owner_result = await session.execute(
                select(ProjectRole).where(
                    ProjectRole.organisation_id == org.id,
                    ProjectRole.role_type == "product_owner"
                )
            )
            product_owner = product_owner_result.scalar_one_or_none()

            if not product_owner:
                print(f"    - Creating 'Product Owner' role...")

                # Get read-only permissions
                perms_result = await session.execute(
                    select(Permission).where(
                        Permission.action.in_(["read"])
                    )
                )
                read_perms = perms_result.scalars().all()

                prod_owner = ProjectRole(
                    id=uuid.uuid4(),
                    organisation_id=org.id,
                    name="Product Owner",
                    role_type="product_owner",
                    description="Read-only access to view reports and dashboards",
                    is_system_role=True,
                    is_active=True,
                    created_by="migration"
                )
                session.add(prod_owner)
                await session.flush()

                # Assign read permissions to Product Owner
                for perm in read_perms:
                    await session.execute(
                        role_permissions.insert().values(
                            id=uuid.uuid4(),
                            role_id=prod_owner.id,
                            permission_id=perm.id,
                            assigned_by="migration"
                        )
                    )
                print(f"      ✓ Product Owner role created")
            else:
                print(f"    - Product Owner role already exists ✓")

            # Check if Viewer role exists
            viewer_result = await session.execute(
                select(ProjectRole).where(
                    ProjectRole.organisation_id == org.id,
                    ProjectRole.role_type == "viewer"
                )
            )
            viewer = viewer_result.scalar_one_or_none()

            if viewer:
                print(f"    - Viewer role already exists ✓")
            else:
                print(f"    - Viewer role not found (will be handled by migration)")

            print()

        # Commit changes
        await session.commit()
        print("=" * 60)
        print("✅ Role creation check completed!")


async def main():
    """Main migration function"""
    print("\n🚀 Starting Role Structure Migration")
    print("=" * 60)

    # Create async engine
    engine = create_async_engine(settings.DATABASE_URL, echo=False)

    try:
        # Migrate existing roles
        await migrate_roles(engine)

        # Add missing roles
        await add_missing_roles(engine)

        print("\n" + "=" * 60)
        print("✅ Migration completed successfully!")
        print("\nNext steps:")
        print("  1. Refresh your browser to see the updated roles")
        print("  2. Verify all 7 roles are now visible in the UI")

    except Exception as e:
        print(f"\n❌ Migration failed: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
