import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Configure axios to include credentials (cookies) with all requests
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // This allows cookies to be sent with requests
})

// Add response interceptor to log errors
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      console.error('[API] 401 Unauthorized - Token may be missing or expired')
    }
    return Promise.reject(error)
  }
)

/**
 * Authorization is handled via httpOnly cookies
 * No need to manually fetch tokens - cookies are sent automatically with withCredentials: true
 */

// Types
export interface TestStep {
  step_number: number
  action: string
  expected_result: string
}

export interface TestCase {
  id: string
  title: string
  description: string
  project_id: string
  test_suite_id: string
  steps: TestStep[]
  expected_result: string
  actual_result?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  tags: string[]
  status?: 'draft' | 'ready' | 'in_progress' | 'passed' | 'failed' | 'blocked' | 'skipped'
  ai_generated?: boolean
  generated_by?: 'ai' | 'manual' | 'hybrid'
  created_by: string
  created_at: string
  updated_at?: string
}

export interface TestSuite {
  id: string
  name: string
  description: string
  project_id: string
  test_plan_id: string
  tags: string[]
  created_by: string
  created_at: string
  updated_at?: string
}

export interface TestPlan {
  id: string
  name: string
  description: string
  project_id: string
  objectives: string[]
  tags: string[]
  created_by: string
  created_at: string
  updated_at?: string
}

// API functions
export const testCasesAPI = {
  list: async (projectId: string, suiteId?: string) => {
    const params = new URLSearchParams({ project_id: projectId })
    if (suiteId) params.append('test_suite_id', suiteId)

    console.log('[testCasesAPI.list] Fetching from:', `/api/v1/test-cases/?${params}`)

    const response = await axiosInstance.get(`/api/v1/test-cases/?${params}`)
    return response.data
  },

  get: async (id: string) => {
    const response = await axiosInstance.get(`/api/v1/test-cases/${id}`)
    return response.data
  },

  create: async (data: Omit<TestCase, 'id' | 'created_at' | 'updated_at'>) => {
    const response = await axiosInstance.post(`/api/v1/test-cases/`, data)
    return response.data
  },

  update: async (id: string, data: Partial<TestCase>) => {
    const response = await axiosInstance.put(`/api/v1/test-cases/${id}`, data)
    return response.data
  },

  delete: async (id: string) => {
    const response = await axiosInstance.delete(`/api/v1/test-cases/${id}`)
    return response.data
  },

  execute: async (testCaseId: string, data: {
    status: string
    actual_result?: string
    execution_notes?: string
    attachments?: string[]
  }) => {
    const response = await axiosInstance.post(`/api/v1/test-cases/execute`, {
      test_case_id: testCaseId,
      ...data
    })
    return response.data
  },

  aiGenerate: async (request: {
    project_id: string
    test_suite_id?: string
    feature_description: string
    test_scenarios?: string[]
    user_stories?: string[]
    count: number
  }) => {
    const response = await axiosInstance.post(`/api/v1/test-cases/ai-generate`, request)
    return response.data
  },
}

export const testSuitesAPI = {
  list: async (projectId: string, planId?: string) => {
    const params = new URLSearchParams({ project_id: projectId })
    if (planId) params.append('test_plan_id', planId)

    const response = await axiosInstance.get(`/api/v1/test-suites/?${params}`)
    return response.data
  },

  get: async (id: string) => {
    const response = await axiosInstance.get(`/api/v1/test-suites/${id}`)
    return response.data
  },

  create: async (data: Omit<TestSuite, 'id' | 'created_at' | 'updated_at'>) => {
    const response = await axiosInstance.post(`/api/v1/test-suites/`, data)
    return response.data
  },

  update: async (id: string, data: Partial<TestSuite>) => {
    const response = await axiosInstance.put(`/api/v1/test-suites/${id}`, data)
    return response.data
  },

  delete: async (id: string) => {
    const response = await axiosInstance.delete(`/api/v1/test-suites/${id}`)
    return response.data
  },

  aiGenerate: async (request: {
    project_id: string
    test_plan_id?: string
    requirements: string
    test_scenarios?: string[]
  }) => {
    const response = await axiosInstance.post(`/api/v1/test-suites/ai-generate`, request)
    return response.data
  },
}

export const testPlansAPI = {
  list: async (projectId: string) => {
    const response = await axiosInstance.get(`/api/v1/test-plans/?project_id=${projectId}`)
    return response.data
  },

  get: async (id: string) => {
    const response = await axiosInstance.get(`/api/v1/test-plans/${id}`)
    return response.data
  },

  create: async (data: Omit<TestPlan, 'id' | 'created_at' | 'updated_at'>) => {
    const response = await axiosInstance.post(`/api/v1/test-plans/`, data)
    return response.data
  },

  update: async (id: string, data: Partial<TestPlan>) => {
    const response = await axiosInstance.put(`/api/v1/test-plans/${id}`, data)
    return response.data
  },

  delete: async (id: string) => {
    const response = await axiosInstance.delete(`/api/v1/test-plans/${id}`)
    return response.data
  },

  aiGenerate: async (request: {
    project_id: string
    source_documents: string[]
    additional_context?: string
    objectives?: string[]
  }) => {
    const response = await axiosInstance.post(`/api/v1/test-plans/ai-generate`, request)
    return response.data
  },
}
