"""
Initialize Module-Based Permissions for CogniTest Platform

This script creates all permissions for the 6 main modules:
- Automation Hub
- API Testing
- Test Management
- Security Testing
- Performance Testing
- Mobile Testing

Each module has 4 permission levels: READ, WRITE, EXECUTE, MANAGE
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy import select
from app.core.database import async_session_maker
from app.models.role import Permission

# Module-based permission definitions
MODULE_PERMISSIONS = {
    "automation_hub": {
        "name": "Automation Hub",
        "permissions": [
            {
                "name": "read_automation_hub",
                "resource": "automation_hub",
                "action": "read",
                "description": "View automation hub dashboards, reports, and test results"
            },
            {
                "name": "write_automation_hub",
                "resource": "automation_hub",
                "action": "write",
                "description": "Create and modify automation scripts, configurations, and test suites"
            },
            {
                "name": "execute_automation_hub",
                "resource": "automation_hub",
                "action": "execute",
                "description": "Run automation pipelines, execute test suites, and trigger automation workflows"
            },
            {
                "name": "manage_automation_hub",
                "resource": "automation_hub",
                "action": "manage",
                "description": "Approve automation releases, assign tasks, delete configurations, and manage team permissions"
            }
        ]
    },
    "api_testing": {
        "name": "API Testing",
        "permissions": [
            {
                "name": "read_api_testing",
                "resource": "api_testing",
                "action": "read",
                "description": "View API test results, health metrics, and analytics dashboards"
            },
            {
                "name": "write_api_testing",
                "resource": "api_testing",
                "action": "write",
                "description": "Create API test suites, configure endpoints, and modify test data"
            },
            {
                "name": "execute_api_testing",
                "resource": "api_testing",
                "action": "execute",
                "description": "Run API tests, debug endpoints, and validate API responses"
            },
            {
                "name": "manage_api_testing",
                "resource": "api_testing",
                "action": "manage",
                "description": "Review API metrics, approve test configurations, and manage API testing resources"
            }
        ]
    },
    "test_management": {
        "name": "Test Management",
        "permissions": [
            {
                "name": "read_test_management",
                "resource": "test_management",
                "action": "read",
                "description": "View test cases, test plans, test cycles, and execution reports"
            },
            {
                "name": "write_test_management",
                "resource": "test_management",
                "action": "write",
                "description": "Create and modify test cases, test plans, and test documentation"
            },
            {
                "name": "execute_test_management",
                "resource": "test_management",
                "action": "execute",
                "description": "Execute assigned test cases, run test cycles, and log test results"
            },
            {
                "name": "manage_test_management",
                "resource": "test_management",
                "action": "manage",
                "description": "Oversee test cycles, approve test plans, assign test cases, and manage test resources"
            }
        ]
    },
    "security_testing": {
        "name": "Security Testing",
        "permissions": [
            {
                "name": "read_security_testing",
                "resource": "security_testing",
                "action": "read",
                "description": "View security scan reports, vulnerability summaries, and compliance dashboards"
            },
            {
                "name": "write_security_testing",
                "resource": "security_testing",
                "action": "write",
                "description": "Configure security scans, define test parameters, and document vulnerabilities"
            },
            {
                "name": "execute_security_testing",
                "resource": "security_testing",
                "action": "execute",
                "description": "Run security scans, execute penetration tests, and validate security patches"
            },
            {
                "name": "manage_security_testing",
                "resource": "security_testing",
                "action": "manage",
                "description": "Audit compliance reports, approve security configurations, and manage security testing workflows"
            }
        ]
    },
    "performance_testing": {
        "name": "Performance Testing",
        "permissions": [
            {
                "name": "read_performance_testing",
                "resource": "performance_testing",
                "action": "read",
                "description": "View performance metrics, load test results, and performance dashboards"
            },
            {
                "name": "write_performance_testing",
                "resource": "performance_testing",
                "action": "write",
                "description": "Configure load tests, define performance thresholds, and create test scenarios"
            },
            {
                "name": "execute_performance_testing",
                "resource": "performance_testing",
                "action": "execute",
                "description": "Run performance tests, monitor system load, and analyze performance logs"
            },
            {
                "name": "manage_performance_testing",
                "resource": "performance_testing",
                "action": "manage",
                "description": "Review performance KPIs, approve performance thresholds, and manage testing infrastructure"
            }
        ]
    },
    "mobile_testing": {
        "name": "Mobile Testing",
        "permissions": [
            {
                "name": "read_mobile_testing",
                "resource": "mobile_testing",
                "action": "read",
                "description": "View mobile test results, UX metrics, and device compatibility reports"
            },
            {
                "name": "write_mobile_testing",
                "resource": "mobile_testing",
                "action": "write",
                "description": "Configure mobile test suites, define test devices, and create mobile test cases"
            },
            {
                "name": "execute_mobile_testing",
                "resource": "mobile_testing",
                "action": "execute",
                "description": "Run mobile tests on devices, debug mobile apps, and validate UX flows"
            },
            {
                "name": "manage_mobile_testing",
                "resource": "mobile_testing",
                "action": "manage",
                "description": "Review mobile releases, approve app builds, and manage mobile testing resources"
            }
        ]
    }
}


async def initialize_module_permissions():
    """Initialize all module-based permissions"""
    print("🚀 Initializing Module-Based Permissions...")
    print("=" * 60)

    async with async_session_maker() as session:
        total_created = 0
        total_skipped = 0

        for module_key, module_data in MODULE_PERMISSIONS.items():
            print(f"\n📦 Module: {module_data['name']}")
            print("-" * 60)

            for perm_data in module_data['permissions']:
                # Check if permission already exists
                result = await session.execute(
                    select(Permission).where(Permission.name == perm_data['name'])
                )
                existing = result.scalar_one_or_none()

                if existing:
                    print(f"  ⏭️  Skipped: {perm_data['name']} (already exists)")
                    total_skipped += 1
                    continue

                # Create new permission
                permission = Permission(
                    name=perm_data['name'],
                    resource=perm_data['resource'],
                    action=perm_data['action'],
                    description=perm_data['description'],
                    is_system_permission=True
                )
                session.add(permission)
                print(f"  ✅ Created: {perm_data['name']}")
                print(f"     • Resource: {perm_data['resource']}")
                print(f"     • Action: {perm_data['action']}")
                print(f"     • Description: {perm_data['description']}")
                total_created += 1

        await session.commit()

        print("\n" + "=" * 60)
        print(f"✨ Summary:")
        print(f"   • Total Permissions Created: {total_created}")
        print(f"   • Total Permissions Skipped: {total_skipped}")
        print(f"   • Total Modules Configured: {len(MODULE_PERMISSIONS)}")
        print("=" * 60)


if __name__ == "__main__":
    asyncio.run(initialize_module_permissions())
