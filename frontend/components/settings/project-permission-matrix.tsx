'use client'

import { useEffect, useState, Fragment } from 'react'
import { Loader2, Check, X, Shield, ShieldCheck, User, Eye, Wrench, Bug, Code, Crown } from 'lucide-react'
import { listRoles, type ProjectRole, PROJECT_ROLE_COLORS, PROJECT_ROLE_LABELS } from '@/lib/api/roles'

interface ProjectPermissionMatrixProps {
    organisationId: string
}

// Project-level permission groups based on role-based.md
const PROJECT_PERMISSION_GROUPS = {
    'Test Artifacts': [
        { key: 'create_test_artifact', label: 'Create Test Artifacts', description: 'Create test cases, suites, and plans' },
        { key: 'read_test_artifact', label: 'View Test Artifacts', description: 'View test cases, suites, and plans' },
        { key: 'update_test_artifact', label: 'Update Test Artifacts', description: 'Edit test cases, suites, and plans' },
        { key: 'delete_test_artifact', label: 'Delete Test Artifacts', description: 'Delete test cases, suites, and plans' },
        { key: 'approve_test_case', label: 'Approve Test Cases', description: 'Approve test cases for execution' },
        { key: 'create_test_cycle', label: 'Create Test Cycles', description: 'Create and manage test cycles' },
        { key: 'link_requirement', label: 'Link Requirements', description: 'Link test cases to requirements' },
    ],
    'Automation Flows': [
        { key: 'create_automation_flow', label: 'Create Automation Flows', description: 'Build new automation workflows' },
        { key: 'read_automation_flow', label: 'View Automation Flows', description: 'View automation workflows' },
        { key: 'update_automation_flow', label: 'Update Automation Flows', description: 'Edit automation workflows' },
        { key: 'delete_automation_flow', label: 'Delete Automation Flows', description: 'Delete automation workflows' },
        { key: 'execute_flow_dev', label: 'Execute (Dev)', description: 'Run flows in development environment' },
        { key: 'execute_flow_staging', label: 'Execute (Staging)', description: 'Run flows in staging environment' },
        { key: 'execute_flow_prod', label: 'Execute (Production)', description: 'Run flows in production (requires 2FA)' },
        { key: 'accept_self_heal', label: 'Accept Self-Healing', description: 'Accept AI-suggested flow fixes' },
    ],
    'Manual Test Execution': [
        { key: 'execute_manual_test', label: 'Execute Manual Tests', description: 'Run manual test cases' },
        { key: 'record_evidence', label: 'Record Evidence', description: 'Capture screenshots and recordings' },
    ],
    'Security Testing': [
        { key: 'start_scan_staging', label: 'Start Security Scan', description: 'Initiate security scans on staging' },
        { key: 'update_finding', label: 'Update Findings', description: 'Modify security finding status' },
        { key: 'comment_finding', label: 'Comment on Findings', description: 'Add comments to security findings' },
        { key: 'read_finding', label: 'View Findings', description: 'View security scan results' },
        { key: 'export_sarif', label: 'Export SARIF', description: 'Export security results in SARIF format' },
        { key: 'export_sarif_non_pii', label: 'Export SARIF (Non-PII)', description: 'Export sanitized security results' },
    ],
    'Performance Testing': [
        { key: 'create_k6_script', label: 'Create k6 Scripts', description: 'Create performance test scripts' },
        { key: 'read_k6_script', label: 'View k6 Scripts', description: 'View performance test scripts' },
        { key: 'update_k6_script', label: 'Update k6 Scripts', description: 'Edit performance test scripts' },
        { key: 'delete_k6_script', label: 'Delete k6 Scripts', description: 'Delete performance test scripts' },
        { key: 'execute_load_10k', label: 'Execute Load (10k VUs)', description: 'Run load tests up to 10k virtual users' },
        { key: 'execute_load_100k', label: 'Execute Load (100k VUs)', description: 'Run load tests up to 100k virtual users' },
    ],
    'Dashboards & Reports': [
        { key: 'create_dashboard', label: 'Create Dashboards', description: 'Build new dashboards' },
        { key: 'read_dashboard', label: 'View Dashboards', description: 'View dashboards and reports' },
        { key: 'update_dashboard', label: 'Update Dashboards', description: 'Edit existing dashboards' },
        { key: 'delete_dashboard', label: 'Delete Dashboards', description: 'Delete dashboards' },
        { key: 'export_schedule', label: 'Schedule Exports', description: 'Schedule automated report exports' },
    ],
    'Project Settings': [
        { key: 'read_project', label: 'View Project', description: 'View project details' },
        { key: 'update_project', label: 'Update Project', description: 'Modify project settings' },
    ],
}

