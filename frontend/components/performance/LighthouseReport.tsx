import React, { useState } from 'react'
import {
    AlertTriangle,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    HelpCircle,
    Info,
    ExternalLink,
    Filter
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface LighthouseReportProps {
    data: any
}

export const LighthouseReport: React.FC<LighthouseReportProps> = ({ data }) => {
    // If we only have summary metrics but no raw report, we can't show full details
    if (!data || !data.lighthouseResult) {
        return (
            <div className="p-8 text-center bg-gray-50 rounded-lg border border-dashed text-gray-500">
                <Info className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                <p>Full detailed report not available for this run.</p>
                <p className="text-sm mt-1">Try running a new audit to capture detailed data.</p>
            </div>
        )
    }

    const { lighthouseResult } = data
    const { categories, audits, fetchTime, configSettings } = lighthouseResult
    const [selectedMetric, setSelectedMetric] = useState<string | null>(null)

    // Helper to get score class
    const getScoreClass = (score: number | null) => {
        if (score === null) return 'bg-gray-100 text-gray-600'
        if (score >= 0.9) return 'text-green-600'
        if (score >= 0.5) return 'text-orange-500'
        return 'text-red-500'
    }

    // Helper to get score background class (for bars/gauges)
    const getScoreBgClass = (score: number | null) => {
        if (score === null) return 'bg-gray-200'
        if (score >= 0.9) return 'bg-green-500'
        if (score >= 0.5) return 'bg-orange-500'
        return 'bg-red-500'
    }

    const formatValue = (value: number | undefined, unit?: string) => {
        if (value === undefined) return '-'
        return `${Math.round(value * 10) / 10}${unit ? unit : ''}`
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            {/* Header / Meta Info */}
            <div className="bg-gray-50 border-b p-4 flex flex-wrap items-center justify-between gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-4">
                    <span>Generated: {new Date(fetchTime).toLocaleString()}</span>
                    <span>Lighthouse {lighthouseResult.lighthouseVersion}</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                        {configSettings?.emulatedFormFactor === 'desktop' ? 'Desktop' : 'Mobile'}
                    </span>
                    <a
                        href={lighthouseResult.requestedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-teal-600 hover:underline flex items-center gap-1"
                    >
                        {lighthouseResult.requestedUrl} <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
            </div>

            {/* Top Level Gauges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 p-8 border-b justify-items-center">
                {Object.values(categories).map((cat: any) => (
                    <Gauge
                        key={cat.id}
                        score={cat.score}
                        title={cat.title}
                    />
                ))}
            </div>

            {/* Metrics Section (Core Web Vitals) */}
            <div className="p-6 border-b">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Metrics</h3>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedMetric(null)} className={!selectedMetric ? "bg-gray-100" : ""}>All</Button>
                        <Button variant="outline" size="sm" onClick={() => setSelectedMetric('FCP')} className={selectedMetric === 'FCP' ? "bg-teal-50 border-teal-200 text-teal-700" : ""}>FCP</Button>
                        <Button variant="outline" size="sm" onClick={() => setSelectedMetric('LCP')} className={selectedMetric === 'LCP' ? "bg-teal-50 border-teal-200 text-teal-700" : ""}>LCP</Button>
                        <Button variant="outline" size="sm" onClick={() => setSelectedMetric('TBT')} className={selectedMetric === 'TBT' ? "bg-teal-50 border-teal-200 text-teal-700" : ""}>TBT</Button>
                        <Button variant="outline" size="sm" onClick={() => setSelectedMetric('CLS')} className={selectedMetric === 'CLS' ? "bg-teal-50 border-teal-200 text-teal-700" : ""}>CLS</Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                    <MetricCard
                        audit={audits['first-contentful-paint']}
                        highlight={selectedMetric === 'FCP'}
                    />
                    <MetricCard
                        audit={audits['largest-contentful-paint']}
                        highlight={selectedMetric === 'LCP'}
                    />
                    <MetricCard
                        audit={audits['total-blocking-time']}
                        highlight={selectedMetric === 'TBT'}
                    />
                    <MetricCard
                        audit={audits['cumulative-layout-shift']}
                        highlight={selectedMetric === 'CLS'}
                    />
                    <MetricCard
                        audit={audits['speed-index']}
                        highlight={false}
                    />
                </div>
            </div>

            {/* Opportunities Section */}
            <AuditSection
                title="Opportunities"
                subtitle="These suggestions can help your page load faster."
                audits={audits}
                refs={categories.performance?.auditRefs}
                filter={(ref: any) => ref.group === 'load-opportunities' && (audits[ref.id]?.score < 0.9)}
                showSavings
            />

            {/* Diagnostics Section */}
            <AuditSection
                title="Diagnostics"
                subtitle="More information about the performance of your application."
                audits={audits}
                refs={categories.performance?.auditRefs}
                filter={(ref: any) => ref.group === 'diagnostics' && (audits[ref.id]?.score !== 1)} // Showing informational and warnings
            />

            {/* Passed Audits (Collapsed by default logic inside Section) */}
            <AuditSection
                title="Passed Audits"
                audits={audits}
                refs={categories.performance?.auditRefs}
                filter={(ref: any) => audits[ref.id]?.score >= 0.9}
                defaultOpen={false}
                type="passed"
            />

        </div>
    )
}

// Sub-components

const Gauge = ({ score, title }: { score: number | null, title: string }) => {
    // Determine color based on score
    const getColor = (s: number | null) => {
        if (s === null) return '#e5e7eb' // gray-200
        if (s >= 0.9) return '#059669' // green-600
        if (s >= 0.5) return '#f97316' // orange-500
        return '#ef4444' // red-500
    }

    const value = score !== null ? Math.round(score * 100) : 0
    const color = getColor(score)

    // SVG Dash array calculation for circle
    const radius = 36
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (value / 100) * circumference

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
                    <circle
                        className="text-gray-100"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx="50"
                        cy="50"
                    />
                    <circle
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        stroke={color}
                        fill="transparent"
                        r={radius}
                        cx="50"
                        cy="50"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                <div className={`absolute text-2xl font-bold ${score !== null ? '' : 'text-gray-400'}`} style={{ color: score !== null ? color : undefined }}>
                    {score !== null ? value : '?'}
                </div>
            </div>
            <span className="font-semibold text-gray-700 text-sm">{title}</span>
        </div>
    )
}

