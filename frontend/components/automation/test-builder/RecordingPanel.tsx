'use client'

import React from 'react'
import { Mic } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface RecordingPanelProps {
    isRecording: boolean
    recordingUrl: string
    onUrlChange: (url: string) => void
    onStartRecording: () => void
    onStopRecording: () => void
}

/**
 * Panel for controlling test recording functionality
 */
export function RecordingPanel({
    isRecording,
    recordingUrl,
    onUrlChange,
    onStartRecording,
    onStopRecording,
}: RecordingPanelProps) {
    return (
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
                    : "Enter the URL to start recording. We'll open a browser for you."}
            </p>

            {!isRecording && (
                <div className="w-full mb-4">
                    <Label className="sr-only">URL</Label>
                    <Input
                        value={recordingUrl}
                        onChange={(e) => onUrlChange(e.target.value)}
                        placeholder="https://example.com"
                        className="mb-2"
                    />
                </div>
            )}

            {!isRecording ? (
                <Button
                    onClick={onStartRecording}
                    className="w-full bg-red-600 hover:bg-red-700"
                >
                    Start Recording
                </Button>
            ) : (
                <Button
                    onClick={onStopRecording}
                    variant="outline"
                    className="w-full border-red-200 text-red-700 hover:bg-red-50"
                >
                    Stop Recording
                </Button>
            )}
        </div>
    )
}
