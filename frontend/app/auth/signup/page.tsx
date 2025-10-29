'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { SignupModal } from '@/components/auth/signup-modal'
import Image from 'next/image'
import Logo from '@/components/ui/Logo'

export default function SignUpPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSSOSignup = (provider: string) => {
    toast.info(`${provider} SSO coming soon!`)
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left side: Branding */}
      <div className="hidden md:flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-8">
        <Logo />
      </div>

      {/* Right side: Sign Up Form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold text-center text-gray-900 dark:text-white mb-6">Create your CogniTest account</h2>
            
            {/* Social Logins */}
            <div className="space-y-4 mb-6">
              <button 
                onClick={() => handleSSOSignup('Google')}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <Image src="/google-logo.svg" alt="Google" width={20} height={20} className="mr-2" />
                Continue with Google
              </button>
              <button 
                onClick={() => handleSSOSignup('Microsoft')}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <Image src="/microsoft-logo.svg" alt="Microsoft" width={20} height={20} className="mr-2" />
                Continue with Microsoft
              </button>
              <button 
                onClick={() => handleSSOSignup('Apple')}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <Image src="/apple-logo.svg" alt="Apple" width={20} height={20} className="mr-2" />
                Continue with Apple
              </button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">Or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="w-full bg-primary hover:opacity-90 text-white font-normal py-3 px-4 rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              Sign up with Email
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/auth/signin" className="font-medium text-primary hover:text-primary/90">
              Log in
            </Link>
          </p>
        </div>
      </div>
      <SignupModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
