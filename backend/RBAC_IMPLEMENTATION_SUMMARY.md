# User Group Management & RBAC Implementation Summary

## ✅ **PHASE 1 COMPLETE - Database Layer**

A comprehensive Role-Based Access Control (RBAC) system has been implemented for Cognitest.

---

## 🎉 What Has Been Implemented

### **1. Database Models** ✅

#### **Group Model** (`app/models/group.py`)
- Groups for organizing users
- Many-to-many relationship with users via `user_groups` table
- Belongs to an organisation
- Tracks creation metadata

**Fields:**
- `id` - UUID primary key
- `organisation_id` - Foreign key to organisations
- `name` - Group name
- `description` - Optional description
- `is_active` - Active status
- `created_at`, `updated_at` - Timestamps
- `created_by` - Creator email

**Relationships:**
- `users` - Users in this group
- `organisation` - Parent organisation

#### **Project Role Model** (`app/models/role.py`)
- Defines roles that can be assigned to users
- 5 predefined role types: Administrator, Developer, Tester, Project Manager, Viewer
- Can create custom roles
- Linked to permissions

**Fields:**
- `id` - UUID primary key
- `organisation_id` - Foreign key to organisations
- `name` - Role display name (e.g., "Administrator")
- `role_type` - Role type enum (administrator, developer, tester, project_manager, viewer)
- `description` - Role description
- `is_system_role` - Whether it's a system role (cannot be deleted)
- `is_active` - Active status
- `meta_data` - Additional metadata JSON
- `created_at`, `updated_at` - Timestamps
- `created_by` - Creator email

**Relationships:**
- `permissions` - Permissions assigned to this role
- `user_project_roles` - User assignments for projects

#### **Permission Model** (`app/models/role.py`)
- Granular permissions for actions on resources
- 36 predefined permissions covering all features
- Resources: project, test_plan, test_suite, test_case, test_execution, user, group, role, settings
- Actions: create, read, update, delete, execute, manage

**Fields:**
- `id` - UUID primary key
- `name` - Permission name (e.g., "create_project")
- `resource` - Resource type (project, test_plan, etc.)
- `action` - Action type (create, read, update, delete, execute, manage)
- `description` - Permission description
- `is_system_permission` - Whether it's a system permission

**Relationships:**
- `roles` - Roles that have this permission

#### **UserProjectRole Model** (`app/models/role.py`)
- Associates users with roles for specific projects
- Allows users to have different roles in different projects
- Supports optional expiration dates

**Fields:**
- `id` - UUID primary key
- `user_id` - Foreign key to users
- `project_id` - Foreign key to projects
- `role_id` - Foreign key to project_roles
- `assigned_at` - Assignment timestamp
- `assigned_by` - Who assigned this role
- `expires_at` - Optional expiration date

**Relationships:**
- `user` - The user
- `project` - The project
- `role` - The assigned role

#### **GroupProjectRole Model** (`app/models/role.py`)
- Associates groups with roles for specific projects
- All users in the group inherit the role for that project
- Useful for bulk permission management

**Fields:**
- `id` - UUID primary key
- `group_id` - Foreign key to groups
- `project_id` - Foreign key to projects
- `role_id` - Foreign key to project_roles
- `assigned_at` - Assignment timestamp
- `assigned_by` - Who assigned this role
- `expires_at` - Optional expiration date

---

### **2. Database Tables Created** ✅

The following tables have been created in the database:

1. **`groups`** - User groups
2. **`user_groups`** - Users-to-groups association table
3. **`project_roles`** - Role definitions
4. **`permissions`** - Permission definitions (36 permissions initialized)
5. **`role_permissions`** - Roles-to-permissions association table
6. **`user_project_roles`** - User role assignments for projects
7. **`group_project_roles`** - Group role assignments for projects

---

### **3. Default Permissions Initialized** ✅

**36 Permissions created covering:**

**Project Permissions (5):**
- create_project
- read_project
- update_project
- delete_project
- manage_project

**Test Plan Permissions (4):**
- create_test_plan, read_test_plan, update_test_plan, delete_test_plan

**Test Suite Permissions (4):**
- create_test_suite, read_test_suite, update_test_suite, delete_test_suite

**Test Case Permissions (4):**
- create_test_case, read_test_case, update_test_case, delete_test_case

**Test Execution Permissions (2):**
- execute_test, read_test_execution

**User Permissions (5):**
- create_user, read_user, update_user, delete_user, manage_user

**Group Permissions (5):**
- create_group, read_group, update_group, delete_group, manage_group

**Role Permissions (5):**
- create_role, read_role, update_role, delete_role, manage_role

**Settings Permissions (2):**
- read_settings, manage_settings

---

### **4. Predefined Role Types** ✅

**5 Role Types with Permission Mappings:**

#### **1. Administrator**
- **All 36 permissions**
- Full system access

#### **2. Project Manager**
- **25 permissions**
- Manage project, test management, users, groups, roles, and settings
- Cannot create/delete projects or users

#### **3. Developer**
- **17 permissions**
- Create and edit test plans, suites, and cases
- Execute tests
- Read-only access to users, groups, roles, and settings

#### **4. Tester**
- **12 permissions**
- Execute tests
- Create and edit test cases
- Read test plans and suites
- Read-only access to users, groups, roles, and settings

