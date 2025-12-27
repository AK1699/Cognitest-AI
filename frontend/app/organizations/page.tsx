'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import api from '@/lib/api'
import { setCurrentOrganization } from '@/lib/api/session'
import { toast } from 'sonner'
import { Plus, Layout } from 'lucide-react'
import { OnboardingStepper } from '@/components/onboarding/OnboardingStepper'

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

    // Clean up legacy localStorage keys
    localStorage.removeItem('current_organization')
    localStorage.removeItem('current_organization_id')

    fetchOrganisations()
  }, [user, loading])

  const fetchOrganisations = async () => {
    try {
      const response = await api.get('/api/v1/organisations/')

      // If user has exactly one organization, redirect directly to it
      if (response.data.length === 1) {
        const org = response.data[0]
        await setCurrentOrganization(org.id)
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

  const handleSelectOrganisation = async (org: Organisation) => {
    await setCurrentOrganization(org.id)
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
          <div className="space-y-8">
            <OnboardingStepper currentStep={1} />

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center border border-teal-100 dark:border-gray-700">
              <div className="w-20 h-20 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center mx-auto mb-8">
                <Layout className="w-10 h-10 text-primary" />
              </div>

              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Welcome to Cognitest
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-md mx-auto">
                You're just a few steps away from automating your testing workflow. Let's start by creating your first organization.
              </p>

              <button
                onClick={() => router.push('/organizations/new')}
                className="inline-flex items-center px-8 py-4 rounded-xl bg-primary text-white font-bold text-lg hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="w-6 h-6 mr-3 stroke-[3px]" />
                Create Organization
              </button>
            </div>
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
              onClick={() => router.push('/organizations/new')}
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
