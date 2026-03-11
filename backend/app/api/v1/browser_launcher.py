"""
Browser Launcher API - Launch headless browsers with screenshot streaming
Launches Playwright browsers in headless mode and streams via HTTP
"""
import logging
import asyncio
import uuid
from typing import List, Optional, Dict
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException

logger = logging.getLogger(__name__)

router = APIRouter()

# Global browser session storage
browser_sessions: Dict[str, any] = {}


class DeviceConfig(BaseModel):
    """Device configuration for testing"""
    name: str
    width: int
    height: int


class BrowserLaunchRequest(BaseModel):
    """Request to launch browsers for testing"""
    url: str
    devices: List[str]  # Device names: "iPhone 15", "iPad", "Desktop", etc.
    browser: str = "chrome"  # chrome, chromium, firefox, webkit


class BrowserLaunchResponse(BaseModel):
    """Response after launching browsers"""
    status: str
    message: str
    launched_browsers: List[dict]


# Predefined device configurations
DEVICE_CONFIGS = {
    "iPhone 15": DeviceConfig(name="iPhone 15", width=430, height=932),
    "iPhone 15 Pro Max": DeviceConfig(name="iPhone 15 Pro Max", width=440, height=956),
    "Galaxy S24": DeviceConfig(name="Galaxy S24", width=412, height=915),
    "Galaxy Tab S9": DeviceConfig(name="Galaxy Tab S9", width=1280, height=800),
    "Pixel 8": DeviceConfig(name="Pixel 8", width=412, height=915),
    "iPad": DeviceConfig(name="iPad", width=1024, height=768),
    "iPad Pro": DeviceConfig(name="iPad Pro", width=1366, height=1024),
    "Desktop": DeviceConfig(name="Desktop", width=1280, height=720),
    "Desktop FHD": DeviceConfig(name="Desktop FHD", width=1920, height=1080),
}


def _map_device_to_preset(device_name: str) -> str:
    """Map launcher device name to browser_session_service device preset"""
    device_preset_map = {
        "iPhone 15": "iphone_14_pro_max",
        "iPhone 15 Pro Max": "iphone_14_pro_max",
        "Galaxy S24": "pixel_7",
        "Galaxy Tab S9": "ipad_pro",
        "Pixel 8": "pixel_7",
        "iPad": "ipad_pro",
        "iPad Pro": "ipad_pro",
        "Desktop": "desktop_1280",
        "Desktop FHD": "desktop_chrome",
    }
    return device_preset_map.get(device_name, "desktop_1280")


async def launch_headless_browser(
    url: str,
    device_name: str,
    width: int,
    height: int,
    browser: str = "chromium"
) -> dict:
    """
    Launch a headless Playwright browser with screenshot streaming

    Args:
        url: Website URL to navigate to
        device_name: Name of the device (for display)
        width: Viewport width
        height: Viewport height
        browser: Browser type (chromium, firefox, webkit)

    Returns:
        Session information including session ID for screenshot streaming
    """
    try:
        from app.services.browser_session_service import browser_session_manager

        session_id = f"browser-{device_name.lower().replace(' ', '-')}-{uuid.uuid4().hex[:8]}"

        logger.info(f"🌐 Launching headless {browser} browser for {device_name} ({width}x{height})")

        # Map browser names to Playwright browser types
        browser_map = {
            "chrome": "chromium",
            "safari": "webkit",
            "firefox": "firefox",
            "chromium": "chromium",
        }
        playwright_browser = browser_map.get(browser.lower(), "chromium")

        # Map device name to browser session service preset
        device_preset = _map_device_to_preset(device_name)

        # Create callback for session updates
        async def on_update(update_data: dict):
            """Callback to handle session updates"""
            logger.debug(f"Session {session_id} update: {update_data.get('type')}")

        # Create headless browser session with Playwright
        browser_session = await browser_session_manager.create_session(
            session_id=session_id,
            on_update=on_update,
            browser_type=playwright_browser,
            device=device_preset,
            initial_url=url,
            headless=True,  # Headless mode - no GUI windows
            record_video=False,  # Don't record video files, we'll stream screenshots
        )

        if not browser_session:
            raise Exception(f"Failed to create browser session: {browser_session_manager.last_error}")

        # Get the page from the session
        page = browser_session.page
        if not page:
            raise Exception("Browser session created but page is not available")

        logger.info(f"📄 Session created and ready: {session_id}")
        logger.info(f"✅ Browser streaming via screenshots - {device_name} ready")

        # For now, use the browser session_id as the WebRTC session ID
        # The frontend will use this to establish a connection
        # In a full implementation, we would create a WebRTC session that captures
        # screenshots from the browser session
        webrtc_session_id = session_id

        # Store session for management
        browser_sessions[session_id] = {
            "device": device_name,
            "browser_session": browser_session,
            "width": width,
            "height": height,
            "url": url,
            "webrtc_session_id": webrtc_session_id,
        }

        return {
            "device": device_name,
            "width": width,
            "height": height,
            "session_id": session_id,
            "webrtc_session_id": webrtc_session_id,
            "stream_url": f"/api/v1/browser-launcher/stream/{session_id}",
            "status": "running",
        }

    except Exception as e:
        logger.error(f"❌ Failed to launch {device_name}: {e}", exc_info=True)
        raise


