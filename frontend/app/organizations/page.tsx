'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import api from '@/lib/api'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

interface Organisation {
  id: string
  name: string
  website?: string
  description?: string
  owner_id: string
  created_at: string
  updated_at?: string
}

interface OrganisationStats {
  org: Organisation
  projectCount: number
  userCount: number
}

export default function OrganizationsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [organisations, setOrganisations] = useState<OrganisationStats[]>([])
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.push('/auth/signin')
      return
    }

    fetchOrganisations()
  }, [user, loading, router])

  const fetchOrganisations = async () => {
    try {
      const response = await api.get('/api/v1/organisations/')

      // If user has exactly one organization, redirect directly to it
      if (response.data.length === 1) {
        const org = response.data[0]
        localStorage.setItem('current_organisation', JSON.stringify(org))
        window.dispatchEvent(new CustomEvent('organisationChanged', { detail: org }))
        router.push(`/organizations/${org.id}/projects`)
        return
      }

      // Fetch stats for each organization
      const orgsWithStats = await Promise.all(
        response.data.map(async (org: Organisation) => {
          try {
            const [projectsRes, membersRes] = await Promise.all([
              api.get(`/api/v1/projects/?organisation_id=${org.id}`),
              api.get(`/api/v1/organisations/${org.id}/members/`).catch(() => ({ data: [] }))
            ])

            return {
              org,
              projectCount: projectsRes.data.length || 0,
              userCount: membersRes.data.length || 1
            }
          } catch (error) {
            return {
              org,
              projectCount: 0,
              userCount: 1
            }
          }
        })
      )

      setOrganisations(orgsWithStats)
    } catch (error: any) {
      console.error('Failed to fetch organisations:', error)
      toast.error('Failed to load organisations')
    } finally {
      setPageLoading(false)
    }
  }

  const handleSelectOrganisation = (org: Organisation) => {
    localStorage.setItem('current_organisation', JSON.stringify(org))
    window.dispatchEvent(new CustomEvent('organisationChanged', { detail: org }))
    router.push(`/organizations/${org.id}/projects`)
  }

  if (loading || pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading organisations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Your Organizations
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Select an organization to get started
          </p>
        </div>

        {organisations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You don't have any organisations yet
            </p>
            <button
              onClick={() => router.push('/organisations/new')}
              className="inline-flex items-center px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Organisation
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {organisations.map(({ org, projectCount, userCount }) => (
              <div
                key={org.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4 flex-1">
                  {/* Organization Avatar */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {org.name.substring(0, 2).toUpperCase()}
                    </span>
                  </div>

                  {/* Organization Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {org.name}
                    </h3>
                    <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>{projectCount} project{projectCount !== 1 ? 's' : ''}</span>
                      <span>{userCount} user{userCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>

                {/* Open Button */}
                <button
                  onClick={() => handleSelectOrganisation(org)}
                  className="ml-4 flex-shrink-0 px-6 py-2 rounded-lg border-2 border-primary text-primary font-medium hover:bg-primary hover:text-white transition-colors"
                >
                  Open
                </button>
              </div>
            ))}

            {/* Create New Organization Button */}
            <button
              onClick={() => router.push('/organisations/new')}
              className="w-full py-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 font-medium hover:border-primary hover:text-primary dark:hover:text-primary transition-colors"
            >
              <Plus className="w-5 h-5 mx-auto mb-2" />
              Create new organization
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
