import api from './index'

export interface ExecutionSettings {
    videoRecording: boolean
    screenshotOnFailure: boolean
    screenshotEachStep: boolean
    aiSelfHeal: boolean
}

export interface ProjectSettings {
    environments?: {
        id: string
        name: string
        baseUrl?: string
        variables: Record<string, string>
    }[]
    executionSettings?: ExecutionSettings
    [key: string]: any
}

export interface ProjectResponse {
    id: string
    name: string
    settings: ProjectSettings
    [key: string]: any
}

export const projectsApi = {
    getProject: async (projectId: string) => {
        const response = await api.get<ProjectResponse>(`/api/v1/projects/${projectId}`)
        return response.data
    },

    updateProject: async (projectId: string, data: { settings: ProjectSettings }) => {
        const response = await api.put<ProjectResponse>(`/api/v1/projects/${projectId}`, data)
        return response.data
    },
}
