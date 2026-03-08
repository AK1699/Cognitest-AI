'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Maximize2,
  Minimize2,
  RefreshCw,
  Pause,
  Play,
  X,
  Cpu,
} from 'lucide-react'

interface EnhancedLiveBrowserProps {
  executionRunId?: string
  isRunning: boolean
  browserConfig?: {
    os: string
    browser: string
    resolution: string
  }
  onPlay?: () => void
  onPause?: () => void
  onStop?: () => void
  onRefresh?: () => void
}

interface LiveUpdate {
  type: string
  payload: any
  timestamp: string
}

export default function EnhancedLiveBrowser({
  executionRunId,
  isRunning,
  browserConfig,
  onPlay,
  onPause,
  onStop,
  onRefresh,
}: EnhancedLiveBrowserProps) {
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [currentUrl, setCurrentUrl] = useState<string>('about:blank')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>(
    'disconnected'
  )
  const [isManualControl, setIsManualControl] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const wsRef = useRef<WebSocket | null>(null)

  // WebSocket connection
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
      setConnectionStatus('connected')
    }

    ws.onmessage = async (event) => {
      if (typeof event.data === 'string') {
        const update: LiveUpdate = JSON.parse(event.data)
        handleLiveUpdate(update)
      } else {
        // Binary screenshot data
        const blob = new Blob([event.data], { type: 'image/jpeg' })
        const url = URL.createObjectURL(blob)
        setScreenshot((prev) => {
          if (prev?.startsWith('blob:')) {
            URL.revokeObjectURL(prev)
          }
          return url
        })
      }
    }

    ws.onerror = () => {
      setConnectionStatus('disconnected')
    }

    ws.onclose = () => {
      setConnectionStatus('disconnected')
    }

    wsRef.current = ws
  }

  const handleLiveUpdate = (update: LiveUpdate) => {
    if (update.type === 'screenUpdate') {
      setCurrentUrl(update.payload.url || currentUrl)
    } else if (update.type === 'status') {
      if (update.payload.state === 'paused') {
        setIsManualControl(true)
      } else if (update.payload.state === 'running') {
        setIsManualControl(false)
      }
    }
  }

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isManualControl || !imgRef.current) return

    const rect = imgRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 1280
    const y = ((e.clientY - rect.top) / rect.height) * 720

    sendInteraction('click', { x, y })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isManualControl) return
    e.preventDefault()

    if (e.key.length === 1) {
      sendInteraction('type', { text: e.key })
    } else {
      sendInteraction('press', { key: e.key })
    }
  }

  const sendInteraction = (type: string, payload: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }))
    }
  }

  return (
    <Card className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'h-full'}`}>
      {/* Top Control Bar - Simple and Clean */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        {/* Left: Status Info */}
        <div className="flex items-center gap-3">
          <Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'}>
            {connectionStatus === 'connected' ? '● Live' : '● Offline'}
          </Badge>
          <span className="text-xs text-gray-500 font-mono">{currentUrl}</span>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          {isRunning ? (
            <>
              <Button
                size="sm"
                variant={isManualControl ? 'destructive' : 'default'}
                onClick={() => {
                  if (isManualControl) {
                    sendInteraction('resume', {})
                    onPlay?.()
                  } else {
                    sendInteraction('pause', {})
                    onPause?.()
                  }
                }}
              >
                {isManualControl ? (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Resume AI
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Manual Control
                  </>
                )}
              </Button>

              {onRefresh && (
                <Button size="sm" variant="outline" onClick={onRefresh}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              )}

              {onStop && (
                <Button size="sm" variant="outline" onClick={onStop}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </>
          ) : null}

          <Button
            size="sm"
            variant="ghost"
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

      {/* Browser Info Bar */}
      {browserConfig && (
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <Cpu className="w-3 h-3" />
            <span className="font-medium">{browserConfig.os}</span>
          </div>
          <span>•</span>
          <span className="font-medium">{browserConfig.browser}</span>
          <span>•</span>
          <span>{browserConfig.resolution}</span>
        </div>
      )}

      {/* Screenshot Viewport */}
      <div
        ref={containerRef}
        className="flex-1 bg-gray-900 overflow-auto flex items-center justify-center p-4"
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {screenshot ? (
          <div className="relative max-w-full max-h-full">
            <img
              ref={imgRef}
              src={screenshot}
              alt="Live browser preview"
              className={`block max-w-full max-h-full ${
                isManualControl ? 'cursor-crosshair' : 'cursor-default'
              }`}
              onClick={handleImageClick}
            />
          </div>
        ) : (
          <div className="text-center text-gray-400">
            <p className="text-lg font-medium">Starting browser session...</p>
            <p className="text-sm">Waiting for first screenshot</p>
          </div>
        )}
      </div>
    </Card>
  )
}
