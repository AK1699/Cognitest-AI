'use client'

import React, { useState } from 'react'
import {
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    Check,
    X,
    ChevronDown,
    BarChart3,
    Calendar,
    Target
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

interface TestResult {
    id: string
    name: string
    testType: 'lighthouse' | 'load' | 'stress'
    timestamp: string
    metrics: {
        // Lighthouse metrics
        performance?: number
        accessibility?: number
        bestPractices?: number
        seo?: number
        lcp?: number
        fid?: number
        cls?: number
        // Load test metrics
        rps?: number
        p50?: number
        p95?: number
        p99?: number
        errorRate?: number
        virtualUsers?: number
    }
}

interface TestComparisonProps {
    tests: TestResult[]
    onClose?: () => void
}

/**
 * Test Comparison Component
 * Compare metrics between two test runs
 */
export function TestComparison({ tests, onClose }: TestComparisonProps) {
    const [baselineId, setBaselineId] = useState<string>(tests[0]?.id || '')
    const [compareId, setCompareId] = useState<string>(tests[1]?.id || '')

    const baseline = tests.find(t => t.id === baselineId)
    const compare = tests.find(t => t.id === compareId)

    const getChange = (baseValue: number | undefined, compareValue: number | undefined) => {
        if (baseValue === undefined || compareValue === undefined) return null
        const diff = compareValue - baseValue
        const percent = baseValue !== 0 ? (diff / baseValue) * 100 : 0
        return { diff, percent }
    }

    const getChangeIndicator = (
        baseValue: number | undefined,
        compareValue: number | undefined,
        lowerIsBetter: boolean = false
    ) => {
        const change = getChange(baseValue, compareValue)
        if (!change) return <Minus className="w-4 h-4 text-gray-400" />

        const isPositive = lowerIsBetter ? change.diff < 0 : change.diff > 0
        const isNegative = lowerIsBetter ? change.diff > 0 : change.diff < 0

        if (Math.abs(change.percent) < 1) {
            return <Minus className="w-4 h-4 text-gray-400" />
        }

        return (
            <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500'}`}>
                {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                <span className="text-sm font-medium">{Math.abs(change.percent).toFixed(1)}%</span>
            </div>
        )
    }

    const renderMetricRow = (
        label: string,
        baseValue: number | undefined,
        compareValue: number | undefined,
        unit: string = '',
        lowerIsBetter: boolean = false
    ) => {
        if (baseValue === undefined && compareValue === undefined) return null

        return (
            <tr className="border-b border-gray-100">
                <td className="py-3 px-4 text-sm font-medium text-gray-700">{label}</td>
                <td className="py-3 px-4 text-sm text-gray-900 text-center">
                    {baseValue !== undefined ? `${baseValue}${unit}` : '—'}
                </td>
                <td className="py-3 px-4 text-sm text-gray-900 text-center">
                    {compareValue !== undefined ? `${compareValue}${unit}` : '—'}
                </td>
                <td className="py-3 px-4 text-center">
                    {getChangeIndicator(baseValue, compareValue, lowerIsBetter)}
                </td>
            </tr>
        )
    }

    return (
        <div className="bg-white rounded-xl border shadow-sm">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Test Comparison</h2>
                            <p className="text-sm text-gray-500">Compare performance between test runs</p>
                        </div>
                    </div>
                    {onClose && (
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                </div>

                {/* Test Selectors */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Baseline (Before)
                        </label>
                        <Select value={baselineId} onValueChange={setBaselineId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select baseline test" />
                            </SelectTrigger>
                            <SelectContent>
                                {tests.map(test => (
                                    <SelectItem key={test.id} value={test.id}>
                                        {test.name} - {new Date(test.timestamp).toLocaleDateString()}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Compare (After)
                        </label>
                        <Select value={compareId} onValueChange={setCompareId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select test to compare" />
                            </SelectTrigger>
                            <SelectContent>
                                {tests.map(test => (
                                    <SelectItem key={test.id} value={test.id}>
                                        {test.name} - {new Date(test.timestamp).toLocaleDateString()}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Comparison Table */}
            {baseline && compare ? (
                <div className="p-6">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 rounded-lg">
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Metric</th>
                                <th className="py-3 px-4 text-center text-sm font-semibold text-gray-700">Baseline</th>
                                <th className="py-3 px-4 text-center text-sm font-semibold text-gray-700">Compare</th>
                                <th className="py-3 px-4 text-center text-sm font-semibold text-gray-700">Change</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Lighthouse Metrics */}
                            {(baseline.testType === 'lighthouse' || compare.testType === 'lighthouse') && (
                                <>
                                    {renderMetricRow('Performance Score', baseline.metrics.performance, compare.metrics.performance, '', false)}
                                    {renderMetricRow('Accessibility', baseline.metrics.accessibility, compare.metrics.accessibility, '', false)}
                                    {renderMetricRow('Best Practices', baseline.metrics.bestPractices, compare.metrics.bestPractices, '', false)}
                                    {renderMetricRow('SEO', baseline.metrics.seo, compare.metrics.seo, '', false)}
                                    {renderMetricRow('LCP', baseline.metrics.lcp, compare.metrics.lcp, 'ms', true)}
                                    {renderMetricRow('FID', baseline.metrics.fid, compare.metrics.fid, 'ms', true)}
                                    {renderMetricRow('CLS', baseline.metrics.cls, compare.metrics.cls, '', true)}
                                </>
                            )}

                            {/* Load Test Metrics */}
                            {(baseline.testType === 'load' || baseline.testType === 'stress' ||
                                compare.testType === 'load' || compare.testType === 'stress') && (
                                    <>
                                        {renderMetricRow('Requests/sec', baseline.metrics.rps, compare.metrics.rps, '', false)}
                                        {renderMetricRow('P50 Latency', baseline.metrics.p50, compare.metrics.p50, 'ms', true)}
                                        {renderMetricRow('P95 Latency', baseline.metrics.p95, compare.metrics.p95, 'ms', true)}
                                        {renderMetricRow('P99 Latency', baseline.metrics.p99, compare.metrics.p99, 'ms', true)}
                                        {renderMetricRow('Error Rate', baseline.metrics.errorRate, compare.metrics.errorRate, '%', true)}
                                        {renderMetricRow('Virtual Users', baseline.metrics.virtualUsers, compare.metrics.virtualUsers, '', false)}
                                    </>
                                )}
                        </tbody>
                    </table>

                    {/* Summary */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Summary</h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <span className="text-gray-600">Improved metrics</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <span className="text-gray-600">Degraded metrics</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-gray-400" />
                                <span className="text-gray-600">No significant change</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-12 text-center text-gray-500">
                    <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p>Select two tests to compare their results</p>
                </div>
            )}
        </div>
    )
}

// Demo data for testing
export const demoTestResults: TestResult[] = [
    {
        id: '1',
        name: 'Homepage Audit',
        testType: 'lighthouse',
        timestamp: '2024-01-15T10:30:00Z',
        metrics: {
            performance: 78,
            accessibility: 89,
            bestPractices: 83,
            seo: 92,
            lcp: 2800,
            fid: 65,
            cls: 0.12
        }
    },
    {
        id: '2',
        name: 'Homepage Audit (After Optimization)',
        testType: 'lighthouse',
        timestamp: '2024-01-20T14:15:00Z',
        metrics: {
            performance: 92,
            accessibility: 95,
            bestPractices: 91,
            seo: 98,
            lcp: 1900,
            fid: 35,
            cls: 0.05
        }
    },
    {
        id: '3',
        name: 'API Load Test - Baseline',
        testType: 'load',
        timestamp: '2024-01-18T09:00:00Z',
        metrics: {
            rps: 450,
            p50: 85,
            p95: 220,
            p99: 380,
            errorRate: 0.5,
            virtualUsers: 100
        }
    },
    {
        id: '4',
        name: 'API Load Test - After Cache',
        testType: 'load',
        timestamp: '2024-01-22T11:30:00Z',
        metrics: {
            rps: 680,
            p50: 45,
            p95: 120,
            p99: 195,
            errorRate: 0.2,
            virtualUsers: 100
        }
    }
]
