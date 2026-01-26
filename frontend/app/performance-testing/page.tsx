'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { UserNav } from '@/components/layout/user-nav'
import {
  Zap,
  Gauge,
  TrendingUp,
  Activity,
  Timer,
  ArrowLeft,
  Play,
  BarChart3,
  LineChart,
  AlertTriangle,
  CheckCircle,
  Clock,
  Globe,
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { PerformanceTestWizard } from '@/components/performance'

export default function PerformanceTestingPage() {
  const [activeModule, setActiveModule] = useState<'overview' | 'lighthouse' | 'load' | 'stress' | 'results'>('overview')
  const [targetUrl, setTargetUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showWizard, setShowWizard] = useState(false)

  // Demo stats
  const stats = {
    total_tests: 0,
    avg_performance_score: null,
    pass_rate: 0,
    active_alerts: 0
  }

  const handleLighthouseScan = async () => {
    if (!targetUrl) return
    setIsLoading(true)
    // TODO: Connect to API
    setTimeout(() => setIsLoading(false), 2000)
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
              <div className="flex items-center gap-4 lg:ml-0 ml-12">
                <Zap className="w-6 h-6 text-teal-600" />
                <h1 className="text-2xl font-semibold text-gray-900">Performance Testing</h1>
              </div>
              <div className="flex items-center gap-4">
                <Button onClick={() => setShowWizard(true)} className="bg-teal-600 hover:bg-teal-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Test
                </Button>
                <UserNav />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full px-6 sm:px-8 lg:px-12 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Module Tabs */}
            <Tabs value={activeModule} onValueChange={(v) => setActiveModule(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-6">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <Gauge className="w-4 h-4" />
                  <span className="hidden sm:inline">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="lighthouse" className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span className="hidden sm:inline">Lighthouse</span>
                </TabsTrigger>
                <TabsTrigger value="load" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="hidden sm:inline">Load Test</span>
                </TabsTrigger>
                <TabsTrigger value="stress" className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  <span className="hidden sm:inline">Stress Test</span>
                </TabsTrigger>
                <TabsTrigger value="results" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Results</span>
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview">
                <div className="space-y-6">
                  {/* Stats Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-teal-50 to-white rounded-xl p-6 border border-teal-100 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Performance Score</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-4xl font-bold text-green-600 bg-green-100 px-3 py-1 rounded-lg">
                              {stats.avg_performance_score ?? '—'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">Average score</p>
                        </div>
                        <Gauge className="w-12 h-12 text-teal-600 opacity-50" />
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 border shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Tests</p>
                          <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total_tests}</p>
                          <p className="text-xs text-gray-500 mt-2">Run your first test</p>
                        </div>
                        <BarChart3 className="w-10 h-10 text-teal-500 opacity-70" />
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 border shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Pass Rate</p>
                          <p className="text-3xl font-bold text-green-600 mt-1">{stats.pass_rate}%</p>
                          <p className="text-xs text-gray-500 mt-2">Thresholds met</p>
                        </div>
                        <CheckCircle className="w-10 h-10 text-green-500 opacity-70" />
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 border shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                          <p className="text-3xl font-bold text-gray-900 mt-1">{stats.active_alerts}</p>
                          <p className="text-xs text-gray-500 mt-2">No alerts</p>
                        </div>
                        <AlertTriangle className="w-10 h-10 text-orange-500 opacity-70" />
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div
                      className="bg-white rounded-xl p-6 border shadow-sm cursor-pointer hover:border-teal-300 transition-colors"
                      onClick={() => setActiveModule('lighthouse')}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center">
                          <Zap className="w-6 h-6 text-teal-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Lighthouse Audit</h3>
                          <p className="text-sm text-gray-500">Core Web Vitals</p>
                        </div>
                      </div>
                    </div>

                    <div
                      className="bg-white rounded-xl p-6 border shadow-sm cursor-pointer hover:border-purple-300 transition-colors"
                      onClick={() => setActiveModule('load')}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Load Test</h3>
                          <p className="text-sm text-gray-500">Concurrent users</p>
                        </div>
                      </div>
                    </div>

                    <div
                      className="bg-white rounded-xl p-6 border shadow-sm cursor-pointer hover:border-orange-300 transition-colors"
                      onClick={() => setActiveModule('stress')}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                          <Activity className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Stress Test</h3>
                          <p className="text-sm text-gray-500">Find breaking point</p>
                        </div>
                      </div>
                    </div>

                    <div
                      className="bg-white rounded-xl p-6 border shadow-sm cursor-pointer hover:border-blue-300 transition-colors"
                      onClick={() => setActiveModule('results')}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                          <LineChart className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">View Results</h3>
                          <p className="text-sm text-gray-500">Historical data</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Getting Started */}
                  <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl p-8 text-white">
                    <h2 className="text-2xl font-semibold mb-2">Enterprise Performance Testing</h2>
                    <p className="text-teal-100 mb-6">
                      Outperform JMeter, k6, and BlazeMeter with AI-powered performance testing, beautiful dashboards, and zero configuration.
                    </p>
                    <div className="flex gap-4">
                      <Button
                        className="bg-white text-teal-600 hover:bg-teal-50"
                        onClick={() => setActiveModule('lighthouse')}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Run Lighthouse Audit
                      </Button>
                      <Button
                        variant="outline"
                        className="border-white text-white hover:bg-teal-600"
                        onClick={() => setActiveModule('load')}
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Start Load Test
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Lighthouse Tab */}
              <TabsContent value="lighthouse">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" onClick={() => setActiveModule('overview')}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Lighthouse Performance Audit</h2>
                      <p className="text-sm text-gray-500">Analyze Core Web Vitals, SEO, Accessibility, and Best Practices</p>
                    </div>
                  </div>

                  {/* Quick Scan Form */}
                  <div className="bg-white rounded-xl p-6 border shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Performance Scan</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="url">Target URL</Label>
                        <Input
                          id="url"
                          placeholder="https://example.com"
                          value={targetUrl}
                          onChange={(e) => setTargetUrl(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Device Type</Label>
                        <Select defaultValue="mobile">
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mobile">Mobile</SelectItem>
                            <SelectItem value="desktop">Desktop</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <Button
                          className="w-full bg-teal-600 hover:bg-teal-700"
                          onClick={handleLighthouseScan}
                          disabled={isLoading || !targetUrl}
                        >
                          {isLoading ? (
                            <>
                              <Clock className="w-4 h-4 mr-2 animate-spin" />
                              Running...
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Run Audit
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Core Web Vitals Explainer */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl p-6 border shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                          <span className="text-lg font-bold text-green-600">LCP</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Largest Contentful Paint</h4>
                          <p className="text-xs text-gray-500">Loading performance</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        Good: ≤ 2.5s • Needs Improvement: ≤ 4s • Poor: &gt; 4s
                      </p>
                    </div>

                    <div className="bg-white rounded-xl p-6 border shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                          <span className="text-lg font-bold text-orange-600">FID</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">First Input Delay</h4>
                          <p className="text-xs text-gray-500">Interactivity</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        Good: ≤ 100ms • Needs Improvement: ≤ 300ms • Poor: &gt; 300ms
                      </p>
                    </div>

                    <div className="bg-white rounded-xl p-6 border shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <span className="text-lg font-bold text-blue-600">CLS</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Cumulative Layout Shift</h4>
                          <p className="text-xs text-gray-500">Visual stability</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        Good: ≤ 0.1 • Needs Improvement: ≤ 0.25 • Poor: &gt; 0.25
                      </p>
                    </div>
                  </div>

                  {/* Results placeholder */}
                  <div className="bg-white rounded-xl p-8 border shadow-sm text-center">
                    <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Results Yet</h3>
                    <p className="text-gray-500">Enter a URL above and run an audit to see performance metrics.</p>
                  </div>
                </div>
              </TabsContent>

              {/* Load Test Tab */}
              <TabsContent value="load">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" onClick={() => setActiveModule('overview')}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Load Testing</h2>
                      <p className="text-sm text-gray-500">Simulate concurrent users and measure response times</p>
                    </div>
                  </div>

                  {/* Load Test Configuration */}
                  <div className="bg-white rounded-xl p-6 border shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Configure Load Test</h3>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="load-url">Target URL</Label>
                        <Input
                          id="load-url"
                          placeholder="https://api.example.com/endpoint"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Method</Label>
                        <Select defaultValue="GET">
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GET">GET</SelectItem>
                            <SelectItem value="POST">POST</SelectItem>
                            <SelectItem value="PUT">PUT</SelectItem>
                            <SelectItem value="DELETE">DELETE</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Virtual Users</Label>
                        <Input
                          type="number"
                          defaultValue="100"
                          min="1"
                          max="1000"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Duration (sec)</Label>
                        <Input
                          type="number"
                          defaultValue="60"
                          min="10"
                          max="600"
                          className="mt-1"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button className="w-full bg-purple-600 hover:bg-purple-700">
                          <Play className="w-4 h-4 mr-2" />
                          Start Test
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Metrics explanation */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-4 border shadow-sm">
                      <h4 className="font-semibold text-gray-900 text-sm">Requests/sec</h4>
                      <p className="text-2xl font-bold text-purple-600 mt-1">—</p>
                      <p className="text-xs text-gray-500">Throughput</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border shadow-sm">
                      <h4 className="font-semibold text-gray-900 text-sm">P95 Latency</h4>
                      <p className="text-2xl font-bold text-purple-600 mt-1">—</p>
                      <p className="text-xs text-gray-500">95th percentile</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border shadow-sm">
                      <h4 className="font-semibold text-gray-900 text-sm">Error Rate</h4>
                      <p className="text-2xl font-bold text-green-600 mt-1">—</p>
                      <p className="text-xs text-gray-500">Failures</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border shadow-sm">
                      <h4 className="font-semibold text-gray-900 text-sm">Active VUs</h4>
                      <p className="text-2xl font-bold text-gray-600 mt-1">—</p>
                      <p className="text-xs text-gray-500">Virtual users</p>
                    </div>
                  </div>

                  {/* Chart placeholder */}
                  <div className="bg-white rounded-xl p-8 border shadow-sm text-center">
                    <LineChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Real-time Metrics</h3>
                    <p className="text-gray-500">Start a load test to see live performance charts.</p>
                  </div>
                </div>
              </TabsContent>

              {/* Stress Test Tab */}
              <TabsContent value="stress">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" onClick={() => setActiveModule('overview')}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Stress Testing</h2>
                      <p className="text-sm text-gray-500">Tests how much load the system can handle before it starts to fail.</p>
                    </div>
                  </div>

                  {/* Stress Test Configuration */}
                  <div className="bg-white rounded-xl p-6 border shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Configure Stress Test</h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="stress-url">Target URL</Label>
                        <Input
                          id="stress-url"
                          placeholder="https://api.example.com/stress-endpoint"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Start VUs</Label>
                        <Input
                          type="number"
                          defaultValue="10"
                          min="1"
                          max="100"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Max VUs</Label>
                        <Input
                          type="number"
                          defaultValue="500"
                          min="10"
                          max="1000"
                          className="mt-1"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button className="w-full bg-orange-600 hover:bg-orange-700">
                          <Activity className="w-4 h-4 mr-2" />
                          Start Stress Test
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">
                      The test will gradually increase virtual users from the start value to max, recording the breaking point.
                    </p>
                  </div>

                  {/* Chart placeholder */}
                  <div className="bg-white rounded-xl p-8 border shadow-sm text-center">
                    <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Breaking Point Analysis</h3>
                    <p className="text-gray-500">Start a stress test to identify system limits.</p>
                  </div>
                </div>
              </TabsContent>

              {/* Results Tab */}
              <TabsContent value="results">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" onClick={() => setActiveModule('overview')}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Test Results & History</h2>
                      <p className="text-sm text-gray-500">View past test runs, trends, and comparisons</p>
                    </div>
                  </div>

                  {/* Empty state */}
                  <div className="bg-white rounded-xl p-12 border shadow-sm text-center">
                    <BarChart3 className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-3">No Test Results Yet</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      Run a Lighthouse audit, load test, or stress test to see results and historical trends here.
                    </p>
                    <div className="flex gap-4 justify-center">
                      <Button onClick={() => setActiveModule('lighthouse')}>
                        <Zap className="w-4 h-4 mr-2" />
                        Run Lighthouse Audit
                      </Button>
                      <Button variant="outline" onClick={() => setActiveModule('load')}>
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Start Load Test
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Create Test Wizard Dialog */}
      <Dialog open={showWizard} onOpenChange={setShowWizard}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">Create Performance Test</DialogTitle>
          <PerformanceTestWizard
            projectId="demo-project"
            onComplete={(test) => {
              console.log('Created test:', test)
              setShowWizard(false)
              // TODO: Call API to create test
            }}
            onCancel={() => setShowWizard(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
