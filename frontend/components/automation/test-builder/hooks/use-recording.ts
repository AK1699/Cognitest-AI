'use client'

import { useState, useRef, useCallback } from 'react'
import { TestStep } from '../types'
import { webAutomationApi } from '@/lib/api/webAutomation'

interface UseRecordingProps {
    projectId: string
    onStepRecorded: (step: TestStep) => void
}

interface UseRecordingReturn {
    isRecording: boolean
    recordingUrl: string
    setRecordingUrl: React.Dispatch<React.SetStateAction<string>>
    handleStartRecording: () => Promise<void>
    handleStopRecording: () => Promise<void>
}

/**
 * Hook for managing test recording functionality
 */
export function useRecording({ projectId, onStepRecorded }: UseRecordingProps): UseRecordingReturn {
    const [isRecording, setIsRecording] = useState(false)
    const [recordingUrl, setRecordingUrl] = useState('https://example.com')
    const recorderWsRef = useRef<WebSocket | null>(null)

    const handleStartRecording = useCallback(async () => {
        if (!projectId) {
            console.error("Missing projectId")
            return
        }

        try {
            setIsRecording(true)
            await webAutomationApi.startRecording(projectId, recordingUrl)

            // Connect to Recorder WebSocket
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
            const wsUrl = `${wsProtocol}//${window.location.host}/api/v1/web-automation/ws/recorder/${projectId}`
            const ws = new WebSocket(wsUrl)

            ws.onopen = () => {
                console.log('Recorder WebSocket Connected')
            }

            ws.onmessage = (event) => {
                const message = JSON.parse(event.data)
                if (message.type === 'recorded_event') {
                    const eventData = message.payload

                    let actionType = 'click'
                    if (eventData.type === 'click') actionType = 'click'
                    else if (eventData.type === 'input') actionType = 'type'

                    const newStep: TestStep = {
                        id: `step-${Date.now()}`,
                        action: actionType,
                        selector: eventData.selector.css,
                        value: eventData.value,
                        description: eventData.description,
                        timeout: 5000
                    }

                    onStepRecorded(newStep)
                }
            }

            recorderWsRef.current = ws
        } catch (error) {
            console.error("Failed to start recording:", error)
            setIsRecording(false)
        }
    }, [projectId, recordingUrl, onStepRecorded])

    const handleStopRecording = useCallback(async () => {
        if (!projectId) return

        try {
            await webAutomationApi.stopRecording(projectId)
            setIsRecording(false)
            if (recorderWsRef.current) {
                recorderWsRef.current.close()
                recorderWsRef.current = null
            }
        } catch (error) {
            console.error("Failed to stop recording:", error)
        }
    }, [projectId])

    return {
        isRecording,
        recordingUrl,
        setRecordingUrl,
        handleStartRecording,
        handleStopRecording,
    }
}
