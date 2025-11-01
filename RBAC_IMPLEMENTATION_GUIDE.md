# RBAC Implementation Guide - Complete System

## Overview

This guide explains the complete production-ready User-Group-Role Management System in Cognitest, including all new components and how to use them.

## Architecture

```
Organisation
│
├── Projects
│   ├── Modules (protected by RBAC)
│   │   ├── test-management
│   │   ├── api-testing
│   │   ├── security-testing
│   │   ├── performance-testing
│   │   ├── mobile-testing
│   │   └── automation-hub
│   │
│   └── Resources
│       ├── test-plans
│       ├── test-suites
│       ├── test-cases
│       └── test-executions
│
├── Users
│   ├── Direct Project Roles
│   └── Group Memberships → Inherited Project Roles
│
├── Groups
│   ├── Members (Many Users)
│   └── Project Roles (Many Projects)
│
└── Roles & Permissions
    ├── 5 System Roles
    │   ├── Administrator (all permissions)
    │   ├── Project Manager (manage + execute)
    │   ├── Developer (create/edit + execute)
    │   ├── Tester (create/edit + execute)
    │   └── Viewer (read-only)
    │
    └── Permissions (Granular)
        ├── Resources: 15+ types
        └── Actions: read, write, execute, manage
```

## Components

### 1. Module Access Hook (`lib/hooks/use-module-access.ts`)

Check if user has access to a module and what actions they can perform.

**Usage:**
```typescript
import { useModuleAccess } from '@/lib/hooks/use-module-access'

function TestManagementPage({ projectId }: { projectId: string }) {
  const access = useModuleAccess(projectId, 'test-management', 'read')

  if (access.loading) return <LoadingSpinner />

  if (!access.hasAccess) {
    return <AccessDenied />
  }

  return (
    <>
      {access.canWrite && <CreatePlanButton />}
      {access.canExecute && <ExecuteTestsButton />}
      {/* Content here */}
    </>
  )
}
```

**Returns:**
```typescript
{
  hasAccess: boolean,        // Has any permission for module
  canRead: boolean,          // Can read the module
  canWrite: boolean,         // Can create/edit resources
  canExecute: boolean,       // Can execute tests
  canManage: boolean,        // Can manage settings/members
  role?: string,             // User's role name
  source?: string,           // 'direct' or 'group'
  loading: boolean,          // Loading state
  error?: string,            // Error message
}
```

### 2. Module Access Guard (`components/rbac/module-access-guard.tsx`)

Wrapper component to protect access to modules.

**Usage:**
```typescript
import { ModuleAccessGuard, ProtectedElement } from '@/components/rbac/module-access-guard'

// Full component protection
<ModuleAccessGuard
  projectId={projectId}
  moduleId="test-management"
  requiredAction="read"
>
  <TestManagementContent />
</ModuleAccessGuard>

// Conditional element
<ProtectedElement
  projectId={projectId}
  moduleId="test-management"
  action="write"
>
  <CreateTestPlanButton />
</ProtectedElement>
```

### 3. Invite User Modal (`components/users-teams/invite-user-modal.tsx`)

Clean, user-friendly modal for inviting users.

**Usage:**
```typescript
import { InviteUserModal } from '@/components/users-teams/invite-user-modal'
import { useState } from 'react'

function UsersTeamsPage() {
  const [inviteOpen, setInviteOpen] = useState(false)
  const organisationId = useParams().uuid

  return (
    <>
      <button onClick={() => setInviteOpen(true)}>
        Invite User
      </button>

      <InviteUserModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        organisationId={organisationId}
        onSuccess={() => {
          // Refresh user list
          loadUsers()
        }}
      />
    </>
  )
}
```

## Complete Workflow

### Step 1: Admin Setup

```typescript
// Organization admin initializes system
async function setupOrganisation(orgId: string) {
  // Initialize default roles
  await api.post('/api/v1/roles/initialize', {
    organisation_id: orgId
  })

  // Create groups
  const groupResponse = await api.post('/api/v1/groups/', {
    name: 'QA Team',
    description: 'Quality Assurance Team',
    organisation_id: orgId
  })

  const groupId = groupResponse.data.id

  // Create project
  const projectResponse = await api.post('/api/v1/projects/', {
    name: 'Project Alpha',
    organisation_id: orgId
  })

  const projectId = projectResponse.data.id

  // Get tester role
  const rolesResponse = await api.get('/api/v1/roles/', {
    params: { organisation_id: orgId }
  })

  const testerRole = rolesResponse.data.find(r => r.role_type === 'tester')

  // Assign tester role to QA Team for project
  await api.post('/api/v1/roles/assignments/groups', {
    group_id: groupId,
    project_id: projectId,
    role_id: testerRole.id
  })
}
```

### Step 2: Invite Users

