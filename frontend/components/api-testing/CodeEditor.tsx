'use client'

import { useRef, useCallback } from 'react'
import Editor, { Monaco, OnMount } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'

interface CodeEditorProps {
    value: string
    onChange: (value: string) => void
    language: 'json' | 'javascript' | 'graphql' | 'xml' | 'html' | 'text'
    height?: string
    placeholder?: string
    readOnly?: boolean
    minimap?: boolean
    lineNumbers?: boolean
    className?: string
}

export function CodeEditor({
    value,
    onChange,
    language,
    height = '200px',
    placeholder,
    readOnly = false,
    minimap = false,
    lineNumbers = true,
    className = ''
}: CodeEditorProps) {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

    const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
        editorRef.current = editor

        // Register GraphQL language if not already registered
        if (language === 'graphql') {
            monaco.languages.register({ id: 'graphql' })
            monaco.languages.setMonarchTokensProvider('graphql', {
                tokenizer: {
                    root: [
                        [/#.*$/, 'comment'],
                        [/"([^"\\]|\\.)*$/, 'string.invalid'],
                        [/"/, 'string', '@string'],
                        [/[{}()\[\]]/, 'delimiter.bracket'],
                        [/:/, 'delimiter'],
                        [/,/, 'delimiter'],
                        [/\$[a-zA-Z_]\w*/, 'variable'],
                        [/@[a-zA-Z_]\w*/, 'annotation'],
                        [/\b(query|mutation|subscription|fragment|on|type|interface|union|enum|scalar|input|extend|schema|directive)\b/, 'keyword'],
                        [/\b(true|false|null)\b/, 'constant'],
                        [/\b[A-Z][a-zA-Z0-9_]*\b/, 'type.identifier'],
                        [/[a-zA-Z_]\w*/, 'identifier'],
                        [/[0-9]+(\.[0-9]+)?([eE][+-]?[0-9]+)?/, 'number'],
                    ],
                    string: [
                        [/[^\\"]+/, 'string'],
                        [/\\./, 'string.escape'],
                        [/"/, 'string', '@pop'],
                    ],
                },
            })
        }

        // Add JSON formatting command
        editor.addCommand(monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF, () => {
            editor.getAction('editor.action.formatDocument')?.run()
        })

        // Focus the editor
        editor.focus()
    }, [language])

    const handleEditorChange = useCallback((value: string | undefined) => {
        onChange(value || '')
    }, [onChange])

    return (
        <div className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}>
            <Editor
                height={height}
                language={language === 'graphql' ? 'graphql' : language}
                value={value}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                theme="vs-light"
                options={{
                    readOnly,
                    minimap: { enabled: minimap },
                    lineNumbers: lineNumbers ? 'on' : 'off',
                    fontSize: 13,
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Monaco', 'Menlo', monospace",
                    tabSize: 2,
                    insertSpaces: true,
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    wrappingStrategy: 'advanced',
                    padding: { top: 12, bottom: 12 },
                    lineDecorationsWidth: 8,
                    folding: true,
                    foldingHighlight: true,
                    bracketPairColorization: { enabled: true },
                    matchBrackets: 'always',
                    autoClosingBrackets: 'always',
                    autoClosingQuotes: 'always',
                    formatOnPaste: true,
                    formatOnType: true,
                    suggestOnTriggerCharacters: true,
                    quickSuggestions: true,
                    scrollbar: {
                        vertical: 'auto',
                        horizontal: 'auto',
                        verticalScrollbarSize: 10,
                        horizontalScrollbarSize: 10,
                    },
                    overviewRulerBorder: false,
                    hideCursorInOverviewRuler: true,
                    renderLineHighlight: 'line',
                    renderWhitespace: 'selection',
                    guides: {
                        indentation: true,
                        bracketPairs: true,
                    },
                }}
                loading={
                    <div className="flex items-center justify-center h-full bg-gray-50">
                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
                            Loading editor...
                        </div>
                    </div>
                }
            />
        </div>
    )
}

export default CodeEditor
