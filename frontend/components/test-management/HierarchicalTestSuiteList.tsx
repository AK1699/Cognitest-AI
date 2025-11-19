'use client'

import { TestSuite, TestCase } from '@/lib/api/test-management'
import { ChevronDown, ChevronRight, FolderOpen, FileText, Clock, AlertCircle, CheckCircle2, Trash2, MoreVertical } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useConfirm } from '@/lib/hooks/use-confirm'

interface HierarchicalTestSuiteListProps {
  testSuites: TestSuite[]
  testCases: TestCase[]
  onViewSuite?: (id: string) => void
  onViewCase?: (id: string) => void
  onDeleteSuite?: (id: string) => void
  onDeleteCase?: (id: string) => void
}

export default function HierarchicalTestSuiteList({
  testSuites,
  testCases,
  onViewSuite,
  onViewCase,
  onDeleteSuite,
  onDeleteCase
}: HierarchicalTestSuiteListProps) {
  const [expandedSuites, setExpandedSuites] = useState<Set<string>>(new Set())
  const [expandedCases, setExpandedCases] = useState<Set<string>>(new Set())
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const { confirm, ConfirmDialog } = useConfirm()

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null)
      }
    }

    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openMenuId])

  const toggleSuite = (suiteId: string) => {
    const newExpanded = new Set(expandedSuites)
    if (newExpanded.has(suiteId)) {
      newExpanded.delete(suiteId)
    } else {
      newExpanded.add(suiteId)
    }
    setExpandedSuites(newExpanded)
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

  const getCasesForSuite = (suiteId: string) => {
    return testCases.filter(tc => tc.test_suite_id === suiteId)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600 bg-red-50'
      case 'high':
        return 'text-orange-600 bg-orange-50'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50'
      case 'low':
        return 'text-green-600 bg-green-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  if (testSuites.length === 0) {
    return (
      <div className="text-center py-16">
        <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No test suites found</h3>
        <p className="text-gray-500">Create a test suite to organize your test cases</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {testSuites.map((suite) => {
        const suiteCases = getCasesForSuite(suite.id)
        const isExpanded = expandedSuites.has(suite.id)

        return (
          <div key={suite.id} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Test Suite Header */}
            <div
              className="bg-white hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => toggleSuite(suite.id)}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Expand/Collapse Icon */}
                  <button className="mt-0.5 text-gray-400 hover:text-gray-600">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </button>

                  {/* Suite Icon */}
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <FolderOpen className="w-5 h-5 text-blue-600" />
                  </div>

                  {/* Suite Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900 mb-1">
                          {suite.name}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {suite.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded text-xs font-mono font-semibold">
                          TS-{suite.id.slice(0, 2).toUpperCase()}
                        </span>

                        {/* Delete Button */}
                        {onDeleteSuite && (
                          <div className="relative" ref={openMenuId === suite.id ? menuRef : null}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setOpenMenuId(openMenuId === suite.id ? null : suite.id)
                              }}
                              className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                              title="More options"
                            >
                              <MoreVertical className="w-4 h-4 text-gray-500" />
                            </button>

                            {openMenuId === suite.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation()
                                    const confirmed = await confirm({
                                      message: `Are you sure you want to delete "${suite.name}"? This will also delete all ${getCasesForSuite(suite.id).length} test cases in this suite.`,
                                      variant: 'danger',
                                      confirmText: 'Delete'
                                    })
                                    if (confirmed) {
                                      onDeleteSuite(suite.id)
                                    }
                                    setOpenMenuId(null)
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete Suite
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Suite Meta */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                      <span className="inline-flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {suiteCases.length} test cases
                      </span>
                      {suite.tags && suite.tags.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          {suite.tags.slice(0, 2).map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Nested Test Cases */}
            {isExpanded && suiteCases.length > 0 && (
              <div className="bg-gray-50 border-t border-gray-200">
                {suiteCases.map((testCase, index) => {
                  const isCaseExpanded = expandedCases.has(testCase.id)

                  return (
                    <div
                      key={testCase.id}
                      className={`${
                        index !== 0 ? 'border-t border-gray-200' : ''
                      } bg-white relative`}
                    >
                      {/* Hierarchy Line */}
                      <div className="absolute left-8 top-0 bottom-0 w-px bg-gray-300" />
                      <div className="absolute left-8 top-8 w-8 h-px bg-gray-300" />

                      {/* Test Case Row */}
                      <div
                        className="p-4 pl-16 hover:bg-gray-50 transition-colors cursor-pointer relative"
                        onClick={() => toggleCase(testCase.id)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Expand/Collapse Icon */}
                          <button className="mt-0.5 text-gray-400 hover:text-gray-600">
                            {isCaseExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>

                          {/* Test Case Icon */}
                          <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-green-600" />
                          </div>

                          {/* Test Case Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-gray-900 mb-1">
                                  {testCase.title}
                                </h4>
                                <p className="text-xs text-gray-500 line-clamp-1">
                                  {testCase.description}
                                </p>
                              </div>
                              <span className="ml-4 px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-mono">
                                TC-{testCase.id.slice(0, 2).toUpperCase()}
                              </span>
                            </div>

                            {/* Test Case Meta */}
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className={`px-2 py-0.5 rounded font-medium ${getPriorityColor(testCase.priority)}`}>
                                {testCase.priority}
                              </span>
                              {testCase.tags && testCase.tags.slice(0, 2).map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                              {testCase.steps && testCase.steps.length > 0 && (
                                <span className="inline-flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  {testCase.steps.length} steps
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Test Case Details */}
                      {isCaseExpanded && (
                        <div className="bg-gray-50 border-t border-gray-200 p-6 pl-20">
                          {/* Description */}
                          {testCase.description && (
                            <div className="mb-6">
                              <p className="text-sm text-gray-700 leading-relaxed">
                                {testCase.description}
                              </p>
                            </div>
                          )}

                          {/* Test Steps */}
                          {testCase.steps && testCase.steps.length > 0 && (
                            <div className="mb-6">
                              <h5 className="text-sm font-semibold text-blue-700 mb-4 flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Test Steps ({testCase.steps.length})
                              </h5>
                              <div className="space-y-3">
                                {testCase.steps.map((step, stepIdx) => (
                                  <div
                                    key={stepIdx}
                                    className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200 shadow-sm"
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-300 text-blue-700 text-sm font-semibold flex items-center justify-center flex-shrink-0">
                                        {step.step_number}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-gray-500 mb-1">
                                          Step {step.step_number}
                                        </p>
                                        <p className="text-sm text-gray-900 mb-2">
                                          {step.action}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                          <span className="font-semibold">Expected Result:</span>{' '}
                                          <span className="text-gray-700">{step.expected_result}</span>
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Overall Expected Result */}
                          {testCase.expected_result && (
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200 mb-6">
                              <h5 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" />
                                Overall Expected Result
                              </h5>
                              <p className="text-sm text-gray-800 leading-relaxed">
                                {testCase.expected_result}
                              </p>
                            </div>
                          )}

                          {/* Bottom Metadata Bar */}
                          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                            <div className="grid grid-cols-4 gap-6 text-sm">
                              <div>
                                <span className="text-gray-500 block mb-1">Priority:</span>
                                <span className={`inline-block px-2 py-0.5 rounded font-semibold ${
                                  testCase.priority === 'critical' ? 'bg-red-100 text-red-700' :
                                  testCase.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                  testCase.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {testCase.priority.toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 block mb-1">Category:</span>
                                <span className="text-gray-900 font-medium">
                                  {testCase.tags?.[0] || 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 block mb-1">Duration:</span>
                                <span className="text-gray-900 font-medium">
                                  {testCase.steps && testCase.steps.length > 0 ? `${testCase.steps.length * 4}m` : 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 block mb-1">Created:</span>
                                <span className="text-gray-900">
                                  {new Date(testCase.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Empty state if suite is expanded but has no cases */}
            {isExpanded && suiteCases.length === 0 && (
              <div className="bg-gray-50 border-t border-gray-200 p-8 text-center">
                <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No test cases in this suite</p>
              </div>
            )}
          </div>
        )
      })}
      <ConfirmDialog />
    </div>
  )
}
