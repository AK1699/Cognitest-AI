# Cognitest User-Group Management System Guide

## Architecture Overview

### 1. User Invitation Flow

```
Admin invites user
  ↓
System sends email with invitation link
  ↓
User clicks link → Signup page with pre-filled data
  ↓
User creates password
  ↓
Account created + User added to organisation
  ↓
Pre-assigned groups applied
  ↓
User can access resources based on group roles
```

### 2. Access Control Hierarchy

```
Organisation
├── Projects
│   ├── Modules (test-management, api-testing, etc.)
│   └── Resources (test-plans, test-cases, etc.)
├── Users
│   ├── Direct Project Roles (User → Project → Role)
│   └── Group Memberships
│       └── Group Project Roles
├── Groups
│   ├── Members (Users)
│   └── Project Roles
└── Roles
    ├── System Roles (5 default)
    └── Custom Roles
        └── Permissions
```

### 3. Role Hierarchy

**System Roles (Fixed):**

1. **Administrator** (All permissions)
   - Manage users, groups, roles
   - Manage projects
   - Manage all modules
   - View reports
   - Manage settings

2. **Project Manager**
   - Create/edit/delete test plans, suites, cases
   - Manage project members
   - View reports
   - Execute tests
   - Manage project settings

3. **Developer**
   - Create/edit test cases
   - Execute tests
   - Read all resources
   - Write to modules assigned

4. **Tester**
   - Create/edit test cases
   - Execute tests
   - Read all resources

5. **Viewer** (Read-only)
   - Read all resources
   - No write/execute permissions

### 4. Permission Model

**Resources:**
- project, test_plan, test_suite, test_case, test_execution
- user, group, role, settings
- automation_hub, api_testing, security_testing, performance_testing, mobile_testing, test_management

**Actions:**
- read, create, update, delete, execute, manage, write

## API Endpoints Reference

### User Management
```
POST   /api/v1/users/                          # Create user (admin only)
GET    /api/v1/users/                          # List org users
GET    /api/v1/users/{id}                      # Get user details
PUT    /api/v1/users/{id}                      # Update user
DELETE /api/v1/users/{id}                      # Delete user
```

### Invitations
```
POST   /api/v1/invitations/                    # Send invitation
GET    /api/v1/invitations/                    # List invitations
POST   /api/v1/invitations/{id}/resend         # Resend invitation
POST   /api/v1/invitations/accept              # Accept invitation
DELETE /api/v1/invitations/{id}                # Revoke invitation
```

### Groups
```
POST   /api/v1/groups/                         # Create group
GET    /api/v1/groups/                         # List groups
GET    /api/v1/groups/{id}                     # Get group details
PUT    /api/v1/groups/{id}                     # Update group
DELETE /api/v1/groups/{id}                     # Delete group
POST   /api/v1/groups/{id}/users               # Add user to group
DELETE /api/v1/groups/{id}/users/{user_id}    # Remove user from group
GET    /api/v1/groups/{id}/users               # List group members
```

### Roles
```
POST   /api/v1/roles/initialize                # Initialize default roles
POST   /api/v1/roles/                          # Create custom role
GET    /api/v1/roles/                          # List roles
GET    /api/v1/roles/{id}                      # Get role with permissions
PUT    /api/v1/roles/{id}                      # Update role
DELETE /api/v1/roles/{id}                      # Delete custom role

POST   /api/v1/roles/permissions               # List all permissions
POST   /api/v1/roles/check-permission          # Check if user has permission

POST   /api/v1/roles/assignments/users         # Assign role to user
GET    /api/v1/roles/assignments/users         # List user role assignments
DELETE /api/v1/roles/assignments/users/{id}    # Remove user role

POST   /api/v1/roles/assignments/groups        # Assign role to group
GET    /api/v1/roles/assignments/groups        # List group role assignments
DELETE /api/v1/roles/assignments/groups/{id}   # Remove group role

GET    /api/v1/roles/user-permissions/{user_id}/project/{project_id}
                                               # Get user's permissions for project
```

## Step-by-Step Workflows

### Workflow 1: Invite User & Assign to Group

1. **Admin navigates to Users-Teams > Users tab**
2. **Clicks "Invite User" button**
3. **Fills in:**
   - Email (required)
   - Full Name (optional)
   - Select groups to add to (optional)
   - Expiry days (default 7)
4. **System:**
   - Generates unique invitation token
   - Sends email with signup link
   - Sets invitation as PENDING
