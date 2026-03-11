'use client'

import { useState, useEffect } from 'react'
import { Play, Loader2, CheckCircle2, AlertCircle, MonitorPlay } from 'lucide-react'
import { UserNav } from '@/components/layout/user-nav'
import api from '@/lib/api'

interface Device {
  name: string
  width: number
  height: number
}

interface LaunchResponse {
  status: string
  message: string
  launched_browsers: Array<{
    device: string
    width: number
    height: number
    status: string
  }>
}

const DEFAULT_DEVICES = [
  { name: 'iPhone 15', width: 430, height: 932 },
  { name: 'iPad', width: 1024, height: 768 },
  { name: 'Desktop', width: 1280, height: 720 },
]

export default function TestAutomationPage() {
  const [testUrl, setTestUrl] = useState('http://localhost:3000')
  const [selectedDevices, setSelectedDevices] = useState<string[]>(['iPhone 15', 'iPad', 'Desktop'])
  const [availableDevices, setAvailableDevices] = useState<Device[]>(DEFAULT_DEVICES)
  const [isLaunching, setIsLaunching] = useState(false)
  const [launchResult, setLaunchResult] = useState<LaunchResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedBrowser, setSelectedBrowser] = useState('chrome')

  // Load available devices
  useEffect(() => {
    const loadDevices = async () => {
      try {
        const response = await api.get('/api/v1/browser-launcher/devices')
        setAvailableDevices(response.data.devices)
      } catch (err) {
        console.error('Failed to load devices:', err)
      }
    }

    loadDevices()
  }, [])

  // Toggle device selection
  const toggleDevice = (deviceName: string) => {
    setSelectedDevices(prev =>
      prev.includes(deviceName)
        ? prev.filter(d => d !== deviceName)
        : [...prev, deviceName]
    )
  }

  // Launch test browsers
  const handleLaunchTests = async () => {
    if (!testUrl.trim()) {
      setError('Please enter a URL')
      return
    }

    if (selectedDevices.length === 0) {
      setError('Please select at least one device')
      return
    }

    setIsLaunching(true)
    setError(null)
    setLaunchResult(null)

    try {
      const response = await api.post('/api/v1/browser-launcher/launch', {
        url: testUrl,
        devices: selectedDevices,
        browser: selectedBrowser,
      })

      const launchData = response.data
      setLaunchResult(launchData)

      // Create WebRTC streaming sessions for each launched browser
      const browserStreamingSessions = []
      for (const browser of launchData.launched_browsers || []) {
        try {
          const streamingResponse = await api.post('/api/v1/browser-streaming/create', {
            url: testUrl,
            device: browser.device,
            fps: 30,
            resolution: [browser.width, browser.height],
          })

          browserStreamingSessions.push({
            session_id: streamingResponse.data.session_id,
            device: browser.device,
            url: testUrl,
            width: browser.width,
            height: browser.height,
          })
        } catch (streamError) {
          console.error(`Failed to create streaming session for ${browser.device}:`, streamError)
        }
      }

      // Store browser streaming sessions for multi-browser preview
      if (browserStreamingSessions.length > 0) {
        localStorage.setItem('browser_streaming_sessions', JSON.stringify(browserStreamingSessions))
      }

      // Also keep the original sessions for backward compatibility
      if (launchData.launched_browsers) {
        localStorage.setItem('browser_sessions', JSON.stringify(launchData.launched_browsers))
      }

      // Auto-navigate to browser-preview-multi after 2 seconds
      setTimeout(() => {
        window.location.href = '/browser-preview-multi'
      }, 2000)
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to launch browsers'
      setError(errorMsg)
    } finally {
      setIsLaunching(false)
    }
  }

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
              <h1 className="text-xl font-bold text-gray-900">Test Automation</h1>
              <p className="text-xs text-gray-500">Launch browsers at multiple device sizes automatically</p>
            </div>
          </div>
          <UserNav />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-8 py-8">
        {/* How It Works */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-bold text-blue-900 mb-3">How It Works</h2>
          <ol className="text-sm text-blue-800 space-y-2">
            <li><strong>1.</strong> Enter your website URL</li>
            <li><strong>2.</strong> Select device sizes (iPhone, iPad, Desktop, etc.)</li>
            <li><strong>3.</strong> Click "Launch Test Browsers"</li>
            <li><strong>4.</strong> Browsers open automatically at those sizes with your website</li>
            <li><strong>5.</strong> Arrange windows on your Mac screen</li>
            <li><strong>6.</strong> Go to <a href="/webrtc-multi" className="underline hover:text-blue-700">/webrtc-multi</a> to stream them all</li>
          </ol>
        </div>

        {/* Configuration */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Test Configuration</h2>

          {/* URL Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website URL
            </label>
            <input
              type="url"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              placeholder="http://localhost:3000 or https://example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Browser Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Browser
            </label>
            <div className="flex gap-4">
              {['chrome', 'safari'].map(browser => (
                <label key={browser} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="browser"
                    value={browser}
                    checked={selectedBrowser === browser}
                    onChange={(e) => setSelectedBrowser(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700 capitalize">{browser}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Device Selection */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Devices to Test
            </label>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {availableDevices.map(device => (
                <label
                  key={device.name}
                  className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedDevices.includes(device.name)}
                    onChange={() => toggleDevice(device.name)}
                    className="w-4 h-4 rounded"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{device.name}</p>
                    <p className="text-xs text-gray-500">{device.width}x{device.height}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Launch Button */}
          <button
            onClick={handleLaunchTests}
            disabled={isLaunching}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {isLaunching ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Launching Browsers...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Launch Test Browsers
              </>
            )}
          </button>
        </div>

        {/* Success Message */}
        {launchResult && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <div className="flex gap-3 mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-green-900">✅ Headless Browsers Launched Successfully!</h3>
                <p className="text-sm text-green-800 mt-1">
                  {launchResult.launched_browsers.length} Docker containers running with WebRTC streaming
                </p>
              </div>
            </div>

            {/* Launched Browsers List */}
            <div className="space-y-2 mb-6">
              {launchResult.launched_browsers.map((browser, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white rounded border border-green-200">
                  <div>
                    <p className="font-medium text-gray-900">{browser.device}</p>
                    <p className="text-xs text-gray-500">
                      {browser.width}×{browser.height} • Container: {browser.container_id.slice(0, 12)}
                    </p>
                  </div>
                  <span className="text-sm text-green-600 font-medium">✓ Streaming</span>
                </div>
              ))}
            </div>

            {/* Auto-redirect Message */}
            <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
              <h4 className="font-semibold text-blue-900 mb-2">🔄 What's happening:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ Docker containers created for each device size</li>
                <li>✓ Playwright navigated to your URL in each browser</li>
                <li>✓ FFmpeg capturing each container's display</li>
                <li>✓ WebRTC streaming each browser independently</li>
                <li>✓ Auto-redirecting to WebRTC dashboard in 3 seconds...</li>
              </ul>
            </div>

            <a
              href="/webrtc-multi?auto=true"
              className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Go to WebRTC Multi-Browser Dashboard Now →
            </a>
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mobile Devices */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">📱 Mobile Devices</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>✓ iPhone 15 (430x932)</li>
              <li>✓ iPhone 15 Pro Max (440x956)</li>
              <li>✓ Galaxy S24 (412x915)</li>
              <li>✓ Pixel 8 (412x915)</li>
            </ul>
          </div>

          {/* Tablet & Desktop */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">💻 Tablets & Desktop</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>✓ iPad (1024x768)</li>
              <li>✓ iPad Pro (1366x1024)</li>
              <li>✓ Desktop (1280x720)</li>
              <li>✓ Desktop FHD (1920x1080)</li>
            </ul>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h3 className="font-semibold text-purple-900 mb-3">✨ Key Features</h3>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>✅ Automated browser launching at specific device sizes</li>
            <li>✅ Support for Chrome, Safari, Firefox</li>
            <li>✅ Test responsive design across all devices</li>
            <li>✅ Real-time 60 FPS streaming to webrtc-multi</li>
            <li>✅ No manual window positioning needed (just arrange as you like)</li>
            <li>✅ Perfect for team collaboration and demos</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
