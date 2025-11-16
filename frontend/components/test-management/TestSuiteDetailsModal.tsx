'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Folder, Tag, Calendar, User, FileText, ChevronRight, ChevronDown, Sparkles } from 'lucide-react'
import { TestSuite, TestCase, testCasesAPI } from '@/lib/api/test-management'
import { formatDateHumanReadable } from '@/lib/date-utils'

interface TestSuiteDetailsModalProps {
  testSuite: TestSuite | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onViewTestCase?: (testCase: TestCase) => void
  readOnly?: boolean
}

export function TestSuiteDetailsModal({
  testSuite,
  open,
  onOpenChange,
  onViewTestCase,
  readOnly = true
}: TestSuiteDetailsModalProps) {
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedCases, setExpandedCases] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (testSuite && open) {
      loadTestCases()
    }
  }, [testSuite, open])

  const loadTestCases = async () => {
    if (!testSuite) return

    try {
      setLoading(true)
      setError(null)
      console.log('[TestSuiteDetailsModal] Loading test cases for suite:', testSuite.id, 'project:', testSuite.project_id)
      const cases = await testCasesAPI.list(testSuite.project_id, testSuite.id)
      console.log('[TestSuiteDetailsModal] Loaded test cases:', cases?.length || 0, cases)
      setTestCases(cases || [])
      if (!cases || cases.length === 0) {
        console.warn('[TestSuiteDetailsModal] No test cases found for this suite')
      }
    } catch (error: any) {
      console.error('[TestSuiteDetailsModal] Failed to load test cases:', error)
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to load test cases'
      setError(errorMessage)
      setTestCases([])
    } finally {
      setLoading(false)
    }
  }

  const toggleCase = (caseId: string) => {
    const newExpanded = new Set(expandedCases)
    if (newExpanded.has(caseId)) {
      newExpanded.delete(caseId)
    } else {
      newExpanded.add(caseId)
    }
    setExpandedCases(newExpanded)
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

  if (!testSuite) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-primary" />
            {testSuite.name}
          </DialogTitle>
          <DialogDescription>
            Created on {formatDateHumanReadable(testSuite.created_at)} by {testSuite.created_by}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 pr-4 overflow-y-auto max-h-[60vh]">
          <div className="space-y-6 py-4">
            {/* Description */}
            {testSuite.description && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {testSuite.description}
                </p>
              </div>
            )}

            {/* Tags */}
            {testSuite.tags && testSuite.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Tags
                </h4>
                <div className="flex flex-wrap gap-2">
                  {testSuite.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 dark:border-gray-700 my-4" />

            {/* Test Cases */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Test Cases ({testCases.length})
                </h4>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-sm text-gray-500">Loading test cases...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                  <FileText className="w-12 h-12 text-red-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">Error loading test cases</p>
                  <p className="text-xs text-red-600 dark:text-red-500">{error}</p>
                  <button
                    onClick={loadTestCases}
                    className="mt-3 px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : testCases.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No test cases in this suite</p>
                  <p className="text-xs text-gray-400 mt-1">Check the browser console for details</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {testCases.map((testCase) => (
                    <div
                      key={testCase.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-sm transition-shadow"
                    >
                      {/* Test Case Header */}
                      <div
                        className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => toggleCase(testCase.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="mt-1">
                              {expandedCases.has(testCase.id) ? (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h5 className="font-medium text-gray-900 dark:text-white">
                                  {testCase.title}
                                </h5>
                                {testCase.ai_generated && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    AI
                                  </Badge>
                                )}
                              </div>
                              {testCase.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                                  {testCase.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                <span>{testCase.steps?.length || 0} steps</span>
                                <span className={`px-2 py-0.5 rounded ${getPriorityColor(testCase.priority)}`}>
                                  {testCase.priority}
                                </span>
                                {testCase.status && (
                                  <span className="capitalize">{testCase.status}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Test Case Expanded Content */}
                      {expandedCases.has(testCase.id) && (
                        <div className="px-4 pb-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                          {/* Description */}
                          {testCase.description && (
                            <div className="mb-4 pt-4">
                              <h6 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Description
                              </h6>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {testCase.description}
                              </p>
                            </div>
                          )}

                          {/* Test Steps */}
                          {testCase.steps && testCase.steps.length > 0 && (
                            <div className="mb-4">
                              <h6 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Test Steps
                              </h6>
                              <div className="space-y-2">
                                {testCase.steps.map((step, index) => (
                                  <div
                                    key={index}
                                    className="bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700"
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center flex-shrink-0">
                                        {step.step_number}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-900 dark:text-white mb-1">
                                          <strong>Action:</strong> {step.action}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                          <strong>Expected:</strong> {step.expected_result}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Expected Result */}
                          {testCase.expected_result && (
                            <div className="mb-4">
                              <h6 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Overall Expected Result
                              </h6>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {testCase.expected_result}
                              </p>
                            </div>
                          )}

                          {/* Tags */}
                          {testCase.tags && testCase.tags.length > 0 && (
                            <div>
                              <h6 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Tags
                              </h6>
                              <div className="flex flex-wrap gap-1">
                                {testCase.tags.map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* View Full Details Button */}
                          {onViewTestCase && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onViewTestCase(testCase)
                                }}
                                className="w-full"
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                View Full Details
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Created By:
                  </span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {testSuite.created_by}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Created:
                  </span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDateHumanReadable(testSuite.created_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {!readOnly && (
            <Button className="bg-primary hover:bg-primary/90">
              Edit Test Suite
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
