/**
 * Zustand store for managing organization data globally
 * Caches organisations to prevent duplicate API calls during navigation
 */

import { create } from 'zustand'
import api from '@/lib/api'
import { getSession, setCurrentOrganization as setSessionOrg } from '@/lib/api/session'

interface Organisation {
    id: string
    name: string
    website?: string
    description?: string
    owner_id: string
    created_at: string
    updated_at?: string
}

interface OrganizationState {
    organisations: Organisation[]
    currentOrganisation: Organisation | null
    isOwner: boolean
    userRole: string | null  // Actual role from user_organisations
    loading: boolean
    initialized: boolean

    // Actions
    fetchOrganisations: (userId?: string) => Promise<void>
    setCurrentOrganisation: (org: Organisation, userId?: string) => Promise<void>
    refreshUserRole: (userId: string) => Promise<void>  // Force-refresh role after changes
    reset: () => void
}

export const useOrganizationStore = create<OrganizationState>()((set, get) => ({
    organisations: [],
    currentOrganisation: null,
    isOwner: false,
    userRole: null,
    loading: false,
    initialized: false,

    fetchOrganisations: async (userId?: string) => {
        // Skip if already initialized and has data
        const state = get()
        if (state.initialized && state.organisations.length > 0) {
            return
        }

        set({ loading: true })

        try {
            const response = await api.get('/api/v1/organisations/')
            const organisations = response.data

            // Get current org from Redis session
            const session = await getSession()
            const currentOrgId = session.current_organization_id

            let currentOrg: Organisation | null = null

            if (currentOrgId && organisations.length > 0) {
                currentOrg = organisations.find((o: Organisation) => o.id === currentOrgId) || null
                if (!currentOrg && organisations.length > 0) {
                    currentOrg = organisations[0]
                    await setSessionOrg(organisations[0].id)
                }
            } else if (organisations.length > 0) {
                currentOrg = organisations[0]
                await setSessionOrg(organisations[0].id)
            }

            // Fetch actual user role from org members API
            let userRole: string | null = null
            let isOwner = false
            if (currentOrg && userId) {
                try {
                    const membersRes = await api.get(`/api/v1/organisations/${currentOrg.id}/members/`)
                    const userMembership = membersRes.data.find((m: any) => m.user_id === userId)
                    if (userMembership) {
                        userRole = userMembership.role
                        isOwner = userRole === 'owner'
                    }
                } catch (err) {
                    // Fallback to owner_id check if members API fails
                    isOwner = currentOrg.owner_id === userId
                    userRole = isOwner ? 'owner' : 'member'
                }
            }

            set({
                organisations,
                currentOrganisation: currentOrg,
                isOwner,
                userRole,
                loading: false,
                initialized: true
            })
        } catch (error) {
            console.error('Failed to fetch organisations:', error)
            set({ loading: false, initialized: true })
        }
    },

    setCurrentOrganisation: async (org: Organisation, userId?: string) => {
        await setSessionOrg(org.id)

        // Fetch actual user role for this org
        let userRole: string | null = null
        let isOwner = false
        if (userId) {
            try {
                const membersRes = await api.get(`/api/v1/organisations/${org.id}/members/`)
                const userMembership = membersRes.data.find((m: any) => m.user_id === userId)
                if (userMembership) {
                    userRole = userMembership.role
                    isOwner = userRole === 'owner'
                }
            } catch (err) {
                // Fallback to owner_id check
                isOwner = org.owner_id === userId
                userRole = isOwner ? 'owner' : 'member'
            }
        }

        set({ currentOrganisation: org, isOwner, userRole })
        window.dispatchEvent(new CustomEvent('organisationChanged', { detail: org }))
    },

    // Force-refresh user role - call this after any role change
    refreshUserRole: async (userId: string) => {
        const state = get()
        if (!state.currentOrganisation) return

        try {
            const membersRes = await api.get(`/api/v1/organisations/${state.currentOrganisation.id}/members/`)
            const userMembership = membersRes.data.find((m: any) => m.user_id === userId)
            if (userMembership) {
                const userRole = userMembership.role
                const isOwner = userRole === 'owner'
                set({ userRole, isOwner })
            }
        } catch (err) {
            console.error('Failed to refresh user role:', err)
        }
    },

    reset: () => {
        set({
            organisations: [],
            currentOrganisation: null,
            isOwner: false,
            userRole: null,
            loading: false,
            initialized: false
        })
    }
}))
