'use client'

import { useState, useEffect } from 'react'
import {
    Code2, Play, RefreshCw, AlertTriangle, FileCode, ChevronDown, ChevronRight,
    Filter, Search, Eye, Copy, ExternalLink, Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

interface SASTScan {
    id: string
    human_id: string
    name: string
    status: string
    engines: string[]
    total_findings: number
    critical_count: number
    high_count: number
    medium_count: number
    low_count: number
    files_scanned: number
    created_at: string
}

interface SASTFinding {
    id: string
    rule_id: string
    rule_name: string
    engine: string
    severity: string
    file_path: string
    start_line: number
    end_line?: number
    code_snippet?: string
    title: string
    description?: string
    remediation?: string
    cwe_id?: string
    ai_fix_suggestion?: string
    status: string
}

interface SASTProps {
    projectId: string
    apiUrl: string
}

export function SASTPanel({ projectId, apiUrl }: SASTProps) {
    const [repoPath, setRepoPath] = useState('')
    const [scanning, setScanning] = useState(false)
    const [scanProgress, setScanProgress] = useState(0)
    const [currentScan, setCurrentScan] = useState<SASTScan | null>(null)
    const [findings, setFindings] = useState<SASTFinding[]>([])
    const [expandedFinding, setExpandedFinding] = useState<string | null>(null)
    const [filterSeverity, setFilterSeverity] = useState<string>('all')

    const [engines, setEngines] = useState({
        semgrep: true,
        bandit: true,
        eslint: true,
        custom: true
    })

    const getToken = () => localStorage.getItem('access_token')

    const startScan = async () => {
        if (!repoPath) {
            toast.error('Please enter a repository path')
            return
        }

        setScanning(true)
        setScanProgress(0)

        try {
            const response = await fetch(`${apiUrl}/api/v1/security-advanced/sast/scans?project_id=${projectId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({
                    name: `SAST Scan - ${new Date().toLocaleDateString()}`,
                    repo_path: repoPath,
                    engines: Object.entries(engines).filter(([_, v]) => v).map(([k]) => k)
                })
            })

            if (response.ok) {
                const scan = await response.json()
                setCurrentScan(scan)
                toast.success('SAST scan started')
                pollScanStatus(scan.id)
            } else {
                throw new Error('Failed to start scan')
            }
        } catch (error) {
            console.error('SAST scan failed:', error)
            toast.error('Failed to start SAST scan')
            setScanning(false)
        }
    }

    const pollScanStatus = async (scanId: string) => {
        const interval = setInterval(async () => {
            try {
                const response = await fetch(`${apiUrl}/api/v1/security-advanced/sast/scans/${scanId}`, {
                    headers: { 'Authorization': `Bearer ${getToken()}` }
                })

                if (response.ok) {
                    const scan = await response.json()
                    setCurrentScan(scan)

                    // Simulate progress based on status
                    if (scan.status === 'running') {
                        setScanProgress(p => Math.min(p + 10, 90))
                    }

                    if (scan.status === 'completed' || scan.status === 'failed') {
                        clearInterval(interval)
                        setScanning(false)
                        setScanProgress(100)

                        if (scan.status === 'completed') {
                            toast.success(`Scan completed - ${scan.total_findings} findings`)
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
            const response = await fetch(`${apiUrl}/api/v1/security-advanced/sast/scans/${scanId}/findings?limit=100`, {
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

    const getEngineColor = (engine: string) => {
        switch (engine.toLowerCase()) {
            case 'semgrep': return 'bg-purple-100 text-purple-700'
            case 'bandit': return 'bg-green-100 text-green-700'
            case 'eslint': return 'bg-yellow-100 text-yellow-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    const filteredFindings = findings.filter(f =>
        filterSeverity === 'all' || f.severity.toLowerCase() === filterSeverity
    )

    return (
        <div className="space-y-6">
            {/* Scan Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Code2 className="w-5 h-5 text-purple-600" />
                        Native SAST Scanner
                    </CardTitle>
                    <CardDescription>
                        Static Application Security Testing using Semgrep, Bandit, ESLint, and custom patterns
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Repository Path</Label>
                        <div className="flex gap-3">
                            <Input
                                placeholder="/path/to/repository or https://github.com/org/repo"
                                value={repoPath}
                                onChange={(e) => setRepoPath(e.target.value)}
                                className="flex-1"
                            />
                            <Button
                                className="bg-purple-600 hover:bg-purple-700"
                                onClick={startScan}
                                disabled={scanning || !repoPath}
                            >
                                {scanning ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        Scanning...
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4 mr-2" />
                                        Start SAST Scan
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Engine Selection */}
                    <div className="grid grid-cols-4 gap-4">
                        {[
                            { id: 'semgrep', label: 'Semgrep', desc: 'Multi-language' },
                            { id: 'bandit', label: 'Bandit', desc: 'Python security' },
                            { id: 'eslint', label: 'ESLint', desc: 'JS/TS security' },
                            { id: 'custom', label: 'Custom', desc: 'Regex patterns' }
                        ].map((engine) => (
                            <div key={engine.id} className="flex items-center justify-between p-4 rounded-lg border">
                                <div>
                                    <Label className="font-medium">{engine.label}</Label>
                                    <p className="text-xs text-gray-500">{engine.desc}</p>
                                </div>
                                <Switch
                                    checked={engines[engine.id as keyof typeof engines]}
                                    onCheckedChange={(checked) => setEngines({ ...engines, [engine.id]: checked })}
                                />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Scan Progress */}
            {scanning && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-600">Analyzing code...</span>
                                <span className="font-bold text-purple-600">{scanProgress}%</span>
                            </div>
                            <Progress value={scanProgress} className="h-2" />
                            <div className="flex items-center gap-2 text-gray-500">
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Running security analysis with {Object.entries(engines).filter(([_, v]) => v).length} engines</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Scan Results Summary */}
            {currentScan && currentScan.status === 'completed' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Scan Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-6 gap-4">
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <p className="text-2xl font-bold text-gray-900">{currentScan.total_findings}</p>
                                <p className="text-sm text-gray-500">Total</p>
                            </div>
                            <div className="text-center p-4 bg-red-50 rounded-lg">
                                <p className="text-2xl font-bold text-red-600">{currentScan.critical_count}</p>
                                <p className="text-sm text-gray-500">Critical</p>
                            </div>
                            <div className="text-center p-4 bg-orange-50 rounded-lg">
                                <p className="text-2xl font-bold text-orange-600">{currentScan.high_count}</p>
                                <p className="text-sm text-gray-500">High</p>
                            </div>
                            <div className="text-center p-4 bg-yellow-50 rounded-lg">
                                <p className="text-2xl font-bold text-yellow-600">{currentScan.medium_count}</p>
                                <p className="text-sm text-gray-500">Medium</p>
                            </div>
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                                <p className="text-2xl font-bold text-blue-600">{currentScan.low_count}</p>
                                <p className="text-sm text-gray-500">Low</p>
                            </div>
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <p className="text-2xl font-bold text-gray-600">{currentScan.files_scanned}</p>
                                <p className="text-sm text-gray-500">Files</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Findings List */}
            {findings.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Findings ({filteredFindings.length})</CardTitle>
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-gray-500" />
                                <select
                                    value={filterSeverity}
                                    onChange={(e) => setFilterSeverity(e.target.value)}
                                    className="text-sm border rounded-md px-2 py-1"
                                >
                                    <option value="all">All Severities</option>
                                    <option value="critical">Critical</option>
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {filteredFindings.map((finding) => (
                                <div
                                    key={finding.id}
                                    className="border rounded-lg overflow-hidden"
                                >
                                    <div
                                        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50"
                                        onClick={() => setExpandedFinding(expandedFinding === finding.id ? null : finding.id)}
                                    >
                                        {expandedFinding === finding.id ? (
                                            <ChevronDown className="w-4 h-4 text-gray-400" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4 text-gray-400" />
                                        )}
                                        <Badge className={getSeverityColor(finding.severity)}>
                                            {finding.severity}
                                        </Badge>
                                        <Badge className={getEngineColor(finding.engine)}>
                                            {finding.engine}
                                        </Badge>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-gray-900 truncate">{finding.title}</h4>
                                            <p className="text-sm text-gray-500 truncate">
                                                {finding.file_path}:{finding.start_line}
                                            </p>
                                        </div>
                                        {finding.cwe_id && (
                                            <Badge variant="outline">{finding.cwe_id}</Badge>
                                        )}
                                    </div>

                                    {expandedFinding === finding.id && (
                                        <div className="border-t bg-gray-50 p-4 space-y-4">
                                            {finding.description && (
                                                <div>
                                                    <h5 className="text-sm font-medium text-gray-700 mb-1">Description</h5>
                                                    <p className="text-sm text-gray-600">{finding.description}</p>
                                                </div>
                                            )}

                                            {finding.code_snippet && (
                                                <div>
                                                    <h5 className="text-sm font-medium text-gray-700 mb-1">Code</h5>
                                                    <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
                                                        {finding.code_snippet}
                                                    </pre>
                                                </div>
                                            )}

                                            {finding.remediation && (
                                                <div>
                                                    <h5 className="text-sm font-medium text-gray-700 mb-1">Remediation</h5>
                                                    <p className="text-sm text-gray-600">{finding.remediation}</p>
                                                </div>
                                            )}

                                            {finding.ai_fix_suggestion && (
                                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                                    <h5 className="text-sm font-medium text-purple-700 mb-2 flex items-center gap-2">
                                                        <Sparkles className="w-4 h-4" />
                                                        AI Fix Suggestion
                                                    </h5>
                                                    <pre className="bg-white text-gray-800 p-3 rounded text-xs overflow-x-auto border">
                                                        {finding.ai_fix_suggestion}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
