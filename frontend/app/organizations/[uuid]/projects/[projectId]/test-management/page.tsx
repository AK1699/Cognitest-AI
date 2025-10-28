'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { FolderOpen, Settings, ChevronLeft, ChevronDown, Building2, Check, Plus, User, HelpCircle, LogOut, FileText, Search, Filter, Sparkles } from 'lucide-react'
import axios from '@/lib/axios'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'
import { testPlanAPI, testSuiteAPI, testCaseAPI, TestPlan, TestSuite, TestCase } from '@/lib/api/test-plans'
import TestPlanList from '@/components/test-management/TestPlanList'
import CreateTestPlanModal from '@/components/test-management/CreateTestPlanModal'
import AITestPlanGenerator from '@/components/test-management/AITestPlanGenerator'
import TestSuiteList from '@/components/test-management/TestSuiteList'
import CreateTestSuiteModal from '@/components/test-management/CreateTestSuiteModal'
import TestCaseList from '@/components/test-management/TestCaseList'
import CreateTestCaseModal from '@/components/test-management/CreateTestCaseModal'

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

  // Test Management State
  const [testPlans, setTestPlans] = useState<TestPlan[]>([])
  const [filteredTestPlans, setFilteredTestPlans] = useState<TestPlan[]>([])
  const [showManualForm, setShowManualForm] = useState(false)
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'plans' | 'suites' | 'cases'>('plans')

  // Test Suites State
  const [testSuites, setTestSuites] = useState<TestSuite[]>([])
  const [filteredTestSuites, setFilteredTestSuites] = useState<TestSuite[]>([])
  const [showSuiteForm, setShowSuiteForm] = useState(false)

  // Test Cases State
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [filteredTestCases, setFilteredTestCases] = useState<TestCase[]>([])
  const [showCaseForm, setShowCaseForm] = useState(false)

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
  }, [projectId])

  useEffect(() => {
    // Filter test plans based on search query
    if (searchQuery.trim()) {
      const filtered = testPlans.filter(plan =>
        plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.objectives.some(obj => obj.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      setFilteredTestPlans(filtered)
    } else {
      setFilteredTestPlans(testPlans)
    }
  }, [searchQuery, testPlans])

  useEffect(() => {
    // Filter test suites based on search query
    if (searchQuery.trim()) {
      const filtered = testSuites.filter(suite =>
        suite.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        suite.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        suite.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      setFilteredTestSuites(filtered)
    } else {
      setFilteredTestSuites(testSuites)
    }
  }, [searchQuery, testSuites])

  useEffect(() => {
    // Filter test cases based on search query
    if (searchQuery.trim()) {
      const filtered = testCases.filter(testCase =>
        testCase.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        testCase.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        testCase.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        testCase.steps?.some(step =>
          step.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
          step.expected_result.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
      setFilteredTestCases(filtered)
    } else {
      setFilteredTestCases(testCases)
    }
  }, [searchQuery, testCases])

  const fetchProject = async () => {
    try {
      const response = await axios.get(`/api/v1/projects/${projectId}`)
      setProject(response.data)
    } catch (error: any) {
      console.error('Failed to fetch project:', error)
      toast.error('Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  const fetchOrganisation = async () => {
    try {
      const response = await axios.get(`/api/v1/organisations/${uuid}`)
      setOrganisation(response.data)
    } catch (error: any) {
      console.error('Failed to fetch organisation:', error)
    }
  }

  const fetchOrganisations = async () => {
    if (!user) return
    try {
      const response = await axios.get('/api/v1/organisations/')
      setOrganisations(response.data)
    } catch (error) {
      console.error('Failed to fetch organisations:', error)
    }
  }

  const fetchTestPlans = async () => {
    try {
      const data = await testPlanAPI.list(projectId)
      setTestPlans(data)
    } catch (error: any) {
      console.error('Failed to fetch test plans:', error)
      toast.error('Failed to load test plans')
    }
  }

  const handleCreateManual = async (formData: any) => {
    try {
      await testPlanAPI.create({
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
      const response = await testPlanAPI.aiGenerate(request)
      toast.success(`Test plan generated with ${response.confidence_score}% confidence`)
      setShowAIGenerator(false)
      fetchTestPlans()
      return response
    } catch (error: any) {
      throw error
    }
  }

  const handleDeleteTestPlan = async (testPlanId: string) => {
    if (!confirm('Are you sure you want to delete this test plan?')) return

    try {
      await testPlanAPI.delete(testPlanId)
      toast.success('Test plan deleted successfully')
      fetchTestPlans()
    } catch (error) {
      console.error('Failed to delete test plan:', error)
      toast.error('Failed to delete test plan')
    }
  }

  const fetchTestSuites = async () => {
    try {
      const data = await testSuiteAPI.list(projectId)
      setTestSuites(data)
    } catch (error: any) {
      console.error('Failed to fetch test suites:', error)
      toast.error('Failed to load test suites')
    }
  }

  const handleCreateTestSuite = async (formData: any) => {
    try {
      await testSuiteAPI.create({
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
    if (!confirm('Are you sure you want to delete this test suite?')) return

    try {
      await testSuiteAPI.delete(testSuiteId)
      toast.success('Test suite deleted successfully')
      fetchTestSuites()
    } catch (error) {
      console.error('Failed to delete test suite:', error)
      toast.error('Failed to delete test suite')
    }
  }

  const fetchTestCases = async () => {
    try {
      const data = await testCaseAPI.list(projectId)
      setTestCases(data)
    } catch (error: any) {
      console.error('Failed to fetch test cases:', error)
      toast.error('Failed to load test cases')
    }
  }

  const handleCreateTestCase = async (formData: any) => {
    try {
      await testCaseAPI.create({
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
    if (!confirm('Are you sure you want to delete this test case?')) return

    try {
      await testCaseAPI.delete(testCaseId)
      toast.success('Test case deleted successfully')
      fetchTestCases()
    } catch (error) {
      console.error('Failed to delete test case:', error)
      toast.error('Failed to delete test case')
    }
  }

  const switchOrganisation = (org: Organisation) => {
    setOrganisation(org)
    localStorage.setItem('current_organisation', JSON.stringify(org))
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
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Organization & User Header */}
        {organisation && user && (
          <div className="p-4 border-b border-gray-200 relative">
            <button
              onClick={() => {
                setIsProfileOpen(!isProfileOpen)
                if (!isProfileOpen) {
                  fetchOrganisations()
                }
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                isProfileOpen
                  ? 'border border-primary bg-primary/5'
                  : 'border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-white">
                  {organisation.name.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <h2 className="text-base font-semibold truncate text-gray-900">{organisation.name}</h2>
                <p className="text-xs text-gray-500 uppercase">{user.username}</p>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${
                  isProfileOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Profile Dropdown */}
            {isProfileOpen && (
              <div className="absolute top-24 left-4 right-4 p-4 rounded-lg border border-gray-200 bg-white shadow-lg space-y-4 z-50">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-600">
                    Organisations ({organisations.length})
                  </h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {organisations.map((org) => (
                      <button
                        key={org.id}
                        onClick={() => switchOrganisation(org)}
                        className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-gray-200 transition-colors text-left"
                      >
                        <Building2 className="w-4 h-4 text-gray-600 flex-shrink-0" />
                        <span className="text-sm text-gray-900 flex-1 truncate">
                          {org.name}
                        </span>
                        {organisation?.id === org.id && (
                          <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <hr className="border-gray-200" />
                <button
                  onClick={() => {
                    router.push('/organisations/new')
                    setIsProfileOpen(false)
                  }}
                  className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-200 transition-colors text-left"
                >
                  <Plus className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-900">Add Organisation</span>
                </button>
                <hr className="border-gray-200" />
                <button
                  onClick={() => {
                    router.push('/profile/edit')
                    setIsProfileOpen(false)
                  }}
                  className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-200 transition-colors text-left"
                >
                  <User className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-900">Edit profile</span>
                </button>
                <button
                  onClick={() => {
                    router.push('/account/settings')
                    setIsProfileOpen(false)
                  }}
                  className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-200 transition-colors text-left"
                >
                  <Settings className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-900">Account settings</span>
                </button>
                <button
                  onClick={() => {
                    router.push('/support')
                    setIsProfileOpen(false)
                  }}
                  className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-200 transition-colors text-left"
                >
                  <HelpCircle className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-900">Support</span>
                </button>
                <hr className="border-gray-200" />
                <button
                  onClick={() => {
                    logout()
                    setIsProfileOpen(false)
                  }}
                  className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-red-100 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-600 font-medium">Sign out</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Close profile dropdown when clicking outside */}
        {isProfileOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsProfileOpen(false)}
          />
        )}

        {/* Project Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded bg-orange-500 flex items-center justify-center flex-shrink-0">
              <FolderOpen className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold truncate text-gray-900">{project.name}</h3>
            </div>
          </div>
          <button
            onClick={() => router.push(`/organizations/${uuid}/projects/${projectId}`)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-3 h-3" />
            Back to project
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-gray-500 uppercase mb-2 px-3">Test Management</div>
            <button
              onClick={() => setActiveTab('plans')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeTab === 'plans'
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              Test Plans
            </button>
            <button
              onClick={() => setActiveTab('suites')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeTab === 'suites'
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              Test Suites
            </button>
            <button
              onClick={() => setActiveTab('cases')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeTab === 'cases'
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              Test Cases
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white">
          <div className="px-8 py-5 flex items-center justify-between">
            <h1 className="text-2xl font-normal text-gray-900">
              {activeTab === 'plans' && 'Test Plans'}
              {activeTab === 'suites' && 'Test Suites'}
              {activeTab === 'cases' && 'Test Cases'}
            </h1>

            {activeTab === 'plans' && testPlans.length > 0 && (
              <div className="flex gap-3">
                <button
                  onClick={() => setShowManualForm(true)}
                  className="px-4 py-2 bg-white hover:bg-gray-50 text-primary border border-primary rounded-lg font-medium transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Manually
                </button>
                <button
                  onClick={() => setShowAIGenerator(true)}
                  className="px-4 py-2 bg-primary hover:opacity-90 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate with AI
                </button>
              </div>
            )}

            {activeTab === 'suites' && testSuites.length > 0 && (
              <button
                onClick={() => setShowSuiteForm(true)}
                className="px-4 py-2 bg-primary hover:opacity-90 text-white rounded-lg font-medium transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Test Suite
              </button>
            )}

            {activeTab === 'cases' && testCases.length > 0 && (
              <button
                onClick={() => setShowCaseForm(true)}
                className="px-4 py-2 bg-primary hover:opacity-90 text-white rounded-lg font-medium transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Test Case
              </button>
            )}
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
                      <Sparkles className="w-4 h-4" />
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
                    onDelete={handleDeleteTestPlan}
                    onRefresh={fetchTestPlans}
                  />
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
                  <TestSuiteList
                    testSuites={filteredTestSuites}
                    onDelete={handleDeleteTestSuite}
                    onRefresh={fetchTestSuites}
                  />
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
                </>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modals */}
      {showManualForm && (
        <CreateTestPlanModal
          onClose={() => setShowManualForm(false)}
          onCreate={handleCreateManual}
        />
      )}

      {showAIGenerator && (
        <AITestPlanGenerator
          projectId={projectId}
          onClose={() => setShowAIGenerator(false)}
          onGenerate={handleAIGenerate}
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
    </div>
  )
}
