'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import api from '@/lib/api'
import { Loader } from 'lucide-react'

interface UserGroupInfo {
  group_id: string
  group_name: string
  group_type: string
  access_level: 'organization' | 'project'
  projects: Array<{
    id: string
    name: string
  }>
  can_manage_organization: boolean
}

/**
 * Smart Landing Redirect Component
 * Routes users based on their group type and access level:
 * - ADMIN/Organization-level → Organization dashboard
 * - QA/DEV/PRODUCT/Project-level → Project landing page (first project)
 * - Multi-group users → Show choice
 */
export function SmartLandingRedirect({ organisationId }: { organisationId: string }) {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState<UserGroupInfo[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const redirect = async () => {
      try {
        setLoading(true)

        // Get user's groups and their access levels
        const response = await api.get(`/api/v1/users/${user.id}/groups`, {
          params: { organisation_id: organisationId },
        })

        const userGroups: UserGroupInfo[] = response.data.groups || []
        setGroups(userGroups)

        if (!userGroups || userGroups.length === 0) {
          setError('No groups assigned. Contact admin.')
          setLoading(false)
          return
        }

        // Single group → redirect directly
        if (userGroups.length === 1) {
          const group = userGroups[0]
          handleRedirect(group)
          return
        }

        // Multiple groups → show selector (will be rendered below)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching user groups:', err)
        setError('Failed to load group information')
        setLoading(false)
      }
    }

    redirect()
  }, [user, organisationId])

  const handleRedirect = (group: UserGroupInfo) => {
    if (group.access_level === 'organization' && group.can_manage_organization) {
      // Admin → Organization dashboard
      router.push(`/organizations/${organisationId}`)
    } else if (group.access_level === 'project' && group.projects && group.projects.length > 0) {
      // Non-admin → First project
      const firstProject = group.projects[0]
      router.push(
        `/organizations/${organisationId}/projects/${firstProject.id}`
      )
    } else {
      setError('No accessible resources found')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  // Multiple groups → show selector
  if (groups.length > 1) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Select Your Workspace
          </h1>
          <p className="text-gray-600 mb-6">
            You have access to multiple teams. Choose one to get started.
          </p>

          <div className="space-y-3">
            {groups.map(group => (
              <button
                key={group.group_id}
                onClick={() => handleRedirect(group)}
                className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <div className="font-semibold text-gray-900">{group.group_name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {group.group_type} • {group.access_level === 'organization' ? 'Organization Access' : 'Project Access'}
                </div>
                {group.projects && group.projects.length > 0 && (
                  <div className="text-xs text-gray-500 mt-2">
                    {group.projects.length} project{group.projects.length !== 1 ? 's' : ''}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Access Issue</h1>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => router.push('/organizations')}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return null
}

/**
 * Hook to get user's group information
 */
export async function getUserGroupInfo(userId: string, organisationId: string) {
  try {
    const response = await api.get(`/api/v1/users/${userId}/groups`, {
      params: { organisation_id: organisationId },
    })
    return response.data.groups || []
  } catch (error) {
    console.error('Error fetching user groups:', error)
    return []
  }
}

/**
 * Determine if user should see organization dashboard or project landing
 */
export function getRedirectPath(groups: UserGroupInfo[], organisationId: string): string | null {
  if (!groups || groups.length === 0) {
    return null
  }

  // If user is in admin group with org access, go to org dashboard
  const adminGroup = groups.find(g => g.access_level === 'organization' && g.can_manage_organization)
  if (adminGroup) {
    return `/organizations/${organisationId}`
  }

  // Otherwise, go to first project
  const firstProjectGroup = groups.find(g => g.projects && g.projects.length > 0)
  if (firstProjectGroup && firstProjectGroup.projects) {
    return `/organizations/${organisationId}/projects/${firstProjectGroup.projects[0].id}`
  }

  return null
}
