'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import axios from 'axios'
import { Check, Unlink, Plus } from 'lucide-react'
import { useConfirm } from '@/lib/hooks/use-confirm'

interface LinkedAccount {
  provider: string
  email: string
  name?: string
  linkedAt: string
}

interface OAuthAccountLinkingProps {
  userId: string
  onLinkSuccess?: (provider: string) => void
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export function OAuthAccountLinking({ userId, onLinkSuccess }: OAuthAccountLinkingProps) {
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([])
  const [loading, setLoading] = useState(false)
  const [unlinkingProvider, setUnlinkingProvider] = useState<string | null>(null)
  const { confirm, ConfirmDialog } = useConfirm()

  useEffect(() => {
    fetchLinkedAccounts()
  }, [userId])

  const fetchLinkedAccounts = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/api/v1/auth/linked-accounts`, {
        withCredentials: true,
      })
      setLinkedAccounts(response.data)
    } catch (error) {
      console.error('Failed to fetch linked accounts:', error)
      // Silently fail - feature might not be available yet
    } finally {
      setLoading(false)
    }
  }

  const handleLinkAccount = async (provider: string) => {
    try {
      // Get authorization URL
      const response = await axios.get(
        `${API_URL}/api/v1/auth/${provider}/authorize`
      )
      const { authorization_url } = response.data

      // Store intent to link account
      sessionStorage.setItem('oauth_linking_intent', provider)

      // Redirect to OAuth provider
      window.location.href = authorization_url
    } catch (error) {
      console.error(`Failed to link ${provider} account:`, error)
      toast.error(`Failed to link ${provider} account`)
    }
  }

  const handleUnlinkAccount = async (provider: string) => {
    const confirmed = await confirm({
      message: `Are you sure you want to unlink your ${provider} account?`,
      variant: 'warning',
      confirmText: 'Unlink Account'
    })
    if (!confirmed) {
      return
    }

    try {
      setUnlinkingProvider(provider)
      await axios.post(
        `${API_URL}/api/v1/auth/unlink-account`,
        { provider },
        { withCredentials: true }
      )

      toast.success(`${provider} account unlinked successfully`)
      await fetchLinkedAccounts()
    } catch (error) {
      console.error(`Failed to unlink ${provider} account:`, error)
      toast.error(`Failed to unlink ${provider} account`)
    } finally {
      setUnlinkingProvider(null)
    }
  }

  const providers = ['google', 'microsoft', 'apple']
  const availableProviders = providers.filter(
    (p) => !linkedAccounts.some((acc) => acc.provider === p)
  )

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Connected Accounts
        </h3>

        {/* Linked Accounts */}
        {linkedAccounts.length > 0 ? (
          <div className="space-y-3">
            {linkedAccounts.map((account) => (
              <div
                key={account.provider}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white capitalize">
                      {account.provider}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {account.email}
                    </p>
                    {account.name && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {account.name}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleUnlinkAccount(account.provider)}
                  disabled={unlinkingProvider === account.provider}
                  className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors disabled:opacity-50"
                >
                  <Unlink className="h-4 w-4" />
                  <span className="text-sm">Unlink</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No connected accounts yet
          </p>
        )}
      </div>

      {/* Link New Account */}
      {availableProviders.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Link Additional Account
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableProviders.map((provider) => (
              <button
                key={provider}
                onClick={() => handleLinkAccount(provider)}
                className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm capitalize">Link {provider}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog />
    </div>
  )
}
