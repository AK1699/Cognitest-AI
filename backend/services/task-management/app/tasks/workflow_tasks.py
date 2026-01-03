"""
Celery Tasks for Workflow Automation
Background task processing for workflow execution
"""
import asyncio
import logging
from typing import Dict, Any, Optional
from datetime import datetime
from uuid import UUID

from celery import shared_task
from sqlalchemy import select

from ..core.deps import AsyncSessionLocal
from ..models.workflow import (
    WorkflowDefinition,
    WorkflowExecution,
    WorkflowCredential,
    ExecutionStatus,
)
from ..services.workflow_engine import WorkflowEngine

logger = logging.getLogger(__name__)


async def _execute_workflow_async(
    workflow_id: str,
    execution_id: str,
    trigger_data: Optional[Dict[str, Any]] = None
) -> str:
    """Async implementation of workflow execution"""
    async with AsyncSessionLocal() as db:
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
                        # For now, store as-is
                        credentials[str(cred.id)] = {
                            "type": cred.credential_type.value,
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


@shared_task(
    bind=True,
    name="app.tasks.workflow_tasks.execute",
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


@shared_task(name="app.tasks.workflow_tasks.stop")
def stop_workflow_task(execution_id: str):
    """
    Request stop for a running workflow execution.
    """
    logger.info(f"Stop requested for execution: {execution_id}")
    
    async def _stop():
        async with AsyncSessionLocal() as db:
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


@shared_task(name="app.tasks.workflow_tasks.cleanup")
def cleanup_old_executions(days: int = 30):
    """
    Clean up old execution records.
    """
    from datetime import timedelta
    
    async def _cleanup():
        async with AsyncSessionLocal() as db:
            cutoff = datetime.utcnow() - timedelta(days=days)
            logger.info(f"Would clean up executions older than {cutoff}")
    
    loop = asyncio.new_event_loop()
    try:
        loop.run_until_complete(_cleanup())
    finally:
        loop.close()
    
    return "cleanup_complete"


# Export all
__all__ = [
    "execute_workflow_task",
    "stop_workflow_task",
    "cleanup_old_executions"
]
