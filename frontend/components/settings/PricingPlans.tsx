'use client'

import React, { useState, useEffect } from 'react'
import {
    Check,
    X,
    Crown,
    Zap,
    Building2,
    Users,
    FolderKanban,
    FileText,
    Loader2,
    ArrowUpRight,
    Sparkles
} from 'lucide-react'
import {
    listPlans,
    getCurrentSubscription,
    getUsageLimits,
    formatLimit,
    getFeatureDisplayName,
    type SubscriptionPlan,
    type OrganizationSubscription,
    type UsageLimit
} from '@/lib/api/subscription'

interface PricingPlansProps {
    organisationId: string
}

export function PricingPlans({ organisationId }: PricingPlansProps) {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([])
    const [currentSubscription, setCurrentSubscription] = useState<OrganizationSubscription | null>(null)
    const [usage, setUsage] = useState<UsageLimit[]>([])
    const [loading, setLoading] = useState(true)
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        loadData()
    }, [organisationId])

    const loadData = async () => {
        try {
            setLoading(true)
            setError(null)

            const [plansData, subscriptionData, usageData] = await Promise.all([
                listPlans(organisationId),
                getCurrentSubscription(organisationId).catch(() => null),
                getUsageLimits(organisationId).catch(() => [])
            ])

            setPlans(plansData)
            setCurrentSubscription(subscriptionData)
            setUsage(usageData)
        } catch (err: any) {
            setError(err.message || 'Failed to load pricing data')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const getPlanIcon = (planName: string) => {
        switch (planName) {
            case 'free': return <Users className="w-6 h-6" />
            case 'basic': return <Zap className="w-6 h-6" />
            case 'pro': return <Crown className="w-6 h-6" />
            case 'enterprise': return <Building2 className="w-6 h-6" />
            default: return <Sparkles className="w-6 h-6" />
        }
    }

    const getPlanColor = (planName: string) => {
        switch (planName) {
            case 'free': return 'from-gray-500 to-gray-600'
            case 'basic': return 'from-blue-500 to-blue-600'
            case 'pro': return 'from-purple-500 to-purple-600'
            case 'enterprise': return 'from-amber-500 to-amber-600'
            default: return 'from-gray-500 to-gray-600'
        }
    }

    const allFeatures = [
        'test_management',
        'api_testing',
        'automation_hub',
        'performance_testing',
        'security_testing',
        'mobile_testing',
        'custom_roles',
        'audit_logs',
        'sso_saml',
        'priority_support'
    ]

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl">
                <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Current Plan Summary */}
            {currentSubscription && (
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Current Plan: {currentSubscription.plan_display_name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {currentSubscription.status === 'trialing' && '🎉 Trial Period • '}
                                Billing: {currentSubscription.billing_cycle}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            {usage.map((u) => (
                                <div key={u.resource} className="text-center">
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {u.is_unlimited ? '∞' : `${u.current}/${u.limit}`}
                                    </div>
                                    <div className="text-xs text-gray-500 capitalize">{u.resource.replace('_', ' ')}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Billing Toggle */}
            <div className="flex justify-center">
                <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg inline-flex">
                    <button
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${billingCycle === 'monthly'
                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-600 dark:text-gray-400'
                            }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setBillingCycle('yearly')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${billingCycle === 'yearly'
                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-600 dark:text-gray-400'
                            }`}
                    >
                        Yearly
                        <span className="text-xs bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                            Save 17%
                        </span>
                    </button>
                </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {plans.map((plan) => {
                    const isCurrent = plan.is_current
                    const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly / 12

                    return (
                        <div
                            key={plan.id}
                            className={`relative rounded-xl border-2 transition-all ${isCurrent
                                ? 'border-primary shadow-lg shadow-primary/10'
                                : plan.name === 'pro'
                                    ? 'border-purple-300 dark:border-purple-500/50 hover:border-purple-400 dark:hover:border-purple-400'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                } bg-white dark:bg-gray-800`}
                        >
                            {/* Popular Badge */}
                            {plan.name === 'pro' && (
                                <div className="flex justify-center pt-4 -mb-2">
                                    <span className="bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                                        Most Popular
                                    </span>
                                </div>
                            )}

                            {/* Current Badge */}
                            {isCurrent && (
                                <div className="absolute top-3 right-3">
                                    <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded-full">
                                        Current
                                    </span>
                                </div>
                            )}

                            <div className="p-6">
                                {/* Header */}
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getPlanColor(plan.name)} flex items-center justify-center text-white mb-4`}>
                                    {getPlanIcon(plan.name)}
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {plan.display_name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 min-h-[40px]">
                                    {plan.description}
                                </p>

                                {/* Price */}
                                <div className="mt-4 mb-6">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold text-gray-900 dark:text-white">
                                            ${Math.round(price)}
                                        </span>
                                        <span className="text-gray-500 dark:text-gray-400">/mo</span>
                                    </div>
                                    {billingCycle === 'yearly' && plan.price_yearly > 0 && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            ${plan.price_yearly} billed yearly
                                        </p>
                                    )}
                                </div>

                                {/* Limits */}
                                <div className="space-y-3 mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Users className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-700 dark:text-gray-300">
                                            {formatLimit(plan.max_users)} users
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <FolderKanban className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-700 dark:text-gray-300">
                                            {formatLimit(plan.max_projects)} projects
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <FileText className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-700 dark:text-gray-300">
                                            {formatLimit(plan.max_test_cases)} test cases
                                        </span>
                                    </div>
                                </div>

                                {/* Features */}
                                <div className="space-y-2">
                                    {allFeatures.slice(0, 5).map((feature) => {
                                        const hasFeature = plan.features.includes(feature)
                                        return (
                                            <div key={feature} className="flex items-center gap-2 text-sm">
                                                {hasFeature ? (
                                                    <Check className="w-4 h-4 text-green-500" />
                                                ) : (
                                                    <X className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                                                )}
                                                <span className={hasFeature ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}>
                                                    {getFeatureDisplayName(feature)}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* CTA Button */}
                                <button
                                    className={`w-full mt-6 py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${isCurrent
                                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-default'
                                        : plan.name === 'pro'
                                            ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700'
                                            : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
                                        }`}
                                    disabled={isCurrent}
                                >
                                    {isCurrent ? (
                                        'Current Plan'
                                    ) : (
                                        <>
                                            {plan.name === 'enterprise' ? 'Contact Sales' : 'Upgrade'}
                                            <ArrowUpRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Feature Comparison */}
            <div className="mt-12">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                    Feature Comparison
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Feature
                                </th>
                                {plans.map((plan) => (
                                    <th key={plan.id} className="text-center py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                                        {plan.display_name}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {allFeatures.map((feature) => (
                                <tr key={feature} className="border-b border-gray-100 dark:border-gray-800">
                                    <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                                        {getFeatureDisplayName(feature)}
                                    </td>
                                    {plans.map((plan) => (
                                        <td key={plan.id} className="text-center py-3 px-4">
                                            {plan.features.includes(feature) ? (
                                                <Check className="w-5 h-5 text-green-500 mx-auto" />
                                            ) : (
                                                <X className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" />
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default PricingPlans
