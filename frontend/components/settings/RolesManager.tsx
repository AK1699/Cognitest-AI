'use client'

import React, { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Crown,
    Shield,
    User,
    Eye,
    Users,
    Loader2,
    MoreVertical,
    Pencil,
    Trash2,
    Check,
    X,
    Grid3X3,
    LogOut
} from 'lucide-react'
import { OrgPermissionMatrix } from './org-permission-matrix'
import { useAuth } from '@/lib/auth-context'
import api from '@/lib/api'
import {
    listOrgRoles,
    updateOrgRole,
    listOrgMembers,
    assignMemberRole,
    removeMember,
    getRoleBadgeColor,
    getRoleLabel,
    getRoleDescription,
    canManageRole,
    isServiceAccountRole,
    type OrganizationRole,
    type UserRoleAssignment
} from '@/lib/api/org-roles'
import { useOrganizationStore } from '@/lib/store/organization-store'

interface RolesManagerProps {
    organisationId: string
    currentUserRole?: string
}

export function RolesManager({ organisationId, currentUserRole = 'member' }: RolesManagerProps) {
    const { user: currentUser, logout } = useAuth()
    const [roles, setRoles] = useState<OrganizationRole[]>([])
    const [members, setMembers] = useState<UserRoleAssignment[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'members' | 'roles' | 'matrix'>('members')
    const [editingMember, setEditingMember] = useState<string | null>(null)
    const [selectedRole, setSelectedRole] = useState<string>('')
    const [error, setError] = useState<string | null>(null)
    // Edit modal state
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingUserData, setEditingUserData] = useState<{
        user_id: string
        full_name: string
        role: string
    } | null>(null)
    const [editFormData, setEditFormData] = useState({ full_name: '', role: '' })
    const [savingEdit, setSavingEdit] = useState(false)
    // Confirmation modal state
    const [showConfirmModal, setShowConfirmModal] = useState(false)
    const [confirmAction, setConfirmAction] = useState<{
        userId: string
        isSelf: boolean
        memberName: string
    } | null>(null)
    const [processingRemove, setProcessingRemove] = useState(false)

    useEffect(() => {
        loadData()
    }, [organisationId])

    const loadData = async () => {
        try {
            setLoading(true)
            setError(null)
            console.log('[RolesManager] Loading org roles for:', organisationId)
            const [rolesData, membersData] = await Promise.all([
                listOrgRoles(organisationId),
                listOrgMembers(organisationId)
            ])
            console.log('[RolesManager] Loaded roles:', rolesData)
            console.log('[RolesManager] Loaded members:', membersData)
            setRoles(rolesData)
            setMembers(membersData)
        } catch (err: any) {
            console.error('[RolesManager] Error loading data:', err)
            setError(err.message || 'Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    const getRoleIcon = (roleType: string) => {
        switch (roleType) {
            case 'owner': return <Crown className="w-4 h-4" />
            case 'admin': return <Shield className="w-4 h-4" />
            case 'member': return <User className="w-4 h-4" />
            case 'viewer': return <Eye className="w-4 h-4" />
            default: return <User className="w-4 h-4" />
        }
    }

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            await assignMemberRole(organisationId, userId, newRole)
            setMembers(prev =>
                prev.map(m =>
                    m.user_id === userId
                        ? { ...m, role: newRole, role_name: getRoleLabel(newRole) }
                        : m
                )
            )
            setEditingMember(null)
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to update role')
        }
    }

    const handleRemoveMember = async (userId: string) => {
        const isSelf = userId === currentUser?.id
        const member = members.find(m => m.user_id === userId)
        const memberName = member?.full_name || member?.username || 'this member'

        // Proactive check for owners leaving an org with other members
        if (isSelf && members.length > 1) {
            const currentMembership = members.find(m => m.user_id === userId)
            if (currentMembership?.role === 'owner') {
                const hasOtherOwners = members.some(m => m.user_id !== userId && m.role === 'owner')
                if (!hasOtherOwners) {
                    setError('Cannot leave organization as you are the only owner. Please promote another member to owner or transfer ownership first.')
                    return
                }
            }
        }

        // Show confirmation modal instead of native confirm()
        setConfirmAction({ userId, isSelf, memberName })
        setShowConfirmModal(true)
    }

    const executeRemoveMember = async () => {
        if (!confirmAction) return
        const { userId, isSelf } = confirmAction
        const actionLabel = isSelf ? 'leave' : 'remove'

        setProcessingRemove(true)
        try {
            // Remove member from THIS org only, not delete the user entirely
            await api.delete(`/api/v1/organisations/${organisationId}/members/${userId}`)
            if (isSelf) {
                // Reset org store cache before redirect - ensures fresh data on orgs page
                useOrganizationStore.getState().reset()
                window.location.href = '/organizations'
            } else {
                setMembers(prev => prev.filter(m => m.user_id !== userId))
            }
            setShowConfirmModal(false)
            setConfirmAction(null)
        } catch (err: any) {
            setError(err.response?.data?.detail || `Failed to ${actionLabel} member`)
        } finally {
            setProcessingRemove(false)
        }
    }

    const openEditModal = (member: UserRoleAssignment) => {
        setEditingUserData({
            user_id: member.user_id,
            full_name: member.full_name || '',
            role: member.role
        })
        setEditFormData({
            full_name: member.full_name || '',
            role: member.role
        })
        setShowEditModal(true)
    }

    const saveEditChanges = async () => {
        if (!editingUserData) return
        setSavingEdit(true)
        try {
            // Update user name if changed
            if (editFormData.full_name !== editingUserData.full_name) {
                await api.put(`/api/v1/users/${editingUserData.user_id}`, {
                    full_name: editFormData.full_name
                })
            }
            // Update role if changed
            if (editFormData.role !== editingUserData.role) {
                await assignMemberRole(organisationId, editingUserData.user_id, editFormData.role)
            }
            // Refresh data
            await loadData()
            setShowEditModal(false)
            setEditingUserData(null)
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to update member')
        } finally {
            setSavingEdit(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg text-red-600 dark:text-red-400">
                    {error}
                    <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('members')}
                    className={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors ${activeTab === 'members'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Users className="inline-block w-4 h-4 mr-2" />
                    Members ({members.length})
                </button>
                <button
                    onClick={() => setActiveTab('roles')}
                    className={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors ${activeTab === 'roles'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Shield className="inline-block w-4 h-4 mr-2" />
                    Roles ({roles.length})
                </button>
                <button
                    onClick={() => setActiveTab('matrix')}
                    className={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors ${activeTab === 'matrix'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Grid3X3 className="inline-block w-4 h-4 mr-2" />
                    Permission Matrix
                </button>
            </div>

            {/* Members Tab */}
            {activeTab === 'members' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                            <tr>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">User</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">Role</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">Joined</th>
                                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {members.map((member) => (
                                <tr key={member.user_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-semibold">
                                                {(member.full_name || member.username)[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-white">
                                                    {member.full_name || member.username}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">{member.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        {editingMember === member.user_id ? (
                                            <div className="flex items-center gap-2">
                                                <Select
                                                    value={selectedRole}
                                                    onValueChange={(value) => setSelectedRole(value)}
                                                >
                                                    <SelectTrigger className="w-[140px] h-8 text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                                                        <SelectValue placeholder="Select role..." />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                                        {roles.map(role => (
                                                            <SelectItem
                                                                key={role.id}
                                                                value={role.role_type}
                                                                className="hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                                            >
                                                                {role.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <button
                                                    onClick={() => handleRoleChange(member.user_id, selectedRole)}
                                                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setEditingMember(null)}
                                                    className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <span
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                                                style={{
                                                    backgroundColor: `${member.role_color || getRoleBadgeColor(member.role)}15`,
                                                    color: member.role_color || getRoleBadgeColor(member.role)
                                                }}
                                            >
                                                {getRoleIcon(member.role)}
                                                {member.role_name}
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                        {member.joined_at
                                            ? new Date(member.joined_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                                            : 'N/A'
                                        }
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {/* Owner actions - self only */}
                                            {member.role === 'owner' && member.user_id === currentUser?.id && (
                                                <>
                                                    <button
                                                        onClick={() => openEditModal(member)}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 transition-colors"
                                                        title="Edit profile"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                        Edit
                                                    </button>
                                                    {members.length > 1 && !members.some(m => m.user_id !== member.user_id && m.role === 'owner') && (
                                                        <span className="text-xs text-gray-500 mr-2">
                                                            Promote another owner first
                                                        </span>
                                                    )}
                                                    <button
                                                        onClick={() => handleRemoveMember(member.user_id)}
                                                        disabled={members.length > 1 && !members.some(m => m.user_id !== member.user_id && m.role === 'owner')}
                                                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${members.length > 1 && !members.some(m => m.user_id !== member.user_id && m.role === 'owner')
                                                            ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                                            : 'text-amber-600 bg-amber-50 hover:bg-amber-100 dark:text-amber-400 dark:bg-amber-900/20 dark:hover:bg-amber-900/30'
                                                            }`}
                                                        title={members.length === 1 ? "Leave organization" : "Promote another owner first"}
                                                    >
                                                        <LogOut className="w-4 h-4" />
                                                        Leave
                                                    </button>
                                                </>
                                            )}
                                            {/* Non-owner self action */}
                                            {member.role !== 'owner' && member.user_id === currentUser?.id && (
                                                <button
                                                    onClick={() => handleRemoveMember(member.user_id)}
                                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 dark:text-amber-400 dark:bg-amber-900/20 dark:hover:bg-amber-900/30 transition-colors"
                                                    title="Leave organization"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    Leave
                                                </button>
                                            )}
                                            {/* Admin managing other non-owner members */}
                                            {member.user_id !== currentUser?.id && member.role !== 'owner' && canManageRole(currentUserRole, member.role) && (
                                                <>
                                                    <button
                                                        onClick={() => openEditModal(member)}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 transition-colors"
                                                        title="Change role"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveMember(member.user_id)}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/30 transition-colors"
                                                        title="Remove member"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Remove
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Roles Tab */}
            {activeTab === 'roles' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {roles.map((role) => (
                        <div
                            key={role.id}
                            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                                        style={{ backgroundColor: role.color || '#6B7280' }}
                                    >
                                        {getRoleIcon(role.role_type)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white">{role.name}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {role.user_count} {role.user_count === 1 ? 'member' : 'members'}
                                        </p>
                                    </div>
                                </div>
                                {role.is_system_role && (
                                    <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                        System
                                    </span>
                                )}
                            </div>
                            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                                {role.description}
                            </p>
                            <div className="mt-4 flex flex-wrap gap-1">
                                {Object.entries(role.permissions)
                                    .filter(([_, v]) => v)
                                    .slice(0, 4)
                                    .map(([k]) => (
                                        <span
                                            key={k}
                                            className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded"
                                        >
                                            {k.replace('can_', '').replace(/_/g, ' ')}
                                        </span>
                                    ))}
                                {Object.values(role.permissions).filter(Boolean).length > 4 && (
                                    <span className="text-xs text-gray-400">
                                        +{Object.values(role.permissions).filter(Boolean).length - 4} more
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Permission Matrix Tab */}
            {activeTab === 'matrix' && (
                <OrgPermissionMatrix organisationId={organisationId} />
            )}

            {/* Edit Member Modal */}
            {showEditModal && editingUserData && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Member</h2>
                            <button
                                onClick={() => { setShowEditModal(false); setEditingUserData(null); }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={editFormData.full_name}
                                    onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="Enter full name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Organization Role
                                </label>
                                <Select
                                    value={editFormData.role}
                                    onValueChange={(value) => setEditFormData({ ...editFormData, role: value })}
                                >
                                    <SelectTrigger className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                                        <SelectValue placeholder="Select role..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                        {roles.map(role => (
                                            <SelectItem
                                                key={role.id}
                                                value={role.role_type}
                                                className="hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                            >
                                                {role.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <button
                                    onClick={() => { setShowEditModal(false); setEditingUserData(null); }}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                    disabled={savingEdit}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveEditChanges}
                                    disabled={savingEdit}
                                    className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {savingEdit ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal for Remove/Leave */}
            {showConfirmModal && confirmAction && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${confirmAction.isSelf
                                ? 'bg-amber-100 dark:bg-amber-900/30'
                                : 'bg-red-100 dark:bg-red-900/30'
                                }`}>
                                {confirmAction.isSelf ? (
                                    <LogOut className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                                ) : (
                                    <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                                )}
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {confirmAction.isSelf ? 'Leave Organization?' : 'Remove Member?'}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    This action cannot be undone
                                </p>
                            </div>
                        </div>

                        <p className="text-gray-700 dark:text-gray-300 mb-6">
                            {confirmAction.isSelf
                                ? 'Are you sure you want to leave this organization? You will lose access to all projects and data.'
                                : `Are you sure you want to remove "${confirmAction.memberName}" from the organization?`
                            }
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => { setShowConfirmModal(false); setConfirmAction(null); }}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                disabled={processingRemove}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeRemoveMember}
                                disabled={processingRemove}
                                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${confirmAction.isSelf
                                    ? 'bg-amber-600 hover:bg-amber-700'
                                    : 'bg-red-600 hover:bg-red-700'
                                    }`}
                            >
                                {processingRemove
                                    ? 'Processing...'
                                    : confirmAction.isSelf ? 'Leave Organization' : 'Remove Member'
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default RolesManager
