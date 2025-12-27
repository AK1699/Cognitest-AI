'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { SignupModal } from '@/components/auth/signup-modal'
import Image from 'next/image'
import Logo from '@/components/ui/Logo'
import { GoogleSignInButton } from '@/components/auth/google-signin-button'
import { MicrosoftSignInButton } from '@/components/auth/microsoft-signin-button'
import { AppleSignInButton } from '@/components/auth/apple-signin-button'

export default function SignUpPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)

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

      {/* Right side: Sign Up Form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold text-center text-gray-900 dark:text-white mb-6">Create your CogniTest account</h2>

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
            <Link href="/auth/signin" className="font-medium text-primary hover:text-primary/90" suppressHydrationWarning>
              Log in
            </Link>
          </p>
        </div>
      </div>
      <SignupModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
