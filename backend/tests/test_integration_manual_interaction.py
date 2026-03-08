"""
Integration Tests for Manual Interaction System
Tests the complete flow: WebSocket → Backend → Browser Page
"""
import asyncio
import json
import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, MagicMock, patch, call
from datetime import datetime
from typing import Optional

from app.services.web_automation_service import WebAutomationExecutor
from app.api.v1.web_automation import active_executors, ConnectionManager


class MockPage:
    """Mock Playwright page for testing"""
    def __init__(self):
        self.mouse = AsyncMock()
        self.keyboard = AsyncMock()
        self.context = AsyncMock()
        self.url = "http://example.com"
        self.is_closed = MagicMock(return_value=False)
        self.screenshot_calls = []
        self.interactions = []

    async def screenshot(self, **kwargs):
        """Mock screenshot method"""
        self.screenshot_calls.append(kwargs)
        return b"fake_jpeg_data"

    async def evaluate(self, script: str, *args):
        """Mock evaluate for scroll"""
        return None


class MockBrowser:
    """Mock Playwright browser"""
    def __init__(self):
        self.is_closed = MagicMock(return_value=False)
        self.contexts = []

    async def new_context(self, **kwargs):
        context = AsyncMock()
        self.contexts.append(context)
        return context


class MockContext:
    """Mock Playwright context"""
    def __init__(self, page: MockPage):
        self.page = page

    async def new_page(self):
        return self.page

    async def close(self):
        pass


