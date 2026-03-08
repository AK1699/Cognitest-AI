/**
 * WebRTC Client for local browser video streaming
 * Handles connection setup, SDP exchange, and ICE candidates
 */

import api from '@/lib/api'

export interface WebRTCConfig {
  sessionId?: string
  browserId?: string
  resolution?: [number, number]
  onVideoStream?: (stream: MediaStream) => void
  onError?: (error: Error) => void
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void
  apiUrl?: string
}

export class WebRTCLocalClient {
  private peerConnection: RTCPeerConnection | null = null
  private websocket: WebSocket | null = null
  private sessionId: string = ''
  private config: WebRTCConfig
  private isConnecting = false
  private iceCandidatesQueue: RTCIceCandidate[] = []

  private readonly API_URL = 'http://localhost:8000'
  private readonly WS_URL = 'ws://localhost:8000'

  constructor(config: WebRTCConfig = {}) {
    this.config = {
      resolution: [1280, 720],
      ...config,
    }

    console.log('🎬 WebRTC Client initialized with config:', this.config)
  }

  /**
   * Create a WebRTC session and establish connection
   */
  async connect(): Promise<void> {
    if (this.isConnecting) {
      throw new Error('Connection already in progress')
    }

    this.isConnecting = true

    try {
      // Step 1: Create session on backend
      console.log('📱 Creating WebRTC session...')
      const sessionResponse = await api.post('/api/v1/webrtc/create', {
        browser_id: this.config.browserId || `browser-${Date.now()}`,
        resolution: this.config.resolution,
      })

      this.sessionId = sessionResponse.data.session_id
      console.log('✅ Session created:', this.sessionId)

      // Step 2: Setup WebSocket for signaling
      await this.setupWebSocket()

      // Step 3: Create RTCPeerConnection
      await this.setupPeerConnection()

      // Step 4: Request offer from backend
      console.log('🎯 Requesting SDP offer from backend...')
      this.websocket?.send(JSON.stringify({ type: 'get_offer' }))

    } catch (error) {
      this.isConnecting = false
      const err = error instanceof Error ? error : new Error(String(error))
      console.error('❌ Connection failed:', err)
      this.config.onError?.(err)
      throw err
    }
  }

  /**
   * Setup WebSocket connection for SDP/ICE exchange
   */
  private async setupWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `${this.WS_URL}/api/v1/webrtc/ws/${this.sessionId}`
        console.log('🔌 Connecting to WebSocket:', wsUrl)

        this.websocket = new WebSocket(wsUrl)

        this.websocket.onopen = async () => {
          console.log('✅ WebSocket connected')
          resolve()
        }

        this.websocket.onmessage = async (event) => {
          await this.handleSignalingMessage(JSON.parse(event.data))
        }

        this.websocket.onerror = (error) => {
          console.error('❌ WebSocket error:', error)
          reject(error)
        }

        this.websocket.onclose = () => {
          console.log('🔌 WebSocket disconnected')
          this.websocket = null
        }

      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Setup RTCPeerConnection
   */
  private async setupPeerConnection(): Promise<void> {
    const config: RTCConfiguration = {
      iceServers: [
        { urls: ['stun:stun.l.google.com:19302'] },
        { urls: ['stun:stun1.l.google.com:19302'] },
      ],
    }

    this.peerConnection = new RTCPeerConnection(config)

    // Handle remote video stream
    this.peerConnection.ontrack = (event) => {
      console.log('📹 Received remote track:', event.track.kind)

      if (event.track.kind === 'video') {
        const mediaStream = new MediaStream([event.track])
        this.config.onVideoStream?.(mediaStream)
      }
    }

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState
      console.log('🔗 Connection state:', state)
      this.config.onConnectionStateChange?.(state as RTCPeerConnectionState)

      if (state === 'failed' || state === 'disconnected') {
        console.error('❌ Connection failed')
      } else if (state === 'connected') {
        console.log('✅ Connection established - video should be streaming')
        this.isConnecting = false
      }
    }

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 Generated ICE candidate')
        this.sendIceCandidate(event.candidate)
      }
    }

    this.peerConnection.onicecandidateerror = (event) => {
      console.warn('⚠️ ICE candidate error:', event.errorText)
    }

    console.log('✅ RTCPeerConnection created')
  }

  /**
   * Handle signaling messages from backend
   */
  private async handleSignalingMessage(message: any): Promise<void> {
    console.log('📨 Received signaling message:', message.type)

    switch (message.type) {
      case 'offer':
        await this.handleOffer(message)
        break

      case 'answer_ack':
        console.log('✅ Backend acknowledged our answer')
        break

      case 'ice_ack':
        console.log('✅ Backend acknowledged ICE candidate')
        break

      case 'error':
        console.error('❌ Signaling error:', message.error)
        this.config.onError?.(new Error(message.error))
        break

      default:
        console.warn('⚠️ Unknown message type:', message.type)
    }
  }

  /**
   * Handle SDP offer from backend
   */
  private async handleOffer(message: any): Promise<void> {
    if (!this.peerConnection) {
      console.error('No peer connection')
      return
    }

    try {
      const offer = new RTCSessionDescription({
        type: 'offer',
        sdp: message.sdp,
      })

      console.log('📥 Setting remote offer')
      await this.peerConnection.setRemoteDescription(offer)

      // Add any ICE candidates from the offer
      if (message.ice_candidates) {
        for (const candidate of message.ice_candidates) {
          try {
            await this.peerConnection.addIceCandidate(
              new RTCIceCandidate(candidate)
            )
            console.log('🧊 Added ICE candidate from offer')
          } catch (error) {
            console.warn('Failed to add ICE candidate:', error)
          }
        }
      }

      // Create answer
      console.log('🎯 Creating answer...')
      const answer = await this.peerConnection.createAnswer()
      await this.peerConnection.setLocalDescription(answer)

      // Send answer back to backend
      console.log('📤 Sending answer to backend')
      this.websocket?.send(
        JSON.stringify({
          type: 'answer',
          sdp: answer.sdp,
        })
      )

    } catch (error) {
      console.error('❌ Failed to handle offer:', error)
      this.config.onError?.(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Send ICE candidate to backend
   */
  private sendIceCandidate(candidate: RTCIceCandidate): void {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      console.log('⏳ WebSocket not ready, queueing ICE candidate')
      this.iceCandidatesQueue.push(candidate)
      return
    }

    try {
      this.websocket.send(
        JSON.stringify({
          type: 'ice_candidate',
          candidate: {
            candidate: candidate.candidate,
            sdpMLineIndex: candidate.sdpMLineIndex,
            sdpMid: candidate.sdpMid,
          },
        })
      )
    } catch (error) {
      console.error('Failed to send ICE candidate:', error)
    }
  }

  /**
   * Disconnect and cleanup
   */
  async disconnect(): Promise<void> {
    console.log('🔌 Disconnecting WebRTC client...')

    if (this.websocket) {
      this.websocket.close()
      this.websocket = null
    }

    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }

    if (this.sessionId) {
      try {
        await api.post(`/api/v1/webrtc/session/${this.sessionId}/close`)
      } catch (error) {
        console.warn('Failed to close session:', error)
      }
    }

    console.log('✅ Disconnected')
  }

  /**
   * Get connection statistics
   */
  async getStats(): Promise<RTCStatsReport | null> {
    if (!this.peerConnection) {
      return null
    }

    return await this.peerConnection.getStats()
  }

  /**
   * Check connection state
   */
  getConnectionState(): RTCPeerConnectionState | null {
    return this.peerConnection?.connectionState || null
  }
}
