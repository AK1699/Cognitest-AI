import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
})

// Types
export interface StepToReproduce {
  step_number: number
  action: string
  expected: string
  actual?: string
}

export interface IssueComment {
  comment_id: string
  user_id: string
  user_name: string
  comment: string
  created_at: string
  attachments: string[]
}

export interface StatusHistory {
  changed_at: string
  changed_by: string
  changed_by_name: string
  from_status?: string
  to_status: string
  notes?: string
}

export interface Issue {
  id: string
  project_id: string

  // Related entities
  related_test_case_id?: string
  test_run_id?: string
  test_plan_id?: string

  // External linkage
  external_issue_key?: string
  external_system?: string
  external_url?: string

  // Basic Information
  title: string
  description?: string

  // Classification
  severity: 'low' | 'medium' | 'high' | 'critical'
  priority: 'trivial' | 'low' | 'medium' | 'high' | 'critical' | 'blocker'
  status: 'new' | 'assigned' | 'in_progress' | 'fixed' | 'retested' | 'closed' | 'reopened' | 'wont_fix' | 'duplicate' | 'deferred'
  detected_by: 'ai' | 'manual' | 'automation'

  // Assignment
  created_by: string
  assigned_to?: string
  assigned_to_name?: string
  reporter_id?: string

  // Resolution
  resolution?: string
  resolution_notes?: string
  fixed_in_version?: string

  // Tracking
  steps_to_reproduce: StepToReproduce[]
  actual_result?: string
  expected_result?: string
  environment: Record<string, any>
  attachments: string[]

  // Impact
  affected_features: string[]
  affected_users?: string
  workaround?: string

  // AI Insights
  remediation_suggestions: string[]
  ai_confidence?: string
  root_cause_analysis?: string

  // Comments and history
  comments: IssueComment[]
  status_history: StatusHistory[]

  // Metrics
  estimated_effort_hours?: string
  actual_effort_hours?: string

  // Metadata
  tags: string[]
  labels: string[]
  meta_data: Record<string, any>

  // Timestamps
  created_at: string
  updated_at?: string
  assigned_at?: string
  resolved_at?: string
  closed_at?: string
  retested_at?: string
  due_date?: string
}

export interface IssueMetrics {
  total_issues: number
  open_issues: number
  closed_issues: number
  in_progress_issues: number
  by_severity: Record<string, number>
  by_priority: Record<string, number>
  by_status: Record<string, number>
  avg_resolution_time_hours?: number
  defect_density?: number
}

// API functions
export const issuesAPI = {
  list: async (
    projectId: string,
    params?: {
      status?: string
      severity?: string
      priority?: string
      assigned_to?: string
      created_by?: string
      search?: string
      skip?: number
      limit?: number
    }
  ) => {
    const searchParams = new URLSearchParams({ project_id: projectId })
    if (params?.status) searchParams.append('status', params.status)
    if (params?.severity) searchParams.append('severity', params.severity)
    if (params?.priority) searchParams.append('priority', params.priority)
    if (params?.assigned_to) searchParams.append('assigned_to', params.assigned_to)
    if (params?.created_by) searchParams.append('created_by', params.created_by)
    if (params?.search) searchParams.append('search', params.search)
    if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString())
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString())

    const response = await axiosInstance.get(`/api/v1/issues/?${searchParams}`)
    return response.data as Issue[]
  },

  get: async (id: string) => {
    const response = await axiosInstance.get(`/api/v1/issues/${id}`)
    return response.data as Issue
  },

  create: async (data: Omit<Issue, 'id' | 'created_at' | 'updated_at' | 'comments' | 'status_history'>) => {
    const response = await axiosInstance.post(`/api/v1/issues/`, data)
    return response.data as Issue
  },

  update: async (id: string, data: Partial<Issue>) => {
    const response = await axiosInstance.put(`/api/v1/issues/${id}`, data)
    return response.data as Issue
  },

  delete: async (id: string) => {
    await axiosInstance.delete(`/api/v1/issues/${id}`)
  },

  changeStatus: async (id: string, data: {
    status: Issue['status']
    notes?: string
    user_id: string
    user_name: string
  }) => {
    const response = await axiosInstance.post(`/api/v1/issues/${id}/status`, data)
    return response.data as Issue
  },

  assign: async (id: string, data: {
    assigned_to: string
    assigned_to_name: string
    notify?: boolean
  }) => {
    const response = await axiosInstance.post(`/api/v1/issues/${id}/assign`, data)
    return response.data as Issue
  },

  addComment: async (id: string, data: {
    comment: string
    user_id: string
    user_name: string
    attachments?: string[]
  }) => {
    const response = await axiosInstance.post(`/api/v1/issues/${id}/comment`, data)
    return response.data as Issue
  },

  getMetrics: async (projectId: string) => {
    const response = await axiosInstance.get(`/api/v1/issues/project/${projectId}/metrics`)
    return response.data as IssueMetrics
  },

  bulkUpdate: async (issueIds: string[], updateData: Partial<Issue>) => {
    const response = await axiosInstance.post(`/api/v1/issues/bulk-update`, {
      issue_ids: issueIds,
      update_data: updateData,
    })
    return response.data as Issue[]
  },

  bulkAssign: async (issueIds: string[], assignedTo: string, assignedToName: string) => {
    const response = await axiosInstance.post(`/api/v1/issues/bulk-assign`, {
      issue_ids: issueIds,
      assigned_to: assignedTo,
      assigned_to_name: assignedToName,
    })
    return response.data as Issue[]
  },

  aiAnalysis: async (id: string, options?: {
    analyze_root_cause?: boolean
    generate_remediation?: boolean
  }) => {
    const response = await axiosInstance.post(`/api/v1/issues/${id}/ai-analysis`, {
      issue_id: id,
      analyze_root_cause: options?.analyze_root_cause ?? true,
      generate_remediation: options?.generate_remediation ?? true,
    })
    return response.data
  },

  syncExternal: async (id: string, data: {
    external_system: 'jira' | 'github' | 'testrail'
    external_issue_key?: string
    create_if_not_exists?: boolean
  }) => {
    const response = await axiosInstance.post(`/api/v1/issues/${id}/sync-external`, data)
    return response.data
  },
}
