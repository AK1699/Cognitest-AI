'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { UserNav } from '@/components/layout/user-nav'
import {
    Shield, Globe, GitBranch, ShieldAlert, ClipboardCheck, RefreshCw,
    Plus, Play, ChevronRight, Clock, AlertTriangle, Activity, Home, Settings,
    Lock, FileWarning, Scale, CheckCircle2, XCircle, AlertOctagon, Eye,
    Download, ExternalLink, Search, Filter, Check, Copy, Terminal,
    Code2, Package, FileJson, HelpCircle, Info
} from 'lucide-react'
import { PolicyPanel } from '@/components/security'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface SecurityStats {
    total_scans: number
    total_vulnerabilities: number
    open_vulnerabilities: number
    resolved_vulnerabilities: number
    overall_risk_score: number
    risk_grade: string
    severity_breakdown: {
        critical: number
        high: number
        medium: number
        low: number
        info: number
    }
    scans_last_7_days: number
}

interface SecurityScan {
    id: string
    human_id: string
    name: string
    scan_type: string
    status: string
    progress_percentage: number
    total_vulnerabilities: number
    critical_count: number
    high_count: number
    risk_grade: string
    created_at: string
}

interface Vulnerability {
    id: string
    human_id: string
    title: string
    description: string
    severity: string
    category: string
    cvss_score: number
    cve_id?: string
    cwe_id?: string
    remediation?: string
    is_resolved: boolean
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

export default function SecurityTestingPage() {
    const params = useParams()
    const router = useRouter()
    const projectId = params.projectId as string
    const uuid = params.uuid as string

    const [activeModule, setActiveModule] = useState<'overview' | 'url' | 'repo' | 'vapt' | 'compliance' | 'policy'>('overview')
    const [stats, setStats] = useState<SecurityStats | null>(null)
    const [recentScans, setRecentScans] = useState<SecurityScan[]>([])
    const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([])
    const [loading, setLoading] = useState(true)

    // URL Scan state
    const [targetUrl, setTargetUrl] = useState('')
    const [scanning, setScanning] = useState(false)
    const [scanProgress, setScanProgress] = useState(0)
    const [scanResult, setScanResult] = useState<any>(null)
    const [scanConfig, setScanConfig] = useState({
        checkSsl: true,
        checkHeaders: true,
        checkSubdomains: true,
        checkPorts: true,
        scanDepth: 'standard',
        enableActiveScanning: false
    })
    const [scanVulnerabilities, setScanVulnerabilities] = useState<Vulnerability[]>([])
    const [loadingVulnerabilities, setLoadingVulnerabilities] = useState(false)
    const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null)

    // Repo Scan state
    const [repoUrl, setRepoUrl] = useState('')
    const [repoBranch, setRepoBranch] = useState('main')
    const [repoScanning, setRepoScanning] = useState(false)
    const [repoScanResult, setRepoScanResult] = useState<any>(null)
    const [repoConfig, setRepoConfig] = useState({
        scanSecrets: true,
        scanDependencies: true,
        scanLicenses: true,
        scanCode: true
    })

    // VAPT state
    const [vaptTarget, setVaptTarget] = useState('')
    const [vaptScanning, setVaptScanning] = useState(false)
    const [vaptResult, setVaptResult] = useState<any>(null)
    const [vaptConfig, setVaptConfig] = useState({
        testSqlInjection: true,
        testXss: true,
        testCsrf: true,
        testHeaders: true,
        testAuthentication: true,
        scanMode: 'passive'
    })

    // Compliance state
    const [selectedFramework, setSelectedFramework] = useState('iso27001')
    const [complianceResult, setComplianceResult] = useState<any>(null)
    const [generatingReport, setGeneratingReport] = useState(false)

    useEffect(() => {
        fetchDashboardData()
    }, [projectId])

    const fetchDashboardData = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('access_token')
            const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {}

            const statsResponse = await fetch(`${API_URL}/api/v1/security/dashboard/${projectId}/stats`, {
                credentials: 'include',
                headers
            })
            if (statsResponse.ok) {
                setStats(await statsResponse.json())
            }

            const scansResponse = await fetch(`${API_URL}/api/v1/security/scans?project_id=${projectId}&page_size=5`, {
                credentials: 'include',
                headers
            })
            if (scansResponse.ok) {
                const data = await scansResponse.json()
                setRecentScans(data.items || [])
            }

