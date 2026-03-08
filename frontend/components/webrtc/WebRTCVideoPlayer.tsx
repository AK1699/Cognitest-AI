'use client'

import { useEffect, useRef, useState } from 'react'
import { WebRTCLocalClient } from '@/lib/webrtc-local-client'
import { AlertCircle, Video, Loader2, CheckCircle2 } from 'lucide-react'

export interface WebRTCVideoPlayerProps {
  sessionId?: string
  browserId?: string
  resolution?: [number, number]
  autoConnect?: boolean
}

export function WebRTCVideoPlayer({
  sessionId,
  browserId,
  resolution = [1280, 720],
  autoConnect = true,
}: WebRTCVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const clientRef = useRef<WebRTCLocalClient | null>(null)

  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connectionState, setConnectionState] = useState<string>('disconnected')
  const [fps, setFps] = useState(0)

  useEffect(() => {
    if (!autoConnect) return

    const connect = async () => {
      try {
        setIsConnecting(true)
        setError(null)

        console.log('🎬 Initializing WebRTC connection...')

        clientRef.current = new WebRTCLocalClient({
          sessionId,
          browserId: browserId || `browser-${Date.now()}`,
          resolution,
          onVideoStream: (stream) => {
            console.log('📹 Video stream received')
            if (videoRef.current) {
              videoRef.current.srcObject = stream
              setIsConnected(true)
            }
          },
          onError: (error) => {
            console.error('❌ WebRTC Error:', error)
            setError(error.message)
            setIsConnecting(false)
          },
          onConnectionStateChange: (state) => {
            console.log('🔗 Connection state:', state)
            setConnectionState(state)
            if (state === 'connected') {
              setIsConnecting(false)
              setIsConnected(true)
            } else if (state === 'failed' || state === 'disconnected') {
              setIsConnected(false)
              setIsConnecting(false)
            }
          },
        })

        await clientRef.current.connect()
        console.log('✅ Connected!')

      } catch (err) {
        const error = err instanceof Error ? err.message : String(err)
        console.error('Connection error:', error)
        setError(error)
        setIsConnecting(false)
      }
    }

    connect()

    return () => {
      clientRef.current?.disconnect()
    }
  }, [autoConnect, sessionId, browserId, resolution])

  // Monitor FPS
  useEffect(() => {
    if (!videoRef.current || !isConnected) return

    let lastTime = Date.now()
    let frameCount = 0

    const updateFps = () => {
      frameCount++
      const now = Date.now()
      const elapsed = (now - lastTime) / 1000

      if (elapsed >= 1) {
        setFps(Math.round(frameCount / elapsed))
        frameCount = 0
        lastTime = now
      }

      requestAnimationFrame(updateFps)
    }

    const animationId = requestAnimationFrame(updateFps)
    return () => cancelAnimationFrame(animationId)
  }, [isConnected])

  const handleDisconnect = async () => {
    await clientRef.current?.disconnect()
    setIsConnected(false)
    setError(null)
  }

  const handleReconnect = async () => {
    await handleDisconnect()
    setError(null)
    setIsConnecting(true)

    try {
      clientRef.current = new WebRTCLocalClient({
        sessionId,
        browserId: browserId || `browser-${Date.now()}`,
        resolution,
        onVideoStream: (stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream
            setIsConnected(true)
          }
        },
        onError: (error) => {
          setError(error.message)
          setIsConnecting(false)
        },
        onConnectionStateChange: (state) => {
          setConnectionState(state)
          if (state === 'connected') {
            setIsConnecting(false)
            setIsConnected(true)
          }
        },
      })

      await clientRef.current.connect()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setIsConnecting(false)
    }
  }

  return (
    <div className="w-full bg-gray-900 rounded-lg overflow-hidden shadow-lg">
      {/* Video Container */}
      <div className="relative bg-black aspect-video">
        {/* Video Stream */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-contain bg-black"
          style={{ display: isConnected ? 'block' : 'none' }}
        />

        {/* Loading State */}
        {isConnecting && !isConnected && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-3 animate-spin" />
              <p className="text-white font-medium">Connecting...</p>
              <p className="text-gray-400 text-sm mt-1">Setting up WebRTC stream</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
            <div className="text-center max-w-md">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <p className="text-white font-medium">Connection Error</p>
              <p className="text-gray-400 text-xs mt-2 font-mono break-words whitespace-pre-wrap">
                {error}
              </p>
              <p className="text-gray-500 text-xs mt-3">
                Check browser console (F12) for detailed logs
              </p>
              <button
                onClick={handleReconnect}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Retry Connection
              </button>
            </div>
          </div>
        )}

        {/* Status Overlay */}
        {isConnected && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-black bg-opacity-50 px-3 py-2 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-green-500 text-sm font-medium">Connected</span>
          </div>
        )}

        {/* FPS Counter */}
        {isConnected && fps > 0 && (
          <div className="absolute top-4 right-4 bg-black bg-opacity-50 px-3 py-2 rounded-lg">
            <span className="text-gray-300 text-sm font-mono">{fps} FPS</span>
          </div>
        )}

        {/* Connection State */}
        {isConnected && (
          <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 px-3 py-2 rounded-lg">
            <span className="text-gray-400 text-xs font-mono capitalize">
              {connectionState}
            </span>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-gray-400" />
          <span className="text-gray-300 text-sm font-medium">
            {resolution[0]}x{resolution[1]}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isConnected && (
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Disconnect
            </button>
          )}

          {!isConnected && !isConnecting && (
            <button
              onClick={handleReconnect}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Connect
            </button>
          )}
        </div>
      </div>

      {/* Debug Info */}
      {!isConnected && !isConnecting && !error && (
        <div className="bg-gray-750 px-4 py-3 text-gray-400 text-xs">
          <p>Ready to connect. Click "Connect" to start streaming your Mac display.</p>
        </div>
      )}
    </div>
  )
}
