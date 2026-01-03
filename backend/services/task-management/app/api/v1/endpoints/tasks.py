from fastapi import APIRouter, Depends, HTTPException
from typing import Any, Dict
from celery.result import AsyncResult
from uuid import UUID

from cognitest_common import TaskStatus, get_task_status
from ....core.celery_app import celery_app

router = APIRouter()

@router.get("/{task_id}", response_model=Dict[str, Any])
async def get_celery_task_status(task_id: str):
    """
    Get the status and result of a background task
    """
    result = AsyncResult(task_id, app=celery_app)
    
    status_info = get_task_status(result)
    
    return {
        "task_id": task_id,
        "status": status_info["status"],
        "progress": status_info.get("progress"),
        "result": status_info.get("result") if result.ready() else None,
        "error": status_info.get("error") if result.failed() else None
    }

@router.delete("/{task_id}")
async def revoke_task(task_id: str):
    """
    Revoke/cancel a running background task
    """
    result = AsyncResult(task_id, app=celery_app)
    result.revoke(terminate=True)
    return {"status": "revoked", "task_id": task_id}
