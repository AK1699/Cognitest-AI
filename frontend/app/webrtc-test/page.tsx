'use client'

import { WebRTCVideoPlayer } from '@/components/webrtc/WebRTCVideoPlayer'
import { UserNav } from '@/components/layout/user-nav'
import { MonitorPlay, Info } from 'lucide-react'

export default function WebRTCTestPage() {
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
              <h1 className="text-xl font-bold text-gray-900">WebRTC Streaming Test</h1>
              <p className="text-xs text-gray-500">Real-time display streaming via WebRTC</p>
            </div>
          </div>
          <UserNav />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Info Box */}
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold text-blue-900 mb-1">How It Works</h2>
              <p className="text-sm text-blue-800">
                This page streams your Mac display in real-time using WebRTC. The backend
                captures your display using FFmpeg and sends H.264 encoded video frames to
                your browser with sub-50ms latency.
              </p>
            </div>
          </div>
        </div>

        {/* Video Player */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Live Display Stream</h2>
          <WebRTCVideoPlayer
            browserId="test-browser"
            resolution={[1280, 720]}
            autoConnect={true}
          />
        </div>

        {/* Instructions */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Backend Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Backend Setup</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>✅ FFmpeg installed locally</li>
              <li>✅ aiortc & av Python packages</li>
              <li>✅ WebRTC signaling endpoint</li>
              <li>✅ Display capture via FFmpeg</li>
            </ul>
          </div>

          {/* Frontend Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Frontend Setup</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>✅ WebRTC client library</li>
              <li>✅ SDP/ICE exchange</li>
              <li>✅ Video stream display</li>
              <li>✅ Connection monitoring</li>
            </ul>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-900 mb-3">Troubleshooting</h3>
          <ul className="space-y-2 text-sm text-yellow-800">
            <li>
              <strong>Nothing appears:</strong> Check that the backend is running at
              localhost:8000
            </li>
            <li>
              <strong>FFmpeg error:</strong> Verify FFmpeg is installed: <code className="bg-yellow-100 px-1 rounded">ffmpeg -version</code>
            </li>
            <li>
              <strong>WebSocket error:</strong> Ensure backend allows WebSocket connections
            </li>
            <li>
              <strong>Check console:</strong> Open browser DevTools (F12) Console tab for
              detailed logs
            </li>
          </ul>
        </div>

        {/* Performance Notes */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="font-semibold text-green-900 mb-3">Performance Metrics</h3>
          <ul className="space-y-2 text-sm text-green-800">
            <li>📊 <strong>Target Latency:</strong> 10-50ms (vs 333ms with screenshots)</li>
            <li>🎬 <strong>Frame Rate:</strong> 30 FPS (vs 3 FPS with screenshots)</li>
            <li>🎯 <strong>Resolution:</strong> 1280x720 (configurable)</li>
            <li>📈 <strong>Encoding:</strong> H.264 baseline profile</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
