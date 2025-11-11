'use client'

import { use } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Progress } from '@/components/ui/progress' // TODO: Component does not exist yet
import { Sidebar } from '@/components/layout/sidebar'
import { UserNav } from '@/components/layout/user-nav'
import { CreditCard } from 'lucide-react'

const invoiceData = [
  { id: 'INV-2023-001', date: '2023-10-01', amount: '$500.00', status: 'Paid' },
  { id: 'INV-2023-002', date: '2023-09-01', amount: '$500.00', status: 'Paid' },
  { id: 'INV-2023-003', date: '2023-08-01', amount: '$500.00', status: 'Paid' },
]

interface PageParams {
  uuid: string
}

export default function BillingPage({ params }: { params: Promise<PageParams> }) {
  const { uuid } = use(params)

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar organisationId={uuid} />
      <main className="flex-1 overflow-auto">
        {/* Top Bar with Profile */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="h-[80px] px-8 flex items-center justify-end">
            <UserNav />
          </div>
        </div>

        {/* Page Content */}
        <div className="px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Billing & Usage</h1>
              </div>
            </div>
            <p className="text-sm text-gray-600 ml-15">Manage your subscription, invoices, and usage metrics</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Usage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Test Runs</span>
                      <span className="text-sm">12,453 / 20,000</span>
                    </div>
                    {/* Assuming Progress component exists and works like this */}
                    {/* <Progress value={62} /> */}
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '62%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Active Users</span>
                      <span className="text-sm">128 / 200</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                      <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: '64%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Projects</span>
                      <span className="text-sm">12 / 15</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                      <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '80%' }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Billing History</CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                      <tr>
                        <th scope="col" className="px-6 py-3">Invoice ID</th>
                        <th scope="col" className="px-6 py-3">Date</th>
                        <th scope="col" className="px-6 py-3">Amount</th>
                        <th scope="col" className="px-6 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceData.map((invoice) => (
                        <tr key={invoice.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                          <td className="px-6 py-4">{invoice.id}</td>
                          <td className="px-6 py-4">{invoice.date}</td>
                          <td className="px-6 py-4">{invoice.amount}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {invoice.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Current Plan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h3 className="text-2xl font-bold">Basic</h3>
                  <p className="text-gray-500">Your organization is currently on the Basic plan.</p>
                  <Button className="w-full">Manage Plan</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
