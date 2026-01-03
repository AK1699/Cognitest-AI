/**
 * Performance Testing API Client
 * Provides typed interface for all performance testing endpoints
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

// Helper to get auth headers
const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('access_token')
    return token ? { 'Authorization': `Bearer ${token}` } : {}
}

// Types
export interface LighthouseResult {
    id: string
    human_id: string
    target_url: string
    device_type: string
    status: string
    metrics: {
        performance_score: number
        accessibility_score: number
        best_practices_score: number
        seo_score: number
        largest_contentful_paint: number
        first_input_delay: number
        cumulative_layout_shift: number
        first_contentful_paint: number
        time_to_first_byte: number
        total_blocking_time: number
        speed_index: number
    }
    opportunities: Array<{
        id: string
        title: string
        description: string
        savings_ms?: number
        savings_bytes?: number
    }>
    diagnostics: Array<{
        id: string
        title: string
        description: string
        details?: Record<string, any>
    }>
    created_at: string
}

export interface LoadTestResult {
    id: string
    human_id: string
    test_type: 'load' | 'stress' | 'spike' | 'soak'
    target_url: string
    status: string
    config: {
        virtual_users: number
        duration_seconds: number
        ramp_up_seconds: number
        http_method: string
    }
    metrics: {
        total_requests: number
        successful_requests: number
        failed_requests: number
        requests_per_second: number
        avg_latency_ms: number
        min_latency_ms: number
        max_latency_ms: number
        p50_latency_ms: number
        p75_latency_ms: number
        p90_latency_ms: number
        p95_latency_ms: number
        p99_latency_ms: number
        success_rate: number
        bytes_sent: number
        bytes_received: number
    }
    timeline: Array<{
        timestamp: string
        rps: number
        latency: number
        errors: number
        active_vus: number
    }>
    created_at: string
    completed_at?: string
}

export interface PerformanceTest {
    id: string
    human_id: string
    name: string
    test_type: string
    status: string
    target_url: string
    created_at: string
    last_run_at?: string
    avg_score?: number
    total_runs: number
}

export interface DashboardStats {
    total_tests: number
    avg_performance_score: number | null
    pass_rate: number
    active_alerts: number
    tests_last_7_days: number
    avg_response_time: number | null
}

// API Functions
export const performanceAPI = {
    /**
     * Get dashboard statistics
     */
    async getDashboardStats(projectId: string): Promise<DashboardStats> {
        const response = await fetch(
            `${API_URL}/api/v1/performance/dashboard/${projectId}/stats`,
            {
                credentials: 'include',
                headers: getAuthHeaders()
            }
        )
        if (!response.ok) throw new Error('Failed to fetch dashboard stats')
        return response.json()
    },

    /**
     * Run a Lighthouse audit
     */
    async runLighthouseAudit(
        projectId: string,
        targetUrl: string,
        deviceType: 'mobile' | 'desktop' = 'mobile'
    ): Promise<LighthouseResult> {
        const response = await fetch(
            `${API_URL}/api/v1/performance/lighthouse?project_id=${projectId}`,
            {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify({
                    target_url: targetUrl,
                    device_type: deviceType
                })
            }
        )
        if (!response.ok) throw new Error('Lighthouse audit failed')
        return response.json()
    },

    /**
     * Run a load test
     */
    async runLoadTest(
        projectId: string,
        config: {
            targetUrl: string
            virtualUsers: number
            durationSeconds: number
            rampUpSeconds?: number
            httpMethod?: string
        }
    ): Promise<LoadTestResult> {
        const response = await fetch(
            `${API_URL}/api/v1/performance/load-test?project_id=${projectId}`,
            {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify({
                    target_url: config.targetUrl,
                    virtual_users: config.virtualUsers,
                    duration_seconds: config.durationSeconds,
                    ramp_up_seconds: config.rampUpSeconds || 10,
                    http_method: config.httpMethod || 'GET'
                })
            }
        )
        if (!response.ok) throw new Error('Load test failed')
        return response.json()
    },

    /**
     * Run a stress test
     */
    async runStressTest(
        projectId: string,
        config: {
            targetUrl: string
            startVUs: number
            maxVUs: number
            stepDuration: number
            stepSize: number
        }
    ): Promise<LoadTestResult> {
        const response = await fetch(
            `${API_URL}/api/v1/performance/stress-test?project_id=${projectId}`,
            {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify({
                    target_url: config.targetUrl,
                    start_vus: config.startVUs,
                    max_vus: config.maxVUs,
                    step_duration: config.stepDuration,
                    step_size: config.stepSize
                })
            }
        )
        if (!response.ok) throw new Error('Stress test failed')
        return response.json()
    },

    /**
     * List all performance tests
     */
    async listTests(projectId: string, options?: {
        testType?: string
        status?: string
        limit?: number
        offset?: number
    }): Promise<{ items: PerformanceTest[], total: number }> {
        const params = new URLSearchParams({ project_id: projectId })
        if (options?.testType) params.append('test_type', options.testType)
        if (options?.status) params.append('status', options.status)
        if (options?.limit) params.append('limit', String(options.limit))
        if (options?.offset) params.append('offset', String(options.offset))

        const response = await fetch(
            `${API_URL}/api/v1/performance/tests?${params}`,
            {
                credentials: 'include',
                headers: getAuthHeaders()
            }
        )
        if (!response.ok) throw new Error('Failed to list tests')
        return response.json()
    },

    /**
     * Get test details by ID
     */
    async getTest(testId: string): Promise<PerformanceTest> {
        const response = await fetch(
            `${API_URL}/api/v1/performance/tests/${testId}`,
            {
                credentials: 'include',
                headers: getAuthHeaders()
            }
        )
        if (!response.ok) throw new Error('Failed to get test')
        return response.json()
    },

    /**
     * Delete a test
     */
    async deleteTest(testId: string): Promise<void> {
        const response = await fetch(
            `${API_URL}/api/v1/performance/tests/${testId}`,
            {
                method: 'DELETE',
                credentials: 'include',
                headers: getAuthHeaders()
            }
        )
        if (!response.ok) throw new Error('Failed to delete test')
    },

    /**
     * Get AI analysis for a test
     */
    async getAIAnalysis(testId: string): Promise<{
        summary: string
        risk_level: 'low' | 'medium' | 'high' | 'critical'
        bottlenecks: Array<{
            type: string
            description: string
            impact: string
            recommendation: string
        }>
        recommendations: string[]
        optimization_score: number
    }> {
        const response = await fetch(
            `${API_URL}/api/v1/performance/tests/${testId}/ai-analysis`,
            {
                credentials: 'include',
                headers: getAuthHeaders()
            }
        )
        if (!response.ok) throw new Error('Failed to get AI analysis')
        return response.json()
    },

    /**
     * Export test report
     */
    async exportReport(
        testId: string,
        format: 'pdf' | 'html' | 'json'
    ): Promise<Blob> {
        const response = await fetch(
            `${API_URL}/api/v1/performance/tests/${testId}/report?format=${format}`,
            {
                credentials: 'include',
                headers: getAuthHeaders()
            }
        )
        if (!response.ok) throw new Error('Failed to export report')
        return response.blob()
    },

    /**
     * Schedule a recurring test
     */
    async scheduleTest(
        projectId: string,
        config: {
            name: string
            testType: string
            targetUrl: string
            schedule: string  // cron expression
            config: Record<string, any>
        }
    ): Promise<{ id: string, next_run: string }> {
        const response = await fetch(
            `${API_URL}/api/v1/performance/schedules?project_id=${projectId}`,
            {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify(config)
            }
        )
        if (!response.ok) throw new Error('Failed to schedule test')
        return response.json()
    },

    /**
     * Compare two test results
     */
    async compareTests(testId1: string, testId2: string): Promise<{
        baseline: PerformanceTest
        compare: PerformanceTest
        improvements: string[]
        regressions: string[]
        summary: string
    }> {
        const response = await fetch(
            `${API_URL}/api/v1/performance/compare?test1=${testId1}&test2=${testId2}`,
            {
                credentials: 'include',
                headers: getAuthHeaders()
            }
        )
        if (!response.ok) throw new Error('Failed to compare tests')
        return response.json()
    },

    /**
     * Get historical trend data
     */
    async getHistoricalTrends(
        projectId: string,
        days: number = 30
    ): Promise<Array<{
        date: string
        timestamp: number
        performance?: number
        lcp?: number
        fid?: number
        cls?: number
        rps?: number
        p95Latency?: number
    }>> {
        const response = await fetch(
            `${API_URL}/api/v1/performance/trends?project_id=${projectId}&days=${days}`,
            {
                credentials: 'include',
                headers: getAuthHeaders()
            }
        )
        if (!response.ok) throw new Error('Failed to get trends')
        return response.json()
    }
}

export default performanceAPI
