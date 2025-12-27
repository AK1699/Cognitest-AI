'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { PlusCircle, User, Users, Search, Pencil, Trash2, UserPlus, Shield, Plus } from 'lucide-react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { formatDateHumanReadable } from '@/lib/date-utils'
import { getRoleType } from '@/lib/role-display-utils'
import { UserNav } from '@/components/layout/user-nav'
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
import { PermissionMatrix } from '@/components/settings/permission-matrix'
import { useAuth } from '@/lib/auth-context'
import api from '@/lib/api'
import { useConfirm } from '@/lib/hooks/use-confirm'
import { listGroups, deleteGroup, type Group } from '@/lib/api/groups'
import { EditUserModal } from '@/components/users-teams/edit-user-modal'
import { EditGroupModal } from '@/components/users-teams/edit-group-modal'
import { CreateGroupWithTypeModal } from '@/components/users-teams/create-group-with-type-modal'
import { RolesManager } from '@/components/settings/RolesManager'

type Tab = 'users' | 'teams' | 'roles' | 'org-roles'

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
  const [groups, setGroups] = useState<Group[]>([])
  const [roles, setRoles] = useState<ProjectRole[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [userRoles, setUserRoles] = useState<UserProjectRoleWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [projects, setProjects] = useState<Project[]>([])
  const [userProjects, setUserProjects] = useState<Record<string, Project[]>>({})
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false)

  // Modal states
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showProjectAssignModal, setShowProjectAssignModal] = useState(false)
  const [showAssignRoleModal, setShowAssignRoleModal] = useState(false)
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false)
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)
  const [showEditUserModal, setShowEditUserModal] = useState(false)
  const [showEditGroupModal, setShowEditGroupModal] = useState(false)
  const [rolesView, setRolesView] = useState<'list' | 'matrix'>('list')
  const [showDeleteRoleDialog, setShowDeleteRoleDialog] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState<ProjectRole | null>(null)
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null)

  // Selected items
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null)
  const [selectedUserForProjects, setSelectedUserForProjects] = useState<UserType | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [roleModalEntity, setRoleModalEntity] = useState<{
    type: 'user'
    id: string
    name: string
    initialRoleId?: string
  } | null>(null)
  const [selectedUserToAdd, setSelectedUserToAdd] = useState<string>('')
  const [showAddMemberSection, setShowAddMemberSection] = useState(false)
  const { confirm, ConfirmDialog } = useConfirm()

  // Form data
  const [userFormData, setUserFormData] = useState({
    email: '',
    username: '',
    password: '',
    full_name: '',
    roleType: ''
  })
  const [roleFormData, setRoleFormData] = useState({
    name: '',
    roleType: '',
    description: '',
    selectedPermissions: [] as string[]
  })

  useEffect(() => {
    if (!organisationId) return // Guard against undefined organisationId
    const loadAllData = async () => {
      try {
        // Fetch projects first since other data depends on it
        const projectsResponse = await api.get('/api/v1/projects/', {
          params: { organisation_id: organisationId }
        })
        const projectsData = projectsResponse.data
        setProjects(projectsData)

        // Then fetch other data, passing projects as parameter
        await Promise.all([
          fetchDataWithProjects(projectsData),
          fetchPermissions()
        ])
      } catch (error: any) {
        console.error('Error loading data:', error)
        toast.error('Failed to load data')
      }
    }
    loadAllData()
  }, [organisationId, activeTab])

  const fetchData = async () => {
    // This is kept for modal callbacks - it will use current state projects
    const currentProjects = projects
    await fetchDataWithProjects(currentProjects)
  }

  const fetchDataWithProjects = async (projectsData: Project[]) => {
    setLoading(true)
    try {
      // Fetch organization details
      const orgResponse = await api.get(`/api/v1/organisations/${organisationId}`)
      setOrganisation(orgResponse.data)

      // Determine if current user is admin
      const isAdmin = currentUser?.is_superuser || currentUser?.id === orgResponse.data.owner_id
      setIsCurrentUserAdmin(isAdmin)

      // Fetch users
      let usersData: UserType[] = []
      try {
        usersData = await listOrganisationUsers(organisationId)
        setUsers(usersData)
      } catch (e) {
        console.warn('Failed to fetch users:', e)
        setUsers([])
      }

      // Fetch groups
      try {
        const groupsData = await listGroups(organisationId)
        setGroups(groupsData.groups || [])
      } catch (e) {
        console.warn('Failed to fetch groups:', e)
        setGroups([])
      }

      // Fetch roles
      try {
        const rolesData = await listRoles(organisationId)
        console.log('Roles API response:', rolesData)
        console.log('Roles array:', rolesData.roles)
        setRoles(rolesData.roles || [])
      } catch (e) {
        console.warn('Failed to fetch roles:', e)
        setRoles([])
      }

      // Fetch user roles across all projects (pass projects as parameter)
      await fetchAllUserRoles(usersData, projectsData)

      // Fetch user projects for each user
      if (usersData.length > 0) {
        await fetchAllUserProjects(usersData, projectsData)
      }

    } catch (error: any) {
      console.error('Error fetching data:', error)
      toast.error(error.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const fetchAllUserRoles = async (usersList: UserType[], projectsList: Project[] = projects) => {
    try {
      let allRoles: UserProjectRoleWithDetails[] = []

      // Fetch roles for each project
      for (const project of projectsList) {
        try {
          const response = await api.get(`/api/v1/roles/assignments/users`, {
            params: { project_id: project.id }
          })
          if (response.data.assignments) {
            allRoles = [...allRoles, ...response.data.assignments]
          }
        } catch (e) {
          // Project might not have any roles
        }
      }

      setUserRoles(allRoles)
    } catch (error: any) {
      console.error('Error fetching user roles:', error)
    }
  }

  const getUserRole = (user: UserType): string => {
    // If user is the organization owner, return "Owner"
    if (organisation && user.id === organisation.owner_id) {
      return 'Owner'
    }
    // Check if user has any organization-level roles
    const userOrgRoles = userRoles.filter(ur => ur.user_id === user.id)
    if (userOrgRoles.length > 0) {
      // Return the first organization-level role
      const firstRole = userOrgRoles[0]
      return (firstRole as any).role?.name || (firstRole as any).role_name || 'No Role'
    }
    // If no role assigned, return empty string
    return ''
  }

  const fetchAllUserProjects = async (usersList: UserType[], projectsList: Project[] = projects) => {
    try {
      const userProjectsMap: Record<string, Project[]> = {}

      for (const user of usersList) {
        const assignedProjects: Project[] = []

        for (const project of projectsList) {
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
          if (response.data && Array.isArray(response.data)) {
            if (response.data.some((m: any) => m.id === userId)) {
              assignedProjects.push(project)
            }
          }
        } catch (e: any) {
          // Log for debugging
          console.log(`Error fetching members for project ${project.id}:`, e.response?.status, e.response?.data?.detail)
          // User not assigned to this project or permission denied
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
      console.log('Fetched projects:', response.data)
      setProjects(response.data)
    } catch (error: any) {
      console.error('Error fetching projects:', error)
      toast.error('Failed to fetch projects: ' + (error.response?.data?.detail || error.message))
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
        expiry_days: 7,
        role_id: userFormData.roleType || undefined
      })

      toast.success(`Invitation sent to ${userFormData.email}`)
      setShowInviteModal(false)
      setUserFormData({ email: '', username: '', password: '', full_name: '', roleType: '' })

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
      // Refresh user projects with all current projects
      await fetchUserProjects(selectedUserForProjects.id)
      // Also refresh all user data to update the main table
      await fetchData()
    } catch (error: any) {
      console.error('Failed to assign user:', error)
      toast.error(error.response?.data?.detail || 'Failed to assign user')
    }
  }

  const handleRemoveFromProject = async (projectId: string) => {
    if (!selectedUserForProjects) return

    const confirmed = await confirm({
      message: `Remove ${selectedUserForProjects.username} from this project?`,
      variant: 'warning',
      confirmText: 'Remove User'
    })
    if (!confirmed) return

    try {
      await api.delete(
        `/api/v1/projects/${projectId}/members/${selectedUserForProjects.id}`
      )
      toast.success('User removed from project')
      // Refresh user projects with all current projects
      await fetchUserProjects(selectedUserForProjects.id)
      // Also refresh all user data to update the main table
      await fetchData()
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

  const handleDeleteUser = async (user: UserType) => {
    const confirmed = await confirm({
      message: `Are you sure you want to delete ${user.username}? This action cannot be undone.`,
      variant: 'danger',
      confirmText: 'Delete User'
    })

    if (!confirmed) return

    try {
      await api.delete(`/api/v1/users/${user.id}`)
      toast.success('User deleted successfully')
      fetchData()
    } catch (error: any) {
      console.error('Failed to delete user:', error)
      toast.error(error.response?.data?.detail || 'Failed to delete user')
    }
  }

  const handleDeleteGroup = async (group: Group) => {
    const confirmed = await confirm({
      message: `Are you sure you want to delete the group "${group.name}"? This will remove all user associations.`,
      variant: 'danger',
      confirmText: 'Delete Group'
    })

    if (!confirmed) return

    try {
      await deleteGroup(group.id)
      toast.success('Group deleted successfully')
      fetchData()
    } catch (error: any) {
      console.error('Failed to delete group:', error)
      toast.error(error.response?.data?.detail || 'Failed to delete group')
    }
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.full_name && user.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (group.description && group.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const filteredRoles = roles
    .filter(role =>
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.role_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (role.description && role.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => a.name.localeCompare(b.name))

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Top Bar with Title and Profile */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="h-[80px] px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Users & Teams</h1>
              <p className="text-xs text-gray-500">Manage user access and roles</p>
            </div>
          </div>
          <UserNav />
        </div>
      </div>

      {/* Page Content */}
      <div className="px-8 py-8">
        <div className="flex items-center justify-end mb-8">
          <div className="flex gap-2">
            {activeTab === 'users' && (
              <Button onClick={() => setShowInviteModal(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Invite User
              </Button>
            )}
            {activeTab === 'teams' && (
              <Button onClick={() => setShowCreateGroupModal(true)}>
                <Users className="mr-2 h-4 w-4" />
                Create Team
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
              className={`${activeTab === 'users'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <User className="w-4 h-4" />
              Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('teams')}
              className={`${activeTab === 'teams'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <Users className="w-4 h-4" />
              Teams ({groups.length})
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`${activeTab === 'roles'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <Shield className="w-4 h-4" />
              Project Roles ({roles.length})
            </button>
            <button
              onClick={() => setActiveTab('org-roles')}
              className={`${activeTab === 'org-roles'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <Shield className="w-4 h-4" />
              Org Roles
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
        </div>

        {/* Users Tab Content */}
        {activeTab === 'users' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th scope="col" className="px-6 py-3">User</th>
                    <th scope="col" className="px-6 py-3">Role</th>
                    <th scope="col" className="px-6 py-3">Projects</th>
                    <th scope="col" className="px-6 py-3">Created</th>
                    <th scope="col" className="px-6 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
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
                          {(() => {
                            const userRolesList = userRoles.filter(ur => ur.user_id === user.id)
                            const isOrgOwner = organisation && user.id === organisation.owner_id

                            // If user is org owner, always show Owner badge first
                            if (isOrgOwner) {
                              return (
                                <div className="flex flex-wrap gap-1">
                                  <span className="inline-block px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 rounded">
                                    Owner
                                  </span>
                                  {userRolesList.length > 0 && (
                                    Array.from(
                                      new Map(
                                        userRolesList.map(ur => {
                                          const roleName = (ur as any).role?.name || (ur as any).role_name || 'Unknown Role'
                                          return [roleName, ur]
                                        })
                                      ).values()
                                    ).map(ur => (
                                      <span
                                        key={ur.id}
                                        className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded"
                                      >
                                        {(ur as any).role?.name || (ur as any).role_name || 'Unknown Role'}
                                      </span>
                                    ))
                                  )}
                                </div>
                              )
                            }

                            if (userRolesList.length === 0) {
                              return <span className="text-sm text-gray-500 dark:text-gray-400">No roles</span>
                            }

                            // Deduplicate roles by name
                            const uniqueRoles = Array.from(
                              new Map(
                                userRolesList.map(ur => {
                                  const roleName = (ur as any).role?.name || (ur as any).role_name || 'Unknown Role'
                                  return [roleName, ur]
                                })
                              ).values()
                            )

                            return (
                              <div className="flex flex-wrap gap-1">
                                {uniqueRoles.map(ur => (
                                  <span
                                    key={ur.id}
                                    className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded"
                                  >
                                    {(ur as any).role?.name || (ur as any).role_name || 'Unknown Role'}
                                  </span>
                                ))}
                              </div>
                            )
                          })()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {(() => {
                              // Check if user has organization-level role (Owner or Admin)
                              const hasOrgLevelRole = userRoles.some(
                                ur => ur.user_id === user.id &&
                                  ((ur as any).role?.role_type === 'owner' ||
                                    (ur as any).role?.role_type === 'admin' ||
                                    (ur as any).role?.role_type === 'administrator' ||
                                    (ur as any).role?.name === 'Owner' ||
                                    (ur as any).role?.name === 'Admin' ||
                                    (ur as any).role_name === 'Owner' ||
                                    (ur as any).role_name === 'Admin')
                              )

                              if (hasOrgLevelRole) {
                                return (
                                  <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                                      All projects (auto)
                                    </span>
                                  </div>
                                )
                              }

                              if ((userProjects[user.id] || []).length > 0) {
                                return (
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
                                )
                              }

                              return (
                                <span className="text-sm text-gray-500 dark:text-gray-400">No projects</span>
                              )
                            })()}
                            {(() => {
                              // Don't show Manage Projects button for org-level roles
                              const hasOrgLevelRole = userRoles.some(
                                ur => ur.user_id === user.id &&
                                  ((ur as any).role?.role_type === 'owner' ||
                                    (ur as any).role?.role_type === 'admin' ||
                                    (ur as any).role?.role_type === 'administrator' ||
                                    (ur as any).role?.name === 'Owner' ||
                                    (ur as any).role?.name === 'Admin' ||
                                    (ur as any).role_name === 'Owner' ||
                                    (ur as any).role_name === 'Admin')
                              )

                              if (hasOrgLevelRole) {
                                return null
                              }

                              return (
                                <button
                                  onClick={() => openProjectAssignmentModal(user)}
                                  className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                                >
                                  <Plus className="w-3 h-3" />
                                  Manage Projects
                                </button>
                              )
                            })()}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDateHumanReadable(user.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedUser(user)
                                setShowEditUserModal(true)
                              }}
                              className="flex items-center gap-1 px-3 py-2 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                // Get the first role ID if the user has roles
                                const userRolesList = userRoles.filter(ur => ur.user_id === user.id)
                                const firstRoleId = userRolesList.length > 0 ? userRolesList[0].id : undefined

                                setRoleModalEntity({
                                  type: 'user',
                                  id: user.id,
                                  name: user.full_name || user.username,
                                  initialRoleId: firstRoleId
                                })
                                setShowAssignRoleModal(true)
                              }}
                              className="flex items-center gap-1 px-3 py-2 rounded-lg text-green-600 bg-green-50 hover:bg-green-100 dark:text-green-400 dark:bg-green-900/20 dark:hover:bg-green-900/30 transition-colors"
                            >
                              <Shield className="w-4 h-4" />
                              Roles
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="flex items-center gap-1 px-3 py-2 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/30 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
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

        {/* Teams Tab Content */}
        {activeTab === 'teams' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th scope="col" className="px-6 py-3">Team Name</th>
                    <th scope="col" className="px-6 py-3">Description</th>
                    <th scope="col" className="px-6 py-3">Status</th>
                    <th scope="col" className="px-6 py-3">Created</th>
                    <th scope="col" className="px-6 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGroups.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No teams found. Create a team to get started.
                      </td>
                    </tr>
                  ) : (
                    filteredGroups.map((group) => (
                      <tr key={group.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 dark:text-white">{group.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                            {group.description || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${group.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                            {group.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDateHumanReadable(group.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedGroup(group)
                                setShowEditGroupModal(true)
                              }}
                              className="flex items-center gap-1 px-3 py-2 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteGroup(group)}
                              className="flex items-center gap-1 px-3 py-2 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/30 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
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
                className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${rolesView === 'list'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                📋 Roles List
              </button>
              <button
                onClick={() => setRolesView('matrix')}
                className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${rolesView === 'matrix'
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
                                {getRoleType(role.role_type)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                {role.description || '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${role.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                {role.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${role.is_system_role ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
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
                <PermissionMatrix organisationId={organisationId} />
              </div>
            )}
          </div>
        )}

        {/* Org Roles Tab Content - Enterprise Role System */}
        {activeTab === 'org-roles' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-4">
              <h3 className="font-medium text-gray-900">Organization-Level Roles</h3>
              <p className="text-sm text-gray-600 mt-1">
                Enterprise role system with 7 tiers: Owner, Admin, Security Officer, Auditor, Service Account, Member, Viewer. These roles apply across the entire organization.
              </p>
            </div>
            <RolesManager
              organisationId={organisationId}
              currentUserRole={organisation?.owner_id === currentUser?.id ? 'owner' : 'member'}
            />
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Assign Role (Optional)
                  </label>
                  <select
                    value={userFormData.roleType}
                    onChange={(e) => setUserFormData({ ...userFormData, roleType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select a role...</option>
                    {/* Filter to only show the 6 enterprise project roles */}
                    {roles
                      .filter(role => ['project_admin', 'qa_lead', 'tester', 'auto_eng', 'dev_ro', 'viewer'].includes(role.role_type))
                      .map(role => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                  </select>
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
                    setUserFormData({ email: '', username: '', password: '', full_name: '', roleType: '' })
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
                        className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${isAssigned
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

        {/* Edit User Modal */}
        {showEditUserModal && selectedUser && (
          <EditUserModal
            user={selectedUser}
            onClose={() => {
              setShowEditUserModal(false)
              setSelectedUser(null)
            }}
            onSuccess={fetchData}
          />
        )}

        {/* Edit Group Modal */}
        {showEditGroupModal && selectedGroup && (
          <EditGroupModal
            group={selectedGroup}
            onClose={() => {
              setShowEditGroupModal(false)
              setSelectedGroup(null)
            }}
            onSuccess={fetchData}
          />
        )}

        {/* Create Group Modal */}
        <CreateGroupWithTypeModal
          isOpen={showCreateGroupModal}
          organisationId={organisationId}
          onClose={() => setShowCreateGroupModal(false)}
          onSuccess={fetchData}
        />

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
            initialRoleId={roleModalEntity.initialRoleId}
            onRoleAssigned={fetchData} // Refresh data immediately after role assignment
            onModalOpen={async () => {
              // Refresh projects when modal opens to ensure latest projects are available
              try {
                const projectsResponse = await api.get('/api/v1/projects/', {
                  params: { organisation_id: organisationId }
                })
                setProjects(projectsResponse.data)
              } catch (error) {
                console.error('Error refreshing projects:', error)
              }
            }}
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

      {/* Confirm Dialog */}
      <ConfirmDialog />
    </>
  )
}
