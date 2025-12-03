'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import {
    Activity,
    CheckCircle2,
    AlertTriangle,
    Zap,
    Settings,
    History,
    ArrowRight,
    Search,
    Eye,
    Wand2,
    ShieldCheck,
    AlertCircle,
    XCircle
} from 'lucide-react'

export default function AISelfHealTab() {
    const [autoHealEnabled, setAutoHealEnabled] = useState(true)

    const detectedIssues = [
        {
            id: 1,
            type: 'Locator Changed',
            test: 'Login Form Validation',
            step: 'Click Login Button',
            status: 'LOCATOR_NOT_FOUND',
            confidence: 98,
            oldLocator: '#btn-login',
            suggestions: [
                { id: 's1', value: '#login-btn', confidence: 98, type: 'ID Match' },
                { id: 's2', value: '//button[contains(text(), "Login")]', confidence: 95, type: 'Text Match' },
            ]
        },
        {
            id: 2,
            type: 'Element Text Changed',
            test: 'Navigation Menu',
            step: 'Assert Text: "Sign In"',
            status: 'ASSERTION_FAILED',
            confidence: 92,
            oldLocator: 'text="Sign In"',
            suggestions: [
                { id: 's3', value: 'Assert "Login"', confidence: 92, type: 'Semantic Match' },
                { id: 's4', value: 'Assert contains "Log"', confidence: 85, type: 'Partial Match' },
            ]
        }
    ]

    const repairHistory = [
        { id: 1, date: 'Today, 11:20 AM', type: 'Locator Update', test: 'Cart Management', action: 'Auto-Healed' },
        { id: 2, date: 'Yesterday, 3:45 PM', type: 'Text Update', test: 'Dashboard Access', action: 'Auto-Healed' },
        { id: 3, date: 'Dec 1, 09:30 AM', type: 'Element Moved', test: 'Filter Products', action: 'Auto-Healed' },
    ]

    return (
        <div className="flex h-full bg-gray-50 overflow-hidden w-full">
            {/* Main Content - Dashboard & Issues */}
            <div className="flex-1 flex flex-col overflow-y-auto p-6">
                {/* Header Section */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Self-Heal Dashboard</h1>
                        <p className="text-gray-500">Intelligent test maintenance and automatic repair system</p>
                    </div>
                    <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${autoHealEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                            <span className="text-sm font-medium text-gray-700">Auto-Heal System</span>
                        </div>
                        <Switch checked={autoHealEnabled} onCheckedChange={setAutoHealEnabled} />
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-6 mb-8">
                    <Card className="p-6 border-gray-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Activity className="w-6 h-6 text-blue-600" />
                            </div>
                            <Badge variant="secondary" className="bg-green-100 text-green-700">Excellent</Badge>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">98.9%</div>
                        <div className="text-sm text-gray-500">Health Score</div>
                    </Card>

                    <Card className="p-6 border-gray-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-purple-50 rounded-lg">
                                <Search className="w-6 h-6 text-purple-600" />
                            </div>
                            <span className="text-xs text-gray-500">47 Total</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">47</div>
                        <div className="text-sm text-gray-500">Tests Monitored</div>
                    </Card>

                    <Card className="p-6 border-gray-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-orange-50 rounded-lg">
                                <AlertTriangle className="w-6 h-6 text-orange-600" />
                            </div>
                            <Badge variant="secondary" className="bg-orange-100 text-orange-700">Action Needed</Badge>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">2</div>
                        <div className="text-sm text-gray-500">Issues Detected</div>
                    </Card>

                    <Card className="p-6 border-gray-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-green-50 rounded-lg">
                                <Zap className="w-6 h-6 text-green-600" />
                            </div>
                            <span className="text-xs text-gray-500">This Week</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">15</div>
                        <div className="text-sm text-gray-500">Auto-Healed</div>
                    </Card>
                </div>

                {/* Detected Issues Section */}
                <div className="mb-8">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                        Detected Issues & Suggestions
                    </h2>

                    <div className="space-y-4">
                        {detectedIssues.map((issue) => (
                            <Card key={issue.id} className="border-gray-200 overflow-hidden">
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-6">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200">
                                                    {issue.status}
                                                </Badge>
                                                <span className="text-sm text-gray-500">in</span>
                                                <span className="font-semibold text-gray-900">{issue.test}</span>
                                            </div>
                                            <h3 className="text-lg font-medium text-gray-900 mb-1">{issue.type}</h3>
                                            <p className="text-sm text-gray-500">Step: {issue.step}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-medium text-gray-900 mb-1">Confidence Score</div>
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-green-500 rounded-full"
                                                        style={{ width: `${issue.confidence}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm font-bold text-green-600">{issue.confidence}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                                        <div className="grid grid-cols-2 gap-8">
                                            <div>
                                                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Original Locator</div>
                                                <div className="font-mono text-sm bg-white border border-gray-200 p-2 rounded text-red-600 line-through">
                                                    {issue.oldLocator}
                                                </div>
                                                <div className="mt-2 text-xs text-red-500 flex items-center gap-1">
                                                    <XCircle className="w-3 h-3" />
                                                    Element not found on page
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">AI Suggestion</div>
                                                <div className="font-mono text-sm bg-white border border-green-200 p-2 rounded text-green-600 flex items-center justify-between">
                                                    {issue.suggestions[0].value}
                                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0">
                                                        {issue.suggestions[0].confidence}% Match
                                                    </Badge>
                                                </div>
                                                <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Verified by visual analysis
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-3">
                                        <Button variant="outline" className="text-gray-600">
                                            <Eye className="w-4 h-4 mr-2" />
                                            Preview
                                        </Button>
                                        <Button variant="outline" className="text-gray-600">
                                            <Wand2 className="w-4 h-4 mr-2" />
                                            Suggest More
                                        </Button>
                                        <Button className="bg-green-600 hover:bg-green-700">
                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                            Apply Fix
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Sidebar - History & Config */}
            <div className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
                {/* Repair History */}
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <History className="w-4 h-4 text-gray-500" />
                        Repair History
                    </h2>
                    <div className="space-y-4">
                        {repairHistory.map((item) => (
                            <div key={item.id} className="relative pl-4 border-l-2 border-gray-100 pb-4 last:pb-0">
                                <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-green-500 ring-4 ring-white" />
                                <div className="text-xs text-gray-500 mb-1">{item.date}</div>
                                <div className="text-sm font-medium text-gray-900 mb-0.5">{item.type}</div>
                                <div className="text-xs text-gray-600 mb-1">in {item.test}</div>
                                <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
                                    {item.action}
                                </Badge>
                            </div>
                        ))}
                    </div>
                    <Button variant="ghost" className="w-full mt-4 text-xs text-blue-600 hover:text-blue-700">
                        View Full History
                        <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                </div>

                {/* Configuration */}
                <div className="p-6">
                    <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Settings className="w-4 h-4 text-gray-500" />
                        Configuration
                    </h2>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="flex items-center justify-between text-sm text-gray-700">
                                <span>Auto-Apply Low Risk</span>
                                <Switch defaultChecked />
                            </label>
                            <label className="flex items-center justify-between text-sm text-gray-700">
                                <span>Notify on Issues</span>
                                <Switch defaultChecked />
                            </label>
                            <label className="flex items-center justify-between text-sm text-gray-700">
                                <span>Visual Matching</span>
                                <Switch defaultChecked />
                            </label>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-700">Confidence Threshold</span>
                                <span className="text-xs font-bold text-blue-600">90%</span>
                            </div>
                            <Progress value={90} className="h-2" />
                            <p className="text-[10px] text-gray-500 mt-2">
                                Fixes with confidence score above 90% will be applied automatically if enabled.
                            </p>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <Button variant="outline" className="w-full">
                                <ShieldCheck className="w-4 h-4 mr-2" />
                                Advanced Settings
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
