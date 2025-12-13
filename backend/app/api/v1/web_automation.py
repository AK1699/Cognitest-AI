"""
Web Automation API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List, Optional
from uuid import UUID
import asyncio
import json

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.web_automation import (
    TestFlow, ExecutionRun, StepResult, HealingEvent, LocatorAlternative,
    BrowserType, ExecutionMode, TestFlowStatus, HealingStrategy
)
from app.models.project import Project
from app.schemas.web_automation import (
    TestFlowCreate, TestFlowUpdate, TestFlowResponse, TestFlowAnalytics,
    ExecutionRunCreate, ExecutionRunResponse, ExecutionRunDetailResponse,
    StepResultResponse, HealingEventResponse, HealingReportResponse,
    MultiBrowserExecutionRequest, StopExecutionRequest,
    LocatorHealingRequest, LocatorHealingSuggestion,
    AssertionHealingRequest, AssertionHealingSuggestion,
    LocatorAlternativeCreate, LocatorAlternativeResponse,
    LiveUpdateMessage
)
from app.services.web_automation_service import WebAutomationExecutor
from app.services.gemini_service import GeminiService
from app.services.browser_session_service import browser_session_manager, DevicePreset

router = APIRouter()


# WebSocket connection manager for live preview
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}
    
    async def connect(self, execution_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[execution_id] = websocket
    
    def disconnect(self, execution_id: str):
        if execution_id in self.active_connections:
            del self.active_connections[execution_id]
    
    async def send_message(self, execution_id: str, message: dict):
        if execution_id in self.active_connections:
            try:
                await self.active_connections[execution_id].send_json(message)
            except Exception as e:
                print(f"Failed to send WebSocket message: {str(e)}")

manager = ConnectionManager()


# Test Flow Management
@router.post("/test-flows", response_model=TestFlowResponse, status_code=status.HTTP_201_CREATED)
async def create_test_flow(
    project_id: UUID,
    flow_data: TestFlowCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new test flow
    """
    # Verify project exists
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    test_flow = TestFlow(
        project_id=project_id,
        organisation_id=project.organisation_id,
        created_by=current_user.id,
        **flow_data.model_dump()
    )
    
    db.add(test_flow)
    await db.commit()
    await db.refresh(test_flow)
    
    return test_flow


