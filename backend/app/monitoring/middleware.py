"""
Monitoring Middleware for Prometheus Metrics Collection
Automatically collects metrics from API endpoints
"""
import time
import asyncio
import logging
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from prometheus_client import generate_latest, CollectorRegistry, REGISTRY

from app.monitoring.metrics import MetricsCollector

logger = logging.getLogger(__name__)


class PrometheusMiddleware(BaseHTTPMiddleware):
    """Middleware to collect Prometheus metrics"""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Collect metrics for each request"""
        start_time = time.perf_counter()

        # Record method and path
        method = request.method
        path = request.url.path

        try:
            response = await call_next(request)
            status_code = response.status_code
        except Exception as e:
            logger.error(f"Error processing request {method} {path}: {e}")
            status_code = 500
            raise

        # Calculate latency
        latency_ms = (time.perf_counter() - start_time) * 1000

        # Record metrics
        # Extract endpoint (remove numeric IDs for grouping)
        endpoint = self._normalize_endpoint(path)
        MetricsCollector.record_api_request(method, endpoint, status_code, latency_ms)

        return response

    @staticmethod
    def _normalize_endpoint(path: str) -> str:
        """Normalize path to group similar endpoints"""
        parts = path.split('/')
        normalized = []

        for part in parts:
            # Replace UUIDs and numeric IDs with {id}
            if len(part) == 36 and part.count('-') == 4:  # UUID
                normalized.append('{id}')
            elif part.isdigit() and len(part) > 5:  # Large number
                normalized.append('{id}')
            else:
                normalized.append(part)

        return '/'.join(normalized)


class WebSocketMetricsCollector:
    """Collect metrics from WebSocket connections"""

    @staticmethod
    async def on_connect(execution_id: str):
        """Handle WebSocket connection"""
        MetricsCollector.record_websocket_connection()
        logger.debug(f"WebSocket connected: {execution_id}")

    @staticmethod
    async def on_disconnect(execution_id: str):
        """Handle WebSocket disconnection"""
        MetricsCollector.record_websocket_disconnection()
        logger.debug(f"WebSocket disconnected: {execution_id}")

    @staticmethod
    async def on_message(message_type: str, message_size: int = 0):
        """Handle WebSocket message received"""
        MetricsCollector.record_websocket_message(message_type, sent=False, bytes_count=message_size)

    @staticmethod
    async def on_send_message(message_type: str, message_size: int = 0):
        """Handle WebSocket message sent"""
        MetricsCollector.record_websocket_message(message_type, sent=True, bytes_count=message_size)

    @staticmethod
    async def on_error(error_type: str):
        """Handle WebSocket error"""
        MetricsCollector.record_websocket_error(error_type)
        logger.error(f"WebSocket error: {error_type}")


class PerformanceMonitor:
    """Monitor performance metrics"""

    def __init__(self):
        self.interaction_start_times = {}

    def start_interaction(self, session_id: str):
        """Start tracking interaction"""
        self.interaction_start_times[session_id] = time.perf_counter()

    def end_interaction(self, session_id: str, interaction_type: str, success: bool = True, error_type: str = None):
        """End tracking interaction and record metrics"""
        if session_id in self.interaction_start_times:
            latency = (time.perf_counter() - self.interaction_start_times[session_id]) * 1000
            del self.interaction_start_times[session_id]

            MetricsCollector.record_interaction(interaction_type, latency, success, error_type)
            return latency

        return None

    def start_screenshot(self, session_id: str):
        """Start tracking screenshot"""
        self.interaction_start_times[f"screenshot_{session_id}"] = time.perf_counter()

    def end_screenshot(self, session_id: str, size_bytes: int = 0):
        """End tracking screenshot"""
        key = f"screenshot_{session_id}"
        if key in self.interaction_start_times:
            latency = (time.perf_counter() - self.interaction_start_times[key]) * 1000
            del self.interaction_start_times[key]

            MetricsCollector.record_screenshot(latency, size_bytes)
            return latency

        return None


# Global performance monitor instance
performance_monitor = PerformanceMonitor()


def get_prometheus_metrics():
    """Get Prometheus metrics in text format"""
    return generate_latest(REGISTRY)


async def update_gauges(
    active_sessions: int = None,
    active_executors: int = None,
    active_containers: int = None,
    cpu_percent: float = None,
    memory_bytes: int = None,
    memory_percent: float = None,
):
    """Update gauge metrics"""
    if active_sessions is not None:
        MetricsCollector.update_active_sessions(active_sessions)

    if active_executors is not None:
        MetricsCollector.update_active_executors(active_executors)

    if active_containers is not None:
        MetricsCollector.update_active_containers(active_containers)

    if cpu_percent is not None and memory_bytes is not None and memory_percent is not None:
        MetricsCollector.update_resource_usage(cpu_percent, memory_bytes, memory_percent)
