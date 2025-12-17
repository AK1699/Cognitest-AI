/**
 * Workflow Automation API Client
 * Frontend API functions for workflow management
 */
import api from '@/lib/axios'

// Types
export interface NodePosition {
    x: number
    y: number
}

export interface NodeData {
    label: string
    type: string
    integration_type?: string
    config: Record<string, any>
    credentials_id?: string
    description?: string
    disabled?: boolean
}

export interface WorkflowNode {
    id: string
    type: string
    position: NodePosition
    data: NodeData
    width?: number
    height?: number
    selected?: boolean
}

export interface WorkflowEdge {
    id: string
    source: string
    target: string
    sourceHandle?: string
    targetHandle?: string
    label?: string
    type?: string
    animated?: boolean
    data?: Record<string, any>
}

export interface Viewport {
    x: number
    y: number
    zoom: number
}

export interface RetryPolicy {
    max_retries: number
    retry_delay_seconds: number
    backoff_multiplier: number
    retry_on_error_types: string[]
}

export interface ErrorHandling {
    on_error: 'stop' | 'continue' | 'goto_error_handler'
    notify_on_failure: boolean
    notification_channel?: string
}

export interface WorkflowCreate {
    name: string
    description?: string
    project_id: string
    trigger_type: 'manual' | 'schedule' | 'webhook' | 'event'
    trigger_config?: Record<string, any>
    nodes: WorkflowNode[]
    edges: WorkflowEdge[]
    viewport?: Viewport
    global_variables?: Record<string, any>
    timeout_seconds?: number
    retry_policy?: RetryPolicy
    error_handling?: ErrorHandling
    tags?: string[]
    category?: string
    icon?: string
    color?: string
}

export interface WorkflowUpdate {
    name?: string
    description?: string
    status?: 'draft' | 'active' | 'inactive' | 'archived'
    trigger_type?: 'manual' | 'schedule' | 'webhook' | 'event'
    trigger_config?: Record<string, any>
    nodes?: WorkflowNode[]
    edges?: WorkflowEdge[]
    viewport?: Viewport
    global_variables?: Record<string, any>
    timeout_seconds?: number
    retry_policy?: RetryPolicy
    error_handling?: ErrorHandling
    tags?: string[]
    category?: string
    icon?: string
    color?: string
    notes?: string
}

export interface WorkflowSummary {
    id: string
    human_id?: string
    name: string
    description?: string
    status: string
    trigger_type: string
    category?: string
    icon?: string
    color?: string
    tags: string[]
    total_executions: number
    successful_executions: number
    failed_executions: number
    last_execution_status?: string
    last_executed_at?: string
    created_at: string
    updated_at?: string
}

export interface WorkflowDetail extends WorkflowSummary {
    project_id: string
    organisation_id: string
    nodes: WorkflowNode[]
    edges: WorkflowEdge[]
    viewport: Viewport
    trigger_config: Record<string, any>
    timeout_seconds: number
    retry_policy: Record<string, any>
    error_handling: Record<string, any>
    global_variables: Record<string, any>
    environment: string
    version: string
    notes?: string
    average_duration_ms: number
    created_by?: string
}

export interface ExecutionCreate {
    input_data?: Record<string, any>
    trigger_source?: string
}

export interface ExecutionStepSummary {
    id: string
    node_id: string
    node_type: string
    node_name?: string
    step_order: number
    status: string
    duration_ms?: number
    error_message?: string
    started_at?: string
    completed_at?: string
}

export interface ExecutionSummary {
    id: string
    human_id?: string
    workflow_id: string
    status: string
    trigger_source: string
    duration_ms?: number
    total_nodes: number
    completed_nodes: number
    failed_nodes: number
    skipped_nodes: number
    error_message?: string
    error_node_id?: string
    started_at?: string
    completed_at?: string
    created_at: string
}

export interface ExecutionDetail extends ExecutionSummary {
    project_id: string
    workflow_version: string
    trigger_data: Record<string, any>
    output_data: Record<string, any>
    execution_path: string[]
    current_node_id?: string
    error_stack?: string
    retry_count: number
    steps: ExecutionStepSummary[]
    triggered_by?: string
    execution_context: Record<string, any>
    notes?: string
}

export interface ScheduleCreate {
    cron_expression: string
    timezone?: string
    enabled?: boolean
    trigger_data?: Record<string, any>
}

export interface ScheduleDetail {
    id: string
    workflow_id: string
    cron_expression: string
    timezone: string
    enabled: boolean
    next_run_at?: string
    last_run_at?: string
    last_run_status?: string
    total_runs: number
    successful_runs: number
    failed_runs: number
    consecutive_failures: number
    auto_disabled: boolean
    trigger_data: Record<string, any>
    created_at: string
}

export interface WebhookCreate {
    method?: string
    secret_key?: string
    require_auth?: boolean
    allowed_ips?: string[]
    response_mode?: string
    response_data?: Record<string, any>
    rate_limit_enabled?: boolean
    rate_limit_max_calls?: number
    rate_limit_window_seconds?: number
}

export interface WebhookDetail {
    id: string
    workflow_id: string
    path: string
    method: string
    enabled: boolean
    require_auth: boolean
    allowed_ips: string[]
    response_mode: string
    response_data: Record<string, any>
    total_calls: number
    successful_calls: number
    failed_calls: number
    last_called_at?: string
    rate_limit_enabled: boolean
    rate_limit_max_calls: number
    rate_limit_window_seconds: number
    webhook_url?: string
    created_at: string
}

export interface NodeTypeSchema {
    type: string
    name: string
    description: string
    category: string
    icon: string
    color: string
    inputs: number
    outputs: number
    config_schema: Record<string, any>
}

