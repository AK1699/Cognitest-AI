# Group Types System - Integration Guide

## Overview

The **Group Types System** provides a structured way to organize users into predefined team types (ADMIN, QA, DEV, PRODUCT) with their associated roles and access levels.

## Architecture

```
Organization
├── Group Types (Predefined)
│   ├── ADMIN (Organization-level access)
│   │   ├── Owner (administrator)
│   │   └── Admin (administrator)
│   ├── QA (Project-level access)
│   │   ├── QA Lead (project_manager)
│   │   ├── QA Manager (project_manager)
│   │   ├── QA Engineer (developer)
│   │   └── Tester (tester) ← default
│   ├── DEV (Project-level access)
│   │   ├── Dev Lead (project_manager)
│   │   ├── Developer (developer) ← default
│   │   └── Junior Developer (tester)
│   └── PRODUCT (Project-level access)
│       ├── Product Owner (project_manager)
│       ├── Business Analyst (developer) ← default
│       └── Stakeholder (viewer)
├── Groups (User instances of group types)
│   ├── "QA Team Alpha" (type: QA)
│   │   ├── User1 → role: Tester
│   │   ├── User2 → role: QA Engineer
│   │   └── User3 → role: QA Lead
│   ├── "Frontend Developers" (type: DEV)
│   │   ├── User4 → role: Dev Lead
│   │   └── User5 → role: Developer
│   └── "Product Strategy" (type: PRODUCT)
│       └── User6 → role: Product Owner
└── Projects
    ├── "Mobile App"
    │   ├─ Group "QA Team Alpha" has role "Tester"
    │   ├─ Group "Frontend Developers" has role "Developer"
    │   └─ Group "Product Strategy" has role "Viewer"
    └── "Web Platform"
        └─ ... similar assignments
```

## Group Types Explained

### ADMIN
- **Access Level**: Organization-wide
- **Roles**:
  - **Owner**: Full organization control (creator)
  - **Admin**: Full organization control
- **Permissions**:
  - Manage users, groups, roles
  - Manage all projects
  - Manage organization settings
  - Access all modules across all projects
- **Landing Page**: Organization dashboard

### QA (Quality Assurance)
- **Access Level**: Project-based
- **Roles**:
  - **QA Lead**: Team leadership, can manage QA group
  - **QA Manager**: Quality oversight
  - **QA Engineer**: Senior QA
  - **Tester**: Regular QA tester (default)
- **Permissions**:
  - Create/edit test cases
  - Execute tests
  - Read all resources
  - View reports
- **Landing Page**: Direct to first assigned project

### DEV (Development)
- **Access Level**: Project-based
- **Roles**:
  - **Dev Lead**: Team leadership
  - **Developer**: Regular developer (default)
  - **Junior Developer**: Junior developer
- **Permissions**:
  - Create/edit test cases (for API testing)
  - Execute tests
  - Read all resources
  - Access dev tools
- **Landing Page**: Direct to first assigned project

### PRODUCT (Product Management)
- **Access Level**: Project-based
- **Roles**:
  - **Product Owner**: Product leadership
  - **Business Analyst**: Requirements & analysis (default)
  - **Stakeholder**: Read-only access
- **Permissions**:
  - Read all resources
  - View plans and requirements
  - Write comments/notes
  - View progress
- **Landing Page**: Direct to first assigned project

## Database Schema Changes

### New Tables

1. **group_types** - Predefined group type definitions
2. **group_type_roles** - Roles available for each group type
3. **group_type_access** - Access configuration per group type

### Modified Tables

```sql
-- Add to groups table:
ALTER TABLE groups ADD COLUMN group_type_id UUID REFERENCES group_types(id);

-- Add to users table (already exists):
-- groups relationship through user_groups junction table
```

## API Endpoints

### Group Types

```
GET /api/v1/group-types/
  params: organisation_id
  Returns: List of group types with roles and access info

GET /api/v1/group-types/{group_type_id}
  Returns: Group type with all roles and access configuration

GET /api/v1/group-types/{group_type_id}/roles
  Returns: Roles available for group type

GET /api/v1/group-types/{group_type_id}/access
  Returns: Access configuration for group type
```

### Groups with Types

```
POST /api/v1/groups/
  {
    "name": "QA Team Alpha",
    "description": "...",
    "organisation_id": "...",
    "group_type_id": "..."  ← NEW: Group type ID
  }

GET /api/v1/groups/
  params: organisation_id
  Returns: Groups with their type information
```

