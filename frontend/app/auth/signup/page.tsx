'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import { Eye, EyeOff, Check, X, Chrome, Twitter, Apple, Monitor } from 'lucide-react'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Password validation states
  const [isLengthValid, setIsLengthValid] = useState(false)
  const [hasUppercase, setHasUppercase] = useState(false)
  const [hasLowercase, setHasLowercase] = useState(false)
  const [hasNumber, setHasNumber] = useState(false)

  const [loading, setLoading] = useState(false)
  const { signup } = useAuth()
  const router = useRouter()

  // Function to validate password in real-time
  const validatePassword = (pwd: string) => {
    setIsLengthValid(pwd.length >= 8)
    setHasUppercase(/[A-Z]/.test(pwd))
    setHasLowercase(/[a-z]/.test(pwd))
    setHasNumber(/[0-9]/.test(pwd))
  }

  const handleSSOSignup = (provider: string) => {
    toast.info(`${provider} SSO coming soon!`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate passwords match
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    // Ensure all real-time validations pass before submission
    if (!isLengthValid || !hasUppercase || !hasLowercase || !hasNumber) {
      toast.error('Password does not meet all requirements')
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

          {/* SSO Options */}
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={() => handleSSOSignup('Google')}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-sm"
            >
              <Chrome className="h-5 w-5 text-red-500" />
              Sign up with Google
            </button>
            <button
              type="button"
              onClick={() => handleSSOSignup('Microsoft')}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-sm"
            >
              <Monitor className="h-5 w-5 text-blue-500" />
              Sign up with Microsoft
            </button>
            <button
              type="button"
              onClick={() => handleSSOSignup('Apple')}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-sm"
            >
              <Apple className="h-5 w-5" />
              Sign up with Apple
            </button>
            <button
              type="button"
              onClick={() => handleSSOSignup('X')}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-sm"
            >
              <Twitter className="h-5 w-5" />
              Sign up with X
            </button>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">Sign up with CogniTest</h3>

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
                onChange={(e) => { setPassword(e.target.value); validatePassword(e.target.value); }}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary focus:shadow-sm transition-all outline-none pr-12"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setShowPassword(!showPassword); }}
                className="absolute top-1/2 -translate-y-1/2 right-2 p-1 rounded-full text-gray-500 dark:text-gray-400 z-10 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
              </button>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p className={`flex items-center gap-1 ${isLengthValid ? 'text-green-600' : 'text-red-600'}`}>
                  {isLengthValid ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  At least 8 characters
                </p>
                <p className={`flex items-center gap-1 ${hasUppercase ? 'text-green-600' : 'text-red-600'}`}>
                  {hasUppercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  One uppercase letter
                </p>
                <p className={`flex items-center gap-1 ${hasLowercase ? 'text-green-600' : 'text-red-600'}`}>
                  {hasLowercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  One lowercase letter
                </p>
                <p className={`flex items-center gap-1 ${hasNumber ? 'text-green-600' : 'text-red-600'}`}>
                  {hasNumber ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  One number
                </p>
              </div>
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
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary focus:shadow-sm transition-all outline-none pr-12"
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setShowConfirmPassword(!showConfirmPassword); }}
                className="absolute top-1/2 -translate-y-1/2 right-2 p-1 rounded-full text-gray-500 dark:text-gray-400 z-10 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {showConfirmPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
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
