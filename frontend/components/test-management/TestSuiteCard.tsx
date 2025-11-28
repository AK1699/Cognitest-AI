'use client'

import { TestSuite } from '@/lib/api/test-plans'
import { Calendar, MoreVertical, User, Tag, FileText, Link as LinkIcon, Copy } from 'lucide-react'
import { formatDateHumanReadable } from '@/lib/date-utils'
import { useState, useRef, useEffect } from 'react'
import { useConfirm } from '@/lib/hooks/use-confirm'

interface TestSuiteCardProps {
  testSuite: TestSuite
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

export default function TestSuiteCard({
  testSuite,
  onView,
  onEdit,
  onDelete
}: TestSuiteCardProps) {
  const [showMenu, setShowMenu] = useState(false)
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


  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow relative">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
              {testSuite.name}
            </h3>
            {((testSuite as any)?.human_id || (testSuite as any)?.numeric_id) && (
              <div className="flex items-center gap-1">
                <span className="inline-flex items-center px-2 py-0.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded text-xs font-mono font-semibold shadow-sm">
                  {(testSuite as any)?.human_id || `TS-${String((testSuite as any)?.numeric_id || '').padStart(3, '0')}`}
                </span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigator.clipboard?.writeText((testSuite as any)?.human_id || `TS-${String((testSuite as any)?.numeric_id || '').padStart(3, '0')}`)
                  }}
                  title="Copy ID"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            )}
            {testSuite.test_plan_id && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                <LinkIcon className="w-3 h-3" />
                Linked
              </span>
            )}
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
                    onView(testSuite.id)
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
                    onEdit(testSuite.id)
                    setShowMenu(false)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={async () => {
                    const confirmed = await confirm({
                      message: 'Are you sure you want to delete this test suite?',
                      variant: 'danger',
                      confirmText: 'Delete'
                    })
                    if (confirmed) {
                      onDelete(testSuite.id)
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
      {testSuite.description && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 line-clamp-2">
            {testSuite.description}
          </p>
        </div>
      )}

      {/* Tags */}
      {testSuite.tags && testSuite.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {testSuite.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
            >
              <Tag className="w-3 h-3" />
              {tag}
            </span>
          ))}
          {testSuite.tags.length > 3 && (
            <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">
              +{testSuite.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDateHumanReadable(testSuite.created_at)}</span>
          </div>
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span className="truncate max-w-[120px]">{testSuite.created_by}</span>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog />
    </div>
  )
}
