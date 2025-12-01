'use client'

import React, { useState, useEffect } from 'react'
import { UserNav } from '@/components/layout/user-nav'
import { Globe, Plus, Play, Edit, Trash2, FileCode, Clock, CheckCircle2, XCircle, Loader2, ChevronLeft, Search, Filter, BarChart3, Settings, Workflow, FolderOpen, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import CognitestBot3D from '@/components/ui/CognitestBot3D'

interface TestFlow {
  id: string
  name: string
  description: string
  status: 'draft' | 'active' | 'inactive' | 'archived'
  base_url: string
  default_browser: string
  default_mode: string
  total_executions: number
  successful_executions: number
  failed_executions: number
  healed_steps: number
  average_duration: number
  healing_success_rate: number
  created_at: string
  updated_at: string
  last_executed_at: string
}

interface WebAutomationPageProps {
  params: Promise<{
    uuid: string
    projectId: string
  }>
}

export default function WebAutomationPage({ params }: WebAutomationPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [orgId, setOrgId] = useState<string>('')
  const [projectId, setProjectId] = useState<string>('')
  const [testFlows, setTestFlows] = useState<TestFlow[]>([])
  const [filteredFlows, setFilteredFlows] = useState<TestFlow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'flows' | 'executions' | 'analytics'>('flows')

  // Get params
  useEffect(() => {
    params.then(({ uuid, projectId }) => {
      setOrgId(uuid)
      setProjectId(projectId)
    })
  }, [params])

  // Fetch test flows
  useEffect(() => {
    if (projectId) {
      fetchTestFlows()
    }
  }, [projectId])

  // Filter flows
  useEffect(() => {
    let filtered = testFlows

    if (searchQuery) {
      filtered = filtered.filter(flow =>
        flow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        flow.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(flow => flow.status === statusFilter)
    }

    setFilteredFlows(filtered)
  }, [testFlows, searchQuery, statusFilter])

  const fetchTestFlows = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(
        `http://localhost:8000/api/v1/web-automation/projects/${projectId}/test-flows`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        setTestFlows(data)
      } else {
        console.error('Failed to fetch test flows')
      }
    } catch (error) {
      console.error('Failed to fetch test flows:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      draft: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200', label: 'Draft' },
      active: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Active' },
      inactive: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'Inactive' },
      archived: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'Archived' }
    }
    const variant = variants[status] || variants.draft
    return (
      <Badge className={`${variant.color} border-0`}>
        {variant.label}
      </Badge>
    )
  }

  const calculateSuccessRate = (flow: TestFlow) => {
    if (flow.total_executions === 0) return 0
    return Math.round((flow.successful_executions / flow.total_executions) * 100)
  }

  const handleCreateNew = () => {
    if (orgId && projectId) {
      router.push(`/organizations/${orgId}/projects/${projectId}/automation-hub/web-automation/new`)
    }
  }

  const handleEditFlow = (flowId: string) => {
    if (orgId && projectId) {
      router.push(`/organizations/${orgId}/projects/${projectId}/automation-hub/web-automation/${flowId}`)
    }
  }

  const handleRunFlow = async (flowId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `http://localhost:8000/api/v1/web-automation/test-flows/${flowId}/execute`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      )
      
      if (response.ok) {
        toast.success('Test flow execution started!')
        fetchTestFlows()
      } else {
        toast.error('Failed to execute test flow')
      }
    } catch (error) {
      console.error('Failed to execute test flow:', error)
      toast.error('Failed to execute test flow')
    }
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Sidebar */}
      <aside className="w-64 flex flex-col" style={{ backgroundColor: '#f0fefa' }}>
        {/* Logo Section */}
        <div className="p-4 flex items-center gap-3 border-b border-gray-200">
          <CognitestBot3D size={48} className="flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-800 tracking-tight">
              Cogni<span className="text-primary">Test</span>
            </h1>
          </div>
        </div>

        {/* Project Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center flex-shrink-0">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold truncate text-gray-900">Web Automation</h3>
            </div>
          </div>
          <button
            onClick={() => orgId && projectId && router.push(`/organizations/${orgId}/projects/${projectId}/automation-hub`)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors"
            disabled={!orgId || !projectId}
          >
            <ChevronLeft className="w-3 h-3" />
            Back to Automation Hub
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-6">
            {/* Web Automation Section */}
            <div className="space-y-1">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2 px-3">Web Automation</div>
              <button
                onClick={() => setActiveTab('flows')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeTab === 'flows'
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Workflow className="w-4 h-4" />
                Test Flows
              </button>
              <button
                onClick={() => setActiveTab('executions')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeTab === 'executions'
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Executions
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeTab === 'analytics'
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Zap className="w-4 h-4" />
                Self-Healing Analytics
              </button>
            </div>

            {/* Other Automation Types Section */}
            <div className="space-y-1">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2 px-3">Other Automation</div>
              <button
                disabled
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 cursor-not-allowed"
              >
                <Workflow className="w-4 h-4" />
                Workflow Automation
                <span className="ml-auto text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Soon</span>
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
              <h1 className="text-xl font-bold text-gray-900">
                {activeTab === 'flows' && 'Web Automation Test Flows'}
                {activeTab === 'executions' && 'Execution History'}
                {activeTab === 'analytics' && 'Self-Healing Analytics'}
              </h1>
              <p className="text-xs text-gray-500">
                {activeTab === 'flows' && 'Create and manage visual test flows with AI-powered self-healing'}
                {activeTab === 'executions' && 'View test execution history and detailed results'}
                {activeTab === 'analytics' && 'Monitor healing events and test reliability'}
              </p>
            </div>
            <UserNav />
          </div>
        </div>

        {/* Action Buttons - Only for flows tab */}
        {activeTab === 'flows' && (
          <div className="px-8 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search test flows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 w-full max-w-md"
                />
              </div>
              <Button
                onClick={handleCreateNew}
                className="bg-primary hover:bg-primary/90"
                disabled={!orgId || !projectId}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Test Flow
              </Button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="p-8">
          {activeTab === 'scripts' && (
            <div className="space-y-6">{/* Filters */}

              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search scripts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Test Flows List */}
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredFlows.length === 0 ? (
                <Card className="p-12 text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center mx-auto mb-6">
                    <Workflow className="w-10 h-10 text-blue-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {testFlows.length === 0 ? 'Welcome to Web Automation! 🚀' : 'No test flows found'}
                  </h3>
                  <p className="text-gray-600 mb-2 max-w-md mx-auto">
                    {testFlows.length === 0
                      ? 'Create visual test flows with drag-and-drop actions'
                      : 'Try adjusting your search or filters'}
                  </p>
                  <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
                    ✨ AI-powered self-healing • 🌐 Multi-browser testing • 📊 Real-time analytics
                  </p>
                  {testFlows.length === 0 && (
                    <Button
                      onClick={handleCreateNew}
                      size="lg"
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg"
                      disabled={!orgId || !projectId}
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Create Your First Test Flow
                    </Button>
                  )}
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredFlows.map((flow) => {
                    const successRate = calculateSuccessRate(flow)

                    return (
                      <Card key={flow.id} className="p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {flow.name}
                              </h3>
                              {getStatusBadge(flow.status)}
                              {flow.healed_steps > 0 && (
                                <Badge className="bg-yellow-100 text-yellow-800 border-0">
                                  <Zap className="w-3 h-3 mr-1" />
                                  {flow.healed_steps} healed
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mb-2">
                              {flow.description || 'No description provided'}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                              <span>🌐 {flow.default_browser}</span>
                              <span>Base URL: {flow.base_url}</span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleRunFlow(flow.id)}
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Run
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditFlow(flow.id)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-5 gap-4 pt-4 border-t border-gray-100">
                          <div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                              <Clock className="w-4 h-4" />
                              Runs
                            </div>
                            <div className="text-lg font-semibold text-gray-900">
                              {flow.total_executions}
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                              <CheckCircle2 className="w-4 h-4" />
                              Success
                            </div>
                            <div className="text-lg font-semibold text-green-600">
                              {successRate}%
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                              <XCircle className="w-4 h-4" />
                              Failed
                            </div>
                            <div className="text-lg font-semibold text-red-600">
                              {flow.failed_executions}
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                              <Zap className="w-4 h-4" />
                              Healed
                            </div>
                            <div className="text-lg font-semibold text-yellow-600">
                              {flow.healed_steps}
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                              <Clock className="w-4 h-4" />
                              Duration
                            </div>
                            <div className="text-lg font-semibold text-gray-900">
                              {(flow.average_duration / 1000).toFixed(1)}s
                            </div>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Executions Tab Content */}
          {activeTab === 'executions' && (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Execution History
              </h3>
              <p className="text-gray-500">
                View and analyze automation execution results and history
              </p>
            </Card>
          )}

          {/* Analytics Tab Content */}
          {activeTab === 'analytics' && (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-yellow-50 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-yellow-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Self-Healing Analytics
              </h3>
              <p className="text-gray-500 mb-4">
                Monitor AI-powered self-healing events and test reliability metrics
              </p>
              <p className="text-sm text-gray-400">
                Coming soon: Healing success rates, confidence scores, and optimization insights
              </p>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
