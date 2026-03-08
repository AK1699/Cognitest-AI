/**
 * WebRTC Live Browser Preview Component
 * Real-time browser streaming with WebRTC
 * Falls back to screenshot mode if WebRTC unavailable
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import { WebRTCClient, ConnectionState, IceConnectionState, WebRTCMetrics } from "@/lib/webrtc-client";
import { AlertCircle, Play, Pause, Volume2, VolumeX, Maximize2, Minimize2 } from "lucide-react";

interface WebRTCLiveBrowserPreviewProps {
  browserSessionId: string;
  width?: number;
  height?: number;
  onConnectionChange?: (state: ConnectionState) => void;
  onFallbackToScreenshot?: () => void;
  showMetrics?: boolean;
  allowInteractions?: boolean;
}

const QUALITY_PRESETS = {
  low: { label: "Low (480p)", width: 960, height: 540 },
  medium: { label: "Medium (720p)", width: 1280, height: 720 },
  high: { label: "High (1080p)", width: 1920, height: 1080 },
} as const;

export const WebRTCLiveBrowserPreview: React.FC<WebRTCLiveBrowserPreviewProps> = ({
  browserSessionId,
  width = 1280,
  height = 720,
  onConnectionChange,
  onFallbackToScreenshot,
  showMetrics = true,
  allowInteractions = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const clientRef = useRef<WebRTCClient | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [iceConnectionState, setIceConnectionState] = useState<IceConnectionState>("new");
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<WebRTCMetrics | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<keyof typeof QUALITY_PRESETS>("medium");

  const isConnected = connectionState === "connected" || iceConnectionState === "connected";

  // Initialize WebRTC connection
  useEffect(() => {
    const initializeWebRTC = async () => {
      if (!videoRef.current) return;

      try {
        setError(null);

        const client = new WebRTCClient({
          signalingUrl: `/api/v1/webrtc`,
          browserSessionId,
        });

        clientRef.current = client;

        // Setup callbacks
        client.onConnectionStateChangeEvent((state) => {
          setConnectionState(state);
          onConnectionChange?.(state);

          if (state === "failed") {
            setError("WebRTC connection failed. Falling back to screenshot mode...");
            setTimeout(() => {
              onFallbackToScreenshot?.();
            }, 2000);
          }
        });

        client.onIceConnectionStateChangeEvent((state) => {
          setIceConnectionState(state);
        });

        client.onErrorEvent((error) => {
          console.error("[Preview] WebRTC error:", error);
          setError(error.message);
        });

        client.onMetricsUpdateEvent((updatedMetrics) => {
          setMetrics(updatedMetrics);
        });

        client.onVideoReceivedEvent(() => {
          console.log("[Preview] Video stream received");
        });

        // Connect to WebRTC server
        await client.connect(videoRef.current);
        console.log("[Preview] WebRTC client connected");
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error("[Preview] Failed to initialize WebRTC:", errorMsg);
        setError(`Failed to connect: ${errorMsg}`);

        // Fallback to screenshot mode after timeout
        setTimeout(() => {
          onFallbackToScreenshot?.();
        }, 3000);
      }
    };

    initializeWebRTC();

    return () => {
      // Cleanup on unmount
      clientRef.current?.disconnect();
    };
  }, [browserSessionId, onConnectionChange, onFallbackToScreenshot]);

  // Handle mouse interactions
  const handleMouseClick = (e: React.MouseEvent<HTMLVideoElement>) => {
    if (!allowInteractions || !isConnected || !clientRef.current) return;

    const rect = videoRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Scale to actual video resolution
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;

    clientRef.current.sendClick(x * scaleX, y * scaleY, "left");
  };

  // Handle keyboard input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!allowInteractions || !isConnected || !clientRef.current) return;

    // Don't send if modifier keys are pressed alone
    if (["Shift", "Control", "Alt", "Meta"].includes(e.key)) return;

    clientRef.current.sendKeyboard(e.key, e.shiftKey, e.ctrlKey || e.metaKey, e.altKey);
  };

  // Handle fullscreen toggle
  const handleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          (containerRef.current as any).webkitRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("[Preview] Fullscreen error:", err);
    }
  };

  // Handle quality change
  const handleQualityChange = (quality: keyof typeof QUALITY_PRESETS) => {
    setSelectedQuality(quality);
    // TODO: Implement adaptive quality - resize video and notify backend
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col bg-gray-900 rounded-lg overflow-hidden shadow-xl"
      style={{ width: isFullscreen ? "100%" : width }}
    >
      {/* Error Banner */}
      {error && (
        <div className="bg-red-900/50 border-l-4 border-red-500 p-3 flex items-center gap-2 text-red-100 text-sm">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Video Container */}
      <div className="relative flex-1 bg-black overflow-hidden" style={{ aspectRatio: "16/9" }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isMuted}
          className="w-full h-full object-contain cursor-crosshair"
          onClick={handleMouseClick}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        />

        {/* Connection Status Overlay */}
        {!isConnected && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block mb-3">
                {connectionState === "connecting" && (
                  <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                )}
                {connectionState === "failed" && <AlertCircle className="w-8 h-8 text-red-500" />}
              </div>
              <p className="text-white text-sm">
                {connectionState === "connecting" && "Connecting to browser..."}
                {connectionState === "failed" && "Connection failed"}
                {connectionState === "disconnected" && "Disconnected"}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                ICE State: {iceConnectionState}
              </p>
            </div>
          </div>
        )}

        {/* Metrics Overlay */}
        {showMetrics && metrics && isConnected && (
          <div className="absolute top-2 right-2 bg-black/70 text-green-400 text-xs p-2 rounded font-mono space-y-1 max-w-xs">
            <div>Connection: {metrics.connectionTime}ms</div>
            <div>Video: {Math.round(metrics.videoKbpsReceived)} kbps</div>
            <div>Frames: {metrics.videoFramesDecoded} decoded, {metrics.videoFramesDropped} dropped</div>
            {metrics.latency > 0 && <div>Latency: {metrics.latency.toFixed(1)}ms</div>}
          </div>
        )}

        {/* Interaction Hint */}
        {allowInteractions && isConnected && (
          <div className="absolute bottom-2 left-2 bg-black/50 text-gray-300 text-xs px-2 py-1 rounded">
            Click to interact • Type to send keys
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center justify-between">
        {/* Connection Status */}
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500" : connectionState === "connecting" ? "bg-yellow-500" : "bg-red-500"
            }`}
          />
          <span className="text-xs text-gray-400 truncate">
            {isConnected ? "Connected" : connectionState}
          </span>
        </div>

        {/* Quality Selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedQuality}
            onChange={(e) => handleQualityChange(e.target.value as keyof typeof QUALITY_PRESETS)}
            className="text-xs bg-gray-700 text-gray-200 px-2 py-1 rounded border border-gray-600 cursor-pointer"
            disabled={!isConnected}
          >
            {Object.entries(QUALITY_PRESETS).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-2">
          {/* Pause Button */}
          <button
            onClick={() => {
              setIsPaused(!isPaused);
              if (videoRef.current) {
                if (isPaused) {
                  videoRef.current.play();
                } else {
                  videoRef.current.pause();
                }
              }
            }}
            disabled={!isConnected}
            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? <Play size={16} /> : <Pause size={16} />}
          </button>

          {/* Mute Button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            disabled={!isConnected}
            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={handleFullscreen}
            disabled={!isConnected}
            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-900 px-4 py-1 text-xs text-gray-500 flex justify-between">
        <span>WebRTC Stream</span>
        <span>{width}x{height}</span>
      </div>
    </div>
  );
};

export default WebRTCLiveBrowserPreview;
