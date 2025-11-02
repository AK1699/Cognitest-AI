"""
Update role descriptions in the database to match the new specification.
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
from app.models.role import ProjectRole

# New role descriptions mapping
ROLE_DESCRIPTIONS = {
    "owner": {
        "name": "Owner",
        "description": "Has full control — can manage billing, delete the organization, assign roles, and configure SSO"
    },
    "admin": {
        "name": "Admin",
        "description": "Manages organization settings, users, integrations, and platform operations"
    },
    "qa_manager": {
        "name": "QA Manager",
        "description": "Manages QA teams, assigns testers, oversees test execution, and reviews results"
    },
    "qa_lead": {
        "name": "QA Lead",
        "description": "Leads QA engineers, approves test cases, and validates AI-generated fixes"
    },
    "qa_engineer": {
        "name": "QA Engineer",
        "description": "Creates, executes, and maintains automated and manual tests"
    },
    "product_owner": {
        "name": "Product Owner",
        "description": "Represents business interests, reviews reports and KPIs, ensures testing aligns with product goals"
    },
    "viewer": {
        "name": "Viewer",
        "description": "Has view-only access to dashboards, reports, and analytics"
    }
}


async def update_role_descriptions():
    """Update role descriptions in database"""
    print("🔄 Updating role descriptions...")
    print("=" * 70)

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        # Get all roles
        result = await session.execute(select(ProjectRole))
        roles = result.scalars().all()

        print(f"\n📋 Found {len(roles)} role(s) to update\n")

        updated_count = 0

        for role in roles:
            if role.role_type in ROLE_DESCRIPTIONS:
                new_info = ROLE_DESCRIPTIONS[role.role_type]
                old_description = role.description

                # Update the role
                role.name = new_info["name"]
                role.description = new_info["description"]

                session.add(role)

                print(f"  ✓ {role.name} ({role.role_type})")
                if old_description != role.description:
                    print(f"    Description updated")
                    print(f"    Old: {old_description}")
                    print(f"    New: {role.description}\n")
                updated_count += 1
            else:
                print(f"  ⏭️  Skipping '{role.name}' - not in new role structure\n")

        # Commit changes
        await session.commit()

        print("=" * 70)
        print(f"✅ Successfully updated {updated_count} role(s)!")

    await engine.dispose()


async def main():
    """Main function"""
    print("\n🚀 Role Description Update")
    print("=" * 70)

    try:
        await update_role_descriptions()

    except Exception as e:
        print(f"\n❌ Update failed: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
