'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Tag, Calendar, User, CheckCircle2, Sparkles, Clock, Zap, Link2, Play, History, ExternalLink } from 'lucide-react'
import { TestCase } from '@/lib/api/test-management'
import { formatDateHumanReadable } from '@/lib/date-utils'
import { useToast } from '@/hooks/use-toast'
import { useRouter, usePathname } from 'next/navigation'

interface TestCaseDetailsModalProps {
  testCase: TestCase | null
  open: boolean
  onOpenChange: (open: boolean) => void
  readOnly?: boolean
}

export function TestCaseDetailsModal({
  testCase,
  open,
  onOpenChange,
  readOnly = true
}: TestCaseDetailsModalProps) {
  const { toast } = useToast()
  const router = useRouter()
  const pathname = usePathname()
  const [automationScript, setAutomationScript] = useState<any>(null)
  const [loadingAutomation, setLoadingAutomation] = useState(false)
  const [executingTest, setExecutingTest] = useState(false)

  // Extract orgId and projectId from pathname
  const pathParts = pathname?.split('/') || []
  const orgIndex = pathParts.indexOf('organizations')
  const projectIndex = pathParts.indexOf('projects')
  const orgId = orgIndex >= 0 ? pathParts[orgIndex + 1] : ''
  const projectId = projectIndex >= 0 ? pathParts[projectIndex + 1] : ''

  useEffect(() => {
    const testCaseAny = testCase as any
    if (testCaseAny?.automation_enabled && testCaseAny?.automation_script_id) {
      fetchAutomationScript()
    } else {
      setAutomationScript(null)
    }
  }, [testCase?.id])

  const fetchAutomationScript = async () => {
    if (!testCase?.id) return

    setLoadingAutomation(true)
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/v1/automation/test-cases/${testCase.id}/automation`)
      // const data = await response.json()
      // setAutomationScript(data)

      // Mock data for now
      setAutomationScript(null)
    } catch (error) {
      console.error('Failed to fetch automation script:', error)
    } finally {
      setLoadingAutomation(false)
    }
  }

  const handleExecuteAutomation = async () => {
    if (!testCase?.id) return

    setExecutingTest(true)
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/v1/automation/test-cases/${testCase.id}/execute`, {
      //   method: 'POST',
      //   body: JSON.stringify({ test_data: {}, execution_environment: {} })
      // })
      // const data = await response.json()

      toast.success('Test execution started. You will be notified when it completes.')
    } catch (error) {
      console.error('Failed to execute test:', error)
      toast.error('Failed to start automated test execution')
    } finally {
      setExecutingTest(false)
    }
  }

  const handleLinkAutomation = () => {
    if (orgId && projectId) {
      router.push(`/organizations/${orgId}/projects/${projectId}/automation-hub/web-automation?linkTestCase=${testCase?.id}`)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'high':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'low':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'failed':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'blocked':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'ready':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
      case 'skipped':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
      case 'draft':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  if (!testCase) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] bg-gradient-to-br from-blue-50 via-white to-indigo-50 border-gray-300 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="pb-4 border-b border-gray-200">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-lg bg-green-100 border border-green-300 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 flex-1">
                {testCase.title}
              </h2>
            </div>
            {testCase.human_id && (
              <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-mono font-semibold border border-blue-300 ml-4">
                {testCase.human_id}
              </span>
            )}
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`${
              testCase.priority === 'critical' ? 'bg-red-500' :
              testCase.priority === 'high' ? 'bg-orange-500' :
              testCase.priority === 'medium' ? 'bg-yellow-500' :
              'bg-green-500'
            } text-white border-0 font-semibold uppercase px-3 py-1`}>
              {testCase.priority}
            </Badge>
            {testCase.tags && testCase.tags[0] && (
              <Badge className="bg-gray-100 text-gray-700 border-gray-300 px-3 py-1">
                {testCase.tags[0]}
              </Badge>
            )}
            {testCase.generated_by === 'ai' && (
              <Badge className="bg-purple-100 text-purple-700 border-purple-300 px-3 py-1">
                AI-Generated
              </Badge>
            )}
          </div>
        </div>

        <div className="flex-1 pr-4 overflow-y-auto max-h-[60vh]">
          <div className="space-y-6 py-4">
            {/* Description */}
            {testCase.description && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {testCase.description}
                </p>
              </div>
            )}

            {/* Test Steps */}
            {testCase.steps && testCase.steps.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Test Steps ({testCase.steps.length})
                </h4>
                <div className="space-y-3">
                  {testCase.steps.map((step, index) => (
                    <div
                      key={index}
                      className="bg-white p-4 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-300 text-blue-700 text-sm font-semibold flex items-center justify-center flex-shrink-0">
                          {step.step_number}
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-1">
                              Step {step.step_number}
                            </p>
                            <p className="text-sm text-gray-900">
                              {step.action}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-1">
                              Expected Result:
                            </p>
                            <p className="text-sm text-gray-700">
                              {step.expected_result}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Overall Expected Result */}
            {testCase.expected_result && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Overall Expected Result
                </h4>
                <p className="text-sm text-gray-700">
                  {testCase.expected_result}
                </p>
              </div>
            )}

            {/* Bottom Metadata Bar */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mt-6">
              <div className="grid grid-cols-4 gap-6 text-sm">
                <div>
                  <span className="text-gray-500">Priority:</span>
                  <span className={`ml-2 px-2 py-0.5 rounded font-semibold ${
                    testCase.priority === 'critical' ? 'bg-red-100 text-red-700' :
                    testCase.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                    testCase.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {testCase.priority.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Category:</span>
                  <span className="ml-2 text-gray-900">
                    {testCase.tags && testCase.tags[0] ? testCase.tags[0] : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Duration:</span>
                  <span className="ml-2 text-gray-900">
                    {testCase.steps && testCase.steps.length > 0 ? `${testCase.steps.length * 4}m` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Created:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(testCase.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Automation Section */}
            {(testCase as any).automation_enabled && (
              <div className="bg-blue-500/10 p-5 rounded-lg border border-blue-500/30 mt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      Automation
                      {(testCase as any).automation_enabled && (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                          Enabled
                        </Badge>
                      )}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {(testCase as any).automation_enabled
                        ? 'This test case is linked to an automation script'
                        : 'Link this test case to an automation script for automated execution'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {(testCase as any).automation_enabled && automationScript ? (
                <div className="space-y-3">
                  {/* Linked Script Info */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-100 dark:border-blue-900">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h5 className="font-semibold text-gray-900 dark:text-white text-sm">
                          {automationScript.name}
                        </h5>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {automationScript.description}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {automationScript.script_type}
                      </Badge>
                    </div>

                    {/* Script Stats */}
                    <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Executions</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {automationScript.total_executions || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Success Rate</p>
                        <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                          {automationScript.total_executions > 0
                            ? Math.round((automationScript.successful_executions / automationScript.total_executions) * 100)
                            : 0}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Avg Duration</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {automationScript.average_duration || 0}s
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleExecuteAutomation}
                      disabled={executingTest}
                      className="flex-1 bg-blue-500 hover:bg-blue-600"
                    >
                      {executingTest ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Executing...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Run Automated Test
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => orgId && projectId && router.push(`/organizations/${orgId}/projects/${projectId}/automation-hub/web-automation`)}
                      disabled={!orgId || !projectId}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Script
                    </Button>
                  </div>

                  {/* Recent Executions Link */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full text-xs"
                    onClick={() => {}}
                  >
                    <History className="w-3 h-3 mr-2" />
                    View Execution History
                  </Button>
                </div>
              ) : (testCase as any).automation_enabled ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Loading automation script...
                  </p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    No automation script linked to this test case yet
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleLinkAutomation}
                    className="border-blue-300 hover:bg-blue-50 dark:border-blue-700 dark:hover:bg-blue-900/20"
                  >
                    <Link2 className="w-4 h-4 mr-2" />
                    Link Automation Script
                  </Button>
                </div>
              )}
            </div>
            )}

            <div className="border-t border-gray-200 dark:border-gray-700 my-4" />

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1">
                  <User className="w-3 h-3" />
                  Created By
                </span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {testCase.created_by}
                </p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1">
                  <Calendar className="w-3 h-3" />
                  Created At
                </span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatDateHumanReadable(testCase.created_at)}
                </p>
              </div>
              {testCase.updated_at && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1">
                    <Calendar className="w-3 h-3" />
                    Updated At
                  </span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDateHumanReadable(testCase.updated_at)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {!readOnly && (
            <Button className="bg-primary hover:bg-primary/90">
              Edit Test Case
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
