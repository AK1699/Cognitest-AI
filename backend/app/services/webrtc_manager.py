"""
WebRTC Session Manager for managing browser-to-backend video streaming
"""
import logging
import uuid
from typing import Optional, Dict
from aiortc import RTCPeerConnection, RTCConfiguration, RTCIceServer
from app.services.webrtc_video_track import DisplayVideoTrack

logger = logging.getLogger(__name__)


class WebRTCSession:
    """Represents a single WebRTC session between browser and backend"""

    def __init__(self, session_id: str, browser_id: str, resolution=(1280, 720)):
        self.session_id = session_id
        self.browser_id = browser_id
        self.resolution = resolution

        # Create RTCPeerConnection with ICE servers
        config = RTCConfiguration(
            iceServers=[
                RTCIceServer(urls=["stun:stun.l.google.com:19302"]),
                RTCIceServer(urls=["stun:stun1.l.google.com:19302"]),
            ]
        )

        self.peer_connection: Optional[RTCPeerConnection] = None
        self.video_track: Optional[DisplayVideoTrack] = None
        self.ice_candidates = []

        logger.info(f"📱 Created WebRTC session: {session_id} for browser {browser_id}")

    async def create_offer(self) -> dict:
        """
        Create RTCPeerConnection and generate SDP offer for the browser
        """
        try:
            # Create peer connection
            self.peer_connection = RTCPeerConnection()

            # Create and add video track
            self.video_track = DisplayVideoTrack(resolution=self.resolution)
            await self.video_track.start_capture()
            self.peer_connection.addTrack(self.video_track)

            logger.info(f"✅ Video track added to peer connection {self.session_id}")

            # Handle ICE candidates
            @self.peer_connection.on("icecandidate")
            async def on_ice_candidate(candidate):
                if candidate:
                    self.ice_candidates.append(candidate)
                    logger.debug(f"🧊 ICE candidate: {candidate.candidate}")

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
        Accept browser's answer and set remote description
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

    async def add_ice_candidate(self, candidate: dict) -> bool:
        """
        Add ICE candidate from browser
        """
        try:
            if not self.peer_connection:
                logger.error(f"No peer connection for session {self.session_id}")
                return False

            from aiortc import RTCIceCandidate

            ice_candidate = RTCIceCandidate(
                candidate=candidate.get("candidate"),
                sdpMLineIndex=candidate.get("sdpMLineIndex"),
                sdpMid=candidate.get("sdpMid"),
            )

            await self.peer_connection.addIceCandidate(ice_candidate)
            logger.debug(f"✅ Added ICE candidate for session {self.session_id}")
            return True

        except Exception as e:
            logger.error(f"❌ Failed to add ICE candidate: {e}")
            return False

    async def close(self):
        """Close WebRTC session and cleanup"""
        try:
            if self.video_track:
                await self.video_track.stop_capture()

            if self.peer_connection:
                await self.peer_connection.close()

            logger.info(f"✅ Closed WebRTC session {self.session_id}")

        except Exception as e:
            logger.error(f"❌ Error closing session: {e}")


class WebRTCSessionManager:
    """Manages all active WebRTC sessions"""

    def __init__(self):
        self.sessions: Dict[str, WebRTCSession] = {}
        logger.info("🎬 WebRTC Session Manager initialized")

    def create_session(self, browser_id: str, resolution=(1280, 720)) -> str:
        """Create a new WebRTC session"""
        session_id = str(uuid.uuid4())
        self.sessions[session_id] = WebRTCSession(session_id, browser_id, resolution)
        logger.info(f"➕ Created session {session_id}")
        return session_id

    def get_session(self, session_id: str) -> Optional[WebRTCSession]:
        """Get a WebRTC session by ID"""
        return self.sessions.get(session_id)

    async def close_session(self, session_id: str) -> bool:
        """Close and remove a WebRTC session"""
        if session_id in self.sessions:
            await self.sessions[session_id].close()
            del self.sessions[session_id]
            logger.info(f"❌ Removed session {session_id}")
            return True
        return False

    async def close_all(self):
        """Close all active WebRTC sessions"""
        for session_id in list(self.sessions.keys()):
            await self.close_session(session_id)
        logger.info("✅ Closed all WebRTC sessions")

    def get_active_sessions(self) -> int:
        """Get count of active sessions"""
        return len(self.sessions)


# Global session manager instance
webrtc_manager = WebRTCSessionManager()
