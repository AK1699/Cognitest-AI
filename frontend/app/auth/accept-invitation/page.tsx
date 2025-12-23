'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { acceptInvitation } from '@/lib/api/invitations'
import { toast } from 'sonner'
import { Eye, EyeOff, Mail, User, Lock, CheckCircle, Shield, Building2 } from 'lucide-react'
import Logo from '@/components/ui/Logo'
import api from '@/lib/api'

interface InvitationDetails {
  email: string
  full_name: string | null
  organisation_name: string | null
  role_name: string | null
  role_type: string | null
  expires_at: string | null
}

function AcceptInvitationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    full_name: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null)
  const [verifying, setVerifying] = useState(true)
  const [verifyError, setVerifyError] = useState<string | null>(null)

  // Fetch invitation details on mount
  useEffect(() => {
    if (!token) {
      setVerifyError('Invalid invitation link')
      setVerifying(false)
      return
    }

    const fetchInvitation = async () => {
      try {
        const response = await api.get(`/api/v1/invitations/verify-token?token=${token}`)
        setInvitation(response.data)
        // Pre-fill full name if available
        if (response.data.full_name) {
          setFormData(prev => ({ ...prev, full_name: response.data.full_name }))
        }
      } catch (error: any) {
        console.error('Failed to verify invitation:', error)
        setVerifyError(error.response?.data?.detail || 'Invalid or expired invitation')
      } finally {
        setVerifying(false)
      }
    }

    fetchInvitation()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      toast.error('Invalid invitation token')
      return
    }

    if (!formData.username || !formData.password) {
      toast.error('Please fill in all required fields')
      return
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      await acceptInvitation(token, {
        username: formData.username,
        password: formData.password,
        full_name: formData.full_name || undefined
      })

      toast.success('🎉 Account created successfully! Please sign in.')
      router.push('/auth/signin')
    } catch (error: any) {
      console.error('Failed to accept invitation:', error)
      toast.error(error.response?.data?.detail || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  // Show loading state while verifying
  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Show error if verification failed
  if (verifyError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">😔</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invitation Error</h1>
          <p className="text-gray-600 mb-6">{verifyError}</p>
          <Button onClick={() => router.push('/auth/signin')}>Go to Sign In</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo variant="dark" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🎉 Welcome to CogniTest!
            </h1>
            <p className="text-gray-600">
              Complete your account setup to get started
            </p>
          </div>

          {/* Invitation Details Box */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">Invitation Verified</p>

                {/* Organisation */}
                {invitation?.organisation_name && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-green-700">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Organization: <strong>{invitation.organisation_name}</strong></span>
                  </div>
                )}

                {/* Email */}
                {invitation?.email && (
                  <div className="flex items-center gap-2 mt-1 text-xs text-green-700">
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email: <strong>{invitation.email}</strong></span>
                  </div>
                )}

                {/* Role - Read Only */}
                {invitation?.role_name && (
                  <div className="flex items-center gap-2 mt-1 text-xs text-green-700">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Role: <strong>{invitation.role_name}</strong></span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Choose a username"
                  required
                  minLength={3}
                  maxLength={50}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                3-50 characters, letters, numbers, and underscores
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name (Optional)
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Create a strong password"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Minimum 8 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Confirm your password"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full py-6 text-base font-semibold"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account & Get Started'}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <a href="/auth/signin" className="text-primary font-medium hover:underline">
                Sign in
              </a>
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-white/60 backdrop-blur-sm rounded-lg p-4 text-center">
          <p className="text-xs text-gray-600">
            By creating an account, you agree to CogniTest's Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <AcceptInvitationContent />
    </Suspense>
  )
}
