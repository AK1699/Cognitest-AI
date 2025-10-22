'use client'

import { useState } from 'react'
import { Upload, X } from 'lucide-react'
import Image from 'next/image'
import { LogoCropperModal } from './logo-cropper-modal'

interface LogoSettingsProps {
  logo: string | null
  organisationName: string
  onLogoChange: (logoUrl: string | null) => Promise<void>
  isSaving: boolean
}

export function LogoSettings({ logo, organisationName, onLogoChange, isSaving }: LogoSettingsProps) {
  const [logoUrl, setLogoUrl] = useState(logo || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCropper, setShowCropper] = useState(false)
  const [tempImageUrl, setTempImageUrl] = useState('')
  const [error, setError] = useState('')

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoUrl(e.target.value)
    setError('')
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    // Read file and convert to base64
    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      setTempImageUrl(result)
      setShowCropper(true)
      setError('')
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onLogoChange(logoUrl || null)
    } catch (error) {
      console.error('Failed to update logo:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemove = async () => {
    setIsSubmitting(true)
    try {
      await onLogoChange(null)
      setLogoUrl('')
    } catch (error) {
      console.error('Failed to remove logo:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCropComplete = (croppedImage: string) => {
    setLogoUrl(croppedImage)
    setShowCropper(false)
    setTempImageUrl('')
  }

  const handleUrlCrop = () => {
    if (logoUrl && logoUrl.startsWith('http')) {
      setTempImageUrl(logoUrl)
      setShowCropper(true)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Organization Logo
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Upload a logo to represent your organization across the platform
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Logo Preview
            </label>
            <p className="text-gray-600 dark:text-gray-400 text-xs mb-4">
              The logo of your organization. We'll use this in the UI and in emails we send.
            </p>
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                {logoUrl ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={logoUrl}
                      alt="Organization logo"
                      fill
                      className="object-contain p-2"
                      onError={() => setError('Failed to load image')}
                    />
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center mx-auto mb-2">
                      <span className="text-sm font-semibold text-white">
                        {organisationName.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      No logo yet
                    </p>
                  </div>
                )}
              </div>

              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl('')}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  title="Clear logo"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Upload Methods */}
          <div className="space-y-4">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload Logo
              </label>
              <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors bg-gray-50 dark:bg-gray-700">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm font-medium">Click to upload or drag and drop</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isSaving || isSubmitting}
                />
              </label>
            </div>

            {/* URL Input */}
            <div>
              <label htmlFor="logo-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Or paste a logo URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  id="logo-url"
                  value={logoUrl}
                  onChange={handleUrlChange}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                  placeholder="https://example.com/logo.png"
                />
                {logoUrl && logoUrl.startsWith('http') && (
                  <button
                    type="button"
                    onClick={handleUrlCrop}
                    className="px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
                  >
                    Crop
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            {logoUrl && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={isSaving || isSubmitting}
                className="px-4 py-2.5 border border-red-300 dark:border-red-700 bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Remove Logo
              </button>
            )}
            <button
              type="submit"
              disabled={isSaving || isSubmitting || !logoUrl}
              className="px-6 py-2.5 bg-primary hover:opacity-90 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting || isSaving ? 'Saving...' : 'Save Logo'}
            </button>
          </div>
        </form>
      </div>

      {/* Logo Cropper Modal */}
      {showCropper && tempImageUrl && (
        <LogoCropperModal
          imageUrl={tempImageUrl}
          onCrop={handleCropComplete}
          onClose={() => {
            setShowCropper(false)
            setTempImageUrl('')
          }}
        />
      )}
    </div>
  )
}
