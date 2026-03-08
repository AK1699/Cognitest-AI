#!/bin/bash
# Browser startup script for container
# Launches browser automation with Playwright and waits for connection from backend

set -e

# Logging setup
LOG_FILE="/var/log/supervisor/browser.log"
exec > >(tee -a "$LOG_FILE")
exec 2>&1

echo "[$(date)] Starting browser automation service..."

# Ensure Xvfb is running
if ! pgrep -x "Xvfb" > /dev/null; then
    echo "[$(date)] ERROR: Xvfb not running. Cannot proceed."
    exit 1
fi

echo "[$(date)] Xvfb display: $DISPLAY"

# Wait for X server to be ready
for i in {1..30}; do
    if xdpyinfo -display $DISPLAY > /dev/null 2>&1; then
        echo "[$(date)] X server is ready after $i attempts"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "[$(date)] ERROR: X server failed to start"
        exit 1
    fi
    sleep 0.1
done

# Start FFmpeg video capture if needed
if [ "$ENABLE_FFMPEG" = "true" ]; then
    echo "[$(date)] Starting FFmpeg video capture..."
    supervisorctl -c /etc/supervisor/conf.d/supervisord.conf start ffmpeg
fi

# Start VNC server if needed (fallback)
if [ "$ENABLE_VNC" = "true" ]; then
    echo "[$(date)] Starting VNC server (fallback)..."
    supervisorctl -c /etc/supervisor/conf.d/supervisord.conf start vnc
fi

# Browser service placeholder
# The actual browser instance will be started by the backend via the Playwright API
# This script just ensures the container environment is ready

echo "[$(date)] Browser automation environment is ready"
echo "[$(date)] Waiting for backend connection on port 9222 (Chrome DevTools Protocol)..."

# Keep the container running
# The backend will connect via CDP and start automating the browser
tail -f "$LOG_FILE" &
wait
