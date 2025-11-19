'use client'

import { useState } from 'react'
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

  // Helper function to safely ensure data is an array
  const ensureArray = (data: any): any[] => {
    if (!data) return []
    if (Array.isArray(data)) return data
    return []
  }

  if (!testPlan) return null

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

  const renderSectionContent = (field: keyof TestPlan) => {
    const data = testPlan[field] as any

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
            {data.in_scope.map((item: string, i: number) => (
              <li key={i}>{item}</li>
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
            {data.out_of_scope.map((item: string, i: number) => (
              <li key={i}>{item}</li>
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
            {data.tools_and_frameworks.map((tool: string, i: number) => (
              <Badge key={i} variant="secondary">{tool}</Badge>
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
      <div className="space-y-3">
        {displayResources.map((resource: any, index: number) => {
          // Handle both string format and object format
          const isString = typeof resource === 'string'
          const roleName = isString ? resource : (resource.role || `Resource ${index + 1}`)
          const allocation = !isString && resource.allocation
          const responsibilities = !isString && ensureArray(resource.responsibilities || [])
          const skills = !isString && ensureArray(resource.skills_required || [])

          return (
            <div key={index} className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{roleName}</h4>
                </div>
                {allocation && (
                  <Badge variant="outline" className="text-xs">{allocation}</Badge>
                )}
              </div>
              {!isString && responsibilities.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Key Responsibilities ({responsibilities.length})
                  </p>
                  <ul className="list-disc list-inside text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                    {responsibilities.map((resp: string, i: number) => (
                      <li key={i}>{resp}</li>
                    ))}
                  </ul>
                </div>
              )}
              {!isString && skills.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Skills:</p>
                  <div className="flex flex-wrap gap-1">
                    {skills.map((skill: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}
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
                {hardware.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
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
                {software.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
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
                {network.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
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
                {testData.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
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
                {access.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
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

    const metrics = ensureArray(data?.metrics || [])

    return (
      <div className="space-y-4">
        {/* Metrics */}
        {metrics.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-indigo-600 dark:text-indigo-400 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Metrics
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {metrics.map((metric: string, i: number) => (
                <div key={i} className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{metric}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderApproval = (data: any) => {
    console.log('Approval & Sign-off Data:', JSON.stringify(data, null, 2))

    const approvers = ensureArray(data?.approvers || [])

    return (
      <div className="space-y-4">
        {/* Approvers */}
        {approvers.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-teal-600 dark:text-teal-400 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Approvers
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {approvers.map((approver: string, i: number) => (
                <div key={i} className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 p-4 rounded-lg border border-teal-200 dark:border-teal-800">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span className="font-medium text-gray-900 dark:text-white">{approver}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      {data.sign_off_criteria && data.sign_off_criteria.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">Sign-off Criteria</h4>
          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
            {data.sign_off_criteria.map((criteria: string, i: number) => (
              <li key={i}>{criteria}</li>
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
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {testPlan.name}
            {testPlan.generated_by === 'ai' && (
              <Badge variant="secondary" className="ml-2">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Generated
              </Badge>
            )}
            {testPlan.confidence_score && (
              <Badge variant="outline" className="ml-2">
                {testPlan.confidence_score}% confidence
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Created on {formatDateHumanReadable(testPlan.created_at)} by {testPlan.created_by}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 pr-4 overflow-y-auto max-h-[60vh]">
          <div className="space-y-4 py-4">
            {/* Basic Information */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleSection('basic')}>
                {expandedSections.has('basic') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <h3 className="font-semibold text-gray-900 dark:text-white">Basic Information</h3>
              </div>
              {expandedSections.has('basic') && (
                <div className="pl-6 space-y-3">
                  {testPlan.description && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{testPlan.description}</p>
                    </div>
                  )}
                  {testPlan.objectives && testPlan.objectives.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Objectives</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {testPlan.objectives.map((obj, i) => (
                          <li key={i}>{obj}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {testPlan.tags && testPlan.tags.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {testPlan.tags.map((tag, i) => (
                          <Badge key={i} variant="secondary">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
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
      </DialogContent>
    </Dialog>
  )
}
