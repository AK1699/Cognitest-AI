/**
 * WebRTC Browser Integration Component
 * Manages browser streaming session lifecycle and interactions
 */

"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { WebRTCLiveBrowserPreview } from "./WebRTCLiveBrowserPreview";

interface WebRTCBrowserIntegrationProps {
  browserSessionId: string;
  browserType?: "chromium" | "firefox" | "webkit";
  device?: string;
  onStatusChange?: (status: string) => void;
  onError?: (error: string) => void;
  showMetrics?: boolean;
}

export const WebRTCBrowserIntegration: React.FC<WebRTCBrowserIntegrationProps> = ({
  browserSessionId,
  browserType = "chromium",
  device = "desktop_chrome",
  onStatusChange,
  onError,
  showMetrics = true,
}) => {
  const [status, setStatus] = useState<"initializing" | "starting" | "running" | "error" | "stopped">(
    "initializing"
  );
  const [error, setError] = useState<string | null>(null);
  const [streamingSessionId, setStreamingSessionId] = useState<string | null>(null);
  const [containerInfo, setContainerInfo] = useState<any>(null);
  const statusCallbackRef = useRef(onStatusChange);
  const errorCallbackRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    statusCallbackRef.current = onStatusChange;
    errorCallbackRef.current = onError;
  }, [onStatusChange, onError]);

  // Update status with callbacks
  const updateStatus = useCallback((newStatus: string) => {
    setStatus(newStatus as any);
    statusCallbackRef.current?.(newStatus);
  }, []);

  const reportError = useCallback((errorMsg: string) => {
    setError(errorMsg);
    errorCallbackRef.current?.(errorMsg);
  }, []);

  // Start streaming session
  const startStreaming = useCallback(async () => {
    try {
      updateStatus("starting");
      setError(null);

      console.log("[Integration] Starting WebRTC streaming...");

      // Call backend to start streaming
      const response = await fetch("/api/v1/webrtc-browser/streaming/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          browser_session_id: browserSessionId,
          browser_type: browserType,
          device: device,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("[Integration] Streaming started:", data);

      setStreamingSessionId(data.session_id);
      setContainerInfo({
        container_id: data.container_id,
        display: data.display,
        port: data.port,
      });

      updateStatus("running");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("[Integration] Failed to start streaming:", errorMsg);
      reportError(`Failed to start streaming: ${errorMsg}`);
      updateStatus("error");
    }
  }, [browserSessionId, browserType, device, updateStatus, reportError]);

  // Stop streaming session
  const stopStreaming = useCallback(async () => {
    if (!streamingSessionId) return;

    try {
      updateStatus("stopped");

      console.log("[Integration] Stopping WebRTC streaming...");

      await fetch(`/api/v1/webrtc-browser/streaming/${streamingSessionId}/stop`, {
        method: "POST",
      });

      setStreamingSessionId(null);
      setContainerInfo(null);
    } catch (err) {
      console.error("[Integration] Error stopping streaming:", err);
    }
  }, [streamingSessionId, updateStatus]);

  // Handle WebRTC connection failure - fallback to screenshot
  const handleWebRTCFallback = useCallback(async () => {
    console.log("[Integration] WebRTC failed, fallback triggered");
    // TODO: Switch to screenshot mode
    // This would typically dispatch an action to switch components
  }, []);

  // Start streaming on mount
  useEffect(() => {
    startStreaming();

    return () => {
      // Stop streaming on unmount
      stopStreaming();
    };
  }, [startStreaming, stopStreaming]);

  if (status === "initializing" || status === "starting") {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded-lg">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-white text-sm">
            {status === "initializing" ? "Initializing..." : "Starting streaming..."}
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Creating container and establishing connection
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded-lg p-4">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <p className="text-white text-sm font-semibold">Connection Failed</p>
          <p className="text-gray-400 text-xs mt-2">{error || "Unknown error occurred"}</p>
          <button
            onClick={startStreaming}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (status === "running" && streamingSessionId) {
    return (
      <WebRTCLiveBrowserPreview
        browserSessionId={browserSessionId}
        width={1280}
        height={720}
        showMetrics={showMetrics}
        allowInteractions={true}
        onConnectionChange={(state) => {
          console.log("[Integration] WebRTC connection state:", state);
        }}
        onFallbackToScreenshot={handleWebRTCFallback}
      />
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded-lg">
      <p className="text-gray-400 text-sm">Streaming stopped</p>
    </div>
  );
};

export default WebRTCBrowserIntegration;
