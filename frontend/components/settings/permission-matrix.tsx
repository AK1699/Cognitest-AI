'use client'

import { useEffect, useState, Fragment } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import api from '@/lib/api'
import { Loader2, Save, RotateCcw } from 'lucide-react'

interface Permission {
  id: string
  name: string
  resource: string
  action: string
  description?: string
}

interface Role {
  id: string
  name: string
  description?: string
  permission_count?: number
  permissions?: Permission[]
}

interface PermissionMatrixProps {
  organisationId: string
}

interface RolePermissionMap {
  [roleId: string]: string[]
}

// Group permissions by resource for better organization
const PERMISSION_GROUPS = {
  'User Management': ['manage_users', 'read_user'],
  'Role Management': ['manage_roles', 'read_role', 'assign_role'],
  'Project Management': ['create_project', 'read_project', 'update_project', 'delete_project', 'manage_project'],
  'Test Planning': ['create_test_plan', 'read_test_plan', 'update_test_plan', 'delete_test_plan'],
  'Test Suites': ['create_test_suite', 'read_test_suite', 'update_test_suite', 'delete_test_suite'],
  'Test Cases': ['create_test_case', 'read_test_case', 'update_test_case', 'delete_test_case'],
  'Test Execution': ['execute_test', 'read_test_execution'],
  'Group Management': ['create_group', 'read_group', 'update_group', 'delete_group', 'manage_group'],
  'Settings': ['read_settings', 'manage_settings'],
  'Organization': ['manage_organization'],
}

export function PermissionMatrix({ organisationId }: PermissionMatrixProps) {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [rolePermissions, setRolePermissions] = useState<RolePermissionMap>({})
  const [originalRolePermissions, setOriginalRolePermissions] = useState<RolePermissionMap>({})

  useEffect(() => {
    fetchData()
  }, [organisationId])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch roles
      const rolesResponse = await api.get('/api/v1/roles/', {
        params: { organisation_id: organisationId }
      })
      const rolesList = rolesResponse.data.roles || []
      setRoles(rolesList)

      // Fetch all permissions
      const permsResponse = await api.get('/api/v1/roles/permissions')
      // API returns { permissions: [...], total: number }
      const permsList = permsResponse.data.permissions || []
      setPermissions(permsList)

      // Initialize role-permission mapping
      const permMap: RolePermissionMap = {}
      rolesList.forEach((role: Role) => {
        permMap[role.id] = (role.permissions || []).map((p: Permission) => p.id)
      })
      setRolePermissions(permMap)
      setOriginalRolePermissions(JSON.parse(JSON.stringify(permMap)))
    } catch (error: any) {
      console.error('Failed to fetch data:', error)
      toast.error('Failed to load roles and permissions')
    } finally {
      setLoading(false)
    }
  }

  const togglePermission = (roleId: string, permissionId: string) => {
    setRolePermissions(prev => {
      const newMap = { ...prev }
      const rolePerms = [...(newMap[roleId] || [])]
      const index = rolePerms.indexOf(permissionId)
      if (index > -1) {
        rolePerms.splice(index, 1)
      } else {
        rolePerms.push(permissionId)
      }
      newMap[roleId] = rolePerms
      return newMap
    })
  }

  const hasChanges = () => {
    return Object.keys(rolePermissions).some(
      roleId => {
        const original = Array.from(originalRolePermissions[roleId] || []).sort()
        const current = Array.from(rolePermissions[roleId] || []).sort()
        return JSON.stringify(original) !== JSON.stringify(current)
      }
    )
  }

  const savePermissions = async () => {
    setSaving(true)
    try {
      // Update each role with its new permissions
      for (const role of roles) {
        const permIds = Array.from(rolePermissions[role.id] || [])
        await api.put(`/api/v1/roles/${role.id}`, {
          permission_ids: permIds
        })
      }
      toast.success('Permissions updated successfully!')
      setOriginalRolePermissions(JSON.parse(JSON.stringify(rolePermissions)))
    } catch (error: any) {
      console.error('Failed to save permissions:', error)
      toast.error(error.response?.data?.detail || 'Failed to save permissions')
    } finally {
      setSaving(false)
    }
  }

  const resetChanges = () => {
    setRolePermissions(JSON.parse(JSON.stringify(originalRolePermissions)))
    toast.info('Changes discarded')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2">Loading permission matrix...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Role Permissions Matrix
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Configure permissions for each role. Check the boxes to grant permissions.
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-3 justify-end">
        <Button
          variant="outline"
          onClick={resetChanges}
          disabled={!hasChanges() || saving}
          className="gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Discard Changes
        </Button>
        <Button
          onClick={savePermissions}
          disabled={!hasChanges() || saving}
          className="gap-2 bg-blue-600 hover:bg-blue-700"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Permission Matrix */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse" style={{ tableLayout: 'fixed' }}>
            {/* Header */}
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <th className="px-3 py-3 text-left font-semibold text-gray-900 dark:text-white sticky left-0 bg-gray-50 dark:bg-gray-900 z-10" style={{ width: '192px' }}>
                  Permission
                </th>
                {roles.map(role => (
                  <th
                    key={role.id}
                    className="px-2 py-3 text-center font-semibold text-gray-900 dark:text-white whitespace-nowrap align-middle"
                    style={{ width: '120px' }}
                  >
                    <div className="truncate text-xs" title={role.name}>
                      {role.name}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {Object.entries(PERMISSION_GROUPS).map(([groupName, permNames]) => {
                const groupPerms = permissions.filter(p => permNames.includes(p.name))
                if (groupPerms.length === 0) return null

                return (
                  <Fragment key={groupName}>
                    {/* Group Header */}
                    <tr className="bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
                      <td
                        colSpan={roles.length + 1}
                        className="px-3 py-2 text-sm font-bold text-blue-900 dark:text-blue-200 sticky left-0 bg-blue-50 dark:bg-blue-900/20 z-10"
                      >
                        {groupName}
                      </td>
                    </tr>

                    {/* Permission rows */}
                    {groupPerms.map(perm => (
                      <tr
                        key={perm.id}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="px-3 py-3 text-gray-900 dark:text-white sticky left-0 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 z-10 align-middle" style={{ width: '192px' }}>
                          <div>
                            <div className="font-medium text-xs truncate" title={perm.name}>{perm.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 hidden sm:block truncate" title={perm.description || `${perm.action} ${perm.resource}`}>
                              {perm.description || `${perm.action} ${perm.resource}`}
                            </div>
                          </div>
                        </td>
                        {roles.map(role => (
                          <td
                            key={`${role.id}-${perm.id}`}
                            className="px-2 py-3 text-center align-middle"
                            style={{ width: '120px' }}
                          >
                            <div className="flex items-center justify-center h-full">
                              <Checkbox
                                checked={(rolePermissions[role.id] || []).includes(perm.id)}
                                onCheckedChange={() =>
                                  togglePermission(role.id, perm.id)
                                }
                                className="w-4 h-4"
                                disabled={saving}
                              />
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {roles.map(role => (
          <div
            key={role.id}
            className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800"
          >
            <div className="text-xs font-semibold text-gray-900 dark:text-white mb-1 truncate" title={role.name}>
              {role.name}
            </div>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {(rolePermissions[role.id] || []).length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              assigned
            </div>
          </div>
        ))}
      </div>

      {/* Change indicator */}
      {hasChanges() && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            You have unsaved changes. Click "Save Changes" to apply them.
          </p>
        </div>
      )}
    </div>
  )
}
