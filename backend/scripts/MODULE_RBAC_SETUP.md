# 🔐 Module-Based RBAC Setup Guide

## Overview

This guide explains how to set up and use the comprehensive Role-Based Access Control (RBAC) system with module-level permissions for the CogniTest platform.

## 🏗️ System Architecture

```
Organization
├── Users
├── Groups (Teams)
│   ├── QA Team
│   ├── QA Management
│   ├── Project Management
│   ├── Product Team
│   └── Development Team
│
├── Roles (Default + Custom)
│   ├── System Roles (5 default)
│   │   ├── Administrator
│   │   ├── Project Manager
│   │   ├── Developer
│   │   ├── Tester
│   │   └── Viewer
│   │
│   └── Custom Roles (user-created)
│       ├── QA Lead
│       ├── Senior QA Engineer
│       ├── QA Manager
│       └── Product Owner
│
├── Modules (6 core modules)
│   ├── 🤖 Automation Hub
│   ├── 🔌 API Testing
│   ├── 📋 Test Management
│   ├── 🔒 Security Testing
│   ├── ⚡ Performance Testing
│   └── 📱 Mobile Testing
│
└── Permissions (4 levels per module)
    ├── READ - View reports, dashboards, results
    ├── WRITE - Create/modify configurations, test cases
    ├── EXECUTE - Run tests, automation pipelines
    └── MANAGE - Approve, assign, delete, control permissions
```

## 📋 Setup Instructions

### Step 1: Initialize Module Permissions

Run the permission initialization script to create all 24 permissions (6 modules × 4 levels):

```bash
cd backend
python scripts/initialize_module_permissions.py
```

This creates permissions like:
- `read_automation_hub`
- `write_automation_hub`
- `execute_automation_hub`
- `manage_automation_hub`
- ... (and 20 more for other modules)

### Step 2: Initialize Default Roles (Optional)

In the UI, navigate to **Users & Teams** and click **Initialize Roles** to create the 5 system roles:

- Administrator
- Project Manager
- Developer
- Tester
- Viewer

### Step 3: Create Custom Roles

Navigate to **Users & Teams → Roles tab → Create Role**

Example custom role configurations:

#### QA Lead
```
Role Name: QA Lead
Role Type: qa_lead
Description: Lead QA engineer with full test management access

Permissions:
- Automation Hub: WRITE, EXECUTE, MANAGE
- API Testing: WRITE, EXECUTE, MANAGE
- Test Management: WRITE, EXECUTE, MANAGE
- Security Testing: WRITE, EXECUTE
- Performance Testing: WRITE, EXECUTE, MANAGE
- Mobile Testing: WRITE, EXECUTE, MANAGE
```

#### Senior QA Engineer
```
Role Name: Senior QA Engineer
Role Type: senior_qa_engineer
Description: Experienced QA engineer with extended permissions

Permissions:
- Automation Hub: WRITE, EXECUTE
- API Testing: WRITE, EXECUTE
- Test Management: WRITE, EXECUTE
- Security Testing: EXECUTE
- Performance Testing: WRITE, EXECUTE
- Mobile Testing: WRITE, EXECUTE
```

#### QA Manager
```
Role Name: QA Manager
Role Type: qa_manager
Description: QA manager overseeing test strategy and team

Permissions:
- All Modules: READ, MANAGE
```

#### Product Owner
```
Role Name: Product Owner
Role Type: product_owner
Description: Product owner with read access to track quality metrics

Permissions:
- All Modules: READ
```

### Step 4: Create User Groups

Navigate to **Users & Teams → Groups tab → Create Group**

Suggested groups:
- **QA Team** - For QA Leads and Senior QA Engineers
- **QA Management** - For QA Managers
- **Project Management** - For Project Managers
- **Product Team** - For Product Owners
- **Development Team** - For Developers

### Step 5: Assign Users to Groups

1. Go to **Users & Teams → Groups tab**
2. Click **View Members** on a group
3. Click **Add Member**
4. Select users and add them to the group

### Step 6: Assign Roles to Groups (Per Project)

1. Go to **Users & Teams → Groups tab**
2. Click **Manage Roles** on a group
3. Select a **Project**
4. Click **Add Role**
5. Select the role (e.g., "QA Lead")
6. Click **Assign Role**

## 🎯 Example Setup

### Scenario: E-Commerce Platform Testing

**Organization:** CogniTest AI Pvt Ltd

**Projects:**
- Mobile App Testing
- Web Platform Testing
- API Gateway Testing

**Groups & Role Assignments:**

#### QA Team Group
Members: john@example.com, jane@example.com

Roles per Project:
- Mobile App Testing → QA Lead
- Web Platform Testing → Senior QA Engineer
- API Gateway Testing → QA Lead

#### QA Management Group
Members: sarah@example.com

Roles per Project:
- All Projects → QA Manager

#### Product Team Group
Members: mike@example.com

Roles per Project:
- All Projects → Product Owner

## 🧭 Permission Matrix Reference

