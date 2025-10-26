
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
      <DialogContent className="sm:max-w-md p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <DialogTitle className="text-3xl font-bold text-gray-900 dark:text-white">Sign up with CogniTest</DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-gray-400 mt-2">
            Create your CogniTest account to get started.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Account Info Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b pb-2">Account Info</h3>
            <div>
              <label htmlFor="email-modal" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email address *
              </label>
              <input
                id="email-modal"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none shadow-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="username-modal" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username *
              </label>
              <input
                id="username-modal"
                type="text"
                required
                minLength={3}
                maxLength={50}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none shadow-sm"
                placeholder="johndoe"
              />
            </div>
            <div>
              <label htmlFor="fullName-modal" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full name <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="fullName-modal"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none shadow-sm"
                placeholder="John Doe"
              />
            </div>
          </div>

          {/* Security Section */}
          <div className="space-y-4 rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b pb-2">Security</h3>
            <div className="relative flex items-center">
              <input
                id="password-modal"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => { setPassword(e.target.value); validatePassword(e.target.value); }}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none pr-12 shadow-sm"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light transition-colors"
              >
                {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
              <p className={`flex items-center gap-1.5 ${isLengthValid ? 'text-green-600' : 'text-red-600'}`}>
                {isLengthValid ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                8+ characters
              </p>
              <p className={`flex items-center gap-1.5 ${hasUppercase ? 'text-green-600' : 'text-red-600'}`}>
                {hasUppercase ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                Uppercase
              </p>
              <p className={`flex items-center gap-1.5 ${hasLowercase ? 'text-green-600' : 'text-red-600'}`}>
                {hasLowercase ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                Lowercase
              </p>
              <p className={`flex items-center gap-1.5 ${hasNumber ? 'text-green-600' : 'text-red-600'}`}>
                {hasNumber ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                Number
              </p>
            </div>
            <div className="relative flex items-center">
              <input
                id="confirmPassword-modal"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none pr-12 shadow-sm"
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light transition-colors"
              >
                {showConfirmPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Sign Up Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:opacity-90 text-white font-semibold py-3 px-4 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
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
        </form>
      </DialogContent>
    </Dialog>
  )
}
