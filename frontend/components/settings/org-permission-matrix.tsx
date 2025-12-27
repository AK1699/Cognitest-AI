'use client'

import { useEffect, useState, Fragment } from 'react'
import { Loader2, Check, X, Shield, ShieldCheck, ClipboardCheck, Bot, User, Eye, Crown, Settings } from 'lucide-react'
import { listOrgRoles, type OrganizationRole, ROLE_COLORS, ROLE_LABELS } from '@/lib/api/org-roles'

interface OrgPermissionMatrixProps {
    organisationId: string
}

// Enterprise permission groups based on role-based.md
const PERMISSION_GROUPS = {
    'Organization Management': [
        { key: 'can_delete_org', label: 'Delete Organization', description: 'Delete the entire organization' },
        { key: 'can_delete_tenant_gdpr', label: 'GDPR Deletion', description: 'Delete tenant data for GDPR compliance' },
        { key: 'can_edit_branding', label: 'Edit Branding', description: 'Modify organization branding' },
    ],
    'User & Team Management': [
        { key: 'can_manage_users', label: 'Manage Users', description: 'Add, edit, remove users' },
        { key: 'can_manage_teams', label: 'Manage Teams', description: 'Create and manage teams' },
        { key: 'can_impersonate_user', label: 'Impersonate User', description: 'Login as another user' },
    ],
    'Security & SSO': [
        { key: 'can_configure_sso', label: 'Configure SSO', description: 'Set up SAML/OIDC authentication' },
        { key: 'can_rotate_secrets', label: 'Rotate Secrets', description: 'Rotate API keys and secrets' },
        { key: 'can_manage_scan_profiles', label: 'Manage Scan Profiles', description: 'Configure security scan profiles' },
        { key: 'can_triage_vuln', label: 'Triage Vulnerabilities', description: 'Review and prioritize security findings' },
        { key: 'can_mark_false_positive', label: 'Mark False Positives', description: 'Mark findings as false positives' },
    ],
    'Billing & Subscriptions': [
        { key: 'can_manage_billing', label: 'Manage Billing', description: 'Update payment and subscription' },
        { key: 'can_view_invoices', label: 'View Invoices', description: 'Access billing invoices' },
        { key: 'can_export_cost_report', label: 'Export Cost Reports', description: 'Download cost analysis reports' },
    ],
    'Audit & Compliance': [
        { key: 'can_view_audit', label: 'View Audit Logs', description: 'Access audit trail' },
        { key: 'can_export_audit', label: 'Export Audit Logs', description: 'Download audit log data' },
        { key: 'can_delete_audit', label: 'Delete Audit Logs', description: 'Purge audit log entries' },
    ],
    'Integrations & API': [
        { key: 'can_manage_integrations', label: 'Manage Integrations', description: 'Configure third-party integrations' },
        { key: 'can_publish_marketplace', label: 'Publish to Marketplace', description: 'Publish integrations to marketplace' },
    ],
    'Testing Permissions': [
        { key: 'can_read_tests', label: 'View Tests', description: 'View test cases and results' },
        { key: 'can_write_tests', label: 'Create/Edit Tests', description: 'Create and modify tests' },
        { key: 'can_execute_tests', label: 'Execute Tests', description: 'Run test executions' },
    ],
}

// Role order for display (highest to lowest privilege)
const ROLE_ORDER = ['owner', 'admin', 'member', 'viewer']

// Role icons
const getRoleIcon = (roleType: string) => {
    switch (roleType) {
        case 'owner': return <Crown className="w-4 h-4" />
        case 'admin': return <Settings className="w-4 h-4" />
        case 'member': return <User className="w-4 h-4" />
        case 'viewer': return <Eye className="w-4 h-4" />
        default: return <Shield className="w-4 h-4" />
    }
}

