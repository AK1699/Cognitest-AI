'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'
import { OAuthButton } from './oauth-button'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface MicrosoftSignInButtonProps {
  onSuccess?: (userData: any) => void
  onError?: (error: any) => void
  variant?: 'default' | 'outline' | 'minimal'
  size?: 'sm' | 'md' | 'lg'
}

declare global {
  interface Window {
    msal?: any
  }
}

export function MicrosoftSignInButton({
  onSuccess,
  onError,
  variant = 'default',
  size = 'md'
}: MicrosoftSignInButtonProps) {
  const router = useRouter()
  const { checkAuth } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    try {
      setIsLoading(true)

      // Get authorization URL from backend
      const response = await fetch(`${API_URL}/api/v1/auth/microsoft/authorize`)
      const { authorization_url } = await response.json()

      // Redirect to Microsoft authorization
      window.location.href = authorization_url
    } catch (error: any) {
      console.error('Error initiating Microsoft Sign-In:', error)
      toast.error('Failed to initiate Microsoft Sign-In')
      onError?.(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <OAuthButton
      provider="microsoft"
      onClick={handleClick}
      isLoading={isLoading}
      variant={variant}
      size={size}
    />
  )
}
