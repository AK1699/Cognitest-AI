'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Building2, Plus, FolderKanban } from 'lucide-react'
import Link from 'next/link'
import { UserNav } from '@/components/layout/user-nav'

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
    const currentOrg = localStorage.getItem('current_organisation')
    if (!currentOrg) {
      router.push('/organisations/new')
      return
    }

    try {
      setOrganisation(JSON.parse(currentOrg))
    } catch (error) {
      router.push('/organisations/new')
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo & Organization */}
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-primary">Cognitest</h1>
            </div>

            {/* User Menu */}
            <UserNav />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to {organisation.name}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Get started by creating your first project
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Create Project Card */}
          <button
            onClick={() => {
              // For now, just show a message
              alert('Project creation coming soon! This will allow you to create test projects.')
            }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary transition-all hover:shadow-lg group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Create New Project
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Start testing with AI-powered tools
              </p>
            </div>
          </button>

          {/* Projects Placeholder */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FolderKanban className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Projects</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">0 active projects</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No projects yet. Create one to get started!
            </p>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-gradient-to-br from-primary/5 to-transparent dark:from-primary/10 rounded-xl p-8 border border-primary/20">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            What's Next?
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Create a Project</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Organize your testing workflow by creating projects
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Generate Tests</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Use AI to automatically generate comprehensive test cases
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Run Tests</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Execute your test suites and track results in real-time
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                4
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Analyze Results</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get insights and recommendations from AI analysis
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
