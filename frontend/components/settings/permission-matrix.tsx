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
  isAdmin?: boolean
}

interface RolePermissionMap {
  [roleId: string]: string[]
}

// Group permissions by resource for better organization
const PERMISSION_GROUPS = {
  'User Management': ['user_read_access', 'user_write_access', 'user_delete_access'],
  'Role Management': ['role_read_access', 'role_write_access', 'role_delete_access'],
  'Project Management': ['project_read_access', 'project_write_access', 'project_delete_access'],
  'Settings': ['settings_read_access', 'settings_write_access'],
  'Organization': ['organization_manage_access'],
  'Test Case Management': [
    'test_case_read_access', 'test_case_write_access', 'test_case_delete_access', 'test_case_execute_access',
  ],
  'Security Testing': [
    'security_test_read_access', 'security_test_write_access', 'security_test_delete_access', 'security_test_execute_access',
  ],
  'API Testing': [
    'api_test_read_access', 'api_test_write_access', 'api_test_delete_access', 'api_test_execute_access',
  ],
  'Automation Hub': [
    'automation_read_access', 'automation_write_access', 'automation_delete_access', 'automation_execute_access',
  ],
}

// Permission matrix definition - which roles have which permissions
// Based on role permission specification: Owner/Admin have full access, others have graduated access levels
// NOTE: This matrix should include ALL permissions that exist in the database
const PERMISSION_MATRIX: Record<string, Record<string, boolean>> = {
  // User Management
  'user_read_access': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': false, 'qa_engineer': false, 'product_owner': false, 'viewer': false },
  'user_write_access': { 'owner': true, 'admin': true, 'qa_manager': false, 'qa_lead': false, 'qa_engineer': false, 'product_owner': false, 'viewer': false },
  'user_delete_access': { 'owner': true, 'admin': true, 'qa_manager': false, 'qa_lead': false, 'qa_engineer': false, 'product_owner': false, 'viewer': false },
  // Role Management
  'role_read_access': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': false, 'qa_engineer': false, 'product_owner': false, 'viewer': false },
  'role_write_access': { 'owner': true, 'admin': true, 'qa_manager': false, 'qa_lead': false, 'qa_engineer': false, 'product_owner': false, 'viewer': false },
  'role_delete_access': { 'owner': true, 'admin': true, 'qa_manager': false, 'qa_lead': false, 'qa_engineer': false, 'product_owner': false, 'viewer': false },
  // Project Management
  'project_read_access': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': true, 'qa_engineer': true, 'product_owner': true, 'viewer': true },
  'project_write_access': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': true, 'qa_engineer': false, 'product_owner': false, 'viewer': false },
  'project_delete_access': { 'owner': true, 'admin': true, 'qa_manager': false, 'qa_lead': false, 'qa_engineer': false, 'product_owner': false, 'viewer': false },
  // Settings
  'settings_read_access': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': false, 'qa_engineer': false, 'product_owner': false, 'viewer': false },
  'settings_write_access': { 'owner': true, 'admin': true, 'qa_manager': false, 'qa_lead': false, 'qa_engineer': false, 'product_owner': false, 'viewer': false },
  // Organization
  'organization_manage_access': { 'owner': true, 'admin': true, 'qa_manager': false, 'qa_lead': false, 'qa_engineer': false, 'product_owner': false, 'viewer': false },
  // Test Case Management (using newer naming convention)
  'test_case_read_access': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': true, 'qa_engineer': true, 'product_owner': true, 'viewer': true },
  'test_case_write_access': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': true, 'qa_engineer': true, 'product_owner': false, 'viewer': false },
  'test_case_delete_access': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': true, 'qa_engineer': false, 'product_owner': false, 'viewer': false },
  'test_case_execute_access': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': true, 'qa_engineer': true, 'product_owner': false, 'viewer': false },
  // Test Management (alternate naming convention)
  'read_test_management': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': true, 'qa_engineer': true, 'product_owner': true, 'viewer': true },
  'write_test_management': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': true, 'qa_engineer': true, 'product_owner': false, 'viewer': false },
  'manage_test_management': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': true, 'qa_engineer': false, 'product_owner': false, 'viewer': false },
  'execute_test_management': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': true, 'qa_engineer': true, 'product_owner': false, 'viewer': false },
  // Security Testing
  'security_test_read_access': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': true, 'qa_engineer': true, 'product_owner': true, 'viewer': true },
  'security_test_write_access': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': true, 'qa_engineer': false, 'product_owner': false, 'viewer': false },
  'security_test_delete_access': { 'owner': true, 'admin': true, 'qa_manager': false, 'qa_lead': false, 'qa_engineer': false, 'product_owner': false, 'viewer': false },
  'security_test_execute_access': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': true, 'qa_engineer': true, 'product_owner': false, 'viewer': false },
  // Security Testing (alternate naming)
  'read_security_testing': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': true, 'qa_engineer': true, 'product_owner': true, 'viewer': true },
  'write_security_testing': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': true, 'qa_engineer': false, 'product_owner': false, 'viewer': false },
  'manage_security_testing': { 'owner': true, 'admin': true, 'qa_manager': false, 'qa_lead': false, 'qa_engineer': false, 'product_owner': false, 'viewer': false },
  'execute_security_testing': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': true, 'qa_engineer': true, 'product_owner': false, 'viewer': false },
  // API Testing
  'api_test_read_access': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': true, 'qa_engineer': true, 'product_owner': true, 'viewer': true },
  'api_test_write_access': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': true, 'qa_engineer': true, 'product_owner': false, 'viewer': false },
  'api_test_delete_access': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': false, 'qa_engineer': false, 'product_owner': false, 'viewer': false },
  'api_test_execute_access': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': true, 'qa_engineer': true, 'product_owner': false, 'viewer': false },
  // API Testing (alternate naming)
  'read_api_testing': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': true, 'qa_engineer': true, 'product_owner': true, 'viewer': true },
  'write_api_testing': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': true, 'qa_engineer': true, 'product_owner': false, 'viewer': false },
  'manage_api_testing': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': false, 'qa_engineer': false, 'product_owner': false, 'viewer': false },
  'execute_api_testing': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': true, 'qa_engineer': true, 'product_owner': false, 'viewer': false },
  // Automation Hub
  'automation_read_access': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': true, 'qa_engineer': true, 'product_owner': true, 'viewer': true },
  'automation_write_access': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': true, 'qa_engineer': false, 'product_owner': false, 'viewer': false },
  'automation_delete_access': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': false, 'qa_engineer': false, 'product_owner': false, 'viewer': false },
  'automation_execute_access': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': true, 'qa_engineer': true, 'product_owner': false, 'viewer': false },
  // Automation Hub (alternate naming)
  'read_automation_hub': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': true, 'qa_engineer': true, 'product_owner': true, 'viewer': true },
  'write_automation_hub': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': true, 'qa_engineer': false, 'product_owner': false, 'viewer': false },
  'manage_automation_hub': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': false, 'qa_engineer': false, 'product_owner': false, 'viewer': false },
  'execute_automation_hub': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': true, 'qa_engineer': true, 'product_owner': false, 'viewer': false },
  // Performance Testing
  'read_performance_testing': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': true, 'qa_engineer': true, 'product_owner': true, 'viewer': true },
  'write_performance_testing': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': true, 'qa_engineer': true, 'product_owner': false, 'viewer': false },
  'manage_performance_testing': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': false, 'qa_engineer': false, 'product_owner': false, 'viewer': false },
  'execute_performance_testing': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': true, 'qa_engineer': true, 'product_owner': false, 'viewer': false },
  'performance_test_read_access': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': true, 'qa_engineer': true, 'product_owner': true, 'viewer': true },
  'performance_test_write_access': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': true, 'qa_engineer': true, 'product_owner': false, 'viewer': false },
  'performance_test_delete_access': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': false, 'qa_engineer': false, 'product_owner': false, 'viewer': false },
  'performance_test_execute_access': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': true, 'qa_engineer': true, 'product_owner': false, 'viewer': false },
  // Mobile Testing
  'read_mobile_testing': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': true, 'qa_engineer': true, 'product_owner': true, 'viewer': true },
  'write_mobile_testing': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': true, 'qa_engineer': true, 'product_owner': false, 'viewer': false },
  'manage_mobile_testing': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': false, 'qa_engineer': false, 'product_owner': false, 'viewer': false },
  'execute_mobile_testing': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': true, 'qa_engineer': true, 'product_owner': false, 'viewer': false },
  'mobile_test_read_access': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': true, 'qa_engineer': true, 'product_owner': true, 'viewer': true },
  'mobile_test_write_access': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': true, 'qa_engineer': true, 'product_owner': false, 'viewer': false },
  'mobile_test_delete_access': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': false, 'qa_engineer': false, 'product_owner': false, 'viewer': false },
  'mobile_test_execute_access': { 'owner': true, 'admin': true, 'qa_manager': true, 'qa_lead': true, 'qa_engineer': true, 'product_owner': false, 'viewer': false },
}

