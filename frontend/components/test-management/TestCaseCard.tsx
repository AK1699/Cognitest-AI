'use client'

import { TestCase } from '@/lib/api/test-plans'
import { Calendar, MoreVertical, User, Tag, FileText, Link as LinkIcon, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { formatDateHumanReadable } from '@/lib/date-utils'
import { useState, useRef, useEffect } from 'react'
import { useConfirm } from '@/lib/hooks/use-confirm'

interface TestCaseCardProps {
  testCase: TestCase
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

export default function TestCaseCard({
  testCase,
  onView,
  onEdit,
  onDelete
}: TestCaseCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [isStepsExpanded, setIsStepsExpanded] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { confirm, ConfirmDialog } = useConfirm()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])


  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-700'
      case 'high':
        return 'bg-orange-100 text-orange-700'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700'
      case 'low':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-700'
      case 'draft':
        return 'bg-gray-100 text-gray-700'
      case 'in_review':
        return 'bg-blue-100 text-blue-700'
      case 'deprecated':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-gray-300 transition-all relative">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div
          className="flex-1 cursor-pointer"
          onClick={() => setIsStepsExpanded(!isStepsExpanded)}
        >
          <div className="flex items-center gap-2 mb-2">
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              {isStepsExpanded ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </button>
            <h3 className="text-base font-bold text-gray-900 line-clamp-1 flex-1">
              {testCase.title}
            </h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {testCase.test_suite_id && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-medium border border-blue-200">
                <LinkIcon className="w-3 h-3" />
                Linked
              </span>
            )}
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border ${
              testCase.priority === 'critical' ? 'bg-red-50 text-red-600 border-red-200' :
              testCase.priority === 'high' ? 'bg-orange-50 text-orange-600 border-orange-200' :
              testCase.priority === 'medium' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
              'bg-green-50 text-green-600 border-green-200'
            }`}>
              <AlertCircle className="w-3 h-3" />
              {testCase.priority}
            </span>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${
              testCase.status === 'draft' ? 'bg-gray-50 text-gray-600 border-gray-200' :
              'bg-green-50 text-green-600 border-green-200'
            }`}>
              {testCase.status ? testCase.status.replace('_', ' ') : 'draft'}
            </span>
          </div>
        </div>

        {/* Actions Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-gray-500" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-10">
              {onView && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onView(testCase.id)
                    setShowMenu(false)
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium"
                >
                  View Details
                </button>
              )}
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(testCase.id)
                    setShowMenu(false)
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 transition-colors font-medium"
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={async (e) => {
                    e.stopPropagation()
                    const confirmed = await confirm({
                      message: 'Are you sure you want to delete this test case?',
                      variant: 'danger',
                      confirmText: 'Delete'
                    })
                    if (confirmed) {
                      onDelete(testCase.id)
                    }
                    setShowMenu(false)
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors font-medium border-t border-gray-100"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {testCase.description && (
        <div className="mb-4 p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100">
          <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">
            {testCase.description}
          </p>
        </div>
      )}

      {/* Test Steps - Only show when expanded */}
      {isStepsExpanded && testCase.steps && testCase.steps.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-blue-100 rounded">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <span className="text-xs font-semibold text-blue-900">
              Test Steps ({testCase.steps.length})
            </span>
          </div>

          <div className="space-y-2">
            {testCase.steps.map((step, index) => (
              <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 text-xs font-bold">
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

            {/* Overall Expected Result */}
            {testCase.expected_result && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200 mt-3">
                <h5 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Overall Expected Result
                </h5>
                <p className="text-sm text-gray-800 leading-relaxed">
                  {testCase.expected_result}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tags */}
      {testCase.tags && testCase.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {testCase.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 rounded-md text-xs font-medium border border-purple-200"
            >
              <Tag className="w-3 h-3" />
              {tag}
            </span>
          ))}
          {testCase.tags.length > 3 && (
            <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium border border-gray-200">
              +{testCase.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="pt-4 mt-2 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-gray-500">
            <div className="p-1 bg-gray-100 rounded">
              <Calendar className="w-3 h-3" />
            </div>
            <span className="font-medium">{formatDateHumanReadable(testCase.created_at)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-500">
            <div className="p-1 bg-gray-100 rounded">
              <User className="w-3 h-3" />
            </div>
            <span className="truncate max-w-[120px] font-medium">{testCase.created_by}</span>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog />
    </div>
  )
}