```typescript
// Admin invites users via UI or API
async function inviteQAEngineer(email: string, orgId: string) {
  const response = await api.post('/api/v1/invitations/', {
    email,
    full_name: 'John Doe',
    organisation_id: orgId,
    group_ids: [groupId],  // Auto-add to QA Team
    expiry_days: 7
  })

  // System automatically sends email with signup link
}
```

### Step 3: Users Accept Invitation

```typescript
// User receives email with link:
// https://cognitest.ai/auth/accept-invitation?token={token}

// User fills in signup form and submits
async function acceptInvitation(token: string, username: string, password: string) {
  const response = await api.post('/api/v1/invitations/accept', {
    token,
    username,
    password
  })

  // Account created
  // User added to organisation
  // User added to pre-selected groups
  // Invitation marked as ACCEPTED
}
```

### Step 4: System Enforces Access

```typescript
// When user navigates to Project Alpha
// System checks:
// 1. Is user in QA Team group?
// 2. Does QA Team have role for this project?
// 3. What actions does the role allow?

// User sees only test-management module (group's role permission)
// User can read and execute tests (role's permissions)
// User can create/edit test cases (tester role permission)
// User CANNOT manage roles or settings (not in role)
```

## API Reference

### User Invitations

```
POST /api/v1/invitations/
{
  "email": "user@example.com",
  "full_name": "John Doe",
  "organisation_id": "org-uuid",
  "group_ids": ["group-1", "group-2"],
  "expiry_days": 7
}

GET /api/v1/invitations/?organisation_id=org-uuid
GET /api/v1/invitations/?status=pending

POST /api/v1/invitations/accept
{
  "token": "invitation-token",
  "username": "john_doe",
  "password": "SecurePassword123"
}

DELETE /api/v1/invitations/{invitation_id}
```

### Groups

```
POST /api/v1/groups/
{
  "name": "QA Team",
  "description": "Quality Assurance",
  "organisation_id": "org-uuid"
}

GET /api/v1/groups/?organisation_id=org-uuid

POST /api/v1/groups/{group_id}/users
{
  "user_id": "user-uuid"
}

DELETE /api/v1/groups/{group_id}/users/{user_id}

GET /api/v1/groups/{group_id}/users
```

### Roles & Permissions

```
POST /api/v1/roles/initialize
{
  "organisation_id": "org-uuid"
}

GET /api/v1/roles/?organisation_id=org-uuid

POST /api/v1/roles/assignments/groups
{
  "group_id": "group-uuid",
  "project_id": "project-uuid",
  "role_id": "role-uuid"
}

GET /api/v1/roles/user-permissions/{user_id}/project/{project_id}
Returns:
{
  "user_id": "...",
  "role_type": "tester",
  "permissions": [
    {
      "resource": "test_management",
      "action": "read"
    },
    {
      "resource": "test_management",
      "action": "write"
    },
    ...
  ]
}

POST /api/v1/roles/check-permission
{
  "project_id": "project-uuid",
  "resource": "test_case",
  "action": "create"
}
Returns:
{
  "has_permission": true
}
```

## Frontend Integration Examples

### Example 1: Protecting a Module Page

```typescript
// app/organizations/[uuid]/projects/[projectId]/test-management/page.tsx

'use client'

import { ModuleAccessGuard } from '@/components/rbac/module-access-guard'
import { useModuleAccess } from '@/lib/hooks/use-module-access'

export default function TestManagementPage({
  params,
}: {
  params: { uuid: string; projectId: string }
}) {
  const access = useModuleAccess(params.projectId, 'test-management')

  return (
    <ModuleAccessGuard
      projectId={params.projectId}
      moduleId="test-management"
    >
      <div className="space-y-6">
        <Header />

        {/* Show create button only if user can write */}
        {access.canWrite && <CreateTestPlanButton />}

        <TestPlans />
      </div>
    </ModuleAccessGuard>
  )
}
```

### Example 2: Conditional Features Based on Permissions

```typescript
function TestPlanActions({ testPlanId, projectId }: Props) {
  const { canWrite, canExecute, canManage } = useModuleAccess(
    projectId,
    'test-management'
  )

  return (
    <div className="flex gap-2">
      {canWrite && (
        <>
          <Button onClick={() => editTestPlan(testPlanId)}>Edit</Button>
          <Button onClick={() => deleteTestPlan(testPlanId)}>Delete</Button>
        </>
      )}

      {canExecute && (
        <Button onClick={() => executeTests(testPlanId)}>Run</Button>
      )}

      {canManage && (
        <Button onClick={() => manageSettings()}>Settings</Button>
      )}

      <Button onClick={() => viewDetails(testPlanId)}>View</Button>
    </div>
  )
}
```

### Example 3: Invite User Modal Integration

