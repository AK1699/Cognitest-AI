'use client'

import { use, useState, useEffect } from 'react'
import { UserNav } from '@/components/layout/user-nav'
import { CreditCard, Users, FolderKanban, FileText, Activity, Loader2 } from 'lucide-react'
import { PricingPlans } from '@/components/settings/PricingPlans'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getUsageLimits, getCurrentSubscription, formatLimit, type UsageLimit, type OrganizationSubscription } from '@/lib/api/subscription'

interface PageParams {
  uuid: string
}

function UsageCard({
  icon: Icon,
  label,
  current,
  limit,
  isUnlimited,
  color
}: {
  icon: any
  label: string
  current: number
  limit: number
  isUnlimited: boolean
  color: string
}) {
  const percentage = isUnlimited ? 0 : Math.min((current / limit) * 100, 100)
  const isNearLimit = !isUnlimited && percentage >= 80
  const isAtLimit = !isUnlimited && percentage >= 100

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className="font-medium text-gray-900">{label}</span>
      </div>
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-3xl font-bold text-gray-900">{current.toLocaleString()}</span>
        <span className="text-gray-500">/ {isUnlimited ? '∞' : limit.toLocaleString()}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all ${isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-primary'
            }`}
          style={{ width: isUnlimited ? '10%' : `${percentage}%` }}
        />
      </div>
      {isNearLimit && !isAtLimit && (
        <p className="text-xs text-amber-600 mt-2">Approaching limit</p>
      )}
      {isAtLimit && (
        <p className="text-xs text-red-600 mt-2">Limit reached</p>
      )}
    </div>
  )
}

export default function BillingPage({ params }: { params: Promise<PageParams> }) {
  const { uuid } = use(params)
  const [usage, setUsage] = useState<UsageLimit[]>([])
  const [subscription, setSubscription] = useState<OrganizationSubscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [uuid])

  const loadData = async () => {
    try {
      setLoading(true)
      const [usageData, subData] = await Promise.all([
        getUsageLimits(uuid).catch(() => []),
        getCurrentSubscription(uuid).catch(() => null)
      ])
      setUsage(usageData)
      setSubscription(subData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getUsageIcon = (resource: string) => {
    switch (resource) {
      case 'users': return Users
      case 'projects': return FolderKanban
      case 'test_cases': return FileText
      default: return Activity
    }
  }

  const getUsageColor = (resource: string) => {
    switch (resource) {
      case 'users': return 'bg-blue-500'
      case 'projects': return 'bg-green-500'
      case 'test_cases': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const getUsageLabel = (resource: string) => {
    switch (resource) {
      case 'users': return 'Active Users'
      case 'projects': return 'Projects'
      case 'test_cases': return 'Test Cases'
      default: return resource
    }
  }

  return (
    <>
      {/* Top Bar with Title and Profile */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="h-[80px] px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Billing & Usage</h1>
              <p className="text-xs text-gray-500">Manage your subscription and usage</p>
            </div>
          </div>
          <UserNav />
        </div>
      </div>

      {/* Page Content */}
      <div className="px-8 py-8">
        <Tabs defaultValue="usage" className="w-full">
          <TabsList className="grid w-full max-w-lg grid-cols-3 bg-gray-100 p-1 rounded-lg mb-8">
            <TabsTrigger value="usage" className="text-sm font-semibold">Usage</TabsTrigger>
            <TabsTrigger value="plans" className="text-sm font-semibold">Plans & Pricing</TabsTrigger>
            <TabsTrigger value="invoices" className="text-sm font-semibold">Invoices</TabsTrigger>
          </TabsList>

          <TabsContent value="usage" className="mt-0 animate-in fade-in duration-300">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Current Plan Banner */}
                {subscription && (
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Current Plan: {subscription.plan_display_name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Billing: {subscription.billing_cycle} • Status: {subscription.status}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Usage Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {usage.map((u) => (
                    <UsageCard
                      key={u.resource}
                      icon={getUsageIcon(u.resource)}
                      label={getUsageLabel(u.resource)}
                      current={u.current}
                      limit={u.limit}
                      isUnlimited={u.is_unlimited}
                      color={getUsageColor(u.resource)}
                    />
                  ))}
                </div>

                {usage.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No usage data available
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="plans" className="mt-0 animate-in fade-in duration-300">
            <PricingPlans organisationId={uuid} />
          </TabsContent>

          <TabsContent value="invoices" className="mt-0 animate-in fade-in duration-300">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Invoice ID</th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="text-center">
                    <td colSpan={4} className="py-12 text-gray-500">
                      No invoices yet. Invoices will appear here after you upgrade to a paid plan.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}



