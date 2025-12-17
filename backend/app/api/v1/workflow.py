"""
Workflow Automation API Endpoints
Comprehensive CRUD, execution, scheduling, and webhook management
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, WebSocket, WebSocketDisconnect, Request, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from sqlalchemy.orm import selectinload
from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4
import secrets
import json
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.workflow import (
    WorkflowDefinition,
    WorkflowExecution,
    WorkflowExecutionStep,
    WorkflowCredential,
    WorkflowSchedule,
    WorkflowWebhook,
    WorkflowTemplate,
    WorkflowStatus,
    TriggerType,
    ExecutionStatus,
    StepStatus,
)
from app.schemas.workflow import (
    WorkflowCreate,
    WorkflowUpdate,
    WorkflowSummary,
    WorkflowDetail,
    WorkflowListResponse,
    ExecutionCreate,
    ExecutionSummary,
    ExecutionDetail,
    ExecutionListResponse,
    ExecutionStepDetail,
    ScheduleCreate,
    ScheduleUpdate,
    ScheduleDetail,
    WebhookCreate,
    WebhookUpdate,
    WebhookDetail,
    CredentialCreate,
    CredentialUpdate,
    CredentialSummary,
    NodeTypeSchema,
    IntegrationSchema,
    TemplateSummary,
    TemplateDetail,
    TemplateListResponse,
    WorkflowNodeSchema,
    WorkflowEdgeSchema,
)

router = APIRouter()


# ============================================================================
# WEBSOCKET CONNECTION MANAGER
# ============================================================================

class WorkflowConnectionManager:
    """Manages WebSocket connections for workflow execution updates"""
    
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, execution_id: str, websocket: WebSocket):
        await websocket.accept()
        if execution_id not in self.active_connections:
            self.active_connections[execution_id] = []
        self.active_connections[execution_id].append(websocket)
    
    def disconnect(self, execution_id: str, websocket: WebSocket):
        if execution_id in self.active_connections:
            self.active_connections[execution_id].remove(websocket)
            if not self.active_connections[execution_id]:
                del self.active_connections[execution_id]
    
    async def broadcast(self, execution_id: str, message: dict):
        if execution_id in self.active_connections:
            for connection in self.active_connections[execution_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass


manager = WorkflowConnectionManager()


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def generate_human_id(prefix: str = "WF") -> str:
    """Generate a human-readable ID like WF-A1B2C"""
    chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # Exclude confusing chars
    suffix = "".join(secrets.choice(chars) for _ in range(5))
    return f"{prefix}-{suffix}"


async def get_workflow_or_404(
    workflow_id: UUID,
    db: AsyncSession,
    include_relations: bool = False
) -> WorkflowDefinition:
    """Get workflow by ID or raise 404"""
    query = select(WorkflowDefinition).where(WorkflowDefinition.id == workflow_id)
    if include_relations:
        query = query.options(
            selectinload(WorkflowDefinition.schedule),
            selectinload(WorkflowDefinition.webhook),
        )
    result = await db.execute(query)
    workflow = result.scalar_one_or_none()
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow {workflow_id} not found"
        )
    return workflow


async def get_execution_or_404(
    execution_id: UUID,
    db: AsyncSession,
    include_steps: bool = False
) -> WorkflowExecution:
    """Get execution by ID or raise 404"""
    query = select(WorkflowExecution).where(WorkflowExecution.id == execution_id)
    if include_steps:
        query = query.options(selectinload(WorkflowExecution.steps))
    result = await db.execute(query)
    execution = result.scalar_one_or_none()
    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Execution {execution_id} not found"
        )
    return execution


# ============================================================================
# WORKFLOW CRUD ENDPOINTS
# ============================================================================

@router.post("/", response_model=WorkflowDetail, status_code=status.HTTP_201_CREATED)
async def create_workflow(
    workflow_data: WorkflowCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new workflow"""
    # Get organisation_id from project
    from app.models.project import Project
    project_result = await db.execute(
        select(Project).where(Project.id == workflow_data.project_id)
    )
    project = project_result.scalar_one_or_none()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {workflow_data.project_id} not found"
        )
    
    # Create workflow
    workflow = WorkflowDefinition(
        id=uuid4(),
        project_id=workflow_data.project_id,
        organisation_id=project.organisation_id,
        human_id=generate_human_id("WF"),
        name=workflow_data.name,
        description=workflow_data.description,
        status=WorkflowStatus.DRAFT,
        trigger_type=TriggerType(workflow_data.trigger_type.value),
        trigger_config=workflow_data.trigger_config,
        nodes_json=[node.model_dump() for node in workflow_data.nodes],
        edges_json=[edge.model_dump() for edge in workflow_data.edges],
        viewport_json=workflow_data.viewport.model_dump(),
        global_variables=workflow_data.global_variables,
        timeout_seconds=workflow_data.timeout_seconds,
        retry_policy=workflow_data.retry_policy.model_dump(),
        error_handling=workflow_data.error_handling.model_dump(),
        tags=workflow_data.tags,
        category=workflow_data.category,
        icon=workflow_data.icon,
        color=workflow_data.color,
        created_by=current_user.id,
    )
    
    db.add(workflow)
    await db.commit()
    await db.refresh(workflow)
    
    return _workflow_to_detail(workflow)


