"""
Cleanup script to remove duplicate roles and ensure all 7 roles are present.
"""

import asyncio
import sys
from pathlib import Path

# Add the parent directory to the Python path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, delete, func
from app.core.config import settings
from app.models.role import ProjectRole, Permission, role_permissions
import uuid


async def cleanup_roles():
    """Clean up duplicate roles and ensure all 7 are present"""
    print("🧹 Starting duplicate roles cleanup...")
    print("=" * 70)

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        # Get all organisations
        from app.models.organisation import Organisation

        result = await session.execute(select(Organisation))
        organisations = result.scalars().all()

        print(f"\n📋 Processing {len(organisations)} organisation(s)\n")

        ROLES_TO_KEEP = {
            'owner': 'Owner',
            'admin': 'Admin',
            'qa_manager': 'QA Manager',
            'qa_lead': 'QA Lead',
            'qa_engineer': 'QA Engineer',
            'product_owner': 'Product Owner',
            'viewer': 'Viewer'
        }

        for org in organisations:
            print(f"  Organisation: {org.name}")
            print(f"  {'─' * 60}")

            # Get all roles for this organisation
            org_roles_result = await session.execute(
                select(ProjectRole).where(
                    ProjectRole.organisation_id == org.id
                ).order_by(ProjectRole.role_type, ProjectRole.created_at)
            )
            org_roles = org_roles_result.scalars().all()

            # Group roles by type
            roles_by_type = {}
            for role in org_roles:
                if role.role_type not in roles_by_type:
                    roles_by_type[role.role_type] = []
                roles_by_type[role.role_type].append(role)

            # Remove duplicates - keep the first one, delete the rest
            for role_type, roles in roles_by_type.items():
                if len(roles) > 1:
                    print(f"    Found {len(roles)} '{role_type}' roles - removing {len(roles) - 1} duplicates")
                    # Keep the first one, delete the others
                    for role_to_delete in roles[1:]:
                        print(f"      Deleting: {role_to_delete.name} (id: {role_to_delete.id})")
                        await session.delete(role_to_delete)

            # Fix Viewer role name (some might be named "Product Owner" with type "viewer")
            viewer_result = await session.execute(
                select(ProjectRole).where(
                    ProjectRole.organisation_id == org.id,
                    ProjectRole.role_type == 'viewer'
                )
            )
            viewer_roles = viewer_result.scalars().all()

            for viewer_role in viewer_roles:
                if viewer_role.name != 'Viewer':
                    print(f"    Fixing Viewer role name: '{viewer_role.name}' → 'Viewer'")
                    viewer_role.name = 'Viewer'
                    viewer_role.description = 'View reports and results'
                    session.add(viewer_role)

            # Check if QA Lead exists, if not create it
            qa_lead_result = await session.execute(
                select(ProjectRole).where(
                    ProjectRole.organisation_id == org.id,
                    ProjectRole.role_type == 'qa_lead'
                )
            )
            qa_lead = qa_lead_result.scalar_one_or_none()

            if not qa_lead:
                print(f"    Creating missing 'QA Lead' role")

                # Get permissions that QA Lead should have
                # QA Lead has these permissions:
                qa_lead_perms = [
                    "read_project",
                    "create_test_plan", "read_test_plan", "update_test_plan",
                    "create_test_suite", "read_test_suite", "update_test_suite",
                    "create_test_case", "read_test_case", "update_test_case", "delete_test_case",
                    "execute_test", "read_test_execution",
                    "read_user", "manage_user",
                    "read_group", "manage_group",
                    "read_role",
                    "read_settings",
                ]

                qa_lead_role = ProjectRole(
                    id=uuid.uuid4(),
                    organisation_id=org.id,
                    name='QA Lead',
                    role_type='qa_lead',
                    description='Manage test cases, assign tasks, and approve AI fixes',
                    is_system_role=True,
                    is_active=True,
                    created_by='cleanup_script'
                )
                session.add(qa_lead_role)
                await session.flush()

                # Assign permissions
                perms_result = await session.execute(
                    select(Permission).where(Permission.name.in_(qa_lead_perms))
                )
                qa_lead_perms_objs = perms_result.scalars().all()

                for perm in qa_lead_perms_objs:
                    await session.execute(
                        role_permissions.insert().values(
                            id=uuid.uuid4(),
                            role_id=qa_lead_role.id,
                            permission_id=perm.id,
                            assigned_by='cleanup_script'
                        )
                    )
                print(f"      ✓ QA Lead role created with {len(qa_lead_perms_objs)} permissions")

            print()

        # Commit all changes
        await session.commit()
        print("=" * 70)
        print("✅ Cleanup completed successfully!\n")

        # Verify final state
        print("📊 Final role status for each organisation:\n")

        async with async_session() as verify_session:
            result = await verify_session.execute(select(Organisation))
            organisations = result.scalars().all()

            for org in organisations:
                roles_result = await verify_session.execute(
                    select(ProjectRole).where(
                        ProjectRole.organisation_id == org.id
                    ).order_by(ProjectRole.name)
                )
                roles = roles_result.scalars().all()

                print(f"  {org.name}: {len(roles)} roles")
                for role in roles:
                    print(f"    ✓ {role.name:20} ({role.role_type})")
                print()

    await engine.dispose()


async def main():
    """Main cleanup function"""
    print("\n🚀 Starting Duplicate Roles Cleanup")
    print("=" * 70)

    try:
        await cleanup_roles()
        print("\nNext steps:")
        print("  1. Refresh your browser to see the cleaned up roles")
        print("  2. You should now see exactly 7 roles per organisation")
        print("  3. No duplicate QA Manager roles")

    except Exception as e:
        print(f"\n❌ Cleanup failed: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
