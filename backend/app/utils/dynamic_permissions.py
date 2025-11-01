"""
Dynamic Permission Generator
Generates granular permissions based on enabled modules in the organization
"""

from typing import List, Dict, Set

# Available testing modules with their granular permissions
AVAILABLE_MODULES = {
    "test_management": {
        "name": "Test Case Management",
        "description": "Test case creation and execution",
        "icon": "📋",
        "permissions": [
            {"name": "test_case_read_access", "action": "read", "description": "Read test case artifacts"},
            {"name": "test_case_write_access", "action": "write", "description": "Create and update test cases"},
            {"name": "test_case_delete_access", "action": "delete", "description": "Delete test cases"},
            {"name": "test_case_execute_access", "action": "execute", "description": "Execute test cases"},
        ]
    },
    "api_testing": {
        "name": "API Testing",
        "description": "API endpoint testing",
        "icon": "<>",
        "permissions": [
            {"name": "api_test_read_access", "action": "read", "description": "Read API tests and results"},
            {"name": "api_test_write_access", "action": "write", "description": "Create and update API tests"},
            {"name": "api_test_delete_access", "action": "delete", "description": "Delete API tests"},
            {"name": "api_test_execute_access", "action": "execute", "description": "Run API tests"},
        ]
    },
    "automation_hub": {
        "name": "Automation Hub",
        "description": "Test automation and workflows",
        "icon": "⚡",
        "permissions": [
            {"name": "automation_read_access", "action": "read", "description": "Read automation workflows"},
            {"name": "automation_write_access", "action": "write", "description": "Create and update automation workflows"},
            {"name": "automation_delete_access", "action": "delete", "description": "Delete automation workflows"},
            {"name": "automation_execute_access", "action": "execute", "description": "Execute automation workflows"},
        ]
    },
    "security_testing": {
        "name": "Security Testing",
        "description": "Security vulnerability testing",
        "icon": "🛡️",
        "permissions": [
            {"name": "security_test_read_access", "action": "read", "description": "Read security scan definitions and reports"},
            {"name": "security_test_write_access", "action": "write", "description": "Create and update security tests"},
            {"name": "security_test_delete_access", "action": "delete", "description": "Delete security tests/reports"},
            {"name": "security_test_execute_access", "action": "execute", "description": "Initiate security scans"},
        ]
    },
    "performance_testing": {
        "name": "Performance Testing",
        "description": "Performance and load testing",
        "icon": "📊",
        "permissions": [
            {"name": "performance_test_read_access", "action": "read", "description": "Read performance test scenarios and results"},
            {"name": "performance_test_write_access", "action": "write", "description": "Create and update performance tests"},
            {"name": "performance_test_delete_access", "action": "delete", "description": "Delete performance tests"},
            {"name": "performance_test_execute_access", "action": "execute", "description": "Run performance/load tests"},
        ]
    },
    "mobile_testing": {
        "name": "Mobile Testing",
        "description": "Mobile app testing",
        "icon": "📱",
        "permissions": [
            {"name": "mobile_test_read_access", "action": "read", "description": "Read mobile test scenarios and results"},
            {"name": "mobile_test_write_access", "action": "write", "description": "Create and update mobile tests"},
            {"name": "mobile_test_delete_access", "action": "delete", "description": "Delete mobile tests"},
            {"name": "mobile_test_execute_access", "action": "execute", "description": "Execute mobile app tests"},
        ]
    },
}

# Static permissions (always present)
STATIC_PERMISSION_GROUPS = {
    "User Management": ["user_read_access", "user_write_access", "user_delete_access"],
    "Role Management": ["role_read_access", "role_write_access", "role_delete_access"],
    "Project Management": [
        "project_read_access",
        "project_write_access",
        "project_delete_access",
    ],
    "Settings": ["settings_read_access", "settings_write_access"],
    "Organization": ["organization_manage_access"],
}

# Test Case Management group (always included)
TEST_CASE_MANAGEMENT_GROUP = {
    "Test Case Management": ["test_case_read_access", "test_case_write_access", "test_case_delete_access", "test_case_execute_access"]
}


