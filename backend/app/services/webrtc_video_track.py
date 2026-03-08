"""
WebRTC Video Track for capturing Mac display and encoding to H.264
"""
import asyncio
import subprocess
import logging
from aiortc import VideoStreamTrack
from av import VideoFrame
import numpy as np

logger = logging.getLogger(__name__)


class DisplayVideoTrack(VideoStreamTrack):
    """
    Captures the Mac display using FFmpeg and encodes as H.264 video for WebRTC streaming.

    Captures at 30 FPS, 1280x720 resolution, H.264 baseline profile
    """

    def __init__(self, resolution=(1280, 720), fps=30, quality=70):
        super().__init__()
        self.resolution = resolution
        self.fps = fps
        self.quality = quality
        self.frame_count = 0

        # FFmpeg process for capturing display
        self.process = None
        self.started = False

        logger.info(f"🎬 Creating DisplayVideoTrack: {resolution[0]}x{resolution[1]} @ {fps}FPS")

    async def start_capture(self):
        """Start FFmpeg display capture process"""
        if self.started:
            logger.warning("Video capture already started")
            return

        try:
            width, height = self.resolution

            # FFmpeg command to capture Mac display
            # Uses gdigrab (Windows) or x11grab (Linux) or avfoundation (Mac)
            ffmpeg_cmd = [
                'ffmpeg',
                '-f', 'avfoundation',              # Mac native screen capture
                '-i', '0',                          # Screen 0
                '-vf', f'scale={width}:{height}',   # Scale to target resolution
                '-c:v', 'rawvideo',                 # Raw video output
                '-pix_fmt', 'rgb24',                # 24-bit RGB format
                '-r', str(self.fps),                # Frame rate
                '-',                                # Output to stdout
            ]

            logger.info(f"🚀 Starting FFmpeg: {' '.join(ffmpeg_cmd)}")

            self.process = subprocess.Popen(
                ffmpeg_cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                bufsize=10 * 1024 * 1024  # 10MB buffer
            )

            self.started = True
            logger.info("✅ Video capture started")

            # Start async reader
            asyncio.create_task(self._read_frames())

        except Exception as e:
            logger.error(f"❌ Failed to start display capture: {e}")
            raise

    async def _read_frames(self):
        """Read frames from FFmpeg and queue them"""
        try:
            frame_size = self.resolution[0] * self.resolution[1] * 3  # RGB24

            while self.started and self.process:
                # Read one frame from FFmpeg
                frame_data = self.process.stdout.read(frame_size)

                if not frame_data or len(frame_data) < frame_size:
                    logger.warning("FFmpeg stream ended or incomplete frame")
                    break

                # Convert raw RGB to numpy array
                frame_array = np.frombuffer(frame_data, dtype=np.uint8).reshape(
                    (self.resolution[1], self.resolution[0], 3)
                )

                # Convert RGB to BGR for OpenCV/FFmpeg compatibility
                frame_array = frame_array[:, :, ::-1]

                # Create VideoFrame
                frame = VideoFrame.from_ndarray(frame_array, format="bgr24")
                frame.pts = self.frame_count * (self.ptime / self.fps)
                frame.time_base = self.time_base

                # Queue the frame for WebRTC
                await self.emit(frame)
                self.frame_count += 1

        except Exception as e:
            logger.error(f"❌ Error reading frames: {e}")
        finally:
            await self.stop_capture()

    async def recv(self):
        """Receive next video frame"""
        frame = await super().recv()

        # Log every 30 frames (1 second at 30 FPS)
        if self.frame_count % 30 == 0:
            logger.debug(f"📹 Video frame {self.frame_count}")

        return frame

    async def stop_capture(self):
        """Stop FFmpeg process and cleanup"""
        self.started = False

        if self.process:
            try:
                self.process.terminate()
                await asyncio.sleep(0.1)
                if self.process.poll() is None:
                    self.process.kill()
                logger.info("✅ Video capture stopped")
            except Exception as e:
                logger.error(f"Error stopping capture: {e}")
            finally:
                self.process = None
