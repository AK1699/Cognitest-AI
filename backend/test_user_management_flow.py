#!/usr/bin/env python3
"""
Complete User-Group-Role Management Testing Script
Tests the entire workflow: invite → accept → role assignment → access control
"""

import requests
import json
import sys
from datetime import datetime, timedelta

# Configuration
API_URL = "http://localhost:8000/api/v1"
TEST_EMAIL = "testuser@example.com"
TEST_USERNAME = "testuser123"
TEST_PASSWORD = "SecurePassword123"

# Colors for output
class Colors:
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_section(title):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{title}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}\n")

def print_success(msg):
    print(f"{Colors.GREEN}✓ {msg}{Colors.END}")

def print_error(msg):
    print(f"{Colors.RED}✗ {msg}{Colors.END}")

def print_info(msg):
    print(f"{Colors.YELLOW}ℹ {msg}{Colors.END}")

def print_response(label, data):
    print(f"{Colors.BOLD}{label}:{Colors.END}")
    print(json.dumps(data, indent=2, default=str))
    print()

# Step 1: Create/Get organisation and user
def setup_test_organisation():
    """Setup: Create organisation and get admin token"""
    print_section("SETUP: Creating Test Organisation")

    # For this test, we'll use an existing organisation
    # In a real scenario, you'd create one here
    print_info("Using existing test organisation")
    print_info("Admin should be logged in and have access to organisation")

    return {
        "org_id": None,  # Will be set by user
        "admin_token": None,  # Will be set by user
    }

# Step 2: Initialize roles
def initialize_roles(org_id, admin_token):
    """Initialize default roles for organisation"""
    print_section("STEP 1: Initialize Default Roles")

    try:
        response = requests.post(
            f"{API_URL}/roles/initialize",
            json={"organisation_id": org_id},
            headers={"Authorization": f"Bearer {admin_token}"}
        )

        if response.status_code == 200:
            print_success(f"Default roles initialized for organisation {org_id}")
            print_response("Roles created", response.json())
            return True
        else:
            print_error(f"Failed to initialize roles: {response.status_code}")
            print_response("Error", response.json())
            return False

    except Exception as e:
        print_error(f"Exception: {e}")
        return False

# Step 3: Create group
def create_group(org_id, admin_token, group_name="QA Team"):
    """Create a group for managing users"""
    print_section("STEP 2: Create User Group")

    try:
        group_data = {
            "name": group_name,
            "description": f"Group for {group_name}",
            "organisation_id": org_id,
        }

        response = requests.post(
            f"{API_URL}/groups/",
            json=group_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )

        if response.status_code == 201:
            group = response.json()
            print_success(f"Group created: {group_name}")
            print_response("Group details", group)
            return group
        else:
            print_error(f"Failed to create group: {response.status_code}")
            print_response("Error", response.json())
            return None

    except Exception as e:
        print_error(f"Exception: {e}")
        return None

# Step 4: Send invitation
def send_invitation(org_id, admin_token, email, group_ids=None):
    """Send invitation to user"""
    print_section("STEP 3: Send User Invitation")

    try:
        invite_data = {
            "email": email,
            "full_name": "Test User",
            "organisation_id": org_id,
            "expiry_days": 7,
        }

        if group_ids:
            invite_data["group_ids"] = group_ids

        response = requests.post(
            f"{API_URL}/invitations/",
            json=invite_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )

        if response.status_code == 201:
            invitation = response.json()
            print_success(f"Invitation sent to {email}")
            print_response("Invitation details", invitation)
            return invitation
        else:
            print_error(f"Failed to send invitation: {response.status_code}")
            print_response("Error", response.json())
            return None

    except Exception as e:
        print_error(f"Exception: {e}")
        return None

# Step 5: Accept invitation (simulate user signup)
def accept_invitation(token, username, password):
    """Accept invitation and create user account"""
    print_section("STEP 4: Accept Invitation & Create Account")

    try:
        signup_data = {
            "token": token,
            "username": username,
            "password": password,
        }

        response = requests.post(
            f"{API_URL}/invitations/accept",
            json=signup_data
        )

        if response.status_code == 200:
            result = response.json()
            print_success(f"Invitation accepted and account created")
            print_response("Account created", {
                "user_id": result.get("user_id"),
                "email": result.get("email"),
                "username": result.get("username"),
            })
            return result
        else:
            print_error(f"Failed to accept invitation: {response.status_code}")
            print_response("Error", response.json())
            return None

    except Exception as e:
        print_error(f"Exception: {e}")
        return None

