'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Image from 'next/image'
import { useAuth } from '@/lib/auth-context'

interface GoogleSignInButtonProps {
  onSuccess?: (userData: any) => void
  onError?: (error: any) => void
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export function GoogleSignInButton({
  onSuccess,
  onError
}: GoogleSignInButtonProps) {
  const router = useRouter()
  const { checkAuth } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    try {
      setIsLoading(true)

      // Get authorization URL from backend
      const response = await fetch(`${API_URL}/api/v1/auth/google/authorize`)

      if (!response.ok) {
        throw new Error('Failed to get authorization URL')
      }

      const { authorization_url } = await response.json()

      // Redirect to Google OAuth
      window.location.href = authorization_url
    } catch (error: any) {
      console.error('Error initiating Google Sign-In:', error)
      toast.error('Failed to initiate Google Sign-In')
      onError?.(error)
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 disabled:opacity-50"
    >
      <Image src="/google-logo.svg" alt="Google" width={20} height={20} className="mr-2" />
      {isLoading ? 'Signing in...' : 'Continue with Google'}
    </button>
  )
}
