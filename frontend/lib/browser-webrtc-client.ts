/**
 * Browser WebRTC Interactive Client
 * Handles WebRTC connection, video streaming, and interactive controls for browser automation
 */

export type ConnectionState = "connecting" | "connected" | "disconnected" | "failed";
export type IceConnectionState = "new" | "checking" | "connected" | "completed" | "failed" | "disconnected" | "closed";

export interface BrowserWebRTCClientConfig {
  signalingUrl: string;
  sessionId: string;
}

export interface InteractionMessage {
  type: "click" | "keyboard" | "scroll" | "navigate";
  data: Record<string, any>;
  timestamp: number;
}

export interface StateUpdateMessage {
  type: "console" | "network" | "navigation" | "error";
  data: Record<string, any>;
  timestamp?: number;
}

export interface BrowserMetrics {
  connectionTime: number; // ms
  videoBytesReceived: number;
  videoFramesDecoded: number;
  videoFramesDropped: number;
  videoKbpsReceived: number;
  latency: number; // ms
  fps: number;
}

export class BrowserWebRTCClient {
  private config: BrowserWebRTCClientConfig;
  private ws: WebSocket | null = null;
  private pc: RTCPeerConnection | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private connectionState: ConnectionState = "disconnected";
  private iceConnectionState: IceConnectionState = "new";
  private metrics: BrowserMetrics = {
    connectionTime: 0,
    videoBytesReceived: 0,
    videoFramesDecoded: 0,
    videoFramesDropped: 0,
    videoKbpsReceived: 0,
    latency: 0,
    fps: 0,
  };

  private connectionStartTime: number = 0;
  private statsInterval: NodeJS.Timeout | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private lastStatsTime: number = 0;
  private lastFramesDecoded: number = 0;
  private frameCount: number = 0;

  // Event callbacks
  private onConnectionStateChange: ((state: ConnectionState) => void) | null = null;
  private onIceConnectionStateChange: ((state: IceConnectionState) => void) | null = null;
  private onError: ((error: Error) => void) | null = null;
  private onMetricsUpdate: ((metrics: BrowserMetrics) => void) | null = null;
  private onConsoleMessage: ((msg: any) => void) | null = null;
  private onNetworkRequest: ((req: any) => void) | null = null;
  private onNavigationChange: ((url: string) => void) | null = null;

  constructor(config: BrowserWebRTCClientConfig) {
    this.config = config;
  }

