"""
WebRTC Browser Streaming API
Endpoints for starting/stopping streaming and handling user interactions
"""
import logging
import json
from typing import Optional

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, Query
from pydantic import BaseModel

from app.services.webrtc_browser_integration import webrtc_browser_integration
from app.core.webrtc_config import webrtc_config

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/webrtc-browser",
    tags=["webrtc-browser"],
)


class StartStreamingRequest(BaseModel):
    """Request to start browser streaming"""

    browser_session_id: str
    browser_type: str = "chromium"
    device: str = "desktop_chrome"


class InteractionEvent(BaseModel):
    """User interaction event"""

    type: str  # click, keyboard, scroll
    data: dict


class RegisterBrowserPageRequest(BaseModel):
    """Request to register browser page with streaming session"""

    viewport_width: int = 1280
    viewport_height: int = 720


@router.post("/streaming/start")
async def start_streaming(request: StartStreamingRequest):
    """
    Start WebRTC streaming for a browser session

    Args:
        request: StartStreamingRequest with session details

    Returns:
        Streaming session information
    """
    if not webrtc_config.WEBRTC_ENABLED:
        raise HTTPException(status_code=503, detail="WebRTC streaming is disabled")

    try:
        result = await webrtc_browser_integration.start_streaming(
            browser_session_id=request.browser_session_id,
            browser_type=request.browser_type,
            device=request.device,
        )

        if not result:
            raise HTTPException(
                status_code=500,
                detail="Failed to start streaming. Check Docker and WebRTC services.",
            )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting streaming: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/streaming/{session_id}/stop")
async def stop_streaming(session_id: str):
    """
    Stop WebRTC streaming for a session

    Args:
        session_id: Session ID

    Returns:
        Status message
    """
    try:
        success = await webrtc_browser_integration.stop_streaming(session_id)

        if not success:
            raise HTTPException(status_code=404, detail="Session not found")

        return {"status": "streaming_stopped", "session_id": session_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error stopping streaming: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/streaming/{session_id}")
async def get_streaming_info(session_id: str):
    """
    Get streaming session information

    Args:
        session_id: Session ID

    Returns:
        Session information
    """
    try:
        info = await webrtc_browser_integration.get_session_info(session_id)

        if not info:
            raise HTTPException(status_code=404, detail="Session not found")

        return info

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting session info: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/streaming")
async def list_streaming_sessions():
    """Get all active streaming sessions"""
    try:
        sessions = await webrtc_browser_integration.get_all_sessions()
        return sessions

    except Exception as e:
        logger.error(f"Error listing sessions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/streaming/{session_id}/register-page")
async def register_browser_page(
    session_id: str,
    request: RegisterBrowserPageRequest,
):
    """
    Register a Playwright browser page with streaming session

    This endpoint should be called after launching a browser and creating a page.
    It enables interaction forwarding (clicks, keyboard, scroll).

    Args:
        session_id: Streaming session ID
        request: RegisterBrowserPageRequest with viewport dimensions

    Returns:
        Status message
    """
    try:
        # Note: This is a placeholder implementation
        # In a real implementation, the browser page would be passed from the
        # browser session service that launched it
        # The actual registration happens in BrowserSessionService.launch()

        logger.info(
            f"Browser page registered for session {session_id} "
            f"with viewport {request.viewport_width}x{request.viewport_height}"
        )

        return {
            "status": "page_registered",
            "session_id": session_id,
            "viewport": {
                "width": request.viewport_width,
                "height": request.viewport_height,
            },
        }

    except Exception as e:
        logger.error(f"Error registering browser page: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/streaming/{session_id}/interact")
async def handle_interaction(session_id: str, event: InteractionEvent):
    """
    Handle user interaction event

    Args:
        session_id: Session ID
        event: InteractionEvent (click, keyboard, scroll)

    Returns:
        Status message
    """
    try:
        success = await webrtc_browser_integration.handle_interaction(
            session_id=session_id,
            interaction_type=event.type,
            data=event.data,
        )

        if not success:
            raise HTTPException(
                status_code=400,
                detail="Failed to handle interaction. Session may not be ready.",
            )

        return {
            "status": "interaction_handled",
            "session_id": session_id,
            "type": event.type,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error handling interaction: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.websocket("/streaming/{session_id}/events")
async def websocket_events(websocket: WebSocket, session_id: str):
    """
    WebSocket for real-time interaction events

    Protocol:
    {
        "type": "click|keyboard|scroll",
        "data": {...event_data...}
    }
    """
    await websocket.accept()

    try:
        logger.info(f"Interaction WebSocket connected for session {session_id}")

        while True:
            # Receive interaction event
            message = await websocket.receive_text()
            data = json.loads(message)

            event_type = data.get("type")
            event_data = data.get("data", {})

            # Handle interaction
            success = await webrtc_browser_integration.handle_interaction(
                session_id=session_id,
                interaction_type=event_type,
                data=event_data,
            )

            # Send response
            await websocket.send_json(
                {
                    "status": "success" if success else "failed",
                    "type": event_type,
                }
            )

    except WebSocketDisconnect:
        logger.info(f"Interaction WebSocket disconnected for session {session_id}")

    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in interaction event: {e}")
        await websocket.send_json({"status": "error", "message": "Invalid JSON"})

    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.send_json({"status": "error", "message": str(e)})
        except Exception:
            pass
