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
    ShieldCheck,
    ClipboardCheck,
    Bot,
    Grid3X3
} from 'lucide-react'
import { OrgPermissionMatrix } from './org-permission-matrix'
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

interface RolesManagerProps {
    organisationId: string
    currentUserRole?: string
}

export function RolesManager({ organisationId, currentUserRole = 'member' }: RolesManagerProps) {
    const [roles, setRoles] = useState<OrganizationRole[]>([])
    const [members, setMembers] = useState<UserRoleAssignment[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'members' | 'roles' | 'matrix'>('members')
    const [editingMember, setEditingMember] = useState<string | null>(null)
    const [selectedRole, setSelectedRole] = useState<string>('')
    const [error, setError] = useState<string | null>(null)

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
            case 'sec_officer': return <ShieldCheck className="w-4 h-4" />
            case 'auditor': return <ClipboardCheck className="w-4 h-4" />
            case 'svc_account': return <Bot className="w-4 h-4" />
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
        if (!confirm('Are you sure you want to remove this member?')) return
        try {
            await removeMember(organisationId, userId)
            setMembers(prev => prev.filter(m => m.user_id !== userId))
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to remove member')
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
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">User</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Role</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Joined</th>
                                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Actions</th>
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
                                    <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                                        {member.joined_at
                                            ? new Date(member.joined_at).toLocaleDateString()
                                            : 'N/A'
                                        }
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        {canManageRole(currentUserRole, member.role) && member.role !== 'owner' && (
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingMember(member.user_id)
                                                        setSelectedRole(member.role)
                                                    }}
                                                    className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                                    title="Change role"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveMember(member.user_id)}
                                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
                                                    title="Remove member"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
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
        </div>
    )
}

export default RolesManager
