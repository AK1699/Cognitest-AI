/**
 * Session API - Store user preferences server-side in Redis
 * Replaces localStorage for current_organization_id and current_project_id
 */

import api from './index'

export interface SessionData {
    current_organization_id?: string
    current_project_id?: string
    preferences?: Record<string, unknown>
}

/**
 * Get current session data from server
 */
export async function getSession(): Promise<SessionData> {
    try {
        const response = await api.get('/api/v1/auth/session')
        return response.data || {}
    } catch (error) {
        console.warn('Failed to get session:', error)
        return {}
    }
}

/**
 * Update session data on server
 */
export async function updateSession(data: Partial<SessionData>): Promise<boolean> {
    try {
        await api.put('/api/v1/auth/session', data)
        return true
    } catch (error) {
        console.error('Failed to update session:', error)
        return false
    }
}

/**
 * Clear all session data
 */
export async function clearSession(): Promise<boolean> {
    try {
        await api.delete('/api/v1/auth/session')
        return true
    } catch (error) {
        console.error('Failed to clear session:', error)
        return false
    }
}

/**
 * Set current organization ID
 */
export async function setCurrentOrganization(orgId: string): Promise<boolean> {
    return updateSession({ current_organization_id: orgId })
}

/**
 * Get current organization ID
 */
export async function getCurrentOrganization(): Promise<string | undefined> {
    const session = await getSession()
    return session.current_organization_id
}

/**
 * Set current project ID
 */
export async function setCurrentProject(projectId: string): Promise<boolean> {
    return updateSession({ current_project_id: projectId })
}

/**
 * Get current project ID
 */
export async function getCurrentProject(): Promise<string | undefined> {
    const session = await getSession()
    return session.current_project_id
}

/**
 * Set selected environment for a project
 */
export async function setSelectedEnvironment(projectId: string, environmentId: string): Promise<boolean> {
    const session = await getSession()
    const preferences = session.preferences || {}
    const selectedEnvironments = (preferences.selectedEnvironments as Record<string, string>) || {}

    return updateSession({
        preferences: {
            ...preferences,
            selectedEnvironments: {
                ...selectedEnvironments,
                [projectId]: environmentId
            }
        }
    })
}

/**
 * Get selected environment for a project
 */
export async function getSelectedEnvironment(projectId: string): Promise<string | undefined> {
    const session = await getSession()
    const preferences = session.preferences || {}
    const selectedEnvironments = (preferences.selectedEnvironments as Record<string, string>) || {}
    return selectedEnvironments[projectId]
}
