'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import api from '@/lib/api'
import { Users, Mail, Plus, X, ArrowRight, ChevronRight, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

// Organization role options for invites - 3 tiers (Owner is the creator)
const ORG_ROLES = [
    { value: 'admin', label: 'Administrator', description: 'Manage users, settings, and all features except billing' },
    { value: 'member', label: 'Member', description: 'Standard access to create and run tests' },
    { value: 'viewer', label: 'Viewer', description: 'Read-only access to view tests and results' },
]

interface InviteEntry {
    id: string
    email: string
    role: string
}

export default function OnboardingInvitePage() {
    const [invites, setInvites] = useState<InviteEntry[]>([
        { id: '1', email: '', role: 'member' }
    ])
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const params = useParams()
    const { user } = useAuth()
    const organisationId = params.uuid as string

    const addInviteField = () => {
        setInvites([...invites, { id: Date.now().toString(), email: '', role: 'member' }])
    }

    const removeInviteField = (id: string) => {
        if (invites.length > 1) {
            setInvites(invites.filter(inv => inv.id !== id))
        }
    }

    const updateEmail = (id: string, email: string) => {
        setInvites(invites.map(inv =>
            inv.id === id ? { ...inv, email } : inv
        ))
    }

    const updateRole = (id: string, role: string) => {
        setInvites(invites.map(inv =>
            inv.id === id ? { ...inv, role } : inv
        ))
    }

    const handleInviteUsers = async () => {
        const validInvites = invites
            .filter(inv => inv.email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inv.email.trim()))

        if (validInvites.length === 0) {
            // Skip if no valid emails - just go to projects
            router.push(`/organizations/${organisationId}/projects`)
            return
        }

        setLoading(true)

        try {
            // Send invitations with role
            const promises = validInvites.map(invite =>
                api.post('/api/v1/invitations/', {
                    email: invite.email.trim(),
                    organisation_id: organisationId,
                    expiry_days: 7,
                    role: invite.role, // Send the selected organization role
                }).catch(err => {
                    const errorDetail = err.response?.data?.detail || err.message
                    console.error(`Failed to invite ${invite.email}:`, errorDetail)
                    return { email: invite.email, error: errorDetail }
                })
            )

            const results = await Promise.all(promises)
            const successes = results.filter(r => r && !(r as any).error)
            const failures = results.filter(r => r && (r as any).error) as { email: string, error: string }[]

            if (successes.length > 0) {
                toast.success(`${successes.length} invitation${successes.length > 1 ? 's' : ''} sent successfully!`)

                // If there are no failures, or if some succeeded, we can proceed
                // But if there are failures, we might want the user to see them
                if (failures.length === 0) {
                    router.push(`/organizations/${organisationId}/projects`)
                } else {
                    toast.error(`Failed to invite: ${failures.map(f => f.email).join(', ')}. ${failures[0].error}`)
                }
            } else if (failures.length > 0) {
                toast.error(failures[0].error || 'Failed to send invitations')
            }
        } catch (error: any) {
            console.error('Error sending invitations:', error)
            toast.error(error.response?.data?.detail || 'Failed to send invitations')
        } finally {
            setLoading(false)
        }
    }

    const handleSkip = () => {
        router.push(`/organizations/${organisationId}/projects`)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
            {/* Progress indicator */}
            <div className="pt-8 px-6">
                <div className="max-w-xl mx-auto">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                        <span className="flex items-center gap-1">
                            <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-medium">✓</span>
                            <span>Create Account</span>
                        </span>
                        <ChevronRight className="w-4 h-4" />
                        <span className="flex items-center gap-1">
                            <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-medium">✓</span>
                            <span>Organization</span>
                        </span>
                        <ChevronRight className="w-4 h-4" />
                        <span className="flex items-center gap-1">
                            <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-medium">3</span>
                            <span className="font-medium text-primary">Invite Team</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex items-center justify-center min-h-[calc(100vh-100px)] px-6 py-12">
                <div className="w-full max-w-2xl">
                    {/* Card Container */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 sm:p-12 border border-gray-100 dark:border-gray-700">
                        {/* Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg">
                                <Users className="w-8 h-8 text-white" />
                            </div>
                        </div>

                        {/* Title */}
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-3">
                            Invite your team
                        </h1>

                        {/* Subtitle */}
                        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
                            Testing is better together. Invite your colleagues to collaborate on your projects.
                        </p>

                        {/* Invite Form */}
                        <div className="space-y-4 mb-6">
                            {invites.map((invite, index) => (
                                <div key={invite.id} className="flex items-center gap-2">
                                    {/* Email input */}
                                    <div className="relative flex-1">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="email"
                                            value={invite.email}
                                            onChange={(e) => updateEmail(invite.id, e.target.value)}
                                            placeholder="colleague@company.com"
                                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                                        />
                                    </div>

                                    {/* Role dropdown */}
                                    <Select
                                        value={invite.role}
                                        onValueChange={(value) => updateRole(invite.id, value)}
                                    >
                                        <SelectTrigger className="w-48 px-3 py-3 h-auto rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary transition-colors bg-white text-gray-900 text-sm">
                                            <SelectValue placeholder="Role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ORG_ROLES.map(role => (
                                                <SelectItem key={role.value} value={role.value} className="focus:bg-primary/10 focus:text-primary">
                                                    {role.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {/* Remove button */}
                                    {invites.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeInviteField(invite.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Add More Button */}
                        <button
                            type="button"
                            onClick={addInviteField}
                            className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 mb-8"
                        >
                            <Plus className="w-5 h-5" />
                            Add another teammate
                        </button>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <Button
                                onClick={handleInviteUsers}
                                disabled={loading}
                                className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                                        Sending invitations...
                                    </>
                                ) : (
                                    <>
                                        Send Invitations
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </Button>

                            <button
                                type="button"
                                onClick={handleSkip}
                                className="w-full py-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium transition-colors"
                            >
                                Skip for now
                            </button>
                        </div>

                        {/* Helper Text */}
                        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
                            You can always invite more team members later from the Users & Teams settings.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
