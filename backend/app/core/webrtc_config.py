"""
WebRTC Configuration for Browser Streaming
Defines codec settings, server URLs, and quality parameters
"""
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class WebRTCConfig(BaseSettings):
    """WebRTC streaming configuration"""

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )

    # Feature flags
    WEBRTC_ENABLED: bool = True
    FALLBACK_TO_SCREENSHOT: bool = True

    # Video codec settings
    VIDEO_CODEC: str = "H264"  # H264 or VP8
    VIDEO_BITRATE: int = 2500  # kbps
    VIDEO_FPS: int = 30
    VIDEO_QUALITY: int = 70  # JPEG quality 0-100 if using motion JPEG
    VIDEO_WIDTH: int = 1280
    VIDEO_HEIGHT: int = 720

    # FFmpeg encoder preset (ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow)
    FFMPEG_PRESET: str = "medium"

    # Audio (optional, for future enhancement)
    AUDIO_ENABLED: bool = False
    AUDIO_CODEC: str = "OPUS"
    AUDIO_BITRATE: int = 128  # kbps

    # STUN/TURN servers for NAT traversal
    STUN_SERVERS: List[str] = ["stun:3478"]
    TURN_SERVERS: List[str] = ["turn:coturn:3478"]
    TURN_USERNAME: Optional[str] = "cognitest"
    TURN_PASSWORD: Optional[str] = "cognitest123"

    # ICE candidates
    ICE_TRANSPORT_POLICY: str = "all"  # all or relay

    # Connection timeouts
    WEBRTC_CONNECT_TIMEOUT: int = 10  # seconds
    WEBRTC_IDLE_TIMEOUT: int = 300  # 5 minutes
    WEBRTC_KEEPALIVE_INTERVAL: int = 30  # seconds

    # Container settings
    BROWSER_CONTAINER_IMAGE: str = "cognitest-browser-streaming:latest"
    BROWSER_CONTAINER_MEMORY: str = "2g"
    BROWSER_CONTAINER_CPUS: str = "1"
    BROWSER_CONTAINER_PORT_START: int = 7900
    BROWSER_CONTAINER_PORT_END: int = 8000

    # FFmpeg settings
    FFMPEG_CAPTURE_METHOD: str = "x11grab"  # x11grab for Linux/Docker, gdigrab for Windows
    FFMPEG_OUTPUT_FORMAT: str = "h264"  # h264 or mjpeg
    FFMPEG_PIPE_SIZE: int = 65536  # bytes

    # Performance monitoring
    COLLECT_METRICS: bool = True
    METRICS_INTERVAL: int = 60  # seconds

    # Logging
    WEBRTC_LOG_LEVEL: str = "INFO"  # DEBUG, INFO, WARNING, ERROR


# Global configuration instance
webrtc_config = WebRTCConfig()
