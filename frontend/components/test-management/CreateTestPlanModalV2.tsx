'use client'

import { useState } from 'react'
import { X, Plus, Trash2, Loader2, Calendar, Users, Target, Settings, BarChart, CheckCircle } from 'lucide-react'
import { Milestone } from '@/lib/api/test-management'

interface CreateTestPlanModalV2Props {
  onClose: () => void
  onCreate: (data: any) => Promise<void>
}

type TabId = 'basic' | 'scope' | 'strategy' | 'environment' | 'team' | 'schedule' | 'metrics' | 'review'

export default function CreateTestPlanModalV2({ onClose, onCreate }: CreateTestPlanModalV2Props) {
  const [activeTab, setActiveTab] = useState<TabId>('basic')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Form state
  const [formData, setFormData] = useState({
    // 1. Basic Information
    name: '',
    version: '',
    modules: [] as string[],
    test_plan_type: 'regression' as const,

    // 2. Objectives & Scope
    objective: '',
    description: '',
    scope_in: [] as string[],
    scope_out: [] as string[],
    assumptions: '',
    constraints_risks: '',
    objectives: [] as string[],

    // 3. Test Strategy & Approach
    testing_approach: '',
    test_levels: [] as string[],
    test_types: [] as string[],
    entry_criteria: '',
    exit_criteria: '',
    defect_management_approach: '',

    // 4. Environment & Tools
    test_environments: [] as string[],
    environment_urls: {} as Record<string, string>,
    tools_used: [] as string[],
    data_setup: '',

    // 5. Roles & Responsibilities
    test_manager_id: '',
    qa_lead_ids: [] as string[],
    qa_engineer_ids: [] as string[],
    stakeholder_ids: [] as string[],

    // 6. Schedule & Milestones
    planned_start_date: '',
    planned_end_date: '',
    milestones: [] as Milestone[],

    // 7. Metrics & Reporting
    test_coverage_target: undefined as number | undefined,
    automation_coverage_target: undefined as number | undefined,
    defect_density_target: undefined as number | undefined,
    reporting_frequency: 'weekly' as const,
    dashboard_links: [] as string[],

    // 8. Review & Approval
    review_status: 'draft' as const,
    reviewed_by_ids: [] as string[],
    review_comments: '',

    // Metadata
    tags: [] as string[],
    meta_data: {} as Record<string, any>,
  })

  // Input states for arrays
  const [moduleInput, setModuleInput] = useState('')
  const [scopeInInput, setScopeInInput] = useState('')
  const [scopeOutInput, setScopeOutInput] = useState('')
  const [objectiveInput, setObjectiveInput] = useState('')
  const [testLevelInput, setTestLevelInput] = useState('')
  const [testTypeInput, setTestTypeInput] = useState('')
  const [envInput, setEnvInput] = useState('')
  const [toolInput, setToolInput] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [dashboardInput, setDashboardInput] = useState('')

  const tabs = [
    { id: 'basic' as TabId, label: 'Basic Info', icon: Target, required: true },
    { id: 'scope' as TabId, label: 'Scope', icon: Target, required: false },
    { id: 'strategy' as TabId, label: 'Strategy', icon: Settings, required: false },
    { id: 'environment' as TabId, label: 'Environment', icon: Settings, required: false },
    { id: 'team' as TabId, label: 'Team', icon: Users, required: false },
    { id: 'schedule' as TabId, label: 'Schedule', icon: Calendar, required: false },
    { id: 'metrics' as TabId, label: 'Metrics', icon: BarChart, required: false },
    { id: 'review' as TabId, label: 'Review', icon: CheckCircle, required: false },
  ]

  const addArrayItem = (field: keyof typeof formData, value: string) => {
    if (!value.trim()) return
    const currentArray = formData[field] as any[]
    if (!currentArray.includes(value.trim())) {
      setFormData({ ...formData, [field]: [...currentArray, value.trim()] })
    }
  }

  const removeArrayItem = (field: keyof typeof formData, index: number) => {
    const currentArray = formData[field] as any[]
    setFormData({ ...formData, [field]: currentArray.filter((_, i) => i !== index) })
  }

  const addMilestone = () => {
    setFormData({
      ...formData,
      milestones: [
        ...formData.milestones,
        { name: '', description: '', due_date: '', status: 'pending' as const }
      ]
    })
  }

  const updateMilestone = (index: number, field: keyof Milestone, value: any) => {
    const newMilestones = [...formData.milestones]
    newMilestones[index] = { ...newMilestones[index], [field]: value }
    setFormData({ ...formData, milestones: newMilestones })
  }

  const removeMilestone = (index: number) => {
    setFormData({ ...formData, milestones: formData.milestones.filter((_, i) => i !== index) })
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) {
      newErrors.name = 'Test plan name is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      await onCreate({
        ...formData,
        generated_by: 'manual',
        source_documents: [],
      })
    } catch (error) {
      console.error('Failed to create test plan:', error)
      setErrors({ submit: 'Failed to create test plan. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Create Comprehensive Test Plan</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 bg-gray-50 px-6 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-primary border-b-2 border-primary bg-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.required && <span className="text-red-500">*</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* 1. BASIC INFORMATION */}
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Plan Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g., Release 3.1 Regression Test Plan"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
                  <input
                    type="text"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g., 3.1.0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Test Plan Type</label>
                  <select
                    value={formData.test_plan_type}
                    onChange={(e) => setFormData({ ...formData, test_plan_type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="regression">Regression</option>
                    <option value="sanity">Sanity</option>
                    <option value="smoke">Smoke</option>
                    <option value="uat">UAT</option>
                    <option value="performance">Performance</option>
                    <option value="security">Security</option>
                    <option value="integration">Integration</option>
                    <option value="unit">Unit</option>
                    <option value="e2e">E2E</option>
                    <option value="api">API</option>
                    <option value="mobile">Mobile</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Modules/Features Covered
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={moduleInput}
                      onChange={(e) => setModuleInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addArrayItem('modules', moduleInput)
                          setModuleInput('')
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Press Enter to add module"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        addArrayItem('modules', moduleInput)
                        setModuleInput('')
                      }}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.modules.map((module, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {module}
                        <button
                          type="button"
                          onClick={() => removeArrayItem('modules', idx)}
                          className="hover:text-blue-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addArrayItem('tags', tagInput)
                          setTagInput('')
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Press Enter to add tag"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        addArrayItem('tags', tagInput)
                        setTagInput('')
                      }}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeArrayItem('tags', idx)}
                          className="hover:text-gray-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. OBJECTIVES & SCOPE */}
            {activeTab === 'scope' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Objectives & Scope</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Overall Objective/Purpose
                  </label>
                  <textarea
                    value={formData.objective}
                    onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Describe the overall goal of this test plan"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Additional description about the test plan"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specific Objectives
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={objectiveInput}
                      onChange={(e) => setObjectiveInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addArrayItem('objectives', objectiveInput)
                          setObjectiveInput('')
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Press Enter to add objective"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        addArrayItem('objectives', objectiveInput)
                        setObjectiveInput('')
                      }}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <ul className="space-y-1">
                    {formData.objectives.map((obj, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="flex-1">• {obj}</span>
                        <button
                          type="button"
                          onClick={() => removeArrayItem('objectives', idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      In Scope
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={scopeInInput}
                        onChange={(e) => setScopeInInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addArrayItem('scope_in', scopeInInput)
                            setScopeInInput('')
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="Press Enter"
                      />
                    </div>
                    <ul className="space-y-1">
                      {formData.scope_in.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <span className="flex-1">✓ {item}</span>
                          <button
                            type="button"
                            onClick={() => removeArrayItem('scope_in', idx)}
                            className="text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Out of Scope
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={scopeOutInput}
                        onChange={(e) => setScopeOutInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addArrayItem('scope_out', scopeOutInput)
                            setScopeOutInput('')
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="Press Enter"
                      />
                    </div>
                    <ul className="space-y-1">
                      {formData.scope_out.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <span className="flex-1">✗ {item}</span>
                          <button
                            type="button"
                            onClick={() => removeArrayItem('scope_out', idx)}
                            className="text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assumptions</label>
                  <textarea
                    value={formData.assumptions}
                    onChange={(e) => setFormData({ ...formData, assumptions: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="List any assumptions made during planning"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Constraints & Risks
                  </label>
                  <textarea
                    value={formData.constraints_risks}
                    onChange={(e) => setFormData({ ...formData, constraints_risks: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Identify limitations, dependencies, or potential risks"
                  />
                </div>
              </div>
            )}

            {/* 3. TEST STRATEGY & APPROACH */}
            {activeTab === 'strategy' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Test Strategy & Approach</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Testing Approach
                  </label>
                  <textarea
                    value={formData.testing_approach}
                    onChange={(e) => setFormData({ ...formData, testing_approach: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Describe the high-level testing methodology (manual, automation, hybrid, etc.)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Test Levels
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={testLevelInput}
                        onChange={(e) => setTestLevelInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addArrayItem('test_levels', testLevelInput)
                            setTestLevelInput('')
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="Unit, Integration, System, UAT..."
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.test_levels.map((level, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs"
                        >
                          {level}
                          <button
                            type="button"
                            onClick={() => removeArrayItem('test_levels', idx)}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Test Types
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={testTypeInput}
                        onChange={(e) => setTestTypeInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addArrayItem('test_types', testTypeInput)
                            setTestTypeInput('')
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="Functional, Performance, Security..."
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.test_types.map((type, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs"
                        >
                          {type}
                          <button
                            type="button"
                            onClick={() => removeArrayItem('test_types', idx)}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entry Criteria
                  </label>
                  <textarea
                    value={formData.entry_criteria}
                    onChange={(e) => setFormData({ ...formData, entry_criteria: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Conditions that must be met before testing begins"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exit Criteria
                  </label>
                  <textarea
                    value={formData.exit_criteria}
                    onChange={(e) => setFormData({ ...formData, exit_criteria: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Conditions for successful test completion"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Defect Management Approach
                  </label>
                  <textarea
                    value={formData.defect_management_approach}
                    onChange={(e) => setFormData({ ...formData, defect_management_approach: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="How defects will be tracked, triaged, and resolved"
                  />
                </div>
              </div>
            )}

            {/* 4. ENVIRONMENT & TOOLS */}
            {activeTab === 'environment' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Environment & Tools</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Environments
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={envInput}
                      onChange={(e) => setEnvInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addArrayItem('test_environments', envInput)
                          setEnvInput('')
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="DEV, QA, STAGE, UAT, PROD..."
                    />
                    <button
                      type="button"
                      onClick={() => {
                        addArrayItem('test_environments', envInput)
                        setEnvInput('')
                      }}
                      className="px-4 py-2 bg-primary text-white rounded-lg"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.test_environments.map((env, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm"
                      >
                        {env}
                        <button
                          type="button"
                          onClick={() => removeArrayItem('test_environments', idx)}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Environment URLs (optional)
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Add URLs for each environment for easy access
                  </p>
                  {formData.test_environments.map((env) => (
                    <div key={env} className="flex gap-2 mb-2">
                      <span className="px-3 py-2 bg-gray-100 rounded text-sm min-w-[100px]">
                        {env}
                      </span>
                      <input
                        type="url"
                        value={formData.environment_urls[env] || ''}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            environment_urls: {
                              ...formData.environment_urls,
                              [env]: e.target.value
                            }
                          })
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder={`https://${env.toLowerCase()}.example.com`}
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tools Used
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={toolInput}
                      onChange={(e) => setToolInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addArrayItem('tools_used', toolInput)
                          setToolInput('')
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Cypress, Playwright, JMeter, Jenkins..."
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tools_used.map((tool, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
                      >
                        {tool}
                        <button
                          type="button"
                          onClick={() => removeArrayItem('tools_used', idx)}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Data Setup
                  </label>
                  <textarea
                    value={formData.data_setup}
                    onChange={(e) => setFormData({ ...formData, data_setup: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Describe test data requirements and setup procedures"
                  />
                </div>
              </div>
            )}

            {/* 5. ROLES & RESPONSIBILITIES */}
            {activeTab === 'team' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Roles & Responsibilities</h3>
                <p className="text-sm text-gray-600">
                  Assign team members to various roles (use user IDs from your organization)
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Manager
                  </label>
                  <input
                    type="text"
                    value={formData.test_manager_id}
                    onChange={(e) => setFormData({ ...formData, test_manager_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="User ID of Test Manager"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    QA Leads (comma-separated User IDs)
                  </label>
                  <input
                    type="text"
                    onChange={(e) => {
                      const ids = e.target.value.split(',').map(id => id.trim()).filter(id => id)
                      setFormData({ ...formData, qa_lead_ids: ids })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="user-id-1, user-id-2, user-id-3"
                  />
                  {formData.qa_lead_ids.length > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      {formData.qa_lead_ids.length} QA Lead(s) assigned
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    QA Engineers (comma-separated User IDs)
                  </label>
                  <input
                    type="text"
                    onChange={(e) => {
                      const ids = e.target.value.split(',').map(id => id.trim()).filter(id => id)
                      setFormData({ ...formData, qa_engineer_ids: ids })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="user-id-1, user-id-2, user-id-3"
                  />
                  {formData.qa_engineer_ids.length > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      {formData.qa_engineer_ids.length} QA Engineer(s) assigned
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stakeholders/Approvers (comma-separated User IDs)
                  </label>
                  <input
                    type="text"
                    onChange={(e) => {
                      const ids = e.target.value.split(',').map(id => id.trim()).filter(id => id)
                      setFormData({ ...formData, stakeholder_ids: ids })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="user-id-1, user-id-2, user-id-3"
                  />
                  {formData.stakeholder_ids.length > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      {formData.stakeholder_ids.length} Stakeholder(s) assigned
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 6. SCHEDULE & MILESTONES */}
            {activeTab === 'schedule' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Schedule & Milestones</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Planned Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.planned_start_date}
                      onChange={(e) => setFormData({ ...formData, planned_start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Planned End Date
                    </label>
                    <input
                      type="date"
                      value={formData.planned_end_date}
                      onChange={(e) => setFormData({ ...formData, planned_end_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Milestones
                    </label>
                    <button
                      type="button"
                      onClick={addMilestone}
                      className="px-3 py-1 bg-primary text-white rounded text-sm flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add Milestone
                    </button>
                  </div>

                  {formData.milestones.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4 border-2 border-dashed rounded-lg">
                      No milestones yet. Click "Add Milestone" to create one.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {formData.milestones.map((milestone, idx) => (
                        <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-start justify-between mb-3">
                            <span className="text-sm font-medium text-gray-700">
                              Milestone {idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeMilestone(idx)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="space-y-3">
                            <input
                              type="text"
                              value={milestone.name}
                              onChange={(e) => updateMilestone(idx, 'name', e.target.value)}
                              placeholder="Milestone name"
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            />

                            <input
                              type="text"
                              value={milestone.description || ''}
                              onChange={(e) => updateMilestone(idx, 'description', e.target.value)}
                              placeholder="Description (optional)"
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            />

                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="date"
                                value={milestone.due_date || ''}
                                onChange={(e) => updateMilestone(idx, 'due_date', e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded text-sm"
                              />

                              <select
                                value={milestone.status}
                                onChange={(e) => updateMilestone(idx, 'status', e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded text-sm"
                              >
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 7. METRICS & REPORTING */}
            {activeTab === 'metrics' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Metrics & Reporting</h3>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Test Coverage Target (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.test_coverage_target || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        test_coverage_target: e.target.value ? parseFloat(e.target.value) : undefined
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="95.0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Automation Coverage Target (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.automation_coverage_target || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        automation_coverage_target: e.target.value ? parseFloat(e.target.value) : undefined
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="70.0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Defect Density Target
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.defect_density_target || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        defect_density_target: e.target.value ? parseFloat(e.target.value) : undefined
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="0.5"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reporting Frequency
                  </label>
                  <select
                    value={formData.reporting_frequency}
                    onChange={(e) => setFormData({ ...formData, reporting_frequency: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Biweekly</option>
                    <option value="end_of_cycle">End of Cycle</option>
                    <option value="on_demand">On Demand</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dashboard/Report Links
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="url"
                      value={dashboardInput}
                      onChange={(e) => setDashboardInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addArrayItem('dashboard_links', dashboardInput)
                          setDashboardInput('')
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="https://grafana.example.com/dashboard"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        addArrayItem('dashboard_links', dashboardInput)
                        setDashboardInput('')
                      }}
                      className="px-4 py-2 bg-primary text-white rounded-lg"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <ul className="space-y-1">
                    {formData.dashboard_links.map((link, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                        <span className="flex-1 truncate">{link}</span>
                        <button
                          type="button"
                          onClick={() => removeArrayItem('dashboard_links', idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* 8. REVIEW & APPROVAL */}
            {activeTab === 'review' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Review & Approval</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Initial Review Status
                  </label>
                  <select
                    value={formData.review_status}
                    onChange={(e) => setFormData({ ...formData, review_status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="draft">Draft</option>
                    <option value="under_review">Under Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    New test plans typically start as "Draft"
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Initial Comments (optional)
                  </label>
                  <textarea
                    value={formData.review_comments}
                    onChange={(e) => setFormData({ ...formData, review_comments: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Any initial notes or comments about this test plan"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">Summary</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-blue-700">Test Plan Name:</span>
                      <p className="font-medium text-blue-900">{formData.name || 'Not set'}</p>
                    </div>
                    <div>
                      <span className="text-blue-700">Type:</span>
                      <p className="font-medium text-blue-900 capitalize">{formData.test_plan_type}</p>
                    </div>
                    <div>
                      <span className="text-blue-700">Modules:</span>
                      <p className="font-medium text-blue-900">{formData.modules.length || 0}</p>
                    </div>
                    <div>
                      <span className="text-blue-700">Objectives:</span>
                      <p className="font-medium text-blue-900">{formData.objectives.length || 0}</p>
                    </div>
                    <div>
                      <span className="text-blue-700">Environments:</span>
                      <p className="font-medium text-blue-900">{formData.test_environments.length || 0}</p>
                    </div>
                    <div>
                      <span className="text-blue-700">Milestones:</span>
                      <p className="font-medium text-blue-900">{formData.milestones.length || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <div className="flex gap-3">
              {activeTab !== 'basic' && (
                <button
                  type="button"
                  onClick={() => {
                    const currentIndex = tabs.findIndex(t => t.id === activeTab)
                    if (currentIndex > 0) setActiveTab(tabs[currentIndex - 1].id)
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  Previous
                </button>
              )}
              {activeTab !== 'review' ? (
                <button
                  type="button"
                  onClick={() => {
                    const currentIndex = tabs.findIndex(t => t.id === activeTab)
                    if (currentIndex < tabs.length - 1) setActiveTab(tabs[currentIndex + 1].id)
                  }}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Test Plan
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
