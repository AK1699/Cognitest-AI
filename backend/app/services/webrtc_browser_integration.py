"""
WebRTC Browser Integration Service
Connects browser sessions, Docker containers, and WebRTC streaming
Handles user interactions and event forwarding
"""
import asyncio
import logging
from typing import Dict, Optional, Callable, Any
from dataclasses import dataclass, field
from datetime import datetime
import json

from app.services.docker_manager import docker_manager, ContainerInfo
from app.services.webrtc_session_manager import webrtc_manager
from app.services.browser_streaming_registry import browser_streaming_registry
from app.core.webrtc_config import webrtc_config

logger = logging.getLogger(__name__)


@dataclass
class BrowserStreamingSession:
    """Combines browser, Docker container, and WebRTC session"""

    session_id: str
    browser_session_id: str
    container: Optional[ContainerInfo] = None
    webrtc_session_id: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)
    status: str = "initializing"  # initializing, running, error, closed

    def is_ready(self) -> bool:
        """Check if session is fully ready"""
        return (
            self.container is not None
            and self.webrtc_session_id is not None
            and self.status == "running"
        )


class WebRTCBrowserIntegration:
    """
    Integrates WebRTC streaming with browser automation
    Orchestrates:
    - Docker container creation for display
    - WebRTC session setup
    - User interaction event forwarding
    - Resource cleanup
    """

    def __init__(self):
        """Initialize integration service"""
        self.sessions: Dict[str, BrowserStreamingSession] = {}
        self._lock = asyncio.Lock()

    async def start_streaming(
        self,
        browser_session_id: str,
        browser_type: str = "chromium",
        device: str = "desktop_chrome",
        on_interaction: Optional[Callable[[str, dict], Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Start WebRTC streaming for a browser session

        Args:
            browser_session_id: Browser session ID
            browser_type: Browser type (chromium, firefox, webkit)
            device: Device preset
            on_interaction: Callback for user interactions

        Returns:
            Session info dict with container and WebRTC details, or None on failure
        """
        async with self._lock:
            try:
                session_id = browser_session_id
                logger.info(f"Starting WebRTC streaming for session {session_id}")

                # Create Docker container
                logger.info("Step 1: Creating Docker container")
                container = await docker_manager.create_container(
                    session_id=browser_session_id,
                    browser_type=browser_type,
                )

                if not container:
                    logger.error("Failed to create container")
                    return None

                logger.info(f"Container created: {container.container_id} on display {container.display}")

                # Create WebRTC session
                logger.info("Step 2: Creating WebRTC session")
                webrtc_session_id = await webrtc_manager.create_session(
                    browser_session_id=browser_session_id,
                    on_state_change=None,  # TODO: Implement state callbacks
                )

                if not webrtc_session_id:
                    logger.error("Failed to create WebRTC session")
                    await docker_manager.stop_container(browser_session_id)
                    return None

                logger.info(f"WebRTC session created: {webrtc_session_id}")

                # Create integration session
                session = BrowserStreamingSession(
                    session_id=session_id,
                    browser_session_id=browser_session_id,
                    container=container,
                    webrtc_session_id=webrtc_session_id,
                    status="running",
                )

                self.sessions[session_id] = session

                logger.info(f"WebRTC browser integration session ready: {session_id}")

                return {
                    "session_id": session_id,
                    "container_id": container.container_id,
                    "webrtc_session_id": webrtc_session_id,
                    "display": container.display,
                    "port": container.port,
                    "status": "ready",
                }

            except Exception as e:
                logger.error(f"Error starting streaming: {e}")
                return None

    async def stop_streaming(self, session_id: str) -> bool:
        """
        Stop WebRTC streaming and cleanup resources

        Args:
            session_id: Session ID

        Returns:
            True if successful, False otherwise
        """
        async with self._lock:
            session = self.sessions.pop(session_id, None)
            if not session:
                return False

            try:
                # Unregister from browser registry
                await browser_streaming_registry.unregister(session_id)

                # Close WebRTC session
                if session.webrtc_session_id:
                    await webrtc_manager.close_session(session.webrtc_session_id)
                    logger.info(f"Closed WebRTC session {session.webrtc_session_id}")

                # Stop Docker container
                if session.container:
                    await docker_manager.stop_container(session.browser_session_id)
                    logger.info(f"Stopped container {session.container.container_id}")

                logger.info(f"Closed streaming session {session_id}")
                return True

            except Exception as e:
                logger.error(f"Error stopping streaming: {e}")
                return False

    async def register_browser_page(
        self,
        streaming_session_id: str,
        browser_session_id: str,
        browser_page,
        viewport_width: int = 1280,
        viewport_height: int = 720,
    ):
        """
        Register a Playwright browser page with a streaming session

        Args:
            streaming_session_id: Streaming session ID
            browser_session_id: Browser session ID
            browser_page: Playwright page object
            viewport_width: Browser viewport width
            viewport_height: Browser viewport height
        """
        await browser_streaming_registry.register(
            browser_session_id=browser_session_id,
            streaming_session_id=streaming_session_id,
            browser_page=browser_page,
            viewport_width=viewport_width,
            viewport_height=viewport_height,
        )
        logger.info(
            f"Registered browser page for streaming session {streaming_session_id}"
        )

    async def handle_interaction(
        self,
        session_id: str,
        interaction_type: str,
        data: dict,
    ) -> bool:
        """
        Handle user interaction event and forward to browser

        Args:
            session_id: Session ID
            interaction_type: Type (click, keyboard, scroll)
            data: Interaction data

        Returns:
            True if successful, False otherwise
        """
        session = self.sessions.get(session_id)
        if not session or not session.is_ready():
            logger.warning(f"Session {session_id} not ready for interactions")
            return False

        try:
            if interaction_type == "click":
                return await self._handle_click(session, data)
            elif interaction_type == "keyboard":
                return await self._handle_keyboard(session, data)
            elif interaction_type == "scroll":
                return await self._handle_scroll(session, data)
            else:
                logger.warning(f"Unknown interaction type: {interaction_type}")
                return False

        except Exception as e:
            logger.error(f"Error handling interaction: {e}")
            return False

    async def _handle_click(self, session: BrowserStreamingSession, data: dict) -> bool:
        """Handle mouse click event"""
        try:
            x = data.get("x")
            y = data.get("y")
            button = data.get("button", "left")

            if x is None or y is None:
                logger.warning("Invalid click coordinates")
                return False

            logger.info(f"Click at ({x}, {y}) with button '{button}'")

            # Get browser page from registry
            page = await browser_streaming_registry.get_browser_page(session.session_id)
            if not page:
                logger.warning(
                    f"Browser page not registered for session {session.session_id}. "
                    f"Make sure to call register_browser_page() after launching the browser."
                )
                return False

            try:
                # Scale coordinates from display to viewport
                scaled_coords = await browser_streaming_registry.scale_coordinates(
                    session.session_id, x, y
                )
                if not scaled_coords:
                    logger.error("Failed to scale coordinates")
                    return False

                scaled_x, scaled_y = scaled_coords

                # Move to position and click
                await page.mouse.move(scaled_x, scaled_y)
                await page.mouse.click(scaled_x, scaled_y, button=button)

                logger.info(
                    f"Click forwarded to browser: ({x}, {y}) display → "
                    f"({scaled_x}, {scaled_y}) viewport"
                )
                return True

            except Exception as e:
                logger.error(f"Failed to perform click on browser: {e}")
                return False

        except Exception as e:
            logger.error(f"Error handling click: {e}")
            return False

    async def _handle_keyboard(self, session: BrowserStreamingSession, data: dict) -> bool:
        """Handle keyboard input event"""
        try:
            key = data.get("key")
            if not key:
                logger.warning("Invalid keyboard input")
                return False

            # Get modifiers
            shift = data.get("shift", False)
            ctrl = data.get("ctrl", False)
            alt = data.get("alt", False)

            logger.info(f"Keyboard: {key} (shift={shift}, ctrl={ctrl}, alt={alt})")

            # Get browser page from registry
            page = await browser_streaming_registry.get_browser_page(session.session_id)
            if not page:
                logger.warning(
                    f"Browser page not registered for session {session.session_id}"
                )
                return False

            try:
                # Handle special keys
                SPECIAL_KEYS = {
                    "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
                    "Enter", "Tab", "Escape", "Backspace", "Delete",
                    "Home", "End", "PageUp", "PageDown",
                    "Shift", "Control", "Alt", "Meta"
                }

                if key in SPECIAL_KEYS:
                    # Press special key
                    await page.press(key)
                    logger.info(f"Pressed special key: {key}")
                else:
                    # Type regular character
                    await page.type(key)
                    logger.info(f"Typed character: {key}")

                return True

            except Exception as e:
                logger.error(f"Failed to send keyboard input to browser: {e}")
                return False

        except Exception as e:
            logger.error(f"Error handling keyboard: {e}")
            return False

    async def _handle_scroll(self, session: BrowserStreamingSession, data: dict) -> bool:
        """Handle scroll event"""
        try:
            delta_x = data.get("deltaX", 0)
            delta_y = data.get("deltaY", 0)

            logger.info(f"Scroll: deltaX={delta_x}, deltaY={delta_y}")

            # Get browser page from registry
            page = await browser_streaming_registry.get_browser_page(session.session_id)
            if not page:
                logger.warning(
                    f"Browser page not registered for session {session.session_id}"
                )
                return False

            try:
                # Execute scroll in page
                await page.evaluate(
                    f"window.scrollBy({delta_x}, {delta_y})"
                )
                logger.info(f"Scroll executed in browser: ({delta_x}, {delta_y})")
                return True

            except Exception as e:
                logger.error(f"Failed to scroll in browser: {e}")
                return False

        except Exception as e:
            logger.error(f"Error handling scroll: {e}")
            return False

    async def get_session_info(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session information"""
        session = self.sessions.get(session_id)
        if not session:
            return None

        return {
            "session_id": session_id,
            "browser_session_id": session.browser_session_id,
            "container_id": session.container.container_id if session.container else None,
            "webrtc_session_id": session.webrtc_session_id,
            "display": session.container.display if session.container else None,
            "status": session.status,
            "created_at": session.created_at.isoformat(),
            "is_ready": session.is_ready(),
        }

    async def get_all_sessions(self) -> Dict[str, Any]:
        """Get information about all active sessions"""
        return {
            "total_sessions": len(self.sessions),
            "sessions": [
                await self.get_session_info(sid) for sid in self.sessions.keys()
            ],
        }

    async def start(self):
        """Start integration service"""
        logger.info("WebRTC Browser Integration started")

    async def stop(self):
        """Stop integration service and cleanup all sessions"""
        # Close all sessions
        session_ids = list(self.sessions.keys())
        for session_id in session_ids:
            await self.stop_streaming(session_id)

        logger.info("WebRTC Browser Integration stopped")


# Global integration instance
webrtc_browser_integration = WebRTCBrowserIntegration()
