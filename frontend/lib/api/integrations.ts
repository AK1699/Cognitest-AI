import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
})

// Types
export type IntegrationType = 'jira' | 'github' | 'testrail' | 'gitlab' | 'azure_devops' | 'custom'
export type IntegrationStatus = 'active' | 'inactive' | 'error' | 'testing'
export type SyncDirection = 'one_way_to_external' | 'one_way_from_external' | 'bi_directional'

export interface Integration {
  id: string
  organisation_id: string
  project_id?: string

  // Integration Details
  name: string
  description?: string
  integration_type: IntegrationType
  status: IntegrationStatus

  // Connection Details
  base_url: string
  username?: string
  api_token: string
  api_key?: string

  // Configuration
  config: Record<string, any>

  // Sync Settings
  sync_direction: SyncDirection
  auto_sync_enabled: boolean
  sync_interval_minutes?: string

  // Filters and Mappings
  sync_filters: Record<string, any>
  field_mappings: Record<string, any>

  // Webhooks
  webhook_url?: string
  webhook_secret?: string

  // Last Sync Info
  last_sync_at?: string
  last_sync_status?: string
  last_sync_details: Record<string, any>

  // Statistics
  total_synced_items: string
  total_sync_errors: string
  last_error?: string

  // Metadata
  tags: string[]
  meta_data: Record<string, any>

  // Timestamps
  created_at: string
  updated_at?: string
  created_by: string
}

export interface IntegrationSyncLog {
  id: string
  integration_id: string
  sync_type: string
  sync_direction: string
  status: string
  entity_type: string
  entity_id?: string
  external_entity_id?: string
  items_processed: string
  items_succeeded: string
  items_failed: string
  error_message?: string
  error_details: Record<string, any>
  duration_seconds?: string
  sync_data: Record<string, any>
  started_at: string
  completed_at?: string
  triggered_by?: string
}

// API functions
export const integrationsAPI = {
  list: async (params?: {
    organisation_id?: string
    project_id?: string
    integration_type?: IntegrationType
    status?: IntegrationStatus
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.organisation_id) searchParams.append('organisation_id', params.organisation_id)
    if (params?.project_id) searchParams.append('project_id', params.project_id)
    if (params?.integration_type) searchParams.append('integration_type', params.integration_type)
    if (params?.status) searchParams.append('status', params.status)

    const response = await axiosInstance.get(`/api/v1/integrations/?${searchParams}`)
    return response.data as Integration[]
  },

  get: async (id: string) => {
    const response = await axiosInstance.get(`/api/v1/integrations/${id}`)
    return response.data as Integration
  },

  create: async (data: Omit<Integration, 'id' | 'created_at' | 'updated_at' | 'last_sync_at' | 'last_sync_status' | 'last_sync_details' | 'total_synced_items' | 'total_sync_errors'>) => {
    const response = await axiosInstance.post(`/api/v1/integrations/`, data)
    return response.data as Integration
  },

  update: async (id: string, data: Partial<Integration>) => {
    const response = await axiosInstance.put(`/api/v1/integrations/${id}`, data)
    return response.data as Integration
  },

  delete: async (id: string) => {
    await axiosInstance.delete(`/api/v1/integrations/${id}`)
  },

  testConnection: async (data: {
    integration_type: IntegrationType
    base_url: string
    username?: string
    api_token: string
    api_key?: string
    config?: Record<string, any>
  }) => {
    const response = await axiosInstance.post(`/api/v1/integrations/test-connection`, data)
    return response.data as {
      success: boolean
      message: string
      details: Record<string, any>
    }
  },

  testExisting: async (id: string) => {
    const response = await axiosInstance.post(`/api/v1/integrations/${id}/test`)
    return response.data as {
      success: boolean
      message: string
      details: Record<string, any>
    }
  },

  sync: async (id: string, params?: {
    entity_type?: string
    entity_ids?: string[]
    sync_direction?: SyncDirection
    force?: boolean
  }) => {
    const response = await axiosInstance.post(`/api/v1/integrations/${id}/sync`, params || {})
    return response.data as {
      success: boolean
      message: string
      sync_log_id: string
      items_synced: number
      items_failed: number
      errors: string[]
    }
  },

  import: async (id: string, data: {
    entity_type: string
    external_keys: string[]
    import_related?: boolean
    map_users?: boolean
  }) => {
    const response = await axiosInstance.post(`/api/v1/integrations/${id}/import`, data)
    return response.data as {
      success: boolean
      message: string
      imported_entities: Array<Record<string, any>>
      failed_imports: Array<Record<string, string>>
    }
  },

  export: async (id: string, data: {
    entity_type: string
    entity_ids: string[]
    create_if_not_exists?: boolean
    update_existing?: boolean
  }) => {
    const response = await axiosInstance.post(`/api/v1/integrations/${id}/export`, data)
    return response.data as {
      success: boolean
      message: string
      exported_entities: Array<Record<string, any>>
      failed_exports: Array<Record<string, string>>
    }
  },

  getLogs: async (id: string, limit: number = 50) => {
    const response = await axiosInstance.get(`/api/v1/integrations/${id}/logs?limit=${limit}`)
    return response.data as IntegrationSyncLog[]
  },
}