### User Groups

```
GET /api/v1/users/{user_id}/groups
  params: organisation_id
  Returns: Groups user belongs to with access levels
```

## Frontend Components

### 1. SmartLandingRedirect Component

**File**: `components/rbac/smart-landing-redirect.tsx`

Automatically redirects users based on their group type:

```typescript
import { SmartLandingRedirect } from '@/components/rbac/smart-landing-redirect'

// In your app/organizations/[uuid]/page.tsx
export default function OrganizationPage({ params }) {
  return <SmartLandingRedirect organisationId={params.uuid} />
}
```

**Behavior**:
- Admin (org-level) → Org dashboard
- QA/DEV/PRODUCT (project-level) → First assigned project
- Multiple groups → Show group selector

### 2. CreateGroupWithTypeModal Component

**File**: `components/users-teams/create-group-with-type-modal.tsx`

Create groups with predefined types:

```typescript
import { CreateGroupWithTypeModal } from '@/components/users-teams/create-group-with-type-modal'
import { useState } from 'react'

export function UsersTab() {
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <>
      <button onClick={() => setCreateOpen(true)}>
        Create Group
      </button>

      <CreateGroupWithTypeModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        organisationId={orgId}
        onSuccess={reloadGroups}
      />
    </>
  )
}
```

**Features**:
- Select from ADMIN, QA, DEV, PRODUCT
- See roles available for each type
- See access level (org vs project)
- Set group name and description

## Implementation Steps

### Step 1: Database Migration

```bash
# Create the migration
alembic revision --autogenerate -m "Add group types system"

# Run migration
alembic upgrade head
```

### Step 2: Initialize Group Types

Call `GroupTypeService.initialize_group_types()` when organization is created:

```python
from app.services.group_type_service import GroupTypeService

# In organization creation endpoint
await GroupTypeService.initialize_group_types(db, organization_id)
```

### Step 3: Add API Endpoints

Create `/api/v1/group-types.py`:

```python
from fastapi import APIRouter, Depends
from app.services.group_type_service import GroupTypeService

router = APIRouter(prefix="/group-types", tags=["group-types"])

@router.get("/")
async def list_group_types(
    organisation_id: str,
    db: AsyncSession = Depends(get_db)
):
    return await GroupTypeService.list_group_types(db, organisation_id)

# ... other endpoints
```

### Step 4: Frontend Integration

#### Update Users-Teams Page

```typescript
// app/organizations/[uuid]/users-teams/page.tsx
import { CreateGroupWithTypeModal } from '@/components/users-teams/create-group-with-type-modal'

export function GroupsTab() {
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <>
      <button onClick={() => setCreateOpen(true)}>Create Group</button>
      <CreateGroupWithTypeModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        organisationId={organisationId}
        onSuccess={reloadGroups}
      />
    </>
  )
}
```

#### Add Smart Redirect

```typescript
// app/organizations/[uuid]/page.tsx
import { SmartLandingRedirect } from '@/components/rbac/smart-landing-redirect'

export default function OrganizationPage({ params }) {
  return <SmartLandingRedirect organisationId={params.uuid} />
}
```

## User Workflow

### Scenario 1: Admin User

1. **Admin creates organization**
2. **System auto-initializes**:
   - ADMIN group type created
   - Default roles created (Owner, Admin)
3. **Admin logged in**
4. **Smart redirect → Organization dashboard**
5. **Admin can**:
   - Create projects
   - Create groups (any type)
   - Invite users
   - Manage all settings
   - Access all modules

### Scenario 2: QA Team Member

1. **Admin creates "QA Team Alpha" group (type: QA)**
2. **Admin adds QA Engineer role to QA group for Project "App Mobile"**
3. **Admin invites qa_engineer@company.com**
4. **User accepts invitation**
5. **User auto-added to QA Team Alpha group**
6. **User logs in**
7. **Smart redirect → App Mobile project**
8. **User can**:
   - Access test-management module
   - Create/edit test cases
   - Execute tests
   - Cannot access settings (limited permission)

### Scenario 3: Product Manager

1. **Admin creates "Product Team" group (type: PRODUCT)**
2. **Admin adds Product Owner role to group for Project "App Mobile"**
3. **Admin invites product_mgr@company.com**
4. **User accepts invitation and logs in**
5. **Smart redirect → App Mobile project (as viewer)**
6. **User can**:
   - Read test plans
   - View progress
   - Post comments
   - Cannot modify tests

