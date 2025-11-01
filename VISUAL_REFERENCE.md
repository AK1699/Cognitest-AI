# Cognitest RBAC System - Visual Reference Guide

## 📊 System Components at a Glance

```
┌─────────────────────────────────────────────────────────────┐
│                   COGNITEST PLATFORM                        │
│                                                              │
│  FRONTEND (React)          BACKEND (FastAPI)                │
│  ┌────────────────────┐    ┌─────────────────┐             │
│  │ InviteUserModal    │    │ /invitations/*  │             │
│  │ ModuleAccessGuard  │──→ │ /groups/*       │             │
│  │ useModuleAccess    │    │ /roles/*        │             │
│  │ ProtectedElement   │    │ /auth/*         │             │
│  └────────────────────┘    └─────────────────┘             │
│                                  ↓                           │
│                          ┌─────────────────┐               │
│                          │   PostgreSQL    │               │
│                          │   Database      │               │
│                          └─────────────────┘               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 User Journey

```
STEP 1: Signup
┌──────────────────────────────────────┐
│ User visits signup page              │
│ Creates account or uses OAuth        │
│ Account created in system            │
└──────────────────────────────────────┘
           ↓

STEP 2: Organization Setup
┌──────────────────────────────────────┐
│ User creates organisation            │
│ Becomes organisation owner/admin     │
│ Default roles auto-initialized       │
└──────────────────────────────────────┘
           ↓

STEP 3: Setup Groups & Roles
┌──────────────────────────────────────┐
│ Admin creates groups (QA, Dev, etc)  │
│ Creates projects                     │
│ Assigns roles to groups per project  │
└──────────────────────────────────────┘
           ↓

STEP 4: Invite Users
┌──────────────────────────────────────┐
│ Admin clicks "Invite User"           │
│ Fills email, selects groups          │
│ System sends invitation email        │
└──────────────────────────────────────┘
           ↓

STEP 5: User Accepts
┌──────────────────────────────────────┐
│ User clicks email link               │
│ Creates password                     │
│ Account activated                    │
│ Added to selected groups             │
│ Inherits group roles                 │
└──────────────────────────────────────┘
           ↓

STEP 6: Access Resources
┌──────────────────────────────────────┐
│ User logs in                         │
│ Navigates to project                 │
│ Modules shown based on permissions   │
│ Can perform actions allowed by role  │
└──────────────────────────────────────┘
```

## 🎯 Role Hierarchy

```
                    ADMINISTRATOR
                    (All Permissions)
                           △
                           │
                ┌──────────┼──────────┐
                │          │          │
         PROJECT MANAGER  DEV  TESTER VIEWER
         (Full Control) (Create) (Execute) (Read)

Permission Pyramid:
┌─────────────────────────────────────┐
│  Administrator (Manage ALL)         │
├─────────────────────────────────────┤
│ Project Manager (Manage + Execute)  │
├─────────────────────────────────────┤
│  Developer (Create + Execute)       │
├─────────────────────────────────────┤
│  Tester (Create + Execute)          │
├─────────────────────────────────────┤
│  Viewer (Read Only)                 │
└─────────────────────────────────────┘

Permissions expand as you go up
```

## 📋 Permission Matrix

```
         READ  WRITE  EXECUTE  MANAGE
ADMIN      ✓     ✓      ✓       ✓
PM         ✓     ✓      ✓       ✓
DEV        ✓     ✓      ✓       ✗
TESTER     ✓     ✓      ✓       ✗
VIEWER     ✓     ✗      ✗       ✗

Resources with permissions:
├─ test_management
├─ api_testing
├─ security_testing
├─ performance_testing
├─ mobile_testing
├─ automation_hub
├─ test_plan
├─ test_case
├─ test_suite
├─ test_execution
└─ ... (15+ total)
```

## 🔐 Access Control Flow

```
User requests to CREATE test case
           ↓
Authenticate user
(Is user logged in?)
           ├─ NO → 401 Unauthorized
           └─ YES ↓

Check if user has role for project
           ├─ Direct role? ✓ Use it
           ├─ Group role? ✓ Use it
           └─ No role? ✗ 403 Forbidden

Check if role has "write" permission for "test_case"
           ├─ YES ✓ → Allow request
           └─ NO ✗ → 403 Forbidden

Execute request (Create test case)
```

## 📊 Data Model

```
USERS
├─ id (UUID)
├─ email
├─ username
├─ password (hashed)
├─ created_at
└─ (can have multiple roles via groups)

GROUPS
├─ id (UUID)
├─ name
├─ description
├─ organisation_id
└─ (can have many users)

