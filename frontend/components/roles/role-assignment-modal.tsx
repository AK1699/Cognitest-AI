'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { StyledSelect } from '@/components/ui/styled-select'
import { X, Shield, Trash2, Plus, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { formatDateHumanReadable } from '@/lib/date-utils'
import { getRoleDisplayWithType } from '@/lib/role-display-utils'
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
  initialRoleId?: string
  onRoleAssigned?: () => void | Promise<void>
  onModalOpen?: () => void | Promise<void>
}

export function RoleAssignmentModal({
  isOpen,
  onClose,
  organisationId,
  projectId: initialProjectId,
  entityType,
  entityId,
  entityName,
  availableProjects = [],
  initialRoleId,
  onRoleAssigned,
  onModalOpen
}: RoleAssignmentModalProps) {
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState<ProjectRole[]>([])
  const [currentRoles, setCurrentRoles] = useState<(UserProjectRoleWithDetails | GroupProjectRoleWithDetails)[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || '')
  const [filterProjectId, setFilterProjectId] = useState<string>(initialProjectId || '')
  const [selectedRoleId, setSelectedRoleId] = useState<string>('')
  const [showAddRole, setShowAddRole] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string>('')

  // Fetch roles on modal open (independent of project selection)
  useEffect(() => {
    if (isOpen) {
      // Call parent callback to refresh projects/data if needed
      if (onModalOpen) {
        onModalOpen()
      }
      fetchRoles()
      fetchAllUserRoles() // Fetch all roles for this user across all projects
      // Set initial role if provided
      if (initialRoleId) {
        setSelectedRoleId(initialRoleId)
      }
    }
  }, [isOpen, organisationId, initialRoleId])

  // Fetch current assignments when filter project changes
  useEffect(() => {
    if (isOpen && filterProjectId) {
      fetchCurrentRoles()
    }
  }, [filterProjectId, entityId])

  // Fetch all roles for this user across all projects
  const fetchAllUserRoles = async () => {
    try {
      // Fetch from all projects to see where user already has roles
      if (entityType === 'user' && availableProjects.length > 0) {
        let allRoles: (UserProjectRoleWithDetails | GroupProjectRoleWithDetails)[] = []

        for (const project of availableProjects) {
          try {
            const userRolesData = await listUserRoles(entityId, project.id)
            allRoles = [...allRoles, ...userRolesData]
          } catch (e) {
            // Project might not have any roles for this user
          }
        }

        setCurrentRoles(allRoles)
      }
    } catch (error: any) {
      console.error('Error fetching all user roles:', error)
    }
  }

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
    const selectedRole = roles.find(r => r.id === selectedRoleId)
    const isAdminRole = selectedRole?.role_type === 'project_admin' || selectedRole?.role_type === 'administrator' || selectedRole?.role_type === 'owner' || selectedRole?.role_type === 'admin'

    // Admin role only needs role selection
    // Other roles require both role and project
    if (!selectedRoleId) return
    if (!isAdminRole && !selectedProjectId) return

    try {
      let projectToAssign = selectedProjectId

      // Get list of projects where user already has roles
      const projectsWithRoles = new Set(
        currentRoles.map(role => {
          // Extract project_id from currentRoles
          return (role as any).project_id
        })
      )

      // For admin role, if no project selected, find a project where user doesn't already have a role
      if (isAdminRole && !projectToAssign && availableProjects.length > 0) {
        // Find first project without a role assignment
        const projectWithoutRole = availableProjects.find(
          p => !projectsWithRoles.has(p.id)
        )

        if (projectWithoutRole) {
          projectToAssign = projectWithoutRole.id
        } else {
          // All projects have roles, use the first one and suggest updating
          projectToAssign = availableProjects[0].id
          toast.warning('User already has roles in all projects. Attempting to assign as admin role (may need to remove existing role first).')
        }
      }

      // For non-admin roles, check if selected project already has a role
      if (!isAdminRole && selectedProjectId && projectsWithRoles.has(selectedProjectId)) {
        // User already has a role on this project, try to find alternative
        const projectWithoutRole = availableProjects.find(
          p => !projectsWithRoles.has(p.id)
        )

        if (projectWithoutRole) {
          // Auto-switch to project without role
          projectToAssign = projectWithoutRole.id
          toast.info(`User already has a role on "${availableProjects.find(p => p.id === selectedProjectId)?.name || 'selected project'}". Assigning to "${projectWithoutRole.name}" instead.`)
        } else {
          // All projects have roles for this user
          toast.error('User already has a role on all projects. Please remove an existing role first, or assign an admin role for organization-wide access.')
          return
        }
      }

      if (!projectToAssign) {
        toast.error('Please create a project first before assigning roles')
        return
      }

      if (entityType === 'user') {
        await assignRoleToUser(entityId, selectedRoleId, projectToAssign)
      } else {
        await assignRoleToGroup(entityId, selectedRoleId, projectToAssign)
      }

      toast.success('Role assigned successfully')
      if (isAdminRole) {
        toast.success('✅ Admin user now has automatic access to all projects in this organization')
      }
      setSelectedRoleId('')
      setSelectedProjectId('')
      setShowAddRole(false)
      // Refresh if viewing that project
      if (filterProjectId === projectToAssign) {
        await fetchCurrentRoles()
      }
      // Call parent callback to refresh data
      if (onRoleAssigned) {
        await onRoleAssigned()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || error.message || 'Failed to assign role')
    }
  }

  const handleRemoveRole = async (assignmentId: string) => {
    setDeleteTargetId(assignmentId)
    setShowDeleteConfirm(true)
  }

  const confirmRemoveRole = async () => {
    if (!deleteTargetId) return

    try {
      if (entityType === 'user') {
        await removeRoleFromUser(deleteTargetId)
      } else {
        await removeRoleFromGroup(deleteTargetId)
      }

      toast.success('Role removed successfully')
      // Refresh roles after removal
      await fetchAllUserRoles()
      if (filterProjectId) {
        await fetchCurrentRoles()
      }
      setShowDeleteConfirm(false)
      setDeleteTargetId('')
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove role')
    }
  }

  const getRoleBadgeColor = (roleType: string) => {
    switch (roleType) {
      case 'owner':
      case 'admin':
      case 'administrator':
      case 'project_admin':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'qa_lead':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'technical_lead':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'auto_eng':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'qa_engineer':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'product_owner':
        return 'bg-pink-100 text-pink-800 border-pink-200'
      case 'developer':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200'
      case 'viewer':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  const getRoleDisplayName = (roleType: string) => {
    switch (roleType) {
      case 'owner':
        return 'Super Admin'
      case 'admin':
      case 'administrator':
      case 'project_admin':
        return 'Admin'
      case 'qa_lead':
        return 'QA Strategy'
      case 'qa_engineer':
        return 'QA Engineering'
      case 'auto_eng':
        return 'Automation'
      case 'technical_lead':
        return 'Tech Review'
      case 'product_owner':
        return 'Business Sign-off'
      case 'developer':
        return 'Engineering'
      case 'viewer':
        return 'Read Only'
      default:
        return roleType.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
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
                    <StyledSelect
                      value={selectedRoleId}
                      onChange={setSelectedRoleId}
                      placeholder="Choose a role..."
                      options={roles.map((role) => ({
                        value: role.id,
                        label: getRoleDisplayWithType(role.role_type)
                      }))}
                    />
                  </div>

                  {/* Project Selection for Assignment - Hidden for Admin/Owner Role */}
                  {selectedRoleId && (() => {
                    const selectedRole = roles.find(r => r.id === selectedRoleId)
                    const isAdminRole = selectedRole?.role_type === 'project_admin' || selectedRole?.role_type === 'administrator' || selectedRole?.role_type === 'owner' || selectedRole?.role_type === 'admin'

                    if (isAdminRole) {
                      return (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <div className="flex items-start gap-3">
                            <Shield className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-green-800 dark:text-green-200 mb-1">
                                {selectedRole?.role_type === 'owner' ? 'Owner Role' : 'Admin Role'} - No Project Selection Needed
                              </p>
                              <p className="text-sm text-green-700 dark:text-green-300">
                                {selectedRole?.role_type === 'owner'
                                  ? 'Owner has full control — can manage billing, delete the organization, assign roles, and configure SSO.'
                                  : 'Admin users automatically have full access to all projects in this organization.'
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    }

                    // Get projects where user already has roles
                    const projectsWithRoles = new Set(
                      currentRoles.map(role => (role as any).project_id)
                    )

                    return (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Select Project to Assign To
                          </label>
                          {availableProjects.length > 0 ? (
                            <StyledSelect
                              value={selectedProjectId}
                              onChange={setSelectedProjectId}
                              placeholder="Select a project..."
                              options={availableProjects.map((project) => ({
                                value: project.id,
                                label: project.name + (projectsWithRoles.has(project.id) ? ' (already assigned)' : '')
                              }))}
                            />
                          ) : (
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                ⚠️ No projects available. Please create a project first before assigning roles.
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Warning: Projects with existing roles */}
                        {projectsWithRoles.size > 0 && (
                          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 mb-2">
                              ℹ️ User already has roles on:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {availableProjects
                                .filter(p => projectsWithRoles.has(p.id))
                                .map(p => (
                                  <span
                                    key={p.id}
                                    className="inline-block px-2 py-1 text-xs bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100 rounded"
                                  >
                                    {p.name}
                                  </span>
                                ))}
                            </div>
                            <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                              System will automatically use a different project if you select one with an existing role.
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })()}


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
                                {getRoleDisplayName(selectedRole.role_type)}
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
                  {(() => {
                    const selectedRole = roles.find(r => r.id === selectedRoleId)
                    const isAdminRole = selectedRole?.role_type === 'project_admin' || selectedRole?.role_type === 'administrator' || selectedRole?.role_type === 'owner' || selectedRole?.role_type === 'admin'
                    // Admin role only needs role selection, others need both role and project
                    const isEnabled = selectedRoleId && (isAdminRole || selectedProjectId)

                    // Check if the selected role already exists
                    const roleAlreadyExists = currentRoles.some(role => {
                      const roleId = (role as any).role?.id || (role as any).role_id
                      const projectId = (role as any).project_id

                      // For admin roles, check if role exists (regardless of project)
                      if (isAdminRole) {
                        return roleId === selectedRoleId
                      }

                      // For non-admin roles, check if same role exists on same project
                      return roleId === selectedRoleId && projectId === selectedProjectId
                    })

                    return (
                      <Button
                        onClick={handleAssignRole}
                        disabled={!isEnabled || roleAlreadyExists}
                        className="w-full"
                      >
                        Assign Role
                      </Button>
                    )
                  })()}
                </div>
              </div>

              {/* Current Role Assignments */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Current Roles
                </h3>

                {/* Show all current roles */}
                {currentRoles.length > 0 ? (
                  <div className="space-y-3 mb-4">
                    {currentRoles.map((roleAssignment) => {
                      const roleName = (roleAssignment as any).role?.name || (roleAssignment as any).role_name || 'Unknown Role'
                      const roleType = (roleAssignment as any).role?.role_type || (roleAssignment as any).role_type || 'system'
                      const projectId = (roleAssignment as any).project_id
                      const projectName = availableProjects.find(p => p.id === projectId)?.name || 'Unknown Project'

                      return (
                        <div
                          key={roleAssignment.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {roleName}
                              </span>
                              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getRoleBadgeColor(roleType)}`}>
                                {getRoleDisplayName(roleType)}
                              </span>
                            </div>
                            {/* Only show project for non-org-level roles */}
                            {!(roleType === 'project_admin' || roleType === 'owner' || roleType === 'admin' || roleType === 'administrator') && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Project: {projectName}
                              </p>
                            )}
                            {/* Show org-level indicator for org roles */}
                            {(roleType === 'project_admin' || roleType === 'owner' || roleType === 'admin' || roleType === 'administrator') && (
                              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                Organization-level access
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveRole(roleAssignment.id)}
                            className="ml-4 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Remove role"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <Shield className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">No roles assigned yet</p>
                  </div>
                )}

                {/* Project Filter for Viewing Specific Project Roles */}
                {availableProjects.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      View roles by project (optional)
                    </label>
                    <StyledSelect
                      value={filterProjectId}
                      onChange={(value) => {
                        setFilterProjectId(value)
                        if (value) {
                          fetchCurrentRoles()
                        }
                      }}
                      placeholder="All projects"
                      options={[
                        { value: '', label: 'All projects' },
                        ...availableProjects.map((project) => ({
                          value: project.id,
                          label: project.name
                        }))
                      ]}
                    />
                  </div>
                )}

                {filterProjectId && currentRoles.length === 0 ? (
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
                                {getRoleDisplayName((assignment as any).role?.role_type || (assignment as any).role_type)}
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Remove Role Assignment
              </h3>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 dark:text-white font-medium mb-2">
                    Are you sure you want to remove this role assignment?
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    This action will revoke the {entityType}'s access to the assigned project. This cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmRemoveRole}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Remove Role
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
