from celery import Celery
from typing import Any, List, Optional
import os

def create_celery_app(
    service_name: str,
    broker_url: str,
    result_backend: str,
    include: Optional[List[str]] = None,
    **kwargs
) -> Celery:
    """
    Create a standardized Celery application for Cognitest microservices.
    """
    app = Celery(
        service_name,
        broker=broker_url,
        backend=result_backend,
        include=include or []
    )
    
    # Standard settings
    defaults = {
        "task_serializer": "json",
        "accept_content": ["json"],
        "result_serializer": "json",
        "timezone": "UTC",
        "enable_utc": True,
        "result_expires": 3600 * 24,  # 24 hours
        "result_extended": True,
        "task_acks_late": True,
        "task_reject_on_worker_lost": True,
        "worker_prefetch_multiplier": 1,
    }
    
    # Override defaults with kwargs
    config = {**defaults, **kwargs}
    app.conf.update(config)
    
    return app

class TaskStatus:
    """Task status constants"""
    PENDING = "pending"
    STARTED = "started"
    PROGRESS = "progress"
    SUCCESS = "success"
    FAILURE = "failure"
    REVOKED = "revoked"

def get_task_status(celery_app: Celery, task_id: str) -> dict:
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
