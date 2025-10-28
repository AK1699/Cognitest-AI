/**
 * Users & Teams Page with RBAC Integration
 * Add this to your existing Users & Teams section
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

// ============================================
// API Service
// ============================================
const API_BASE = 'http://localhost:8000/api/v1';

const rbacAPI = {
  // Roles
  listRoles: async (organisationId: string) => {
    const { data } = await axios.get(`${API_BASE}/roles/`, {
      params: { organisation_id: organisationId }
    });
    return data;
  },

  getRoleDetails: async (roleId: string) => {
    const { data } = await axios.get(`${API_BASE}/roles/${roleId}`);
    return data;
  },

  initializeRoles: async (organisationId: string) => {
    const { data } = await axios.post(`${API_BASE}/roles/initialize`, {
      organisation_id: organisationId
    });
    return data;
  },

  // User Role Assignments
  listUserAssignments: async (projectId: string) => {
    const { data } = await axios.get(`${API_BASE}/roles/assignments/users`, {
      params: { project_id: projectId }
    });
    return data;
  },

  assignRoleToUser: async (userId: string, projectId: string, roleId: string) => {
    const { data } = await axios.post(`${API_BASE}/roles/assignments/users`, {
      user_id: userId,
      project_id: projectId,
      role_id: roleId
    });
    return data;
  },

  removeUserAssignment: async (assignmentId: string) => {
    await axios.delete(`${API_BASE}/roles/assignments/users/${assignmentId}`);
  },

  // Groups
  listGroups: async (organisationId: string) => {
    const { data } = await axios.get(`${API_BASE}/groups/`, {
      params: { organisation_id: organisationId }
    });
    return data;
  },

  createGroup: async (organisationId: string, name: string, description?: string) => {
    const { data } = await axios.post(`${API_BASE}/groups/`, {
      name,
      description,
      organisation_id: organisationId
    });
    return data;
  },

  getGroupMembers: async (groupId: string) => {
    const { data } = await axios.get(`${API_BASE}/groups/${groupId}/users`);
    return data;
  },

  addUserToGroup: async (groupId: string, userId: string) => {
    const { data } = await axios.post(`${API_BASE}/groups/${groupId}/users`, {
      user_id: userId
    });
    return data;
  },

  // Group Role Assignments
  assignRoleToGroup: async (groupId: string, projectId: string, roleId: string) => {
    const { data } = await axios.post(`${API_BASE}/roles/assignments/groups`, {
      group_id: groupId,
      project_id: projectId,
      role_id: roleId
    });
    return data;
  }
};

// ============================================
// Types
// ============================================
interface Role {
  id: string;
  name: string;
  role_type: string;
  description: string;
  permission_count: number;
  is_system_role: boolean;
  is_active: boolean;
}

interface Group {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

interface UserAssignment {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  role_id: string;
  role_name: string;
  role_type: string;
  assigned_at: string;
  assigned_by: string;
}

// ============================================
// Main Component
// ============================================
export const UsersAndTeamsPage: React.FC<{
  organisationId: string;
  projects: Array<{ id: string; name: string }>;
}> = ({ organisationId, projects }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'groups' | 'roles'>('users');

  return (
    <div className="users-teams-page">
      {/* Header */}
      <div className="page-header">
        <h1>Users & Teams</h1>
        <p className="text-muted">Manage users, groups, and role assignments</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users & Roles
        </button>
        <button
          className={`tab ${activeTab === 'groups' ? 'active' : ''}`}
          onClick={() => setActiveTab('groups')}
        >
          Groups
        </button>
        <button
          className={`tab ${activeTab === 'roles' ? 'active' : ''}`}
          onClick={() => setActiveTab('roles')}
        >
          Role Management
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'users' && (
          <UserRoleAssignmentTab
            organisationId={organisationId}
            projects={projects}
          />
        )}
        {activeTab === 'groups' && (
          <GroupManagementTab organisationId={organisationId} />
        )}
        {activeTab === 'roles' && (
          <RoleManagementTab organisationId={organisationId} />
        )}
      </div>
    </div>
  );
};

