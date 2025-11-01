'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { PlusCircle, User, Users, Search, Pencil, Trash2, UserPlus, Shield, Plus } from 'lucide-react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { formatDateHumanReadable } from '@/lib/date-utils'
import { Sidebar } from '@/components/layout/sidebar'
import {
  listRoles,
  listUserRoles,
  assignRoleToUser,
  removeRoleFromUser,
  createRole,
  deleteRole,
  listPermissions,
  type ProjectRole,
  type UserProjectRoleWithDetails,
  type Permission
} from '@/lib/api/roles'
import { listOrganisationUsers, type User as UserType } from '@/lib/api/users'
import { RoleAssignmentModal } from '@/components/roles/role-assignment-modal'
import { createInvitation } from '@/lib/api/invitations'
import { RoleFilter } from '@/components/roles/role-filter'
import { PermissionMatrix } from '@/components/settings/permission-matrix'
import { useAuth } from '@/lib/auth-context'
import api from '@/lib/api'

type Tab = 'users' | 'roles'

interface Project {
  id: string
  name: string
}

interface Organisation {
  id: string
  name: string
  owner_id: string
  created_at: string
}

export default function UsersTeamsPage() {
  const params = useParams()
  const organisationId = params.uuid as string
  const { user: currentUser } = useAuth()

  const [activeTab, setActiveTab] = useState<Tab>('users')
  const [organisation, setOrganisation] = useState<Organisation | null>(null)
  const [users, setUsers] = useState<UserType[]>([])
  const [roles, setRoles] = useState<ProjectRole[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [userRoles, setUserRoles] = useState<UserProjectRoleWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [projects, setProjects] = useState<Project[]>([])
  const [userProjects, setUserProjects] = useState<Record<string, Project[]>>({})
  const [selectedRoleFilters, setSelectedRoleFilters] = useState<string[]>([])
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false)

  // Modal states
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showProjectAssignModal, setShowProjectAssignModal] = useState(false)
  const [showAssignRoleModal, setShowAssignRoleModal] = useState(false)
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false)
  const [rolesView, setRolesView] = useState<'list' | 'matrix'>('list')
  const [showDeleteRoleDialog, setShowDeleteRoleDialog] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState<ProjectRole | null>(null)
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null)

  // Selected items
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null)
  const [selectedUserForProjects, setSelectedUserForProjects] = useState<UserType | null>(null)
  const [roleModalEntity, setRoleModalEntity] = useState<{
    type: 'user'
    id: string
    name: string
  } | null>(null)
  const [selectedUserToAdd, setSelectedUserToAdd] = useState<string>('')
  const [showAddMemberSection, setShowAddMemberSection] = useState(false)

  // Form data
  const [userFormData, setUserFormData] = useState({
    email: '',
    username: '',
    password: '',
    full_name: ''
  })
  const [roleFormData, setRoleFormData] = useState({
    name: '',
    roleType: '',
    description: '',
    selectedPermissions: [] as string[]
  })

  useEffect(() => {
    fetchData()
    fetchProjects()
    fetchPermissions()
  }, [organisationId, activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch organization details
      const orgResponse = await api.get(`/api/v1/organisations/${organisationId}`)
      setOrganisation(orgResponse.data)

      // Determine if current user is admin
      const isAdmin = currentUser?.is_superuser || currentUser?.id === orgResponse.data.owner_id
      setIsCurrentUserAdmin(isAdmin)

      // Fetch users
      const usersData = await listOrganisationUsers(organisationId)
      setUsers(usersData)

      // Fetch roles
      const rolesData = await listRoles(organisationId)
      setRoles(rolesData.roles)

      // Fetch user projects for each user
      if (usersData.length > 0) {
        fetchAllUserProjects(usersData)
      }

    } catch (error: any) {
      console.error('Error fetching data:', error)
      toast.error(error.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const getUserRole = (user: UserType): string => {
    // If user is the organization owner, return "Owner"
    if (organisation && user.id === organisation.owner_id) {
      return 'Owner'
    }
    // Otherwise return "Member" (you can enhance this to fetch actual roles)
    return 'Member'
  }

  const fetchAllUserProjects = async (usersList: UserType[]) => {
    try {
      const userProjectsMap: Record<string, Project[]> = {}

      for (const user of usersList) {
        const assignedProjects: Project[] = []

        for (const project of projects) {
          try {
            const response = await api.get(`/api/v1/projects/${project.id}/members`)
            if (response.data.some((m: any) => m.id === user.id)) {
              assignedProjects.push(project)
            }
          } catch (e) {
            // User not assigned to this project, skip
          }
        }

        userProjectsMap[user.id] = assignedProjects
      }

      setUserProjects(userProjectsMap)
    } catch (error: any) {
      console.error('Error fetching user projects:', error)
    }
  }

  const fetchUserProjects = async (userId: string) => {
    try {
      const assignedProjects: Project[] = []

      for (const project of projects) {
        try {
          const response = await api.get(`/api/v1/projects/${project.id}/members`)
          if (response.data.some((m: any) => m.id === userId)) {
            assignedProjects.push(project)
          }
        } catch (e) {
          // User not assigned to this project
        }
      }

      setUserProjects(prev => ({ ...prev, [userId]: assignedProjects }))
    } catch (error: any) {
      console.error('Failed to fetch user projects:', error)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await api.get('/api/v1/projects/', {
        params: { organisation_id: organisationId }
      })
      setProjects(response.data)
    } catch (error: any) {
      console.error('Error fetching projects:', error)
    }
  }

  const fetchPermissions = async () => {
    try {
      const permissionsData = await listPermissions()
      setPermissions(permissionsData)
    } catch (error: any) {
      console.error('Error fetching permissions:', error)
    }
  }

  const handleInviteUser = async () => {
    if (!userFormData.email) {
      toast.error('Email address is required')
      return
    }

    try {
      await createInvitation({
        email: userFormData.email,
        full_name: userFormData.full_name || undefined,
        organisation_id: organisationId,
        expiry_days: 7
      })

      toast.success(`Invitation sent to ${userFormData.email}`)
      setShowInviteModal(false)
      setUserFormData({ email: '', username: '', password: '', full_name: '' })

      // Refresh data to show pending invitations
      fetchData()
    } catch (error: any) {
      console.error('Failed to send invitation:', error)
      toast.error(error.response?.data?.detail || 'Failed to send invitation')
    }
  }

  const openProjectAssignmentModal = (user: UserType) => {
    setSelectedUserForProjects(user)
    setShowProjectAssignModal(true)
  }

  const handleAssignToProject = async (projectId: string) => {
    if (!selectedUserForProjects) return

    try {
      await api.post(`/api/v1/projects/${projectId}/members`, null, {
        params: { user_id: selectedUserForProjects.id }
      })
      toast.success(`${selectedUserForProjects.username} assigned to project`)
      // Refresh user projects
      await fetchUserProjects(selectedUserForProjects.id)
    } catch (error: any) {
      console.error('Failed to assign user:', error)
      toast.error(error.response?.data?.detail || 'Failed to assign user')
    }
  }

  const handleRemoveFromProject = async (projectId: string) => {
    if (!selectedUserForProjects) return

    if (!confirm(`Remove ${selectedUserForProjects.username} from this project?`)) return

    try {
      await api.delete(
        `/api/v1/projects/${projectId}/members/${selectedUserForProjects.id}`
      )
      toast.success('User removed from project')
      // Refresh user projects
      await fetchUserProjects(selectedUserForProjects.id)
    } catch (error: any) {
      console.error('Failed to remove user:', error)
      toast.error(error.response?.data?.detail || 'Failed to remove user')
    }
  }

  const handleCreateRole = async () => {
    if (!roleFormData.name || !roleFormData.roleType) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      await createRole(
        organisationId,
        roleFormData.name,
        roleFormData.roleType,
        roleFormData.description,
        roleFormData.selectedPermissions
      )
      toast.success('Role created successfully')
      setShowCreateRoleModal(false)
      setRoleFormData({ name: '', roleType: '', description: '', selectedPermissions: [] })
      fetchData()
    } catch (error: any) {
      console.error('Failed to create role:', error)
      toast.error(error.response?.data?.detail || 'Failed to create role')
    }
  }

  const handleDeleteRole = async (role: ProjectRole) => {
    // Check if it's a system role
    if (role.is_system_role) {
      toast.error('Cannot delete system roles')
      return
    }

    setRoleToDelete(role)
    setShowDeleteRoleDialog(true)
  }

  const confirmDeleteRole = async () => {
    if (!roleToDelete) return

    setDeletingRoleId(roleToDelete.id)
    try {
      await deleteRole(roleToDelete.id)
      toast.success(`Role "${roleToDelete.name}" deleted successfully`)
      setShowDeleteRoleDialog(false)
      setRoleToDelete(null)
      fetchData()
    } catch (error: any) {
      console.error('Failed to delete role:', error)
      toast.error(error.response?.data?.detail || 'Failed to delete role')
    } finally {
      setDeletingRoleId(null)
    }
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.full_name && user.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.role_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (role.description && role.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar organisationId={organisationId} />
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="text-gray-500">Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar organisationId={organisationId} />
      <div className="flex-1 p-8">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center flex-shrink-0">
          <Users className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900">Users & Teams</h1>
      </div>
      <p className="text-lg text-gray-600 mb-8 mt-4">Manage user access, teams, and role assignments</p>

      <div className="flex items-center justify-end mb-8">
        <div className="flex gap-2">
          {activeTab === 'users' && (
            <Button onClick={() => setShowInviteModal(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Invite User
            </Button>
          )}
          {activeTab === 'roles' && (
            <Button onClick={() => setShowCreateRoleModal(true)}>
              <Shield className="mr-2 h-4 w-4" />
              Create Role
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`${
              activeTab === 'users'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <User className="w-4 h-4" />
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`${
              activeTab === 'roles'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <Shield className="w-4 h-4" />
            Roles ({roles.length})
          </button>
        </nav>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        {activeTab === 'users' && (
          <RoleFilter
            selectedRoles={selectedRoleFilters}
            onRolesChange={setSelectedRoleFilters}
          />
        )}
      </div>

      {/* Users Tab Content */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3">User</th>
                  <th scope="col" className="px-6 py-3">Projects</th>
                  <th scope="col" className="px-6 py-3">Created</th>
                  <th scope="col" className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No users found. Invite users to get started.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
                              <span className="text-sm font-semibold text-white">
                                {user.username.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{user.full_name || user.username}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {(userProjects[user.id] || []).length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {(userProjects[user.id] || []).map(project => (
                                <span
                                  key={project.id}
                                  className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded"
                                >
                                  {project.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400">No projects</span>
                          )}
                          <button
                            onClick={() => openProjectAssignmentModal(user)}
                            className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                          >
                            <Plus className="w-3 h-3" />
                            Manage Projects
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDateHumanReadable(user.created_at)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-2">
                          {userRoles.filter(ur => ur.user_id === user.id).length > 0 && (
                            <div className="flex flex-wrap gap-1 justify-center">
                              {userRoles
                                .filter(ur => ur.user_id === user.id)
                                .map(ur => (
                                  <span
                                    key={ur.id}
                                    className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded"
                                  >
                                    {ur.role.name}
                                  </span>
                                ))}
                            </div>
                          )}
                          <button
                            onClick={() => {
                              setRoleModalEntity({
                                type: 'user',
                                id: user.id,
                                name: user.full_name || user.username
                              })
                              setShowAssignRoleModal(true)
                            }}
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                            Edit Roles
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Roles Tab Content */}
      {activeTab === 'roles' && (
        <div>
          {/* Roles Tab Sub-navigation */}
          <div className="mb-6 flex gap-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setRolesView('list')}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                rolesView === 'list'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              📋 Roles List
            </button>
            <button
              onClick={() => setRolesView('matrix')}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                rolesView === 'matrix'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              🔐 Permission Matrix
            </button>
          </div>

          {/* Roles List View */}
          {rolesView === 'list' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                      <th scope="col" className="px-6 py-3">Role Name</th>
                      <th scope="col" className="px-6 py-3">Type</th>
                      <th scope="col" className="px-6 py-3">Description</th>
                      <th scope="col" className="px-6 py-3">Status</th>
                      <th scope="col" className="px-6 py-3">System Role</th>
                      <th scope="col" className="px-6 py-3">Created</th>
                      <th scope="col" className="px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoles.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                          No roles found. {roles.length === 0 ? 'Initialize default roles or create a custom role to get started.' : 'Try adjusting your search.'}
                        </td>
                      </tr>
                    ) : (
                      filteredRoles.map((role) => (
                        <tr key={role.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900 dark:text-white">{role.name}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {role.role_type.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                              {role.description || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              role.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {role.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              role.is_system_role ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {role.is_system_role ? 'System' : 'Custom'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {formatDateHumanReadable(role.created_at)}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <button
                              onClick={() => handleDeleteRole(role)}
                              disabled={role.is_system_role || deletingRoleId === role.id}
                              className="inline-flex items-center gap-2 text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                              title={role.is_system_role ? 'Cannot delete system roles' : 'Delete role'}
                            >
                              <Trash2 size={16} />
                              {deletingRoleId === role.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Permission Matrix View */}
          {rolesView === 'matrix' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-8">
              <PermissionMatrix organisationId={organisationId} isAdmin={isCurrentUserAdmin} />
            </div>
          )}
        </div>
      )}

      {/* Add User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">📧 Invite User</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Send an invitation email. The user will receive a welcome email with a link to create their account and join your organization.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  value={userFormData.full_name}
                  onChange={(e) => setUserFormData({ ...userFormData, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="John Doe"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  This will be pre-filled in the invitation email
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  💡 The invitation will expire in <strong>7 days</strong>. The user will choose their username and password when they accept the invitation.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowInviteModal(false)
                  setUserFormData({ email: '', username: '', password: '', full_name: '' })
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleInviteUser}
                disabled={!userFormData.email}
              >
                Send Invitation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Role Modal */}
      {showCreateRoleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create Custom Role</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Create a custom role with specific permissions for your organization.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={roleFormData.name}
                  onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., QA Lead"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role Type <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={roleFormData.roleType}
                  onChange={(e) => setRoleFormData({ ...roleFormData, roleType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., qa_lead (lowercase, underscores)"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Use lowercase letters and underscores only (e.g., qa_lead, senior_qa_engineer)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={roleFormData.description}
                  onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                  placeholder="Describe the responsibilities and access level of this role..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Permissions (Optional)
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Select permissions by module. Each module has READ, WRITE, EXECUTE, and MANAGE permission levels.
                </p>
                <div className="border border-gray-300 dark:border-gray-600 rounded-md p-4 max-h-96 overflow-y-auto">
                  {permissions.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No permissions available. Run the module permissions initialization script first.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {(() => {
                        // Group permissions by module
                        const moduleGroups = permissions.reduce((acc, permission) => {
                          const module = permission.resource
                          if (!acc[module]) {
                            acc[module] = []
                          }
                          acc[module].push(permission)
                          return acc
                        }, {} as Record<string, typeof permissions>)

                        // Module display names and icons
                        const moduleConfig: Record<string, { name: string; icon: string; color: string }> = {
                          automation_hub: { name: 'Automation Hub', icon: '🤖', color: 'blue' },
                          api_testing: { name: 'API Testing', icon: '🔌', color: 'green' },
                          test_management: { name: 'Test Management', icon: '📋', color: 'purple' },
                          security_testing: { name: 'Security Testing', icon: '🔒', color: 'red' },
                          performance_testing: { name: 'Performance Testing', icon: '⚡', color: 'yellow' },
                          mobile_testing: { name: 'Mobile Testing', icon: '📱', color: 'indigo' },
                        }

                        // Sort modules
                        const sortedModules = Object.keys(moduleGroups).sort((a, b) => {
                          const order = ['automation_hub', 'api_testing', 'test_management', 'security_testing', 'performance_testing', 'mobile_testing']
                          return order.indexOf(a) - order.indexOf(b)
                        })

                        return sortedModules.map((module) => {
                          const config = moduleConfig[module] || { name: module, icon: '📦', color: 'gray' }
                          const modulePerms = moduleGroups[module].sort((a, b) => {
                            const order = ['read', 'write', 'execute', 'manage']
                            return order.indexOf(a.action) - order.indexOf(b.action)
                          })

                          const colorClasses = {
                            blue: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
                            green: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
                            purple: 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800',
                            red: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
                            yellow: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
                            indigo: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800',
                            gray: 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800',
                          }

                          return (
                            <div key={module} className={`border rounded-lg p-3 ${colorClasses[config.color as keyof typeof colorClasses]}`}>
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-xl">{config.icon}</span>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {config.name}
                                </h4>
                                <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                                  {modulePerms.filter(p => roleFormData.selectedPermissions.includes(p.id)).length}/{modulePerms.length} selected
                                </span>
                              </div>
                              <div className="space-y-2">
                                {modulePerms.map((permission) => (
                                  <label
                                    key={permission.id}
                                    className="flex items-start gap-2 p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={roleFormData.selectedPermissions.includes(permission.id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setRoleFormData({
                                            ...roleFormData,
                                            selectedPermissions: [...roleFormData.selectedPermissions, permission.id]
                                          })
                                        } else {
                                          setRoleFormData({
                                            ...roleFormData,
                                            selectedPermissions: roleFormData.selectedPermissions.filter(id => id !== permission.id)
                                          })
                                        }
                                      }}
                                      className="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                        <span className="uppercase text-xs px-2 py-0.5 bg-white dark:bg-gray-700 rounded font-semibold">
                                          {permission.action}
                                        </span>
                                        <span className="truncate text-xs">{permission.name}</span>
                                      </div>
                                      {permission.description && (
                                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                          {permission.description}
                                        </div>
                                      )}
                                    </div>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )
                        })
                      })()}
                    </div>
                  )}
                </div>
                {roleFormData.selectedPermissions.length > 0 && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    ✅ {roleFormData.selectedPermissions.length} permission(s) selected across {
                      new Set(permissions.filter(p => roleFormData.selectedPermissions.includes(p.id)).map(p => p.resource)).size
                    } module(s)
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateRoleModal(false)
                  setRoleFormData({ name: '', roleType: '', description: '', selectedPermissions: [] })
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateRole}
                disabled={!roleFormData.name || !roleFormData.roleType}
              >
                Create Role
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Project Assignment Modal */}
      {showProjectAssignModal && selectedUserForProjects && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Manage Projects for {selectedUserForProjects.full_name || selectedUserForProjects.username}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Assign or remove this user from projects in your organization
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {projects.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No projects available. Create a project first.
                </div>
              ) : (
                projects.map((project) => {
                  const isAssigned = (userProjects[selectedUserForProjects.id] || [])
                    .some(p => p.id === project.id)

                  return (
                    <div
                      key={project.id}
                      className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                        isAssigned
                          ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {project.name}
                          </div>
                          {isAssigned && (
                            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200 rounded-full">
                              Assigned
                            </span>
                          )}
                        </div>
                        {project.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {project.description}
                          </div>
                        )}
                      </div>

                      <div className="ml-4">
                        {isAssigned ? (
                          <button
                            onClick={() => handleRemoveFromProject(project.id)}
                            className="px-4 py-2 text-sm bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors font-medium"
                          >
                            Remove
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAssignToProject(project.id)}
                            className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                          >
                            Assign
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {(userProjects[selectedUserForProjects.id] || []).length} of {projects.length} projects assigned
              </div>
              <button
                onClick={() => {
                  setShowProjectAssignModal(false)
                  setSelectedUserForProjects(null)
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Assignment Modal */}
      {showAssignRoleModal && roleModalEntity && (
        <RoleAssignmentModal
          isOpen={showAssignRoleModal}
          onClose={() => {
            setShowAssignRoleModal(false)
            setRoleModalEntity(null)
            fetchData() // Refresh data after role changes
          }}
          organisationId={organisationId}
          entityType={roleModalEntity.type}
          entityId={roleModalEntity.id}
          entityName={roleModalEntity.name}
          availableProjects={projects}
        />
      )}

      {/* Delete Role Confirmation Dialog */}
      {showDeleteRoleDialog && roleToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20">
                <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Delete Role</h3>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete the role <strong>{roleToDelete.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteRoleDialog(false)
                  setRoleToDelete(null)
                }}
                disabled={deletingRoleId !== null}
                className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteRole}
                disabled={deletingRoleId !== null}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {deletingRoleId === roleToDelete.id ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete Role
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