5. **User receives email, clicks link**
6. **User fills in:**
   - Username
   - Password
   - Confirm password
7. **System:**
   - Creates user account
   - Marks invitation as ACCEPTED
   - Adds user to selected groups
8. **User can now access resources based on group roles**

### Workflow 2: Direct Role Assignment to User

1. **Admin goes to Users-Teams > Users tab**
2. **Clicks "Manage Roles" on user**
3. **Selects project from dropdown**
4. **Clicks "Add Role"**
5. **Selects role from list**
6. **Clicks "Assign"**
7. **System creates UserProjectRole record**
8. **User immediately gets role permissions for that project**

### Workflow 3: Group Role Assignment

1. **Admin goes to Users-Teams > Groups tab**
2. **Clicks "Manage Roles" on group**
3. **Selects project**
4. **Selects role**
5. **Clicks "Assign"**
6. **System creates GroupProjectRole**
7. **ALL group members immediately get role permissions**

### Workflow 4: User Module Access

1. **User logs in**
2. **User navigates to project**
3. **System checks:**
   - Direct user roles for project
   - Group roles for project
4. **Module/feature is shown/hidden based on permissions**
5. **API requests are validated for permission**

## Database Schema

### Key Tables

**users**
- id (UUID, PK)
- email (unique)
- username (unique)
- full_name
- hashed_password
- is_active
- created_at

**user_invitations**
- id (UUID, PK)
- email
- invitation_token (unique)
- status (PENDING, ACCEPTED, EXPIRED, REVOKED)
- organisation_id (FK)
- invited_by (FK user_id)
- created_at
- expires_at

**groups**
- id (UUID, PK)
- organisation_id (FK)
- name
- description
- is_active
- created_by

**user_groups** (junction table)
- user_id (FK)
- group_id (FK)
- added_at
- added_by

**project_roles** (defined roles)
- id (UUID, PK)
- organisation_id (FK)
- name
- role_type (enum)
- is_system_role
- is_active
- created_by

**permissions**
- id (UUID, PK)
- name (unique)
- resource
- action
- is_system_permission

**role_permissions** (junction)
- role_id (FK)
- permission_id (FK)

**user_project_roles** (direct assignments)
- id (UUID, PK)
- user_id (FK)
- project_id (FK)
- role_id (FK)
- assigned_at
- assigned_by

**group_project_roles** (group assignments)
- id (UUID, PK)
- group_id (FK)
- project_id (FK)
- role_id (FK)
- assigned_at
- assigned_by

## Configuration

### Environment Variables

```
# SMTP for email invitations
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@cognitest.ai
SMTP_FROM_NAME=Cognitest

# Invitation expiry
INVITATION_EXPIRY_DAYS=7

# Frontend
FRONTEND_URL=http://localhost:3000
```

### Frontend URL for Invitations

When sending invitations, the system creates a link:
```
{FRONTEND_URL}/auth/accept-invitation?token={invitation_token}
```

## Security Considerations

1. **Token Expiration** - Invitations expire after configured days (default 7)
2. **One-Time Use** - Token is invalidated after acceptance
3. **Email Verification** - User must have access to invited email
4. **Password Security** - Bcrypt hashing, minimum requirements
5. **HttpOnly Cookies** - Sessions stored securely
6. **Permission Enforcement** - All API endpoints check permissions
7. **Audit Trail** - Who assigned what role to whom is tracked

## Troubleshooting

### Issue: Invitations not received
- Check SMTP configuration
- Verify email address is correct
- Check spam folder
- Resend invitation

### Issue: User can't access resources despite having role
- Verify role is assigned for correct project
- Check if user's role is active
- Check if group membership is active
- Verify role has required permissions

### Issue: Module shows but user can't perform action
- Check permissions assigned to role
- Verify role type matches what's needed
- Check if action is enabled for that module

## Testing Checklist

- [ ] Create organisation
- [ ] Initialize default roles
- [ ] Invite 3 users (different email domains)
- [ ] Accept all invitations
- [ ] Create 2 groups
- [ ] Add users to groups
- [ ] Assign roles to groups
- [ ] Create project in organisation
- [ ] Assign roles to users directly
- [ ] Assign roles to groups for project
- [ ] Verify each user can access correct modules
- [ ] Verify read-only vs. read-write permissions
- [ ] Test permission inheritance from groups
- [ ] Test direct role override
- [ ] Revoke invitation midway
- [ ] Test expired invitation
