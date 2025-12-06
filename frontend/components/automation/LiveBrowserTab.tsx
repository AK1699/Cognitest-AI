'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Play,
    Pause,
    Square,
    SkipForward,
    RotateCcw,
    Monitor,
    Smartphone,
    Tablet,
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
    Layout,
    Loader2,
    ExternalLink,
    ArrowRight,
    XCircle,
    Info,
    AlertTriangle,
    Search,
    Keyboard
} from 'lucide-react'
import { webAutomationApi } from '@/lib/api/webAutomation'

interface ConsoleLog {
    level: string
    text: string
    timestamp: string
}

interface NetworkRequest {
    id: string
    url: string
    method: string
    resource_type: string
    status?: number
    size?: number
    timestamp: string
}

interface DevicePreset {
    id: string
    name: string
    viewport: string
    type: string
}

interface TestStep {
    id: string
    action: string
    selector?: string
    value?: string
    status: 'pending' | 'running' | 'passed' | 'failed'
    duration?: string
    error?: string
}

interface LiveBrowserTabProps {
    projectId: string
    testFlowId?: string
    testName?: string
    steps?: TestStep[]
    onStepClick?: (stepId: string) => void
}

export default function LiveBrowserTab({
    projectId,
    testFlowId,
    testName = 'Untitled Test',
    steps = [],
    onStepClick
}: LiveBrowserTabProps) {
    // Session state
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [isLaunching, setIsLaunching] = useState(false)
    const [sessionStatus, setSessionStatus] = useState<'idle' | 'running' | 'paused' | 'stopped'>('idle')

    // Browser state
    const [currentUrl, setCurrentUrl] = useState('')
    const [urlInput, setUrlInput] = useState('')
    const [screenshot, setScreenshot] = useState<string | null>(null)

    // Device/viewport
    const [selectedDevice, setSelectedDevice] = useState('desktop_chrome')
    const [selectedBrowser, setSelectedBrowser] = useState('chromium')
    const [devices, setDevices] = useState<DevicePreset[]>([])

    // Logs
    const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([])
    const [networkRequests, setNetworkRequests] = useState<NetworkRequest[]>([])
    const [activeTab, setActiveTab] = useState('element')

    // Execution
    const [elapsedTime, setElapsedTime] = useState(0)
    const [currentStep, setCurrentStep] = useState<number>(-1)

    // Element Inspector
    const [inspectMode, setInspectMode] = useState(true) // Enable inspector by default
    const [selectedElement, setSelectedElement] = useState<any>(null)
    const [typingText, setTypingText] = useState('')
    const screenshotRef = useRef<HTMLImageElement>(null)

    // Headed mode for direct interaction
    const [headedMode, setHeadedMode] = useState(false)

    // Interactive mode - when focused, forward keyboard to browser
    const [isFocused, setIsFocused] = useState(false)
    const browserContainerRef = useRef<HTMLDivElement>(null)

    // WebSocket
    const wsRef = useRef<WebSocket | null>(null)
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    // Load device presets
    useEffect(() => {
        const loadDevices = async () => {
            try {
                const response = await webAutomationApi.getDevicePresets()
                setDevices(response.devices)
            } catch (error) {
                console.error('Failed to load device presets:', error)
                // Fallback devices
                setDevices([
                    { id: 'desktop_chrome', name: 'Desktop Chrome', viewport: '1920x1080', type: 'desktop' },
                    { id: 'iphone_14', name: 'iPhone 14', viewport: '390x844', type: 'mobile' },
                    { id: 'ipad_pro', name: 'iPad Pro', viewport: '1024x1366', type: 'tablet' },
                ])
            }
        }
        loadDevices()
    }, [])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (wsRef.current) {
                wsRef.current.close()
            }
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }
        }
    }, [])

    // Connect WebSocket
    const connectWebSocket = useCallback((sid: string) => {
        const wsUrl = `ws://localhost:8000/api/v1/web-automation/ws/browser-session/${sid}`
        const ws = new WebSocket(wsUrl)

        ws.onopen = () => {
            console.log('Browser session WebSocket connected')
            setIsConnected(true)
        }

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)
                handleWebSocketMessage(data)
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error)
            }
        }

        ws.onerror = (error) => {
            console.error('WebSocket error:', error)
            setIsConnected(false)
        }

        ws.onclose = () => {
            console.log('WebSocket closed')
            setIsConnected(false)
        }

        wsRef.current = ws
    }, [])

    // Handle WebSocket messages
    const handleWebSocketMessage = (data: any) => {
        switch (data.type) {
            case 'screenshot':
                setScreenshot(data.data)
                if (data.url) {
                    setCurrentUrl(data.url)
                }
                break

            case 'navigation':
                setCurrentUrl(data.url)
                setUrlInput(data.url)
                break

            case 'console':
                setConsoleLogs(prev => [...prev.slice(-99), {
                    level: data.level,
                    text: data.text,
                    timestamp: data.timestamp
                }])
                break

            case 'network':
                setNetworkRequests(prev => [...prev.slice(-49), data.request])
                break

            case 'session_started':
                setSessionStatus('running')
                startTimer()
                break

            case 'session_stopped':
                setSessionStatus('stopped')
                stopTimer()
                break

            case 'element_clicked':
            case 'element_info':
                if (data.element) {
                    setSelectedElement(data.element)
                    setActiveTab('element') // Switch to element tab
                }
                break

            case 'error':
                console.error('Browser session error:', data.error)
                break
        }
    }

    // Timer management
    const startTimer = () => {
        setElapsedTime(0)
        timerRef.current = setInterval(() => {
            setElapsedTime(prev => prev + 1)
        }, 1000)
    }

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
        }
    }

    // Format elapsed time
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    // Launch browser session
    const handleLaunch = async () => {
        setIsLaunching(true)
        const newSessionId = `session-${Date.now()}`
        setSessionId(newSessionId)
        setConsoleLogs([])
        setNetworkRequests([])

        // Connect WebSocket first, then send launch command
        const wsUrl = `ws://localhost:8000/api/v1/web-automation/ws/browser-session/${newSessionId}`
        const ws = new WebSocket(wsUrl)

        ws.onopen = () => {
            console.log('Browser session WebSocket connected')
            setIsConnected(true)

            // Send launch command once connected
            ws.send(JSON.stringify({
                action: 'launch',
                browserType: selectedBrowser,
                device: selectedDevice,
                url: urlInput || 'about:blank',
                headless: !headedMode // headed mode = not headless
            }))
        }

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)
                handleWebSocketMessage(data)

                // Handle specific messages for launch state
                if (data.type === 'session_started') {
                    setIsLaunching(false)
                    setSessionStatus('running')
                    startTimer()
                } else if (data.type === 'error') {
                    setIsLaunching(false)
                    console.error('Browser session error:', data.error)
                } else if (data.type === 'launching') {
                    // Still launching, show message
                    console.log('Launching browser...')
                }
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error)
            }
        }

        ws.onerror = (error) => {
            console.error('WebSocket error:', error)
            setIsConnected(false)
            setIsLaunching(false)
        }

        ws.onclose = () => {
            console.log('WebSocket closed')
            setIsConnected(false)
            setSessionStatus('stopped')
            stopTimer()
        }

        wsRef.current = ws
    }


    // Stop browser session
    const handleStop = () => {
        if (!sessionId) return

        // Send stop command via WebSocket
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ action: 'stop' }))
            wsRef.current.close()
        }

        setSessionId(null)
        setSessionStatus('stopped')
        setScreenshot(null)
        stopTimer()
    }

    // Navigate to URL
    const handleNavigate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!sessionId || !urlInput) return

        try {
            await webAutomationApi.navigateBrowserSession(sessionId, urlInput)
        } catch (error) {
            console.error('Failed to navigate:', error)
        }
    }

    // Send WebSocket message
    const sendWsMessage = (action: string, payload?: any) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ action, ...payload }))
        }
    }

    // Get device icon
    const getDeviceIcon = (type: string) => {
        switch (type) {
            case 'mobile': return <Smartphone className="w-4 h-4" />
            case 'tablet': return <Tablet className="w-4 h-4" />
            default: return <Monitor className="w-4 h-4" />
        }
    }

    // Get viewport display
    const getViewportDisplay = () => {
        const device = devices.find(d => d.id === selectedDevice)
        return device?.viewport || '1920x1080'
    }

    // Get console log icon
    const getLogIcon = (level: string) => {
        switch (level) {
            case 'error': return <XCircle className="w-3 h-3 text-red-400" />
            case 'warning': return <AlertTriangle className="w-3 h-3 text-yellow-400" />
            case 'info': return <Info className="w-3 h-3 text-blue-400" />
            default: return <Terminal className="w-3 h-3 text-gray-400" />
        }
    }

    // Get status color for network requests
    const getStatusColor = (status?: number) => {
        if (!status) return 'text-gray-400'
        if (status >= 200 && status < 300) return 'text-green-400'
        if (status >= 300 && status < 400) return 'text-blue-400'
        if (status >= 400) return 'text-red-400'
        return 'text-gray-400'
    }

    return (
        <div className="flex flex-col h-full bg-gray-100 w-full">
            {/* Top Control Bar */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm z-10 w-full">
                <div className="flex items-center gap-4">
                    {/* Browser & Device Selection */}
                    <div className="flex items-center gap-2">
                        <select
                            className="text-sm border rounded-md px-2 py-1.5 bg-white"
                            value={selectedBrowser}
                            onChange={(e) => setSelectedBrowser(e.target.value)}
                            disabled={sessionStatus === 'running'}
                        >
                            <option value="chromium">Chrome</option>
                            <option value="firefox">Firefox</option>
                            <option value="webkit">Safari</option>
                        </select>

                        <select
                            className="text-sm border rounded-md px-2 py-1.5 bg-white"
                            value={selectedDevice}
                            onChange={(e) => setSelectedDevice(e.target.value)}
                            disabled={sessionStatus === 'running'}
                        >
                            {devices.map(device => (
                                <option key={device.id} value={device.id}>
                                    {device.name}
                                </option>
                            ))}
                        </select>

                        <Badge variant="outline" className="bg-gray-50">
                            {getViewportDisplay()}
                        </Badge>
                    </div>

                    <div className="h-6 w-px bg-gray-300" />

                    {/* Control Buttons */}
                    <div className="flex items-center gap-2">
                        {sessionStatus !== 'running' ? (
                            <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={handleLaunch}
                                disabled={isLaunching}
                            >
                                {isLaunching ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Play className="w-4 h-4 mr-2" />
                                )}
                                Launch
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={handleStop}
                            >
                                <Square className="w-4 h-4 mr-2 fill-current" />
                                Stop
                            </Button>
                        )}

                        <Button size="sm" variant="ghost" disabled={sessionStatus !== 'running'}>
                            <SkipForward className="w-4 h-4" />
                        </Button>

                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => sendWsMessage('navigate', { url: currentUrl })}
                            disabled={sessionStatus !== 'running'}
                        >
                            <RotateCcw className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Status Info */}
                <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-600">
                        <span className="font-medium">Test:</span> {testName}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        {sessionStatus === 'running' ? (
                            <>
                                <span className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    Running
                                </span>
                                <span>{formatTime(elapsedTime)}</span>
                            </>
                        ) : (
                            <span className="text-gray-400">Not running</span>
                        )}
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

                        {/* URL Bar */}
                        <form onSubmit={handleNavigate} className="flex-1 flex items-center gap-2">
                            <div className="flex-1 bg-white rounded-md border border-gray-300 px-3 py-1 flex items-center">
                                <Globe className="w-3.5 h-3.5 mr-2 text-gray-400 flex-shrink-0" />
                                <input
                                    type="text"
                                    className="w-full text-sm text-gray-600 outline-none"
                                    placeholder="Enter URL to navigate..."
                                    value={urlInput}
                                    onChange={(e) => setUrlInput(e.target.value)}
                                />
                            </div>
                            <Button type="submit" size="sm" variant="ghost" disabled={sessionStatus !== 'running'}>
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </form>

                        {/* Connection Status */}
                        <Badge variant={isConnected ? 'default' : 'secondary'} className="text-xs">
                            {isConnected ? '🟢 Live' : '⚪ Offline'}
                        </Badge>
                    </div>

                    {/* Browser Content - Interactive Area */}
                    <div
                        ref={browserContainerRef}
                        className={`flex-1 bg-gray-50 relative overflow-hidden outline-none ${isFocused ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
                        tabIndex={0}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        onKeyDown={(e) => {
                            if (sessionStatus !== 'running' || !isFocused) return

                            // Prevent default for most keys when focused
                            if (e.key !== 'Escape') {
                                e.preventDefault()
                            }

                            // Handle special keys
                            const specialKeys = ['Enter', 'Tab', 'Backspace', 'Delete', 'Escape',
                                'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
                                'Home', 'End', 'PageUp', 'PageDown']

                            if (specialKeys.includes(e.key)) {
                                sendWsMessage('press', { key: e.key })
                            } else if (e.key.length === 1) {
                                // Regular character key
                                sendWsMessage('type', { text: e.key })
                            }
                        }}
                    >
                        {screenshot ? (
                            <img
                                ref={screenshotRef}
                                src={screenshot}
                                alt="Live browser view"
                                className={`w-full h-full object-contain ${inspectMode ? 'cursor-crosshair' : 'cursor-default'}`}
                                style={{ imageRendering: 'auto' }}
                                onClick={(e) => {
                                    if (!inspectMode || sessionStatus !== 'running') return
                                    const img = screenshotRef.current
                                    if (!img) return

                                    // Calculate click position relative to actual page coordinates
                                    const rect = img.getBoundingClientRect()
                                    const imgWidth = img.naturalWidth
                                    const imgHeight = img.naturalHeight
                                    const displayWidth = rect.width
                                    const displayHeight = rect.height

                                    // Calculate the scale and offset for object-contain
                                    const scale = Math.min(displayWidth / imgWidth, displayHeight / imgHeight)
                                    const scaledWidth = imgWidth * scale
                                    const scaledHeight = imgHeight * scale
                                    const offsetX = (displayWidth - scaledWidth) / 2
                                    const offsetY = (displayHeight - scaledHeight) / 2

                                    // Get click position relative to image container
                                    const clickX = e.clientX - rect.left
                                    const clickY = e.clientY - rect.top

                                    // Convert to page coordinates
                                    const pageX = Math.round((clickX - offsetX) / scale)
                                    const pageY = Math.round((clickY - offsetY) / scale)

                                    if (pageX >= 0 && pageY >= 0 && pageX <= imgWidth && pageY <= imgHeight) {
                                        // Send click or inspect action
                                        sendWsMessage('click', { x: pageX, y: pageY })
                                    }
                                }}
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center text-gray-400">
                                    <Monitor className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p className="text-lg mb-2">No browser session active</p>
                                    <p className="text-sm">Click <strong>Launch</strong> to start a browser session</p>
                                </div>
                            </div>
                        )}

                        {/* Focus/Keyboard Mode Indicator */}
                        {sessionStatus === 'running' && (
                            <div className={`absolute top-2 right-2 ${isFocused ? 'bg-green-600' : 'bg-gray-600'} text-white text-xs px-2 py-1 rounded-md shadow-md flex items-center gap-1 transition-colors`}>
                                {isFocused ? (
                                    <>
                                        <Keyboard className="w-3 h-3" />
                                        Typing Mode Active
                                    </>
                                ) : (
                                    <>
                                        <MousePointerClick className="w-3 h-3" />
                                        Click browser to type
                                    </>
                                )}
                            </div>
                        )}

                        {/* Loading Overlay */}
                        {isLaunching && (
                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                <div className="text-center">
                                    <Loader2 className="w-10 h-10 mx-auto mb-3 animate-spin text-blue-600" />
                                    <p className="text-gray-600">Launching browser...</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel - Element Inspector, Steps, Console, Network */}
                <div className="w-96 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                        <div className="px-4 py-2 border-b border-gray-200">
                            <TabsList className="w-full grid grid-cols-4">
                                <TabsTrigger value="element" className="text-xs">Element</TabsTrigger>
                                <TabsTrigger value="steps" className="text-xs">Steps</TabsTrigger>
                                <TabsTrigger value="console" className="text-xs">Console</TabsTrigger>
                                <TabsTrigger value="network" className="text-xs">Network</TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Element Inspector Tab */}
                        <TabsContent value="element" className="flex-1 overflow-y-auto p-0 m-0">
                            {selectedElement ? (
                                <div className="p-4 space-y-4">
                                    {/* Element Summary */}
                                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                                                {selectedElement.tagName}
                                            </Badge>
                                            {selectedElement.isInput && (
                                                <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                                                    Input
                                                </Badge>
                                            )}
                                            {selectedElement.isClickable && (
                                                <Badge variant="outline" className="bg-purple-50 text-purple-700 text-xs">
                                                    Clickable
                                                </Badge>
                                            )}
                                        </div>
                                        {selectedElement.text && (
                                            <p className="text-xs text-gray-600 line-clamp-2">
                                                "{selectedElement.text}"
                                            </p>
                                        )}
                                    </div>

                                    {/* Best Selector */}
                                    <div>
                                        <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <Search className="w-3 h-3" />
                                            Best Selector
                                        </h4>
                                        <div
                                            className="bg-gray-900 text-green-400 font-mono text-xs p-3 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors"
                                            onClick={() => {
                                                navigator.clipboard.writeText(selectedElement.bestSelector)
                                            }}
                                            title="Click to copy"
                                        >
                                            {selectedElement.bestSelector}
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-1">Click to copy</p>
                                    </div>

                                    {/* All Selectors */}
                                    <div>
                                        <h4 className="text-xs font-semibold text-gray-700 mb-2">All Selectors</h4>
                                        <div className="space-y-2">
                                            {selectedElement.selectors?.id && (
                                                <div>
                                                    <label className="text-[10px] text-gray-500 uppercase">ID</label>
                                                    <div
                                                        className="bg-gray-100 font-mono text-xs p-2 rounded cursor-pointer hover:bg-gray-200"
                                                        onClick={() => navigator.clipboard.writeText(selectedElement.selectors.id)}
                                                    >
                                                        {selectedElement.selectors.id}
                                                    </div>
                                                </div>
                                            )}
                                            {selectedElement.selectors?.testId && (
                                                <div>
                                                    <label className="text-[10px] text-gray-500 uppercase">Test ID</label>
                                                    <div
                                                        className="bg-gray-100 font-mono text-xs p-2 rounded cursor-pointer hover:bg-gray-200"
                                                        onClick={() => navigator.clipboard.writeText(selectedElement.selectors.testId)}
                                                    >
                                                        {selectedElement.selectors.testId}
                                                    </div>
                                                </div>
                                            )}
                                            {selectedElement.selectors?.name && (
                                                <div>
                                                    <label className="text-[10px] text-gray-500 uppercase">Name</label>
                                                    <div
                                                        className="bg-gray-100 font-mono text-xs p-2 rounded cursor-pointer hover:bg-gray-200"
                                                        onClick={() => navigator.clipboard.writeText(selectedElement.selectors.name)}
                                                    >
                                                        {selectedElement.selectors.name}
                                                    </div>
                                                </div>
                                            )}
                                            {selectedElement.selectors?.class && (
                                                <div>
                                                    <label className="text-[10px] text-gray-500 uppercase">Class</label>
                                                    <div
                                                        className="bg-gray-100 font-mono text-xs p-2 rounded cursor-pointer hover:bg-gray-200"
                                                        onClick={() => navigator.clipboard.writeText(selectedElement.selectors.class)}
                                                    >
                                                        {selectedElement.selectors.class}
                                                    </div>
                                                </div>
                                            )}
                                            {selectedElement.selectors?.cssPath && (
                                                <div>
                                                    <label className="text-[10px] text-gray-500 uppercase">CSS Path</label>
                                                    <div
                                                        className="bg-gray-100 font-mono text-xs p-2 rounded cursor-pointer hover:bg-gray-200 break-all"
                                                        onClick={() => navigator.clipboard.writeText(selectedElement.selectors.cssPath)}
                                                    >
                                                        {selectedElement.selectors.cssPath}
                                                    </div>
                                                </div>
                                            )}
                                            {selectedElement.selectors?.xpath && (
                                                <div>
                                                    <label className="text-[10px] text-gray-500 uppercase">XPath</label>
                                                    <div
                                                        className="bg-gray-100 font-mono text-xs p-2 rounded cursor-pointer hover:bg-gray-200 break-all"
                                                        onClick={() => navigator.clipboard.writeText(selectedElement.selectors.xpath)}
                                                    >
                                                        {selectedElement.selectors.xpath}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Element Attributes */}
                                    <div>
                                        <h4 className="text-xs font-semibold text-gray-700 mb-2">Attributes</h4>
                                        <div className="text-xs space-y-1 bg-gray-50 p-2 rounded">
                                            {selectedElement.id && <div><span className="text-gray-500">id:</span> {selectedElement.id}</div>}
                                            {selectedElement.name && <div><span className="text-gray-500">name:</span> {selectedElement.name}</div>}
                                            {selectedElement.type && <div><span className="text-gray-500">type:</span> {selectedElement.type}</div>}
                                            {selectedElement.placeholder && <div><span className="text-gray-500">placeholder:</span> {selectedElement.placeholder}</div>}
                                            {selectedElement.href && <div><span className="text-gray-500">href:</span> <span className="text-blue-600 truncate block">{selectedElement.href}</span></div>}
                                        </div>
                                    </div>

                                    {/* Type Text Input */}
                                    {selectedElement.isInput && (
                                        <div>
                                            <h4 className="text-xs font-semibold text-gray-700 mb-2">Type Text</h4>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    className="flex-1 text-sm border rounded px-2 py-1"
                                                    placeholder="Enter text to type..."
                                                    value={typingText}
                                                    onChange={(e) => setTypingText(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && typingText) {
                                                            sendWsMessage('type', { text: typingText })
                                                            setTypingText('')
                                                        }
                                                    }}
                                                />
                                                <Button
                                                    size="sm"
                                                    onClick={() => {
                                                        if (typingText) {
                                                            sendWsMessage('type', { text: typingText })
                                                            setTypingText('')
                                                        }
                                                    }}
                                                >
                                                    <Type className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-gray-400">
                                    <MousePointerClick className="w-10 h-10 mx-auto mb-3 opacity-50" />
                                    <p className="text-sm font-medium">Click on an element</p>
                                    <p className="text-xs mt-1">to inspect and get selectors</p>
                                </div>
                            )}
                        </TabsContent>

                        {/* Steps Tab */}
                        <TabsContent value="steps" className="flex-1 overflow-y-auto p-0 m-0">
                            {steps.length > 0 ? (
                                <div className="divide-y divide-gray-100">
                                    {steps.map((step, index) => (
                                        <div
                                            key={step.id}
                                            className={`p-3 flex items-start gap-3 cursor-pointer hover:bg-gray-50 ${step.status === 'running' ? 'bg-blue-50' : ''
                                                }`}
                                            onClick={() => onStepClick?.(step.id)}
                                        >
                                            <div className="mt-0.5">
                                                {step.status === 'passed' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                                                {step.status === 'running' && (
                                                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                                )}
                                                {step.status === 'failed' && <XCircle className="w-4 h-4 text-red-600" />}
                                                {step.status === 'pending' && (
                                                    <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className={`text-sm font-medium ${step.status === 'running' ? 'text-blue-700' :
                                                        step.status === 'failed' ? 'text-red-700' :
                                                            'text-gray-900'
                                                        }`}>
                                                        {step.action}
                                                    </span>
                                                    <span className="text-xs text-gray-500">{step.duration || '-'}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {step.selector || step.value || '-'}
                                                </p>
                                                {step.error && (
                                                    <p className="text-xs text-red-500 mt-1">{step.error}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-gray-400">
                                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No steps to display</p>
                                </div>
                            )}
                        </TabsContent>

                        {/* Console Tab */}
                        <TabsContent value="console" className="flex-1 overflow-y-auto p-0 m-0 bg-gray-900 text-gray-100 font-mono text-xs">
                            {consoleLogs.length > 0 ? (
                                <div className="p-3 space-y-1">
                                    {consoleLogs.map((log, i) => (
                                        <div key={i} className="flex items-start gap-2">
                                            {getLogIcon(log.level)}
                                            <span className={`flex-1 ${log.level === 'error' ? 'text-red-400' :
                                                log.level === 'warning' ? 'text-yellow-400' :
                                                    'text-gray-300'
                                                }`}>
                                                {log.text}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-gray-500">
                                    <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Console output will appear here</p>
                                </div>
                            )}
                        </TabsContent>

                        {/* Network Tab */}
                        <TabsContent value="network" className="flex-1 overflow-y-auto p-0 m-0 min-h-0">
                            {networkRequests.length > 0 ? (
                                <div className="divide-y divide-gray-100">
                                    {networkRequests.map((req, i) => (
                                        <div key={i} className="p-2 hover:bg-gray-50">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                    {req.method}
                                                </Badge>
                                                <span className={`text-xs font-mono ${getStatusColor(req.status)}`}>
                                                    {req.status || '...'}
                                                </span>
                                                <span className="text-[10px] text-gray-400">{req.resource_type}</span>
                                            </div>
                                            <p className="text-xs text-gray-600 truncate" title={req.url}>
                                                {req.url}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-gray-400">
                                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Network requests will appear here</p>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>

                    {/* Bottom Debug Bar */}
                    <div className="p-3 border-t border-gray-200 bg-gray-50">
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-xs h-8"
                                onClick={() => setActiveTab('console')}
                            >
                                <Terminal className="w-3.5 h-3.5 mr-1.5" />
                                Console
                                {consoleLogs.length > 0 && (
                                    <Badge variant="secondary" className="ml-1.5 text-[10px]">
                                        {consoleLogs.length}
                                    </Badge>
                                )}
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-xs h-8"
                                onClick={() => setActiveTab('network')}
                            >
                                <Activity className="w-3.5 h-3.5 mr-1.5" />
                                Network
                                {networkRequests.length > 0 && (
                                    <Badge variant="secondary" className="ml-1.5 text-[10px]">
                                        {networkRequests.length}
                                    </Badge>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    )
}
