'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Copy, Check, Calendar, Globe, Key } from 'lucide-react'

interface Organisation {
  id: string
  name: string
  website?: string
  description?: string
  owner_id: string
  created_at: string
  updated_at?: string
}

interface GeneralSettingsProps {
  organisation: Organisation
  onUpdate: (data: Partial<Organisation>) => Promise<void>
  isSaving: boolean
}

export function GeneralSettings({ organisation, onUpdate, isSaving }: GeneralSettingsProps) {
  const [formData, setFormData] = useState({
    name: organisation.name,
    website: organisation.website || '',
  })
  const [copied, setCopied] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onUpdate({
        name: formData.name,
        website: formData.website || undefined,
      })
    } catch (error) {
      console.error('Failed to update organisation:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(organisation.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Created Date Card */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-xl border border-primary/30 dark:border-primary/40 shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/20 dark:bg-primary/30 rounded-lg">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Organization Created
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              The date your organization joined Cognitest
            </p>
            <p className="text-lg font-bold text-primary">
              {format(new Date(organisation.created_at), 'MMMM d, yyyy')}
            </p>
          </div>
        </div>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            General Settings
          </h2>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Organization Name */}
            <div className="group">
              <div className="flex items-center gap-2 mb-2">
                <label htmlFor="name" className="block text-sm font-semibold text-gray-900 dark:text-white">
                  Organization Name
                </label>
                <span className="px-2.5 py-0.5 text-xs font-medium bg-primary/20 dark:bg-primary/30 text-primary rounded-full">
                  Required
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                The name of your company or team that appears throughout Cognitest
              </p>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none shadow-sm hover:border-gray-400 dark:hover:border-gray-500"
                placeholder="Acme Corp"
              />
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700" />

            {/* Organization Website */}
            <div className="group">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <label htmlFor="website" className="block text-sm font-semibold text-gray-900 dark:text-white">
                    Organization Website
                  </label>
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Optional
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Your organization's public website URL. We'll use this to validate your organization
              </p>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none shadow-sm hover:border-gray-400 dark:hover:border-gray-500"
                placeholder="https://example.com"
              />
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700" />

            {/* Organization ID */}
            <div className="group">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                    Organization ID
                  </label>
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Read-only
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Unique identifier for your organization. Share this with support for faster assistance
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm font-mono tracking-wider">
                  {organisation.id}
                </div>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 transition-all shadow-sm hover:shadow-md"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
              {copied && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-medium">
                  ✓ Copied to clipboard
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-start pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                disabled={isSaving || isSubmitting}
                className="px-8 py-3 bg-primary hover:opacity-90 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-sm"
              >
                {isSubmitting || isSaving ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving Changes...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
