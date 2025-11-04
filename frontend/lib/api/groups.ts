import api from './index'

export interface Group {
  id: string
  name: string
  description?: string
  organisation_id: string
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface GroupUser {
  id: string
  username: string
  email: string
  full_name?: string
  added_at?: string
}

export async function listGroups(organisationId: string): Promise<{ groups: Group[] }> {
  const response = await api.get(`/api/v1/groups/`, {
    params: { organisation_id: organisationId }
  })
  return response.data
}

export async function createGroup(data: {
  name: string
  description?: string
  organisation_id: string
}): Promise<Group> {
  const response = await api.post('/api/v1/groups/', data)
  return response.data
}

export async function updateGroup(
  groupId: string,
  data: { name: string; description?: string }
): Promise<Group> {
  const response = await api.put(`/api/v1/groups/${groupId}`, data)
  return response.data
}

export async function deleteGroup(groupId: string): Promise<void> {
  await api.delete(`/api/v1/groups/${groupId}`)
}

export async function getGroupUsers(groupId: string): Promise<GroupUser[]> {
  const response = await api.get(`/api/v1/groups/${groupId}/users`)
  return response.data
}

export async function addUserToGroup(groupId: string, userId: string): Promise<void> {
  await api.post(`/api/v1/groups/${groupId}/users`, { user_id: userId })
}

export async function removeUserFromGroup(groupId: string, userId: string): Promise<void> {
  await api.delete(`/api/v1/groups/${groupId}/users/${userId}`)
}
