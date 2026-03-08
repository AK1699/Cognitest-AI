'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Maximize2,
  Minimize2,
  MousePointer2,
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
  has_binary?: boolean
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
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const [isManualControl, setIsManualControl] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
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

    ws.onmessage = async (event) => {
      if (typeof event.data === 'string') {
        const update: LiveUpdate = JSON.parse(event.data)
        handleLiveUpdate(update)
      } else {
        // Binary blob/arraybuffer
        const blob = new Blob([event.data], { type: 'image/jpeg' })
        const url = URL.createObjectURL(blob)

        setScreenshot((prev) => {
          if (prev && prev.startsWith('blob:')) {
            URL.revokeObjectURL(prev)
          }
          return url
        })
      }
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
        if (update.payload.screenshot) {
          setScreenshot(update.payload.screenshot)
        }
        setCurrentUrl(update.payload.url)
        break

      case 'status':
        if (update.payload.state === 'paused') {
          setIsManualControl(true)
        } else if (update.payload.state === 'running') {
          setIsManualControl(false)
        }
        break
    }
  }

  const sendInteraction = (type: string, payload: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }))
    }
  }

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isManualControl || !imgRef.current) return

    const rect = imgRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 1280 // Map to backend width
    const y = ((e.clientY - rect.top) / rect.height) * 720  // Map to backend height

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

  const toggleManualControl = () => {
    const newState = !isManualControl
    sendInteraction(newState ? 'pause' : 'resume', {})
  }

  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname
    } catch (e) {
      return url || 'New Tab'
    }
  }

  return (
    <Card className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50' : 'h-full'}`}>
      {/* Simple Control Bar */}
      <div className="bg-white p-2 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge
            variant={connectionStatus === 'connected' ? 'default' : 'secondary'}
            className={connectionStatus === 'connected' ? 'bg-green-500' : 'bg-gray-300'}
          >
            {connectionStatus === 'connected' ? '● Live' : '● Offline'}
          </Badge>
          <span className="text-xs text-gray-500">{currentUrl || 'about:blank'}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isManualControl ? 'destructive' : 'default'}
            onClick={toggleManualControl}
          >
            {isManualControl ? 'Resume AI' : 'Manual Control'}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Browser Viewport */}
      <div
        ref={containerRef}
        className="flex-1 bg-gray-900 overflow-hidden flex items-center justify-center"
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {screenshot ? (
          <div className="relative overflow-hidden">
            <img
              ref={imgRef}
              src={screenshot}
              alt="Live browser screenshot"
              className={`block max-w-full max-h-full ${isManualControl ? 'cursor-crosshair' : ''}`}
              onClick={handleImageClick}
            />
          </div>
        ) : (
          <div className="text-center text-gray-400">
            <p>No preview available</p>
          </div>
        )}
      </div>
    </Card>
  )
}
