'use client'

import { TestCase } from '@/lib/api/test-plans'
import { Calendar, MoreVertical, User, Tag, FileText, Link as LinkIcon, AlertCircle } from 'lucide-react'
import { formatDateHumanReadable } from '@/lib/date-utils'
import { useState, useRef, useEffect } from 'react'

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
  const menuRef = useRef<HTMLDivElement>(null)

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
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow relative">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
              {testCase.title}
            </h3>
            {testCase.test_suite_id && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                <LinkIcon className="w-3 h-3" />
                Linked
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(testCase.priority)}`}>
              <AlertCircle className="w-3 h-3" />
              {testCase.priority}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(testCase.status)}`}>
              {testCase.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Actions Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-gray-500" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              {onView && (
                <button
                  onClick={() => {
                    onView(testCase.id)
                    setShowMenu(false)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  View Details
                </button>
              )}
              {onEdit && (
                <button
                  onClick={() => {
                    onEdit(testCase.id)
                    setShowMenu(false)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this test case?')) {
                      onDelete(testCase.id)
                    }
                    setShowMenu(false)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
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
        <div className="mb-4">
          <p className="text-sm text-gray-600 line-clamp-2">
            {testCase.description}
          </p>
        </div>
      )}

      {/* Steps Preview */}
      {testCase.steps && testCase.steps.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-gray-600" />
            <span className="text-xs font-medium text-gray-700">
              {testCase.steps.length} {testCase.steps.length === 1 ? 'Step' : 'Steps'}
            </span>
          </div>
          <ol className="space-y-1 text-xs text-gray-600">
            {testCase.steps.slice(0, 2).map((step, index) => (
              <li key={index} className="line-clamp-1">
                {step.step_number}. {step.action}
              </li>
            ))}
            {testCase.steps.length > 2 && (
              <li className="text-gray-500 italic">
                +{testCase.steps.length - 2} more steps...
              </li>
            )}
          </ol>
        </div>
      )}

      {/* Tags */}
      {testCase.tags && testCase.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {testCase.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
            >
              <Tag className="w-3 h-3" />
              {tag}
            </span>
          ))}
          {testCase.tags.length > 3 && (
            <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">
              +{testCase.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDateHumanReadable(testCase.created_at)}</span>
          </div>
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span className="truncate max-w-[120px]">{testCase.created_by}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
