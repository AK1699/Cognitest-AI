'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Eye, DollarSign, Users, UserCheck, TrendingUp, Bell, Send } from 'lucide-react'
import Link from 'next/link'
import { UserNav } from '@/components/layout/user-nav'
import { Sidebar } from '@/components/layout/sidebar'
import { StatsCard } from '@/components/dashboard/stats-card'
import { OverviewChart } from '@/components/dashboard/overview-chart'

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
          {/* Welcome Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                Welcome {user.full_name || user.username}! 👋
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span>Home</span>
                <span>/</span>
                <span className="text-primary">Dashboard</span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Tests"
              value="3,456"
              change="↑ 0.43%"
              changeType="positive"
              icon={Eye}
              iconColor="text-green-600"
              iconBgColor="bg-green-100 dark:bg-green-900/20"
            />
            <StatsCard
              title="Success Rate"
              value="94.2%"
              change="↑ 4.35%"
              changeType="positive"
              icon={TrendingUp}
              iconColor="text-orange-600"
              iconBgColor="bg-orange-100 dark:bg-orange-900/20"
            />
            <StatsCard
              title="Active Users"
              value="435"
              change="↑ 2.59%"
              changeType="positive"
              icon={Users}
              iconColor="text-primary"
              iconBgColor="bg-brand-100 dark:bg-brand-900/20"
            />
            <StatsCard
              title="Projects"
              value="53"
              change="↓ 0.95%"
              changeType="negative"
              icon={UserCheck}
              iconColor="text-accent-600"
              iconBgColor="bg-accent-100 dark:bg-accent-900/20"
            />
          </div>

          {/* Overview Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Overview
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              An overview of your organization's activity and performance across all your projects.
            </p>
          </div>

          {/* Overview Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <OverviewChart
              title="Monthly Test Execution"
              value="2,845"
              change="(+4%)"
              changeType="positive"
            />
            <OverviewChart
              title="Test Coverage"
              value="87.5%"
              change="(+4%)"
              changeType="positive"
            />
            <OverviewChart
              title="Bug Detection"
              value="124"
              change="(+4%)"
              changeType="positive"
            />
          </div>

          {/* Recent Activity / Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/projects/new')}
                  className="w-full flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Create New Project
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Start testing with AI-powered tools
                    </p>
                  </div>
                </button>

                <Link
                  href="#"
                  className="w-full flex items-center gap-3 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-accent-600" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Notifications
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      View all notifications
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 text-xs font-medium bg-primary text-white rounded-full">
                    Soon
                  </span>
                </Link>

                <Link
                  href="#"
                  className="w-full flex items-center gap-3 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                    <Send className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Reports
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Generate and send reports
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 text-xs font-medium bg-primary text-white rounded-full">
                    Soon
                  </span>
                </Link>
              </div>
            </div>

            {/* What's Next Card */}
            <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-transparent dark:from-primary/20 rounded-xl p-6 border border-primary/20 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                What's Next?
              </h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      Create a Project
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Organize your testing workflow by creating projects
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      Generate Tests
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Use AI to automatically generate comprehensive test cases
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      Run Tests
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Execute your test suites and track results in real-time
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      Analyze Results
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Get insights and recommendations from AI analysis
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
