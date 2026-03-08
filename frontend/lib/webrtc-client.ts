/**
 * WebRTC Browser Streaming Client
 * Handles WebRTC peer connection, SDP signaling, and video streaming
 * for remote browser automation
 */

export type ConnectionState = "connecting" | "connected" | "disconnected" | "failed";
export type IceConnectionState = "new" | "checking" | "connected" | "completed" | "failed" | "disconnected" | "closed";

export interface WebRTCClientConfig {
  signalingUrl: string;
  browserSessionId: string;
  stunServers?: string[];
  turnServers?: string[];
  turnUsername?: string;
  turnPassword?: string;
}

export interface WebRTCSessionInfo {
  sessionId: string;
  stunServers: string[];
  turnServers: string[];
  turnUsername: string;
  turnPassword: string;
  iceTransportPolicy: string;
}

export interface WebRTCMetrics {
  connectionTime: number; // ms
  videoBytesReceived: number;
  videoFramesDecoded: number;
  videoFramesDropped: number;
  videoKbpsReceived: number;
  latency: number; // ms
  audioLevel?: number;
}

export class WebRTCClient {
  private config: WebRTCClientConfig;
  private ws: WebSocket | null = null;
  private pc: RTCPeerConnection | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private sessionInfo: WebRTCSessionInfo | null = null;
  private connectionState: ConnectionState = "disconnected";
  private iceConnectionState: IceConnectionState = "new";
  private metrics: WebRTCMetrics = {
    connectionTime: 0,
    videoBytesReceived: 0,
    videoFramesDecoded: 0,
    videoFramesDropped: 0,
    videoKbpsReceived: 0,
    latency: 0,
  };

  private connectionStartTime: number = 0;
  private statsInterval: NodeJS.Timeout | null = null;
  private dataChannel: RTCDataChannel | null = null;

  // Event callbacks
  private onConnectionStateChange: ((state: ConnectionState) => void) | null = null;
  private onIceConnectionStateChange: ((state: IceConnectionState) => void) | null = null;
  private onError: ((error: Error) => void) | null = null;
  private onMetricsUpdate: ((metrics: WebRTCMetrics) => void) | null = null;
  private onVideoReceived: (() => void) | null = null;

  constructor(config: WebRTCClientConfig) {
    this.config = {
      stunServers: [],
      turnServers: [],
      ...config,
    };
  }

  /**
   * Connect to WebRTC signaling server
   */
  async connect(videoElement: HTMLVideoElement): Promise<void> {
    try {
      this.videoElement = videoElement;
      this.connectionStartTime = Date.now();
      this.setConnectionState("connecting");

      // Connect to signaling WebSocket
      await this.connectSignaling();

      // Wait for session info
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Session creation timeout")), 5000);
        const originalCallback = this.onError;

        const waitForSession = () => {
          if (this.sessionInfo) {
            clearTimeout(timeout);
            resolve();
            this.onError = originalCallback;
          } else {
            setTimeout(waitForSession, 100);
          }
        };

        this.onError = (error) => {
          clearTimeout(timeout);
          reject(error);
          if (originalCallback) originalCallback(error);
        };

        waitForSession();
      });

      // Create peer connection
      this.pc = this.createPeerConnection();

      // Send offer
      await this.sendOffer();

      // Start metrics collection
      this.startMetricsCollection();