PROJECT_ROLES
├─ id (UUID)
├─ name (e.g., "Tester")
├─ role_type (enum)
├─ permissions (many)
└─ is_system_role (true for 5 defaults)

PERMISSIONS
├─ id (UUID)
├─ resource (e.g., "test_case")
├─ action (e.g., "write")
└─ description

USER_PROJECT_ROLES (Direct assignment)
├─ user_id
├─ project_id
├─ role_id
└─ assigned_by (audit trail)

GROUP_PROJECT_ROLES (Group assignment)
├─ group_id
├─ project_id
├─ role_id
└─ assigned_by (audit trail)

USER_GROUPS (Many-to-many)
├─ user_id
├─ group_id
└─ added_at

USER_INVITATIONS
├─ id (UUID)
├─ email
├─ token (unique)
├─ status (pending, accepted, etc)
├─ expires_at
└─ invited_by
```

## 🧩 Component Relationships

```
Invite Modal
    ↓
api.post('/invitations')
    ↓
Backend sends email
    ↓
User clicks link (token in URL)
    ↓
Frontend: Accept Invitation page
    ↓
User submits password
    ↓
api.post('/invitations/accept')
    ↓
Backend:
  ├─ Create user
  ├─ Mark invitation as ACCEPTED
  └─ Add user to groups
    ↓
User now has roles from groups
    ↓
Frontend: Module Access Guard
    ↓
Check: useModuleAccess(projectId, moduleId)
    ↓
api.get('/roles/user-permissions/{user_id}/project/{projectId}')
    ↓
Backend: Get all roles (direct + groups)
    ↓
Return: canRead, canWrite, canExecute, canManage
    ↓
Frontend: Show/hide UI based on permissions
```

## 🎮 Component Usage Map

```
App Page
├─ /organizations/[uuid]/users-teams/
│   ├─ Users Tab
│   │   ├─ [Invite User] button
│   │   │   └─ InviteUserModal
│   │   │       └─ api.post('/invitations')
│   │   │
│   │   └─ User list
│   │       └─ [Manage Roles] button
│   │           └─ RoleAssignmentModal
│   │               └─ api.post('/roles/assignments/users')
│   │
│   ├─ Groups Tab
│   │   ├─ [Create Group] button
│   │   │   └─ CreateGroupModal
│   │   │       └─ api.post('/groups')
│   │   │
│   │   └─ Group cards
│   │       └─ [Manage Roles] button
│   │           └─ RoleAssignmentModal
│   │               └─ api.post('/roles/assignments/groups')
│   │
│   └─ Roles Tab
│       └─ Role list

App Page
├─ /organizations/[uuid]/projects/[projectId]/test-management/
│   ├─ ModuleAccessGuard
│   │   └─ useModuleAccess('test-management')
│   │       └─ api.get('/roles/user-permissions/...')
│   │           └─ Check canRead: boolean
│   │
│   └─ Content
│       ├─ [Create Test Plan] button
│       │   └─ ProtectedElement action="write"
│       │       └─ useHasModuleAccess('test-management', 'write')
│       │
│       └─ Test Plans list
│           └─ [Edit] [Execute] [Delete] buttons
│               └─ ProtectedElement for each action
```

## 🔄 API Workflow Sequence

```
Client                          Server
  │                               │
  ├─────── POST /invitations ────→│
  │                              │
  │                    Send email │
  │                              │
  │←───── 201 Created ───────────┤
  │  (with token)               │
  │                               │
  │ (User clicks email link)      │
  │                               │
  ├─── POST /invitations/accept ──│
  │  {token, username, password} │
  │                              │
  │              Create user     │
  │              Add to groups   │
  │              Generate JWT    │
  │                              │
  │←─ 200 OK + access_token ─────┤
  │                               │
  │─── GET /user-permissions/... │
  │                              │
  │              Query roles     │
  │              Gather perms    │
  │                              │
  │←── 200 + permissions ────────┤
  │                               │
  │ (Render module access guard)  │
  │                               │
  │─── GET /projects/[id] ───────│
  │                              │
  │         Verify permission   │
  │         Return project      │
  │                              │
  │←── 200 + project data ──────┤
```

## 📦 Files & Their Relationships

```
use-module-access.ts (Hook)
    ├─ Calls: api.get('/roles/user-permissions/...')
    └─ Used by: ModuleAccessGuard, Components

ModuleAccessGuard (Component)
    ├─ Uses: useModuleAccess()
    └─ Wraps: Page/Component content

InviteUserModal (Component)
    ├─ Calls: api.post('/invitations/')
    ├─ Uses: listGroups()
    └─ Sets: Invitation status

