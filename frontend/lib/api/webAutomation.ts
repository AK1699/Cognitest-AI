import api from './index'

export interface TestFlow {
    id: string
    project_id: string
    organisation_id: string
    name: string
    description?: string
    status: 'draft' | 'active' | 'inactive' | 'archived'
    base_url: string
    flow_json: any
    nodes: any[]
    edges: any[]
    viewport: any
    default_browser: 'chrome' | 'firefox' | 'safari' | 'edge' | 'chromium'
    default_mode: 'headed' | 'headless'
    timeout: number
    retry_policy: string
    max_retries: number
    healing_enabled: boolean
    auto_update_selectors: boolean
    healing_confidence_threshold: number
    browser_options: any
    tags: string[]
    category?: string
    version: string
    total_executions: number
    successful_executions: number
    failed_executions: number
    average_duration: number
    healing_success_rate: number
    created_at: string
    updated_at: string
    last_executed_at?: string
}

export interface TestFlowCreate {
    name: string
    description?: string
    base_url?: string
    flow_json?: any
    nodes?: any[]
    edges?: any[]
    viewport?: any
    tags?: string[]
    category?: string
}

export interface TestFlowUpdate {
    name?: string
    description?: string
    status?: 'draft' | 'active' | 'inactive' | 'archived'
    base_url?: string
    flow_json?: any
    nodes?: any[]
    edges?: any[]
    viewport?: any
    default_browser?: string
    default_mode?: string
    timeout?: number
    healing_enabled?: boolean
    tags?: string[]
    category?: string
    steps?: any[]  // Test steps array
}

