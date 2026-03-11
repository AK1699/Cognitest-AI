"use client";

import React, { useState, useEffect, useRef } from "react";
import { BrowserWebRTCClient, type BrowserMetrics } from "@/lib/browser-webrtc-client";

interface ConsoleMessage {
  level: string;
  text: string;
  timestamp: string;
}

interface NetworkRequest {
  url: string;
  method: string;
  status: number;
  size: number;
  timestamp: string;
}

export default function BrowserPreviewPage() {
  const [sessionId, setSessionId] = useState<string>("");
  const [status, setStatus] = useState<string>("disconnected");
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [device, setDevice] = useState<string>("desktop_chrome");
  const [fps, setFps] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<BrowserMetrics | null>(null);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleMessage[]>([]);
  const [networkRequests, setNetworkRequests] = useState<NetworkRequest[]>([]);
  const [selectedTab, setSelectedTab] = useState<"console" | "network" | "info">("console");

  const videoRef = useRef<HTMLVideoElement>(null);
  const clientRef = useRef<BrowserWebRTCClient | null>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const createUrlInputRef = useRef<HTMLInputElement>(null);

  // Create new session
  const handleCreateSession = async () => {
    try {
      setLoading(true);
      const url = createUrlInputRef.current?.value || "https://example.com";

      const response = await fetch("/api/v1/browser-streaming/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          device,
          fps,
          resolution: [1280, 720],
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`);
      }

      const data = await response.json();
      setSessionId(data.session_id);
      setCurrentUrl(data.url);
      setStatus("created");

      // Auto-connect
      setTimeout(() => {
        connectSession(data.session_id);
      }, 500);
    } catch (error) {
      console.error("Error creating session:", error);
      alert(`Failed to create session: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Connect to session
  const connectSession = async (id: string) => {
    try {
      setLoading(true);
      setStatus("connecting");

      if (clientRef.current) {
        await clientRef.current.disconnect();
      }

      const client = new BrowserWebRTCClient({
        signalingUrl: "/api/v1/browser-streaming/ws",
        sessionId: id,
      });

      // Setup callbacks
      client.onConnectionStateChangeEvent((state) => {
        setStatus(state);
      });

      client.onMetricsUpdateEvent((metrics) => {
        setMetrics(metrics);
      });

      client.onConsole((msg) => {
        setConsoleLogs((prev) => [...prev, msg]);
      });

      client.onNetwork((req) => {
        setNetworkRequests((prev) => [...prev, req]);
      });

      client.onNavigation((url) => {
        setCurrentUrl(url);
      });

      if (videoRef.current) {
        await client.connect(videoRef.current);
        client.setupInteractionHandlers(videoRef.current);
        // Make video focusable for keyboard input
        videoRef.current.tabIndex = 0;
      }

      clientRef.current = client;
    } catch (error) {
      console.error("Error connecting session:", error);
      alert(`Failed to connect: ${error}`);
      setStatus("failed");
    } finally {
      setLoading(false);
    }
  };

  // Navigate to URL
  const handleNavigate = () => {
    const url = urlInputRef.current?.value || "https://example.com";
    if (clientRef.current) {
      clientRef.current.navigate(url);
      setCurrentUrl(url);
    }
  };

  // Close session
  const handleCloseSession = async () => {
    try {
      if (clientRef.current) {
        await clientRef.current.disconnect();
      }

      if (sessionId) {
        await fetch(`/api/v1/browser-streaming/${sessionId}/close`, {
          method: "POST",
        });
      }

      setSessionId("");
      setStatus("closed");
      setCurrentUrl("");
      setConsoleLogs([]);
      setNetworkRequests([]);
    } catch (error) {
      console.error("Error closing session:", error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
    };
  }, []);

  // Session creation form
  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold mb-8">Browser Preview</h1>

          <div className="bg-gray-800 rounded-lg p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">URL to Preview</label>
              <input
                ref={createUrlInputRef}
                type="text"
                placeholder="https://example.com"
                defaultValue="https://example.com"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Device</label>
              <select
                value={device}
                onChange={(e) => setDevice(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="desktop_chrome">Desktop Chrome</option>
                <option value="desktop_1280">Desktop 1280x720</option>
                <option value="iphone_14">iPhone 14</option>
                <option value="iphone_14_pro_max">iPhone 14 Pro Max</option>
                <option value="pixel_7">Pixel 7</option>
                <option value="ipad_pro">iPad Pro</option>
                <option value="galaxy_s21">Galaxy S21</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">FPS</label>
              <select
                value={fps}
                onChange={(e) => setFps(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="15">15 FPS</option>
                <option value="20">20 FPS</option>
                <option value="24">24 FPS</option>
                <option value="30">30 FPS</option>
              </select>
            </div>

            <button
              onClick={handleCreateSession}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 rounded transition"
            >
              {loading ? "Creating..." : "Create Session"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Browser preview view
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Browser Preview</h1>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded text-sm font-medium ${
              status === "connected" ? "bg-green-900 text-green-200" : "bg-yellow-900 text-yellow-200"
            }`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
            <button
              onClick={handleCloseSession}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 space-y-3">
        <div className="flex gap-2">
          <input
            ref={urlInputRef}
            type="text"
            value={currentUrl}
            onChange={(e) => setCurrentUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
          />
          <button
            onClick={handleNavigate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition"
          >
            Go
          </button>
          <button
            onClick={() => clientRef.current?.navigate(currentUrl)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition"
            title="Reload"
          >
            ↻
          </button>
        </div>

        {/* Metrics */}
        {metrics && (
          <div className="flex gap-4 text-sm text-gray-300">
            <div>FPS: <span className="text-white font-semibold">{metrics.fps}</span></div>
            <div>Latency: <span className="text-white font-semibold">{metrics.latency}ms</span></div>
            <div>Frames: <span className="text-white font-semibold">{metrics.videoFramesDecoded}</span></div>
            <div>Bitrate: <span className="text-white font-semibold">{metrics.videoKbpsReceived}kbps</span></div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Video Section */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 bg-black rounded overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-contain"
              style={{ cursor: "pointer" }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Click to interact • Scroll to navigate • Type for input
          </p>
        </div>

        {/* Side Panel */}
        <div className="w-96 flex flex-col bg-gray-800 rounded overflow-hidden">
          {/* Tab Buttons */}
          <div className="flex border-b border-gray-700">
            {(["console", "network", "info"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`flex-1 px-4 py-2 text-sm font-medium transition ${
                  selectedTab === tab
                    ? "bg-gray-700 text-white border-b-2 border-blue-500"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {selectedTab === "console" && (
              <div className="p-4 space-y-2 text-sm font-mono">
                {consoleLogs.length === 0 ? (
                  <p className="text-gray-500">No console messages</p>
                ) : (
                  consoleLogs.map((log, i) => (
                    <div
                      key={i}
                      className={`text-xs ${
                        log.level === "error"
                          ? "text-red-400"
                          : log.level === "warn"
                          ? "text-yellow-400"
                          : "text-green-400"
                      }`}
                    >
                      [{log.level}] {log.text}
                    </div>
                  ))
                )}
              </div>
            )}

            {selectedTab === "network" && (
              <div className="p-4 space-y-2 text-xs">
                {networkRequests.length === 0 ? (
                  <p className="text-gray-500">No network requests</p>
                ) : (
                  networkRequests.map((req, i) => (
                    <div
                      key={i}
                      className={`border border-gray-700 rounded p-2 ${
                        req.status >= 400 ? "border-red-700 bg-red-900/20" : "border-gray-700"
                      }`}
                    >
                      <div className="font-semibold">{req.method} {req.status}</div>
                      <div className="text-gray-400 truncate">{req.url}</div>
                      <div className="text-gray-500">{req.size} bytes</div>
                    </div>
                  ))
                )}
              </div>
            )}

            {selectedTab === "info" && (
              <div className="p-4 space-y-3 text-sm">
                <div>
                  <span className="text-gray-400">Device:</span>
                  <span className="ml-2 text-white">{device}</span>
                </div>
                <div>
                  <span className="text-gray-400">URL:</span>
                  <div className="text-white text-xs truncate break-all mt-1">{currentUrl}</div>
                </div>
                <div>
                  <span className="text-gray-400">Session:</span>
                  <div className="text-white text-xs truncate mt-1">{sessionId}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
