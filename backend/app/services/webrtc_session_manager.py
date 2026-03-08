"""
WebRTC Session Manager for Browser Streaming
Manages WebRTC peer connections and video track streaming from browsers
"""
import asyncio
import logging
import uuid
from typing import Dict, Optional, Callable, Any
from dataclasses import dataclass, field
from datetime import datetime
import subprocess
import time

from aiortc import RTCPeerConnection, RTCSessionDescription, VideoStreamTrack
from aiortc.contrib.media import MediaBlackhole
import av

from app.core.webrtc_config import webrtc_config

logger = logging.getLogger(__name__)


@dataclass
class WebRTCSession:
    """Represents an active WebRTC session"""
    session_id: str
    pc: RTCPeerConnection  # Peer connection
    video_track: Optional['BrowserVideoTrack'] = None
    created_at: datetime = field(default_factory=datetime.now)
    last_activity: datetime = field(default_factory=datetime.now)
    connection_established: bool = False
    error: Optional[str] = None

    @property
    def is_idle(self) -> bool:
        """Check if session is idle (no activity for timeout period)"""
        elapsed = (datetime.now() - self.last_activity).total_seconds()
        return elapsed > webrtc_config.WEBRTC_IDLE_TIMEOUT


class BrowserVideoTrack(VideoStreamTrack):
    """
    Custom VideoStreamTrack that captures frames from browser display via FFmpeg
    Reads H.264 encoded frames from FFmpeg pipe and streams over WebRTC
    """

    def __init__(self, display: str = ":99", width: int = 1280, height: int = 720):
        """
        Initialize video track for browser display streaming

        Args:
            display: X11 display ID (e.g., ":99")
            width: Video width in pixels
            height: Video height in pixels
        """
        super().__init__()

        self.display = display
        self.width = width
        self.height = height
        self.fps = webrtc_config.VIDEO_FPS
        self.ffmpeg_process: Optional[subprocess.Popen] = None
        self.frame_count = 0
        self.last_frame_time = time.time()

        # Create container for reading H.264 frames
        self.container = None
        self.stream = None

        # Start FFmpeg process
        self._start_ffmpeg()

    def _start_ffmpeg(self):
        """Start FFmpeg process to capture display and encode to H.264"""
        try:
            # FFmpeg command to capture Xvfb display and encode to H.264
            cmd = [
                "ffmpeg",
                "-f", webrtc_config.FFMPEG_CAPTURE_METHOD,
                "-framerate", str(self.fps),
                "-video_size", f"{self.width}x{self.height}",
                "-i", f"{self.display}.0",
                "-c:v", "libx264",
                "-preset", webrtc_config.FFMPEG_PRESET,
                "-crf", "28",
                "-maxrate", f"{webrtc_config.VIDEO_BITRATE}k",
                "-bufsize", f"{webrtc_config.VIDEO_BITRATE * 1.5}k",
                "-r", str(self.fps),
                "-pix_fmt", "yuv420p",
                "-f", "h264",
                "pipe:1",
            ]

            logger.info(f"Starting FFmpeg: {' '.join(cmd)}")

            self.ffmpeg_process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                bufsize=webrtc_config.FFMPEG_PIPE_SIZE,
            )

            # Open the output stream using pyav
            self.container = av.open(
                self.ffmpeg_process.stdout,
                format="h264",
                options={"video_size": f"{self.width}x{self.height}"},
            )
            self.stream = self.container.streams.video[0]

            logger.info(f"FFmpeg process started (PID: {self.ffmpeg_process.pid})")

        except FileNotFoundError:
            error_msg = "FFmpeg not found. Ensure FFmpeg is installed and in PATH"
            logger.error(error_msg)
            raise RuntimeError(error_msg)
        except Exception as e:
            logger.error(f"Failed to start FFmpeg: {e}")
            raise

    async def recv(self):
        """
        Receive next frame from browser display
        This is called by aiortc to get video frames for streaming
        """
        try:
            # Read next frame from FFmpeg
            if self.container is None:
                raise RuntimeError("Container not initialized")

            for frame in self.container.decode(self.stream):
                # Rebase timestamp to current time for proper sync
                frame.pts = None

                self.frame_count += 1

                # Log frame count periodically
                if self.frame_count % 100 == 0:
                    elapsed = time.time() - self.last_frame_time
                    fps = 100 / elapsed if elapsed > 0 else 0
                    logger.debug(f"Video track: {self.frame_count} frames, ~{fps:.1f} FPS")
                    self.last_frame_time = time.time()

                return frame

            # If no frame available, wait and retry
            await asyncio.sleep(1 / self.fps)
            return await self.recv()

        except Exception as e:
            logger.error(f"Error receiving video frame: {e}")
            raise

    async def stop(self):
        """Stop video capture and clean up resources"""
        await super().stop()

        if self.ffmpeg_process:
            try:
                self.ffmpeg_process.terminate()
                await asyncio.sleep(0.1)
                if self.ffmpeg_process.poll() is None:
                    self.ffmpeg_process.kill()
                logger.info("FFmpeg process terminated")
            except Exception as e:
                logger.error(f"Error terminating FFmpeg: {e}")

        if self.container:
            try:
                self.container.close()
            except Exception as e:
                logger.error(f"Error closing container: {e}")


