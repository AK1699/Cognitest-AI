'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Play,
    Pause,
    Square,
    SkipForward,
    RotateCcw,
    Monitor,
    Smartphone,
    Globe,
    ChevronRight,
    CheckCircle2,
    Clock,
    MousePointerClick,
    Type,
    AlertCircle,
    Terminal,
    Activity,
    Wifi,
    Layout
} from 'lucide-react'

export default function LiveBrowserTab() {
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentStep, setCurrentStep] = useState(2)
    const [logs, setLogs] = useState([
        { time: '10:42:01', type: 'info', message: 'Test execution started' },
        { time: '10:42:02', type: 'info', message: 'Browser launched: Chrome v120' },
        { time: '10:42:03', type: 'success', message: 'Step 1: Navigate to https://shop.example.com - PASSED' },
        { time: '10:42:04', type: 'info', message: 'Step 2: Click Login Button - Executing...' },
    ])

    const steps = [
        { id: 1, action: 'Navigate', target: 'https://shop.example.com', status: 'passed', duration: '1.2s' },
        { id: 2, action: 'Click', target: '#login-btn', status: 'running', duration: '...' },
        { id: 3, action: 'Type', target: '#email', status: 'pending', duration: '-' },
        { id: 4, action: 'Type', target: '#password', status: 'pending', duration: '-' },
        { id: 5, action: 'Click', target: '#submit', status: 'pending', duration: '-' },
        { id: 6, action: 'Assert', target: 'Dashboard Visible', status: 'pending', duration: '-' },
    ]

    return (
        <div className="flex flex-col h-full bg-gray-100 w-full">
            {/* Top Control Bar */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm z-10 w-full">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            <Globe className="w-3 h-3 mr-1" />
                            Chrome v120
                        </Badge>
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                            <Monitor className="w-3 h-3 mr-1" />
                            1920x1080
                        </Badge>
                    </div>
                    <div className="h-6 w-px bg-gray-300" />
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant={isPlaying ? "secondary" : "default"}
                            className={isPlaying ? "" : "bg-green-600 hover:bg-green-700"}
                            onClick={() => setIsPlaying(!isPlaying)}
                        >
                            {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                            {isPlaying ? 'Pause' : 'Launch'}
                        </Button>
                        <Button size="sm" variant="outline" disabled={!isPlaying}>
                            <Square className="w-4 h-4 mr-2 fill-current" />
                            Stop
                        </Button>
                        <Button size="sm" variant="ghost" disabled={!isPlaying}>
                            <SkipForward className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" disabled={!isPlaying}>
                            <RotateCcw className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-600">
                        <span className="font-medium">Test:</span> Complete Purchase Flow
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            Running
                        </span>
                        <span>00:04</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden w-full">
                {/* Main Browser View */}
                <div className="flex-1 flex flex-col min-w-0 m-4 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                    {/* Browser Chrome */}
                    <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center gap-3">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-400" />
                            <div className="w-3 h-3 rounded-full bg-yellow-400" />
                            <div className="w-3 h-3 rounded-full bg-green-400" />
                        </div>
                        <div className="flex-1 bg-white rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-600 flex items-center">
                            <Globe className="w-3.5 h-3.5 mr-2 text-gray-400" />
                            https://shop.example.com/login
                        </div>
                    </div>

                    {/* Browser Content (Mock) */}
                    <div className="flex-1 bg-white relative">
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                            <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-sm border border-gray-200">
                                <div className="text-center mb-8">
                                    <div className="w-12 h-12 bg-blue-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                                        <Globe className="w-8 h-8 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900">Sign in to Shop</h2>
                                    <p className="text-gray-500 mt-2">Welcome back! Please enter your details.</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="user@example.com" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                        <input type="password" className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="••••••••" />
                                    </div>
                                    <button className="w-full py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors relative overflow-hidden">
                                        Sign in
                                        {/* Highlight effect for current step */}
                                        <div className="absolute inset-0 border-2 border-red-500 animate-pulse rounded-md pointer-events-none" />
                                        <div className="absolute -right-2 -top-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full shadow-sm">
                                            Click
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Execution Panel */}
                <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
                    <Tabs defaultValue="steps" className="flex-1 flex flex-col">
                        <div className="px-4 py-2 border-b border-gray-200">
                            <TabsList className="w-full grid grid-cols-2">
                                <TabsTrigger value="steps">Steps</TabsTrigger>
                                <TabsTrigger value="console">Console</TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="steps" className="flex-1 overflow-y-auto p-0 m-0">
                            <div className="divide-y divide-gray-100">
                                {steps.map((step, index) => (
                                    <div
                                        key={step.id}
                                        className={`p-3 flex items-start gap-3 ${step.status === 'running' ? 'bg-blue-50' : ''
                                            }`}
                                    >
                                        <div className="mt-0.5">
                                            {step.status === 'passed' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                                            {step.status === 'running' && <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />}
                                            {step.status === 'pending' && <div className="w-4 h-4 rounded-full border-2 border-gray-300" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`text-sm font-medium ${step.status === 'running' ? 'text-blue-700' : 'text-gray-900'
                                                    }`}>
                                                    {step.action}
                                                </span>
                                                <span className="text-xs text-gray-500">{step.duration}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 truncate">{step.target}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="console" className="flex-1 overflow-y-auto p-0 m-0 bg-gray-900 text-gray-100 font-mono text-xs">
                            <div className="p-3 space-y-2">
                                {logs.map((log, i) => (
                                    <div key={i} className="flex gap-2">
                                        <span className="text-gray-500 flex-shrink-0">[{log.time}]</span>
                                        <span className={
                                            log.type === 'error' ? 'text-red-400' :
                                                log.type === 'success' ? 'text-green-400' :
                                                    'text-gray-300'
                                        }>
                                            {log.message}
                                        </span>
                                    </div>
                                ))}
                                <div className="flex gap-2 animate-pulse">
                                    <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span>
                                    <span className="text-blue-400">Waiting for element #login-btn...</span>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* Bottom Debug Bar */}
                    <div className="p-3 border-t border-gray-200 bg-gray-50">
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1 text-xs h-8">
                                <Terminal className="w-3.5 h-3.5 mr-1.5" />
                                Debug
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1 text-xs h-8">
                                <Activity className="w-3.5 h-3.5 mr-1.5" />
                                Network
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
