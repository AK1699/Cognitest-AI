"""
Prometheus Metrics for Remote Browser Streaming
Tracks performance, errors, and system health
"""
from prometheus_client import Counter, Histogram, Gauge, Info
from typing import Optional


# System metrics
system_info = Info('system', 'System information')
active_sessions = Gauge(
    'webrtc_active_sessions',
    'Number of active WebRTC streaming sessions',
)
active_executors = Gauge(
    'webrtc_active_executors',
    'Number of active test executors',
)
active_containers = Gauge(
    'docker_active_containers',
    'Number of active Docker containers',
)


# Interaction metrics
interactions_total = Counter(
    'webrtc_interactions_total',
    'Total number of interactions sent',
    ['interaction_type']
)
interaction_failures = Counter(
    'webrtc_interaction_failures_total',
    'Total number of failed interactions',
    ['interaction_type', 'error_type']
)
interaction_latency = Histogram(
    'webrtc_interaction_latency_ms',
    'Interaction latency in milliseconds',
    ['interaction_type'],
    buckets=[10, 25, 50, 100, 250, 500, 1000]
)


# Screenshot metrics
screenshot_captured = Counter(
    'webrtc_screenshots_captured_total',
    'Total number of screenshots captured',
)
screenshot_latency = Histogram(
    'webrtc_screenshot_latency_ms',
    'Screenshot capture and transmission latency in milliseconds',
    buckets=[50, 100, 250, 500, 1000, 2000]
)
screenshot_bytes = Histogram(
    'webrtc_screenshot_bytes',
    'Screenshot size in bytes',
    buckets=[10000, 50000, 100000, 500000, 1000000]
)


# WebSocket metrics
websocket_connections = Counter(
    'webrtc_websocket_connections_total',
    'Total WebSocket connections',
)
websocket_disconnections = Counter(
    'webrtc_websocket_disconnections_total',
    'Total WebSocket disconnections',
)
websocket_errors = Counter(
    'webrtc_websocket_errors_total',
    'Total WebSocket errors',
    ['error_type']
)
websocket_messages_sent = Counter(
    'webrtc_websocket_messages_sent_total',
    'Total WebSocket messages sent',
    ['message_type']
)
websocket_messages_received = Counter(
    'webrtc_websocket_messages_received_total',
    'Total WebSocket messages received',
    ['message_type']
)
websocket_bytes_sent = Counter(
    'webrtc_websocket_bytes_sent_total',
    'Total bytes sent via WebSocket',
    ['message_type']
)
websocket_bytes_received = Counter(
    'webrtc_websocket_bytes_received_total',
    'Total bytes received via WebSocket',
    ['message_type']
)


# Container metrics
container_creations = Counter(
    'docker_container_creations_total',
    'Total Docker container creations',
)
container_failures = Counter(
    'docker_container_failures_total',
    'Total Docker container creation failures',
    ['failure_reason']
)
container_startup_time = Histogram(
    'docker_container_startup_ms',
    'Time to start a Docker container in milliseconds',
    buckets=[1000, 2000, 5000, 10000, 20000]
)
container_uptime = Gauge(
    'docker_container_uptime_seconds',
    'Container uptime in seconds',
    ['container_id']
)


# Browser automation metrics
test_steps_executed = Counter(
    'test_steps_executed_total',
    'Total test steps executed',
)
test_steps_passed = Counter(
    'test_steps_passed_total',
    'Total test steps passed',
)
test_steps_failed = Counter(
    'test_steps_failed_total',
    'Total test steps failed',
)
test_execution_time = Histogram(
    'test_execution_time_ms',
    'Test execution time in milliseconds',
    buckets=[100, 500, 1000, 5000, 10000, 30000]
)
healing_events = Counter(
    'healing_events_total',
    'Total self-healing events',
    ['healing_type']
)