export const webAutomationApi = {
    listTestFlows: async (projectId: string) => {
        const response = await api.get<TestFlow[]>(`/api/v1/web-automation/projects/${projectId}/test-flows`)
        return response.data
    },

    getTestFlow: async (flowId: string) => {
        const response = await api.get<TestFlow>(`/api/v1/web-automation/test-flows/${flowId}`)
        return response.data
    },

    createTestFlow: async (projectId: string, data: TestFlowCreate) => {
        // Prepare default minimal flow data if not provided
        const payload = {
            flow_json: { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } },
            ...data,
        }
        const response = await api.post<TestFlow>(`/api/v1/web-automation/test-flows?project_id=${projectId}`, payload)
        return response.data
    },

    updateTestFlow: async (flowId: string, data: TestFlowUpdate) => {
        const response = await api.put<TestFlow>(`/api/v1/web-automation/test-flows/${flowId}`, data)
        return response.data
    },

    deleteTestFlow: async (flowId: string) => {
        await api.delete(`/api/v1/web-automation/test-flows/${flowId}`)
    },

    executeTestFlow: async (flowId: string, config?: any) => {
        const response = await api.post(`/api/v1/web-automation/test-flows/${flowId}/execute`, config || {})
        return response.data
    },

    startRecording: async (projectId: string, url: string) => {
        const response = await api.post(`/api/v1/web-automation/recorder/start`, { project_id: projectId, url })
        return response.data
    },

    stopRecording: async (projectId: string) => {
        const response = await api.post(`/api/v1/web-automation/recorder/stop`, { project_id: projectId })
        return response.data
    },

    // Browser Session Management - Live Browser Feature
    launchBrowserSession: async (sessionId: string, options?: {
        browserType?: string,
        device?: string,
        initialUrl?: string
    }) => {
        const params = new URLSearchParams({
            session_id: sessionId,
            browser_type: options?.browserType || 'chromium',
            device: options?.device || 'desktop_chrome',
            initial_url: options?.initialUrl || 'about:blank'
        })
        const response = await api.post(`/api/v1/web-automation/browser-sessions?${params}`)
        return response.data
    },

    stopBrowserSession: async (sessionId: string) => {
        const response = await api.delete(`/api/v1/web-automation/browser-sessions/${sessionId}`)
        return response.data
    },

    navigateBrowserSession: async (sessionId: string, url: string) => {
        const response = await api.post(`/api/v1/web-automation/browser-sessions/${sessionId}/navigate?url=${encodeURIComponent(url)}`)
        return response.data
    },

    highlightElement: async (sessionId: string, selector: string, duration?: number) => {
        const params = new URLSearchParams({
            selector,
            duration: String(duration || 2000)
        })
        const response = await api.post(`/api/v1/web-automation/browser-sessions/${sessionId}/highlight?${params}`)
        return response.data
    },

    getBrowserSessionState: async (sessionId: string) => {
        const response = await api.get(`/api/v1/web-automation/browser-sessions/${sessionId}`)
        return response.data
    },

    listBrowserSessions: async () => {
        const response = await api.get(`/api/v1/web-automation/browser-sessions`)
        return response.data
    },

    getDevicePresets: async () => {
        const response = await api.get<{ devices: Array<{ id: string, name: string, viewport: string, type: string }> }>(`/api/v1/web-automation/device-presets`)
        return response.data
    },

    // AI-Powered Step Generation
    generateStepsFromPrompt: async (prompt: string, context?: {
        currentUrl?: string,
        existingSteps?: Array<any>
    }): Promise<{
        success: boolean,
        steps: Array<{
            id: string,
            action: string,
            selector?: string,
            value?: string,
            url?: string,
            description?: string,
            [key: string]: any
        }>,
        explanation?: string,
        error?: string
    }> => {
        const response = await api.post(`/api/v1/web-automation/generate-steps`, {
            prompt,
            context
        })
        return response.data
    },

    // Execution Logs
    listProjectExecutions: async (projectId: string, options?: {
        status?: 'pending' | 'running' | 'completed' | 'failed' | 'stopped' | 'error',
        limit?: number,
        skip?: number
    }): Promise<ExecutionRun[]> => {
        const params = new URLSearchParams()
        if (options?.status) params.append('status', options.status)
        if (options?.limit) params.append('limit', String(options.limit))
        if (options?.skip) params.append('skip', String(options.skip))
        const query = params.toString() ? `?${params.toString()}` : ''
        const response = await api.get<ExecutionRun[]>(`/api/v1/web-automation/projects/${projectId}/executions${query}`)
        return response.data
    },

    listTestFlowExecutions: async (flowId: string, options?: {
        limit?: number,
        skip?: number
    }): Promise<ExecutionRun[]> => {
        const params = new URLSearchParams()
        if (options?.limit) params.append('limit', String(options.limit))
        if (options?.skip) params.append('skip', String(options.skip))
        const query = params.toString() ? `?${params.toString()}` : ''
        const response = await api.get<ExecutionRun[]>(`/api/v1/web-automation/test-flows/${flowId}/executions${query}`)
        return response.data
    },

    getExecutionRun: async (runId: string): Promise<ExecutionRunDetail> => {
        const response = await api.get<ExecutionRunDetail>(`/api/v1/web-automation/executions/${runId}`)
        return response.data
    },

    // Self-Heal Dashboard
    getSelfHealDashboard: async (projectId: string): Promise<SelfHealDashboard> => {
        const response = await api.get<SelfHealDashboard>(`/api/v1/web-automation/projects/${projectId}/self-heal/dashboard`)
        return response.data
    },

    // Apply healing fix
    applyHealingFix: async (stepId: string, suggestion: { value: string, type: string }): Promise<void> => {
        await api.post(`/api/v1/web-automation/healing/apply`, { step_id: stepId, suggestion })
    },

    // Artifacts
    listArtifacts: async (projectId: string, options?: {
        type?: 'screenshot' | 'video',
        page?: number,
        pageSize?: number
    }): Promise<ArtifactListResponse> => {
        const params = new URLSearchParams()
        if (options?.type) params.append('type', options.type)
        if (options?.page) params.append('page', String(options.page))
        if (options?.pageSize) params.append('page_size', String(options.pageSize))
        const query = params.toString() ? `?${params.toString()}` : ''
        const response = await api.get<ArtifactListResponse>(`/api/v1/projects/${projectId}/artifacts${query}`)
        return response.data
    },

    deleteArtifact: async (projectId: string, artifactId: string): Promise<void> => {
        await api.delete(`/api/v1/projects/${projectId}/artifacts/${artifactId}`)
    },

    getArtifactDownloadUrl: (projectId: string, artifactId: string): string => {
        return `/api/v1/projects/${projectId}/artifacts/${artifactId}/download`
    }
}

// Execution Types
export interface ExecutionRun {
    id: string
    test_flow_id: string
    project_id: string
    browser_type: 'chrome' | 'firefox' | 'safari' | 'edge' | 'chromium'
    execution_mode: 'headed' | 'headless'
    status: 'pending' | 'running' | 'completed' | 'failed' | 'stopped' | 'error'
    total_steps: number
    passed_steps: number
    failed_steps: number
    skipped_steps: number
    healed_steps: number
    duration_ms?: number
    started_at?: string
    ended_at?: string
    execution_environment: any
    video_url?: string
    trace_url?: string
    screenshots_dir?: string
    error_message?: string
    error_stack?: string
    triggered_by?: string
    trigger_source?: string
    tags: string[]
    notes?: string
    created_at: string
    test_flow_name?: string
}

