'use client'

import { useEffect, useRef, useState } from 'react'
import { WebRTCLocalClient } from '@/lib/webrtc-local-client'
import { AlertCircle, Video, Loader2, CheckCircle2, Plus, Trash2, MonitorPlay, Settings } from 'lucide-react'
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
  resolution: [number, number]
  sessionId?: string
}

const PRESET_RESOLUTIONS = {
  'Desktop': [1280, 720] as [number, number],
  'Desktop FHD': [1920, 1080] as [number, number],
  'iPad': [1024, 768] as [number, number],
  'iPad Pro': [1366, 1024] as [number, number],
  'iPhone 15': [430, 932] as [number, number],
  'iPhone 15 Pro Max': [440, 956] as [number, number],
  'Galaxy S24': [412, 915] as [number, number],
  'Galaxy Tab S9': [1280, 800] as [number, number],
  'Pixel 8': [412, 915] as [number, number],
}

export default function WebRTCMultiBrowserPage() {
  const [browsers, setBrowsers] = useState<BrowserStream[]>([])
  const [activeSessions, setActiveSessions] = useState(0)
  const [selectedResolution, setSelectedResolution] = useState<[number, number]>([1280, 720])
  const [customWidth, setCustomWidth] = useState('1280')
  const [customHeight, setCustomHeight] = useState('720')
  const [showResolutionMenu, setShowResolutionMenu] = useState(false)
  const [useCustomResolution, setUseCustomResolution] = useState(false)

  // Get current resolution display
  const getCurrentResolution = (): [number, number] => {
    if (useCustomResolution) {
      return [parseInt(customWidth) || 1280, parseInt(customHeight) || 720]
    }
    return selectedResolution
  }

  // Add new browser stream
  const addBrowser = () => {
    const resolution = getCurrentResolution()
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
      resolution: resolution,
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
        resolution: browser.resolution,
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
              <p className="text-xs text-gray-500">Stream multiple displays with customizable resolutions</p>
            </div>
          </div>
          <UserNav />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Control Bar */}
        <div className="mb-8 bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
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

          {/* Resolution Selector */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Resolution:</span>
              </div>

              {/* Preset Resolutions */}
              <div className="relative">
                <button
                  onClick={() => setShowResolutionMenu(!showResolutionMenu)}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-sm font-medium text-gray-700 transition-colors"
                >
                  {useCustomResolution
                    ? `Custom (${customWidth}x${customHeight})`
                    : Object.entries(PRESET_RESOLUTIONS).find(([_, res]) =>
                        res[0] === selectedResolution[0] && res[1] === selectedResolution[1]
                      )?.[0] || 'Custom'
                  }
                </button>

                {showResolutionMenu && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-300 rounded-lg shadow-lg z-20">
                    {Object.entries(PRESET_RESOLUTIONS).map(([label, resolution]) => (
                      <button
                        key={label}
                        onClick={() => {
                          setSelectedResolution(resolution)
                          setUseCustomResolution(false)
                          setShowResolutionMenu(false)
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                          !useCustomResolution &&
                          selectedResolution[0] === resolution[0] &&
                          selectedResolution[1] === resolution[1]
                            ? 'bg-blue-50 text-blue-600 font-medium'
                            : 'text-gray-700'
                        }`}
                      >
                        {label} ({resolution[0]}x{resolution[1]})
                      </button>
                    ))}
                    <div className="border-t border-gray-200 px-4 py-2">
                      <p className="text-xs font-medium text-gray-600 mb-2">Custom Size</p>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={customWidth}
                          onChange={(e) => setCustomWidth(e.target.value)}
                          placeholder="Width"
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-xs"
                        />
                        <span className="text-gray-500">x</span>
                        <input
                          type="number"
                          value={customHeight}
                          onChange={(e) => setCustomHeight(e.target.value)}
                          placeholder="Height"
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-xs"
                        />
                        <button
                          onClick={() => {
                            setUseCustomResolution(true)
                            setShowResolutionMenu(false)
                          }}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <span className="text-sm text-gray-600">
                {getCurrentResolution()[0]}x{getCurrentResolution()[1]}px
              </span>
            </div>
          </div>
        </div>

        {/* Device Presets Info */}
        <div className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(PRESET_RESOLUTIONS).map(([device, [w, h]]) => (
            <div key={device} className="bg-white rounded border border-gray-200 p-3 text-sm">
              <p className="font-medium text-gray-900">{device}</p>
              <p className="text-gray-500 text-xs">{w}x{h}</p>
            </div>
          ))}
        </div>

        {/* Browsers Grid */}
        {browsers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
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
                <div
                  className="relative bg-black"
                  style={{
                    aspectRatio: `${browser.resolution[0]} / ${browser.resolution[1]}`
                  }}
                >
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
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{browser.resolution[0]}x{browser.resolution[1]}</span>
                        <span>•</span>
                        <span>{browser.connectionState}</span>
                      </div>
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
          <h3 className="font-semibold text-blue-900 mb-2">Multi-Device Testing</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✅ Stream multiple devices with different resolutions</li>
            <li>✅ Test responsive designs (mobile, tablet, desktop)</li>
            <li>✅ Independent WebRTC session per device</li>
            <li>✅ Real-time monitoring with per-device FPS</li>
            <li>✅ Custom resolution support for any device size</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
