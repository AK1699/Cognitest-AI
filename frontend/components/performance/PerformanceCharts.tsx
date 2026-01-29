'use client'

import React from 'react'
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts'

interface PerformanceGaugeProps {
    score: number
    label?: string
    size?: 'sm' | 'md' | 'lg'
}

/**
 * Performance Score Gauge (0-100)
 * Shows a circular gauge with color-coded performance score
 */
export function PerformanceGauge({ score, label = 'Performance', size = 'md' }: PerformanceGaugeProps) {
    const getColor = (score: number) => {
        if (score >= 90) return '#10B981' // green
        if (score >= 50) return '#F59E0B' // amber
        return '#EF4444' // red
    }

    const sizeConfig = {
        sm: { width: 100, height: 100, fontSize: '1.5rem', labelSize: '0.75rem' },
        md: { width: 150, height: 150, fontSize: '2rem', labelSize: '0.875rem' },
        lg: { width: 200, height: 200, fontSize: '2.5rem', labelSize: '1rem' }
    }

    const config = sizeConfig[size]
    const color = getColor(score)
    const circumference = 2 * Math.PI * 40
    const strokeDashoffset = circumference - (score / 100) * circumference

    return (
        <div className="flex flex-col items-center">
            <div className="relative" style={{ width: config.width, height: config.height }}>
                <svg width="100%" height="100%" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="8"
                    />
                    {/* Progress circle */}
                    <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={color}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        transform="rotate(-90 50 50)"
                        className="transition-all duration-500"
                    />
                    {/* Score text */}
                    <text
                        x="50"
                        y="50"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="font-bold"
                        style={{ fontSize: config.fontSize, fill: color }}
                    >
                        {score}
                    </text>
                </svg>
            </div>
            <span className="text-gray-600 mt-2" style={{ fontSize: config.labelSize }}>{label}</span>
        </div>
    )
}

interface CoreWebVitalsChartProps {
    lcp: number // Largest Contentful Paint (ms)
    fid: number // First Input Delay (ms)
    cls: number // Cumulative Layout Shift
    fcp?: number // First Contentful Paint (ms)
    ttfb?: number // Time to First Byte (ms)
}

/**
 * Core Web Vitals Bar Chart
 * Displays LCP, FID, CLS with threshold indicators
 */
