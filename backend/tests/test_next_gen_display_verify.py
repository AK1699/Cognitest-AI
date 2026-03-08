import asyncio
import unittest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime
from app.services.web_automation_service import WebAutomationExecutor

class TestNextGenDisplay(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.db = MagicMock()
        self.executor = WebAutomationExecutor(self.db)
        self.executor.page = AsyncMock()
        self.executor.page.context = AsyncMock()
        self.executor.page.is_closed = MagicMock(return_value=False)
        self.executor.page.url = "http://example.com"
        
        # Mock emit_live_update
        self.emit_mock = AsyncMock()
        self.executor.emit_live_update = self.emit_mock

    async def test_manual_interaction_click(self):
        """Verify that manual clicks are forwarded to Playwright mouse"""
        event = {
            "type": "click",
            "payload": {"x": 100, "y": 200}
        }
        await self.executor.handle_manual_interaction(event)
        
        # Verify mouse click was called
        self.executor.page.mouse.click.assert_called_once_with(100, 200)

    async def test_manual_interaction_type(self):
        """Verify that manual typing is forwarded to Playwright keyboard"""
        event = {
            "type": "type",
            "payload": {"text": "hello"}
        }
        await self.executor.handle_manual_interaction(event)
        
        # Verify keyboard type was called
        self.executor.page.keyboard.type.assert_called_once_with("hello")

    async def test_pause_resume_logic(self):
        """Verify that pause/resume affects the in_paused flag"""
        # Test Pause
        await self.executor.handle_manual_interaction({"type": "pause", "payload": {}})
        self.assertTrue(self.executor.is_paused)
        self.emit_mock.assert_called_with("status", {"state": "paused"})
        
        # Test Resume
        await self.executor.handle_manual_interaction({"type": "resume", "payload": {}})
        self.assertFalse(self.executor.is_paused)
        self.emit_mock.assert_called_with("status", {"state": "running"})

    async def test_binary_frame_emission(self):
        """Verify that binary data can be emitted via emit_live_update"""
        dummy_bytes = b"\xff\xd8\xff\xe0" # JPEG header
        await self.executor.emit_live_update("screenshot", {"url": "test"}, binary_data=dummy_bytes)
        
        # Check that has_binary was set and passed to callbacks
        args, kwargs = self.emit_mock.call_args
        self.assertEqual(args[0], "screenshot")
        self.assertEqual(kwargs['binary_data'], dummy_bytes)

if __name__ == "__main__":
    unittest.main()
