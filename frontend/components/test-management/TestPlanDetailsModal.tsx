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
  TrendingUp
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
          {obj.success_criteria && obj.success_criteria.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Success Criteria:</p>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {obj.success_criteria.map((criteria: string, i: number) => (
                  <li key={i}>{criteria}</li>
                ))}
              </ul>
            </div>
          )}
          {obj.quality_goals && obj.quality_goals.length > 0 && (
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

  const renderAssumptionsConstraints = (data: any[]) => (
    <div className="space-y-3">
      {data.map((item: any, index: number) => (
        <div key={index} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-2 mb-2">
            <Badge variant={item.type === 'constraint' ? 'destructive' : 'secondary'} className="text-xs">
              {item.type}
            </Badge>
            <p className="font-medium text-sm text-gray-900 dark:text-white flex-1">{item.description}</p>
          </div>
          {item.impact && (
            <p className="text-xs text-gray-600 dark:text-gray-400"><strong>Impact:</strong> {item.impact}</p>
          )}
          {item.mitigation && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1"><strong>Mitigation:</strong> {item.mitigation}</p>
          )}
        </div>
      ))}
    </div>
  )

  const renderSchedule = (data: any) => (
    <div className="space-y-4">
      {data.phases && data.phases.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">Phases</h4>
          <div className="space-y-3">
            {data.phases.map((phase: any, i: number) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-semibold text-gray-900 dark:text-white">{phase.name}</h5>
                  {phase.duration && (
                    <Badge variant="outline" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {phase.duration}
                    </Badge>
                  )}
                </div>
                {phase.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{phase.description}</p>
                )}
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                  {phase.start_date && <div><strong>Start:</strong> {new Date(phase.start_date).toLocaleDateString()}</div>}
                  {phase.end_date && <div><strong>End:</strong> {new Date(phase.end_date).toLocaleDateString()}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {data.milestones && data.milestones.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">Milestones</h4>
          <div className="space-y-2">
            {data.milestones.map((milestone: any, i: number) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{milestone.name}</p>
                  {milestone.target_date && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">Target: {new Date(milestone.target_date).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderResources = (data: any[]) => (
    <div className="space-y-3">
      {data.map((resource: any, index: number) => (
        <div key={index} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-gray-900 dark:text-white">{resource.role}</h4>
            {resource.allocation && (
              <Badge variant="outline" className="text-xs">{resource.allocation}</Badge>
            )}
          </div>
          {resource.responsibilities && resource.responsibilities.length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Responsibilities:</p>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
                {resource.responsibilities.map((resp: string, i: number) => (
                  <li key={i}>{resp}</li>
                ))}
              </ul>
            </div>
          )}
          {resource.skills_required && resource.skills_required.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Skills Required:</p>
              <div className="flex flex-wrap gap-1">
                {resource.skills_required.map((skill: string, i: number) => (
                  <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )

  const renderEnvironment = (data: any) => (
    <div className="space-y-4">
      {data.environments && data.environments.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">Environments</h4>
          <div className="space-y-2">
            {data.environments.map((env: any, i: number) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 text-sm">
                <p className="font-medium text-gray-900 dark:text-white">{env.name}</p>
                {env.configuration && <p className="text-xs text-gray-600 dark:text-gray-400">{env.configuration}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
      {data.tools_and_frameworks && data.tools_and_frameworks.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">Tools</h4>
          <div className="flex flex-wrap gap-2">
            {data.tools_and_frameworks.map((tool: string, i: number) => (
              <Badge key={i} variant="secondary">{tool}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )

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

  const renderDeliverables = (data: any) => (
    <div className="space-y-4">
      {data.deliverables && data.deliverables.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">Deliverables</h4>
          <div className="space-y-2">
            {data.deliverables.map((deliverable: any, i: number) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900 dark:text-white">{deliverable.name}</p>
                    {deliverable.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{deliverable.description}</p>
                    )}
                  </div>
                  {deliverable.frequency && (
                    <Badge variant="outline" className="text-xs ml-2">{deliverable.frequency}</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {data.metrics && data.metrics.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">Metrics</h4>
          <div className="flex flex-wrap gap-2">
            {data.metrics.map((metric: any, i: number) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {typeof metric === 'string' ? metric : metric.metric}
                {metric.target && ` (${metric.target})`}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderApproval = (data: any) => (
    <div className="space-y-4">
      {data.approvers && data.approvers.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">Approvers</h4>
          <div className="space-y-2">
            {data.approvers.map((approver: any, i: number) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-900 dark:text-white">{approver.role}</span>
                </div>
                {approver.responsibility && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{approver.responsibility}</p>
                )}
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
