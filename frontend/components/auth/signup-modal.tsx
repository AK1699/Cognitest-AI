
'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import { Eye, EyeOff, Check, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface SignupModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SignupModal({ isOpen, onClose }: SignupModalProps) {
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

  // Function to validate password in real-time
  const validatePassword = (pwd: string) => {
    setIsLengthValid(pwd.length >= 8)
    setHasUppercase(/[A-Z]/.test(pwd))
    setHasLowercase(/[a-z]/.test(pwd))
    setHasNumber(/[0-9]/.test(pwd))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (!isLengthValid || !hasUppercase || !hasLowercase || !hasNumber) {
      toast.error('Password does not meet all requirements')
      return
    }

    setLoading(true)

    try {
      await signup(email, username, password, fullName || undefined)
      toast.success('Account created successfully!')
      onClose() // Close modal on success
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-10 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="text-left mb-6">
          <DialogTitle className="text-2xl font-semibold text-gray-800 dark:text-white">Create your CogniTest Account</DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-gray-400 mt-1">
            Get started with the future of testing.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email-modal" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                Email address <span className="text-red-500">*</span>
              </label>
              <input
                id="email-modal"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-light focus:border-transparent transition-colors outline-none"
                placeholder="you@example.com"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="username-modal" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  id="username-modal"
                  type="text"
                  required
                  minLength={3}
                  maxLength={50}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-light focus:border-transparent transition-colors outline-none"
                  placeholder="johndoe"
                />
              </div>
              <div>
                <label htmlFor="fullName-modal" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                  Full name <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  id="fullName-modal"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-light focus:border-transparent transition-colors outline-none"
                  placeholder="John Doe"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <label htmlFor="password-modal" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Password <span className="text-red-500">*</span></label>
              <div className="relative flex items-center mt-1.5">
                <input
                  id="password-modal"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); validatePassword(e.target.value); }}
                  className="w-full px-4 py-2.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-light focus:border-transparent transition-colors outline-none pr-12"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light transition-colors"
                >
                  {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
              <p className={`flex items-center gap-2 ${isLengthValid ? 'text-green-500' : 'text-gray-400'}`}>
                <Check className={`h-4 w-4 ${isLengthValid ? 'opacity-100' : 'opacity-50'}`} />
                8+ characters
              </p>
              <p className={`flex items-center gap-2 ${hasUppercase ? 'text-green-500' : 'text-gray-400'}`}>
                <Check className={`h-4 w-4 ${hasUppercase ? 'opacity-100' : 'opacity-50'}`} />
                Uppercase
              </p>
              <p className={`flex items-center gap-2 ${hasLowercase ? 'text-green-500' : 'text-gray-400'}`}>
                <Check className={`h-4 w-4 ${hasLowercase ? 'opacity-100' : 'opacity-50'}`} />
                Lowercase
              </p>
              <p className={`flex items-center gap-2 ${hasNumber ? 'text-green-500' : 'text-gray-400'}`}>
                <Check className={`h-4 w-4 ${hasNumber ? 'opacity-100' : 'opacity-50'}`} />
                Number
              </p>
            </div>
            <div>
              <label htmlFor="confirmPassword-modal" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Confirm password <span className="text-red-500">*</span></label>
              <div className="relative flex items-center mt-1.5">
                <input
                  id="confirmPassword-modal"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-light focus:border-transparent transition-colors outline-none pr-12"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light transition-colors"
                >
                  {showConfirmPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 px-4 rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
