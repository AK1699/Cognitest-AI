"""
Unified WebRTC Session Manager for browser streaming with interactive controls
Integrates BrowserSession (Playwright) + BrowserVideoTrack + RTCPeerConnection
"""
import asyncio
import json
import logging
import uuid
from typing import Optional, Dict, Callable, Any
from enum import Enum
from aiortc import RTCPeerConnection, RTCConfiguration, RTCIceServer
from app.services.browser_webrtc_track import BrowserVideoTrack
from app.services.browser_session_service import BrowserSession, SessionStatus

logger = logging.getLogger(__name__)


class BrowserWebRTCSessionStatus(str, Enum):
    """Status of a browser WebRTC session"""
    LAUNCHING = "launching"
    ACTIVE = "active"
    CLOSED = "closed"
    ERROR = "error"


class BrowserWebRTCSession:
    """
    Unified session combining Playwright browser automation with WebRTC streaming and interactive controls.

    Flow:
    1. Launch BrowserSession (Playwright)
    2. Create BrowserVideoTrack linked to session screenshots
    3. Create RTCPeerConnection with video track + data channel
    4. Setup data channel for interactions (click, keyboard, scroll, navigate)
    5. Setup state forwarding (console, network, navigation)
    """

    def __init__(
        self,
        session_id: str,
        url: str,
        device: str = "desktop_chrome",
        fps: int = 30,
        resolution: tuple = (1280, 720),
    ):
        self.session_id = session_id
        self.url = url
        self.device = device
        self.fps = fps
        self.resolution = resolution
        self.status = BrowserWebRTCSessionStatus.LAUNCHING

        # Components
        self.browser_session: Optional[BrowserSession] = None
        self.video_track: Optional[BrowserVideoTrack] = None
        self.peer_connection: Optional[RTCPeerConnection] = None
        self.data_channel: Optional[Any] = None

        # Event callbacks
        self.on_interaction: Optional[Callable[[Dict[str, Any]], None]] = None
        self.on_state_update: Optional[Callable[[Dict[str, Any]], None]] = None

        # ICE candidates
        self.ice_candidates = []

        logger.info(f"📱 Created BrowserWebRTCSession: {session_id} for {url} on {device}")

    async def initialize(self) -> bool:
        """
        Initialize the browser session and connect all components.

        Returns:
            True if successful, False otherwise
        """
        try:
            # 1. Create BrowserSession (Playwright)
            logger.info(f"🚀 Launching browser session {self.session_id}...")

            self.browser_session = BrowserSession(
                session_id=self.session_id,
                on_update=self._on_browser_update,
                device=self.device,
                headless=True,
            )

            # 2. Create BrowserVideoTrack and link it
            self.video_track = BrowserVideoTrack(resolution=self.resolution, fps=self.fps)
            await self.video_track.start()

            # Link screenshot emitter to video track
            self.browser_session.frame_emitter = self.video_track.emit_frame

            # 3. Launch browser
            success = await self.browser_session.launch(initial_url=self.url)
            if not success:
                logger.error(f"❌ Failed to launch browser session {self.session_id}")
                self.status = BrowserWebRTCSessionStatus.ERROR
                return False

            # 4. Create RTCPeerConnection
            config = RTCConfiguration(
                iceServers=[
                    RTCIceServer(urls=["stun:stun.l.google.com:19302"]),
                    RTCIceServer(urls=["stun:stun1.l.google.com:19302"]),
                ]
            )
            self.peer_connection = RTCPeerConnection(configuration=config)

            # Add video track
            self.peer_connection.addTrack(self.video_track)
            logger.info(f"✅ Video track added to peer connection")

            # 5. Setup data channel for interactions
            self._setup_data_channel()

            # 6. Setup ICE candidate handler
            @self.peer_connection.on("icecandidate")
            async def on_ice_candidate(candidate):
                if candidate:
                    self.ice_candidates.append(candidate)
                    logger.debug(f"🧊 ICE candidate: {candidate.candidate}")

            self.status = BrowserWebRTCSessionStatus.ACTIVE
            logger.info(f"✅ BrowserWebRTCSession {self.session_id} initialized")
            return True

        except Exception as e:
            logger.error(f"❌ Failed to initialize session {self.session_id}: {e}")
            self.status = BrowserWebRTCSessionStatus.ERROR
            await self.close()
            return False

    async def create_offer(self) -> Dict[str, Any]:
        """
        Create WebRTC offer with SDP and ICE candidates.

        Returns:
            Dictionary with type, sdp, and ice_candidates
        """
        try:
            if not self.peer_connection:
                raise RuntimeError("Peer connection not initialized")

            # Generate offer
            offer = await self.peer_connection.createOffer()
            await self.peer_connection.setLocalDescription(offer)

            logger.info(f"🎯 Created offer for session {self.session_id}")

            return {
                "type": "offer",
                "sdp": self.peer_connection.localDescription.sdp,
                "ice_candidates": [
                    {
                        "candidate": c.candidate,
                        "sdpMLineIndex": c.sdpMLineIndex,
                        "sdpMid": c.sdpMid,
                    }
                    for c in self.ice_candidates
                ],
            }

        except Exception as e:
            logger.error(f"❌ Failed to create offer: {e}")
            raise

    async def set_answer(self, answer_sdp: str) -> bool:
        """
        Accept browser's answer and set remote description.

        Args:
            answer_sdp: SDP answer from browser client

        Returns:
            True if successful
        """
        try:
            if not self.peer_connection:
                logger.error(f"No peer connection for session {self.session_id}")
                return False

            from aiortc import RTCSessionDescription

            answer = RTCSessionDescription(sdp=answer_sdp, type="answer")
            await self.peer_connection.setRemoteDescription(answer)

            logger.info(f"✅ Remote description set for session {self.session_id}")
            return True

        except Exception as e:
            logger.error(f"❌ Failed to set answer: {e}")
            return False

    async def add_ice_candidate(self, candidate: Dict[str, Any]) -> bool:
        """
        Add ICE candidate from browser client.

        Args:
            candidate: ICE candidate dictionary

        Returns:
            True if successful
        """
        try:
            if not self.peer_connection:
                logger.error(f"No peer connection for session {self.session_id}")
                return False

            from aiortc import RTCIceCandidate

            candidate_str = candidate.get("candidate", "")
            if not candidate_str:
                return False

            # Parse candidate string
            parts = candidate_str.split()
            if len(parts) < 8:
                logger.warning(f"Invalid candidate format: {candidate_str}")
                return False

            try:
                foundation = parts[0].split(":")[1]
                component = int(parts[1])
                protocol = parts[2].upper()
                priority = int(parts[3])
                ip = parts[4]
                port = int(parts[5])
                cand_type = parts[7]

                related_address = None
                related_port = None
                tcp_type = None

                for i in range(8, len(parts) - 1, 2):
                    if parts[i] == "raddr":
                        related_address = parts[i + 1]
                    elif parts[i] == "rport":
                        related_port = int(parts[i + 1])
                    elif parts[i] == "tcptype":
                        tcp_type = parts[i + 1]

                ice_candidate = RTCIceCandidate(
                    component=component,
                    foundation=foundation,
                    ip=ip,
                    port=port,
                    priority=priority,
                    protocol=protocol,
                    type=cand_type,
                    tcpType=tcp_type,
                    relatedAddress=related_address,
                    relatedPort=related_port,
                )

                await self.peer_connection.addIceCandidate(ice_candidate)
                logger.debug(f"✅ ICE candidate added")
                return True

            except (ValueError, IndexError) as parse_error:
                logger.warning(f"Failed to parse candidate: {parse_error}")
                return False

        except Exception as e:
            logger.error(f"❌ Failed to add ICE candidate: {e}")
            return False

    def _setup_data_channel(self) -> None:
        """Setup data channel for interactions and state updates"""
        if not self.peer_connection:
            logger.error("No peer connection to setup data channel")
            return

        # Create data channel for interactions
        self.data_channel = self.peer_connection.createDataChannel("interactions")

        @self.data_channel.on("message")
        async def on_message(message: str):
            try:
                data = json.loads(message)
                await self._handle_interaction(data)
            except Exception as e:
                logger.error(f"Error handling data channel message: {e}")

        @self.data_channel.on("open")
        async def on_open():
            logger.info(f"✅ Data channel opened for session {self.session_id}")

        @self.data_channel.on("close")
        async def on_close():
            logger.info(f"❌ Data channel closed for session {self.session_id}")

        logger.info(f"✅ Data channel setup complete")

    async def _handle_interaction(self, data: Dict[str, Any]) -> None:
        """
        Handle interaction message from frontend.

        Protocol:
        - click: {"type": "click", "data": {"x": int, "y": int, "button": str}}
        - keyboard: {"type": "keyboard", "data": {"key": str, "shift": bool, "ctrl": bool, "alt": bool}}
        - scroll: {"type": "scroll", "data": {"deltaX": int, "deltaY": int}}
        - navigate: {"type": "navigate", "data": {"url": str}}
        """
        if not self.browser_session or not self.browser_session.page:
            logger.error("Browser session not ready")
            return

        try:
            message_type = data.get("type")
            message_data = data.get("data", {})

            if message_type == "click":
                x = message_data.get("x", 0)
                y = message_data.get("y", 0)
                button = message_data.get("button", "left")
                logger.debug(f"Click: ({x}, {y}) button={button}")
                await self.browser_session.click_at_point(x, y, button)

            elif message_type == "keyboard":
                key = message_data.get("key", "")
                # For regular characters, type them; for special keys, handle via keyboard object
                if len(key) == 1 or key in ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter", "Backspace", "Tab"]:
                    logger.debug(f"Keyboard: key={key}")
                    await self.browser_session.page.keyboard.press(key)
                else:
                    # For text input
                    logger.debug(f"Type text: {key}")
                    await self.browser_session.type_text(key)

            elif message_type == "scroll":
                deltaX = message_data.get("deltaX", 0)
                deltaY = message_data.get("deltaY", 0)
                logger.debug(f"Scroll: ({deltaX}, {deltaY})")
                # Convert deltaX/deltaY to direction and amount
                if deltaY > 0:
                    await self.browser_session.scroll_page("down", int(deltaY))
                elif deltaY < 0:
                    await self.browser_session.scroll_page("up", int(-deltaY))
                if deltaX > 0:
                    await self.browser_session.scroll_page("right", int(deltaX))
                elif deltaX < 0:
                    await self.browser_session.scroll_page("left", int(-deltaX))

            elif message_type == "navigate":
                url = message_data.get("url", "")
                if url:
                    logger.debug(f"Navigate: {url}")
                    await self.browser_session.navigate(url)

            else:
                logger.warning(f"Unknown interaction type: {message_type}")

            if self.on_interaction:
                self.on_interaction(data)

        except Exception as e:
            logger.error(f"Error handling interaction: {e}")
            # Send error back through data channel
            if self.data_channel and self.data_channel.readyState == "open":
                try:
                    error_msg = json.dumps({
                        "type": "error",
                        "data": {"message": str(e)},
                        "timestamp": asyncio.get_event_loop().time()
                    })
                    self.data_channel.send(error_msg)
                except Exception as send_error:
                    logger.error(f"Failed to send error message: {send_error}")

    def _on_browser_update(self, update: Dict[str, Any]) -> None:
        """
        Callback from BrowserSession for console, network, navigation updates.
        Forward to frontend via data channel.

        Args:
            update: Update dictionary from browser session
        """
        try:
            if not self.data_channel or self.data_channel.readyState != "open":
                return

            update_type = update.get("type")

            # Forward specific update types to frontend
            if update_type in ["console", "network", "navigation", "error"]:
                message = json.dumps(update)
                self.data_channel.send(message)

        except Exception as e:
            logger.error(f"Error forwarding browser update: {e}")

    async def close(self) -> None:
        """Close the session and cleanup all resources"""
        try:
            logger.info(f"🔴 Closing BrowserWebRTCSession {self.session_id}")

            # Stop video track
            if self.video_track:
                await self.video_track.stop()

            # Close data channel
            if self.data_channel and self.data_channel.readyState == "open":
                self.data_channel.close()

            # Close peer connection
            if self.peer_connection:
                await self.peer_connection.close()

            # Close browser session
            if self.browser_session:
                await self.browser_session.close()

            self.status = BrowserWebRTCSessionStatus.CLOSED
            logger.info(f"✅ BrowserWebRTCSession {self.session_id} closed")

        except Exception as e:
            logger.error(f"Error closing session: {e}")
            self.status = BrowserWebRTCSessionStatus.ERROR


