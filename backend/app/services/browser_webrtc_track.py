"""
WebRTC Video Track for browser screenshots - converts Playwright screenshots to H.264 video stream
"""
import asyncio
import logging
from io import BytesIO
from aiortc import VideoStreamTrack
from av import VideoFrame
import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)


class BrowserVideoTrack(VideoStreamTrack):
    """
    Converts browser screenshots (JPEG) to WebRTC video stream.

    Receives frames from BrowserSession screenshots and encodes as H.264 video
    for streaming at 15-30 FPS configurable.
    """

    def __init__(self, resolution=(1280, 720), fps=30):
        super().__init__()
        self.resolution = resolution
        self.fps = fps
        self.frame_count = 0
        self.frame_queue: asyncio.Queue = asyncio.Queue(maxsize=60)
        self.started = False

        logger.info(f"🎬 Creating BrowserVideoTrack: {resolution[0]}x{resolution[1]} @ {fps}FPS")

    async def emit_frame(self, screenshot_bytes: bytes) -> None:
        """
        Queue a screenshot frame for streaming.

        Args:
            screenshot_bytes: Raw JPEG bytes from Playwright screenshot
        """
        if not self.started:
            return

        try:
            # Drop frame if queue is full (avoid memory buildup)
            if self.frame_queue.full():
                logger.debug(f"⚠️ Frame queue full, dropping frame {self.frame_count}")
                try:
                    self.frame_queue.get_nowait()
                except asyncio.QueueEmpty:
                    pass

            # Queue the frame for async processing
            await self.frame_queue.put(screenshot_bytes)

        except Exception as e:
            logger.error(f"Error queuing frame: {e}")

    async def start(self) -> None:
        """Start the video track"""
        self.started = True
        logger.info(f"✅ Video track started")

    async def stop(self) -> None:
        """Stop the video track"""
        self.started = False
        logger.info(f"✅ Video track stopped")

    async def recv(self) -> VideoFrame:
        """
        Receive and convert next video frame from queue.

        Converts JPEG bytes to VideoFrame in BGR24 format for WebRTC.
        """
        try:
            # Get frame from queue with timeout
            try:
                screenshot_bytes = await asyncio.wait_for(
                    self.frame_queue.get(), timeout=1.0
                )
            except asyncio.TimeoutError:
                # Return black frame if no screenshot available
                logger.debug("No frames in queue, returning black frame")
                black_frame = np.zeros((self.resolution[1], self.resolution[0], 3), dtype=np.uint8)
                frame = VideoFrame.from_ndarray(black_frame, format="bgr24")
                frame.pts = self.frame_count
                frame.time_base = self.time_base
                self.frame_count += 1
                return frame

            # Decode JPEG
            image = Image.open(BytesIO(screenshot_bytes)).convert("RGB")

            # Resize if needed
            if image.width != self.resolution[0] or image.height != self.resolution[1]:
                image = image.resize(self.resolution, Image.Resampling.LANCZOS)

            # Convert to numpy BGR24 (PIL is RGB, need to reverse channels)
            frame_array = np.array(image, dtype=np.uint8)
            frame_array = frame_array[:, :, ::-1]  # RGB -> BGR

            # Create VideoFrame
            frame = VideoFrame.from_ndarray(frame_array, format="bgr24")
            frame.pts = self.frame_count
            frame.time_base = self.time_base

            # Emit the frame
            await self.emit(frame)
            self.frame_count += 1

            # Log every 30 frames (1 second at 30 FPS)
            if self.frame_count % 30 == 0:
                logger.debug(f"📹 Video frame {self.frame_count}")

            return frame

        except Exception as e:
            logger.error(f"Error processing frame: {e}")
            # Return black frame on error
            black_frame = np.zeros((self.resolution[1], self.resolution[0], 3), dtype=np.uint8)
            frame = VideoFrame.from_ndarray(black_frame, format="bgr24")
            frame.pts = self.frame_count
            frame.time_base = self.time_base
            self.frame_count += 1
            return frame
