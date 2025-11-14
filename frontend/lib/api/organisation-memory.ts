import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface AISuggestionsResponse {
  has_suggestions: boolean
  similar_inputs_count: number
  suggested_features: string[]
  suggested_ui_elements: string[]
  suggested_workflows: string[]
  suggested_test_scenarios: string[]
  context: Array<{
    description: string
    relevance: number
    date: string
  }>
}

export interface MemoryCreateResponse {
  status: string
  memory_id: string
  message: string
  image_count: number
  analysis: {
    extracted_features: string[]
    ui_elements: string[]
    workflows: string[]
  }
}

export interface TestPlanMultimodalResponse {
  status: string
  memory_id: string
  test_plan_id: string | null
  message: string
  images_processed: number
  ai_suggestions_used: boolean
  suggestions: AISuggestionsResponse | null
  test_plan: any
}

export const organisationMemoryAPI = {
  /**
   * Store organization memory with text and images
   */
  async storeMemory(data: {
    organisation_id: string
    description: string
    project_id?: string
    source?: string
    tags?: string[]
    images?: File[]
  }, token: string): Promise<MemoryCreateResponse> {
    const formData = new FormData()
    formData.append('organisation_id', data.organisation_id)
    formData.append('description', data.description)

    if (data.project_id) {
      formData.append('project_id', data.project_id)
    }

    if (data.source) {
      formData.append('source', data.source)
    }

    if (data.tags && data.tags.length > 0) {
      formData.append('tags', JSON.stringify(data.tags))
    }

    if (data.images && data.images.length > 0) {
      data.images.forEach(image => {
        formData.append('images', image)
      })
    }

    const response = await axios.post(
      `${API_URL}/api/v1/organisation-memory/store`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    )

    return response.data
  },

  /**
   * Get AI suggestions based on user input
   */
  async getAISuggestions(data: {
    organisation_id: string
    user_input: string
    project_id?: string
  }, token: string): Promise<AISuggestionsResponse> {
    const response = await axios.post(
      `${API_URL}/api/v1/organisation-memory/suggestions`,
      data,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return response.data
  },

  /**
   * List organization memories
   */
  async listMemories(
    organisationId: string,
    projectId: string | undefined,
    limit: number,
    offset: number,
    token: string
  ) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    })

    if (projectId) {
      params.append('project_id', projectId)
    }

    const response = await axios.get(
      `${API_URL}/api/v1/organisation-memory/organisation/${organisationId}?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    )

    return response.data
  },

  /**
   * Get memory detail
   */
  async getMemoryDetail(memoryId: string, token: string) {
    const response = await axios.get(
      `${API_URL}/api/v1/organisation-memory/${memoryId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    )

    return response.data
  },

  /**
   * Delete memory
   */
  async deleteMemory(memoryId: string, token: string) {
    const response = await axios.delete(
      `${API_URL}/api/v1/organisation-memory/${memoryId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    )

    return response.data
  },
}

export const testPlanMultimodalAPI = {
  /**
   * Generate test plan with multimodal input (text + images)
   */
  async generateTestPlan(data: {
    organisation_id: string
    project_id: string
    description: string
    use_org_memory?: boolean
    project_type?: string
    features?: string[]
    platforms?: string[]
    priority?: string
    complexity?: string
    images?: File[]
  }, token: string): Promise<TestPlanMultimodalResponse> {
    const formData = new FormData()
    formData.append('organisation_id', data.organisation_id)
    formData.append('project_id', data.project_id)
    formData.append('description', data.description)
    formData.append('use_org_memory', data.use_org_memory !== false ? 'true' : 'false')

    if (data.project_type) {
      formData.append('project_type', data.project_type)
    }

    if (data.features && data.features.length > 0) {
      formData.append('features', JSON.stringify(data.features))
    }

    if (data.platforms && data.platforms.length > 0) {
      formData.append('platforms', JSON.stringify(data.platforms))
    }

    if (data.priority) {
      formData.append('priority', data.priority)
    }

    if (data.complexity) {
      formData.append('complexity', data.complexity)
    }

    if (data.images && data.images.length > 0) {
      data.images.forEach(image => {
        formData.append('images', image)
      })
    }

    const response = await axios.post(
      `${API_URL}/api/v1/test-plans-multimodal/generate`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minute timeout for AI generation
      }
    )

    return response.data
  },

  /**
   * Preview AI suggestions without generating test plan
   */
  async previewSuggestions(data: {
    organisation_id: string
    project_id?: string
    description: string
    images?: File[]
  }, token: string) {
    const formData = new FormData()
    formData.append('organisation_id', data.organisation_id)
    formData.append('description', data.description)

    if (data.project_id) {
      formData.append('project_id', data.project_id)
    }

    if (data.images && data.images.length > 0) {
      data.images.forEach(image => {
        formData.append('images', image)
      })
    }

    const response = await axios.post(
      `${API_URL}/api/v1/test-plans-multimodal/preview-suggestions`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    )

    return response.data
  },
}
