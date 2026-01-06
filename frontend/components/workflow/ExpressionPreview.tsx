'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Eye, Code, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExpressionPreviewProps {
    expression: string
    sampleData?: Record<string, any>
    className?: string
    showToggle?: boolean
}

// Sample data structure for preview
const DEFAULT_SAMPLE_DATA = {
    trigger: {
        data: {
            body: { message: 'Hello World', userId: 123 },
            headers: { 'content-type': 'application/json' },
            params: { id: 'abc123' }
        },
        type: 'manual'
    },
    nodes: {
        'http-request-1': {
            response: { status: 'success', data: { count: 42 } },
            statusCode: 200
        },
        'run-test-1': {
            result: { passed: true, duration: 1250 }
        }
    },
    variables: {
        apiUrl: 'https://api.example.com',
        environment: 'production',
        retryCount: 3
    },
    execution: {
        id: 'exec-12345',
        startedAt: new Date().toISOString()
    }
}

/**
 * Interpolates {{variable}} syntax in a string with provided data
 */
function interpolateExpression(template: string, data: Record<string, any>): {
    result: string
    isValid: boolean
    error?: string
} {
    try {
        const result = template.replace(/\{\{(.+?)\}\}/g, (match, path) => {
            const trimmedPath = path.trim()
            const parts = trimmedPath.split('.')

            let value: any = data
            for (const part of parts) {
                if (value === undefined || value === null) {
                    return match // Keep original if path not found
                }
                if (typeof value === 'object' && part in value) {
                    value = value[part]
                } else if (Array.isArray(value) && !isNaN(parseInt(part))) {
                    value = value[parseInt(part)]
                } else {
                    return match // Keep original if path not found
                }
            }

            if (typeof value === 'object') {
                return JSON.stringify(value)
            }
            return String(value ?? '')
        })

        // Check if any {{}} remain (unresolved)
        const hasUnresolved = /\{\{.+?\}\}/.test(result)

        return {
            result,
            isValid: !hasUnresolved,
            error: hasUnresolved ? 'Some variables could not be resolved' : undefined
        }
    } catch (error) {
        return {
            result: template,
            isValid: false,
            error: error instanceof Error ? error.message : 'Expression error'
        }
    }
}

/**
 * Detects {{variable}} expressions in a string
 */
function detectExpressions(text: string): string[] {
    const matches = text.match(/\{\{.+?\}\}/g) || []
    return matches.map(m => m.slice(2, -2).trim())
}

export const ExpressionPreview: React.FC<ExpressionPreviewProps> = ({
    expression,
    sampleData = DEFAULT_SAMPLE_DATA,
    className,
    showToggle = true
}) => {
    const [showPreview, setShowPreview] = useState(false)

    const expressions = useMemo(() => detectExpressions(expression || ''), [expression])
    const hasExpressions = expressions.length > 0

    const { result, isValid, error } = useMemo(() => {
        if (!expression || !hasExpressions) {
            return { result: expression, isValid: true, error: undefined }
        }
        return interpolateExpression(expression, sampleData)
    }, [expression, sampleData, hasExpressions])

    if (!hasExpressions) {
        return null
    }

    return (
        <div className={cn('mt-2', className)}>
            {/* Toggle button */}
            {showToggle && (
                <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 transition-colors"
                >
                    {showPreview ? (
                        <>
                            <Code className="w-3 h-3" />
                            Hide Preview
                        </>
                    ) : (
                        <>
                            <Eye className="w-3 h-3" />
                            Preview ({expressions.length} expression{expressions.length > 1 ? 's' : ''})
                        </>
                    )}
                </button>
            )}

            {/* Preview panel */}
            {showPreview && (
                <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 bg-gray-100">
                        <span className="text-xs font-medium text-gray-600">Preview (with sample data)</span>
                        <div className="flex items-center gap-1.5">
                            {isValid ? (
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                            ) : (
                                <AlertCircle className="w-3 h-3 text-amber-500" />
                            )}
                            <span className={cn(
                                'text-xs',
                                isValid ? 'text-green-600' : 'text-amber-600'
                            )}>
                                {isValid ? 'Valid' : 'Partial'}
                            </span>
                        </div>
                    </div>

                    {/* Result */}
                    <div className="p-3">
                        <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap break-all">
                            {result}
                        </pre>

                        {error && (
                            <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {error}
                            </p>
                        )}
                    </div>

                    {/* Detected expressions */}
                    <div className="px-3 py-2 border-t border-gray-200 bg-gray-100">
                        <div className="text-xs text-gray-500 mb-1">Variables found:</div>
                        <div className="flex flex-wrap gap-1">
                            {expressions.map((expr, i) => (
                                <span
                                    key={i}
                                    className="px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded text-[10px] font-mono"
                                >
                                    {expr}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ExpressionPreview
