/**
 * MFA (Multi-Factor Authentication) API client
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface MFAStatusResponse {
    mfa_enabled: boolean
    has_backup_codes: boolean
}

interface MFASetupResponse {
    secret: string
    qr_code: string
    uri: string
}

interface MFAEnableResponse {
    message: string
    backup_codes: string[]
}

interface MFAVerifyResponse {
    message: string
    valid: boolean
    remaining_codes?: number
}

interface BackupCodesCountResponse {
    remaining_codes: number
    mfa_enabled: boolean
}

interface MFALoginResponse {
    message: string
    access_token: string
    refresh_token: string
    user: {
        id: string
        email: string
        username: string
    }
}

export const mfaAPI = {
    /**
     * Get the current MFA status for the authenticated user.
     */
    async getStatus(): Promise<MFAStatusResponse> {
        const response = await fetch(`${API_BASE}/api/v1/mfa/status`, {
            method: 'GET',
            credentials: 'include',
        })

        if (!response.ok) {
            throw new Error('Failed to get MFA status')
        }

        return response.json()
    },

    /**
     * Initiate MFA setup - generates secret and QR code.
     */
    async setup(): Promise<MFASetupResponse> {
        const response = await fetch(`${API_BASE}/api/v1/mfa/setup`, {
            method: 'POST',
            credentials: 'include',
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.detail || 'Failed to setup MFA')
        }

        return response.json()
    },

    /**
     * Enable MFA after verifying the initial TOTP code.
     */
    async enable(code: string): Promise<MFAEnableResponse> {
        const response = await fetch(`${API_BASE}/api/v1/mfa/enable`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.detail || 'Failed to enable MFA')
        }

        return response.json()
    },

    /**
     * Disable MFA for the current user.
     */
    async disable(code: string): Promise<{ message: string }> {
        const response = await fetch(`${API_BASE}/api/v1/mfa/disable`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.detail || 'Failed to disable MFA')
        }

        return response.json()
    },

    /**
     * Verify a TOTP code for sensitive operations.
     */
    async verify(code: string): Promise<MFAVerifyResponse> {
        const response = await fetch(`${API_BASE}/api/v1/mfa/verify`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.detail || 'Invalid code')
        }

        return response.json()
    },

    /**
     * Verify and consume a backup code.
     */
    async verifyBackupCode(backupCode: string): Promise<MFAVerifyResponse> {
        const response = await fetch(`${API_BASE}/api/v1/mfa/backup-codes/verify`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ backup_code: backupCode }),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.detail || 'Invalid backup code')
        }

        return response.json()
    },

    /**
     * Regenerate backup codes.
     */
    async regenerateBackupCodes(code: string): Promise<MFAEnableResponse> {
        const response = await fetch(`${API_BASE}/api/v1/mfa/backup-codes/regenerate`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.detail || 'Failed to regenerate backup codes')
        }

        return response.json()
    },

    /**
     * Get the count of remaining backup codes.
     */
    async getBackupCodesCount(): Promise<BackupCodesCountResponse> {
        const response = await fetch(`${API_BASE}/api/v1/mfa/backup-codes/count`, {
            method: 'GET',
            credentials: 'include',
        })

        if (!response.ok) {
            throw new Error('Failed to get backup codes count')
        }

        return response.json()
    },

    /**
     * Complete login with MFA code.
     */
    async verifyLogin(
        mfaToken: string,
        code: string,
        isBackupCode: boolean = false,
        rememberMe: boolean = false
    ): Promise<MFALoginResponse> {
        const response = await fetch(`${API_BASE}/api/v1/mfa/verify-login`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                mfa_token: mfaToken,
                code,
                is_backup_code: isBackupCode,
                remember_me: rememberMe,
            }),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.detail || 'MFA verification failed')
        }

        return response.json()
    },
}

export type {
    MFAStatusResponse,
    MFASetupResponse,
    MFAEnableResponse,
    MFAVerifyResponse,
    BackupCodesCountResponse,
    MFALoginResponse,
}