| Module | READ | WRITE | EXECUTE | MANAGE |
|--------|------|-------|---------|--------|
| **Automation Hub** | View dashboards, reports | Create/modify scripts, configs | Run automation pipelines | Approve releases, assign tasks |
| **API Testing** | View test results, metrics | Create API test suites | Run API tests, debug | Review metrics, approve configs |
| **Test Management** | View test cases, reports | Create/modify test cases | Execute test cases | Oversee cycles, assign cases |
| **Security Testing** | View scan reports | Configure security scans | Run security scans | Audit compliance, approve |
| **Performance Testing** | View performance metrics | Configure load tests | Run performance tests | Review KPIs, approve thresholds |
| **Mobile Testing** | View test results, UX metrics | Configure mobile test suites | Run tests on devices | Review releases, approve builds |

## 🔑 Permission Hierarchy

```
MANAGE > EXECUTE > WRITE > READ
```

- **MANAGE** includes all lower permissions
- **EXECUTE** includes WRITE and READ
- **WRITE** includes READ
- **READ** is the base permission

## 🧪 Role Examples by Use Case

### QA Lead
**Use Case:** Team lead responsible for automation strategy and test execution

**Modules:**
- Automation Hub: WRITE, EXECUTE, MANAGE ✅
- API Testing: WRITE, EXECUTE, MANAGE ✅
- Test Management: WRITE, EXECUTE, MANAGE ✅
- Security Testing: WRITE, EXECUTE
- Performance Testing: WRITE, EXECUTE, MANAGE ✅
- Mobile Testing: WRITE, EXECUTE, MANAGE ✅

### Senior QA Engineer
**Use Case:** Experienced engineer focusing on test execution and debugging

**Modules:**
- Automation Hub: WRITE, EXECUTE
- API Testing: WRITE, EXECUTE
- Test Management: WRITE, EXECUTE
- Security Testing: EXECUTE
- Performance Testing: WRITE, EXECUTE
- Mobile Testing: WRITE, EXECUTE

### QA Manager
**Use Case:** Manager overseeing QA operations and approvals

**Modules:**
- All Modules: READ, MANAGE ✅

### Project Manager
**Use Case:** Track progress and monitor KPIs

**Modules:**
- All Modules: READ
- Test Management: MANAGE (for timeline control)
- Performance Testing: MANAGE (for threshold approval)

### Product Owner
**Use Case:** Business stakeholder tracking quality metrics

**Modules:**
- All Modules: READ only

### Developer
**Use Case:** Developer fixing bugs and validating fixes

**Modules:**
- Automation Hub: EXECUTE, WRITE
- API Testing: WRITE, EXECUTE
- Test Management: READ, EXECUTE
- Security Testing: EXECUTE, WRITE
- Performance Testing: WRITE, EXECUTE
- Mobile Testing: WRITE, EXECUTE

## 📊 Best Practices

1. **Use Groups for Team Management**
   - Create groups for teams, not individual users
   - Assign roles to groups, not individual users (unless exceptional cases)

2. **Project-Scoped Roles**
   - Remember: Roles are assigned per project
   - A user can have different roles in different projects

3. **Principle of Least Privilege**
   - Start with READ permission
   - Add higher permissions only as needed

4. **Custom Roles for Specific Needs**
   - Use system roles for standard access patterns
   - Create custom roles for unique organizational needs

5. **Regular Audits**
   - Review role assignments quarterly
   - Remove inactive users from groups
   - Update permissions as roles evolve

## 🔄 Workflow Example

### Onboarding a New QA Engineer

1. **Create User Account**
   - Users & Teams → Users → Add User
   - Email: newqa@example.com

2. **Add to Group**
   - Users & Teams → Groups → QA Team → View Members → Add Member
   - Select newqa@example.com

3. **Assign Role to Group (if not already done)**
   - Users & Teams → Groups → QA Team → Manage Roles
   - Select Project → Assign "Senior QA Engineer" role

4. **User Inherits Permissions**
   - newqa@example.com now has all permissions from the "Senior QA Engineer" role
   - Automatically applies to the selected project

## 🛠️ API Endpoints

### Check User Permissions
```bash
GET /api/v1/roles/user-permissions/{user_id}/project/{project_id}
```

### List All Permissions
```bash
GET /api/v1/roles/permissions
```

### Create Custom Role
```bash
POST /api/v1/roles/
{
  "name": "QA Lead",
  "role_type": "qa_lead",
  "organisation_id": "uuid",
  "permission_ids": ["perm_id_1", "perm_id_2", ...]
}
```

### Assign Role to Group
```bash
POST /api/v1/roles/assignments/groups
{
  "group_id": "uuid",
  "project_id": "uuid",
  "role_id": "uuid"
}
```

## 📞 Support

For questions or issues with RBAC setup:
1. Check the logs in `backend/logs/`
2. Verify permissions with the API endpoint
3. Review user-group-role assignments in the database

---

**Version:** 1.0
**Last Updated:** 2025
**Platform:** CogniTest
