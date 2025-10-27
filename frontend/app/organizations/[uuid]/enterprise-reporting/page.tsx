'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import { StatsCard } from '@/components/dashboard/stats-card'
import { FolderOpen, Users, CheckCircle, Activity, ArrowLeft } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import axios from '@/lib/axios'
import { toast } from 'sonner'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Project {
  id: string
  name: string
}

interface TestCase {
  id: string
  status: string
  execution_logs: { timestamp: string }[]
}

export default function EnterpriseReportingPage() {
  const router = useRouter()
  const params = useParams()
  const { uuid } = params

  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [testCases, setTestCases] = useState<TestCase[]>([])

  useEffect(() => {
    if (uuid) {
      fetchData()
    }
  }, [uuid])

  const fetchData = async () => {
    setLoading(true)
    try {
      const projectsResponse = await axios.get(
        `/api/v1/projects/?organisation_id=${uuid}`
      )
      const projectsData = projectsResponse.data
      setProjects(projectsData)

      const allTestCases: TestCase[] = []
      for (const project of projectsData) {
        const testCasesResponse = await axios.get(
          `/api/v1/test_cases/?project_id=${project.id}`
        )
        allTestCases.push(...testCasesResponse.data)
      }
      setTestCases(allTestCases)

    } catch (error) {
      console.error('Failed to fetch reporting data:', error)
      toast.error('Failed to load reporting data')
    } finally {
      setLoading(false)
    }
  }

  // --- Data Processing ---
  const totalProjects = projects.length

  const totalTestRunsLast30Days = testCases.reduce((acc, tc) => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentRuns = tc.execution_logs?.filter(log => new Date(log.timestamp) > thirtyDaysAgo) || []
    return acc + recentRuns.length
  }, 0)

  const executedTestCases = testCases.filter(tc => tc.status !== 'DRAFT' && tc.status !== 'READY')
  const passedTestCases = executedTestCases.filter(tc => tc.status === 'PASSED')
  const overallPassRate = executedTestCases.length > 0
    ? Math.round((passedTestCases.length / executedTestCases.length) * 100)
    : 0

  const testActivityByProject = projects.map(p => {
    const projectTestCases = testCases.filter(tc => (tc as any).project_id === p.id);
    const totalRuns = projectTestCases.reduce((acc, tc) => acc + (tc.execution_logs?.length || 0), 0);
    return {
      name: p.name,
      testRuns: totalRuns,
    };
  });

  const runsOverTime = testCases.reduce((acc, tc) => {
    tc.execution_logs?.forEach(log => {
      const date = new Date(log.timestamp).toISOString().split('T')[0].substring(0, 7) // Format as YYYY-MM
      if (!acc[date]) {
        acc[date] = 0
      }
      acc[date]++
    })
    return acc
  }, {} as Record<string, number>)

  const overallActivityData = Object.entries(runsOverTime)
    .map(([date, runs]) => ({ date, runs }))
    .sort((a, b) => a.date.localeCompare(b.date))


  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-center text-gray-600">Loading reporting data...</p>
      </div>
    )
  }

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
          value={totalProjects}
          icon={FolderOpen}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatsCard
          title="Active Users"
          value="128" // Placeholder
          icon={Users}
          iconBgColor="bg-orange-100"
          iconColor="text-orange-600"
        />
        <StatsCard
          title="Overall Pass Rate"
          value={`${overallPassRate}%`}
          icon={CheckCircle}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
        />
        <StatsCard
          title="Total Test Runs (Last 30 Days)"
          value={totalTestRunsLast30Days}
          icon={Activity}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
      </div>

      <div className="space-y-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Test Activity Across Projects</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={testActivityByProject}>
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
                  <th scope="col" className="px-6 py-3">Test Cases</th>
                  <th scope="col" className="px-6 py-3">Pass Rate</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => {
                  const projectTestCases = testCases.filter(tc => (tc as any).project_id === p.id)
                  const executed = projectTestCases.filter(tc => tc.status !== 'DRAFT' && tc.status !== 'READY')
                  const passed = executed.filter(tc => tc.status === 'PASSED')
                  const passRate = executed.length > 0 ? Math.round((passed.length / executed.length) * 100) : 0
                  return (
                    <tr key={p.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                      <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                        {p.name}
                      </th>
                      <td className="px-6 py-4">{projectTestCases.length}</td>
                      <td className="px-6 py-4">{passRate}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
