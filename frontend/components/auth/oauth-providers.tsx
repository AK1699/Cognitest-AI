'use client'

import { GoogleSignInButton } from './google-signin-button'
import { MicrosoftSignInButton } from './microsoft-signin-button'
import { AppleSignInButton } from './apple-signin-button'

interface OAuthProvidersProps {
  onSuccess?: (provider: string, userData: any) => void
  onError?: (error: any) => void
  variant?: 'default' | 'outline' | 'minimal'
  size?: 'sm' | 'md' | 'lg'
  showLabels?: boolean
}

export function OAuthProviders({
  onSuccess,
  onError,
  variant = 'default',
  size = 'md',
  showLabels = true
}: OAuthProvidersProps) {
  return (
    <div className="space-y-3">
      {showLabels && (
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Sign in with your account
        </p>
      )}
      <div className="grid grid-cols-3 gap-3">
        <GoogleSignInButton
          variant={variant}
          size={size}
          onSuccess={(data) => onSuccess?.('google', data)}
          onError={onError}
        />
        <MicrosoftSignInButton
          variant={variant}
          size={size}
          onSuccess={(data) => onSuccess?.('microsoft', data)}
          onError={onError}
        />
        <AppleSignInButton
          variant={variant}
          size={size}
          onSuccess={(data) => onSuccess?.('apple', data)}
          onError={onError}
        />
      </div>
    </div>
  )
}

// Full-width variant
export function OAuthProvidersFullWidth({
  onSuccess,
  onError,
  variant = 'default',
  size = 'md'
}: OAuthProvidersProps) {
  return (
    <div className="space-y-3">
      <GoogleSignInButton
        variant={variant}
        size={size}
        onSuccess={(data) => onSuccess?.('google', data)}
        onError={onError}
      />
      <MicrosoftSignInButton
        variant={variant}
        size={size}
        onSuccess={(data) => onSuccess?.('microsoft', data)}
        onError={onError}
      />
      <AppleSignInButton
        variant={variant}
        size={size}
        onSuccess={(data) => onSuccess?.('apple', data)}
        onError={onError}
      />
    </div>
  )
}
