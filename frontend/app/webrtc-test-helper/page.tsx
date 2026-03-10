'use client'

import { useState } from 'react'
import { Copy, Check, ExternalLink, MonitorPlay } from 'lucide-react'
import { UserNav } from '@/components/layout/user-nav'

const DEVICE_LAUNCH_COMMANDS = {
  'iPhone 15': {
    width: 430,
    height: 932,
    script: `open -n -a "Google Chrome" --args --window-size=430,932 --new-window "https://yourwebsite.com"`,
    description: 'Opens Chrome in iPhone 15 size (430x932)'
  },
  'iPhone 15 Pro Max': {
    width: 440,
    height: 956,
    script: `open -n -a "Google Chrome" --args --window-size=440,956 --new-window "https://yourwebsite.com"`,
    description: 'Opens Chrome in iPhone 15 Pro Max size (440x956)'
  },
  'Galaxy S24': {
    width: 412,
    height: 915,
    script: `open -n -a "Google Chrome" --args --window-size=412,915 --new-window "https://yourwebsite.com"`,
    description: 'Opens Chrome in Galaxy S24 size (412x915)'
  },
  'iPad': {
    width: 1024,
    height: 768,
    script: `open -n -a "Google Chrome" --args --window-size=1024,768 --new-window "https://yourwebsite.com"`,
    description: 'Opens Chrome in iPad size (1024x768)'
  },
  'Desktop': {
    width: 1280,
    height: 720,
    script: `open -n -a "Google Chrome" --args --window-size=1280,720 --new-window "https://yourwebsite.com"`,
    description: 'Opens Chrome in Desktop HD size (1280x720)'
  },
  'Desktop FHD': {
    width: 1920,
    height: 1080,
    script: `open -n -a "Google Chrome" --args --window-size=1920,1080 --new-window "https://yourwebsite.com"`,
    description: 'Opens Chrome in Desktop FHD size (1920x1080)'
  },
}

export default function WebRTCTestHelperPage() {
  const [testUrl, setTestUrl] = useState('https://yourwebsite.com')
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null)

  const generateCommand = (baseCommand: string, url: string): string => {
    return baseCommand.replace('https://yourwebsite.com', url)
  }

  const copyToClipboard = (text: string, device: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCommand(device)
    setTimeout(() => setCopiedCommand(null), 2000)
  }

  const generateAllCommands = () => {
    const commands = Object.entries(DEVICE_LAUNCH_COMMANDS)
      .map(([device, config]) => `# ${device}\n${generateCommand(config.script, testUrl)}`)
      .join('\n\n')

    return commands
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
              <h1 className="text-xl font-bold text-gray-900">Browser Launch Helper</h1>
              <p className="text-xs text-gray-500">Open browsers at different device sizes for testing</p>
            </div>
          </div>
          <UserNav />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-8 py-8">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-bold text-blue-900 mb-3">How It Works</h2>
          <ol className="text-sm text-blue-800 space-y-2">
            <li><strong>1.</strong> Enter your website URL below</li>
            <li><strong>2.</strong> Select a device preset</li>
            <li><strong>3.</strong> Copy the launch command</li>
            <li><strong>4.</strong> Paste it in your Terminal and press Enter</li>
            <li><strong>5.</strong> A browser window opens at that exact device size</li>
            <li><strong>6.</strong> Go to <a href="http://localhost:3000/webrtc-multi" className="underline hover:text-blue-700">webrtc-multi</a> to see the streams</li>
          </ol>
        </div>

        {/* URL Input */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Website URL to Test
          </label>
          <input
            type="url"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            placeholder="https://yourwebsite.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-2">
            Examples: https://localhost:3000, https://example.com
          </p>
        </div>

        {/* Device Commands */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Device Launch Commands</h2>

          {Object.entries(DEVICE_LAUNCH_COMMANDS).map(([device, config]) => {
            const command = generateCommand(config.script, testUrl)
            const isCopied = copiedCommand === device

            return (
              <div key={device} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{device}</h3>
                    <p className="text-xs text-gray-500">{config.width}x{config.height}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(command, device)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isCopied
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>

                {/* Command Box */}
                <div className="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                  <code>{command}</code>
                </div>
              </div>
            )
          })}
        </div>

        {/* Batch Commands */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Open All at Once</h2>
          <p className="text-sm text-gray-600 mb-4">
            Save and run this script to open multiple browsers at once:
          </p>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs overflow-x-auto mb-4">
            <code className="whitespace-pre-wrap break-words">{generateAllCommands()}</code>
          </div>
          <button
            onClick={() => copyToClipboard(generateAllCommands(), 'batch')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy All Commands
          </button>
        </div>

        {/* Next Steps */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-lg font-bold text-green-900 mb-3">Next Steps</h2>
          <ol className="text-sm text-green-800 space-y-2">
            <li><strong>1. Open Terminal</strong> (Cmd + Space, type "Terminal")</li>
            <li><strong>2. Paste</strong> the launch command you copied above</li>
            <li><strong>3. Press Enter</strong> to open the browser window</li>
            <li><strong>4. Repeat</strong> for multiple devices</li>
            <li><strong>5. Go to <a href="http://localhost:3000/webrtc-multi" className="underline hover:text-green-700">webrtc-multi</a></strong> to add streams for each browser window</li>
            <li><strong>6. Click "Connect"</strong> to stream each browser at its device size</li>
          </ol>
        </div>

        {/* Troubleshooting */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-bold text-yellow-900 mb-3">Troubleshooting</h2>
          <div className="space-y-3 text-sm text-yellow-800">
            <div>
              <strong>Command not working?</strong>
              <p>Make sure you have Chrome installed. Replace "Google Chrome" with "Safari" if you prefer Safari.</p>
            </div>
            <div>
              <strong>Can't find Terminal?</strong>
              <p>Press Cmd + Space to open Spotlight, type "terminal", and press Enter</p>
            </div>
            <div>
              <strong>Want to use Safari instead?</strong>
              <p>Replace "Google Chrome" with "Safari" in the commands</p>
            </div>
            <div>
              <strong>Need different sizes?</strong>
              <p>Edit the width and height values in the command (e.g., --window-size=412,915)</p>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h2 className="text-lg font-bold text-purple-900 mb-3">Pro Tips</h2>
          <ul className="text-sm text-purple-800 space-y-2">
            <li>✅ Open 3-4 browser windows at different sizes to test responsive design</li>
            <li>✅ Position windows side-by-side on your Mac for easy viewing</li>
            <li>✅ Use the webrtc-multi dashboard to see all streams in one place</li>
            <li>✅ Test with 60 FPS real-time capture for fast feedback</li>
            <li>✅ Perfect for remote testing with your team</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