export interface IntegrationSchema {
    type: string
    name: string
    description: string
    category: string
    icon: string
    color: string
    auth_type: string
    config_schema: Record<string, any>
    credential_fields: Array<{
        name: string
        type: string
        required: boolean
    }>
}

// API Functions
export const workflowAPI = {
    // ==================== Workflow CRUD ====================

    /**
     * Create a new workflow
     */
    create: async (data: WorkflowCreate): Promise<WorkflowDetail> => {
        const response = await api.post('/workflows/', data)
        return response.data
    },

    /**
     * Get workflow by ID
     */
    get: async (workflowId: string): Promise<WorkflowDetail> => {
        const response = await api.get(`/workflows/${workflowId}`)
        return response.data
    },

    /**
     * List workflows for a project
     */
    list: async (params: {
        project_id: string
        status_filter?: string
        category?: string
        search?: string
        skip?: number
        limit?: number
    }): Promise<{ items: WorkflowSummary[]; total: number; skip: number; limit: number }> => {
        const response = await api.get('/workflows/', { params })
        return response.data
    },

    /**
     * Update workflow
     */
    update: async (workflowId: string, data: WorkflowUpdate): Promise<WorkflowDetail> => {
        const response = await api.put(`/workflows/${workflowId}`, data)
        return response.data
    },

    /**
     * Delete workflow
     */
    delete: async (workflowId: string): Promise<void> => {
        await api.delete(`/workflows/${workflowId}`)
    },

    /**
     * Duplicate workflow
     */
    duplicate: async (workflowId: string, newName?: string): Promise<WorkflowDetail> => {
        const response = await api.post(`/workflows/${workflowId}/duplicate`, null, {
            params: { new_name: newName }
        })
        return response.data
    },

    // ==================== Execution ====================

    /**
     * Execute workflow
     */
    execute: async (workflowId: string, data?: ExecutionCreate): Promise<ExecutionSummary> => {
        const response = await api.post(`/workflows/${workflowId}/execute`, data || {})
        return response.data
    },

    /**
     * List executions for a workflow
     */
    listExecutions: async (workflowId: string, params?: {
        status_filter?: string
        skip?: number
        limit?: number
    }): Promise<{ items: ExecutionSummary[]; total: number }> => {
        const response = await api.get(`/workflows/${workflowId}/executions`, { params })
        return response.data
    },

    /**
     * Get execution details
     */
    getExecution: async (executionId: string): Promise<ExecutionDetail> => {
        const response = await api.get(`/workflows/executions/${executionId}`)
        return response.data
    },

    /**
     * Get execution steps
     */
    getExecutionSteps: async (executionId: string): Promise<ExecutionStepSummary[]> => {
        const response = await api.get(`/workflows/executions/${executionId}/steps`)
        return response.data
    },

    /**
     * Stop execution
     */
    stopExecution: async (executionId: string): Promise<ExecutionSummary> => {
        const response = await api.post(`/workflows/executions/${executionId}/stop`)
        return response.data
    },

    /**
     * Retry execution
     */
    retryExecution: async (executionId: string): Promise<ExecutionSummary> => {
        const response = await api.post(`/workflows/executions/${executionId}/retry`)
        return response.data
    },

    // ==================== Schedule ====================

    /**
     * Create schedule
     */
    createSchedule: async (workflowId: string, data: ScheduleCreate): Promise<ScheduleDetail> => {
        const response = await api.post(`/workflows/${workflowId}/schedule`, data)
        return response.data
    },

    /**
     * Get schedule
     */
    getSchedule: async (workflowId: string): Promise<ScheduleDetail> => {
        const response = await api.get(`/workflows/${workflowId}/schedule`)
        return response.data
    },

    /**
     * Update schedule
     */
    updateSchedule: async (workflowId: string, data: Partial<ScheduleCreate>): Promise<ScheduleDetail> => {
        const response = await api.put(`/workflows/${workflowId}/schedule`, data)
        return response.data
    },

    /**
     * Delete schedule
     */
    deleteSchedule: async (workflowId: string): Promise<void> => {
        await api.delete(`/workflows/${workflowId}/schedule`)
    },

    // ==================== Webhook ====================

    /**
     * Create webhook
     */
    createWebhook: async (workflowId: string, data: WebhookCreate): Promise<WebhookDetail> => {
        const response = await api.post(`/workflows/${workflowId}/webhook`, data)
        return response.data
    },

    /**
     * Get webhook
     */
    getWebhook: async (workflowId: string): Promise<WebhookDetail> => {
        const response = await api.get(`/workflows/${workflowId}/webhook`)
        return response.data
    },

    /**
     * Update webhook
     */
    updateWebhook: async (workflowId: string, data: Partial<WebhookCreate>): Promise<WebhookDetail> => {
        const response = await api.put(`/workflows/${workflowId}/webhook`, data)
        return response.data
    },

    /**
     * Delete webhook
     */
    deleteWebhook: async (workflowId: string): Promise<void> => {
        await api.delete(`/workflows/${workflowId}/webhook`)
    },

    // ==================== Node Types & Integrations ====================

    /**
     * Get available node types
     */
    getNodeTypes: async (): Promise<NodeTypeSchema[]> => {
        const response = await api.get('/workflows/nodes/available')
        return response.data
    },

    /**
     * Get available integrations
     */
    getIntegrations: async (): Promise<IntegrationSchema[]> => {
        const response = await api.get('/workflows/integrations/available')
        return response.data
    },

    // ==================== WebSocket ====================

    /**
     * Connect to execution WebSocket for real-time updates
     */
    connectExecutionWebSocket: (executionId: string): WebSocket => {
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'
        return new WebSocket(`${wsUrl}/api/v1/workflows/ws/${executionId}`)
    },
}

export default workflowAPI