@router.get("/test-flows/{flow_id}", response_model=TestFlowResponse)
async def get_test_flow(
    flow_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get test flow by ID
    """
    result = await db.execute(select(TestFlow).where(TestFlow.id == flow_id))
    test_flow = result.scalar_one_or_none()
    
    if not test_flow:
        raise HTTPException(status_code=404, detail="Test flow not found")
    
    return test_flow


@router.get("/projects/{project_id}/test-flows", response_model=List[TestFlowResponse])
async def list_test_flows(
    project_id: UUID,
    status_filter: Optional[TestFlowStatus] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List test flows for a project
    """
    query = select(TestFlow).where(TestFlow.project_id == project_id)
    
    if status_filter:
        query = query.where(TestFlow.status == status_filter)
    
    query = query.order_by(desc(TestFlow.created_at)).offset(skip).limit(limit)
    result = await db.execute(query)
    test_flows = result.scalars().all()
    
    return test_flows


@router.put("/test-flows/{flow_id}", response_model=TestFlowResponse)
async def update_test_flow(
    flow_id: UUID,
    flow_update: TestFlowUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update test flow
    """
    result = await db.execute(select(TestFlow).where(TestFlow.id == flow_id))
    test_flow = result.scalar_one_or_none()
    
    if not test_flow:
        raise HTTPException(status_code=404, detail="Test flow not found")
    
    # Update fields
    update_data = flow_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(test_flow, field, value)
    
    await db.commit()
    await db.refresh(test_flow)
    
    return test_flow


@router.delete("/test-flows/{flow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_test_flow(
    flow_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete test flow
    """
    from sqlalchemy import text
    
    # Check if test flow exists
    result = await db.execute(select(TestFlow).where(TestFlow.id == flow_id))
    test_flow = result.scalar_one_or_none()
    
    if not test_flow:
        raise HTTPException(status_code=404, detail="Test flow not found")
    
    # Use raw SQL delete to avoid ORM relationship issues with missing tables
    await db.execute(text("DELETE FROM test_flows WHERE id = :flow_id"), {"flow_id": str(flow_id)})
    await db.commit()
    
    return None


# Test Execution
@router.post("/test-flows/{flow_id}/execute", response_model=ExecutionRunResponse)
async def execute_test_flow(
    flow_id: UUID,
    execution_config: ExecutionRunCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Execute a test flow
    """
    result = await db.execute(select(TestFlow).where(TestFlow.id == flow_id))
    test_flow = result.scalar_one_or_none()
    
    if not test_flow:
        raise HTTPException(status_code=404, detail="Test flow not found")
    
    # Use defaults from test flow if not specified
    browser_type = execution_config.browser_type or test_flow.default_browser
    execution_mode = execution_config.execution_mode or test_flow.default_mode
    
    # Create executor and run asynchronously
    executor = WebAutomationExecutor(db)
    
    # Execute test flow
    try:
        execution_run = await executor.execute_test_flow(
            test_flow_id=flow_id,
            browser_type=browser_type,
            execution_mode=execution_mode,
            triggered_by=current_user.id,
            variables=execution_config.variables
        )
        
        return execution_run
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Execution failed: {str(e)}")


@router.post("/test-flows/{flow_id}/execute/multi", response_model=List[ExecutionRunResponse])
async def execute_multi_browser(
    flow_id: UUID,
    execution_config: MultiBrowserExecutionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Execute test flow across multiple browsers
    """
    result = await db.execute(select(TestFlow).where(TestFlow.id == flow_id))
    test_flow = result.scalar_one_or_none()
    
    if not test_flow:
        raise HTTPException(status_code=404, detail="Test flow not found")
    
    results = []
    
    if execution_config.parallel:
        # Execute in parallel
        tasks = []
        for browser in execution_config.browsers:
            executor = WebAutomationExecutor(db)
            task = executor.execute_test_flow(
                test_flow_id=flow_id,
                browser_type=browser,
                execution_mode=execution_config.execution_mode,
                triggered_by=current_user.id
            )
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out exceptions
        results = [r for r in results if not isinstance(r, Exception)]
    
    else:
        # Execute sequentially
        for browser in execution_config.browsers:
            try:
                executor = WebAutomationExecutor(db)
                execution_run = await executor.execute_test_flow(
                    test_flow_id=flow_id,
                    browser_type=browser,
                    execution_mode=execution_config.execution_mode,
                    triggered_by=current_user.id
                )
                results.append(execution_run)
            except Exception as e:
                print(f"Execution failed for {browser}: {str(e)}")
    
    return results


@router.get("/executions/{execution_id}/live", response_model=ExecutionRunResponse)
async def get_execution_live_status(
    execution_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get live status of an execution
    """
    result = await db.execute(select(ExecutionRun).where(ExecutionRun.id == execution_id))
    run = result.scalar_one_or_none()
    
    if not run:
        raise HTTPException(status_code=404, detail="Execution run not found")
        
    return run


# --- Test Recorder ---

from pydantic import BaseModel

class RecordingRequest(BaseModel):
    url: str
    project_id: str

class StopRecordingRequest(BaseModel):
    project_id: str

class RecordingResponse(BaseModel):
    session_id: str
    status: str

# In-memory storage for active recorders
# dict[session_id, WebAutomationExecutor]
active_recorders: dict[str, WebAutomationExecutor] = {}

@router.post("/recorder/start", response_model=RecordingResponse)
async def start_recording(
    request: RecordingRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Start a recording session"""
    session_id = str(request.project_id) # Simplify: 1 active recording per project for now
    
    # Clean up existing if any
    if session_id in active_recorders:
        await active_recorders[session_id].stop_recording()
        del active_recorders[session_id]
    
    executor = WebAutomationExecutor(db)
    # Register websocket callback to forward events
    async def ws_forwarder(message):
        # Broadcast to project room or specific user connection
        # For simplicity, we assume the frontend client is connected to a specific WS endpoint
        # We will use the existing ConnectionManager but with a special ID prefix
        await manager.send_message(f"recorder_{session_id}", message)
        
    executor.register_ws_callback(ws_forwarder)
    
    # Start asynchronously to not block
    asyncio.create_task(executor.start_recording(request.url))
    
    active_recorders[session_id] = executor
    
    return RecordingResponse(session_id=session_id, status="started")

@router.post("/recorder/stop")
async def stop_recording(
    request: StopRecordingRequest,
    current_user: User = Depends(get_current_user)
):
    session_id = request.project_id
    if session_id in active_recorders:
        await active_recorders[session_id].stop_recording()
        del active_recorders[session_id]
        return {"status": "stopped"}
    return {"status": "not_found"}

@router.websocket("/ws/recorder/{project_id}")
async def websocket_recorder_endpoint(websocket: WebSocket, project_id: str):
    """WebSocket for recorder events"""
    await manager.connect(f"recorder_{project_id}", websocket)
    try:
        while True:
            # Keep alive / receive commands from frontend if needed
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(f"recorder_{project_id}")


@router.get("/executions/{run_id}", response_model=ExecutionRunDetailResponse)
async def get_execution_run(
    run_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get execution run with detailed results
    """
    try:
        result = await db.execute(select(ExecutionRun).where(ExecutionRun.id == run_id))
        execution_run = result.scalar_one_or_none()
        
        if not execution_run:
            raise HTTPException(status_code=404, detail="Execution run not found")
        
        # Verify access
        result = await db.execute(select(TestFlow).where(TestFlow.id == execution_run.test_flow_id))
        test_flow = result.scalar_one_or_none()
        
        if not test_flow:
            raise HTTPException(status_code=404, detail="Access denied")
        
        # Load step results and healing events
        step_result = await db.execute(
            select(StepResult)
            .where(StepResult.execution_run_id == run_id)
            .order_by(StepResult.step_order)
        )
        step_results = step_result.scalars().all()
        
        healing_result = await db.execute(
            select(HealingEvent).where(HealingEvent.execution_run_id == run_id)
        )
        healing_events = healing_result.scalars().all()
        
        # Build response manually to avoid validation issues
        response_data = {
            "id": execution_run.id,
            "test_flow_id": execution_run.test_flow_id,
            "project_id": execution_run.project_id,
            "browser_type": execution_run.browser_type,
            "execution_mode": execution_run.execution_mode,
            "status": execution_run.status,
            "total_steps": execution_run.total_steps or 0,
            "passed_steps": execution_run.passed_steps or 0,
            "failed_steps": execution_run.failed_steps or 0,
            "skipped_steps": execution_run.skipped_steps or 0,
            "healed_steps": execution_run.healed_steps or 0,
            "duration_ms": execution_run.duration_ms,
            "started_at": execution_run.started_at,
            "ended_at": execution_run.ended_at,
            "execution_environment": execution_run.execution_environment or {},
            "video_url": execution_run.video_url,
            "trace_url": execution_run.trace_url,
            "screenshots_dir": execution_run.screenshots_dir,
            "error_message": execution_run.error_message,
            "error_stack": execution_run.error_stack,
            "triggered_by": execution_run.triggered_by,
            "trigger_source": execution_run.trigger_source,
            "tags": execution_run.tags or [],
            "notes": execution_run.notes,
            "created_at": execution_run.created_at,
            "test_flow_name": test_flow.name if test_flow else None,
            "step_results": [],
            "healing_events": []
        }
        
        # Add step results
        for sr in step_results:
            response_data["step_results"].append({
                "id": sr.id,
                "execution_run_id": sr.execution_run_id,
                "step_id": sr.step_id,
                "step_name": sr.step_name,
                "step_type": sr.step_type,
                "step_order": sr.step_order,
                "status": sr.status,
                "selector_used": sr.selector_used,
                "action_details": sr.action_details or {},
                "actual_result": sr.actual_result,
                "expected_result": sr.expected_result,
                "error_message": sr.error_message,
                "error_stack": sr.error_stack,
                "duration_ms": sr.duration_ms,
                "retry_count": sr.retry_count or 0,
                "screenshot_url": sr.screenshot_url,
                "screenshot_before_url": sr.screenshot_before_url,
                "screenshot_after_url": sr.screenshot_after_url,
                "was_healed": sr.was_healed or False,
                "healing_applied": sr.healing_applied,
                "console_logs": sr.console_logs or [],
                "network_logs": sr.network_logs or [],
                "started_at": sr.started_at,
                "ended_at": sr.ended_at,
                "created_at": sr.created_at
            })
        
        # Add healing events
        for he in healing_events:
            response_data["healing_events"].append({
                "id": he.id,
                "execution_run_id": he.execution_run_id,
                "step_result_id": he.step_result_id,
                "healing_type": he.healing_type,
                "strategy": he.strategy,
                "original_value": he.original_value,
                "healed_value": he.healed_value,
                "step_id": he.step_id,
                "step_type": he.step_type,
                "failure_reason": he.failure_reason,
                "success": he.success,
                "confidence_score": he.confidence_score,
                "retry_attempts": he.retry_attempts or 0,
                "ai_model": he.ai_model,
                "ai_reasoning": he.ai_reasoning,
                "alternatives_tried": he.alternatives_tried or [],
                "page_url": he.page_url,
                "page_title": he.page_title,
                "healing_duration_ms": he.healing_duration_ms,
                "recorded_at": he.recorded_at
            })
        
        return ExecutionRunDetailResponse(**response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Error in get_execution_run: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

@router.get("/projects/{project_id}/executions", response_model=List[ExecutionRunResponse])
async def list_project_executions(
    project_id: UUID,
    status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all execution runs for a project
    """
    # Build query with optional status filter
    query = select(ExecutionRun).where(ExecutionRun.project_id == project_id)
    
    if status:
        query = query.where(ExecutionRun.status == status)
    
    query = query.order_by(desc(ExecutionRun.created_at)).offset(skip).limit(limit)
    
    exec_result = await db.execute(query)
    executions = exec_result.scalars().all()
    
    # Build response with test flow names
    result = []
    for execution in executions:
        flow_result = await db.execute(select(TestFlow).where(TestFlow.id == execution.test_flow_id))
        test_flow = flow_result.scalar_one_or_none()
        
        response = ExecutionRunResponse.model_validate(execution)
        response.test_flow_name = test_flow.name if test_flow else None
        result.append(response)
    
    return result


@router.get("/test-flows/{flow_id}/executions", response_model=List[ExecutionRunResponse])
async def list_executions(
    flow_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List execution runs for a test flow
    """
    result = await db.execute(select(TestFlow).where(TestFlow.id == flow_id))
    test_flow = result.scalar_one_or_none()
    
    if not test_flow:
        raise HTTPException(status_code=404, detail="Test flow not found")
    
    exec_result = await db.execute(
        select(ExecutionRun)
        .where(ExecutionRun.test_flow_id == flow_id)
        .order_by(desc(ExecutionRun.created_at))
        .offset(skip)
        .limit(limit)
    )
    executions = exec_result.scalars().all()
    
    return executions


@router.post("/executions/{run_id}/stop")
async def stop_execution(
    run_id: UUID,
    stop_request: StopExecutionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Stop a running execution
    """
    result = await db.execute(select(ExecutionRun).where(ExecutionRun.id == run_id))
    execution_run = result.scalar_one_or_none()
    
    if not execution_run:
        raise HTTPException(status_code=404, detail="Execution run not found")
    
    # TODO: Implement actual stop mechanism
    # For now, just update status
    execution_run.status = "stopped"
    execution_run.notes = stop_request.reason
    await db.commit()
    
    return {"success": True, "message": "Execution stopped"}


# Healing & Analytics
@router.get("/executions/{run_id}/healings", response_model=HealingReportResponse)
async def get_healing_report(
    run_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get healing report for an execution run
    """
    result = await db.execute(
        select(HealingEvent).where(HealingEvent.execution_run_id == run_id)
    )
    healing_events = result.scalars().all()
    
    if not healing_events:
        return HealingReportResponse(
            execution_run_id=run_id,
            total_healings=0,
            successful_healings=0,
            failed_healings=0,
            by_type={},
            by_strategy={},
            success_rate=0.0,
            average_confidence=0.0,
            timeline=[]
        )
    
    total = len(healing_events)
    successful = sum(1 for h in healing_events if h.success)
    failed = total - successful
    
    by_type = {}
    by_strategy = {}
    total_confidence = 0
    confidence_count = 0
    timeline = []
    
    for h in healing_events:
        # By type
        type_key = h.healing_type.value
        by_type[type_key] = by_type.get(type_key, 0) + 1
        
        # By strategy
        strategy_key = h.strategy.value
        by_strategy[strategy_key] = by_strategy.get(strategy_key, 0) + 1
        
        # Confidence
        if h.confidence_score:
            total_confidence += h.confidence_score
            confidence_count += 1
        
        # Timeline
        timeline.append({
            "timestamp": h.recorded_at.isoformat(),
            "step_id": h.step_id,
            "healing_type": h.healing_type.value,
            "strategy": h.strategy.value,
            "success": h.success
        })
    
    return HealingReportResponse(
        execution_run_id=run_id,
        total_healings=total,
        successful_healings=successful,
        failed_healings=failed,
        by_type=by_type,
        by_strategy=by_strategy,
        success_rate=(successful / total * 100) if total > 0 else 0,
        average_confidence=(total_confidence / confidence_count) if confidence_count > 0 else 0,
        timeline=timeline
    )


# Self-Heal Dashboard
@router.get("/projects/{project_id}/self-heal/dashboard")
async def get_self_heal_dashboard(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get self-heal dashboard data for a project
    """
    from datetime import datetime, timedelta
    
    # Get all test flows for the project
    flows_result = await db.execute(
        select(TestFlow).where(TestFlow.project_id == project_id)
    )
    test_flows = flows_result.scalars().all()
    total_tests = len(test_flows)
    
    # Get recent executions (last 7 days)
    week_ago = datetime.utcnow() - timedelta(days=7)
    exec_result = await db.execute(
        select(ExecutionRun)
        .where(ExecutionRun.project_id == project_id)
        .where(ExecutionRun.created_at >= week_ago)
        .order_by(desc(ExecutionRun.created_at))
    )
    recent_executions = exec_result.scalars().all()
    
    # Calculate health metrics
    total_executions = len(recent_executions)
    successful_executions = sum(1 for e in recent_executions if e.status.value == 'completed' and e.failed_steps == 0)
    health_score = (successful_executions / total_executions * 100) if total_executions > 0 else 100.0
    
    # Count healed steps this week
    auto_healed_this_week = sum(e.healed_steps for e in recent_executions)
    
    # Get healing events (potential issues)
    healing_result = await db.execute(
        select(HealingEvent)
        .where(HealingEvent.execution_run_id.in_([e.id for e in recent_executions]) if recent_executions else False)
        .order_by(desc(HealingEvent.recorded_at))
        .limit(20)
    )
    healing_events = healing_result.scalars().all()
    
    # Get failed steps (detected issues)
    failed_steps_result = await db.execute(
        select(StepResult)
        .where(StepResult.execution_run_id.in_([e.id for e in recent_executions]) if recent_executions else False)
        .where(StepResult.status == 'failed')
        .order_by(desc(StepResult.created_at))
        .limit(10)
    )
    failed_steps = failed_steps_result.scalars().all()
    
    # Build detected issues
    detected_issues = []
    for step in failed_steps:
        # Get the test flow name
        exec_run = next((e for e in recent_executions if e.id == step.execution_run_id), None)
        flow = next((f for f in test_flows if exec_run and f.id == exec_run.test_flow_id), None)
        
        issue = {
            "id": str(step.id),
            "type": "Locator Changed" if "not found" in (step.error_message or "").lower() else "Assertion Failed",
            "test": flow.name if flow else "Unknown Test",
            "step": step.step_name or step.step_type,
            "status": "LOCATOR_NOT_FOUND" if "not found" in (step.error_message or "").lower() else "ASSERTION_FAILED",
            "confidence": 95,  # Placeholder - would come from AI analysis
            "old_locator": step.selector_used.get("css", "") if step.selector_used else "",
            "error_message": step.error_message,
            "suggestions": [
                {"id": f"s{step.id[:8]}", "value": "AI suggestion pending", "confidence": 95, "type": "AI Match"}
            ]
        }
        detected_issues.append(issue)
    
    # Build repair history
    repair_history = []
    for event in healing_events[:10]:
        exec_run = next((e for e in recent_executions if e.id == event.execution_run_id), None)
        flow = next((f for f in test_flows if exec_run and f.id == exec_run.test_flow_id), None)
        
        repair_history.append({
            "id": str(event.id),
            "date": event.recorded_at.isoformat() if event.recorded_at else "",
            "type": f"{event.healing_type.value.title()} Update",
            "test": flow.name if flow else "Unknown Test",
            "action": "Auto-Healed" if event.success else "Manual Review",
            "success": event.success
        })
    
    return {
        "health_score": round(health_score, 1),
        "total_tests": total_tests,
        "issues_detected": len(detected_issues),
        "auto_healed_this_week": auto_healed_this_week,
        "detected_issues": detected_issues,
        "repair_history": repair_history,
        "config": {
            "auto_apply_low_risk": True,
            "notify_on_issues": True,
            "visual_matching": True,
            "confidence_threshold": 90
        }
    }


@router.get("/test-flows/{flow_id}/analytics", response_model=TestFlowAnalytics)
async def get_test_flow_analytics(
    flow_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get analytics for a test flow
    """
    result = await db.execute(select(TestFlow).where(TestFlow.id == flow_id))
    test_flow = result.scalar_one_or_none()
    
    if not test_flow:
        raise HTTPException(status_code=404, detail="Test flow not found")
    
    # Get execution history
    exec_result = await db.execute(
        select(ExecutionRun)
        .where(ExecutionRun.test_flow_id == flow_id)
        .order_by(ExecutionRun.created_at)
    )
    executions = exec_result.scalars().all()
    
    # Calculate statistics
    total_executions = len(executions)
    successful = sum(1 for e in executions if e.status == "completed" and e.failed_steps == 0)
    
    # Browser statistics
    browser_stats = {}
    for e in executions:
        browser = e.browser_type.value
        browser_stats[browser] = browser_stats.get(browser, 0) + 1
    
    # Healing statistics
    total_healings = 0
    successful_healings = 0
    for e in executions:
        total_healings += e.healed_steps
        if e.healed_steps > 0:
            successful_healings += 1
    
    # Trend data (last 10 executions)
    trend_data = []
    for e in executions[-10:]:
        trend_data.append({
            "execution_id": str(e.id),
            "timestamp": e.created_at.isoformat(),
            "status": e.status.value,
            "duration_ms": e.duration_ms,
            "passed_steps": e.passed_steps,
            "failed_steps": e.failed_steps,
            "healed_steps": e.healed_steps
        })
    
    return TestFlowAnalytics(
        test_flow_id=flow_id,
        total_executions=total_executions,
        success_rate=(successful / total_executions * 100) if total_executions > 0 else 0,
        average_duration_ms=test_flow.average_duration,
        healing_statistics={
            "total_healings": total_healings,
            "successful_healings": successful_healings,
            "healing_rate": test_flow.healing_success_rate
        },
        browser_statistics=browser_stats,
        trend_data=trend_data
    )


# AI Healing Suggestions
@router.post("/healing/suggest-locator", response_model=LocatorHealingSuggestion)
async def suggest_locator_healing(
    request: LocatorHealingRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Get AI-powered locator healing suggestion
    """
    ai_service = GeminiService()
    
    prompt = f"""
    Suggest alternative CSS selectors for a web element that could not be found.
    
    Original Selector: {request.original_selector}
    Strategy: {request.selector_strategy}
    Page URL: {request.page_url}
    
    Failed Alternatives:
    {json.dumps(request.failed_alternatives, indent=2)}
    
    DOM Context (truncated):
    {request.dom_snapshot[:3000]}
    
    Provide 3 robust alternative selectors in JSON format:
    {{
        "selectors": [
            {{"selector": "...", "confidence": 0.9, "reasoning": "..."}}
        ]
    }}
    """
    
    try:
        ai_response = await ai_service.generate_content(prompt)
        suggestions = json.loads(ai_response)
        
        if suggestions and "selectors" in suggestions:
            best = suggestions["selectors"][0]
            return LocatorHealingSuggestion(
                suggested_selector=best["selector"],
                strategy=HealingStrategy.AI,
                confidence_score=best.get("confidence", 0.5),
                reasoning=best.get("reasoning", "AI suggestion"),
                alternatives=suggestions["selectors"][1:]
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI suggestion failed: {str(e)}")


@router.post("/healing/suggest-assertion", response_model=AssertionHealingSuggestion)
async def suggest_assertion_healing(
    request: AssertionHealingRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Get AI-powered assertion healing suggestion
    """
    ai_service = GeminiService()
    
    prompt = f"""
    Determine if an assertion failure is a legitimate change or a real bug.
    
    Assertion Type: {request.assertion_type}
    Expected: {request.expected_value}
    Actual: {request.actual_value}
    Context: {json.dumps(request.context)}
    
    Respond in JSON:
    {{
        "should_update": true/false,
        "new_value": "...",
        "confidence": 0.9,
        "reasoning": "...",
        "is_legitimate_change": true/false
    }}
    """
    
    try:
        ai_response = await ai_service.generate_content(prompt)
        suggestion = json.loads(ai_response)
        
        return AssertionHealingSuggestion(**suggestion)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI suggestion failed: {str(e)}")


# WebSocket for live preview
@router.websocket("/ws/live-preview/{execution_id}")
async def websocket_live_preview(
    websocket: WebSocket,
    execution_id: str
):
    """
    WebSocket endpoint for live execution preview
    """
    await manager.connect(execution_id, websocket)
    
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
            
            # Handle client messages if needed
            if data == "ping":
                await websocket.send_text("pong")
    
    except WebSocketDisconnect:
        manager.disconnect(execution_id)
    except Exception as e:
        print(f"WebSocket error: {str(e)}")
        manager.disconnect(execution_id)


# Locator Alternatives
@router.post("/test-flows/{flow_id}/locator-alternatives", response_model=LocatorAlternativeResponse)
async def create_locator_alternative(
    flow_id: UUID,
    alternative_data: LocatorAlternativeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Store alternative locators for an element
    """
    result = await db.execute(select(TestFlow).where(TestFlow.id == flow_id))
    test_flow = result.scalar_one_or_none()
    
    if not test_flow:
        raise HTTPException(status_code=404, detail="Test flow not found")
    
    locator_alt = LocatorAlternative(
        test_flow_id=flow_id,
        **alternative_data.model_dump()
    )
    
    db.add(locator_alt)
    await db.commit()
    await db.refresh(locator_alt)
    
    return locator_alt


@router.get("/test-flows/{flow_id}/locator-alternatives", response_model=List[LocatorAlternativeResponse])
async def list_locator_alternatives(
    flow_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List stored locator alternatives for a test flow
    """
    result = await db.execute(select(TestFlow).where(TestFlow.id == flow_id))
    test_flow = result.scalar_one_or_none()
    
    if not test_flow:
        raise HTTPException(status_code=404, detail="Test flow not found")
    
    alt_result = await db.execute(
        select(LocatorAlternative).where(LocatorAlternative.test_flow_id == flow_id)
    )
    alternatives = alt_result.scalars().all()
    
    return alternatives


# ============================================================================
# AI-POWERED TEST STEP GENERATION
# ============================================================================

from pydantic import BaseModel
from app.services.prompt_to_steps import generate_steps_from_prompt


class GenerateStepsRequest(BaseModel):
    """Request body for generating steps from natural language"""
    prompt: str
    context: Optional[dict] = None


class GenerateStepsResponse(BaseModel):
    """Response containing generated test steps"""
    success: bool
    steps: List[dict]
    explanation: Optional[str] = None
    error: Optional[str] = None


@router.post("/generate-steps", response_model=GenerateStepsResponse)
async def generate_test_steps(
    request: GenerateStepsRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Generate test steps from a natural language prompt using AI.
    
    Example prompts:
    - "Login with email 'user@example.com' and password 'secret123'"
    - "Fill out the registration form and submit"
    - "Navigate to the products page, add an item to cart, and checkout"
    """
    result = await generate_steps_from_prompt(
        prompt=request.prompt,
        context=request.context
    )
    
    return GenerateStepsResponse(
        success=result.get("success", False),
        steps=result.get("steps", []),
        explanation=result.get("explanation"),
        error=result.get("error")
    )


# ============================================================================
# BROWSER SESSION MANAGEMENT - Live Browser Feature
# ============================================================================

# Store WebSocket connections for browser sessions
browser_session_connections: dict[str, WebSocket] = {}


@router.get("/device-presets")
async def get_device_presets():
    """
    Get available device presets for browser emulation.
    """
    return {
        "devices": [
            {"id": "desktop_chrome", "name": "Desktop Chrome", "viewport": "1920x1080", "type": "desktop"},
            {"id": "desktop_1280", "name": "Desktop 1280", "viewport": "1280x720", "type": "desktop"},
            {"id": "iphone_14", "name": "iPhone 14", "viewport": "390x844", "type": "mobile"},
            {"id": "iphone_14_pro_max", "name": "iPhone 14 Pro Max", "viewport": "430x932", "type": "mobile"},
            {"id": "pixel_7", "name": "Pixel 7", "viewport": "412x915", "type": "mobile"},
            {"id": "ipad_pro", "name": "iPad Pro", "viewport": "1024x1366", "type": "tablet"},
            {"id": "galaxy_s21", "name": "Galaxy S21", "viewport": "360x800", "type": "mobile"},
        ]
    }


@router.get("/browser-sessions")
async def list_browser_sessions(
    current_user: User = Depends(get_current_user)
):
    """
    List all active browser sessions.
    """
    return {
        "sessions": browser_session_manager.get_all_sessions()
    }


@router.get("/browser-sessions/{session_id}")
async def get_browser_session_state(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get current state of a browser session.
    """
    session = browser_session_manager.get_session(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Browser session not found")
    
    return session.get_state()


@router.delete("/browser-sessions/{session_id}")
async def stop_browser_session(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Stop and cleanup a browser session.
    """
    success = await browser_session_manager.stop_session(session_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Browser session not found")
    
    # Clean up WebSocket connection
    if session_id in browser_session_connections:
        del browser_session_connections[session_id]
    
    return {"message": "Browser session stopped", "session_id": session_id}


@router.websocket("/ws/browser-session/{session_id}")
async def websocket_browser_session(
    websocket: WebSocket,
    session_id: str
):
    """
    WebSocket endpoint for browser session live updates.
    
    Flow:
    1. Client connects to WebSocket
    2. Client sends {"action": "launch", "browserType": "...", "device": "...", "url": "..."}
    3. Server launches browser and streams screenshots
    
    Client can send control messages:
    - {"action": "launch", "browserType": "chromium", "device": "desktop_chrome", "url": "https://..."}
    - {"action": "navigate", "url": "https://..."}
    - {"action": "highlight", "selector": "#element"}
    - {"action": "stop"}
    """
    await websocket.accept()
    browser_session_connections[session_id] = websocket
    
    # Define update callback for this session
    async def on_update(data: dict):
        try:
            # Check if this websocket is still the active one for this session
            current_ws = browser_session_connections.get(session_id)
            if current_ws is not websocket:
                return  # A newer connection replaced this one
            
            # Check if websocket is still connected
            if websocket.client_state.name != "CONNECTED":
                return
            
            await websocket.send_json(data)
        except Exception as e:
            # Silently ignore send failures (connection may have closed)
            pass
    
    try:
        # Send initial connected message
        await websocket.send_json({
            "type": "connected",
            "session_id": session_id,
            "message": "WebSocket connected. Send launch command to start browser."
        })
        
        while True:
            # Receive messages from client
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
                action = message.get("action")
                
                if action == "launch":
                    # Launch browser session
                    browser_type = message.get("browserType", "chromium")
                    device = message.get("device", "desktop_chrome")
                    url = message.get("url", "about:blank")
                    
                    await websocket.send_json({
                        "type": "launching",
                        "message": "Launching browser..."
                    })
                    
                    try:
                        # Check if headed mode is requested
                        headless = message.get("headless", True)
                        
                        session = await browser_session_manager.create_session(
                            session_id=session_id,
                            on_update=on_update,
                            browser_type=browser_type,
                            device=device,
                            initial_url=url,
                            headless=headless
                        )
                        
                        if not session:
                            await websocket.send_json({
                                "type": "error",
                                "error": "Failed to launch browser. Make sure Playwright browsers are installed (run: playwright install)"
                            })
                    except Exception as e:
                        await websocket.send_json({
                            "type": "error",
                            "error": f"Browser launch failed: {str(e)}"
                        })
                
                elif action == "navigate":
                    url = message.get("url")
                    session = browser_session_manager.get_session(session_id)
                    if session and url:
                        await session.navigate(url)
                    elif not session:
                        await websocket.send_json({"type": "error", "error": "No active session"})
                
                elif action == "highlight":
                    selector = message.get("selector")
                    session = browser_session_manager.get_session(session_id)
                    if session and selector:
                        await session.highlight_element(selector)
                
                elif action == "stop":
                    await browser_session_manager.stop_session(session_id)
                    await websocket.send_json({
                        "type": "session_stopped",
                        "session_id": session_id
                    })
                
                # Interactive actions for element inspector
                elif action == "click":
                    x = message.get("x")
                    y = message.get("y")
                    session = browser_session_manager.get_session(session_id)
                    if session and x is not None and y is not None:
                        result = await session.click_at_point(x, y)
                        await websocket.send_json({
                            "type": "element_clicked",
                            **result
                        })
                    elif not session:
                        await websocket.send_json({"type": "error", "error": "No active session"})
                
                elif action == "inspect":
                    # Get element info without clicking
                    x = message.get("x")
                    y = message.get("y")
                    session = browser_session_manager.get_session(session_id)
                    if session and x is not None and y is not None:
                        element_info = await session.get_element_at_point(x, y)
                        await websocket.send_json({
                            "type": "element_info",
                            "element": element_info,
                            "x": x,
                            "y": y
                        })
                    elif not session:
                        await websocket.send_json({"type": "error", "error": "No active session"})
                
                elif action == "type":
                    text = message.get("text", "")
                    session = browser_session_manager.get_session(session_id)
                    if session:
                        result = await session.type_text(text)
                        await websocket.send_json({
                            "type": "typed",
                            **result
                        })
                
                elif action == "press":
                    key = message.get("key", "")
                    session = browser_session_manager.get_session(session_id)
                    if session:
                        result = await session.press_key(key)
                        await websocket.send_json({
                            "type": "key_pressed",
                            **result
                        })
                
                elif action == "scroll":
                    direction = message.get("direction", "down")
                    amount = message.get("amount", 300)
                    session = browser_session_manager.get_session(session_id)
                    if session:
                        result = await session.scroll_page(direction, amount)
                        await websocket.send_json({
                            "type": "scrolled",
                            **result
                        })
                
                elif action == "execute_test":
                    # Execute test steps on the existing browser session
                    flow_id = message.get("flowId")
                    session = browser_session_manager.get_session(session_id)
                    
                    if not session:
                        await websocket.send_json({"type": "error", "error": "No active browser session"})
                        continue
                    
                    if not flow_id:
                        await websocket.send_json({"type": "error", "error": "No flowId provided"})
                        continue
                    
                    try:
                        # Get test flow and create execution run record
                        from app.core.database import get_db as get_db_session
                        from app.models.web_automation import ExecutionRun, StepResult, ExecutionRunStatus, StepStatus, BrowserType, ExecutionMode
                        from datetime import datetime
                        import uuid
                        
                        async for db in get_db_session():
                            result = await db.execute(select(TestFlow).where(TestFlow.id == flow_id))
                            test_flow = result.scalar_one_or_none()
                            
                            if not test_flow:
                                await websocket.send_json({"type": "error", "error": "Test flow not found"})
                                break
                            
                            # Create execution run record
                            steps = test_flow.nodes or []
                            execution_run = ExecutionRun(
                                id=uuid.uuid4(),
                                test_flow_id=test_flow.id,
                                project_id=test_flow.project_id,
                                browser_type=BrowserType.CHROMIUM,
                                execution_mode=ExecutionMode.HEADED,
                                status=ExecutionRunStatus.RUNNING,
                                total_steps=len(steps),
                                passed_steps=0,
                                failed_steps=0,
                                skipped_steps=0,
                                healed_steps=0,
                                started_at=datetime.utcnow(),
                                trigger_source="live_browser"
                            )
                            db.add(execution_run)
                            await db.commit()
                            await db.refresh(execution_run)
                            
                            # Notify test execution started
                            await websocket.send_json({
                                "type": "test_execution_started",
                                "flowId": str(flow_id),
                                "executionId": str(execution_run.id),
                                "testName": test_flow.name,
                                "totalSteps": len(steps)
                            })
                            
                            # Track results
                            passed_count = 0
                            failed_count = 0
                            start_time = datetime.utcnow()
                            
                            # Execute each step
                            for i, step in enumerate(steps):
                                step_start = datetime.utcnow()
                                
                                # Step data can be at root level or nested in 'data'
                                step_data = step.get("data", step)
                                
                                # Step type can be 'action' or 'type' field
                                step_type = step_data.get("action") or step_data.get("type") or step.get("action") or step.get("type") or "unknown"
                                
                                # Generate human-friendly action name from step_type (e.g., 'assert_title' -> 'Assert Title')
                                def format_action_name(action_type: str) -> str:
                                    """Convert action_type to human-friendly name"""
                                    action_names = {
                                        'navigate': 'Navigate',
                                        'click': 'Click',
                                        'type': 'Type',
                                        'fill': 'Fill',
                                        'assert': 'Assert',
                                        'assert_title': 'Assert Title',
                                        'assert_url': 'Assert URL',
                                        'assert_visible': 'Assert Visible',
                                        'assert_text': 'Assert Text',
                                        'assert_value': 'Assert Value',
                                        'assert_not_visible': 'Assert Hidden',
                                        'assert_element_count': 'Assert Count',
                                        'soft_assert': 'Soft Assert',
                                        'wait': 'Wait',
                                        'wait_for_element': 'Wait for Element',
                                        'screenshot': 'Screenshot',
                                        'hover': 'Hover',
                                        'scroll': 'Scroll',
                                        'select': 'Select',
                                        'upload': 'Upload',
                                        'press': 'Press Key',
                                        'double_click': 'Double Click',
                                        'right_click': 'Right Click',
                                        'focus': 'Focus',
                                        'drag_drop': 'Drag and Drop',
                                        'execute_script': 'Execute Script',
                                        'set_variable': 'Set Variable',
                                        'log': 'Log',
                                        'reload': 'Reload',
                                        'go_back': 'Go Back',
                                        'go_forward': 'Go Forward',
                                    }
                                    return action_names.get(action_type, action_type.replace('_', ' ').title())
                                
                                # Use description/label if available, otherwise use formatted action name
                                step_name = step_data.get("label") or step_data.get("description") or step.get("description") or format_action_name(step_type)
                                step_id = step.get("id", f"step-{i}")
                                selector_used = step_data.get("selector") or step.get("selector") or ""
                                
                                # Get step details for frontend display
                                step_url = step_data.get("url") or step.get("url") or ""
                                # For assert_title/assert_url, use expected_title/expected_url instead of value
                                step_value = (
                                    step_data.get("expected_title") or 
                                    step_data.get("expected_url") or
                                    step_data.get("value") or 
                                    step.get("expected_title") or
                                    step.get("expected_url") or
                                    step.get("value") or 
                                    ""
                                )
                                
                                await websocket.send_json({
                                    "type": "step_started",
                                    "stepIndex": i,
                                    "stepType": step_type,
                                    "stepName": step_name,
                                    "selector": selector_used,
                                    "url": step_url,
                                    "value": step_value
                                })
                                
                                step_status = StepStatus.PASSED
                                step_error = None
                                
                                try:
                                    # Execute step based on type
                                    if step_type == "navigate":
                                        url = step_data.get("url") or step.get("url") or ""
                                        if url:
                                            await session.navigate(url)
                                    elif step_type == "click":
                                        if selector_used:
                                            await session.click_element(selector_used)
                                    elif step_type == "type" or step_type == "fill":
                                        value = step_data.get("value") or step.get("value") or ""
                                        if selector_used:
                                            await session.type_into_element(selector_used, value)
                                    elif step_type == "wait":
                                        timeout = step_data.get("timeout") or step.get("timeout") or 1000
                                        import asyncio
                                        await asyncio.sleep(timeout / 1000)
                                    elif step_type == "assert":
                                        if selector_used:
                                            element_info = await session.get_element_info(selector_used)
                                            if not element_info:
                                                raise Exception(f"Assertion failed: Element not found: {selector_used}")
                                    
                                    passed_count += 1
                                    
                                except Exception as step_err:
                                    step_status = StepStatus.FAILED
                                    step_error = str(step_err)
                                    failed_count += 1
                                
                                step_end = datetime.utcnow()
                                step_duration = int((step_end - step_start).total_seconds() * 1000)
                                
                                # Create step result record
                                step_result = StepResult(
                                    id=uuid.uuid4(),
                                    execution_run_id=execution_run.id,
                                    step_id=step_id,
                                    step_name=step_name,
                                    step_type=step_type,
                                    step_order=i,
                                    status=step_status,
                                    duration_ms=step_duration,
                                    selector_used=selector_used if selector_used else None,
                                    error_message=step_error,
                                    was_healed=False
                                )
                                db.add(step_result)
                                
                                await websocket.send_json({
                                    "type": "step_completed",
                                    "stepIndex": i,
                                    "status": step_status.value,
                                    "error": step_error
                                })
                            
                            # Update execution run with final results
                            end_time = datetime.utcnow()
                            total_duration = int((end_time - start_time).total_seconds() * 1000)
                            
                            execution_run.status = ExecutionRunStatus.COMPLETED if failed_count == 0 else ExecutionRunStatus.FAILED
                            execution_run.passed_steps = passed_count
                            execution_run.failed_steps = failed_count
                            execution_run.duration_ms = total_duration
                            execution_run.ended_at = end_time
                            
                            await db.commit()
                            
                            await websocket.send_json({
                                "type": "test_execution_completed",
                                "flowId": str(flow_id),
                                "executionId": str(execution_run.id),
                                "status": execution_run.status.value,
                                "passedSteps": passed_count,
                                "failedSteps": failed_count,
                                "durationMs": total_duration
                            })
                            break
                    except Exception as e:
                        await websocket.send_json({
                            "type": "error",
                            "error": f"Test execution failed: {str(e)}"
                        })
                
                elif action == "ping":
                    await websocket.send_json({"type": "pong"})
                
            except json.JSONDecodeError:
                if data == "ping":
                    await websocket.send_text("pong")
    
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"Browser session WebSocket error: {e}")
    finally:
        # Cleanup
        await browser_session_manager.stop_session(session_id)
        if session_id in browser_session_connections:
            del browser_session_connections[session_id]

