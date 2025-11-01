'use client'

import React from 'react'
import { useModuleAccess } from '@/lib/hooks/use-module-access'
import { Lock, AlertCircle } from 'lucide-react'

interface ModuleAccessGuardProps {
  projectId: string
  moduleId: string
  requiredAction?: 'read' | 'write' | 'execute' | 'manage'
  children: React.ReactNode
  fallback?: React.ReactNode
  showAccessDenied?: boolean
}

/**
 * Wrapper component that guards access to modules based on user roles
 * Only displays content if user has required permissions
 */
export function ModuleAccessGuard({
  projectId,
  moduleId,
  requiredAction = 'read',
  children,
  fallback,
  showAccessDenied = true,
}: ModuleAccessGuardProps) {
  const access = useModuleAccess(projectId, moduleId, requiredAction)

  if (access.loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Checking access permissions...</p>
        </div>
      </div>
    )
  }

  if (!access.hasAccess) {
    if (fallback) {
      return <>{fallback}</>
    }

    if (!showAccessDenied) {
      return null
    }

    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Lock className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600 text-center max-w-md mb-4">
          You don't have permission to access this module.
          <br />
          <span className="text-sm text-gray-500">
            Contact your organization admin to request access.
          </span>
        </p>
      </div>
    )
  }

  // Check if user has specific action required
  const actionAllowed =
    requiredAction === 'read' ? access.canRead :
    requiredAction === 'write' ? access.canWrite :
    requiredAction === 'execute' ? access.canExecute :
    requiredAction === 'manage' ? access.canManage : true

  if (!actionAllowed) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-12 h-12 text-yellow-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Insufficient Permissions
        </h3>
        <p className="text-gray-600 text-center max-w-md">
          You don't have permission to perform the action "{requiredAction}" on this module.
        </p>
      </div>
    )
  }

  return <>{children}</>
}

/**
 * Hook-based access check - returns boolean for conditional rendering
 */
export function useHasModuleAccess(
  projectId: string,
  moduleId: string,
  action: 'read' | 'write' | 'execute' | 'manage' = 'read'
): boolean {
  const access = useModuleAccess(projectId, moduleId, action)

  if (access.loading) return false

  const actionMap = {
    read: access.canRead,
    write: access.canWrite,
    execute: access.canExecute,
    manage: access.canManage,
  }

  return actionMap[action] || false
}

/**
 * Conditional rendering helper
 */
export function ProtectedElement({
  projectId,
  moduleId,
  action = 'read',
  children,
  fallback = null,
}: {
  projectId: string
  moduleId: string
  action?: 'read' | 'write' | 'execute' | 'manage'
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const hasAccess = useHasModuleAccess(projectId, moduleId, action)

  if (!hasAccess) {
    return fallback ? <>{fallback}</> : null
  }

  return <>{children}</>
}

/**
 * Display element only if user has specific role in project
 */
export function RoleBasedElement({
  projectId,
  requiredRoles,
  children,
  fallback = null,
}: {
  projectId: string
  requiredRoles: string[]
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const { user } = useAuth()
  const [userRole, setUserRole] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const response = await api.get(`/api/v1/roles/user-roles/${user.id}/project/${projectId}`)
        const roles = response.data.roles || []
        // Check if any of user's roles is in required roles
        const hasRequiredRole = roles.some((r: any) =>
          requiredRoles.includes(r.role_type)
        )
        setUserRole(hasRequiredRole ? roles[0]?.role_type : null)
      } catch (error) {
        console.error('Error checking user role:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserRole()
  }, [user, projectId])

  if (loading) return null

  if (!userRole) {
    return fallback ? <>{fallback}</> : null
  }

  return <>{children}</>
}

// Import useAuth if not already imported
import { useAuth } from '@/lib/auth-context'
import api from '@/lib/api'
