'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'
import Logo from '@/components/ui/Logo'
import { GoogleSignInButton } from '@/components/auth/google-signin-button'
import { MicrosoftSignInButton } from '@/components/auth/microsoft-signin-button'
import { AppleSignInButton } from '@/components/auth/apple-signin-button'
import { MFAVerification } from '@/components/auth/MFAVerification'
import api from '@/lib/api'
import { useRouter } from 'next/navigation'
import { setCurrentOrganization } from '@/lib/api/session'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)

  // MFA state
  const [mfaRequired, setMfaRequired] = useState(false)
  const [mfaToken, setMfaToken] = useState('')

  const { checkAuth } = useAuth()
  const router = useRouter()

  const handleLoginSuccess = async () => {
    // Fetch user data and redirect after successful login
    await checkAuth()

    try {
      const orgsResponse = await api.get(`/api/v1/organisations/`)
      const organisations = orgsResponse.data

      if (organisations.length === 0) {
        router.push('/organizations/new')
      } else if (organisations.length === 1) {
        await setCurrentOrganization(organisations[0].id)
        router.push(`/organizations/${organisations[0].id}/projects`)
      } else {
        router.push('/organizations')
      }
    } catch (orgError) {
      console.error('Failed to fetch organisations:', orgError)
      router.push('/organizations')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await api.post(`/api/v1/auth/login`, {
        email,
        password,
        remember_me: rememberMe
      })

      // Check if MFA is required
      if (response.data.mfa_required) {
        setMfaToken(response.data.mfa_token)
        setMfaRequired(true)
        toast.info('Please enter your authentication code')
        return
      }

      // No MFA required - proceed with login
      toast.success('Welcome back!')
      await handleLoginSuccess()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || error.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const handleMFASuccess = async (response: any) => {
    toast.success('Welcome back!')
    await handleLoginSuccess()
  }

  const handleMFABack = () => {
    setMfaRequired(false)
    setMfaToken('')
  }

  // Show MFA verification screen
  if (mfaRequired && mfaToken) {
    return (
      <MFAVerification
        mfaToken={mfaToken}
        rememberMe={rememberMe}
        onSuccess={handleMFASuccess}
        onBack={handleMFABack}
        onError={(error) => toast.error(error)}
      />
    )
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left side: Branding */}
      <div className="hidden md:flex flex-col items-center justify-center relative p-8 bg-gradient-to-br from-slate-900 via-teal-900 to-cyan-900 dark:from-black dark:via-teal-950 dark:to-cyan-950 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Gradient orbs with animation */}
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-teal-400/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-gradient-to-tl from-emerald-400/20 to-teal-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-gradient-to-br from-cyan-400/10 to-blue-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>

          {/* Floating bug silhouettes */}
          <div className="absolute top-20 left-12 opacity-10 animate-float" style={{ animationDelay: '0s', animationDuration: '8s' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-emerald-300">
              <ellipse cx="12" cy="13" rx="5" ry="7" />
              <circle cx="12" cy="7" r="3" />
              <line x1="7" y1="10" x2="4" y2="8" stroke="currentColor" strokeWidth="1.5" />
              <line x1="17" y1="10" x2="20" y2="8" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>

          <div className="absolute bottom-32 right-20 opacity-10 animate-float" style={{ animationDelay: '3s', animationDuration: '10s' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-teal-300">
              <ellipse cx="12" cy="13" rx="5" ry="7" />
              <circle cx="12" cy="7" r="3" />
            </svg>
          </div>

          <div className="absolute top-1/2 left-16 opacity-10 animate-float" style={{ animationDelay: '5s', animationDuration: '12s' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-cyan-300">
              <ellipse cx="12" cy="13" rx="5" ry="7" />
              <circle cx="12" cy="7" r="3" />
            </svg>
          </div>

          {/* Checkmark symbols floating */}
          <div className="absolute top-40 right-16 opacity-10 animate-float" style={{ animationDelay: '1s', animationDuration: '9s' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <div className="absolute bottom-24 left-24 opacity-10 animate-float" style={{ animationDelay: '4s', animationDuration: '11s' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-400">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          {/* Circuit-like connecting lines */}
          <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="circuit" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M 10 50 L 30 50 L 30 30 M 30 70 L 30 50 M 50 10 L 50 30 L 70 30 M 70 50 L 50 50 L 50 70 M 50 90 L 50 70"
                  stroke="currentColor" strokeWidth="1" fill="none" className="text-teal-300" />
                <circle cx="30" cy="30" r="2" fill="currentColor" className="text-teal-400" />
                <circle cx="70" cy="30" r="2" fill="currentColor" className="text-cyan-400" />
                <circle cx="50" cy="70" r="2" fill="currentColor" className="text-emerald-400" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#circuit)" />
          </svg>

          {/* Geometric shapes */}
          <div className="absolute top-16 left-1/3 w-32 h-32 border border-teal-400/10 rotate-45 animate-spin-slow"></div>
          <div className="absolute bottom-20 right-1/3 w-24 h-24 border border-cyan-400/10 -rotate-12 animate-spin-slower"></div>
        </div>

        {/* Logo content */}
        <div className="relative z-10">
          <Logo />
        </div>

        {/* Tagline with glow effect */}
        <p className="relative z-10 mt-8 text-xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-teal-200 via-cyan-200 to-emerald-200 text-center max-w-md drop-shadow-lg">
          AI-Powered Testing Platform
        </p>
      </div>

      {/* Right side: Sign In Form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold text-center text-gray-900 dark:text-white mb-6">Log in to CogniTest</h2>

            {/* Social Logins */}
            <div className="space-y-4 mb-6">
              <GoogleSignInButton />
              <MicrosoftSignInButton />
              <AppleSignInButton />
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">Or</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link href="/auth/forgot-password" className="font-medium text-primary hover:text-primary/90" suppressHydrationWarning>
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                >
                  {loading ? 'Signing in...' : 'Log in'}
                </button>
              </div>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="font-medium text-primary hover:text-primary/90" suppressHydrationWarning>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}