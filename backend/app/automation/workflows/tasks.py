"""
Celery Tasks for Workflow Automation
Background task processing for workflow execution
"""
import asyncio
import logging
from typing import Dict, Any, Optional
from datetime import datetime
from uuid import UUID

from celery import Celery
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models.workflow import (
    WorkflowDefinition,
    WorkflowExecution,
    WorkflowCredential,
    ExecutionStatus,
)
from app.automation.workflows.engine import WorkflowEngine

logger = logging.getLogger(__name__)

# Initialize Celery
celery_app = Celery(
    "workflow_tasks",
    broker=getattr(settings, 'CELERY_BROKER_URL', 'redis://localhost:6379/0'),
    backend=getattr(settings, 'CELERY_RESULT_BACKEND', 'redis://localhost:6379/1')
)

# Configure Celery
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 hour max
    task_soft_time_limit=3300,  # 55 min soft limit
    worker_prefetch_multiplier=1,  # Fair task distribution
    task_acks_late=True,  # Acknowledge after completion
    task_reject_on_worker_lost=True,
)


def get_async_session():
    """Create async database session for Celery tasks"""
    engine = create_async_engine(
        settings.ASYNC_DATABASE_URL,
        echo=False,
        pool_pre_ping=True
    )
    async_session = sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
    return async_session()


async def _execute_workflow_async(
    workflow_id: str,
    execution_id: str,
    trigger_data: Optional[Dict[str, Any]] = None
) -> str:
    """Async implementation of workflow execution"""
    async with get_async_session() as db:
        try:
            # Fetch workflow
            workflow_result = await db.execute(
                select(WorkflowDefinition).where(WorkflowDefinition.id == UUID(workflow_id))
            )
            workflow = workflow_result.scalar_one_or_none()
            
            if not workflow:
                raise Exception(f"Workflow {workflow_id} not found")
            
            # Fetch execution record
            execution_result = await db.execute(
                select(WorkflowExecution).where(WorkflowExecution.id == UUID(execution_id))
            )
            execution = execution_result.scalar_one_or_none()
            
            if not execution:
                raise Exception(f"Execution {execution_id} not found")
            
            # Update started timestamp
            execution.started_at = datetime.utcnow()
            await db.commit()
            
            # Fetch and decrypt credentials
            credentials = {}
            if workflow.nodes_json:
                credential_ids = set()
                for node in workflow.nodes_json:
                    cred_id = node.get("data", {}).get("credentials_id")
                    if cred_id:
                        credential_ids.add(cred_id)
                
                if credential_ids:
                    creds_result = await db.execute(
                        select(WorkflowCredential).where(
                            WorkflowCredential.id.in_([UUID(cid) for cid in credential_ids])
                        )
                    )
                    for cred in creds_result.scalars():
                        # TODO: Decrypt credentials
                        # For now, store as-is (encrypted_data should be decrypted)
                        credentials[str(cred.id)] = {
                            "type": cred.credential_type.value,
                            # Decryption would happen here
                        }
            
            # Create engine and execute
            engine = WorkflowEngine(db)
            
            final_status = await engine.execute_workflow(
                workflow=workflow,
                execution=execution,
                trigger_data=trigger_data or {},
                credentials=credentials
            )
            
            return final_status.value
        
        except Exception as e:
            logger.exception(f"Workflow execution failed: {e}")
            
            # Update execution status to failed
            try:
                execution_result = await db.execute(
                    select(WorkflowExecution).where(WorkflowExecution.id == UUID(execution_id))
                )
                execution = execution_result.scalar_one_or_none()
                if execution:
                    execution.status = ExecutionStatus.FAILED
                    execution.error_message = str(e)
                    execution.completed_at = datetime.utcnow()
                    await db.commit()
            except Exception:
                pass
            
            raise


@celery_app.task(
    bind=True,
    name="workflows.execute",
    max_retries=3,
    default_retry_delay=60
)
def execute_workflow_task(
    self,
    workflow_id: str,
    execution_id: str,
    trigger_data: Optional[Dict[str, Any]] = None
):
    """
    Celery task to execute a workflow in the background.
    
    Args:
        workflow_id: UUID of the workflow to execute
        execution_id: UUID of the execution record
        trigger_data: Optional data from the trigger
        
    Returns:
        Final execution status
    """
    logger.info(f"Starting workflow execution task: workflow={workflow_id}, execution={execution_id}")
    
    try:
        # Run async execution in event loop
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            result = loop.run_until_complete(
                _execute_workflow_async(workflow_id, execution_id, trigger_data)
            )
            return result
        finally:
            loop.close()
    
    except Exception as e:
        logger.exception(f"Workflow task failed: {e}")
        
        # Retry on transient errors
        if self.request.retries < self.max_retries:
            raise self.retry(exc=e)
        
        return "failed"


@celery_app.task(name="workflows.stop")
def stop_workflow_task(execution_id: str):
    """
    Request stop for a running workflow execution.
    
    Args:
        execution_id: UUID of the execution to stop
    """
    logger.info(f"Stop requested for execution: {execution_id}")
    
    async def _stop():
        async with get_async_session() as db:
            execution_result = await db.execute(
                select(WorkflowExecution).where(WorkflowExecution.id == UUID(execution_id))
            )
            execution = execution_result.scalar_one_or_none()
            
            if execution and execution.status == ExecutionStatus.RUNNING:
                execution.status = ExecutionStatus.STOPPING
                await db.commit()
    
    loop = asyncio.new_event_loop()
    try:
        loop.run_until_complete(_stop())
    finally:
        loop.close()
    
    return "stop_requested"


@celery_app.task(name="workflows.cleanup")
def cleanup_old_executions(days: int = 30):
    """
    Clean up old execution records.
    
    Args:
        days: Delete executions older than this many days
    """
    from datetime import timedelta
    
    async def _cleanup():
        async with get_async_session() as db:
            cutoff = datetime.utcnow() - timedelta(days=days)
            # Note: In production, use soft delete or archive
            # This is just a placeholder
            logger.info(f"Would clean up executions older than {cutoff}")
    
    loop = asyncio.new_event_loop()
    try:
        loop.run_until_complete(_cleanup())
    finally:
        loop.close()
    
    return "cleanup_complete"


# Celery Beat schedule for periodic tasks
celery_app.conf.beat_schedule = {
    'cleanup-old-executions': {
        'task': 'workflows.cleanup',
        'schedule': 86400.0,  # Daily
        'args': (30,),
    },
}
