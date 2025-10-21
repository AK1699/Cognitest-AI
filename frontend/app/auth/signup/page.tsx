'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signup } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate passwords match
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    // Validate password strength
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }

    if (!/[A-Z]/.test(password)) {
      toast.error('Password must contain at least one uppercase letter')
      return
    }

    if (!/[a-z]/.test(password)) {
      toast.error('Password must contain at least one lowercase letter')
      return
    }

    if (!/[0-9]/.test(password)) {
      toast.error('Password must contain at least one number')
      return
    }

    setLoading(true)

    try {
      await signup(email, username, password, fullName || undefined)
      toast.success('Account created successfully!')
      // Redirect is handled in auth context
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-brand-50 via-white to-accent-50">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-semibold text-primary">CogniTest</h1>
          <p className="text-gray-500 mt-2 font-normal">AI-Powered Testing Platform</p>
        </div>

        {/* Sign Up Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2 text-center">Create account</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-center font-normal">Get started with CogniTest today</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-orange-700/70 dark:text-orange-300/70 mb-2">
                Email address *
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                placeholder="you@example.com"
              />
            </div>

            {/* Username Input */}
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-orange-700/70 dark:text-orange-300/70 mb-2">
                Username *
              </label>
              <input
                id="username"
                type="text"
                required
                minLength={3}
                maxLength={50}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                placeholder="johndoe"
              />
            </div>

            {/* Full Name Input */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-gray-900 dark:text-gray-300 mb-2">
                Full name <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                placeholder="John Doe"
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <label htmlFor="password" className="block text-sm font-semibold text-orange-700/70 dark:text-orange-300/70 mb-2">
                Password *
              </label>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none pr-10"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setShowPassword(!showPassword); }}
                className="absolute top-1/2 -translate-y-1/2 right-0 pr-3 text-gray-500 dark:text-gray-400 z-10"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                At least 8 characters with uppercase, lowercase, and number
              </p>
            </div>

            {/* Confirm Password Input */}
            <div className="relative">
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-orange-700/70 dark:text-orange-300/70 mb-2">
                Confirm password *
              </label>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none pr-10"
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setShowConfirmPassword(!showConfirmPassword); }}
                className="absolute top-1/2 -translate-y-1/2 right-0 pr-3 text-gray-500 dark:text-gray-400 z-10"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:opacity-90 text-white font-normal py-3.5 px-4 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link href="/auth/signin" className="font-medium text-primary hover:text-primary/90 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
