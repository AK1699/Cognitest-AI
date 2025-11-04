/**
 * Hook to check if user has access to a module based on their roles
 * Provides RBAC enforcement for frontend module access
 */

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import api from '@/lib/api'

export interface ModuleAccessResult {
  hasAccess: boolean
  canRead: boolean
  canWrite: boolean
  canExecute: boolean
  canManage: boolean
  role?: string
  source?: 'direct' | 'group'
  loading: boolean
  error?: string
}

/**
 * Check if user has access to a specific module
 * @param projectId - Project ID to check access for
 * @param moduleId - Module to check (test-management, api-testing, etc.)
 * @param requiredAction - Specific action needed (read, write, execute, manage)
 * @returns Access information and loading state
 */
export function useModuleAccess(
  projectId: string,
  moduleId: string,
  requiredAction: 'read' | 'write' | 'execute' | 'manage' = 'read'
): ModuleAccessResult {
  const { user } = useAuth()
  const [result, setResult] = useState<ModuleAccessResult>({
    hasAccess: false,
    canRead: false,
    canWrite: false,
    canExecute: false,
    canManage: false,
    loading: true,
  })

  useEffect(() => {
    const checkAccess = async () => {
      if (!user || !projectId) {
        setResult(prev => ({ ...prev, loading: false }))
        return
      }

      try {
        const response = await api.get(`/api/v1/roles/user-permissions/${user.id}/project/${projectId}`)
        const permissions = response.data.permissions || []

        // Check for module-specific permissions
        const readPerm = permissions.find(
          (p: any) => p.resource === moduleId && p.action === 'read'
        )
        const writePerm = permissions.find(
          (p: any) => p.resource === moduleId && p.action === 'write'
        )
        const executePerm = permissions.find(
          (p: any) => p.resource === moduleId && p.action === 'execute'
        )
        const managePerm = permissions.find(
          (p: any) => p.resource === moduleId && p.action === 'manage'
        )

        const canRead = !!readPerm
        const canWrite = !!writePerm
        const canExecute = !!executePerm
        const canManage = !!managePerm

        // Determine if user has required action
        let hasRequiredAction = false
        switch (requiredAction) {
          case 'read':
            hasRequiredAction = canRead
            break
          case 'write':
            hasRequiredAction = canWrite
            break
          case 'execute':
            hasRequiredAction = canExecute
            break
          case 'manage':
            hasRequiredAction = canManage
            break
        }

        // Has access if can read at minimum
        const hasAccess = canRead || canWrite || canExecute || canManage

        setResult({
          hasAccess,
          canRead,
          canWrite,
          canExecute,
          canManage,
          role: response.data.role_type,
          source: response.data.assignment_source,
          loading: false,
        })
      } catch (error) {
        console.error('Error checking module access:', error)
        setResult(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to check access',
        }))
      }
    }

    checkAccess()
  }, [user, projectId, moduleId])

  return result
}

/**
 * Check if user has permission to perform an action
 * @param projectId - Project ID
 * @param resource - Resource type (test_plan, test_case, etc.)
 * @param action - Action (read, create, update, delete, execute, manage)
 */
export async function checkPermission(
  projectId: string,
  resource: string,
  action: string
): Promise<boolean> {
  try {
    const response = await api.post(`/api/v1/roles/check-permission`, {
      project_id: projectId,
      resource,
      action,
    })
    return response.data.has_permission === true
  } catch (error) {
    console.error('Error checking permission:', error)
    return false
  }
}

/**
 * Get all permissions for user in a project
 */
export async function getUserPermissions(projectId: string, userId: string) {
  try {
    const response = await api.get(`/api/v1/roles/user-permissions/${userId}/project/${projectId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching user permissions:', error)
    return null
  }
}
