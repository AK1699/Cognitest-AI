'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
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
    Home,
    RefreshCw,
    List,
    Plus,
    ChevronLeft,
    ChevronRight,
    Shield,
    Globe,
    History as HistoryIcon
} from 'lucide-react'
import { CircuitLogoIcon } from '@/components/ui/CircuitLogoIcon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
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
    PerformanceTestList,
    LighthouseReport,
} from '@/components/performance'
import { toast } from 'sonner'

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

export default function PerformanceTestingPage() {
    const params = useParams()
    const router = useRouter()
    const projectId = params.projectId as string
    const uuid = params.uuid as string

    const [activeModule, setActiveModule] = useState<'overview' | 'tests' | 'lighthouse' | 'load' | 'stress' | 'spike' | 'soak' | 'volume' | 'scalability' | 'capacity' | 'results'>('overview')
    const [lhTargetUrl, setLhTargetUrl] = useState('')
    const [loadTargetUrl, setLoadTargetUrl] = useState('')
    const [stressTargetUrl, setStressTargetUrl] = useState('')
    const [spikeTargetUrl, setSpikeTargetUrl] = useState('')
    const [soakTargetUrl, setSoakTargetUrl] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [showWizard, setShowWizard] = useState(false)
    const [loading, setLoading] = useState(true)
    const [progress, setProgress] = useState(0)
    const [lighthouseResult, setLighthouseResult] = useState<any>(null)
    const [loadTestResult, setLoadTestResult] = useState<any>(null)
    const [isLoadTestModalOpen, setIsLoadTestModalOpen] = useState(false)
    const [refreshTrigger, setRefreshTrigger] = useState(0)
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isLighthouseLoading, setIsLighthouseLoading] = useState(false)
    const [isLoadLoading, setIsLoadLoading] = useState(false)
    const [isStressLoading, setIsStressLoading] = useState(false)
    const [isSpikeLoading, setIsSpikeLoading] = useState(false)
    const [isSoakLoading, setIsSoakLoading] = useState(false)
    const [testToEdit, setTestToEdit] = useState<any>(null)

    // Lighthouse Options State
    const [lhDevice, setLhDevice] = useState<'mobile' | 'desktop'>('mobile')
    const [lhMode, setLhMode] = useState<'navigation' | 'timespan' | 'snapshot'>('navigation')
    const [lhCategories, setLhCategories] = useState({
        performance: true,
        accessibility: true,
        bestPractices: true,
        seo: true
    })
    const [lighthouseHistory, setLighthouseHistory] = useState<any[]>([])
    const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null)

    // Stats from API
    const [stats, setStats] = useState({
        total_tests: 0,
        avg_performance_score: null as number | null,
        pass_rate: 0,
        active_alerts: 0
    })

    useEffect(() => {
        fetchDashboardData()
        fetchLighthouseHistory()
    }, [projectId])

    const fetchLighthouseHistory = async () => {
        try {
            const token = localStorage.getItem('access_token')
            const response = await fetch(`${API_URL}/api/v1/performance/tests?project_id=${projectId}&page=1&page_size=20`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                credentials: 'include'
            })
            if (response.ok) {
                const data = await response.json()
                // Filter for lighthouse tests
                const lhTests = (data.items || []).filter((t: any) => t.test_type === 'lighthouse' || t.test_type === 'pagespeed')
                setLighthouseHistory(lhTests)
            }
        } catch (error) {
            console.error('Failed to fetch lighthouse history:', error)
        }
    }

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
                    if (test.test_type === 'lighthouse' || test.test_type === 'pagespeed') setIsLighthouseLoading(false)
                    else if (test.test_type === 'load') setIsLoadLoading(false)
                    else if (test.test_type === 'stress') setIsStressLoading(false)
                    else if (test.test_type === 'spike') setIsSpikeLoading(false)
                    else if (test.test_type === 'endurance' || test.test_type === 'soak') setIsSoakLoading(false)
                } else if (test.status === 'failed' || test.status === 'cancelled') {
                    setIsLoading(false)
                    if (test.test_type === 'lighthouse' || test.test_type === 'pagespeed') setIsLighthouseLoading(false)
                    else if (test.test_type === 'load') setIsLoadLoading(false)
                    else if (test.test_type === 'stress') setIsStressLoading(false)
                    else if (test.test_type === 'spike') setIsSpikeLoading(false)
                    else if (test.test_type === 'endurance' || test.test_type === 'soak') setIsSoakLoading(false)
                    console.error('Test failed:', test.error_message)
                    // Optionally show error toast here
                } else {
                    // Update progress if available (fake it if < 90)
                    const serverProgress = test.progress_percentage || 0
                    setProgress(prev => Math.max(prev, serverProgress, prev < 90 ? prev + 5 : prev))

                    // NEW: Update real-time metrics even while running
                    if (['load', 'stress', 'spike', 'endurance', 'soak'].includes(test.test_type)) {
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
                setIsLighthouseLoading(false)
                setIsLoadLoading(false)
                setIsStressLoading(false)
                setIsSpikeLoading(false)
                setIsSoakLoading(false)
            }
        } catch (error) {
            console.error('Polling failed:', error)
            setIsLoading(false)
            setIsLighthouseLoading(false)
            setIsLoadLoading(false)
            setIsStressLoading(false)
            setIsSpikeLoading(false)
            setIsSoakLoading(false)
        }
    }

    const handleLighthouseScan = async () => {
        if (!lhTargetUrl) return
        setIsLighthouseLoading(true)
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
                    target_url: lhTargetUrl,
                    device_type: lhDevice,
                    mode: lhMode,
                    categories: lhCategories
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
                        ttfb: metrics.time_to_first_byte || 0,
                        opportunities: metrics.opportunities || [],
                        diagnostics: metrics.diagnostics || [],
                        raw_response: metrics.raw_response
                    })
                    setIsLoading(false)
                    setIsLighthouseLoading(false)
                    fetchDashboardData()
                }
            } else {
                console.error('Lighthouse scan failed:', response.statusText)
                setIsLoading(false)
            }
        } catch (error) {
            console.error('Lighthouse scan failed:', error)
            setIsLoading(false)
            setIsLighthouseLoading(false)
        }
    }

    const handleTestCreated = async (testConfig: any, shouldRun: boolean = true) => {
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
                const test = await response.json()
                setShowWizard(false)
                fetchDashboardData()
                setRefreshTrigger(prev => prev + 1)

                if (shouldRun) {
                    // Immediately trigger execution
                    const execResponse = await fetch(`${API_URL}/api/v1/performance/tests/${test.id}/execute`, {
                        method: 'POST',
                        credentials: 'include',
                        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                    })

                    if (execResponse.ok) {
                        toast.success('Test created and started')
                        handleTestRunStarted(test.id, test.test_type)
                    } else {
                        toast.success('Test created successfully')
                    }
                } else {
                    toast.success('Test configuration saved')
                }
            } else {
                const error = await response.json().catch(() => ({}))
                toast.error(error.detail || 'Failed to create test')
            }
        } catch (error) {
            console.error('Failed to create test:', error)
            toast.error('An unexpected error occurred')
        }
    }

    const handleUpdateTest = async (testConfig: any, shouldRun: boolean = true) => {
        if (!testToEdit) return
        try {
            const token = localStorage.getItem('access_token')
            const response = await fetch(`${API_URL}/api/v1/performance/tests/${testToEdit.id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify(testConfig)
            })
            if (response.ok) {
                const test = await response.json()
                setShowWizard(false)
                setTestToEdit(null)
                fetchDashboardData()
                setRefreshTrigger(prev => prev + 1)

                if (shouldRun) {
                    // Immediately trigger execution
                    const execResponse = await fetch(`${API_URL}/api/v1/performance/tests/${test.id}/execute`, {
                        method: 'POST',
                        credentials: 'include',
                        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                    })

                    if (execResponse.ok) {
                        toast.success('Test updated and started')
                        handleTestRunStarted(test.id, test.test_type)
                    } else {
                        toast.success('Test updated successfully')
                    }
                } else {
                    toast.success('Test configuration updated')
                }
            } else {
                const error = await response.json().catch(() => ({}))
                toast.error(error.detail || 'Failed to update test')
            }
        } catch (error) {
            console.error('Failed to update test:', error)
            toast.error('An unexpected error occurred')
        }
    }

    const handleTestRunStarted = (testId: string, testType: string) => {
        setIsLoading(true)
        if (testType === 'lighthouse') setIsLighthouseLoading(true)
        else if (testType === 'load') setIsLoadLoading(true)
        else if (testType === 'stress') setIsStressLoading(true)
        else if (testType === 'spike') setIsSpikeLoading(true)
        else if (testType === 'soak' || testType === 'endurance') setIsSoakLoading(true)

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
        else if (testType === 'endurance' || testType === 'soak') {
            setActiveModule('soak')
            pollTestStatus(testId)
        }
    }

    // Load test state
    const [loadTestConfig, setLoadTestConfig] = useState<{
        virtualUsers: number | string
        duration: number | string
        rampUp: number | string
    }>({
        virtualUsers: 50,
        duration: 60,
        rampUp: 10
    })
    const [isRunningLoadTest, setIsRunningLoadTest] = useState(false)

    const handleLoadTest = async () => {
        if (!loadTargetUrl) return
        setIsLoadLoading(true)
        setIsLoading(true)
        setIsRunningLoadTest(true)
        setLoadTestResult(null)
        setProgress(0)

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
                    target_url: loadTargetUrl,
                    target_method: "GET",
                    target_headers: {},
                    virtual_users: Number(loadTestConfig.virtualUsers) || 50,
                    duration_seconds: Number(loadTestConfig.duration) || 60,
                    ramp_up_seconds: Number(loadTestConfig.rampUp) || 10
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

                setIsLoading(false)
                toast.error(errorMessage)
            }
        } catch (error: any) {
            console.error('Load test failed:', error)
            setIsLoading(false)
            toast.error(error.message || 'Failed to start load test')
        } finally {
            setIsRunningLoadTest(false)
        }
    }

    // Stress test state
    const [stressTestConfig, setStressTestConfig] = useState<{
        startVUs: number | string
        maxVUs: number | string
        stepIncrease: number | string
        stepDuration: number | string
    }>({
        startVUs: 10,
        maxVUs: 500,
        stepIncrease: 50,
        stepDuration: 30
    })
    const [isRunningStressTest, setIsRunningStressTest] = useState(false)

    const handleStressTest = async () => {
        if (!stressTargetUrl) return
        setIsStressLoading(true)
        setIsLoading(true)
        setIsRunningStressTest(true)
        setLoadTestResult(null)
        setProgress(0)

        try {
            const token = localStorage.getItem('access_token')
            const response = await fetch(`${API_URL}/api/v1/performance/stress-test?project_id=${projectId}`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({
                    target_url: stressTargetUrl,
                    target_method: "GET",
                    target_headers: {},
                    start_vus: Number(stressTestConfig.startVUs) || 10,
                    max_vus: Number(stressTestConfig.maxVUs) || 500,
                    step_duration_seconds: Number(stressTestConfig.stepDuration) || 30,
                    step_increase: Number(stressTestConfig.stepIncrease) || 50
                })
            })

            if (response.ok) {
                const data = await response.json()
                pollTestStatus(data.id)
            } else {
                setIsLoading(false)
                toast.error('Failed to start stress test')
            }
        } catch (error: any) {
            console.error('Stress test failed:', error)
            setIsLoading(false)
            toast.error(error.message || 'Failed to start stress test')
        } finally {
            setIsRunningStressTest(false)
        }
    }

    // Spike test state
    const [spikeTestConfig, setSpikeTestConfig] = useState<{
        normalLoad: number | string
        spikeLoad: number | string
        duration: number | string
    }>({
        normalLoad: 10,
        spikeLoad: 1000,
        duration: 120
    })
    const [isRunningSpikeTest, setIsRunningSpikeTest] = useState(false)

    const handleSpikeTest = async () => {
        if (!spikeTargetUrl) return
        setIsSpikeLoading(true)
        setIsLoading(true)
        setIsRunningSpikeTest(true)
        setProgress(0)

        try {
            const token = localStorage.getItem('access_token')
            const response = await fetch(`${API_URL}/api/v1/performance/spike-test?project_id=${projectId}`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({
                    target_url: spikeTargetUrl,
                    target_method: "GET",
                    target_headers: {},
                    base_users: Number(spikeTestConfig.normalLoad) || 10,
                    spike_users: Number(spikeTestConfig.spikeLoad) || 1000,
                    total_duration_seconds: Number(spikeTestConfig.duration) || 120,
                    spike_duration_seconds: Math.floor((Number(spikeTestConfig.duration) || 120) * 0.4) // Approximate
                })
            })

            if (response.ok) {
                const data = await response.json()
                pollTestStatus(data.id)
            } else {
                setIsLoading(false)
                toast.error('Failed to start spike test')
            }
        } catch (error: any) {
            console.error('Spike test failed:', error)
            setIsLoading(false)
            toast.error(error.message || 'Failed to start spike test')
        } finally {
            setIsRunningSpikeTest(false)
        }
    }

    // Soak test state
    const [soakTestConfig, setSoakTestConfig] = useState<{
        virtualUsers: number | string
        durationHours: number | string
    }>({
        virtualUsers: 50,
        durationHours: 4
    })
    const [isRunningSoakTest, setIsRunningSoakTest] = useState(false)

    const handleSoakTest = async () => {
        if (!soakTargetUrl) return
        setIsSoakLoading(true)
        setIsLoading(true)
        setIsRunningSoakTest(true)
        setProgress(0)

        try {
            const token = localStorage.getItem('access_token')
            const response = await fetch(`${API_URL}/api/v1/performance/soak-test?project_id=${projectId}`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({
                    target_url: soakTargetUrl,
                    target_method: "GET",
                    target_headers: {},
                    virtual_users: Number(soakTestConfig.virtualUsers) || 50,
                    duration_seconds: (Number(soakTestConfig.durationHours) || 4) * 3600,
                    ramp_up_seconds: 60
                })
            })

            if (response.ok) {
                const data = await response.json()
                pollTestStatus(data.id)
            } else {
                setIsLoading(false)
                toast.error('Failed to start soak test')
            }
        } catch (error: any) {
            console.error('Soak test failed:', error)
            setIsLoading(false)
            toast.error(error.message || 'Failed to start soak test')
        } finally {
            setIsRunningSoakTest(false)
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
                        ttfb: metrics.time_to_first_byte || 0,
                        opportunities: metrics.opportunities || [],
                        diagnostics: metrics.diagnostics || [],
                        raw_response: metrics.raw_response
                    })
                    setTargetUrl(test.target_url)
                    setSelectedHistoryId(testId)
                    setActiveModule('lighthouse')
                    fetchLighthouseHistory()
                } else if (['load', 'stress', 'spike', 'endurance', 'soak'].includes(test.test_type)) {
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

                    // Map test type to module
                    let moduleName = 'load'
                    if (test.test_type === 'stress') {
                        moduleName = 'stress'
                        setStressTargetUrl(test.target_url)
                    }
                    else if (test.test_type === 'spike') {
                        moduleName = 'spike'
                        setSpikeTargetUrl(test.target_url)
                    }
                    else if (test.test_type === 'endurance' || test.test_type === 'soak') {
                        moduleName = 'soak'
                        setSoakTargetUrl(test.target_url)
                    } else {
                        setLoadTargetUrl(test.target_url)
                    }

                    setActiveModule(moduleName as any)
                } else {
                    setActiveModule('results')
                }
            }
        } catch (error) {
            console.error('Failed to fetch test details:', error)
        }
    }

    const loadLighthouseReport = async (testId: string) => {
        setIsLoading(true)
        setIsLighthouseLoading(true)
        setSelectedHistoryId(testId)
        try {
            const token = localStorage.getItem('access_token')
            const response = await fetch(`${API_URL}/api/v1/performance/tests/${testId}`, {
                method: 'GET',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                credentials: 'include'
            })

            if (response.ok) {
                const test = await response.json()
                console.log('Test details response:', test)
                const metrics = test.metrics || {}
                console.log('Metric raw_response:', metrics.raw_response)

                setLighthouseResult({
                    performance: metrics.performance_score || 0,
                    accessibility: metrics.accessibility_score || 0,
                    bestPractices: metrics.best_practices_score || 0,
                    seo: metrics.seo_score || 0,
                    lcp: metrics.largest_contentful_paint || 0,
                    fid: metrics.first_input_delay || 0,
                    cls: metrics.cumulative_layout_shift || 0,
                    fcp: metrics.first_contentful_paint || 0,
                    ttfb: metrics.time_to_first_byte || 0,
                    opportunities: metrics.opportunities || [],
                    diagnostics: metrics.diagnostics || [],
                    raw_response: metrics.raw_response
                })
                setLhTargetUrl(test.target_url)
                if (test.device_type) setLhDevice(test.device_type)
                if (test.audit_mode) setLhMode(test.audit_mode as any)

                if (test.categories) {
                    const cats = typeof test.categories === 'string' ? JSON.parse(test.categories) : test.categories
                    if (Array.isArray(cats)) {
                        const newCats: any = {
                            performance: cats.includes('performance'),
                            accessibility: cats.includes('accessibility'),
                            bestPractices: cats.includes('best-practices') || cats.includes('bestPractices'),
                            seo: cats.includes('seo')
                        }
                        setLhCategories(newCats)
                    } else if (typeof cats === 'object') {
                        setLhCategories({
                            performance: !!cats.performance,
                            accessibility: !!cats.accessibility,
                            bestPractices: !!(cats.bestPractices || cats['best-practices']),
                            seo: !!cats.seo
                        })
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load lighthouse report:', error)
        } finally {
            setIsLoading(false)
            setIsLighthouseLoading(false)
        }
    }

    return (
        <div className="flex flex-col min-h-screen bg-white">
            {/* Top Bar with Logo and Profile */}
            <div className="border-b border-gray-200 bg-white">
                <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CircuitLogoIcon className="w-8 h-8" />
                        <h1 className="text-lg font-bold text-gray-800 tracking-tight">
                            Cogni<span className="text-primary">Test</span>
                        </h1>
                    </div>
                    <UserNav />
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

            {/* Horizontal Tab Navigation */}
            <div className="border-b border-gray-300 bg-gradient-to-r from-slate-50 via-gray-50 to-stone-50">
                <div className="px-6 py-3 flex items-center gap-4 overflow-x-auto">
                    <button
                        onClick={() => setActiveModule('overview')}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md transition-colors whitespace-nowrap ${activeModule === 'overview'
                            ? 'text-primary bg-white border-b-2 border-primary shadow-sm'
                            : 'text-gray-600 hover:text-primary hover:bg-white/50'
                            }`}
                    >
                        <Gauge className="w-4 h-4" />
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveModule('tests')}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md transition-colors whitespace-nowrap ${activeModule === 'tests'
                            ? 'text-primary bg-white border-b-2 border-primary shadow-sm'
                            : 'text-gray-600 hover:text-primary hover:bg-white/50'
                            }`}
                    >
                        <List className="w-4 h-4" />
                        Saved Tests
                    </button>
                    <button
                        onClick={() => setActiveModule('lighthouse')}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md transition-colors whitespace-nowrap ${activeModule === 'lighthouse'
                            ? 'text-primary bg-white border-b-2 border-primary shadow-sm'
                            : 'text-gray-600 hover:text-primary hover:bg-white/50'
                            }`}
                    >
                        <Zap className="w-4 h-4" />
                        Lighthouse
                    </button>
                    <button
                        onClick={() => setActiveModule('load')}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md transition-colors whitespace-nowrap ${activeModule === 'load'
                            ? 'text-primary bg-white border-b-2 border-primary shadow-sm'
                            : 'text-gray-600 hover:text-primary hover:bg-white/50'
                            }`}
                    >
                        <TrendingUp className="w-4 h-4" />
                        Load Test
                    </button>
                    <button
                        onClick={() => setActiveModule('stress')}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md transition-colors whitespace-nowrap ${activeModule === 'stress'
                            ? 'text-primary bg-white border-b-2 border-primary shadow-sm'
                            : 'text-gray-600 hover:text-primary hover:bg-white/50'
                            }`}
                    >
                        <Activity className="w-4 h-4" />
                        Stress Test
                    </button>
                    <button
                        onClick={() => setActiveModule('spike')}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md transition-colors whitespace-nowrap ${activeModule === 'spike'
                            ? 'text-primary bg-white border-b-2 border-primary shadow-sm'
                            : 'text-gray-600 hover:text-primary hover:bg-white/50'
                            }`}
                    >
                        <Zap className="w-4 h-4" />
                        Spike Test
                    </button>
                    <button
                        onClick={() => setActiveModule('soak')}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md transition-colors whitespace-nowrap ${activeModule === 'soak'
                            ? 'text-primary bg-white border-b-2 border-primary shadow-sm'
                            : 'text-gray-600 hover:text-primary hover:bg-white/50'
                            }`}
                    >
                        <Clock className="w-4 h-4" />
                        Soak Test
                    </button>
                    <button
                        onClick={() => setActiveModule('results')}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md transition-colors whitespace-nowrap ${activeModule === 'results'
                            ? 'text-primary bg-white border-b-2 border-primary shadow-sm'
                            : 'text-gray-600 hover:text-primary hover:bg-white/50'
                            }`}
                    >
                        <BarChart3 className="w-4 h-4" />
                        Results
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto px-6 py-6">
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                className="bg-white rounded-xl p-6 border shadow-sm cursor-pointer hover:border-red-300 transition-colors"
                                onClick={() => setActiveModule('spike')}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                                        <Zap className="w-6 h-6 text-red-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Spike Test</h3>
                                        <p className="text-sm text-gray-500">Test sudden bursts</p>
                                    </div>
                                </div>
                            </div>

                            <div
                                className="bg-white rounded-xl p-6 border shadow-sm cursor-pointer hover:border-indigo-300 transition-colors"
                                onClick={() => setActiveModule('soak')}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                                        <Clock className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Soak Test</h3>
                                        <p className="text-sm text-gray-500">Long duration monitoring</p>
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
                            onEditTest={(test) => {
                                setTestToEdit(test)
                                setShowWizard(true)
                            }}
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

                        <div className="bg-white rounded-xl p-6 border shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-6 border-b pb-4">Configuration</h3>
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                    {/* URL Input */}
                                    <div className="md:col-span-2">
                                        <Label htmlFor="lighthouse-url" className="text-sm font-medium text-gray-700">Target URL</Label>
                                        <Input
                                            id="lighthouse-url"
                                            placeholder="https://example.com"
                                            value={lhTargetUrl}
                                            onChange={(e) => setLhTargetUrl(e.target.value)}
                                            className="mt-2"
                                        />
                                        <p className="text-xs text-gray-500 mt-2">The URL to perform the audit on.</p>
                                    </div>

                                    {/* Device Select */}
                                    <div>
                                        <Label className="text-sm font-medium text-gray-700">Device</Label>
                                        <RadioGroup
                                            defaultValue="mobile"
                                            value={lhDevice}
                                            onValueChange={(val: any) => setLhDevice(val)}
                                            className="mt-3 space-y-2"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="mobile" id="lh-mobile" />
                                                <Label htmlFor="lh-mobile" className="font-normal cursor-pointer">Mobile</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="desktop" id="lh-desktop" />
                                                <Label htmlFor="lh-desktop" className="font-normal cursor-pointer">Desktop</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>

                                    {/* Run Button */}
                                    <div className="flex items-end">
                                        <Button
                                            className="bg-teal-600 hover:bg-teal-700 w-full"
                                            onClick={handleLighthouseScan}
                                            disabled={isLighthouseLoading || !lhTargetUrl}
                                        >
                                            {isLighthouseLoading ? (
                                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <Play className="w-4 h-4 mr-2" />
                                            )}
                                            {lhMode === 'navigation' ? 'Analyze page load' :
                                                lhMode === 'timespan' ? 'Start timespan' :
                                                    'Analyze page state'}
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t">
                                    {/* Mode Select */}
                                    <div>
                                        <Label className="text-sm font-medium text-gray-700">Audit Mode</Label>
                                        <RadioGroup
                                            defaultValue="navigation"
                                            value={lhMode}
                                            onValueChange={(val: any) => setLhMode(val)}
                                            className="mt-3 space-y-3"
                                        >
                                            <div className="flex items-start space-x-3">
                                                <RadioGroupItem value="navigation" id="mode-nav" className="mt-1" />
                                                <div>
                                                    <Label htmlFor="mode-nav" className="font-medium cursor-pointer">Navigation (Default)</Label>
                                                    <p className="text-xs text-gray-500">Analyze a single page load.</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start space-x-3">
                                                <RadioGroupItem value="timespan" id="mode-time" className="mt-1" />
                                                <div>
                                                    <Label htmlFor="mode-time" className="font-medium cursor-pointer">Timespan</Label>
                                                    <p className="text-xs text-gray-500">Analyze a period of time.</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start space-x-3">
                                                <RadioGroupItem value="snapshot" id="mode-snap" className="mt-1" />
                                                <div>
                                                    <Label htmlFor="mode-snap" className="font-medium cursor-pointer">Snapshot</Label>
                                                    <p className="text-xs text-gray-500">Analyze the page at a specific state.</p>
                                                </div>
                                            </div>
                                        </RadioGroup>
                                    </div>

                                    {/* Categories */}
                                    <div>
                                        <Label className="text-sm font-medium text-gray-700">Categories</Label>
                                        <div className="mt-3 grid grid-cols-2 gap-4">
                                            <div className="flex items-center space-x-3">
                                                <Checkbox
                                                    id="cat-perf"
                                                    checked={lhCategories.performance}
                                                    onCheckedChange={(checked) => setLhCategories(prev => ({ ...prev, performance: checked }))}
                                                />
                                                <Label htmlFor="cat-perf" className="font-normal cursor-pointer">Performance</Label>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <Checkbox
                                                    id="cat-acc"
                                                    checked={lhCategories.accessibility}
                                                    onCheckedChange={(checked) => setLhCategories(prev => ({ ...prev, accessibility: checked }))}
                                                />
                                                <Label htmlFor="cat-acc" className="font-normal cursor-pointer">Accessibility</Label>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <Checkbox
                                                    id="cat-bp"
                                                    checked={lhCategories.bestPractices}
                                                    onCheckedChange={(checked) => setLhCategories(prev => ({ ...prev, bestPractices: checked }))}
                                                />
                                                <Label htmlFor="cat-bp" className="font-normal cursor-pointer">Best practices</Label>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <Checkbox
                                                    id="cat-seo"
                                                    checked={lhCategories.seo}
                                                    onCheckedChange={(checked) => setLhCategories(prev => ({ ...prev, seo: checked }))}
                                                />
                                                <Label htmlFor="cat-seo" className="font-normal cursor-pointer">SEO</Label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Core Web Vitals Explanation (Moved inside main content if needed, but keeping it here for now) */}

                        {/* Results or Placeholder with History Sidebar */}
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* History Sidebar */}
                            {lighthouseHistory.length > 0 && (
                                <div className="w-full md:w-64 flex-shrink-0">
                                    <div className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col h-full sticky top-6">
                                        <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                                <HistoryIcon className="w-4 h-4 text-teal-600" />
                                                Audit History
                                            </h3>
                                            <span className="text-[10px] text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded-full font-medium">
                                                {lighthouseHistory.length}
                                            </span>
                                        </div>
                                        <div className="overflow-y-auto max-h-[800px] divide-y divide-gray-100">
                                            {lighthouseHistory.map((item) => {
                                                const date = new Date(item.created_at)
                                                const isSelected = selectedHistoryId === item.id
                                                let hostname = 'Unknown'
                                                try {
                                                    hostname = new URL(item.target_url).hostname
                                                } catch (e) {
                                                    hostname = item.target_url
                                                }

                                                return (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => loadLighthouseReport(item.id)}
                                                        className={cn(
                                                            "w-full text-left p-3 hover:bg-gray-50 transition-all flex flex-col gap-1 border-l-4",
                                                            isSelected ? "bg-teal-50 border-l-teal-600" : "border-l-transparent"
                                                        )}
                                                    >
                                                        <div className={cn("text-xs font-semibold truncate", isSelected ? "text-teal-700" : "text-gray-900")}>
                                                            {item.name || hostname}
                                                        </div>
                                                        <div className="text-[10px] text-gray-500 flex items-center justify-between">
                                                            <span>{date.toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                                            <span className="font-mono">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Main Results Area */}
                            <div className="flex-1 min-w-0">
                                {lighthouseResult ? (
                                    <LighthouseReport data={lighthouseResult.raw_response} />
                                ) : (
                                    <div className="bg-white rounded-xl p-12 border shadow-sm text-center">
                                        <Zap className="w-20 h-20 text-teal-100 mx-auto mb-6" />
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">Run Your First Audit</h3>
                                        <p className="text-gray-500 max-w-sm mx-auto mb-8">
                                            Enter a URL above and click "Analyze" to see performance, accessibility, best practices, and SEO scores.
                                        </p>
                                        {!isLighthouseLoading && (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mt-8 pt-8 border-t">
                                                <div className="text-center">
                                                    <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-3">
                                                        <TrendingUp className="w-5 h-5 text-teal-600" />
                                                    </div>
                                                    <h4 className="text-xs font-bold text-gray-900">Performance</h4>
                                                    <p className="text-[10px] text-gray-500 mt-1">Optimize speed and responsiveness</p>
                                                </div>
                                                <div className="text-center">
                                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
                                                        <Shield className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <h4 className="text-xs font-bold text-gray-900">Accessibility</h4>
                                                    <p className="text-[10px] text-gray-500 mt-1">Ensure site works for everyone</p>
                                                </div>
                                                <div className="text-center">
                                                    <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-3">
                                                        <Globe className="w-5 h-5 text-purple-600" />
                                                    </div>
                                                    <h4 className="text-xs font-bold text-gray-900">SEO</h4>
                                                    <p className="text-[10px] text-gray-500 mt-1">Improve search engine ranking</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {isLighthouseLoading && !lighthouseResult && (
                            <div className="bg-white rounded-xl p-8 border shadow-sm text-center">
                                <RefreshCw className="w-16 h-16 text-teal-600 mx-auto mb-4 animate-spin" />
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Running Audit...</h3>
                                <p className="text-gray-500 mb-4">Analyzing performance for {lhTargetUrl}</p>
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
                                        value={loadTargetUrl}
                                        onChange={(e) => setLoadTargetUrl(e.target.value)}
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
                                        onChange={(e) => setLoadTestConfig(prev => ({ ...prev, virtualUsers: e.target.value === '' ? '' : parseInt(e.target.value) }))}
                                        className={cn("mt-1", (Number(loadTestConfig.virtualUsers) > 2000 || Number(loadTestConfig.virtualUsers) < 1) && loadTestConfig.virtualUsers !== '' ? "border-red-500 focus-visible:ring-red-500" : "")}
                                    />
                                    {Number(loadTestConfig.virtualUsers) > 2000 && <p className="text-xs text-red-500 mt-1">Maximum limit reached (2000)</p>}
                                    {Number(loadTestConfig.virtualUsers) < 1 && loadTestConfig.virtualUsers !== '' && <p className="text-xs text-red-500 mt-1">Minimum value is 1</p>}
                                </div>
                                <div>
                                    <Label>Duration (sec)</Label>
                                    <Input
                                        type="number"
                                        value={loadTestConfig.duration}
                                        onChange={(e) => setLoadTestConfig(prev => ({ ...prev, duration: e.target.value === '' ? '' : parseInt(e.target.value) }))}
                                        className={cn("mt-1", (Number(loadTestConfig.duration) > 3600 || Number(loadTestConfig.duration) < 1) && loadTestConfig.duration !== '' ? "border-red-500 focus-visible:ring-red-500" : "")}
                                    />
                                    {Number(loadTestConfig.duration) > 3600 && <p className="text-xs text-red-500 mt-1">Maximum limit reached (3600s)</p>}
                                    {Number(loadTestConfig.duration) < 1 && loadTestConfig.duration !== '' && <p className="text-xs text-red-500 mt-1">Minimum value is 1</p>}
                                </div>
                                <div className="flex items-end">
                                    <Button
                                        onClick={handleLoadTest}
                                        disabled={
                                            !loadTargetUrl ||
                                            isLoadLoading ||
                                            Number(loadTestConfig.virtualUsers) < 1 ||
                                            Number(loadTestConfig.virtualUsers) > 2000 ||
                                            Number(loadTestConfig.duration) < 1 ||
                                            Number(loadTestConfig.duration) > 3600
                                        }
                                        className="bg-purple-600 hover:bg-purple-700 w-full"
                                    >
                                        {isLoadLoading ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                                Running...
                                            </>
                                        ) : (
                                            <>
                                                <Play className="w-4 h-4 mr-2" />
                                                Start
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar for Load Test */}
                        {isLoadLoading && activeModule === 'load' && (
                            <div className="bg-white rounded-xl p-8 border border-purple-100 shadow-sm text-center">
                                <RefreshCw className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-spin" />
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Executing Load Test...</h3>
                                <p className="text-gray-500 mb-4">Simulating {loadTestConfig.virtualUsers} users on {loadTargetUrl}</p>
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
                                    <LatencyDistributionChart
                                        p50={loadTestResult.p50}
                                        p75={loadTestResult.p75}
                                        p90={loadTestResult.p90}
                                        p95={loadTestResult.p95}
                                        p99={loadTestResult.p99}
                                        max={loadTestResult.max}
                                    />
                                    <RealTimeMetricsChart data={loadTestResult.timeline} />
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
                                            value={stressTargetUrl}
                                            onChange={(e) => setStressTargetUrl(e.target.value)}
                                            placeholder="https://api.example.com/stress-endpoint"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label>Start VUs</Label>
                                        <Input
                                            type="number"
                                            value={stressTestConfig.startVUs}
                                            onChange={(e) => setStressTestConfig(prev => ({ ...prev, startVUs: e.target.value === '' ? '' : parseInt(e.target.value) }))}
                                            className={cn("mt-1", (Number(stressTestConfig.startVUs) > 1000 || Number(stressTestConfig.startVUs) < 1) && stressTestConfig.startVUs !== '' ? "border-red-500 focus-visible:ring-red-500" : "")}
                                        />
                                        {Number(stressTestConfig.startVUs) > 1000 && <p className="text-xs text-red-500 mt-1">Maximum limit reached (1000)</p>}
                                        {Number(stressTestConfig.startVUs) < 1 && stressTestConfig.startVUs !== '' && <p className="text-xs text-red-500 mt-1">Minimum value is 1</p>}
                                    </div>
                                    <div>
                                        <Label>Max VUs</Label>
                                        <Input
                                            type="number"
                                            value={stressTestConfig.maxVUs}
                                            onChange={(e) => setStressTestConfig(prev => ({ ...prev, maxVUs: e.target.value === '' ? '' : parseInt(e.target.value) }))}
                                            className={cn("mt-1", (Number(stressTestConfig.maxVUs) > 2000 || Number(stressTestConfig.maxVUs) < 1) && stressTestConfig.maxVUs !== '' ? "border-red-500 focus-visible:ring-red-500" : "")}
                                        />
                                        {Number(stressTestConfig.maxVUs) > 2000 && <p className="text-xs text-red-500 mt-1">Maximum limit reached (2000)</p>}
                                        {Number(stressTestConfig.maxVUs) < 1 && stressTestConfig.maxVUs !== '' && <p className="text-xs text-red-500 mt-1">Minimum value is 1</p>}
                                    </div>
                                    <div className="flex items-end">
                                        <Button
                                            className="w-full bg-orange-600 hover:bg-orange-700"
                                            onClick={handleStressTest}
                                            disabled={
                                                !stressTargetUrl ||
                                                isStressLoading ||
                                                Number(stressTestConfig.startVUs) < 1 ||
                                                Number(stressTestConfig.startVUs) > 1000 ||
                                                Number(stressTestConfig.maxVUs) < 1 ||
                                                Number(stressTestConfig.maxVUs) > 2000
                                            }
                                        >
                                            {isStressLoading ? (
                                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <Activity className="w-4 h-4 mr-2" />
                                            )}
                                            {isStressLoading ? 'Running...' : 'Start Stress Test'}
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 mt-4">
                                    The test will gradually increase virtual users from the start value to max, recording the breaking point.
                                </p>
                            </div>

                            {/* Progress Bar for Stress Test */}
                            {isStressLoading && activeModule === 'stress' && (
                                <div className="bg-white rounded-xl p-8 border border-orange-100 shadow-sm text-center">
                                    <RefreshCw className="w-16 h-16 text-orange-600 mx-auto mb-4 animate-spin" />
                                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Executing Stress Test...</h3>
                                    <p className="text-gray-500 mb-4">Ramping up from {stressTestConfig.startVUs} to {stressTestConfig.maxVUs} VUs</p>
                                    <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-2.5">
                                        <div className="bg-orange-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                    </div>
                                    <p className="text-sm text-gray-400 mt-2">{progress}% completed</p>
                                </div>
                            )}

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
                                            value={spikeTargetUrl}
                                            onChange={(e) => setSpikeTargetUrl(e.target.value)}
                                            placeholder="https://api.example.com/endpoint"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label>Normal Load (VUs)</Label>
                                        <Input
                                            type="number"
                                            value={spikeTestConfig.normalLoad}
                                            onChange={(e) => setSpikeTestConfig(prev => ({ ...prev, normalLoad: e.target.value === '' ? '' : parseInt(e.target.value) }))}
                                            className={cn("mt-1", (Number(spikeTestConfig.normalLoad) > 1000 || Number(spikeTestConfig.normalLoad) < 1) && spikeTestConfig.normalLoad !== '' ? "border-red-500 focus-visible:ring-red-500" : "")}
                                        />
                                        {Number(spikeTestConfig.normalLoad) > 1000 && <p className="text-xs text-red-500 mt-1">Maximum limit reached (1000)</p>}
                                        {Number(spikeTestConfig.normalLoad) < 1 && spikeTestConfig.normalLoad !== '' && <p className="text-xs text-red-500 mt-1">Minimum value is 1</p>}
                                    </div>
                                    <div>
                                        <Label>Spike Load (VUs)</Label>
                                        <Input
                                            type="number"
                                            value={spikeTestConfig.spikeLoad}
                                            onChange={(e) => setSpikeTestConfig(prev => ({ ...prev, spikeLoad: e.target.value === '' ? '' : parseInt(e.target.value) }))}
                                            className={cn("mt-1", (Number(spikeTestConfig.spikeLoad) > 2000 || Number(spikeTestConfig.spikeLoad) < 1) && spikeTestConfig.spikeLoad !== '' ? "border-red-500 focus-visible:ring-red-500" : "")}
                                        />
                                        {Number(spikeTestConfig.spikeLoad) > 2000 && <p className="text-xs text-red-500 mt-1">Maximum limit reached (2000)</p>}
                                        {Number(spikeTestConfig.spikeLoad) < 1 && spikeTestConfig.spikeLoad !== '' && <p className="text-xs text-red-500 mt-1">Minimum value is 1</p>}
                                    </div>
                                    <div className="flex items-end">
                                        <Button
                                            className="w-full bg-red-600 hover:bg-red-700"
                                            onClick={handleSpikeTest}
                                            disabled={
                                                !spikeTargetUrl ||
                                                isSpikeLoading ||
                                                Number(spikeTestConfig.normalLoad) < 1 ||
                                                Number(spikeTestConfig.normalLoad) > 1000 ||
                                                Number(spikeTestConfig.spikeLoad) < 1 ||
                                                Number(spikeTestConfig.spikeLoad) > 2000
                                            }
                                        >
                                            {isSpikeLoading ? (
                                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <Zap className="w-4 h-4 mr-2" />
                                            )}
                                            {isSpikeLoading ? 'Running...' : 'Start Spike Test'}
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 mt-4">
                                    Simulates a sudden surge of users (e.g., flash sale) to test system resilience.
                                </p>
                            </div>

                            {/* Progress Bar for Spike Test */}
                            {isSpikeLoading && activeModule === 'spike' && (
                                <div className="bg-white rounded-xl p-8 border border-red-100 shadow-sm text-center">
                                    <RefreshCw className="w-16 h-16 text-red-600 mx-auto mb-4 animate-spin" />
                                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Executing Spike Test...</h3>
                                    <p className="text-gray-500 mb-4">Simulating burst of {spikeTestConfig.spikeLoad} users</p>
                                    <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-2.5">
                                        <div className="bg-red-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                    </div>
                                    <p className="text-sm text-gray-400 mt-2">{progress}% completed</p>
                                </div>
                            )}

                            <div className="bg-white rounded-xl p-8 border shadow-sm text-center">
                                <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Spike Recovery Analysis</h3>
                                <p className="text-gray-500">Start a spike test to measure system recovery time.</p>
                            </div>
                        </div>
                    )
                }

                {/* Soak Test Tab */}
                {
                    activeModule === 'soak' && (
                        <div className="space-y-6">
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">Soak Testing</h2>
                                <p className="text-sm text-gray-500">Run sustained load for extended periods to detect memory leaks</p>
                            </div>

                            <div className="bg-white rounded-xl p-6 border shadow-sm">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Configure Soak Test</h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="md:col-span-2">
                                        <Label htmlFor="endurance-url">Target URL</Label>
                                        <Input
                                            id="endurance-url"
                                            value={soakTargetUrl}
                                            onChange={(e) => setSoakTargetUrl(e.target.value)}
                                            placeholder="https://api.example.com/endpoint"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label>Virtual Users</Label>
                                        <Input
                                            type="number"
                                            value={soakTestConfig.virtualUsers}
                                            onChange={(e) => setSoakTestConfig(prev => ({ ...prev, virtualUsers: e.target.value === '' ? '' : parseInt(e.target.value) }))}
                                            className={cn("mt-1", (Number(soakTestConfig.virtualUsers) > 2000 || Number(soakTestConfig.virtualUsers) < 1) && soakTestConfig.virtualUsers !== '' ? "border-red-500 focus-visible:ring-red-500" : "")}
                                        />
                                        {Number(soakTestConfig.virtualUsers) > 2000 && <p className="text-xs text-red-500 mt-1">Maximum limit reached (2000)</p>}
                                        {Number(soakTestConfig.virtualUsers) < 1 && soakTestConfig.virtualUsers !== '' && <p className="text-xs text-red-500 mt-1">Minimum value is 1</p>}
                                    </div>
                                    <div>
                                        <Label>Duration (hours)</Label>
                                        <Input
                                            type="number"
                                            value={soakTestConfig.durationHours}
                                            onChange={(e) => setSoakTestConfig(prev => ({ ...prev, durationHours: e.target.value === '' ? '' : parseInt(e.target.value) }))}
                                            min="1"
                                            max="24"
                                            className={cn("mt-1", (Number(soakTestConfig.durationHours) > 24 || Number(soakTestConfig.durationHours) < 1) && soakTestConfig.durationHours !== '' ? "border-red-500 focus-visible:ring-red-500" : "")}
                                        />
                                        {Number(soakTestConfig.durationHours) > 24 && <p className="text-xs text-red-500 mt-1">Maximum limit reached (24)</p>}
                                        {Number(soakTestConfig.durationHours) < 1 && soakTestConfig.durationHours !== '' && <p className="text-xs text-red-500 mt-1">Minimum value is 1</p>}
                                    </div>
                                    <div className="flex items-end">
                                        <Button
                                            className="w-full bg-indigo-600 hover:bg-indigo-700"
                                            onClick={handleSoakTest}
                                            disabled={
                                                !soakTargetUrl ||
                                                isSoakLoading ||
                                                Number(soakTestConfig.virtualUsers) < 1 ||
                                                Number(soakTestConfig.virtualUsers) > 2000 ||
                                                Number(soakTestConfig.durationHours) < 1 ||
                                                Number(soakTestConfig.durationHours) > 24
                                            }
                                        >
                                            {isSoakLoading ? (
                                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <Clock className="w-4 h-4 mr-2" />
                                            )}
                                            {isSoakLoading ? 'Running...' : 'Start Soak Test'}
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 mt-4">
                                    Tests system stability over extended periods to identify memory leaks and resource degradation.
                                </p>
                            </div>

                            {/* Progress Bar for Soak Test */}
                            {isSoakLoading && activeModule === 'soak' && (
                                <div className="bg-white rounded-xl p-8 border border-indigo-100 shadow-sm text-center">
                                    <RefreshCw className="w-16 h-16 text-indigo-600 mx-auto mb-4 animate-spin" />
                                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Executing Soak Test...</h3>
                                    <p className="text-gray-500 mb-4">Sustaining {soakTestConfig.virtualUsers} users for {soakTestConfig.durationHours} hours</p>
                                    <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-2.5">
                                        <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                    </div>
                                    <p className="text-sm text-gray-400 mt-2">{progress}% completed</p>
                                </div>
                            )}

                            <div className="bg-white rounded-xl p-8 border shadow-sm text-center">
                                <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Soak Analysis</h3>
                                <p className="text-gray-500">Start a soak test to monitor system health over time.</p>
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

                {/* Create Test Wizard Dialog */}
                <Dialog open={showWizard} onOpenChange={setShowWizard}>
                    <DialogContent className="max-w-2xl p-0 overflow-hidden">
                        <DialogTitle className="sr-only">Create Performance Test</DialogTitle>
                        <PerformanceTestWizard
                            projectId={projectId}
                            editMode={!!testToEdit}
                            initialData={testToEdit}
                            onComplete={testToEdit ? handleUpdateTest : handleTestCreated}
                            onCancel={() => {
                                setShowWizard(false)
                                setTestToEdit(null)
                            }}
                        />
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}