# API endpoint metrics
api_requests = Counter(
    'api_requests_total',
    'Total API requests',
    ['method', 'endpoint', 'status']
)
api_latency = Histogram(
    'api_latency_ms',
    'API endpoint latency in milliseconds',
    ['method', 'endpoint'],
    buckets=[10, 50, 100, 500, 1000, 5000]
)


# Resource metrics
cpu_usage = Gauge(
    'process_cpu_percent',
    'CPU usage percentage',
)
memory_usage = Gauge(
    'process_memory_bytes',
    'Memory usage in bytes',
)
memory_percent = Gauge(
    'process_memory_percent',
    'Memory usage percentage',
)


class MetricsCollector:
    """Helper class to collect metrics"""

    @staticmethod
    def record_interaction(interaction_type: str, latency_ms: float, success: bool = True, error_type: str = None):
        """Record an interaction"""
        interactions_total.labels(interaction_type=interaction_type).inc()

        if success:
            interaction_latency.labels(interaction_type=interaction_type).observe(latency_ms)
        else:
            interaction_failures.labels(
                interaction_type=interaction_type,
                error_type=error_type or 'unknown'
            ).inc()

    @staticmethod
    def record_screenshot(latency_ms: float, size_bytes: int):
        """Record a screenshot capture"""
        screenshot_captured.inc()
        screenshot_latency.observe(latency_ms)
        screenshot_bytes.observe(size_bytes)

    @staticmethod
    def record_websocket_connection():
        """Record WebSocket connection"""
        websocket_connections.inc()

    @staticmethod
    def record_websocket_disconnection():
        """Record WebSocket disconnection"""
        websocket_disconnections.inc()

    @staticmethod
    def record_websocket_message(message_type: str, sent: bool = True, bytes_count: int = 0):
        """Record WebSocket message"""
        if sent:
            websocket_messages_sent.labels(message_type=message_type).inc()
            if bytes_count > 0:
                websocket_bytes_sent.labels(message_type=message_type).inc(bytes_count)
        else:
            websocket_messages_received.labels(message_type=message_type).inc()
            if bytes_count > 0:
                websocket_bytes_received.labels(message_type=message_type).inc(bytes_count)

    @staticmethod
    def record_websocket_error(error_type: str):
        """Record WebSocket error"""
        websocket_errors.labels(error_type=error_type).inc()

    @staticmethod
    def record_container_creation(success: bool = True, failure_reason: str = None):
        """Record container creation"""
        if success:
            container_creations.inc()
        else:
            container_failures.labels(failure_reason=failure_reason or 'unknown').inc()

    @staticmethod
    def record_container_startup(startup_time_ms: float):
        """Record container startup time"""
        container_startup_time.observe(startup_time_ms)

    @staticmethod
    def record_test_step(passed: bool = True):
        """Record test step execution"""
        test_steps_executed.inc()
        if passed:
            test_steps_passed.inc()
        else:
            test_steps_failed.inc()

    @staticmethod
    def record_test_execution(execution_time_ms: float):
        """Record test execution"""
        test_execution_time.observe(execution_time_ms)

    @staticmethod
    def record_healing_event(healing_type: str):
        """Record healing event"""
        healing_events.labels(healing_type=healing_type).inc()

    @staticmethod
    def record_api_request(method: str, endpoint: str, status: int, latency_ms: float):
        """Record API request"""
        api_requests.labels(method=method, endpoint=endpoint, status=status).inc()
        api_latency.labels(method=method, endpoint=endpoint).observe(latency_ms)

    @staticmethod
    def update_active_sessions(count: int):
        """Update active sessions gauge"""
        active_sessions.set(count)

    @staticmethod
    def update_active_executors(count: int):
        """Update active executors gauge"""
        active_executors.set(count)

    @staticmethod
    def update_active_containers(count: int):
        """Update active containers gauge"""
        active_containers.set(count)

    @staticmethod
    def update_resource_usage(cpu_percent: float, memory_bytes: int, memory_percent: float):
        """Update resource usage metrics"""
        cpu_usage.set(cpu_percent)
        memory_usage.set(memory_bytes)
        memory_percent.set(memory_percent)
