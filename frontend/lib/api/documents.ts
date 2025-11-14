import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
})

// Types
export interface Document {
  id: string
  project_id: string
  title: string
  description?: string
  document_type: string
  source: string
  file_path?: string
  file_type?: string
  file_size?: string
  uploaded_by: string
  created_at: string
  updated_at?: string
  chunk_count?: number
  embedding_model?: string
  is_active: boolean
  meta_data: Record<string, any>
}

// API functions
export const documentsAPI = {
  upload: async (file: File, data: {
    project_id: string
    document_type?: string
    document_name?: string
    source?: string
    description?: string
  }) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('project_id', data.project_id)
    if (data.document_type) formData.append('document_type', data.document_type)
    if (data.document_name) formData.append('document_name', data.document_name)
    if (data.source) formData.append('source', data.source || 'upload')
    if (data.description) formData.append('description', data.description)

    const response = await axiosInstance.post(`/api/v1/documents/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data as {
      success: boolean
      message: string
      document: {
        id: string
        title: string
        file_type: string
        file_size: string
        uploaded_at: string
        status: string
      }
    }
  },

  list: async (projectId: string, params?: {
    document_type?: string
    source?: string
    is_active?: boolean
    skip?: number
    limit?: number
  }) => {
    const searchParams = new URLSearchParams({ project_id: projectId })
    if (params?.document_type) searchParams.append('document_type', params.document_type)
    if (params?.source) searchParams.append('source', params.source)
    if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString())
    if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString())
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString())

    const response = await axiosInstance.get(`/api/v1/documents/?${searchParams}`)
    return response.data as {
      documents: Array<{
        id: string
        title: string
        document_type: string
        source: string
        file_type: string
        file_size: string
        uploaded_by: string
        created_at: string
        chunk_count: number
        is_active: boolean
      }>
      total: number
    }
  },

  get: async (id: string) => {
    const response = await axiosInstance.get(`/api/v1/documents/${id}`)
    return response.data as Document
  },

  delete: async (id: string) => {
    await axiosInstance.delete(`/api/v1/documents/${id}`)
  },

  analyze: async (id: string) => {
    const response = await axiosInstance.post(`/api/v1/documents/${id}/analyze`)
    return response.data as {
      success: boolean
      message: string
      document_id: string
      status: string
    }
  },

  generateTestPlan: async (id: string) => {
    const response = await axiosInstance.post(`/api/v1/documents/${id}/generate-test-plan`)
    return response.data as {
      success: boolean
      message: string
      document_id: string
      status: string
    }
  },
}
