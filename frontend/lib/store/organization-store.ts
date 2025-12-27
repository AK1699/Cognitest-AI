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
    loading: boolean
    initialized: boolean

    // Actions
    fetchOrganisations: (userId?: string) => Promise<void>
    setCurrentOrganisation: (org: Organisation, userId?: string) => Promise<void>
    reset: () => void
}

export const useOrganizationStore = create<OrganizationState>()((set, get) => ({
    organisations: [],
    currentOrganisation: null,
    isOwner: false,
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

            const isOwner = userId && currentOrg ? currentOrg.owner_id === userId : false

            set({
                organisations,
                currentOrganisation: currentOrg,
                isOwner,
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
        const isOwner = userId ? org.owner_id === userId : false
        set({ currentOrganisation: org, isOwner })
        window.dispatchEvent(new CustomEvent('organisationChanged', { detail: org }))
    },

    reset: () => {
        set({
            organisations: [],
            currentOrganisation: null,
            isOwner: false,
            loading: false,
            initialized: false
        })
    }
}))
