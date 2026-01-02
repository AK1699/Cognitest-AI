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
    Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

export type TestType = 'lighthouse' | 'load' | 'stress' | 'spike' | 'api'

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
    virtualUsers: number
    durationSeconds: number
    rampUpSeconds: number
    // Thresholds
    maxLatencyP95: number | null
    maxErrorRate: number | null
    minPerformanceScore: number | null
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
            const payload = {
                name: config.name || `${testTypeInfo[config.testType].name}: ${config.targetUrl.slice(0, 30)}`,
                test_type: config.testType,
                target_url: config.targetUrl,
                description: config.description,
                device_type: config.deviceType,
                virtual_users: config.virtualUsers,
                duration_seconds: config.durationSeconds,
                ramp_up_seconds: config.rampUpSeconds,
                target_method: config.method,
                target_headers: config.headers,
                target_body: config.body,
                thresholds: {
                    ...(config.maxLatencyP95 && { latency_p95: config.maxLatencyP95 }),
                    ...(config.maxErrorRate && { error_rate: config.maxErrorRate }),
                    ...(config.minPerformanceScore && { performance_score: config.minPerformanceScore }),
                }
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
                return config.targetUrl.trim().length > 0
            case 3:
                if (config.testType === 'lighthouse') {
                    return true // Device selection is optional
                }
                return config.virtualUsers > 0 && config.durationSeconds > 0
            case 4:
                return true // Thresholds are optional
            default:
                return true
        }
    }

    return (
        <div className="bg-white rounded-xl border shadow-lg overflow-hidden max-w-2xl mx-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white">Create Performance Test</h2>
                <p className="text-teal-100 text-sm">Configure your test in a few simple steps</p>
            </div>

            {/* Progress Steps */}
            <div className="px-6 py-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                    {Array.from({ length: totalSteps }).map((_, i) => (
                        <div key={i} className="flex items-center">
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                                step > i + 1 ? "bg-teal-500 text-white" :
                                    step === i + 1 ? "bg-teal-500 text-white" :
                                        "bg-gray-200 text-gray-500"
                            )}>
                                {step > i + 1 ? <Check className="w-4 h-4" /> : i + 1}
                            </div>
                            {i < totalSteps - 1 && (
                                <div className={cn(
                                    "w-16 h-1 mx-2",
                                    step > i + 1 ? "bg-teal-500" : "bg-gray-200"
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
                                                ? "border-teal-500 bg-teal-50"
                                                : "border-gray-200 hover:border-teal-300"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-12 h-12 rounded-lg flex items-center justify-center",
                                                isSelected ? "bg-teal-500 text-white" : "bg-gray-100 text-gray-500"
                                            )}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-900">{info.name}</h4>
                                                <p className="text-sm text-gray-500">{info.description}</p>
                                            </div>
                                            {isSelected && <Check className="w-5 h-5 text-teal-500" />}
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
                                            ? "border-teal-500 bg-teal-50"
                                            : "border-gray-200 hover:border-teal-300"
                                    )}
                                >
                                    <Smartphone className={cn(
                                        "w-12 h-12 mx-auto mb-3",
                                        config.deviceType === 'mobile' ? "text-teal-500" : "text-gray-400"
                                    )} />
                                    <h4 className="font-medium text-gray-900">Mobile</h4>
                                    <p className="text-xs text-gray-500 mt-1">Simulates 4G network</p>
                                </div>
                                <div
                                    onClick={() => updateConfig('deviceType', 'desktop')}
                                    className={cn(
                                        "p-6 rounded-lg border-2 cursor-pointer text-center transition-all",
                                        config.deviceType === 'desktop'
                                            ? "border-teal-500 bg-teal-50"
                                            : "border-gray-200 hover:border-teal-300"
                                    )}
                                >
                                    <Monitor className={cn(
                                        "w-12 h-12 mx-auto mb-3",
                                        config.deviceType === 'desktop' ? "text-teal-500" : "text-gray-400"
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
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Load Configuration</h3>

                        <div>
                            <Label className="flex justify-between">
                                <span>Virtual Users</span>
                                <span className="text-teal-600 font-semibold">{config.virtualUsers}</span>
                            </Label>
                            <Slider
                                value={[config.virtualUsers]}
                                onValueChange={([v]: number[]) => updateConfig('virtualUsers', v)}
                                min={1}
                                max={500}
                                step={1}
                                className="mt-3"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                Number of concurrent virtual users to simulate
                            </p>
                        </div>

                        <div>
                            <Label className="flex justify-between">
                                <span>Duration (seconds)</span>
                                <span className="text-teal-600 font-semibold">{config.durationSeconds}s</span>
                            </Label>
                            <Slider
                                value={[config.durationSeconds]}
                                onValueChange={([v]: number[]) => updateConfig('durationSeconds', v)}
                                min={10}
                                max={300}
                                step={10}
                                className="mt-3"
                            />
                        </div>

                        <div>
                            <Label className="flex justify-between">
                                <span>Ramp-up Time (seconds)</span>
                                <span className="text-teal-600 font-semibold">{config.rampUpSeconds}s</span>
                            </Label>
                            <Slider
                                value={[config.rampUpSeconds]}
                                onValueChange={([v]: number[]) => updateConfig('rampUpSeconds', v)}
                                min={0}
                                max={60}
                                step={5}
                                className="mt-3"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                Time to gradually increase to target VUs
                            </p>
                        </div>
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
                                onChange={(e) => updateConfig('maxLatencyP95', e.target.value ? parseInt(e.target.value) : null)}
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
                                onChange={(e) => updateConfig('maxErrorRate', e.target.value ? parseFloat(e.target.value) : null)}
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
                    <Button onClick={handleNext} disabled={!canProceed()} className="bg-teal-600 hover:bg-teal-700">
                        Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                ) : (
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !canProceed()}
                        className="bg-teal-600 hover:bg-teal-700"
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
