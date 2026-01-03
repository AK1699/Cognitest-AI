'use client'

import React, { useState } from 'react'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts'
import { TrendingUp, TrendingDown, Minus, Calendar, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

interface TrendDataPoint {
    date: string
    timestamp: number
    // Performance scores
    performance?: number
    accessibility?: number
    bestPractices?: number
    seo?: number
    // Core Web Vitals
    lcp?: number
    fid?: number
    cls?: number
    // Load test metrics
    rps?: number
    p95Latency?: number
    errorRate?: number
}

interface HistoricalTrendChartProps {
    data: TrendDataPoint[]
    metric?: 'performance' | 'lcp' | 'fid' | 'cls' | 'rps' | 'p95Latency'
    title?: string
    showThresholds?: boolean
}

const metricConfig: Record<string, {
    label: string
    color: string
    unit: string
    goodThreshold?: number
    poorThreshold?: number
    lowerIsBetter?: boolean
}> = {
    performance: { label: 'Performance Score', color: '#10B981', unit: '', goodThreshold: 90, poorThreshold: 50 },
    accessibility: { label: 'Accessibility', color: '#3B82F6', unit: '' },
    bestPractices: { label: 'Best Practices', color: '#8B5CF6', unit: '' },
    seo: { label: 'SEO', color: '#F59E0B', unit: '' },
    lcp: { label: 'LCP', color: '#10B981', unit: 'ms', goodThreshold: 2500, poorThreshold: 4000, lowerIsBetter: true },
    fid: { label: 'FID', color: '#3B82F6', unit: 'ms', goodThreshold: 100, poorThreshold: 300, lowerIsBetter: true },
    cls: { label: 'CLS', color: '#8B5CF6', unit: '', goodThreshold: 0.1, poorThreshold: 0.25, lowerIsBetter: true },
    rps: { label: 'Requests/sec', color: '#10B981', unit: '' },
    p95Latency: { label: 'P95 Latency', color: '#EF4444', unit: 'ms', lowerIsBetter: true },
    errorRate: { label: 'Error Rate', color: '#EF4444', unit: '%', lowerIsBetter: true }
}

/**
 * Historical Trend Chart
 * Displays performance metrics over time with trend analysis
 */
export function HistoricalTrendChart({
    data,
    metric = 'performance',
    title,
    showThresholds = true
}: HistoricalTrendChartProps) {
    const [selectedMetric, setSelectedMetric] = useState(metric)
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

    const config = metricConfig[selectedMetric]

    // Filter data by time range
    const now = Date.now()
    const rangeMs = {
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        '90d': 90 * 24 * 60 * 60 * 1000
    }
    const filteredData = data.filter(d => now - d.timestamp < rangeMs[timeRange])

    // Calculate trend
    const calculateTrend = () => {
        if (filteredData.length < 2) return { direction: 'neutral', percent: 0 }

        const values = filteredData
            .map(d => d[selectedMetric as keyof TrendDataPoint] as number)
            .filter(v => v !== undefined)

        if (values.length < 2) return { direction: 'neutral', percent: 0 }

        const recent = values.slice(-Math.ceil(values.length / 3))
        const older = values.slice(0, Math.ceil(values.length / 3))

        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
        const olderAvg = older.reduce((a, b) => a + b, 0) / older.length

        const percent = olderAvg !== 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0

        const isImprovement = config.lowerIsBetter ? percent < 0 : percent > 0

        return {
            direction: Math.abs(percent) < 2 ? 'neutral' : isImprovement ? 'up' : 'down',
            percent: Math.abs(percent)
        }
    }

    const trend = calculateTrend()

    // Calculate average
    const average = filteredData.length > 0
        ? filteredData
            .map(d => d[selectedMetric as keyof TrendDataPoint] as number)
            .filter(v => v !== undefined)
            .reduce((a, b, _, arr) => a + b / arr.length, 0)
        : 0

    return (
        <div className="bg-white rounded-xl border shadow-sm">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            {title || 'Performance Trend'}
                        </h3>
                        <p className="text-sm text-gray-500">Track changes over time</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Metric Selector */}
                        <Select
                            value={selectedMetric}
                            onValueChange={(value) => setSelectedMetric(value as 'performance' | 'lcp' | 'fid' | 'cls' | 'rps' | 'p95Latency')}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="performance">Performance Score</SelectItem>
                                <SelectItem value="lcp">LCP</SelectItem>
                                <SelectItem value="fid">FID</SelectItem>
                                <SelectItem value="cls">CLS</SelectItem>
                                <SelectItem value="rps">Requests/sec</SelectItem>
                                <SelectItem value="p95Latency">P95 Latency</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Time Range Selector */}
                        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                            {(['7d', '30d', '90d'] as const).map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${timeRange === range
                                        ? 'bg-teal-600 text-white'
                                        : 'bg-white text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Average</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {average.toFixed(config.unit === 'ms' ? 0 : 1)}{config.unit}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Data Points</p>
                        <p className="text-2xl font-bold text-gray-900">{filteredData.length}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Trend</p>
                        <div className="flex items-center gap-2">
                            {trend.direction === 'up' ? (
                                <TrendingUp className="w-5 h-5 text-green-500" />
                            ) : trend.direction === 'down' ? (
                                <TrendingDown className="w-5 h-5 text-red-500" />
                            ) : (
                                <Minus className="w-5 h-5 text-gray-400" />
                            )}
                            <span className={`text-xl font-bold ${trend.direction === 'up' ? 'text-green-600' :
                                trend.direction === 'down' ? 'text-red-600' : 'text-gray-600'
                                }`}>
                                {trend.percent.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="p-6">
                {filteredData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={filteredData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis
                                dataKey="date"
                                stroke="#9CA3AF"
                                fontSize={12}
                            />
                            <YAxis
                                stroke="#9CA3AF"
                                fontSize={12}
                                tickFormatter={(value) => `${value}${config.unit}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '8px',
                                    border: '1px solid #e5e7eb',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                                formatter={(value: number) => [`${value}${config.unit}`, config.label]}
                            />
                            <Legend />

                            {/* Threshold lines */}
                            {showThresholds && config.goodThreshold && (
                                <ReferenceLine
                                    y={config.goodThreshold}
                                    stroke="#10B981"
                                    strokeDasharray="5 5"
                                    label={{ value: 'Good', position: 'right', fill: '#10B981', fontSize: 10 }}
                                />
                            )}
                            {showThresholds && config.poorThreshold && (
                                <ReferenceLine
                                    y={config.poorThreshold}
                                    stroke="#EF4444"
                                    strokeDasharray="5 5"
                                    label={{ value: 'Poor', position: 'right', fill: '#EF4444', fontSize: 10 }}
                                />
                            )}

                            <Line
                                type="monotone"
                                dataKey={selectedMetric}
                                name={config.label}
                                stroke={config.color}
                                strokeWidth={2}
                                dot={{ fill: config.color, strokeWidth: 2, r: 3 }}
                                activeDot={{ r: 5, strokeWidth: 2 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                        <div className="text-center">
                            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>No data available for this time range</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// Demo data generator
export function generateDemoTrendData(days: number = 30): TrendDataPoint[] {
    const data: TrendDataPoint[] = []
    const now = Date.now()

    for (let i = days; i >= 0; i--) {
        const timestamp = now - (i * 24 * 60 * 60 * 1000)
        const date = new Date(timestamp)

        // Simulate gradual improvement trend
        const improvement = (days - i) / days * 10

        data.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            timestamp,
            performance: Math.min(100, Math.floor(75 + improvement + Math.random() * 8 - 4)),
            accessibility: Math.min(100, Math.floor(85 + improvement * 0.5 + Math.random() * 6 - 3)),
            bestPractices: Math.min(100, Math.floor(80 + improvement * 0.3 + Math.random() * 5 - 2)),
            seo: Math.min(100, Math.floor(90 + improvement * 0.2 + Math.random() * 4 - 2)),
            lcp: Math.max(1000, Math.floor(3000 - improvement * 50 + Math.random() * 400 - 200)),
            fid: Math.max(10, Math.floor(80 - improvement * 2 + Math.random() * 30 - 15)),
            cls: Math.max(0, Number((0.15 - improvement * 0.005 + Math.random() * 0.05 - 0.025).toFixed(3))),
            rps: Math.floor(200 + improvement * 15 + Math.random() * 50 - 25),
            p95Latency: Math.max(50, Math.floor(250 - improvement * 8 + Math.random() * 40 - 20)),
            errorRate: Math.max(0, Number((0.8 - improvement * 0.03 + Math.random() * 0.2 - 0.1).toFixed(2)))
        })
    }

    return data
}