export function CoreWebVitalsChart({ lcp, fid, cls, fcp, ttfb }: CoreWebVitalsChartProps) {
    const getStatus = (metric: string, value: number): 'good' | 'needs-improvement' | 'poor' => {
        const thresholds: Record<string, [number, number]> = {
            lcp: [2500, 4000],
            fid: [100, 300],
            cls: [0.1, 0.25],
            fcp: [1800, 3000],
            ttfb: [800, 1800]
        }
        const [good, poor] = thresholds[metric] || [0, 0]
        if (value <= good) return 'good'
        if (value <= poor) return 'needs-improvement'
        return 'poor'
    }

    const getColor = (status: 'good' | 'needs-improvement' | 'poor') => {
        switch (status) {
            case 'good': return '#10B981'
            case 'needs-improvement': return '#F59E0B'
            case 'poor': return '#EF4444'
        }
    }

    const metrics = [
        { name: 'LCP', value: lcp, unit: 'ms', description: 'Largest Contentful Paint', threshold: '< 2.5s' },
        { name: 'FID', value: fid, unit: 'ms', description: 'First Input Delay', threshold: '< 100ms' },
        { name: 'CLS', value: cls, unit: '', description: 'Cumulative Layout Shift', threshold: '< 0.1' },
        ...(fcp !== undefined ? [{ name: 'FCP', value: fcp, unit: 'ms', description: 'First Contentful Paint', threshold: '< 1.8s' }] : []),
        ...(ttfb !== undefined ? [{ name: 'TTFB', value: ttfb, unit: 'ms', description: 'Time to First Byte', threshold: '< 800ms' }] : [])
    ].map(m => ({
        ...m,
        status: getStatus(m.name.toLowerCase(), m.value),
        fill: getColor(getStatus(m.name.toLowerCase(), m.value))
    }))

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {metrics.slice(0, 3).map((metric) => (
                    <div key={metric.name} className="bg-white rounded-xl p-4 border shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-600">{metric.name}</span>
                            <span
                                className={`text-xs px-2 py-0.5 rounded-full ${metric.status === 'good' ? 'bg-green-100 text-green-700' :
                                    metric.status === 'needs-improvement' ? 'bg-amber-100 text-amber-700' :
                                        'bg-red-100 text-red-700'
                                    }`}
                            >
                                {metric.status === 'good' ? 'Good' : metric.status === 'needs-improvement' ? 'Needs Work' : 'Poor'}
                            </span>
                        </div>
                        <p className="text-2xl font-bold" style={{ color: metric.fill }}>
                            {metric.value}{metric.unit}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
                        <p className="text-xs text-gray-400">Target: {metric.threshold}</p>
                    </div>
                ))}
            </div>
            {metrics.length > 3 && (
                <div className="grid grid-cols-2 gap-4">
                    {metrics.slice(3).map((metric) => (
                        <div key={metric.name} className="bg-white rounded-xl p-4 border shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-600">{metric.name}</span>
                                <span
                                    className={`text-xs px-2 py-0.5 rounded-full ${metric.status === 'good' ? 'bg-green-100 text-green-700' :
                                        metric.status === 'needs-improvement' ? 'bg-amber-100 text-amber-700' :
                                            'bg-red-100 text-red-700'
                                        }`}
                                >
                                    {metric.status === 'good' ? 'Good' : metric.status === 'needs-improvement' ? 'Needs Work' : 'Poor'}
                                </span>
                            </div>
                            <p className="text-2xl font-bold" style={{ color: metric.fill }}>
                                {metric.value}{metric.unit}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

interface LatencyDistributionProps {
    p50: number
    p75: number
    p90: number
    p95: number
    p99: number
    max?: number
}

/**
 * Latency Distribution Chart
 * Shows percentile distribution (P50, P75, P90, P95, P99)
 */
export function LatencyDistributionChart({ p50, p75, p90, p95, p99, max }: LatencyDistributionProps) {
    const data = [
        { name: 'P50', value: p50, fill: '#10B981' },
        { name: 'P75', value: p75, fill: '#3B82F6' },
        { name: 'P90', value: p90, fill: '#8B5CF6' },
        { name: 'P95', value: p95, fill: '#F59E0B' },
        { name: 'P99', value: p99, fill: '#EF4444' },
        ...(max !== undefined ? [{ name: 'Max', value: max, fill: '#6B7280' }] : [])
    ]

    return (
        <div className="bg-white rounded-xl p-6 border shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Latency Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" unit="ms" />
                    <YAxis type="category" dataKey="name" width={50} />
                    <Tooltip
                        formatter={(value: number) => [`${value}ms`, 'Latency']}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-4 mt-4 justify-center">
                {data.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                        <span className="text-sm text-gray-600">{item.name}: {item.value}ms</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

interface RealTimeMetricsProps {
    data: Array<{
        timestamp: string
        rps: number
        latency: number
        errors: number
        activeVUs: number
    }>
}

/**
 * Real-time Metrics Chart
 * Shows live RPS, latency, and error rate
 */
export function RealTimeMetricsChart({ data }: RealTimeMetricsProps) {
    return (
        <div className="bg-white rounded-xl p-6 border shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Real-time Metrics</h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    />
                    <Legend />
                    <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="rps"
                        name="Requests/sec"
                        stroke="#10B981"
                        strokeWidth={2}
                        dot={false}
                    />
                    <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="latency"
                        name="Latency (ms)"
                        stroke="#8B5CF6"
                        strokeWidth={2}
                        dot={false}
                    />
                    <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="errors"
                        name="Errors"
                        stroke="#EF4444"
                        strokeWidth={2}
                        dot={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}

interface VirtualUsersChartProps {
    data: Array<{
        timestamp: string
        activeVUs: number
        targetVUs: number
    }>
}

/**
 * Virtual Users Area Chart
 * Shows active vs target virtual users over time
 */
export function VirtualUsersChart({ data }: VirtualUsersChartProps) {
    // Custom tick component to show stage name and VU count
    const CustomXAxisTick = ({ x, y, payload }: { x: number; y: number; payload: { value: string } }) => {
        const dataPoint = data.find(d => d.timestamp === payload.value);
        const vuCount = dataPoint?.targetVUs ?? dataPoint?.activeVUs ?? 0;

        return (
            <g transform={`translate(${x},${y})`}>
                <text
                    x={0}
                    y={0}
                    dy={12}
                    textAnchor="middle"
                    fill="#374151"
                    fontSize={12}
                    fontWeight={500}
                >
                    {payload.value}
                </text>
                <text
                    x={0}
                    y={0}
                    dy={26}
                    textAnchor="middle"
                    fill="#9CA3AF"
                    fontSize={10}
                >
                    {vuCount} VUs
                </text>
            </g>
        );
    };

    return (
        <div className="bg-white rounded-xl p-6 pb-10 border shadow-sm overflow-visible">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Virtual Users</h3>
            <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey="timestamp"
                        tick={CustomXAxisTick as any}
                        height={60}
                        interval={0}
                    />
                    <YAxis />
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    />
                    <Legend />
                    <Area
                        type="monotone"
                        dataKey="targetVUs"
                        name="Target VUs"
                        stroke="#9CA3AF"
                        fill="#E5E7EB"
                        strokeDasharray="5 5"
                    />
                    <Area
                        type="monotone"
                        dataKey="activeVUs"
                        name="Active VUs"
                        stroke="#8B5CF6"
                        fill="#C4B5FD"
                        fillOpacity={0.6}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}

interface ThroughputChartProps {
    data: Array<{
        timestamp: string
        rps: number
        successRate: number
    }>
}

/**
 * Throughput Timeline Chart
 * Shows requests per second over time
 */
export function ThroughputChart({ data }: ThroughputChartProps) {
    return (
        <div className="bg-white rounded-xl p-6 border shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Throughput</h3>
            <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    />
                    <Legend />
                    <Area
                        type="monotone"
                        dataKey="rps"
                        name="Requests/sec"
                        stroke="#10B981"
                        fill="#D1FAE5"
                        fillOpacity={0.8}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}

interface ScoreBreakdownProps {
    performance: number
    accessibility: number
    bestPractices: number
    seo: number
}

/**
 * Lighthouse Score Breakdown
 * Shows all four Lighthouse category scores
 */
export function ScoreBreakdownChart({ performance, accessibility, bestPractices, seo }: ScoreBreakdownProps) {
    const scores = [
        { name: 'Performance', score: performance, color: '#10B981' },
        { name: 'Accessibility', score: accessibility, color: '#3B82F6' },
        { name: 'Best Practices', score: bestPractices, color: '#8B5CF6' },
        { name: 'SEO', score: seo, color: '#F59E0B' }
    ]

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {scores.map((item) => (
                <div key={item.name} className="bg-white rounded-xl p-4 border shadow-sm text-center">
                    <PerformanceGauge score={item.score} label="" size="sm" />
                    <p className="text-sm font-medium text-gray-700 mt-2">{item.name}</p>
                </div>
            ))}
        </div>
    )
}