class WebRTCSessionManager:
    """
    Manages WebRTC sessions and peer connections
    Handles session lifecycle, signaling, and video track management
    """

    def __init__(self):
        """Initialize session manager"""
        self.sessions: Dict[str, WebRTCSession] = {}
        self._cleanup_task: Optional[asyncio.Task] = None
        self._lock = asyncio.Lock()

    async def create_session(
        self,
        browser_session_id: str,
        on_state_change: Optional[Callable[[str, str], Any]] = None,
    ) -> str:
        """
        Create a new WebRTC session for a browser

        Args:
            browser_session_id: Browser session ID to attach
            on_state_change: Callback when connection state changes

        Returns:
            WebRTC session ID
        """
        async with self._lock:
            session_id = str(uuid.uuid4())

            # Create peer connection
            pc = RTCPeerConnection()

            # Setup connection state change handler
            if on_state_change:
                @pc.on("connectionstatechange")
                async def on_connection_state_change():
                    await on_state_change(session_id, pc.connectionState)

            # Create video track (captures from Xvfb display)
            try:
                video_track = BrowserVideoTrack()
                pc.addTrack(video_track)
                logger.info(f"Added video track to peer connection {session_id}")
            except Exception as e:
                logger.error(f"Failed to create video track: {e}")
                video_track = None

            # Create session
            session = WebRTCSession(
                session_id=session_id,
                pc=pc,
                video_track=video_track,
            )

            self.sessions[session_id] = session

            logger.info(
                f"Created WebRTC session {session_id} for browser {browser_session_id}"
            )

            return session_id

    async def get_session(self, session_id: str) -> Optional[WebRTCSession]:
        """Get WebRTC session by ID"""
        return self.sessions.get(session_id)

    async def handle_offer(
        self, session_id: str, offer: RTCSessionDescription
    ) -> Optional[RTCSessionDescription]:
        """
        Handle WebRTC offer from client and return answer

        Args:
            session_id: WebRTC session ID
            offer: SDP offer from client

        Returns:
            SDP answer to send back to client
        """
        async with self._lock:
            session = self.sessions.get(session_id)
            if not session:
                logger.error(f"Session {session_id} not found")
                return None

            try:
                pc = session.pc

                # Set remote description (offer from client)
                await pc.setRemoteDescription(offer)
                logger.info(f"Set remote description for session {session_id}")

                # Create and set local description (answer)
                answer = await pc.createAnswer()
                await pc.setLocalDescription(answer)

                session.connection_established = True
                session.last_activity = datetime.now()

                logger.info(f"Created answer for session {session_id}")
                return pc.localDescription

            except Exception as e:
                logger.error(f"Error handling offer for session {session_id}: {e}")
                session.error = str(e)
                return None

    async def add_ice_candidate(
        self, session_id: str, candidate_sdp: str, sdp_mid: str, sdp_mline_index: int
    ):
        """
        Add ICE candidate to peer connection

        Args:
            session_id: WebRTC session ID
            candidate_sdp: ICE candidate line
            sdp_mid: Media ID
            sdp_mline_index: Media line index
        """
        session = self.sessions.get(session_id)
        if not session:
            logger.error(f"Session {session_id} not found")
            return

        try:
            from aiortc.rtcicegatherer import RTCIceCandidate

            candidate = RTCIceCandidate(
                candidate=candidate_sdp,
                sdpMid=sdp_mid,
                sdpMLineIndex=sdp_mline_index,
            )
            await session.pc.addIceCandidate(candidate)
            session.last_activity = datetime.now()
            logger.debug(f"Added ICE candidate to session {session_id}")

        except Exception as e:
            logger.error(f"Error adding ICE candidate to session {session_id}: {e}")

    async def close_session(self, session_id: str):
        """
        Close WebRTC session and clean up resources

        Args:
            session_id: WebRTC session ID
        """
        async with self._lock:
            session = self.sessions.pop(session_id, None)
            if not session:
                return

            try:
                # Stop video track
                if session.video_track:
                    await session.video_track.stop()

                # Close peer connection
                await session.pc.close()

                logger.info(f"Closed WebRTC session {session_id}")

            except Exception as e:
                logger.error(f"Error closing session {session_id}: {e}")

    async def cleanup_idle_sessions(self):
        """Periodically clean up idle sessions"""
        while True:
            try:
                await asyncio.sleep(60)  # Check every minute

                async with self._lock:
                    idle_sessions = [
                        sid
                        for sid, session in self.sessions.items()
                        if session.is_idle
                    ]

                    for session_id in idle_sessions:
                        logger.info(f"Closing idle session {session_id}")
                        await self.close_session(session_id)

            except Exception as e:
                logger.error(f"Error in cleanup_idle_sessions: {e}")

    async def start(self):
        """Start background cleanup task"""
        self._cleanup_task = asyncio.create_task(self.cleanup_idle_sessions())
        logger.info("WebRTC Session Manager started")

    async def stop(self):
        """Stop background tasks and clean up all sessions"""
        if self._cleanup_task:
            self._cleanup_task.cancel()

        # Close all sessions
        session_ids = list(self.sessions.keys())
        for session_id in session_ids:
            await self.close_session(session_id)

        logger.info("WebRTC Session Manager stopped")


# Global session manager instance
webrtc_manager = WebRTCSessionManager()
