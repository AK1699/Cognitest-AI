'use client'

import React, { useState, useEffect } from 'react'
import {
    Shield,
    ShieldCheck,
    ShieldOff,
    QrCode,
    Key,
    Copy,
    Check,
    AlertTriangle,
    RefreshCw,
    Loader2,
    Smartphone
} from 'lucide-react'
import { mfaAPI, MFASetupResponse, MFAEnableResponse } from '@/lib/api/mfa'

interface MFASettingsProps {
    onStatusChange?: (enabled: boolean) => void
}

type Step = 'status' | 'setup' | 'verify' | 'backup-codes' | 'disable'

export function MFASettings({ onStatusChange }: MFASettingsProps) {
    const [step, setStep] = useState<Step>('status')
    const [mfaEnabled, setMfaEnabled] = useState<boolean | null>(null)
    const [backupCodesCount, setBackupCodesCount] = useState<number>(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Setup state
    const [setupData, setSetupData] = useState<MFASetupResponse | null>(null)
    const [verificationCode, setVerificationCode] = useState('')
    const [verifying, setVerifying] = useState(false)

    // Backup codes state
    const [backupCodes, setBackupCodes] = useState<string[]>([])
    const [copiedCode, setCopiedCode] = useState<string | null>(null)
    const [copiedAll, setCopiedAll] = useState(false)

    // Disable state
    const [disableCode, setDisableCode] = useState('')
    const [disabling, setDisabling] = useState(false)

    useEffect(() => {
        loadMFAStatus()
    }, [])

    const loadMFAStatus = async () => {
        try {
            setLoading(true)
            setError(null)
            const status = await mfaAPI.getStatus()
            setMfaEnabled(status.mfa_enabled)

            if (status.mfa_enabled) {
                const count = await mfaAPI.getBackupCodesCount()
                setBackupCodesCount(count.remaining_codes)
            }
        } catch (err) {
            setError('Failed to load MFA status')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleStartSetup = async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await mfaAPI.setup()
            setSetupData(data)
            setStep('setup')
        } catch (err: any) {
            setError(err.message || 'Failed to start MFA setup')
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyAndEnable = async () => {
        if (!verificationCode || verificationCode.length !== 6) {
            setError('Please enter a valid 6-digit code')
            return
        }

        try {
            setVerifying(true)
            setError(null)
            const result = await mfaAPI.enable(verificationCode)
            setBackupCodes(result.backup_codes)
            setMfaEnabled(true)
            setStep('backup-codes')
            onStatusChange?.(true)
        } catch (err: any) {
            setError(err.message || 'Invalid verification code')
        } finally {
            setVerifying(false)
        }
    }

    const handleDisable = async () => {
        if (!disableCode) {
            setError('Please enter your verification code')
            return
        }

        try {
            setDisabling(true)
            setError(null)
            await mfaAPI.disable(disableCode)
            setMfaEnabled(false)
            setStep('status')
            setDisableCode('')
            onStatusChange?.(false)
        } catch (err: any) {
            setError(err.message || 'Failed to disable MFA')
        } finally {
            setDisabling(false)
        }
    }

    const handleCopyCode = async (code: string) => {
        await navigator.clipboard.writeText(code)
        setCopiedCode(code)
        setTimeout(() => setCopiedCode(null), 2000)
    }

    const handleCopyAllCodes = async () => {
        const codesText = backupCodes.join('\n')
        await navigator.clipboard.writeText(codesText)
        setCopiedAll(true)
        setTimeout(() => setCopiedAll(false), 2000)
    }

    const handleRegenerateBackupCodes = async () => {
        const code = prompt('Enter your current authentication code to regenerate backup codes:')
        if (!code) return

        try {
            setLoading(true)
            setError(null)
            const result = await mfaAPI.regenerateBackupCodes(code)
            setBackupCodes(result.backup_codes)
            setBackupCodesCount(result.backup_codes.length)
        } catch (err: any) {
            setError(err.message || 'Failed to regenerate backup codes')
        } finally {
            setLoading(false)
        }
    }

    if (loading && step === 'status') {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="max-w-2xl space-y-6">
            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                </div>
            )}

            {/* Status View */}
            {step === 'status' && (
                <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${mfaEnabled ? 'bg-green-100 dark:bg-green-500/20' : 'bg-gray-100 dark:bg-gray-700'}`}>
                            {mfaEnabled ? (
                                <ShieldCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
                            ) : (
                                <Shield className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                            )}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                Two-Factor Authentication
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                                {mfaEnabled
                                    ? 'Your account is protected with two-factor authentication.'
                                    : 'Add an extra layer of security to your account by enabling two-factor authentication.'}
                            </p>

                            {mfaEnabled && (
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <Key className="w-4 h-4" />
                                        <span>{backupCodesCount} backup codes remaining</span>
                                    </div>
                                    <button
                                        onClick={handleRegenerateBackupCodes}
                                        className="flex items-center gap-1 text-sm text-primary hover:text-primary/80"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Regenerate
                                    </button>
                                </div>
                            )}

                            <div className="flex gap-3">
                                {mfaEnabled ? (
                                    <button
                                        onClick={() => setStep('disable')}
                                        className="px-4 py-2 bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/30 transition-colors flex items-center gap-2"
                                    >
                                        <ShieldOff className="w-4 h-4" />
                                        Disable MFA
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleStartSetup}
                                        disabled={loading}
                                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <ShieldCheck className="w-4 h-4" />
                                        )}
                                        Enable MFA
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Setup View - QR Code */}
            {step === 'setup' && setupData && (
                <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <QrCode className="w-5 h-5 text-primary" />
                        Set Up Authenticator App
                    </h3>

                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* QR Code */}
                            <div className="flex-shrink-0">
                                <div className="bg-white p-4 rounded-xl border border-gray-200">
                                    <img
                                        src={`data:image/png;base64,${setupData.qr_code}`}
                                        alt="MFA QR Code"
                                        className="w-48 h-48"
                                    />
                                </div>
                            </div>

                            {/* Instructions */}
                            <div className="flex-1 space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                                        1
                                    </div>
                                    <div>
                                        <p className="text-gray-900 dark:text-white text-sm">
                                            Download an authenticator app on your phone
                                        </p>
                                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                                            Google Authenticator, Authy, or 1Password are recommended
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                                        2
                                    </div>
                                    <div>
                                        <p className="text-gray-900 dark:text-white text-sm">
                                            Scan the QR code with your authenticator app
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                                        3
                                    </div>
                                    <div>
                                        <p className="text-gray-900 dark:text-white text-sm">
                                            Enter the 6-digit code from your app below
                                        </p>
                                    </div>
                                </div>

                                {/* Manual entry option */}
                                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-2">Can't scan? Enter this code manually:</p>
                                    <code className="bg-gray-100 dark:bg-gray-900 px-3 py-2 rounded text-primary text-sm font-mono block break-all">
                                        {setupData.secret}
                                    </code>
                                </div>
                            </div>
                        </div>

                        {/* Verification input */}
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                                Enter verification code
                            </label>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white text-center text-2xl tracking-widest font-mono focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                    maxLength={6}
                                />
                                <button
                                    onClick={handleVerifyAndEnable}
                                    disabled={verifying || verificationCode.length !== 6}
                                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {verifying ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Check className="w-4 h-4" />
                                    )}
                                    Verify & Enable
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setStep('status')
                                setSetupData(null)
                                setVerificationCode('')
                            }}
                            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm"
                        >
                            ← Cancel setup
                        </button>
                    </div>
                </div>
            )}

            {/* Backup Codes View */}
            {step === 'backup-codes' && backupCodes.length > 0 && (
                <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-start gap-3 mb-6 p-4 bg-amber-50 dark:bg-amber-500/10 rounded-lg border border-amber-200 dark:border-amber-500/30">
                        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-amber-700 dark:text-amber-400 font-medium">Save your backup codes</h4>
                            <p className="text-amber-600 dark:text-gray-400 text-sm mt-1">
                                Store these codes in a safe place. You can use them to access your account if you lose your phone.
                                Each code can only be used once.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {backupCodes.map((code) => (
                            <div
                                key={code}
                                className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded-lg px-4 py-3 border border-gray-200 dark:border-gray-700"
                            >
                                <code className="text-gray-900 dark:text-white font-mono">{code}</code>
                                <button
                                    onClick={() => handleCopyCode(code)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                                >
                                    {copiedCode === code ? (
                                        <Check className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleCopyAllCodes}
                            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                        >
                            {copiedAll ? (
                                <>
                                    <Check className="w-4 h-4 text-green-500" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4" />
                                    Copy all codes
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => {
                                setStep('status')
                                setBackupCodes([])
                                setBackupCodesCount(10)
                                loadMFAStatus()
                            }}
                            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}

            {/* Disable View */}
            {step === 'disable' && (
                <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <ShieldOff className="w-5 h-5 text-red-500" />
                        Disable Two-Factor Authentication
                    </h3>

                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                        Enter your current authentication code or a backup code to disable MFA.
                        This will make your account less secure.
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                                Verification code
                            </label>
                            <input
                                type="text"
                                value={disableCode}
                                onChange={(e) => setDisableCode(e.target.value)}
                                placeholder="Enter code"
                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setStep('status')
                                    setDisableCode('')
                                    setError(null)
                                }}
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDisable}
                                disabled={disabling || !disableCode}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {disabling ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <ShieldOff className="w-4 h-4" />
                                )}
                                Disable MFA
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Info section */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                <div className="flex items-start gap-3">
                    <Smartphone className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-gray-700 dark:text-gray-300 font-medium text-sm">How it works</h4>
                        <p className="text-gray-500 text-xs mt-1">
                            Two-factor authentication adds an extra layer of security by requiring a code
                            from your authenticator app in addition to your password when you sign in.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MFASettings
