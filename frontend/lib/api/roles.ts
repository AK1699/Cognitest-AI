import axios from '@/lib/axios'

export interface Permission {
  id: string
  name: string
  description?: string
  resource: string
  action: string
}

export interface ProjectRole {
  id: string
  name: string
  description?: string
  role_type: string
  organisation_id: string
  is_system_role: boolean
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface UserProjectRoleWithDetails {
  id: string
  user_id: string
  role_id: string
  project_id: string
  role: ProjectRole
  user?: {
    username: string
    email: string
  }
}

export interface GroupProjectRoleWithDetails {
  id: string
  group_id: string
  role_id: string
  project_id: string
  role: ProjectRole
  group?: {
    name: string
  }
}

// ==================== Enterprise Project Role Types ====================

export type ProjectRoleType = 'project_admin' | 'qa_lead' | 'tester' | 'auto_eng' | 'dev_ro' | 'viewer'

// Role labels for display
export const PROJECT_ROLE_LABELS: Record<string, string> = {
  'project_admin': 'Project Admin',
  'qa_lead': 'QA Lead',
  'tester': 'Tester',
  'auto_eng': 'Automation Engineer',
  'dev_ro': 'Developer',
  'viewer': 'Viewer',
  // Legacy role mappings for backwards compatibility
  'owner': 'Project Admin',
  'admin': 'Project Admin',
  'qa_manager': 'QA Lead',
  'qa_engineer': 'Tester',
  'product_owner': 'Developer',
}

// Role colors for badges and UI
export const PROJECT_ROLE_COLORS: Record<string, string> = {
  'project_admin': '#DC2626',  // Red
  'qa_lead': '#2563EB',        // Blue
  'tester': '#059669',         // Green
  'auto_eng': '#7C3AED',       // Purple
  'dev_ro': '#0891B2',         // Cyan
  'viewer': '#6B7280',         // Gray
  // Alternative/legacy mappings
  'owner': '#DC2626',
  'admin': '#DC2626',
  'administrator': '#DC2626',  // Alternative for project_admin
  'qa_manager': '#2563EB',
  'qa_engineer': '#059669',
  'product_owner': '#0891B2',
  'project_manager': '#F59E0B', // Amber - for project managers
  'developer': '#0891B2',       // Cyan - same as dev_ro
}

// Role descriptions
export const PROJECT_ROLE_DESCRIPTIONS: Record<string, string> = {
  'project_admin': 'Full project control - manages all test artifacts, approvals, automation, and security scans',
  'qa_lead': 'Leads testers, approves test cases, creates test cycles, and validates AI-generated fixes',
  'tester': 'Creates and executes tests, records evidence, runs automation flows',
  'auto_eng': 'Manages automation flows, k6 scripts, accepts self-healing suggestions',
  'dev_ro': 'Read-only access to test artifacts, can record evidence and view dashboards',
  'viewer': 'Read-only access to view tests, results, and dashboards',
}

// Role hierarchy (higher = more privilege)
export const PROJECT_ROLE_HIERARCHY: Record<string, number> = {
  'project_admin': 100,
  'qa_lead': 80,
  'auto_eng': 60,
  'tester': 50,
  'dev_ro': 20,
  'viewer': 10,
}

// Helper functions
export function getProjectRoleLabel(roleType: string): string {
  return PROJECT_ROLE_LABELS[roleType] || roleType
}

export function getProjectRoleColor(roleType: string): string {
  return PROJECT_ROLE_COLORS[roleType] || '#6B7280'
}

export function getProjectRoleDescription(roleType: string): string {
  return PROJECT_ROLE_DESCRIPTIONS[roleType] || ''
}

export function canManageProjectRole(currentRoleType: string, targetRoleType: string): boolean {
  const currentLevel = PROJECT_ROLE_HIERARCHY[currentRoleType] || 0
  const targetLevel = PROJECT_ROLE_HIERARCHY[targetRoleType] || 0
  return currentLevel > targetLevel
}

export async function listRoles(organisationId: string): Promise<{ roles: ProjectRole[] }> {
  const response = await axios.get(`/api/v1/roles/`, {
    params: { organisation_id: organisationId }
  })
  return response.data
}

export async function listUserRoles(userId: string, projectId: string): Promise<UserProjectRoleWithDetails[]> {
  const response = await axios.get(`/api/v1/roles/assignments/users`, {
    params: { user_id: userId, project_id: projectId }
  })
  return response.data.assignments || []
}

export async function listGroupRoles(groupId: string, projectId: string): Promise<GroupProjectRoleWithDetails[]> {
  const response = await axios.get(`/api/v1/roles/assignments/groups`, {
    params: { group_id: groupId, project_id: projectId }
  })
  return response.data.assignments || []
}

export async function assignRoleToUser(
  userId: string,
  roleId: string,
  projectId: string
): Promise<UserProjectRoleWithDetails> {
  const response = await axios.post('/api/v1/roles/assignments/users', {
    user_id: userId,
    role_id: roleId,
    project_id: projectId
  })
  return response.data
}

export async function assignRoleToGroup(
  groupId: string,
  roleId: string,
  projectId: string
): Promise<GroupProjectRoleWithDetails> {
  const response = await axios.post('/api/v1/roles/assignments/groups', {
    group_id: groupId,
    role_id: roleId,
    project_id: projectId
  })
  return response.data
}

export async function removeRoleFromUser(assignmentId: string): Promise<void> {
  await axios.delete(`/api/v1/roles/assignments/users/${assignmentId}`)
}

export async function removeRoleFromGroup(assignmentId: string): Promise<void> {
  await axios.delete(`/api/v1/roles/assignments/groups/${assignmentId}`)
}

export async function createRole(
  organisationId: string,
  name: string,
  roleType: string,
  description?: string,
  permissions?: string[]
): Promise<ProjectRole> {
  const response = await axios.post('/api/v1/roles/', {
    organisation_id: organisationId,
    name,
    role_type: roleType,
    description,
    permissions: permissions || []
  })
  return response.data
}

export async function deleteRole(roleId: string): Promise<void> {
  await axios.delete(`/api/v1/roles/${roleId}`)
}

export async function listPermissions(): Promise<Permission[]> {
  const response = await axios.get('/api/v1/roles/permissions')
  return response.data.permissions || []
}
