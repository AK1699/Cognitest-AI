'use client'

import { useState } from 'react'
import {
    Zap,
    TrendingUp,
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
    Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

export type TestType = 'lighthouse' | 'load' | 'stress' | 'spike' | 'api' | 'soak'

interface PerformanceTestWizardProps {
    projectId: string
    onComplete: (test: any) => void
    onCancel: () => void
}

interface TestConfig {
    testType: TestType
    name: string
    targetUrl: string
    description: string
    // Lighthouse options
    deviceType: 'mobile' | 'desktop'
    // Load test options
    virtualUsers: number | string
    durationSeconds: number | string
    rampUpSeconds: number | string
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
        description: 'Gradually increase load until the system breaks to find limits',
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
        description: 'Run sustained load for extended periods to detect memory leaks',
        color: 'indigo'
    },
    api: {
        icon: Globe,
        name: 'API Performance',
        description: 'Test individual API endpoint performance and response times',
        color: 'blue'
    }
}

export function PerformanceTestWizard({ projectId, onComplete, onCancel }: PerformanceTestWizardProps) {
    const [step, setStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [config, setConfig] = useState<TestConfig>({
        testType: 'lighthouse',
        name: '',
        targetUrl: '',
        description: '',
        deviceType: 'mobile',
        virtualUsers: 50,
        durationSeconds: 60,
        rampUpSeconds: 10,
        startVUs: 10,
        maxVUs: 500,
        stepDuration: 30,
        stepIncrease: 50,
        spikeUsers: 1000,
        spikeDuration: 60,
        maxLatencyP95: null,
        maxErrorRate: null,
        minPerformanceScore: null,
        method: 'GET',
        headers: {},
        body: ''
    })

    const totalSteps = config.testType === 'lighthouse' ? 3 : 4

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

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            // Build request payload
            const payload: any = {
                name: config.name || `${testTypeInfo[config.testType].name}: ${config.targetUrl.slice(0, 30)}`,
                test_type: config.testType === 'soak' ? 'endurance' : config.testType,
                target_url: config.targetUrl,
                description: config.description,
                device_type: config.deviceType,
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
            if (config.testType === 'stress') {
                payload.virtual_users = Number(config.maxVUs) // Use max as main VU count
                // We rely on backend runtime generation or we could construct stages here
                // For Wizard, let's keep it simple and just pass params if backend supports it
                // But backend create_test generic endpoint mostly looks at virtual_users. 
                // We'll pass the specific fields in config or mapped to what create_test expects?
                // Actually, backend create_test accepts kwargs. performance_testing_service.py line 62.
                // But PerformanceTestCreate schema is strict.
                // We should construct stages here to be safe for generic endpoint.

                const startVUs = Number(config.startVUs) || 10
                const maxVUs = Number(config.maxVUs) || 500
                const stepIncrease = Number(config.stepIncrease) || 50
                const stepDuration = Number(config.stepDuration) || 30

                const steps = Math.floor((maxVUs - startVUs) / stepIncrease)
                payload.stages = Array.from({ length: steps + 1 }, (_, i) => ({
                    duration: stepDuration,
                    target: startVUs + (stepIncrease * i)
                }))
            } else if (config.testType === 'spike') {
                const spikeUsers = Number(config.spikeUsers) || 1000
                payload.virtual_users = spikeUsers
                // Spike stages
                const duration = Number(config.durationSeconds) || 120
                payload.stages = [
                    { duration: Math.floor(duration * 0.2), target: Math.floor(spikeUsers * 0.1) },
                    { duration: Math.floor(duration * 0.1), target: spikeUsers },
                    { duration: Math.floor(duration * 0.4), target: spikeUsers },
                    { duration: Math.floor(duration * 0.1), target: Math.floor(spikeUsers * 0.1) },
                    { duration: Math.floor(duration * 0.2), target: Math.floor(spikeUsers * 0.1) }
                ]
            } else {
                payload.virtual_users = Number(config.virtualUsers) || 50
            }

            onComplete(payload)
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
                    const perfScore = config.minPerformanceScore === null ? 0 : Number(config.minPerformanceScore)
                    if (config.minPerformanceScore !== null && (perfScore < 0 || perfScore > 100)) return false
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
                // Check thresholds
                const latency = config.maxLatencyP95 === null ? 0 : Number(config.maxLatencyP95)
                const errorRate = config.maxErrorRate === null ? 0 : Number(config.maxErrorRate)
                if (config.maxLatencyP95 !== null && (latency < 0 || latency > 10000)) return false
                if (config.maxErrorRate !== null && (errorRate < 0 || errorRate > 100)) return false
                return true
            default:
                return true
        }
    }

    return (
        <div className="bg-white w-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-600 to-brand-500 px-6 py-4">
                <h2 className="text-xl font-semibold text-white">Create Performance Test</h2>
                <p className="text-brand-50 text-sm">Configure your test in a few simple steps</p>
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
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>Test Type</span>
                    <span>Target</span>
                    {config.testType !== 'lighthouse' && <span>Load Config</span>}
                    <span>Thresholds</span>
                </div>
            </div>

            {/* Step Content */}
            <div className="p-6 min-h-[300px]">
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
                                        onClick={() => updateConfig('testType', type)}
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
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="GET">GET</SelectItem>
                                        <SelectItem value="POST">POST</SelectItem>
                                        <SelectItem value="PUT">PUT</SelectItem>
                                        <SelectItem value="DELETE">DELETE</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: Device/Load Configuration */}
                {step === 3 && config.testType === 'lighthouse' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Device Configuration</h3>

                        <div>
                            <Label className="mb-3 block">Select Device Type</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div
                                    onClick={() => updateConfig('deviceType', 'mobile')}
                                    className={cn(
                                        "p-6 rounded-lg border-2 cursor-pointer text-center transition-all",
                                        config.deviceType === 'mobile'
                                            ? "border-brand-500 bg-brand-50"
                                            : "border-gray-200 hover:border-brand-300"
                                    )}
                                >
                                    <Smartphone className={cn(
                                        "w-12 h-12 mx-auto mb-3",
                                        config.deviceType === 'mobile' ? "text-brand-500" : "text-gray-400"
                                    )} />
                                    <h4 className="font-medium text-gray-900">Mobile</h4>
                                    <p className="text-xs text-gray-500 mt-1">Simulates 4G network</p>
                                </div>
                                <div
                                    onClick={() => updateConfig('deviceType', 'desktop')}
                                    className={cn(
                                        "p-6 rounded-lg border-2 cursor-pointer text-center transition-all",
                                        config.deviceType === 'desktop'
                                            ? "border-brand-500 bg-brand-50"
                                            : "border-gray-200 hover:border-brand-300"
                                    )}
                                >
                                    <Monitor className={cn(
                                        "w-12 h-12 mx-auto mb-3",
                                        config.deviceType === 'desktop' ? "text-brand-500" : "text-gray-400"
                                    )} />
                                    <h4 className="font-medium text-gray-900">Desktop</h4>
                                    <p className="text-xs text-gray-500 mt-1">Fast connection</p>
                                </div>
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

                        {/* LOAD & SOAK Config */}
                        {(config.testType === 'load' || config.testType === 'soak') && (
                            <>
                                <div>
                                    <Label className="flex justify-between">
                                        <span>Virtual Users</span>
                                        <span className="text-brand-600 font-semibold">{config.virtualUsers}</span>
                                    </Label>
                                    <Slider
                                        value={[Number(config.virtualUsers)]}
                                        onValueChange={([v]: number[]) => updateConfig('virtualUsers', v)}
                                        min={1}
                                        max={config.testType === 'soak' ? 1000 : 500}
                                        step={10}
                                        className="mt-3"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        Number of concurrent virtual users to simulate
                                    </p>
                                </div>

                                <div>
                                    <Label className="flex justify-between">
                                        <span>Duration (seconds)</span>
                                        <span className="text-brand-600 font-semibold">{config.durationSeconds}s</span>
                                    </Label>
                                    <Slider
                                        value={[Number(config.durationSeconds)]}
                                        onValueChange={([v]: number[]) => updateConfig('durationSeconds', v)}
                                        min={10}
                                        max={config.testType === 'soak' ? 86400 : 600}
                                        step={config.testType === 'soak' ? 300 : 10}
                                        className="mt-3"
                                    />
                                </div>

                                <div>
                                    <Label className="flex justify-between">
                                        <span>Ramp-up Time (seconds)</span>
                                        <span className="text-brand-600 font-semibold">{config.rampUpSeconds}s</span>
                                    </Label>
                                    <Slider
                                        value={[Number(config.rampUpSeconds)]}
                                        onValueChange={([v]: number[]) => updateConfig('rampUpSeconds', v)}
                                        min={0}
                                        max={60}
                                        step={5}
                                        className="mt-3"
                                    />
                                </div>
                            </>
                        )}

                        {/* STRESS Config */}
                        {config.testType === 'stress' && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="startVUs">Start VUs</Label>
                                        <Input
                                            id="startVUs"
                                            type="number"
                                            value={config.startVUs}
                                            onChange={(e) => updateConfig('startVUs', e.target.value === '' ? '' : parseInt(e.target.value))}
                                            className={cn("mt-1", (Number(config.startVUs) > 1000 || Number(config.startVUs) < 1) && config.startVUs !== '' ? "border-red-500 focus-visible:ring-red-500" : "")}
                                        />
                                        {Number(config.startVUs) > 1000 && <p className="text-xs text-red-500 mt-1">Maximum reached (1000)</p>}
                                        {Number(config.startVUs) < 1 && config.startVUs !== '' && <p className="text-xs text-red-500 mt-1">Min 1</p>}
                                    </div>
                                    <div>
                                        <Label htmlFor="maxVUs">Max VUs</Label>
                                        <Input
                                            id="maxVUs"
                                            type="number"
                                            value={config.maxVUs}
                                            onChange={(e) => updateConfig('maxVUs', e.target.value === '' ? '' : parseInt(e.target.value))}
                                            className={cn("mt-1", (Number(config.maxVUs) > 2000 || Number(config.maxVUs) < 10) && config.maxVUs !== '' ? "border-red-500 focus-visible:ring-red-500" : "")}
                                        />
                                        {Number(config.maxVUs) > 2000 && <p className="text-xs text-red-500 mt-1">Maximum reached (2000)</p>}
                                        {Number(config.maxVUs) < 10 && config.maxVUs !== '' && <p className="text-xs text-red-500 mt-1">Min 10</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="stepIncrease">Step Increase</Label>
                                        <Input
                                            id="stepIncrease"
                                            type="number"
                                            value={config.stepIncrease}
                                            onChange={(e) => updateConfig('stepIncrease', e.target.value === '' ? '' : parseInt(e.target.value))}
                                            className={cn("mt-1", (Number(config.stepIncrease) > 500 || Number(config.stepIncrease) < 1) && config.stepIncrease !== '' ? "border-red-500 focus-visible:ring-red-500" : "")}
                                        />
                                        {Number(config.stepIncrease) > 500 && <p className="text-xs text-red-500 mt-1">Max 500</p>}
                                        {Number(config.stepIncrease) < 1 && config.stepIncrease !== '' && <p className="text-xs text-red-500 mt-1">Min 1</p>}
                                    </div>
                                    <div>
                                        <Label htmlFor="stepDuration">Step Duration (s)</Label>
                                        <Input
                                            id="stepDuration"
                                            type="number"
                                            value={config.stepDuration}
                                            onChange={(e) => updateConfig('stepDuration', e.target.value === '' ? '' : parseInt(e.target.value))}
                                            className={cn("mt-1", (Number(config.stepDuration) > 3600 || Number(config.stepDuration) < 1) && config.stepDuration !== '' ? "border-red-500 focus-visible:ring-red-500" : "")}
                                        />
                                        {Number(config.stepDuration) > 3600 && <p className="text-xs text-red-500 mt-1">Max 3600s</p>}
                                        {Number(config.stepDuration) < 1 && config.stepDuration !== '' && <p className="text-xs text-red-500 mt-1">Min 1s</p>}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* SPIKE Config */}
                        {config.testType === 'spike' && (
                            <>
                                <div>
                                    <Label htmlFor="spikeUsers">Spike Load (VUs)</Label>
                                    <Input
                                        id="spikeUsers"
                                        type="number"
                                        value={config.spikeUsers}
                                        onChange={(e) => updateConfig('spikeUsers', e.target.value === '' ? '' : parseInt(e.target.value))}
                                        className={cn("mt-1", (Number(config.spikeUsers) > 2000 || Number(config.spikeUsers) < 1) && config.spikeUsers !== '' ? "border-red-500 focus-visible:ring-red-500" : "")}
                                    />
                                    {Number(config.spikeUsers) > 2000 && <p className="text-xs text-red-500 mt-1">Max 2000</p>}
                                    {Number(config.spikeUsers) < 1 && config.spikeUsers !== '' && <p className="text-xs text-red-500 mt-1">Min 1</p>}
                                </div>

                                <div>
                                    <Label htmlFor="spikeDuration">Total Duration (seconds)</Label>
                                    <Input
                                        id="spikeDuration"
                                        type="number"
                                        value={config.durationSeconds}
                                        onChange={(e) => updateConfig('durationSeconds', e.target.value === '' ? '' : parseInt(e.target.value))}
                                        className={cn("mt-1", (Number(config.durationSeconds) > 3600 || Number(config.durationSeconds) < 10) && config.durationSeconds !== '' ? "border-red-500 focus-visible:ring-red-500" : "")}
                                    />
                                    {Number(config.durationSeconds) > 3600 && <p className="text-xs text-red-500 mt-1">Max 3600s</p>}
                                    {Number(config.durationSeconds) < 10 && config.durationSeconds !== '' && <p className="text-xs text-red-500 mt-1">Min 10s</p>}
                                </div>
                            </>
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

                {/* Final Step for Lighthouse: Review */}
                {step === 3 && config.testType === 'lighthouse' && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Test Summary</h4>
                        <div className="text-sm space-y-1 text-gray-600">
                            <p><span className="font-medium">Type:</span> Lighthouse Audit</p>
                            <p><span className="font-medium">URL:</span> {config.targetUrl}</p>
                            <p><span className="font-medium">Device:</span> {config.deviceType === 'mobile' ? 'Mobile' : 'Desktop'}</p>
                        </div>
                    </div>
                )}

                {/* Final Step for Load tests: Review */}
                {step === 4 && config.testType !== 'lighthouse' && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Test Summary</h4>
                        <div className="text-sm space-y-1 text-gray-600">
                            <p><span className="font-medium">Type:</span> {testTypeInfo[config.testType].name}</p>
                            <p><span className="font-medium">URL:</span> {config.targetUrl}</p>
                            <p><span className="font-medium">Virtual Users:</span> {config.virtualUsers}</p>
                            <p><span className="font-medium">Duration:</span> {config.durationSeconds}s</p>
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
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !canProceed()}
                    >
                        {isSubmitting ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
                        ) : (
                            <><Play className="w-4 h-4 mr-2" /> Create & Run Test</>
                        )}
                    </Button>
                )}
            </div>
        </div>
    )
}
