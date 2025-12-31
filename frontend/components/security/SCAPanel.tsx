'use client'

import { useState, useEffect } from 'react'
import {
    Package, Play, RefreshCw, AlertTriangle, Shield, ExternalLink,
    Filter, ChevronDown, ChevronRight, FileWarning, Scale
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

interface SCAScan {
    id: string
    human_id: string
    name: string
    status: string
    total_dependencies: number
    vulnerable_dependencies: number
    license_issues: number
    critical_vulns: number
    high_vulns: number
    created_at: string
}

interface SCAFinding {
    id: string
    package_name: string
    package_version: string
    package_ecosystem: string
    cve_id?: string
    severity: string
    title: string
    fixed_version?: string
    is_direct: boolean
    is_license_issue: boolean
    license_name?: string
}

interface SCAProps {
    projectId: string
    apiUrl: string
}

export function SCAPanel({ projectId, apiUrl }: SCAProps) {
    const [projectPath, setProjectPath] = useState('')
    const [scanning, setScanning] = useState(false)
    const [scanProgress, setScanProgress] = useState(0)
    const [currentScan, setCurrentScan] = useState<SCAScan | null>(null)
    const [findings, setFindings] = useState<SCAFinding[]>([])
    const [activeTab, setActiveTab] = useState<'vulnerabilities' | 'licenses'>('vulnerabilities')
    const [checkLicenses, setCheckLicenses] = useState(true)
    const [checkVulns, setCheckVulns] = useState(true)

    const getToken = () => localStorage.getItem('access_token')

    const startScan = async () => {
        if (!projectPath) {
            toast.error('Please enter a project path')
            return
        }

        setScanning(true)
        setScanProgress(0)

        try {
            const response = await fetch(`${apiUrl}/api/v1/security-advanced/sca/scans?project_id=${projectId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({
                    name: `SCA Scan - ${new Date().toLocaleDateString()}`,
                    project_path: projectPath,
                    check_licenses: checkLicenses,
                    check_vulnerabilities: checkVulns
                })
            })

            if (response.ok) {
                const scan = await response.json()
                setCurrentScan(scan)
                toast.success('SCA scan started')
                pollScanStatus(scan.id)
            } else {
                throw new Error('Failed to start scan')
            }
        } catch (error) {
            console.error('SCA scan failed:', error)
            toast.error('Failed to start SCA scan')
            setScanning(false)
        }
    }

    const pollScanStatus = async (scanId: string) => {
        const interval = setInterval(async () => {
            try {
                const response = await fetch(`${apiUrl}/api/v1/security-advanced/sca/scans/${scanId}`, {
                    headers: { 'Authorization': `Bearer ${getToken()}` }
                })

                if (response.ok) {
                    const scan = await response.json()
                    setCurrentScan(scan)

                    if (scan.status === 'running') {
                        setScanProgress(p => Math.min(p + 15, 90))
                    }

                    if (scan.status === 'completed' || scan.status === 'failed') {
                        clearInterval(interval)
                        setScanning(false)
                        setScanProgress(100)

                        if (scan.status === 'completed') {
                            toast.success(`Scan completed - ${scan.vulnerable_dependencies} vulnerable packages`)
                            fetchFindings(scanId)
                        } else {
                            toast.error('Scan failed')
                        }
                    }
                }
            } catch (error) {
                clearInterval(interval)
                setScanning(false)
            }
        }, 2000)
    }

    const fetchFindings = async (scanId: string) => {
        try {
            const response = await fetch(`${apiUrl}/api/v1/security-advanced/sca/scans/${scanId}/findings?limit=100`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            })

            if (response.ok) {
                setFindings(await response.json())
            }
        } catch (error) {
            console.error('Failed to fetch findings:', error)
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

    const getEcosystemColor = (ecosystem: string) => {
        switch (ecosystem.toLowerCase()) {
            case 'npm': return 'bg-red-100 text-red-700'
            case 'pypi': return 'bg-blue-100 text-blue-700'
            case 'go': return 'bg-cyan-100 text-cyan-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    const vulnFindings = findings.filter(f => !f.is_license_issue)
    const licenseFindings = findings.filter(f => f.is_license_issue)

    return (
        <div className="space-y-6">
            {/* Scan Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-green-600" />
                        Software Composition Analysis
                    </CardTitle>
                    <CardDescription>
                        Scan dependencies for known vulnerabilities and license compliance using pip-audit, npm audit, and OSV
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Project Path</Label>
                        <div className="flex gap-3">
                            <Input
                                placeholder="/path/to/project (with package.json or requirements.txt)"
                                value={projectPath}
                                onChange={(e) => setProjectPath(e.target.value)}
                                className="flex-1"
                            />
                            <Button
                                className="bg-green-600 hover:bg-green-700"
                                onClick={startScan}
                                disabled={scanning || !projectPath}
                            >
                                {scanning ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        Scanning...
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4 mr-2" />
                                        Start SCA Scan
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 rounded-lg border">
                            <div>
                                <Label className="font-medium">Check Vulnerabilities</Label>
                                <p className="text-xs text-gray-500">Query OSV/NVD for known CVEs</p>
                            </div>
                            <Switch
                                checked={checkVulns}
                                onCheckedChange={setCheckVulns}
                            />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-lg border">
                            <div>
                                <Label className="font-medium">Check Licenses</Label>
                                <p className="text-xs text-gray-500">Detect GPL/AGPL compliance risks</p>
                            </div>
                            <Switch
                                checked={checkLicenses}
                                onCheckedChange={setCheckLicenses}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Scan Progress */}
            {scanning && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-600">Analyzing dependencies...</span>
                                <span className="font-bold text-green-600">{scanProgress}%</span>
                            </div>
                            <Progress value={scanProgress} className="h-2" />
                            <div className="flex items-center gap-2 text-gray-500">
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Querying vulnerability databases</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Scan Results */}
            {currentScan && currentScan.status === 'completed' && (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Dependency Overview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-5 gap-4">
                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <p className="text-2xl font-bold text-gray-900">{currentScan.total_dependencies}</p>
                                    <p className="text-sm text-gray-500">Dependencies</p>
                                </div>
                                <div className="text-center p-4 bg-red-50 rounded-lg">
                                    <p className="text-2xl font-bold text-red-600">{currentScan.vulnerable_dependencies}</p>
                                    <p className="text-sm text-gray-500">Vulnerable</p>
                                </div>
                                <div className="text-center p-4 bg-red-50 rounded-lg">
                                    <p className="text-2xl font-bold text-red-600">{currentScan.critical_vulns}</p>
                                    <p className="text-sm text-gray-500">Critical</p>
                                </div>
                                <div className="text-center p-4 bg-orange-50 rounded-lg">
                                    <p className="text-2xl font-bold text-orange-600">{currentScan.high_vulns}</p>
                                    <p className="text-sm text-gray-500">High</p>
                                </div>
                                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                                    <p className="text-2xl font-bold text-yellow-600">{currentScan.license_issues}</p>
                                    <p className="text-sm text-gray-500">License Issues</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Findings Tabs */}
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                        <TabsList>
                            <TabsTrigger value="vulnerabilities" className="gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Vulnerabilities ({vulnFindings.length})
                            </TabsTrigger>
                            <TabsTrigger value="licenses" className="gap-2">
                                <Scale className="w-4 h-4" />
                                License Issues ({licenseFindings.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="vulnerabilities" className="mt-4">
                            <Card>
                                <CardContent className="pt-6">
                                    {vulnFindings.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                            <p>No vulnerable dependencies found</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {vulnFindings.map((finding) => (
                                                <div key={finding.id} className="flex items-center gap-4 p-4 rounded-lg border hover:bg-gray-50">
                                                    <Badge className={getSeverityColor(finding.severity)}>
                                                        {finding.severity}
                                                    </Badge>
                                                    <Badge className={getEcosystemColor(finding.package_ecosystem)}>
                                                        {finding.package_ecosystem}
                                                    </Badge>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-medium text-gray-900">
                                                            {finding.package_name}@{finding.package_version}
                                                        </h4>
                                                        <p className="text-sm text-gray-500 truncate">{finding.title}</p>
                                                    </div>
                                                    {finding.cve_id && (
                                                        <a
                                                            href={`https://nvd.nist.gov/vuln/detail/${finding.cve_id}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                                                        >
                                                            {finding.cve_id}
                                                            <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    )}
                                                    {finding.fixed_version && (
                                                        <Badge variant="outline" className="text-green-600 border-green-300">
                                                            Fix: {finding.fixed_version}
                                                        </Badge>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="licenses" className="mt-4">
                            <Card>
                                <CardContent className="pt-6">
                                    {licenseFindings.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            <Scale className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                            <p>No license compliance issues found</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {licenseFindings.map((finding) => (
                                                <div key={finding.id} className="flex items-center gap-4 p-4 rounded-lg border hover:bg-gray-50">
                                                    <Badge className={getSeverityColor(finding.severity)}>
                                                        {finding.severity}
                                                    </Badge>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-medium text-gray-900">
                                                            {finding.package_name}@{finding.package_version}
                                                        </h4>
                                                        <p className="text-sm text-gray-500">{finding.title}</p>
                                                    </div>
                                                    {finding.license_name && (
                                                        <Badge variant="outline" className="text-amber-600 border-amber-300">
                                                            {finding.license_name}
                                                        </Badge>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </>
            )}
        </div>
    )
}
