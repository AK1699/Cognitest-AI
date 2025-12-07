/**
 * Subscription API Client
 * 
 * Functions for managing subscriptions, plans, and feature access.
 */

import api from '../api'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ==================== Types ====================

export interface SubscriptionPlan {
    id: string
    name: string
    display_name: string
    description: string | null
    max_users: number
    max_projects: number
    max_test_cases: number
    max_test_executions_per_month: number | null
    features: string[]
    price_monthly: number
    price_yearly: number
    is_current: boolean
}

export interface OrganizationSubscription {
    id: string
    plan_name: string
    plan_display_name: string
    status: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'expired'
    billing_cycle: 'monthly' | 'yearly'
    current_period_start: string | null
    current_period_end: string | null
    is_trialing: boolean
    cancel_at_period_end: boolean
    features: string[]
    limits: {
        max_users: number
        max_projects: number
        max_test_cases: number
        max_test_executions_per_month: number | null
    }
}

export interface FeatureCheckResult {
    allowed: boolean
    reason: string | null
    upgrade_to: string | null
}

export interface UsageLimit {
    resource: string
    current: number
    limit: number
    is_unlimited: boolean
    percentage_used: number
}

// ==================== API Functions ====================

/**
 * List all available subscription plans
 */
export async function listPlans(organisationId?: string): Promise<SubscriptionPlan[]> {
    const params = organisationId ? { organisation_id: organisationId } : {}
    const response = await api.get('/api/v1/subscription/plans', { params })
    return response.data
}

/**
 * Get the current subscription for an organization
 */
export async function getCurrentSubscription(organisationId: string): Promise<OrganizationSubscription> {
    const response = await api.get(`/api/v1/subscription/current/${organisationId}`)
    return response.data
}

/**
 * Check if an organization has access to a specific feature
 */
export async function checkFeatureAccess(organisationId: string, feature: string): Promise<FeatureCheckResult> {
    const response = await api.post(`/api/v1/subscription/check-feature/${organisationId}`, {
        feature
    })
    return response.data
}

/**
 * Get usage limits and current usage for an organization
 */
export async function getUsageLimits(organisationId: string): Promise<UsageLimit[]> {
    const response = await api.get(`/api/v1/subscription/usage/${organisationId}`)
    return response.data
}

/**
 * Get list of features available to an organization
 */
export async function getOrgFeatures(organisationId: string): Promise<string[]> {
    const response = await api.get(`/api/v1/subscription/features/${organisationId}`)
    return response.data.features
}

// ==================== Feature Constants ====================

export const FEATURES = {
    TEST_MANAGEMENT: 'test_management',
    API_TESTING: 'api_testing',
    AUTOMATION_HUB: 'automation_hub',
    PERFORMANCE_TESTING: 'performance_testing',
    SECURITY_TESTING: 'security_testing',
    MOBILE_TESTING: 'mobile_testing',
    CUSTOM_ROLES: 'custom_roles',
    AUDIT_LOGS: 'audit_logs',
    SSO_SAML: 'sso_saml',
    PRIORITY_SUPPORT: 'priority_support'
} as const

export const PLAN_TIERS = {
    FREE: 'free',
    BASIC: 'basic',
    PRO: 'pro',
    ENTERPRISE: 'enterprise'
} as const

// ==================== Helper Functions ====================

/**
 * Check if a limit value represents unlimited
 */
export function isUnlimited(limit: number): boolean {
    return limit === -1
}

/**
 * Format a limit value for display (handles -1 as ∞)
 */
export function formatLimit(limit: number): string {
    return limit === -1 ? '∞' : limit.toLocaleString()
}

/**
 * Get the display name for a feature key
 */
export function getFeatureDisplayName(feature: string): string {
    const names: Record<string, string> = {
        test_management: 'Test Case Management',
        api_testing: 'API Testing',
        automation_hub: 'Automation Hub',
        performance_testing: 'Performance Testing',
        security_testing: 'Security Testing',
        mobile_testing: 'Mobile Testing',
        custom_roles: 'Custom Roles',
        audit_logs: 'Audit Logs',
        sso_saml: 'SSO / SAML',
        priority_support: 'Priority Support'
    }
    return names[feature] || feature
}
