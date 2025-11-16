'use client'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Tag, Calendar, User, CheckCircle2, Sparkles, Clock } from 'lucide-react'
import { TestCase } from '@/lib/api/test-management'
import { formatDateHumanReadable } from '@/lib/date-utils'

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {testCase.title}
          </DialogTitle>
          <DialogDescription>
            Created on {formatDateHumanReadable(testCase.created_at)} by {testCase.created_by}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 pr-4 overflow-y-auto max-h-[60vh]">
          <div className="space-y-6 py-4">
            {/* Badges Section */}
            <div className="flex flex-wrap gap-2">
              <Badge className={getPriorityColor(testCase.priority)}>
                {testCase.priority.toUpperCase()}
              </Badge>
              {testCase.status && (
                <Badge className={getStatusColor(testCase.status)}>
                  {testCase.status.replace('_', ' ').toUpperCase()}
                </Badge>
              )}
              {testCase.ai_generated && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Generated
                </Badge>
              )}
              {testCase.generated_by && (
                <Badge variant="outline">
                  Generated: {testCase.generated_by}
                </Badge>
              )}
            </div>

            {/* Description */}
            {testCase.description && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {testCase.description}
                </p>
              </div>
            )}

            <div className="border-t border-gray-200 dark:border-gray-700 my-4" />

            {/* Test Steps */}
            {testCase.steps && testCase.steps.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Test Steps ({testCase.steps.length})
                </h4>
                <div className="space-y-3">
                  {testCase.steps.map((step, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary text-white text-sm font-semibold flex items-center justify-center flex-shrink-0">
                          {step.step_number}
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                              ACTION
                            </p>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {step.action}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                              EXPECTED RESULT
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
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
              <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-lg border-2 border-green-200 dark:border-green-800">
                <h4 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Overall Expected Result
                </h4>
                <p className="text-sm text-green-700 dark:text-green-400">
                  {testCase.expected_result}
                </p>
              </div>
            )}

            {/* Actual Result (if execution has occurred) */}
            {testCase.actual_result && (
              <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
                  Actual Result
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  {testCase.actual_result}
                </p>
              </div>
            )}

            {/* Tags */}
            {testCase.tags && testCase.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Tags
                </h4>
                <div className="flex flex-wrap gap-2">
                  {testCase.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
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
