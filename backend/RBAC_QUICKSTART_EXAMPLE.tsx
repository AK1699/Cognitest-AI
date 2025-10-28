/**
 * RBAC Quick Start Example
 * Copy this code to get started with RBAC in your React app
 */

// ============================================
// 1. API Service (rbac.service.ts)
// ============================================
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api/v1';

export const rbacAPI = {
  // Get user's permissions for a project
  getUserPermissions: async (userId: string, projectId: string) => {
    const { data } = await axios.get(
      `${API_BASE}/roles/user-permissions/${userId}/project/${projectId}`
    );
    return data;
  },

  // Check if user has a specific permission
  checkPermission: async (userId: string, projectId: string, permissionName: string) => {
    const { data } = await axios.post(`${API_BASE}/roles/check-permission`, {
      user_id: userId,
      project_id: projectId,
      permission_name: permissionName
    });
    return data.has_permission;
  },

  // List all roles for organization
  listRoles: async (organisationId: string) => {
    const { data } = await axios.get(`${API_BASE}/roles/`, {
      params: { organisation_id: organisationId }
    });
    return data;
  },

  // Assign role to user
  assignRoleToUser: async (userId: string, projectId: string, roleId: string) => {
    const { data } = await axios.post(`${API_BASE}/roles/assignments/users`, {
      user_id: userId,
      project_id: projectId,
      role_id: roleId
    });
    return data;
  },

  // Create group
  createGroup: async (organisationId: string, name: string, description?: string) => {
    const { data } = await axios.post(`${API_BASE}/groups/`, {
      name,
      description,
      organisation_id: organisationId
    });
    return data;
  },

  // List groups
  listGroups: async (organisationId: string) => {
    const { data } = await axios.get(`${API_BASE}/groups/`, {
      params: { organisation_id: organisationId }
    });
    return data;
  }
};

// ============================================
// 2. Permission Context (PermissionContext.tsx)
// ============================================
import React, { createContext, useContext, useState, useEffect } from 'react';

interface PermissionContextType {
  permissions: Set<string>;
  roles: string[];
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasRole: (roleType: string) => boolean;
  loading: boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const PermissionProvider: React.FC<{
  userId: string;
  projectId: string;
  children: React.ReactNode;
}> = ({ userId, projectId, children }) => {
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const data = await rbacAPI.getUserPermissions(userId, projectId);
        const permSet = new Set(data.permissions.map((p: any) => p.name));
        setPermissions(permSet);
        setRoles(data.roles.map((r: any) => r.role_type));
      } catch (error) {
        console.error('Failed to load permissions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [userId, projectId]);

  const hasPermission = (permission: string) => permissions.has(permission);
  const hasAnyPermission = (perms: string[]) => perms.some(p => permissions.has(p));
  const hasRole = (roleType: string) => roles.includes(roleType);

  return (
    <PermissionContext.Provider
      value={{ permissions, roles, hasPermission, hasAnyPermission, hasRole, loading }}
    >
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) throw new Error('usePermissions must be used within PermissionProvider');
  return context;
};

// ============================================
// 3. Permission Guard Component
// ============================================
export const Can: React.FC<{
  do?: string;
  any?: string[];
  role?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ do: permission, any, role, children, fallback = null }) => {
  const { hasPermission, hasAnyPermission, hasRole, loading } = usePermissions();

  if (loading) return null;

  const allowed = permission
    ? hasPermission(permission)
    : any
    ? hasAnyPermission(any)
    : role
    ? hasRole(role)
    : true;

  return allowed ? <>{children}</> : <>{fallback}</>;
};

// ============================================
// 4. Usage Examples
// ============================================

// Example 1: Simple Button Visibility
export const TestCaseActions = () => {
  return (
    <div>
      <Can do="create_test_case">
        <button>Create Test Case</button>
      </Can>

      <Can do="delete_test_case">
        <button className="danger">Delete</button>
      </Can>

      <Can role="administrator">
        <button>Admin Actions</button>
      </Can>
    </div>
  );
};

// Example 2: Form with Conditional Fields
export const TestCaseForm = ({ testCase, onSave, onDelete }: any) => {
  const { hasPermission } = usePermissions();

  const canEdit = hasPermission('update_test_case');
  const canDelete = hasPermission('delete_test_case');

  return (
    <form>
      <input
        type="text"
        defaultValue={testCase.title}
        disabled={!canEdit}
      />

      <textarea
        defaultValue={testCase.description}
        disabled={!canEdit}
      />

      <div className="actions">
        {canEdit && <button onClick={onSave}>Save</button>}
        {canDelete && (
          <button onClick={onDelete} className="danger">Delete</button>
        )}
      </div>

      {!canEdit && (
        <div className="alert">You have read-only access</div>
      )}
    </form>
  );
};

// Example 3: Navigation Menu
export const ProjectNavigation = () => {
  const { hasPermission, hasRole } = usePermissions();

  return (
    <nav>
      <a href="/dashboard">Dashboard</a>

      {hasPermission('read_test_case') && (
        <a href="/test-cases">Test Cases</a>
      )}

      {hasPermission('read_test_plan') && (
        <a href="/test-plans">Test Plans</a>
      )}

      {(hasRole('administrator') || hasRole('project_manager')) && (
        <a href="/team">Team Management</a>
      )}

      {hasRole('administrator') && (
        <a href="/settings">Settings</a>
      )}
    </nav>
  );
};

// Example 4: Complete Project Dashboard
export const ProjectDashboard = ({ projectId }: { projectId: string }) => {
  const userId = 'current-user-id'; // Get from auth context

  return (
    <PermissionProvider userId={userId} projectId={projectId}>
      <div className="dashboard">
        <h1>Project Dashboard</h1>

        {/* Navigation */}
        <ProjectNavigation />

        {/* Test Management Section */}
        <section>
          <h2>Test Management</h2>

          <Can any={['create_test_plan', 'create_test_suite', 'create_test_case']}>
            <div className="quick-actions">
              <Can do="create_test_plan">
                <button>New Test Plan</button>
              </Can>
              <Can do="create_test_suite">
                <button>New Test Suite</button>
              </Can>
              <Can do="create_test_case">
                <button>New Test Case</button>
              </Can>
            </div>
          </Can>

          <Can do="execute_test">
            <button className="primary">Run Tests</button>
          </Can>
        </section>

        {/* Team Section - PM & Admin only */}
        <Can any={['manage_user', 'manage_group']}>
          <section>
            <h2>Team Management</h2>
            <Can do="manage_user">
              <button>Manage Users</button>
            </Can>
            <Can do="manage_group">
              <button>Manage Groups</button>
            </Can>
          </section>
        </Can>

        {/* Admin Section */}
        <Can role="administrator">
          <section>
            <h2>Administration</h2>
            <button>Role Management</button>
            <button>Project Settings</button>
          </section>
        </Can>
      </div>
    </PermissionProvider>
  );
};

// ============================================
// 5. Role Assignment Component
// ============================================
export const RoleAssignmentModal = ({
  projectId,
  organisationId,
  onClose
}: {
  projectId: string;
  organisationId: string;
  onClose: () => void;
}) => {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedUser, setSelectedUser] = useState('');