class BrowserWebRTCSessionManager:
    """Manager for multiple browser WebRTC sessions"""

    def __init__(self):
        self.sessions: Dict[str, BrowserWebRTCSession] = {}
        logger.info("🎯 Initialized BrowserWebRTCSessionManager")

    async def create_session(
        self,
        url: str,
        device: str = "desktop_chrome",
        fps: int = 30,
        resolution: tuple = (1280, 720),
    ) -> str:
        """
        Create a new browser WebRTC session.

        Args:
            url: Initial URL to navigate to
            device: Device preset (desktop_chrome, iphone_14, etc.)
            fps: Frames per second for video stream (15-30)
            resolution: Video resolution (width, height)

        Returns:
            Session ID
        """
        try:
            session_id = str(uuid.uuid4())
            session = BrowserWebRTCSession(
                session_id=session_id,
                url=url,
                device=device,
                fps=fps,
                resolution=resolution,
            )

            # Initialize session
            success = await session.initialize()
            if not success:
                raise RuntimeError(f"Failed to initialize session {session_id}")

            self.sessions[session_id] = session
            logger.info(f"✅ Created browser WebRTC session {session_id}")
            return session_id

        except Exception as e:
            logger.error(f"❌ Failed to create session: {e}")
            raise

    def get_session(self, session_id: str) -> Optional[BrowserWebRTCSession]:
        """Get session by ID"""
        return self.sessions.get(session_id)

    async def close_session(self, session_id: str) -> bool:
        """
        Close a session by ID.

        Args:
            session_id: Session ID to close

        Returns:
            True if successful
        """
        try:
            session = self.sessions.get(session_id)
            if not session:
                logger.warning(f"Session {session_id} not found")
                return False

            await session.close()
            del self.sessions[session_id]
            logger.info(f"✅ Closed session {session_id}")
            return True

        except Exception as e:
            logger.error(f"Error closing session {session_id}: {e}")
            return False

    async def close_all(self) -> None:
        """Close all active sessions"""
        try:
            logger.info(f"🔴 Closing all {len(self.sessions)} sessions...")
            for session_id in list(self.sessions.keys()):
                await self.close_session(session_id)
            logger.info(f"✅ All sessions closed")
        except Exception as e:
            logger.error(f"Error closing all sessions: {e}")


# Global instance
browser_webrtc_session_manager = BrowserWebRTCSessionManager()
