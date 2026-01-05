'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { FolderOpen, Settings, ChevronLeft, ChevronDown, Building2, Check, Plus, User, HelpCircle, LogOut, FileText, Search, Filter, Sparkles, Upload, Zap, AlertCircle, BarChart3, Home, ChevronRight, BrainCircuit, ClipboardList, FolderTree, ListChecks, Bug, TrendingUp, Link2 } from 'lucide-react'
import api from '@/lib/api'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'
import { UserNav } from '@/components/layout/user-nav'
import { testPlansAPI, testSuitesAPI, testCasesAPI, TestPlan, TestSuite, TestCase } from '@/lib/api/test-management'
import TestPlanList from '@/components/test-management/TestPlanList'
import CreateTestPlanModal from '@/components/test-management/CreateTestPlanModal'
import CreateTestPlanModalV2 from '@/components/test-management/CreateTestPlanModalV2'
import AITestPlanGenerator from '@/components/test-management/AITestPlanGenerator'
import { TestPlanDetailsModal } from '@/components/test-management/TestPlanDetailsModal'
import HierarchicalTestSuiteList from '@/components/test-management/HierarchicalTestSuiteList'
import CreateTestSuiteModal from '@/components/test-management/CreateTestSuiteModal'
import EditTestPlanModal from '@/components/test-management/EditTestPlanModal'
import EditTestSuiteModal from '@/components/test-management/EditTestSuiteModal'
import TestCaseList from '@/components/test-management/TestCaseList'
import CreateTestCaseModal from '@/components/test-management/CreateTestCaseModal'
import IntegrationsManager from '@/components/integrations/IntegrationsManager'
import IssuesManager from '@/components/issues/IssuesManager'
import DefectDashboard from '@/components/issues/DefectDashboard'
import { Pagination } from '@/components/ui/pagination'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Project {
  id: string
  name: string
  description?: string
  status?: string
  created_at?: string
  settings?: {
    enabled_modules?: string[]
  }
}

interface Organisation {
  id: string
  name: string
  website?: string
  description?: string
  owner_id: string
  created_at: string
  updated_at?: string
}

interface PageParams {
  uuid: string
  projectId: string
}

