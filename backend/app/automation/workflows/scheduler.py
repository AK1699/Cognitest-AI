"""
Workflow Scheduler Service
Handles cron-based scheduled workflow executions using APScheduler
"""
import logging
import asyncio
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from uuid import UUID

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.jobstores.memory import MemoryJobStore
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models.workflow import (
    WorkflowSchedule,
    WorkflowDefinition,
    WorkflowExecution,
    ExecutionStatus,
    WorkflowStatus,
)

logger = logging.getLogger(__name__)


class WorkflowScheduler:
    """
    Manages scheduled workflow executions using APScheduler.
    Supports cron-based triggers with timezone support.
    """
    
    _instance: Optional['WorkflowScheduler'] = None
    
    def __init__(self):
        self.scheduler = AsyncIOScheduler(
            jobstores={'default': MemoryJobStore()},
            job_defaults={
                'coalesce': True,  # Combine multiple missed runs
                'max_instances': 1,  # Only one instance per job
                'misfire_grace_time': 300,  # 5 min grace period
            }
        )
        self._db_session_factory = None
        self._is_running = False
    
    @classmethod
    def get_instance(cls) -> 'WorkflowScheduler':
        """Get singleton instance"""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    def _get_db_session(self) -> AsyncSession:
        """Get async database session"""
        if self._db_session_factory is None:
            engine = create_async_engine(
                settings.ASYNC_DATABASE_URL,
                echo=False,
                pool_pre_ping=True
            )
            self._db_session_factory = sessionmaker(
                engine,
                class_=AsyncSession,
                expire_on_commit=False
            )
        return self._db_session_factory()
    
    async def start(self):
        """Start the scheduler and load all schedules"""
        if self._is_running:
            return
        
        logger.info("Starting workflow scheduler...")
        
        # Load existing schedules from database
        await self._load_schedules()
        
        # Start APScheduler
        self.scheduler.start()
        self._is_running = True
        
        logger.info("Workflow scheduler started")
    
    async def stop(self):
        """Stop the scheduler"""
        if not self._is_running:
            return
        
        logger.info("Stopping workflow scheduler...")
        self.scheduler.shutdown(wait=True)
        self._is_running = False
        logger.info("Workflow scheduler stopped")
    
    async def _load_schedules(self):
        """Load all enabled schedules from database"""
        async with self._get_db_session() as db:
            result = await db.execute(
                select(WorkflowSchedule, WorkflowDefinition)
                .join(WorkflowDefinition)
                .where(
                    and_(
                        WorkflowSchedule.enabled == True,
                        WorkflowSchedule.auto_disabled == False,
                        WorkflowDefinition.status == WorkflowStatus.ACTIVE
                    )
                )
            )
            
            for schedule, workflow in result.all():
                try:
                    self._add_schedule_job(schedule, workflow)
                    logger.info(f"Loaded schedule for workflow {workflow.id}")
                except Exception as e:
                    logger.error(f"Failed to load schedule {schedule.id}: {e}")
    
    def _add_schedule_job(self, schedule: WorkflowSchedule, workflow: WorkflowDefinition):
        """Add a schedule job to APScheduler"""
        job_id = f"workflow_schedule_{schedule.id}"
        
        # Parse cron expression
        # APScheduler expects individual fields
        cron_parts = schedule.cron_expression.split()
        
        if len(cron_parts) != 5:
            raise ValueError(f"Invalid cron expression: {schedule.cron_expression}")
        
        minute, hour, day, month, day_of_week = cron_parts
        
        trigger = CronTrigger(
            minute=minute,
            hour=hour,
            day=day,
            month=month,
            day_of_week=day_of_week,
            timezone=schedule.timezone or "UTC"
        )
        
        # Add or replace job
        self.scheduler.add_job(
            self._execute_scheduled_workflow,
            trigger=trigger,
            id=job_id,
            name=f"Scheduled: {workflow.name}",
            args=[str(schedule.id), str(workflow.id)],
            replace_existing=True
        )
    
    async def _execute_scheduled_workflow(self, schedule_id: str, workflow_id: str):
        """Execute a scheduled workflow"""
        logger.info(f"Executing scheduled workflow: {workflow_id} (schedule: {schedule_id})")
        
        async with self._get_db_session() as db:
            try:
                # Fetch schedule
                schedule_result = await db.execute(
                    select(WorkflowSchedule).where(WorkflowSchedule.id == UUID(schedule_id))
                )
                schedule = schedule_result.scalar_one_or_none()
                
                if not schedule or not schedule.enabled:
                    logger.warning(f"Schedule {schedule_id} not found or disabled")
                    return
                
                # Fetch workflow
                workflow_result = await db.execute(
                    select(WorkflowDefinition).where(WorkflowDefinition.id == UUID(workflow_id))
                )
                workflow = workflow_result.scalar_one_or_none()
                
                if not workflow or workflow.status != WorkflowStatus.ACTIVE:
                    logger.warning(f"Workflow {workflow_id} not found or not active")
                    return
                
                # Create execution record
                execution = WorkflowExecution(
                    workflow_id=workflow.id,
                    project_id=workflow.project_id,
                    status=ExecutionStatus.PENDING,
                    trigger_source="schedule",
                    trigger_data=schedule.trigger_data or {},
                    workflow_version=workflow.version,
                    total_nodes=len(workflow.nodes_json or [])
                )
                db.add(execution)
                await db.commit()
                
                # Update schedule last run
                schedule.last_run_at = datetime.utcnow()
                schedule.total_runs = (schedule.total_runs or 0) + 1
                
                # Queue background task
                try:
                    from app.automation.workflows.tasks import execute_workflow_task
                    execute_workflow_task.delay(
                        str(workflow.id),
                        str(execution.id),
                        schedule.trigger_data
                    )
                    logger.info(f"Queued scheduled execution {execution.id}")
                except Exception as e:
                    logger.error(f"Failed to queue execution: {e}")
                    execution.status = ExecutionStatus.FAILED
                    execution.error_message = f"Failed to queue: {str(e)}"
                    schedule.consecutive_failures = (schedule.consecutive_failures or 0) + 1
                    schedule.failed_runs = (schedule.failed_runs or 0) + 1
                    
                    # Auto-disable after too many failures
                    if schedule.consecutive_failures >= 5:
                        schedule.auto_disabled = True
                        schedule.enabled = False
                        logger.warning(f"Auto-disabled schedule {schedule_id} after {schedule.consecutive_failures} failures")
                
                await db.commit()
                
            except Exception as e:
                logger.exception(f"Scheduled execution failed: {e}")
    
    async def add_schedule(self, schedule: WorkflowSchedule, workflow: WorkflowDefinition):
        """Add a new schedule"""
        if not self._is_running:
            return
        
        try:
            self._add_schedule_job(schedule, workflow)
            logger.info(f"Added schedule {schedule.id} for workflow {workflow.id}")
        except Exception as e:
            logger.error(f"Failed to add schedule: {e}")
            raise
    
    async def update_schedule(self, schedule: WorkflowSchedule, workflow: WorkflowDefinition):
        """Update an existing schedule"""
        job_id = f"workflow_schedule_{schedule.id}"
        
        # Remove existing job
        if self.scheduler.get_job(job_id):
            self.scheduler.remove_job(job_id)
        
        # Add updated job if enabled
        if schedule.enabled and not schedule.auto_disabled:
            self._add_schedule_job(schedule, workflow)
            logger.info(f"Updated schedule {schedule.id}")
        else:
            logger.info(f"Schedule {schedule.id} is disabled, not adding job")
    
    async def remove_schedule(self, schedule_id: str):
        """Remove a schedule"""
        job_id = f"workflow_schedule_{schedule_id}"
        
        if self.scheduler.get_job(job_id):
            self.scheduler.remove_job(job_id)
            logger.info(f"Removed schedule {schedule_id}")
    
    def get_next_run_time(self, schedule: WorkflowSchedule) -> Optional[datetime]:
        """Calculate next run time for a schedule"""
        try:
            from croniter import croniter
            
            cron = croniter(
                schedule.cron_expression,
                datetime.utcnow()
            )
            return cron.get_next(datetime)
        except Exception:
            return None
    
    def list_jobs(self) -> list[Dict[str, Any]]:
        """List all scheduled jobs"""
        jobs = []
        for job in self.scheduler.get_jobs():
            jobs.append({
                "id": job.id,
                "name": job.name,
                "next_run_time": job.next_run_time.isoformat() if job.next_run_time else None,
                "trigger": str(job.trigger)
            })
        return jobs


# Global scheduler instance
scheduler = WorkflowScheduler.get_instance()


async def start_scheduler():
    """Start the global scheduler"""
    await scheduler.start()


async def stop_scheduler():
    """Stop the global scheduler"""
    await scheduler.stop()
