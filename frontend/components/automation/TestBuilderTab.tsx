'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
    Plus,
    Trash2,
    GripVertical,
    Play,
    Save,
    Copy,
    MousePointerClick,
    Type,
    Eye,
    Clock,
    CheckCircle2,
    Navigation,
    Upload,
    Download,
    Keyboard,
    Search,
    ChevronDown,
    ChevronRight,
    AlertCircle,
    Settings,
    Target,
    Repeat,
    Variable,
    Wand2,
    Database,
    Zap,
    Mic,
    Sparkles,
    // Additional icons for better action representation
    Send,
    ArrowLeft,
    ArrowRight,
    RefreshCw,
    Crosshair,
    MousePointer2,
    FormInput,
    Eraser,
    Move,
    Hand,
    Square,
    CheckSquare,
    Image,
    Globe,
    ExternalLink,
    Layers,
    SquareStack,
    X,
    MessageSquare,
    Frame,
    PanelTop,
    Timer,
    Wifi,
    Link,
    Cookie,
    HardDrive,
    FileText,
    Code,
    FileJson,
    MapPin,
    Monitor,
    Smartphone,
    Highlighter,
    Hash,
    EyeOff,
    ShieldCheck,
    Gauge,
    Activity,
    MessageCircle,
    FileSpreadsheet,
    ClipboardCopy,
    ClipboardPaste,
    IterationCw,
    Pointer,
    Menu
} from 'lucide-react'
import { Environment } from './EnvironmentManager'
import { webAutomationApi } from '@/lib/api/webAutomation'

interface TestStep {
    id: string
    action: string
    selector?: string
    value?: string
    timeout?: number
    description?: string
    variable_name?: string
    attribute_name?: string
    script?: string
    key?: string
    name?: string
    url?: string
    // Conditional
    condition?: string
    true_value?: string
    false_value?: string
    nested_action_type?: string
    nested_action_data?: any
    // Select dropdown
    select_by?: 'value' | 'label' | 'index'
    option?: string
    // Upload
    file_path?: string
    // Scroll
    scroll_type?: 'page' | 'element' | 'coordinates'
    direction?: 'up' | 'down' | 'left' | 'right' | 'top' | 'bottom'
    amount?: number
    x?: number
    y?: number
    // Random data
    data_type?: string
    length?: number
    min?: number
    max?: number
    prefix?: string
    suffix?: string
    // For Loop
    iterations?: number
    loop_variable?: string
    nested_steps?: TestStep[]
    // While Loop
    max_iterations?: number
    // Try Catch
    try_steps?: TestStep[]
    catch_steps?: TestStep[]
    finally_steps?: TestStep[]
    // Tab management
    index?: number
    // Screenshot
    full_page?: boolean
    path?: string
    // Drag & Drop
    source_selector?: string
    target_selector?: string
    // Storage
    storage_key?: string
    // Viewport
    width?: number
    height?: number
    // Device
    device?: string
    // Geolocation
    latitude?: number
    longitude?: number
    accuracy?: number
    // Download
    download_path?: string
    min_size?: number
    // API Call
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    headers?: Record<string, string>
    body?: any
    // Log
    message?: string
    level?: 'info' | 'warn' | 'error' | 'debug'
    // Assertions
    expected_count?: number
    comparison?: 'equals' | 'greater' | 'less' | 'at_least' | 'at_most'
    // Data Files
    dataset_name?: string
    // Highlight
    color?: string
    duration?: number
    // Clipboard
    text?: string
    is_active?: boolean
}

interface TestBuilderTabProps {
    selectedEnvironment?: Environment
    flowId?: string | null
    projectId: string
}