const MetricCard = ({ audit, highlight }: { audit: any, highlight: boolean }) => {
    if (!audit) return null

    const getIcon = (score: number) => {
        if (score >= 0.9) return <div className="w-3 h-3 rounded-full bg-green-500" />
        if (score >= 0.5) return <div className="w-3 h-3 rounded bg-orange-500" />
        return <div className="w-3 h-3 rotate-45 bg-red-500" />
    }

    return (
        <div className={cn(
            "p-3 rounded border-l-4 transition-all hover:bg-gray-50",
            highlight ? "bg-teal-50" : "bg-transparent",
            audit.score >= 0.9 ? "border-l-green-500" : audit.score >= 0.5 ? "border-l-orange-500" : "border-l-red-500"
        )}>
            <div className="flex items-start justify-between">
                <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    {audit.title}
                </div>
                <span className={cn(
                    "text-lg font-mono font-bold",
                    audit.score >= 0.9 ? "text-green-600" : audit.score >= 0.5 ? "text-orange-600" : "text-red-600"
                )}>
                    {audit.displayValue}
                </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">{audit.description?.split('.')[0]}.</p>
        </div>
    )
}

const AuditSection = ({ title, subtitle, audits, refs, filter, showSavings, defaultOpen = true, type = 'issues' }: any) => {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    if (!refs) return null

    // Filter relevant audits
    const relevantAudits = refs.filter(filter).map((ref: any) => audits[ref.id]).filter(Boolean)

    if (relevantAudits.length === 0) return null

    return (
        <div className="p-6 border-b last:border-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full group"
            >
                <div className="text-left">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-teal-700 transition-colors flex items-center gap-2">
                        {title}
                        <Badge variant="secondary" className="text-xs font-normal">
                            {relevantAudits.length}
                        </Badge>
                    </h3>
                    {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
                </div>
                {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>

            {isOpen && (
                <div className="mt-6 space-y-4">
                    {relevantAudits.map((audit: any) => (
                        <AuditItem key={audit.id} audit={audit} showSavings={showSavings} type={type} />
                    ))}
                </div>
            )}
        </div>
    )
}

const AuditItem = ({ audit, showSavings, type }: any) => {
    const [expanded, setExpanded] = useState(false)
    const hasDetails = audit.details && audit.details.items && audit.details.items.length > 0

    return (
        <div className="border-b last:border-0 pb-4">
            <div
                className={cn("flex items-start justify-between gap-4 cursor-pointer", hasDetails && "hover:bg-gray-50 p-2 -m-2 rounded")}
                onClick={() => hasDetails && setExpanded(!expanded)}
            >
                <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1 flex-shrink-0">
                        {type === 'passed' ? (
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                        ) : audit.score >= 0.9 ? (
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                        ) : audit.score >= 0.5 ? (
                            <div className="w-3 h-3 rounded bg-orange-500" />
                        ) : (
                            <div className="w-3 h-3 rotate-45 bg-red-500" />
                        )}
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-gray-900">{audit.title}</h4>
                        {/* Only show description if expanded or if no details to expand for */}
                        {(expanded || !hasDetails) && (
                            <div className="text-xs text-gray-500 mt-1 prose prose-sm max-w-none text-gray-500" dangerouslySetInnerHTML={{ __html: audit.description }} />
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                    {showSavings && audit.details?.overallSavingsMs > 0 && (
                        <span className="text-xs font-bold text-orange-600 whitespace-nowrap">
                            Est. savings: {(audit.details.overallSavingsMs / 1000).toFixed(2)}s
                        </span>
                    )}
                    {showSavings && audit.details?.overallSavingsBytes > 0 && (
                        <span className="text-xs font-bold text-orange-600 whitespace-nowrap">
                            Est. savings: {(audit.details.overallSavingsBytes / 1024).toFixed(0)} KiB
                        </span>
                    )}
                    {audit.displayValue && (
                        <span className="text-sm font-mono text-gray-600">{audit.displayValue}</span>
                    )}
                    {hasDetails && (
                        <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", expanded && "rotate-180")} />
                    )}
                </div>
            </div>

            {/* Detailed Table for Items */}
            {expanded && hasDetails && (
                <div className="mt-4 pl-6 overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="text-gray-500 border-b">
                            <tr>
                                {audit.details.headings?.map((heading: any, idx: number) => (
                                    <th key={idx} className="pb-2 font-medium pr-4 whitespace-nowrap">
                                        {heading.label || heading.key}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {audit.details.items.map((item: any, idx: number) => (
                                <tr key={idx}>
                                    {audit.details.headings?.map((heading: any, hIdx: number) => {
                                        let val = item[heading.key]

                                        // Handle special types like URLs or Code
                                        if (heading.valueType === 'url') {
                                            val = <div className="truncate max-w-[300px] text-blue-600 font-mono" title={val}>{val}</div>
                                        } else if (heading.valueType === 'bytes') {
                                            val = `${(val / 1024).toFixed(1)} KiB`
                                        } else if (heading.valueType === 'ms') {
                                            val = `${Math.round(val)} ms`
                                        } else if (heading.valueType === 'node') {
                                            val = <code className="bg-gray-100 px-1 rounded text-teal-700">{item.node?.snippet || '-'}</code>
                                        }

                                        return (
                                            <td key={hIdx} className="py-2 pr-4 align-top">
                                                {val}
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
