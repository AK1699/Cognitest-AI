'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import { StatsCard } from '@/components/dashboard/stats-card'
import { FolderOpen, Users, CheckCircle, Activity, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

const projectsData = [
  { name: 'Project A', testRuns: 540, passRate: 92 },
  { name: 'Project B', testRuns: 820, passRate: 85 },
  { name: 'Project C', testRuns: 320, passRate: 95 },
  { name: 'Project D', testRuns: 1024, passRate: 88 },
]

const overallActivityData = [
  { date: '2023-01', runs: 2000 },
  { date: '2023-02', runs: 2500 },
  { date: '2023-03', runs: 2300 },
  { date: '2023-04', runs: 2800 },
  { date: '2023-05', runs: 3200 },
  { date: '2023-06', runs: 3000 },
]

export default function EnterpriseReportingPage() {
  const router = useRouter()

  return (
    <div className="p-8">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>
      <h1 className="text-3xl font-bold mb-8">Enterprise Reporting</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Projects"
          value="12"
          icon={FolderOpen}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatsCard
          title="Active Users"
          value="128"
          icon={Users}
          iconBgColor="bg-orange-100"
          iconColor="text-orange-600"
        />
        <StatsCard
          title="Overall Pass Rate"
          value="89%"
          icon={CheckCircle}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
        />
        <StatsCard
          title="Total Test Runs (Last 30 Days)"
          value="12,453"
          icon={Activity}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
      </div>

      <div className="space-y-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Test Activity Across Projects</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={projectsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="testRuns" fill="#8884d8" name="Test Runs" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Organization-Wide Test Runs Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={overallActivityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="runs" stroke="#82ca9d" name="Test Runs" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold p-6">Projects Overview</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3">Project Name</th>
                  <th scope="col" className="px-6 py-3">Test Runs</th>
                  <th scope="col" className="px-6 py-3">Pass Rate</th>
                </tr>
              </thead>
              <tbody>
                {projectsData.map((p) => (
                  <tr key={p.name} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                      {p.name}
                    </th>
                    <td className="px-6 py-4">{p.testRuns}</td>
                    <td className="px-6 py-4">{p.passRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
