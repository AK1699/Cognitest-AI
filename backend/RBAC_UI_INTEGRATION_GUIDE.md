# RBAC UI Integration Guide

## Table of Contents
1. [Overview](#overview)
2. [API Integration](#api-integration)
3. [Permission-Based UI Rendering](#permission-based-ui-rendering)
4. [Role Management UI](#role-management-ui)
5. [Group Management UI](#group-management-ui)
6. [Complete Examples](#complete-examples)

---

## Overview

The RBAC system provides fine-grained access control through:
- **Groups** - Organize users into teams
- **Roles** - Define permission sets (Administrator, Developer, Tester, etc.)
- **Permissions** - Granular actions (create_project, delete_test_case, etc.)
- **Assignments** - Link users/groups to roles for specific projects

---

## API Integration

### 1. Initialize RBAC for Organization

When an organization is created, initialize default roles:

```typescript
// services/rbac.service.ts
import axios from 'axios';

const API_BASE = '/api/v1';

export const initializeRoles = async (organisationId: string) => {
  const response = await axios.post(`${API_BASE}/roles/initialize`, {
    organisation_id: organisationId
  });
  return response.data;
  // Returns: { success: true, roles_created: 5, roles: [...] }
};
```

### 2. Fetch User Permissions

Get all permissions for the current user in a project:

```typescript
export const getUserPermissions = async (userId: string, projectId: string) => {
  const response = await axios.get(
    `${API_BASE}/roles/user-permissions/${userId}/project/${projectId}`
  );
  return response.data;
  // Returns: { permissions: [...], roles: [...] }
};
```

### 3. Check Specific Permission

Check if user can perform an action:

```typescript
export const checkPermission = async (
  userId: string,
  projectId: string,
  permissionName: string
) => {
  const response = await axios.post(`${API_BASE}/roles/check-permission`, {
    user_id: userId,
    project_id: projectId,
    permission_name: permissionName
  });
  return response.data;
  // Returns: { has_permission: true, reason: "via role 'Developer'" }
};
```

### 4. Manage Groups

```typescript
// Create a group
export const createGroup = async (organisationId: string, name: string, description?: string) => {
  const response = await axios.post(`${API_BASE}/groups/`, {
    name,
    description,
    organisation_id: organisationId
  });
  return response.data;
};

// List groups
export const listGroups = async (organisationId: string) => {
  const response = await axios.get(`${API_BASE}/groups/`, {
    params: { organisation_id: organisationId }
  });
  return response.data;
  // Returns: { groups: [...], total: 5 }
};

// Add user to group
export const addUserToGroup = async (groupId: string, userId: string) => {
  const response = await axios.post(`${API_BASE}/groups/${groupId}/users`, {
    user_id: userId
  });
  return response.data;
};
```

### 5. Assign Roles

```typescript
// Assign role to user for a project
export const assignRoleToUser = async (
  userId: string,
  projectId: string,
  roleId: string,
  expiresAt?: string
) => {
  const response = await axios.post(`${API_BASE}/roles/assignments/users`, {
    user_id: userId,
    project_id: projectId,
    role_id: roleId,
    expires_at: expiresAt
  });
  return response.data;
};

// Assign role to group for a project
export const assignRoleToGroup = async (
  groupId: string,
  projectId: string,
  roleId: string
) => {
  const response = await axios.post(`${API_BASE}/roles/assignments/groups`, {
    group_id: groupId,
    project_id: projectId,
    role_id: roleId
  });
  return response.data;
};
```

---

## Permission-Based UI Rendering

### 1. Permission Context Provider

Create a context to manage permissions throughout your app:

```typescript
// contexts/PermissionContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserPermissions } from '../services/rbac.service';

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
}

interface Role {
  id: string;
  name: string;
  role_type: string;
}

interface PermissionContextType {
  permissions: Permission[];
  roles: Role[];
  hasPermission: (permissionName: string) => boolean;
  hasAnyPermission: (permissionNames: string[]) => boolean;
  hasRole: (roleType: string) => boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const PermissionProvider: React.FC<{
  children: React.ReactNode;
  userId: string;
  projectId: string;
}> = ({ children, userId, projectId }) => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const data = await getUserPermissions(userId, projectId);
      setPermissions(data.permissions || []);
      setRoles(data.roles || []);
    } catch (error) {
      console.error('Failed to load permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId && projectId) {
      loadPermissions();
    }
  }, [userId, projectId]);

  const hasPermission = (permissionName: string): boolean => {
    return permissions.some(p => p.name === permissionName);
  };

  const hasAnyPermission = (permissionNames: string[]): boolean => {
    return permissionNames.some(name => hasPermission(name));
  };

  const hasRole = (roleType: string): boolean => {
    return roles.some(r => r.role_type === roleType);
  };

  return (
    <PermissionContext.Provider
      value={{
        permissions,
        roles,
        hasPermission,
        hasAnyPermission,
        hasRole,
        loading,
        refresh: loadPermissions
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within PermissionProvider');
  }
  return context;
};
```

### 2. Permission-Based Components

Create reusable components for permission checking:

```typescript
// components/PermissionGuard.tsx
import React from 'react';
import { usePermissions } from '../contexts/PermissionContext';

interface PermissionGuardProps {
  permission?: string;
  permissions?: string[]; // Any of these permissions
  role?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  permissions,
  role,
  fallback = null,
  children
}) => {
  const { hasPermission, hasAnyPermission, hasRole, loading } = usePermissions();

  if (loading) {
    return null; // or a loading spinner
  }

  let hasAccess = true;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions) {
    hasAccess = hasAnyPermission(permissions);
  } else if (role) {
    hasAccess = hasRole(role);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

// Hook version
export const useHasPermission = (permissionName: string): boolean => {
  const { hasPermission } = usePermissions();
  return hasPermission(permissionName);
};
```

### 3. Usage in Components

```typescript
// pages/TestCasePage.tsx
import React from 'react';
import { PermissionGuard, useHasPermission } from '../components/PermissionGuard';
import { Button } from '../components/ui/Button';

export const TestCasePage: React.FC = () => {
  const canCreateTestCase = useHasPermission('create_test_case');
  const canDeleteTestCase = useHasPermission('delete_test_case');

  return (
    <div>
      <h1>Test Cases</h1>

      {/* Show/hide create button based on permission */}
      <PermissionGuard permission="create_test_case">
        <Button onClick={handleCreate}>Create Test Case</Button>
      </PermissionGuard>

      {/* Show different UI for different permissions */}
      <PermissionGuard
        permissions={['update_test_case', 'delete_test_case']}
        fallback={<p>Read-only mode</p>}
      >
        <div>
          <Button onClick={handleEdit}>Edit</Button>
          {canDeleteTestCase && (
            <Button onClick={handleDelete} variant="danger">Delete</Button>
          )}
        </div>
      </PermissionGuard>

      {/* Admin-only section */}
      <PermissionGuard role="administrator">
        <div className="admin-panel">
          <h2>Admin Settings</h2>
          {/* Admin features */}
        </div>
      </PermissionGuard>
    </div>
  );
};
```

### 4. Route Protection

Protect entire routes based on permissions:

```typescript
// components/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../contexts/PermissionContext';

interface ProtectedRouteProps {
  permission?: string;
  role?: string;
  children: React.ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  permission,
  role,
  children,
  redirectTo = '/unauthorized'
}) => {
  const { hasPermission, hasRole, loading } = usePermissions();

  if (loading) {
    return <div>Loading...</div>;
  }

  const hasAccess = permission
    ? hasPermission(permission)
    : role
    ? hasRole(role)
    : true;

  return hasAccess ? <>{children}</> : <Navigate to={redirectTo} />;
};

// Usage in routes
import { Routes, Route } from 'react-router-dom';

<Routes>
  <Route path="/test-cases" element={
    <ProtectedRoute permission="read_test_case">
      <TestCasesPage />
    </ProtectedRoute>
  } />

  <Route path="/settings" element={
    <ProtectedRoute role="administrator">
      <SettingsPage />
    </ProtectedRoute>
  } />
</Routes>
```

---

## Role Management UI

### Complete Role Management Component

```typescript
// pages/RoleManagementPage.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Role {
  id: string;
  name: string;
  role_type: string;
  description: string;
  permission_count: number;
  is_system_role: boolean;
  is_active: boolean;
}

export const RoleManagementPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const organisationId = 'your-org-id'; // Get from context or props

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const response = await axios.get(`/api/v1/roles/?organisation_id=${organisationId}`);
      setRoles(response.data.roles);
    } catch (error) {
      console.error('Failed to load roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomRole = async () => {
    try {
      const response = await axios.post('/api/v1/roles/', {
        name: 'Custom Role',
        role_type: 'viewer',
        description: 'A custom role',
        organisation_id: organisationId,
        permission_ids: []
      });
      setRoles([...roles, response.data]);
    } catch (error) {
      console.error('Failed to create role:', error);
    }
  };

  if (loading) return <div>Loading roles...</div>;

  return (
    <div className="role-management">
      <div className="header">
        <h1>Role Management</h1>
        <button onClick={handleCreateCustomRole}>Create Custom Role</button>
      </div>

      <div className="roles-grid">
        {roles.map(role => (
          <div key={role.id} className="role-card">
            <div className="role-header">
              <h3>{role.name}</h3>
              {role.is_system_role && <span className="badge">System</span>}
            </div>
            <p>{role.description}</p>
            <div className="role-meta">
              <span>{role.permission_count} permissions</span>
              <span className={role.is_active ? 'active' : 'inactive'}>
                {role.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="role-actions">
              <button onClick={() => viewRoleDetails(role.id)}>View Details</button>
              {!role.is_system_role && (
                <button onClick={() => editRole(role.id)}>Edit</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Role Assignment Component

```typescript
// components/RoleAssignment.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface RoleAssignmentProps {
  projectId: string;
  organisationId: string;
}

export const RoleAssignment: React.FC<RoleAssignmentProps> = ({
  projectId,
  organisationId
}) => {
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    // Load roles
    const rolesRes = await axios.get(`/api/v1/roles/?organisation_id=${organisationId}`);
    setRoles(rolesRes.data.roles);

    // Load current assignments
    const assignmentsRes = await axios.get(
      `/api/v1/roles/assignments/users?project_id=${projectId}`
    );
    setAssignments(assignmentsRes.data.assignments);
  };

  const handleAssign = async () => {
    try {
      await axios.post('/api/v1/roles/assignments/users', {
        user_id: selectedUser,
        project_id: projectId,
        role_id: selectedRole
      });
      loadData(); // Refresh
      setSelectedUser('');
      setSelectedRole('');
    } catch (error) {
      console.error('Failed to assign role:', error);
    }
  };

  const handleRemove = async (assignmentId: string) => {
    try {
      await axios.delete(`/api/v1/roles/assignments/users/${assignmentId}`);
      loadData(); // Refresh
    } catch (error) {
      console.error('Failed to remove assignment:', error);
    }
  };

  return (
    <div className="role-assignment">
      <h2>Project Role Assignments</h2>

      {/* Assignment Form */}
      <div className="assignment-form">
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
        >
          <option value="">Select User</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>{user.email}</option>
          ))}
        </select>

        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
        >
          <option value="">Select Role</option>
          {roles.map(role => (
            <option key={role.id} value={role.id}>{role.name}</option>
          ))}
        </select>

        <button onClick={handleAssign} disabled={!selectedUser || !selectedRole}>
          Assign Role
        </button>
      </div>

      {/* Current Assignments */}
      <div className="assignments-list">
        <h3>Current Assignments</h3>
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Assigned Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map(assignment => (
              <tr key={assignment.id}>
                <td>{assignment.user_email}</td>
                <td>
                  <span className={`role-badge ${assignment.role_type}`}>
                    {assignment.role_name}
                  </span>
                </td>
                <td>{new Date(assignment.assigned_at).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => handleRemove(assignment.id)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

---

## Group Management UI

### Group Management Component

```typescript
// pages/GroupManagementPage.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Group {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export const GroupManagementPage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const organisationId = 'your-org-id';

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const response = await axios.get(
        `/api/v1/groups/?organisation_id=${organisationId}`
      );
      setGroups(response.data.groups);
    } catch (error) {
      console.error('Failed to load groups:', error);
    }
  };

  const handleCreateGroup = async () => {
    try {
      await axios.post('/api/v1/groups/', {
        name: newGroup.name,
        description: newGroup.description,
        organisation_id: organisationId
      });
      setShowCreateModal(false);
      setNewGroup({ name: '', description: '' });
      loadGroups();
    } catch (error) {
      console.error('Failed to create group:', error);
    }
  };

  return (
    <div className="group-management">
      <div className="header">
        <h1>Groups</h1>
        <button onClick={() => setShowCreateModal(true)}>Create Group</button>
      </div>

      <div className="groups-list">
        {groups.map(group => (
          <div key={group.id} className="group-card">
            <h3>{group.name}</h3>
            <p>{group.description}</p>
            <div className="group-meta">
              <span className={group.is_active ? 'active' : 'inactive'}>
                {group.is_active ? 'Active' : 'Inactive'}
              </span>
              <span>Created: {new Date(group.created_at).toLocaleDateString()}</span>
            </div>
            <button onClick={() => viewGroupMembers(group.id)}>
              View Members
            </button>
          </div>
        ))}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Create New Group</h2>
            <input
              type="text"
              placeholder="Group Name"
              value={newGroup.name}
              onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
            />
            <textarea
              placeholder="Description"
              value={newGroup.description}
              onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
            />
            <div className="modal-actions">
              <button onClick={handleCreateGroup}>Create</button>
              <button onClick={() => setShowCreateModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

### Group Members Management

```typescript
// components/GroupMembers.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface GroupMembersProps {
  groupId: string;
}

export const GroupMembers: React.FC<GroupMembersProps> = ({ groupId }) => {
  const [members, setMembers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');

  useEffect(() => {
    loadMembers();
  }, [groupId]);

  const loadMembers = async () => {
    const response = await axios.get(`/api/v1/groups/${groupId}/users`);
    setMembers(response.data);
  };

  const handleAddMember = async () => {
    try {
      await axios.post(`/api/v1/groups/${groupId}/users`, {
        user_id: selectedUser
      });
      loadMembers();
      setSelectedUser('');
    } catch (error) {
      console.error('Failed to add member:', error);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await axios.delete(`/api/v1/groups/${groupId}/users/${userId}`);
      loadMembers();
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  return (
    <div className="group-members">
      <h3>Group Members</h3>

      {/* Add Member */}
      <div className="add-member">
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
        >
          <option value="">Select user to add</option>
          {availableUsers.map(user => (
            <option key={user.id} value={user.id}>{user.email}</option>
          ))}
        </select>
        <button onClick={handleAddMember}>Add Member</button>
      </div>

      {/* Members List */}
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Name</th>
            <th>Added Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map(member => (
            <tr key={member.id}>
              <td>{member.email}</td>
              <td>{member.full_name}</td>
              <td>{new Date(member.added_at).toLocaleDateString()}</td>
              <td>
                <button onClick={() => handleRemoveMember(member.id)}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

---

## Complete Examples

### Example 1: Project Dashboard with RBAC

```typescript
// pages/ProjectDashboard.tsx
import React from 'react';
import { PermissionProvider } from '../contexts/PermissionContext';
import { PermissionGuard } from '../components/PermissionGuard';
import { useAuth } from '../contexts/AuthContext';

export const ProjectDashboard: React.FC<{ projectId: string }> = ({ projectId }) => {
  const { user } = useAuth();

  return (
    <PermissionProvider userId={user.id} projectId={projectId}>
      <div className="dashboard">
        <h1>Project Dashboard</h1>

        {/* Test Management Section */}
        <section className="test-management">
          <h2>Test Management</h2>

          <PermissionGuard permission="create_test_plan">
            <button>Create Test Plan</button>
          </PermissionGuard>

          <PermissionGuard permission="create_test_case">
            <button>Create Test Case</button>
          </PermissionGuard>

          <PermissionGuard permission="execute_test">
            <button>Run Tests</button>
          </PermissionGuard>
        </section>

        {/* Team Management Section - PM and Admin only */}
        <PermissionGuard
          permissions={['manage_user', 'manage_group']}
        >
          <section className="team-management">
            <h2>Team Management</h2>
            <button>Manage Team Members</button>
            <button>Manage Groups</button>
          </section>
        </PermissionGuard>

        {/* Settings - Admin only */}
        <PermissionGuard permission="manage_settings">
          <section className="settings">
            <h2>Project Settings</h2>
            <button>Configure Settings</button>
          </section>
        </PermissionGuard>

        {/* Role Assignment - Admin and PM */}
        <PermissionGuard role="administrator">
          <section className="role-management">
            <h2>Role Management</h2>
            <RoleAssignment projectId={projectId} />
          </section>
        </PermissionGuard>
      </div>
    </PermissionProvider>
  );
};
```

### Example 2: Conditional Navigation Menu

```typescript
// components/Navigation.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { usePermissions } from '../contexts/PermissionContext';

export const Navigation: React.FC = () => {
  const { hasPermission, hasRole } = usePermissions();

  return (
    <nav>
      <ul>
        {/* Everyone can see dashboard */}
        <li><Link to="/dashboard">Dashboard</Link></li>

        {/* Test management - depends on permissions */}
        {hasPermission('read_test_plan') && (
          <li><Link to="/test-plans">Test Plans</Link></li>
        )}

        {hasPermission('read_test_case') && (
          <li><Link to="/test-cases">Test Cases</Link></li>
        )}

        {/* Team management - PM and Admin */}
        {(hasRole('administrator') || hasRole('project_manager')) && (
          <li><Link to="/team">Team</Link></li>
        )}

        {/* Settings - Admin only */}
        {hasRole('administrator') && (
          <li><Link to="/settings">Settings</Link></li>
        )}
      </ul>
    </nav>
  );
};
```

### Example 3: Dynamic Form Actions

```typescript
// components/TestCaseForm.tsx
import React from 'react';
import { useHasPermission } from '../components/PermissionGuard';

export const TestCaseForm: React.FC<{ testCase: any }> = ({ testCase }) => {
  const canUpdate = useHasPermission('update_test_case');
  const canDelete = useHasPermission('delete_test_case');
  const canExecute = useHasPermission('execute_test');

  return (
    <div className="test-case-form">
      <h2>{testCase.title}</h2>

      {/* Form fields - read-only if no update permission */}
      <input
        type="text"
        value={testCase.title}
        disabled={!canUpdate}
      />

      {/* Action buttons based on permissions */}
      <div className="actions">
        {canUpdate && (
          <button onClick={handleSave}>Save Changes</button>
        )}

        {canDelete && (
          <button onClick={handleDelete} className="danger">
            Delete Test Case
          </button>
        )}

        {canExecute && (
          <button onClick={handleExecute}>
            Execute Test
          </button>
        )}
      </div>

      {/* Show read-only message if no permissions */}
      {!canUpdate && !canDelete && (
        <p className="info">You have read-only access to this test case.</p>
      )}
    </div>
  );
};
```

---

## Best Practices

### 1. Cache Permissions
Cache user permissions to avoid repeated API calls:

```typescript
// Use React Query for caching
import { useQuery } from 'react-query';

export const useUserPermissions = (userId: string, projectId: string) => {
  return useQuery(
    ['permissions', userId, projectId],
    () => getUserPermissions(userId, projectId),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000 // 10 minutes
    }
  );
};
```

### 2. Optimistic UI Updates
Update UI optimistically while waiting for permission checks:

```typescript
const handleAction = async () => {
  // Optimistically update UI
  setLoading(true);

  // Check permission
  const hasPermission = await checkPermission(userId, projectId, 'create_test_case');

  if (hasPermission.has_permission) {
    // Proceed with action
    await createTestCase();
  } else {
    // Show error
    showError('You don\'t have permission to create test cases');
  }

  setLoading(false);
};
```

### 3. Graceful Degradation
Always provide fallback UI for users without permissions:

```typescript
<PermissionGuard
  permission="manage_project"
  fallback={
    <div className="limited-access">
      <p>You have limited access to this project.</p>
      <Link to="/request-access">Request Additional Access</Link>
    </div>
  }
>
  <ProjectSettings />
</PermissionGuard>
```

### 4. Permission Refresh
Refresh permissions when role assignments change:

```typescript
// After assigning a role
await assignRoleToUser(userId, projectId, roleId);

// Refresh permissions
const { refresh } = usePermissions();
await refresh();

// Show success message
showSuccess('Role assigned successfully. Permissions updated.');
```

---

## Summary

### Key Integration Points:

1. **On App Load** → Initialize permission context with user's permissions for current project
2. **In Components** → Use `PermissionGuard` or `useHasPermission` hook
3. **In Routes** → Use `ProtectedRoute` component
4. **In Navigation** → Conditionally show menu items based on permissions
5. **In Forms** → Enable/disable fields and buttons based on permissions
6. **On Role Change** → Refresh permissions and update UI

### API Endpoints to Use:

- `GET /roles/user-permissions/{user_id}/project/{project_id}` - Get all user permissions
- `POST /roles/check-permission` - Check specific permission
- `POST /roles/initialize` - Initialize roles for new organization
- `POST /roles/assignments/users` - Assign role to user
- `POST /roles/assignments/groups` - Assign role to group
- `GET /groups/` - List groups
- `POST /groups/` - Create group
- `POST /groups/{group_id}/users` - Add user to group

This gives you a complete, production-ready RBAC integration in your UI! 🚀