// ============================================
// Tab 1: User Role Assignment
// ============================================
const UserRoleAssignmentTab: React.FC<{
  organisationId: string;
  projects: Array<{ id: string; name: string }>;
}> = ({ organisationId, projects }) => {
  const [selectedProject, setSelectedProject] = useState(projects[0]?.id || '');
  const [roles, setRoles] = useState<Role[]>([]);
  const [assignments, setAssignments] = useState<UserAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    loadRoles();
  }, [organisationId]);

  useEffect(() => {
    if (selectedProject) {
      loadAssignments();
    }
  }, [selectedProject]);

  const loadRoles = async () => {
    try {
      const data = await rbacAPI.listRoles(organisationId);
      setRoles(data.roles || []);
    } catch (error) {
      console.error('Failed to load roles:', error);
    }
  };

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const data = await rbacAPI.listUserAssignments(selectedProject);
      setAssignments(data.assignments || []);
    } catch (error) {
      console.error('Failed to load assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!confirm('Remove this role assignment?')) return;

    try {
      await rbacAPI.removeUserAssignment(assignmentId);
      loadAssignments();
    } catch (error) {
      alert('Failed to remove assignment');
    }
  };

  return (
    <div className="user-role-assignment">
      {/* Header with Project Selector */}
      <div className="section-header">
        <div>
          <h2>User Role Assignments</h2>
          <p className="text-muted">Assign roles to users for specific projects</p>
        </div>
        <div className="header-actions">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="project-selector"
          >
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <button
            className="btn btn-primary"
            onClick={() => setShowAssignModal(true)}
          >
            + Assign Role
          </button>
        </div>
      </div>

      {/* Assignments Table */}
      {loading ? (
        <div className="loading">Loading assignments...</div>
      ) : assignments.length === 0 ? (
        <div className="empty-state">
          <p>No role assignments for this project</p>
          <button
            className="btn btn-primary"
            onClick={() => setShowAssignModal(true)}
          >
            Assign First Role
          </button>
        </div>
      ) : (
        <table className="assignments-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Assigned Date</th>
              <th>Assigned By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map(assignment => (
              <tr key={assignment.id}>
                <td>
                  <div className="user-info">
                    <div className="user-avatar">
                      {assignment.user_email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="user-name">{assignment.user_name || assignment.user_email}</div>
                      <div className="user-email">{assignment.user_email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`role-badge ${assignment.role_type}`}>
                    {assignment.role_name}
                  </span>
                </td>
                <td>{new Date(assignment.assigned_at).toLocaleDateString()}</td>
                <td>{assignment.assigned_by}</td>
                <td>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleRemoveAssignment(assignment.id)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Assign Role Modal */}
      {showAssignModal && (
        <AssignRoleModal
          projectId={selectedProject}
          roles={roles}
          onClose={() => setShowAssignModal(false)}
          onSuccess={() => {
            setShowAssignModal(false);
            loadAssignments();
          }}
        />
      )}
    </div>
  );
};

// ============================================
// Tab 2: Group Management
// ============================================
const GroupManagementTab: React.FC<{
  organisationId: string;
}> = ({ organisationId }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  useEffect(() => {
    loadGroups();
  }, [organisationId]);

  const loadGroups = async () => {
    try {
      const data = await rbacAPI.listGroups(organisationId);
      setGroups(data.groups || []);
    } catch (error) {
      console.error('Failed to load groups:', error);
    }
  };

  return (
    <div className="group-management">
      <div className="section-header">
        <div>
          <h2>Groups</h2>
          <p className="text-muted">Organize users into groups for easier role management</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          + Create Group
        </button>
      </div>

      {/* Groups Grid */}
      <div className="groups-grid">
        {groups.map(group => (
          <div key={group.id} className="group-card">
            <div className="group-header">
              <h3>{group.name}</h3>
              {group.is_active ? (
                <span className="badge badge-success">Active</span>
              ) : (
                <span className="badge badge-secondary">Inactive</span>
              )}
            </div>
            <p className="group-description">{group.description}</p>
            <div className="group-meta">
              <span>Created: {new Date(group.created_at).toLocaleDateString()}</span>
            </div>
            <div className="group-actions">
              <button
                className="btn btn-sm"
                onClick={() => setSelectedGroup(group)}
              >
                View Members
              </button>
              <button className="btn btn-sm">Assign Role</button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <CreateGroupModal
          organisationId={organisationId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadGroups();
          }}
        />
      )}

      {/* Group Members Modal */}
      {selectedGroup && (
        <GroupMembersModal
          group={selectedGroup}
          onClose={() => setSelectedGroup(null)}
        />
      )}
    </div>
  );
};

// ============================================
// Tab 3: Role Management
// ============================================
const RoleManagementTab: React.FC<{
  organisationId: string;
}> = ({ organisationId }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRoles();
  }, [organisationId]);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const data = await rbacAPI.listRoles(organisationId);
      setRoles(data.roles || []);
    } catch (error) {
      console.error('Failed to load roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeRoles = async () => {
    if (!confirm('Initialize default roles? This will create 5 system roles.')) return;

    try {
      await rbacAPI.initializeRoles(organisationId);
      loadRoles();
      alert('Default roles initialized successfully!');
    } catch (error) {
      alert('Failed to initialize roles');
    }
  };

  return (
    <div className="role-management">
      <div className="section-header">
        <div>
          <h2>Role Management</h2>
          <p className="text-muted">Manage roles and permissions for your organization</p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={handleInitializeRoles}
        >
          Initialize Default Roles
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading roles...</div>
      ) : roles.length === 0 ? (
        <div className="empty-state">
          <h3>No roles found</h3>
          <p>Initialize default roles to get started</p>
          <button
            className="btn btn-primary"
            onClick={handleInitializeRoles}
          >
            Initialize Roles
          </button>
        </div>
      ) : (
        <div className="roles-grid">
          {roles.map(role => (
            <div key={role.id} className="role-card">
              <div className="role-header">
                <h3>{role.name}</h3>
                <div className="role-badges">
                  {role.is_system_role && (
                    <span className="badge badge-info">System</span>
                  )}
                  {role.is_active ? (
                    <span className="badge badge-success">Active</span>
                  ) : (
                    <span className="badge badge-secondary">Inactive</span>
                  )}
                </div>
              </div>

              <p className="role-description">{role.description}</p>

              <div className="role-stats">
                <div className="stat">
                  <span className="stat-value">{role.permission_count}</span>
                  <span className="stat-label">Permissions</span>
                </div>
                <div className="stat">
                  <span className={`role-type-badge ${role.role_type}`}>
                    {role.role_type}
                  </span>
                </div>
              </div>

              <button
                className="btn btn-sm btn-block"
                onClick={() => setSelectedRole(role)}
              >
                View Permissions
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Role Details Modal */}
      {selectedRole && (
        <RoleDetailsModal
          roleId={selectedRole.id}
          onClose={() => setSelectedRole(null)}
        />
      )}
    </div>
  );
};

// ============================================
// Modal: Assign Role
// ============================================
const AssignRoleModal: React.FC<{
  projectId: string;
  roles: Role[];
  onClose: () => void;
  onSuccess: () => void;
}> = ({ projectId, roles, onClose, onSuccess }) => {
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [users, setUsers] = useState<any[]>([]); // Load from your user API
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedUser || !selectedRole) {
      alert('Please select both user and role');
      return;
    }

    try {
      setSubmitting(true);
      await rbacAPI.assignRoleToUser(selectedUser, projectId, selectedRole);
      alert('Role assigned successfully!');
      onSuccess();
    } catch (error) {
      alert('Failed to assign role');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Assign Role to User</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Select User</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="form-control"
            >
              <option value="">Choose a user...</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.email} - {user.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Select Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="form-control"
            >
              <option value="">Choose a role...</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.name} - {role.permission_count} permissions
                </option>
              ))}
            </select>
            {selectedRole && (
              <p className="form-help">
                {roles.find(r => r.id === selectedRole)?.description}
              </p>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting || !selectedUser || !selectedRole}
          >
            {submitting ? 'Assigning...' : 'Assign Role'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Modal: Create Group
// ============================================
const CreateGroupModal: React.FC<{
  organisationId: string;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ organisationId, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert('Please enter a group name');
      return;
    }

    try {
      setSubmitting(true);
      await rbacAPI.createGroup(organisationId, name, description);
      alert('Group created successfully!');
      onSuccess();
    } catch (error) {
      alert('Failed to create group');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Group</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Group Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., QA Team, Frontend Developers"
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the group..."
              rows={3}
              className="form-control"
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting || !name.trim()}
          >
            {submitting ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Modal: Group Members
// ============================================
const GroupMembersModal: React.FC<{
  group: Group;
  onClose: () => void;
}> = ({ group, onClose }) => {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMembers();
  }, [group.id]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await rbacAPI.getGroupMembers(group.id);
      setMembers(data || []);
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{group.name} - Members</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading">Loading members...</div>
          ) : members.length === 0 ? (
            <div className="empty-state">
              <p>No members in this group yet</p>
            </div>
          ) : (
            <table className="members-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Added Date</th>
                  <th>Added By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map(member => (
                  <tr key={member.id}>
                    <td>{member.full_name || member.username}</td>
                    <td>{member.email}</td>
                    <td>{new Date(member.added_at).toLocaleDateString()}</td>
                    <td>{member.added_by}</td>
                    <td>
                      <button className="btn btn-sm btn-danger">
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Modal: Role Details
// ============================================
const RoleDetailsModal: React.FC<{
  roleId: string;
  onClose: () => void;
}> = ({ roleId, onClose }) => {
  const [role, setRole] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRoleDetails();
  }, [roleId]);

  const loadRoleDetails = async () => {
    try {
      setLoading(true);
      const data = await rbacAPI.getRoleDetails(roleId);
      setRole(data);
    } catch (error) {
      console.error('Failed to load role details:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Role Details</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading">Loading...</div>
          ) : role ? (
            <>
              <div className="role-info">
                <h3>{role.name}</h3>
                <p>{role.description}</p>
                <div className="role-meta">
                  <span className={`role-type-badge ${role.role_type}`}>
                    {role.role_type}
                  </span>
                  {role.is_system_role && (
                    <span className="badge badge-info">System Role</span>
                  )}
                </div>
              </div>

              <div className="permissions-section">
                <h4>Permissions ({role.permissions?.length || 0})</h4>
                <div className="permissions-grid">
                  {role.permissions?.map((permission: any) => (
                    <div key={permission.id} className="permission-item">
                      <div className="permission-name">{permission.name}</div>
                      <div className="permission-meta">
                        <span className="permission-resource">{permission.resource}</span>
                        <span className="permission-action">{permission.action}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UsersAndTeamsPage;
