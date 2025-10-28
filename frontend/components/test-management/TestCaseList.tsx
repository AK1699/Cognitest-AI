'use client'

import { TestCase } from '@/lib/api/test-plans'
import TestCaseCard from './TestCaseCard'
import { Grid3X3, List } from 'lucide-react'
import { useState } from 'react'

interface TestCaseListProps {
  testCases: TestCase[]
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onRefresh?: () => void
}

export default function TestCaseList({
  testCases,
  onView,
  onEdit,
  onDelete,
  onRefresh
}: TestCaseListProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  if (testCases.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 mx-auto mb-4 opacity-50">
          <svg viewBox="0 0 200 200" className="w-full h-full text-gray-300">
            <rect x="40" y="30" width="120" height="140" rx="8" fill="currentColor" opacity="0.2" />
            <rect x="60" y="60" width="80" height="6" rx="3" fill="currentColor" opacity="0.3" />
            <rect x="60" y="80" width="80" height="6" rx="3" fill="currentColor" opacity="0.3" />
            <rect x="60" y="100" width="60" height="6" rx="3" fill="currentColor" opacity="0.3" />
            <rect x="60" y="120" width="70" height="6" rx="3" fill="currentColor" opacity="0.3" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No test cases found</h3>
        <p className="text-gray-500">Try adjusting your search or create a new test case</p>
      </div>
    )
  }

  return (
    <div>
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600">
          {testCases.length} {testCases.length === 1 ? 'test case' : 'test cases'}
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

      {/* Test Cases Grid/List */}
      <div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
        {testCases.map((testCase) => (
          <TestCaseCard
            key={testCase.id}
            testCase={testCase}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  )
}
