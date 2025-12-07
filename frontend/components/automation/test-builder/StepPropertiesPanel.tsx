'use client'

import React from 'react'
import { Settings, Target, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { TestStep } from './types'
import { getActionConfig, browserActions } from './action-configs'

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
            {selectedStep.action !== 'navigate' && selectedStep.action !== 'wait' && (
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

            {/* Timeout */}
            <div>
                <label className="text-xs font-medium text-gray-700 mb-1.5 block">Timeout (ms)</label>
                <Input
                    type="number"
                    value={selectedStep.timeout || 5000}
                    onChange={(e) => updateStep('timeout', parseInt(e.target.value))}
                    className="text-sm"
                />
            </div>

            {/* Advanced Options */}
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
        case 'set-variable':
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
            return (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label>URL</Label>
                        <Input
                            value={selectedStep.url || ''}
                            onChange={(e) => updateStep('url', e.target.value)}
                            placeholder="https://api.example.com/endpoint"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Method</Label>
                        <select
                            className="w-full text-sm border rounded-md p-2"
                            value={selectedStep.method || 'GET'}
                            onChange={(e) => updateStep('method', e.target.value as 'GET' | 'POST' | 'PUT' | 'DELETE')}
                        >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="DELETE">DELETE</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label>Store Response In</Label>
                        <Input
                            value={selectedStep.variable_name || ''}
                            onChange={(e) => updateStep('variable_name', e.target.value)}
                            placeholder="apiResponse"
                        />
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

        default:
            return null
    }
}
