'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Shield, ArrowLeft, Key, Loader2, AlertTriangle } from 'lucide-react'
import { mfaAPI } from '@/lib/api/mfa'

interface MFAVerificationProps {
    mfaToken: string
    rememberMe?: boolean
    onSuccess: (response: {
        access_token: string
        refresh_token: string
        user: { id: string; email: string; username: string }
    }) => void
    onBack: () => void
    onError?: (error: string) => void
}

export function MFAVerification({
    mfaToken,
    rememberMe = false,
    onSuccess,
    onBack,
    onError,
}: MFAVerificationProps) {
    const [code, setCode] = useState(['', '', '', '', '', ''])
    const [isBackupMode, setIsBackupMode] = useState(false)
    const [backupCode, setBackupCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    // Focus first input on mount
    useEffect(() => {
        if (!isBackupMode) {
            inputRefs.current[0]?.focus()
        }
    }, [isBackupMode])

    const handleCodeChange = (index: number, value: string) => {
        // Only allow digits
        const digit = value.replace(/\D/g, '').slice(-1)

        const newCode = [...code]
        newCode[index] = digit
        setCode(newCode)

        // Move to next input
        if (digit && index < 5) {
            inputRefs.current[index + 1]?.focus()
        }

        // Auto-submit when all 6 digits entered
        if (digit && index === 5) {
            const fullCode = newCode.join('')
            if (fullCode.length === 6) {
                handleVerify(fullCode)
            }
        }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        // Handle backspace
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }

        // Handle paste
        if (e.key === 'v' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            navigator.clipboard.readText().then((text) => {
                const digits = text.replace(/\D/g, '').slice(0, 6).split('')
                const newCode = [...code]
                digits.forEach((digit, i) => {
                    if (i < 6) newCode[i] = digit
                })
                setCode(newCode)

                // Focus last filled or first empty
                const lastIndex = Math.min(digits.length, 5)
                inputRefs.current[lastIndex]?.focus()

                // Auto-submit if complete
                if (digits.length === 6) {
                    handleVerify(digits.join(''))
                }
            })
        }
    }

    const handleVerify = async (verificationCode: string) => {
        try {
            setLoading(true)
            setError(null)

            const response = await mfaAPI.verifyLogin(
                mfaToken,
                verificationCode,
                false,
                rememberMe
            )

            onSuccess(response)
        } catch (err: any) {
            const errorMsg = err.message || 'Verification failed'
            setError(errorMsg)
            onError?.(errorMsg)
            // Clear code on error
            setCode(['', '', '', '', '', ''])
            inputRefs.current[0]?.focus()
        } finally {
            setLoading(false)
        }
    }

    const handleBackupVerify = async () => {
        if (!backupCode.trim()) {
            setError('Please enter a backup code')
            return
        }

        try {
            setLoading(true)
            setError(null)

            const response = await mfaAPI.verifyLogin(
                mfaToken,
                backupCode.trim(),
                true,
                rememberMe
            )

            onSuccess(response)
        } catch (err: any) {
            const errorMsg = err.message || 'Invalid backup code'
            setError(errorMsg)
            onError?.(errorMsg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
            <div className="w-full max-w-md">
                <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700 shadow-2xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Shield className="w-8 h-8 text-blue-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">
                            Two-Factor Authentication
                        </h1>
                        <p className="text-gray-400 text-sm">
                            {isBackupMode
                                ? 'Enter one of your backup codes'
                                : 'Enter the 6-digit code from your authenticator app'}
                        </p>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {/* TOTP Code Input */}
                    {!isBackupMode && (
                        <div className="space-y-6">
                            <div className="flex justify-center gap-2">
                                {code.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => { inputRefs.current[index] = el }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleCodeChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        disabled={loading}
                                        className="w-12 h-14 text-center text-2xl font-mono font-bold text-white bg-gray-900 border-2 border-gray-700 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all disabled:opacity-50"
                                    />
                                ))}
                            </div>

                            <button
                                onClick={() => handleVerify(code.join(''))}
                                disabled={loading || code.join('').length !== 6}
                                className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    'Verify'
                                )}
                            </button>
                        </div>
                    )}

                    {/* Backup Code Input */}
                    {isBackupMode && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm text-gray-300 mb-2">
                                    Backup code
                                </label>
                                <input
                                    type="text"
                                    value={backupCode}
                                    onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                                    placeholder="XXXX-XXXX"
                                    disabled={loading}
                                    className="w-full px-4 py-3 text-center text-xl font-mono font-bold text-white bg-gray-900 border-2 border-gray-700 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all disabled:opacity-50 uppercase tracking-wider"
                                />
                            </div>

                            <button
                                onClick={handleBackupVerify}
                                disabled={loading || !backupCode.trim()}
                                className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    'Verify Backup Code'
                                )}
                            </button>
                        </div>
                    )}

                    {/* Toggle mode */}
                    <button
                        onClick={() => {
                            setIsBackupMode(!isBackupMode)
                            setError(null)
                            setCode(['', '', '', '', '', ''])
                            setBackupCode('')
                        }}
                        disabled={loading}
                        className="w-full mt-4 py-2 text-gray-400 hover:text-white text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                        <Key className="w-4 h-4" />
                        {isBackupMode
                            ? 'Use authenticator app instead'
                            : 'Use a backup code instead'}
                    </button>

                    {/* Back button */}
                    <button
                        onClick={onBack}
                        disabled={loading}
                        className="w-full mt-2 py-2 text-gray-500 hover:text-gray-300 text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to login
                    </button>
                </div>
            </div>
        </div>
    )
}

export default MFAVerification
