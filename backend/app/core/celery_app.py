"""
Celery Application Configuration
Async task queue for long-running security scans
"""
from celery import Celery
import os

# ============================================================================
# Configuration
# ============================================================================

# Broker URL (Redis)
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")

# Result backend (Redis or PostgreSQL)
CELERY_RESULT_BACKEND = os.getenv(
    "CELERY_RESULT_BACKEND",
    os.getenv("DATABASE_URL", "redis://localhost:6379/0")
)

# ============================================================================
# Celery App
# ============================================================================

from cognitest_common import create_celery_app
from .config import settings

celery_app = create_celery_app(
    service_name="monolith",
    broker_url=getattr(settings, "CELERY_BROKER_URL", "redis://localhost:6379/0"),
    result_backend=getattr(settings, "CELERY_RESULT_BACKEND", "redis://localhost:6379/0"),
    include=[
        "app.tasks.security_tasks"
    ]
)

# ============================================================================
# Celery Configuration
# ============================================================================

celery_app.conf.update(
    # Task settings
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    
    # Result settings
    result_expires=3600 * 24,  # 24 hours
    result_extended=True,
    
    # Task execution settings
    task_acks_late=True,  # Acknowledge after task completion
    task_reject_on_worker_lost=True,
    task_time_limit=3600,  # 1 hour max per task
    task_soft_time_limit=3300,  # Soft limit at 55 minutes
    
    # Worker settings
    worker_prefetch_multiplier=1,  # Process one task at a time
    worker_concurrency=4,  # Number of concurrent workers
    
    # Retry settings
    task_default_retry_delay=60,  # 1 minute retry delay
    task_max_retries=3,
    
    # Rate limiting (per worker)
    task_annotations={
        "app.tasks.security_tasks.run_url_scan": {"rate_limit": "5/m"},
        "app.tasks.security_tasks.run_repo_scan": {"rate_limit": "3/m"},
        "app.tasks.security_tasks.run_vapt_scan": {"rate_limit": "2/m"},
    },
    
    # Beat scheduler (for scheduled scans)
    beat_schedule={
        # Example: run scheduled security scans every hour
        # "check-scheduled-scans": {
        #     "task": "app.tasks.security_tasks.process_scheduled_scans",
        #     "schedule": 3600.0,  # Every hour
        # },
    },
)

# ============================================================================
# Task Queues
# ============================================================================

celery_app.conf.task_queues = {
    "security": {"exchange": "security", "routing_key": "security.#"},
    "ai": {"exchange": "ai", "routing_key": "ai.#"},
    "workflow": {"exchange": "workflow", "routing_key": "workflow.#"},
    "default": {"exchange": "default", "routing_key": "default"},
}

celery_app.conf.task_routes = {
    "app.tasks.security_tasks.*": {"queue": "security"},
    "ai.*": {"queue": "ai"},
    "workflows.*": {"queue": "workflow"},
}


# ============================================================================
# Task Status Tracking
# ============================================================================

class TaskStatus:
    """Task status constants"""
    PENDING = "pending"
    STARTED = "started"
    PROGRESS = "progress"
    SUCCESS = "success"
    FAILURE = "failure"
    REVOKED = "revoked"


def get_task_status(task_id: str) -> dict:
    """Get status of a Celery task"""
    from celery.result import AsyncResult
    
    result = AsyncResult(task_id, app=celery_app)
    
    status = {
        "task_id": task_id,
        "status": result.state,
        "ready": result.ready(),
        "successful": result.successful() if result.ready() else None,
        "result": None,
        "error": None,
        "progress": None
    }
    
    if result.ready():
        if result.successful():
            status["result"] = result.get()
        else:
            status["error"] = str(result.result)
    elif result.state == "PROGRESS":
        status["progress"] = result.info
    
    return status


def revoke_task(task_id: str, terminate: bool = False) -> bool:
    """Revoke/cancel a running task"""
    try:
        celery_app.control.revoke(task_id, terminate=terminate)
        return True
    except Exception:
        return False


# Export all
__all__ = [
    "celery_app",
    "TaskStatus",
    "get_task_status",
    "revoke_task"
]
