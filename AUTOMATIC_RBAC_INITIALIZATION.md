# 🚀 Automatic RBAC Initialization

## Overview

The CogniTest platform now features **fully automatic** Role-Based Access Control (RBAC) initialization. No manual setup required!

## ✅ What's Automatic?

### 1. **Module Permissions** (24 total)
**When:** On application startup
**Where:** `backend/app/main.py`

Automatically creates all 24 permissions for 6 modules:
- 🤖 Automation Hub (4 permissions)
- 🔌 API Testing (4 permissions)
- 📋 Test Management (4 permissions)
- 🔒 Security Testing (4 permissions)
- ⚡ Performance Testing (4 permissions)
- 📱 Mobile Testing (4 permissions)

Each module gets: READ, WRITE, EXECUTE, MANAGE

### 2. **Default Roles** (5 system roles)
**When:** When creating a new organization
**Where:** `backend/app/api/v1/organisations.py`

Automatically creates for each organization:
1. **Administrator** - Full system access
2. **Project Manager** - Project and test management
3. **Developer** - Create/edit tests, execute
4. **Tester** - Execute tests, view management
5. **Viewer** - Read-only access

## 🔄 How It Works

### App Startup Flow
```
1. FastAPI starts
2. ✅ Connect to Redis
3. ✅ Initialize 24 module permissions (if not exists)
4. ✅ Ready to serve requests
```

### Organization Creation Flow
```
1. User creates organization via API/UI
2. ✅ Organization record created
3. ✅ 5 default roles automatically created
4. ✅ Roles linked with appropriate permissions
5. ✅ Organization ready with full RBAC
```

## 📋 No Manual Steps Required

### ❌ Old Way (Manual)
```bash
# Had to run scripts manually
python scripts/initialize_module_permissions.py
# Had to click "Initialize Roles" button in UI
```

### ✅ New Way (Automatic)
```bash
# Just start the app
uvicorn app.main:app --reload

# Create organization - roles are ready immediately!
```

## 🎯 What You Can Do Immediately

After creating an organization, you can instantly:

1. **View All Roles**
   - Navigate to Users & Teams → Roles tab
   - See all 5 default roles ready to use

2. **Create Custom Roles**
   - Click "Create Role"
   - Select from 24 pre-loaded permissions
   - Permissions grouped by module

3. **Assign Roles**
   - Create groups
   - Add users to groups
   - Assign roles to groups per project

## 🔐 Permission Structure (Auto-Created)

### Automation Hub
- ✅ `read_automation_hub`
- ✅ `write_automation_hub`
- ✅ `execute_automation_hub`
- ✅ `manage_automation_hub`

### API Testing
- ✅ `read_api_testing`
- ✅ `write_api_testing`
- ✅ `execute_api_testing`
- ✅ `manage_api_testing`

### Test Management
- ✅ `read_test_management`
- ✅ `write_test_management`
- ✅ `execute_test_management`
- ✅ `manage_test_management`

### Security Testing
- ✅ `read_security_testing`
- ✅ `write_security_testing`
- ✅ `execute_security_testing`
- ✅ `manage_security_testing`

### Performance Testing
- ✅ `read_performance_testing`
- ✅ `write_performance_testing`
- ✅ `execute_performance_testing`
- ✅ `manage_performance_testing`

### Mobile Testing
- ✅ `read_mobile_testing`
- ✅ `write_mobile_testing`
- ✅ `execute_mobile_testing`
- ✅ `manage_mobile_testing`

## 🏗️ Technical Implementation

### Files Modified

1. **`backend/app/main.py`**
   - Added `initialize_permissions()` function
   - Runs on startup in lifespan context manager
   - Creates all 24 module permissions

2. **`backend/app/api/v1/organisations.py`**
   - Added `initialize_default_roles_for_org()` function
   - Called automatically in `create_organisation` endpoint
   - Creates 5 system roles with permissions

3. **`backend/app/models/role.py`**
   - Added 6 module resources to `PermissionResource` enum
   - Added `WRITE` action to `PermissionAction` enum

