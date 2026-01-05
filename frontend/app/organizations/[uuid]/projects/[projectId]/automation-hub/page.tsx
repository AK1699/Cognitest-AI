'use client'

import React from 'react'
import { UserNav } from '@/components/layout/user-nav'
import { Globe, Workflow, Code, Smartphone, ArrowRight, Zap, CheckCircle2, ChevronLeft, ChevronRight, FolderOpen, BarChart3, BrainCircuit } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'

const automationTypes = [
  {
    id: 'web-automation',
    title: 'Web Automation',
    description: 'Automate web application testing with Playwright, Selenium, and more',
    icon: Globe,
    gradient: 'from-blue-500 to-cyan-500',
    bgGradient: 'from-blue-50 to-cyan-50',
    path: '/automation-hub/web-automation',
    features: [
      'Record & playback test scripts',
      'Cross-browser testing',
      'Visual regression testing',
      'Element inspection & XPath'
    ],
    status: 'available'
  },
  {
    id: 'workflow-automation',
    title: 'Workflow Automation',
    description: 'Build n8n-style visual workflows connecting tests, notifications, and integrations',
    icon: Workflow,
    gradient: 'from-purple-500 to-pink-500',
    bgGradient: 'from-purple-50 to-pink-50',
    path: '/automation-hub/workflow-automation',
    features: [
      'Visual workflow builder',
      'Connect multiple tools',
      'Conditional logic & branching',
      'Scheduled executions'
    ],
    status: 'available'
  },
  {
    id: 'api-automation',
    title: 'API Automation',
    description: 'Automated API testing with request building, validation, and monitoring',
    icon: Code,
    gradient: 'from-emerald-500 to-teal-500',
    bgGradient: 'from-emerald-50 to-teal-50',
    path: '/automation-hub/api-automation',
    features: [
      'REST & GraphQL testing',
      'Request/response validation',
      'Authentication handling',
      'Performance monitoring'
    ],
    status: 'coming-soon'
  },
  {
    id: 'mobile-automation',
    title: 'Mobile Automation',
    description: 'Automate mobile app testing for iOS and Android platforms',
    icon: Smartphone,
    gradient: 'from-orange-500 to-red-500',
    bgGradient: 'from-orange-50 to-red-50',
    path: '/automation-hub/mobile-automation',
    features: [
      'iOS & Android support',
      'Appium integration',
      'Device cloud testing',
      'Gesture automation'
    ],
    status: 'coming-soon'
  }
]

interface AutomationHubPageProps {
  params: Promise<{
    uuid: string
    projectId: string
  }>
}

