'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { PlusCircle, User, Users, Search, Pencil, Trash2, UserPlus, Shield } from 'lucide-react'
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
  initializeRoles,
  type ProjectRole,
  type UserProjectRoleWithDetails,
  type GroupProjectRoleWithDetails
} from '@/lib/api/roles'
import { listOrganisationUsers, type User as UserType } from '@/lib/api/users'
import { RoleAssignmentModal } from '@/components/roles/role-assignment-modal'
import axios from '@/lib/axios'

type Tab = 'users' | 'groups'

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
  const [userRoles, setUserRoles] = useState<UserProjectRoleWithDetails[]>([])
  const [groupRoles, setGroupRoles] = useState<GroupProjectRoleWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [projects, setProjects] = useState<Project[]>([])

  // Modal states
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)
  const [showEditGroupModal, setShowEditGroupModal] = useState(false)
  const [showAssignRoleModal, setShowAssignRoleModal] = useState(false)
  const [showGroupMembersModal, setShowGroupMembersModal] = useState(false)

  // Selected items
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null)
  const [groupMembers, setGroupMembers] = useState<GroupUser[]>([])
  const [roleModalEntity, setRoleModalEntity] = useState<{
    type: 'user' | 'group'
    id: string
    name: string
  } | null>(null)

  // Form data
  const [groupFormData, setGroupFormData] = useState({ name: '', description: '' })
  const [inviteFormData, setInviteFormData] = useState({ email: '', roleId: '' })

  useEffect(() => {
    fetchData()
    fetchProjects()
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

    } catch (error: any) {
      console.error('Error fetching data:', error)
      toast.error(error.message || 'Failed to load data')
    } finally {
      setLoading(false)
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
    } catch (error: any) {
      toast.error(error.message || 'Failed to load group members')
    }
  }

  const handleInitializeRoles = async () => {
    try {
      const result = await initializeRoles(organisationId)
      toast.success(`${result.roles_created} default roles created`)
      fetchData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to initialize roles')
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
          {roles.length === 0 && (
            <Button onClick={handleInitializeRoles} variant="outline">
              <Shield className="mr-2 h-4 w-4" />
              Initialize Roles
            </Button>
          )}
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
                  <th scope="col" className="px-6 py-3">Created</th>
                  <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
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
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
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
            <h2 className="text-xl font-bold mb-4">{selectedGroup.name} - Members</h2>
            <div className="max-h-96 overflow-y-auto">
              {groupMembers.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No members in this group yet.</p>
              ) : (
                <div className="space-y-2">
                  {groupMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <div className="font-medium">{member.full_name || member.username}</div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                      </div>
                      <div className="text-sm text-gray-500">
                        Added {member.added_at ? new Date(member.added_at).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end mt-6">
              <Button
                onClick={() => {
                  setShowGroupMembersModal(false)
                  setSelectedGroup(null)
                  setGroupMembers([])
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Invite User Modal - Placeholder */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Invite User</h2>
            <p className="text-sm text-gray-600 mb-4">
              User invitation feature coming soon. For now, users can sign up directly.
            </p>
            <div className="flex justify-end">
              <Button onClick={() => setShowInviteModal(false)}>
                Close
              </Button>
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
