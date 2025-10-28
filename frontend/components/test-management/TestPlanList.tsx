'use client'

import { TestPlan } from '@/lib/api/test-plans'
import TestPlanCard from './TestPlanCard'
import { Grid3X3, List } from 'lucide-react'
import { useState } from 'react'

interface TestPlanListProps {
  testPlans: TestPlan[]
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onRefresh?: () => void
}

export default function TestPlanList({
  testPlans,
  onView,
  onEdit,
  onDelete,
  onRefresh
}: TestPlanListProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  if (testPlans.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 mx-auto mb-4 opacity-50">
          <svg viewBox="0 0 200 200" className="w-full h-full text-gray-300">
            <circle cx="100" cy="60" r="40" fill="currentColor" opacity="0.1" />
            <rect x="60" y="120" width="80" height="60" rx="4" fill="currentColor" opacity="0.2" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No test plans found</h3>
        <p className="text-gray-500">Try adjusting your search or create a new test plan</p>
      </div>
    )
  }

  return (
    <div>
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600">
          {testPlans.length} {testPlans.length === 1 ? 'test plan' : 'test plans'}
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'grid'
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            title="Grid view"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'list'
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            title="List view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Test Plans Grid/List */}
      <div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
        {testPlans.map((testPlan) => (
          <TestPlanCard
            key={testPlan.id}
            testPlan={testPlan}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  )
}
