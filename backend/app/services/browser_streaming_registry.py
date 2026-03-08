"""
Browser Streaming Registry
Maps browser sessions to streaming sessions for coordinated interaction handling
"""
import logging
from typing import Dict, Optional
from datetime import datetime
import asyncio

logger = logging.getLogger(__name__)


class BrowserStreamingRegistry:
    """
    Central registry connecting:
    - Browser Sessions (Playwright automation)
    - Streaming Sessions (WebRTC + Docker)
    - Enables interaction forwarding from WebRTC to Playwright
    """

    def __init__(self):
        """Initialize the registry"""
        self.mappings: Dict[str, dict] = {}
        self._lock = asyncio.Lock()

    async def register(
        self,
        browser_session_id: str,
        streaming_session_id: str,
        browser_page=None,
        viewport_width: int = 1280,
        viewport_height: int = 720,
    ):
        """
        Register a browser session with a streaming session

        Args:
            browser_session_id: Browser session ID
            streaming_session_id: Streaming session ID
            browser_page: Playwright page object (for interaction forwarding)
            viewport_width: Browser viewport width
            viewport_height: Browser viewport height
        """
        async with self._lock:
            self.mappings[streaming_session_id] = {
                "browser_session_id": browser_session_id,
                "streaming_session_id": streaming_session_id,
                "browser_page": browser_page,
                "viewport_width": viewport_width,
                "viewport_height": viewport_height,
                "display_width": 1280,  # From FFmpeg config
                "display_height": 720,
                "registered_at": datetime.now(),
            }

            logger.info(
                f"Registered browser session {browser_session_id} "
                f"with streaming session {streaming_session_id}"
            )

    async def unregister(self, streaming_session_id: str):
        """Unregister a streaming session"""
        async with self._lock:
            if streaming_session_id in self.mappings:
                mapping = self.mappings.pop(streaming_session_id)
                logger.info(
                    f"Unregistered streaming session {streaming_session_id} "
                    f"(browser: {mapping['browser_session_id']})"
                )

    async def get_browser_page(self, streaming_session_id: str):
        """
        Get Playwright page for a streaming session

        Args:
            streaming_session_id: Streaming session ID

        Returns:
            Playwright page object or None
        """
        mapping = self.mappings.get(streaming_session_id)
        if mapping:
            return mapping.get("browser_page")
        return None

    async def get_viewport_info(self, streaming_session_id: str) -> Optional[dict]:
        """
        Get viewport information for coordinate scaling

        Args:
            streaming_session_id: Streaming session ID

        Returns:
            Dict with viewport and display dimensions
        """
        mapping = self.mappings.get(streaming_session_id)
        if mapping:
            return {
                "viewport_width": mapping["viewport_width"],
                "viewport_height": mapping["viewport_height"],
                "display_width": mapping["display_width"],
                "display_height": mapping["display_height"],
            }
        return None

    async def scale_coordinates(
        self, streaming_session_id: str, x: int, y: int
    ) -> Optional[tuple]:
        """
        Scale coordinates from display to viewport

        The user clicks on the WebRTC video (display resolution: 1280x720)
        but the browser viewport might be different (e.g., 1920x1080)
        This method scales the coordinates appropriately.

        Args:
            streaming_session_id: Streaming session ID
            x: X coordinate in display space
            y: Y coordinate in display space

        Returns:
            Tuple of (scaled_x, scaled_y) in viewport space, or None if session not found
        """
        viewport_info = await self.get_viewport_info(streaming_session_id)
        if not viewport_info:
            logger.warning(f"Session {streaming_session_id} not found for coordinate scaling")
            return None

        # Calculate scale factors
        scale_x = viewport_info["viewport_width"] / viewport_info["display_width"]
        scale_y = viewport_info["viewport_height"] / viewport_info["display_height"]

        # Scale coordinates
        scaled_x = int(x * scale_x)
        scaled_y = int(y * scale_y)

        logger.debug(
            f"Scaled coordinates: ({x}, {y}) → ({scaled_x}, {scaled_y}) "
            f"(scale: {scale_x:.2f}x, {scale_y:.2f}y)"
        )

        return (scaled_x, scaled_y)

    async def get_all_mappings(self) -> Dict:
        """Get all current mappings"""
        return {
            sid: {
                "browser_session_id": m["browser_session_id"],
                "streaming_session_id": m["streaming_session_id"],
                "has_page": m["browser_page"] is not None,
                "registered_at": m["registered_at"].isoformat(),
            }
            for sid, m in self.mappings.items()
        }


# Global registry instance
browser_streaming_registry = BrowserStreamingRegistry()
