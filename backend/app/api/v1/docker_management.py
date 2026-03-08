"""
Docker Management API Endpoints
Handle browser container creation, lifecycle, and monitoring
"""
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.services.docker_manager import docker_manager
from app.core.webrtc_config import webrtc_config

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/docker",
    tags=["docker"],
)


@router.get("/health")
async def health():
    """Health check endpoint for Docker management service"""
    return {
        "status": "ok",
        "docker_available": docker_manager._docker_available,
        "webrtc_enabled": webrtc_config.WEBRTC_ENABLED,
    }


@router.post("/containers")
async def create_container(
    browser_session_id: str = Query(...),
    browser_type: str = Query("chromium", regex="^(chromium|firefox|webkit)$"),
):
    """
    Create a new browser container

    Args:
        browser_session_id: Browser session ID
        browser_type: Browser type (chromium, firefox, webkit)

    Returns:
        Container information
    """
    if not docker_manager._docker_available:
        raise HTTPException(
            status_code=503,
            detail="Docker is not available. Ensure Docker daemon is running.",
        )

    try:
        container = await docker_manager.create_container(
            session_id=browser_session_id,
            browser_type=browser_type,
        )

        if not container:
            raise HTTPException(
                status_code=500,
                detail="Failed to create container. Check Docker daemon and available ports.",
            )

        return {
            "container_id": container.container_id,
            "session_id": container.session_id,
            "port": container.port,
            "display": container.display,
            "created_at": container.created_at.isoformat(),
            "status": container.status,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating container: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/containers/{browser_session_id}")
async def get_container(browser_session_id: str):
    """
    Get container information

    Args:
        browser_session_id: Browser session ID

    Returns:
        Container information
    """
    container = await docker_manager.get_container(browser_session_id)
    if not container:
        raise HTTPException(status_code=404, detail="Container not found")

    return {
        "container_id": container.container_id,
        "session_id": container.session_id,
        "port": container.port,
        "display": container.display,
        "created_at": container.created_at.isoformat(),
        "status": container.status,
        "uptime": container.uptime,
        "is_idle": container.is_idle,
        "error": container.error,
    }


@router.post("/containers/{browser_session_id}/health-check")
async def check_container_health(browser_session_id: str):
    """
    Check if container is healthy

    Args:
        browser_session_id: Browser session ID

    Returns:
        Health status
    """
    is_healthy = await docker_manager.health_check(browser_session_id)

    return {
        "session_id": browser_session_id,
        "healthy": is_healthy,
    }


@router.delete("/containers/{browser_session_id}")
async def delete_container(browser_session_id: str):
    """
    Stop and remove a container

    Args:
        browser_session_id: Browser session ID

    Returns:
        Deletion status
    """
    try:
        success = await docker_manager.stop_container(browser_session_id)

        if not success:
            raise HTTPException(status_code=404, detail="Container not found")

        return {"status": "deleted", "session_id": browser_session_id}

    except Exception as e:
        logger.error(f"Error deleting container: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_docker_stats():
    """
    Get Docker container statistics

    Returns:
        Container statistics and metrics
    """
    try:
        stats = await docker_manager.get_stats()
        return stats

    except Exception as e:
        logger.error(f"Error getting Docker stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
