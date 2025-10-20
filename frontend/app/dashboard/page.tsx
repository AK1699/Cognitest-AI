'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Building2, Plus, FolderKanban } from 'lucide-react'
import Link from 'next/link'
import { UserNav } from '@/components/layout/user-nav'
import { Sidebar } from '@/components/layout/sidebar'

interface Organisation {
  id: string
  name: string
  description?: string
  created_by: string
  created_at: string
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [organisation, setOrganisation] = useState<Organisation | null>(null)

  const loadOrganisation = () => {
    const currentOrg = localStorage.getItem('current_organisation')
    if (currentOrg) {
      try {
        setOrganisation(JSON.parse(currentOrg))
      } catch (error) {
        console.error('Failed to parse organisation:', error)
      }
    }
  }

  useEffect(() => {
    if (loading) {
      return // Wait for the auth state to be determined
    }

    // Check if user is authenticated
    if (!user) {
      router.push('/auth/signin')
      return
    }

    // Load current organization
    loadOrganisation()

    const currentOrg = localStorage.getItem('current_organisation')
    if (!currentOrg) {
      router.push('/organisations/new')
      return
    }

    // Listen for organisation changes
    const handleOrganisationChange = () => {
      loadOrganisation()
    }

    window.addEventListener('organisationChanged', handleOrganisationChange)

    return () => {
      window.removeEventListener('organisationChanged', handleOrganisationChange)
    }
  }, [user, router, loading])

  if (loading || !user || !organisation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <div className="w-full px-6 sm:px-8 lg:px-12">
            <div className="flex justify-between items-center h-16">
              {/* Logo & Organization */}
              <div className="flex items-center gap-4 lg:ml-0 ml-12">
                <h1 className="text-2xl font-semibold text-primary">CogniTest</h1>
              </div>

              {/* User Menu */}
              <UserNav />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full px-6 sm:px-8 lg:px-12 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-4xl font-semibold text-gray-900 dark:text-white mb-2">
            Welcome to {organisation.name}
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 font-normal">
            Get started by creating your first project
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Create Project Card */}
          <button
            onClick={() => router.push('/projects/new')}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary transition-all shadow-md hover:shadow-lg group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Create New Project
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                Start testing with AI-powered tools
              </p>
            </div>
          </button>

          {/* Projects Placeholder */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <FolderKanban className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Projects</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-normal">0 active projects</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
              No projects yet. Create one to get started!
            </p>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-gradient-to-br from-accent/10 to-transparent dark:from-primary/10 rounded-xl p-8 border border-primary/20 shadow-md">
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            What's Next?
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Create a Project</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                  Organize your testing workflow by creating projects
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Generate Tests</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                  Use AI to automatically generate comprehensive test cases
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Run Tests</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                  Execute your test suites and track results in real-time
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                4
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Analyze Results</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                  Get insights and recommendations from AI analysis
                </p>
              </div>
            </div>
          </div>
        </div>
        </main>
      </div>
    </div>
  )
}
