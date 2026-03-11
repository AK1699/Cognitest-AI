"""
WebRTC Video Track for capturing Mac display and encoding to H.264
"""
import asyncio
import subprocess
import logging
import threading
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
        self.stderr_thread = None

        logger.info(f"🎬 Creating DisplayVideoTrack: {resolution[0]}x{resolution[1]} @ {fps}FPS")

    async def start_capture(self):
        """Start FFmpeg display capture process"""
        if self.started:
            logger.warning("Video capture already started")
            return

        try:
            width, height = self.resolution

            # FFmpeg command to capture Mac display
            # Uses avfoundation (Mac) - device 3 is "Capture screen 0"
            # Note: On Mac, avfoundation devices are: 0=camera, 1=OBS, 2=desk camera, 3=screen
            ffmpeg_cmd = [
                'ffmpeg',
                '-f', 'avfoundation',                      # Mac native screen capture
                '-pix_fmt', 'uyvy422',                     # Specify input pixel format (supported by avfoundation)
                '-i', '3',                                  # Screen 0 (device index 3)
                '-vf', f'scale={width}:{height},format=bgr24',  # Scale and convert to BGR24
                '-c:v', 'rawvideo',                        # Raw video output
                '-pix_fmt', 'bgr24',                       # 24-bit BGR format (OpenCV compatible)
                '-r', str(self.fps),                       # Frame rate
                '-f', 'rawvideo',                          # Output format is raw video
                '-hide_banner',                            # Suppress FFmpeg info banner
                '-loglevel', 'error',                      # Only show errors
                '-',                                       # Output to stdout
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

            # Start thread to read FFmpeg stderr
            self.stderr_thread = threading.Thread(target=self._read_stderr, daemon=True)
            self.stderr_thread.start()

            # Start async reader
            asyncio.create_task(self._read_frames())

        except Exception as e:
            logger.error(f"❌ Failed to start display capture: {e}")
            raise

    def _read_stderr(self):
        """Read FFmpeg stderr in a background thread"""
        try:
            if not self.process or not self.process.stderr:
                return

            for line in iter(self.process.stderr.readline, b''):
                if not line:
                    break
                msg = line.decode('utf-8', errors='ignore').strip()
                if msg:
                    logger.warning(f"FFmpeg: {msg}")
        except Exception as e:
            logger.error(f"Error reading FFmpeg stderr: {e}")

    async def _read_frames(self):
        """Read frames from FFmpeg and queue them"""
        try:
            frame_size = self.resolution[0] * self.resolution[1] * 3  # RGB24
            consecutive_errors = 0
            max_consecutive_errors = 5

            while self.started and self.process:
                try:
                    # Read one frame from FFmpeg
                    frame_data = self.process.stdout.read(frame_size)

                    if not frame_data or len(frame_data) < frame_size:
                        if not frame_data:
                            logger.warning("FFmpeg stream ended")
                        else:
                            logger.warning(
                                f"Incomplete frame: got {len(frame_data)} bytes, expected {frame_size}"
                            )
                        break

                    # Reset error counter on successful frame read
                    consecutive_errors = 0

                    # Convert raw RGB to numpy array
                    frame_array = np.frombuffer(frame_data, dtype=np.uint8).reshape(
                        (self.resolution[1], self.resolution[0], 3)
                    )

                    # Convert RGB to BGR for OpenCV/FFmpeg compatibility
                    frame_array = frame_array[:, :, ::-1]

                    # Create VideoFrame
                    frame = VideoFrame.from_ndarray(frame_array, format="bgr24")
                    # Set timestamp for the frame
                    frame.pts = self.frame_count
                    frame.time_base = self.time_base

                    # Queue the frame for WebRTC
                    await self.emit(frame)
                    self.frame_count += 1

                except Exception as frame_error:
                    consecutive_errors += 1
                    logger.error(
                        f"Error processing frame (attempt {consecutive_errors}/{max_consecutive_errors}): {frame_error}"
                    )

                    if consecutive_errors >= max_consecutive_errors:
                        logger.error("Too many consecutive frame errors, stopping capture")
                        break

                    await asyncio.sleep(0.1)

        except Exception as e:
            logger.error(f"❌ Fatal error reading frames: {e}")
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