def get_module_permissions(module_key: str) -> List[str]:
    """Get permission names for a specific module"""
    if module_key in AVAILABLE_MODULES:
        return [perm["name"] for perm in AVAILABLE_MODULES[module_key]["permissions"]]
    return []


def generate_dynamic_permission_groups(enabled_modules: List[str]) -> Dict[str, List[str]]:
    """
    Generate permission groups based on enabled modules

    Args:
        enabled_modules: List of enabled module keys (e.g., ['api_testing', 'automation_hub'])

    Returns:
        Dictionary with permission groups organized by module name
    """
    groups = dict(STATIC_PERMISSION_GROUPS)

    # Always include Test Case Management permissions (core functionality)
    groups.update(TEST_CASE_MANAGEMENT_GROUP)

    # Add dynamic module groups with their specific granular permissions
    for module_key in enabled_modules:
        if module_key in AVAILABLE_MODULES and module_key != "test_management":
            module_info = AVAILABLE_MODULES[module_key]
            group_name = module_info["name"]
            permission_names = [perm["name"] for perm in module_info["permissions"]]
            groups[group_name] = permission_names

    return groups


def get_all_permissions_list(enabled_modules: List[str]) -> List[Dict]:
    """
    Get flat list of all permissions with metadata

    Args:
        enabled_modules: List of enabled module keys

    Returns:
        List of permission dictionaries with name, resource, action, description
    """
    permissions = []

    # Add static permissions
    static_perms = [
        ("user_read_access", "user", "read", "Read user information"),
        ("user_write_access", "user", "write", "Create and update users"),
        ("user_delete_access", "user", "delete", "Delete users"),
        ("role_read_access", "role", "read", "Read role information"),
        ("role_write_access", "role", "write", "Create and update roles"),
        ("role_delete_access", "role", "delete", "Delete roles"),
        ("project_read_access", "project", "read", "Read project information"),
        ("project_write_access", "project", "write", "Create and update projects"),
        ("project_delete_access", "project", "delete", "Delete projects"),
        ("settings_read_access", "settings", "read", "Read settings"),
        ("settings_write_access", "settings", "write", "Update settings"),
        ("organization_manage_access", "organization", "manage", "Manage organization"),
    ]

    for name, resource, action, desc in static_perms:
        permissions.append(
            {"name": name, "resource": resource, "action": action, "description": desc}
        )

    # Add test case management permissions (always present)
    if "test_management" in AVAILABLE_MODULES:
        module_info = AVAILABLE_MODULES["test_management"]
        for perm in module_info["permissions"]:
            permissions.append({
                "name": perm["name"],
                "resource": "test_management",
                "action": perm["action"],
                "description": perm["description"]
            })

    # Add enabled module permissions with granular details
    for module_key in enabled_modules:
        if module_key in AVAILABLE_MODULES and module_key != "test_management":
            module_info = AVAILABLE_MODULES[module_key]
            for perm in module_info["permissions"]:
                permissions.append({
                    "name": perm["name"],
                    "resource": module_key,
                    "action": perm["action"],
                    "description": perm["description"]
                })

    return permissions


def get_enabled_modules_from_projects(projects: List) -> Set[str]:
    """
    Extract enabled modules from a list of projects

    Args:
        projects: List of Project objects

    Returns:
        Set of enabled module keys
    """
    enabled_modules = set()

    for project in projects:
        if hasattr(project, "settings") and isinstance(project.settings, dict):
            modules = project.settings.get("enabled_modules", [])
            if isinstance(modules, list):
                enabled_modules.update(modules)

    return enabled_modules


def get_enabled_modules_from_organisation(organisation) -> Set[str]:
    """
    Extract enabled modules from organization settings

    Args:
        organisation: Organisation object with settings

    Returns:
        Set of enabled module keys
    """
    if hasattr(organisation, "settings") and isinstance(organisation.settings, dict):
        modules = organisation.settings.get("enabled_modules", [])
        if isinstance(modules, list):
            return set(modules)

    return set()