  /**
   * Connect to browser streaming session
   */
  async connect(videoElement: HTMLVideoElement): Promise<void> {
    try {
      this.videoElement = videoElement;
      this.connectionStartTime = Date.now();
      this.setConnectionState("connecting");

      // Connect to signaling WebSocket
      await this.connectSignaling();

      // Create peer connection
      this.pc = this.createPeerConnection();

      // Send offer
      await this.sendOffer();

      // Start metrics collection
      this.startMetricsCollection();

      console.log("[BrowserWebRTC] Connected and offering");
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Disconnect from browser stream
   */
  async disconnect(): Promise<void> {
    try {
      this.stopMetricsCollection();

      if (this.pc) {
        this.pc.close();
        this.pc = null;
      }

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.close();
      }

      this.setConnectionState("disconnected");
      console.log("[BrowserWebRTC] Disconnected");
    } catch (error) {
      console.error("[BrowserWebRTC] Error during disconnect:", error);
    }
  }

  /**
   * Send mouse click to browser
   */
  sendClick(x: number, y: number, button: "left" | "right" | "middle" = "left"): void {
    if (!this.dataChannel || this.dataChannel.readyState !== "open") {
      console.warn("[BrowserWebRTC] Data channel not open");
      return;
    }

    const message = JSON.stringify({
      type: "click",
      data: { x, y, button },
      timestamp: Date.now(),
    });

    this.dataChannel.send(message);
    console.log(`[BrowserWebRTC] Sent click at (${x}, ${y})`);
  }

  /**
   * Send keyboard input
   */
  sendKeyboard(key: string, shift: boolean = false, ctrl: boolean = false, alt: boolean = false): void {
    if (!this.dataChannel || this.dataChannel.readyState !== "open") {
      console.warn("[BrowserWebRTC] Data channel not open");
      return;
    }

    const message = JSON.stringify({
      type: "keyboard",
      data: { key, shift, ctrl, alt },
      timestamp: Date.now(),
    });

    this.dataChannel.send(message);
  }

  /**
   * Send scroll action
   */
  sendScroll(deltaX: number, deltaY: number): void {
    if (!this.dataChannel || this.dataChannel.readyState !== "open") {
      console.warn("[BrowserWebRTC] Data channel not open");
      return;
    }

    const message = JSON.stringify({
      type: "scroll",
      data: { deltaX, deltaY },
      timestamp: Date.now(),
    });

    this.dataChannel.send(message);
  }

  /**
   * Navigate to URL
   */
  navigate(url: string): void {
    if (!this.dataChannel || this.dataChannel.readyState !== "open") {
      console.warn("[BrowserWebRTC] Data channel not open");
      return;
    }

    const message = JSON.stringify({
      type: "navigate",
      data: { url },
      timestamp: Date.now(),
    });

    this.dataChannel.send(message);
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Get current metrics
   */
  getMetrics(): BrowserMetrics {
    return { ...this.metrics };
  }

  /**
   * Setup interaction handlers on video element
   */
  setupInteractionHandlers(videoElement: HTMLVideoElement): void {
    this.videoElement = videoElement;

    // Click handler
    videoElement.addEventListener("click", (e) => {
      const rect = videoElement.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      // Transform coordinates from display size to viewport size
      const scaleX = videoElement.videoWidth / videoElement.offsetWidth;
      const scaleY = videoElement.videoHeight / videoElement.offsetHeight;

      const actualX = Math.round(clientX * scaleX);
      const actualY = Math.round(clientY * scaleY);

      this.sendClick(actualX, actualY, "left");
    });

    // Keyboard handler
    videoElement.addEventListener("keydown", (e) => {
      // Don't capture browser shortcuts
      if (e.ctrlKey || e.metaKey) {
        return;
      }

      e.preventDefault();
      this.sendKeyboard(e.key, e.shiftKey, e.ctrlKey, e.altKey);
    });

    // Wheel/scroll handler
    videoElement.addEventListener("wheel", (e) => {
      e.preventDefault();
      this.sendScroll(0, e.deltaY);
    });

    console.log("[BrowserWebRTC] Interaction handlers setup");
  }

  /**
   * Register callback for console messages
   */
  onConsole(callback: (msg: any) => void): void {
    this.onConsoleMessage = callback;
  }

  /**
   * Register callback for network requests
   */
  onNetwork(callback: (req: any) => void): void {
    this.onNetworkRequest = callback;
  }

  /**
   * Register callback for navigation changes
   */
  onNavigation(callback: (url: string) => void): void {
    this.onNavigationChange = callback;
  }

  /**
   * Register callback for connection state changes
   */
  onConnectionStateChangeEvent(callback: (state: ConnectionState) => void): void {
    this.onConnectionStateChange = callback;
  }

  /**
   * Register callback for ICE connection state changes
   */
  onIceConnectionStateChangeEvent(callback: (state: IceConnectionState) => void): void {
    this.onIceConnectionStateChange = callback;
  }

  /**
   * Register callback for errors
   */
  onErrorEvent(callback: (error: Error) => void): void {
    this.onError = callback;
  }

  /**
   * Register callback for metrics updates
   */
  onMetricsUpdateEvent(callback: (metrics: BrowserMetrics) => void): void {
    this.onMetricsUpdate = callback;
  }

  // ============= Private Methods =============

  private async connectSignaling(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}${this.config.signalingUrl}/${this.config.sessionId}`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log("[BrowserWebRTC] WebSocket connected");
          resolve();
        };

        this.ws.onmessage = (event) => this.handleSignalingMessage(event.data);

        this.ws.onerror = (event) => {
          const error = new Error(`WebSocket error: ${event}`);
          this.handleError(error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log("[BrowserWebRTC] WebSocket closed");
          this.setConnectionState("disconnected");
        };

        // Timeout after 10 seconds
        setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            reject(new Error("WebSocket connection timeout"));
          }
        }, 10000);
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  private async handleSignalingMessage(rawData: string): Promise<void> {
    try {
      const message = JSON.parse(rawData);

      switch (message.type) {
        case "offer":
          await this.handleOffer(message);
          break;

        case "answer_ack":
          console.log("[BrowserWebRTC] Answer acknowledged");
          break;

        case "ice_ack":
          console.log("[BrowserWebRTC] ICE candidate acknowledged");
          break;

        case "error":
          this.handleError(new Error(message.message || "Unknown error"));
          break;

        default:
          console.warn(`[BrowserWebRTC] Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error("[BrowserWebRTC] Error parsing signaling message:", error);
    }
  }

  private async handleOffer(message: any): Promise<void> {
    try {
      if (!this.pc) {
        throw new Error("Peer connection not initialized");
      }

      const offer = new RTCSessionDescription({
        type: "offer",
        sdp: message.sdp,
      });

      await this.pc.setRemoteDescription(offer);
      console.log("[BrowserWebRTC] Offer received");

      // Add ICE candidates
      for (const candidate of message.ice_candidates || []) {
        try {
          const iceCandidate = new RTCIceCandidate(candidate);
          await this.pc.addIceCandidate(iceCandidate);
        } catch (e) {
          console.warn("[BrowserWebRTC] Error adding ICE candidate:", e);
        }
      }

      // Create and send answer
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(
          JSON.stringify({
            type: "answer",
            sdp: answer.sdp,
          })
        );
        console.log("[BrowserWebRTC] Answer sent");
      }
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private createPeerConnection(): RTCPeerConnection {
    const config: RTCConfiguration = {
      iceServers: [
        { urls: ["stun:stun.l.google.com:19302"] },
        { urls: ["stun:stun1.l.google.com:19302"] },
      ],
    };

    const pc = new RTCPeerConnection(config);

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(
            JSON.stringify({
              type: "ice_candidate",
              candidate: event.candidate,
            })
          );
        }
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState as ConnectionState;
      this.setConnectionState(state);
      console.log(`[BrowserWebRTC] Connection state: ${state}`);
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState as IceConnectionState;
      this.iceConnectionState = state;
      if (this.onIceConnectionStateChange) {
        this.onIceConnectionStateChange(state);
      }
      console.log(`[BrowserWebRTC] ICE state: ${state}`);
    };

