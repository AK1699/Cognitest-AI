'use client'

import { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChevronRight,
  ChevronDown,
  Target,
  Layers,
  Route,
  AlertCircle,
  Calendar,
  Users,
  Server,
  CheckCircle2,
  AlertTriangle,
  FileText,
  CheckSquare,
  Sparkles,
  Clock,
  Tag,
  TrendingUp,
  Network,
  Database,
  Key
} from 'lucide-react'
import { TestPlan } from '@/lib/api/test-management'
import { formatDateHumanReadable } from '@/lib/date-utils'

interface TestPlanDetailsModalProps {
  testPlan: TestPlan | null
  open: boolean
  onOpenChange: (open: boolean) => void
  readOnly?: boolean
}

interface SectionConfig {
  id: string
  title: string
  icon: React.ReactNode
  color: string
  field: keyof TestPlan
}

export function TestPlanDetailsModal({
  testPlan,
  open,
  onOpenChange,
  readOnly = true
}: TestPlanDetailsModalProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic']))
  const [showAllAssumptions, setShowAllAssumptions] = useState(true)
  const [showAllPhases, setShowAllPhases] = useState(true)
  const [showAllResources, setShowAllResources] = useState(true)
  const [showRRHelp, setShowRRHelp] = useState(false)

  // Helper function to safely ensure data is an array
  const ensureArray = (data: any): any[] => {
    if (!data) return []
    if (Array.isArray(data)) return data
    return []
  }

  // Normalize arbitrary values into displayable text
  const toText = (value: any): string => {
    if (value == null) return ''
    if (typeof value === 'string') return value
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    // Try common name-like properties
    if (typeof value === 'object') {
      const candidate = (value as any).name || (value as any).title || (value as any).role || (value as any).label || (value as any).type
      if (typeof candidate === 'string') return candidate
    }
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }

  // Simple color hashing for tag styling
  const tagPalette = [
    { bg: 'bg-blue-100', text: 'text-blue-700', ring: 'ring-blue-200' },
    { bg: 'bg-green-100', text: 'text-green-700', ring: 'ring-green-200' },
    { bg: 'bg-purple-100', text: 'text-purple-700', ring: 'ring-purple-200' },
    { bg: 'bg-amber-100', text: 'text-amber-800', ring: 'ring-amber-200' },
    { bg: 'bg-pink-100', text: 'text-pink-700', ring: 'ring-pink-200' },
    { bg: 'bg-cyan-100', text: 'text-cyan-700', ring: 'ring-cyan-200' },
    { bg: 'bg-indigo-100', text: 'text-indigo-700', ring: 'ring-indigo-200' },
    { bg: 'bg-teal-100', text: 'text-teal-700', ring: 'ring-teal-200' },
    { bg: 'bg-orange-100', text: 'text-orange-700', ring: 'ring-orange-200' },
  ] as const

  const hashString = (s: string) => {
    let h = 0
    for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i)
    return Math.abs(h)
  }

  const getTagClasses = (tagRaw: any) => {
    const t = toText(tagRaw).toLowerCase()
    // Keyword-based mapping for common tags
    if (t.includes('api')) return { bg: 'bg-cyan-100', text: 'text-cyan-700', ring: 'ring-cyan-200' }
    if (t.includes('ui') || t.includes('ux') || t.includes('frontend')) return { bg: 'bg-purple-100', text: 'text-purple-700', ring: 'ring-purple-200' }
    if (t.includes('mobile')) return { bg: 'bg-pink-100', text: 'text-pink-700', ring: 'ring-pink-200' }
    if (t.includes('web')) return { bg: 'bg-indigo-100', text: 'text-indigo-700', ring: 'ring-indigo-200' }
    if (t.includes('auth') || t.includes('oauth') || t.includes('sso')) return { bg: 'bg-amber-100', text: 'text-amber-800', ring: 'ring-amber-200' }
    if (t.includes('security')) return { bg: 'bg-red-100', text: 'text-red-700', ring: 'ring-red-200' }
    if (t.includes('performance')) return { bg: 'bg-green-100', text: 'text-green-700', ring: 'ring-green-200' }
    if (t.includes('automation')) return { bg: 'bg-blue-100', text: 'text-blue-700', ring: 'ring-blue-200' }
    // Fallback: hash to palette
    const idx = hashString(t || 'tag') % tagPalette.length
    return tagPalette[idx]
  }

  const getConfidenceBadgeClasses = (score?: number) => {
    if (typeof score !== 'number') return 'bg-gray-100 text-gray-700'
    if (score >= 90) return 'bg-green-100 text-green-700 ring-1 ring-green-200'
    if (score >= 60) return 'bg-amber-100 text-amber-800 ring-1 ring-amber-200'
    return 'bg-red-100 text-red-700 ring-1 ring-red-200'
  }

  // Normalize metric entries into a consistent structure
  type UiMetric = { key: string; title: string; value?: number | string; unit?: string; note?: string }
  const normalizeMetric = (m: any): UiMetric => {
    // If object with value/label and potential variants
    if (m && typeof m === 'object') {
      const rawKey = (m.key || m.name || m.id || m.metric || m.type || '').toString()
      const rawTitle = (m.title || m.label || rawKey || '').toString()

      // Try to derive value from common fields
      const nested = (v: any) => (v && typeof v === 'object') ? v : undefined
      let value: any = undefined
      let unit: string | undefined = undefined

      // Direct fields
      if (typeof m.value !== 'undefined' && typeof m.value !== 'object') value = m.value
      else if (typeof m.score !== 'undefined') value = m.score
      else if (typeof m.percent !== 'undefined') { value = m.percent; unit = '%' }
      else if (typeof m.percentage !== 'undefined') { value = m.percentage; unit = '%' }
      else if (typeof m.rate !== 'undefined') {
        value = m.rate
        // heuristics: if 0-1, treat as percent
        if (typeof value === 'number' && value <= 1) { value = Math.round(value * 100); unit = '%' }
      }

      // Nested shapes like { value: { percent: 92 } } or { result: { percentage: 75 } }
      // OR { value: { executed: 10, total: 20 } }
      const candidates = [m.value, m.result, m.data, m.stats]
      for (const c of candidates) {
        const n = nested(c)
        if (!n) continue

        if (typeof n.percent !== 'undefined') { value = n.percent; unit = '%' }
        else if (typeof n.percentage !== 'undefined') { value = n.percentage; unit = '%' }
        else if (typeof n.rate !== 'undefined') {
          value = n.rate
          if (typeof value === 'number' && value <= 1) { value = Math.round(value * 100); unit = '%' }
        } else {
          // Try to extract from executed/total in the nested object
          const num = Number(n.numerator ?? n.executed ?? n.passed ?? n.automated ?? n.current)
          const den = Number(n.denominator ?? n.total ?? n.planned ?? n.cases ?? n.scope)
          if (Number.isFinite(num) && Number.isFinite(den) && den > 0) {
            value = Math.round((num / den) * 100)
            unit = '%'
          }
        }
      }

      // Compute percent from numerator/denominator if present on the main object
      if (typeof value === 'undefined') {
        const num = Number(m.numerator ?? m.executed ?? m.passed ?? m.automated ?? m.current)
        const den = Number(m.denominator ?? m.total ?? m.planned ?? m.cases ?? m.scope)
        if (Number.isFinite(num) && Number.isFinite(den) && den > 0) {
          value = Math.round((num / den) * 100)
          unit = '%'
        }
      }

      // string values with %
      if (typeof value === 'string') {
        const mm = value.match?.(/([0-9]+(?:\.[0-9]+)?)\s*%/)
        if (mm) { value = Number(mm[1]); unit = '%' }
      }

      // Coerce numeric strings
      if (typeof value === 'string' && /^\d+(?:\.\d+)?$/.test(value)) value = Number(value)

      // Unit inference from string value field
      if (!unit && typeof m.value === 'string' && /%$/.test(m.value)) unit = '%'

      // Final safety check: if value is still an object, discard it
      if (typeof value === 'object') value = undefined

      return { key: rawKey || rawTitle || 'metric', title: rawTitle || rawKey || 'Metric', value, unit, note: m.note }
    }

    // If string, try to detect known metric and number
    const s = toText(m)
    const numMatch = s.match(/([0-9]+(?:\.[0-9]+)?)\s*%?/)
    const val = numMatch ? Number(numMatch[1]) : undefined
    const hasPct = /%/.test(s)
    const unit = hasPct ? '%' : undefined
    return { key: s.toLowerCase().replace(/\s+/g, '_'), title: s, value: val, unit }
  }

  // Fallback presets for common roles when AI output lacks details
  const getRolePreset = (nameRaw: any) => {
    const name = toText(nameRaw).toLowerCase()
    const match = (s: string) => name.includes(s)
    if (match('test manager') || match('qa manager')) return {
      responsibilities: [
        'Define overall QA strategy and roadmap',
        'Plan and allocate testing resources',
        'Report quality metrics to stakeholders'
      ],
      skills: ['Leadership', 'Risk-based testing', 'Reporting']
    }
    if (match('test lead') || match('qa lead')) return {
      responsibilities: [
        'Lead test planning and estimations',
        'Review test cases and coverage',
        'Coordinate test execution and triage defects'
      ],
      skills: ['Test design', 'Defect triage', 'Coordination']
    }
    if (match('automation')) return {
      responsibilities: [
        'Develop and maintain automated test suites',
        'Integrate tests into CI/CD pipeline',
        'Improve automation coverage and stability'
      ],
      skills: ['Playwright/Cypress', 'CI/CD', 'OOP']
    }
    if (match('manual') || match('functional') || match('qa engineer')) return {
      responsibilities: [
        'Execute functional and exploratory tests',
        'Design high-quality test cases',
        'Log defects with reproduction steps'
      ],
      skills: ['Exploratory testing', 'Test case design', 'Bug reporting']
    }
    if (match('security')) return {
      responsibilities: [
        'Perform vulnerability assessments',
        'Collaborate on threat modeling',
        'Validate security controls and fixes'
      ],
      skills: ['OWASP', 'Burp/ZAP', 'Secure SDLC']
    }
    if (match('performance') || match('load')) return {
      responsibilities: [
        'Design load and stress scenarios',
        'Analyze bottlenecks and resource usage',
        'Recommend performance optimizations'
      ],
      skills: ['JMeter', 'APM tools', 'Profiling']
    }
    return null
  }

  const noPlan = !testPlan

  // Derive confidence score robustly (supports number or string)
  const confidenceVal = useMemo(() => {
    const raw = (testPlan as any)?.confidence_score
    const n = Number(raw)
    return Number.isFinite(n) ? n : undefined
  }, [testPlan])

  const normalizedPlan = useMemo(() => {
    if (!testPlan) return null as any
    const tp: any = testPlan
    const pick = (primary: any, fallback?: any) => primary ?? fallback
    const normalizeArray = (v: any) => Array.isArray(v) ? v : (v ? [v] : [])

    return {
      ...tp,
      // Map legacy or non-IEEE keys into IEEE display keys
      test_objectives_ieee: pick(tp.test_objectives_ieee, pick(tp.test_objectives, tp.objectives)),
      scope_of_testing_ieee: pick(tp.scope_of_testing_ieee, tp.scope_of_testing),
      test_approach_ieee: pick(tp.test_approach_ieee, tp.test_approach),
      assumptions_constraints_ieee: pick(tp.assumptions_constraints_ieee, pick(tp.assumptions_and_constraints, tp.assumptions)),
      test_schedule_ieee: pick(tp.test_schedule_ieee, pick(tp.test_schedule, { phases: normalizeArray(tp.phases) })),
      resources_roles_ieee: pick(tp.resources_roles_ieee, pick(tp.resources_and_roles, tp.resources)),
      test_environment_ieee: pick(tp.test_environment_ieee, pick(tp.test_environment, tp.environment)),
      entry_exit_criteria_ieee: pick(tp.entry_exit_criteria_ieee, tp.entry_exit_criteria),
      risk_management_ieee: pick(tp.risk_management_ieee, tp.risk_management),
      deliverables_reporting_ieee: pick(tp.deliverables_reporting_ieee, pick(tp.deliverables_and_reporting, tp.deliverables)),
      approval_signoff_ieee: pick(tp.approval_signoff_ieee, pick(tp.approval_signoff, tp.approval)),
    }
  }, [testPlan])

  // Derive a concise list of objectives for the Basic Information section
  const basicObjectives = useMemo(() => {
    if (!normalizedPlan) return [] as any[]
    const direct = (normalizedPlan as any).objectives
    if (Array.isArray(direct) && direct.length) return direct
    const ieee = (normalizedPlan as any).test_objectives_ieee
    if (Array.isArray(ieee)) {
      return ieee
        .map((o: any) => o?.objective ?? o?.title ?? o?.description)
        .filter(Boolean)
        .slice(0, 6)
    }
    return [] as any[]
  }, [normalizedPlan])

  /* removed exportJson */

  /* removed toggleAll */

  // moved below after sections definition to avoid reference before initialization

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const sections: SectionConfig[] = [
    {
      id: 'objectives',
      title: 'Test Objectives',
      icon: <Target className="w-4 h-4" />,
      color: 'text-blue-500',
      field: 'test_objectives_ieee'
    },
    {
      id: 'scope',
      title: 'Scope of Testing',
      icon: <Layers className="w-4 h-4" />,
      color: 'text-green-500',
      field: 'scope_of_testing_ieee'
    },
    {
      id: 'approach',
      title: 'Test Approach',
      icon: <Route className="w-4 h-4" />,
      color: 'text-purple-500',
      field: 'test_approach_ieee'
    },
    {
      id: 'assumptions',
      title: 'Assumptions & Constraints',
      icon: <AlertCircle className="w-4 h-4" />,
      color: 'text-yellow-500',
      field: 'assumptions_constraints_ieee'
    },
    {
      id: 'schedule',
      title: 'Test Schedule',
      icon: <Calendar className="w-4 h-4" />,
      color: 'text-orange-500',
      field: 'test_schedule_ieee'
    },
    {
      id: 'resources',
      title: 'Resources & Roles',
      icon: <Users className="w-4 h-4" />,
      color: 'text-pink-500',
      field: 'resources_roles_ieee'
    },
    {
      id: 'environment',
      title: 'Test Environment',
      icon: <Server className="w-4 h-4" />,
      color: 'text-cyan-500',
      field: 'test_environment_ieee'
    },
    {
      id: 'criteria',
      title: 'Entry/Exit Criteria',
      icon: <CheckCircle2 className="w-4 h-4" />,
      color: 'text-emerald-500',
      field: 'entry_exit_criteria_ieee'
    },
    {
      id: 'risks',
      title: 'Risk Management',
      icon: <AlertTriangle className="w-4 h-4" />,
      color: 'text-red-500',
      field: 'risk_management_ieee'
    },
    {
      id: 'deliverables',
      title: 'Deliverables & Reporting',
      icon: <FileText className="w-4 h-4" />,
      color: 'text-indigo-500',
      field: 'deliverables_reporting_ieee'
    },
    {
      id: 'approval',
      title: 'Approval & Sign-off',
      icon: <CheckSquare className="w-4 h-4" />,
      color: 'text-teal-500',
      field: 'approval_signoff_ieee'
    }
  ]

  const availableSections: any[] = []

  const renderSectionContent = (field: keyof TestPlan) => {
    const src: any = normalizedPlan || {}
    const data = src[field] as any

    if (!data || (Array.isArray(data) && data.length === 0) || (typeof data === 'object' && Object.keys(data).length === 0)) {
      return (
        <div className="text-sm text-gray-500 dark:text-gray-400 italic py-2">
          No data available for this section
        </div>
      )
    }

    // Handle different data structures based on the field
    switch (field) {
      case 'test_objectives_ieee':
        return renderTestObjectives(data)
      case 'scope_of_testing_ieee':
        return renderScope(data)
      case 'test_approach_ieee':
        return renderApproach(data)
      case 'assumptions_constraints_ieee':
        return renderAssumptionsConstraints(data)
      case 'test_schedule_ieee':
        return renderSchedule(data)
      case 'resources_roles_ieee':
        return renderResources(data)
      case 'test_environment_ieee':
        return renderEnvironment(data)
      case 'entry_exit_criteria_ieee':
        return renderCriteria(data)
      case 'risk_management_ieee':
        return renderRisks(data)
      case 'deliverables_reporting_ieee':
        return renderDeliverables(data)
      case 'approval_signoff_ieee':
        return renderApproval(data)
      default:
        return <pre className="text-xs overflow-auto">{JSON.stringify(data, null, 2)}</pre>
    }
  }

  const renderTestObjectives = (data: any[]) => (
    <div className="space-y-3">
      {data.map((obj: any, index: number) => (
        <div key={index} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-gray-900 dark:text-white">{obj.objective || obj.title}</h4>
            {obj.priority && (
              <Badge variant={obj.priority === 'high' ? 'destructive' : 'secondary'}>
                {obj.priority}
              </Badge>
            )}
          </div>
          {obj.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{obj.description}</p>
          )}
          {obj.success_criteria && Array.isArray(obj.success_criteria) && obj.success_criteria.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Success Criteria:</p>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {obj.success_criteria.map((criteria: string, i: number) => (
                  <li key={i}>{criteria}</li>
                ))}
              </ul>
            </div>
          )}
          {obj.success_criteria && typeof obj.success_criteria === 'string' && (
            <div className="mt-2">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Success Criteria:</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{obj.success_criteria}</p>
            </div>
          )}
          {obj.quality_goals && Array.isArray(obj.quality_goals) && obj.quality_goals.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Quality Goals:</p>
              <div className="flex flex-wrap gap-1">
                {obj.quality_goals.map((goal: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-xs">{goal}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )

  const renderScope = (data: any) => (
    <div className="space-y-4">
      {data.in_scope && data.in_scope.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm text-green-600 dark:text-green-400 mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            In Scope
          </h4>
          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
            {data.in_scope.map((item: any, i: number) => (
              <li key={i}>{toText(item)}</li>
            ))}
          </ul>
        </div>
      )}
      {data.out_of_scope && data.out_of_scope.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Out of Scope
          </h4>
          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
            {data.out_of_scope.map((item: any, i: number) => (
              <li key={i}>{toText(item)}</li>
            ))}
          </ul>
        </div>
      )}
      {data.test_types && data.test_types.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">Test Types</h4>
          <div className="flex flex-wrap gap-2">
            {data.test_types.map((type: string, i: number) => (
              <Badge key={i} variant="secondary">{type}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderApproach = (data: any) => (
    <div className="space-y-4">
      {data.methodology && (
        <div>
          <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">Methodology</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">{data.methodology}</p>
        </div>
      )}
      {data.testing_types && data.testing_types.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">Testing Types</h4>
          <div className="space-y-2">
            {data.testing_types.map((type: any, i: number) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm text-gray-900 dark:text-white">{type.type}</span>
                  {type.coverage && (
                    <Badge variant="outline" className="text-xs">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {type.coverage} coverage
                    </Badge>
                  )}
                </div>
                {type.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">{type.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {data.automation_approach && (
        <div>
          <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">Automation Approach</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">{data.automation_approach}</p>
        </div>
      )}
      {data.tools_and_frameworks && data.tools_and_frameworks.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">Tools & Frameworks</h4>
          <div className="flex flex-wrap gap-2">
            {data.tools_and_frameworks.map((tool: any, i: number) => (
              <Badge key={i} variant="secondary">{toText(tool)}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderAssumptionsConstraints = (data: any) => {
    const items = ensureArray(data)
    const displayItems = showAllAssumptions ? items : items.slice(0, 5)

    // Group by type
    const assumptions = displayItems.filter((item: any) => item.type === 'assumption')
    const constraints = displayItems.filter((item: any) => item.type === 'constraint')
    const dependencies = displayItems.filter((item: any) => item.type === 'dependency')

    return (
      <div className="space-y-4">
        {assumptions.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-blue-600 dark:text-blue-400 mb-2">Assumptions</h4>
            <ul className="list-disc list-inside space-y-1">
              {assumptions.map((item: any, index: number) => (
                <li key={index} className="text-sm text-gray-700 dark:text-gray-300">{item.description}</li>
              ))}
            </ul>
          </div>
        )}
        {constraints.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-orange-600 dark:text-orange-400 mb-2">Constraints</h4>
            <ul className="list-disc list-inside space-y-1">
              {constraints.map((item: any, index: number) => (
                <li key={index} className="text-sm text-gray-700 dark:text-gray-300">{item.description}</li>
              ))}
            </ul>
          </div>
        )}
        {dependencies.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-purple-600 dark:text-purple-400 mb-2">Dependencies</h4>
            <ul className="list-disc list-inside space-y-1">
              {dependencies.map((item: any, index: number) => (
                <li key={index} className="text-sm text-gray-700 dark:text-gray-300">{item.description}</li>
              ))}
            </ul>
          </div>
        )}
        {items.length > 5 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAllAssumptions(!showAllAssumptions)}
            className="text-xs"
          >
            {showAllAssumptions ? 'Show Less' : `Show ${items.length - 5} More`}
          </Button>
        )}
      </div>
    )
  }

  const renderSchedule = (data: any) => {
    const phases = ensureArray(data.phases)
    const displayPhases = showAllPhases ? phases : phases.slice(0, 3)

    return (
      <div className="space-y-4">
        {phases.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                Phases ({phases.length})
              </h4>
            </div>
            <div className="space-y-3">
              {displayPhases.map((phase: any, i: number) => (
                <div key={i} className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-sm text-gray-900 dark:text-white">{phase.name}</h5>
                    <Badge variant="outline" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      Phase {i + 1}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {phase.start_date && <div><strong>Start:</strong> {phase.start_date}</div>}
                    {phase.end_date && <div><strong>End:</strong> {phase.end_date}</div>}
                  </div>
                  {phase.milestones && ensureArray(phase.milestones).length > 0 && (
                    <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Milestones: {ensureArray(phase.milestones).length}
                      </p>
                      <ul className="list-disc list-inside text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                        {ensureArray(phase.milestones).map((milestone: any, idx: number) => (
                          <li key={idx}>{typeof milestone === 'string' ? milestone : milestone.name || milestone}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {phases.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllPhases(!showAllPhases)}
                className="text-xs mt-2"
              >
                {showAllPhases ? 'Show Less' : `Show ${phases.length - 3} More Phases`}
              </Button>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderResources = (data: any) => {
    console.log('Resources & Roles Data:', JSON.stringify(data, null, 2))

    // Handle both array format and object with resources key
    const resourcesArray = Array.isArray(data) ? data : (data?.resources || ensureArray(data))
    const resources = ensureArray(resourcesArray)
    const displayResources = showAllResources ? resources : resources.slice(0, 4)

    if (resources.length === 0) {
      return (
        <div className="text-sm text-gray-500 dark:text-gray-400 italic py-2">
          No resources data available
        </div>
      )
    }

    return (
      <div className="space-y-3 relative">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-600 dark:text-gray-400">Team allocation and roles</div>
          <div className="relative">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowRRHelp((v) => !v) }}
              className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:border-gray-400"
              aria-expanded={showRRHelp}
              aria-controls="rr-help-popover"
              aria-label="What do L / HC / FTE mean?"
              title="What do L / HC / FTE mean?"
            >
              <span className="text-xs font-semibold">i</span>
              <span className="sr-only">What do L / HC / FTE mean?</span>
            </button>
            {showRRHelp && (
              <div
                id="rr-help-popover"
                className="absolute right-0 z-20 mt-2 w-[320px] rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 shadow-lg"
                role="dialog"
                aria-label="Resources & Roles help"
              >
                <div className="text-sm">
                  <div className="font-semibold text-gray-900 dark:text-white mb-2">Resources & Roles: Key Terms</div>
                  <div className="mb-2">
                    <div className="font-medium text-gray-800 dark:text-gray-200">L (Level)</div>
                    <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 text-xs space-y-1">
                      <li>Seniority in org job bands</li>
                      <li>L1/L2: Junior; L3: Mid; L4: Senior/Specialist; L5+: Lead/Architect</li>
                    </ul>
                  </div>
                  <div className="mb-2">
                    <div className="font-medium text-gray-800 dark:text-gray-200">HC (Headcount)</div>
                    <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 text-xs space-y-1">
                      <li>Number of people allocated (1 HC = 1 person)</li>
                      <li>0.5 HC = half-person (part-time)</li>
                    </ul>
                  </div>
                  <div className="mb-2">
                    <div className="font-medium text-gray-800 dark:text-gray-200">FTE (Full-Time Equivalent)</div>
                    <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 text-xs space-y-1">
                      <li>1.0 = 100%, 0.5 = 50%, 0.25 = 25%</li>
                      <li>FTE 0.25 ≈ 2h/day (if 8h workday)</li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-medium text-gray-800 dark:text-gray-200">Allocation vs FTE</div>
                    <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 text-xs space-y-1">
                      <li>Allocation often shown as %; 50% ≈ 0.5 FTE</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        {displayResources.map((resource: any, index: number) => {
          // Handle both string format and object format
          const isString = typeof resource === 'string'
          const roleName = isString ? resource : (
            toText(
              resource.role ??
              resource.role_name ??
              resource.position ??
              resource.title ??
              resource.name
            ) || `Resource ${index + 1}`
          )
          const allocation = !isString && (resource.allocation ?? resource.capacity ?? resource.utilization)
          const authority = !isString && (resource.authority ?? resource.role?.authority ?? resource.role?.level)
          const headcount = !isString && (resource.headcount ?? resource.count)
          const responsibilities = !isString && ensureArray(resource.responsibilities || [])
          const skills = !isString && ensureArray(resource.skills_required || [])

          // Additional derived details
          const roleObj = !isString && typeof resource.role === 'object' ? resource.role : undefined
          const reportingTo = !isString && (resource.reporting_to ?? roleObj?.reporting_to)
          const seniority = !isString && (resource.seniority ?? roleObj?.seniority ?? roleObj?.level)
          const fte = !isString && (resource.fte ?? resource.full_time_equivalent)

          // Normalize allocation to a percentage number when possible
          const allocText = toText(allocation || '')
          const allocMatch = /([0-9]{1,3})\s*%/.exec(allocText)
          const allocPct = allocMatch ? Math.min(100, Math.max(0, Number(allocMatch[1]))) : undefined

          return (
            <div key={index} className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{roleName}</h4>
                </div>
                <div className="flex items-center gap-2">
                  {authority && (
                    <Badge variant="secondary" className="text-xs">{toText(authority)}</Badge>
                  )}
                  {seniority && (
                    <Badge variant="secondary" className="text-xs">{toText(seniority)}</Badge>
                  )}
                  {headcount && (
                    <Badge variant="outline" className="text-xs">{toText(headcount)} HC</Badge>
                  )}
                  {fte && (
                    <Badge variant="outline" className="text-xs">FTE {toText(fte)}</Badge>
                  )}
                  {allocation && (
                    <Badge variant="outline" className="text-xs">{toText(allocation)}</Badge>
                  )}
                </div>
              </div>

              {/* Sub-details row */}
              {!isString && (reportingTo || allocPct !== undefined) && (
                <div className="mb-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {reportingTo && (
                    <div className="text-xs text-gray-600 dark:text-gray-400"><strong>Reporting to:</strong> {toText(reportingTo)}</div>
                  )}
                  {allocPct !== undefined && (
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-gray-600 dark:text-gray-400 min-w-[3.5rem]">{allocPct}%</div>
                      <div className="flex-1 h-2 bg-purple-100 dark:bg-purple-900/30 rounded">
                        <div className="h-2 bg-purple-500 rounded" style={{ width: `${allocPct}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Responsibilities & Skills with presets when missing */}
              {(() => {
                const preset = isString ? getRolePreset(roleName) : null
                const respList = responsibilities && responsibilities.length > 0 ? responsibilities : preset?.responsibilities || []
                const skillList = skills && skills.length > 0 ? skills : preset?.skills || []
                return (
                  <>
                    {respList.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Key Responsibilities ({respList.length})
                        </p>
                        <ul className="list-disc list-inside text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                          {respList.map((resp: any, i: number) => (
                            <li key={i}>{toText(resp)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {skillList.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Skills:</p>
                        <div className="flex flex-wrap gap-1">
                          {skillList.map((skill: any, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">{toText(skill)}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {isString && respList.length === 0 && skillList.length === 0 && (
                      <div className="mt-1 text-xs text-gray-500 italic">No details provided for this role.</div>
                    )}
                  </>
                )
              })()}
            </div>
          )
        })}
        {resources.length > 4 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAllResources(!showAllResources)}
            className="text-xs"
          >
            {showAllResources ? 'Show Less' : `Show ${resources.length - 4} More Resources`}
          </Button>
        )}
      </div>
    )
  }

  const renderEnvironment = (data: any) => {
    console.log('Test Environment Data:', JSON.stringify(data, null, 2))

    // Handle the actual structure from AI: hardware, software, network, test_data, access, setup_process, refresh_cadence
    const hardware = ensureArray(data?.hardware || [])
    const software = ensureArray(data?.software || [])
    const network = ensureArray(data?.network || [])
    const testData = ensureArray(data?.test_data || [])
    const access = ensureArray(data?.access || [])
    const setupProcess = data?.setup_process
    const refreshCadence = data?.refresh_cadence

    return (
      <div className="space-y-4">
        {/* Hardware */}
        {hardware.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-cyan-600 dark:text-cyan-400 mb-2 flex items-center gap-2">
              <Server className="w-4 h-4" />
              Hardware
            </h4>
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 p-3 rounded-lg border border-cyan-200 dark:border-cyan-800">
              <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                {hardware.map((item: any, i: number) => (
                  <li key={i}>{toText(item)}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Software */}
        {software.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Software
            </h4>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                {software.map((item: any, i: number) => (
                  <li key={i}>{toText(item)}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Network */}
        {network.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-purple-600 dark:text-purple-400 mb-2 flex items-center gap-2">
              <Network className="w-4 h-4" />
              Network
            </h4>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
              <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                {network.map((item: any, i: number) => (
                  <li key={i}>{toText(item)}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Test Data */}
        {testData.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-green-600 dark:text-green-400 mb-2 flex items-center gap-2">
              <Database className="w-4 h-4" />
              Test Data
            </h4>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
              <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                {testData.map((item: any, i: number) => (
                  <li key={i}>{toText(item)}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Access */}
        {access.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-orange-600 dark:text-orange-400 mb-2 flex items-center gap-2">
              <Key className="w-4 h-4" />
              Access & Credentials
            </h4>
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
              <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                {access.map((item: any, i: number) => (
                  <li key={i}>{toText(item)}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Setup Process */}
        {setupProcess && (
          <div>
            <h4 className="font-semibold text-sm text-indigo-600 dark:text-indigo-400 mb-2">Setup Process</h4>
            <div className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <p className="text-sm text-gray-700 dark:text-gray-300">{setupProcess}</p>
            </div>
          </div>
        )}

        {/* Refresh Cadence */}
        {refreshCadence && (
          <div>
            <h4 className="font-semibold text-sm text-teal-600 dark:text-teal-400 mb-2">Refresh Cadence</h4>
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 p-3 rounded-lg border border-teal-200 dark:border-teal-800">
              <p className="text-sm text-gray-700 dark:text-gray-300">{refreshCadence}</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderCriteria = (data: any) => (
    <div className="space-y-4">
      {data.entry && data.entry.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm text-green-600 dark:text-green-400 mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Entry Criteria
          </h4>
          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
            {data.entry.map((item: any, i: number) => (
              <li key={i}>{typeof item === 'string' ? item : item.criterion || item.description}</li>
            ))}
          </ul>
        </div>
      )}
      {data.exit && data.exit.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Exit Criteria
          </h4>
          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
            {data.exit.map((item: any, i: number) => (
              <li key={i}>{typeof item === 'string' ? item : item.criterion || item.description}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )

  const renderRisks = (data: any) => (
    <div className="space-y-4">
      {data.risks && data.risks.length > 0 && (
        <div className="space-y-3">
          {data.risks.map((risk: any, i: number) => (
            <div key={i} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-gray-900 dark:text-white flex-1">{risk.description}</h4>
                <Badge
                  variant={
                    risk.risk_level === 'high' || risk.risk_level === 'High'
                      ? 'destructive'
                      : risk.risk_level === 'medium' || risk.risk_level === 'Medium'
                        ? 'default'
                        : 'secondary'
                  }
                  className="text-xs ml-2"
                >
                  {risk.risk_level || risk.impact}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
                {risk.probability && <div><strong>Probability:</strong> {risk.probability}</div>}
                {risk.impact && <div><strong>Impact:</strong> {risk.impact}</div>}
              </div>
              {risk.mitigation && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                  <strong className="text-gray-700 dark:text-gray-200">Mitigation:</strong> {risk.mitigation}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
      {data.risk_matrix && (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">Risk Matrix</h4>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{data.risk_matrix.high || 0}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">High</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{data.risk_matrix.medium || 0}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Medium</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{data.risk_matrix.low || 0}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Low</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderDeliverables = (data: any) => {
    console.log('Deliverables & Reporting Data:', JSON.stringify(data, null, 2))

    const artifacts = ensureArray(data?.artifacts || [])
    const reporting = ensureArray(data?.reporting_structure || data?.reporting || [])
    const stakeholders = ensureArray(data?.stakeholders || [])
    const metrics = ensureArray(data?.metrics || [])
    const comms = ensureArray(data?.communication_plan || data?.communications || [])

    const List = ({ title, items }: { title: string; items: any[] }) => (
      items.length > 0 ? (
        <div>
          <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">{title}</h4>
          <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
            {items.map((item, i) => (
              <li key={i}>{toText(item)}</li>
            ))}
          </ul>
        </div>
      ) : null
    )

    return (
      <div className="space-y-4">
        <List title="Artifacts" items={artifacts} />
        <List title="Reporting Structure" items={reporting} />
        <List title="Stakeholders" items={stakeholders} />

        {metrics.length > 0 && (() => {
          const known: Record<string, { title: string; note?: string }> = {
            'execution_rate': { title: 'Test Case Execution Rate (%)', note: 'Executed cases vs total planned.' },
            'pass_rate': { title: 'Test Case Pass Rate (%)', note: 'Passed cases vs executed.' },
            'coverage': { title: 'Test Coverage (%)', note: 'Feature/Requirement/Automation coverage.' },
            'defect_density': { title: 'Defect Density', note: 'Defects per test case or story.' },
            'defect_distribution': { title: 'Defect Severity/Priority Distribution', note: 'By severity and priority.' },
            'defect_resolution_time': { title: 'Defect Resolution Time', note: 'Average time to resolve.' },
            'automation_coverage': { title: 'Automation Coverage (%)', note: 'Automated vs total regression scope.' },
            'rtm': { title: 'Requirements Traceability Matrix (RTM)', note: 'Mapping of requirements → test cases.' },
          }
          const toKey = (s: string) => s.toLowerCase()
            .replace(/[^a-z0-9]+/g, ' ')
            .trim()
            .replace(/\s+/g, '_')
          const enhanced = metrics.map((m: any) => {
            const raw = toText(m)
            const k = toKey(raw)
            const normalized = normalizeMetric(m)
            // Try to match fuzzy keys
            if (k.includes('execution') && k.includes('rate')) return { ...known['execution_rate'], ...normalized, key: 'execution_rate' }
            if (k.includes('pass') && k.includes('rate')) return { ...known['pass_rate'], ...normalized, key: 'pass_rate' }
            if (k.includes('coverage') && (k.includes('test') || k.includes('automated') || k.includes('requirement') || k.includes('feature'))) return { ...known['coverage'], ...normalized, key: 'coverage' }
            if (k.includes('defect') && k.includes('density')) return { ...known['defect_density'], ...normalized, key: 'defect_density' }
            if (k.includes('defect') && (k.includes('severity') || k.includes('priority') || k.includes('distribution'))) return { ...known['defect_distribution'], ...normalized, key: 'defect_distribution' }
            if (k.includes('defect') && (k.includes('resolution') || k.includes('time'))) return { ...known['defect_resolution_time'], ...normalized, key: 'defect_resolution_time' }
            if (k.includes('automation') && k.includes('coverage')) return { ...known['automation_coverage'], ...normalized, key: 'automation_coverage' }
            if (k.includes('rtm') || (k.includes('requirements') && k.includes('traceability'))) return { ...known['rtm'], ...normalized, key: 'rtm' }
            return { ...normalized, key: k, title: raw }
          })
          return (
            <div>
              <h4 className="font-semibold text-sm text-indigo-600 dark:text-indigo-400 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Metrics
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {enhanced.map((m, i) => (
                  <div key={i} className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{m.title}</p>
                      {typeof m.value !== 'undefined' && (
                        <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                          {m.value}{m.unit ? ` ${m.unit}` : ''}
                        </span>
                      )}
                    </div>
                    {m.note && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{m.note}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })()}

        <List title="Communication Plan" items={comms} />
      </div>
    )
  }

  const renderApproval = (data: any) => {
    console.log('Approval & Sign-off Data:', JSON.stringify(data, null, 2))

    const approvers = ensureArray(data?.approvers || [])
    const process = ensureArray(data?.approval_process || data?.process || [])

    return (
      <div className="space-y-4">
        {process.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">Approval Process</h4>
            <ol className="list-decimal list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
              {process.map((step, i) => (
                <li key={i}>{toText(step)}</li>
              ))}
            </ol>
          </div>
        )}

        {approvers.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-teal-600 dark:text-teal-400 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Approvers
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {approvers.map((approver: any, i: number) => {
                const name = toText(approver.name ?? approver)
                const role = approver.role ? toText(approver.role) : undefined
                const authority = approver.authority ? toText(approver.authority) : undefined
                const responsibility = approver.responsibility ? toText(approver.responsibility) : undefined
                const required = approver.required === true || approver.mandatory === true
                return (
                  <div key={i} className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 p-4 rounded-lg border border-teal-200 dark:border-teal-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{name}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {[role, authority].filter(Boolean).join(' • ')}
                          </div>
                        </div>
                      </div>
                      {required && <Badge variant="secondary" className="text-xs">Required</Badge>}
                    </div>
                    {responsibility && (
                      <div className="mt-2 text-xs text-gray-700 dark:text-gray-300">
                        <strong>Responsibility:</strong> {responsibility}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {data.sign_off_criteria && data.sign_off_criteria.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">Sign-off Criteria</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
              {data.sign_off_criteria.map((criteria: any, i: number) => (
                <li key={i}>{toText(criteria)}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {!noPlan && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  {((normalizedPlan as any)?.human_id) || ((testPlan as any)?.numeric_id !== undefined ? (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 border border-blue-200 text-sm font-mono font-semibold">
                      {((normalizedPlan as any)?.human_id) || `TP-${String((testPlan as any)?.numeric_id || '').padStart(3, '0')}`}
                    </span>
                  ) : null)}
                  <span className="text-lg font-semibold text-gray-900">
                    {normalizedPlan?.name || testPlan?.name}
                  </span>
                </div>
                {/* Copy button */}
                <button
                  type="button"
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                  onClick={() => navigator.clipboard?.writeText((((normalizedPlan as any)?.human_id) || `TP-${String((testPlan as any)?.numeric_id || '').padStart(3, '0')}`) as string)}
                  title="Copy ID"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </button>

                {normalizedPlan?.generated_by === 'ai' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 ring-1 ring-purple-200">
                    <Sparkles className="w-3 h-3" />
                    AI Generated
                  </span>
                )}
                {typeof confidenceVal === 'number' && (
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ml-2 ${getConfidenceBadgeClasses(confidenceVal)}`}>
                    {confidenceVal}% confidence
                  </span>
                )}
              </DialogTitle>
              <DialogDescription>
                Created on {formatDateHumanReadable((normalizedPlan || testPlan).created_at)} by {toText((normalizedPlan || testPlan).created_by)}
              </DialogDescription>
            </DialogHeader>

          </>
        )}

        {noPlan ? null : (
          <div className="flex-1 pr-4 overflow-y-auto max-h-[60vh]">
            <div className="space-y-4 py-4">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {normalizedPlan?.priority && (
                  <Badge variant="outline" className="justify-center">Priority: {toText(testPlan.priority)}</Badge>
                )}
                {normalizedPlan?.complexity && (
                  <Badge variant="outline" className="justify-center">Complexity: {toText((testPlan as any).complexity)}</Badge>
                )}
                {normalizedPlan?.timeframe && (
                  <Badge variant="outline" className="justify-center">Timeframe: {toText((testPlan as any).timeframe)}</Badge>
                )}
                {typeof (normalizedPlan as any)?.estimated_hours !== 'undefined' && (
                  <Badge variant="outline" className="justify-center">Est. Hours: {toText((normalizedPlan as any).estimated_hours)}</Badge>
                )}
                {Array.isArray((normalizedPlan as any)?.platforms) && (
                  <Badge variant="outline" className="justify-center">Platforms: {(normalizedPlan as any).platforms.length}</Badge>
                )}
                {Array.isArray((normalizedPlan as any)?.features) && (
                  <Badge variant="outline" className="justify-center">Features: {(normalizedPlan as any).features.length}</Badge>
                )}
              </div>

              {/* Basic Information */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleSection('basic')}>
                  {expandedSections.has('basic') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <h3 className="font-semibold text-gray-900 dark:text-white">Basic Information</h3>
                </div>
                {expandedSections.has('basic') && (
                  <div className="pl-6 space-y-3">
                    {normalizedPlan?.description && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{normalizedPlan?.description}</p>
                      </div>
                    )}
                    {(() => {
                      const source = (normalizedPlan?.objectives && normalizedPlan.objectives.length > 0)
                        ? normalizedPlan.objectives
                        : basicObjectives
                      const items = (Array.isArray(source) ? source : [])
                        .map((o: any) => {
                          if (o == null) return ''
                          if (typeof o === 'string') return o
                          const candidate = o.objective ?? o.title ?? o.description ?? o.summary
                          return candidate != null ? String(candidate) : toText(o)
                        })
                        .map((s: any) => (s ?? '').toString().trim())
                        .filter((s: string) => s.length > 0)
                      if (items.length === 0) return null
                      return (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Objectives</h4>
                          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            {items.map((text: string, i: number) => (
                              <li key={i}>{text}</li>
                            ))}
                          </ul>
                        </div>
                      )
                    })()}
                    {normalizedPlan?.tags && normalizedPlan.tags.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                          {normalizedPlan.tags.map((tag: any, i: number) => {
                            const label = toText(tag)
                            const cls = getTagClasses(label)
                            return (
                              <span key={i} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cls.bg} ${cls.text} ring-1 ${cls.ring}`}>
                                <Tag className="w-3 h-3" />
                                {label}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 my-2" />

              {/* IEEE 829 Sections */}
              {sections.map((section) => (
                <div key={section.id} className="space-y-3">
                  <div
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors"
                    onClick={() => toggleSection(section.id)}
                  >
                    {expandedSections.has(section.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    <div className={section.color}>{section.icon}</div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{section.title}</h3>
                  </div>
                  {expandedSections.has(section.id) && (
                    <div className="pl-6">
                      {renderSectionContent(section.field)}
                    </div>
                  )}
                  <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
                </div>
              ))}
            </div>
          </div>

        )}

        {noPlan ? null : (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {!readOnly && (
              <Button className="bg-primary hover:bg-primary/90">
                Edit Test Plan
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
