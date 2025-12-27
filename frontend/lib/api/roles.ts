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

export type ProjectRoleType =
  | 'project_admin'
  | 'qa_lead'
  | 'qa_engineer'
  | 'auto_eng'
  | 'technical_lead'
  | 'product_owner'
  | 'developer'
  | 'viewer';

export const PROJECT_ROLE_LABELS: Record<ProjectRoleType, string> = {
  project_admin: 'Project Admin',
  qa_lead: 'QA Lead',
  qa_engineer: 'QA Engineer',
  auto_eng: 'Automation Engineer',
  technical_lead: 'Technical Lead',
  product_owner: 'Product Owner',
  developer: 'Developer',
  viewer: 'Viewer',
};

export const LEGACY_ROLE_MAPPING: Record<string, ProjectRoleType> = {
  'owner': 'project_admin',
  'admin': 'project_admin',
  'qa_manager': 'qa_lead',
  'qa_lead': 'qa_lead',
  'qa_engineer': 'qa_engineer',
  'tester': 'qa_engineer',
  'product_owner': 'product_owner',
  'dev_ro': 'developer',
  'viewer': 'viewer',
};

export const PROJECT_ROLE_COLORS: Record<string, string> = {
  project_admin: 'text-red-600 bg-red-50 border-red-200',
  qa_lead: 'text-blue-600 bg-blue-50 border-blue-200',
  qa_engineer: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  auto_eng: 'text-purple-600 bg-purple-50 border-purple-200',
  technical_lead: 'text-amber-600 bg-amber-50 border-amber-200',
  product_owner: 'text-pink-600 bg-pink-50 border-pink-200',
  developer: 'text-cyan-600 bg-cyan-50 border-cyan-200',
  viewer: 'text-slate-600 bg-slate-50 border-slate-200',
  // Fallbacks
  'owner': 'text-red-600 bg-red-50 border-red-200',
  'admin': 'text-red-600 bg-red-50 border-red-200',
};

// Role descriptions
export const PROJECT_ROLE_DESCRIPTIONS: Record<ProjectRoleType, string> = {
  project_admin: 'Full project control — manage settings, billing, and members',
  qa_lead: 'Test strategy owner — designs plans and reviews technical execution',
  qa_engineer: 'Creates and executes manual and automated tests',
  auto_eng: 'Manages automation flows, AI scripts, and k6 performance tests',
  technical_lead: 'Technical reviewer — validates approach and environment readiness',
  product_owner: 'Business stakeholder — validates scenarios and reviews coverage',
  developer: 'Read-only access to tests and results for debugging',
  viewer: 'View-only access to dashboards and reports',
};

// Role hierarchy (higher = more privilege)
export const PROJECT_ROLE_HIERARCHY: Record<ProjectRoleType, number> = {
  project_admin: 100,
  qa_lead: 90,
  technical_lead: 85,
  auto_eng: 80,
  qa_engineer: 70,
  product_owner: 60,
  developer: 40,
  viewer: 10,
};

// Helper functions
export function getProjectRoleLabel(roleType: string): string {
  return PROJECT_ROLE_LABELS[roleType as ProjectRoleType] || roleType
}

export function getProjectRoleColor(roleType: string): string {
  return PROJECT_ROLE_COLORS[roleType] || 'text-slate-600 bg-slate-50 border-slate-200'
}

export function getProjectRoleDescription(roleType: string): string {
  return PROJECT_ROLE_DESCRIPTIONS[roleType as ProjectRoleType] || ''
}

export function canManageProjectRole(currentRoleType: string, targetRoleType: string): boolean {
  const currentLevel = PROJECT_ROLE_HIERARCHY[currentRoleType as ProjectRoleType] || 0
  const targetLevel = PROJECT_ROLE_HIERARCHY[targetRoleType as ProjectRoleType] || 0
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