test_user_management_flow.py (Script)
    ├─ Calls: All API endpoints
    ├─ Tests: Complete workflow
    └─ Output: Color-coded results

users-teams/page.tsx (Page)
    ├─ Uses: InviteUserModal
    ├─ Uses: RoleAssignmentModal
    └─ Shows: Users, Groups, Roles tabs

test-management/page.tsx (Page)
    ├─ Uses: ModuleAccessGuard
    └─ Calls: useModuleAccess()
```

## 🚦 Permission Decision Tree

```
User wants to access test-management module
    │
    ├─ Is user logged in?
    │   └─ NO → 401 Unauthorized
    │
    └─ YES
        │
        ├─ What's user's role in this project?
        │   ├─ Direct assignment? → Use it
        │   ├─ In groups with roles? → Combine them
        │   └─ No role? → 403 Forbidden
        │
        └─ Does role have "read test_management"?
            ├─ YES ✓ → Allow module access
            └─ NO ✗ → Show access denied
                    │
                    └─ Can user write?
                        ├─ YES → Show edit buttons
                        └─ NO → Hide edit buttons
                    │
                    └─ Can user execute?
                        ├─ YES → Show run button
                        └─ NO → Hide run button
```

## 💾 Data Flow Diagram

```
┌─────────────────┐
│  Admin Actions  │
└────────┬────────┘
         │
         ├─────────────────────────┐
         │                         │
    Invite User            Assign Roles
         │                         │
         ↓                         ↓
  Send Invitation         GroupProjectRole
  (Database)              (Database)
         │                         │
         └──────────┬──────────────┘
                    │
                    ↓
         User Acceptance
         (Email → Signup)
                    │
                    ↓
         UserGroups Record
         (Database)
                    │
                    ↓
         User Login
                    │
                    ↓
         Get Permissions
         (Direct + Group roles)
                    │
                    ↓
         Render UI
         (Show/hide by permission)
                    │
                    ↓
         User Actions
         (API calls with permission check)
```

## 🎯 Quick Reference Sheet

| Action | Component | API Endpoint | Checks |
|--------|-----------|--------------|--------|
| Invite User | InviteUserModal | POST /invitations | None |
| Accept Invite | (exists) | POST /invitations/accept | Email + Token |
| Create Group | (exists) | POST /groups | Auth |
| Add User to Group | (exists) | POST /groups/{id}/users | Admin |
| View Module | ModuleAccessGuard | GET /roles/user-perms | Role + Perms |
| Create Test Plan | ProtectedElement | POST /test-plans | Write Perm |
| Execute Tests | Button (protected) | POST /test-execution | Execute Perm |
| Manage Roles | RoleAssignmentModal | POST /roles/assignments | Admin |

## 📱 UI Component Tree

```
Layout
└─ Sidebar
   └─ Organization Menu
      ├─ Projects
      │   └─ Project Page
      │       ├─ ModuleAccessGuard
      │       │   └─ Module Content
      │       │       ├─ ProtectedElement (Create)
      │       │       ├─ ProtectedElement (Edit)
      │       │       └─ ProtectedElement (Delete)
      │       │
      │       └─ TestManagement
      │           └─ useModuleAccess
      │               ├─ Test Plans Tab
      │               ├─ Test Suites Tab
      │               └─ Test Cases Tab
      │
      └─ Users & Teams
          ├─ Users Tab
          │   ├─ [Invite] → InviteUserModal
          │   ├─ [Manage Roles] → RoleAssignmentModal
          │   └─ User List
          │
          ├─ Groups Tab
          │   ├─ [Create] → CreateGroupModal
          │   ├─ [Manage Roles] → RoleAssignmentModal
          │   └─ Group Cards
          │
          └─ Roles Tab
              └─ Role List
```

## 🎓 Learning Flow

```
START
  │
  ├─ QUICK_START_RBAC.md
  │   (5 minutes - Overview)
  │
  ├─ USER_MANAGEMENT_GUIDE.md
  │   (30 minutes - Workflows)
  │
  ├─ RBAC_IMPLEMENTATION_GUIDE.md
  │   (45 minutes - Code examples)
  │
  ├─ Run: test_user_management_flow.py
  │   (5 minutes - Verify system)
  │
  ├─ Implement components
  │   (1 hour - Add to your pages)
  │
  └─ Test & Deploy
      (2+ hours - Production ready)

Total: ~2 hours to full implementation
```

---

**This visual reference guide complements the detailed documentation. Use it alongside the markdown files for a complete understanding of the system.**

Good luck! 🚀