4. **`frontend/app/organizations/[uuid]/users-teams/page.tsx`**
   - Removed "Initialize Roles" button
   - Removed manual initialization code
   - Cleaner UI with module-grouped permissions

## 🎨 UI Improvements

### Create Role Modal
- **Module-Based Grouping** - Permissions organized by module
- **Color-Coded Cards** - Each module has a unique color
- **Icons** - Visual module identification (🤖, 🔌, 📋, 🔒, ⚡, 📱)
- **Action Badges** - Clear READ/WRITE/EXECUTE/MANAGE labels
- **Selection Counters** - Shows X/4 selected per module
- **Descriptions** - Full permission descriptions

### Roles Tab
- **Displays All Roles** - System and custom roles
- **Role Details** - Name, type, description, status
- **System Role Badge** - Distinguishes system from custom roles
- **Creation Date** - Track when roles were created

## 🔍 Verification

### Check Permissions on Startup
```bash
# Start the backend
uvicorn app.main:app --reload

# Look for this in console:
🔐 Initializing module permissions...
✅ Created 24 new permissions
# OR
✅ All permissions already initialized
```

### Check Roles After Organization Creation
```bash
# Create organization via API
curl -X POST http://localhost:8000/api/v1/organisations/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Org"}'

# Query roles for the organization
curl http://localhost:8000/api/v1/roles/?organisation_id=<org_id> \
  -H "Authorization: Bearer <token>"

# Should return 5 system roles immediately
```

### Verify in UI
1. Create organization
2. Navigate to Users & Teams → Roles tab
3. See 5 default roles already present
4. Click "Create Role" to see all 24 permissions grouped by module

## 🎁 Benefits

1. **Zero Setup Time** - Everything ready on first use
2. **Consistent Experience** - Same permissions across all organizations
3. **No Manual Errors** - Automatic means correct every time
4. **Faster Onboarding** - New orgs are production-ready instantly
5. **Developer Friendly** - No scripts to remember or run

## 📊 Default Role Permissions

| Role | Automation Hub | API Testing | Test Management | Security | Performance | Mobile |
|------|---------------|-------------|-----------------|----------|-------------|--------|
| **Administrator** | ALL | ALL | ALL | ALL | ALL | ALL |
| **Project Manager** | R,W,E,M | R,W,E,M | R,W,E,M | R,W,E,M | R,W,E,M | R,W,E,M |
| **Developer** | R,W,E | R,W,E | R,W,E | R,E | R,W,E | R,W,E |
| **Tester** | R,E | R,E | R,W,E | R,E | R,E | R,E |
| **Viewer** | R | R | R | R | R | R |

**Legend:** R = Read, W = Write, E = Execute, M = Manage

## 🚦 Migration Notes

### For Existing Deployments

If you already have organizations without roles:

1. **Permissions** - Automatically created on app restart
2. **Roles** - Need to be added manually for existing orgs:

```bash
# Option 1: Use the API endpoint (still available)
curl -X POST http://localhost:8000/api/v1/roles/initialize \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"organisation_id": "<org_id>"}'

# Option 2: Will be added in next migration script
```

### For New Deployments

Everything is automatic! Just:
1. Start the app
2. Create organizations
3. Start using RBAC

## 🔧 Troubleshooting

### Permissions Not Created
**Issue:** Module permissions not visible
**Solution:** Check startup logs for errors, ensure database is accessible

### Roles Not Created for Organization
**Issue:** New organization has no roles
**Solution:** Check organization creation logs, verify permissions exist first

### UI Shows "No permissions available"
**Issue:** Frontend can't load permissions
**Solution:** Verify backend is running and permissions endpoint is accessible

## 📝 Summary

✅ **24 module permissions** - Auto-created on startup
✅ **5 default roles** - Auto-created per organization
✅ **Zero manual setup** - Everything automatic
✅ **Beautiful UI** - Module-grouped permission selection
✅ **Production ready** - Instant RBAC for all orgs

---

**Version:** 2.0
**Last Updated:** 2025
**Status:** Production Ready ✅
