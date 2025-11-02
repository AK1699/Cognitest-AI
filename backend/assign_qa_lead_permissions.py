"""
Assign QA Lead permissions to the newly created QA Lead role.
"""

import asyncio
import sys
from pathlib import Path

# Add the parent directory to the Python path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.core.config import settings
from app.models.role import ProjectRole, Permission, role_permissions
import uuid


async def assign_qa_lead_permissions():
    """Assign correct permissions to QA Lead roles"""
    print("🔐 Assigning QA Lead permissions...")
    print("=" * 70)

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        # QA Lead permissions according to the specification
        qa_lead_permissions = [
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

        # Get all QA Lead roles
        qa_lead_result = await session.execute(
            select(ProjectRole).where(ProjectRole.role_type == 'qa_lead')
        )
        qa_lead_roles = qa_lead_result.scalars().all()

        print(f"\n📋 Found {len(qa_lead_roles)} QA Lead role(s)\n")

        for qa_lead_role in qa_lead_roles:
            print(f"  Role: {qa_lead_role.name} (Org: {qa_lead_role.organisation_id})")

            # Get all permissions
            all_perms_result = await session.execute(select(Permission))
            all_permissions = all_perms_result.scalars().all()

            # Filter to QA Lead permissions
            qa_lead_perms = [p for p in all_permissions if p.name in qa_lead_permissions]

            print(f"    Assigning {len(qa_lead_perms)} permissions:")

            # Clear existing permissions first
            delete_result = await session.execute(
                select(role_permissions).where(
                    role_permissions.c.role_id == qa_lead_role.id
                )
            )

            # Add new permissions
            for perm in qa_lead_perms:
                await session.execute(
                    role_permissions.insert().values(
                        id=uuid.uuid4(),
                        role_id=qa_lead_role.id,
                        permission_id=perm.id,
                        assigned_by='permission_assignment_script'
                    )
                )
                print(f"      ✓ {perm.name}")

            print()

        # Commit changes
        await session.commit()
        print("=" * 70)
        print("✅ QA Lead permissions assigned successfully!")

    await engine.dispose()


async def main():
    """Main function"""
    print("\n🚀 QA Lead Permission Assignment")
    print("=" * 70)

    try:
        await assign_qa_lead_permissions()

    except Exception as e:
        print(f"\n❌ Assignment failed: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
