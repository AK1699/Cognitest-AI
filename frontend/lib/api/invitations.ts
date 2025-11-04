import api from './index'

export interface Invitation {
  id: string
  email: string
  token: string
  organisation_id: string
  invited_by: string
  expiry_date: string
  accepted_at?: string
  created_at: string
}

export async function createInvitation(data: {
  email: string
  full_name?: string
  organisation_id: string
  expiry_days?: number
  role_id?: string
}): Promise<Invitation> {
  const response = await api.post('/api/v1/invitations/', data)
  return response.data
}

export async function listInvitations(organisationId: string): Promise<Invitation[]> {
  const response = await api.get(`/api/v1/invitations/`, {
    params: { organisation_id: organisationId }
  })
  return response.data
}

export async function cancelInvitation(invitationId: string): Promise<void> {
  await api.delete(`/api/v1/invitations/${invitationId}`)
}

export async function acceptInvitation(token: string, data: {
  username: string
  password: string
  full_name?: string
}): Promise<{ access_token: string; refresh_token: string }> {
  const response = await api.post('/api/v1/invitations/accept', {
    invitation_token: token,
    ...data
  })
  return response.data
}
