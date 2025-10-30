'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { PlusCircle, User, Users, Search, Pencil, Trash2, UserPlus, Shield, Plus } from 'lucide-react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { Sidebar } from '@/components/layout/sidebar'
import {
  listGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  getGroupUsers,
  addUserToGroup,
  removeUserFromGroup,
  type Group,
  type GroupUser
} from '@/lib/api/groups'
import {
  listRoles,
  listUserRoles,
  listGroupRoles,
  assignRoleToUser,
  assignRoleToGroup,
  removeRoleFromUser,
  removeRoleFromGroup,
  createRole,
  listPermissions,
  type ProjectRole,
  type UserProjectRoleWithDetails,
  type GroupProjectRoleWithDetails,
  type Permission
} from '@/lib/api/roles'
import { listOrganisationUsers, type User as UserType } from '@/lib/api/users'
import { RoleAssignmentModal } from '@/components/roles/role-assignment-modal'
import { createInvitation } from '@/lib/api/invitations'
import axios from '@/lib/axios'

type Tab = 'users' | 'groups' | 'roles'

interface Project {
  id: string
  name: string
}

export default function UsersTeamsPage() {
  const params = useParams()
  const organisationId = params.uuid as string

  const [activeTab, setActiveTab] = useState<Tab>('users')
  const [users, setUsers] = useState<UserType[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [roles, setRoles] = useState<ProjectRole[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [userRoles, setUserRoles] = useState<UserProjectRoleWithDetails[]>([])
  const [groupRoles, setGroupRoles] = useState<GroupProjectRoleWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [projects, setProjects] = useState<Project[]>([])
  const [userProjects, setUserProjects] = useState<Record<string, Project[]>>({})

  // Modal states
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showProjectAssignModal, setShowProjectAssignModal] = useState(false)
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)
  const [showEditGroupModal, setShowEditGroupModal] = useState(false)
  const [showAssignRoleModal, setShowAssignRoleModal] = useState(false)
  const [showGroupMembersModal, setShowGroupMembersModal] = useState(false)
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false)

  // Selected items
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null)
  const [selectedUserForProjects, setSelectedUserForProjects] = useState<UserType | null>(null)
  const [groupMembers, setGroupMembers] = useState<GroupUser[]>([])
  const [roleModalEntity, setRoleModalEntity] = useState<{
    type: 'user' | 'group'
    id: string
    name: string
  } | null>(null)
  const [selectedUserToAdd, setSelectedUserToAdd] = useState<string>('')
  const [showAddMemberSection, setShowAddMemberSection] = useState(false)

  // Form data
  const [groupFormData, setGroupFormData] = useState({ name: '', description: '' })
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
      // Fetch users
      const usersData = await listOrganisationUsers(organisationId)
      setUsers(usersData)

      // Fetch groups
      const groupsData = await listGroups(organisationId)
      setGroups(groupsData.groups)

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

  const fetchAllUserProjects = async (usersList: UserType[]) => {
    try {
      const userProjectsMap: Record<string, Project[]> = {}

      for (const user of usersList) {
        const assignedProjects: Project[] = []

        for (const project of projects) {
          try {
            const response = await axios.get(`/api/v1/projects/${project.id}/members`)
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
          const response = await axios.get(`/api/v1/projects/${project.id}/members`)
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
      const response = await axios.get('/api/v1/projects/', {
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

  const handleCreateGroup = async () => {
    try {
      await createGroup({
        name: groupFormData.name,
        description: groupFormData.description,
        organisation_id: organisationId,
      })
      toast.success('Group created successfully')
      setShowCreateGroupModal(false)
      setGroupFormData({ name: '', description: '' })
      fetchData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create group')
    }
  }

  const handleUpdateGroup = async () => {
    if (!selectedGroup) return
    try {
      await updateGroup(selectedGroup.id, {
        name: groupFormData.name,
        description: groupFormData.description,
      })
      toast.success('Group updated successfully')
      setShowEditGroupModal(false)
      setSelectedGroup(null)
      setGroupFormData({ name: '', description: '' })
      fetchData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update group')
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group?')) return
    try {
      await deleteGroup(groupId)
      toast.success('Group deleted successfully')
      fetchData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete group')
    }
  }

  const handleViewGroupMembers = async (group: Group) => {
    try {
      const members = await getGroupUsers(group.id)
      setGroupMembers(members)
      setSelectedGroup(group)
      setShowGroupMembersModal(true)
      setShowAddMemberSection(false)
      setSelectedUserToAdd('')
    } catch (error: any) {
      toast.error(error.message || 'Failed to load group members')
    }
  }

  const handleAddUserToGroup = async () => {
    if (!selectedGroup || !selectedUserToAdd) return

    try {
      await addUserToGroup(selectedGroup.id, selectedUserToAdd)
      toast.success('User added to group successfully')
      setSelectedUserToAdd('')
      setShowAddMemberSection(false)
      // Refresh group members
      const members = await getGroupUsers(selectedGroup.id)
      setGroupMembers(members)
    } catch (error: any) {
      toast.error(error.message || 'Failed to add user to group')
    }
  }

  const handleRemoveUserFromGroup = async (userId: string) => {
    if (!selectedGroup) return
    if (!confirm('Are you sure you want to remove this user from the group?')) return

    try {
      await removeUserFromGroup(selectedGroup.id, userId)
      toast.success('User removed from group successfully')
      // Refresh group members
      const members = await getGroupUsers(selectedGroup.id)
      setGroupMembers(members)
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove user from group')
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
      await axios.post(`/api/v1/projects/${projectId}/members`, {
        user_id: selectedUserForProjects.id
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
      await axios.delete(
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

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.full_name && user.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (group.description && group.description.toLowerCase().includes(searchQuery.toLowerCase()))
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
          {activeTab === 'groups' && (
            <Button onClick={() => setShowCreateGroupModal(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Group
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
            onClick={() => setActiveTab('groups')}
            className={`${
              activeTab === 'groups'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <Users className="w-4 h-4" />
            Groups ({groups.length})
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

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3">Projects</th>
                  <th scope="col" className="px-6 py-3">Created</th>
                  <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
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
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
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
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setRoleModalEntity({
                              type: 'user',
                              id: user.id,
                              name: user.full_name || user.username
                            })
                            setShowAssignRoleModal(true)
                          }}
                        >
                          <Shield className="w-4 h-4 mr-1" />
                          Manage Roles
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Groups Tab Content */}
      {activeTab === 'groups' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              No groups found. Create a group to organize your users.
            </div>
          ) : (
            filteredGroups.map((group) => (
              <div
                key={group.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{group.name}</h3>
                    {group.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{group.description}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    group.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {group.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleViewGroupMembers(group)}
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      <Users className="w-4 h-4" />
                      View Members
                    </button>

                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedGroup(group)
                          setGroupFormData({ name: group.name, description: group.description || '' })
                          setShowEditGroupModal(true)
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteGroup(group.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setRoleModalEntity({
                        type: 'group',
                        id: group.id,
                        name: group.name
                      })
                      setShowAssignRoleModal(true)
                    }}
                  >
                    <Shield className="w-4 h-4 mr-1" />
                    Manage Roles
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Roles Tab Content */}
      {activeTab === 'roles' && (
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
                </tr>
              </thead>
              <tbody>
                {filteredRoles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
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
                          role.is_default ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {role.is_default ? 'System' : 'Custom'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(role.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Create New Group</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={groupFormData.name}
                  onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., QA Team"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={groupFormData.description}
                  onChange={(e) => setGroupFormData({ ...groupFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  placeholder="Optional description..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateGroupModal(false)
                  setGroupFormData({ name: '', description: '' })
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateGroup} disabled={!groupFormData.name}>
                Create Group
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Group Modal */}
      {showEditGroupModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Edit Group</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={groupFormData.name}
                  onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={groupFormData.description}
                  onChange={(e) => setGroupFormData({ ...groupFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditGroupModal(false)
                  setSelectedGroup(null)
                  setGroupFormData({ name: '', description: '' })
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateGroup} disabled={!groupFormData.name}>
                Update Group
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Group Members Modal */}
      {showGroupMembersModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{selectedGroup.name} - Members</h2>
              {!showAddMemberSection && (
                <Button
                  size="sm"
                  onClick={() => setShowAddMemberSection(true)}
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  Add Member
                </Button>
              )}
            </div>

            {/* Add Member Section */}
            {showAddMemberSection && (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h3 className="text-sm font-semibold mb-3">Add User to Group</h3>
                <div className="flex gap-2">
                  <select
                    value={selectedUserToAdd}
                    onChange={(e) => setSelectedUserToAdd(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select a user...</option>
                    {users
                      .filter(user => !groupMembers.some(member => member.id === user.id))
                      .map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.full_name || user.username} ({user.email})
                        </option>
                      ))}
                  </select>
                  <Button onClick={handleAddUserToGroup} disabled={!selectedUserToAdd}>
                    Add
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddMemberSection(false)
                      setSelectedUserToAdd('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="max-h-96 overflow-y-auto">
              {groupMembers.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No members in this group yet.</p>
              ) : (
                <div className="space-y-2">
                  {groupMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
                          <span className="text-sm font-semibold text-white">
                            {(member.full_name || member.username).substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{member.full_name || member.username}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{member.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Added {member.added_at ? new Date(member.added_at).toLocaleDateString() : 'N/A'}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveUserFromGroup(member.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowGroupMembersModal(false)
                  setSelectedGroup(null)
                  setGroupMembers([])
                  setShowAddMemberSection(false)
                  setSelectedUserToAdd('')
                }}
              >
                Close
              </Button>
            </div>
          </div>
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
      </div>
    </div>
  )
}
