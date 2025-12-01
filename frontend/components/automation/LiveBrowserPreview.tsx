'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  RefreshCw,
  Play,
  Pause,
  Square,
  Maximize2,
  Minimize2,
} from 'lucide-react'

interface LiveBrowserPreviewProps {
  executionRunId?: string
  isRunning: boolean
  onPlay?: () => void
  onPause?: () => void
  onStop?: () => void
  onRefresh?: () => void
}

interface LiveUpdate {
  type: string
  execution_run_id: string
  step_id?: string
  payload: any
  timestamp: string
}

export default function LiveBrowserPreview({
  executionRunId,
  isRunning,
  onPlay,
  onPause,
  onStop,
  onRefresh,
}: LiveBrowserPreviewProps) {
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [currentUrl, setCurrentUrl] = useState<string>('')
  const [currentStep, setCurrentStep] = useState<string>('')
  const [consoleLogs, setConsoleLogs] = useState<any[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (executionRunId && isRunning) {
      connectWebSocket(executionRunId)
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [executionRunId, isRunning])

  const connectWebSocket = (runId: string) => {
    setConnectionStatus('connecting')
    
    const wsUrl = `ws://localhost:8000/api/v1/web-automation/ws/live-preview/${runId}`
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('WebSocket connected')
      setConnectionStatus('connected')
    }

    ws.onmessage = (event) => {
      const update: LiveUpdate = JSON.parse(event.data)
      handleLiveUpdate(update)
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setConnectionStatus('disconnected')
    }

    ws.onclose = () => {
      console.log('WebSocket closed')
      setConnectionStatus('disconnected')
    }

    wsRef.current = ws
  }

  const handleLiveUpdate = (update: LiveUpdate) => {
    switch (update.type) {
      case 'screenUpdate':
        setScreenshot(update.payload.screenshot)
        setCurrentUrl(update.payload.url)
        break
      
      case 'stepStarted':
        setCurrentStep(`▶ ${update.payload.step_name}`)
        break
      
      case 'stepCompleted':
        setCurrentStep(`✓ ${update.payload.step_id}`)
        break
      
      case 'stepFailed':
        setCurrentStep(`✗ Failed: ${update.payload.error}`)
        break
      
      case 'console':
        setConsoleLogs((prev) => [
          ...prev,
          {
            level: update.payload.level,
            text: update.payload.text,
            timestamp: update.timestamp,
          },
        ])
        break
      
      case 'executionCompleted':
        setCurrentStep('✓ Execution completed')
        break
      
      case 'executionFailed':
        setCurrentStep(`✗ Execution failed: ${update.payload.error}`)
        break
    }
  }

  return (
    <Card className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50' : 'h-full'}`}>
      {/* Header with Controls */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'}>
            {connectionStatus === 'connected' ? '🟢 Live' : '🔴 Offline'}
          </Badge>
          <span className="text-sm text-gray-600 truncate max-w-md">
            {currentUrl || 'No URL loaded'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {onPlay && (
            <Button
              size="sm"
              variant="outline"
              onClick={onPlay}
              disabled={isRunning}
            >
              <Play className="w-4 h-4" />
            </Button>
          )}
          
          {onPause && (
            <Button
              size="sm"
              variant="outline"
              onClick={onPause}
              disabled={!isRunning}
            >
              <Pause className="w-4 h-4" />
            </Button>
          )}
          
          {onStop && (
            <Button
              size="sm"
              variant="outline"
              onClick={onStop}
              disabled={!isRunning}
            >
              <Square className="w-4 h-4" />
            </Button>
          )}
          
          {onRefresh && (
            <Button size="sm" variant="outline" onClick={onRefresh}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Browser Viewport */}
      <div className="flex-1 bg-white p-4 overflow-auto">
        {screenshot ? (
          <img
            src={screenshot}
            alt="Live browser screenshot"
            className="w-full h-auto border rounded shadow-lg"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <p className="text-lg mb-2">No live preview available</p>
              <p className="text-sm">Start execution to see live browser updates</p>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      {currentStep && (
        <div className="p-3 border-t bg-blue-50">
          <p className="text-sm font-medium">{currentStep}</p>
        </div>
      )}

      {/* Console Logs */}
      {consoleLogs.length > 0 && (
        <div className="border-t bg-gray-900 text-white p-3 max-h-40 overflow-y-auto">
          <p className="text-xs font-bold mb-2">Console Logs:</p>
          {consoleLogs.slice(-10).map((log, idx) => (
            <div key={idx} className="text-xs mb-1">
              <span className={`mr-2 ${
                log.level === 'error' ? 'text-red-400' :
                log.level === 'warning' ? 'text-yellow-400' :
                'text-gray-400'
              }`}>
                [{log.level}]
              </span>
              <span>{log.text}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
