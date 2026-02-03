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
    ChevronDown,
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
    Keyboard,
    Wand2
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
    testToRun?: { flowId: string; testName: string } | null
    onTestComplete?: () => void
    executionSettings?: {
        videoRecording: boolean
        screenshotOnFailure: boolean
        screenshotEachStep: boolean
        aiSelfHeal: boolean
    }
}

export default function LiveBrowserTab({
    projectId,
    testFlowId,
    testName = 'Untitled Test',
    steps = [],
    onStepClick,
    testToRun,
    onTestComplete,
    executionSettings
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
    const [currentTestName, setCurrentTestName] = useState<string>('')
    const [executingSteps, setExecutingSteps] = useState<Array<{
        index: number
        name: string
        type: string
        status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped' | 'healed'
        error?: string
        selector?: string
        value?: string
        url?: string
        expected_count?: number
        comparison?: string
        variable_name?: string
        key?: string
        cookie_name?: string
        healingStatus?: 'attempting' | 'healed' | 'failed'
        healingMessage?: string
        healingStrategy?: string
        healingConfidence?: number
        healingOriginal?: string
        healingHealed?: string
        healingReasoning?: string
        logMessage?: string
        apiStatus?: number
        // Snippet-specific fields
        snippetName?: string
        subSteps?: Array<{
            index: number
            name: string
            type: string
            status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped' | 'healed'
            error?: string
            selector?: string
            value?: string
            url?: string
            timeout?: number | string
            expectedUrl?: string
            expectedTitle?: string
            comparison?: string
            healingStatus?: 'attempting' | 'healed' | 'failed'
            healingMessage?: string
            healingStrategy?: string
            healingConfidence?: number
            healingOriginal?: string
            healingHealed?: string
            healingReasoning?: string
        }>
    }>>([])

    const [pendingStepPreview, setPendingStepPreview] = useState<Array<{
        name: string
        type: string
        selector?: string
        value?: string
        url?: string
        expected_count?: number
        comparison?: string
        variable_name?: string
        key?: string
        cookie_name?: string
    }>>([])

    // Element Inspector
    const [inspectMode, setInspectMode] = useState(true) // Enable inspector by default
    const [selectedElement, setSelectedElement] = useState<any>(null)

    const formatActionName = useCallback((actionType: string) => {
        const actionNames: Record<string, string> = {
            navigate: 'Navigate',
            click: 'Click',
            type: 'Type',
            fill: 'Fill',
            assert: 'Assert',
            assert_title: 'Assert Title',
            assert_url: 'Assert URL',
            assert_visible: 'Assert Visible',
            assert_text: 'Assert Text',
            assert_value: 'Assert Value',
            assert_not_visible: 'Assert Hidden',
            assert_element_count: 'Assert Count',
            soft_assert: 'Soft Assert',
            wait: 'Wait',
            wait_for_element: 'Wait for Element',
            screenshot: 'Screenshot',
            hover: 'Hover',
            scroll: 'Scroll',
            select: 'Select',
            upload: 'Upload',
            press: 'Press Key',
            double_click: 'Double Click',
            right_click: 'Right Click',
            focus: 'Focus',
            drag_drop: 'Drag and Drop',
            execute_script: 'Execute Script',
            set_variable: 'Set Variable',
            log: 'Log',
            reload: 'Reload',
            go_back: 'Go Back',
            go_forward: 'Go Forward'
        }
        return actionNames[actionType] || actionType.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
    }, [])

    const buildStepPreview = useCallback((nodes: any[]) => {
        return (nodes || []).map((node, index) => {
            const data = node?.data || {}
            const actionType = data.actionType || data.action || data.type || node?.type || 'pending'
            const label = data.label || data.description || data.name || `Step ${index + 1}`
            const rawSelector = data.selector
            const selector = typeof rawSelector === 'string'
                ? rawSelector
                : rawSelector?.primary || rawSelector?.css || rawSelector?.selector
            return {
                name: label || formatActionName(actionType),
                type: actionType,
                selector,
                value: data.value,
                url: data.url,
                expected_count: data.expected_count,
                comparison: data.comparison,
                variable_name: data.variable_name,
                key: data.key,
                cookie_name: data.cookie_name
            }
        })
    }, [formatActionName])

    useEffect(() => {
        const flowId = testToRun?.flowId || testFlowId
        if (!flowId) return

        let isMounted = true
        webAutomationApi.getTestFlow(flowId)
            .then(flow => {
                if (!isMounted) return
                const preview = buildStepPreview(flow.nodes || [])
                setPendingStepPreview(preview)
            })
            .catch(err => {
                console.error('Failed to load flow steps for preview:', err)
            })
        return () => {
            isMounted = false
        }
    }, [testToRun?.flowId, testFlowId, buildStepPreview])
    const [typingText, setTypingText] = useState('')
    const screenshotRef = useRef<HTMLImageElement>(null)

    // Headed mode for direct interaction
    const [headedMode, setHeadedMode] = useState(false)

    // Interactive mode - when focused, forward keyboard to browser
    const [isFocused, setIsFocused] = useState(false)

    // Expanded snippets state - track which snippet steps are expanded
    const [expandedSnippets, setExpandedSnippets] = useState<Record<number, boolean>>({})

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

    // Store pending test to run after browser launches
    const [pendingTestFlowId, setPendingTestFlowId] = useState<string | null>(null)
    const testRunInitiatedRef = useRef(false)
    const executeSentRef = useRef(false)

    // When testToRun prop is passed, prepare for test execution
    useEffect(() => {
        if (!testToRun || testRunInitiatedRef.current) {
            return
        }

        testRunInitiatedRef.current = true
        executeSentRef.current = false

        // Store the test to run after browser is launched
        setPendingTestFlowId(testToRun.flowId)

        // Get test flow to find starting URL (only from navigate steps)
        webAutomationApi.getTestFlow(testToRun.flowId).then(testFlow => {
            // Find first navigate step - don't use URLs from API calls
            const navigateStep = testFlow.nodes?.find((step: any) => {
                const stepType = step?.data?.action || step?.data?.type || step?.action || step?.type
                return stepType === 'navigate' && step?.data?.url
            })
            const startUrl = navigateStep?.data?.url || ''

            // Pre-fill the URL input only if we have a navigate step
            if (startUrl) {
                setUrlInput(startUrl)
            }

            // Auto-trigger the existing handleLaunch function after a short delay
            setTimeout(() => {
                const launchBtn = document.querySelector('[data-launch-btn]') as HTMLButtonElement
                if (launchBtn) {
                    launchBtn.click()
                }
            }, 100)
        }).catch(error => {
            console.error('Failed to get test flow:', error)
            testRunInitiatedRef.current = false
            onTestComplete?.()
        })

        return () => {
            testRunInitiatedRef.current = false
            executeSentRef.current = false
        }
    }, [testToRun])


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
                // If there's a pending test to execute, run it now
                if (pendingTestFlowId && !executeSentRef.current && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                    console.log('Session started, executing pending test:', pendingTestFlowId)
                    wsRef.current.send(JSON.stringify({
                        action: 'execute_test',
                        flowId: pendingTestFlowId,
                        executionSettings: executionSettings || {
                            videoRecording: true,
                            screenshotOnFailure: true,
                            screenshotEachStep: false,
                            aiSelfHeal: true
                        }
                    }))
                    executeSentRef.current = true
                    setPendingTestFlowId(null)
                }
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

            // Test execution messages
            case 'test_execution_started':
                console.log('Test execution started:', data.flowId, 'Total steps:', data.totalSteps, 'Test:', data.testName)
                // Set the test name from backend response
                setCurrentTestName(data.testName || testToRun?.testName || testName)
                // Initialize steps as pending and switch to steps tab
                setExecutingSteps(Array.from({ length: data.totalSteps }, (_, i) => {
                    const preview = pendingStepPreview[i]
                    return {
                        index: i,
                        name: preview?.name || `Step ${i + 1}`,
                        type: preview?.type || 'pending',
                        status: 'pending' as const,
                        selector: preview?.selector,
                        url: preview?.url,
                        value: preview?.value,
                        expected_count: preview?.expected_count,
                        comparison: preview?.comparison,
                        variable_name: preview?.variable_name,
                        key: preview?.key,
                        cookie_name: preview?.cookie_name
                    }
                }))
                setActiveTab('steps')
                break

            case 'step_started':
                console.log(`Step ${data.stepIndex + 1}: ${data.stepName} (${data.stepType})`, data)
                setCurrentStep(data.stepIndex)
                setExecutingSteps(prev => prev.map((step, i) =>
                    i === data.stepIndex
                        ? {
                            ...step,
                            name: data.stepName,
                            type: data.stepType,
                            status: 'running' as const,
                            selector: data.selector,
                            url: data.url,
                            value: data.value
                        }
                        : step
                ))
                break

            case 'step_completed':
                console.log(`Step ${data.stepIndex + 1} ${data.status}`, data.error || '')
                setExecutingSteps(prev => prev.map((step, i) =>
                    i === data.stepIndex
                        ? { ...step, status: data.status as 'passed' | 'failed' | 'skipped' | 'healed', error: data.error }
                        : step
                ))
                break

            case 'healing_attempt':
                setExecutingSteps(prev => prev.map((step, i) =>
                    i === data.stepIndex
                        ? {
                            ...step,
                            healingStatus: 'attempting',
                            healingMessage: `Trying self-heal for ${data.action || step.type}`,
                            healingStrategy: undefined,
                            healingConfidence: undefined
                        }
                        : step
                ))
                break

            case 'healing_result':
                setExecutingSteps(prev => prev.map((step, i) =>
                    i === data.stepIndex
                        ? {
                            ...step,
                            healingStatus: data.status === 'healed' ? 'healed' : 'failed',
                            healingMessage: data.status === 'healed'
                                ? `Healed with ${data.strategy || 'ai'}`
                                : 'Self-heal failed',
                            healingStrategy: data.strategy,
                            healingConfidence: data.confidence,
                            healingOriginal: data.original,
                            healingHealed: data.healed,
                            healingReasoning: data.reasoning
                        }
                        : step
                ))
                break

            // Snippet execution messages  
            case 'snippet_started':
                console.log(`Snippet started: ${data.snippetName} (${data.totalSubSteps} steps)`)
                // Auto-expand the snippet when it starts executing
                setExpandedSnippets(prev => ({ ...prev, [data.stepIndex]: true }))
                setExecutingSteps(prev => prev.map((step, i) =>
                    i === data.stepIndex
                        ? {
                            ...step,
                            name: data.snippetName,
                            snippetName: data.snippetName,
                            subSteps: Array.from({ length: data.totalSubSteps }, (_, idx) => ({
                                index: idx,
                                name: `Step ${idx + 1}`,
                                type: 'pending',
                                status: 'pending' as const
                            }))
                        }
                        : step
                ))
                break

            case 'snippet_substep_started':
                console.log(`Snippet sub-step ${data.subStepIndex + 1}: ${data.subStepName}`)
                setExecutingSteps(prev => prev.map((step, i) =>
                    i === data.stepIndex && step.subSteps
                        ? {
                            ...step,
                            subSteps: step.subSteps.map((subStep, si) =>
                                si === data.subStepIndex
                                    ? {
                                        ...subStep,
                                        name: data.subStepName,
                                        type: data.subStepType,
                                        status: 'running' as const,
                                        selector: data.selector,
                                        value: data.value,
                                        url: data.url,
                                        timeout: data.timeout,
                                        expectedUrl: data.expectedUrl,
                                        expectedTitle: data.expectedTitle,
                                        comparison: data.comparison
                                    }
                                    : subStep
                            )
                        }
                        : step
                ))
                break

            case 'snippet_substep_completed':
                console.log(`Snippet sub-step ${data.subStepIndex + 1} ${data.status}`)
                setExecutingSteps(prev => prev.map((step, i) =>
                    i === data.stepIndex && step.subSteps
                        ? {
                            ...step,
                            subSteps: step.subSteps.map((subStep, si) =>
                                si === data.subStepIndex
                                    ? {
                                        ...subStep,
                                        status: data.status as 'passed' | 'failed',
                                        error: data.error
                                    }
                                    : subStep
                            )
                        }
                        : step
                ))
                break

            case 'test_execution_completed':
                console.log('Test execution completed:', data.flowId)
                testRunInitiatedRef.current = false
                executeSentRef.current = false
                // Keep browser session open after run to allow self-heal inspection
                onTestComplete?.()
                break

            case 'error':
                console.error('Browser session error:', data.error)
                testRunInitiatedRef.current = false
                executeSentRef.current = false
                break

            case 'log_message':
                // Store the logged message in the step's state
                console.log(`[LOG ${data.level}] ${data.message}`)
                setExecutingSteps(prev => prev.map((step, i) =>
                    i === data.stepIndex
                        ? { ...step, logMessage: data.message }
                        : step
                ))
                // Also add to console logs
                setConsoleLogs(prev => [...prev.slice(-99), {
                    level: data.level || 'info',
                    text: data.message,
                    timestamp: new Date().toISOString()
                }])
                break

            case 'api_response':
                // Store API status in the step
                console.log(`[API] Status: ${data.status}`)
                setExecutingSteps(prev => prev.map((step, i) =>
                    i === data.stepIndex
                        ? { ...step, apiStatus: data.status }
                        : step
                ))
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
                headless: !headedMode, // headed mode = not headless
                projectId: projectId,
                recordVideo: executionSettings?.videoRecording ?? false
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
                    <div className="flex items-center gap-3">
                        {/* Browser Selector */}
                        <div className="relative">
                            <select
                                className="text-sm border border-gray-200 rounded-lg pl-9 pr-8 py-2 bg-white hover:bg-gray-50 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-medium"
                                value={selectedBrowser}
                                onChange={(e) => setSelectedBrowser(e.target.value)}
                                disabled={sessionStatus === 'running'}
                            >
                                <option value="chromium">Chrome</option>
                                <option value="firefox">Firefox</option>
                                <option value="webkit">Safari</option>
                            </select>
                            {/* Browser Icon */}
                            <div className="pointer-events-none absolute left-2.5 top-1/2 transform -translate-y-1/2">
                                {selectedBrowser === 'chromium' && (
                                    <svg className="w-4 h-4" viewBox="0 0 48 48">
                                        <circle cx="24" cy="24" r="22" fill="#fff" />
                                        <path d="M24 4C12.954 4 4 12.954 4 24h20V4z" fill="#EA4335" />
                                        <path d="M4 24c0 11.046 8.954 20 20 20V24H4z" fill="#FBBC05" />
                                        <path d="M24 44c11.046 0 20-8.954 20-20H24v20z" fill="#34A853" />
                                        <path d="M44 24c0-11.046-8.954-20-20-20v20h20z" fill="#4285F4" />
                                        <circle cx="24" cy="24" r="10" fill="#fff" />
                                        <circle cx="24" cy="24" r="8" fill="#4285F4" />
                                    </svg>
                                )}
                                {selectedBrowser === 'firefox' && (
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#FF7139">
                                        <path d="M20.452 3.445a11.002 11.002 0 00-2.482-1.908C16.944.997 15.098.093 12.477.032c-.734-.017-1.457.03-2.174.144-.72.114-1.398.292-2.118.56-1.017.377-1.996.975-2.574 1.554.583-.349 1.476-.733 2.55-.992a10.083 10.083 0 013.729-.167c2.341.34 4.178 1.381 5.48 2.625a8.066 8.066 0 011.298 1.587c1.468 2.382 1.33 5.376.184 7.142-.85 1.312-2.67 2.544-4.37 2.53-.583-.023-1.438-.152-2.25-.566-2.629-1.343-3.021-4.688-1.118-6.306-.632-.136-1.82.13-2.646 1.363-.742 1.107-.7 2.816-.242 4.028a6.473 6.473 0 01-.59-1.895 7.695 7.695 0 01.416-3.845A8.212 8.212 0 019.45 5.399c.896-1.069 1.908-1.72 2.75-2.005-.54-.471-1.411-.738-2.421-.767C8.31 2.583 6.327 3.061 4.7 4.41a8.148 8.148 0 00-1.976 2.414c-.455.836-.691 1.659-.697 1.678.122-1.445.704-2.994 1.248-4.055-.79.413-1.827 1.668-2.41 3.042C.095 9.37-.2 11.608.14 13.989c.966 5.668 5.9 9.982 11.843 9.982C18.62 23.971 24 18.591 24 11.956a11.93 11.93 0 00-3.548-8.511z" />
                                    </svg>
                                )}
                                {selectedBrowser === 'webkit' && (
                                    <svg className="w-4 h-4" viewBox="0 0 48 48">
                                        <circle cx="24" cy="24" r="22" fill="#fff" stroke="#5AC8FA" strokeWidth="3" />
                                        <circle cx="24" cy="24" r="18" fill="#fff" />
                                        {/* Compass tick marks */}
                                        <line x1="24" y1="8" x2="24" y2="12" stroke="#5AC8FA" strokeWidth="2" />
                                        <line x1="24" y1="36" x2="24" y2="40" stroke="#5AC8FA" strokeWidth="2" />
                                        <line x1="8" y1="24" x2="12" y2="24" stroke="#5AC8FA" strokeWidth="2" />
                                        <line x1="36" y1="24" x2="40" y2="24" stroke="#5AC8FA" strokeWidth="2" />
                                        {/* Compass needle */}
                                        <polygon points="24,10 28,24 24,28 20,24" fill="#FF3B30" />
                                        <polygon points="24,38 20,24 24,20 28,24" fill="#4A4A4A" />
                                    </svg>
                                )}
                            </div>
                        </div>

                        {/* Device Selector */}
                        <div className="relative">
                            <select
                                className="text-sm border border-gray-200 rounded-lg pl-9 pr-8 py-2 bg-white hover:bg-gray-50 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-medium min-w-[160px]"
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
                            {/* Device Icon */}
                            <div className="pointer-events-none absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-500">
                                {selectedDevice.toLowerCase().includes('mobile') || selectedDevice.toLowerCase().includes('iphone') || selectedDevice.toLowerCase().includes('pixel') ? (
                                    <Smartphone className="w-4 h-4" />
                                ) : selectedDevice.toLowerCase().includes('tablet') || selectedDevice.toLowerCase().includes('ipad') ? (
                                    <Tablet className="w-4 h-4" />
                                ) : (
                                    <Monitor className="w-4 h-4" />
                                )}
                            </div>
                        </div>

                        {/* Viewport Badge */}
                        <Badge variant="outline" className="bg-gray-50 border-gray-200 text-gray-600 font-mono text-xs px-2.5 py-1.5">
                            <Layout className="w-3 h-3 mr-1.5 text-gray-400" />
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
                                data-launch-btn
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
                        <span className="font-medium">Test:</span> {testToRun?.testName || testName}
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
                        <div className="px-4 py-3 border-b border-gray-200">
                            <TabsList className="w-full grid grid-cols-4 gap-1">
                                <TabsTrigger value="element" className="text-xs px-3 py-2">Element</TabsTrigger>
                                <TabsTrigger value="steps" className="text-xs px-3 py-2">Steps</TabsTrigger>
                                <TabsTrigger value="console" className="text-xs px-3 py-2">Console</TabsTrigger>
                                <TabsTrigger value="network" className="text-xs px-3 py-2">Network</TabsTrigger>
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
                                            {(() => {
                                                let idx = 0;
                                                const items = [];
                                                if (selectedElement.id) {
                                                    idx++;
                                                    items.push(
                                                        <div
                                                            key="id"
                                                            className="font-mono text-purple-600 cursor-pointer hover:bg-purple-50 px-1 rounded flex items-center gap-2"
                                                            onClick={() => navigator.clipboard.writeText(`#${selectedElement.id}`)}
                                                            title="Click to copy"
                                                        >
                                                            <span className="text-gray-400 text-[10px] w-4">{idx}.</span>
                                                            #{selectedElement.id}
                                                        </div>
                                                    );
                                                }
                                                if (selectedElement.name) {
                                                    idx++;
                                                    items.push(
                                                        <div
                                                            key="name"
                                                            className="font-mono text-blue-600 cursor-pointer hover:bg-blue-50 px-1 rounded flex items-center gap-2"
                                                            onClick={() => navigator.clipboard.writeText(`[name="${selectedElement.name}"]`)}
                                                            title="Click to copy"
                                                        >
                                                            <span className="text-gray-400 text-[10px] w-4">{idx}.</span>
                                                            [name="{selectedElement.name}"]
                                                        </div>
                                                    );
                                                }
                                                if (selectedElement.type) {
                                                    idx++;
                                                    items.push(
                                                        <div
                                                            key="type"
                                                            className="font-mono text-gray-600 cursor-pointer hover:bg-gray-100 px-1 rounded flex items-center gap-2"
                                                            onClick={() => navigator.clipboard.writeText(`[type="${selectedElement.type}"]`)}
                                                            title="Click to copy"
                                                        >
                                                            <span className="text-gray-400 text-[10px] w-4">{idx}.</span>
                                                            [type="{selectedElement.type}"]
                                                        </div>
                                                    );
                                                }
                                                if (selectedElement.placeholder) {
                                                    idx++;
                                                    items.push(
                                                        <div
                                                            key="placeholder"
                                                            className="font-mono text-green-600 cursor-pointer hover:bg-green-50 px-1 rounded flex items-center gap-2"
                                                            onClick={() => navigator.clipboard.writeText(`[placeholder="${selectedElement.placeholder}"]`)}
                                                            title="Click to copy"
                                                        >
                                                            <span className="text-gray-400 text-[10px] w-4">{idx}.</span>
                                                            [placeholder="{selectedElement.placeholder}"]
                                                        </div>
                                                    );
                                                }
                                                if (selectedElement.href) {
                                                    idx++;
                                                    items.push(
                                                        <div
                                                            key="href"
                                                            className="font-mono text-blue-600 cursor-pointer hover:bg-blue-50 px-1 rounded truncate flex items-center gap-2"
                                                            onClick={() => navigator.clipboard.writeText(`[href="${selectedElement.href}"]`)}
                                                            title="Click to copy"
                                                        >
                                                            <span className="text-gray-400 text-[10px] w-4">{idx}.</span>
                                                            [href="{selectedElement.href}"]
                                                        </div>
                                                    );
                                                }
                                                return items;
                                            })()}
                                        </div>

                                        {/* Combined Selector for uniqueness */}
                                        {(() => {
                                            const parts = [selectedElement.tagName?.toLowerCase() || ''];
                                            if (selectedElement.id) parts[0] += `#${selectedElement.id}`;
                                            else {
                                                if (selectedElement.type) parts.push(`[type="${selectedElement.type}"]`);
                                                if (selectedElement.name) parts.push(`[name="${selectedElement.name}"]`);
                                                if (selectedElement.placeholder) parts.push(`[placeholder="${selectedElement.placeholder}"]`);
                                            }
                                            const combined = parts.join('');
                                            if (combined && combined !== (selectedElement.tagName?.toLowerCase() || '')) {
                                                return (
                                                    <div className="mt-2 pt-2 border-t border-gray-200">
                                                        <div className="text-[10px] text-gray-500 mb-1">Combined (unique)</div>
                                                        <div
                                                            className="font-mono text-xs text-emerald-600 cursor-pointer hover:bg-emerald-50 px-1 py-0.5 rounded bg-emerald-50/50"
                                                            onClick={() => navigator.clipboard.writeText(combined)}
                                                            title="Click to copy combined selector"
                                                        >
                                                            {combined}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}

                                        {/* Index-based Selectors (when multiple matches) */}
                                        {selectedElement.indices && (() => {
                                            const indexItems: React.ReactNode[] = [];
                                            const indices = selectedElement.indices as Record<string, { index: number, total: number }>;

                                            if (indices.type && indices.type.total > 1) {
                                                const selector = `[type="${selectedElement.type}"] >> nth=${indices.type.index}`;
                                                indexItems.push(
                                                    <div
                                                        key="type-idx"
                                                        className="font-mono text-orange-600 cursor-pointer hover:bg-orange-50 px-1 rounded flex items-center justify-between"
                                                        onClick={() => navigator.clipboard.writeText(selector)}
                                                        title="Click to copy"
                                                    >
                                                        <span>{selector}</span>
                                                        <span className="text-[10px] text-gray-400">({indices.type.index + 1} of {indices.type.total})</span>
                                                    </div>
                                                );
                                            }
                                            if (indices.placeholder && indices.placeholder.total > 1) {
                                                const selector = `[placeholder="${selectedElement.placeholder}"] >> nth=${indices.placeholder.index}`;
                                                indexItems.push(
                                                    <div
                                                        key="placeholder-idx"
                                                        className="font-mono text-orange-600 cursor-pointer hover:bg-orange-50 px-1 rounded flex items-center justify-between"
                                                        onClick={() => navigator.clipboard.writeText(selector)}
                                                        title="Click to copy"
                                                    >
                                                        <span>{selector}</span>
                                                        <span className="text-[10px] text-gray-400">({indices.placeholder.index + 1} of {indices.placeholder.total})</span>
                                                    </div>
                                                );
                                            }
                                            if (indices.tag && indices.tag.total > 1 && !selectedElement.id) {
                                                const selector = `${selectedElement.tagName?.toLowerCase()} >> nth=${indices.tag.index}`;
                                                indexItems.push(
                                                    <div
                                                        key="tag-idx"
                                                        className="font-mono text-orange-600 cursor-pointer hover:bg-orange-50 px-1 rounded flex items-center justify-between"
                                                        onClick={() => navigator.clipboard.writeText(selector)}
                                                        title="Click to copy"
                                                    >
                                                        <span>{selector}</span>
                                                        <span className="text-[10px] text-gray-400">({indices.tag.index + 1} of {indices.tag.total})</span>
                                                    </div>
                                                );
                                            }

                                            if (indexItems.length > 0) {
                                                return (
                                                    <div className="mt-2 pt-2 border-t border-gray-200">
                                                        <div className="text-[10px] text-gray-500 mb-1">With Index (nth)</div>
                                                        <div className="space-y-1 text-xs">
                                                            {indexItems}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
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

                        {/* Steps Tab - Cypress-style light theme */}
                        <TabsContent value="steps" className="flex-1 overflow-y-auto p-0 m-0 bg-gray-50">
                            {executingSteps.length > 0 ? (
                                <div className="p-3">
                                    {/* Test Header Card */}
                                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-3 overflow-hidden">
                                        {/* Progress Bar */}
                                        <div className="h-1 bg-gray-100">
                                            <div
                                                className={`h-full transition-all duration-300 ${executingSteps.some(s => s.status === 'failed')
                                                    ? 'bg-red-500'
                                                    : 'bg-green-500'
                                                    }`}
                                                style={{
                                                    width: `${(executingSteps.filter(s => s.status === 'passed' || s.status === 'failed' || s.status === 'healed').length / executingSteps.length) * 100}%`
                                                }}
                                            />
                                        </div>

                                        <div className="px-4 py-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    {executingSteps.every(s => s.status === 'passed' || s.status === 'healed') ? (
                                                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                        </div>
                                                    ) : executingSteps.some(s => s.status === 'failed') ? (
                                                        <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                                                            <XCircle className="w-4 h-4 text-red-600" />
                                                        </div>
                                                    ) : executingSteps.some(s => s.status === 'running') ? (
                                                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                                            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                                                            <div className="w-3 h-3 rounded-full bg-gray-300" />
                                                        </div>
                                                    )}
                                                    <span className="text-indigo-600 font-semibold text-sm">
                                                        {currentTestName || testToRun?.testName || testName}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full font-medium">
                                                        {executingSteps.filter(s => s.status === 'passed').length} passed
                                                    </span>
                                                    {executingSteps.some(s => s.status === 'healed') && (
                                                        <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full font-medium">
                                                            {executingSteps.filter(s => s.status === 'healed').length} healed
                                                        </span>
                                                    )}
                                                    {executingSteps.some(s => s.status === 'failed') && (
                                                        <span className="px-2 py-1 bg-red-50 text-red-700 rounded-full font-medium">
                                                            {executingSteps.filter(s => s.status === 'failed').length} failed
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Steps List */}
                                    <div className="space-y-2">
                                        {executingSteps.map((step, index) => (
                                            <div
                                                key={step.index}
                                                className={`bg-white rounded-lg border shadow-sm overflow-hidden transition-all ${step.status === 'running'
                                                    ? 'border-blue-300 ring-2 ring-blue-100'
                                                    : step.status === 'healed'
                                                        ? 'border-orange-300 ring-2 ring-orange-100'
                                                        : step.status === 'passed'
                                                            ? 'border-gray-200'
                                                            : step.status === 'failed'
                                                                ? 'border-red-300'
                                                                : step.status === 'skipped'
                                                                    ? 'border-gray-200'
                                                                    : 'border-gray-100 opacity-60'
                                                    }`}
                                            >
                                                <div className={`flex items-start p-3 ${step.status === 'running' ? 'bg-blue-50/50' :
                                                    step.status === 'failed' ? 'bg-red-50/50' :
                                                        step.status === 'healed' ? 'bg-orange-50/60' : ''
                                                    }`}>
                                                    {/* Step Number Circle */}
                                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${step.status === 'passed' ? 'bg-green-500 text-white' :
                                                        step.status === 'healed' ? 'bg-orange-500 text-white' :
                                                        step.status === 'running' ? 'bg-blue-500 text-white' :
                                                            step.status === 'failed' ? 'bg-red-500 text-white' :
                                                                step.status === 'skipped' ? 'bg-gray-400 text-white' :
                                                                'bg-gray-200 text-gray-500'
                                                        }`}>
                                                        {step.status === 'passed' ? (
                                                            <CheckCircle2 className="w-4 h-4" />
                                                        ) : step.status === 'healed' ? (
                                                            <Wand2 className="w-4 h-4" />
                                                        ) : step.status === 'running' ? (
                                                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                        ) : step.status === 'failed' ? (
                                                            <XCircle className="w-4 h-4" />
                                                        ) : step.status === 'skipped' ? (
                                                            <SkipForward className="w-4 h-4" />
                                                        ) : (
                                                            step.index + 1
                                                        )}
                                                    </div>

                                                    {/* Step Content */}
                                                    <div className="flex-1 min-w-0 ml-3">
                                                        {/* Action Row */}
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`font-semibold text-sm ${step.status === 'running' ? 'text-blue-700' :
                                                                step.status === 'passed' ? 'text-gray-900' :
                                                                    step.status === 'healed' ? 'text-orange-700' :
                                                                        step.status === 'failed' ? 'text-red-700' :
                                                                            step.status === 'skipped' ? 'text-gray-600' :
                                                                                'text-gray-400'
                                                                }`}>
                                                                {step.type === 'navigate' && 'Navigate'}
                                                                {step.type === 'click' && 'Click'}
                                                                {step.type === 'type' && 'Type'}
                                                                {step.type === 'fill' && 'Fill'}
                                                                {step.type === 'assert' && 'Assert'}
                                                                {step.type === 'assert_title' && 'Assert Title'}
                                                                {step.type === 'assert_url' && 'Assert URL'}
                                                                {step.type === 'assert_element_count' && 'Assert Count'}
                                                                {step.type === 'assert_not_visible' && 'Assert Hidden'}
                                                                {step.type === 'wait' && 'Wait'}
                                                                {step.type === 'screenshot' && 'Screenshot'}
                                                                {step.type === 'set_variable' && 'Set Variable'}
                                                                {step.type === 'extract_text' && 'Extract Text'}
                                                                {step.type === 'extract_attribute' && 'Extract Attribute'}
                                                                {step.type === 'get_cookie' && 'Get Cookie'}
                                                                {step.type === 'set_cookie' && 'Set Cookie'}
                                                                {step.type === 'delete_cookie' && 'Delete Cookie'}
                                                                {step.type === 'get_local_storage' && 'Get LocalStorage'}
                                                                {step.type === 'set_local_storage' && 'Set LocalStorage'}
                                                                {step.type === 'get_session_storage' && 'Get SessionStorage'}
                                                                {step.type === 'set_session_storage' && 'Set SessionStorage'}
                                                                {step.type === 'read_csv' && 'Read CSV'}
                                                                {step.type === 'read_json' && 'Read JSON'}
                                                                {step.type === 'call_snippet' && (
                                                                    <span className="flex items-center gap-1">
                                                                        <span className="text-violet-600">📦</span>
                                                                        {step.snippetName || step.name}()
                                                                    </span>
                                                                )}
                                                                {!['navigate', 'click', 'type', 'fill', 'assert', 'assert_title', 'assert_url', 'assert_element_count', 'assert_not_visible', 'wait', 'screenshot', 'set_variable', 'extract_text', 'extract_attribute', 'get_cookie', 'set_cookie', 'delete_cookie', 'get_local_storage', 'set_local_storage', 'get_session_storage', 'set_session_storage', 'read_csv', 'read_json', 'call_snippet'].includes(step.type) && (
                                                                    step.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                                                                )}
                                                            </span>
                                                            {step.status === 'running' && (
                                                                <span className="text-xs text-blue-600 animate-pulse">Running...</span>
                                                            )}
                                                            {step.status === 'healed' && (
                                                                <span className="text-xs text-orange-700 bg-orange-100 border border-orange-200 px-2 py-0.5 rounded-full font-semibold">
                                                                    Self-Healed
                                                                </span>
                                                            )}
                                                            {step.status === 'skipped' && (
                                                                <span className="text-xs text-gray-500">Skipped</span>
                                                            )}
                                                        </div>

                                                        {/* Details Row */}
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {/* URL Badge */}
                                                            {step.url && (
                                                                <code className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 text-xs rounded-md font-mono border border-blue-200 truncate max-w-full" title={step.url}>
                                                                    <span className="opacity-60 mr-1">🔗</span>
                                                                    {step.url.length > 50 ? step.url.substring(0, 50) + '...' : step.url}
                                                                </code>
                                                            )}

                                                            {/* Selector Badge */}
                                                            {step.selector && (
                                                                <code className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 text-xs rounded-md font-mono border border-purple-200 truncate max-w-[200px]" title={step.selector}>
                                                                    <span className="opacity-60 mr-1">🎯</span>
                                                                    {step.selector}
                                                                </code>
                                                            )}

                                                            {/* Value Badge */}
                                                            {step.value && (
                                                                <code className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 text-xs rounded-md font-mono border border-amber-200 truncate max-w-[150px]" title={step.value}>
                                                                    <span className="opacity-60 mr-1">✏️</span>
                                                                    "{step.value}"
                                                                </code>
                                                            )}

                                                            {/* Expected Title Badge (for assert_title) */}
                                                            {step.type === 'assert_title' && step.value && (
                                                                <code className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 text-xs rounded-md font-mono border border-emerald-200 truncate max-w-[200px]" title={`Expected Title: ${step.value}`}>
                                                                    <span className="opacity-60 mr-1">📄</span>
                                                                    equals: "{step.value}"
                                                                </code>
                                                            )}

                                                            {/* Expected URL Badge (for assert_url) */}
                                                            {step.type === 'assert_url' && step.value && (
                                                                <code className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-teal-50 to-teal-100 text-teal-700 text-xs rounded-md font-mono border border-teal-200 truncate max-w-[200px]" title={`Expected URL: ${step.value}`}>
                                                                    <span className="opacity-60 mr-1">🔗</span>
                                                                    equals: "{step.value}"
                                                                </code>
                                                            )}

                                                            {/* Expected Count Badge (for assert_element_count) */}
                                                            {step.expected_count !== undefined && (
                                                                <code className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 text-xs rounded-md font-mono border border-indigo-200" title={`Expected count: ${step.expected_count}`}>
                                                                    <span className="opacity-60 mr-1">#️⃣</span>
                                                                    {step.comparison && <span className="mr-1 opacity-75">{step.comparison}:</span>}
                                                                    {step.expected_count}
                                                                </code>
                                                            )}

                                                            {/* Variable Name Badge (for get/set operations) */}
                                                            {step.variable_name && !step.value && (
                                                                <code className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-pink-50 to-pink-100 text-pink-700 text-xs rounded-md font-mono border border-pink-200 truncate max-w-[150px]" title={`Variable: ${step.variable_name}`}>
                                                                    <span className="opacity-60 mr-1">💾</span>
                                                                    ${step.variable_name}
                                                                </code>
                                                            )}

                                                            {/* Key Name Badge (for storage operations) */}
                                                            {step.key && (
                                                                <code className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 text-xs rounded-md font-mono border border-orange-200 truncate max-w-[150px]" title={`Key: ${step.key}`}>
                                                                    <span className="opacity-60 mr-1">🔑</span>
                                                                    {step.key}
                                                                </code>
                                                            )}

                                                            {/* Cookie Name Badge */}
                                                            {step.name && ['get_cookie', 'set_cookie', 'delete_cookie'].includes(step.type) && (
                                                                <code className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-700 text-xs rounded-md font-mono border border-yellow-200 truncate max-w-[150px]" title={`Cookie: ${step.name}`}>
                                                                    <span className="opacity-60 mr-1">🍪</span>
                                                                    {step.name}
                                                                </code>
                                                            )}
                                                        </div>

                                                        {/* Log Message Display */}
                                                        {step.logMessage && (
                                                            <div className="mt-2 text-xs text-blue-700 font-mono bg-blue-50 px-3 py-2 rounded-md border border-blue-200 flex items-start gap-2">
                                                                <span className="opacity-60 shrink-0">📝</span>
                                                                <span className="break-all">{step.logMessage}</span>
                                                            </div>
                                                        )}

                                                        {/* Healing Status Display */}
                                                        {step.healingStatus && (
                                                            <div className={`mt-2 text-xs font-mono px-3 py-2 rounded-md border flex items-center gap-2 ${step.healingStatus === 'attempting'
                                                                ? 'bg-blue-50 border-blue-200 text-blue-700'
                                                                : step.healingStatus === 'healed'
                                                                    ? 'bg-orange-50 border-orange-200 text-orange-700'
                                                                    : 'bg-red-50 border-red-200 text-red-700'
                                                                }`}>
                                                                <span className="opacity-60 shrink-0">✨</span>
                                                                <span>{step.healingMessage}</span>
                                                                {step.healingStatus === 'healed' && step.healingConfidence !== undefined && (
                                                                    <span className="ml-auto text-[10px] opacity-70">
                                                                        {Math.round((step.healingConfidence || 0) * 100)}%
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Self-Heal Detail Panel */}
                                                        {step.status === 'healed' && (step.healingOriginal || step.healingHealed) && (
                                                            <div className="mt-3 rounded-md border border-orange-200 bg-orange-50/50 p-3">
                                                                <div className="text-xs font-semibold text-orange-700 mb-2">AI Self-Healing Applied</div>
                                                                {step.healingOriginal && (
                                                                    <div className="text-xs mb-1">
                                                                        <span className="text-gray-500">Original Selector:</span>{' '}
                                                                        <code className="px-1 py-0.5 bg-white border border-orange-200 rounded text-orange-800">
                                                                            {step.healingOriginal}
                                                                        </code>
                                                                    </div>
                                                                )}
                                                                {step.healingHealed && (
                                                                    <div className="text-xs mb-1">
                                                                        <span className="text-gray-500">Healed Selector:</span>{' '}
                                                                        <code className="px-1 py-0.5 bg-white border border-orange-200 rounded text-orange-800">
                                                                            {step.healingHealed}
                                                                        </code>
                                                                    </div>
                                                                )}
                                                                {step.healingStrategy && (
                                                                    <div className="text-xs mb-1 text-gray-600">
                                                                        Strategy: <span className="text-orange-700 font-medium">{step.healingStrategy}</span>
                                                                    </div>
                                                                )}
                                                                {step.healingConfidence !== undefined && (
                                                                    <div className="text-xs mb-1 text-gray-600">
                                                                        Confidence: <span className="text-orange-700 font-medium">{Math.round((step.healingConfidence || 0) * 100)}%</span>
                                                                    </div>
                                                                )}
                                                                {step.healingReasoning && (
                                                                    <div className="text-xs text-gray-600">
                                                                        Reason: <span className="text-gray-700">{step.healingReasoning}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* API Status Display */}
                                                        {step.apiStatus && (
                                                            <div className="mt-2 text-xs font-mono px-3 py-2 rounded-md border flex items-center gap-2"
                                                                style={{
                                                                    backgroundColor: step.apiStatus >= 200 && step.apiStatus < 300 ? '#f0fdf4' : step.apiStatus >= 400 ? '#fef2f2' : '#fffbeb',
                                                                    borderColor: step.apiStatus >= 200 && step.apiStatus < 300 ? '#86efac' : step.apiStatus >= 400 ? '#fca5a5' : '#fcd34d',
                                                                    color: step.apiStatus >= 200 && step.apiStatus < 300 ? '#15803d' : step.apiStatus >= 400 ? '#b91c1c' : '#a16207'
                                                                }}>
                                                                <span className="opacity-60 shrink-0">📡</span>
                                                                <span>Status: <strong>{step.apiStatus}</strong></span>
                                                            </div>
                                                        )}

                                                        {/* Error Message */}
                                                        {step.error && (
                                                            <div className="mt-2 text-xs text-red-700 font-mono bg-red-50 px-3 py-2 rounded-md border border-red-200 flex items-start gap-2">
                                                                <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                                                <span>{step.error}</span>
                                                            </div>
                                                        )}

                                                        {/* Snippet Sub-Steps */}
                                                        {step.subSteps && step.subSteps.length > 0 && (
                                                            <div className="mt-3 pl-2 border-l-2 border-violet-300 space-y-1.5">
                                                                <button
                                                                    onClick={() => setExpandedSnippets(prev => ({ ...prev, [index]: !prev[index] }))}
                                                                    className="text-xs text-violet-600 font-medium mb-2 flex items-center gap-1 hover:text-violet-800 transition-colors cursor-pointer w-full text-left"
                                                                >
                                                                    {expandedSnippets[index] ? (
                                                                        <ChevronDown className="w-3.5 h-3.5" />
                                                                    ) : (
                                                                        <ChevronRight className="w-3.5 h-3.5" />
                                                                    )}
                                                                    <span>📦</span>
                                                                    Snippet Steps ({step.subSteps.filter(s => s.status === 'passed').length}/{step.subSteps.length})
                                                                </button>
                                                                {expandedSnippets[index] && step.subSteps.map((subStep, subIdx) => (
                                                                    <div
                                                                        key={subIdx}
                                                                        className={`p-2 rounded-md text-xs ${subStep.status === 'running'
                                                                            ? 'bg-blue-50 border border-blue-200'
                                                                            : subStep.status === 'passed'
                                                                                ? 'bg-green-50 border border-green-200'
                                                                                : subStep.status === 'failed'
                                                                                    ? 'bg-red-50 border border-red-200'
                                                                                    : 'bg-gray-50 border border-gray-200 opacity-60'
                                                                            }`}
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            {/* Sub-step number */}
                                                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${subStep.status === 'passed' ? 'bg-green-500 text-white' :
                                                                                subStep.status === 'running' ? 'bg-blue-500 text-white' :
                                                                                    subStep.status === 'failed' ? 'bg-red-500 text-white' :
                                                                                        'bg-gray-300 text-gray-600'
                                                                                }`}>
                                                                                {subStep.status === 'passed' ? '✓' :
                                                                                    subStep.status === 'running' ? '◌' :
                                                                                        subStep.status === 'failed' ? '✕' :
                                                                                            subIdx + 1}
                                                                            </div>
                                                                            {/* Sub-step name */}
                                                                            <span className={`font-medium ${subStep.status === 'running' ? 'text-blue-700' :
                                                                                subStep.status === 'failed' ? 'text-red-700' :
                                                                                    'text-gray-700'
                                                                                }`}>
                                                                                {subStep.name || subStep.type?.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                                                            </span>
                                                                            {subStep.status === 'running' && (
                                                                                <span className="text-blue-500 animate-pulse">...</span>
                                                                            )}
                                                                        </div>
                                                                        {/* Sub-step details */}
                                                                        {(subStep.url || subStep.selector || subStep.value || subStep.timeout || subStep.expectedUrl || subStep.expectedTitle) && (
                                                                            <div className="flex flex-wrap gap-1 mt-1 pl-7">
                                                                                {subStep.url && (
                                                                                    <code className="text-[10px] text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded truncate max-w-[180px]" title={subStep.url}>
                                                                                        🔗 {subStep.url.length > 25 ? subStep.url.substring(0, 25) + '...' : subStep.url}
                                                                                    </code>
                                                                                )}
                                                                                {subStep.selector && (
                                                                                    <code className="text-[10px] text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded truncate max-w-[120px]" title={subStep.selector}>
                                                                                        🎯 {subStep.selector}
                                                                                    </code>
                                                                                )}
                                                                                {subStep.value && (
                                                                                    <code className="text-[10px] text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded truncate max-w-[100px]" title={subStep.value}>
                                                                                        ✏️ "{subStep.value}"
                                                                                    </code>
                                                                                )}
                                                                                {/* Timeout for Wait steps */}
                                                                                {subStep.timeout && (
                                                                                    <code className="text-[10px] text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                                                                                        ⏱️ {subStep.timeout}ms
                                                                                    </code>
                                                                                )}
                                                                                {/* Expected URL for assert_url */}
                                                                                {subStep.expectedUrl && (
                                                                                    <code className="text-[10px] text-teal-600 bg-teal-100 px-1.5 py-0.5 rounded truncate max-w-[180px]" title={subStep.expectedUrl}>
                                                                                        🔗 {subStep.comparison || 'contains'}: "{subStep.expectedUrl.length > 20 ? subStep.expectedUrl.substring(0, 20) + '...' : subStep.expectedUrl}"
                                                                                    </code>
                                                                                )}
                                                                                {/* Expected Title for assert_title */}
                                                                                {subStep.expectedTitle && (
                                                                                    <code className="text-[10px] text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded truncate max-w-[180px]" title={subStep.expectedTitle}>
                                                                                        📄 {subStep.comparison || 'equals'}: "{subStep.expectedTitle.length > 20 ? subStep.expectedTitle.substring(0, 20) + '...' : subStep.expectedTitle}"
                                                                                    </code>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                        {/* Sub-step error */}
                                                                        {subStep.error && (
                                                                            <div className="mt-1 pl-7 text-[10px] text-red-600">
                                                                                ❌ {subStep.error}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : steps.length > 0 ? (
                                <div className="py-2">
                                    <div className="space-y-0.5">
                                        {steps.map((step, index) => (
                                            <div
                                                key={step.id}
                                                onClick={() => onStepClick?.(step.id)}
                                                className={`flex items-start px-4 py-2 border-l-4 cursor-pointer hover:bg-gray-100 transition-all ${step.status === 'running'
                                                    ? 'border-l-blue-500 bg-blue-50'
                                                    : step.status === 'passed'
                                                        ? 'border-l-green-500 bg-white'
                                                        : step.status === 'failed'
                                                            ? 'border-l-red-500 bg-red-50'
                                                            : 'border-l-gray-300 bg-white'
                                                    }`}
                                            >
                                                <span className="w-6 text-gray-400 text-sm font-mono shrink-0">
                                                    {index + 1}
                                                </span>
                                                <div className="w-5 shrink-0 mt-0.5">
                                                    {step.status === 'passed' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                                    {step.status === 'failed' && <XCircle className="w-4 h-4 text-red-500" />}
                                                    {step.status === 'pending' && <div className="w-3 h-3 rounded-full border-2 border-gray-300 ml-0.5" />}
                                                </div>
                                                <div className="flex-1 min-w-0 ml-2">
                                                    <span className="font-mono text-sm text-gray-900">{step.action}</span>
                                                    {step.selector && (
                                                        <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded font-mono">
                                                            {step.selector}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                        <Play className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <p className="text-gray-600 text-sm font-medium">No test running</p>
                                    <p className="text-gray-400 text-xs mt-1">Click "Run Headed" to see steps execute here</p>
                                </div>
                            )}
                        </TabsContent>

                        {/* Console Tab */}
                        <TabsContent value="console" className="flex-1 overflow-y-auto p-0 m-0 bg-gray-50 font-mono text-xs">
                            {consoleLogs.length > 0 ? (
                                <div className="p-3 space-y-1">
                                    {consoleLogs.map((log, i) => (
                                        <div key={i} className="flex items-start gap-2 bg-white px-2 py-1 rounded border border-gray-100">
                                            {getLogIcon(log.level)}
                                            <span className={`flex-1 ${log.level === 'error' ? 'text-red-600' :
                                                log.level === 'warning' ? 'text-amber-600' :
                                                    'text-gray-700'
                                                }`}>
                                                {log.text}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-gray-400">
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
