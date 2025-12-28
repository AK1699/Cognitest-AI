'use client'

import React, { useState } from 'react'
import {
    Globe, Lock, Unlock, Shield, ShieldAlert, ShieldCheck,
    ArrowRight, AlertTriangle, CheckCircle, XCircle, Clock,
    Server, Wifi, Key, FileWarning, RefreshCw, Play,
    ExternalLink, Copy, ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'

interface URLSecurityPanelProps {
    projectId: string
    onScanComplete?: (scanId: string) => void
}

interface ScanConfig {
    targetUrl: string
    checkSsl: boolean
    checkHeaders: boolean
    checkSubdomains: boolean
    checkPorts: boolean
    scanDepth: 'quick' | 'standard' | 'deep'
}

interface SSLResult {
    isValid: boolean
    grade: string
    issuer: string
    expiresAt: string
    daysUntilExpiry: number
    issues: string[]
}

interface HeaderResult {
    header: string
    present: boolean
    value?: string
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
}

interface PortResult {
    port: number
    state: 'open' | 'closed' | 'filtered'
    service: string
    isSecure: boolean
}

export function URLSecurityPanel({ projectId, onScanComplete }: URLSecurityPanelProps) {
    const [config, setConfig] = useState<ScanConfig>({
        targetUrl: '',
        checkSsl: true,
        checkHeaders: true,
        checkSubdomains: true,
        checkPorts: true,
        scanDepth: 'standard'
    })
    const [scanning, setScanning] = useState(false)
    const [progress, setProgress] = useState(0)
    const [result, setResult] = useState<any>(null)

    const handleStartScan = async () => {
        if (!config.targetUrl) return

        setScanning(true)
        setProgress(0)
        setResult(null)

        try {
            const response = await fetch(`/api/v1/security/url/scan?project_id=${projectId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    target_url: config.targetUrl,
                    scan_depth: config.scanDepth,
                    check_ssl: config.checkSsl,
                    check_headers: config.checkHeaders,
                    check_subdomains: config.checkSubdomains,
                    check_ports: config.checkPorts
                })
            })

            if (response.ok) {
                const data = await response.json()

                // Poll for progress
                const pollProgress = setInterval(async () => {
                    const statusResponse = await fetch(`/api/v1/security/scans/${data.id}`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    })

                    if (statusResponse.ok) {
                        const statusData = await statusResponse.json()
                        setProgress(statusData.progress_percentage)

                        if (statusData.status === 'completed' || statusData.status === 'failed') {
                            clearInterval(pollProgress)
                            setScanning(false)
                            setResult(statusData)
                            onScanComplete?.(data.id)
                        }
                    }
                }, 2000)
            }
        } catch (error) {
            console.error('Scan failed:', error)
            setScanning(false)
        }
    }

    const getSSLGradeColor = (grade: string) => {
        switch (grade) {
            case 'A+':
            case 'A':
                return 'text-green-600 bg-green-100'
            case 'B':
                return 'text-blue-600 bg-blue-100'
            case 'C':
                return 'text-yellow-600 bg-yellow-100'
            case 'D':
                return 'text-orange-600 bg-orange-100'
            case 'F':
                return 'text-red-600 bg-red-100'
            default:
                return 'text-gray-600 bg-gray-100'
        }
    }

    return (
        <div className="space-y-6">
            {/* Scan Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-teal-600" />
                        URL Security Scanner
                    </CardTitle>
                    <CardDescription>
                        Analyze your website's security posture including SSL/TLS, headers, and more
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Target URL */}
                    <div className="space-y-2">
                        <Label htmlFor="target-url">Target URL</Label>
                        <div className="flex gap-2">
                            <Input
                                id="target-url"
                                placeholder="https://example.com"
                                value={config.targetUrl}
                                onChange={(e) => setConfig({ ...config, targetUrl: e.target.value })}
                                className="flex-1"
                            />
                            <Button
                                className="bg-teal-600 hover:bg-teal-700"
                                onClick={handleStartScan}
                                disabled={scanning || !config.targetUrl}
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

                    {/* Scan Options */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-2">
                                <Lock className="w-4 h-4 text-green-600" />
                                <Label htmlFor="check-ssl" className="text-sm">SSL/TLS</Label>
                            </div>
                            <Switch
                                id="check-ssl"
                                checked={config.checkSsl}
                                onCheckedChange={(checked) => setConfig({ ...config, checkSsl: checked })}
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-2">
                                <FileWarning className="w-4 h-4 text-blue-600" />
                                <Label htmlFor="check-headers" className="text-sm">Headers</Label>
                            </div>
                            <Switch
                                id="check-headers"
                                checked={config.checkHeaders}
                                onCheckedChange={(checked) => setConfig({ ...config, checkHeaders: checked })}
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-purple-600" />
                                <Label htmlFor="check-subdomains" className="text-sm">Subdomains</Label>
                            </div>
                            <Switch
                                id="check-subdomains"
                                checked={config.checkSubdomains}
                                onCheckedChange={(checked) => setConfig({ ...config, checkSubdomains: checked })}
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-2">
                                <Server className="w-4 h-4 text-orange-600" />
                                <Label htmlFor="check-ports" className="text-sm">Ports</Label>
                            </div>
                            <Switch
                                id="check-ports"
                                checked={config.checkPorts}
                                onCheckedChange={(checked) => setConfig({ ...config, checkPorts: checked })}
                            />
                        </div>
                    </div>

                    {/* Scan Depth */}
                    <div className="space-y-2">
                        <Label>Scan Depth</Label>
                        <div className="flex gap-2">
                            {['quick', 'standard', 'deep'].map((depth) => (
                                <Button
                                    key={depth}
                                    variant={config.scanDepth === depth ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setConfig({ ...config, scanDepth: depth as any })}
                                    className={config.scanDepth === depth ? 'bg-teal-600 hover:bg-teal-700' : ''}
                                >
                                    {depth.charAt(0).toUpperCase() + depth.slice(1)}
                                </Button>
                            ))}
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
                                <span className="text-sm font-medium text-gray-600">Scanning in progress...</span>
                                <span className="text-sm font-medium text-teal-600">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Analyzing {config.targetUrl}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Results */}
            {result && (
                <div className="space-y-4">
                    {/* Summary */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">Scan Results</CardTitle>
                                <Badge className={result.risk_grade === 'A' || result.risk_grade === 'A+'
                                    ? 'bg-green-100 text-green-700'
                                    : result.risk_grade === 'F'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                }>
                                    Risk Grade: {result.risk_grade}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center p-4 rounded-lg bg-red-50">
                                    <p className="text-2xl font-bold text-red-600">{result.critical_count}</p>
                                    <p className="text-sm text-gray-600">Critical</p>
                                </div>
                                <div className="text-center p-4 rounded-lg bg-orange-50">
                                    <p className="text-2xl font-bold text-orange-600">{result.high_count}</p>
                                    <p className="text-sm text-gray-600">High</p>
                                </div>
                                <div className="text-center p-4 rounded-lg bg-yellow-50">
                                    <p className="text-2xl font-bold text-yellow-600">{result.medium_count}</p>
                                    <p className="text-sm text-gray-600">Medium</p>
                                </div>
                                <div className="text-center p-4 rounded-lg bg-blue-50">
                                    <p className="text-2xl font-bold text-blue-600">{result.low_count}</p>
                                    <p className="text-sm text-gray-600">Low</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Detailed Results Tabs */}
                    <Tabs defaultValue="summary" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="summary">Summary</TabsTrigger>
                            <TabsTrigger value="ssl">SSL/TLS</TabsTrigger>
                            <TabsTrigger value="headers">Headers</TabsTrigger>
                            <TabsTrigger value="ports">Ports</TabsTrigger>
                        </TabsList>

                        <TabsContent value="summary" className="mt-4">
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="space-y-4">
                                        <p className="text-gray-600">
                                            Scan completed at {new Date(result.completed_at).toLocaleString()}
                                        </p>
                                        <p className="text-gray-600">
                                            Total vulnerabilities found: {result.total_vulnerabilities}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="ssl" className="mt-4">
                            <Card>
                                <CardContent className="pt-6">
                                    {result.targets?.[0]?.ssl_certificate ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`text-4xl font-bold px-4 py-2 rounded-lg ${getSSLGradeColor(result.targets[0].ssl_grade)}`}>
                                                    {result.targets[0].ssl_grade}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold">SSL Certificate</h3>
                                                    <p className="text-sm text-gray-500">
                                                        Expires in {result.targets[0].ssl_certificate.days_until_expiry} days
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500">No SSL data available</p>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="headers" className="mt-4">
                            <Card>
                                <CardContent className="pt-6">
                                    {result.targets?.[0]?.http_headers ? (
                                        <div className="space-y-2">
                                            {result.targets[0].http_headers.missing?.map((header: string) => (
                                                <div key={header} className="flex items-center gap-2 p-2 rounded bg-red-50">
                                                    <XCircle className="w-4 h-4 text-red-500" />
                                                    <span className="text-sm">{header} - Missing</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500">No header data available</p>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="ports" className="mt-4">
                            <Card>
                                <CardContent className="pt-6">
                                    {result.targets?.[0]?.open_ports?.length > 0 ? (
                                        <div className="space-y-2">
                                            {result.targets[0].open_ports.map((port: any) => (
                                                <div key={port.port} className={`flex items-center justify-between p-3 rounded ${port.is_secure ? 'bg-green-50' : 'bg-red-50'
                                                    }`}>
                                                    <div className="flex items-center gap-2">
                                                        {port.is_secure ? (
                                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                                        ) : (
                                                            <AlertTriangle className="w-4 h-4 text-red-500" />
                                                        )}
                                                        <span className="font-mono">{port.port}</span>
                                                        <span className="text-gray-500">{port.service}</span>
                                                    </div>
                                                    <Badge className={port.state === 'open' ? 'bg-green-500' : 'bg-gray-500'}>
                                                        {port.state}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500">No open ports detected</p>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            )}
        </div>
    )
}

export default URLSecurityPanel
