'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Image from 'next/image'
import {
  getGoogleClientId,
  handleGoogleSignIn
} from '@/lib/google-oauth'
import { useAuth } from '@/lib/auth-context'

interface GoogleSignInButtonProps {
  onSuccess?: (userData: any) => void
  onError?: (error: any) => void
}

declare global {
  interface Window {
    google?: any
  }
}

export function GoogleSignInButton({
  onSuccess,
  onError
}: GoogleSignInButtonProps) {
  const router = useRouter()
  const { checkAuth } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Load Google script in background
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      // Script loaded, initialize will happen on button click
    }
    document.head.appendChild(script)
  }, [])

  const handleClick = async () => {
    try {
      setIsLoading(true)

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

      // Get client ID from backend
      const response = await fetch(`${API_URL}/api/v1/auth/google/client-id`)
      const { client_id } = await response.json()

      if (!window.google) {
        // If Google library not loaded yet, try loading it
        await new Promise((resolve) => {
          const checkGoogle = setInterval(() => {
            if (window.google) {
              clearInterval(checkGoogle)
              resolve(true)
            }
          }, 100)

          // Timeout after 5 seconds
          setTimeout(() => {
            clearInterval(checkGoogle)
            resolve(false)
          }, 5000)
        })
      }

      if (!window.google) {
        throw new Error('Google Sign-In library not available')
      }

      // Initialize and show the one-tap UI
      window.google.accounts.id.initialize({
        client_id: client_id,
        callback: handleCredentialResponse,
        ux_mode: 'popup',
        auto_select: false
      })

      // Show the one-tap prompt or sign-in flow
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // If one-tap is not displayed, manually trigger sign-in
          window.google.accounts.id.renderButton(
            document.createElement('div'),
            { type: 'icon', size: 'large' }
          )
        }
      })
    } catch (error: any) {
      console.error('Error initiating Google Sign-In:', error)
      toast.error('Failed to initiate Google Sign-In')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCredentialResponse = async (response: any) => {
    try {
      setIsLoading(true)

      if (!response.credential) {
        throw new Error('No credential received from Google')
      }

      // Sign in with Google
      const result = await handleGoogleSignIn(response.credential)

      toast.success(result.message || 'Successfully signed in with Google!')

      // Call success callback
      onSuccess?.(result.user)

      // Update auth context
      await checkAuth()

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Google sign-in error:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Google sign-in failed'
      toast.error(errorMessage)
      onError?.(error)
    } finally {
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
