"""
Simple screenshot API endpoint for browser display capture
Lightweight alternative to WebRTC without complex dependencies
"""
import logging
import asyncio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import subprocess
import base64
from io import BytesIO

logger = logging.getLogger(__name__)

router = APIRouter()


class ScreenshotResponse(BaseModel):
    """Screenshot response with base64 encoded image"""
    image: str  # base64 encoded PNG
    width: int
    height: int
    format: str = "png"


@router.get("/screenshot", response_model=ScreenshotResponse)
async def get_screenshot(width: int = 1280, height: int = 720):
    """
    Get a screenshot of the Mac display

    Returns base64-encoded PNG image
    Much lighter than WebRTC, good for testing and debugging
    """
    try:
        # Use screencapture (native macOS command)
        # Save to temporary file
        temp_file = "/tmp/screenshot.png"

        cmd = [
            "screencapture",
            "-x",  # No sound
            "-t", "png",  # PNG format
            temp_file
        ]

        result = subprocess.run(cmd, capture_output=True, timeout=5)

        if result.returncode != 0:
            raise Exception(f"screencapture failed: {result.stderr.decode()}")

        # Read and encode the image
        with open(temp_file, "rb") as f:
            image_data = f.read()

        image_base64 = base64.b64encode(image_data).decode()

        return ScreenshotResponse(
            image=image_base64,
            width=width,
            height=height,
            format="png"
        )

    except Exception as e:
        logger.error(f"❌ Failed to capture screenshot: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/screenshot/stream")
async def screenshot_stream():
    """
    Streaming endpoint that returns screenshots every 500ms

    Usage:
    ```javascript
    const eventSource = new EventSource('/api/v1/screenshot/stream');
    eventSource.onmessage = (event) => {
        const img = new Image();
        img.src = 'data:image/png;base64,' + event.data;
        // Display img
    };
    ```
    """
    async def generate():
        try:
            while True:
                # Capture screenshot
                temp_file = "/tmp/screenshot.png"
                result = subprocess.run(
                    ["screencapture", "-x", "-t", "png", temp_file],
                    capture_output=True,
                    timeout=5
                )

                if result.returncode == 0:
                    with open(temp_file, "rb") as f:
                        image_base64 = base64.b64encode(f.read()).decode()
                    yield f"data: {image_base64}\n\n"

                # Wait 500ms before next screenshot
                await asyncio.sleep(0.5)

        except Exception as e:
            logger.error(f"Stream error: {e}")
            yield f"data: {{'error': '{str(e)}'}}\n\n"

    return generate()