@router.get("/{workflow_id}", response_model=WorkflowDetail)
async def get_workflow(
    workflow_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get workflow by ID with full details"""
    workflow = await get_workflow_or_404(workflow_id, db, include_relations=True)
    return _workflow_to_detail(workflow)


@router.get("/", response_model=WorkflowListResponse)
async def list_workflows(
    project_id: UUID,
    status_filter: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List workflows for a project with filtering and pagination"""
    query = select(WorkflowDefinition).where(
        WorkflowDefinition.project_id == project_id,
        WorkflowDefinition.is_latest == True
    )
    
    # Apply filters
    if status_filter:
        query = query.where(WorkflowDefinition.status == status_filter)
    if category:
        query = query.where(WorkflowDefinition.category == category)
    if search:
        query = query.where(
            WorkflowDefinition.name.ilike(f"%{search}%") |
            WorkflowDefinition.description.ilike(f"%{search}%")
        )
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0
    
    # Get paginated results
    query = query.order_by(desc(WorkflowDefinition.updated_at), desc(WorkflowDefinition.created_at))
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    workflows = result.scalars().all()
    
    return WorkflowListResponse(
        items=[_workflow_to_summary(wf) for wf in workflows],
        total=total,
        skip=skip,
        limit=limit
    )


@router.put("/{workflow_id}", response_model=WorkflowDetail)
async def update_workflow(
    workflow_id: UUID,
    workflow_data: WorkflowUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update workflow"""
    workflow = await get_workflow_or_404(workflow_id, db)
    
    # Update fields
    update_data = workflow_data.model_dump(exclude_unset=True)
    
    if "nodes" in update_data:
        workflow.nodes_json = [n.model_dump() if hasattr(n, 'model_dump') else n for n in update_data.pop("nodes")]
    if "edges" in update_data:
        workflow.edges_json = [e.model_dump() if hasattr(e, 'model_dump') else e for e in update_data.pop("edges")]
    if "viewport" in update_data:
        v = update_data.pop("viewport")
        workflow.viewport_json = v.model_dump() if hasattr(v, 'model_dump') else v
    if "retry_policy" in update_data:
        rp = update_data.pop("retry_policy")
        workflow.retry_policy = rp.model_dump() if hasattr(rp, 'model_dump') else rp
    if "error_handling" in update_data:
        eh = update_data.pop("error_handling")
        workflow.error_handling = eh.model_dump() if hasattr(eh, 'model_dump') else eh
    if "status" in update_data:
        workflow.status = WorkflowStatus(update_data.pop("status"))
    if "trigger_type" in update_data:
        workflow.trigger_type = TriggerType(update_data.pop("trigger_type"))
    
    for key, value in update_data.items():
        if hasattr(workflow, key):
            setattr(workflow, key, value)
    
    await db.commit()
    await db.refresh(workflow)
    
    return _workflow_to_detail(workflow)


@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workflow(
    workflow_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete workflow"""
    workflow = await get_workflow_or_404(workflow_id, db)
    await db.delete(workflow)
    await db.commit()


@router.post("/{workflow_id}/duplicate", response_model=WorkflowDetail)
async def duplicate_workflow(
    workflow_id: UUID,
    new_name: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Duplicate a workflow"""
    original = await get_workflow_or_404(workflow_id, db)
    
    duplicate = WorkflowDefinition(
        id=uuid4(),
        project_id=original.project_id,
        organisation_id=original.organisation_id,
        human_id=generate_human_id("WF"),
        name=new_name or f"{original.name} (Copy)",
        description=original.description,
        status=WorkflowStatus.DRAFT,
        trigger_type=original.trigger_type,
        trigger_config=original.trigger_config,
        nodes_json=original.nodes_json,
        edges_json=original.edges_json,
        viewport_json=original.viewport_json,
        global_variables=original.global_variables,
        timeout_seconds=original.timeout_seconds,
        retry_policy=original.retry_policy,
        error_handling=original.error_handling,
        tags=original.tags,
        category=original.category,
        icon=original.icon,
        color=original.color,
        created_by=current_user.id,
    )
    
    db.add(duplicate)
    await db.commit()
    await db.refresh(duplicate)
    
    return _workflow_to_detail(duplicate)


# ============================================================================
# EXECUTION ENDPOINTS
# ============================================================================

@router.post("/{workflow_id}/execute", response_model=ExecutionSummary)
async def execute_workflow(
    workflow_id: UUID,
    execution_data: ExecutionCreate = ExecutionCreate(),
    background_tasks: BackgroundTasks = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Execute a workflow"""
    workflow = await get_workflow_or_404(workflow_id, db)
    
    # Create execution record
    execution = WorkflowExecution(
        id=uuid4(),
        workflow_id=workflow.id,
        project_id=workflow.project_id,
        human_id=generate_human_id("EX"),
        workflow_version=workflow.version,
        workflow_snapshot={
            "nodes": workflow.nodes_json,
            "edges": workflow.edges_json,
            "global_variables": workflow.global_variables,
        },
        status=ExecutionStatus.PENDING,
        trigger_source=execution_data.trigger_source,
        trigger_data=execution_data.input_data,
        total_nodes=len(workflow.nodes_json) if workflow.nodes_json else 0,
        triggered_by=current_user.id,
        created_at=datetime.now(timezone.utc),
    )
    
    db.add(execution)
    await db.commit()
    await db.refresh(execution)
    
    # Queue execution in background
    # In production, this would be a Celery task
    if background_tasks:
        background_tasks.add_task(
            run_workflow_execution,
            str(execution.id),
            str(workflow.id)
        )
    
    return _execution_to_summary(execution)


@router.get("/{workflow_id}/executions", response_model=ExecutionListResponse)
async def list_workflow_executions(
    workflow_id: UUID,
    status_filter: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List executions for a workflow"""
    query = select(WorkflowExecution).where(WorkflowExecution.workflow_id == workflow_id)
    
    if status_filter:
        query = query.where(WorkflowExecution.status == status_filter)
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0
    
    # Get paginated results
    query = query.order_by(desc(WorkflowExecution.created_at))
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    executions = result.scalars().all()
    
    return ExecutionListResponse(
        items=[_execution_to_summary(ex) for ex in executions],
        total=total,
        skip=skip,
        limit=limit
    )


@router.get("/executions/{execution_id}", response_model=ExecutionDetail)
async def get_execution(
    execution_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get execution details with steps"""
    execution = await get_execution_or_404(execution_id, db, include_steps=True)
    return _execution_to_detail(execution)


@router.get("/executions/{execution_id}/steps", response_model=List[ExecutionStepDetail])
async def get_execution_steps(
    execution_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all steps for an execution"""
    execution = await get_execution_or_404(execution_id, db, include_steps=True)
    return [_step_to_detail(step) for step in execution.steps]


@router.post("/executions/{execution_id}/stop", response_model=ExecutionSummary)
async def stop_execution(
    execution_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Stop a running execution"""
    execution = await get_execution_or_404(execution_id, db)
    
    if execution.status not in [ExecutionStatus.PENDING, ExecutionStatus.QUEUED, ExecutionStatus.RUNNING]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Execution is not in a stoppable state"
        )
    
    execution.status = ExecutionStatus.STOPPED
    execution.completed_at = datetime.now(timezone.utc)
    if execution.started_at:
        execution.duration_ms = int((execution.completed_at - execution.started_at).total_seconds() * 1000)
    
    await db.commit()
    await db.refresh(execution)
    
    # Broadcast stop event
    await manager.broadcast(str(execution_id), {
        "type": "status_change",
        "status": "stopped",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return _execution_to_summary(execution)


@router.post("/executions/{execution_id}/retry", response_model=ExecutionSummary)
async def retry_execution(
    execution_id: UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retry a failed execution"""
    original = await get_execution_or_404(execution_id, db)
    
    if original.status not in [ExecutionStatus.FAILED, ExecutionStatus.STOPPED, ExecutionStatus.TIMEOUT]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only failed, stopped, or timed-out executions can be retried"
        )
    
    # Create new execution from original
    new_execution = WorkflowExecution(
        id=uuid4(),
        workflow_id=original.workflow_id,
        project_id=original.project_id,
        human_id=generate_human_id("EX"),
        workflow_version=original.workflow_version,
        workflow_snapshot=original.workflow_snapshot,
        status=ExecutionStatus.PENDING,
        trigger_source="retry",
        trigger_data=original.trigger_data,
        total_nodes=original.total_nodes,
        triggered_by=current_user.id,
        retry_count=original.retry_count + 1,
        notes=f"Retry of execution {original.human_id}",
        created_at=datetime.now(timezone.utc),
    )
    
    db.add(new_execution)
    await db.commit()
    await db.refresh(new_execution)
    
    # Queue execution
    background_tasks.add_task(
        run_workflow_execution,
        str(new_execution.id),
        str(original.workflow_id)
    )
    
    return _execution_to_summary(new_execution)


# ============================================================================
# WEBSOCKET ENDPOINT
# ============================================================================

@router.websocket("/ws/{execution_id}")
async def websocket_execution_updates(
    websocket: WebSocket,
    execution_id: str
):
    """WebSocket endpoint for real-time execution updates"""
    await manager.connect(execution_id, websocket)
    try:
        while True:
            # Keep connection alive, receive any client messages
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(execution_id, websocket)


# ============================================================================
# SCHEDULE ENDPOINTS
# ============================================================================

@router.post("/{workflow_id}/schedule", response_model=ScheduleDetail)
async def create_schedule(
    workflow_id: UUID,
    schedule_data: ScheduleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a schedule for a workflow"""
    workflow = await get_workflow_or_404(workflow_id, db, include_relations=True)
    
    if workflow.schedule:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Workflow already has a schedule. Update or delete the existing one."
        )
    
    # Calculate next run time from cron expression
    from croniter import croniter
    cron = croniter(schedule_data.cron_expression, datetime.now(timezone.utc))
    next_run = cron.get_next(datetime)
    
    schedule = WorkflowSchedule(
        id=uuid4(),
        workflow_id=workflow_id,
        cron_expression=schedule_data.cron_expression,
        timezone=schedule_data.timezone,
        enabled=schedule_data.enabled,
        next_run_at=next_run,
        trigger_data=schedule_data.trigger_data,
    )
    
    db.add(schedule)
    
    # Update workflow trigger type
    workflow.trigger_type = TriggerType.SCHEDULE
    
    await db.commit()
    await db.refresh(schedule)
    
    return _schedule_to_detail(schedule)


@router.get("/{workflow_id}/schedule", response_model=ScheduleDetail)
async def get_schedule(
    workflow_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get schedule for a workflow"""
    workflow = await get_workflow_or_404(workflow_id, db, include_relations=True)
    
    if not workflow.schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow has no schedule"
        )
    
    return _schedule_to_detail(workflow.schedule)


@router.put("/{workflow_id}/schedule", response_model=ScheduleDetail)
async def update_schedule(
    workflow_id: UUID,
    schedule_data: ScheduleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update schedule for a workflow"""
    workflow = await get_workflow_or_404(workflow_id, db, include_relations=True)
    
    if not workflow.schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow has no schedule"
        )
    
    schedule = workflow.schedule
    update_data = schedule_data.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(schedule, key, value)
    
    # Recalculate next run if cron changed
    if "cron_expression" in update_data:
        from croniter import croniter
        cron = croniter(schedule.cron_expression, datetime.now(timezone.utc))
        schedule.next_run_at = cron.get_next(datetime)
    
    await db.commit()
    await db.refresh(schedule)
    
    return _schedule_to_detail(schedule)


@router.delete("/{workflow_id}/schedule", status_code=status.HTTP_204_NO_CONTENT)
async def delete_schedule(
    workflow_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete schedule for a workflow"""
    workflow = await get_workflow_or_404(workflow_id, db, include_relations=True)
    
    if not workflow.schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow has no schedule"
        )
    
    await db.delete(workflow.schedule)
    workflow.trigger_type = TriggerType.MANUAL
    await db.commit()


# ============================================================================
# WEBHOOK ENDPOINTS
# ============================================================================

@router.post("/{workflow_id}/webhook", response_model=WebhookDetail)
async def create_webhook(
    workflow_id: UUID,
    webhook_data: WebhookCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a webhook trigger for a workflow"""
    workflow = await get_workflow_or_404(workflow_id, db, include_relations=True)
    
    if workflow.webhook:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Workflow already has a webhook. Update or delete the existing one."
        )
    
    # Generate unique webhook path
    webhook_path = f"wf/{secrets.token_urlsafe(16)}"
    
    webhook = WorkflowWebhook(
        id=uuid4(),
        workflow_id=workflow_id,
        path=webhook_path,
        method=webhook_data.method,
        secret_key=webhook_data.secret_key or secrets.token_urlsafe(32),
        require_auth=webhook_data.require_auth,
        allowed_ips=webhook_data.allowed_ips,
        response_mode=webhook_data.response_mode,
        response_data=webhook_data.response_data,
        rate_limit_enabled=webhook_data.rate_limit_enabled,
        rate_limit_max_calls=webhook_data.rate_limit_max_calls,
        rate_limit_window_seconds=webhook_data.rate_limit_window_seconds,
    )
    
    db.add(webhook)
    
    # Update workflow trigger type
    workflow.trigger_type = TriggerType.WEBHOOK
    
    await db.commit()
    await db.refresh(webhook)
    
    return _webhook_to_detail(webhook)


@router.get("/{workflow_id}/webhook", response_model=WebhookDetail)
async def get_webhook(
    workflow_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get webhook configuration for a workflow"""
    workflow = await get_workflow_or_404(workflow_id, db, include_relations=True)
    
    if not workflow.webhook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow has no webhook"
        )
    
    return _webhook_to_detail(workflow.webhook)


@router.put("/{workflow_id}/webhook", response_model=WebhookDetail)
async def update_webhook(
    workflow_id: UUID,
    webhook_data: WebhookUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update webhook configuration"""
    workflow = await get_workflow_or_404(workflow_id, db, include_relations=True)
    
    if not workflow.webhook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow has no webhook"
        )
    
    webhook = workflow.webhook
    update_data = webhook_data.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(webhook, key, value)
    
    await db.commit()
    await db.refresh(webhook)
    
    return _webhook_to_detail(webhook)


@router.delete("/{workflow_id}/webhook", status_code=status.HTTP_204_NO_CONTENT)
async def delete_webhook(
    workflow_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete webhook for a workflow"""
    workflow = await get_workflow_or_404(workflow_id, db, include_relations=True)
    
    if not workflow.webhook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow has no webhook"
        )
    
    await db.delete(workflow.webhook)
    workflow.trigger_type = TriggerType.MANUAL
    await db.commit()


# ============================================================================
# NODE TYPES & INTEGRATIONS
# ============================================================================

@router.get("/nodes/available", response_model=List[NodeTypeSchema])
async def get_available_nodes(
    current_user: User = Depends(get_current_user)
):
    """Get list of available node types"""
    return get_node_type_definitions()


@router.get("/integrations/available", response_model=List[IntegrationSchema])
async def get_available_integrations(
    current_user: User = Depends(get_current_user)
):
    """Get list of available integrations"""
    return get_integration_definitions()


# ============================================================================
# CREDENTIALS (Stub - secure implementation needed)
# ============================================================================

@router.get("/credentials/", response_model=List[CredentialSummary])
async def list_credentials(
    organisation_id: UUID,
    project_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List stored credentials"""
    query = select(WorkflowCredential).where(
        WorkflowCredential.organisation_id == organisation_id
    )
    if project_id:
        query = query.where(
            (WorkflowCredential.project_id == project_id) |
            (WorkflowCredential.project_id == None)
        )
    
    result = await db.execute(query)
    credentials = result.scalars().all()
    
    return [_credential_to_summary(cred) for cred in credentials]


# ============================================================================
# HELPER CONVERSION FUNCTIONS
# ============================================================================

def _workflow_to_summary(workflow: WorkflowDefinition) -> WorkflowSummary:
    """Convert workflow model to summary schema"""
    return WorkflowSummary(
        id=workflow.id,
        human_id=workflow.human_id,
        name=workflow.name,
        description=workflow.description,
        status=workflow.status.value if hasattr(workflow.status, 'value') else workflow.status,
        trigger_type=workflow.trigger_type.value if hasattr(workflow.trigger_type, 'value') else workflow.trigger_type,
        category=workflow.category,
        icon=workflow.icon,
        color=workflow.color,
        tags=workflow.tags or [],
        total_executions=workflow.total_executions or 0,
        successful_executions=workflow.successful_executions or 0,
        failed_executions=workflow.failed_executions or 0,
        last_execution_status=workflow.last_execution_status,
        last_executed_at=workflow.last_executed_at,
        created_at=workflow.created_at,
        updated_at=workflow.updated_at,
    )


def _workflow_to_detail(workflow: WorkflowDefinition) -> WorkflowDetail:
    """Convert workflow model to detail schema"""
    from app.schemas.workflow import ViewportSchema
    
    nodes = []
    if workflow.nodes_json:
        for n in workflow.nodes_json:
            try:
                nodes.append(WorkflowNodeSchema(**n))
            except Exception:
                nodes.append(n)
    
    edges = []
    if workflow.edges_json:
        for e in workflow.edges_json:
            try:
                edges.append(WorkflowEdgeSchema(**e))
            except Exception:
                edges.append(e)
    
    viewport = ViewportSchema()
    if workflow.viewport_json:
        try:
            viewport = ViewportSchema(**workflow.viewport_json)
        except Exception:
            pass
    
    return WorkflowDetail(
        id=workflow.id,
        human_id=workflow.human_id,
        project_id=workflow.project_id,
        organisation_id=workflow.organisation_id,
        name=workflow.name,
        description=workflow.description,
        status=workflow.status.value if hasattr(workflow.status, 'value') else workflow.status,
        trigger_type=workflow.trigger_type.value if hasattr(workflow.trigger_type, 'value') else workflow.trigger_type,
        trigger_config=workflow.trigger_config or {},
        nodes=nodes,
        edges=edges,
        viewport=viewport,
        timeout_seconds=workflow.timeout_seconds or 3600,
        retry_policy=workflow.retry_policy or {},
        error_handling=workflow.error_handling or {},
        global_variables=workflow.global_variables or {},
        environment=workflow.environment or "production",
        version=workflow.version or "1.0.0",
        tags=workflow.tags or [],
        category=workflow.category,
        icon=workflow.icon,
        color=workflow.color,
        notes=workflow.notes,
        total_executions=workflow.total_executions or 0,
        successful_executions=workflow.successful_executions or 0,
        failed_executions=workflow.failed_executions or 0,
        average_duration_ms=workflow.average_duration_ms or 0,
        last_execution_status=workflow.last_execution_status,
        last_executed_at=workflow.last_executed_at,
        created_at=workflow.created_at,
        updated_at=workflow.updated_at,
        created_by=workflow.created_by,
    )


def _execution_to_summary(execution: WorkflowExecution) -> ExecutionSummary:
    """Convert execution model to summary schema"""
    return ExecutionSummary(
        id=execution.id,
        human_id=execution.human_id,
        workflow_id=execution.workflow_id,
        status=execution.status.value if hasattr(execution.status, 'value') else execution.status,
        trigger_source=execution.trigger_source,
        duration_ms=execution.duration_ms,
        total_nodes=execution.total_nodes or 0,
        completed_nodes=execution.completed_nodes or 0,
        failed_nodes=execution.failed_nodes or 0,
        skipped_nodes=execution.skipped_nodes or 0,
        error_message=execution.error_message,
        error_node_id=execution.error_node_id,
        started_at=execution.started_at,
        completed_at=execution.completed_at,
        created_at=execution.created_at,
    )


def _execution_to_detail(execution: WorkflowExecution) -> ExecutionDetail:
    """Convert execution model to detail schema"""
    from app.schemas.workflow import ExecutionStepSummary
    
    steps = []
    if hasattr(execution, 'steps') and execution.steps:
        for step in execution.steps:
            steps.append(ExecutionStepSummary(
                id=step.id,
                node_id=step.node_id,
                node_type=step.node_type,
                node_name=step.node_name,
                step_order=step.step_order,
                status=step.status.value if hasattr(step.status, 'value') else step.status,
                duration_ms=step.duration_ms,
                error_message=step.error_message,
                started_at=step.started_at,
                completed_at=step.completed_at,
            ))
    
    return ExecutionDetail(
        id=execution.id,
        human_id=execution.human_id,
        workflow_id=execution.workflow_id,
        project_id=execution.project_id,
        workflow_version=execution.workflow_version,
        status=execution.status.value if hasattr(execution.status, 'value') else execution.status,
        trigger_source=execution.trigger_source,
        trigger_data=execution.trigger_data or {},
        output_data=execution.output_data or {},
        execution_path=execution.execution_path or [],
        current_node_id=execution.current_node_id,
        error_message=execution.error_message,
        error_node_id=execution.error_node_id,
        error_stack=execution.error_stack,
        retry_count=execution.retry_count or 0,
        duration_ms=execution.duration_ms,
        total_nodes=execution.total_nodes or 0,
        completed_nodes=execution.completed_nodes or 0,
        failed_nodes=execution.failed_nodes or 0,
        skipped_nodes=execution.skipped_nodes or 0,
        steps=steps,
        triggered_by=execution.triggered_by,
        execution_context=execution.execution_context or {},
        notes=execution.notes,
        started_at=execution.started_at,
        completed_at=execution.completed_at,
        created_at=execution.created_at,
    )


def _step_to_detail(step: WorkflowExecutionStep) -> ExecutionStepDetail:
    """Convert step model to detail schema"""
    return ExecutionStepDetail(
        id=step.id,
        node_id=step.node_id,
        node_type=step.node_type,
        node_name=step.node_name,
        step_order=step.step_order,
        status=step.status.value if hasattr(step.status, 'value') else step.status,
        input_data=step.input_data or {},
        output_data=step.output_data or {},
        error_message=step.error_message,
        error_stack=step.error_stack,
        error_type=step.error_type,
        duration_ms=step.duration_ms,
        retry_count=step.retry_count or 0,
        condition_result=step.condition_result,
        condition_expression=step.condition_expression,
        loop_index=step.loop_index,
        loop_total=step.loop_total,
        http_status_code=step.http_status_code,
        response_headers=step.response_headers,
        logs=step.logs or [],
        started_at=step.started_at,
        completed_at=step.completed_at,
    )


def _schedule_to_detail(schedule: WorkflowSchedule) -> ScheduleDetail:
    """Convert schedule model to detail schema"""
    return ScheduleDetail(
        id=schedule.id,
        workflow_id=schedule.workflow_id,
        cron_expression=schedule.cron_expression,
        timezone=schedule.timezone,
        enabled=schedule.enabled,
        next_run_at=schedule.next_run_at,
        last_run_at=schedule.last_run_at,
        last_run_status=schedule.last_run_status,
        total_runs=schedule.total_runs or 0,
        successful_runs=schedule.successful_runs or 0,
        failed_runs=schedule.failed_runs or 0,
        consecutive_failures=schedule.consecutive_failures or 0,
        auto_disabled=schedule.auto_disabled,
        auto_disabled_at=schedule.auto_disabled_at,
        trigger_data=schedule.trigger_data or {},
        created_at=schedule.created_at,
        updated_at=schedule.updated_at,
    )


def _webhook_to_detail(webhook: WorkflowWebhook) -> WebhookDetail:
    """Convert webhook model to detail schema"""
    # Build full webhook URL (in production, get from config)
    base_url = "http://localhost:8000/api/v1/webhooks/incoming"
    webhook_url = f"{base_url}/{webhook.path}"
    
    return WebhookDetail(
        id=webhook.id,
        workflow_id=webhook.workflow_id,
        path=webhook.path,
        method=webhook.method,
        enabled=webhook.enabled,
        require_auth=webhook.require_auth,
        allowed_ips=webhook.allowed_ips or [],
        response_mode=webhook.response_mode,
        response_data=webhook.response_data or {},
        total_calls=webhook.total_calls or 0,
        successful_calls=webhook.successful_calls or 0,
        failed_calls=webhook.failed_calls or 0,
        last_called_at=webhook.last_called_at,
        rate_limit_enabled=webhook.rate_limit_enabled,
        rate_limit_max_calls=webhook.rate_limit_max_calls,
        rate_limit_window_seconds=webhook.rate_limit_window_seconds,
        created_at=webhook.created_at,
        updated_at=webhook.updated_at,
        webhook_url=webhook_url,
    )


def _credential_to_summary(credential: WorkflowCredential) -> CredentialSummary:
    """Convert credential model to summary schema"""
    return CredentialSummary(
        id=credential.id,
        name=credential.name,
        description=credential.description,
        credential_type=credential.credential_type.value if hasattr(credential.credential_type, 'value') else credential.credential_type,
        integration_type=credential.integration_type,
        is_valid=credential.is_valid,
        last_used_at=credential.last_used_at,
        use_count=credential.use_count or 0,
        created_at=credential.created_at,
        updated_at=credential.updated_at,
    )


# ============================================================================
# NODE TYPE & INTEGRATION DEFINITIONS
# ============================================================================

def get_node_type_definitions() -> List[NodeTypeSchema]:
    """Get all available node types"""
    return [
        # Triggers
        NodeTypeSchema(
            type="manual-trigger",
            name="Manual Trigger",
            description="Start workflow manually",
            category="Triggers",
            icon="play-circle",
            color="#10b981",
            inputs=0,
            outputs=1,
            config_schema={}
        ),
        NodeTypeSchema(
            type="schedule-trigger",
            name="Schedule",
            description="Start workflow on a schedule",
            category="Triggers",
            icon="clock",
            color="#10b981",
            inputs=0,
            outputs=1,
            config_schema={
                "type": "object",
                "properties": {
                    "cron": {"type": "string", "title": "Cron Expression"}
                }
            }
        ),
        NodeTypeSchema(
            type="webhook-trigger",
            name="Webhook",
            description="Start workflow via HTTP webhook",
            category="Triggers",
            icon="link",
            color="#10b981",
            inputs=0,
            outputs=1,
            config_schema={}
        ),
        
        # Logic
        NodeTypeSchema(
            type="if-condition",
            name="IF",
            description="Conditional branching",
            category="Logic",
            icon="git-branch",
            color="#8b5cf6",
            inputs=1,
            outputs=2,
            config_schema={
                "type": "object",
                "properties": {
                    "condition": {"type": "string", "title": "Condition Expression"}
                }
            }
        ),
        NodeTypeSchema(
            type="switch",
            name="Switch",
            description="Multi-way branching",
            category="Logic",
            icon="git-merge",
            color="#8b5cf6",
            inputs=1,
            outputs=4,
            config_schema={}
        ),
        NodeTypeSchema(
            type="loop",
            name="Loop",
            description="Iterate over items",
            category="Logic",
            icon="repeat",
            color="#8b5cf6",
            inputs=1,
            outputs=2,
            config_schema={}
        ),
        NodeTypeSchema(
            type="wait",
            name="Wait",
            description="Pause execution",
            category="Logic",
            icon="clock",
            color="#8b5cf6",
            inputs=1,
            outputs=1,
            config_schema={
                "type": "object",
                "properties": {
                    "duration": {"type": "number", "title": "Wait Duration (seconds)"}
                }
            }
        ),
        
        # Data
        NodeTypeSchema(
            type="set-variable",
            name="Set Variable",
            description="Set a workflow variable",
            category="Data",
            icon="variable",
            color="#f59e0b",
            inputs=1,
            outputs=1,
            config_schema={}
        ),
        NodeTypeSchema(
            type="transform",
            name="Transform",
            description="Transform data with expressions",
            category="Data",
            icon="shuffle",
            color="#f59e0b",
            inputs=1,
            outputs=1,
            config_schema={}
        ),
        
        # Actions
        NodeTypeSchema(
            type="http-request",
            name="HTTP Request",
            description="Make HTTP API calls",
            category="Actions",
            icon="globe",
            color="#3b82f6",
            inputs=1,
            outputs=1,
            config_schema={
                "type": "object",
                "properties": {
                    "method": {"type": "string", "enum": ["GET", "POST", "PUT", "DELETE", "PATCH"]},
                    "url": {"type": "string", "title": "URL"},
                    "headers": {"type": "object", "title": "Headers"},
                    "body": {"type": "string", "title": "Request Body"}
                }
            }
        ),
        NodeTypeSchema(
            type="run-test",
            name="Run Test",
            description="Execute a Cognitest test flow",
            category="Actions",
            icon="play",
            color="#3b82f6",
            inputs=1,
            outputs=1,
            config_schema={
                "type": "object",
                "properties": {
                    "test_flow_id": {"type": "string", "title": "Test Flow ID"}
                }
            }
        ),
    ]


def get_integration_definitions() -> List[IntegrationSchema]:
    """Get all available integrations"""
    return [
        IntegrationSchema(
            type="slack",
            name="Slack",
            description="Send messages to Slack channels",
            category="Communication",
            icon="slack",
            color="#4A154B",
            auth_type="oauth2",
            config_schema={
                "type": "object",
                "properties": {
                    "channel": {"type": "string", "title": "Channel"},
                    "message": {"type": "string", "title": "Message"}
                }
            },
            credential_fields=[
                {"name": "bot_token", "type": "password", "required": True}
            ]
        ),
        IntegrationSchema(
            type="email",
            name="Email (SMTP)",
            description="Send emails via SMTP",
            category="Communication",
            icon="mail",
            color="#EA4335",
            auth_type="basic_auth",
            config_schema={
                "type": "object",
                "properties": {
                    "to": {"type": "string", "title": "To"},
                    "subject": {"type": "string", "title": "Subject"},
                    "body": {"type": "string", "title": "Body"}
                }
            },
            credential_fields=[
                {"name": "host", "type": "text", "required": True},
                {"name": "port", "type": "number", "required": True},
                {"name": "username", "type": "text", "required": True},
                {"name": "password", "type": "password", "required": True}
            ]
        ),
        IntegrationSchema(
            type="jira",
            name="Jira",
            description="Create and update Jira issues",
            category="Project Management",
            icon="jira",
            color="#0052CC",
            auth_type="api_key",
            config_schema={
                "type": "object",
                "properties": {
                    "action": {"type": "string", "enum": ["create_issue", "update_issue", "add_comment"]},
                    "project": {"type": "string", "title": "Project Key"},
                    "issue_type": {"type": "string", "title": "Issue Type"},
                    "summary": {"type": "string", "title": "Summary"}
                }
            },
            credential_fields=[
                {"name": "domain", "type": "text", "required": True},
                {"name": "email", "type": "text", "required": True},
                {"name": "api_token", "type": "password", "required": True}
            ]
        ),
        IntegrationSchema(
            type="github",
            name="GitHub",
            description="Interact with GitHub repositories",
            category="Development",
            icon="github",
            color="#24292e",
            auth_type="bearer_token",
            config_schema={
                "type": "object",
                "properties": {
                    "action": {"type": "string", "enum": ["create_issue", "create_pr", "add_comment"]},
                    "owner": {"type": "string", "title": "Owner"},
                    "repo": {"type": "string", "title": "Repository"}
                }
            },
            credential_fields=[
                {"name": "token", "type": "password", "required": True}
            ]
        ),
        IntegrationSchema(
            type="postgresql",
            name="PostgreSQL",
            description="Execute PostgreSQL queries",
            category="Databases",
            icon="database",
            color="#336791",
            auth_type="custom",
            config_schema={
                "type": "object",
                "properties": {
                    "query": {"type": "string", "title": "SQL Query"}
                }
            },
            credential_fields=[
                {"name": "host", "type": "text", "required": True},
                {"name": "port", "type": "number", "required": True},
                {"name": "database", "type": "text", "required": True},
                {"name": "username", "type": "text", "required": True},
                {"name": "password", "type": "password", "required": True}
            ]
        ),
    ]


# ============================================================================
# BACKGROUND EXECUTION
# ============================================================================

async def run_workflow_execution(execution_id: str, workflow_id: str):
    """
    Run workflow execution in background.
    Uses Celery in production, falls back to direct execution in development.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    # Try to use Celery task
    try:
        from app.automation.workflows.tasks import execute_workflow_task
        execute_workflow_task.delay(workflow_id, execution_id)
        logger.info(f"Queued workflow execution via Celery: {execution_id}")
        return
    except ImportError:
        logger.warning("Celery not available, falling back to direct execution")
    except Exception as e:
        logger.warning(f"Failed to queue Celery task: {e}, falling back to direct execution")
    
    # Fallback: Direct execution (for development)
    try:
        from app.automation.workflows.engine import WorkflowEngine
        from app.core.database import async_sessionmaker
        
        async with async_sessionmaker() as db:
            # Fetch workflow and execution
            workflow_result = await db.execute(
                select(WorkflowDefinition).where(WorkflowDefinition.id == UUID(workflow_id))
            )
            workflow = workflow_result.scalar_one_or_none()
            
            execution_result = await db.execute(
                select(WorkflowExecution).where(WorkflowExecution.id == UUID(execution_id))
            )
            execution = execution_result.scalar_one_or_none()
            
            if workflow and execution:
                engine = WorkflowEngine(db)
                await engine.execute_workflow(workflow, execution)
                logger.info(f"Completed workflow execution: {execution_id}")
            else:
                logger.error(f"Workflow or execution not found: {workflow_id}, {execution_id}")
    except Exception as e:
        logger.exception(f"Direct workflow execution failed: {e}")

