/**
 * Organization Roles API Client
 * 
 * Functions for managing organization roles and user role assignments.
 */

import api from '../api'

// ==================== Types ====================

export interface RolePermissions {
    can_manage_billing: boolean
    can_delete_org: boolean
    can_manage_users: boolean
    can_manage_roles: boolean
    can_manage_settings: boolean
    can_create_projects: boolean
    can_delete_projects: boolean
    can_view_audit_logs: boolean
    can_manage_integrations: boolean
    can_execute_tests: boolean
    can_write_tests: boolean
    can_read_tests: boolean
}

export interface OrganizationRole {
    id: string
    name: string
    role_type: 'owner' | 'admin' | 'member' | 'viewer'
    description: string | null
    color: string | null
    is_system_role: boolean
    is_default: boolean
    permissions: RolePermissions
    user_count: number
}

export interface UserRoleAssignment {
    user_id: string
    email: string
    username: string
    full_name: string | null
    role: string
    role_name: string
    role_color: string | null
    joined_at: string | null
    is_active: boolean
}

export interface CreateRoleRequest {
    name: string
    role_type?: string
    description?: string
    color?: string
    permissions?: Partial<RolePermissions>
}

export interface UpdateRoleRequest {
    name?: string
    description?: string
    color?: string
    permissions?: Partial<RolePermissions>
    is_default?: boolean
}

export interface AssignRoleRequest {
    user_id: string
    role_type: 'owner' | 'admin' | 'member' | 'viewer'
}

// ==================== API Functions ====================

/**
 * List all roles for an organization
 */
export async function listOrgRoles(organisationId: string): Promise<OrganizationRole[]> {
    const response = await api.get(`/api/v1/organisations/${organisationId}/org-roles`)
    return response.data
}

/**
 * Create a custom role (Pro+ plans only)
 */
export async function createOrgRole(
    organisationId: string,
    data: CreateRoleRequest
): Promise<OrganizationRole> {
    const response = await api.post(`/api/v1/organisations/${organisationId}/org-roles`, data)
    return response.data
}

/**
 * Update a role
 */
export async function updateOrgRole(
    organisationId: string,
    roleId: string,
    data: UpdateRoleRequest
): Promise<OrganizationRole> {
    const response = await api.put(`/api/v1/organisations/${organisationId}/org-roles/${roleId}`, data)
    return response.data
}

/**
 * Delete a custom role
 */
export async function deleteOrgRole(organisationId: string, roleId: string): Promise<void> {
    await api.delete(`/api/v1/organisations/${organisationId}/org-roles/${roleId}`)
}

/**
 * List all members of an organization
 */
export async function listOrgMembers(organisationId: string): Promise<UserRoleAssignment[]> {
    const response = await api.get(`/api/v1/organisations/${organisationId}/members`)
    return response.data
}

/**
 * Assign a role to a member
 */
export async function assignMemberRole(
    organisationId: string,
    userId: string,
    roleType: string
): Promise<void> {
    await api.put(`/api/v1/organisations/${organisationId}/members/${userId}/role`, {
        user_id: userId,
        role_type: roleType
    })
}

/**
 * Remove a member from the organization
 */
export async function removeMember(organisationId: string, userId: string): Promise<void> {
    await api.delete(`/api/v1/organisations/${organisationId}/members/${userId}`)
}

/**
 * Initialize default roles for an organization
 */
export async function initializeRoles(organisationId: string): Promise<{ message: string; roles: string[] }> {
    const response = await api.post(`/api/v1/organisations/${organisationId}/initialize-roles`)
    return response.data
}

// ==================== Helper Functions ====================

export const ROLE_COLORS: Record<string, string> = {
    owner: '#EF4444',
    admin: '#F59E0B',
    member: '#10B981',
    viewer: '#6B7280'
}

export const ROLE_LABELS: Record<string, string> = {
    owner: 'Owner',
    admin: 'Administrator',
    member: 'Member',
    viewer: 'Viewer'
}

export const ROLE_HIERARCHY = ['viewer', 'member', 'admin', 'owner']

/**
 * Get role badge color for UI
 */
export function getRoleBadgeColor(roleType: string): string {
    return ROLE_COLORS[roleType] || '#6B7280'
}

/**
 * Get human-readable role label
 */
export function getRoleLabel(roleType: string): string {
    return ROLE_LABELS[roleType] || roleType
}

/**
 * Check if role A can manage role B (based on hierarchy)
 */
export function canManageRole(currentRole: string, targetRole: string): boolean {
    const currentLevel = ROLE_HIERARCHY.indexOf(currentRole)
    const targetLevel = ROLE_HIERARCHY.indexOf(targetRole)
    return currentLevel > targetLevel
}