  useEffect(() => {
    rbacAPI.listRoles(organisationId).then(data => setRoles(data.roles));
  }, [organisationId]);

  const handleAssign = async () => {
    try {
      await rbacAPI.assignRoleToUser(selectedUser, projectId, selectedRole);
      alert('Role assigned successfully!');
      onClose();
    } catch (error) {
      alert('Failed to assign role');
    }
  };

  return (
    <div className="modal">
      <h2>Assign Role</h2>

      <select onChange={(e) => setSelectedUser(e.target.value)}>
        <option value="">Select User</option>
        {/* Populate with users */}
      </select>

      <select onChange={(e) => setSelectedRole(e.target.value)}>
        <option value="">Select Role</option>
        {roles.map((role: any) => (
          <option key={role.id} value={role.id}>
            {role.name} - {role.permission_count} permissions
          </option>
        ))}
      </select>

      <button onClick={handleAssign}>Assign Role</button>
      <button onClick={onClose}>Cancel</button>
    </div>
  );
};

// ============================================
// 6. App Setup (App.tsx)
// ============================================
export const App = () => {
  const userId = 'user-id-from-auth';
  const projectId = 'current-project-id';

  return (
    <PermissionProvider userId={userId} projectId={projectId}>
      <div className="app">
        {/* Your app content */}
        <ProjectDashboard projectId={projectId} />
      </div>
    </PermissionProvider>
  );
};

// ============================================
// 7. Common Permission Names Reference
// ============================================
/**
 * PROJECT PERMISSIONS:
 * - create_project
 * - read_project
 * - update_project
 * - delete_project
 * - manage_project
 *
 * TEST PLAN PERMISSIONS:
 * - create_test_plan
 * - read_test_plan
 * - update_test_plan
 * - delete_test_plan
 *
 * TEST SUITE PERMISSIONS:
 * - create_test_suite
 * - read_test_suite
 * - update_test_suite
 * - delete_test_suite
 *
 * TEST CASE PERMISSIONS:
 * - create_test_case
 * - read_test_case
 * - update_test_case
 * - delete_test_case
 *
 * EXECUTION PERMISSIONS:
 * - execute_test
 * - read_test_execution
 *
 * USER PERMISSIONS:
 * - create_user
 * - read_user
 * - update_user
 * - delete_user
 * - manage_user
 *
 * GROUP PERMISSIONS:
 * - create_group
 * - read_group
 * - update_group
 * - delete_group
 * - manage_group
 *
 * ROLE PERMISSIONS:
 * - create_role
 * - read_role
 * - update_role
 * - delete_role
 * - manage_role
 *
 * SETTINGS PERMISSIONS:
 * - read_settings
 * - manage_settings
 *
 * ROLE TYPES:
 * - administrator (all permissions)
 * - project_manager (27 permissions)
 * - developer (16 permissions)
 * - tester (12 permissions)
 * - viewer (9 permissions - read-only)
 */

// ============================================
// 8. CSS Styles (optional)
// ============================================
const styles = `
.can-hidden {
  display: none;
}

.role-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.role-badge.administrator {
  background: #dc2626;
  color: white;
}

.role-badge.project_manager {
  background: #2563eb;
  color: white;
}

.role-badge.developer {
  background: #16a34a;
  color: white;
}

.role-badge.tester {
  background: #ea580c;
  color: white;
}

.role-badge.viewer {
  background: #6b7280;
  color: white;
}

.alert {
  padding: 12px;
  background: #fef3c7;
  border: 1px solid #fbbf24;
  border-radius: 4px;
  margin: 12px 0;
}
`;

export default App;
