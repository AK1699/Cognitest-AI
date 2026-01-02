'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
    Plus,
    ChevronRight,
    Home,
    Settings,
    RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { PerformanceTestWizard } from '@/components/performance'

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

export default function PerformanceTestingPage() {
    const params = useParams()
    const router = useRouter()
    const projectId = params.projectId as string
    const uuid = params.uuid as string

    const [activeModule, setActiveModule] = useState<'overview' | 'lighthouse' | 'load' | 'stress' | 'results'>('overview')
    const [targetUrl, setTargetUrl] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [showWizard, setShowWizard] = useState(false)
    const [loading, setLoading] = useState(true)

    // Stats from API
    const [stats, setStats] = useState({
        total_tests: 0,
        avg_performance_score: null as number | null,
        pass_rate: 0,
        active_alerts: 0
    })

    useEffect(() => {
        fetchDashboardData()
    }, [projectId])

    const fetchDashboardData = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('access_token')
            const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {}

            const statsResponse = await fetch(`${API_URL}/api/v1/performance/dashboard/${projectId}/stats`, {
                credentials: 'include',
                headers
            })
            if (statsResponse.ok) {
                const data = await statsResponse.json()
                setStats({
                    total_tests: data.total_tests || 0,
                    avg_performance_score: data.avg_performance_score,
                    pass_rate: data.pass_rate || 0,
                    active_alerts: data.active_alerts || 0
                })
            }
        } catch (error) {
            console.error('Failed to fetch performance data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleLighthouseScan = async () => {
        if (!targetUrl) return
        setIsLoading(true)
        try {
            const token = localStorage.getItem('access_token')
            const response = await fetch(`${API_URL}/api/v1/performance/lighthouse?project_id=${projectId}`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({
                    target_url: targetUrl,
                    device_type: 'mobile'
                })
            })
            if (response.ok) {
                fetchDashboardData()
            }
        } catch (error) {
            console.error('Lighthouse scan failed:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleTestCreated = async (testConfig: any) => {
        try {
            const token = localStorage.getItem('access_token')
            const response = await fetch(`${API_URL}/api/v1/performance/tests?project_id=${projectId}`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify(testConfig)
            })
            if (response.ok) {
                setShowWizard(false)
                fetchDashboardData()
            }
        } catch (error) {
            console.error('Failed to create test:', error)
        }
    }

    return (
        <div className="flex flex-col h-screen bg-white w-full">
            {/* Top Bar with Profile */}
            <div className="border-b border-gray-200 bg-white">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button onClick={() => setShowWizard(true)} className="bg-teal-600 hover:bg-teal-700">
                                <Plus className="w-4 h-4 mr-2" />
                                Create Test
                            </Button>
                        </div>
                        <UserNav />
                    </div>
                </div>
            </div>

            {/* Breadcrumbs Bar */}
            <div className="px-6 py-3 bg-white border-b border-gray-200">
                <div className="flex items-center gap-2 text-sm">
                    <button
                        onClick={() => router.push(`/organizations/${uuid}/projects/${projectId}`)}
                        className="text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <Home className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 font-semibold">Performance Testing</span>
                </div>
            </div>

            {/* Tab Navigation Bar */}
            <div className="border-b border-gray-300 bg-gradient-to-r from-slate-50 via-gray-50 to-stone-50">
                <div className="px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {[
                            { id: 'overview', label: 'Overview', icon: Gauge },
                            { id: 'lighthouse', label: 'Lighthouse', icon: Zap },
                            { id: 'load', label: 'Load Test', icon: TrendingUp },
                            { id: 'stress', label: 'Stress Test', icon: Activity },
                            { id: 'results', label: 'Results', icon: BarChart3 },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveModule(tab.id as any)}
                                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${activeModule === tab.id
                                    ? 'text-teal-700 bg-white border-b-2 border-teal-700 shadow-sm'
                                    : 'text-gray-600 hover:text-teal-700 hover:bg-white/50'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-2 border-gray-200 hover:bg-gray-50"
                            onClick={fetchDashboardData}
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-auto p-6">
                {/* Overview Tab */}
                {activeModule === 'overview' && (
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white rounded-xl p-6 border shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Performance Score</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-1">
                                            {stats.avg_performance_score !== null ? stats.avg_performance_score : '—'}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">Average score</p>
                                    </div>
                                    <Gauge className="w-10 h-10 text-teal-500" />
                                </div>
                            </div>
                            <div className="bg-white rounded-xl p-6 border shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Total Tests</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total_tests}</p>
                                        <p className="text-xs text-gray-500 mt-1">Run your first test</p>
                                    </div>
                                    <TrendingUp className="w-10 h-10 text-purple-500" />
                                </div>
                            </div>
                            <div className="bg-white rounded-xl p-6 border shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Pass Rate</p>
                                        <p className="text-3xl font-bold text-green-600 mt-1">{stats.pass_rate}%</p>
                                        <p className="text-xs text-gray-500 mt-1">Thresholds met</p>
                                    </div>
                                    <CheckCircle className="w-10 h-10 text-green-500" />
                                </div>
                            </div>
                            <div className="bg-white rounded-xl p-6 border shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Active Alerts</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-1">{stats.active_alerts}</p>
                                        <p className="text-xs text-gray-500 mt-1">No alerts</p>
                                    </div>
                                    <AlertTriangle className="w-10 h-10 text-orange-500" />
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
                                        <BarChart3 className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">View Results</h3>
                                        <p className="text-sm text-gray-500">Historical data</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Get Started Banner */}
                        <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl p-8 text-white">
                            <h2 className="text-2xl font-bold mb-2">Enterprise Performance Testing</h2>
                            <p className="text-teal-100 mb-4">
                                Outperform JMeter, k6, and BlazeMeter with AI-powered performance testing, beautiful dashboards, and zero configuration.
                            </p>
                            <div className="flex gap-4">
                                <Button className="bg-white text-teal-600 hover:bg-teal-50" onClick={() => setActiveModule('lighthouse')}>
                                    <Zap className="w-4 h-4 mr-2" />
                                    Run Lighthouse Audit
                                </Button>
                                <Button variant="outline" className="border-white text-white hover:bg-white/10" onClick={() => setActiveModule('load')}>
                                    <TrendingUp className="w-4 h-4 mr-2" />
                                    Start Load Test
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Lighthouse Tab */}
                {activeModule === 'lighthouse' && (
                    <div className="space-y-6">
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">Lighthouse Audit</h2>
                            <p className="text-sm text-gray-500">Analyze Core Web Vitals and page performance</p>
                        </div>

                        {/* URL Input */}
                        <div className="bg-white rounded-xl p-6 border shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Scan</h3>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <Label htmlFor="lighthouse-url">Target URL</Label>
                                    <Input
                                        id="lighthouse-url"
                                        placeholder="https://example.com"
                                        value={targetUrl}
                                        onChange={(e) => setTargetUrl(e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div className="w-40">
                                    <Label>Device</Label>
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
                                        className="bg-teal-600 hover:bg-teal-700"
                                        onClick={handleLighthouseScan}
                                        disabled={isLoading || !targetUrl}
                                    >
                                        {isLoading ? (
                                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Play className="w-4 h-4 mr-2" />
                                        )}
                                        Run Audit
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Core Web Vitals Explanation */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white rounded-xl p-6 border shadow-sm">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                        <Timer className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">LCP</h4>
                                        <p className="text-xs text-gray-500">Largest Contentful Paint</p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Measures loading performance. Should occur within 2.5 seconds.
                                </p>
                            </div>
                            <div className="bg-white rounded-xl p-6 border shadow-sm">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <Activity className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">FID</h4>
                                        <p className="text-xs text-gray-500">First Input Delay</p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Measures interactivity. Should be less than 100 milliseconds.
                                </p>
                            </div>
                            <div className="bg-white rounded-xl p-6 border shadow-sm">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                        <BarChart3 className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">CLS</h4>
                                        <p className="text-xs text-gray-500">Cumulative Layout Shift</p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Measures visual stability. Should maintain a score of less than 0.1.
                                </p>
                            </div>
                        </div>

                        {/* Placeholder for results */}
                        <div className="bg-white rounded-xl p-8 border shadow-sm text-center">
                            <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Run Your First Audit</h3>
                            <p className="text-gray-500">Enter a URL above and click "Run Audit" to analyze page performance.</p>
                        </div>
                    </div>
                )}

                {/* Load Test Tab */}
                {activeModule === 'load' && (
                    <div className="space-y-6">
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">Load Testing</h2>
                            <p className="text-sm text-gray-500">Simulate concurrent users and measure performance under load</p>
                        </div>

                        {/* Load Test Configuration */}
                        <div className="bg-white rounded-xl p-6 border shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Configure Load Test</h3>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                                        defaultValue="50"
                                        min="1"
                                        max="500"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label>Duration (sec)</Label>
                                    <Input
                                        type="number"
                                        defaultValue="60"
                                        min="10"
                                        max="300"
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                            <div className="mt-4">
                                <Button className="bg-purple-600 hover:bg-purple-700">
                                    <Play className="w-4 h-4 mr-2" />
                                    Start Test
                                </Button>
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
                )}

                {/* Stress Test Tab */}
                {activeModule === 'stress' && (
                    <div className="space-y-6">
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">Stress Testing</h2>
                            <p className="text-sm text-gray-500">Gradually increase load until the system breaks</p>
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
                )}

                {/* Results Tab */}
                {activeModule === 'results' && (
                    <div className="space-y-6">
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">Test Results & History</h2>
                            <p className="text-sm text-gray-500">View past test runs, trends, and comparisons</p>
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
                )}
            </div>

            {/* Create Test Wizard Dialog */}
            <Dialog open={showWizard} onOpenChange={setShowWizard}>
                <DialogContent className="max-w-2xl p-0 overflow-hidden">
                    <DialogTitle className="sr-only">Create Performance Test</DialogTitle>
                    <PerformanceTestWizard
                        projectId={projectId}
                        onComplete={handleTestCreated}
                        onCancel={() => setShowWizard(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}
