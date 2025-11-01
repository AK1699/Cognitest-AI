"""
Setup standard roles with permissions according to the matrix
Run this from the backend directory: python setup_roles_matrix.py
"""

import asyncio
import sys
from pathlib import Path
from uuid import uuid4

# Add the backend to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, and_, text
from app.core.config import settings
from app.models.role import ProjectRole, Permission
from app.models.organisation import Organisation

# Permission matrix configuration
ROLE_PERMISSIONS_MATRIX = {
    "Admin": [
        "user_read_access", "user_write_access", "user_delete_access",
        "role_read_access", "role_write_access", "role_delete_access",
        "project_read_access", "project_write_access", "project_delete_access",
        "test_case_read_access", "test_case_write_access", "test_case_delete_access", "test_case_execute_access",
        "api_test_read_access", "api_test_write_access", "api_test_delete_access", "api_test_execute_access",
        "automation_read_access", "automation_write_access", "automation_delete_access", "automation_execute_access",
        "security_test_read_access", "security_test_write_access", "security_test_delete_access", "security_test_execute_access",
        "performance_test_read_access", "performance_test_write_access", "performance_test_delete_access", "performance_test_execute_access",
        "mobile_test_read_access", "mobile_test_write_access", "mobile_test_delete_access", "mobile_test_execute_access",
        "settings_read_access", "settings_write_access",
        "organization_manage_access"
    ],
    "QA Manager": [
        "project_read_access", "project_write_access",
        "test_case_read_access", "test_case_write_access", "test_case_delete_access", "test_case_execute_access",
        "api_test_read_access", "api_test_execute_access",
        "automation_read_access", "automation_execute_access",
        "security_test_read_access", "security_test_execute_access",
        "performance_test_read_access", "performance_test_execute_access",
        "mobile_test_read_access", "mobile_test_execute_access",
        "settings_read_access"
    ],
    "QA Lead": [
        "project_read_access", "project_write_access",
        "test_case_read_access", "test_case_write_access", "test_case_execute_access",
        "api_test_read_access", "api_test_execute_access",
        "automation_read_access", "automation_execute_access",
        "security_test_read_access", "security_test_execute_access",
        "performance_test_read_access", "performance_test_execute_access",
        "mobile_test_read_access", "mobile_test_execute_access"
    ],
    "QA Engineer": [
        "project_read_access",
        "test_case_read_access", "test_case_execute_access",
        "api_test_read_access", "api_test_execute_access",
        "automation_execute_access",
        "security_test_execute_access",
        "performance_test_execute_access",
        "mobile_test_execute_access"
    ],
    "Project Manager": [
        "project_read_access",
        "test_case_read_access",
        "api_test_read_access",
        "automation_read_access",
        "security_test_read_access",
        "performance_test_read_access",
        "mobile_test_read_access",
        "settings_read_access"
    ],
    "Product Owner": [
        "project_read_access",
        "test_case_read_access",
        "api_test_read_access",
        "automation_read_access",
        "security_test_read_access",
        "performance_test_read_access",
        "mobile_test_read_access",
        "settings_read_access"
    ]
}

async def setup_roles():
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        try:
            print("Setting up standard roles with permissions...\n")

            # Get all permissions
            perm_stmt = select(Permission)
            perm_result = await session.execute(perm_stmt)
            all_perms = {p.name: p for p in perm_result.scalars().all()}
            print(f"Found {len(all_perms)} permissions\n")

            # Get first organization
            org_stmt = select(Organisation).limit(1)
            org_result = await session.execute(org_stmt)
            organisation = org_result.scalar_one_or_none()

            if not organisation:
                print("❌ No organization found")
                await engine.dispose()
                return

            org_id = organisation.id
            print(f"Using organization: {organisation.name}\n")

            # Setup each role
            for role_name, perm_names in ROLE_PERMISSIONS_MATRIX.items():
                print(f"Setting up: {role_name}")

                # Check if role exists
                role_stmt = select(ProjectRole).where(
                    and_(
                        ProjectRole.name == role_name,
                        ProjectRole.organisation_id == org_id
                    )
                )
                role_result = await session.execute(role_stmt)
                role = role_result.scalar_one_or_none()

                # Prepare permissions
                role_perms = [all_perms[pn] for pn in perm_names if pn in all_perms]

                if role:
                    print(f"  ℹ️  Role exists, updating permissions...")
                    # Delete existing permissions
                    await session.execute(
                        text(f"DELETE FROM role_permissions WHERE role_id = '{role.id}'")
                    )
                else:
                    # Create new role
                    role = ProjectRole(
                        id=uuid4(),
                        name=role_name,
                        role_type=role_name.lower().replace(" ", "_"),
                        description=f"{role_name} role",
                        organisation_id=org_id,
                        is_active=True,
                        is_system_role=False
                    )
                    session.add(role)
                    await session.flush()
                    print(f"  ✓ Created {role_name}")

                # Add permissions
                for perm in role_perms:
                    try:
                        await session.execute(
                            text(f"""
                                INSERT INTO role_permissions (role_id, permission_id)
                                VALUES ('{role.id}', '{perm.id}')
                                ON CONFLICT DO NOTHING
                            """)
                        )
                    except Exception as e:
                        print(f"    ⚠️  Error: {e}")

                print(f"  ✓ Assigned {len(role_perms)} permissions")

            await session.commit()
            print("\n✅ Successfully setup all roles with permissions!")

        except Exception as e:
            await session.rollback()
            print(f"\n❌ Error: {str(e)}")
            import traceback
            traceback.print_exc()
        finally:
            await engine.dispose()

if __name__ == "__main__":
    asyncio.run(setup_roles())