export function OrgPermissionMatrix({ organisationId }: OrgPermissionMatrixProps) {
    const [roles, setRoles] = useState<OrganizationRole[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        loadRoles()
    }, [organisationId])

    const loadRoles = async () => {
        try {
            setLoading(true)
            setError(null)
            const rolesData = await listOrgRoles(organisationId)
            // Sort roles by hierarchy
            const sortedRoles = rolesData.sort((a, b) => {
                const aIndex = ROLE_ORDER.indexOf(a.role_type)
                const bIndex = ROLE_ORDER.indexOf(b.role_type)
                return aIndex - bIndex
            })
            setRoles(sortedRoles)
        } catch (err: any) {
            setError(err.message || 'Failed to load roles')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2">Loading permission matrix...</span>
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-8 text-red-600">
                <p>{error}</p>
                <button onClick={loadRoles} className="mt-2 text-primary hover:underline">
                    Retry
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Organization Role Permissions Matrix
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Enterprise RBAC permissions for all 4 organization roles
                </p>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {roles.map(role => (
                    <div key={role.id} className="flex items-center gap-2">
                        <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: role.color || ROLE_COLORS[role.role_type] || '#6B7280' }}
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {role.name}
                        </span>
                    </div>
                ))}
            </div>

            {/* Permission Matrix */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        {/* Header */}
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white sticky left-0 bg-gray-50 dark:bg-gray-900 z-10 min-w-[200px]">
                                    Permission
                                </th>
                                {roles.map(role => (
                                    <th
                                        key={role.id}
                                        className="px-3 py-3 text-center font-semibold whitespace-nowrap"
                                        style={{ minWidth: '100px' }}
                                    >
                                        <div className="flex flex-col items-center gap-1">
                                            <span
                                                className="p-1.5 rounded-full"
                                                style={{ backgroundColor: `${role.color || ROLE_COLORS[role.role_type]}20` }}
                                            >
                                                {getRoleIcon(role.role_type)}
                                            </span>
                                            <span
                                                className="text-xs font-medium"
                                                style={{ color: role.color || ROLE_COLORS[role.role_type] }}
                                            >
                                                {role.name}
                                            </span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        {/* Body */}
                        <tbody>
                            {Object.entries(PERMISSION_GROUPS).map(([groupName, permissions]) => (
                                <Fragment key={groupName}>
                                    {/* Group Header */}
                                    <tr className="bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
                                        <td
                                            colSpan={roles.length + 1}
                                            className="px-4 py-2 text-sm font-bold text-blue-900 dark:text-blue-200 sticky left-0 bg-blue-50 dark:bg-blue-900/20 z-10"
                                        >
                                            {groupName}
                                        </td>
                                    </tr>

                                    {/* Permission rows */}
                                    {permissions.map((perm, idx) => (
                                        <tr
                                            key={`${groupName}-${perm.key}-${idx}`}
                                            className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                        >
                                            <td className="px-4 py-3 sticky left-0 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 z-10">
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-white">
                                                        {perm.label}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                        {perm.description}
                                                    </div>
                                                </div>
                                            </td>
                                            {roles.map(role => {
                                                const hasPermission = role.permissions?.[perm.key as keyof typeof role.permissions] === true
                                                return (
                                                    <td
                                                        key={`${role.id}-${perm.key}`}
                                                        className="px-3 py-3 text-center"
                                                    >
                                                        <div className="flex items-center justify-center">
                                                            {hasPermission ? (
                                                                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                                    <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                                </div>
                                                            ) : (
                                                                <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                                                    <X className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                    ))}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {roles.map(role => {
                    const permCount = role.permissions
                        ? Object.values(role.permissions).filter(v => v === true).length
                        : 0
                    return (
                        <div
                            key={role.id}
                            className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                            style={{ borderLeftColor: role.color || ROLE_COLORS[role.role_type], borderLeftWidth: '4px' }}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                {getRoleIcon(role.role_type)}
                                <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                    {role.name}
                                </span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {permCount}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                permissions
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