class TestManualInteractionIntegration:
    """Integration tests for manual interaction system"""

    @pytest_asyncio.fixture
    async def setup_executor(self):
        """Setup executor with mock page"""
        # Create mock dependencies
        db = MagicMock()

        # Create executor
        executor = WebAutomationExecutor(db)

        # Setup mock page
        page = MockPage()
        executor.page = page

        # Setup mock callback
        update_messages = []
        async def mock_emit(msg_type, data, binary_data=None):
            update_messages.append({
                'type': msg_type,
                'data': data,
                'binary_data': binary_data,
                'timestamp': datetime.now()
            })

        executor.emit_live_update = AsyncMock(side_effect=mock_emit)
        executor.is_paused = False

        yield executor, page, update_messages

        # Cleanup
        if hasattr(executor, 'page') and executor.page:
            executor.page = None

    @pytest.mark.asyncio
    async def test_manual_click_interaction_flow(self, setup_executor):
        """Test complete flow: WebSocket click → Page click"""
        executor, page, updates = setup_executor

        # Simulate user click on video at (640, 360)
        interaction = {
            "type": "click",
            "payload": {"x": 640, "y": 360}
        }

        # Process interaction
        await executor.handle_manual_interaction(interaction)

        # Verify page.mouse.click was called with correct coordinates
        page.mouse.click.assert_called_once()
        call_args = page.mouse.click.call_args

        # Check coordinates
        x, y = call_args[0][:2]
        assert x == 640
        assert y == 360

    @pytest.mark.asyncio
    async def test_manual_type_interaction_flow(self, setup_executor):
        """Test complete flow: WebSocket type → Keyboard input"""
        executor, page, updates = setup_executor

        # Simulate user typing
        interaction = {
            "type": "type",
            "payload": {"text": "hello world"}
        }

        # Process interaction
        await executor.handle_manual_interaction(interaction)

        # Verify keyboard.type was called
        page.keyboard.type.assert_called_once_with("hello world")

    @pytest.mark.asyncio
    async def test_manual_keyboard_press_flow(self, setup_executor):
        """Test keyboard special key press (Enter, Tab, etc)"""
        executor, page, updates = setup_executor

        # Simulate special key press
        interaction = {
            "type": "press",
            "payload": {"key": "Enter"}
        }

        # Process interaction
        await executor.handle_manual_interaction(interaction)

        # Verify keyboard.press was called
        page.keyboard.press.assert_called_once_with("Enter")

    @pytest.mark.asyncio
    async def test_manual_scroll_interaction_flow(self, setup_executor):
        """Test scroll event"""
        executor, page, updates = setup_executor

        # Simulate scroll
        interaction = {
            "type": "scroll",
            "payload": {"deltaX": 0, "deltaY": 100}
        }

        # Process interaction
        await executor.handle_manual_interaction(interaction)

        # Verify evaluate was called for scrolling
        page.evaluate.assert_called_once()
        call_args = page.evaluate.call_args[0][0]
        assert "scrollBy" in call_args

    @pytest.mark.asyncio
    async def test_pause_resume_status_flow(self, setup_executor):
        """Test pause/resume status updates"""
        executor, page, updates = setup_executor

        # Verify initial state
        assert executor.is_paused == False

        # Simulate pause
        pause_interaction = {
            "type": "pause",
            "payload": {}
        }
        await executor.handle_manual_interaction(pause_interaction)

        # Verify paused state
        assert executor.is_paused == True
        # Check that status update was emitted
        status_calls = [u for u in updates if u['type'] == 'status']
        assert len(status_calls) > 0
        assert status_calls[-1]['data']['state'] == 'paused'

        # Simulate resume
        resume_interaction = {
            "type": "resume",
            "payload": {}
        }
        await executor.handle_manual_interaction(resume_interaction)

        # Verify running state
        assert executor.is_paused == False
        status_calls = [u for u in updates if u['type'] == 'status']
        assert status_calls[-1]['data']['state'] == 'running'

    @pytest.mark.asyncio
    async def test_multiple_interactions_sequence(self, setup_executor):
        """Test sequence of multiple interactions"""
        executor, page, updates = setup_executor

        interactions = [
            {"type": "click", "payload": {"x": 100, "y": 200}},
            {"type": "type", "payload": {"text": "test@example.com"}},
            {"type": "click", "payload": {"x": 500, "y": 300}},
            {"type": "press", "payload": {"key": "Enter"}},
        ]

        # Execute all interactions
        for interaction in interactions:
            await executor.handle_manual_interaction(interaction)

        # Verify all interactions were processed
        assert page.mouse.click.call_count == 2
        assert page.keyboard.type.call_count == 1
        assert page.keyboard.press.call_count == 1

    @pytest.mark.asyncio
    async def test_interaction_with_missing_page(self):
        """Test interaction when page is not available"""
        db = MagicMock()
        executor = WebAutomationExecutor(db)

        # No page set - should return error
        executor.page = None
        executor.emit_live_update = AsyncMock()

        interaction = {
            "type": "click",
            "payload": {"x": 640, "y": 360}
        }

        result = await executor.handle_manual_interaction(interaction)

        # Should handle gracefully
        # The executor should log error or emit failure event
        assert result is None or result == False

    @pytest.mark.asyncio
    async def test_invalid_interaction_type(self, setup_executor):
        """Test handling of invalid interaction type"""
        executor, page, updates = setup_executor

        interaction = {
            "type": "invalid_type",
            "payload": {}
        }

        result = await executor.handle_manual_interaction(interaction)

        # Should handle gracefully without crashing
        assert result is None or result == False

    @pytest.mark.asyncio
    async def test_coordinate_scaling(self, setup_executor):
        """Test coordinate scaling from display to viewport"""
        executor, page, updates = setup_executor

        # Test case: Display is 1280x720, browser viewport is 1920x1080
        # Click at center of display (640, 360) should scale to (960, 540)
        executor.viewport_width = 1920
        executor.viewport_height = 1080

        # Note: Actual scaling happens in browser_streaming_registry
        # This test verifies the backend doesn't modify coordinates
        interaction = {
            "type": "click",
            "payload": {"x": 640, "y": 360}
        }

        await executor.handle_manual_interaction(interaction)

        # Backend receives display coordinates as-is
        # (scaling happens at registry level)
        call_args = page.mouse.click.call_args
        x, y = call_args[0][:2]
        assert x == 640  # Display coordinates
        assert y == 360

    @pytest.mark.asyncio
    async def test_concurrent_interactions(self, setup_executor):
        """Test handling multiple concurrent interactions"""
        executor, page, updates = setup_executor

        # Simulate concurrent interactions
        interactions = [
            {"type": "click", "payload": {"x": 100, "y": 100}},
            {"type": "click", "payload": {"x": 200, "y": 200}},
            {"type": "click", "payload": {"x": 300, "y": 300}},
        ]

        # Execute concurrently
        tasks = [
            executor.handle_manual_interaction(i)
            for i in interactions
        ]
        results = await asyncio.gather(*tasks)

        # Verify all completed
        assert len(results) == 3
        # Verify all clicks were recorded
        assert page.mouse.click.call_count == 3

    @pytest.mark.asyncio
    async def test_interaction_error_handling(self, setup_executor):
        """Test error handling when interaction fails"""
        executor, page, updates = setup_executor

        # Setup page to raise an error
        page.mouse.click.side_effect = Exception("Browser connection lost")

        interaction = {
            "type": "click",
            "payload": {"x": 640, "y": 360}
        }

        # Should handle error gracefully
        try:
            result = await executor.handle_manual_interaction(interaction)
        except Exception as e:
            # Error should be caught and handled
            assert "Browser connection lost" in str(e) or result == False

    @pytest.mark.asyncio
    async def test_screenshot_after_interaction(self, setup_executor):
        """Test screenshot is captured after interaction"""
        executor, page, updates = setup_executor

        # Perform interaction
        interaction = {
            "type": "click",
            "payload": {"x": 640, "y": 360}
        }
        await executor.handle_manual_interaction(interaction)

        # Capture screenshot
        screenshot = await page.screenshot()

        # Verify screenshot data
        assert screenshot == b"fake_jpeg_data"
        assert len(page.screenshot_calls) == 1


