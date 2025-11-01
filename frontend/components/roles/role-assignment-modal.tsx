'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Shield, Trash2, Plus, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { formatDateHumanReadable } from '@/lib/date-utils'
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
  const [filterProjectId, setFilterProjectId] = useState<string>(initialProjectId || '')
  const [selectedRoleId, setSelectedRoleId] = useState<string>('')
  const [showAddRole, setShowAddRole] = useState(false)

  // Fetch roles on modal open (independent of project selection)
  useEffect(() => {
    if (isOpen) {
      fetchRoles()
    }
  }, [isOpen, organisationId])

  // Fetch current assignments when filter project changes
  useEffect(() => {
    if (isOpen && filterProjectId) {
      fetchCurrentRoles()
    }
  }, [filterProjectId, entityId])

  const fetchRoles = async () => {
    setLoading(true)
    try {
      const rolesData = await listRoles(organisationId)
      setRoles(rolesData.roles)
    } catch (error: any) {
      console.error('Error fetching roles:', error)
      toast.error(error.message || 'Failed to load roles')
    } finally {
      setLoading(false)
    }
  }

  const fetchCurrentRoles = async () => {
    if (!filterProjectId) return

    try {
      // Fetch current role assignments for the selected project
      if (entityType === 'user') {
        const userRolesData = await listUserRoles(entityId, filterProjectId)
        setCurrentRoles(userRolesData)
      } else {
        const groupRolesData = await listGroupRoles(entityId, filterProjectId)
        setCurrentRoles(groupRolesData)
      }
    } catch (error: any) {
      console.error('Error fetching current roles:', error)
      toast.error(error.message || 'Failed to load current roles')
    }
  }

  const handleAssignRole = async () => {
    if (!selectedRoleId || !selectedProjectId) return

    try {
      if (entityType === 'user') {
        await assignRoleToUser(entityId, selectedRoleId, selectedProjectId)
      } else {
        await assignRoleToGroup(entityId, selectedRoleId, selectedProjectId)
      }

      toast.success('Role assigned successfully')
      setSelectedRoleId('')
      setShowAddRole(false)
      // Refresh if viewing that project
      if (filterProjectId === selectedProjectId) {
        await fetchCurrentRoles()
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign role')
    }
  }

  const handleRemoveRole = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to remove this role assignment?')) return

    try {
      if (entityType === 'user') {
        await removeRoleFromUser(assignmentId)
      } else {
        await removeRoleFromGroup(assignmentId)
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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading roles...</div>
            </div>
          ) : (
            <>
              {/* Assign Role Section - Always Visible */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Assign Role
                </h3>

                <div className="space-y-4">
                  {/* Role Selection */}
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

                  {/* Project Selection for Assignment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Project to Assign To
                    </label>
                    {availableProjects.length > 0 ? (
                      <select
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Select a project...</option>
                        {availableProjects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          ⚠️ No projects available. Please create a project first before assigning roles.
                        </p>
                      </div>
                    )}
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

                  {/* Assign Button */}
                  <Button
                    onClick={handleAssignRole}
                    disabled={!selectedRoleId || !selectedProjectId}
                    className="w-full"
                  >
                    Assign Role
                  </Button>
                </div>
              </div>

              {/* Current Role Assignments */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Current Roles
                </h3>

                {/* Project Filter for Viewing Assignments */}
                {availableProjects.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Filter by Project
                    </label>
                    <select
                      value={filterProjectId}
                      onChange={(e) => {
                        setFilterProjectId(e.target.value)
                        setCurrentRoles([])
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select a project to view...</option>
                      {availableProjects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {!filterProjectId ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                    <AlertCircle className="w-10 h-10 mb-2 text-gray-400" />
                    <p className="text-center text-sm">
                      {availableProjects.length > 0
                        ? 'Select a project to view assigned roles'
                        : 'No projects available'}
                    </p>
                  </div>
                ) : currentRoles.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <Shield className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No roles assigned yet for this project
                    </p>
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
                                {(assignment as any).role?.name || (assignment as any).role_name}
                              </span>
                              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getRoleBadgeColor((assignment as any).role?.role_type || (assignment as any).role_type)}`}>
                                {((assignment as any).role?.role_type || (assignment as any).role_type).replace('_', ' ')}
                              </span>
                            </div>
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
