"""
WebRTC streaming API endpoints for real-time browser video streaming
"""
import logging
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, status
from pydantic import BaseModel

try:
    from app.services.webrtc_manager import webrtc_manager
except ImportError as e:
    raise ImportError(f"WebRTC dependencies not installed: {e}")

logger = logging.getLogger(__name__)

router = APIRouter()


class CreateSessionRequest(BaseModel):
    """Request to create a new WebRTC session"""

    browser_id: str
    resolution: tuple = (1280, 720)


class CreateSessionResponse(BaseModel):
    """Response with WebRTC session details"""

    session_id: str
    message: str


class SDPOfferResponse(BaseModel):
    """WebRTC SDP offer with ICE candidates"""

    type: str
    sdp: str
    ice_candidates: list


@router.post("/create", response_model=CreateSessionResponse)
async def create_webrtc_session(request: CreateSessionRequest):
    """
    Create a new WebRTC streaming session

    Returns session_id to use for WebSocket connection
    """
    try:
        session_id = webrtc_manager.create_session(
            browser_id=request.browser_id, resolution=request.resolution
        )

        logger.info(f"✅ Created WebRTC session {session_id} for browser {request.browser_id}")

        return CreateSessionResponse(
            session_id=session_id, message=f"WebRTC session created: {session_id}"
        )

    except Exception as e:
        logger.error(f"❌ Failed to create WebRTC session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.websocket("/ws/{session_id}")
async def webrtc_signaling(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for WebRTC signaling (SDP and ICE exchange)

    Protocol:
    1. Client sends: {"type": "get_offer"}
    2. Server responds: {"type": "offer", "sdp": "...", "ice_candidates": [...]}
    3. Client sends: {"type": "answer", "sdp": "..."}
    4. Server confirms: {"type": "answer_ack"}
    5. Client sends: {"type": "ice_candidate", "candidate": {...}}
    6. Server confirms: {"type": "ice_ack"}
    """
    await websocket.accept()

    session = webrtc_manager.get_session(session_id)
    if not session:
        logger.error(f"❌ Session {session_id} not found")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Session not found")
        return

    logger.info(f"🔌 Client connected to WebRTC session {session_id}")

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
                    logger.error(f"❌ Failed to create offer: {e}")
                    await websocket.send_json({"type": "error", "error": str(e)})

            elif message_type == "answer":
                # Receive answer from client and set remote description
                answer_sdp = message.get("sdp")
                try:
                    success = await session.set_answer(answer_sdp)
                    if success:
                        await websocket.send_json(
                            {"type": "answer_ack", "message": "Answer received and set"}
                        )
                        logger.info(f"✅ Answer set for session {session_id}")
                    else:
                        await websocket.send_json(
                            {"type": "error", "error": "Failed to set answer"}
                        )

                except Exception as e:
                    logger.error(f"❌ Failed to set answer: {e}")
                    await websocket.send_json({"type": "error", "error": str(e)})

            elif message_type == "ice_candidate":
                # Receive ICE candidate from client
                try:
                    candidate = message.get("candidate")
                    success = await session.add_ice_candidate(candidate)
                    if success:
                        await websocket.send_json({"type": "ice_ack"})
                        logger.debug(f"🧊 Added ICE candidate for session {session_id}")

                except Exception as e:
                    logger.error(f"❌ Failed to add ICE candidate: {e}")

            elif message_type == "ping":
                # Keep-alive ping
                await websocket.send_json({"type": "pong"})

            else:
                logger.warning(f"⚠️ Unknown message type: {message_type}")

    except WebSocketDisconnect:
        logger.info(f"🔌 Client disconnected from session {session_id}")
        await webrtc_manager.close_session(session_id)

    except Exception as e:
        logger.error(f"❌ WebSocket error for session {session_id}: {e}")
        await webrtc_manager.close_session(session_id)


@router.get("/health")
async def webrtc_health():
    """Health check endpoint for WebRTC service"""
    return {
        "status": "healthy",
        "active_sessions": webrtc_manager.get_active_sessions(),
        "message": "WebRTC service is running",
    }


@router.post("/session/{session_id}/close")
async def close_session(session_id: str):
    """Close a WebRTC session"""
    try:
        success = await webrtc_manager.close_session(session_id)
        if success:
            return {"message": f"Session {session_id} closed"}
        else:
            raise HTTPException(status_code=404, detail="Session not found")

    except Exception as e:
        logger.error(f"❌ Failed to close session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions")
async def list_sessions():
    """
    List all active WebRTC sessions

    Returns information about all currently streaming browsers
    """
    try:
        sessions_list = []
        for session_id, session in webrtc_manager.sessions.items():
            sessions_list.append({
                "session_id": session_id,
                "browser_id": session.browser_id,
                "resolution": session.resolution,
                "connection_state": session.peer_connection.connectionState if session.peer_connection else "disconnected",
                "ice_connection_state": session.peer_connection.iceConnectionState if session.peer_connection else "disconnected",
                "video_track_active": session.video_track is not None,
            })

        return {
            "total_sessions": len(sessions_list),
            "sessions": sessions_list
        }

    except Exception as e:
        logger.error(f"❌ Failed to list sessions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/session/{session_id}/info")
async def get_session_info(session_id: str):
    """
    Get detailed information about a specific WebRTC session
    """
    try:
        session = webrtc_manager.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        return {
            "session_id": session_id,
            "browser_id": session.browser_id,
            "resolution": session.resolution,
            "connection_state": session.peer_connection.connectionState if session.peer_connection else "disconnected",
            "ice_connection_state": session.peer_connection.iceConnectionState if session.peer_connection else "disconnected",
            "video_track_active": session.video_track is not None,
            "frame_count": session.video_track.frame_count if session.video_track else 0,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to get session info: {e}")
        raise HTTPException(status_code=500, detail=str(e))
