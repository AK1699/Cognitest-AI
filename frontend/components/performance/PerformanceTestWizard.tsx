'use client'

import { useState } from 'react'
import {
    Zap,
    TrendingUp,
    TrendingDown,
    Activity,
    Globe,
    Settings,
    Play,
    ChevronRight,
    ChevronLeft,
    Check,
    Smartphone,
    Monitor,
    Loader2,
    Clock,
    Users,
    Timer,
    Plus,
    Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'

export type TestType = 'lighthouse' | 'load' | 'stress' | 'spike' | 'api' | 'soak'

interface PerformanceTestWizardProps {
    projectId: string
    onComplete: (test: any, shouldRun?: boolean) => void
    onCancel: () => void
    editMode?: boolean
    initialData?: any
}

interface TestConfig {
    testType: TestType
    name: string
    targetUrl: string
    description: string
    // Lighthouse options
    deviceType: 'mobile' | 'desktop'
    auditMode: 'navigation' | 'timespan' | 'snapshot'
    categories: {
        performance: boolean
        accessibility: boolean
        bestPractices: boolean
        seo: boolean
    }
    // Load test options
    virtualUsers: number | string
    durationSeconds: number | string
    rampUpSeconds: number | string
    rampDownSeconds: number | string
    thinkTime: number | string
    // Stress options
    startVUs: number | string
    maxVUs: number | string
    stepDuration: number | string
    stepIncrease: number | string
    // Spike options
    spikeUsers: number | string
    spikeDuration: number | string
    // Thresholds
    maxLatencyP95: number | string | null
    maxErrorRate: number | string | null
    minPerformanceScore: number | string | null
    // Headers/Body for API tests
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
    headers: Record<string, string>
    body: string
    // Performance test stages
    stages: Array<{ duration: string; target: number }>
}

const methodColors: Record<string, string> = {
    GET: "text-emerald-600",
    POST: "text-blue-600",
    PUT: "text-amber-600",
    DELETE: "text-red-600",
    PATCH: "text-purple-600"
}

const methodBadgeColors: Record<string, string> = {
    GET: "bg-emerald-100 text-emerald-700 border-emerald-200",
    POST: "bg-blue-100 text-blue-700 border-blue-200",
    PUT: "bg-amber-100 text-amber-700 border-amber-200",
    DELETE: "bg-red-100 text-red-700 border-red-200",
    PATCH: "bg-purple-100 text-purple-700 border-purple-200"
}

const testTypeInfo = {
    lighthouse: {
        icon: Zap,
        name: 'Lighthouse Audit',
        description: 'Analyze web page performance, accessibility, SEO, and best practices',
        color: 'teal'
    },
    load: {
        icon: TrendingUp,
        name: 'Load Test',
        description: 'Simulate concurrent users and measure response times under load',
        color: 'purple'
    },
    stress: {
        icon: Activity,
        name: 'Stress Test',
        description: 'Tests how much load the system can handle before it starts to fail.',
        color: 'orange'
    },
    spike: {
        icon: Zap,
        name: 'Spike Test',
        description: 'Simulate sudden traffic bursts to test recovery',
        color: 'red'
    },
    soak: {
        icon: Clock, // We need to import Clock
        name: 'Soak Test',
        description: 'Tests how the system performs over a long time to find slowdowns or memory issues',
        color: 'indigo'
    },
    api: {
        icon: Globe,
        name: 'API Performance',
        description: 'Test individual API endpoint performance and response times',
        color: 'blue'
    }
}

export function PerformanceTestWizard({ projectId, onComplete, onCancel, editMode = false, initialData }: PerformanceTestWizardProps) {
    const [step, setStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const parseDuration = (duration: string | number): number => {
        if (typeof duration === 'number') return duration;
        if (!duration) return 0;

        try {
            const val = parseInt(duration);
            if (isNaN(val)) return 0;

            const unit = duration.toLowerCase().trim().replace(/[0-9]/g, '');
            if (unit.includes('m')) return val * 60;
            if (unit.includes('h')) return val * 3600;
            return val;
        } catch {
            return 0;
        }
    }

    const [config, setConfig] = useState<TestConfig>({
        testType: initialData?.test_type === 'endurance' ? 'soak' : initialData?.test_type || 'lighthouse',
        name: initialData?.name || '',
        targetUrl: initialData?.target_url || '',
        description: initialData?.description || '',
        deviceType: initialData?.device_type || 'mobile',
        auditMode: initialData?.audit_mode || 'navigation',
        categories: initialData?.categories || {
            performance: true,
            accessibility: true,
            bestPractices: true,
            seo: true
        },
        virtualUsers: initialData?.virtual_users || 50,
        durationSeconds: initialData?.duration_seconds || 60,
        rampUpSeconds: initialData?.ramp_up_seconds || 10,
        rampDownSeconds: initialData?.ramp_down_seconds || 0,
        thinkTime: initialData?.think_time || 0,
        startVUs: 10,
        maxVUs: initialData?.test_type === 'stress' ? initialData?.virtual_users : 500,
        stepDuration: 30,
        stepIncrease: 50,
        spikeUsers: initialData?.test_type === 'spike' ? initialData?.virtual_users : 1000,
        spikeDuration: 60,
        maxLatencyP95: initialData?.thresholds?.latency_p95 || null,
        maxErrorRate: initialData?.thresholds?.error_rate || null,
        minPerformanceScore: initialData?.thresholds?.performance_score || null,
        method: initialData?.target_method || 'GET',
        headers: initialData?.target_headers || {},
        body: initialData?.target_body || '',
        stages: initialData?.stages || (
            initialData?.test_type === 'stress' ? [
                { duration: '1m', target: 100 },
                { duration: '1m', target: 200 },
                { duration: '2m', target: 200 },
                { duration: '1m', target: 500 },
                { duration: '2m', target: 500 },
            ] : initialData?.test_type === 'spike' ? [
                { duration: '1m', target: 50 },
                { duration: '30s', target: 1000 },
                { duration: '2m', target: 1000 },
                { duration: '30s', target: 50 },
            ] : initialData?.test_type === 'load' || initialData?.test_type === 'soak' ? [
                { duration: '1m', target: initialData?.virtual_users || 50 },
                { duration: '3m', target: initialData?.virtual_users || 50 },
                { duration: '1m', target: 0 },
            ] : initialData?.test_type === 'api' ? [
                { duration: '1m', target: 50 },
                { duration: '3m', target: 50 },
                { duration: '1m', target: 0 },
            ] : []
        )
    })

    const totalSteps = config.testType === 'lighthouse' ? 4 : 5

    const updateConfig = <K extends keyof TestConfig>(key: K, value: TestConfig[K]) => {
        setConfig(prev => ({ ...prev, [key]: value }))
    }

    const handleNext = () => {
        if (step < totalSteps) {
            setStep(step + 1)
        }
    }

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1)
        }
    }

    const handleSubmit = async (shouldRun: boolean = true) => {
        setIsSubmitting(true)
        try {
            // Build request payload
            const payload: any = {
                name: config.name || `${testTypeInfo[config.testType].name}: ${config.targetUrl.slice(0, 30)}`,
                test_type: config.testType === 'soak' ? 'endurance' : config.testType,
                target_url: config.targetUrl,
                description: config.description,
                device_type: config.deviceType,
                audit_mode: config.auditMode,
                categories: config.categories,
                duration_seconds: Number(config.durationSeconds) || 60,
                ramp_up_seconds: Number(config.rampUpSeconds) || 0,
                target_method: config.method,
                target_headers: config.headers,
                target_body: config.body,
                thresholds: {
                    ...(config.maxLatencyP95 && { latency_p95: Number(config.maxLatencyP95) }),
                    ...(config.maxErrorRate && { error_rate: Number(config.maxErrorRate) }),
                    ...(config.minPerformanceScore && { performance_score: Number(config.minPerformanceScore) }),
                }
            }

            // Type specific mappings
            if (config.testType === 'stress' || config.testType === 'spike' || config.testType === 'load' || config.testType === 'soak' || config.testType === 'api') {
                payload.stages = config.stages.map(s => ({
                    duration: s.duration,
                    target: Number(s.target)
                }));
                // Set virtual_users to the max target in stages for legacy/overview compatibility
                payload.virtual_users = Math.max(...config.stages.map(s => Number(s.target)), 0);
                // Calculate total duration from stages
                payload.duration_seconds = config.stages.reduce((acc, s) => acc + parseDuration(s.duration), 0);
            } else {
                payload.virtual_users = Number(config.virtualUsers) || 50;
            }

            await onComplete(payload, shouldRun)
        } catch (error) {
            console.error('Failed to create test:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const canProceed = () => {
        switch (step) {
            case 1:
                return true // Test type already selected
            case 2:
                // Test basic config step
                if (!config.name || !config.targetUrl) return false
                return config.targetUrl.trim().length > 0
            case 3:
                if (config.testType === 'lighthouse') {
                    // Ensure at least one category is selected
                    const hasCategory = Object.values(config.categories).some(v => v)
                    if (!hasCategory) return false
                    return true
                }

                const vus = Number(config.virtualUsers)
                const duration = Number(config.durationSeconds)

                if (config.testType === 'load') {
                    if (vus < 1 || vus > 2000) return false
                    if (duration < 10 || duration > 3600) return false
                }

                if (config.testType === 'stress') {
                    const startVUs = Number(config.startVUs)
                    const maxVUs = Number(config.maxVUs)
                    if (startVUs < 1 || startVUs > 1000) return false
                    if (maxVUs < 10 || maxVUs > 2000) return false
                }

                if (config.testType === 'spike') {
                    const baseUsers = Number(config.virtualUsers)
                    const spikeUsers = Number(config.spikeUsers)
                    if (baseUsers < 1 || baseUsers > 1000) return false
                    if (spikeUsers < 10 || spikeUsers > 2000) return false
                }

                return true
            case 4:
                if (config.testType === 'lighthouse') return true // Review step
                // Check thresholds
                const latency = config.maxLatencyP95 === null ? 0 : Number(config.maxLatencyP95)
                const errorRate = config.maxErrorRate === null ? 0 : Number(config.maxErrorRate)
                if (config.maxLatencyP95 !== null && (latency < 0 || latency > 10000)) return false
                if (config.maxErrorRate !== null && (errorRate < 0 || errorRate > 100)) return false
                return true
            case 5:
                return true // Final review
            default:
                return true
        }
    }

    return (
        <div className="bg-white w-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-600 to-brand-500 px-6 py-4">
                <h2 className="text-xl font-semibold text-white">{editMode ? 'Edit' : 'Create'} Performance Test</h2>
                <p className="text-brand-50 text-sm">{editMode ? 'Modify your test configuration' : 'Configure your test in a few simple steps'}</p>
            </div>

            {/* Progress Steps */}
            <div className="px-6 py-4 border-b bg-gray-50">
                <div className="flex items-center w-full">
                    {Array.from({ length: totalSteps }).map((_, i) => (
                        <div key={i} className={cn("flex items-center", i < totalSteps - 1 ? "flex-1" : "")}>
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors relative z-10",
                                step > i + 1 ? "bg-brand-500 text-white" :
                                    step === i + 1 ? "bg-brand-500 text-white" :
                                        "bg-gray-200 text-gray-500"
                            )}>
                                {step > i + 1 ? <Check className="w-4 h-4" /> : i + 1}
                            </div>
                            {i < totalSteps - 1 && (
                                <div className={cn(
                                    "h-1 mx-2 flex-1",
                                    step > i + 1 ? "bg-brand-500" : "bg-gray-200"
                                )} />
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex justify-between mt-2 text-[10px] uppercase tracking-wider font-semibold text-gray-400 px-1">
                    <span className={step === 1 ? "text-brand-600" : ""}>Type</span>
                    <span className={step === 2 ? "text-brand-600" : ""}>Target</span>
                    {config.testType !== 'lighthouse' ? (
                        <>
                            <span className={step === 3 ? "text-brand-600" : ""}>Load</span>
                            <span className={step === 4 ? "text-brand-600" : ""}>Rules</span>
                            <span className={step === 5 ? "text-brand-600" : ""}>Review</span>
                        </>
                    ) : (
                        <>
                            <span className={step === 3 ? "text-brand-600" : ""}>Config</span>
                            <span className={step === 4 ? "text-brand-600" : ""}>Review</span>
                        </>
                    )}
                </div>
            </div>

            {/* Step Content */}
            <div className="p-6 min-h-[300px] max-h-[60vh] overflow-y-auto">
                {/* Step 1: Test Type Selection */}
                {step === 1 && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Select Test Type</h3>
                        <div className="grid grid-cols-1 gap-3">
                            {(Object.entries(testTypeInfo) as [TestType, typeof testTypeInfo.lighthouse][]).map(([type, info]) => {
                                const Icon = info.icon
                                const isSelected = config.testType === type
                                return (
                                    <div
                                        key={type}
                                        onClick={() => {
                                            const defaultStages = type === 'stress' ? [
                                                { duration: '1m', target: 100 },
                                                { duration: '1m', target: 200 },
                                                { duration: '1m', target: 300 },
                                                { duration: '1m', target: 400 },
                                                { duration: '1m', target: 500 },
                                            ] : type === 'spike' ? [
                                                { duration: '1m', target: 50 },
                                                { duration: '30s', target: 1000 },
                                                { duration: '2m', target: 1000 },
                                                { duration: '30s', target: 50 },
                                            ] : type === 'load' ? [
                                                { duration: '1m', target: 50 },
                                                { duration: '3m', target: 50 },
                                                { duration: '1m', target: 0 },
                                            ] : type === 'soak' ? [
                                                { duration: '2m', target: 100 },
                                                { duration: '1h', target: 100 },
                                                { duration: '2m', target: 0 },
                                            ] : type === 'api' ? [
                                                { duration: '1m', target: 50 },
                                                { duration: '3m', target: 50 },
                                                { duration: '1m', target: 0 },
                                            ] : [];

                                            setConfig(prev => ({
                                                ...prev,
                                                testType: type as TestType,
                                                stages: defaultStages
                                            }))
                                        }}
                                        className={cn(
                                            "p-4 rounded-lg border-2 cursor-pointer transition-all",
                                            isSelected
                                                ? "border-brand-500 bg-brand-50"
                                                : "border-gray-200 hover:border-brand-300"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-12 h-12 rounded-lg flex items-center justify-center",
                                                isSelected ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-500"
                                            )}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-900">{info.name}</h4>
                                                <p className="text-sm text-gray-500">{info.description}</p>
                                            </div>
                                            {isSelected && <Check className="w-5 h-5 text-brand-500" />}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Step 2: Target Configuration */}
                {step === 2 && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Configure Target</h3>

                        <div>
                            <Label htmlFor="targetUrl">Target URL *</Label>
                            <Input
                                id="targetUrl"
                                placeholder="https://example.com"
                                value={config.targetUrl}
                                onChange={(e) => updateConfig('targetUrl', e.target.value)}
                                className="mt-1"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                The URL to test. Must include https:// or http://
                            </p>
                        </div>

                        <div>
                            <Label htmlFor="name">Test Name (optional)</Label>
                            <Input
                                id="name"
                                placeholder="My Performance Test"
                                value={config.name}
                                onChange={(e) => updateConfig('name', e.target.value)}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label htmlFor="description">Description (optional)</Label>
                            <Textarea
                                id="description"
                                placeholder="What are you testing?"
                                value={config.description}
                                onChange={(e) => updateConfig('description', e.target.value)}
                                className="mt-1"
                                rows={3}
                            />
                        </div>

                        {config.testType !== 'lighthouse' && (
                            <div>
                                <Label>HTTP Method</Label>
                                <Select value={config.method} onValueChange={(v) => updateConfig('method', v as any)}>
                                    <SelectTrigger className="mt-1">
                                        <div className="flex items-center gap-2">
                                            <span className={cn("font-bold text-xs", methodColors[config.method])}>{config.method}</span>
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(methodColors).map(([method, color]) => (
                                            <SelectItem key={method} value={method}>
                                                <span className={cn("font-bold text-xs", color)}>{method}</span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                )}

                {step === 3 && config.testType === 'lighthouse' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Lighthouse Configuration</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Device Selection */}
                            <div className="space-y-4">
                                <Label className="block text-sm font-semibold text-gray-700">Device Type</Label>
                                <RadioGroup
                                    value={config.deviceType}
                                    onValueChange={(v) => updateConfig('deviceType', v as any)}
                                    className="flex flex-col space-y-2"
                                >
                                    <div
                                        className={cn(
                                            "flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all",
                                            config.deviceType === 'mobile' ? "border-brand-500 bg-brand-50" : "border-gray-200 hover:border-gray-300"
                                        )}
                                        onClick={() => updateConfig('deviceType', 'mobile')}
                                    >
                                        <RadioGroupItem value="mobile" id="mobile-radio" />
                                        <Smartphone className={cn("w-4 h-4", config.deviceType === 'mobile' ? "text-brand-600" : "text-gray-400")} />
                                        <Label htmlFor="mobile-radio" className="flex-1 cursor-pointer font-medium">Mobile</Label>
                                    </div>
                                    <div
                                        className={cn(
                                            "flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all",
                                            config.deviceType === 'desktop' ? "border-brand-500 bg-brand-50" : "border-gray-200 hover:border-gray-300"
                                        )}
                                        onClick={() => updateConfig('deviceType', 'desktop')}
                                    >
                                        <RadioGroupItem value="desktop" id="desktop-radio" />
                                        <Monitor className={cn("w-4 h-4", config.deviceType === 'desktop' ? "text-brand-600" : "text-gray-400")} />
                                        <Label htmlFor="desktop-radio" className="flex-1 cursor-pointer font-medium">Desktop</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            {/* Audit Mode Selection */}
                            <div className="space-y-4">
                                <Label className="block text-sm font-semibold text-gray-700">Audit Mode</Label>
                                <Select value={config.auditMode} onValueChange={(v) => updateConfig('auditMode', v as any)}>
                                    <SelectTrigger className="w-full bg-white border-gray-200 rounded-xl h-[52px] focus:ring-brand-500 text-left px-4">
                                        <div className="flex flex-col leading-tight">
                                            <SelectValue placeholder="Select mode" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl shadow-xl border-gray-100">
                                        <SelectItem value="navigation" className="py-3">
                                            <div className="flex flex-col">
                                                <span className="font-medium">Navigation</span>
                                                <span className="text-xs text-gray-500">Standard page load audit</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="timespan" className="py-3">
                                            <div className="flex flex-col">
                                                <span className="font-medium">Timespan</span>
                                                <span className="text-xs text-gray-500">Analyze user interactions over time</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="snapshot" className="py-3">
                                            <div className="flex flex-col">
                                                <span className="font-medium">Snapshot</span>
                                                <span className="text-xs text-gray-500">Audit a specific page state</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Categories Selection */}
                        <div className="space-y-4 pt-4 border-t border-gray-50">
                            <Label className="block text-sm font-semibold text-gray-700">Audit Categories</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                                {[
                                    { id: 'performance', label: 'Performance' },
                                    { id: 'accessibility', label: 'Accessibility' },
                                    { id: 'bestPractices', label: 'Best Practices' },
                                    { id: 'seo', label: 'SEO' }
                                ].map((cat) => (
                                    <div key={cat.id} className="flex items-center space-x-3 group">
                                        <Checkbox
                                            id={cat.id}
                                            checked={config.categories[cat.id as keyof typeof config.categories]}
                                            onCheckedChange={(checked) => {
                                                const newCats = { ...config.categories, [cat.id]: !!checked }
                                                updateConfig('categories', newCats)
                                            }}
                                            className="w-5 h-5 rounded-md border-gray-300 data-[state=checked]:bg-brand-600 data-[state=checked]:border-brand-600 transition-colors"
                                        />
                                        <Label
                                            htmlFor={cat.id}
                                            className="text-sm font-medium text-gray-600 group-hover:text-brand-700 cursor-pointer transition-colors"
                                        >
                                            {cat.label}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && config.testType !== 'lighthouse' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            {config.testType === 'load' ? 'Load Configuration' :
                                config.testType === 'stress' ? 'Stress Configuration' :
                                    config.testType === 'spike' ? 'Spike Configuration' :
                                        'Soak Configuration'}
                        </h3>

                        {/* STAGES Config for Performance Tests */}
                        {(config.testType === 'load' || config.testType === 'stress' || config.testType === 'spike' || config.testType === 'soak' || config.testType === 'api') && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                    <Label className="text-[11px] font-black uppercase tracking-widest text-gray-500">
                                        Test Stages
                                    </Label>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const newStages = [...config.stages, { duration: '1m', target: 50 }]
                                            updateConfig('stages', newStages)
                                        }}
                                        className="h-8 text-[10px] font-bold uppercase tracking-wider text-brand-600 border-brand-200 hover:bg-brand-50 rounded-lg"
                                    >
                                        <Plus className="w-3 h-3 mr-1" />
                                        Add Stage
                                    </Button>
                                </div>

                                <div className="flex items-center gap-3 pr-[44px] mb-2 px-3">
                                    <div className="w-6 shrink-0" />
                                    <div className="flex-1 grid grid-cols-2 gap-3">
                                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1 font-mono">Duration</div>
                                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1 font-mono">Target VUs</div>
                                    </div>
                                </div>

                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                                    {config.stages.map((stage, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 group transition-all hover:border-brand-200 hover:shadow-sm"
                                        >
                                            <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-[10px] font-bold shrink-0 font-mono">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 grid grid-cols-2 gap-3">
                                                <div className="relative group/input">
                                                    <Timer className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within/input:text-brand-600 transition-colors" />
                                                    <Input
                                                        value={stage.duration}
                                                        onChange={(e) => {
                                                            const newStages = [...config.stages]
                                                            newStages[index].duration = e.target.value
                                                            updateConfig('stages', newStages)
                                                        }}
                                                        className="pl-8 h-10 text-xs font-medium bg-white border-gray-200 focus:border-brand-500 focus:ring-brand-500/10 transition-all rounded-lg"
                                                        placeholder="e.g. 1m"
                                                    />
                                                </div>
                                                <div className="relative group/input">
                                                    <Users className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within/input:text-brand-600 transition-colors" />
                                                    <Input
                                                        type="number"
                                                        value={stage.target}
                                                        onChange={(e) => {
                                                            const newStages = [...config.stages]
                                                            newStages[index].target = parseInt(e.target.value) || 0
                                                            updateConfig('stages', newStages)
                                                        }}
                                                        className="pl-8 h-10 text-xs font-medium bg-white border-gray-200 focus:border-brand-500 focus:ring-brand-500/10 transition-all rounded-lg"
                                                        placeholder="Target"
                                                    />
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    const newStages = config.stages.filter((_, i) => i !== index)
                                                    updateConfig('stages', newStages)
                                                }}
                                                className="w-8 h-8 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg shrink-0 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>

                                <p className="text-[10px] text-gray-400 mt-4 leading-relaxed bg-brand-50/50 p-2 rounded-lg border border-brand-100/50">
                                    <span className="font-bold text-brand-700 uppercase mr-1">TIPS:</span>
                                    Define the test lifecycle. For example, <b>1m @ 10</b> ramps up, <b>5m @ 10</b> stays constant, and <b>1m @ 0</b> ramps down.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 4 (Load tests): Thresholds */}
                {((step === 4 && config.testType !== 'lighthouse') || (step === 3 && config.testType === 'lighthouse' && false)) && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Set Thresholds (Optional)</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Define pass/fail criteria. Leave blank to skip.
                        </p>

                        <div>
                            <Label htmlFor="maxLatency">Max P95 Latency (ms)</Label>
                            <Input
                                id="maxLatency"
                                type="number"
                                placeholder="e.g., 500"
                                value={config.maxLatencyP95 || ''}
                                onChange={(e) => updateConfig('maxLatencyP95', e.target.value ? Math.min(10000, Math.max(0, parseInt(e.target.value) || 0)) : null)}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label htmlFor="maxError">Max Error Rate (%)</Label>
                            <Input
                                id="maxError"
                                type="number"
                                placeholder="e.g., 1"
                                value={config.maxErrorRate || ''}
                                onChange={(e) => updateConfig('maxErrorRate', e.target.value ? Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)) : null)}
                                className="mt-1"
                            />
                        </div>
                    </div>
                )}

                {/* Review Steps */}
                {((step === 4 && config.testType === 'lighthouse') || (step === 5 && config.testType !== 'lighthouse')) && (
                    <div className="space-y-6">
                        <div className="bg-brand-50/50 rounded-2xl p-6 border border-brand-100">
                            <h3 className="text-lg font-semibold text-brand-900 mb-4 flex items-center gap-2">
                                <Settings className="w-5 h-5" />
                                Review Test Configuration
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">General Info</p>
                                        <div className="space-y-1">
                                            <p className="text-sm text-gray-900"><span className="text-gray-500">Name:</span> {config.name || 'Untitled Test'}</p>
                                            <p className="text-sm text-gray-900 font-medium truncate"><span className="text-gray-500 font-normal">URL:</span> {config.targetUrl}</p>
                                            <p className="text-sm text-gray-900"><span className="text-gray-500">Type:</span> {testTypeInfo[config.testType].name}</p>
                                        </div>
                                    </div>

                                    {config.testType === 'lighthouse' ? (
                                        <div>
                                            <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">Lighthouse Details</p>
                                            <div className="space-y-1">
                                                <p className="text-sm text-gray-900"><span className="text-gray-500">Device:</span> {config.deviceType.charAt(0).toUpperCase() + config.deviceType.slice(1)}</p>
                                                <p className="text-sm text-gray-900"><span className="text-gray-500">Mode:</span> {config.auditMode.charAt(0).toUpperCase() + config.auditMode.slice(1)}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">Load Profile</p>
                                            <div className="space-y-1">
                                                <p className="text-sm text-gray-900 font-medium">
                                                    <span className="text-gray-500 font-normal">Stages:</span> {config.stages.length} defined
                                                </p>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {config.stages.slice(0, 3).map((s, i) => (
                                                        <span key={i} className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                                                            {s.duration} @ {s.target}
                                                        </span>
                                                    ))}
                                                    {config.stages.length > 3 && (
                                                        <span className="text-[10px] text-gray-400">+{config.stages.length - 3} more</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    {config.testType === 'lighthouse' ? (
                                        <div>
                                            <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">Categories</p>
                                            <div className="flex flex-wrap gap-1.5 mt-1">
                                                {Object.entries(config.categories)
                                                    .filter(([_, enabled]) => enabled)
                                                    .map(([key]) => (
                                                        <span key={key} className="px-2 py-0.5 bg-brand-100 text-brand-700 text-[10px] font-bold rounded-full uppercase">
                                                            {key.replace(/([A-Z])/g, ' $1')}
                                                        </span>
                                                    ))
                                                }
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">Thresholds</p>
                                            <div className="space-y-1">
                                                <p className="text-sm text-gray-900">
                                                    <span className="text-gray-500">Latency:</span> {config.maxLatencyP95 ? `${config.maxLatencyP95}ms` : 'None'}
                                                </p>
                                                <p className="text-sm text-gray-900">
                                                    <span className="text-gray-500">Error Rate:</span> {config.maxErrorRate ? `${config.maxErrorRate}%` : 'None'}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 items-start">
                            <Activity className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div className="text-xs text-blue-800 leading-relaxed">
                                <span className="font-bold">Pro Tip:</span> Your configurations are saved. You can trigger this test later from the "Saved Tests" list without having to re-configure everything.
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-between">
                <Button variant="outline" onClick={step === 1 ? onCancel : handleBack}>
                    {step === 1 ? 'Cancel' : <><ChevronLeft className="w-4 h-4 mr-1" /> Back</>}
                </Button>

                {step < totalSteps ? (
                    <Button onClick={handleNext} disabled={!canProceed()}>
                        Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => handleSubmit(false)}
                            disabled={isSubmitting || !canProceed()}
                            className="border-teal-600 text-teal-600 hover:bg-teal-50"
                        >
                            {isSubmitting ? (
                                editMode ? 'Updating...' : 'Saving...'
                            ) : (
                                editMode ? <>Update Only</> : <>Save Only</>
                            )}
                        </Button>
                        <Button
                            onClick={() => handleSubmit(true)}
                            disabled={isSubmitting || !canProceed()}
                            className="bg-teal-600 hover:bg-teal-700"
                        >
                            {isSubmitting ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {editMode ? 'Updating...' : 'Creating...'}</>
                            ) : (
                                <><Play className="w-4 h-4 mr-2" /> {editMode ? 'Update & Run' : 'Create & Run Test'}</>
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
