'use client'

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react'
import { checkFeatureAccess, getOrgFeatures, type FeatureCheckResult } from '@/lib/api/subscription'

// ==================== Types ====================

export interface FeatureGateContextType {
    features: string[]
    loading: boolean
    hasFeature: (feature: string) => boolean
    checkFeature: (feature: string) => Promise<FeatureCheckResult>
    refreshFeatures: () => Promise<void>
}

// ==================== Context ====================

const FeatureGateContext = createContext<FeatureGateContextType | null>(null)

// ==================== Provider ====================

interface FeatureGateProviderProps {
    organisationId: string
    children: ReactNode
}

export function FeatureGateProvider({ organisationId, children }: FeatureGateProviderProps) {
    const [features, setFeatures] = useState<string[]>([])
    const [loading, setLoading] = useState(true)

    const refreshFeatures = useCallback(async () => {
        if (!organisationId) return
        try {
            setLoading(true)
            const orgFeatures = await getOrgFeatures(organisationId)
            setFeatures(orgFeatures)
        } catch (error) {
            console.error('Failed to load features:', error)
            // Default to free tier features on error
            setFeatures(['test_management'])
        } finally {
            setLoading(false)
        }
    }, [organisationId])

    useEffect(() => {
        refreshFeatures()
    }, [refreshFeatures])

    const hasFeature = useCallback((feature: string) => {
        return features.includes(feature)
    }, [features])

    const checkFeature = useCallback(async (feature: string): Promise<FeatureCheckResult> => {
        if (!organisationId) {
            return { allowed: false, reason: 'No organization selected', upgrade_to: null }
        }
        return checkFeatureAccess(organisationId, feature)
    }, [organisationId])

    return (
        <FeatureGateContext.Provider value={{
            features,
            loading,
            hasFeature,
            checkFeature,
            refreshFeatures
        }}>
            {children}
        </FeatureGateContext.Provider>
    )
}

// ==================== Hook ====================

export function useFeatureGate() {
    const context = useContext(FeatureGateContext)
    if (!context) {
        throw new Error('useFeatureGate must be used within a FeatureGateProvider')
    }
    return context
}

// ==================== Standalone Hook (for use without provider) ====================

export function useFeatureCheck(organisationId: string) {
    const [features, setFeatures] = useState<string[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!organisationId) return

        const loadFeatures = async () => {
            try {
                setLoading(true)
                const orgFeatures = await getOrgFeatures(organisationId)
                setFeatures(orgFeatures)
            } catch (error) {
                console.error('Failed to load features:', error)
                setFeatures(['test_management'])
            } finally {
                setLoading(false)
            }
        }

        loadFeatures()
    }, [organisationId])

    const hasFeature = useCallback((feature: string) => {
        return features.includes(feature)
    }, [features])

    const checkFeature = useCallback(async (feature: string) => {
        return checkFeatureAccess(organisationId, feature)
    }, [organisationId])

    return { features, loading, hasFeature, checkFeature }
}
