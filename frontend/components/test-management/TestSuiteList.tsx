'use client'

import { TestSuite } from '@/lib/api/test-management'
import TestSuiteCard from './TestSuiteCard'
import { Grid3X3, List } from 'lucide-react'
import { useState } from 'react'

interface TestSuiteListProps {
  testSuites: TestSuite[]
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onRefresh?: () => void
}

export default function TestSuiteList({
  testSuites,
  onView,
  onEdit,
  onDelete,
  onRefresh
}: TestSuiteListProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  if (testSuites.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 mx-auto mb-4 opacity-50">
          <svg viewBox="0 0 200 200" className="w-full h-full text-gray-300">
            <rect x="50" y="40" width="100" height="120" rx="8" fill="currentColor" opacity="0.2" />
            <rect x="70" y="70" width="60" height="4" rx="2" fill="currentColor" opacity="0.3" />
            <rect x="70" y="85" width="60" height="4" rx="2" fill="currentColor" opacity="0.3" />
            <rect x="70" y="100" width="40" height="4" rx="2" fill="currentColor" opacity="0.3" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No test suites found</h3>
        <p className="text-gray-500">Try adjusting your search or create a new test suite</p>
      </div>
    )
  }

  return (
    <div>
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600">
          {testSuites.length} {testSuites.length === 1 ? 'test suite' : 'test suites'}
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

      {/* Test Suites Grid/List */}
      <div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
        {testSuites.map((testSuite) => (
          <TestSuiteCard
            key={testSuite.id}
            testSuite={testSuite}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  )
}
