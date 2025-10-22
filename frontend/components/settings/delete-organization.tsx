'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'

interface DeleteOrganizationProps {
  organisationName: string
  onDelete: () => Promise<void>
}

export function DeleteOrganization({ organisationName, onDelete }: DeleteOrganizationProps) {
  const [isConfirming, setIsConfirming] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (confirmText !== organisationName) {
      return
    }

    setIsDeleting(true)
    try {
      await onDelete()
    } catch (error) {
      console.error('Failed to delete organisation:', error)
      setIsDeleting(false)
    }
  }

  const isConfirmValid = confirmText === organisationName

  return (
    <div className="bg-gradient-to-br from-red-50 to-red-50/50 dark:from-red-950/20 dark:to-red-950/10 border-2 border-red-200 dark:border-red-900 rounded-xl p-8 overflow-hidden relative">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-red-100 dark:bg-red-900/10 rounded-full blur-3xl opacity-50 -mr-20 -mt-20" />

      <div className="flex gap-4 relative z-10">
        <div className="flex-shrink-0">
          <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
            Danger Zone
          </h2>
          <p className="text-red-700 dark:text-red-300 text-sm mb-4 leading-relaxed">
            Deleting an organization requires that all of its projects be transferred or deleted first. This is done to avoid deleting any build data unexpectedly.
          </p>

          {!isConfirming ? (
            <button
              onClick={() => setIsConfirming(true)}
              className="inline-flex items-center px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              Delete organization
            </button>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                This action cannot be undone. Please type the organization name to confirm.
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={organisationName}
                className="w-full px-4 py-2.5 rounded-lg border border-red-300 dark:border-red-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsConfirming(false)
                    setConfirmText('')
                  }}
                  disabled={isDeleting}
                  className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={!isConfirmValid || isDeleting}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? 'Deleting...' : 'Delete organization'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
