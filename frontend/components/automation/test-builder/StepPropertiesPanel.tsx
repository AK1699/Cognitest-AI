'use client'

import React, { useState, useEffect } from 'react'
import { Settings, Target, AlertCircle, FunctionSquare, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { TestStep } from './types'
import { getActionConfig, browserActions } from './action-configs'
import { snippetApi, Snippet, SnippetParameter } from '@/lib/api/webAutomation'
import { toast } from 'sonner'

interface StepPropertiesPanelProps {
    selectedStep: TestStep | undefined
    onUpdateStep: (stepId: string, field: keyof TestStep, value: any) => void
}

/**
 * Right panel for editing step properties
 */
export function StepPropertiesPanel({ selectedStep, onUpdateStep }: StepPropertiesPanelProps) {
    if (!selectedStep) {
        return (
            <div className="text-center text-gray-500 mt-10">
                <Settings className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Select a step to configure properties</p>
            </div>
        )
    }

    const updateStep = (field: keyof TestStep, value: any) => {
        onUpdateStep(selectedStep.id, field, value)
    }

    const actionConfig = getActionConfig(selectedStep.action)
    const Icon = actionConfig?.icon || AlertCircle

    return (
        <div className="space-y-6">
            {/* Action Type Display */}
            <div>
                <label className="text-xs font-medium text-gray-700 mb-1.5 block">Action Type</label>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                    <div className={`${actionConfig?.color} p-1.5 rounded text-white`}>
                        <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-medium">{actionConfig?.name}</span>
                </div>
            </div>

            {/* Description */}
            <div>
                <label className="text-xs font-medium text-gray-700 mb-1.5 block">Description</label>
                <Input
                    value={selectedStep.description || ''}
                    onChange={(e) => updateStep('description', e.target.value)}
                    placeholder="Describe this step"
                    className="text-sm"
                />
            </div>

            {/* Target Element (for most actions) */}
            {!['navigate', 'wait', 'assert_title', 'assert_url', 'set_variable', 'set_variable_ternary', 'execute_script', 'log', 'comment', 'screenshot', 'reload', 'go_back', 'go_forward', 'wait_network', 'wait_url', 'for-loop', 'while-loop', 'if_condition', 'try-catch', 'random-data', 'make_api_call', 'wait_for_response', 'wait_for_request', 'set_viewport', 'set_device', 'set_geolocation', 'measure_load_time', 'get_performance_metrics', 'read_csv', 'read_json', 'iterate_dataset', 'get_cookie', 'set_cookie', 'delete_cookie', 'clear_cookies', 'get_local_storage', 'set_local_storage', 'clear_local_storage', 'get_session_storage', 'set_session_storage', 'clear_session_storage', 'new_tab', 'switch_tab', 'close_tab', 'switch_to_frame', 'switch_to_main', 'accept_dialog', 'dismiss_dialog', 'wait_for_download', 'verify_download', 'call_snippet', 'create_snippet'].includes(selectedStep.action) && (
                <div>
                    <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                        Target Element <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                        <Input
                            value={selectedStep.selector || ''}
                            onChange={(e) => updateStep('selector', e.target.value)}
                            placeholder="CSS Selector / XPath"
                            className="text-sm font-mono"
                        />
                        <Button variant="outline" size="icon" className="flex-shrink-0" title="Pick Element">
                            <Target className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Value field for type/assert */}
            {(selectedStep.action === 'type' || selectedStep.action === 'assert') && (
                <div>
                    <label className="text-xs font-medium text-gray-700 mb-1.5 block">Value</label>
                    <Input
                        value={selectedStep.value || ''}
                        onChange={(e) => updateStep('value', e.target.value)}
                        placeholder="Enter value"
                        className="text-sm"
                    />
                </div>
            )}


            {/* Action-specific fields */}
            <ActionSpecificFields selectedStep={selectedStep} updateStep={updateStep} />

            {/* Advanced Options - not needed for call_snippet */}
            {selectedStep.action !== 'call_snippet' && selectedStep.action !== 'create_snippet' && (
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
            )}
        </div>
    )
}

interface ActionSpecificFieldsProps {
    selectedStep: TestStep
    updateStep: (field: keyof TestStep, value: any) => void
}

/**
 * Renders action-specific form fields based on action type
 */
function ActionSpecificFields({ selectedStep, updateStep }: ActionSpecificFieldsProps) {
    switch (selectedStep.action) {
        // Navigation Actions
        case 'navigate':
        case 'new_tab':
        case 'wait_url':
            return (
                <div className="space-y-2">
                    <Label>URL</Label>
                    <Input
                        value={selectedStep.url || selectedStep.value || ''}
                        onChange={(e) => updateStep('url', e.target.value)}
                        placeholder="https://example.com"
                    />
                </div>
            )

        // Press Key
        case 'press':
            return (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label>Key to Press</Label>
                        <select
                            className="w-full text-sm border rounded-md p-2"
                            value={selectedStep.key || 'Enter'}
                            onChange={(e) => updateStep('key', e.target.value)}
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
                            <option value="Control+a">Ctrl+A (Select All)</option>
                            <option value="Control+c">Ctrl+C (Copy)</option>
                            <option value="Control+v">Ctrl+V (Paste)</option>
                        </select>
                    </div>
                </div>
            )

        // Select Dropdown
        case 'select':
            return (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label>Select By</Label>
                        <select
                            className="w-full text-sm border rounded-md p-2"
                            value={selectedStep.select_by || 'value'}
                            onChange={(e) => updateStep('select_by', e.target.value as 'value' | 'label' | 'index')}
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
                            onChange={(e) => updateStep('option', e.target.value)}
                            placeholder={selectedStep.select_by === 'index' ? '0' : 'Option value or label'}
                        />
                    </div>
                </div>
            )

        // File Upload
        case 'upload':
            return (
                <div className="space-y-2">
                    <Label>File Path</Label>
                    <Input
                        value={selectedStep.file_path || ''}
                        onChange={(e) => updateStep('file_path', e.target.value)}
                        placeholder="/path/to/file.pdf"
                    />
                    <p className="text-xs text-gray-500">Absolute path to the file to upload</p>
                </div>
            )

        // Scroll
        case 'scroll':
            return (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label>Scroll Type</Label>
                        <select
                            className="w-full text-sm border rounded-md p-2"
                            value={selectedStep.scroll_type || 'page'}
                            onChange={(e) => updateStep('scroll_type', e.target.value as 'page' | 'element' | 'coordinates')}
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
                                    onChange={(e) => updateStep('direction', e.target.value)}
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
                                        onChange={(e) => updateStep('amount', parseInt(e.target.value))}
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
                                    onChange={(e) => updateStep('x', parseInt(e.target.value))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Y</Label>
                                <Input
                                    type="number"
                                    value={selectedStep.y || 0}
                                    onChange={(e) => updateStep('y', parseInt(e.target.value))}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )

        // Wait
        case 'wait':
            return (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label>Wait Type</Label>
                        <select
                            className="w-full text-sm border rounded-md p-2"
                            value={selectedStep.scroll_type || 'time'}
                            onChange={(e) => updateStep('scroll_type', e.target.value)}
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
                                onChange={(e) => updateStep('selector', e.target.value)}
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
                                onChange={(e) => updateStep('amount', parseInt(e.target.value))}
                            />
                        </div>
                    )}
                </div>
            )

        // Screenshot
        case 'screenshot':
            return (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label>File Path (optional)</Label>
                        <Input
                            value={selectedStep.path || ''}
                            onChange={(e) => updateStep('path', e.target.value)}
                            placeholder="screenshot.png"
                        />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={selectedStep.full_page || false}
                            onChange={(e) => updateStep('full_page', e.target.checked)}
                            className="rounded border-gray-300"
                        />
                        Full page screenshot
                    </label>
                </div>
            )

        // Drag & Drop
        case 'drag_drop':
            return (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label>Source Element</Label>
                        <Input
                            value={selectedStep.source_selector || ''}
                            onChange={(e) => updateStep('source_selector', e.target.value)}
                            placeholder="Drag from selector"
                            className="font-mono text-xs"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Target Element</Label>
                        <Input
                            value={selectedStep.target_selector || ''}
                            onChange={(e) => updateStep('target_selector', e.target.value)}
                            placeholder="Drop to selector"
                            className="font-mono text-xs"
                        />
                    </div>
                </div>
            )

        // Extract Text/Attribute
        case 'extract_text':
        case 'extract_attribute':
            return (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label>Variable Name *</Label>
                        <Input
                            value={selectedStep.variable_name || ''}
                            onChange={(e) => updateStep('variable_name', e.target.value)}
                            placeholder="extractedValue"
                        />
                    </div>
                    {selectedStep.action === 'extract_attribute' && (
                        <div className="space-y-2">
                            <Label>Attribute Name</Label>
                            <Input
                                value={selectedStep.attribute_name || ''}
                                onChange={(e) => updateStep('attribute_name', e.target.value)}
                                placeholder="href, data-id, value..."
                            />
                        </div>
                    )}
                </div>
            )

        // Set Variable
        case 'set_variable':
            return (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label>Variable Name</Label>
                        <Input
                            value={selectedStep.variable_name || ''}
                            onChange={(e) => updateStep('variable_name', e.target.value)}
                            placeholder="myVariable"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Value</Label>
                        <Input
                            value={selectedStep.value || ''}
                            onChange={(e) => updateStep('value', e.target.value)}
                            placeholder="Value or ${otherVar}"
                        />
                    </div>
                </div>
            )

        // Execute Script
        case 'execute_script':
            return (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label>JavaScript Code</Label>
                        <textarea
                            value={selectedStep.script || ''}
                            onChange={(e) => updateStep('script', e.target.value)}
                            placeholder="return document.title;"
                            className="w-full h-24 text-xs font-mono border rounded-md p-2"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Store Result In (optional)</Label>
                        <Input
                            value={selectedStep.variable_name || ''}
                            onChange={(e) => updateStep('variable_name', e.target.value)}
                            placeholder="resultVar"
                        />
                    </div>
                </div>
            )

        // For Loop
        case 'for-loop':
        case 'for_loop':
            return (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label>Iterations</Label>
                        <Input
                            type="number"
                            value={selectedStep.iterations || 5}
                            onChange={(e) => updateStep('iterations', parseInt(e.target.value))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Loop Variable Name</Label>
                        <Input
                            value={selectedStep.loop_variable || 'i'}
                            onChange={(e) => updateStep('loop_variable', e.target.value)}
                            placeholder="i"
                        />
                        <p className="text-xs text-gray-500">Access via ${'{'}${selectedStep.loop_variable || 'i'}{'}'}</p>
                    </div>
                </div>
            )

        // While Loop
        case 'while-loop':
        case 'while_loop':
            return (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label>Condition (JavaScript)</Label>
                        <Input
                            value={selectedStep.condition || ''}
                            onChange={(e) => updateStep('condition', e.target.value)}
                            placeholder="document.querySelectorAll('.item').length < 10"
                            className="font-mono text-xs"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Max Iterations (safety limit)</Label>
                        <Input
                            type="number"
                            value={selectedStep.max_iterations || 100}
                            onChange={(e) => updateStep('max_iterations', parseInt(e.target.value))}
                        />
                    </div>
                </div>
            )

        // Assert
        case 'assert':
            return (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label>Assertion Type</Label>
                        <select
                            className="w-full text-sm border rounded-md p-2"
                            value={selectedStep.data_type || 'visible'}
                            onChange={(e) => updateStep('data_type', e.target.value)}
                        >
                            <option value="visible">Element is Visible</option>
                            <option value="text">Text Content Equals</option>
                            <option value="contains">Text Contains</option>
                            <option value="url">URL Equals</option>
                            <option value="attribute">Attribute Equals</option>
                        </select>
                    </div>
                    {(selectedStep.data_type === 'text' || selectedStep.data_type === 'contains' || selectedStep.data_type === 'url') && (
                        <div className="space-y-2">
                            <Label>Expected Value</Label>
                            <Input
                                value={selectedStep.value || ''}
                                onChange={(e) => updateStep('value', e.target.value)}
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
                                    onChange={(e) => updateStep('attribute_name', e.target.value)}
                                    placeholder="class, disabled, data-*"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Expected Value</Label>
                                <Input
                                    value={selectedStep.value || ''}
                                    onChange={(e) => updateStep('value', e.target.value)}
                                    placeholder="Expected attribute value"
                                />
                            </div>
                        </>
                    )}
                </div>
            )

        // Assert Title
        case 'assert_title':
            return (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label>Comparison Type</Label>
                        <select
                            className="w-full text-sm border rounded-md p-2"
                            value={selectedStep.comparison || 'equals'}
                            onChange={(e) => updateStep('comparison', e.target.value)}
                        >
                            <option value="equals">Equals</option>
                            <option value="contains">Contains</option>
                            <option value="starts_with">Starts With</option>
                            <option value="ends_with">Ends With</option>
                            <option value="regex">Regex Match</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label>Expected Title</Label>
                        <Input
                            value={selectedStep.expected_title || ''}
                            onChange={(e) => updateStep('expected_title', e.target.value)}
                            placeholder="Enter expected page title"
                        />
                    </div>
                    <div className="text-xs text-gray-500">
                        💡 Tip: Use variables like ${`{variableName}`} in expected title
                    </div>
                </div>
            )

        // Assert URL
        case 'assert_url':
            return (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label>Comparison Type</Label>
                        <select
                            className="w-full text-sm border rounded-md p-2"
                            value={selectedStep.comparison || 'equals'}
                            onChange={(e) => updateStep('comparison', e.target.value)}
                        >
                            <option value="equals">Equals</option>
                            <option value="contains">Contains</option>
                            <option value="starts_with">Starts With</option>
                            <option value="regex">Regex Match</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label>Expected URL</Label>
                        <Input
                            value={selectedStep.expected_url || ''}
                            onChange={(e) => updateStep('expected_url', e.target.value)}
                            placeholder="https://example.com/page"
                        />
                    </div>
                    <div className="text-xs text-gray-500">
                        💡 Tip: Use "contains" to match part of URL (e.g., "/dashboard")
                    </div>
                </div>
            )

        // Set Viewport
        case 'set_viewport':
            return (
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                        <Label>Width</Label>
                        <Input
                            type="number"
                            value={selectedStep.width || 1920}
                            onChange={(e) => updateStep('width', parseInt(e.target.value))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Height</Label>
                        <Input
                            type="number"
                            value={selectedStep.height || 1080}
                            onChange={(e) => updateStep('height', parseInt(e.target.value))}
                        />
                    </div>
                </div>
            )

        // Set Device
        case 'set_device':
            return (
                <div className="space-y-2">
                    <Label>Device</Label>
                    <select
                        className="w-full text-sm border rounded-md p-2"
                        value={selectedStep.device || 'Desktop Chrome'}
                        onChange={(e) => updateStep('device', e.target.value)}
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

        // Set Geolocation
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
                                onChange={(e) => updateStep('latitude', parseFloat(e.target.value))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Longitude</Label>
                            <Input
                                type="number"
                                step="0.0001"
                                value={selectedStep.longitude || 0}
                                onChange={(e) => updateStep('longitude', parseFloat(e.target.value))}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Accuracy (meters)</Label>
                        <Input
                            type="number"
                            value={selectedStep.accuracy || 100}
                            onChange={(e) => updateStep('accuracy', parseInt(e.target.value))}
                        />
                    </div>
                </div>
            )

        // Log
        case 'log':
            return (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label>Message</Label>
                        <Input
                            value={selectedStep.message || ''}
                            onChange={(e) => updateStep('message', e.target.value)}
                            placeholder="Log message..."
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Level</Label>
                        <select
                            className="w-full text-sm border rounded-md p-2"
                            value={selectedStep.level || 'info'}
                            onChange={(e) => updateStep('level', e.target.value as 'info' | 'warn' | 'error' | 'debug')}
                        >
                            <option value="info">Info</option>
                            <option value="warn">Warning</option>
                            <option value="error">Error</option>
                            <option value="debug">Debug</option>
                        </select>
                    </div>
                </div>
            )

        // Switch Tab
        case 'switch_tab':
            return (
                <div className="space-y-2">
                    <Label>Tab Index (0-based)</Label>
                    <Input
                        type="number"
                        value={selectedStep.index || 0}
                        onChange={(e) => updateStep('index', parseInt(e.target.value))}
                        min={0}
                    />
                </div>
            )

        // Switch to Frame
        case 'switch_to_frame':
            return (
                <div className="space-y-2">
                    <Label>Frame Selector</Label>
                    <Input
                        value={selectedStep.selector || ''}
                        onChange={(e) => updateStep('selector', e.target.value)}
                        placeholder="iframe#myFrame or iframe[name='content']"
                        className="font-mono text-xs"
                    />
                </div>
            )

        // API Call
        case 'make_api_call':
            const apiTab = (selectedStep as any)._apiTab || 'params'
            const setApiTab = (tab: string) => updateStep('_apiTab' as keyof TestStep, tab)

            // Helper to manage key-value arrays
            const getArrayField = (field: string): Array<{ key: string; value: string; description?: string; enabled?: boolean }> => {
                return (selectedStep as any)[field] || []
            }

            const updateArrayField = (field: string, index: number, prop: string, value: any) => {
                const arr = [...getArrayField(field)]
                if (arr[index]) {
                    arr[index] = { ...arr[index], [prop]: value }
                }
                updateStep(field as keyof TestStep, arr)
            }

            const addArrayItem = (field: string) => {
                const arr = [...getArrayField(field), { key: '', value: '', description: '', enabled: true }]
                updateStep(field as keyof TestStep, arr)
            }

            const removeArrayItem = (field: string, index: number) => {
                const arr = getArrayField(field).filter((_, i) => i !== index)
                updateStep(field as keyof TestStep, arr)
            }

            const renderKeyValueTable = (field: string) => {
                const items = getArrayField(field)
                return (
                    <div className="space-y-1.5">
                        {items.map((item, idx) => (
                            <div key={idx} className="flex gap-1.5 items-center">
                                <input
                                    type="checkbox"
                                    checked={item.enabled !== false}
                                    onChange={(e) => updateArrayField(field, idx, 'enabled', e.target.checked)}
                                    className="h-3.5 w-3.5 shrink-0"
                                />
                                <Input
                                    className="h-8 text-xs flex-1"
                                    value={item.key || ''}
                                    onChange={(e) => updateArrayField(field, idx, 'key', e.target.value)}
                                    placeholder="Key"
                                />
                                <Input
                                    className="h-8 text-xs flex-1"
                                    value={item.value || ''}
                                    onChange={(e) => updateArrayField(field, idx, 'value', e.target.value)}
                                    placeholder="Value"
                                />
                                <button
                                    onClick={() => removeArrayItem(field, idx)}
                                    className="text-gray-400 hover:text-red-500 text-lg px-1"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addArrayItem(field)}
                            className="text-xs h-7 w-full mt-1"
                        >
                            + Add Parameter
                        </Button>
                    </div>
                )
            }

            return (
                <div className="space-y-4">
                    {/* URL and Method */}
                    <div className="space-y-2">
                        <Label>Request</Label>
                        <div className="flex gap-2">
                            <Select value={selectedStep.method || 'GET'} onValueChange={(value) => updateStep('method', value)}>
                                <SelectTrigger className="w-24 font-medium">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="GET">GET</SelectItem>
                                    <SelectItem value="POST">POST</SelectItem>
                                    <SelectItem value="PUT">PUT</SelectItem>
                                    <SelectItem value="PATCH">PATCH</SelectItem>
                                    <SelectItem value="DELETE">DELETE</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input
                                className="flex-1"
                                value={selectedStep.url || ''}
                                onChange={(e) => updateStep('url', e.target.value)}
                                placeholder="https://api.example.com/endpoint"
                            />
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border rounded-lg overflow-hidden">
                        <div className="flex bg-gray-50 border-b">
                            {[
                                { id: 'params', label: 'Params' },
                                { id: 'auth', label: 'Auth' },
                                { id: 'headers', label: 'Headers' },
                                { id: 'body', label: 'Body' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setApiTab(tab.id)}
                                    className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${apiTab === tab.id
                                        ? 'bg-white text-blue-600 border-b-2 border-blue-500'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                        }`}
                                >
                                    {tab.label}
                                    {tab.id === 'params' && getArrayField('query_params').length > 0 && (
                                        <span className="ml-1 text-gray-400">({getArrayField('query_params').length})</span>
                                    )}
                                    {tab.id === 'headers' && getArrayField('headers').length > 0 && (
                                        <span className="ml-1 text-gray-400">({getArrayField('headers').length})</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="p-3 min-h-[140px]">
                            {/* Params Tab */}
                            {apiTab === 'params' && renderKeyValueTable('query_params')}

                            {/* Authorization Tab */}
                            {apiTab === 'auth' && (
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Type</Label>
                                        <Select value={selectedStep.auth_type || 'none'} onValueChange={(value) => updateStep('auth_type', value)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">No Auth</SelectItem>
                                                <SelectItem value="basic">Basic Auth</SelectItem>
                                                <SelectItem value="bearer">Bearer Token</SelectItem>
                                                <SelectItem value="api-key">API Key</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {selectedStep.auth_type === 'basic' && (
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <Label className="text-xs">Username</Label>
                                                <Input
                                                    value={selectedStep.auth_basic_username || ''}
                                                    onChange={(e) => updateStep('auth_basic_username', e.target.value)}
                                                    placeholder="username"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Password</Label>
                                                <Input
                                                    type="password"
                                                    value={selectedStep.auth_basic_password || ''}
                                                    onChange={(e) => updateStep('auth_basic_password', e.target.value)}
                                                    placeholder="password"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {selectedStep.auth_type === 'bearer' && (
                                        <div className="space-y-1">
                                            <Label className="text-xs">Token</Label>
                                            <Input
                                                value={selectedStep.auth_bearer_token || ''}
                                                onChange={(e) => updateStep('auth_bearer_token', e.target.value)}
                                                placeholder="${token} or paste token"
                                            />
                                        </div>
                                    )}

                                    {selectedStep.auth_type === 'api-key' && (
                                        <div className="space-y-2">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Key Name</Label>
                                                    <Input
                                                        value={selectedStep.auth_api_key_key || ''}
                                                        onChange={(e) => updateStep('auth_api_key_key', e.target.value)}
                                                        placeholder="X-API-Key"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Value</Label>
                                                    <Input
                                                        value={selectedStep.auth_api_key_value || ''}
                                                        onChange={(e) => updateStep('auth_api_key_value', e.target.value)}
                                                        placeholder="${apiKey}"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Add to</Label>
                                                <Select value={selectedStep.auth_api_key_add_to || 'header'} onValueChange={(value) => updateStep('auth_api_key_add_to', value)}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="header">Header</SelectItem>
                                                        <SelectItem value="query">Query Params</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Headers Tab */}
                            {apiTab === 'headers' && renderKeyValueTable('headers')}

                            {/* Body Tab */}
                            {apiTab === 'body' && (
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Content Type</Label>
                                        <Select value={selectedStep.body_type || 'none'} onValueChange={(value) => updateStep('body_type', value)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                <SelectItem value="raw">Raw (JSON/Text/XML)</SelectItem>
                                                <SelectItem value="form-data">Form Data</SelectItem>
                                                <SelectItem value="x-www-form-urlencoded">URL Encoded</SelectItem>
                                                <SelectItem value="binary">Binary</SelectItem>
                                                <SelectItem value="graphql">GraphQL</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {selectedStep.body_type === 'form-data' && renderKeyValueTable('body_form_data')}

                                    {selectedStep.body_type === 'x-www-form-urlencoded' && renderKeyValueTable('body_urlencoded')}

                                    {selectedStep.body_type === 'raw' && (
                                        <div className="space-y-2">
                                            <Select value={selectedStep.body_raw_type || 'json'} onValueChange={(value) => updateStep('body_raw_type', value)}>
                                                <SelectTrigger className="w-28">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="json">JSON</SelectItem>
                                                    <SelectItem value="text">Text</SelectItem>
                                                    <SelectItem value="xml">XML</SelectItem>
                                                    <SelectItem value="html">HTML</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <textarea
                                                value={selectedStep.body || ''}
                                                onChange={(e) => updateStep('body', e.target.value)}
                                                placeholder={'{\n  "key": "value"\n}'}
                                                className="w-full h-28 text-xs font-mono border rounded-md p-2"
                                            />
                                        </div>
                                    )}

                                    {selectedStep.body_type === 'binary' && (
                                        <div className="space-y-1">
                                            <Label className="text-xs">File Path</Label>
                                            <Input
                                                value={selectedStep.body_binary_path || ''}
                                                onChange={(e) => updateStep('body_binary_path', e.target.value)}
                                                placeholder="/path/to/file"
                                            />
                                        </div>
                                    )}

                                    {selectedStep.body_type === 'graphql' && (
                                        <div className="space-y-2">
                                            <div className="space-y-1">
                                                <Label className="text-xs">Query</Label>
                                                <textarea
                                                    value={selectedStep.body_graphql_query || ''}
                                                    onChange={(e) => updateStep('body_graphql_query', e.target.value)}
                                                    placeholder={'query {\n  users { id name }\n}'}
                                                    className="w-full h-20 text-xs font-mono border rounded-md p-2"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Variables</Label>
                                                <textarea
                                                    value={selectedStep.body_graphql_variables || ''}
                                                    onChange={(e) => updateStep('body_graphql_variables', e.target.value)}
                                                    placeholder={'{ "id": "123" }'}
                                                    className="w-full h-12 text-xs font-mono border rounded-md p-2"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Response Settings */}
                    <div className="space-y-3">
                        <Label className="text-xs font-medium text-gray-500">Response Settings</Label>
                        <div className="space-y-1">
                            <Label className="text-xs">Timeout (ms)</Label>
                            <Input
                                type="number"
                                value={selectedStep.timeout || 30000}
                                onChange={(e) => updateStep('timeout', parseInt(e.target.value))}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Store Response In</Label>
                            <Input
                                value={selectedStep.variable_name || ''}
                                onChange={(e) => updateStep('variable_name', e.target.value)}
                                placeholder="apiResponse"
                            />
                            <div className="mt-3 rounded-lg border border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 p-3 space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-base">💡</span>
                                    <span className="font-semibold text-indigo-700 text-sm">Quick Guide</span>
                                </div>

                                <div className="space-y-2">
                                    <div className="bg-white/70 rounded-md p-2 border border-indigo-100">
                                        <p className="text-xs font-medium text-indigo-600 mb-1">📥 Store Response</p>
                                        <p className="text-xs text-gray-600">Enter a variable name above (e.g., <code className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono text-[11px]">apiResponse</code>)</p>
                                    </div>

                                    <div className="bg-white/70 rounded-md p-2 border border-indigo-100">
                                        <p className="text-xs font-medium text-indigo-600 mb-1.5">📤 Access Response Data</p>
                                        <div className="space-y-1 text-xs">
                                            <div className="flex items-center gap-2">
                                                <code className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono text-[11px]">${'{apiResponse.body}'}</code>
                                                <span className="text-gray-500">→ JSON response data</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <code className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono text-[11px]">${'{apiResponse.status}'}</code>
                                                <span className="text-gray-500">→ HTTP status (200, 404...)</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <code className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono text-[11px]">${'{apiResponse.headers}'}</code>
                                                <span className="text-gray-500">→ Response headers</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white/70 rounded-md p-2 border border-indigo-100">
                                        <p className="text-xs font-medium text-indigo-600 mb-1.5">✨ Example Usage</p>
                                        <div className="space-y-1 text-xs text-gray-600">
                                            <p>• <strong className="text-gray-700">Assert:</strong> Check if <code className="bg-indigo-100 text-indigo-700 px-1 rounded font-mono text-[11px]">${'{apiResponse.status}'}</code> equals <code className="bg-green-100 text-green-700 px-1 rounded font-mono text-[11px]">200</code></p>
                                            <p>• <strong className="text-gray-700">Set Variable:</strong> Extract <code className="bg-indigo-100 text-indigo-700 px-1 rounded font-mono text-[11px]">${'{apiResponse.body.userId}'}</code></p>
                                            <p>• <strong className="text-gray-700">Type:</strong> Use <code className="bg-indigo-100 text-indigo-700 px-1 rounded font-mono text-[11px]">${'{apiResponse.body.name}'}</code> in form</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )

        // Copy to Clipboard
        case 'copy_to_clipboard':
            return (
                <div className="space-y-2">
                    <Label>Text to Copy</Label>
                    <Input
                        value={selectedStep.text || ''}
                        onChange={(e) => updateStep('text', e.target.value)}
                        placeholder="${myVar} or static text"
                    />
                </div>
            )

        // Random Data
        case 'random-data':
        case 'random_data':
            return (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label>Variable Name *</Label>
                        <Input
                            value={selectedStep.variable_name || ''}
                            onChange={(e) => updateStep('variable_name', e.target.value)}
                            placeholder="randomEmail"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Data Type</Label>
                        <select
                            className="w-full text-sm border rounded-md p-2"
                            value={selectedStep.data_type || 'string'}
                            onChange={(e) => updateStep('data_type', e.target.value)}
                        >
                            <optgroup label="Text">
                                <option value="string">Random String</option>
                                <option value="alphanumeric">Alphanumeric</option>
                                <option value="sentence">Sentence</option>
                            </optgroup>
                            <optgroup label="Numbers">
                                <option value="number">Integer</option>
                                <option value="float">Float</option>
                            </optgroup>
                            <optgroup label="Personal">
                                <option value="email">Email</option>
                                <option value="name">Full Name</option>
                                <option value="phone">Phone Number</option>
                                <option value="password">Password</option>
                            </optgroup>
                            <optgroup label="System">
                                <option value="uuid">UUID</option>
                                <option value="date">Date</option>
                            </optgroup>
                        </select>
                    </div>
                    {(selectedStep.data_type === 'string' || selectedStep.data_type === 'alphanumeric' || selectedStep.data_type === 'password') && (
                        <div className="space-y-2">
                            <Label>Length</Label>
                            <Input
                                type="number"
                                value={selectedStep.length || 10}
                                onChange={(e) => updateStep('length', parseInt(e.target.value))}
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
                                    onChange={(e) => updateStep('min', parseInt(e.target.value))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Max</Label>
                                <Input
                                    type="number"
                                    value={selectedStep.max || 1000}
                                    onChange={(e) => updateStep('max', parseInt(e.target.value))}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )

        // Storage: Get Cookie
        case 'get_cookie':
            return (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label>Cookie Name</Label>
                        <Input
                            value={selectedStep.name || ''}
                            onChange={(e) => updateStep('name', e.target.value)}
                            placeholder="session_id"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Store Value In Variable</Label>
                        <Input
                            value={selectedStep.variable_name || ''}
                            onChange={(e) => updateStep('variable_name', e.target.value)}
                            placeholder="cookieValue"
                        />
                    </div>
                </div>
            )

        // Storage: Set Cookie
        case 'set_cookie':
            return (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label>Cookie Name</Label>
                        <Input
                            value={selectedStep.name || ''}
                            onChange={(e) => updateStep('name', e.target.value)}
                            placeholder="session_id"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Cookie Value</Label>
                        <Input
                            value={selectedStep.value || ''}
                            onChange={(e) => updateStep('value', e.target.value)}
                            placeholder="abc123"
                        />
                    </div>
                </div>
            )

        // Storage: Delete Cookie
        case 'delete_cookie':
            return (
                <div className="space-y-2">
                    <Label>Cookie Name</Label>
                    <Input
                        value={selectedStep.name || ''}
                        onChange={(e) => updateStep('name', e.target.value)}
                        placeholder="session_id"
                    />
                </div>
            )

        // Storage: Get Local Storage
        case 'get_local_storage':
            return (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label>Key Name</Label>
                        <Input
                            value={selectedStep.key || ''}
                            onChange={(e) => updateStep('key', e.target.value)}
                            placeholder="user_token"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Store Value In Variable</Label>
                        <Input
                            value={selectedStep.variable_name || ''}
                            onChange={(e) => updateStep('variable_name', e.target.value)}
                            placeholder="tokenValue"
                        />
                    </div>
                </div>
            )

        // Storage: Set Local Storage
        case 'set_local_storage':
            return (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label>Key Name</Label>
                        <Input
                            value={selectedStep.key || ''}
                            onChange={(e) => updateStep('key', e.target.value)}
                            placeholder="user_token"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Value</Label>
                        <Input
                            value={selectedStep.value || ''}
                            onChange={(e) => updateStep('value', e.target.value)}
                            placeholder="xyz789 or ${variableName}"
                        />
                    </div>
                </div>
            )

        // Storage: Get Session Storage
        case 'get_session_storage':
            return (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label>Key Name</Label>
                        <Input
                            value={selectedStep.key || ''}
                            onChange={(e) => updateStep('key', e.target.value)}
                            placeholder="temp_data"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Store Value In Variable</Label>
                        <Input
                            value={selectedStep.variable_name || ''}
                            onChange={(e) => updateStep('variable_name', e.target.value)}
                            placeholder="sessionData"
                        />
                    </div>
                </div>
            )

        // Storage: Set Session Storage
        case 'set_session_storage':
            return (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label>Key Name</Label>
                        <Input
                            value={selectedStep.key || ''}
                            onChange={(e) => updateStep('key', e.target.value)}
                            placeholder="temp_data"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Value</Label>
                        <Input
                            value={selectedStep.value || ''}
                            onChange={(e) => updateStep('value', e.target.value)}
                            placeholder="temporary value"
                        />
                    </div>
                </div>
            )

        // Data Files: Read CSV
        case 'read_csv':
            return (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label>File Path</Label>
                        <Input
                            value={selectedStep.file_path || ''}
                            onChange={(e) => updateStep('file_path', e.target.value)}
                            placeholder="/path/to/data.csv"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Store In Variable</Label>
                        <Input
                            value={selectedStep.variable_name || ''}
                            onChange={(e) => updateStep('variable_name', e.target.value)}
                            placeholder="csvData"
                        />
                    </div>
                    <div className="text-xs text-gray-500">
                        💡 Data will be accessible as array: ${'{csvData}'}
                    </div>
                </div>
            )

        // Data Files: Read JSON
        case 'read_json':
            return (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label>File Path</Label>
                        <Input
                            value={selectedStep.file_path || ''}
                            onChange={(e) => updateStep('file_path', e.target.value)}
                            placeholder="/path/to/data.json"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Store In Variable</Label>
                        <Input
                            value={selectedStep.variable_name || ''}
                            onChange={(e) => updateStep('variable_name', e.target.value)}
                            placeholder="jsonData"
                        />
                    </div>
                    <div className="text-xs text-gray-500">
                        💡 Access nested data: ${'{jsonData.users[0].name}'}
                    </div>
                </div>
            )

        // Control Flow: If Condition
        case 'if_condition':
            return (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label>Condition (JavaScript)</Label>
                        <Input
                            value={selectedStep.condition || ''}
                            onChange={(e) => updateStep('condition', e.target.value)}
                            placeholder="document.querySelector('.error').textContent.length > 0"
                            className="font-mono text-xs"
                        />
                    </div>
                    <div className="text-xs text-gray-500">
                        💡 Nested steps will execute if condition is true
                    </div>
                </div>
            )

        // Control Flow: Iterate Dataset
        case 'iterate_dataset':
            return (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label>Dataset Name</Label>
                        <Input
                            value={selectedStep.dataset_name || ''}
                            onChange={(e) => updateStep('dataset_name', e.target.value)}
                            placeholder="csvData (from read_csv/read_json)"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Loop Variable Name</Label>
                        <Input
                            value={selectedStep.loop_variable || 'row'}
                            onChange={(e) => updateStep('loop_variable', e.target.value)}
                            placeholder="row"
                        />
                    </div>
                    <div className="text-xs text-gray-500">
                        💡 Access row data: ${'{row_name}'}, ${'{row_email}'}
                    </div>
                </div>
            )

        // Control Flow: Try-Catch
        case 'try-catch':
        case 'try_catch':
            return (
                <div className="space-y-3">
                    <div className="text-sm text-gray-600">
                        Try-catch blocks allow graceful error handling. Add nested steps for try, catch, and finally blocks.
                    </div>
                    <div className="text-xs text-gray-500">
                        💡 Error message available in catch block: ${'{error_message}'}
                    </div>
                </div>
            )

        // Assertions: Assert Element Count
        case 'assert_element_count':
            return (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label>Comparison Type</Label>
                        <select
                            className="w-full text-sm border rounded-md p-2"
                            value={selectedStep.comparison || 'equals'}
                            onChange={(e) => updateStep('comparison', e.target.value)}
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
                            onChange={(e) => updateStep('expected_count', parseInt(e.target.value))}
                            min={0}
                        />
                    </div>
                </div>
            )

        // Assertions: Get Element Count
        case 'get_element_count':
            return (
                <div className="space-y-2">
                    <Label>Store Count In Variable</Label>
                    <Input
                        value={selectedStep.variable_name || ''}
                        onChange={(e) => updateStep('variable_name', e.target.value)}
                        placeholder="elementCount"
                    />
                </div>
            )

        // Data: Set Variable Ternary
        case 'set_variable_ternary':
            return (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label>Variable Name</Label>
                        <Input
                            value={selectedStep.variable_name || ''}
                            onChange={(e) => updateStep('variable_name', e.target.value)}
                            placeholder="result"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Condition (JavaScript)</Label>
                        <Input
                            value={selectedStep.condition || ''}
                            onChange={(e) => updateStep('condition', e.target.value)}
                            placeholder="document.querySelector('.success') !== null"
                            className="font-mono text-xs"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Value if True</Label>
                        <Input
                            value={selectedStep.true_value || ''}
                            onChange={(e) => updateStep('true_value', e.target.value)}
                            placeholder="Success"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Value if False</Label>
                        <Input
                            value={selectedStep.false_value || ''}
                            onChange={(e) => updateStep('false_value', e.target.value)}
                            placeholder="Failed"
                        />
                    </div>
                </div>
            )

        // Performance: Measure Load Time
        case 'measure_load_time':
            return (
                <div className="space-y-2">
                    <Label>Store Load Time In Variable</Label>
                    <Input
                        value={selectedStep.variable_name || 'load_time'}
                        onChange={(e) => updateStep('variable_name', e.target.value)}
                        placeholder="load_time"
                    />
                    <div className="text-xs text-gray-500">
                        💡 Also stores: ${'{load_time_ttfb}'}, ${'{load_time_details}'}
                    </div>
                </div>
            )

        // Performance: Get Performance Metrics
        case 'get_performance_metrics':
            return (
                <div className="space-y-2">
                    <Label>Store Metrics In Variable</Label>
                    <Input
                        value={selectedStep.variable_name || 'perf'}
                        onChange={(e) => updateStep('variable_name', e.target.value)}
                        placeholder="perf"
                    />
                    <div className="text-xs text-gray-500">
                        💡 Captures Core Web Vitals (FCP, LCP, etc.)
                    </div>
                </div>
            )

        // Network: Wait for Response
        case 'wait_for_response':
            return (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label>URL Pattern</Label>
                        <Input
                            value={selectedStep.url || ''}
                            onChange={(e) => updateStep('url', e.target.value)}
                            placeholder="/api/users"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Store Response In Variable (optional)</Label>
                        <Input
                            value={selectedStep.variable_name || ''}
                            onChange={(e) => updateStep('variable_name', e.target.value)}
                            placeholder="apiResponse"
                        />
                    </div>
                </div>
            )

        // Network: Wait for Request
        case 'wait_for_request':
            return (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label>URL Pattern</Label>
                        <Input
                            value={selectedStep.url || ''}
                            onChange={(e) => updateStep('url', e.target.value)}
                            placeholder="/api/save"
                        />
                    </div>
                </div>
            )

        // Downloads: Wait for Download
        case 'wait_for_download':
            return (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label>Download Path</Label>
                        <Input
                            value={selectedStep.download_path || './downloads'}
                            onChange={(e) => updateStep('download_path', e.target.value)}
                            placeholder="./downloads"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Store File Path In Variable</Label>
                        <Input
                            value={selectedStep.variable_name || ''}
                            onChange={(e) => updateStep('variable_name', e.target.value)}
                            placeholder="downloadedFile"
                        />
                    </div>
                </div>
            )

        // Downloads: Verify Download
        case 'verify_download':
            return (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label>File Path</Label>
                        <Input
                            value={selectedStep.file_path || ''}
                            onChange={(e) => updateStep('file_path', e.target.value)}
                            placeholder="./downloads/report.pdf"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Minimum File Size (bytes)</Label>
                        <Input
                            type="number"
                            value={selectedStep.min_size || 0}
                            onChange={(e) => updateStep('min_size', parseInt(e.target.value))}
                            min={0}
                        />
                    </div>
                </div>
            )

        // Actions that don't need additional configuration
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
            return null

        // Snippet: Call Snippet
        case 'call_snippet':
            return (
                <CallSnippetFields selectedStep={selectedStep} updateStep={updateStep} />
            )

        default:
            return null
    }
}

/**
 * Fields for configuring a call_snippet step
 * Allows selecting a snippet and configuring its parameters
 */
interface CallSnippetFieldsProps {
    selectedStep: TestStep
    updateStep: (field: keyof TestStep, value: any) => void
}

function CallSnippetFields({ selectedStep, updateStep }: CallSnippetFieldsProps) {
    const [snippets, setSnippets] = useState<Snippet[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null)
    const [paramValues, setParamValues] = useState<Record<string, string>>(
        (selectedStep.parameters as Record<string, string>) || {}
    )
    // Inline editing state
    const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null)
    const [editedSteps, setEditedSteps] = useState<any[]>([])
    const [isSavingSnippet, setIsSavingSnippet] = useState(false)
    // Track if snippet was deleted
    const [snippetNotFound, setSnippetNotFound] = useState(false)

    // Load snippets on mount - we need projectId from context/props
    // For now we'll try to get it from URL or show message
    useEffect(() => {
        const loadSnippets = async () => {
            try {
                setLoading(true)
                // Try to get projectId from URL
                const pathParts = window.location.pathname.split('/')
                const projectIdx = pathParts.indexOf('projects')
                const projectId = projectIdx >= 0 ? pathParts[projectIdx + 1] : null

                console.log('[CallSnippetFields] Loading snippets for projectId:', projectId)
                console.log('[CallSnippetFields] Full URL path:', window.location.pathname)

                if (projectId) {
                    try {
                        const data = await snippetApi.listSnippets(projectId, { includeGlobal: true })
                        console.log('[CallSnippetFields] Raw API response:', data)
                        const snippetList = Array.isArray(data) ? data : []
                        console.log('[CallSnippetFields] Loaded snippets count:', snippetList.length)
                        setSnippets(snippetList)

                        // If step already has snippet_id, load it
                        if (selectedStep.snippet_id && snippetList.length > 0) {
                            const found = snippetList.find(s => s.id === selectedStep.snippet_id)
                            if (found) setSelectedSnippet(found)
                        }
                    } catch (apiError) {
                        console.error('[CallSnippetFields] API call failed:', apiError)
                        setSnippets([])
                    }
                } else {
                    console.warn('[CallSnippetFields] No projectId found in URL:', window.location.pathname)
                    setSnippets([])
                }
            } catch (error) {
                console.error('[CallSnippetFields] Failed to load snippets:', error)
                setSnippets([])
            } finally {
                setLoading(false)
            }
        }
        loadSnippets()
    }, [])

    // When snippet_id changes, update selected snippet
    useEffect(() => {
        if (selectedStep.snippet_id && snippets.length > 0) {
            const found = snippets.find(s => s.id === selectedStep.snippet_id)
            if (found) {
                setSelectedSnippet(found)
                setSnippetNotFound(false)
                // Initialize params from snippet defaults
                const defaults: Record<string, string> = {}
                found.parameters?.forEach(p => {
                    if (p.default && !paramValues[p.name]) {
                        defaults[p.name] = p.default
                    }
                })
                if (Object.keys(defaults).length > 0) {
                    setParamValues(prev => ({ ...defaults, ...prev }))
                }
            } else {
                // Snippet was deleted - not found in the list
                setSnippetNotFound(true)
                setSelectedSnippet(null)
            }
        } else if (!selectedStep.snippet_id) {
            // No snippet selected
            setSnippetNotFound(false)
            setSelectedSnippet(null)
        }
    }, [selectedStep.snippet_id, snippets])

    const handleSnippetChange = (snippetId: string) => {
        updateStep('snippet_id', snippetId || undefined)
        const found = snippets.find(s => s.id === snippetId)
        if (found) {
            setSelectedSnippet(found)
            setSnippetNotFound(false)
            // Save snippet name and steps for display in Test Explorer
            updateStep('snippet_name', found.name)
            updateStep('snippet_steps', found.steps || [])
            // Reset params to snippet defaults
            const defaults: Record<string, string> = {}
            found.parameters?.forEach(p => {
                defaults[p.name] = p.default || ''
            })
            setParamValues(defaults)
            updateStep('parameters', defaults)
        } else {
            // Clear snippet data when deselecting
            setSelectedSnippet(null)
            setSnippetNotFound(false)
            updateStep('snippet_name', undefined)
            updateStep('snippet_steps', undefined)
            updateStep('parameters', {})
            setParamValues({})
        }
    }

    const handleParamChange = (paramName: string, value: string) => {
        const updated = { ...paramValues, [paramName]: value }
        setParamValues(updated)
        updateStep('parameters', updated)
    }

    // Sync editedSteps when snippet changes
    useEffect(() => {
        if (selectedSnippet?.steps) {
            setEditedSteps([...selectedSnippet.steps])
        }
    }, [selectedSnippet])

    // Update a specific step field
    const handleStepFieldChange = (stepIndex: number, field: string, value: any) => {
        setEditedSteps(prev => {
            const updated = [...prev]
            updated[stepIndex] = { ...updated[stepIndex], [field]: value }
            return updated
        })
    }

    // Save edited steps to the snippet
    const handleSaveSnippetSteps = async () => {
        if (!selectedSnippet) return

        setIsSavingSnippet(true)
        try {
            // Get projectId from URL
            const pathParts = window.location.pathname.split('/')
            const projectsIndex = pathParts.indexOf('projects')
            const projectId = projectsIndex !== -1 ? pathParts[projectsIndex + 1] : null

            if (!projectId) {
                toast.error('Could not determine project ID')
                return
            }

            await snippetApi.updateSnippet(selectedSnippet.id, {
                steps: editedSteps
            })

            // Update local state
            setSelectedSnippet({ ...selectedSnippet, steps: editedSteps })
            // Update the step's snippet_steps for display
            updateStep('snippet_steps', editedSteps)

            toast.success('Snippet steps updated!')
            setEditingStepIndex(null)
        } catch (error) {
            console.error('Failed to save snippet steps:', error)
            toast.error('Failed to save snippet steps')
        } finally {
            setIsSavingSnippet(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading snippets...
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Snippet Selector */}
            <div className="space-y-2">
                <Label className="flex items-center gap-2">
                    <FunctionSquare className="w-4 h-4 text-violet-500" />
                    Select Snippet *
                </Label>
                {snippets.length === 0 ? (
                    <p className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
                        No snippets available. Create a snippet first in the Snippet Manager.
                    </p>
                ) : (
                    <select
                        value={selectedStep.snippet_id || ''}
                        onChange={(e) => handleSnippetChange(e.target.value)}
                        className="w-full text-sm border rounded-md p-2"
                    >
                        <option value="">Select a snippet...</option>
                        {snippets.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name} {s.is_global ? '(Global)' : ''}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {/* Error message when snippet was deleted */}
            {snippetNotFound && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm text-red-700 font-medium">Snippet was deleted</p>
                            <p className="text-xs text-red-500 mt-1">
                                The previously selected snippet no longer exists. Please select a different snippet from the dropdown above.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Selected Snippet Info */}
            {selectedSnippet && (
                <div className="bg-violet-50 border border-violet-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                        <FunctionSquare className="w-4 h-4 text-violet-600" />
                        <span className="font-medium text-violet-900">{selectedSnippet.name}</span>
                    </div>
                    {selectedSnippet.description && (
                        <p className="text-xs text-violet-700 mb-2">{selectedSnippet.description}</p>
                    )}
                    <div className="flex gap-2 text-xs text-violet-600">
                        <span>{selectedSnippet.steps?.length || 0} steps</span>
                        <span>•</span>
                        <span>{selectedSnippet.parameters?.length || 0} params</span>
                    </div>
                </div>
            )}

            {/* Parameter Inputs */}
            {selectedSnippet && selectedSnippet.parameters && selectedSnippet.parameters.length > 0 && (
                <div className="space-y-3">
                    <Label className="text-xs font-semibold text-gray-700">Parameters</Label>
                    {selectedSnippet.parameters.map((param) => (
                        <div key={param.name} className="space-y-1">
                            <div className="flex items-center gap-2">
                                <code className="text-xs text-violet-600 font-mono bg-violet-50 px-1.5 py-0.5 rounded">
                                    {'{{'}{param.name}{'}}'}
                                </code>
                                <Badge variant="secondary" className="text-xs">
                                    {param.type}
                                </Badge>
                                {param.description && (
                                    <span className="text-xs text-gray-400">{param.description}</span>
                                )}
                            </div>
                            <Input
                                value={paramValues[param.name] || ''}
                                onChange={(e) => handleParamChange(param.name, e.target.value)}
                                placeholder={param.default || `Enter ${param.name}`}
                                className="text-sm"
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Steps - Editable */}
            {selectedSnippet && editedSteps.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold text-gray-700">
                            Steps ({editedSteps.length})
                        </Label>
                        {editingStepIndex !== null && (
                            <div className="flex gap-1">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 text-xs"
                                    onClick={() => {
                                        setEditedSteps([...selectedSnippet.steps || []])
                                        setEditingStepIndex(null)
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    className="h-6 text-xs bg-violet-600 hover:bg-violet-700"
                                    onClick={handleSaveSnippetSteps}
                                    disabled={isSavingSnippet}
                                >
                                    {isSavingSnippet ? 'Saving...' : 'Save'}
                                </Button>
                            </div>
                        )}
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 space-y-1.5 max-h-80 overflow-y-auto">
                        {editedSteps.map((step, idx) => (
                            <div key={idx}>
                                {/* Step header - clickable */}
                                <div
                                    onClick={() => setEditingStepIndex(editingStepIndex === idx ? null : idx)}
                                    className={`text-xs flex items-center gap-2 bg-white p-2 rounded border cursor-pointer transition-all ${editingStepIndex === idx
                                        ? 'border-violet-400 ring-1 ring-violet-200'
                                        : 'border-gray-100 hover:border-violet-200'
                                        }`}
                                >
                                    <span className="text-gray-400 w-4 text-right">{idx + 1}.</span>
                                    <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                        {step.action || step.type}
                                    </Badge>
                                    {step.selector && (
                                        <code className="text-gray-500 truncate max-w-[100px]">{step.selector}</code>
                                    )}
                                    {step.url && (
                                        <code className="text-blue-500 truncate max-w-[100px]">{step.url}</code>
                                    )}
                                    {step.amount && (
                                        <span className="text-gray-500">{step.amount}ms</span>
                                    )}
                                    <span className="ml-auto text-gray-400 text-[10px]">
                                        {editingStepIndex === idx ? '▼' : '✎'}
                                    </span>
                                </div>

                                {/* Inline edit form */}
                                {editingStepIndex === idx && (
                                    <div className="mt-1 p-2 bg-white border border-violet-200 rounded space-y-2">
                                        {/* URL field for navigate/wait_url */}
                                        {(step.action === 'navigate' || step.action === 'wait_url' || step.action === 'new_tab') && (
                                            <div>
                                                <Label className="text-[10px] text-gray-500">URL</Label>
                                                <Input
                                                    value={step.url || ''}
                                                    onChange={(e) => handleStepFieldChange(idx, 'url', e.target.value)}
                                                    placeholder="https://..."
                                                    className="h-7 text-xs"
                                                />
                                            </div>
                                        )}

                                        {/* Selector field */}
                                        {(step.action === 'click' || step.action === 'type' || step.action === 'fill' ||
                                            step.action === 'hover' || step.action === 'focus' || step.action === 'double_click') && (
                                                <div>
                                                    <Label className="text-[10px] text-gray-500">Selector</Label>
                                                    <Input
                                                        value={step.selector || ''}
                                                        onChange={(e) => handleStepFieldChange(idx, 'selector', e.target.value)}
                                                        placeholder="#id or .class"
                                                        className="h-7 text-xs font-mono"
                                                    />
                                                </div>
                                            )}

                                        {/* Value field for type/fill */}
                                        {(step.action === 'type' || step.action === 'fill') && (
                                            <div>
                                                <Label className="text-[10px] text-gray-500">Value</Label>
                                                <Input
                                                    value={step.value || ''}
                                                    onChange={(e) => handleStepFieldChange(idx, 'value', e.target.value)}
                                                    placeholder="Text to type"
                                                    className="h-7 text-xs"
                                                />
                                            </div>
                                        )}

                                        {/* Amount field for wait */}
                                        {step.action === 'wait' && (
                                            <div>
                                                <Label className="text-[10px] text-gray-500">Duration (ms)</Label>
                                                <Input
                                                    type="number"
                                                    value={step.amount || step.timeout || 1000}
                                                    onChange={(e) => handleStepFieldChange(idx, 'amount', parseInt(e.target.value))}
                                                    className="h-7 text-xs"
                                                />
                                            </div>
                                        )}

                                        {/* Assert URL fields */}
                                        {step.action === 'assert_url' && (
                                            <>
                                                <div>
                                                    <Label className="text-[10px] text-gray-500">Comparison</Label>
                                                    <select
                                                        value={step.comparison || 'contains'}
                                                        onChange={(e) => handleStepFieldChange(idx, 'comparison', e.target.value)}
                                                        className="w-full h-7 text-xs border rounded px-2"
                                                    >
                                                        <option value="equals">Equals</option>
                                                        <option value="contains">Contains</option>
                                                        <option value="starts_with">Starts With</option>
                                                        <option value="ends_with">Ends With</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <Label className="text-[10px] text-gray-500">Expected URL</Label>
                                                    <Input
                                                        value={step.expected_url || ''}
                                                        onChange={(e) => handleStepFieldChange(idx, 'expected_url', e.target.value)}
                                                        placeholder="Expected URL or part"
                                                        className="h-7 text-xs"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {/* Assert Title fields */}
                                        {step.action === 'assert_title' && (
                                            <>
                                                <div>
                                                    <Label className="text-[10px] text-gray-500">Comparison</Label>
                                                    <select
                                                        value={step.comparison || 'contains'}
                                                        onChange={(e) => handleStepFieldChange(idx, 'comparison', e.target.value)}
                                                        className="w-full h-7 text-xs border rounded px-2"
                                                    >
                                                        <option value="equals">Equals</option>
                                                        <option value="contains">Contains</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <Label className="text-[10px] text-gray-500">Expected Title</Label>
                                                    <Input
                                                        value={step.expected_title || ''}
                                                        onChange={(e) => handleStepFieldChange(idx, 'expected_title', e.target.value)}
                                                        placeholder="Expected page title"
                                                        className="h-7 text-xs"
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <p className="text-[10px] text-gray-400 italic">Click a step to edit</p>
                </div>
            )}
        </div>
    )
}