export default function TestManagementPage({ params }: { params: Promise<PageParams> }) {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { uuid, projectId } = use(params)

  // State
  const [project, setProject] = useState<Project | null>(null)
  const [organisation, setOrganisation] = useState<Organisation | null>(null)
  const [organisations, setOrganisations] = useState<Organisation[]>([])
  const [loading, setLoading] = useState(true)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Test Management State
  const [testPlans, setTestPlans] = useState<TestPlan[]>([])
  const [filteredTestPlans, setFilteredTestPlans] = useState<TestPlan[]>([])
  const [selectedTestPlan, setSelectedTestPlan] = useState<TestPlan | null>(null)
  const [showManualForm, setShowManualForm] = useState(false)
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const [editingPlan, setEditingPlan] = useState<TestPlan | null>(null)
  const [editingSuite, setEditingSuite] = useState<TestSuite | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchHint, setSearchHint] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'plans' | 'suites' | 'cases'>('plans')

  // Pagination State
  const [plansPage, setPlansPage] = useState(1)
  const [plansPageSize] = useState(10)
  const [suitesPage, setSuitesPage] = useState(1)
  const [suitesPageSize] = useState(10)
  const [casesPage, setCasesPage] = useState(1)
  const [casesPageSize] = useState(10)
  const [casesTotal, setCasesTotal] = useState(0)

  // Test Suites State
  const [testSuites, setTestSuites] = useState<TestSuite[]>([])
  const [filteredTestSuites, setFilteredTestSuites] = useState<TestSuite[]>([])
  const [showSuiteForm, setShowSuiteForm] = useState(false)

  // Test Cases State
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [filteredTestCases, setFilteredTestCases] = useState<TestCase[]>([])
  const [showCaseForm, setShowCaseForm] = useState(false)

  // New Features State
  const [showIntegrations, setShowIntegrations] = useState(false)
  const [showIssues, setShowIssues] = useState(false)
  const [showDefectDashboard, setShowDefectDashboard] = useState(false)

  useEffect(() => {
    fetchProject()
    fetchOrganisation()
    fetchOrganisations()
  }, [projectId, uuid])

  useEffect(() => {
    if (projectId) {
      fetchTestPlans()
      fetchTestSuites()
      fetchTestCases()
    }
  }, [projectId, plansPage, suitesPage, casesPage, searchQuery])

  // Reset to page 1 when search query changes
  useEffect(() => {
    if (searchQuery) {
      setPlansPage(1)
      setSuitesPage(1)
      setCasesPage(1)
    }
  }, [searchQuery])

  const fetchProject = async () => {
    if (!projectId) return // Guard against undefined projectId
    try {
      const response = await api.get(`/api/v1/projects/${projectId}`)
      setProject(response.data)
    } catch (error: any) {
      console.error('Failed to fetch project:', error)
      toast.error('Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  const fetchOrganisation = async () => {
    if (!uuid) return // Guard against undefined uuid
    try {
      const response = await api.get(`/api/v1/organisations/${uuid}`)
      setOrganisation(response.data)
    } catch (error: any) {
      console.error('Failed to fetch organisation:', error)
    }
  }

  const fetchOrganisations = async () => {
    if (!user) return
    try {
      const response = await api.get('/api/v1/organisations/')
      setOrganisations(response.data)
    } catch (error) {
      console.error('Failed to fetch organisations:', error)
    }
  }

  const fetchTestPlans = async () => {
    try {
      const data = await testPlansAPI.list(projectId, {
        page: plansPage,
        size: plansPageSize,
        search: searchQuery || undefined
      })
      setTestPlans(data || [])
      setFilteredTestPlans(data || [])
    } catch (error: any) {
      // Set empty array on error to avoid blocking the UI
      setTestPlans([])
      setFilteredTestPlans([])

      // Handle different error types with detailed classification
      const status = error.response?.status

      if (status === 401) {
        // Authentication expired - will auto-redirect to login via interceptor
        console.warn('Authentication required - redirecting to login')
      } else if (status === 403 || status === 404) {
        // Access denied or not found - expected for new/empty projects
        // Silently handle without logging to avoid console noise
      } else if (error.isNetworkError) {
        // True network error - request sent but no response
        // This can happen due to: CORS issues, server down, or authentication cookies not sent
        // Note: Browser will always log this, we can't suppress it
        console.warn('Unable to connect to server. The page will still work for creating new test plans.')
      } else if (error.isServerError) {
        // Server returned an error response
        console.error('Server error:', status, error.response?.data)
        toast.error(`Failed to load test plans (Error ${status})`)
      }
      // For all cases, UI continues to work with empty state
    }
  }

  const handleCreateManual = async (formData: any) => {
    try {
      await testPlansAPI.create({
        ...formData,
        project_id: projectId,
        generated_by: 'manual' as const,
        created_by: user?.email || '',
      })
      toast.success('Test plan created successfully')
      setShowManualForm(false)
      fetchTestPlans()
    } catch (error) {
      console.error('Failed to create test plan:', error)
      toast.error('Failed to create test plan')
      throw error
    }
  }

  const handleAIGenerate = async (request: any) => {
    try {
      const response = await testPlansAPI.aiGenerate(request)
      toast.success(`Test plan generated with ${response.confidence_score}% confidence`)
      setShowAIGenerator(false)
      fetchTestPlans()
      return response
    } catch (error: any) {
      throw error
    }
  }

  const handleViewTestPlan = async (testPlanId: string) => {
    try {
      const testPlan = await testPlansAPI.get(testPlanId)
      setSelectedTestPlan(testPlan)
    } catch (error) {
      console.error('Failed to fetch test plan:', error)
      toast.error('Failed to load test plan details')
    }
  }

  const handleDeleteTestPlan = async (testPlanId: string) => {
    try {
      await testPlansAPI.delete(testPlanId)
      toast.success('Test plan deleted successfully')
      // Refresh all lists since deleting a test plan also deletes related suites and cases
      fetchTestPlans()
      fetchTestSuites()
      fetchTestCases()
    } catch (error) {
      console.error('Failed to delete test plan:', error)
      toast.error('Failed to delete test plan')
    }
  }

  const fetchTestSuites = async () => {
    try {
      const data = await testSuitesAPI.list(projectId, {
        page: suitesPage,
        size: suitesPageSize,
        search: searchQuery || undefined
      })
      setTestSuites(data || [])
      setFilteredTestSuites(data || [])
    } catch (error: any) {
      // Set empty array on error to avoid blocking the UI
      setTestSuites([])
      setFilteredTestSuites([])

      // Only log and show errors that are not expected (403/404 are normal for new projects)
      const status = error.response?.status
      if (status && ![403, 404].includes(status)) {
        console.error('Failed to fetch test suites:', error)
        toast.error('Failed to load test suites')
      }
      // For 403/404, silently handle - these are expected for new projects
    }
  }

  const handleCreateTestSuite = async (formData: any) => {
    try {
      await testSuitesAPI.create({
        ...formData,
        project_id: projectId,
        created_by: user?.email || '',
      })
      toast.success('Test suite created successfully')
      setShowSuiteForm(false)
      fetchTestSuites()
    } catch (error) {
      console.error('Failed to create test suite:', error)
      toast.error('Failed to create test suite')
      throw error
    }
  }

  const handleDeleteTestSuite = async (testSuiteId: string) => {
    try {
      await testSuitesAPI.delete(testSuiteId)
      toast.success('Test suite deleted successfully')
      // Refresh suites and cases since deleting a suite also deletes related test cases
      fetchTestSuites()
      fetchTestCases()
    } catch (error) {
      console.error('Failed to delete test suite:', error)
      toast.error('Failed to delete test suite')
    }
  }

  const fetchTestCases = async () => {
    try {
      const response = await testCasesAPI.list(projectId, {
        page: casesPage,
        size: casesPageSize,
        search: searchQuery || undefined
      })
      // Handle both paginated response (new) and array response (old/fallback)
      let cases: TestCase[] = []
      let total = 0
      if ('items' in response) {
        cases = response.items
        total = response.total
      } else if (Array.isArray(response)) {
        cases = response
        total = response.length
      }
      setTestCases(cases)
      setFilteredTestCases(cases)
      setCasesTotal(total)
    } catch (error: any) {
      // Set empty array on error to avoid blocking the UI
      setTestCases([])
      setFilteredTestCases([])
      setCasesTotal(0)

      // Only log and show errors that are not expected (403/404 are normal for new projects)
      const status = error.response?.status
      if (status && ![403, 404].includes(status)) {
        console.error('Failed to fetch test cases:', error)
        toast.error('Failed to load test cases')
      }
      // For 403/404, silently handle - these are expected for new projects
    }
  }

  const handleCreateTestCase = async (formData: any) => {
    try {
      await testCasesAPI.create({
        ...formData,
        project_id: projectId,
        created_by: user?.email || '',
      })
      toast.success('Test case created successfully')
      setShowCaseForm(false)
      fetchTestCases()
    } catch (error) {
      console.error('Failed to create test case:', error)
      toast.error('Failed to create test case')
      throw error
    }
  }

  const handleDeleteTestCase = async (testCaseId: string) => {
    try {
      await testCasesAPI.delete(testCaseId)
      toast.success('Test case deleted successfully')
      fetchTestCases()
    } catch (error) {
      console.error('Failed to delete test case:', error)
      toast.error('Failed to delete test case')
    }
  }

  const switchOrganisation = async (org: Organisation) => {
    setOrganisation(org)
    const { setCurrentOrganization } = await import('@/lib/api/session')
    await setCurrentOrganization(org.id)
    window.dispatchEvent(new CustomEvent('organisationChanged', { detail: org }))
    setIsProfileOpen(false)
    router.push(`/organizations/${org.id}/projects`)
  }

  if (loading || !project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Sidebar */}
      <aside
        className={`flex flex-col transition-all duration-300 relative border-r border-gray-200 ${isCollapsed ? 'w-20' : 'w-60'}`}
        style={{ backgroundColor: '#f0fefa' }}
      >
        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 bg-white border border-gray-200 rounded-full p-1 shadow-md hover:bg-gray-50 z-50 transition-transform"
        >
          {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        {/* Logo Section - CogniTest branding */}
        <div className="p-4 flex items-center gap-3 border-b border-gray-200 overflow-hidden">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
            <BrainCircuit className="w-6 h-6 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-800 tracking-tight whitespace-nowrap">
                Cogni<span className="text-primary">Test</span>
              </h1>
            </div>
          )}
        </div>

        {/* Project Header */}
        <div className="p-4 border-b border-gray-200 overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold truncate text-gray-900">Test Management</h3>
                <p className="text-[10px] text-gray-500 truncate">{project.name}</p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={() => router.push(`/organizations/${uuid}/projects/${projectId}`)}
              className="mt-2 flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="w-3 h-3" />
              Project Home
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto overflow-x-hidden">
          <div className="space-y-6">
            {/* Test Management Section */}
            <div className="space-y-1">
              {!isCollapsed && <div className="text-[10px] font-bold text-gray-500 uppercase mb-2 px-3 tracking-widest">Test Management</div>}
              <button
                onClick={() => setActiveTab('plans')}
                title={isCollapsed ? 'Test Plans' : ''}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all border-2 ${activeTab === 'plans'
                  ? 'bg-primary/10 text-primary font-semibold border-gray-400 shadow-sm'
                  : 'text-gray-700 hover:bg-white/50 border-transparent hover:border-gray-200'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <ClipboardList className={`w-5 h-5 flex-shrink-0 ${activeTab === 'plans' ? 'scale-110' : ''}`} />
                {!isCollapsed && <span className="truncate">Test Plans</span>}
              </button>
              <button
                onClick={() => setActiveTab('suites')}
                title={isCollapsed ? 'Test Suites' : ''}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all border-2 ${activeTab === 'suites'
                  ? 'bg-primary/10 text-primary font-semibold border-gray-400 shadow-sm'
                  : 'text-gray-700 hover:bg-white/50 border-transparent hover:border-gray-200'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <FolderTree className={`w-5 h-5 flex-shrink-0 ${activeTab === 'suites' ? 'scale-110' : ''}`} />
                {!isCollapsed && <span className="truncate">Test Suites</span>}
              </button>
              <button
                onClick={() => setActiveTab('cases')}
                title={isCollapsed ? 'Test Cases' : ''}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all border-2 ${activeTab === 'cases'
                  ? 'bg-primary/10 text-primary font-semibold border-gray-400 shadow-sm'
                  : 'text-gray-700 hover:bg-white/50 border-transparent hover:border-gray-200'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <ListChecks className={`w-5 h-5 flex-shrink-0 ${activeTab === 'cases' ? 'scale-110' : ''}`} />
                {!isCollapsed && <span className="truncate">Test Cases</span>}
              </button>
            </div>

            {/* Issues & Defects Section */}
            <div className="space-y-1">
              {!isCollapsed && <div className="text-[10px] font-bold text-gray-500 uppercase mb-2 px-3 tracking-widest">Issues & Defects</div>}
              <button
                onClick={() => setShowIssues(true)}
                title={isCollapsed ? 'All Issues' : ''}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all border-2 border-transparent text-gray-700 hover:bg-white/50 hover:border-gray-200 ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Bug className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="truncate">All Issues</span>}
              </button>
              <button
                onClick={() => setShowDefectDashboard(true)}
                title={isCollapsed ? 'Analytics' : ''}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all border-2 border-transparent text-gray-700 hover:bg-white/50 hover:border-gray-200 ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <TrendingUp className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="truncate">Analytics</span>}
              </button>
            </div>

            {/* Integrations Section */}
            <div className="space-y-1">
              {!isCollapsed && <div className="text-[10px] font-bold text-gray-500 uppercase mb-2 px-3 tracking-widest">Integrations</div>}
              <button
                onClick={() => setShowIntegrations(true)}
                title={isCollapsed ? 'External Tools' : ''}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all border-2 border-transparent text-gray-700 hover:bg-white/50 hover:border-gray-200 ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Link2 className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="truncate">External Tools</span>}
              </button>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar with Profile */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="px-8 py-4 flex items-center justify-end">
            {/* Profile and Notifications */}
            <div className="flex items-center gap-3">
              <UserNav />
            </div>
          </div>
        </div>

        {/* Breadcrumbs Bar */}
        <div className="px-8 py-3 bg-white border-b border-gray-200">
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => router.push(`/organizations/${uuid}/projects/${projectId}`)}
              className="text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1.5"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <button
              onClick={() => router.push(`/organizations/${uuid}/projects/${projectId}`)}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              {project.name}
            </button>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-semibold">Test Management</span>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="px-8 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {activeTab === 'plans' && 'Test Plans'}
                {activeTab === 'suites' && 'Test Suites'}
                {activeTab === 'cases' && 'Test Cases'}
              </h2>
              <p className="text-sm text-gray-600">
                {activeTab === 'plans' && 'Manage and create test plans'}
                {activeTab === 'suites' && 'Organize test cases into suites'}
                {activeTab === 'cases' && 'Define and manage test cases'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {activeTab === 'plans' && (
                <>
                  <button
                    onClick={() => setShowManualForm(true)}
                    className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg font-medium transition-all flex items-center gap-2 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Create Manually
                  </button>
                  <button
                    onClick={() => setShowAIGenerator(true)}
                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-all flex items-center gap-2 text-sm"
                  >
                    Generate with AI
                  </button>
                </>
              )}

              {activeTab === 'suites' && (
                <button
                  onClick={() => setShowSuiteForm(true)}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-all flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Create Test Suite
                </button>
              )}

              {activeTab === 'cases' && (
                <button
                  onClick={() => setShowCaseForm(true)}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-all flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Create Test Case
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="px-8 py-6">
          {activeTab === 'plans' && (
            <>
              {testPlans.length === 0 ? (
                // Empty State
                <div className="flex flex-col items-center justify-center py-16">
                  <FileText className="w-24 h-24 text-gray-300 mb-6" />
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    No Test Plans Yet
                  </h2>
                  <p className="text-gray-500 mb-8 text-center max-w-md">
                    Create your first test plan manually or use AI to generate one from your requirements.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowManualForm(true)}
                      className="px-6 py-3 bg-white hover:bg-gray-50 text-primary border-2 border-primary rounded-lg font-medium transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Create Manually
                    </button>
                    <button
                      onClick={() => setShowAIGenerator(true)}
                      className="px-6 py-3 bg-primary hover:opacity-90 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                    >
                      Generate with AI
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Search and Filter */}
                  <div className="mb-6 flex gap-3">
                    <div className="flex-1 relative">
                      <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search test plans..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      Filter
                    </button>
                  </div>

                  {/* Test Plans List */}
                  <TestPlanList
                    testPlans={filteredTestPlans}
                    onView={handleViewTestPlan}
                    onDelete={handleDeleteTestPlan}
                    onRefresh={fetchTestPlans}
                  />

                  {/* Pagination for Test Plans */}
                  {filteredTestPlans.length > 0 && (
                    <Pagination
                      currentPage={plansPage}
                      pageSize={plansPageSize}
                      currentItemsCount={filteredTestPlans.length}
                      onPageChange={setPlansPage}
                      itemsName="test plans"
                    />
                  )}
                </>
              )}
            </>
          )}

          {activeTab === 'suites' && (
            <>
              {testSuites.length === 0 ? (
                // Empty State
                <div className="flex flex-col items-center justify-center py-16">
                  <FileText className="w-24 h-24 text-gray-300 mb-6" />
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    No Test Suites Yet
                  </h2>
                  <p className="text-gray-500 mb-8 text-center max-w-md">
                    Organize your test cases into logical groups by creating test suites.
                  </p>
                  <button
                    onClick={() => setShowSuiteForm(true)}
                    className="px-6 py-3 bg-primary hover:opacity-90 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Test Suite
                  </button>
                </div>
              ) : (
                <>
                  {/* Search and Filter */}
                  <div className="mb-6 flex gap-3">
                    <div className="flex-1 relative">
                      <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search test suites..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      Filter
                    </button>
                  </div>

                  {/* Test Suites List */}
                  <HierarchicalTestSuiteList
                    testSuites={filteredTestSuites}
                    testCases={testCases}
                    onDeleteSuite={handleDeleteTestSuite}
                  />

                  {/* Pagination for Test Suites */}
                  {filteredTestSuites.length > 0 && (
                    <Pagination
                      currentPage={suitesPage}
                      pageSize={suitesPageSize}
                      currentItemsCount={filteredTestSuites.length}
                      onPageChange={setSuitesPage}
                      itemsName="test suites"
                    />
                  )}
                </>
              )}
            </>
          )}

          {activeTab === 'cases' && (
            <>
              {testCases.length === 0 ? (
                // Empty State
                <div className="flex flex-col items-center justify-center py-16">
                  <FileText className="w-24 h-24 text-gray-300 mb-6" />
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    No Test Cases Yet
                  </h2>
                  <p className="text-gray-500 mb-8 text-center max-w-md">
                    Create detailed test cases with step-by-step instructions to ensure quality.
                  </p>
                  <button
                    onClick={() => setShowCaseForm(true)}
                    className="px-6 py-3 bg-primary hover:opacity-90 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Test Case
                  </button>
                </div>
              ) : (
                <>
                  {/* Search and Filter */}
                  <div className="mb-6 flex gap-3">
                    <div className="flex-1 relative">
                      <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search test cases..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      Filter
                    </button>
                  </div>

                  {/* Test Cases List */}
                  <TestCaseList
                    testCases={filteredTestCases}
                    onDelete={handleDeleteTestCase}
                    onRefresh={fetchTestCases}
                  />

                  {/* Pagination for Test Cases */}
                  {filteredTestCases.length > 0 && (
                    <Pagination
                      currentPage={casesPage}
                      pageSize={casesPageSize}
                      totalItems={casesTotal}
                      currentItemsCount={filteredTestCases.length}
                      onPageChange={setCasesPage}
                      itemsName="test cases"
                    />
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modals */}
      {showManualForm && (
        <CreateTestPlanModalV2
          onClose={() => setShowManualForm(false)}
          onCreate={handleCreateManual}
        />
      )}

      {showAIGenerator && (
        <AITestPlanGenerator
          projectId={projectId}
          organisationId={uuid}
          onClose={() => setShowAIGenerator(false)}
          onSuccess={() => {
            setShowAIGenerator(false)
            // Refresh all lists to show the newly generated test plan, suites, and cases
            fetchTestPlans()
            fetchTestSuites()
            fetchTestCases()
            toast.success('Test plan generated successfully!')
          }}
        />
      )}

      {showSuiteForm && (
        <CreateTestSuiteModal
          onClose={() => setShowSuiteForm(false)}
          onCreate={handleCreateTestSuite}
          testPlans={testPlans}
        />
      )}

      {showCaseForm && (
        <CreateTestCaseModal
          onClose={() => setShowCaseForm(false)}
          onCreate={handleCreateTestCase}
          testSuites={testSuites}
        />
      )}

      {/* New Feature Modals */}
      {showIntegrations && organisation && (
        <IntegrationsManager
          organisationId={organisation.id}
          projectId={projectId}
          onClose={() => setShowIntegrations(false)}
        />
      )}

      {showIssues && (
        <IssuesManager
          projectId={projectId}
          onClose={() => setShowIssues(false)}
        />
      )}

      {showDefectDashboard && (
        <DefectDashboard
          projectId={projectId}
          onClose={() => setShowDefectDashboard(false)}
        />
      )}

      {/* Test Plan Details Modal */}
      <TestPlanDetailsModal
        testPlan={selectedTestPlan}
        open={!!selectedTestPlan}
        onOpenChange={(open) => !open && setSelectedTestPlan(null)}
        readOnly={true}
      />
    </div>
  )
}
