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

// Helper to safely render localized strings or objects from Lighthouse
const renderValue = (value: any) => {
    if (!value) return ''
    if (typeof value === 'string') return value
    if (React.isValidElement(value)) return value
    if (typeof value === 'object') {
        // Handle Lighthouse IcuMessage or formatted objects
        if (value.formattedValue) return value.formattedValue
        if (value.value !== undefined) return String(value.value)
        // Fallback for objects like {type, granularity, value}
        if (value.type && value.value !== undefined) return String(value.value)
        // If it's a complex object we can't stringify (like a React fiber), just return empty or a safe string
        try {
            return JSON.stringify(value)
        } catch (e) {
            return String(value)
        }
    }
    return String(value)
}

const SafeDescription = ({ text }: { text: string }) => {
    if (!text) return null

    // Simple parser for Lighthouse markdown-ish strings
    // 1. Handle code backticks: `code` -> <code>code</code>
    // 2. Handle links: [text](url) -> <a>text</a>

    // We escape the text first to prevent literal HTML injection (like <input>)
    const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')

    // Process backticks
    let html = escaped.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 rounded text-teal-700 font-mono text-[10px]">$1</code>')

    // Process links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer" class="text-blue-600 hover:underline font-medium">$1</a>')

    return (
        <div
            className="prose prose-sm max-w-none text-gray-500 break-words leading-relaxed"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    )
}

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
    const { categories, audits, categoryGroups, fetchTime, configSettings } = lighthouseResult
    const [activeCategory, setActiveCategory] = useState<string | null>(Object.keys(categories)[0])

    return (
        <div className="bg-[#f1f3f4] rounded-xl shadow-lg border overflow-hidden font-sans">
            {/* Header / Meta Info */}
            <div className="bg-white border-b px-6 py-3 flex flex-wrap items-center justify-between gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-6">
                    <span className="font-medium">Lighthouse {lighthouseResult.lighthouseVersion}</span>
                    <span className="text-gray-400">|</span>
                    <span>{new Date(fetchTime).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-6">
                    <span className="flex items-center gap-1.5 uppercase tracking-wider font-semibold text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {configSettings?.emulatedFormFactor === 'desktop' ? 'Desktop' : 'Mobile'}
                    </span>
                    <a
                        href={lighthouseResult.requestedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 font-medium"
                    >
                        {lighthouseResult.requestedUrl} <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
            </div>

            {/* Top Level Gauges (DevTools style) */}
            <div className="bg-white border-b flex flex-wrap justify-center py-8 gap-8 md:gap-16 px-4">
                {Object.values(categories).map((cat: any) => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={cn(
                            "flex flex-col items-center gap-2 transition-all group",
                            activeCategory === cat.id ? "scale-110" : "opacity-60 hover:opacity-100"
                        )}
                    >
                        <Gauge
                            score={cat.score}
                            title={cat.title}
                            size="large"
                        />
                        <div className={cn(
                            "h-1 w-full rounded-full transition-all",
                            activeCategory === cat.id ? "bg-teal-500" : "bg-transparent"
                        )} />
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
                {Object.values(categories).map((cat: any) => (
                    <div
                        key={cat.id}
                        id={`category-${cat.id}`}
                        className={cn(
                            "transition-opacity duration-300",
                            activeCategory && activeCategory !== cat.id ? "hidden" : "block"
                        )}
                    >
                        <CategoryDetails
                            category={cat}
                            audits={audits}
                            categoryGroups={categoryGroups}
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}

// Sub-components

const CategoryDetails = ({ category, audits, categoryGroups }: any) => {
    const isPerformance = category.id === 'performance'

    // Group audits
    const auditRefs = category.auditRefs || []

    // 1. Issues (Failed Audits: score < 0.9)
    const issues = auditRefs.filter((ref: any) => {
        const audit = audits[ref.id]
        return audit && audit.score !== null && audit.score < 0.9 && audit.scoreDisplayMode !== 'manual' && audit.scoreDisplayMode !== 'notApplicable'
    })

    // 2. Manual Checks
    const manual = auditRefs.filter((ref: any) => {
        const audit = audits[ref.id]
        return audit && (audit.scoreDisplayMode === 'manual' || (audit.score === null && !audit.notApplicable))
    })

    // 3. Passed Audits
    const passed = auditRefs.filter((ref: any) => {
        const audit = audits[ref.id]
        return audit && audit.score !== null && audit.score >= 0.9
    })

    // 4. Not Applicable
    const notApplicable = auditRefs.filter((ref: any) => {
        const audit = audits[ref.id]
        return audit && (audit.scoreDisplayMode === 'notApplicable' || audit.notApplicable)
    })

    // Grouping issues by their defined groups
    const groupedIssues: Record<string, any[]> = {}
    issues.forEach((ref: any) => {
        const group = ref.group || 'other'
        if (!groupedIssues[group]) groupedIssues[group] = []
        groupedIssues[group].push(ref)
    })

    return (
        <div className="space-y-12 pb-12 animate-in fade-in duration-500">
            {/* Category Header */}
            <div className="flex flex-col items-center text-center space-y-4">
                <Gauge score={category.score} title="" size="xl" />
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{category.title}</h2>
                    {category.description && (
                        <div className="max-w-2xl mx-auto mt-2">
                            <SafeDescription text={renderValue(category.description)} />
                        </div>
                    )}
                </div>
            </div>

            {/* Performance Metrics (Special handling for performance) */}
            {isPerformance && (
                <div className="bg-white rounded-2xl p-8 border shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold text-gray-900">Metrics</h3>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-gray-400 border-gray-200">Core Web Vitals</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 lg:gap-x-12 gap-y-6">
                        <MetricCard audit={audits['first-contentful-paint']} />
                        <MetricCard audit={audits['largest-contentful-paint']} />
                        <MetricCard audit={audits['total-blocking-time']} />
                        <MetricCard audit={audits['cumulative-layout-shift']} />
                        <MetricCard audit={audits['speed-index']} />
                        <MetricCard audit={audits['interactive']} />
                    </div>
                </div>
            )}

            {/* Audit Groups (Issues) */}
            <div className="space-y-6">
                {Object.entries(groupedIssues).map(([groupId, refs]) => {
                    const groupInfo = categoryGroups?.[groupId] || { title: groupId === 'other' ? 'Other' : groupId }
                    return (
                        <div key={groupId} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                            <div className="px-6 py-4 bg-gray-50 border-b">
                                <h4 className="font-bold text-[10px] uppercase tracking-[0.2em] text-gray-400">
                                    {renderValue(groupInfo.title)}
                                </h4>
                                {groupInfo.description && (
                                    <p className="text-xs text-gray-500 mt-1">{renderValue(groupInfo.description)}</p>
                                )}
                            </div>
                            <div className="divide-y">
                                {refs.map((ref: any) => (
                                    <AuditItem
                                        key={ref.id}
                                        audit={audits[ref.id]}
                                        showSavings={groupId === 'load-opportunities'}
                                    />
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Manual, Passed & Not Applicable Sections */}
            <div className="space-y-3 pt-6 border-t">
                {manual.length > 0 && (
                    <CollapsibleSection title={`Additional items to manually check (${manual.length})`} type="manual">
                        <div className="divide-y bg-white rounded-2xl border shadow-sm overflow-hidden mb-6">
                            {manual.map((ref: any) => (
                                <AuditItem key={ref.id} audit={audits[ref.id]} type="manual" />
                            ))}
                        </div>
                    </CollapsibleSection>
                )}
                {passed.length > 0 && (
                    <CollapsibleSection title={`Passed Audits (${passed.length})`} type="passed">
                        <div className="divide-y bg-white rounded-2xl border shadow-sm overflow-hidden mb-6">
                            {passed.map((ref: any) => (
                                <AuditItem key={ref.id} audit={audits[ref.id]} type="passed" />
                            ))}
                        </div>
                    </CollapsibleSection>
                )}
                {notApplicable.length > 0 && (
                    <CollapsibleSection title={`Not Applicable (${notApplicable.length})`} type="not-applicable">
                        <div className="divide-y bg-white rounded-2xl border shadow-sm overflow-hidden">
                            {notApplicable.map((ref: any) => (
                                <AuditItem key={ref.id} audit={audits[ref.id]} type="not-applicable" />
                            ))}
                        </div>
                    </CollapsibleSection>
                )}
            </div>
        </div>
    )
}

const CollapsibleSection = ({ title, children, type, defaultOpen = false }: any) => {
    const [isOpen, setIsOpen] = useState(defaultOpen)
    return (
        <div className="group">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 w-full py-2 text-left hover:bg-gray-100 px-4 rounded-lg transition-colors"
            >
                {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                <span className="text-sm font-bold text-gray-600 uppercase tracking-wide">
                    {title}
                </span>
            </button>
            {isOpen && <div className="mt-2">{children}</div>}
        </div>
    )
}

const Gauge = ({ score, title, size = 'medium' }: { score: number | null, title: string, size?: 'small' | 'medium' | 'large' | 'xl' }) => {
    // Determine color based on score
    const getColor = (s: number | null) => {
        if (s === null) return '#e5e7eb' // gray-200
        if (s >= 0.9) return '#0cce6a' // Lighthouse green
        if (s >= 0.5) return '#ffa400' // Lighthouse orange
        return '#ff4e42' // Lighthouse red
    }

    const value = score !== null ? Math.round(score * 100) : 0
    const color = getColor(score)

    // Sizing
    const sizes = {
        small: { container: 'w-12 h-12', radius: 18, stroke: 4, font: 'text-[10px]' },
        medium: { container: 'w-24 h-24', radius: 36, stroke: 8, font: 'text-2xl' },
        large: { container: 'w-28 h-28', radius: 44, stroke: 10, font: 'text-3xl' },
        xl: { container: 'w-32 h-32', radius: 52, stroke: 12, font: 'text-4xl' },
    }
    const s = sizes[size]

    // SVG Dash array calculation for circle
    const circumference = 2 * Math.PI * s.radius
    const offset = circumference - (value / 100) * circumference

    return (
        <div className="flex flex-col items-center gap-2">
            <div className={cn("relative flex items-center justify-center", s.container)}>
                <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 120 120">
                    <circle
                        className="text-gray-100"
                        strokeWidth={s.stroke}
                        stroke="currentColor"
                        fill="transparent"
                        r={s.radius}
                        cx="60"
                        cy="60"
                    />
                    <circle
                        strokeWidth={s.stroke}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        stroke={color}
                        fill="transparent"
                        r={s.radius}
                        cx="60"
                        cy="60"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                <div className={cn("absolute font-bold font-mono", s.font)} style={{ color: score !== null ? color : '#9ca3af' }}>
                    {score !== null ? value : '?'}
                </div>
            </div>
            {title && <span className="font-bold text-gray-700 text-xs tracking-wide">{renderValue(title)}</span>}
        </div>
    )
}

const MetricCard = ({ audit, highlight = false }: { audit: any, highlight?: boolean }) => {
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
            <div className="flex items-start justify-between gap-4">
                <div className="text-sm font-medium text-gray-700 flex-1 min-w-0 break-words">
                    {renderValue(audit.title)}
                </div>
                <span className={cn(
                    "text-lg font-mono font-bold flex-shrink-0",
                    audit.score >= 0.9 ? "text-green-600" : audit.score >= 0.5 ? "text-orange-600" : "text-red-600"
                )}>
                    {renderValue(audit.displayValue)}
                </span>
            </div>
            <p className="text-xs text-gray-400 mt-1 break-words">{renderValue(audit.description).split('.')[0]}.</p>
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
                        {renderValue(title)}
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
        <div className="border-b last:border-0 py-4 px-6 transition-colors">
            <div
                className={cn("flex items-start justify-between gap-4 cursor-pointer", hasDetails && "hover:bg-gray-50 p-2 rounded")}
                onClick={() => hasDetails && setExpanded(!expanded)}
            >
                <div className="flex items-start gap-3 flex-1 min-w-0">
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
                    <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-medium text-gray-900 break-words">{renderValue(audit.title)}</h4>
                        {/* Only show description if expanded or if no details to expand for */}
                        {(expanded || !hasDetails) && (
                            <div className="mt-1">
                                <SafeDescription text={renderValue(audit.description)} />
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4 text-right flex-shrink-0 ml-auto mr-1">
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
                        <span className="text-sm font-mono text-gray-600">{renderValue(audit.displayValue)}</span>
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
                                                {renderValue(val)}
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
