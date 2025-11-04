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