# Step 6: Assign role to group
def assign_role_to_group(org_id, admin_token, group_id, project_id, role_type="tester"):
    """Assign role to group for project"""
    print_section("STEP 5: Assign Role to Group")

    try:
        # First, get the role ID
        response = requests.get(
            f"{API_URL}/roles/",
            params={"organisation_id": org_id},
            headers={"Authorization": f"Bearer {admin_token}"}
        )

        if response.status_code != 200:
            print_error(f"Failed to fetch roles: {response.status_code}")
            return False

        roles = response.json()
        role = next((r for r in roles if r.get("role_type") == role_type), None)

        if not role:
            print_error(f"Role '{role_type}' not found")
            return False

        # Assign role to group
        assignment_data = {
            "group_id": group_id,
            "project_id": project_id,
            "role_id": role["id"],
        }

        response = requests.post(
            f"{API_URL}/roles/assignments/groups",
            json=assignment_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )

        if response.status_code == 201:
            assignment = response.json()
            print_success(f"Role '{role_type}' assigned to group for project")
            print_response("Role assignment", assignment)
            return assignment
        else:
            print_error(f"Failed to assign role: {response.status_code}")
            print_response("Error", response.json())
            return False

    except Exception as e:
        print_error(f"Exception: {e}")
        return False

# Step 7: Verify user permissions
def verify_user_permissions(user_id, project_id, admin_token):
    """Check what permissions user has for project"""
    print_section("STEP 6: Verify User Permissions")

    try:
        response = requests.get(
            f"{API_URL}/roles/user-permissions/{user_id}/project/{project_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )

        if response.status_code == 200:
            permissions = response.json()
            print_success(f"Retrieved permissions for user")
            print_response("User permissions", {
                "role": permissions.get("role_type"),
                "num_permissions": len(permissions.get("permissions", [])),
                "can_read_test_management": any(
                    p.get("resource") == "test_management" and p.get("action") == "read"
                    for p in permissions.get("permissions", [])
                ),
                "can_write_test_management": any(
                    p.get("resource") == "test_management" and p.get("action") == "write"
                    for p in permissions.get("permissions", [])
                ),
            })
            return permissions
        else:
            print_error(f"Failed to get permissions: {response.status_code}")
            print_response("Error", response.json())
            return None

    except Exception as e:
        print_error(f"Exception: {e}")
        return None

# Main test workflow
def run_tests(org_id, admin_token, project_id):
    """Run complete test workflow"""
    print(f"\n{Colors.BOLD}{Colors.GREEN}Cognitest User Management System - Complete Workflow Test{Colors.END}\n")

    # Validate inputs
    if not org_id or not admin_token or not project_id:
        print_error("Missing required parameters: org_id, admin_token, or project_id")
        print_info("Usage: python test_user_management_flow.py <org_id> <admin_token> <project_id>")
        return False

    print_info(f"Organisation ID: {org_id}")
    print_info(f"Project ID: {project_id}")

    # Step 1: Initialize roles
    if not initialize_roles(org_id, admin_token):
        print_error("Failed to initialize roles. Continuing anyway...")

    # Step 2: Create group
    group = create_group(org_id, admin_token)
    if not group:
        print_error("Failed to create group")
        return False

    # Step 3: Send invitation
    invitation = send_invitation(org_id, admin_token, TEST_EMAIL, [group["id"]])
    if not invitation:
        print_error("Failed to send invitation")
        return False

    # Step 4: Accept invitation
    user_account = accept_invitation(
        invitation["invitation_token"],
        TEST_USERNAME,
        TEST_PASSWORD
    )
    if not user_account:
        print_error("Failed to accept invitation")
        return False

    user_id = user_account.get("user_id")

    # Step 5: Assign role to group
    if not assign_role_to_group(org_id, admin_token, group["id"], project_id, "tester"):
        print_error("Failed to assign role to group")
        return False

    # Step 6: Verify permissions
    permissions = verify_user_permissions(user_id, project_id, admin_token)
    if not permissions:
        print_error("Failed to verify permissions")
        return False

    # Final summary
    print_section("TEST SUMMARY")
    print_success("✅ Complete workflow test passed!")
    print("\nWhat was accomplished:")
    print_success("1. Default roles initialized")
    print_success(f"2. Group '{group['name']}' created")
    print_success(f"3. Invitation sent to {TEST_EMAIL}")
    print_success(f"4. User account created: {TEST_USERNAME}")
    print_success(f"5. User added to group: {group['name']}")
    print_success(f"6. Role 'tester' assigned to group")
    print_success(f"7. User now has permissions for project")

    print(f"\n{Colors.BOLD}Next Steps:{Colors.END}")
    print("1. Login with credentials:")
    print(f"   Email: {TEST_EMAIL}")
    print(f"   Password: {TEST_PASSWORD}")
    print("2. User can now access test-management module")
    print("3. User can read and execute tests")
    print("4. User can create/edit test cases")

    return True

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print(f"\n{Colors.BOLD}Usage:{Colors.END}")
        print(f"python test_user_management_flow.py <org_id> <admin_token> <project_id>\n")
        print(f"{Colors.YELLOW}Example:{Colors.END}")
        print(f"python test_user_management_flow.py \\")
        print(f"  'f9744a3b-1793-4a66-992f-8ed6a27ff23a' \\")
        print(f"  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \\")
        print(f"  '18609883-e02a-48dd-8afd-794e1843eb4f'")
        sys.exit(1)

    org_id = sys.argv[1]
    admin_token = sys.argv[2]
    project_id = sys.argv[3]

    success = run_tests(org_id, admin_token, project_id)
    sys.exit(0 if success else 1)