    // Handle tracks
    pc.ontrack = (event) => {
      console.log("[BrowserWebRTC] Received remote track:", event.track.kind);
      if (event.track.kind === "video" && this.videoElement) {
        this.videoElement.srcObject = event.streams[0];
      }
    };

    // Setup data channel
    pc.ondatachannel = (event) => {
      this.setupDataChannel(event.channel);
    };

    console.log("[BrowserWebRTC] Peer connection created");
    return pc;
  }

  private setupDataChannel(channel: RTCDataChannel): void {
    this.dataChannel = channel;

    channel.onopen = () => {
      console.log("[BrowserWebRTC] Data channel opened");
    };

    channel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleDataChannelMessage(message);
      } catch (e) {
        console.error("[BrowserWebRTC] Error parsing data channel message:", e);
      }
    };

    channel.onclose = () => {
      console.log("[BrowserWebRTC] Data channel closed");
    };

    channel.onerror = (error) => {
      console.error("[BrowserWebRTC] Data channel error:", error);
    };
  }

  private handleDataChannelMessage(message: StateUpdateMessage): void {
    try {
      switch (message.type) {
        case "console":
          if (this.onConsoleMessage) {
            this.onConsoleMessage(message.data);
          }
          break;

        case "network":
          if (this.onNetworkRequest) {
            this.onNetworkRequest(message.data);
          }
          break;

        case "navigation":
          if (this.onNavigationChange && message.data.url) {
            this.onNavigationChange(message.data.url);
          }
          break;

        case "error":
          console.error("[BrowserWebRTC] Server error:", message.data?.message);
          break;

        default:
          console.debug("[BrowserWebRTC] Received message:", message.type);
      }
    } catch (error) {
      console.error("[BrowserWebRTC] Error handling data channel message:", error);
    }
  }

  private async sendOffer(): Promise<void> {
    if (!this.pc || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("Peer connection or WebSocket not ready");
    }

    this.ws.send(JSON.stringify({ type: "get_offer" }));
  }

  private setConnectionState(state: ConnectionState): void {
    this.connectionState = state;

    if (state === "connected") {
      this.metrics.connectionTime = Date.now() - this.connectionStartTime;
    }

    if (this.onConnectionStateChange) {
      this.onConnectionStateChange(state);
    }
  }

  private startMetricsCollection(): void {
    this.lastStatsTime = Date.now();

    this.statsInterval = setInterval(() => {
      this.updateMetrics();
    }, 1000); // Update every second
  }

  private stopMetricsCollection(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
  }

  private async updateMetrics(): Promise<void> {
    if (!this.pc) return;

    try {
      const stats = await this.pc.getStats();

      stats.forEach((report) => {
        if (report.type === "inbound-rtp" && report.kind === "video") {
          const now = Date.now();
          const timeDiff = (now - this.lastStatsTime) / 1000;

          this.metrics.videoBytesReceived = report.bytesReceived || 0;
          this.metrics.videoFramesDecoded = report.framesDecoded || 0;
          this.metrics.videoFramesDropped = report.framesDropped || 0;

          // Calculate FPS
          const framesDiff = this.metrics.videoFramesDecoded - this.lastFramesDecoded;
          if (timeDiff > 0) {
            this.metrics.fps = Math.round(framesDiff / timeDiff);
          }
          this.lastFramesDecoded = this.metrics.videoFramesDecoded;

          // Calculate bitrate
          if (timeDiff > 0) {
            this.metrics.videoKbpsReceived = Math.round((this.metrics.videoBytesReceived * 8) / 1000 / timeDiff);
          }

          this.lastStatsTime = now;
        }

        if (report.type === "candidate-pair" && report.state === "succeeded") {
          this.metrics.latency = report.currentRoundTripTime ? Math.round(report.currentRoundTripTime * 1000) : 0;
        }
      });

      if (this.onMetricsUpdate) {
        this.onMetricsUpdate(this.metrics);
      }
    } catch (error) {
      console.error("[BrowserWebRTC] Error updating metrics:", error);
    }
  }

  private handleError(error: Error): void {
    console.error("[BrowserWebRTC] Error:", error);
    if (this.onError) {
      this.onError(error);
    }
  }
}
