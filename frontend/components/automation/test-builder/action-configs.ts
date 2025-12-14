import {
    Send,
    ArrowLeft,
    ArrowRight,
    RefreshCw,
    MousePointerClick,
    Pointer,
    Menu,
    FormInput,
    Eraser,
    Keyboard,
    Hand,
    Target,
    Move,
    ChevronDown,
    CheckSquare,
    Square,
    Upload,
    Timer,
    Wifi,
    Link,
    CheckCircle2,
    Image,
    X,
    ExternalLink,
    Layers,
    Frame,
    PanelTop,
    FileText,
    Code,
    Variable,
    Wand2,
    Zap,
    Cookie,
    Trash2,
    HardDrive,
    Database,
    Repeat,
    IterationCw,
    ShieldCheck,
    Globe,
    Monitor,
    Smartphone,
    MapPin,
    Download,
    Highlighter,
    Hash,
    EyeOff,
    MessageCircle,
    MessageSquare,
    Gauge,
    Activity,
    FileSpreadsheet,
    FileJson,
    ClipboardCopy,
    ClipboardPaste,
    FunctionSquare,
    Package,
} from 'lucide-react'
import { ActionConfig } from './types'

// ============================================
// Browser Actions
// ============================================
export const browserActions: ActionConfig[] = [
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

// ============================================
// Data & Variables Actions
// ============================================
export const dataActions: ActionConfig[] = [
    { id: 'extract_text', name: 'Extract Text', icon: FileText, color: 'bg-indigo-600', description: 'Save element text to variable' },
    { id: 'extract_attribute', name: 'Extract Attr', icon: Code, color: 'bg-indigo-500', description: 'Save element attribute' },
    { id: 'set_variable', name: 'Set Variable', icon: Variable, color: 'bg-indigo-700', description: 'Set variable value' },
    { id: 'random-data', name: 'Random Data', icon: Wand2, color: 'bg-green-600', description: 'Generate random data' },
    { id: 'execute_script', name: 'Execute JS', icon: Code, color: 'bg-rose-600', description: 'Run JavaScript code' },
    { id: 'set_variable_ternary', name: 'Ternary Var', icon: Zap, color: 'bg-amber-600', description: 'Set var based on condition' },
]

// ============================================
// Storage Actions
// ============================================
export const storageActions: ActionConfig[] = [
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

// ============================================
// Control Flow Actions
// ============================================
export const controlFlowActions: ActionConfig[] = [
    { id: 'for-loop', name: 'For Loop', icon: Repeat, color: 'bg-purple-600', description: 'Repeat steps N times' },
    { id: 'while-loop', name: 'While Loop', icon: IterationCw, color: 'bg-blue-600', description: 'Repeat while condition true' },
    { id: 'if_condition', name: 'If Condition', icon: Zap, color: 'bg-amber-600', description: 'Run action if condition true' },
    { id: 'try-catch', name: 'Try/Catch', icon: ShieldCheck, color: 'bg-orange-600', description: 'Handle errors gracefully' },
    { id: 'iterate_dataset', name: 'Iterate Data', icon: IterationCw, color: 'bg-violet-600', description: 'Loop through dataset' },
]

// ============================================
// API & Network Actions
// ============================================
export const apiActions: ActionConfig[] = [
    { id: 'make_api_call', name: 'API Call', icon: Globe, color: 'bg-blue-700', description: 'Make HTTP request' },
    { id: 'wait_for_response', name: 'Wait Response', icon: Wifi, color: 'bg-blue-600', description: 'Wait for API response' },
    { id: 'wait_for_request', name: 'Wait Request', icon: Wifi, color: 'bg-blue-500', description: 'Wait for API request' },
]

// ============================================
// Advanced Actions
// ============================================
export const advancedActions: ActionConfig[] = [
    { id: 'set_viewport', name: 'Set Viewport', icon: Monitor, color: 'bg-indigo-500', description: 'Change browser size' },
    { id: 'set_device', name: 'Set Device', icon: Smartphone, color: 'bg-indigo-600', description: 'Emulate mobile device' },
    { id: 'set_geolocation', name: 'Set Location', icon: MapPin, color: 'bg-emerald-500', description: 'Set geolocation' },
    { id: 'wait_for_download', name: 'Wait Download', icon: Download, color: 'bg-green-600', description: 'Wait for file download' },
    { id: 'verify_download', name: 'Verify Download', icon: CheckCircle2, color: 'bg-green-500', description: 'Verify downloaded file' },
    { id: 'highlight_element', name: 'Highlight', icon: Highlighter, color: 'bg-yellow-500', description: 'Highlight element visually' },
]

// ============================================
// Assertion Actions
// ============================================
export const assertActions: ActionConfig[] = [
    { id: 'assert', name: 'Assert', icon: CheckCircle2, color: 'bg-emerald-600', description: 'Assert condition' },
    { id: 'assert_title', name: 'Assert Title', icon: FileText, color: 'bg-emerald-700', description: 'Assert page title' },
    { id: 'assert_url', name: 'Assert URL', icon: Link, color: 'bg-emerald-500', description: 'Assert page URL' },
    { id: 'assert_element_count', name: 'Assert Count', icon: Hash, color: 'bg-emerald-500', description: 'Assert element count' },
    { id: 'assert_not_visible', name: 'Assert Hidden', icon: EyeOff, color: 'bg-emerald-400', description: 'Assert element hidden' },
    { id: 'soft_assert', name: 'Soft Assert', icon: ShieldCheck, color: 'bg-lime-500', description: 'Assert without stopping' },
    { id: 'get_element_count', name: 'Get Count', icon: Hash, color: 'bg-indigo-500', description: 'Get element count' },
]

// ============================================
// Debugging Actions
// ============================================
export const debugActions: ActionConfig[] = [
    { id: 'log', name: 'Log', icon: MessageCircle, color: 'bg-gray-600', description: 'Log message' },
    { id: 'comment', name: 'Comment', icon: MessageSquare, color: 'bg-gray-500', description: 'Add comment (no-op)' },
    { id: 'measure_load_time', name: 'Load Time', icon: Gauge, color: 'bg-purple-500', description: 'Measure page load' },
    { id: 'get_performance_metrics', name: 'Perf Metrics', icon: Activity, color: 'bg-purple-600', description: 'Get Web Vitals' },
]

// ============================================
// Data File Actions
// ============================================
export const fileActions: ActionConfig[] = [
    { id: 'read_csv', name: 'Read CSV', icon: FileSpreadsheet, color: 'bg-teal-600', description: 'Load CSV file' },
    { id: 'read_json', name: 'Read JSON', icon: FileJson, color: 'bg-teal-500', description: 'Load JSON file' },
    { id: 'copy_to_clipboard', name: 'Copy', icon: ClipboardCopy, color: 'bg-gray-500', description: 'Copy to clipboard' },
    { id: 'paste_from_clipboard', name: 'Paste', icon: ClipboardPaste, color: 'bg-gray-600', description: 'Paste from clipboard' },
]


// ============================================
// Snippet Actions (Reusable Parameterized Steps)
// ============================================
export const snippetActions: ActionConfig[] = [
    { id: 'call_snippet', name: 'Call Snippet', icon: FunctionSquare, color: 'bg-violet-500', description: 'Execute a reusable snippet' },
    { id: 'create_snippet', name: 'Create Snippet', icon: Package, color: 'bg-violet-400', description: 'Create snippet from steps' },
]


// ============================================
// Combined list of all actions for lookup
// ============================================
export const allActions: ActionConfig[] = [
    ...browserActions,
    ...dataActions,
    ...storageActions,
    ...controlFlowActions,
    ...apiActions,
    ...advancedActions,
    ...assertActions,
    ...debugActions,
    ...fileActions,
    ...snippetActions,
]

/**
 * Get action configuration by action ID
 */
export function getActionConfig(actionType: string): ActionConfig | undefined {
    return allActions.find(a => a.id === actionType)
}

/**
 * Action categories for rendering in the palette
 */
export const actionCategories = [
    { name: 'Browser Actions', actions: browserActions },
    { name: 'Data & Variables', actions: dataActions },
    { name: 'Storage', actions: storageActions },
    { name: 'Control Flow', actions: controlFlowActions },
    { name: 'API & Network', actions: apiActions },
    { name: 'Assertions', actions: assertActions },
    { name: 'Advanced', actions: advancedActions },
    { name: 'Debugging', actions: debugActions },
    { name: 'Data Files', actions: fileActions },
    { name: 'Snippets', actions: snippetActions },
]