            const vulnResponse = await fetch(`${API_URL}/api/v1/security/vulnerabilities?project_id=${projectId}&page_size=10`, {
                credentials: 'include',
                headers
            })
            if (vulnResponse.ok) {
                const data = await vulnResponse.json()
                setVulnerabilities(data.items || [])
            }
        } catch (error) {
            console.error('Failed to fetch security data:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchScanVulnerabilities = async (scanId: string, severity?: string) => {
        setLoadingVulnerabilities(true)
        try {
            const token = localStorage.getItem('access_token')
            const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {}

            const severityParam = severity ? `&severity=${severity}` : ''
            const response = await fetch(`${API_URL}/api/v1/security/vulnerabilities?scan_id=${scanId}${severityParam}`, {
                credentials: 'include',
                headers
            })

            if (response.ok) {
                const data = await response.json()
                setScanVulnerabilities(data.items || [])
            }
        } catch (error) {
            console.error('Failed to fetch vulnerabilities:', error)
        } finally {
            setLoadingVulnerabilities(false)
        }
    }

    const handleSeverityCardClick = (severity: string, count: number) => {
        if (count === 0) return

        if (selectedSeverity === severity) {
            setSelectedSeverity(null)
            setScanVulnerabilities([])
        } else {
            setSelectedSeverity(severity)
            if (scanResult?.id) {
                fetchScanVulnerabilities(scanResult.id, severity)
            }
        }
    }

    const handleStartURLScan = async () => {
        if (!targetUrl) return

        setScanning(true)
        setScanProgress(0)
        setScanResult(null)

        try {
            const token = localStorage.getItem('access_token')
            const response = await fetch(`${API_URL}/api/v1/security/url/scan?project_id=${projectId}`, {
                method: 'POST',
                credentials: 'include', // Send cookies for httpOnly auth
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` }) // Only add if token exists
                },
                body: JSON.stringify({
                    target_url: targetUrl,
                    scan_depth: scanConfig.scanDepth,
                    check_ssl: scanConfig.checkSsl,
                    check_headers: scanConfig.checkHeaders,
                    check_subdomains: scanConfig.checkSubdomains,
                    check_ports: scanConfig.checkPorts,
                    enable_active_scanning: scanConfig.enableActiveScanning
                })
            })

            if (response.ok) {
                const data = await response.json()
                toast.success('URL scan started')

                const pollProgress = setInterval(async () => {
                    const statusResponse = await fetch(`${API_URL}/api/v1/security/scans/${data.id}`, {
                        credentials: 'include',
                        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                    })

                    if (statusResponse.ok) {
                        const statusData = await statusResponse.json()
                        setScanProgress(statusData.progress_percentage)

                        if (statusData.status === 'completed' || statusData.status === 'failed') {
                            clearInterval(pollProgress)
                            setScanning(false)
                            setScanResult(statusData)
                            if (statusData.status === 'completed') {
                                toast.success('URL scan completed')
                                // Auto-fetch all vulnerabilities
                                fetchScanVulnerabilities(data.id)
                            } else {
                                toast.error('URL scan failed')
                            }
                            fetchDashboardData()
                        }
                    }
                }, 2000)
            } else if (response.status === 401) {
                // Token expired or invalid - prompt re-login
                toast.error('Session expired. Please log in again.')
                setScanning(false)
                // Redirect to login
                window.location.href = '/auth/signin'
            } else {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.detail || `Scan failed with status ${response.status}`)
            }
        } catch (error) {
            console.error('Scan failed:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to start URL scan')
            setScanning(false)
        }
    }

    const handleStartRepoScan = async () => {
        if (!repoUrl) return

        setRepoScanning(true)
        setRepoScanResult(null)

        try {
            const token = localStorage.getItem('access_token')
            const response = await fetch(`${API_URL}/api/v1/security/repo/scan?project_id=${projectId}`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({
                    repo_url: repoUrl,
                    branch: repoBranch,
                    scan_secrets: repoConfig.scanSecrets,
                    scan_dependencies: repoConfig.scanDependencies,
                    scan_licenses: repoConfig.scanLicenses,
                    scan_code: repoConfig.scanCode
                })
            })

            if (response.ok) {
                const data = await response.json()
                toast.success('Repository scan started')

                const pollProgress = setInterval(async () => {
                    const statusResponse = await fetch(`${API_URL}/api/v1/security/scans/${data.id}`, {
                        credentials: 'include',
                        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                    })

                    if (statusResponse.ok) {
                        const statusData = await statusResponse.json()

                        if (statusData.status === 'completed' || statusData.status === 'failed') {
                            clearInterval(pollProgress)
                            setRepoScanning(false)
                            setRepoScanResult(statusData)
                            if (statusData.status === 'completed') {
                                toast.success('Repository scan completed')
                            } else {
                                toast.error('Repository scan failed')
                            }
                            fetchDashboardData()
                        }
                    }
                }, 2000)
            } else {
                throw new Error('Failed to start scan')
            }
        } catch (error) {
            console.error('Repo scan failed:', error)
            toast.error('Failed to start repository scan')
            setRepoScanning(false)
        }
    }

    const handleStartVAPTScan = async () => {
        if (!vaptTarget) return

        setVaptScanning(true)
        setVaptResult(null)

        try {
            const token = localStorage.getItem('access_token')
            const response = await fetch(`${API_URL}/api/v1/security/vapt/scan?project_id=${projectId}`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({
                    target_url: vaptTarget,
                    scan_mode: vaptConfig.scanMode,
                    test_sql_injection: vaptConfig.testSqlInjection,
                    test_xss: vaptConfig.testXss,
                    test_csrf: vaptConfig.testCsrf,
                    test_headers: vaptConfig.testHeaders,
                    test_authentication: vaptConfig.testAuthentication
                })
            })

            if (response.ok) {
                const data = await response.json()
                toast.success('VAPT scan started')

                const pollProgress = setInterval(async () => {
                    const statusResponse = await fetch(`${API_URL}/api/v1/security/scans/${data.id}`, {
                        credentials: 'include',
                        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                    })

                    if (statusResponse.ok) {
                        const statusData = await statusResponse.json()

                        if (statusData.status === 'completed' || statusData.status === 'failed') {
                            clearInterval(pollProgress)
                            setVaptScanning(false)
                            setVaptResult(statusData)
                            if (statusData.status === 'completed') {
                                toast.success('VAPT scan completed')
                            } else {
                                toast.error('VAPT scan failed')
                            }
                            fetchDashboardData()
                        }
                    }
                }, 2000)
            } else {
                throw new Error('Failed to start VAPT scan')
            }
        } catch (error) {
            console.error('VAPT scan failed:', error)
            toast.error('Failed to start VAPT scan')
            setVaptScanning(false)
        }
    }

    const handleGenerateComplianceReport = async () => {
        setGeneratingReport(true)
        setComplianceResult(null)

        try {
            const token = localStorage.getItem('access_token')
            const response = await fetch(`${API_URL}/api/v1/security/compliance/${projectId}/report?framework=${selectedFramework}`, {
                credentials: 'include',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            })

            if (response.ok) {
                const data = await response.json()
                setComplianceResult(data)
                toast.success('Compliance report generated')
            } else {
                throw new Error('Failed to generate report')
            }
        } catch (error) {
            console.error('Failed to generate compliance report:', error)
            toast.error('Failed to generate compliance report')
        } finally {
            setGeneratingReport(false)
        }
    }

    const defaultStats: SecurityStats = stats || {
        total_scans: 0,
        total_vulnerabilities: 0,
        open_vulnerabilities: 0,
        resolved_vulnerabilities: 0,
        overall_risk_score: 0,
        risk_grade: 'A+',
        severity_breakdown: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
        scans_last_7_days: 0
    }

    const getRiskColor = (grade: string) => {
        switch (grade) {
            case 'A+': case 'A': return 'text-green-600 bg-green-100'
            case 'B': return 'text-blue-600 bg-blue-100'
            case 'C': return 'text-yellow-600 bg-yellow-100'
            case 'D': return 'text-orange-600 bg-orange-100'
            case 'F': return 'text-red-600 bg-red-100'
            default: return 'text-gray-600 bg-gray-100'
        }
    }

    const getSeverityColor = (severity: string) => {
        switch (severity.toLowerCase()) {
            case 'critical': return 'bg-red-600 text-white'
            case 'high': return 'bg-orange-500 text-white'
            case 'medium': return 'bg-yellow-500 text-black'
            case 'low': return 'bg-blue-500 text-white'
            default: return 'bg-gray-500 text-white'
        }
    }

    const getScanTypeIcon = (scanType: string) => {
        switch (scanType) {
            case 'url_security': return <Globe className="w-4 h-4" />
            case 'repo_security': return <GitBranch className="w-4 h-4" />
            case 'vapt': return <ShieldAlert className="w-4 h-4" />
            case 'compliance': return <ClipboardCheck className="w-4 h-4" />
            default: return <Shield className="w-4 h-4" />
        }
    }

    const frameworks = [
        { id: 'iso27001', name: 'ISO 27001', description: 'Information Security Management' },
        { id: 'soc2', name: 'SOC 2', description: 'Service Organization Controls' },
        { id: 'gdpr', name: 'GDPR', description: 'General Data Protection Regulation' },
        { id: 'pci_dss', name: 'PCI DSS', description: 'Payment Card Industry Standard' },
        { id: 'hipaa', name: 'HIPAA', description: 'Health Insurance Portability' },
        { id: 'nist_csf', name: 'NIST CSF', description: 'Cybersecurity Framework' }
    ]

    const owaspCategories = [
        { id: 'A01', name: 'Broken Access Control', color: 'bg-red-100 text-red-700' },
        { id: 'A02', name: 'Cryptographic Failures', color: 'bg-orange-100 text-orange-700' },
        { id: 'A03', name: 'Injection', color: 'bg-red-100 text-red-700' },
        { id: 'A04', name: 'Insecure Design', color: 'bg-yellow-100 text-yellow-700' },
        { id: 'A05', name: 'Security Misconfiguration', color: 'bg-orange-100 text-orange-700' },
        { id: 'A06', name: 'Vulnerable Components', color: 'bg-purple-100 text-purple-700' },
        { id: 'A07', name: 'Auth Failures', color: 'bg-red-100 text-red-700' },
        { id: 'A08', name: 'Data Integrity', color: 'bg-yellow-100 text-yellow-700' },
        { id: 'A09', name: 'Logging Failures', color: 'bg-blue-100 text-blue-700' },
        { id: 'A10', name: 'SSRF', color: 'bg-orange-100 text-orange-700' }
    ]

    return (
        <div className="flex flex-col h-screen bg-white w-full">
            {/* Top Bar with Profile */}
            <div className="border-b border-gray-200 bg-white">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-end">
                        <UserNav />
                    </div>
                </div>
            </div>

            {/* Breadcrumbs Bar */}
            <div className="px-6 py-3 bg-white border-b border-gray-200">
                <div className="flex items-center gap-2 text-sm">
                    <button
                        onClick={() => router.push(`/organizations/${uuid}/projects/${projectId}`)}
                        className="text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <Home className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 font-semibold">Security Testing</span>
                </div>
            </div>

            {/* Tab Navigation Bar */}
            <div className="border-b border-gray-300 bg-gradient-to-r from-slate-50 via-gray-50 to-stone-50">
                <div className="px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {[
                            { id: 'overview', label: 'Overview', icon: Shield },
                            { id: 'url', label: 'URL Scanner', icon: Globe },
                            { id: 'repo', label: 'Repo Scanner', icon: GitBranch },
                            { id: 'vapt', label: 'VAPT', icon: ShieldAlert },
                            { id: 'policy', label: 'Policy', icon: Shield },
                            { id: 'compliance', label: 'Compliance', icon: ClipboardCheck },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveModule(tab.id as any)}
                                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${activeModule === tab.id
                                    ? 'text-teal-700 bg-white border-b-2 border-teal-700 shadow-sm'
                                    : 'text-gray-600 hover:text-teal-700 hover:bg-white/50'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-2 border-gray-200 hover:bg-gray-50"
                            onClick={fetchDashboardData}
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-2 border-gray-200 hover:bg-gray-50"
                        >
                            <Settings className="w-4 h-4" />
                            Settings
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-auto p-6">
                {/* Overview Tab */}
                {activeModule === 'overview' && (
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-4 gap-4">
                            <Card className="bg-gradient-to-br from-teal-50 to-white border-teal-100">
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Risk Score</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-4xl font-bold px-3 py-1 rounded-lg ${getRiskColor(defaultStats.risk_grade)}`}>
                                                    {defaultStats.risk_grade}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">Score: {defaultStats.overall_risk_score.toFixed(1)}/100</p>
                                        </div>
                                        <Shield className="w-12 h-12 text-teal-600 opacity-40" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Open Vulnerabilities</p>
                                            <p className="text-3xl font-bold text-gray-900 mt-1">{defaultStats.open_vulnerabilities}</p>
                                            <p className="text-xs text-gray-500 mt-2">{defaultStats.resolved_vulnerabilities} resolved</p>
                                        </div>
                                        <ShieldAlert className="w-10 h-10 text-orange-500 opacity-60" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Critical Issues</p>
                                            <p className={`text-3xl font-bold mt-1 ${defaultStats.severity_breakdown.critical > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                {defaultStats.severity_breakdown.critical}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-2">{defaultStats.severity_breakdown.high} high severity</p>
                                        </div>
                                        <AlertTriangle className="w-10 h-10 text-red-500 opacity-60" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Total Scans</p>
                                            <p className="text-3xl font-bold text-gray-900 mt-1">{defaultStats.total_scans}</p>
                                            <p className="text-xs text-gray-500 mt-2">{defaultStats.scans_last_7_days} in last 7 days</p>
                                        </div>
                                        <Activity className="w-10 h-10 text-teal-500 opacity-60" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Severity Breakdown */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Severity Breakdown</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-5 gap-4">
                                    {[
                                        { label: 'Critical', value: defaultStats.severity_breakdown.critical, color: 'bg-red-600' },
                                        { label: 'High', value: defaultStats.severity_breakdown.high, color: 'bg-orange-500' },
                                        { label: 'Medium', value: defaultStats.severity_breakdown.medium, color: 'bg-yellow-500' },
                                        { label: 'Low', value: defaultStats.severity_breakdown.low, color: 'bg-blue-500' },
                                        { label: 'Info', value: defaultStats.severity_breakdown.info, color: 'bg-gray-400' }
                                    ].map((item) => (
                                        <div key={item.label} className="text-center p-4 rounded-lg bg-gray-50">
                                            <div className={`w-4 h-4 ${item.color} rounded-full mx-auto mb-2`} />
                                            <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                                            <p className="text-sm text-gray-500">{item.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-4 gap-4">
                            {[
                                { module: 'url', icon: Globe, bgColor: 'bg-teal-100', iconColor: 'text-teal-600', title: 'URL Security', desc: 'SSL, Headers, Ports' },
                                { module: 'repo', icon: GitBranch, bgColor: 'bg-purple-100', iconColor: 'text-purple-600', title: 'Repo Security', desc: 'Secrets, Dependencies' },
                                { module: 'vapt', icon: ShieldAlert, bgColor: 'bg-orange-100', iconColor: 'text-orange-600', title: 'VAPT', desc: 'OWASP Top 10' },
                                { module: 'compliance', icon: ClipboardCheck, bgColor: 'bg-blue-100', iconColor: 'text-blue-600', title: 'Compliance', desc: 'ISO, SOC 2, GDPR' }
                            ].map((item) => (
                                <Card
                                    key={item.module}
                                    className="cursor-pointer hover:shadow-md transition-all hover:border-gray-300"
                                    onClick={() => setActiveModule(item.module as any)}
                                >
                                    <CardContent className="pt-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-lg ${item.bgColor} flex items-center justify-center`}>
                                                <item.icon className={`w-6 h-6 ${item.iconColor}`} />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                                                <p className="text-sm text-gray-500">{item.desc}</p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-400" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Recent Scans */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Recent Scans</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {recentScans.length === 0 ? (
                                    <div className="text-center py-16">
                                        <Shield className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                        <p className="text-gray-500 mb-4">No security scans yet</p>
                                        <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => setActiveModule('url')}>
                                            <Play className="w-4 h-4 mr-2" />
                                            Start First Scan
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {recentScans.map((scan) => (
                                            <div key={scan.id} className="flex items-center gap-4 p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                                    {getScanTypeIcon(scan.scan_type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium text-gray-900 truncate">{scan.name}</h4>
                                                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                                        <Clock className="w-3 h-3" />
                                                        <span>{new Date(scan.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <Badge className={scan.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                                                    {scan.status}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Vulnerabilities */}
                        {vulnerabilities.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Recent Vulnerabilities</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {vulnerabilities.slice(0, 5).map((vuln) => (
                                            <div key={vuln.id} className="flex items-center gap-4 p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                                                <Badge className={getSeverityColor(vuln.severity)}>
                                                    {vuln.severity}
                                                </Badge>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium text-gray-900 truncate">{vuln.title}</h4>
                                                    <p className="text-sm text-gray-500 truncate">{vuln.description}</p>
                                                </div>
                                                {vuln.is_resolved ? (
                                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                ) : (
                                                    <AlertOctagon className="w-5 h-5 text-red-500" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* URL Security Tab */}
                {activeModule === 'url' && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Globe className="w-5 h-5 text-teal-600" />
                                    URL Security Scanner
                                </CardTitle>
                                <CardDescription>
                                    Analyze SSL/TLS certificates, security headers, open ports, and subdomains
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="target-url">Target URL</Label>
                                    <div className="flex gap-3">
                                        <Input
                                            id="target-url"
                                            placeholder="https://example.com"
                                            value={targetUrl}
                                            onChange={(e) => setTargetUrl(e.target.value)}
                                            className="flex-1"
                                        />
                                        <Button
                                            className="bg-teal-600 hover:bg-teal-700"
                                            onClick={handleStartURLScan}
                                            disabled={scanning || !targetUrl}
                                        >
                                            {scanning ? (
                                                <>
                                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                                    Scanning...
                                                </>
                                            ) : (
                                                <>
                                                    <Play className="w-4 h-4 mr-2" />
                                                    Start Scan
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-4">
                                    {[
                                        { id: 'checkSsl', label: 'SSL/TLS', icon: Lock },
                                        { id: 'checkHeaders', label: 'Headers', icon: FileWarning },
                                        { id: 'checkSubdomains', label: 'Subdomains', icon: Globe },
                                        { id: 'checkPorts', label: 'Ports', icon: Terminal }
                                    ].map((opt) => (
                                        <div key={opt.id} className="flex items-center justify-between p-4 rounded-lg border">
                                            <div className="flex items-center gap-2">
                                                <opt.icon className="w-4 h-4 text-gray-500" />
                                                <Label htmlFor={opt.id}>{opt.label}</Label>
                                            </div>
                                            <Switch
                                                id={opt.id}
                                                checked={scanConfig[opt.id as keyof typeof scanConfig] as boolean}
                                                onCheckedChange={(checked) => setScanConfig({ ...scanConfig, [opt.id]: checked })}
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Active Scanning Toggle with Warning */}
                                <div className="p-4 rounded-lg border border-orange-200 bg-orange-50">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <ShieldAlert className="w-4 h-4 text-orange-600" />
                                            <Label htmlFor="enableActiveScanning" className="font-semibold text-orange-900">
                                                Active Penetration Testing
                                            </Label>
                                        </div>
                                        <Switch
                                            id="enableActiveScanning"
                                            checked={scanConfig.enableActiveScanning}
                                            onCheckedChange={(checked) => setScanConfig({ ...scanConfig, enableActiveScanning: checked })}
                                        />
                                    </div>
                                    <p className="text-xs text-orange-700">
                                        ⚠️ Sends potentially malicious payloads (XSS, SQLi, CSRF). Only enable for systems you own or have permission to test.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Scan Depth</Label>
                                    <div className="flex gap-2">
                                        {['quick', 'standard', 'deep'].map((depth) => (
                                            <Button
                                                key={depth}
                                                variant={scanConfig.scanDepth === depth ? 'default' : 'outline'}
                                                onClick={() => setScanConfig({ ...scanConfig, scanDepth: depth })}
                                                className={scanConfig.scanDepth === depth ? 'bg-teal-600 hover:bg-teal-700' : ''}
                                            >
                                                {depth.charAt(0).toUpperCase() + depth.slice(1)}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {scanning && (
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-gray-600">Scanning in progress...</span>
                                            <span className="font-bold text-teal-600">{scanProgress}%</span>
                                        </div>
                                        <Progress value={scanProgress} className="h-2" />
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            <span>Analyzing {targetUrl}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {scanResult && (
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle>Scan Results</CardTitle>
                                        <Badge className={scanResult.risk_grade === 'A' || scanResult.risk_grade === 'A+'
                                            ? 'bg-green-100 text-green-700'
                                            : scanResult.risk_grade === 'F'
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                        }>
                                            Grade: {scanResult.risk_grade}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-4 gap-4">
                                        {[
                                            { severity: 'critical', count: scanResult.critical_count || 0, label: 'Critical', bg: 'bg-red-50', text: 'text-red-600' },
                                            { severity: 'high', count: scanResult.high_count || 0, label: 'High', bg: 'bg-orange-50', text: 'text-orange-600' },
                                            { severity: 'medium', count: scanResult.medium_count || 0, label: 'Medium', bg: 'bg-yellow-50', text: 'text-yellow-600' },
                                            { severity: 'low', count: scanResult.low_count || 0, label: 'Low', bg: 'bg-blue-50', text: 'text-blue-600' }
                                        ].map((item) => (
                                            <div
                                                key={item.severity}
                                                className={`text-center p-6 rounded-lg ${item.bg}`}
                                            >
                                                <p className={`text-3xl font-bold ${item.text}`}>{item.count}</p>
                                                <p className="text-sm text-gray-600 mt-1">{item.label}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* All Vulnerabilities Grouped by Severity */}
                                    {loadingVulnerabilities ? (
                                        <div className="flex items-center justify-center py-8">
                                            <RefreshCw className="w-6 h-6 animate-spin text-teal-600" />
                                            <span className="ml-2 text-gray-600">Loading vulnerability details...</span>
                                        </div>
                                    ) : scanVulnerabilities.length > 0 ? (
                                        <div className="space-y-6 mt-6">
                                            {['critical', 'high', 'medium', 'low', 'info'].map((severity) => {
                                                const severityVulns = scanVulnerabilities.filter(v => v.severity === severity)
                                                if (severityVulns.length === 0) return null

                                                const severityColors = {
                                                    critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800' },
                                                    high: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800' },
                                                    medium: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800' },
                                                    low: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800' },
                                                    info: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800' }
                                                }
                                                const colors = severityColors[severity as keyof typeof severityColors]

                                                return (
                                                    <div key={severity} className="border-t pt-4">
                                                        <h4 className={`font-semibold capitalize mb-3 ${colors.text}`}>
                                                            {severity} Vulnerabilities ({severityVulns.length})
                                                        </h4>
                                                        <div className="space-y-3">
                                                            {severityVulns.map((vuln) => (
                                                                <div key={vuln.id} className={`p-4 rounded-lg border ${colors.bg} ${colors.border}`}>
                                                                    <div className="flex items-start justify-between">
                                                                        <div className="flex-1">
                                                                            <h5 className="font-medium text-gray-900 mb-1">{vuln.title}</h5>
                                                                            <p className="text-sm text-gray-600 mb-2">{vuln.description}</p>
                                                                            {vuln.remediation && (
                                                                                <div className="mt-2 p-2 bg-teal-50 rounded border border-teal-200">
                                                                                    <p className="text-xs font-medium text-teal-800 mb-1">🔧 Remediation:</p>
                                                                                    <p className="text-xs text-teal-700">{vuln.remediation}</p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <Badge className={vuln.is_resolved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                                                                            {vuln.is_resolved ? '✓ Resolved' : 'Open'}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : null}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* Repo Security Tab */}
                {activeModule === 'repo' && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <GitBranch className="w-5 h-5 text-purple-600" />
                                    Repository Security Scanner
                                </CardTitle>
                                <CardDescription>
                                    Detect secrets, scan dependencies for vulnerabilities, and check license compliance
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="repo-url">Repository URL</Label>
                                        <Input
                                            id="repo-url"
                                            placeholder="https://github.com/owner/repo"
                                            value={repoUrl}
                                            onChange={(e) => setRepoUrl(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="repo-branch">Branch</Label>
                                        <Input
                                            id="repo-branch"
                                            placeholder="main"
                                            value={repoBranch}
                                            onChange={(e) => setRepoBranch(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <TooltipProvider>
                                    <div className="grid grid-cols-4 gap-4">
                                        {[
                                            {
                                                id: 'scanSecrets',
                                                label: 'Secret Detection',
                                                icon: Lock,
                                                desc: 'API keys, tokens, passwords',
                                                tooltip: 'Uses TruffleHog with entropy analysis to detect exposed secrets including API keys, AWS credentials, database passwords, OAuth tokens, and private keys. Identifies high-entropy strings that may be leaked credentials.'
                                            },
                                            {
                                                id: 'scanDependencies',
                                                label: 'SCA / Dependencies',
                                                icon: Package,
                                                desc: 'pip-audit, npm audit, OSV',
                                                tooltip: 'Software Composition Analysis (SCA): Scans package.json, requirements.txt, and go.mod for known CVEs using pip-audit, npm audit, Trivy, and the OSV vulnerability database. Includes transitive dependency analysis and upgrade path recommendations.'
                                            },
                                            {
                                                id: 'scanLicenses',
                                                label: 'Licenses / SBOM',
                                                icon: FileJson,
                                                desc: 'Compliance + CycloneDX export',
                                                tooltip: 'License Compliance & SBOM: Detects GPL, LGPL, AGPL and copyleft licenses. Generates Software Bill of Materials (SBOM) in CycloneDX/SPDX format for supply chain compliance (NIST, CISA). Exportable for audits and regulatory requirements.'
                                            },
                                            {
                                                id: 'scanCode',
                                                label: 'SAST / Code',
                                                icon: Code2,
                                                desc: 'Semgrep, Bandit, ESLint',
                                                tooltip: 'Static Application Security Testing (SAST): Deep code analysis using Semgrep for 30+ languages, Bandit for Python, and ESLint security plugins for JS/TS. Detects SQL injection, XSS, command injection, path traversal, and more with AI-powered fix suggestions.'
                                            }
                                        ].map((opt) => (
                                            <div key={opt.id} className="flex flex-col p-4 rounded-lg border hover:border-purple-300 transition-colors">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <opt.icon className="w-4 h-4 text-purple-600" />
                                                        <Label htmlFor={opt.id} className="font-medium">{opt.label}</Label>
                                                        <Tooltip>
                                                            <TooltipTrigger>
                                                                <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-purple-600 cursor-help" />
                                                            </TooltipTrigger>
                                                            <TooltipContent className="max-w-sm" side="bottom">
                                                                <p className="text-sm">{opt.tooltip}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                    <Switch
                                                        id={opt.id}
                                                        checked={repoConfig[opt.id as keyof typeof repoConfig]}
                                                        onCheckedChange={(checked) => setRepoConfig({ ...repoConfig, [opt.id]: checked })}
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-500">{opt.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </TooltipProvider>

                                <Button
                                    className="w-full bg-purple-600 hover:bg-purple-700"
                                    onClick={handleStartRepoScan}
                                    disabled={repoScanning || !repoUrl}
                                >
                                    {repoScanning ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            Scanning Repository...
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-4 h-4 mr-2" />
                                            Start Repository Scan
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>

                        {repoScanResult && (
                            <div className="grid grid-cols-3 gap-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Lock className="w-4 h-4 text-red-500" />
                                            Secrets Detected
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-bold text-red-600">{repoScanResult.secrets_count || 0}</p>
                                        <p className="text-sm text-gray-500 mt-2">Exposed credentials found</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                                            Vulnerable Dependencies
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-bold text-orange-600">{repoScanResult.vulnerable_deps || 0}</p>
                                        <p className="text-sm text-gray-500 mt-2">Out of {repoScanResult.total_deps || 0} total</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Scale className="w-4 h-4 text-blue-500" />
                                            License Issues
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-bold text-blue-600">{repoScanResult.license_issues || 0}</p>
                                        <p className="text-sm text-gray-500 mt-2">Compliance warnings</p>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {!repoScanResult && !repoScanning && (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <GitBranch className="w-16 h-16 text-purple-200 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Repository Scans Yet</h3>
                                    <p className="text-gray-500 max-w-md mx-auto">
                                        Enter a repository URL above to scan for exposed secrets, vulnerable dependencies, and license compliance issues.
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* VAPT Tab */}
                {activeModule === 'vapt' && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ShieldAlert className="w-5 h-5 text-orange-600" />
                                    Vulnerability Assessment & Penetration Testing
                                </CardTitle>
                                <CardDescription>
                                    OWASP Top 10 vulnerability detection with AI-powered remediation suggestions
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="vapt-target">Target Application URL</Label>
                                    <Input
                                        id="vapt-target"
                                        placeholder="https://app.example.com"
                                        value={vaptTarget}
                                        onChange={(e) => setVaptTarget(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Scan Mode</Label>
                                    <div className="flex gap-2">
                                        <Button
                                            variant={vaptConfig.scanMode === 'passive' ? 'default' : 'outline'}
                                            onClick={() => setVaptConfig({ ...vaptConfig, scanMode: 'passive' })}
                                            className={vaptConfig.scanMode === 'passive' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                                        >
                                            <Eye className="w-4 h-4 mr-2" />
                                            Passive (Safe)
                                        </Button>
                                        <Button
                                            variant={vaptConfig.scanMode === 'active' ? 'default' : 'outline'}
                                            onClick={() => setVaptConfig({ ...vaptConfig, scanMode: 'active' })}
                                            className={vaptConfig.scanMode === 'active' ? 'bg-red-600 hover:bg-red-700' : ''}
                                        >
                                            <ShieldAlert className="w-4 h-4 mr-2" />
                                            Active (Aggressive)
                                        </Button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {vaptConfig.scanMode === 'passive'
                                            ? 'Passive mode analyzes responses without modifying requests'
                                            : 'Active mode sends test payloads - use only on authorized targets'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-5 gap-3">
                                    {[
                                        { id: 'testSqlInjection', label: 'SQL Injection' },
                                        { id: 'testXss', label: 'XSS' },
                                        { id: 'testCsrf', label: 'CSRF' },
                                        { id: 'testHeaders', label: 'Headers' },
                                        { id: 'testAuthentication', label: 'Auth' }
                                    ].map((test) => (
                                        <div key={test.id} className="flex items-center gap-2 p-3 rounded-lg border">
                                            <Switch
                                                id={test.id}
                                                checked={vaptConfig[test.id as keyof typeof vaptConfig] as boolean}
                                                onCheckedChange={(checked) => setVaptConfig({ ...vaptConfig, [test.id]: checked })}
                                            />
                                            <Label htmlFor={test.id} className="text-sm">{test.label}</Label>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    className="w-full bg-orange-600 hover:bg-orange-700"
                                    onClick={handleStartVAPTScan}
                                    disabled={vaptScanning || !vaptTarget}
                                >
                                    {vaptScanning ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            Running VAPT Scan...
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-4 h-4 mr-2" />
                                            Start VAPT Scan
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* OWASP Top 10 Categories */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">OWASP Top 10 (2021)</CardTitle>
                                <CardDescription>Common web application security risks</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-5 gap-3">
                                    {owaspCategories.map((cat) => (
                                        <div key={cat.id} className={`p-3 rounded-lg ${cat.color}`}>
                                            <p className="font-bold text-sm">{cat.id}</p>
                                            <p className="text-xs mt-1">{cat.name}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {vaptResult && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>VAPT Scan Results</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-4 gap-4">
                                        <div className="text-center p-6 rounded-lg bg-red-50">
                                            <p className="text-3xl font-bold text-red-600">{vaptResult.critical_count || 0}</p>
                                            <p className="text-sm text-gray-600 mt-1">Critical</p>
                                        </div>
                                        <div className="text-center p-6 rounded-lg bg-orange-50">
                                            <p className="text-3xl font-bold text-orange-600">{vaptResult.high_count || 0}</p>
                                            <p className="text-sm text-gray-600 mt-1">High</p>
                                        </div>
                                        <div className="text-center p-6 rounded-lg bg-yellow-50">
                                            <p className="text-3xl font-bold text-yellow-600">{vaptResult.medium_count || 0}</p>
                                            <p className="text-sm text-gray-600 mt-1">Medium</p>
                                        </div>
                                        <div className="text-center p-6 rounded-lg bg-blue-50">
                                            <p className="text-3xl font-bold text-blue-600">{vaptResult.low_count || 0}</p>
                                            <p className="text-sm text-gray-600 mt-1">Low</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* Compliance Tab */}
                {activeModule === 'compliance' && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ClipboardCheck className="w-5 h-5 text-blue-600" />
                                    Compliance Dashboard
                                </CardTitle>
                                <CardDescription>
                                    Track compliance with industry standards and generate audit-ready reports
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Select Framework</Label>
                                    <Select value={selectedFramework} onValueChange={setSelectedFramework}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select a compliance framework" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {frameworks.map((fw) => (
                                                <SelectItem key={fw.id} value={fw.id}>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{fw.name}</span>
                                                        <span className="text-gray-500 text-sm">- {fw.description}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                    onClick={handleGenerateComplianceReport}
                                    disabled={generatingReport}
                                >
                                    {generatingReport ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            Generating Report...
                                        </>
                                    ) : (
                                        <>
                                            <ClipboardCheck className="w-4 h-4 mr-2" />
                                            Generate Compliance Report
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Framework Cards */}
                        <div className="grid grid-cols-3 gap-6">
                            {frameworks.map((framework) => {
                                const isSelected = selectedFramework === framework.id
                                const hasResult = complianceResult && selectedFramework === framework.id

                                return (
                                    <Card
                                        key={framework.id}
                                        className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
                                        onClick={() => setSelectedFramework(framework.id)}
                                    >
                                        <CardContent className="pt-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-lg font-bold text-gray-900">{framework.name}</h3>
                                                {hasResult ? (
                                                    <Badge className="bg-green-100 text-green-700">Assessed</Badge>
                                                ) : (
                                                    <Badge variant="outline">Not assessed</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 mb-4">{framework.description}</p>
                                            <Progress value={hasResult ? (complianceResult.compliance_percentage || 0) : 0} className="h-2 mb-2" />
                                            <p className="text-sm text-gray-500">
                                                {hasResult ? `${complianceResult.compliance_percentage || 0}% compliant` : '0% compliant'}
                                            </p>
                                            {isSelected && (
                                                <div className="mt-4 flex items-center gap-2 text-blue-600">
                                                    <Check className="w-4 h-4" />
                                                    <span className="text-sm font-medium">Selected</span>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>

                        {complianceResult && (
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle>Compliance Report</CardTitle>
                                        <Button variant="outline" size="sm">
                                            <Download className="w-4 h-4 mr-2" />
                                            Export PDF
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-center p-6 rounded-lg bg-green-50">
                                            <p className="text-3xl font-bold text-green-600">{complianceResult.passed_controls || 0}</p>
                                            <p className="text-sm text-gray-600 mt-1">Controls Passed</p>
                                        </div>
                                        <div className="text-center p-6 rounded-lg bg-yellow-50">
                                            <p className="text-3xl font-bold text-yellow-600">{complianceResult.partial_controls || 0}</p>
                                            <p className="text-sm text-gray-600 mt-1">Partial</p>
                                        </div>
                                        <div className="text-center p-6 rounded-lg bg-red-50">
                                            <p className="text-3xl font-bold text-red-600">{complianceResult.failed_controls || 0}</p>
                                            <p className="text-sm text-gray-600 mt-1">Failed</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* Policy Tab */}
                {activeModule === 'policy' && (
                    <PolicyPanel projectId={projectId} apiUrl={API_URL} />
                )}
            </div>
        </div>
    )
}