// Role order for display (highest to lowest privilege)
const PROJECT_ROLE_ORDER = ['project_admin', 'qa_lead', 'auto_eng', 'tester', 'dev_ro', 'viewer']

// Role icons
const getRoleIcon = (roleType: string) => {
    switch (roleType) {
        case 'project_admin': return <Crown className="w-4 h-4" />
        case 'qa_lead': return <ShieldCheck className="w-4 h-4" />
        case 'tester': return <Bug className="w-4 h-4" />
        case 'auto_eng': return <Wrench className="w-4 h-4" />
        case 'dev_ro': return <Code className="w-4 h-4" />
        case 'viewer': return <Eye className="w-4 h-4" />
        default: return <User className="w-4 h-4" />
    }
}

// Permission matrix - defines which roles have which permissions
const PERMISSION_MATRIX: Record<string, string[]> = {
    // Test Artifacts
    'create_test_artifact': ['project_admin', 'qa_lead', 'tester'],
    'read_test_artifact': ['project_admin', 'qa_lead', 'tester', 'auto_eng', 'dev_ro', 'viewer'],
    'update_test_artifact': ['project_admin', 'qa_lead', 'tester', 'auto_eng'],
    'delete_test_artifact': ['project_admin', 'qa_lead', 'tester'],
    'approve_test_case': ['project_admin', 'qa_lead'],
    'create_test_cycle': ['project_admin', 'qa_lead', 'tester'],
    'link_requirement': ['project_admin', 'qa_lead', 'auto_eng', 'dev_ro'],
    // Automation Flows
    'create_automation_flow': ['project_admin', 'qa_lead', 'auto_eng'],
    'read_automation_flow': ['project_admin', 'qa_lead', 'tester', 'auto_eng', 'dev_ro', 'viewer'],
    'update_automation_flow': ['project_admin', 'qa_lead', 'auto_eng'],
    'delete_automation_flow': ['project_admin', 'qa_lead', 'auto_eng'],
    'execute_flow_dev': ['project_admin', 'qa_lead', 'tester', 'auto_eng'],
    'execute_flow_staging': ['project_admin', 'qa_lead', 'tester', 'auto_eng'],
    'execute_flow_prod': ['project_admin', 'qa_lead', 'auto_eng'],
    'accept_self_heal': ['project_admin', 'qa_lead', 'auto_eng'],
    // Manual Test Execution
    'execute_manual_test': ['project_admin', 'qa_lead', 'tester', 'auto_eng'],
    'record_evidence': ['project_admin', 'qa_lead', 'tester', 'auto_eng', 'dev_ro'],
    // Security Testing
    'start_scan_staging': ['project_admin', 'qa_lead'],
    'update_finding': ['project_admin', 'qa_lead', 'auto_eng'],
    'comment_finding': ['project_admin', 'qa_lead', 'tester'],
    'read_finding': ['project_admin', 'qa_lead', 'tester', 'auto_eng', 'dev_ro', 'viewer'],
    'export_sarif': ['project_admin', 'qa_lead', 'auto_eng', 'dev_ro', 'viewer'],
    'export_sarif_non_pii': ['project_admin', 'qa_lead', 'tester'],
    // Performance Testing
    'create_k6_script': ['project_admin', 'qa_lead', 'auto_eng'],
    'read_k6_script': ['project_admin', 'qa_lead', 'tester', 'auto_eng', 'dev_ro', 'viewer'],
    'update_k6_script': ['project_admin', 'qa_lead', 'auto_eng'],
    'delete_k6_script': ['project_admin', 'qa_lead', 'auto_eng'],
    'execute_load_10k': ['project_admin', 'qa_lead', 'auto_eng'],
    'execute_load_100k': ['project_admin', 'auto_eng'],
    // Dashboards & Reports
    'create_dashboard': ['project_admin', 'qa_lead', 'auto_eng'],
    'read_dashboard': ['project_admin', 'qa_lead', 'tester', 'auto_eng', 'dev_ro', 'viewer'],
    'update_dashboard': ['project_admin', 'qa_lead'],
    'delete_dashboard': ['project_admin', 'qa_lead'],
    'export_schedule': ['project_admin', 'qa_lead'],
    // Project Settings
    'read_project': ['project_admin', 'qa_lead', 'tester', 'auto_eng', 'dev_ro', 'viewer'],
    'update_project': ['project_admin', 'qa_lead'],
}