export function PermissionMatrix({ organisationId, isAdmin = false }: PermissionMatrixProps) {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [rolePermissions, setRolePermissions] = useState<RolePermissionMap>({})
  const [originalRolePermissions, setOriginalRolePermissions] = useState<RolePermissionMap>({})
  const [permissionGroups, setPermissionGroups] = useState<Record<string, string[]>>(PERMISSION_GROUPS)
  const [enabledModules, setEnabledModules] = useState<string[]>([])

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
      console.log('🎯 Roles from API:', rolesList.map(r => ({
        id: r.id,
        name: r.name,
        role_type: r.role_type,
        permissions_from_api: r.permissions?.length || 0,
        permission_count: r.permission_count
      })))
      setRoles(rolesList)

      // Fetch dynamic permissions based on enabled modules
      let permsList: Permission[] = []
      try {
        const dynamicResponse = await api.get(`/api/v1/roles/dynamic/${organisationId}`)
        const { permission_groups, all_permissions, enabled_modules } = dynamicResponse.data

        // Use dynamic permission groups if available
        if (permission_groups) {
          setPermissionGroups(permission_groups)
        }

        // Set enabled modules for reference
        if (enabled_modules) {
          setEnabledModules(enabled_modules)
        }

        // Use all permissions including dynamic ones
        permsList = all_permissions || []
        setPermissions(permsList)
      } catch (dynamicError) {
        // Fallback to static permissions if dynamic endpoint fails
        console.warn('Could not fetch dynamic permissions, using static permissions:', dynamicError)
        const permsResponse = await api.get('/api/v1/roles/permissions')
        permsList = permsResponse.data.permissions || []
        setPermissions(permsList)
      }

      // Initialize role-permission mapping based on PERMISSION_MATRIX ONLY
      // CRITICAL: We MUST ignore any permissions from the API and use ONLY PERMISSION_MATRIX
      const permMap: RolePermissionMap = {}

      // Create a mapping of permission names to IDs for quick lookup
      const permNameToIdMap: Record<string, string> = {}
      permsList.forEach(perm => {
        permNameToIdMap[perm.name] = perm.id
      })

      console.log('🔍 Permission name to ID mapping:', Object.keys(permNameToIdMap).slice(0, 5))
      console.log('📋 Total permissions found:', permsList.length)

      rolesList.forEach((role: Role) => {
        let rolePerms: string[] = []

        console.log(`🔍 Processing role "${role.name}" (${role.role_type}):`, {
          hasPermissions: !!role.permissions,
          permissionCount: role.permissions?.length || 0,
          permissionIds: role.permissions?.map(p => p.id) || []
        })

        // ALWAYS use permissions from the API - this is the source of truth
        if (role.permissions && role.permissions.length > 0) {
          rolePerms = role.permissions.map(p => p.id)
          console.log(`✅ Role "${role.name}" (${role.role_type}): ${rolePerms.length} permissions from API`)
          console.log(`   Permission IDs: ${rolePerms.slice(0, 3).join(', ')}...`)
        } else {
          // If no permissions from API, it means the role has NO permissions assigned
          console.log(`⚠️ Role "${role.name}" (${role.role_type}) has NO permissions assigned in database`)
        }

        permMap[role.id] = rolePerms
      })

      // Log detailed mapping for debugging
      console.log('📝 Detailed permission mapping:')
      Object.entries(permMap).forEach(([roleId, permIds]) => {
        const role = rolesList.find(r => r.id === roleId)
        console.log(`  ${role?.name}: [${permIds.map(id => {
          const perm = permsList.find(p => p.id === id)
          return perm?.name || id
        }).join(', ')}]`)
      })

      console.log('📊 Final permission map:', Object.entries(permMap).map(([roleId, perms]) => ({
        roleId: roleId.slice(0, 8),
        count: perms.length,
        sampleIds: perms.slice(0, 2)
      })))

      // Set state - these are the ONLY permissions we will use
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
    if (!isAdmin) return

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
        {!isAdmin && (
          <p className="text-sm text-orange-600 dark:text-orange-400 mt-2">
            Only administrators can modify role permissions.
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-3 justify-end">
        <Button
          variant="outline"
          onClick={resetChanges}
          disabled={!hasChanges() || saving || !isAdmin}
          className="gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Discard Changes
        </Button>
        <Button
          onClick={savePermissions}
          disabled={!hasChanges() || saving || !isAdmin}
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
              {Object.entries(permissionGroups).map(([groupName, permNames]) => {
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
                    {permNames.map((permName, idx) => {
                      // Find the permission by name
                      const perm = permissions.find(p => p.name === permName)
                      if (!perm) return null

                      return (
                        <tr
                          key={`${groupName}-${permName}-${idx}`}
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
                          {roles.map(role => {
                            const isChecked = (rolePermissions[role.id] || []).includes(perm.id)
                            return (
                              <td
                                key={`${role.id}-${perm.id}`}
                                className="px-2 py-3 text-center align-middle"
                                style={{ width: '120px' }}
                              >
                                <div className="flex items-center justify-center h-full">
                                  <input
                                    type="checkbox"
                                    checked={isChecked === true}
                                    onChange={() => {
                                      togglePermission(role.id, perm.id)
                                    }}
                                    className="w-4 h-4 cursor-pointer accent-primary"
                                    disabled={saving}
                                    title={isAdmin ? 'Click to change permission' : 'Admin permissions required to modify'}
                                    data-role={role.id}
                                    data-perm={perm.id}
                                  />
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
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