export default function TestBuilderTab({ selectedEnvironment, flowId, projectId }: TestBuilderTabProps) {
    const [testName, setTestName] = useState<string>('Test Flow')
    const [isFlowLoading, setIsFlowLoading] = useState(false)
    // const [projectId, setProjectId] = useState<string | null>(null) // No longer needed as state if passed as prop, but let's keep it if we want to support flow-based project id override? No, simpler is better.
    const wsRef = React.useRef<WebSocket | null>(null)

    useEffect(() => {
        const fetchTestDetails = async () => {
            if (flowId) {
                try {
                    setIsFlowLoading(true)
                    const flow = await webAutomationApi.getTestFlow(flowId)
                    setTestName(flow.name)
                    // setProjectId(flow.project_id) // We use prop now
                } catch (error) {
                    console.error('Failed to fetch test flow:', error)
                } finally {
                    setIsFlowLoading(false)
                }
            } else {
                setTestName('Test Flow')
            }
        }

        fetchTestDetails()

        return () => {
            if (wsRef.current) {
                wsRef.current.close()
            }
        }
    }, [flowId])

    // State for Recorder
    const [isRecording, setIsRecording] = useState(false)
    const [recordingUrl, setRecordingUrl] = useState('https://example.com')
    const recorderWsRef = React.useRef<WebSocket | null>(null)

    const handleStartRecording = async () => {
        // We now have projectId from props. flowId is optional for recording start (we might be creating a new flow).

        if (!projectId) {
            console.error("Missing projectId");
            return;
        }

        try {
            const pId = projectId;

            setIsRecording(true)
            await webAutomationApi.startRecording(pId, recordingUrl)

            // 2. Connect to Recorder WebSocket
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${wsProtocol}//${window.location.host}/api/v1/web-automation/ws/recorder/${pId}`;
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log('Recorder WebSocket Connected');
            };

            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                if (message.type === 'recorded_event') {
                    const eventData = message.payload;
                    // Maps recorded event to TestStep
                    // eventData: { type: 'click'|'input', selector: {css: ...}, value?: ..., description: ... }

                    let actionType = 'click';
                    let stepName = 'Recorded Step';

                    if (eventData.type === 'click') actionType = 'click';
                    else if (eventData.type === 'input') actionType = 'type';

                    const newStep: TestStep = {
                        id: `step-${Date.now()}`,
                        action: actionType,
                        selector: eventData.selector.css,
                        value: eventData.value,
                        description: eventData.description,
                        timeout: 5000
                    };

                    setSteps(prev => [...prev, newStep]);
                }
            };

            recorderWsRef.current = ws;

        } catch (error) {
            console.error("Failed to start recording:", error)
            setIsRecording(false)
        }
    }

    const handleStopRecording = async () => {
        const pId = projectId;
        if (!pId) return;

        try {
            await webAutomationApi.stopRecording(pId);
            setIsRecording(false);
            if (recorderWsRef.current) {
                recorderWsRef.current.close();
                recorderWsRef.current = null;
            }
        } catch (error) {
            console.error("Failed to stop recording:", error);
        }
    }

    const [steps, setSteps] = useState<TestStep[]>([])
    const [selectedStepId, setSelectedStepId] = useState<string | null>(null)
    const [builderMethod, setBuilderMethod] = useState<'visual' | 'recorder' | 'ai'>('visual')

    // Action Definitions - Browser Actions
    const actionTypes = [
        // Navigation
        { id: 'navigate', name: 'Navigate', icon: Send, color: 'bg-blue-500', description: 'Navigate to URL' },
        { id: 'go_back', name: 'Go Back', icon: ArrowLeft, color: 'bg-blue-400', description: 'Browser back button' },
        { id: 'go_forward', name: 'Go Forward', icon: ArrowRight, color: 'bg-blue-400', description: 'Browser forward button' },
        { id: 'reload', name: 'Reload', icon: RefreshCw, color: 'bg-blue-400', description: 'Reload page' },
        // Click Actions
        { id: 'click', name: 'Click', icon: MousePointerClick, color: 'bg-green-500', description: 'Click element' },
        { id: 'double_click', name: 'Double Click', icon: Pointer, color: 'bg-green-600', description: 'Double click element' },
        { id: 'right_click', name: 'Right Click', icon: Menu, color: 'bg-green-700', description: 'Right click (context menu)' },
        // Input Actions
        { id: 'type', name: 'Type', icon: FormInput, color: 'bg-purple-500', description: 'Type text into input' },
        { id: 'clear', name: 'Clear', icon: Eraser, color: 'bg-purple-400', description: 'Clear input field' },
        { id: 'press', name: 'Press Key', icon: Keyboard, color: 'bg-pink-500', description: 'Press keyboard key' },
        // Element Actions
        { id: 'hover', name: 'Hover', icon: Hand, color: 'bg-cyan-500', description: 'Hover over element' },
        { id: 'focus', name: 'Focus', icon: Target, color: 'bg-cyan-400', description: 'Focus on element' },
        { id: 'scroll', name: 'Scroll', icon: Move, color: 'bg-cyan-600', description: 'Scroll page or element' },
        // Form Actions
        { id: 'select', name: 'Select', icon: ChevronDown, color: 'bg-indigo-500', description: 'Select dropdown option' },
        { id: 'check', name: 'Check', icon: CheckSquare, color: 'bg-emerald-500', description: 'Check checkbox' },
        { id: 'uncheck', name: 'Uncheck', icon: Square, color: 'bg-emerald-400', description: 'Uncheck checkbox' },
        { id: 'upload', name: 'Upload', icon: Upload, color: 'bg-orange-500', description: 'Upload file' },
        // Drag & Drop
        { id: 'drag_drop', name: 'Drag & Drop', icon: Move, color: 'bg-violet-500', description: 'Drag element to target' },
        // Wait Actions
        { id: 'wait', name: 'Wait', icon: Timer, color: 'bg-yellow-500', description: 'Wait for element or time' },
        { id: 'wait_network', name: 'Wait Network', icon: Wifi, color: 'bg-yellow-600', description: 'Wait for network idle' },
        { id: 'wait_url', name: 'Wait URL', icon: Link, color: 'bg-yellow-400', description: 'Wait for URL change' },
        // Assertions
        { id: 'assert', name: 'Assert', icon: CheckCircle2, color: 'bg-emerald-600', description: 'Assert condition' },
        // Screenshots
        { id: 'screenshot', name: 'Screenshot', icon: Image, color: 'bg-teal-500', description: 'Take screenshot' },
        // Dialog Handling
        { id: 'accept_dialog', name: 'Accept Dialog', icon: CheckCircle2, color: 'bg-lime-500', description: 'Accept alert/confirm' },
        { id: 'dismiss_dialog', name: 'Dismiss Dialog', icon: X, color: 'bg-lime-600', description: 'Dismiss alert/confirm' },
        // Tab/Window
        { id: 'new_tab', name: 'New Tab', icon: ExternalLink, color: 'bg-sky-500', description: 'Open new browser tab' },
        { id: 'switch_tab', name: 'Switch Tab', icon: Layers, color: 'bg-sky-600', description: 'Switch to tab by index' },
        { id: 'close_tab', name: 'Close Tab', icon: X, color: 'bg-sky-700', description: 'Close browser tab' },
        // Frame Handling
        { id: 'switch_to_frame', name: 'Switch Frame', icon: Frame, color: 'bg-fuchsia-500', description: 'Switch to iframe' },
        { id: 'switch_to_main', name: 'Main Frame', icon: PanelTop, color: 'bg-fuchsia-400', description: 'Switch to main frame' },
    ]

    // Data & Variables Actions
    const dataActions = [
        { id: 'extract_text', name: 'Extract Text', icon: FileText, color: 'bg-indigo-600', description: 'Save element text to variable' },
        { id: 'extract_attribute', name: 'Extract Attr', icon: Code, color: 'bg-indigo-500', description: 'Save element attribute' },
        { id: 'set_variable', name: 'Set Variable', icon: Variable, color: 'bg-indigo-700', description: 'Set variable value' },
        { id: 'random-data', name: 'Random Data', icon: Wand2, color: 'bg-green-600', description: 'Generate random data' },
        // Scripting
        { id: 'execute_script', name: 'Execute JS', icon: Code, color: 'bg-rose-600', description: 'Run JavaScript code' },
        { id: 'set_variable_ternary', name: 'Ternary Var', icon: Zap, color: 'bg-amber-600', description: 'Set var based on condition' },
    ]

    // Storage Actions
    const storageActions = [
        { id: 'get_cookie', name: 'Get Cookie', icon: Cookie, color: 'bg-orange-600', description: 'Get cookie value' },
        { id: 'set_cookie', name: 'Set Cookie', icon: Cookie, color: 'bg-orange-500', description: 'Set cookie' },
        { id: 'delete_cookie', name: 'Delete Cookie', icon: Cookie, color: 'bg-orange-700', description: 'Delete cookie' },
        { id: 'clear_cookies', name: 'Clear Cookies', icon: Trash2, color: 'bg-red-600', description: 'Clear all cookies' },
        { id: 'get_local_storage', name: 'Get Local', icon: HardDrive, color: 'bg-cyan-600', description: 'Get localStorage item' },
        { id: 'set_local_storage', name: 'Set Local', icon: HardDrive, color: 'bg-cyan-500', description: 'Set localStorage item' },
        { id: 'clear_local_storage', name: 'Clear Local', icon: Trash2, color: 'bg-red-500', description: 'Clear localStorage' },
        { id: 'get_session_storage', name: 'Get Session', icon: Database, color: 'bg-teal-600', description: 'Get sessionStorage item' },
        { id: 'set_session_storage', name: 'Set Session', icon: Database, color: 'bg-teal-500', description: 'Set sessionStorage item' },
        { id: 'clear_session_storage', name: 'Clear Session', icon: Trash2, color: 'bg-red-400', description: 'Clear sessionStorage' },
    ]

    // Control Flow Actions
    const testActions = [
        { id: 'for-loop', name: 'For Loop', icon: Repeat, color: 'bg-purple-600', description: 'Repeat steps N times' },
        { id: 'while-loop', name: 'While Loop', icon: IterationCw, color: 'bg-blue-600', description: 'Repeat while condition true' },
        { id: 'if_condition', name: 'If Condition', icon: Zap, color: 'bg-amber-600', description: 'Run action if condition true' },
        { id: 'try-catch', name: 'Try/Catch', icon: ShieldCheck, color: 'bg-orange-600', description: 'Handle errors gracefully' },
        { id: 'iterate_dataset', name: 'Iterate Data', icon: IterationCw, color: 'bg-violet-600', description: 'Loop through dataset' },
    ]

    // API & Network Actions
    const apiActions = [
        { id: 'make_api_call', name: 'API Call', icon: Globe, color: 'bg-blue-700', description: 'Make HTTP request' },
        { id: 'wait_for_response', name: 'Wait Response', icon: Wifi, color: 'bg-blue-600', description: 'Wait for API response' },
        { id: 'wait_for_request', name: 'Wait Request', icon: Wifi, color: 'bg-blue-500', description: 'Wait for API request' },
    ]

    // Advanced Actions
    const advancedActions = [
        { id: 'set_viewport', name: 'Set Viewport', icon: Monitor, color: 'bg-indigo-500', description: 'Change browser size' },
        { id: 'set_device', name: 'Set Device', icon: Smartphone, color: 'bg-indigo-600', description: 'Emulate mobile device' },
        { id: 'set_geolocation', name: 'Set Location', icon: MapPin, color: 'bg-emerald-500', description: 'Set geolocation' },
        { id: 'wait_for_download', name: 'Wait Download', icon: Download, color: 'bg-green-600', description: 'Wait for file download' },
        { id: 'verify_download', name: 'Verify Download', icon: CheckCircle2, color: 'bg-green-500', description: 'Verify downloaded file' },
        { id: 'highlight_element', name: 'Highlight', icon: Highlighter, color: 'bg-yellow-500', description: 'Highlight element visually' },
    ]

    // Assertion Actions
    const assertActions = [
        { id: 'assert', name: 'Assert', icon: CheckCircle2, color: 'bg-emerald-600', description: 'Assert condition' },
        { id: 'assert_element_count', name: 'Assert Count', icon: Hash, color: 'bg-emerald-500', description: 'Assert element count' },
        { id: 'assert_not_visible', name: 'Assert Hidden', icon: EyeOff, color: 'bg-emerald-400', description: 'Assert element hidden' },
        { id: 'soft_assert', name: 'Soft Assert', icon: ShieldCheck, color: 'bg-lime-500', description: 'Assert without stopping' },
        { id: 'get_element_count', name: 'Get Count', icon: Hash, color: 'bg-indigo-500', description: 'Get element count' },
    ]

    // Debugging Actions
    const debugActions = [
        { id: 'log', name: 'Log', icon: MessageCircle, color: 'bg-gray-600', description: 'Log message' },
        { id: 'comment', name: 'Comment', icon: MessageSquare, color: 'bg-gray-500', description: 'Add comment (no-op)' },
        { id: 'measure_load_time', name: 'Load Time', icon: Gauge, color: 'bg-purple-500', description: 'Measure page load' },
        { id: 'get_performance_metrics', name: 'Perf Metrics', icon: Activity, color: 'bg-purple-600', description: 'Get Web Vitals' },
    ]

    // Data File Actions
    const fileActions = [
        { id: 'read_csv', name: 'Read CSV', icon: FileSpreadsheet, color: 'bg-teal-600', description: 'Load CSV file' },
        { id: 'read_json', name: 'Read JSON', icon: FileJson, color: 'bg-teal-500', description: 'Load JSON file' },
        { id: 'copy_to_clipboard', name: 'Copy', icon: ClipboardCopy, color: 'bg-gray-500', description: 'Copy to clipboard' },
        { id: 'paste_from_clipboard', name: 'Paste', icon: ClipboardPaste, color: 'bg-gray-600', description: 'Paste from clipboard' },
    ]

    const variableActions = [
        { id: 'set-variable', name: 'Set Variable', icon: Variable, color: 'bg-teal-600', description: 'Create variable' },
        { id: 'extract-variable', name: 'Extract', icon: Database, color: 'bg-cyan-600', description: 'Extract to variable' },
    ]

    const addStep = (actionType: string) => {
        const newStep: TestStep = {
            id: `step-${Date.now()}`,
            action: actionType,
            selector: '',
            value: '',
            timeout: 5000,
            description: '',
        }
        setSteps([...steps, newStep])
        setSelectedStepId(newStep.id)
    }

    const updateStep = (stepId: string, field: keyof TestStep, value: any) => {
        setSteps(steps.map(s => s.id === stepId ? { ...s, [field]: value } : s))
    }

    const deleteStep = (stepId: string) => {
        setSteps(steps.filter(s => s.id !== stepId))
        if (selectedStepId === stepId) setSelectedStepId(null)
    }

    const duplicateStep = (stepId: string) => {
        const step = steps.find(s => s.id === stepId)
        if (step) {
            const newStep = { ...step, id: `step-${Date.now()}` }
            const index = steps.findIndex(s => s.id === stepId)
            const newSteps = [...steps]
            newSteps.splice(index + 1, 0, newStep)
            setSteps(newSteps)
        }
    }

    const moveStep = (stepId: string, direction: 'up' | 'down') => {
        const index = steps.findIndex(s => s.id === stepId)
        if (index === -1) return

        if (direction === 'up' && index > 0) {
            const newSteps = [...steps]
                ;[newSteps[index], newSteps[index - 1]] = [newSteps[index - 1], newSteps[index]]
            setSteps(newSteps)
        } else if (direction === 'down' && index < steps.length - 1) {
            const newSteps = [...steps]
                ;[newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]]
            setSteps(newSteps)
        }
    }

    const getActionConfig = (actionType: string) => {
        return [...actionTypes, ...dataActions, ...storageActions, ...testActions, ...variableActions, ...apiActions, ...advancedActions, ...assertActions, ...debugActions, ...fileActions].find(a => a.id === actionType)
    }

    const selectedStep = steps.find(s => s.id === selectedStepId)

    const handleRunFlow = async () => {
        if (!flowId) return

        try {
            const variables = selectedEnvironment?.variables || {}

            // TODO: Add toast notification
            console.log('Running flow with variables:', variables)

            await webAutomationApi.executeTestFlow(flowId, {
                execution_mode: 'headed',
                variables: variables
            })
        } catch (error) {
            console.error('Failed to execute flow:', error)
        }
    }

    return (
        <div className="flex h-full bg-gray-50 overflow-hidden w-full">
            {/* Left Panel - Actions Library */}
            <div className="w-72 min-w-[288px] bg-white border-r border-gray-200 flex flex-col overflow-hidden flex-shrink-0">
                {/* Method Selector */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
                        <button
                            onClick={() => setBuilderMethod('visual')}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${builderMethod === 'visual' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Visual
                        </button>
                        <button
                            onClick={() => setBuilderMethod('recorder')}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${builderMethod === 'recorder' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Recorder
                        </button>
                        <button
                            onClick={() => setBuilderMethod('ai')}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${builderMethod === 'ai' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            AI
                        </button>
                    </div>

                    {builderMethod === 'visual' && (
                        <>
                            <h2 className="text-sm font-bold text-gray-900 mb-2">Action Library</h2>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                <Input placeholder="Search actions..." className="pl-8 h-8 text-xs" />
                            </div>
                        </>
                    )}
                </div>

                {/* Action Lists */}
                {builderMethod === 'visual' ? (
                    <div className="flex-1 overflow-y-auto p-3 space-y-4">
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-1">Browser Actions</h3>
                            <div className="space-y-1.5">
                                {actionTypes.map((action) => {
                                    const Icon = action.icon
                                    return (
                                        <button
                                            key={action.id}
                                            onClick={() => addStep(action.id)}
                                            className="w-full flex items-center gap-2.5 p-2 rounded-lg bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-gray-200 transition-all group text-left"
                                        >
                                            <div className={`${action.color} p-1.5 rounded text-white flex-shrink-0`}>
                                                <Icon className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-medium text-gray-900">{action.name}</div>
                                                <div className="text-[10px] text-gray-500 truncate">{action.description}</div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-1">Data & Variables</h3>
                            <div className="space-y-1.5">
                                {dataActions.map((action) => {
                                    const Icon = action.icon
                                    return (
                                        <button
                                            key={action.id}
                                            onClick={() => addStep(action.id)}
                                            className="w-full flex items-center gap-2.5 p-2 rounded-lg bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-gray-200 transition-all group text-left"
                                        >
                                            <div className={`${action.color} p-1.5 rounded text-white flex-shrink-0`}>
                                                <Icon className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-medium text-gray-900">{action.name}</div>
                                                <div className="text-[10px] text-gray-500 truncate">{action.description}</div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-1">Storage</h3>
                            <div className="space-y-1.5">
                                {storageActions.map((action) => {
                                    const Icon = action.icon
                                    return (
                                        <button
                                            key={action.id}
                                            onClick={() => addStep(action.id)}
                                            className="w-full flex items-center gap-2.5 p-2 rounded-lg bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-gray-200 transition-all group text-left"
                                        >
                                            <div className={`${action.color} p-1.5 rounded text-white flex-shrink-0`}>
                                                <Icon className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-medium text-gray-900">{action.name}</div>
                                                <div className="text-[10px] text-gray-500 truncate">{action.description}</div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-1">Control Flow</h3>
                            <div className="space-y-1.5">
                                {testActions.map((action) => {
                                    const Icon = action.icon
                                    return (
                                        <button
                                            key={action.id}
                                            onClick={() => addStep(action.id)}
                                            className="w-full flex items-center gap-2.5 p-2 rounded-lg bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-gray-200 transition-all group text-left"
                                        >
                                            <div className={`${action.color} p-1.5 rounded text-white flex-shrink-0`}>
                                                <Icon className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-medium text-gray-900">{action.name}</div>
                                                <div className="text-[10px] text-gray-500 truncate">{action.description}</div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-1">API & Network</h3>
                            <div className="space-y-1.5">
                                {apiActions.map((action) => {
                                    const Icon = action.icon
                                    return (
                                        <button
                                            key={action.id}
                                            onClick={() => addStep(action.id)}
                                            className="w-full flex items-center gap-2.5 p-2 rounded-lg bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-gray-200 transition-all group text-left"
                                        >
                                            <div className={`${action.color} p-1.5 rounded text-white flex-shrink-0`}>
                                                <Icon className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-medium text-gray-900">{action.name}</div>
                                                <div className="text-[10px] text-gray-500 truncate">{action.description}</div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-1">Assertions</h3>
                            <div className="space-y-1.5">
                                {assertActions.map((action) => {
                                    const Icon = action.icon
                                    return (
                                        <button
                                            key={action.id}
                                            onClick={() => addStep(action.id)}
                                            className="w-full flex items-center gap-2.5 p-2 rounded-lg bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-gray-200 transition-all group text-left"
                                        >
                                            <div className={`${action.color} p-1.5 rounded text-white flex-shrink-0`}>
                                                <Icon className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-medium text-gray-900">{action.name}</div>
                                                <div className="text-[10px] text-gray-500 truncate">{action.description}</div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-1">Advanced</h3>
                            <div className="space-y-1.5">
                                {advancedActions.map((action) => {
                                    const Icon = action.icon
                                    return (
                                        <button
                                            key={action.id}
                                            onClick={() => addStep(action.id)}
                                            className="w-full flex items-center gap-2.5 p-2 rounded-lg bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-gray-200 transition-all group text-left"
                                        >
                                            <div className={`${action.color} p-1.5 rounded text-white flex-shrink-0`}>
                                                <Icon className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-medium text-gray-900">{action.name}</div>
                                                <div className="text-[10px] text-gray-500 truncate">{action.description}</div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-1">Debugging</h3>
                            <div className="space-y-1.5">
                                {debugActions.map((action) => {
                                    const Icon = action.icon
                                    return (
                                        <button
                                            key={action.id}
                                            onClick={() => addStep(action.id)}
                                            className="w-full flex items-center gap-2.5 p-2 rounded-lg bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-gray-200 transition-all group text-left"
                                        >
                                            <div className={`${action.color} p-1.5 rounded text-white flex-shrink-0`}>
                                                <Icon className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-medium text-gray-900">{action.name}</div>
                                                <div className="text-[10px] text-gray-500 truncate">{action.description}</div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-1">Data Files</h3>
                            <div className="space-y-1.5">
                                {fileActions.map((action) => {
                                    const Icon = action.icon
                                    return (
                                        <button
                                            key={action.id}
                                            onClick={() => addStep(action.id)}
                                            className="w-full flex items-center gap-2.5 p-2 rounded-lg bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-gray-200 transition-all group text-left"
                                        >
                                            <div className={`${action.color} p-1.5 rounded text-white flex-shrink-0`}>
                                                <Icon className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-medium text-gray-900">{action.name}</div>
                                                <div className="text-[10px] text-gray-500 truncate">{action.description}</div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                ) : builderMethod === 'recorder' ? (
                    <div className="flex-1 p-6 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <Mic className={`w-8 h-8 text-red-600 ${isRecording ? 'animate-pulse' : ''}`} />
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 mb-2">
                            {isRecording ? 'Recording in Progress...' : 'Test Recorder'}
                        </h3>
                        <p className="text-xs text-gray-500 mb-6">
                            {isRecording
                                ? 'Interact with the opened browser window. Steps will appear here automatically.'
                                : 'Enter the URL to start recording. We\'ll open a browser for you.'}
                        </p>

                        {!isRecording && (
                            <div className="w-full mb-4">
                                <Label className="sr-only">URL</Label>
                                <Input
                                    value={recordingUrl}
                                    onChange={(e) => setRecordingUrl(e.target.value)}
                                    placeholder="https://example.com"
                                    className="mb-2"
                                />
                            </div>
                        )}

                        {!isRecording ? (
                            <Button
                                onClick={handleStartRecording}
                                className="w-full bg-red-600 hover:bg-red-700"
                            >
                                Start Recording
                            </Button>
                        ) : (
                            <Button
                                onClick={handleStopRecording}
                                variant="outline"
                                className="w-full border-red-200 text-red-700 hover:bg-red-50"
                            >
                                Stop Recording
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 p-6 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                            <Sparkles className="w-8 h-8 text-purple-600" />
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 mb-2">AI Generator</h3>
                        <p className="text-xs text-gray-500 mb-6">
                            Describe your test scenario in plain English and let AI generate the steps for you.
                        </p>
                        <Button className="w-full bg-purple-600 hover:bg-purple-700">
                            Generate Test
                        </Button>
                    </div>
                )}
            </div>

            {/* Center Panel - Test Canvas */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-gray-50/50">
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">
                            {isFlowLoading ? 'Loading...' : testName}
                        </h2>
                        <p className="text-xs text-gray-500">Sequence of steps executed in order</p>
                    </div>
                    <div className="flex gap-2 items-center">
                        {selectedEnvironment && (
                            <div className="flex items-center gap-2 mr-2 px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded border border-green-200">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                Active Environment: <b>{selectedEnvironment.name}</b>
                            </div>
                        )}

                        <Button variant="outline" size="sm">
                            <Save className="w-4 h-4 mr-2" />
                            Save
                        </Button>
                        <Button size="sm" onClick={handleRunFlow}>
                            <Play className="w-4 h-4 mr-2" />
                            Run Flow
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {steps.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <Target className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-sm font-medium">No steps added yet</p>
                            <p className="text-xs mt-1">Drag actions from the left or click to add</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-w-3xl mx-auto">
                            {steps.map((step, index) => {
                                const actionConfig = getActionConfig(step.action)
                                const Icon = actionConfig?.icon || AlertCircle
                                const isSelected = selectedStepId === step.id

                                return (
                                    <div key={step.id} className="relative group">
                                        {/* Connector Line */}
                                        {index < steps.length - 1 && (
                                            <div className="absolute left-8 top-full h-3 w-0.5 bg-gray-300 z-0" />
                                        )}

                                        <Card
                                            className={`relative z-10 transition-all cursor-pointer border-2 ${isSelected ? 'border-blue-500 shadow-md ring-1 ring-blue-500/20' : 'border-transparent hover:border-gray-300'
                                                }`}
                                            onClick={() => setSelectedStepId(step.id)}
                                        >
                                            <div className="p-3 flex items-center gap-3">
                                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-medium text-gray-500">
                                                    {index + 1}
                                                </div>

                                                <div className={`${actionConfig?.color} p-2 rounded-lg text-white shadow-sm`}>
                                                    <Icon className="w-4 h-4" />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-semibold text-gray-900">{actionConfig?.name}</span>
                                                        {step.description && (
                                                            <span className="text-xs text-gray-500 truncate">- {step.description}</span>
                                                        )}
                                                    </div>
                                                    {(step.selector || step.value) && (
                                                        <div className="text-xs text-gray-500 mt-0.5 font-mono truncate">
                                                            {step.selector && <span className="text-blue-600">{step.selector}</span>}
                                                            {step.selector && step.value && <span className="mx-1">→</span>}
                                                            {step.value && <span className="text-green-600">"{step.value}"</span>}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            moveStep(step.id, 'up')
                                                        }}
                                                        disabled={index === 0}
                                                        className="p-1.5 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-30"
                                                    >
                                                        ↑
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            moveStep(step.id, 'down')
                                                        }}
                                                        disabled={index === steps.length - 1}
                                                        className="p-1.5 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-30"
                                                    >
                                                        ↓
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            duplicateStep(step.id)
                                                        }}
                                                        className="p-1.5 hover:bg-blue-50 rounded text-blue-600"
                                                    >
                                                        <Copy className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            deleteStep(step.id)
                                                        }}
                                                        className="p-1.5 hover:bg-red-50 rounded text-red-600"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </Card>
                                    </div>
                                )
                            })}

                            <button
                                onClick={() => setSelectedStepId(null)}
                                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-gray-400 hover:text-blue-600 flex items-center justify-center gap-2 text-sm font-medium"
                            >
                                <Plus className="w-4 h-4" />
                                Add Step
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel - Properties */}
            <div className="w-80 border-l border-gray-200 bg-white flex flex-col flex-shrink-0">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-sm font-bold text-gray-900">Properties</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {selectedStep ? (
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-medium text-gray-700 mb-1.5 block">Action Type</label>
                                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                                    {(() => {
                                        const config = getActionConfig(selectedStep.action)
                                        const Icon = config?.icon || AlertCircle
                                        return (
                                            <>
                                                <div className={`${config?.color} p-1.5 rounded text-white`}>
                                                    <Icon className="w-3.5 h-3.5" />
                                                </div>
                                                <span className="text-sm font-medium">{config?.name}</span>
                                            </>
                                        )
                                    })()}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-gray-700 mb-1.5 block">Description</label>
                                <Input
                                    value={selectedStep.description || ''}
                                    onChange={(e) => updateStep(selectedStep.id, 'description', e.target.value)}
                                    placeholder="Describe this step"
                                    className="text-sm"
                                />
                            </div>

                            {selectedStep.action !== 'navigate' && selectedStep.action !== 'wait' && (
                                <div>
                                    <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                                        Target Element <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={selectedStep.selector || ''}
                                            onChange={(e) => updateStep(selectedStep.id, 'selector', e.target.value)}
                                            placeholder="CSS Selector / XPath"
                                            className="text-sm font-mono"
                                        />
                                        <Button variant="outline" size="icon" className="flex-shrink-0" title="Pick Element">
                                            <Target className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {(selectedStep.action === 'type' || selectedStep.action === 'navigate' || selectedStep.action === 'assert') && (
                                <div>
                                    <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                                        {selectedStep.action === 'navigate' ? 'URL' : 'Value'}
                                    </label>
                                    <Input
                                        value={selectedStep.value || ''}
                                        onChange={(e) => updateStep(selectedStep.id, 'value', e.target.value)}
                                        placeholder="Enter value"
                                        className="text-sm"
                                    />
                                </div>
                            )}

                            {(() => {
                                switch (selectedStep.action) {
                                    // --- Navigation Actions ---
                                    case 'navigate':
                                    case 'new_tab':
                                    case 'wait_url':
                                        return (
                                            <div className="space-y-2">
                                                <Label>URL</Label>
                                                <Input
                                                    value={selectedStep.url || selectedStep.value || ''}
                                                    onChange={(e) => updateStep(selectedStep.id, 'url', e.target.value)}
                                                    placeholder="https://example.com"
                                                />
                                            </div>
                                        )

                                    // --- Press Key ---
                                    case 'press':
                                        return (
                                            <div className="space-y-3">
                                                <div className="space-y-2">
                                                    <Label>Key to Press</Label>
                                                    <select
                                                        className="w-full text-sm border rounded-md p-2"
                                                        value={selectedStep.key || 'Enter'}
                                                        onChange={(e) => updateStep(selectedStep.id, 'key', e.target.value)}
                                                    >
                                                        <option value="Enter">Enter</option>
                                                        <option value="Tab">Tab</option>
                                                        <option value="Escape">Escape</option>
                                                        <option value="Backspace">Backspace</option>
                                                        <option value="Delete">Delete</option>
                                                        <option value="ArrowUp">Arrow Up</option>
                                                        <option value="ArrowDown">Arrow Down</option>
                                                        <option value="ArrowLeft">Arrow Left</option>
                                                        <option value="ArrowRight">Arrow Right</option>
                                                        <option value="Space">Space</option>
                                                        <option value="Home">Home</option>
                                                        <option value="End">End</option>
                                                        <option value="PageUp">Page Up</option>
                                                        <option value="PageDown">Page Down</option>
                                                        <option value="Control+a">Ctrl+A (Select All)</option>
                                                        <option value="Control+c">Ctrl+C (Copy)</option>
                                                        <option value="Control+v">Ctrl+V (Paste)</option>
                                                        <option value="Control+z">Ctrl+Z (Undo)</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Target Element (optional)</Label>
                                                    <Input
                                                        value={selectedStep.selector || ''}
                                                        onChange={(e) => updateStep(selectedStep.id, 'selector', e.target.value)}
                                                        placeholder="CSS selector or leave empty for page"
                                                        className="font-mono text-xs"
                                                    />
                                                </div>
                                            </div>
                                        )

                                    // --- Select Dropdown ---
                                    case 'select':
                                        return (
                                            <div className="space-y-3">
                                                <div className="space-y-2">
                                                    <Label>Select By</Label>
                                                    <select
                                                        className="w-full text-sm border rounded-md p-2"
                                                        value={selectedStep.select_by || 'value'}
                                                        onChange={(e) => updateStep(selectedStep.id, 'select_by', e.target.value)}
                                                    >
                                                        <option value="value">Value</option>
                                                        <option value="label">Label (visible text)</option>
                                                        <option value="index">Index (0-based)</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Option</Label>
                                                    <Input
                                                        value={selectedStep.option || ''}
                                                        onChange={(e) => updateStep(selectedStep.id, 'option', e.target.value)}
                                                        placeholder={selectedStep.select_by === 'index' ? '0' : 'Option value or label'}
                                                    />
                                                </div>
                                            </div>
                                        )

                                    // --- File Upload ---
                                    case 'upload':
                                        return (
                                            <div className="space-y-2">
                                                <Label>File Path</Label>
                                                <Input
                                                    value={selectedStep.file_path || ''}
                                                    onChange={(e) => updateStep(selectedStep.id, 'file_path', e.target.value)}
                                                    placeholder="/path/to/file.pdf"
                                                />
                                                <p className="text-xs text-gray-500">Absolute path to the file to upload</p>
                                            </div>
                                        )

                                    // --- Scroll ---
                                    case 'scroll':
                                        return (
                                            <div className="space-y-3">
                                                <div className="space-y-2">
                                                    <Label>Scroll Type</Label>
                                                    <select
                                                        className="w-full text-sm border rounded-md p-2"
                                                        value={selectedStep.scroll_type || 'page'}
                                                        onChange={(e) => updateStep(selectedStep.id, 'scroll_type', e.target.value)}
                                                    >
                                                        <option value="page">Page</option>
                                                        <option value="element">To Element</option>
                                                        <option value="coordinates">To Coordinates</option>
                                                    </select>
                                                </div>
                                                {selectedStep.scroll_type === 'page' && (
                                                    <>
                                                        <div className="space-y-2">
                                                            <Label>Direction</Label>
                                                            <select
                                                                className="w-full text-sm border rounded-md p-2"
                                                                value={selectedStep.direction || 'down'}
                                                                onChange={(e) => updateStep(selectedStep.id, 'direction', e.target.value)}
                                                            >
                                                                <option value="down">Down</option>
                                                                <option value="up">Up</option>
                                                                <option value="bottom">To Bottom</option>
                                                                <option value="top">To Top</option>
                                                            </select>
                                                        </div>
                                                        {(selectedStep.direction === 'down' || selectedStep.direction === 'up') && (
                                                            <div className="space-y-2">
                                                                <Label>Amount (pixels)</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={selectedStep.amount || 500}
                                                                    onChange={(e) => updateStep(selectedStep.id, 'amount', parseInt(e.target.value))}
                                                                />
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                                {selectedStep.scroll_type === 'coordinates' && (
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="space-y-2">
                                                            <Label>X</Label>
                                                            <Input
                                                                type="number"
                                                                value={selectedStep.x || 0}
                                                                onChange={(e) => updateStep(selectedStep.id, 'x', parseInt(e.target.value))}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Y</Label>
                                                            <Input
                                                                type="number"
                                                                value={selectedStep.y || 0}
                                                                onChange={(e) => updateStep(selectedStep.id, 'y', parseInt(e.target.value))}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )

                                    // --- Wait ---
                                    case 'wait':
                                        return (
                                            <div className="space-y-3">
                                                <div className="space-y-2">
                                                    <Label>Wait Type</Label>
                                                    <select
                                                        className="w-full text-sm border rounded-md p-2"
                                                        value={selectedStep.scroll_type || 'time'}
                                                        onChange={(e) => updateStep(selectedStep.id, 'scroll_type', e.target.value)}
                                                    >
                                                        <option value="time">Duration (ms)</option>
                                                        <option value="element">For Element</option>
                                                    </select>
                                                </div>
                                                {selectedStep.scroll_type === 'element' ? (
                                                    <div className="space-y-2">
                                                        <Label>Element Selector</Label>
                                                        <Input
                                                            value={selectedStep.selector || ''}
                                                            onChange={(e) => updateStep(selectedStep.id, 'selector', e.target.value)}
                                                            placeholder="#element-id"
                                                            className="font-mono text-xs"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <Label>Duration (ms)</Label>
                                                        <Input
                                                            type="number"
                                                            value={selectedStep.amount || 1000}
                                                            onChange={(e) => updateStep(selectedStep.id, 'amount', parseInt(e.target.value))}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )

                                    // --- Screenshot ---
                                    case 'screenshot':
                                        return (
                                            <div className="space-y-3">
                                                <div className="space-y-2">
                                                    <Label>File Path (optional)</Label>
                                                    <Input
                                                        value={selectedStep.path || ''}
                                                        onChange={(e) => updateStep(selectedStep.id, 'path', e.target.value)}
                                                        placeholder="screenshot.png"
                                                    />
                                                </div>
                                                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedStep.full_page || false}
                                                        onChange={(e) => updateStep(selectedStep.id, 'full_page', e.target.checked)}
                                                        className="rounded border-gray-300"
                                                    />
                                                    Full page screenshot
                                                </label>
                                            </div>
                                        )

                                    // --- Drag & Drop ---
                                    case 'drag_drop':
                                        return (
                                            <div className="space-y-3">
                                                <div className="space-y-2">
                                                    <Label>Source Element</Label>
                                                    <Input
                                                        value={selectedStep.source_selector || ''}
                                                        onChange={(e) => updateStep(selectedStep.id, 'source_selector', e.target.value)}
                                                        placeholder="Drag from selector"
                                                        className="font-mono text-xs"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Target Element</Label>
                                                    <Input
                                                        value={selectedStep.target_selector || ''}
                                                        onChange={(e) => updateStep(selectedStep.id, 'target_selector', e.target.value)}
                                                        placeholder="Drop to selector"
                                                        className="font-mono text-xs"
                                                    />
                                                </div>
                                            </div>
                                        )

                                    // --- Random Data ---
                                    case 'random-data':
                                    case 'random_data':
                                        return (
                                            <div className="space-y-3">
                                                <div className="space-y-2">
                                                    <Label>Variable Name *</Label>
                                                    <Input
                                                        value={selectedStep.variable_name || ''}
                                                        onChange={(e) => updateStep(selectedStep.id, 'variable_name', e.target.value)}
                                                        placeholder="randomEmail"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Data Type</Label>
                                                    <select
                                                        className="w-full text-sm border rounded-md p-2"
                                                        value={selectedStep.data_type || 'string'}
                                                        onChange={(e) => updateStep(selectedStep.id, 'data_type', e.target.value)}
                                                    >
                                                        <optgroup label="Text">
                                                            <option value="string">Random String</option>
                                                            <option value="alphanumeric">Alphanumeric</option>
                                                            <option value="sentence">Sentence</option>
                                                            <option value="paragraph">Paragraph</option>
                                                        </optgroup>
                                                        <optgroup label="Numbers">
                                                            <option value="number">Integer</option>
                                                            <option value="float">Float</option>
                                                        </optgroup>
                                                        <optgroup label="Personal">
                                                            <option value="email">Email</option>
                                                            <option value="name">Full Name</option>
                                                            <option value="first_name">First Name</option>
                                                            <option value="last_name">Last Name</option>
                                                            <option value="phone">Phone Number</option>
                                                            <option value="password">Password</option>
                                                        </optgroup>
                                                        <optgroup label="Business">
                                                            <option value="company">Company Name</option>
                                                            <option value="address">Address</option>
                                                            <option value="url">URL</option>
                                                        </optgroup>
                                                        <optgroup label="System">
                                                            <option value="uuid">UUID</option>
                                                            <option value="date">Date</option>
                                                            <option value="datetime">DateTime</option>
                                                        </optgroup>
                                                    </select>
                                                </div>
                                                {(selectedStep.data_type === 'string' || selectedStep.data_type === 'alphanumeric' || selectedStep.data_type === 'password') && (
                                                    <div className="space-y-2">
                                                        <Label>Length</Label>
                                                        <Input
                                                            type="number"
                                                            value={selectedStep.length || 10}
                                                            onChange={(e) => updateStep(selectedStep.id, 'length', parseInt(e.target.value))}
                                                        />
                                                    </div>
                                                )}
                                                {(selectedStep.data_type === 'number' || selectedStep.data_type === 'float') && (
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="space-y-2">
                                                            <Label>Min</Label>
                                                            <Input
                                                                type="number"
                                                                value={selectedStep.min || 0}
                                                                onChange={(e) => updateStep(selectedStep.id, 'min', parseInt(e.target.value))}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Max</Label>
                                                            <Input
                                                                type="number"
                                                                value={selectedStep.max || 1000}
                                                                onChange={(e) => updateStep(selectedStep.id, 'max', parseInt(e.target.value))}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="space-y-2">
                                                        <Label>Prefix</Label>
                                                        <Input
                                                            value={selectedStep.prefix || ''}
                                                            onChange={(e) => updateStep(selectedStep.id, 'prefix', e.target.value)}
                                                            placeholder="test_"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Suffix</Label>
                                                        <Input
                                                            value={selectedStep.suffix || ''}
                                                            onChange={(e) => updateStep(selectedStep.id, 'suffix', e.target.value)}
                                                            placeholder="_end"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )

                                    // --- Extract Text/Attribute ---
                                    case 'extract_text':
                                    case 'extract_attribute':
                                        return (
                                            <div className="space-y-3">
                                                <div className="space-y-2">
                                                    <Label>Variable Name *</Label>
                                                    <Input
                                                        value={selectedStep.variable_name || ''}
                                                        onChange={(e) => updateStep(selectedStep.id, 'variable_name', e.target.value)}
                                                        placeholder="extractedValue"
                                                    />
                                                </div>
                                                {selectedStep.action === 'extract_attribute' && (
                                                    <div className="space-y-2">
                                                        <Label>Attribute Name</Label>
                                                        <Input
                                                            value={selectedStep.attribute_name || ''}
                                                            onChange={(e) => updateStep(selectedStep.id, 'attribute_name', e.target.value)}
                                                            placeholder="href, data-id, value..."
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )

                                    // --- Set Variable ---
                                    case 'set_variable':
                                    case 'set-variable':
                                        return (
                                            <div className="space-y-3">
                                                <div className="space-y-2">
                                                    <Label>Variable Name</Label>
                                                    <Input
                                                        value={selectedStep.variable_name || ''}
                                                        onChange={(e) => updateStep(selectedStep.id, 'variable_name', e.target.value)}
                                                        placeholder="myVariable"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Value</Label>
                                                    <Input
                                                        value={selectedStep.value || ''}
                                                        onChange={(e) => updateStep(selectedStep.id, 'value', e.target.value)}
                                                        placeholder="Value or ${otherVar}"
                                                    />
                                                </div>
                                            </div>
                                        )

                                    // --- Execute Script ---
                                    case 'execute_script':
                                        return (
                                            <div className="space-y-3">
                                                <div className="space-y-2">
                                                    <Label>JavaScript Code</Label>
                                                    <textarea
                                                        value={selectedStep.script || ''}
                                                        onChange={(e) => updateStep(selectedStep.id, 'script', e.target.value)}
                                                        placeholder="return document.title;"
                                                        className="w-full h-24 text-xs font-mono border rounded-md p-2"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Store Result In (optional)</Label>
                                                    <Input
                                                        value={selectedStep.variable_name || ''}
                                                        onChange={(e) => updateStep(selectedStep.id, 'variable_name', e.target.value)}
                                                        placeholder="resultVar"
                                                    />
                                                </div>
                                            </div>
                                        )

                                    // --- Cookie Operations ---
                                    case 'get_cookie':
                                    case 'delete_cookie':
                                        return (
                                            <div className="space-y-3">
                                                <div className="space-y-2">
                                                    <Label>Cookie Name</Label>
                                                    <Input
                                                        value={selectedStep.name || ''}
                                                        onChange={(e) => updateStep(selectedStep.id, 'name', e.target.value)}
                                                        placeholder="session_id"
                                                    />
                                                </div>
                                                {selectedStep.action === 'get_cookie' && (
                                                    <div className="space-y-2">
                                                        <Label>Store In Variable</Label>
                                                        <Input
                                                            value={selectedStep.variable_name || ''}
                                                            onChange={(e) => updateStep(selectedStep.id, 'variable_name', e.target.value)}
                                                            placeholder="cookieValue"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )

                                    case 'set_cookie':
                                        return (
                                            <div className="space-y-3">
                                                <div className="space-y-2">
                                                    <Label>Cookie Name</Label>
                                                    <Input
                                                        value={selectedStep.name || ''}
                                                        onChange={(e) => updateStep(selectedStep.id, 'name', e.target.value)}
                                                        placeholder="session_id"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Cookie Value</Label>
                                                    <Input
                                                        value={selectedStep.value || ''}
                                                        onChange={(e) => updateStep(selectedStep.id, 'value', e.target.value)}
                                                        placeholder="abc123"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>URL (optional)</Label>
                                                    <Input
                                                        value={selectedStep.url || ''}
                                                        onChange={(e) => updateStep(selectedStep.id, 'url', e.target.value)}
                                                        placeholder="Current page URL if empty"
                                                    />
                                                </div>
                                            </div>
                                        )

                                    // --- Storage Operations ---
                                    case 'get_local_storage':
                                    case 'get_session_storage':
                                        return (
                                            <div className="space-y-3">
                                                <div className="space-y-2">
                                                    <Label>Storage Key</Label>
                                                    <Input
                                                        value={selectedStep.key || ''}
                                                        onChange={(e) => updateStep(selectedStep.id, 'key', e.target.value)}
                                                        placeholder="user_token"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Store In Variable</Label>
                                                    <Input
                                                        value={selectedStep.variable_name || ''}
                                                        onChange={(e) => updateStep(selectedStep.id, 'variable_name', e.target.value)}
                                                        placeholder="storageValue"
                                                    />
                                                </div>
                                            </div>
                                        )

                                    case 'set_local_storage':
                                    case 'set_session_storage':
                                        return (
                                            <div className="space-y-3">
                                                <div className="space-y-2">
                                                    <Label>Storage Key</Label>
                                                    <Input
                                                        value={selectedStep.key || ''}
                                                        onChange={(e) => updateStep(selectedStep.id, 'key', e.target.value)}
                                                        placeholder="user_token"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Value</Label>
                                                    <Input
                                                        value={selectedStep.value || ''}
                                                        onChange={(e) => updateStep(selectedStep.id, 'value', e.target.value)}
                                                        placeholder="token_value"
                                                    />
                                                </div>
                                            </div>
                                        )

                                    // --- Ternary Variable ---
                                    case 'set_variable_ternary':
                                        return (
                                            <div className="space-y-3">
                                                <div className="space-y-2">
                                                    <Label>Variable Name</Label>
                                                    <Input
                                                        value={selectedStep.variable_name || ''}
                                                        onChange={(e) => updateStep(selectedStep.id, 'variable_name', e.target.value)}
                                                        placeholder="myVar"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Condition (JavaScript)</Label>
                                                    <Input
                                                        value={selectedStep.condition || ''}
                                                        onChange={(e) => updateStep(selectedStep.id, 'condition', e.target.value)}
                                                        placeholder="window.innerWidth > 768"
                                                        className="font-mono text-xs"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="space-y-2">
                                                        <Label>If True</Label>
                                                        <Input
                                                            value={selectedStep.true_value || ''}
                                                            onChange={(e) => updateStep(selectedStep.id, 'true_value', e.target.value)}
                                                            placeholder="desktop"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>If False</Label>
                                                        <Input
                                                            value={selectedStep.false_value || ''}
                                                            onChange={(e) => updateStep(selectedStep.id, 'false_value', e.target.value)}
                                                            placeholder="mobile"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )

                                    // --- For Loop ---
                                    case 'for-loop':
                                    case 'for_loop':
                                        return (
                                            <div className="space-y-3">
                                                <div className="space-y-2">
                                                    <Label>Iterations</Label>
                                                    <Input
                                                        type="number"
                                                        value={selectedStep.iterations || 5}
                                                        onChange={(e) => updateStep(selectedStep.id, 'iterations', parseInt(e.target.value))}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Loop Variable Name</Label>
                                                    <Input
                                                        value={selectedStep.loop_variable || 'i'}
                                                        onChange={(e) => updateStep(selectedStep.id, 'loop_variable', e.target.value)}
                                                        placeholder="i"
                                                    />
                                                    <p className="text-xs text-gray-500">Access via ${'{'}${selectedStep.loop_variable || 'i'}{'}'}</p>
                                                </div>
                                            </div>
                                        )

                                    // --- While Loop ---
                                    case 'while-loop':
                                    case 'while_loop':
                                        return (
                                            <div className="space-y-3">
                                                <div className="space-y-2">
                                                    <Label>Condition (JavaScript)</Label>
                                                    <Input
                                                        value={selectedStep.condition || ''}
                                                        onChange={(e) => updateStep(selectedStep.id, 'condition', e.target.value)}
                                                        placeholder="document.querySelectorAll('.item').length < 10"
                                                        className="font-mono text-xs"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Max Iterations (safety limit)</Label>
                                                    <Input
                                                        type="number"
                                                        value={selectedStep.max_iterations || 100}
                                                        onChange={(e) => updateStep(selectedStep.id, 'max_iterations', parseInt(e.target.value))}
                                                    />
                                                </div>
                                            </div>
                                        )

                                    // --- If Condition ---
                                    case 'if_condition':
                                        const nestedActionTypes = actionTypes.filter(a =>
                                            ['navigate', 'click', 'type', 'wait', 'hover', 'screenshot', 'scroll'].includes(a.id)
                                        )
                                        return (
                                            <div className="space-y-3">
                                                <div className="space-y-2">
                                                    <Label>Condition (JavaScript)</Label>
                                                    <Input
                                                        value={selectedStep.condition || ''}
                                                        onChange={(e) => updateStep(selectedStep.id, 'condition', e.target.value)}
                                                        placeholder="document.querySelector('#modal')"
                                                        className="font-mono text-xs"
                                                    />
                                                </div>
                                                <div className="p-3 border border-dashed border-gray-300 rounded-md bg-gray-50/50">
                                                    <Label className="text-xs font-semibold text-gray-500 mb-2 block">Then Execute:</Label>
                                                    <select
                                                        className="w-full text-sm border rounded-md p-2 mb-2"
                                                        value={selectedStep.nested_action_type || ''}
                                                        onChange={(e) => {
                                                            updateStep(selectedStep.id, 'nested_action_type', e.target.value)
                                                            updateStep(selectedStep.id, 'nested_action_data', {})
                                                        }}
                                                    >
                                                        <option value="">Select Action...</option>
                                                        {nestedActionTypes.map(a => (
                                                            <option key={a.id} value={a.id}>{a.name}</option>
                                                        ))}
                                                    </select>
                                                    {selectedStep.nested_action_type && (
                                                        <div className="pl-2 border-l-2 border-amber-200 space-y-2">
                                                            {['click', 'hover', 'double_click', 'right_click'].includes(selectedStep.nested_action_type) && (
                                                                <Input
                                                                    placeholder="Selector"
                                                                    value={selectedStep.nested_action_data?.selector || ''}
                                                                    onChange={(e) => updateStep(selectedStep.id, 'nested_action_data', { ...selectedStep.nested_action_data, selector: e.target.value })}
                                                                />
                                                            )}
                                                            {selectedStep.nested_action_type === 'type' && (
                                                                <>
                                                                    <Input placeholder="Selector" value={selectedStep.nested_action_data?.selector || ''} onChange={(e) => updateStep(selectedStep.id, 'nested_action_data', { ...selectedStep.nested_action_data, selector: e.target.value })} />
                                                                    <Input placeholder="Text to type" value={selectedStep.nested_action_data?.value || ''} onChange={(e) => updateStep(selectedStep.id, 'nested_action_data', { ...selectedStep.nested_action_data, value: e.target.value })} />
                                                                </>
                                                            )}
                                                            {selectedStep.nested_action_type === 'navigate' && (
                                                                <Input placeholder="URL" value={selectedStep.nested_action_data?.url || ''} onChange={(e) => updateStep(selectedStep.id, 'nested_action_data', { ...selectedStep.nested_action_data, url: e.target.value })} />
                                                            )}
                                                            {selectedStep.nested_action_type === 'wait' && (
                                                                <Input placeholder="Duration (ms)" type="number" value={selectedStep.nested_action_data?.duration || 1000} onChange={(e) => updateStep(selectedStep.id, 'nested_action_data', { ...selectedStep.nested_action_data, duration: parseInt(e.target.value) })} />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )

                                    // --- Switch Tab ---
                                    case 'switch_tab':
                                        return (
                                            <div className="space-y-2">
                                                <Label>Tab Index (0-based)</Label>
                                                <Input
                                                    type="number"
                                                    value={selectedStep.index || 0}
                                                    onChange={(e) => updateStep(selectedStep.id, 'index', parseInt(e.target.value))}
                                                    min={0}
                                                />
                                            </div>
                                        )

                                    // --- Switch to Frame ---
                                    case 'switch_to_frame':
                                        return (
                                            <div className="space-y-2">
                                                <Label>Frame Selector</Label>
                                                <Input
                                                    value={selectedStep.selector || ''}
                                                    onChange={(e) => updateStep(selectedStep.id, 'selector', e.target.value)}
                                                    placeholder="iframe#myFrame or iframe[name='content']"
                                                    className="font-mono text-xs"
                                                />
                                            </div>
                                        )

                                    // --- Assert ---
                                    case 'assert':
                                        return (
                                            <div className="space-y-3">
                                                <div className="space-y-2">
                                                    <Label>Assertion Type</Label>
                                                    <select
                                                        className="w-full text-sm border rounded-md p-2"
                                                        value={selectedStep.data_type || 'visible'}
                                                        onChange={(e) => updateStep(selectedStep.id, 'data_type', e.target.value)}
                                                    >
                                                        <option value="visible">Element is Visible</option>
                                                        <option value="text">Text Content Equals</option>
                                                        <option value="contains">Text Contains</option>
                                                        <option value="url">URL Equals</option>
                                                        <option value="attribute">Attribute Equals</option>
                                                    </select>
                                                </div>
                                                {selectedStep.data_type !== 'url' && (
                                                    <div className="space-y-2">
                                                        <Label>Element Selector</Label>
                                                        <Input
                                                            value={selectedStep.selector || ''}
                                                            onChange={(e) => updateStep(selectedStep.id, 'selector', e.target.value)}
                                                            placeholder="#element"
                                                            className="font-mono text-xs"
                                                        />
                                                    </div>
                                                )}
                                                {(selectedStep.data_type === 'text' || selectedStep.data_type === 'contains' || selectedStep.data_type === 'url') && (
                                                    <div className="space-y-2">
                                                        <Label>Expected Value</Label>
                                                        <Input
                                                            value={selectedStep.value || ''}
                                                            onChange={(e) => updateStep(selectedStep.id, 'value', e.target.value)}
                                                            placeholder="Expected text or URL"
                                                        />
                                                    </div>
                                                )}
                                                {selectedStep.data_type === 'attribute' && (
                                                    <>
                                                        <div className="space-y-2">
                                                            <Label>Attribute Name</Label>
                                                            <Input
                                                                value={selectedStep.attribute_name || ''}
                                                                onChange={(e) => updateStep(selectedStep.id, 'attribute_name', e.target.value)}
                                                                placeholder="class, disabled, data-*"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Expected Value</Label>
                                                            <Input
                                                                value={selectedStep.value || ''}
                                                                onChange={(e) => updateStep(selectedStep.id, 'value', e.target.value)}
                                                                placeholder="Expected attribute value"
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )

                                    // --- Set Viewport ---
                                    case 'set_viewport':
                                        return (
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="space-y-2">
                                                        <Label>Width</Label>
                                                        <Input
                                                            type="number"
                                                            value={selectedStep.width || 1920}
                                                            onChange={(e) => updateStep(selectedStep.id, 'width', parseInt(e.target.value))}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Height</Label>
                                                        <Input
                                                            type="number"
                                                            value={selectedStep.height || 1080}
                                                            onChange={(e) => updateStep(selectedStep.id, 'height', parseInt(e.target.value))}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )

                                    // --- Set Device ---
                                    case 'set_device':
                                        return (
                                            <div className="space-y-2">
                                                <Label>Device</Label>
                                                <select
                                                    className="w-full text-sm border rounded-md p-2"
                                                    value={selectedStep.device || 'Desktop Chrome'}
                                                    onChange={(e) => updateStep(selectedStep.id, 'device', e.target.value)}
                                                >
                                                    <optgroup label="Mobile">
                                                        <option value="iPhone 13">iPhone 13</option>
                                                        <option value="iPhone 13 Pro Max">iPhone 13 Pro Max</option>
                                                        <option value="Pixel 5">Pixel 5</option>
                                                        <option value="iPad">iPad</option>
                                                    </optgroup>
                                                    <optgroup label="Desktop">
                                                        <option value="Desktop Chrome">Desktop Chrome</option>
                                                        <option value="Desktop Firefox">Desktop Firefox</option>
                                                    </optgroup>
                                                </select>
                                            </div>
                                        )

                                    // --- Set Geolocation ---
                                    case 'set_geolocation':
                                        return (
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="space-y-2">
                                                        <Label>Latitude</Label>
                                                        <Input
                                                            type="number"
                                                            step="0.0001"
                                                            value={selectedStep.latitude || 0}
                                                            onChange={(e) => updateStep(selectedStep.id, 'latitude', parseFloat(e.target.value))}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Longitude</Label>
                                                        <Input
                                                            type="number"
                                                            step="0.0001"
                                                            value={selectedStep.longitude || 0}
                                                            onChange={(e) => updateStep(selectedStep.id, 'longitude', parseFloat(e.target.value))}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Accuracy (meters)</Label>
                                                    <Input
                                                        type="number"
                                                        value={selectedStep.accuracy || 100}
                                                        onChange={(e) => updateStep(selectedStep.id, 'accuracy', parseInt(e.target.value))}
                                                    />
                                                </div>
                                            </div>
                                        )

                                    // --- Wait for Download ---
                                    case 'wait_for_download':
                                        return (
                                            <div className="space-y-3">
                                                <div className="space-y-2">
                                                    <Label>Download Path</Label>
                                                    <Input
                                                        value={selectedStep.download_path || './downloads'}
                                                        onChange={(e) => updateStep(selectedStep.id, 'download_path', e.target.value)}
                                                        placeholder="./downloads"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Store Path In Variable</Label>
                                                    <Input
                                                        value={selectedStep.variable_name || ''}
                                                        onChange={(e) => updateStep(selectedStep.id, 'variable_name', e.target.value)}
                                                        placeholder="downloadedFile"
                                                    />
                                                </div>
                                            </div>
                                        )

                                    // --- Verify Download ---
                                    case 'verify_download':
                                        return (
                                            <div className="space-y-3">
                                                <div className="space-y-2">
                                                    <Label>File Path</Label>
                                                    <Input
                                                        value={selectedStep.file_path || ''}
                                                        onChange={(e) => updateStep(selectedStep.id, 'file_path', e.target.value)}
                                                        placeholder="${downloadedFile} or /path/to/file"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Minimum Size (bytes)</Label>
                                                    <Input
                                                        type="number"
                                                        value={selectedStep.min_size || 0}
                                                        onChange={(e) => updateStep(selectedStep.id, 'min_size', parseInt(e.target.value))}
                                                    />
                                                </div>
                                            </div>
                                        )

                                    // --- Make API Call ---
                                    case 'make_api_call':
                                        return (
                                            <div className="space-y-3">
                                                <div className="space-y-2">
                                                    <Label>URL</Label>
                                                    <Input
                                                        value={selectedStep.url || ''}
                                                        onChange={(e) => updateStep(selectedStep.id, 'url', e.target.value)}
                                                        placeholder="https://api.example.com/endpoint"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Method</Label>
                                                    <select
                                                        className="w-full text-sm border rounded-md p-2"
                                                        value={selectedStep.method || 'GET'}
                                                        onChange={(e) => updateStep(selectedStep.id, 'method', e.target.value)}
                                                    >
                                                        <option value="GET">GET</option>
                                                        <option value="POST">POST</option>
                                                        <option value="PUT">PUT</option>
                                                        <option value="DELETE">DELETE</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Store Response In Variable</Label>
                                                    <Input
                                                        value={selectedStep.variable_name || ''}
                                                        onChange={(e) => updateStep(selectedStep.id, 'variable_name', e.target.value)}
                                                        placeholder="apiResponse"
                                                    />
                                                </div>
                                            </div>
                                        )

                                    // --- Wait for Response ---
                                    case 'wait_for_response':
                                    case 'wait_for_request':
                                        return (
                                            <div className="space-y-3">
                                                <div className="space-y-2">
                                                    <Label>URL Pattern</Label>
                                                    <Input
                                                        value={selectedStep.url || ''}
                                                        onChange={(e) => updateStep(selectedStep.id, 'url', e.target.value)}
                                                        placeholder="**/api/users**"
                                                        className="font-mono text-xs"
                                                    />
                                                </div>
                                                {selectedStep.action === 'wait_for_response' && (
                                                    <div className="space-y-2">
                                                        <Label>Store Status In Variable</Label>
                                                        <Input
                                                            value={selectedStep.variable_name || ''}
                                                            onChange={(e) => updateStep(selectedStep.id, 'variable_name', e.target.value)}
                                                            placeholder="responseStatus"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )

                                    // --- Log ---
                                    case 'log':
                                        return (
                                            <div className="space-y-3">
                                                <div className="space-y-2">
                                                    <Label>Message</Label>
                                                    <Input
                                                        value={selectedStep.message || ''}
                                                        onChange={(e) => updateStep(selectedStep.id, 'message', e.target.value)}
                                                        placeholder="Current value: ${myVar}"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Level</Label>
                                                    <select
                                                        className="w-full text-sm border rounded-md p-2"
                                                        value={selectedStep.level || 'info'}
                                                        onChange={(e) => updateStep(selectedStep.id, 'level', e.target.value)}
                                                    >
                                                        <option value="info">Info</option>
                                                        <option value="warn">Warning</option>
                                                        <option value="error">Error</option>
                                                        <option value="debug">Debug</option>
                                                    </select>
                                                </div>
                                            </div>
                                        )

                                    // --- Comment ---
                                    case 'comment':
                                        return (
                                            <div className="space-y-2">
                                                <Label>Comment</Label>
                                                <Input
                                                    value={selectedStep.description || ''}
                                                    onChange={(e) => updateStep(selectedStep.id, 'description', e.target.value)}
                                                    placeholder="Add a note..."
                                                />
                                            </div>
                                        )

                                    // --- Highlight Element ---
                                    case 'highlight_element':
                                        return (
                                            <div className="space-y-3">
                                                <div className="space-y-2">
                                                    <Label>Color</Label>
                                                    <select
                                                        className="w-full text-sm border rounded-md p-2"
                                                        value={selectedStep.color || 'red'}
                                                        onChange={(e) => updateStep(selectedStep.id, 'color', e.target.value)}
                                                    >
                                                        <option value="red">Red</option>
                                                        <option value="blue">Blue</option>
                                                        <option value="green">Green</option>
                                                        <option value="yellow">Yellow</option>
                                                        <option value="orange">Orange</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Duration (ms)</Label>
                                                    <Input
                                                        type="number"
                                                        value={selectedStep.duration || 2000}
                                                        onChange={(e) => updateStep(selectedStep.id, 'duration', parseInt(e.target.value))}
                                                    />
                                                </div>
                                            </div>
                                        )

                                    // --- Assert Element Count ---
                                    case 'assert_element_count':
                                        return (
                                            <div className="space-y-3">
                                                <div className="space-y-2">
                                                    <Label>Comparison</Label>
                                                    <select
                                                        className="w-full text-sm border rounded-md p-2"
                                                        value={selectedStep.comparison || 'equals'}
                                                        onChange={(e) => updateStep(selectedStep.id, 'comparison', e.target.value)}
                                                    >
                                                        <option value="equals">Equals</option>
                                                        <option value="greater">Greater Than</option>
                                                        <option value="less">Less Than</option>
                                                        <option value="at_least">At Least</option>
                                                        <option value="at_most">At Most</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Expected Count</Label>
                                                    <Input
                                                        type="number"
                                                        value={selectedStep.expected_count || 0}
                                                        onChange={(e) => updateStep(selectedStep.id, 'expected_count', parseInt(e.target.value))}
                                                    />
                                                </div>
                                            </div>
                                        )

                                    // --- Get Element Count ---
                                    case 'get_element_count':
                                        return (
                                            <div className="space-y-2">
                                                <Label>Store In Variable</Label>
                                                <Input
                                                    value={selectedStep.variable_name || ''}
                                                    onChange={(e) => updateStep(selectedStep.id, 'variable_name', e.target.value)}
                                                    placeholder="elementCount"
                                                />
                                            </div>
                                        )

                                    // --- Measure Load Time ---
                                    case 'measure_load_time':
                                    case 'get_performance_metrics':
                                        return (
                                            <div className="space-y-2">
                                                <Label>Store In Variable</Label>
                                                <Input
                                                    value={selectedStep.variable_name || 'load_time'}
                                                    onChange={(e) => updateStep(selectedStep.id, 'variable_name', e.target.value)}
                                                    placeholder="load_time"
                                                />
                                            </div>
                                        )

                                    // --- Read CSV/JSON ---
                                    case 'read_csv':
                                    case 'read_json':
                                        return (
                                            <div className="space-y-3">
                                                <div className="space-y-2">
                                                    <Label>File Path</Label>
                                                    <Input
                                                        value={selectedStep.file_path || ''}
                                                        onChange={(e) => updateStep(selectedStep.id, 'file_path', e.target.value)}
                                                        placeholder={selectedStep.action === 'read_csv' ? '/path/to/data.csv' : '/path/to/data.json'}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Store In Variable</Label>
                                                    <Input
                                                        value={selectedStep.variable_name || ''}
                                                        onChange={(e) => updateStep(selectedStep.id, 'variable_name', e.target.value)}
                                                        placeholder="testData"
                                                    />
                                                </div>
                                            </div>
                                        )

                                    // --- Iterate Dataset ---
                                    case 'iterate_dataset':
                                        return (
                                            <div className="space-y-3">
                                                <div className="space-y-2">
                                                    <Label>Dataset Variable</Label>
                                                    <Input
                                                        value={selectedStep.dataset_name || ''}
                                                        onChange={(e) => updateStep(selectedStep.id, 'dataset_name', e.target.value)}
                                                        placeholder="testData"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Row Variable Name</Label>
                                                    <Input
                                                        value={selectedStep.loop_variable || 'row'}
                                                        onChange={(e) => updateStep(selectedStep.id, 'loop_variable', e.target.value)}
                                                        placeholder="row"
                                                    />
                                                    <p className="text-xs text-gray-500">Access: ${'{row_fieldName}'}</p>
                                                </div>
                                            </div>
                                        )

                                    // --- Clipboard ---
                                    case 'copy_to_clipboard':
                                        return (
                                            <div className="space-y-2">
                                                <Label>Text to Copy</Label>
                                                <Input
                                                    value={selectedStep.text || ''}
                                                    onChange={(e) => updateStep(selectedStep.id, 'text', e.target.value)}
                                                    placeholder="${myVar} or static text"
                                                />
                                            </div>
                                        )

                                    // --- Actions that only need selector (already handled above) ---
                                    case 'click':
                                    case 'double_click':
                                    case 'right_click':
                                    case 'hover':
                                    case 'focus':
                                    case 'clear':
                                    case 'check':
                                    case 'uncheck':
                                    case 'go_back':
                                    case 'go_forward':
                                    case 'reload':
                                    case 'clear_cookies':
                                    case 'clear_local_storage':
                                    case 'clear_session_storage':
                                    case 'switch_to_main':
                                    case 'accept_dialog':
                                    case 'dismiss_dialog':
                                    case 'wait_network':
                                    case 'close_tab':
                                    case 'paste_from_clipboard':
                                    case 'assert_not_visible':
                                    case 'soft_assert':
                                        return null  // These actions don't need additional configuration

                                    default:
                                        return null
                                }
                            })()}

                            <div>
                                <label className="text-xs font-medium text-gray-700 mb-1.5 block">Timeout (ms)</label>
                                <Input
                                    type="number"
                                    value={selectedStep.timeout || 5000}
                                    onChange={(e) => updateStep(selectedStep.id, 'timeout', parseInt(e.target.value))}
                                    className="text-sm"
                                />
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <h3 className="text-xs font-semibold text-gray-900 mb-3">Advanced Options</h3>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                        <input type="checkbox" className="rounded border-gray-300" />
                                        Continue on error
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                        <input type="checkbox" className="rounded border-gray-300" />
                                        Take screenshot after
                                    </label>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 mt-10">
                            <Settings className="w-10 h-10 mx-auto mb-3 opacity-20" />
                            <p className="text-sm">Select a step to configure properties</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
