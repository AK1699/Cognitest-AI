'use client'

import { TestPlan } from '@/lib/api/test-plans'
import { Sparkles, User, Clock, Eye, Edit, Copy, FileCheck, Trash2, AlertCircle } from 'lucide-react'
import { formatDateHumanReadable } from '@/lib/date-utils'
import { useState } from 'react'
import { useConfirm } from '@/lib/hooks/use-confirm'

interface TestPlanCardProps {
  testPlan: TestPlan
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

export default function TestPlanCard({ testPlan, onView, onEdit, onDelete }: TestPlanCardProps) {
  const { confirm, ConfirmDialog } = useConfirm()

  const getPriorityColor = (priority?: string) => {
    if (!priority) return 'bg-gray-600'
    switch (priority.toLowerCase()) {
      case 'critical':
        return 'bg-red-600'
      case 'high':
        return 'bg-orange-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'low':
        return 'bg-green-500'
      default:
        return 'bg-gray-600'
    }
  }

  const handleCopy = () => {
    // TODO: Implement copy functionality
    console.log('Copy test plan:', testPlan.id)
  }

  const handleQAReview = () => {
    // TODO: Implement QA review functionality
    console.log('QA Review:', testPlan.id)
  }


  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white relative">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
            {testPlan.name}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Generation Type Badge */}
            {testPlan.generated_by === 'ai' ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                <Sparkles className="w-3 h-3" />
                AI Generated
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                <User className="w-3 h-3" />
                Manual
              </span>
            )}

            {/* Priority Badge */}
            {testPlan.priority && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                testPlan.priority === 'critical' ? 'bg-red-100 text-red-700' :
                testPlan.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                testPlan.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {testPlan.priority.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {testPlan.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {testPlan.description}
        </p>
      )}

      {/* Objectives */}
      {testPlan.objectives && testPlan.objectives.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-medium text-gray-500 mb-2">
            Objectives ({testPlan.objectives.length})
          </div>
          <div className="space-y-1">
            {testPlan.objectives.slice(0, 3).map((objective, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <span className="text-sm text-gray-700 line-clamp-1">{objective}</span>
              </div>
            ))}
            {testPlan.objectives.length > 3 && (
              <div className="text-xs text-gray-500 ml-3.5">
                +{testPlan.objectives.length - 3} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tags */}
      {testPlan.tags && testPlan.tags.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {testPlan.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium"
            >
              {tag}
            </span>
          ))}
          {testPlan.tags.length > 3 && (
            <span className="text-xs text-gray-500">
              +{testPlan.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{formatDateHumanReadable(testPlan.created_at)}</span>
        </div>
        <div className="flex items-center gap-1">
          <User className="w-3 h-3" />
          <span className="truncate max-w-[150px]">{testPlan.created_by}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
        {onView && (
          <button
            onClick={() => onView(testPlan.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors text-sm font-medium"
          >
            <Eye className="w-4 h-4" />
            View
          </button>
        )}
        {onEdit && (
          <button
            onClick={() => onEdit(testPlan.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-yellow-600 hover:bg-yellow-50 rounded transition-colors text-sm font-medium"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
        )}
        {onDelete && (
          <button
            onClick={async () => {
              const confirmed = await confirm({
                message: 'Are you sure you want to delete this test plan? This action cannot be undone.',
                variant: 'danger',
                confirmText: 'Delete Test Plan'
              })
              if (confirmed) {
                onDelete(testPlan.id)
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded transition-colors text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        )}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog />
    </div>
  )
}