```typescript
'use client'

import { InviteUserModal } from '@/components/users-teams/invite-user-modal'
import { useState } from 'react'
import { useParams } from 'next/navigation'

export function UsersTab() {
  const [inviteOpen, setInviteOpen] = useState(false)
  const { uuid: organisationId } = useParams()

  const handleInviteSuccess = () => {
    // Refresh users list
    loadUsers()
  }

  return (
    <>
      <button
        onClick={() => setInviteOpen(true)}
        className="btn btn-primary"
      >
        Invite User
      </button>

      <InviteUserModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        organisationId={organisationId as string}
        onSuccess={handleInviteSuccess}
      />

      {/* Rest of users tab */}
    </>
  )
}
```

## Testing the System

### Quick Test with Script

```bash
# Make sure backend is running
cd backend

# Run the test script
python3 test_user_management_flow.py <org_id> <admin_token> <project_id>

# Example:
python3 test_user_management_flow.py \
  'f9744a3b-1793-4a66-992f-8ed6a27ff23a' \
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  '18609883-e02a-48dd-8afd-794e1843eb4f'
```

### Manual Testing Checklist

- [ ] Create organisation
- [ ] Initialize roles
- [ ] Create project
- [ ] Create group
- [ ] Assign role to group for project
- [ ] Invite 2 users with different groups
- [ ] Accept invitations as each user
- [ ] Verify each user sees correct modules
- [ ] Verify each user has correct permissions
- [ ] Test write permissions (one user can, one can't)
- [ ] Test module access guard blocking access
- [ ] Test permission checking on API calls

## Security Considerations

### 1. Frontend Access Guards

- **Always use `ModuleAccessGuard`** for sensitive content
- **Check permissions before showing buttons** that require permissions
- **These are NOT security boundaries** - always validate on backend

### 2. Backend Enforcement (Critical)

- **All API endpoints must check permissions**
- **Use dependency injection to get current user**
- **Check resource ownership and role permissions**
- **Return 403 Forbidden if permission denied**

### 3. Token Security

- **Access tokens expire (default 15 minutes)**
- **Refresh tokens stored in HttpOnly cookies**
- **Auto-refresh on 401 responses**
- **CSRF protection with SameSite cookies**

### 4. Audit Trail

- **Track who assigned which roles**
- **Track invitation acceptance**
- **Log all administrative actions**
- **Maintain created_at/updated_at timestamps**

## Troubleshooting

### User can't access module after invitation

```typescript
// 1. Check user is in group
const groupUsers = await api.get(`/api/v1/groups/${groupId}/users`)
// User should appear in list

// 2. Check group has role for project
const groupRoles = await api.get(
  `/api/v1/roles/assignments/groups?group_id=${groupId}`
)
// Should have assignment for the project

// 3. Check user's actual permissions
const userPerms = await api.get(
  `/api/v1/roles/user-permissions/${userId}/project/${projectId}`
)
// Should show correct permissions
```

### Module not showing in UI

```typescript
// 1. Check ModuleAccessGuard is in place
// Should see "Access Denied" if no access

// 2. Check useModuleAccess hook is called
const access = useModuleAccess(projectId, 'module-id')
console.log(access)  // Check canRead = true

// 3. Check API returns permissions
const response = await fetch(
  `/api/v1/roles/user-permissions/${userId}/project/${projectId}`
)
const data = await response.json()
console.log(data.permissions)  // Should include module
```

### Invitation not received

1. Check SMTP is configured
2. Check email address is correct
3. Resend invitation: `POST /api/v1/invitations/{id}/resend`
4. Check spam folder

## Files Created/Modified

### New Files Created

- `frontend/lib/hooks/use-module-access.ts` - RBAC access checking hook
- `frontend/components/rbac/module-access-guard.tsx` - Protected route component
- `frontend/components/users-teams/invite-user-modal.tsx` - Invite modal
- `backend/test_user_management_flow.py` - Testing script
- `USER_MANAGEMENT_GUIDE.md` - User management documentation
- `RBAC_IMPLEMENTATION_GUIDE.md` - This file

### Files That Work With RBAC

- `app/organizations/[uuid]/users-teams/page.tsx` - Users/groups/roles management
- `lib/api/invitations.ts` - Invitation API client
- `lib/api/groups.ts` - Group API client
- `lib/api/roles.ts` - Role API client
- `components/roles/role-assignment-modal.tsx` - Role assignment UI

## Next Steps

1. **Integrate new components** into your pages
2. **Use `ModuleAccessGuard`** to protect sensitive modules
3. **Run test script** to verify workflow
4. **Configure SMTP** for invitation emails
5. **Set up monitoring** for permission checks
6. **Create audit logs** for compliance

## Support

For issues or questions:

1. Check `USER_MANAGEMENT_GUIDE.md` for workflows
2. Review API examples in this document
3. Check `test_user_management_flow.py` for working examples
4. Enable debug logging in frontend to see permission checks
