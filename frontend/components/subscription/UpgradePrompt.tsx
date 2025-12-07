'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Sparkles, ArrowUpRight, X } from 'lucide-react'
import { getFeatureDisplayName, PLAN_TIERS } from '@/lib/api/subscription'

// ==================== Upgrade Prompt Modal ====================

interface UpgradePromptProps {
    feature: string
    requiredPlan?: string
    organisationId: string
    onClose: () => void
    onUpgrade?: () => void
}

export function UpgradePrompt({
    feature,
    requiredPlan = 'pro',
    organisationId,
    onClose,
    onUpgrade
}: UpgradePromptProps) {
    const router = useRouter()

    const handleUpgrade = () => {
        if (onUpgrade) {
            onUpgrade()
        } else {
            router.push(`/organizations/${organisationId}/billing`)
        }
        onClose()
    }

    const getPlanDisplayName = (plan: string) => {
        const names: Record<string, string> = {
            free: 'Free',
            basic: 'Basic',
            pro: 'Pro',
            enterprise: 'Enterprise'
        }
        return names[plan] || plan
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">Upgrade Required</h3>
                                <p className="text-sm text-purple-100">Unlock more features</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <Lock className="w-5 h-5 text-gray-400" />
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                                {getFeatureDisplayName(feature)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                This feature requires the {getPlanDisplayName(requiredPlan)} plan or higher
                            </p>
                        </div>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Upgrade your plan to unlock this feature and many more powerful capabilities for your team.
                    </p>
                </div>

                {/* Actions */}
                <div className="p-6 pt-0 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        Maybe Later
                    </button>
                    <button
                        onClick={handleUpgrade}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl text-white font-medium hover:from-purple-600 hover:to-purple-700 transition-colors flex items-center justify-center gap-2"
                    >
                        View Plans
                        <ArrowUpRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}

// ==================== Feature Gate Component ====================

interface FeatureGateProps {
    feature: string
    hasAccess: boolean
    organisationId: string
    children: React.ReactNode
    fallback?: React.ReactNode
    showUpgradeOnClick?: boolean
}

export function FeatureGate({
    feature,
    hasAccess,
    organisationId,
    children,
    fallback,
    showUpgradeOnClick = true
}: FeatureGateProps) {
    const [showUpgrade, setShowUpgrade] = useState(false)

    if (hasAccess) {
        return <>{children}</>
    }

    if (fallback) {
        return <>{fallback}</>
    }

    // Default locked state
    return (
        <>
            <div
                onClick={() => showUpgradeOnClick && setShowUpgrade(true)}
                className={`relative ${showUpgradeOnClick ? 'cursor-pointer' : ''}`}
            >
                <div className="pointer-events-none opacity-50 blur-[1px]">
                    {children}
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 rounded-lg backdrop-blur-sm">
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm font-medium text-gray-600 dark:text-gray-400">
                        <Lock className="w-4 h-4" />
                        Upgrade to unlock
                    </div>
                </div>
            </div>

            {showUpgrade && (
                <UpgradePrompt
                    feature={feature}
                    organisationId={organisationId}
                    onClose={() => setShowUpgrade(false)}
                />
            )}
        </>
    )
}

// ==================== Inline Upgrade Badge ====================

interface UpgradeBadgeProps {
    plan?: string
    onClick?: () => void
}

export function UpgradeBadge({ plan = 'pro', onClick }: UpgradeBadgeProps) {
    return (
        <button
            onClick={onClick}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full hover:from-purple-600 hover:to-purple-700 transition-colors"
        >
            <Sparkles className="w-3 h-3" />
            {plan.charAt(0).toUpperCase() + plan.slice(1)}
        </button>
    )
}

// ==================== Feature Lock Overlay ====================

interface FeatureLockOverlayProps {
    feature: string
    organisationId: string
    requiredPlan?: string
}

export function FeatureLockOverlay({ feature, organisationId, requiredPlan = 'pro' }: FeatureLockOverlayProps) {
    const [showUpgrade, setShowUpgrade] = useState(false)
    const router = useRouter()

    return (
        <>
            <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
                <div className="text-center p-8 max-w-md">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {getFeatureDisplayName(feature)}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        This feature is available on {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)} plan and above.
                    </p>
                    <button
                        onClick={() => router.push(`/organizations/${organisationId}/billing`)}
                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-medium hover:from-purple-600 hover:to-purple-700 transition-colors inline-flex items-center gap-2"
                    >
                        <Sparkles className="w-4 h-4" />
                        Upgrade Now
                    </button>
                </div>
            </div>
        </>
    )
}

export default UpgradePrompt
