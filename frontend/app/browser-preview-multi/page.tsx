"use client";

import React, { useState, useEffect, useRef } from "react";
import { BrowserWebRTCClient, type BrowserMetrics } from "@/lib/browser-webrtc-client";

interface StoredSession {
  session_id: string;
  device: string;
  url: string;
  width: number;
  height: number;
}

interface SessionState {
  sessionId: string;
  status: string;
  metrics: BrowserMetrics | null;
  url: string;
  device: string;
}

const gridClasses = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-2",
  6: "grid-cols-3",
};

export default function BrowserPreviewMultiPage() {
  const [sessions, setSessions] = useState<StoredSession[]>([]);
  const [sessionStates, setSessionStates] = useState<Map<string, SessionState>>(new Map());
  const [clients, setClients] = useState<Map<string, BrowserWebRTCClient>>(new Map());
  const [syncNav, setSyncNav] = useState(true);
  const [syncUrl, setSyncUrl] = useState("");
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const loadAttempts = useRef<Map<string, number>>(new Map());

  // Load sessions from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("browser_streaming_sessions");
    if (stored) {
      try {
        const parsedSessions = JSON.parse(stored);
        setSessions(parsedSessions);
      } catch (error) {
        console.error("Error parsing stored sessions:", error);
      }
    }
  }, []);

  // Auto-connect to sessions
  useEffect(() => {
    sessions.forEach((session) => {
      connectSession(session.session_id);
    });

    return () => {
      clients.forEach((client) => {
        client.disconnect();
      });
    };
  }, [sessions]);

  const connectSession = async (sessionId: string) => {
    try {
      // Prevent multiple connection attempts
      const attempts = (loadAttempts.current.get(sessionId) || 0) + 1;
      if (attempts > 3) {
        console.error(`Too many connection attempts for session ${sessionId}`);
        return;
      }
      loadAttempts.current.set(sessionId, attempts);

      const client = new BrowserWebRTCClient({
        signalingUrl: "/api/v1/browser-streaming/ws",
        sessionId,
      });

      const session = sessions.find((s) => s.session_id === sessionId);
      if (!session) return;

      // Initialize session state
      setSessionStates((prev) => {
        const newMap = new Map(prev);
        newMap.set(sessionId, {
          sessionId,
          status: "connecting",
          metrics: null,
          url: session.url,
          device: session.device,
        });
        return newMap;
      });

      // Setup callbacks
      client.onConnectionStateChangeEvent((state) => {
        setSessionStates((prev) => {
          const newMap = new Map(prev);
          const existing = newMap.get(sessionId) || {
            sessionId,
            status: "unknown",
            metrics: null,
            url: session?.url || "",
            device: session?.device || "",
          };
          newMap.set(sessionId, { ...existing, status: state });
          return newMap;
        });
      });

      client.onMetricsUpdateEvent((metrics) => {
        setSessionStates((prev) => {
          const newMap = new Map(prev);
          const existing = newMap.get(sessionId);
          if (existing) {
            newMap.set(sessionId, { ...existing, metrics });
          }
          return newMap;
        });
      });

      client.onNavigation((url) => {
        setSessionStates((prev) => {
          const newMap = new Map(prev);
          const existing = newMap.get(sessionId);
          if (existing) {
            newMap.set(sessionId, { ...existing, url });
          }
          return newMap;
        });
      });

      const videoEl = videoRefs.current.get(sessionId);
      if (videoEl) {
        await client.connect(videoEl);
        client.setupInteractionHandlers(videoEl);
        videoEl.tabIndex = 0;
      }

      setClients((prev) => {
        const newMap = new Map(prev);
        newMap.set(sessionId, client);
        return newMap;
      });

      loadAttempts.current.delete(sessionId);
    } catch (error) {
      console.error(`Error connecting session ${sessionId}:`, error);

      setTimeout(() => {
        connectSession(sessionId);
      }, 2000 + Math.random() * 2000);
    }
  };

  const handleSyncNavigate = () => {
    if (!syncUrl) return;

    clients.forEach((client) => {
      client.navigate(syncUrl);
    });

    setSessionStates((prev) => {
      const newMap = new Map(prev);
      newMap.forEach((state) => {
        state.url = syncUrl;
      });
      return newMap;
    });
  };

  const closeAll = async () => {
    clients.forEach((client) => {
      client.disconnect();
    });

    for (const session of sessions) {
      try {
        await fetch(`/api/v1/browser-streaming/${session.session_id}/close`, {
          method: "POST",
        });
      } catch (error) {
        console.error(`Error closing session ${session.session_id}:`, error);
      }
    }

    setSessions([]);
    setSessionStates(new Map());
    setClients(new Map());
    localStorage.removeItem("browser_streaming_sessions");
  };

  if (sessions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">No Browser Sessions</h1>
          <p className="text-gray-400 mb-4">Create sessions from the Test Automation dashboard</p>
          <a
            href="/test-automation"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded transition"
          >
            Go to Test Automation
          </a>
        </div>
      </div>
    );
  }

  const gridClass = gridClasses[sessions.length as keyof typeof gridClasses] || "grid-cols-2";
  const statusColor = {
    connected: "text-green-400",
    connecting: "text-yellow-400",
    disconnected: "text-red-400",
    failed: "text-red-400",
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Multi-Browser Preview</h1>
          <button
            onClick={closeAll}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition"
          >
            Close All
          </button>
        </div>

        {/* Sync Navigation */}
        <div className="flex gap-2">
          <input
            type="checkbox"
            checked={syncNav}
            onChange={(e) => setSyncNav(e.target.checked)}
            className="mt-1"
          />
          <span className="text-sm">Sync navigation</span>
          {syncNav && (
            <>
              <input
                type="text"
                value={syncUrl}
                onChange={(e) => setSyncUrl(e.target.value)}
                placeholder="Enter URL to navigate all..."
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              />
              <button
                onClick={handleSyncNavigate}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm transition"
              >
                Navigate All
              </button>
            </>
          )}
        </div>
      </div>

      {/* Browser Grid */}
      <div className={`flex-1 grid ${gridClass} gap-4 p-4 overflow-auto`}>
        {sessions.map((session) => {
          const state = sessionStates.get(session.session_id) || {
            sessionId: session.session_id,
            status: "connecting",
            metrics: null,
            url: session.url,
            device: session.device,
          };

          return (
            <div
              key={session.session_id}
              className="bg-gray-800 rounded overflow-hidden flex flex-col"
            >
              {/* Browser Info Bar */}
              <div className="bg-gray-700 p-3 border-b border-gray-600">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-400">{session.device}</p>
                    <p className="text-xs text-gray-500 truncate">{state.url}</p>
                  </div>
                  <span className={`text-xs font-semibold ml-2 whitespace-nowrap ${
                    statusColor[state.status as keyof typeof statusColor] || "text-gray-400"
                  }`}>
                    {state.status}
                  </span>
                </div>

                {/* Metrics */}
                {state.metrics && (
                  <div className="flex gap-3 text-xs text-gray-400">
                    <span>FPS: {state.metrics.fps}</span>
                    <span>RTT: {state.metrics.latency}ms</span>
                  </div>
                )}
              </div>

              {/* Video */}
              <div className="flex-1 bg-black overflow-hidden">
                <video
                  ref={(el) => {
                    if (el) {
                      videoRefs.current.set(session.session_id, el);
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain"
                  style={{ cursor: "pointer" }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Status Bar */}
      <div className="bg-gray-800 border-t border-gray-700 p-4 text-sm text-gray-400">
        <span>{sessions.length} device(s)</span>
        <span className="mx-2">•</span>
        <span>
          {Array.from(sessionStates.values()).filter((s) => s.status === "connected").length} connected
        </span>
      </div>
    </div>
  );
}
