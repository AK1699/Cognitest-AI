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
    }
}
