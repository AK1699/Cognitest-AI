'use client'

import { useEffect, useRef, useState } from 'react'
import { WebRTCLocalClient } from '@/lib/webrtc-local-client'
import { AlertCircle, Video, Loader2, CheckCircle2, Plus, Trash2, MonitorPlay } from 'lucide-react'
import { UserNav } from '@/components/layout/user-nav'

interface BrowserStream {
  id: string
  browserId: string
  client: WebRTCLocalClient | null
  videoRef: React.RefObject<HTMLVideoElement>
  isConnecting: boolean
  isConnected: boolean
  error: string | null
  connectionState: string
  fps: number
  sessionId?: string
}

export default function WebRTCMultiBrowserPage() {
  const [browsers, setBrowsers] = useState<BrowserStream[]>([])
  const [activeSessions, setActiveSessions] = useState(0)

  // Add new browser stream
  const addBrowser = () => {
    const newBrowser: BrowserStream = {
      id: `browser-${Date.now()}`,
      browserId: `browser-${browsers.length + 1}`,
      client: null,
      videoRef: useRef<HTMLVideoElement>(null),
      isConnecting: false,
      isConnected: false,
      error: null,
      connectionState: 'disconnected',
      fps: 0,
      sessionId: undefined,
    }

    setBrowsers([...browsers, newBrowser])
  }

  // Remove browser stream
  const removeBrowser = async (id: string) => {
    const browser = browsers.find(b => b.id === id)
    if (browser?.client) {
      await browser.client.disconnect()
    }
    setBrowsers(browsers.filter(b => b.id !== id))
  }

  // Connect browser
  const connectBrowser = async (id: string) => {
    const browserIndex = browsers.findIndex(b => b.id === id)
    if (browserIndex === -1) return

    const browser = browsers[browserIndex]
    const updatedBrowsers = [...browsers]
    updatedBrowsers[browserIndex] = { ...browser, isConnecting: true }
    setBrowsers(updatedBrowsers)

    try {
      const client = new WebRTCLocalClient({
        browserId: browser.browserId,
        resolution: [1280, 720],
        onVideoStream: (stream) => {
          if (browser.videoRef.current) {
            browser.videoRef.current.srcObject = stream
            const updated = [...browsers]
            const idx = updated.findIndex(b => b.id === id)
            if (idx !== -1) {
              updated[idx] = { ...updated[idx], isConnected: true }
              setBrowsers(updated)
            }
          }
        },
        onError: (error) => {
          const updated = [...browsers]
          const idx = updated.findIndex(b => b.id === id)
          if (idx !== -1) {
            updated[idx] = { ...updated[idx], error: error.message, isConnecting: false }
            setBrowsers(updated)
          }
        },
        onConnectionStateChange: (state) => {
          const updated = [...browsers]
          const idx = updated.findIndex(b => b.id === id)
          if (idx !== -1) {
            updated[idx] = {
              ...updated[idx],
              connectionState: state,
              isConnecting: false,
              isConnected: state === 'connected'
            }
            setBrowsers(updated)
          }
        },
      })

      await client.connect()

      const updated = [...browsers]
      const idx = updated.findIndex(b => b.id === id)
      if (idx !== -1) {
        updated[idx] = { ...updated[idx], client, isConnecting: false }
        setBrowsers(updated)
      }

    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      const updated = [...browsers]
      const idx = updated.findIndex(b => b.id === id)
      if (idx !== -1) {
        updated[idx] = { ...updated[idx], error, isConnecting: false }
        setBrowsers(updated)
      }
    }
  }

  // Disconnect browser
  const disconnectBrowser = async (id: string) => {
    const browser = browsers.find(b => b.id === id)
    if (browser?.client) {
      await browser.client.disconnect()
      const updated = [...browsers]
      const idx = updated.findIndex(b => b.id === id)
      if (idx !== -1) {
        updated[idx] = {
          ...updated[idx],
          client: null,
          isConnected: false,
          connectionState: 'disconnected',
          error: null
        }
        setBrowsers(updated)
      }
    }
  }

  // Monitor FPS for each browser
  useEffect(() => {
    const fpsTimmers = browsers.map(browser => {
      if (!browser.isConnected || !browser.videoRef.current) return null

      let lastTime = Date.now()
      let frameCount = 0

      const updateFps = () => {
        frameCount++
        const now = Date.now()
        const elapsed = (now - lastTime) / 1000

        if (elapsed >= 1) {
          const fps = Math.round(frameCount / elapsed)
          const updated = [...browsers]
          const idx = updated.findIndex(b => b.id === browser.id)
          if (idx !== -1) {
            updated[idx] = { ...updated[idx], fps }
            setBrowsers(updated)
          }
          frameCount = 0
          lastTime = now
        }

        return requestAnimationFrame(updateFps)
      }

      return requestAnimationFrame(updateFps)
    })

    return () => {
      fpsTimmers.forEach(id => {
        if (id) cancelAnimationFrame(id)
      })
    }
  }, [browsers])

  // Update active sessions count
  useEffect(() => {
    setActiveSessions(browsers.filter(b => b.isConnected).length)
  }, [browsers])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="h-[80px] px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <MonitorPlay className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Multi-Browser WebRTC</h1>
              <p className="text-xs text-gray-500">Stream multiple Mac displays simultaneously</p>
            </div>
          </div>
          <UserNav />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Control Bar */}
        <div className="mb-8 flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-sm text-gray-500">Active Streams</p>
              <p className="text-2xl font-bold text-blue-600">{activeSessions}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Browsers</p>
              <p className="text-2xl font-bold text-gray-900">{browsers.length}</p>
            </div>
          </div>

          <button
            onClick={addBrowser}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Browser
          </button>
        </div>

        {/* Browsers Grid */}
        {browsers.length === 0 ? (
          <div className="text-center py-12">
            <MonitorPlay className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No browsers added yet</p>
            <button
              onClick={addBrowser}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Add Your First Browser
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {browsers.map((browser) => (
              <div
                key={browser.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col"
              >
                {/* Video Container */}
                <div className="relative bg-black aspect-video">
                  <video
                    ref={browser.videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                    style={{ display: browser.isConnected ? 'block' : 'none' }}
                  />

                  {/* Loading State */}
                  {browser.isConnecting && !browser.isConnected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 text-blue-500 mx-auto mb-2 animate-spin" />
                        <p className="text-white text-sm">Connecting...</p>
                      </div>
                    </div>
                  )}

                  {/* Error State */}
                  {browser.error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
                      <div className="text-center max-w-xs">
                        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                        <p className="text-white text-xs">{browser.error}</p>
                      </div>
                    </div>
                  )}

                  {/* Connected Status */}
                  {browser.isConnected && (
                    <div className="absolute top-2 left-2 flex items-center gap-2 bg-black bg-opacity-50 px-2 py-1 rounded">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      <span className="text-green-500 text-xs font-medium">Connected</span>
                    </div>
                  )}

                  {/* FPS Counter */}
                  {browser.isConnected && browser.fps > 0 && (
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 px-2 py-1 rounded">
                      <span className="text-gray-300 text-xs font-mono">{browser.fps} FPS</span>
                    </div>
                  )}
                </div>

                {/* Info Bar */}
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{browser.browserId}</p>
                      <p className="text-xs text-gray-500">{browser.connectionState}</p>
                    </div>
                    <button
                      onClick={() => removeBrowser(browser.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {!browser.isConnected ? (
                      <button
                        onClick={() => connectBrowser(browser.id)}
                        disabled={browser.isConnecting}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded text-sm font-medium transition-colors"
                      >
                        {browser.isConnecting ? 'Connecting...' : 'Connect'}
                      </button>
                    ) : (
                      <button
                        onClick={() => disconnectBrowser(browser.id)}
                        className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors"
                      >
                        Disconnect
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Multi-Browser Streaming</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✅ Stream multiple Mac displays simultaneously</li>
            <li>✅ Each browser gets independent WebRTC session</li>
            <li>✅ Real-time H.264 video encoding</li>
            <li>✅ 30-60 FPS per stream</li>
            <li>✅ Scale to as many browsers as hardware supports</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
