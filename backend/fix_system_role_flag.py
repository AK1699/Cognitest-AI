"""
Fix the is_system_role flag for existing roles
Mark default roles as system roles, and custom roles as non-system
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, update
from app.core.config import settings
from app.models.role import ProjectRole

# Default role types that should be marked as system roles
DEFAULT_ROLE_TYPES = {
    "administrator",
    "project_manager",
    "developer",
    "tester",
    "viewer"
}


async def fix_system_role_flags():
    """Fix the is_system_role flag for all roles"""
    # Create async engine
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        try:
            print("Fixing is_system_role flags for existing roles...")

            # Step 1: Mark all default roles as system roles
            print("\n1. Marking default roles as system roles...")
            stmt = (
                update(ProjectRole)
                .where(ProjectRole.role_type.in_(DEFAULT_ROLE_TYPES))
                .values(is_system_role=True)
            )
            result = await session.execute(stmt)
            await session.commit()
            print(f"   ✓ Updated {result.rowcount} default roles to is_system_role=True")

            # Step 2: Mark all custom roles (non-default types) as custom roles
            print("\n2. Marking custom roles as non-system roles...")
            stmt = (
                update(ProjectRole)
                .where(~ProjectRole.role_type.in_(DEFAULT_ROLE_TYPES))
                .values(is_system_role=False)
            )
            result = await session.execute(stmt)
            await session.commit()
            print(f"   ✓ Updated {result.rowcount} custom roles to is_system_role=False")

            # Step 3: Verify the changes
            print("\n3. Verifying changes...")
            result = await session.execute(
                select(ProjectRole).where(ProjectRole.is_system_role == True)
            )
            system_roles = result.scalars().all()
            print(f"   ✓ Total system roles: {len(system_roles)}")
            for role in system_roles:
                print(f"     - {role.name} ({role.role_type})")

            result = await session.execute(
                select(ProjectRole).where(ProjectRole.is_system_role == False)
            )
            custom_roles = result.scalars().all()
            print(f"   ✓ Total custom roles: {len(custom_roles)}")
            for role in custom_roles:
                print(f"     - {role.name} ({role.role_type})")

            print("\n✅ Successfully fixed all is_system_role flags!")

        except Exception as e:
            await session.rollback()
            print(f"\n❌ Failed to fix is_system_role flags: {str(e)}")
            import traceback
            traceback.print_exc()
        finally:
            await engine.dispose()


if __name__ == "__main__":
    asyncio.run(fix_system_role_flags())
