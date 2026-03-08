# Browser Streaming Container for WebRTC
# Combines Xvfb virtual display, FFmpeg video capture, and Playwright browser automation
# Targets: 1280x720@30fps H.264 video streaming via WebRTC

FROM python:3.11-slim

ENV DISPLAY=:99 \
    XVFB_DISPLAY_WIDTH=1280 \
    XVFB_DISPLAY_HEIGHT=720 \
    XVFB_DISPLAY_DEPTH=24 \
    FFMPEG_FORMAT=x11grab \
    FFMPEG_INPUT_FRAMERATE=30 \
    FFMPEG_OUTPUT_FRAMERATE=30 \
    FFMPEG_VIDEO_CODEC=libx264 \
    FFMPEG_PRESET=medium

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    # X11 virtual display
    xvfb \
    x11-utils \
    # Video encoding
    ffmpeg \
    libavcodec-extra \
    # Browser dependencies (Chromium/Firefox)
    fonts-liberation \
    libappindicator3-1 \
    libnss3 \
    lsb-release \
    xdg-utils \
    ca-certificates \
    # System utilities
    supervisor \
    curl \
    wget \
    gnupg \
    unzip \
    # Development tools
    git \
    # Additional X11 tools
    wmctrl \
    xdotool \
    && rm -rf /var/lib/apt/lists/*

# Install Playwright and dependencies
RUN pip install --no-cache-dir playwright aiortc av aiohttp

# Install browsers using Playwright
RUN playwright install && \
    playwright install-deps

# Create app directory
WORKDIR /app

# Copy startup scripts
COPY start-browser.sh /usr/local/bin/start-browser.sh
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

RUN chmod +x /usr/local/bin/start-browser.sh

# Create necessary directories
RUN mkdir -p /var/log/supervisor /tmp/ffmpeg

# Expose ports
# 7900: VNC port (for noVNC fallback)
# 9001: Supervisor control port
EXPOSE 7900 9001

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:9001/RPC2 || exit 1

# Start supervisor (manages Xvfb, FFmpeg, and browser process)
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
