"""
Docker Container Manager for Browser Streaming
Handles creation, lifecycle, and cleanup of browser containers
"""
import asyncio
import logging
import socket
import subprocess
import time
from typing import Dict, Optional, List
from dataclasses import dataclass, field
from datetime import datetime
import json

from app.core.webrtc_config import webrtc_config

logger = logging.getLogger(__name__)


@dataclass
class ContainerInfo:
    """Information about a running browser container"""
    container_id: str
    session_id: str
    port: int
    display: str
    created_at: datetime = field(default_factory=datetime.now)
    last_activity: datetime = field(default_factory=datetime.now)
    status: str = "running"  # running, stopped, error
    error: Optional[str] = None

    @property
    def is_idle(self) -> bool:
        """Check if container is idle"""
        elapsed = (datetime.now() - self.last_activity).total_seconds()
        return elapsed > webrtc_config.WEBRTC_IDLE_TIMEOUT

    @property
    def uptime(self) -> float:
        """Get container uptime in seconds"""
        return (datetime.now() - self.created_at).total_seconds()


class DockerManager:
    """
    Manages Docker containers for browser streaming
    Handles:
    - Container creation and cleanup
    - Port allocation
    - Health monitoring
    - Resource management
    """

    def __init__(self):
        """Initialize Docker manager"""
        self.containers: Dict[str, ContainerInfo] = {}
        self.port_pool: List[int] = list(
            range(
                webrtc_config.BROWSER_CONTAINER_PORT_START,
                webrtc_config.BROWSER_CONTAINER_PORT_END + 1,
            )
        )
        self.used_ports: set = set()
        self._cleanup_task: Optional[asyncio.Task] = None
        self._lock = asyncio.Lock()
        self._docker_available = self._check_docker()

    def _check_docker(self) -> bool:
        """Check if Docker is available"""
        try:
            result = subprocess.run(
                ["docker", "info"],
                capture_output=True,
                timeout=5,
            )
            if result.returncode == 0:
                logger.info("✅ Docker daemon is available")
                return True
            else:
                logger.warning("⚠️  Docker daemon not responding")
                return False
        except FileNotFoundError:
            logger.warning("⚠️  Docker CLI not found. Install Docker to use browser streaming.")
            return False
        except subprocess.TimeoutExpired:
            logger.warning("⚠️  Docker daemon timeout")
            return False
        except Exception as e:
            logger.warning(f"⚠️  Docker check failed: {e}")
            return False

    async def create_container(self, session_id: str, browser_type: str = "chromium") -> Optional[ContainerInfo]:
        """
        Create a new browser container

        Args:
            session_id: Browser session ID
            browser_type: Browser type (chromium, firefox, webkit)

        Returns:
            ContainerInfo if successful, None otherwise
        """
        if not self._docker_available:
            logger.error("Docker not available. Cannot create container.")
            return None

        async with self._lock:
            try:
                # Allocate port
                port = self._allocate_port()
                if not port:
                    logger.error("No available ports for container")
                    return None

                display = f":{port - webrtc_config.BROWSER_CONTAINER_PORT_START + 99}"

                # Create container
                container_id = await self._docker_create(
                    session_id=session_id,
                    port=port,
                    display=display,
                    browser_type=browser_type,
                )

                if not container_id:
                    self._free_port(port)
                    return None

                # Create container info
                container = ContainerInfo(
                    container_id=container_id,
                    session_id=session_id,
                    port=port,
                    display=display,
                )

                self.containers[session_id] = container
                logger.info(
                    f"Created container {container_id} for session {session_id} "
                    f"on port {port} with display {display}"
                )

                return container

            except Exception as e:
                logger.error(f"Error creating container for session {session_id}: {e}")
                return None

    async def get_container(self, session_id: str) -> Optional[ContainerInfo]:
        """Get container info by session ID"""
        return self.containers.get(session_id)

    async def stop_container(self, session_id: str) -> bool:
        """
        Stop and remove a container

        Args:
            session_id: Browser session ID

        Returns:
            True if successful, False otherwise
        """
        async with self._lock:
            container = self.containers.pop(session_id, None)
            if not container:
                return False

            try:
                # Stop and remove container
                result = subprocess.run(
                    ["docker", "stop", "-t", "5", container.container_id],
                    capture_output=True,
                    timeout=10,
                )

                if result.returncode == 0:
                    logger.info(f"Stopped container {container.container_id}")
                else:
                    logger.warning(f"Failed to stop container: {result.stderr.decode()}")

                # Remove container
                subprocess.run(
                    ["docker", "rm", container.container_id],
                    capture_output=True,
                    timeout=5,
                )

                # Free port
                self._free_port(container.port)

                return True

            except Exception as e:
                logger.error(f"Error stopping container {container.container_id}: {e}")
                return False

    async def health_check(self, session_id: str) -> bool:
        """
        Check if container is healthy

        Args:
            session_id: Browser session ID

        Returns:
            True if healthy, False otherwise
        """
        container = self.containers.get(session_id)
        if not container:
            return False

        try:
            # Check if container is running
            result = subprocess.run(
                ["docker", "inspect", "-f", "{{.State.Running}}", container.container_id],
                capture_output=True,
                timeout=5,
            )

            is_running = result.stdout.decode().strip() == "true"

            if is_running:
                container.status = "running"
                container.last_activity = datetime.now()
                return True
            else:
                container.status = "stopped"
                return False

        except Exception as e:
            logger.warning(f"Health check failed for {session_id}: {e}")
            container.status = "error"
            container.error = str(e)
            return False

    async def cleanup_idle_containers(self):
        """Periodically clean up idle containers"""
        while True:
            try:
                await asyncio.sleep(60)  # Check every minute

                async with self._lock:
                    idle_sessions = [
                        sid
                        for sid, container in self.containers.items()
                        if container.is_idle
                    ]

                    for session_id in idle_sessions:
                        logger.info(f"Stopping idle container for session {session_id}")
                        await self.stop_container(session_id)

            except Exception as e:
                logger.error(f"Error in cleanup_idle_containers: {e}")

    async def get_stats(self) -> dict:
        """Get container statistics"""
        return {
            "total_containers": len(self.containers),
            "used_ports": len(self.used_ports),
            "available_ports": len(self.port_pool) - len(self.used_ports),
            "containers": [
                {
                    "session_id": c.session_id,
                    "container_id": c.container_id,
                    "port": c.port,
                    "display": c.display,
                    "status": c.status,
                    "uptime": c.uptime,
                    "idle": c.is_idle,
                }
                for c in self.containers.values()
            ],
        }

    async def start(self):
        """Start background cleanup task"""
        if self._docker_available:
            self._cleanup_task = asyncio.create_task(self.cleanup_idle_containers())
            logger.info("Docker Manager started")

    async def stop(self):
        """Stop background tasks and cleanup all containers"""
        if self._cleanup_task:
            self._cleanup_task.cancel()

        # Stop all containers
        session_ids = list(self.containers.keys())
        for session_id in session_ids:
            await self.stop_container(session_id)

        logger.info("Docker Manager stopped")

    # ============= Private Methods =============

    def _allocate_port(self) -> Optional[int]:
        """Allocate an unused port"""
        for port in self.port_pool:
            if port not in self.used_ports and self._is_port_available(port):
                self.used_ports.add(port)
                return port
        return None

    def _free_port(self, port: int) -> None:
        """Free an allocated port"""
        self.used_ports.discard(port)

    def _is_port_available(self, port: int) -> bool:
        """Check if a port is available on the system"""
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(("127.0.0.1", port))
                return True
        except OSError:
            return False

    async def _docker_create(
        self,
        session_id: str,
        port: int,
        display: str,
        browser_type: str,
    ) -> Optional[str]:
        """
        Create a Docker container for browser streaming

        Args:
            session_id: Browser session ID
            port: Port to use for VNC/etc
            display: X11 display (e.g., :99)
            browser_type: Browser type

        Returns:
            Container ID if successful, None otherwise
        """
        try:
            # Container name based on session
            container_name = f"cognitest-browser-{session_id[:8]}"

            # Docker run command
            cmd = [
                "docker",
                "run",
                "-d",
                "--name",
                container_name,
                "-p",
                f"{port}:7900",  # VNC port mapping
                "-e",
                f"DISPLAY={display}",
                "-e",
                "ENABLE_FFMPEG=true",
                "-e",
                "ENABLE_VNC=false",
                "-m",
                webrtc_config.BROWSER_CONTAINER_MEMORY,
                "--cpus",
                webrtc_config.BROWSER_CONTAINER_CPUS,
                "--rm",  # Auto-remove on stop
                "--network",
                "webrtc-network",  # Requires docker-compose setup
                webrtc_config.BROWSER_CONTAINER_IMAGE,
            ]

            logger.info(f"Creating container: {' '.join(cmd)}")

            result = subprocess.run(cmd, capture_output=True, timeout=30)

            if result.returncode == 0:
                container_id = result.stdout.decode().strip()
                logger.info(f"Container created: {container_id}")

                # Wait for container to be ready
                await self._wait_for_container(container_id)

                return container_id
            else:
                error = result.stderr.decode()
                logger.error(f"Failed to create container: {error}")
                return None

        except subprocess.TimeoutExpired:
            logger.error("Docker create timeout")
            return None
        except Exception as e:
            logger.error(f"Error creating Docker container: {e}")
            return None

    async def _wait_for_container(self, container_id: str, timeout: int = 30) -> bool:
        """
        Wait for container to be ready

        Args:
            container_id: Container ID
            timeout: Timeout in seconds

        Returns:
            True if ready, False if timeout
        """
        start_time = time.time()

        while time.time() - start_time < timeout:
            try:
                # Check if container is running
                result = subprocess.run(
                    ["docker", "inspect", "-f", "{{.State.Running}}", container_id],
                    capture_output=True,
                    timeout=5,
                )

                if result.returncode == 0 and result.stdout.decode().strip() == "true":
                    # Check if Xvfb is ready
                    result = subprocess.run(
                        ["docker", "exec", container_id, "xdpyinfo", "-display", ":99"],
                        capture_output=True,
                        timeout=5,
                    )

                    if result.returncode == 0:
                        logger.info(f"Container {container_id} is ready")
                        return True

            except subprocess.TimeoutExpired:
                pass
            except Exception as e:
                logger.warning(f"Error checking container readiness: {e}")

            await asyncio.sleep(0.5)

        logger.warning(f"Container {container_id} did not become ready within {timeout}s")
        return False


# Global Docker manager instance
docker_manager = DockerManager()
