'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Shield, Trash2, Plus, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import {
  listRoles,
  listUserRoles,
  listGroupRoles,
  assignRoleToUser,
  assignRoleToGroup,
  removeRoleFromUser,
  removeRoleFromGroup,
  type ProjectRole,
  type UserProjectRoleWithDetails,
  type GroupProjectRoleWithDetails
} from '@/lib/api/roles'

interface RoleAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  organisationId: string
  projectId?: string
  entityType: 'user' | 'group'
  entityId: string
  entityName: string
  availableProjects?: Array<{ id: string; name: string }>
}

export function RoleAssignmentModal({
  isOpen,
  onClose,
  organisationId,
  projectId: initialProjectId,
  entityType,
  entityId,
  entityName,
  availableProjects = []
}: RoleAssignmentModalProps) {
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState<ProjectRole[]>([])
  const [currentRoles, setCurrentRoles] = useState<(UserProjectRoleWithDetails | GroupProjectRoleWithDetails)[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || '')
  const [selectedRoleId, setSelectedRoleId] = useState<string>('')
  const [showAddRole, setShowAddRole] = useState(false)

  useEffect(() => {
    if (isOpen && selectedProjectId) {
      fetchData()
    }
  }, [isOpen, selectedProjectId, organisationId, entityId])

  const fetchData = async () => {
    if (!selectedProjectId) return

    setLoading(true)
    try {
      // Fetch available roles for the project
      const rolesData = await listRoles(organisationId, {
        project_id: selectedProjectId,
        is_active: true
      })
      setRoles(rolesData.roles)

      // Fetch current role assignments
      if (entityType === 'user') {
        const userRolesData = await listUserRoles(selectedProjectId, entityId)
        setCurrentRoles(userRolesData.user_roles)
      } else {
        const groupRolesData = await listGroupRoles(selectedProjectId, entityId)
        setCurrentRoles(groupRolesData.group_roles)
      }
    } catch (error: any) {
      console.error('Error fetching role data:', error)
      toast.error(error.message || 'Failed to load roles')
    } finally {
      setLoading(false)
    }
  }

  const handleAssignRole = async () => {
    if (!selectedRoleId || !selectedProjectId) return

    try {
      if (entityType === 'user') {
        await assignRoleToUser(entityId, selectedProjectId, selectedRoleId)
      } else {
        await assignRoleToGroup(entityId, selectedProjectId, selectedRoleId)
      }

      toast.success('Role assigned successfully')
      setSelectedRoleId('')
      setShowAddRole(false)
      fetchData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign role')
    }
  }

  const handleRemoveRole = async (roleAssignmentId: string) => {
    if (!confirm('Are you sure you want to remove this role assignment?')) return

    try {
      if (entityType === 'user') {
        await removeRoleFromUser(roleAssignmentId)
      } else {
        await removeRoleFromGroup(roleAssignmentId)
      }

      toast.success('Role removed successfully')
      fetchData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove role')
    }
  }

  const getRoleBadgeColor = (roleType: string) => {
    switch (roleType) {
      case 'administrator':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'project_manager':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'developer':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'tester':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'viewer':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-cyan-100 text-cyan-800 border-cyan-200'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Manage Roles - {entityName}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Assign and manage roles for this {entityType}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Project Selection */}
          {availableProjects.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Project
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value)
                  setCurrentRoles([])
                  setShowAddRole(false)
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select a project...</option>
                {availableProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!selectedProjectId ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <AlertCircle className="w-12 h-12 mb-3 text-gray-400" />
              <p className="text-center">
                {availableProjects.length > 0
                  ? 'Please select a project to manage roles'
                  : 'No projects available. Roles are managed at the project level.'}
              </p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading roles...</div>
            </div>
          ) : (
            <>
              {/* Current Role Assignments */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Current Roles
                  </h3>
                  {!showAddRole && (
                    <Button
                      size="sm"
                      onClick={() => setShowAddRole(true)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Role
                    </Button>
                  )}
                </div>

                {currentRoles.length === 0 && !showAddRole ? (
                  <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <Shield className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      No roles assigned yet
                    </p>
                    <Button onClick={() => setShowAddRole(true)}>
                      <Plus className="w-4 h-4 mr-1" />
                      Assign First Role
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentRoles.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-center gap-3">
                          <Shield className="w-5 h-5 text-gray-400" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {assignment.role_name}
                              </span>
                              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getRoleBadgeColor(assignment.role_type)}`}>
                                {assignment.role_type.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              Assigned {new Date(assignment.assigned_at).toLocaleDateString()} by {assignment.assigned_by}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveRole(assignment.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Role Section */}
              {showAddRole && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Assign New Role
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Select Role
                      </label>
                      <select
                        value={selectedRoleId}
                        onChange={(e) => setSelectedRoleId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Choose a role...</option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name} ({role.role_type.replace('_', ' ')})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Role Preview */}
                    {selectedRoleId && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        {(() => {
                          const selectedRole = roles.find(r => r.id === selectedRoleId)
                          if (!selectedRole) return null

                          return (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Shield className="w-5 h-5 text-blue-600" />
                                <span className="font-semibold text-blue-900 dark:text-blue-100">
                                  {selectedRole.name}
                                </span>
                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getRoleBadgeColor(selectedRole.role_type)}`}>
                                  {selectedRole.role_type.replace('_', ' ')}
                                </span>
                              </div>
                              {selectedRole.description && (
                                <p className="text-sm text-blue-700 dark:text-blue-200">
                                  {selectedRole.description}
                                </p>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        onClick={handleAssignRole}
                        disabled={!selectedRoleId}
                        className="flex-1"
                      >
                        Assign Role
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAddRole(false)
                          setSelectedRoleId('')
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Available Roles Reference */}
              {roles.length > 0 && !showAddRole && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Available Roles for this Project
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {roles.map((role) => (
                      <div
                        key={role.id}
                        className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/30 rounded text-sm"
                      >
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getRoleBadgeColor(role.role_type)}`}>
                          {role.role_type.replace('_', ' ')}
                        </span>
                        <span className="text-gray-700 dark:text-gray-300">{role.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
