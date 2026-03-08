'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Monitor,
  Smartphone,
  Tablet,
  ChevronDown,
  Loader2,
} from 'lucide-react'

export interface BrowserConfig {
  os: 'Windows' | 'macOS' | 'Linux' | null
  browser: 'Chrome' | 'Firefox' | 'Safari' | 'Edge' | null
  browserVersion: string
  resolution: string
}

interface BrowserSelectorProps {
  onSelect: (config: BrowserConfig) => void
  isLoading?: boolean
}

const OS_OPTIONS = ['Windows', 'macOS', 'Linux']
const BROWSER_OPTIONS: Record<string, string[]> = {
  Windows: ['Chrome', 'Firefox', 'Edge'],
  macOS: ['Chrome', 'Firefox', 'Safari', 'Edge'],
  Linux: ['Chrome', 'Firefox'],
}

const BROWSER_VERSIONS: Record<string, string[]> = {
  Chrome: ['Latest', 'Latest-1', 'Latest-2'],
  Firefox: ['Latest', 'Latest-1', 'Latest-2'],
  Safari: ['Latest', 'Latest-1'],
  Edge: ['Latest', 'Latest-1'],
}

const RESOLUTIONS = [
  { name: 'Desktop (1920x1080)', value: '1920x1080' },
  { name: 'Laptop (1366x768)', value: '1366x768' },
  { name: 'HD (1280x720)', value: '1280x720' },
  { name: 'iPad (768x1024)', value: '768x1024' },
  { name: 'iPhone (390x844)', value: '390x844' },
]

export default function BrowserSelector({ onSelect, isLoading }: BrowserSelectorProps) {
  const [config, setConfig] = useState<BrowserConfig>({
    os: null,
    browser: null,
    browserVersion: 'Latest',
    resolution: '1280x720',
  })

  const availableBrowsers = config.os ? BROWSER_OPTIONS[config.os] : []

  const handleLaunch = () => {
    if (config.os && config.browser) {
      onSelect(config)
    }
  }

  const isValid = config.os && config.browser

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900">Launch Browser</h2>

      {/* OS Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700">Operating System</label>
        <div className="grid grid-cols-3 gap-3">
          {OS_OPTIONS.map((os) => (
            <button
              key={os}
              onClick={() =>
                setConfig({ ...config, os: os as any, browser: null })
              }
              className={`p-4 rounded-lg border-2 transition-all font-medium text-center ${
                config.os === os
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              <Monitor className="w-5 h-5 mx-auto mb-2" />
              {os}
            </button>
          ))}
        </div>
      </div>

      {/* Browser Selection */}
      {config.os && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
          <label className="block text-sm font-semibold text-gray-700">Browser</label>
          <div className="grid grid-cols-3 gap-3">
            {availableBrowsers.map((browser) => (
              <button
                key={browser}
                onClick={() =>
                  setConfig({ ...config, browser: browser as any })
                }
                className={`p-4 rounded-lg border-2 transition-all font-medium text-center ${
                  config.browser === browser
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                {browser}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Browser Version */}
      {config.browser && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
          <label className="block text-sm font-semibold text-gray-700">Browser Version</label>
          <select
            value={config.browserVersion}
            onChange={(e) => setConfig({ ...config, browserVersion: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {BROWSER_VERSIONS[config.browser]?.map((version) => (
              <option key={version} value={version}>
                {version}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Resolution Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700">Screen Resolution</label>
        <div className="grid grid-cols-2 gap-3">
          {RESOLUTIONS.map((res) => (
            <button
              key={res.value}
              onClick={() => setConfig({ ...config, resolution: res.value })}
              className={`p-3 rounded-lg border-2 transition-all text-left text-sm font-medium ${
                config.resolution === res.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold">{res.name}</div>
              <div className="text-xs opacity-70">{res.value}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Launch Button */}
      <Button
        onClick={handleLaunch}
        disabled={!isValid || isLoading}
        className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-lg transition-all"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Launching Browser...
          </>
        ) : (
          'Launch Browser'
        )}
      </Button>

      {!isValid && (
        <Badge variant="secondary" className="justify-center py-2">
          Select OS and Browser to continue
        </Badge>
      )}
    </div>
  )
}