      console.log("[WebRTC] Connected and offering");
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Disconnect from WebRTC stream
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
      console.log("[WebRTC] Disconnected");
    } catch (error) {
      console.error("[WebRTC] Error during disconnect:", error);
    }
  }

  /**
   * Send mouse click to browser
   */
  async sendClick(x: number, y: number, button: "left" | "right" | "middle" = "left"): Promise<void> {
    this.ensureDataChannel();

    const message = JSON.stringify({
      type: "click",
      x,
      y,
      button,
      timestamp: Date.now(),
    });

    this.dataChannel?.send(message);
    console.log(`[WebRTC] Sent click at (${x}, ${y})`);
  }

  /**
   * Send keyboard input
   */
  async sendKeyboard(key: string, shift: boolean = false, ctrl: boolean = false, alt: boolean = false): Promise<void> {
    this.ensureDataChannel();

    const message = JSON.stringify({
      type: "keyboard",
      key,
      shift,
      ctrl,
      alt,
      timestamp: Date.now(),
    });

    this.dataChannel?.send(message);
  }

  /**
   * Send scroll action
   */
  async sendScroll(deltaX: number, deltaY: number): Promise<void> {
    this.ensureDataChannel();

    const message = JSON.stringify({
      type: "scroll",
      deltaX,
      deltaY,
      timestamp: Date.now(),
    });

    this.dataChannel?.send(message);
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
  getMetrics(): WebRTCMetrics {
    return { ...this.metrics };
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
  onMetricsUpdateEvent(callback: (metrics: WebRTCMetrics) => void): void {
    this.onMetricsUpdate = callback;
  }

  /**
   * Register callback for when video is first received
   */
  onVideoReceivedEvent(callback: () => void): void {
    this.onVideoReceived = callback;
  }

  // ============= Private Methods =============

  private async connectSignaling(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/api/v1/webrtc/ws/streaming/${this.config.browserSessionId}`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log("[WebRTC] WebSocket connected");
          resolve();
        };

        this.ws.onmessage = (event) => this.handleSignalingMessage(event.data);

        this.ws.onerror = (event) => {
          const error = new Error(`WebSocket error: ${event}`);
          this.handleError(error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log("[WebRTC] WebSocket closed");
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
        case "session-created":
          this.handleSessionCreated(message.data);
          break;

        case "answer":
          await this.handleAnswer(message.data);
          break;

        case "ice-candidate":
          await this.handleIceCandidate(message.data);
          break;

        case "error":
          this.handleError(new Error(message.data?.message || "Unknown error"));
          break;

        default:
          console.warn(`[WebRTC] Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error("[WebRTC] Error parsing signaling message:", error);
    }
  }

  private handleSessionCreated(data: any): void {
    this.sessionInfo = {
      sessionId: data.session_id,
      stunServers: data.stun_servers || [],
      turnServers: data.turn_servers || [],
      turnUsername: data.turn_username || "",
      turnPassword: data.turn_password || "",
      iceTransportPolicy: "all",
    };

    console.log("[WebRTC] Session created:", data.session_id);
  }

  private async handleAnswer(data: any): Promise<void> {
    if (!this.pc) {
      console.error("[WebRTC] Peer connection not initialized");
      return;
    }

    try {
      const answer = new RTCSessionDescription({
        type: "answer",
        sdp: data.sdp,
      });

      await this.pc.setRemoteDescription(answer);
      console.log("[WebRTC] Answer received and set");
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async handleIceCandidate(data: any): Promise<void> {
    if (!this.pc) {
      console.error("[WebRTC] Peer connection not initialized");
      return;
    }

    try {
      const candidate = new RTCIceCandidate({
        candidate: data.candidate,
        sdpMid: data.sdpMid,
        sdpMLineIndex: data.sdpMLineIndex,
      });

      await this.pc.addIceCandidate(candidate);
      console.log("[WebRTC] ICE candidate added");
    } catch (error) {
      console.warn("[WebRTC] Error adding ICE candidate:", error);
    }
  }

  private createPeerConnection(): RTCPeerConnection {
    const config: RTCConfiguration = {
      iceServers: [],
    };

    // Add STUN servers
    if (this.sessionInfo?.stunServers.length) {
      config.iceServers!.push({
        urls: this.sessionInfo.stunServers,
      });
    }

    // Add TURN servers
    if (this.sessionInfo?.turnServers.length) {
      config.iceServers!.push({
        urls: this.sessionInfo.turnServers,
        username: this.sessionInfo.turnUsername,
        credential: this.sessionInfo.turnPassword,
      });
    }

    const pc = new RTCPeerConnection(config);

    // Handle incoming tracks
    pc.ontrack = (event) => {
      console.log(`[WebRTC] Track received: ${event.track.kind}`);

      if (event.track.kind === "video" && this.videoElement) {
        this.videoElement.srcObject = event.streams[0];
        this.onVideoReceived?.();
      }
    };

    // Handle ICE connection state change
    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState as IceConnectionState;
      this.setIceConnectionState(state);

      if (state === "connected" || state === "completed") {
        this.setConnectionState("connected");
      } else if (state === "disconnected") {
        this.setConnectionState("disconnected");
      } else if (state === "failed") {
        this.setConnectionState("failed");
        this.handleError(new Error("ICE connection failed"));
      }
    };

    // Handle connection state change
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState as ConnectionState;
      this.setConnectionState(state);

      if (state === "failed") {
        this.handleError(new Error("Peer connection failed"));
      }
    };

    // Create data channel for interactions
    this.dataChannel = pc.createDataChannel("interactions", {
      ordered: true,
    });
    this.setupDataChannel(this.dataChannel);

    // Handle incoming data channels (server initiated)
    pc.ondatachannel = (event) => {
      console.log("[WebRTC] Data channel received");
      this.setupDataChannel(event.channel);
    };

    return pc;
  }

  private setupDataChannel(dc: RTCDataChannel): void {
    dc.onopen = () => {
      console.log(`[WebRTC] Data channel opened`);
    };

    dc.onclose = () => {
      console.log(`[WebRTC] Data channel closed`);
    };

    dc.onerror = (event) => {
      console.error("[WebRTC] Data channel error:", event);
    };

    dc.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("[WebRTC] Data channel message:", message);
        // Handle server-sent messages (e.g., console logs, network events)
      } catch (error) {
        console.warn("[WebRTC] Error parsing data channel message:", error);
      }
    };
  }

  private async sendOffer(): Promise<void> {
    if (!this.pc) {
      throw new Error("Peer connection not initialized");
    }

    try {
      const offer = await this.pc.createOffer({
        offerToReceiveVideo: true,
        offerToReceiveAudio: false,
      });

      await this.pc.setLocalDescription(offer);

      this.sendSignalingMessage({
        type: "offer",
        data: {
          sdp: offer.sdp,
        },
      });

      console.log("[WebRTC] Offer created and sent");
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  private sendSignalingMessage(message: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error("[WebRTC] WebSocket not connected");
      return;
    }

    // When ICE candidates become available, send them
    if (this.pc) {
      this.pc.onicecandidate = (event) => {
        if (event.candidate) {
          this.sendSignalingMessage({
            type: "ice-candidate",
            data: {
              candidate: event.candidate.candidate,
              sdpMid: event.candidate.sdpMid,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
            },
          });
        }
      };
    }

    this.ws.send(JSON.stringify(message));
  }

  private startMetricsCollection(): void {
    this.stopMetricsCollection();

    this.statsInterval = setInterval(async () => {
      if (!this.pc) return;

      try {
        const stats = await this.pc.getStats();
        let videoStats: any = null;

        stats.forEach((report) => {
          if (report.type === "inbound-rtp" && report.kind === "video") {
            videoStats = report;
          }
        });

        if (videoStats) {
          const kbps = (videoStats.bytesReceived * 8) / 1000;
          this.metrics = {
            connectionTime: Date.now() - this.connectionStartTime,
            videoBytesReceived: videoStats.bytesReceived,
            videoFramesDecoded: videoStats.framesDecoded,
            videoFramesDropped: videoStats.framesDropped,
            videoKbpsReceived: kbps,
            latency: videoStats.jitter ? videoStats.jitter * 1000 : 0,
          };

          this.onMetricsUpdate?.(this.metrics);
        }
      } catch (error) {
        console.warn("[WebRTC] Error collecting metrics:", error);
      }
    }, 1000); // Update every second
  }

  private stopMetricsCollection(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
  }

  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.onConnectionStateChange?.(state);
      console.log(`[WebRTC] Connection state: ${state}`);
    }
  }

  private setIceConnectionState(state: IceConnectionState): void {
    if (this.iceConnectionState !== state) {
      this.iceConnectionState = state;
      this.onIceConnectionStateChange?.(state);
      console.log(`[WebRTC] ICE connection state: ${state}`);
    }
  }

  private handleError(error: Error): void {
    console.error("[WebRTC] Error:", error);
    this.onError?.(error);
  }

  private ensureDataChannel(): void {
    if (!this.dataChannel || this.dataChannel.readyState !== "open") {
      console.warn("[WebRTC] Data channel not ready for sending");
    }
  }
}
