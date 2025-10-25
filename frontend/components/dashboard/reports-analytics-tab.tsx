'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import { StatsCard } from './stats-card'
import { Activity, CheckCircle, Clock, XCircle } from 'lucide-react'

const testRunsData = [
  { name: 'Jan', runs: 400 },
  { name: 'Feb', runs: 300 },
  { name: 'Mar', runs: 600 },
  { name: 'Apr', runs: 800 },
  { name: 'May', runs: 500 },
  { name: 'Jun', runs: 700 },
]

const statusDistributionData = [
  { status: 'Passed', count: 250 },
  { status: 'Failed', count: 80 },
  { status: 'Skipped', count: 30 },
]

export function ReportsAnalyticsTab() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Total Test Runs"
          value="1,234"
          icon={Activity}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatsCard
          title="Pass Rate"
          value="85%"
          change="+2.5%"
          changeType="positive"
          icon={CheckCircle}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
        />
        <StatsCard
          title="Average Duration"
          value="2m 45s"
          change="-10s"
          changeType="negative"
          icon={Clock}
          iconBgColor="bg-yellow-100"
          iconColor="text-yellow-600"
        />
      </div>

      <div className="space-y-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Test Runs Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={testRunsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="runs" stroke="#8884d8" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Test Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusDistributionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
