"""
Browser streaming API endpoints for WebRTC-based interactive browser control
"""
import logging
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional

try:
    from app.services.browser_webrtc_session import browser_webrtc_session_manager
except ImportError as e:
    raise ImportError(f"BrowserWebRTC dependencies not installed: {e}")

logger = logging.getLogger(__name__)

router = APIRouter()


class CreateBrowserStreamingRequest(BaseModel):
    """Request to create a browser streaming session"""
    url: str = Field(..., description="Initial URL to navigate to")
    device: str = Field("desktop_chrome", description="Device preset (desktop_chrome, iphone_14, etc.)")
    fps: int = Field(30, description="Frames per second (15-30)", ge=15, le=30)
    resolution: Optional[tuple] = Field((1280, 720), description="Video resolution (width, height)")


class CreateBrowserStreamingResponse(BaseModel):
    """Response with session details"""
    session_id: str
    url: str
    device: str
    fps: int
    status: str


class SessionInfoResponse(BaseModel):
    """Response with session info"""
    session_id: str
    url: str
    device: str
    fps: int
    status: str
    resolution: tuple


@router.post("/create", response_model=CreateBrowserStreamingResponse)
async def create_browser_streaming_session(request: CreateBrowserStreamingRequest):
    """
    Create a new browser streaming session with WebRTC

    Returns session_id to use for WebSocket connection
    """
    try:
        session_id = await browser_webrtc_session_manager.create_session(
            url=request.url,
            device=request.device,
            fps=request.fps,
            resolution=request.resolution or (1280, 720),
        )

        logger.info(f"✅ Created browser streaming session {session_id} for {request.url}")

        return CreateBrowserStreamingResponse(
            session_id=session_id,
            url=request.url,
            device=request.device,
            fps=request.fps,
            status="active"
        )

    except Exception as e:
        logger.error(f"❌ Failed to create browser streaming session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{session_id}/info", response_model=SessionInfoResponse)
async def get_session_info(session_id: str):
    """Get info about an active session"""
    try:
        session = browser_webrtc_session_manager.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        return SessionInfoResponse(
            session_id=session.session_id,
            url=session.url,
            device=session.device,
            fps=session.fps,
            status=session.status.value,
            resolution=session.resolution,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting session info: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{session_id}/close")
async def close_session(session_id: str):
    """Close a browser streaming session"""
    try:
        success = await browser_webrtc_session_manager.close_session(session_id)
        if not success:
            raise HTTPException(status_code=404, detail="Session not found")

        logger.info(f"✅ Closed browser streaming session {session_id}")
        return {"status": "closed", "session_id": session_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error closing session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.websocket("/ws/{session_id}")
async def browser_streaming_signaling(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for WebRTC signaling and data channel communication

    Protocol:
    1. Client sends: {"type": "get_offer"}
    2. Server responds: {"type": "offer", "sdp": "...", "ice_candidates": [...]}
    3. Client sends: {"type": "answer", "sdp": "..."}
    4. Server confirms: {"type": "answer_ack"}
    5. Client sends: {"type": "ice_candidate", "candidate": {...}}
    6. Server confirms: {"type": "ice_ack"}

    Data channel messages (bidirectional):
    - Client: {"type": "click|keyboard|scroll|navigate", "data": {...}, "timestamp": number}
    - Server: {"type": "console|network|navigation|error", "data": {...}}
    """
    await websocket.accept()

    session = browser_webrtc_session_manager.get_session(session_id)
    if not session:
        logger.error(f"❌ Session {session_id} not found")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Session not found")
        return

    logger.info(f"🔌 Client connected to browser streaming session {session_id}")

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            message_type = message.get("type")

            logger.debug(f"📨 Received message: {message_type}")

            if message_type == "get_offer":
                # Generate SDP offer and send to client
                try:
                    offer = await session.create_offer()
                    await websocket.send_json(offer)
                    logger.info(f"📤 Sent offer to client for session {session_id}")

                except Exception as e:
                    logger.error(f"Error creating offer: {e}")
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Failed to create offer: {str(e)}"
                    })

            elif message_type == "answer":
                # Accept browser's answer
                try:
                    answer_sdp = message.get("sdp", "")
                    success = await session.set_answer(answer_sdp)

                    if success:
                        await websocket.send_json({"type": "answer_ack"})
                        logger.info(f"✅ Answer accepted for session {session_id}")
                    else:
                        await websocket.send_json({
                            "type": "error",
                            "message": "Failed to set answer"
                        })

                except Exception as e:
                    logger.error(f"Error setting answer: {e}")
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Failed to set answer: {str(e)}"
                    })

            elif message_type == "ice_candidate":
                # Add ICE candidate from browser
                try:
                    candidate = message.get("candidate", {})
                    success = await session.add_ice_candidate(candidate)

                    if success:
                        await websocket.send_json({"type": "ice_ack"})
                        logger.debug(f"✅ ICE candidate added")
                    else:
                        logger.debug(f"Failed to add ICE candidate")

                except Exception as e:
                    logger.error(f"Error adding ICE candidate: {e}")

            elif message_type == "ping":
                # Respond to ping to keep connection alive
                await websocket.send_json({"type": "pong"})

            else:
                logger.warning(f"Unknown message type: {message_type}")

    except WebSocketDisconnect:
        logger.info(f"🔌 Client disconnected from session {session_id}")
    except Exception as e:
        logger.error(f"❌ WebSocket error for session {session_id}: {e}")
    finally:
        # Note: Don't close the session here, let it stay active in case of reconnection
        logger.info(f"WebSocket connection closed for session {session_id}")


# Health check endpoint
@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "browser-streaming"}
