'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { UserNav } from '@/components/layout/user-nav'
import {
  Play,
  Edit,
  Search,
  ChevronRight,
  ChevronDown,
  Circle,
  CheckCircle2,
  XCircle,
  Clock,
  Code,
  Image,
  Video,
  Activity,
  Zap,
  FileText,
  Loader2,
  Settings,
  Eye,
  MonitorPlay,
  ChevronLeft,
} from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'

interface TestStep {
  id: string
  action: string
  description: string
  selector?: string
  value?: string
  status?: 'pending' | 'running' | 'passed' | 'failed'
  screenshot?: string
  duration?: number
}

interface TestGroup {
  id: string
  name: string
  count: number
  tests: TestItem[]
  expanded: boolean
}

interface TestItem {
  id: string
  name: string
  status: 'pending' | 'running' | 'passed' | 'failed'
  groupId: string
}

interface WebAutomationWorkspaceProps {
  projectId: string
  flowId?: string
}

export default function WebAutomationWorkspace({ projectId, flowId }: WebAutomationWorkspaceProps) {
  const router = useRouter()
  const params = useParams()
  const [selectedTest, setSelectedTest] = useState<TestItem | null>(null)
  const [testGroups, setTestGroups] = useState<TestGroup[]>([
    {
      id: 'sanity',
      name: 'sanity',
      count: 0,
      tests: [],
      expanded: true,
    },
    {
      id: 'interactions',
      name: 'Interactions',
      count: 4,
      tests: [
        { id: 'int-1', name: 'Login Flow', status: 'passed', groupId: 'interactions' },
        { id: 'int-2', name: 'Navigation Test', status: 'passed', groupId: 'interactions' },
        { id: 'int-3', name: 'Form Submit', status: 'failed', groupId: 'interactions' },
        { id: 'int-4', name: 'Button Click', status: 'pending', groupId: 'interactions' },
      ],
      expanded: true,
    },
    {
      id: 'onboarding',
      name: 'Onboarding',
      count: 1,
      tests: [
        { id: 'onb-1', name: 'funder', status: 'pending', groupId: 'onboarding' },
      ],
      expanded: true,
    },
    {
      id: 'utility',
      name: 'utility',
      count: 1,
      tests: [
        { id: 'util-1', name: 'Raise Login', status: 'pending', groupId: 'utility' },
      ],
      expanded: true,
    },
  ])
  const [searchQuery, setSearchQuery] = useState('')
  const [browser, setBrowser] = useState('Chrome')
  const [mode, setMode] = useState('Headed (Watch)')
  const [activeTab, setActiveTab] = useState('steps')
  const [testSteps, setTestSteps] = useState<TestStep[]>([
    {
      id: 'step-1',
      action: 'Navigate',
      description: 'Test step 1',
      status: 'pending',
    },
  ])

  useEffect(() => {
    // Select first test by default
    if (testGroups.length > 0) {
      const firstGroup = testGroups.find(g => g.tests.length > 0)
      if (firstGroup && firstGroup.tests.length > 0) {
        setSelectedTest(firstGroup.tests[0])
      }
    }
  }, [])

  const toggleGroup = (groupId: string) => {
    setTestGroups(groups =>
      groups.map(g =>
        g.id === groupId ? { ...g, expanded: !g.expanded } : g
      )
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      default:
        return <Circle className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-gray-100 text-gray-700',
      running: 'bg-blue-100 text-blue-700',
      passed: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
    }
    return styles[status as keyof typeof styles] || styles.pending
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Top Bar */}
      <div className="border-b border-gray-200 bg-white">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/organizations/${params.uuid}/projects/${projectId}/automation-hub`)}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Automation Hub
              </Button>
              <h1 className="text-xl font-bold text-gray-900">Web Automation</h1>
            </div>
            <UserNav />
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-4 border-b border-gray-200">
            <button className="px-4 py-2 text-sm font-medium text-primary border-b-2 border-primary">
              Test Explorer
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-900">
              Live Test Runner
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-900">
              Test Builder
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-900">
              Screenshot
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-900">
              Trace
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-900">
              Code
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-900">
              Logs
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-900">
              AI Self-Heal
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Test Explorer - Left Panel */}
        <div className="w-96 border-r border-gray-200 bg-gray-50 flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-white">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Test Explorer</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search tests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {testGroups.map((group) => (
                <div key={group.id}>
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    {group.expanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <span>{group.name}</span>
                    <span className="text-gray-500">({group.count})</span>
                  </button>

                  {group.expanded && (
                    <div className="ml-6 mt-1 space-y-1">
                      {group.tests.map((test) => (
                        <button
                          key={test.id}
                          onClick={() => setSelectedTest(test)}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${selectedTest?.id === test.id
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                          {getStatusIcon(test.status)}
                          <span className="flex-1 text-left">{test.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Test Details - Right Panel */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedTest ? (
            <>
              {/* Test Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Test Details: {selectedTest.name}
                    </h2>
                    <Badge className={getStatusBadge(selectedTest.status)}>
                      {selectedTest.status.charAt(0).toUpperCase() + selectedTest.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Browser:</span>
                      <select
                        value={browser}
                        onChange={(e) => setBrowser(e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option>Chrome</option>
                        <option>Firefox</option>
                        <option>Safari</option>
                        <option>Edge</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Mode:</span>
                      <select
                        value={mode}
                        onChange={(e) => setMode(e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option>Headed (Watch)</option>
                        <option>Headless</option>
                      </select>
                    </div>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      <Play className="w-4 h-4 mr-2" />
                      Run Test
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Steps
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <div className="border-b border-gray-200 bg-gray-50 px-6">
                  <TabsList className="bg-transparent h-auto p-0">
                    <TabsTrigger
                      value="steps"
                      className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2"
                    >
                      Steps
                    </TabsTrigger>
                    <TabsTrigger
                      value="code"
                      className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2"
                    >
                      Code
                    </TabsTrigger>
                    <TabsTrigger
                      value="activity"
                      className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2"
                    >
                      Activity
                    </TabsTrigger>
                    <TabsTrigger
                      value="video"
                      className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2"
                    >
                      Video
                    </TabsTrigger>
                    <TabsTrigger
                      value="screenshots"
                      className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2"
                    >
                      Screenshots
                    </TabsTrigger>
                    <TabsTrigger
                      value="trace"
                      className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2"
                    >
                      Trace
                    </TabsTrigger>
                    <TabsTrigger
                      value="runs"
                      className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2"
                    >
                      Runs
                    </TabsTrigger>
                    <TabsTrigger
                      value="ai-logs"
                      className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2"
                    >
                      AI Logs
                    </TabsTrigger>
                    <TabsTrigger
                      value="raw-logs"
                      className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2"
                    >
                      Raw Logs
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <TabsContent value="steps" className="p-6 m-0">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Steps</h3>
                      {testSteps.map((step, index) => (
                        <Card key={step.id} className="p-4 border border-gray-200">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium text-gray-900">{step.action}</span>
                                {step.status && (
                                  <Badge className={getStatusBadge(step.status)}>
                                    {step.status}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">- {step.description}</p>
                              {step.selector && (
                                <div className="text-xs text-gray-500">
                                  <span className="font-medium">Selector:</span> {step.selector}
                                </div>
                              )}
                              {step.value && (
                                <div className="text-xs text-gray-500">
                                  <span className="font-medium">Value:</span> {step.value}
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="code" className="p-6 m-0">
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
                      <div className="mb-2 text-gray-400">// Generated test code</div>
                      <div className="space-y-1">
                        <div><span className="text-purple-400">import</span> {`{ test, expect }`} <span className="text-purple-400">from</span> <span className="text-green-400">'@playwright/test'</span>;</div>
                        <div className="mt-4"><span className="text-purple-400">test</span>(<span className="text-green-400">'{selectedTest.name}'</span>, <span className="text-purple-400">async</span> ({`{ page }`}) {`=>`} {`{`}</div>
                        <div className="ml-4 text-gray-400">// Test steps will be generated here</div>
                        <div>{`});`}</div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="activity" className="p-6 m-0">
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Activity</h3>
                      <div className="text-sm text-gray-500">No activity recorded yet</div>
                    </div>
                  </TabsContent>

                  <TabsContent value="video" className="p-6 m-0">
                    <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                      <div className="text-center">
                        <Video className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No video recording available</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="screenshots" className="p-6 m-0">
                    <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                      <div className="text-center">
                        <Image className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No screenshots available</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="trace" className="p-6 m-0">
                    <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                      <div className="text-center">
                        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No trace data available</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="runs" className="p-6 m-0">
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Execution History</h3>
                      <div className="text-sm text-gray-500">No execution history available</div>
                    </div>
                  </TabsContent>

                  <TabsContent value="ai-logs" className="p-6 m-0">
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Self-Healing Logs</h3>
                      <div className="flex items-center justify-center h-64 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                        <div className="text-center">
                          <Zap className="w-12 h-12 text-purple-500 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 font-medium">AI Self-Healing Not Triggered</p>
                          <p className="text-xs text-gray-500 mt-1">Logs will appear when AI healing is activated</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="raw-logs" className="p-6 m-0">
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs">
                      <div className="space-y-1">
                        <div className="text-gray-400">[00:00:00] Test initialized</div>
                        <div className="text-gray-400">[00:00:01] Browser launched: {browser}</div>
                        <div className="text-gray-400">[00:00:02] Waiting for execution...</div>
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium">Select a test to view details</p>
                <p className="text-sm text-gray-400 mt-1">Choose a test from the explorer</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
