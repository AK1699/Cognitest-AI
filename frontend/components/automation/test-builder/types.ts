import { LucideIcon } from 'lucide-react'

/**
 * Represents a single step in a test flow
 */
export interface TestStep {
    id: string
    action: string
    selector?: string
    value?: string
    timeout?: number
    description?: string
    variable_name?: string
    attribute_name?: string
    script?: string
    key?: string
    name?: string
    url?: string
    // Conditional
    condition?: string
    true_value?: string
    false_value?: string
    nested_action_type?: string
    nested_action_data?: any
    // Select dropdown
    select_by?: 'value' | 'label' | 'index'
    option?: string
    // Upload
    file_path?: string
    // Scroll
    scroll_type?: 'page' | 'element' | 'coordinates'
    direction?: 'up' | 'down' | 'left' | 'right' | 'top' | 'bottom'
    amount?: number
    x?: number
    y?: number
    // Random data
    data_type?: string
    length?: number
    min?: number
    max?: number
    prefix?: string
    suffix?: string
    // For Loop
    iterations?: number
    loop_variable?: string
    nested_steps?: TestStep[]
    // While Loop
    max_iterations?: number
    // Try Catch
    try_steps?: TestStep[]
    catch_steps?: TestStep[]
    finally_steps?: TestStep[]
    // Tab management
    index?: number
    // Screenshot
    full_page?: boolean
    path?: string
    // Drag & Drop
    source_selector?: string
    target_selector?: string
    // Storage
    storage_key?: string
    // Viewport
    width?: number
    height?: number
    // Device
    device?: string
    // Geolocation
    latitude?: number
    longitude?: number
    accuracy?: number
    // Download
    download_path?: string
    min_size?: number
    // API Call
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    // Query Params
    query_params?: Array<{ key: string; value: string; description?: string; enabled?: boolean }>
    // Authorization
    auth_type?: 'none' | 'basic' | 'bearer' | 'api-key' | 'oauth2'
    auth_basic_username?: string
    auth_basic_password?: string
    auth_bearer_token?: string
    auth_api_key_key?: string
    auth_api_key_value?: string
    auth_api_key_add_to?: 'header' | 'query'
    // Headers
    headers?: string | Record<string, string> | Array<{ key: string; value: string; description?: string; enabled?: boolean }>
    // Body
    body_type?: 'none' | 'form-data' | 'x-www-form-urlencoded' | 'raw' | 'binary' | 'graphql'
    body?: string
    body_raw_type?: 'text' | 'json' | 'xml' | 'html' | 'javascript'
    body_form_data?: Array<{ key: string; value: string; type?: 'text' | 'file'; description?: string; enabled?: boolean }>
    body_urlencoded?: Array<{ key: string; value: string; description?: string; enabled?: boolean }>
    body_binary_path?: string
    body_graphql_query?: string
    body_graphql_variables?: string
    expected_status?: number
    // Log
    message?: string
    level?: 'info' | 'warn' | 'error' | 'debug'
    // Assertions
    expected_count?: number
    expected_title?: string
    expected_url?: string
    comparison?: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'regex' | 'greater' | 'less' | 'at_least' | 'at_most'
    // Data Files
    dataset_name?: string
    // Highlight
    color?: string
    duration?: number
    // Clipboard
    text?: string
    is_active?: boolean
    // Snippet fields
    snippet_id?: string
    snippet_name?: string
    snippet_steps?: TestStep[]
    parameters?: Record<string, string | number | boolean>
}

/**
 * Snippet parameter definition
 */
export interface SnippetParameter {
    name: string
    type: 'string' | 'number' | 'boolean' | 'selector'
    default?: string
    description?: string
}

/**
 * Snippet - reusable parameterized group of steps
 */
export interface Snippet {
    id: string
    project_id: string
    organisation_id: string
    name: string
    description?: string
    parameters: SnippetParameter[]
    steps: TestStep[]
    tags: string[]
    is_global: boolean
    version: string
    usage_count: number
    created_at: string
    updated_at?: string
    created_by?: string
}

/**
 * Props for the TestBuilderTab component
 */
export interface TestBuilderTabProps {
    selectedEnvironment?: Environment
    flowId?: string | null
    projectId: string
}

/**
 * Environment configuration for test execution
 */
export interface Environment {
    id: string
    name: string
    variables: Record<string, string>
}

/**
 * Configuration for an action type in the action palette
 */
export interface ActionConfig {
    id: string
    name: string
    icon: LucideIcon
    color: string
    description: string
}

/**
 * Builder method types
 */
export type BuilderMethod = 'visual' | 'recorder' | 'ai'
