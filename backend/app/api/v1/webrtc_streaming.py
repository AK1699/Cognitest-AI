"""
WebRTC Streaming API Endpoint
Handles WebRTC signaling for browser streaming (SDP/ICE exchange)
"""
import json
import logging
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Query
from aiortc import RTCSessionDescription

from app.services.webrtc_session_manager import webrtc_manager
from app.core.webrtc_config import webrtc_config

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/webrtc",
    tags=["webrtc"],
)


@router.get("/health")
async def health():
    """Health check endpoint for WebRTC service"""
    return {
        "status": "ok",
        "webrtc_enabled": webrtc_config.WEBRTC_ENABLED,
        "active_sessions": len(webrtc_manager.sessions),
    }


@router.websocket("/ws/streaming/{browser_session_id}")
async def websocket_streaming_endpoint(websocket: WebSocket, browser_session_id: str):
    """
    WebSocket endpoint for WebRTC signaling

    Protocol:
    1. Client connects with browser_session_id
    2. Backend creates WebRTC session and returns session_id
    3. Client sends SDP offer
    4. Backend responds with SDP answer
    5. ICE candidates exchanged via WebSocket

    Message format (JSON):
    {
        "type": "offer" | "answer" | "ice-candidate" | "session-created" | "error",
        "data": {
            "sdp": "...",  # for offer/answer
            "candidate": "...",  # for ice-candidate
            "sdpMid": "...",
            "sdpMLineIndex": 0,
            "session_id": "...",  # for session-created
            "message": "..."  # for error
        }
    }
    """
    await websocket.accept()

    session_id: Optional[str] = None
    try:
        # Create WebRTC session for this connection
        session_id = await webrtc_manager.create_session(
            browser_session_id=browser_session_id,
            on_state_change=None,  # TODO: Implement connection state notifications
        )

        # Send session created message
        await websocket.send_json(
            {
                "type": "session-created",
                "data": {
                    "session_id": session_id,
                    "stun_servers": webrtc_config.STUN_SERVERS,
                    "turn_servers": webrtc_config.TURN_SERVERS,
                    "turn_username": webrtc_config.TURN_USERNAME,
                    "turn_password": webrtc_config.TURN_PASSWORD,
                },
            }
        )

        logger.info(f"WebRTC session created: {session_id} for browser {browser_session_id}")

        # Handle messages
        while True:
            message = await websocket.receive_text()
            data = json.loads(message)
            msg_type = data.get("type")

            if msg_type == "offer":
                # Receive SDP offer from client
                sdp = data.get("data", {}).get("sdp")
                if not sdp:
                    await websocket.send_json(
                        {
                            "type": "error",
                            "data": {"message": "Missing SDP in offer"},
                        }
                    )
                    continue

                try:
                    # Create RTCSessionDescription from SDP
                    offer = RTCSessionDescription(sdp=sdp, type="offer")

                    # Handle offer and get answer
                    answer = await webrtc_manager.handle_offer(session_id, offer)

                    if answer:
                        await websocket.send_json(
                            {
                                "type": "answer",
                                "data": {"sdp": answer.sdp},
                            }
                        )
                        logger.info(f"Sent answer for session {session_id}")
                    else:
                        await websocket.send_json(
                            {
                                "type": "error",
                                "data": {"message": "Failed to create answer"},
                            }
                        )

                except Exception as e:
                    logger.error(f"Error handling offer: {e}")
                    await websocket.send_json(
                        {
                            "type": "error",
                            "data": {"message": f"Error: {str(e)}"},
                        }
                    )

            elif msg_type == "ice-candidate":
                # Receive ICE candidate from client
                candidate_data = data.get("data", {})
                candidate = candidate_data.get("candidate")
                sdp_mid = candidate_data.get("sdpMid")
                sdp_mline_index = candidate_data.get("sdpMLineIndex", 0)

                if not candidate:
                    logger.warning("Received empty ICE candidate")
                    continue

                try:
                    await webrtc_manager.add_ice_candidate(
                        session_id=session_id,
                        candidate_sdp=candidate,
                        sdp_mid=sdp_mid,
                        sdp_mline_index=sdp_mline_index,
                    )
                except Exception as e:
                    logger.error(f"Error adding ICE candidate: {e}")

            else:
                logger.warning(f"Unknown message type: {msg_type}")

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for session {session_id}")
        if session_id:
            await webrtc_manager.close_session(session_id)

    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        if session_id:
            await webrtc_manager.close_session(session_id)


@router.post("/sessions")
async def create_streaming_session(browser_session_id: str = Query(...)):
    """
    Create a WebRTC streaming session

    Returns session configuration for the client
    """
    try:
        session_id = await webrtc_manager.create_session(
            browser_session_id=browser_session_id
        )

        return {
            "session_id": session_id,
            "stun_servers": webrtc_config.STUN_SERVERS,
            "turn_servers": webrtc_config.TURN_SERVERS,
            "turn_username": webrtc_config.TURN_USERNAME,
            "turn_password": webrtc_config.TURN_PASSWORD,
            "ice_transport_policy": webrtc_config.ICE_TRANSPORT_POLICY,
        }

    except Exception as e:
        logger.error(f"Error creating streaming session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/sessions/{session_id}")
async def close_streaming_session(session_id: str):
    """Close a WebRTC streaming session"""
    try:
        await webrtc_manager.close_session(session_id)
        return {"status": "closed"}

    except Exception as e:
        logger.error(f"Error closing streaming session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions/{session_id}")
async def get_session_info(session_id: str):
    """Get information about a WebRTC session"""
    session = await webrtc_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "session_id": session_id,
        "created_at": session.created_at.isoformat(),
        "connection_state": session.pc.connectionState,
        "ice_connection_state": session.pc.iceConnectionState,
        "connected": session.connection_established,
        "frame_count": session.video_track.frame_count if session.video_track else 0,
    }
