/**
 * Organization Roles API Client
 * 
 * Functions for managing organization roles and user role assignments.
 * Updated for enterprise RBAC with SecOfficer, Auditor, and Service Account roles.
 */

import api from '../api'

// ==================== Types ====================

export interface RolePermissions {
    // Billing & Organization
    can_manage_billing: boolean
    can_delete_org: boolean
    can_delete_tenant_gdpr: boolean
    can_edit_branding: boolean
    // User & Team Management
    can_manage_users: boolean
    can_impersonate_user: boolean
    can_manage_roles: boolean
    can_manage_teams: boolean
    // Settings & Security
    can_manage_settings: boolean
    can_configure_sso: boolean
    can_rotate_secrets: boolean
    // Projects
    can_create_projects: boolean
    can_delete_projects: boolean
    // Audit & Compliance
    can_view_audit_logs: boolean
    can_export_audit: boolean
    can_delete_audit: boolean
    can_view_invoices: boolean
    can_export_cost_report: boolean
    // Security Features
    can_manage_scan_profiles: boolean
    can_triage_vuln: boolean
    can_mark_false_positive: boolean
    // Integrations & Marketplace
    can_manage_integrations: boolean
    can_publish_marketplace: boolean
    // Testing
    can_execute_tests: boolean
    can_write_tests: boolean
    can_read_tests: boolean
}

export type OrgRoleType = 'owner' | 'admin' | 'sec_officer' | 'auditor' | 'svc_account' | 'member' | 'viewer'

export interface OrganizationRole {
    id: string
    name: string
    role_type: OrgRoleType
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
    role_type: OrgRoleType
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
    owner: '#EF4444',       // Red
    admin: '#F59E0B',       // Amber
    sec_officer: '#8B5CF6', // Purple
    auditor: '#06B6D4',     // Cyan
    svc_account: '#64748B', // Slate
    member: '#10B981',      // Green
    viewer: '#6B7280'       // Gray
}

export const ROLE_LABELS: Record<string, string> = {
    owner: 'Owner',
    admin: 'Administrator',
    sec_officer: 'Security Officer',
    auditor: 'Auditor',
    svc_account: 'Service Account',
    member: 'Member',
    viewer: 'Viewer'
}

export const ROLE_DESCRIPTIONS: Record<string, string> = {
    owner: 'Full control including billing, GDPR deletion, and impersonation',
    admin: 'Manage users, settings, SSO, and all features except billing',
    sec_officer: 'Security & compliance - scan profiles, vulnerability triage',
    auditor: 'Read-only compliance - audit logs, invoices, cost reports',
    svc_account: 'CI/CD integration - token auth, execute flows only',
    member: 'Standard access to create and run tests',
    viewer: 'Read-only access to view tests and results'
}

export const ROLE_HIERARCHY: OrgRoleType[] = ['viewer', 'svc_account', 'member', 'auditor', 'sec_officer', 'admin', 'owner']

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
 * Get role description
 */
export function getRoleDescription(roleType: string): string {
    return ROLE_DESCRIPTIONS[roleType] || ''
}

/**
 * Check if role A can manage role B (based on hierarchy)
 */
export function canManageRole(currentRole: string, targetRole: string): boolean {
    const currentLevel = ROLE_HIERARCHY.indexOf(currentRole as OrgRoleType)
    const targetLevel = ROLE_HIERARCHY.indexOf(targetRole as OrgRoleType)
    return currentLevel > targetLevel
}

/**
 * Check if a role is a service account
 */
export function isServiceAccountRole(roleType: string): boolean {
    return roleType === 'svc_account'
}

