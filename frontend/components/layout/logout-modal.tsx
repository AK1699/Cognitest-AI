'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useTheme } from 'next-themes'
import { Building2, Plus, LogOut, Sun, Moon, User } from 'lucide-react'

interface Organisation {
  id: string
  name: string
}

interface LogoutModalProps {
  isOpen: boolean
  onClose: () => void
  organisation: Organisation | null
}

export function LogoutModal({ isOpen, onClose, organisation }: LogoutModalProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  if (!isOpen || !user) return null

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
    } finally {
      setIsLoggingOut(false)
      onClose()
    }
  }

  const handleAddOrganisation = () => {
    onClose()
    router.push('/organisations/new')
  }

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Logout
          </h3>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* User Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-1 text-sm font-medium text-gray-500 dark:text-gray-400">
              <User className="w-4 h-4" />
              <span>User:</span>
            </div>
            <div className="pl-5 space-y-1">
              <p className="font-semibold text-gray-900 dark:text-white">
                {user.full_name || user.username}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {user.email}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Role: QA Engineer
              </p>
            </div>
          </div>

          {/* Organisation Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-1 text-sm font-medium text-gray-500 dark:text-gray-400">
              <Building2 className="w-4 h-4" />
              <span>Organisation:</span>
            </div>
            {organisation ? (
              <div className="pl-5">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {organisation.name}
                </p>
              </div>
            ) : (
              <div className="pl-5">
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  No organisation selected
                </p>
              </div>
            )}
          </div>

          {/* Add Organisation Button */}
          <button
            onClick={handleAddOrganisation}
            className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary dark:hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300 font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Add Organisation</span>
          </button>

          {/* Confirmation Message */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-center text-gray-700 dark:text-gray-300">
              Are you sure you want to logout
              {organisation && (
                <span className="font-medium"> from {organisation.name}</span>
              )}?
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoggingOut}
            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
