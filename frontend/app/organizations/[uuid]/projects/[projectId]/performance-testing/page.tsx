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
    RefreshCw,
    List
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import {
    PerformanceTestWizard,
    PerformanceGauge,
    CoreWebVitalsChart,
    LatencyDistributionChart,
    RealTimeMetricsChart,
    VirtualUsersChart,
    ThroughputChart,
    ScoreBreakdownChart,
    TestComparison,
    demoTestResults,
    ReportExport,
    demoReportData,
    HistoricalTrendChart,
    generateDemoTrendData,
    PerformanceTestList
} from '@/components/performance'
import { toast } from 'sonner'

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

export default function PerformanceTestingPage() {
    const params = useParams()
    const router = useRouter()
    const projectId = params.projectId as string
    const uuid = params.uuid as string

    const [activeModule, setActiveModule] = useState<'overview' | 'tests' | 'lighthouse' | 'load' | 'stress' | 'spike' | 'endurance' | 'volume' | 'scalability' | 'capacity' | 'results'>('overview')
    const [targetUrl, setTargetUrl] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [showWizard, setShowWizard] = useState(false)
    const [loading, setLoading] = useState(true)
    const [progress, setProgress] = useState(0)
    const [lighthouseResult, setLighthouseResult] = useState<any>(null)
    const [loadTestResult, setLoadTestResult] = useState<any>(null)
    const [isLoadTestModalOpen, setIsLoadTestModalOpen] = useState(false)
    const [refreshTrigger, setRefreshTrigger] = useState(0)

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

    const pollTestStatus = async (testId: string) => {
        try {
            const token = localStorage.getItem('access_token')
            const response = await fetch(`${API_URL}/api/v1/performance/tests/${testId}`, {
                credentials: 'include',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            })

            if (response.ok) {
                const test = await response.json()

                if (test.status === 'completed') {
                    setProgress(100)
                    await handleTestExecutionComplete(testId)
                    setIsLoading(false)
                } else if (test.status === 'failed' || test.status === 'cancelled') {
                    setIsLoading(false)
                    console.error('Test failed:', test.error_message)
                    // Optionally show error toast here
                } else {
                    // Update progress if available (fake it if < 90)
                    const serverProgress = test.progress_percentage || 0
                    setProgress(prev => Math.max(prev, serverProgress, prev < 90 ? prev + 5 : prev))

                    // NEW: Update real-time metrics even while running
                    if (test.test_type === 'load' || test.test_type === 'stress' || test.test_type === 'spike') {
                        const metrics = test.metrics || {}
                        if (metrics.rps_timeline && metrics.rps_timeline.length > 0) {
                            setLoadTestResult({
                                p50: metrics.latency_p50,
                                p75: metrics.latency_p75,
                                p90: metrics.latency_p90,
                                p95: metrics.latency_p95,
                                p99: metrics.latency_p99,
                                max: metrics.latency_max,
                                avgRps: metrics.requests_per_second,
                                successRate: 100 - (metrics.error_rate || 0),
                                totalRequests: metrics.total_requests_made,
                                timeline: metrics.rps_timeline.map((p: any, idx: number) => ({
                                    timestamp: p.timestamp,
                                    rps: p.value,
                                    latency: metrics.latency_timeline?.[idx]?.value || 0,
                                    errors: metrics.errors_timeline?.[idx]?.value || 0
                                })),
                                vuTimeline: metrics.virtual_users_timeline ? metrics.virtual_users_timeline.map((p: any) => ({
                                    timestamp: p.timestamp || '0s',
                                    activeVUs: typeof p.value === 'number' ? p.value : (p.vus || 0),
                                    targetVUs: test.virtual_users || 50
                                })) : []
                            })
                        }
                    }

                    // Poll again
                    setTimeout(() => pollTestStatus(testId), 2000)
                }
            } else {
                setIsLoading(false)
            }
        } catch (error) {
            console.error('Polling failed:', error)
            setIsLoading(false)
        }
    }

    const handleLighthouseScan = async () => {
        if (!targetUrl) return
        setIsLoading(true)
        setProgress(0)
        setLighthouseResult(null)
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
                const data = await response.json()
                if (data.status === 'pending' || data.status === 'running' || data.status === 'queued') {
                    // Start polling
                    pollTestStatus(data.id)
                } else {
                    // Immediate result (fallback)
                    const metrics = data.metrics || {}
                    setLighthouseResult({
                        performance: Math.round((metrics.performance_score || 0) * 100),
                        accessibility: Math.round((metrics.accessibility_score || 0) * 100),
                        bestPractices: Math.round((metrics.best_practices_score || 0) * 100),
                        seo: Math.round((metrics.seo_score || 0) * 100),
                        lcp: metrics.largest_contentful_paint || 0,
                        fid: metrics.first_input_delay || 0,
                        cls: metrics.cumulative_layout_shift || 0,
                        fcp: metrics.first_contentful_paint || 0,
                        ttfb: metrics.time_to_first_byte || 0
                    })
                    setIsLoading(false)
                    fetchDashboardData()
                }
            } else {
                console.error('Lighthouse scan failed:', response.statusText)
            }
        } catch (error) {
            console.error('Lighthouse scan failed:', error)
        } finally {
            // Loading state handled in poll
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
                setRefreshTrigger(prev => prev + 1)
            }
        } catch (error) {
            console.error('Failed to create test:', error)
        }
    }

    const handleTestRunStarted = (testId: string, testType: string) => {
        setIsLoading(true)
        setProgress(5)

        // Switch to the relevant tab to show results
        if (testType === 'load') {
            setLoadTestResult(null)
            setActiveModule('load')
            pollTestStatus(testId)
        } else if (testType === 'lighthouse') {
            setLighthouseResult(null)
            setActiveModule('lighthouse')
            pollTestStatus(testId)
        } else if (testType === 'stress') {
            setLoadTestResult(null)
            setActiveModule('stress')
            pollTestStatus(testId) // Use same polling for stress
        }
        else if (testType === 'spike') {
            setActiveModule('spike')
            pollTestStatus(testId)
        }
        else if (testType === 'endurance') {
            setActiveModule('endurance')
            pollTestStatus(testId)
        }
    }

    // Load test state
    const [loadTestConfig, setLoadTestConfig] = useState({
        virtualUsers: 50,
        duration: 60,
        rampUp: 10
    })
    const [isRunningLoadTest, setIsRunningLoadTest] = useState(false)

    const handleLoadTest = async () => {
        if (!targetUrl) return
        setIsRunningLoadTest(true)
        setLoadTestResult(null)

        try {
            const token = localStorage.getItem('access_token')
            const response = await fetch(`${API_URL}/api/v1/performance/load-test?project_id=${projectId}`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({
                    target_url: targetUrl,
                    target_method: "GET",
                    target_headers: {},
                    virtual_users: loadTestConfig.virtualUsers,
                    duration_seconds: loadTestConfig.duration,
                    ramp_up_seconds: loadTestConfig.rampUp
                })
            })

            if (response.ok) {
                const data = await response.json()
                // Start polling instead of showing fake immediate result
                pollTestStatus(data.id)
            } else {
                const errorData = await response.json().catch(() => ({}))
                console.error('Load test failed:', response.statusText, errorData)

                // Extract meaningful error message
                let errorMessage = 'Load test failed'
                if (errorData.detail) {
                    if (typeof errorData.detail === 'string') {
                        errorMessage = errorData.detail
                    } else if (Array.isArray(errorData.detail)) {
                        // Pydantic validation errors
                        errorMessage = errorData.detail.map((err: any) =>
                            `${err.loc?.join('.') || 'Field'}: ${err.msg}`
                        ).join(', ')
                    } else {
                        errorMessage = JSON.stringify(errorData.detail)
                    }
                }

                toast.error(errorMessage)
            }
        } catch (error: any) {
            console.error('Load test failed:', error)
            toast.error(error.message || 'Failed to start load test')
        } finally {
            setIsRunningLoadTest(false)
        }
    }

    const handleTestExecutionComplete = async (testId: string) => {
        try {
            const token = localStorage.getItem('access_token')
            const response = await fetch(`${API_URL}/api/v1/performance/tests/${testId}`, {
                method: 'GET',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                credentials: 'include'
            })

            if (response.ok) {
                const test = await response.json()
                const metrics = test.metrics || {}

                // Update stats
                fetchDashboardData()

                if (test.test_type === 'lighthouse' || test.test_type === 'pagespeed') {
                    setLighthouseResult({
                        performance: metrics.performance_score || 0,
                        accessibility: metrics.accessibility_score || 0,
                        bestPractices: metrics.best_practices_score || 0,
                        seo: metrics.seo_score || 0,
                        lcp: metrics.largest_contentful_paint || 0,
                        fid: metrics.first_input_delay || 0,
                        cls: metrics.cumulative_layout_shift || 0,
                        fcp: metrics.first_contentful_paint || 0,
                        ttfb: metrics.time_to_first_byte || 0
                    })
                    setTargetUrl(test.target_url)
                    setActiveModule('lighthouse')
                } else if (test.test_type === 'load' || test.test_type === 'stress') {
                    setLoadTestResult({
                        p50: metrics.latency_p50,
                        p75: metrics.latency_p75,
                        p90: metrics.latency_p90,
                        p95: metrics.latency_p95,
                        p99: metrics.latency_p99,
                        max: metrics.latency_max,
                        timeline: metrics.rps_timeline?.map((p: any, idx: number) => ({
                            timestamp: p.timestamp,
                            rps: p.value,
                            latency: metrics.latency_timeline?.[idx]?.value || 0,
                            errors: metrics.errors_timeline?.[idx]?.value || 0
                        })) || [],
                        vuTimeline: metrics.virtual_users_timeline ? metrics.virtual_users_timeline.map((p: any) => ({
                            timestamp: p.timestamp || '0s',
                            activeVUs: typeof p.value === 'number' ? p.value : (p.vus || 0),
                            targetVUs: test.virtual_users || 50
                        })) : [],
                        totalRequests: metrics.total_requests_made,
                        successRate: 100 - (metrics.error_rate || 0),
                        avgRps: metrics.requests_per_second
                    })
                    setTargetUrl(test.target_url)
                    setActiveModule(test.test_type === 'load' ? 'load' : 'stress' as any)
                } else {
                    setActiveModule('results')
                }
            }
        } catch (error) {
            console.error('Failed to fetch test details:', error)
        }
    }

    return (
        <div className="flex flex-col h-screen bg-white w-full">
            {/* Top Bar with Profile */}
            <div className="border-b border-gray-200 bg-white">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
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
                        className="text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1.5"
                    >
                        <Home className="w-4 h-4" />
                        <span>Home</span>
                    </button>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 font-semibold">Performance Testing</span>
                </div>
            </div>

            {/* Tab Navigation Bar */}
            <div className="border-b border-gray-300 bg-gradient-to-r from-slate-50 via-gray-50 to-stone-50">
                <div className="px-6 py-3 overflow-x-auto scrollbar-hide">
                    <div className="flex items-center gap-1.5">
                        {[
                            { id: 'overview', label: 'Overview', icon: Gauge },
                            { id: 'tests', label: 'Tests', icon: List },
                            { id: 'lighthouse', label: 'Lighthouse', icon: Zap },
                            { id: 'load', label: 'Load Test', icon: TrendingUp },
                            { id: 'stress', label: 'Stress Test', icon: Activity },
                            { id: 'spike', label: 'Spike Test', icon: Zap },
                            { id: 'endurance', label: 'Endurance Test', icon: Clock },
                            { id: 'volume', label: 'Volume Test', icon: BarChart3 },
                            { id: 'scalability', label: 'Scalability', icon: TrendingUp },
                            { id: 'capacity', label: 'Capacity', icon: Gauge },
                            { id: 'results', label: 'Results', icon: BarChart3 },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveModule(tab.id as any)}
                                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-md transition-colors ${activeModule === tab.id
                                    ? 'text-teal-700 bg-white border-b-2 border-teal-700 shadow-sm'
                                    : 'text-gray-600 hover:text-teal-700 hover:bg-white/50'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
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
                        <div className="bg-gradient-to-r from-brand-700 to-brand-600 rounded-xl p-8 text-white shadow-lg">
                            <h2 className="text-2xl font-bold mb-2">Enterprise Performance Testing</h2>
                            <p className="text-teal-50 mb-4 max-w-2xl">
                                Outperform JMeter, k6, and BlazeMeter with AI-powered performance testing, beautiful dashboards, and zero configuration.
                            </p>
                            <div className="flex gap-4">
                                <Button
                                    className="bg-white bg-none text-brand-700 hover:bg-gray-50 border-0 shadow-md"
                                    onClick={() => setActiveModule('lighthouse')}
                                >
                                    <Zap className="w-4 h-4 mr-2" />
                                    Run Lighthouse Audit
                                </Button>
                                <Button
                                    variant="outline"
                                    className="bg-transparent border-white text-white hover:bg-white/10 hover:text-white"
                                    onClick={() => setActiveModule('load')}
                                >
                                    <TrendingUp className="w-4 h-4 mr-2" />
                                    Start Load Test
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tests Tab */}
                {activeModule === 'tests' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Performance Tests</h2>
                                <p className="text-sm text-gray-500">Manage and run your saved test configurations</p>
                            </div>
                            <Button
                                onClick={() => setShowWizard(true)}
                                className="bg-teal-600 hover:bg-teal-700"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Create New Test
                            </Button>
                        </div>

                        <PerformanceTestList
                            projectId={projectId}
                            refreshTrigger={refreshTrigger}
                            onTestExecuted={handleTestRunStarted}
                        />
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

                        {/* Results or Placeholder */}
                        {lighthouseResult ? (
                            <div className="space-y-6">
                                {/* Score Overview */}
                                <div className="bg-white rounded-xl p-6 border shadow-sm">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Scores</h3>
                                    <ScoreBreakdownChart
                                        performance={lighthouseResult.performance || 0}
                                        accessibility={lighthouseResult.accessibility || 0}
                                        bestPractices={lighthouseResult.bestPractices || 0}
                                        seo={lighthouseResult.seo || 0}
                                    />
                                </div>

                                {/* Core Web Vitals */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Core Web Vitals</h3>
                                    <CoreWebVitalsChart
                                        lcp={lighthouseResult.lcp || 0}
                                        fid={lighthouseResult.fid || 0}
                                        cls={lighthouseResult.cls || 0}
                                        fcp={lighthouseResult.fcp}
                                        ttfb={lighthouseResult.ttfb}
                                    />
                                </div>

                                {/* Opportunities (Performance improvements) */}
                                {console.log('Lighthouse result opportunities:', lighthouseResult.opportunities)}
                                {lighthouseResult.opportunities && lighthouseResult.opportunities.length > 0 && (
                                    <div className="bg-white rounded-xl p-6 border shadow-sm">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Opportunities</h3>
                                        <p className="text-sm text-gray-500 mb-4">These suggestions can help your page load faster</p>
                                        <div className="space-y-3">
                                            {lighthouseResult.opportunities.map((opp: any, idx: number) => (
                                                <div key={idx} className="border-l-4 border-orange-500 pl-4 py-2">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <h4 className="text-sm font-medium text-gray-900">{opp.title}</h4>
                                                            {opp.description && (
                                                                <p className="text-xs text-gray-600 mt-1">{opp.description}</p>
                                                            )}
                                                        </div>
                                                        {opp.savings_ms > 0 && (
                                                            <span className="ml-4 text-sm font-semibold text-orange-600">
                                                                Est. savings: {(opp.savings_ms / 1000).toFixed(2)}s
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Diagnostics (Additional information) */}
                                {lighthouseResult.diagnostics && lighthouseResult.diagnostics.length > 0 && (
                                    <div className="bg-white rounded-xl p-6 border shadow-sm">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Diagnostics</h3>
                                        <p className="text-sm text-gray-500 mb-4">More information about your page's performance</p>
                                        <div className="space-y-2">
                                            {lighthouseResult.diagnostics.map((diag: any, idx: number) => (
                                                <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                                    <div className="flex-1">
                                                        <h4 className="text-sm font-medium text-gray-900">{diag.title}</h4>
                                                        {diag.display_value && (
                                                            <p className="text-xs text-gray-600 mt-1">{diag.display_value}</p>
                                                        )}
                                                    </div>
                                                    {diag.score !== null && (
                                                        <span className={`text-xs px-2 py-1 rounded ${diag.score >= 90 ? 'bg-green-100 text-green-700' :
                                                            diag.score >= 50 ? 'bg-amber-100 text-amber-700' :
                                                                'bg-red-100 text-red-700'
                                                            }`}>
                                                            {diag.score}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl p-8 border shadow-sm text-center">
                                <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Run Your First Audit</h3>
                                <p className="text-gray-500 mb-4">Enter a URL above and click "Run Audit" to analyze page performance.</p>
                            </div>
                        )}

                        {isLoading && !lighthouseResult && (
                            <div className="bg-white rounded-xl p-8 border shadow-sm text-center">
                                <RefreshCw className="w-16 h-16 text-teal-600 mx-auto mb-4 animate-spin" />
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Running Audit...</h3>
                                <p className="text-gray-500 mb-4">Analyzing performance for {targetUrl}</p>
                                <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                    <div className="bg-teal-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                </div>
                                <p className="text-sm text-gray-400 mt-2">{progress}% completed</p>
                            </div>
                        )}
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
                                        value={targetUrl}
                                        onChange={(e) => setTargetUrl(e.target.value)}
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
                                        value={loadTestConfig.virtualUsers}
                                        onChange={(e) => setLoadTestConfig(prev => ({ ...prev, virtualUsers: parseInt(e.target.value) || 50 }))}
                                        min="1"
                                        max="500"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label>Duration (sec)</Label>
                                    <Input
                                        type="number"
                                        value={loadTestConfig.duration}
                                        onChange={(e) => setLoadTestConfig(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                                        min="1"
                                        max="300"
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                            <div className="mt-4">
                                <Button
                                    onClick={handleLoadTest}
                                    disabled={!targetUrl || isRunningLoadTest}
                                    className="bg-purple-600 hover:bg-purple-700"
                                >
                                    {isRunningLoadTest ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            Running Test...
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-4 h-4 mr-2" />
                                            Start Test
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Progress Bar for Load Test */}
                        {isLoading && activeModule === 'load' && (
                            <div className="bg-white rounded-xl p-8 border border-purple-100 shadow-sm text-center">
                                <RefreshCw className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-spin" />
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Executing Load Test...</h3>
                                <p className="text-gray-500 mb-4">Simulating {loadTestConfig.virtualUsers} users on {targetUrl}</p>
                                <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-2.5">
                                    <div className="bg-purple-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                </div>
                                <p className="text-sm text-gray-400 mt-2">{progress}% completed</p>
                            </div>
                        )}

                        {/* Metrics display */}
                        {loadTestResult && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="bg-white rounded-xl p-4 border shadow-sm">
                                        <h4 className="font-semibold text-gray-900 text-sm">Requests/sec</h4>
                                        <p className="text-2xl font-bold text-purple-600 mt-1">
                                            {loadTestResult?.avgRps ? loadTestResult.avgRps.toFixed(1) : '...'}
                                        </p>
                                        <p className="text-xs text-gray-500">Throughput</p>
                                    </div>
                                    <div className="bg-white rounded-xl p-4 border shadow-sm">
                                        <h4 className="font-semibold text-gray-900 text-sm">P95 Latency</h4>
                                        <p className="text-2xl font-bold text-purple-600 mt-1">
                                            {loadTestResult?.p95 ? `${loadTestResult.p95}ms` : '...'}
                                        </p>
                                        <p className="text-xs text-gray-500">95th percentile</p>
                                    </div>
                                    <div className="bg-white rounded-xl p-4 border shadow-sm">
                                        <h4 className="font-semibold text-gray-900 text-sm">Success Rate</h4>
                                        <p className={`text-2xl font-bold mt-1 ${loadTestResult?.successRate && loadTestResult.successRate > 99 ? 'text-green-600' : loadTestResult?.successRate ? 'text-amber-600' : 'text-gray-600'}`}>
                                            {loadTestResult?.successRate ? `${loadTestResult.successRate.toFixed(1)}%` : '...'}
                                        </p>
                                        <p className="text-xs text-gray-500">Success rate</p>
                                    </div>
                                    <div className="bg-white rounded-xl p-4 border shadow-sm">
                                        <h4 className="font-semibold text-gray-900 text-sm">Total Requests</h4>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">
                                            {loadTestResult?.totalRequests ? loadTestResult.totalRequests.toLocaleString() : '...'}
                                        </p>
                                        <p className="text-xs text-gray-500">Completed</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Latency Distribution */}
                                    <LatencyDistributionChart
                                        p50={loadTestResult.p50}
                                        p75={loadTestResult.p75}
                                        p90={loadTestResult.p90}
                                        p95={loadTestResult.p95}
                                        p99={loadTestResult.p99}
                                        max={loadTestResult.max}
                                    />

                                    {/* Real-time Metrics */}
                                    <RealTimeMetricsChart data={loadTestResult.timeline} />

                                    {/* Virtual Users Chart */}
                                    <VirtualUsersChart data={loadTestResult.vuTimeline} />
                                </div>
                            </>
                        )}

                        {!loadTestResult && !isLoading && (
                            <div className="bg-white rounded-xl p-8 border shadow-sm text-center">
                                <LineChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Real-time Metrics</h3>
                                <p className="text-gray-500 mb-4">Start a load test to see live performance charts.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Stress Test Tab */}
                {
                    activeModule === 'stress' && (
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
                    )
                }

                {/* Spike Test Tab */}
                {
                    activeModule === 'spike' && (
                        <div className="space-y-6">
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">Spike Testing</h2>
                                <p className="text-sm text-gray-500">Test system stability during sudden extreme bursts of traffic</p>
                            </div>

                            <div className="bg-white rounded-xl p-6 border shadow-sm">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Configure Spike Test</h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="md:col-span-2">
                                        <Label htmlFor="spike-url">Target URL</Label>
                                        <Input
                                            id="spike-url"
                                            placeholder="https://api.example.com/endpoint"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label>Normal Load (VUs)</Label>
                                        <Input
                                            type="number"
                                            defaultValue="10"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label>Spike Load (VUs)</Label>
                                        <Input
                                            type="number"
                                            defaultValue="1000"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <Button className="w-full bg-red-600 hover:bg-red-700">
                                            <Zap className="w-4 h-4 mr-2" />
                                            Start Spike Test
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 mt-4">
                                    Simulates a sudden surge of users (e.g., flash sale) to test system resilience.
                                </p>
                            </div>

                            <div className="bg-white rounded-xl p-8 border shadow-sm text-center">
                                <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Spike Recovery Analysis</h3>
                                <p className="text-gray-500">Start a spike test to measure system recovery time.</p>
                            </div>
                        </div>
                    )
                }

                {/* Endurance Test Tab */}
                {
                    activeModule === 'endurance' && (
                        <div className="space-y-6">
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">Endurance/Soak Testing</h2>
                                <p className="text-sm text-gray-500">Run sustained load for extended periods to detect memory leaks</p>
                            </div>

                            <div className="bg-white rounded-xl p-6 border shadow-sm">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Configure Endurance Test</h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="md:col-span-2">
                                        <Label htmlFor="endurance-url">Target URL</Label>
                                        <Input
                                            id="endurance-url"
                                            placeholder="https://api.example.com/endpoint"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label>Virtual Users</Label>
                                        <Input
                                            type="number"
                                            defaultValue="50"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label>Duration (hours)</Label>
                                        <Input
                                            type="number"
                                            defaultValue="4"
                                            min="1"
                                            max="24"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                                            <Clock className="w-4 h-4 mr-2" />
                                            Start Endurance Test
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 mt-4">
                                    Tests system stability over extended periods to identify memory leaks and resource degradation.
                                </p>
                            </div>

                            <div className="bg-white rounded-xl p-8 border shadow-sm text-center">
                                <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Long-Term Performance</h3>
                                <p className="text-gray-500">Start an endurance test to monitor system health over time.</p>
                            </div>
                        </div>
                    )
                }

                {/* Volume Test Tab */}
                {
                    activeModule === 'volume' && (
                        <div className="space-y-6">
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">Volume Testing</h2>
                                <p className="text-sm text-gray-500">Test performance with large data volumes in the database</p>
                            </div>

                            <div className="bg-white rounded-xl p-6 border shadow-sm">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Configure Volume Test</h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="md:col-span-2">
                                        <Label htmlFor="volume-url">Target URL</Label>
                                        <Input
                                            id="volume-url"
                                            placeholder="https://api.example.com/endpoint"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label>Data Volume (records)</Label>
                                        <Input
                                            type="number"
                                            defaultValue="1000000"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label>Concurrent Users</Label>
                                        <Input
                                            type="number"
                                            defaultValue="100"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <Button className="w-full bg-blue-600 hover:bg-blue-700">
                                            <BarChart3 className="w-4 h-4 mr-2" />
                                            Start Volume Test
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 mt-4">
                                    Assesses performance when handling large volumes of data in the database.
                                </p>
                            </div>

                            <div className="bg-white rounded-xl p-8 border shadow-sm text-center">
                                <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Data Volume Analysis</h3>
                                <p className="text-gray-500">Start a volume test to measure data handling performance.</p>
                            </div>
                        </div>
                    )
                }

                {/* Scalability Test Tab */}
                {
                    activeModule === 'scalability' && (
                        <div className="space-y-6">
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">Scalability Testing</h2>
                                <p className="text-sm text-gray-500">Determine the system's ability to handle increasing loads</p>
                            </div>

                            <div className="bg-white rounded-xl p-6 border shadow-sm">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Configure Scalability Test</h3>
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                    <div className="md:col-span-2">
                                        <Label htmlFor="scalability-url">Target URL</Label>
                                        <Input
                                            id="scalability-url"
                                            placeholder="https://api.example.com/endpoint"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label>Start Load</Label>
                                        <Input
                                            type="number"
                                            defaultValue="10"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label>Max Load</Label>
                                        <Input
                                            type="number"
                                            defaultValue="10000"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label>Increment</Label>
                                        <Input
                                            type="number"
                                            defaultValue="100"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <Button className="w-full bg-green-600 hover:bg-green-700">
                                            <TrendingUp className="w-4 h-4 mr-2" />
                                            Start Scalability Test
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 mt-4">
                                    Tests how well the system scales by incrementally increasing load.
                                </p>
                            </div>

                            <div className="bg-white rounded-xl p-8 border shadow-sm text-center">
                                <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Scaling Analysis</h3>
                                <p className="text-gray-500">Start a scalability test to measure growth capacity.</p>
                            </div>
                        </div>
                    )
                }

                {/* Capacity Test Tab */}
                {
                    activeModule === 'capacity' && (
                        <div className="space-y-6">
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">Capacity Testing</h2>
                                <p className="text-sm text-gray-500">Find the maximum load your system can handle</p>
                            </div>

                            <div className="bg-white rounded-xl p-6 border shadow-sm">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Configure Capacity Test</h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="md:col-span-2">
                                        <Label htmlFor="capacity-url">Target URL</Label>
                                        <Input
                                            id="capacity-url"
                                            placeholder="https://api.example.com/endpoint"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label>Performance Threshold</Label>
                                        <Input
                                            type="number"
                                            defaultValue="500"
                                            placeholder="500ms"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label>Error Rate Limit (%)</Label>
                                        <Input
                                            type="number"
                                            defaultValue="1"
                                            max="100"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <Button className="w-full bg-cyan-600 hover:bg-cyan-700">
                                            <Gauge className="w-4 h-4 mr-2" />
                                            Start Capacity Test
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 mt-4">
                                    Determines the maximum user load or data volume before performance degrades.
                                </p>
                            </div>

                            <div className="bg-white rounded-xl p-8 border shadow-sm text-center">
                                <Gauge className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Capacity Limits</h3>
                                <p className="text-gray-500">Start a capacity test to identify system limits.</p>
                            </div>
                        </div>
                    )
                }

                {/* Results Tab */}
                {
                    activeModule === 'results' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">Test Results & History</h2>
                                    <p className="text-sm text-gray-500">View past test runs, trends, and comparisons</p>
                                </div>
                                <ReportExport data={demoReportData} />
                            </div>

                            {/* Test Comparison */}
                            <TestComparison tests={demoTestResults} />

                            {/* Historical Trend */}
                            <HistoricalTrendChart
                                data={generateDemoTrendData(60)}
                                title="Performance History"
                            />

                            {/* Recent Tests */}
                            <div className="bg-white rounded-xl border shadow-sm">
                                <div className="p-6 border-b border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900">Recent Test Runs</h3>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {demoTestResults.map((test) => (
                                        <div key={test.id} className="p-4 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${test.testType === 'lighthouse' ? 'bg-teal-100' :
                                                        test.testType === 'load' ? 'bg-purple-100' : 'bg-orange-100'
                                                        }`}>
                                                        {test.testType === 'lighthouse' ? (
                                                            <Zap className={`w-5 h-5 text-teal-600`} />
                                                        ) : test.testType === 'load' ? (
                                                            <TrendingUp className={`w-5 h-5 text-purple-600`} />
                                                        ) : (
                                                            <Activity className={`w-5 h-5 text-orange-600`} />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{test.name}</p>
                                                        <p className="text-sm text-gray-500">
                                                            {new Date(test.timestamp).toLocaleDateString()} at {new Date(test.timestamp).toLocaleTimeString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    {test.metrics.performance !== undefined && (
                                                        <div className="text-right">
                                                            <p className="text-sm text-gray-500">Score</p>
                                                            <p className={`text-lg font-bold ${test.metrics.performance >= 90 ? 'text-green-600' :
                                                                test.metrics.performance >= 50 ? 'text-amber-600' : 'text-red-600'
                                                                }`}>{test.metrics.performance}</p>
                                                        </div>
                                                    )}
                                                    {test.metrics.rps !== undefined && (
                                                        <div className="text-right">
                                                            <p className="text-sm text-gray-500">RPS</p>
                                                            <p className="text-lg font-bold text-purple-600">{test.metrics.rps}</p>
                                                        </div>
                                                    )}
                                                    <Button variant="ghost" size="sm">
                                                        View
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )
                }
            </div >

            {/* Create Test Wizard Dialog */}
            < Dialog open={showWizard} onOpenChange={setShowWizard} >
                <DialogContent className="max-w-2xl p-0 overflow-hidden">
                    <DialogTitle className="sr-only">Create Performance Test</DialogTitle>
                    <PerformanceTestWizard
                        projectId={projectId}
                        onComplete={handleTestCreated}
                        onCancel={() => setShowWizard(false)}
                    />
                </DialogContent>
            </Dialog >
        </div >
    )
}
