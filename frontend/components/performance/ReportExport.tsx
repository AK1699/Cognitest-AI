'use client'

import React, { useState } from 'react'
import {
    FileText,
    Download,
    FileDown,
    Share2,
    Copy,
    Check,
    Loader2,
    FileCode,
    Mail,
    ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface ReportData {
    testId: string
    testName: string
    testType: 'lighthouse' | 'load' | 'stress'
    projectName: string
    timestamp: string
    targetUrl: string
    summary: {
        status: 'pass' | 'fail' | 'warning'
        overallScore?: number
        totalRequests?: number
        errorRate?: number
    }
    metrics: Record<string, any>
    recommendations?: string[]
}

interface ReportExportProps {
    data: ReportData
    onExport?: (format: 'pdf' | 'html' | 'json') => Promise<void>
}

/**
 * Report Export Component
 * Generate and download performance test reports in various formats
 */
export function ReportExport({ data, onExport }: ReportExportProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [exportFormat, setExportFormat] = useState<'pdf' | 'html' | 'json'>('pdf')
    const [copied, setCopied] = useState(false)
    const [emailTo, setEmailTo] = useState('')

    const handleExport = async (format: 'pdf' | 'html' | 'json') => {
        setIsExporting(true)
        setExportFormat(format)

        try {
            if (onExport) {
                await onExport(format)
            } else {
                // Default export behavior - generate client-side
                await generateReport(format)
            }
        } catch (error) {
            console.error('Export failed:', error)
        } finally {
            setIsExporting(false)
        }
    }

    const generateReport = async (format: 'pdf' | 'html' | 'json') => {
        // Simulate export delay
        await new Promise(resolve => setTimeout(resolve, 1500))

        if (format === 'json') {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
            downloadBlob(blob, `${data.testName.replace(/\s+/g, '_')}_report.json`)
        } else if (format === 'html') {
            const html = generateHTMLReport(data)
            const blob = new Blob([html], { type: 'text/html' })
            downloadBlob(blob, `${data.testName.replace(/\s+/g, '_')}_report.html`)
        } else {
            // For PDF, we'd typically call a backend endpoint
            // For now, we'll generate HTML and prompt user
            const html = generateHTMLReport(data)
            const blob = new Blob([html], { type: 'text/html' })
            downloadBlob(blob, `${data.testName.replace(/\s+/g, '_')}_report.html`)
            alert('PDF generation requires backend support. Downloaded as HTML instead.')
        }
    }

    const downloadBlob = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const copyShareLink = () => {
        const shareUrl = `${window.location.origin}/reports/${data.testId}`
        navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pass': return 'bg-green-100 text-green-700'
            case 'fail': return 'bg-red-100 text-red-700'
            case 'warning': return 'bg-amber-100 text-amber-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Export Report
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-teal-600" />
                        Export Report
                    </DialogTitle>
                    <DialogDescription>
                        Download or share your performance test results
                    </DialogDescription>
                </DialogHeader>

                {/* Report Preview */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <h4 className="font-semibold text-gray-900">{data.testName}</h4>
                            <p className="text-sm text-gray-500">{data.projectName}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(data.summary.status)}`}>
                            {data.summary.status.toUpperCase()}
                        </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                            <p className="text-gray-500">Type</p>
                            <p className="font-medium text-gray-900 capitalize">{data.testType}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Date</p>
                            <p className="font-medium text-gray-900">
                                {new Date(data.timestamp).toLocaleDateString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-500">
                                {data.summary.overallScore !== undefined ? 'Score' : 'Requests'}
                            </p>
                            <p className="font-medium text-gray-900">
                                {data.summary.overallScore !== undefined
                                    ? `${data.summary.overallScore}/100`
                                    : data.summary.totalRequests?.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Export Options */}
                <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Download Format</h4>
                    <div className="grid grid-cols-3 gap-3">
                        <button
                            onClick={() => handleExport('pdf')}
                            disabled={isExporting}
                            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-teal-300 hover:bg-teal-50 transition-colors disabled:opacity-50"
                        >
                            {isExporting && exportFormat === 'pdf' ? (
                                <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
                            ) : (
                                <FileDown className="w-6 h-6 text-red-500" />
                            )}
                            <span className="text-sm font-medium">PDF</span>
                        </button>
                        <button
                            onClick={() => handleExport('html')}
                            disabled={isExporting}
                            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-teal-300 hover:bg-teal-50 transition-colors disabled:opacity-50"
                        >
                            {isExporting && exportFormat === 'html' ? (
                                <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
                            ) : (
                                <FileCode className="w-6 h-6 text-orange-500" />
                            )}
                            <span className="text-sm font-medium">HTML</span>
                        </button>
                        <button
                            onClick={() => handleExport('json')}
                            disabled={isExporting}
                            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-teal-300 hover:bg-teal-50 transition-colors disabled:opacity-50"
                        >
                            {isExporting && exportFormat === 'json' ? (
                                <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
                            ) : (
                                <FileText className="w-6 h-6 text-blue-500" />
                            )}
                            <span className="text-sm font-medium">JSON</span>
                        </button>
                    </div>
                </div>

                {/* Share Options */}
                <div className="space-y-3 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700">Share</h4>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-2"
                            onClick={copyShareLink}
                        >
                            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copied!' : 'Copy Link'}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-2"
                            onClick={() => window.open(`mailto:?subject=Performance Report: ${data.testName}&body=View the report: ${window.location.origin}/reports/${data.testId}`)}
                        >
                            <Mail className="w-4 h-4" />
                            Email
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

/**
 * Generate HTML report content
 */
function generateHTMLReport(data: ReportData): string {
    const getScoreColor = (score: number) => {
        if (score >= 90) return '#10B981'
        if (score >= 50) return '#F59E0B'
        return '#EF4444'
    }

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Report - ${data.testName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .header h1 { font-size: 28px; color: #0f172a; margin-bottom: 8px; }
        .header p { color: #64748b; }
        .card { background: white; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .card h2 { font-size: 18px; color: #0f172a; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0; }
        .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .summary-item { text-align: center; }
        .summary-item .label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        .summary-item .value { font-size: 24px; font-weight: 700; margin-top: 4px; }
        .metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .metric { padding: 16px; background: #f8fafc; border-radius: 8px; }
        .metric .name { font-size: 14px; color: #64748b; margin-bottom: 4px; }
        .metric .value { font-size: 20px; font-weight: 600; color: #0f172a; }
        .recommendations { list-style: none; }
        .recommendations li { padding: 12px 16px; background: #f0fdf4; border-left: 3px solid #10b981; margin-bottom: 8px; border-radius: 0 8px 8px 0; }
        .footer { text-align: center; color: #94a3b8; font-size: 12px; margin-top: 40px; }
        .status { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
        .status-pass { background: #dcfce7; color: #166534; }
        .status-fail { background: #fee2e2; color: #991b1b; }
        .status-warning { background: #fef3c7; color: #92400e; }
        @media print { body { background: white; } .card { box-shadow: none; border: 1px solid #e2e8f0; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Performance Report</h1>
            <p>${data.testName} • ${new Date(data.timestamp).toLocaleString()}</p>
        </div>

        <div class="card">
            <h2>Summary</h2>
            <div class="summary">
                <div class="summary-item">
                    <div class="label">Status</div>
                    <div class="value">
                        <span class="status status-${data.summary.status}">${data.summary.status.toUpperCase()}</span>
                    </div>
                </div>
                <div class="summary-item">
                    <div class="label">Test Type</div>
                    <div class="value">${data.testType.charAt(0).toUpperCase() + data.testType.slice(1)}</div>
                </div>
                <div class="summary-item">
                    <div class="label">${data.summary.overallScore !== undefined ? 'Score' : 'Total Requests'}</div>
                    <div class="value" style="color: ${data.summary.overallScore ? getScoreColor(data.summary.overallScore) : '#0f172a'}">
                        ${data.summary.overallScore !== undefined ? data.summary.overallScore : data.summary.totalRequests?.toLocaleString() || '—'}
                    </div>
                </div>
            </div>
        </div>

        <div class="card">
            <h2>Target</h2>
            <p style="color: #3b82f6;">${data.targetUrl}</p>
        </div>

        <div class="card">
            <h2>Metrics</h2>
            <div class="metrics">
                ${Object.entries(data.metrics).map(([key, value]) => `
                    <div class="metric">
                        <div class="name">${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</div>
                        <div class="value">${typeof value === 'number' ? value.toLocaleString() : value}</div>
                    </div>
                `).join('')}
            </div>
        </div>

        ${data.recommendations && data.recommendations.length > 0 ? `
        <div class="card">
            <h2>Recommendations</h2>
            <ul class="recommendations">
                ${data.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
        ` : ''}

        <div class="footer">
            <p>Generated by CogniTest Performance Testing</p>
            <p>Report ID: ${data.testId}</p>
        </div>
    </div>
</body>
</html>
`
}

// Demo report data
export const demoReportData: ReportData = {
    testId: 'test-123-abc',
    testName: 'Homepage Performance Audit',
    testType: 'lighthouse',
    projectName: 'E-Commerce Platform',
    timestamp: new Date().toISOString(),
    targetUrl: 'https://example.com',
    summary: {
        status: 'pass',
        overallScore: 87
    },
    metrics: {
        'Performance': 87,
        'Accessibility': 92,
        'Best Practices': 83,
        'SEO': 95,
        'LCP': '2.1s',
        'FID': '45ms',
        'CLS': 0.08
    },
    recommendations: [
        'Optimize images by using WebP format and lazy loading',
        'Reduce JavaScript bundle size by code splitting',
        'Enable text compression (Gzip/Brotli) on the server',
        'Preload critical fonts to improve LCP'
    ]
}