@router.post("/launch", response_model=BrowserLaunchResponse)
async def launch_test_browsers(request: BrowserLaunchRequest):
    """
    Launch multiple headless Playwright browsers for multi-device testing

    Browsers run in headless mode and are embedded in web dashboard
    """
    try:
        # Validate URL
        if not request.url.startswith(('http://', 'https://')):
            raise HTTPException(status_code=400, detail="Invalid URL - must start with http:// or https://")

        # Validate devices
        invalid_devices = [d for d in request.devices if d not in DEVICE_CONFIGS]
        if invalid_devices:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid devices: {invalid_devices}. Available: {list(DEVICE_CONFIGS.keys())}"
            )

        # Launch headless browsers
        launched = []
        for device_name in request.devices:
            device_config = DEVICE_CONFIGS[device_name]

            try:
                session_info = await launch_headless_browser(
                    url=request.url,
                    device_name=device_name,
                    width=device_config.width,
                    height=device_config.height,
                    browser=request.browser,
                )
                launched.append(session_info)

                # Stagger launches
                await asyncio.sleep(1)

            except Exception as e:
                logger.error(f"Failed to launch {device_name}: {e}")
                # Continue with other devices

        if not launched:
            raise HTTPException(
                status_code=500,
                detail="Failed to launch any browsers. Check logs for details."
            )

        return BrowserLaunchResponse(
            status="success",
            message=f"✅ Launched {len(launched)} headless browsers - embedded in web dashboard",
            launched_browsers=launched
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error in launch_test_browsers: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/devices")
async def get_available_devices():
    """Get list of available device configurations"""
    return {
        "devices": [
            {
                "name": name,
                "width": config.width,
                "height": config.height
            }
            for name, config in DEVICE_CONFIGS.items()
        ]
    }


@router.delete("/sessions/{session_id}")
async def stop_browser_session(session_id: str):
    """Stop a browser session"""
    try:
        if session_id in browser_sessions:
            session = browser_sessions[session_id]
            browser_session = session.get("browser_session")

            # Stop the BrowserSession object (which handles cleanup)
            if hasattr(browser_session, 'stop'):
                try:
                    await browser_session.stop()
                except Exception as e:
                    logger.warning(f"Error stopping session: {e}")

            del browser_sessions[session_id]
            logger.info(f"✅ Stopped session: {session_id}")

        return {"status": "success", "message": "Browser session stopped"}

    except Exception as e:
        logger.error(f"Error stopping session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/sessions")
async def stop_all_sessions():
    """Stop all browser sessions"""
    try:
        session_ids = list(browser_sessions.keys())

        for session_id in session_ids:
            try:
                await stop_browser_session(session_id)
            except:
                pass

        logger.info("✅ All sessions stopped")
        return {"status": "success", "message": "All sessions stopped"}

    except Exception as e:
        logger.error(f"Error cleaning up sessions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/info")
async def browser_launcher_info():
    """Get info about browser launcher service"""
    return {
        "service": "Browser Launcher (Headless Mode)",
        "description": "Launch headless Playwright browsers embedded in web dashboard",
        "supported_browsers": ["chrome", "firefox", "webkit"],
        "supported_devices": list(DEVICE_CONFIGS.keys()),
        "streaming": "Screenshot-based streaming via HTTP",
        "workflow": [
            "1. POST /launch with URL and device list",
            "2. Backend launches headless Playwright browsers",
            "3. Each browser at specified viewport size",
            "4. Frontend receives session IDs",
            "5. Frontend displays screenshot streams",
            "6. User sees all browsers at different sizes in web dashboard"
        ],
        "note": "Headless mode - no native Mac windows, all browsers embedded in web app"
    }