export default function AutomationHubPage({ params }: AutomationHubPageProps) {
  const router = useRouter()
  const [orgId, setOrgId] = React.useState<string>('')
  const [projectId, setProjectId] = React.useState<string>('')
  const [isCollapsed, setIsCollapsed] = React.useState(false)

  React.useEffect(() => {
    params.then(({ uuid, projectId }) => {
      setOrgId(uuid)
      setProjectId(projectId)
    })
  }, [params])

  const handleCardClick = (type: typeof automationTypes[0]) => {
    if (type.status === 'available' && orgId && projectId) {
      const path = `/organizations/${orgId}/projects/${projectId}${type.path}`
      router.push(path)
    }
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Sidebar */}
      <aside
        className={`flex flex-col transition-all duration-300 relative border-r border-gray-200 ${isCollapsed ? 'w-20' : 'w-60'}`}
        style={{ backgroundColor: '#f0fefa' }}
      >
        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 bg-white border border-gray-200 rounded-full p-1 shadow-md hover:bg-gray-50 z-50 transition-transform"
        >
          {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        {/* Logo Section */}
        <div className="p-4 flex items-center gap-3 border-b border-gray-200 overflow-hidden">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
            <BrainCircuit className="w-6 h-6 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-800 tracking-tight whitespace-nowrap">
                Cogni<span className="text-primary">Test</span>
              </h1>
            </div>
          )}
        </div>

        {/* Project Header */}
        <div className="p-4 border-b border-gray-200 overflow-hidden">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded bg-purple-500 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold truncate text-gray-900">Automation Hub</h3>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={() => orgId && projectId && router.push(`/organizations/${orgId}/projects/${projectId}`)}
              className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-gray-500 hover:text-gray-900 transition-colors"
              disabled={!orgId || !projectId}
            >
              <ChevronLeft className="w-3 h-3" />
              Back to project
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto overflow-x-hidden">
          <div className="space-y-6">
            {/* Automation Types Section */}
            <div className="space-y-1">
              {!isCollapsed && <div className="text-[10px] font-bold text-gray-500 uppercase mb-2 px-3 tracking-widest">Automation Types</div>}
              <button
                onClick={() => handleCardClick(automationTypes[0])}
                title={isCollapsed ? 'Web Automation' : ''}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all border-2 border-transparent text-gray-700 hover:bg-white/50 hover:border-gray-200 ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Globe className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="truncate">Web Automation</span>}
              </button>
              <button
                onClick={() => handleCardClick(automationTypes[1])}
                title={isCollapsed ? 'Workflow Automation' : ''}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all border-2 border-transparent text-gray-700 hover:bg-white/50 hover:border-gray-200 ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Workflow className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="truncate">Workflow Automation</span>}
              </button>
              <button
                disabled
                title={isCollapsed ? 'API Automation (Soon)' : ''}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 cursor-not-allowed ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Code className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="truncate">API Automation</span>}
              </button>
              <button
                disabled
                title={isCollapsed ? 'Mobile Automation (Soon)' : ''}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 cursor-not-allowed ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Smartphone className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="truncate">Mobile Automation</span>}
              </button>
            </div>

            {/* Analytics Section */}
            <div className="space-y-1">
              {!isCollapsed && <div className="text-[10px] font-bold text-gray-500 uppercase mb-2 px-3 tracking-widest">Analytics</div>}
              <button
                disabled
                title={isCollapsed ? 'Overall Statistics' : ''}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 cursor-not-allowed ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <BarChart3 className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="truncate">Overall Statistics</span>}
              </button>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="h-[80px] px-8 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Automation Hub</h1>
              <p className="text-xs text-gray-500">Select an automation type to get started</p>
            </div>
            <UserNav />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-8">
          <div className="max-w-7xl mx-auto">

            {/* Automation Type Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {automationTypes.map((type) => {
                const Icon = type.icon
                const isAvailable = type.status === 'available'

                return (
                  <Card
                    key={type.id}
                    className={`
                      relative overflow-hidden border-2 transition-all duration-300
                      ${isAvailable
                        ? 'hover:shadow-2xl hover:scale-[1.02] cursor-pointer border-gray-200 dark:border-gray-700 hover:border-primary'
                        : 'opacity-60 cursor-not-allowed border-gray-100 dark:border-gray-800'
                      }
                    `}
                    onClick={() => handleCardClick(type)}
                  >
                    {/* Status Badge */}
                    {type.status === 'coming-soon' && (
                      <div className="absolute top-4 right-4 px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs font-medium rounded-full">
                        Coming Soon
                      </div>
                    )}

                    <div className="p-6">
                      {/* Icon & Title */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${type.gradient} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            {type.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                            {type.description}
                          </p>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="space-y-2 mb-4">
                        {type.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>

                      {/* Action Button */}
                      {isAvailable && (
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                          <span className="text-sm font-medium text-primary">Get Started</span>
                          <ArrowRight className="w-5 h-5 text-primary transition-transform group-hover:translate-x-1" />
                        </div>
                      )}
                    </div>

                    {/* Gradient Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${type.bgGradient} opacity-0 ${isAvailable ? 'group-hover:opacity-5' : ''} transition-opacity -z-10`} />
                  </Card>
                )
              })}
            </div>

            {/* Info Section */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Link Automation to Test Cases
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Create automation scripts here and link them to your test cases in Test Management.
                    Execute automated tests directly from test case views and track execution results in one unified dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
