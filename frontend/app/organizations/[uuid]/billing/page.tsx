'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress' // Assuming a Progress component exists
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

const invoiceData = [
  { id: 'INV-2023-001', date: '2023-10-01', amount: '$500.00', status: 'Paid' },
  { id: 'INV-2023-002', date: '2023-09-01', amount: '$500.00', status: 'Paid' },
  { id: 'INV-2023-003', date: '2023-08-01', amount: '$500.00', status: 'Paid' },
]

export default function BillingPage() {
  const router = useRouter()

  return (
    <div className="p-8">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>
      <h1 className="text-3xl font-bold mb-8">Billing & Usage</h1>

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
  )
}