## Module Visibility By Group Type

| Module | Admin | QA | Dev | Product |
|--------|-------|----|----|---------|
| Test Management | ✅ Full | ✅ Full | ✅ Full | ✅ Read |
| API Testing | ✅ Full | ✅ Read | ✅ Full | ✅ Read |
| Security Testing | ✅ Full | ✅ Read | ✅ Full | ✅ Read |
| Performance Testing | ✅ Full | ✅ Read | ✅ Full | ✅ Read |
| Organization Settings | ✅ Full | ❌ No | ❌ No | ❌ No |
| Project Settings | ✅ Full | ⚠️ Limited | ⚠️ Limited | ✅ Read |
| Users & Teams | ✅ Full | ❌ No | ❌ No | ❌ No |

## Security Considerations

### Organization-Level Access

Only ADMIN group type can:
- Access organization settings
- Invite users to organization
- Create/delete projects
- Manage roles

### Project-Level Access

QA/DEV/PRODUCT groups can only:
- Access assigned projects
- Manage within their project role
- Cannot access other projects unless assigned

### Module Access

Enforced at three levels:
1. **Group Type** - determines accessible modules
2. **Role** - determines actions (read/write/execute)
3. **Project Assignment** - limits to assigned projects

## Configuration

### Customizing Group Types

Edit `DEFAULT_GROUP_TYPES` in `services/group_type_service.py`:

```python
DEFAULT_GROUP_TYPES = {
    "CUSTOM": {
        "name": "Custom Team",
        "description": "...",
        "access_level": "project",
        "roles": [
            {
                "name": "Custom Role",
                "role_type": "developer",
            }
        ]
    }
}
```

### Customizing Roles Per Group

Modify role definitions and permissions in the service:

```python
{
    "name": "Custom Role",
    "description": "Custom description",
    "role_type": "project_manager",  # Maps to existing role
    "is_default": False
}
```

## Testing

### Manual Test Flow

1. **Create Organization**
2. **System auto-initializes groups**
3. **Create group with type: QA**
4. **Invite users to organization**
5. **Add users to QA group**
6. **Assign QA Lead role to one user**
7. **Assign Tester role to another user**
8. **Assign QA group to project**
9. **Login as QA Lead**
   - Should see project
   - Should have full QA permissions
10. **Login as Tester**
    - Should see project
    - Should have tester permissions only

### Automated Test

```bash
python3 test_group_types_workflow.py \
  'ORG_ID' \
  'ADMIN_TOKEN' \
  'PROJECT_ID'
```

## Troubleshooting

### Issue: Smart redirect not working

**Check**:
1. User belongs to a group: `GET /api/v1/users/{id}/groups`
2. Group has type: `group_type_id` is not null
3. Group type has access configuration
4. User has role for the project

### Issue: Module not visible

**Check**:
1. Group type has module access
2. User's role has permission
3. Project is assigned to group

### Issue: Can't create group of type

**Check**:
1. Group types initialized: `GET /api/v1/group-types/`
2. Using correct `group_type_id` when creating group
3. Organization has the group type

## Files Modified/Created

### Backend

```
NEW: app/models/group_type.py           # Group type models
NEW: app/services/group_type_service.py # Group type service
NEW: app/api/v1/group_types.py          # Group type endpoints (to create)
MOD: app/models/group.py                # Add group_type_id
MOD: app/api/v1/groups.py               # Update to use group types
MOD: app/api/v1/organisations.py        # Call initialize on org creation
```

### Frontend

```
NEW: components/rbac/smart-landing-redirect.tsx        # Smart redirect
NEW: components/users-teams/create-group-with-type-modal.tsx  # Group creation
MOD: app/organizations/[uuid]/page.tsx  # Add smart redirect
MOD: app/organizations/[uuid]/users-teams/page.tsx # Use new group modal
```

## Next Steps

1. **Review** this guide
2. **Create** database migration
3. **Implement** Group Type Service
4. **Create** API endpoints
5. **Integrate** frontend components
6. **Test** complete workflow
7. **Deploy** to production

## Support

For questions, refer to:
- `RBAC_README.md` - General RBAC overview
- `RBAC_IMPLEMENTATION_GUIDE.md` - Implementation patterns
- This file for group types specifics
