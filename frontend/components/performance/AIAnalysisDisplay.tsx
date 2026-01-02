'use client'

import {
    AlertTriangle,
    CheckCircle,
    XCircle,
    Lightbulb,
    TrendingUp,
    TrendingDown,
    Minus,
    Clock,
    Zap,
    Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Bottleneck {
    issue: string
    impact: 'high' | 'medium' | 'low'
    component?: string
    layer?: string
}

interface Recommendation {
    title: string
    description: string
    expected_impact: string
    effort: 'low' | 'medium' | 'high'
}

interface AIAnalysisDisplayProps {
    analysis: {
        summary: string
        bottlenecks: Bottleneck[]
        recommendations: Recommendation[]
        risk_level: 'low' | 'medium' | 'high' | 'critical'
        is_production_ready: boolean
        blockers?: string[]
        generated_at?: string
    }
}

const riskConfig = {
    low: { color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle, label: 'Low Risk' },
    medium: { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: AlertTriangle, label: 'Medium Risk' },
    high: { color: 'text-orange-600', bg: 'bg-orange-100', icon: AlertTriangle, label: 'High Risk' },
    critical: { color: 'text-red-600', bg: 'bg-red-100', icon: XCircle, label: 'Critical Risk' }
}

const impactColors = {
    high: 'text-red-600 bg-red-100',
    medium: 'text-yellow-600 bg-yellow-100',
    low: 'text-green-600 bg-green-100'
}

const effortColors = {
    high: 'text-red-500',
    medium: 'text-yellow-500',
    low: 'text-green-500'
}

export function AIAnalysisDisplay({ analysis }: AIAnalysisDisplayProps) {
    const riskInfo = riskConfig[analysis.risk_level]
    const RiskIcon = riskInfo.icon

    return (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
                <div className="flex items-center gap-3">
                    <Zap className="w-6 h-6 text-white" />
                    <div>
                        <h3 className="text-lg font-semibold text-white">AI Performance Analysis</h3>
                        {analysis.generated_at && (
                            <p className="text-purple-200 text-xs flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Generated {new Date(analysis.generated_at).toLocaleString()}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Summary & Risk Level */}
                <div className="flex gap-4">
                    <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-2">Executive Summary</h4>
                        <p className="text-gray-600 text-sm">{analysis.summary}</p>
                    </div>
                    <div className="text-right">
                        <div className={cn(
                            "inline-flex items-center gap-2 px-4 py-2 rounded-lg",
                            riskInfo.bg
                        )}>
                            <RiskIcon className={cn("w-5 h-5", riskInfo.color)} />
                            <span className={cn("font-semibold", riskInfo.color)}>
                                {riskInfo.label}
                            </span>
                        </div>
                        <div className="mt-2">
                            {analysis.is_production_ready ? (
                                <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                                    <Shield className="w-4 h-4" />
                                    Production Ready
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 text-red-600 text-sm">
                                    <XCircle className="w-4 h-4" />
                                    Not Production Ready
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Blockers */}
                {analysis.blockers && analysis.blockers.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                            <XCircle className="w-5 h-5" />
                            Blockers
                        </h4>
                        <ul className="space-y-1">
                            {analysis.blockers.map((blocker, i) => (
                                <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                                    <span className="mt-1">•</span>
                                    {blocker}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Bottlenecks */}
                {analysis.bottlenecks.length > 0 && (
                    <div>
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-orange-500" />
                            Detected Bottlenecks
                        </h4>
                        <div className="space-y-2">
                            {analysis.bottlenecks.map((bottleneck, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <span className={cn(
                                        "px-2 py-0.5 rounded text-xs font-medium uppercase",
                                        impactColors[bottleneck.impact]
                                    )}>
                                        {bottleneck.impact}
                                    </span>
                                    <span className="text-gray-900 text-sm flex-1">{bottleneck.issue}</span>
                                    {bottleneck.component && (
                                        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                                            {bottleneck.component}
                                        </span>
                                    )}
                                    {bottleneck.layer && (
                                        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                                            {bottleneck.layer}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recommendations */}
                {analysis.recommendations.length > 0 && (
                    <div>
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <Lightbulb className="w-5 h-5 text-yellow-500" />
                            Recommendations
                        </h4>
                        <div className="space-y-3">
                            {analysis.recommendations.map((rec, i) => (
                                <div key={i} className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                                    <div className="flex items-start justify-between">
                                        <h5 className="font-medium text-gray-900">{rec.title}</h5>
                                        <span className={cn(
                                            "text-xs font-medium",
                                            effortColors[rec.effort]
                                        )}>
                                            {rec.effort.toUpperCase()} effort
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                                    <div className="mt-2 flex items-center gap-2 text-xs text-teal-600">
                                        <TrendingUp className="w-3 h-3" />
                                        Expected: {rec.expected_impact}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
