"""
Browser Launcher API - Launch multiple browsers at different device sizes
Uses Playwright to automate browser launching for multi-device testing
"""
import logging
import asyncio
import subprocess
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException

logger = logging.getLogger(__name__)

router = APIRouter()


class DeviceConfig(BaseModel):
    """Device configuration for testing"""
    name: str
    width: int
    height: int


class BrowserLaunchRequest(BaseModel):
    """Request to launch browsers for testing"""
    url: str
    devices: List[str]  # Device names: "iPhone 15", "iPad", "Desktop", etc.
    browser: str = "chrome"  # chrome, safari, firefox


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


def get_browser_app_name(browser: str) -> str:
    """Get the macOS app name for the browser"""
    browser_map = {
        "chrome": "Google Chrome",
        "safari": "Safari",
        "firefox": "Firefox",
    }
    return browser_map.get(browser.lower(), "Google Chrome")


def launch_browser_window(
    url: str,
    width: int,
    height: int,
    browser: str = "chrome",
    position_index: int = 0
) -> bool:
    """
    Launch a browser window at specific size using macOS commands

    Args:
        url: Website URL to open
        width: Window width
        height: Window height
        browser: Browser to use (chrome, safari, firefox)
        position_index: For positioning multiple windows

    Returns:
        True if successful, False otherwise
    """
    try:
        browser_app = get_browser_app_name(browser)

        # macOS command to open browser with specific window size
        cmd = [
            "open",
            "-n",
            "-a",
            browser_app,
            "--args",
            f"--window-size={width},{height}",
            "--new-window",
            url
        ]

        # Execute the command
        result = subprocess.run(cmd, capture_output=True, timeout=10)

        if result.returncode == 0:
            logger.info(f"✅ Launched {browser_app} at {width}x{height}: {url}")
            return True
        else:
            logger.error(f"❌ Failed to launch browser: {result.stderr.decode()}")
            return False

    except Exception as e:
        logger.error(f"❌ Error launching browser: {e}")
        return False


@router.post("/launch", response_model=BrowserLaunchResponse)
async def launch_test_browsers(request: BrowserLaunchRequest):
    """
    Launch multiple browser windows for multi-device testing

    Each browser opens at a specific device size and navigates to the URL
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

        # Launch browsers
        launched = []
        for idx, device_name in enumerate(request.devices):
            device_config = DEVICE_CONFIGS[device_name]

            success = launch_browser_window(
                url=request.url,
                width=device_config.width,
                height=device_config.height,
                browser=request.browser,
                position_index=idx
            )

            if success:
                launched.append({
                    "device": device_name,
                    "width": device_config.width,
                    "height": device_config.height,
                    "status": "launched"
                })

                # Small delay between launches to prevent overlap
                await asyncio.sleep(0.5)

        if not launched:
            raise HTTPException(status_code=500, detail="Failed to launch any browsers")

        return BrowserLaunchResponse(
            status="success",
            message=f"✅ Launched {len(launched)} browsers. Arrange them on your screen, then go to /webrtc-multi to stream!",
            launched_browsers=launched
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error in launch_test_browsers: {e}")
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


@router.get("/info")
async def browser_launcher_info():
    """Get info about browser launcher service"""
    return {
        "service": "Browser Launcher",
        "description": "Launch multiple browsers at different device sizes for testing",
        "supported_browsers": ["chrome", "safari", "firefox"],
        "supported_devices": list(DEVICE_CONFIGS.keys()),
        "workflow": [
            "1. POST /launch with URL and device list",
            "2. Browsers open at specified sizes",
            "3. Arrange windows on your Mac screen",
            "4. Go to /webrtc-multi to stream them",
            "5. Add browsers and connect for live streams"
        ]
    }
