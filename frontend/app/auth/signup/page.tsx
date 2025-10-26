'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Chrome, Twitter, Apple, Monitor } from 'lucide-react'
import { SignupModal } from '@/components/auth/signup-modal'

export default function SignUpPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSSOSignup = (provider: string) => {
    toast.info(`${provider} SSO coming soon!`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
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

          {/* Sign Up with CogniTest Button */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-primary hover:opacity-90 text-white font-normal py-3.5 px-4 rounded-lg transition-all shadow-md hover:shadow-lg"
          >
            Sign up with CogniTest
          </button>

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
      <SignupModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}