export interface StepResult {
    id: string
    execution_run_id: string
    step_id: string
    step_name?: string
    step_type: string
    step_order: number
    status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped' | 'healed'
    selector_used?: any
    action_details: any
    actual_result?: string
    expected_result?: string
    error_message?: string
    error_stack?: string
    duration_ms?: number
    retry_count: number
    screenshot_url?: string
    screenshot_before_url?: string
    screenshot_after_url?: string
    was_healed: boolean
    healing_applied?: any
    console_logs: any[]
    network_logs: any[]
    started_at?: string
    ended_at?: string
    created_at: string
}

export interface ExecutionRunDetail extends ExecutionRun {
    step_results: StepResult[]
    healing_events: any[]
}

export interface SelfHealDashboard {
    health_score: number
    total_tests: number
    issues_detected: number
    auto_healed_this_week: number
    detected_issues: SelfHealIssue[]
    repair_history: RepairHistoryItem[]
    config: {
        auto_apply_low_risk: boolean
        notify_on_issues: boolean
        visual_matching: boolean
        confidence_threshold: number
    }
}

export interface SelfHealIssue {
    id: string
    type: string
    test: string
    step: string
    status: string
    confidence: number
    old_locator: string
    error_message?: string
    suggestions: {
        id: string
        value: string
        confidence: number
        type: string
    }[]
}

export interface RepairHistoryItem {
    id: string
    date: string
    type: string
    test: string
    action: string
    success: boolean
}

// Artifact Types
export interface Artifact {
    id: string
    project_id: string
    execution_run_id?: string
    step_result_id?: string
    name: string
    type: 'screenshot' | 'video'
    file_path: string
    file_url?: string
    size_bytes?: number
    duration_ms?: number
    test_name?: string
    step_name?: string
    created_at: string
}

export interface ArtifactListResponse {
    items: Artifact[]
    total: number
    page: number
    page_size: number
    has_more: boolean
}

// ============================================
// Snippet Types
// ============================================
export interface SnippetParameter {
    name: string
    type: 'string' | 'number' | 'boolean' | 'selector'
    default?: string
    description?: string
}

export interface Snippet {
    id: string
    project_id: string
    organisation_id: string
    name: string
    description?: string
    parameters: SnippetParameter[]
    steps: any[]
    tags: string[]
    is_global: boolean
    version: string
    usage_count: number
    created_at: string
    updated_at?: string
    created_by?: string
}

export interface SnippetCreate {
    name: string
    description?: string
    parameters: SnippetParameter[]
    steps: any[]
    tags?: string[]
    is_global?: boolean
}

// Snippet API methods
export const snippetApi = {
    listSnippets: async (projectId: string, options?: { includeGlobal?: boolean, tag?: string, search?: string }) => {
        const params = new URLSearchParams({ project_id: projectId })
        if (options?.includeGlobal !== undefined) params.append('include_global', String(options.includeGlobal))
        if (options?.tag) params.append('tag', options.tag)
        if (options?.search) params.append('search', options.search)
        const response = await api.get<Snippet[]>(`/api/v1/snippets?${params}`)
        return response.data
    },

    getSnippet: async (snippetId: string) => {
        const response = await api.get<Snippet>(`/api/v1/snippets/${snippetId}`)
        return response.data
    },

    createSnippet: async (projectId: string, data: SnippetCreate) => {
        const response = await api.post<Snippet>(`/api/v1/snippets?project_id=${projectId}`, data)
        return response.data
    },

    updateSnippet: async (snippetId: string, data: Partial<SnippetCreate>) => {
        const response = await api.put<Snippet>(`/api/v1/snippets/${snippetId}`, data)
        return response.data
    },

    deleteSnippet: async (snippetId: string) => {
        await api.delete(`/api/v1/snippets/${snippetId}`)
    },

    createFromSteps: async (projectId: string, data: {
        name: string
        description?: string
        step_ids: string[]
        steps?: any[]
        parameters?: SnippetParameter[]
        tags?: string[]
        is_global?: boolean
    }) => {
        const response = await api.post<Snippet>(`/api/v1/snippets/from-steps?project_id=${projectId}`, data)
        return response.data
    },
}
