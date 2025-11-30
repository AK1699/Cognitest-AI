import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  pageSize: number
  totalItems?: number
  currentItemsCount?: number  // Number of items on current page
  onPageChange: (page: number) => void
  itemsName?: string
}

export function Pagination({
  currentPage,
  pageSize,
  totalItems,
  currentItemsCount,
  onPageChange,
  itemsName = 'items'
}: PaginationProps) {
  const totalPages = totalItems ? Math.ceil(totalItems / pageSize) : 0
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = totalItems ? Math.min(currentPage * pageSize, totalItems) : currentPage * pageSize

  const canGoPrevious = currentPage > 1
  
  // Determine if we can go to next page
  let canGoNext = false
  if (totalItems !== undefined) {
    // If we have total count, use it
    canGoNext = currentPage < totalPages
  } else if (currentItemsCount !== undefined) {
    // If we have current items count, check if page is full
    // If page is full (has exactly pageSize items), there might be more
    canGoNext = currentItemsCount >= pageSize
  } else {
    // Fallback: assume there might be more
    canGoNext = true
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      {/* Info */}
      <div className="flex-1 flex justify-start">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {totalItems !== undefined ? (
            <>
              Showing <span className="font-medium">{startItem}</span> to{' '}
              <span className="font-medium">{endItem}</span> of{' '}
              <span className="font-medium">{totalItems}</span> {itemsName}
            </>
          ) : (
            <>
              Page <span className="font-medium">{currentPage}</span> ({pageSize} {itemsName} per page)
            </>
          )}
        </p>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-2">
        {/* First Page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={!canGoPrevious}
          className="relative inline-flex items-center px-2 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          title="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>

        {/* Previous Page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrevious}
          className="relative inline-flex items-center px-2 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Page Numbers */}
        <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
          Page <span className="font-medium">{currentPage}</span>
          {totalPages > 0 && (
            <>
              {' '}of <span className="font-medium">{totalPages}</span>
            </>
          )}
        </span>

        {/* Next Page */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          className="relative inline-flex items-center px-2 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Last Page */}
        {totalPages > 0 && (
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={!canGoNext}
            className="relative inline-flex items-center px-2 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