#### **5. Viewer**
- **9 permissions**
- Read-only access to everything
- Cannot create, edit, or delete anything

---

## 📂 File Structure

```
cognitest/backend/
├── app/
│   └── models/
│       ├── __init__.py ✅ UPDATED (imports all RBAC models)
│       ├── group.py ✅ NEW (Group model + user_groups table)
│       ├── role.py ✅ NEW (ProjectRole, Permission, UserProjectRole, GroupProjectRole)
│       ├── user.py ✅ UPDATED (added groups and project_roles relationships)
│       └── project.py ✅ UPDATED (added user_roles relationship)
│
└── setup_rbac_system.py ✅ NEW (initialization script)
```

---

## 🚀 How the System Works

### **Hierarchy:**

```
Users
  ↓
Groups (optional organization)
  ↓
Project Roles (Administrator, Developer, Tester, PM, Viewer)
  ↓
Permissions (36 granular permissions)
  ↓
Projects (role assignments are per-project)
```

### **Permission Inheritance:**

1. **Direct User Role Assignment:**
   - User assigned "Developer" role on Project A
   - User gets all Developer permissions for Project A

2. **Group Role Assignment:**
   - QA Team group assigned "Tester" role on Project B
   - All users in QA Team group get Tester permissions for Project B

3. **Multiple Projects:**
   - User can be "Administrator" on Project A
   - Same user can be "Viewer" on Project B
   - Permissions are project-specific

---

## 📋 Next Steps

### **Phase 2: API Layer** (Next)
- [ ] Create Pydantic schemas for Groups and Roles
- [ ] Create API endpoints for Group management
- [ ] Create API endpoints for Role management
- [ ] Create API endpoints for Permission management
- [ ] Create endpoint to assign users to groups
- [ ] Create endpoint to assign roles to users for projects
- [ ] Create endpoint to assign roles to groups for projects
- [ ] Create endpoint to check user permissions

### **Phase 3: Frontend** (After Phase 2)
- [ ] Groups management page
- [ ] Role management page
- [ ] User role assignment interface
- [ ] Group role assignment interface
- [ ] Permission viewer

---

## 🧪 Testing the Setup

### **Verify Tables Created:**

```bash
# Connect to PostgreSQL
psql -U postgres -d cognitest

# List tables
\dt

# You should see:
# - groups
# - user_groups
# - project_roles
# - permissions
# - role_permissions
# - user_project_roles
# - group_project_roles
```

### **Verify Permissions:**

```sql
SELECT COUNT(*) FROM permissions;
-- Should return: 36

SELECT name, resource, action FROM permissions ORDER BY resource, action;
-- Shows all 36 permissions
```

---

## 🔑 Key Features

✅ **Flexible Role System**
- Predefined roles or custom roles
- Per-organisation role definitions
- System roles cannot be deleted

✅ **Granular Permissions**
- 36 permissions covering all features
- Resource-action based (e.g., "create_test_case")
- Easy to extend with new permissions

✅ **Project-Level Access Control**
- Users can have different roles in different projects
- Group-based assignments for bulk management
- Optional expiration dates for temporary access

✅ **Group Management**
- Organize users into groups
- Assign roles to entire groups
- Users inherit group permissions

✅ **Audit Trail Ready**
- All assignments track who assigned and when
- Supports expiration dates
- Can be extended with history tracking

---

## 💡 Usage Examples

### **Example 1: Assign User to Project as Developer**

```python
user_project_role = UserProjectRole(
    user_id=user.id,
    project_id=project.id,
    role_id=developer_role.id,
    assigned_by="admin@company.com"
)
```

### **Example 2: Create a Group and Assign Role**

```python
# Create group
qa_team = Group(
    name="QA Team",
    description="Quality Assurance team members",
    organisation_id=org.id,
    created_by="admin@company.com"
)

# Assign group to project with Tester role
group_role = GroupProjectRole(
    group_id=qa_team.id,
    project_id=project.id,
    role_id=tester_role.id,
    assigned_by="admin@company.com"
)
```

### **Example 3: Check User Permissions**

```python
# Get user's roles for a project
user_roles = await session.execute(
    select(ProjectRole)
    .join(UserProjectRole)
    .where(UserProjectRole.user_id == user.id)
    .where(UserProjectRole.project_id == project.id)
)

# Get all permissions for these roles
permissions = []
for role in user_roles:
    permissions.extend(role.permissions)

# Check if user can create test cases
can_create_test_case = any(
    p.name == "create_test_case" for p in permissions
)
```

---

## 📖 Documentation

**Database Models:**
- `/app/models/group.py` - Group and user_groups table
- `/app/models/role.py` - Roles, Permissions, and associations

**Setup Script:**
- `/setup_rbac_system.py` - Initializes permissions and tables

**Configuration:**
- All permissions defined in `setup_rbac_system.py`
- Role-permission mappings in `DEFAULT_ROLES` dictionary

---

## ✨ Summary

**Phase 1 Database Layer: 100% Complete** ✅

- ✅ 7 new tables created
- ✅ 36 permissions initialized
- ✅ 5 role types defined
- ✅ Flexible, scalable architecture
- ✅ Ready for API layer implementation

**Next: Build the API layer to expose this functionality!**

---

**Implementation Date**: October 28, 2025
**Status**: ✅ **PHASE 1 COMPLETE**
**Version**: 1.0.0