export function ProjectPermissionMatrix({ organisationId }: ProjectPermissionMatrixProps) {
    const [roles, setRoles] = useState<ProjectRole[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        loadRoles()
    }, [organisationId])

    const loadRoles = async () => {
        try {
            setLoading(true)
            setError(null)
            const rolesData = await listRoles(organisationId)
            // Sort roles by hierarchy
            const sortedRoles = (rolesData.roles || []).sort((a, b) => {
                const aIndex = PROJECT_ROLE_ORDER.indexOf(a.role_type)
                const bIndex = PROJECT_ROLE_ORDER.indexOf(b.role_type)
                return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex)
            })
            setRoles(sortedRoles)
        } catch (err: any) {
            setError(err.message || 'Failed to load roles')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const hasPermission = (roleType: string, permissionKey: string): boolean => {
        return PERMISSION_MATRIX[permissionKey]?.includes(roleType) || false
    }

    const getPermissionCount = (roleType: string): number => {
        return Object.keys(PERMISSION_MATRIX).filter(key =>
            PERMISSION_MATRIX[key].includes(roleType)
        ).length
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
                    Project Role Permissions Matrix
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Enterprise RBAC permissions for all 6 project roles
                </p>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {roles.map(role => (
                    <div key={role.id} className="flex items-center gap-2">
                        <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: PROJECT_ROLE_COLORS[role.role_type] || '#6B7280' }}
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
                                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white sticky left-0 bg-gray-50 dark:bg-gray-900 z-10 min-w-[250px]">
                                    Permission
                                </th>
                                {roles.map(role => (
                                    <th
                                        key={role.id}
                                        className="px-3 py-3 text-center font-semibold whitespace-nowrap"
                                        style={{ minWidth: '110px' }}
                                    >
                                        <div className="flex flex-col items-center gap-1">
                                            <span
                                                className="p-1.5 rounded-full"
                                                style={{ backgroundColor: `${PROJECT_ROLE_COLORS[role.role_type] || '#6B7280'}20` }}
                                            >
                                                {getRoleIcon(role.role_type)}
                                            </span>
                                            <span
                                                className="text-xs font-medium"
                                                style={{ color: PROJECT_ROLE_COLORS[role.role_type] || '#6B7280' }}
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
                            {Object.entries(PROJECT_PERMISSION_GROUPS).map(([groupName, permissions]) => (
                                <Fragment key={groupName}>
                                    {/* Group Header */}
                                    <tr className="bg-teal-50 dark:bg-teal-900/20 border-b border-gray-200 dark:border-gray-700">
                                        <td
                                            colSpan={roles.length + 1}
                                            className="px-4 py-2 text-sm font-bold text-teal-900 dark:text-teal-200 sticky left-0 bg-teal-50 dark:bg-teal-900/20 z-10"
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
                                                const hasPerm = hasPermission(role.role_type, perm.key)
                                                return (
                                                    <td
                                                        key={`${role.id}-${perm.key}`}
                                                        className="px-3 py-3 text-center"
                                                    >
                                                        <div className="flex items-center justify-center">
                                                            {hasPerm ? (
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {roles.map(role => {
                    const permCount = getPermissionCount(role.role_type)
                    return (
                        <div
                            key={role.id}
                            className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                            style={{ borderLeftColor: PROJECT_ROLE_COLORS[role.role_type] || '#6B7280', borderLeftWidth: '4px' }}
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
