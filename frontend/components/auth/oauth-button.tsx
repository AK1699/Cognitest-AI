'use client'

import React, { useState } from 'react'
import { toast } from 'sonner'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface OAuthButtonProps {
  provider: 'google' | 'microsoft' | 'apple'
  onClick: () => Promise<void>
  isLoading?: boolean
  disabled?: boolean
  variant?: 'default' | 'outline' | 'minimal'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function OAuthButton({
  provider,
  onClick,
  isLoading = false,
  disabled = false,
  variant = 'default',
  size = 'md',
  className
}: OAuthButtonProps) {
  const [loading, setLoading] = useState(false)

  const providerConfig = {
    google: {
      label: 'Google',
      icon: '/google-logo.svg',
      color: 'text-gray-700 dark:text-gray-200',
      bgHover: 'hover:bg-gray-50 dark:hover:bg-gray-600',
    },
    microsoft: {
      label: 'Microsoft',
      icon: '/microsoft-logo.svg',
      color: 'text-gray-700 dark:text-gray-200',
      bgHover: 'hover:bg-gray-50 dark:hover:bg-gray-600',
    },
    apple: {
      label: 'Apple',
      icon: '/apple-logo.svg',
      color: 'text-gray-700 dark:text-gray-200',
      bgHover: 'hover:bg-gray-50 dark:hover:bg-gray-600',
    }
  }

  const config = providerConfig[provider]

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  const variantClasses = {
    default: `border border-gray-300 rounded-md shadow-sm font-medium bg-white dark:bg-gray-700 dark:border-gray-600 ${config.bgHover} dark:hover:bg-gray-600`,
    outline: `border border-gray-300 dark:border-gray-600 rounded-md shadow-sm font-medium bg-transparent ${config.bgHover}`,
    minimal: `font-medium rounded-md ${config.bgHover} transition-colors`
  }

  const handleClick = async () => {
    try {
      setLoading(true)
      await onClick()
    } catch (error: any) {
      console.error(`${provider} sign-in error:`, error)
      toast.error(error.message || `Failed to sign in with ${config.label}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading || loading || disabled}
      className={cn(
        'w-full flex items-center justify-center gap-2',
        sizeClasses[size],
        variantClasses[variant],
        config.color,
        disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        'transition-all duration-200',
        className
      )}
    >
      <Image
        src={config.icon}
        alt={config.label}
        width={size === 'sm' ? 16 : size === 'md' ? 20 : 24}
        height={size === 'sm' ? 16 : size === 'md' ? 20 : 24}
      />
      <span>
        {loading || isLoading ? `Signing in...` : `Continue with ${config.label}`}
      </span>
    </button>
  )
}
