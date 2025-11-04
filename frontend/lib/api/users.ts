import api from './index'

export interface User {
  id: string
  username: string
  email: string
  full_name?: string
  is_active: boolean
  created_at: string
  updated_at?: string
}

export async function listOrganisationUsers(organisationId: string): Promise<User[]> {
  const response = await api.get(`/api/v1/organisations/${organisationId}/users`)
  return response.data
}

export async function getUserById(userId: string): Promise<User> {
  const response = await api.get(`/api/v1/users/${userId}`)
  return response.data
}

export async function updateUser(userId: string, data: Partial<User>): Promise<User> {
  const response = await api.put(`/api/v1/users/${userId}`, data)
  return response.data
}

export async function deleteUser(userId: string): Promise<void> {
  await api.delete(`/api/v1/users/${userId}`)
}