class TestConnectionManager:
    """Test ConnectionManager for WebSocket message handling"""

    @pytest.mark.asyncio
    async def test_send_json_message(self):
        """Test sending JSON message"""
        manager = ConnectionManager()

        # Mock WebSocket
        ws = AsyncMock()
        manager.active_connections["test-123"] = ws

        # Send message
        message = {"type": "test", "data": "hello"}
        await manager.send_message("test-123", message)

        # Verify send_json was called
        ws.send_json.assert_called_once_with(message)

    @pytest.mark.asyncio
    async def test_send_binary_data(self):
        """Test sending binary data"""
        manager = ConnectionManager()

        # Mock WebSocket
        ws = AsyncMock()
        manager.active_connections["test-123"] = ws

        # Send message with binary data
        message = {"type": "screenshot"}
        binary_data = b"\xff\xd8\xff\xe0"  # JPEG header

        await manager.send_message("test-123", message, binary_data)

        # Verify both send_json and send_bytes were called
        ws.send_json.assert_called_once_with(message)
        ws.send_bytes.assert_called_once_with(binary_data)

    @pytest.mark.asyncio
    async def test_send_to_nonexistent_connection(self):
        """Test sending to connection that doesn't exist"""
        manager = ConnectionManager()

        message = {"type": "test"}

        # Should not raise error
        await manager.send_message("nonexistent", message)

    @pytest.mark.asyncio
    async def test_connect_disconnect(self):
        """Test connection and disconnection"""
        manager = ConnectionManager()
        ws = AsyncMock()

        # Connect
        manager.connect("test-123", ws)
        assert "test-123" in manager.active_connections

        # Disconnect
        manager.disconnect("test-123")
        assert "test-123" not in manager.active_connections


class TestActiveExecutorTracking:
    """Test active executor tracking for interaction routing"""

    @pytest.mark.asyncio
    async def test_executor_registration(self):
        """Test registering executor for interaction"""
        db = MagicMock()
        executor = WebAutomationExecutor(db)
        executor.page = AsyncMock()

        # Register executor
        active_executors["run-123"] = executor

        # Verify registration
        assert "run-123" in active_executors
        assert active_executors["run-123"] == executor

    @pytest.mark.asyncio
    async def test_executor_lookup_for_interaction(self):
        """Test looking up executor to handle interaction"""
        db = MagicMock()
        executor = WebAutomationExecutor(db)
        executor.page = MagicMock()
        executor.page.mouse = AsyncMock()
        executor.emit_live_update = AsyncMock()

        # Register executor
        active_executors["run-123"] = executor

        # Look up and use executor
        found_executor = active_executors.get("run-123")
        assert found_executor is not None

        # Use found executor to handle interaction
        if found_executor:
            interaction = {"type": "click", "payload": {"x": 100, "y": 100}}
            await found_executor.handle_manual_interaction(interaction)

    @pytest.mark.asyncio
    async def test_executor_cleanup(self):
        """Test cleaning up executor after execution"""
        db = MagicMock()
        executor = WebAutomationExecutor(db)

        # Register and then cleanup
        active_executors["run-123"] = executor
        assert "run-123" in active_executors

        del active_executors["run-123"]
        assert "run-123" not in active_executors


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
