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
import os
from pathlib import Path

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.web_automation import (
    TestFlow, ExecutionRun, StepResult, HealingEvent, LocatorAlternative,
    BrowserType, ExecutionMode, TestFlowStatus, HealingStrategy, HealingType
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
from app.services.web_automation_service import WebAutomationExecutor, SelfHealingLocator
from app.services.gemini_service import GeminiService
from app.services.self_heal_service import SelfHealService
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
    
    # Use SelfHealService for analytics
    heal_service = SelfHealService(db)
    analytics = await heal_service.get_healing_analytics(project_id)
    
    # Get recent executions (last 7 days) for issues
    week_ago = datetime.utcnow() - timedelta(days=7)
    exec_result = await db.execute(
        select(ExecutionRun)
        .where(ExecutionRun.project_id == project_id)
        .where(ExecutionRun.created_at >= week_ago)
        .order_by(desc(ExecutionRun.created_at))
    )
    recent_executions = exec_result.scalars().all()
    
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
        exec_run = next((e for e in recent_executions if e.id == step.execution_run_id), None)
        flow = next((f for f in test_flows if exec_run and f.id == exec_run.test_flow_id), None)
        
        # Check for healing events with suggestions
        healing_result = await db.execute(
            select(HealingEvent).where(HealingEvent.step_result_id == step.id)
        )
        healing_event = healing_result.scalar_one_or_none()
        
        suggestions = []
        if healing_event and healing_event.healed_value:
            suggestions.append({
                "id": str(healing_event.id),
                "value": healing_event.healed_value,
                "confidence": int((healing_event.confidence_score or 0.95) * 100),
                "type": healing_event.strategy.value.title() if healing_event.strategy else "AI Match"
            })
        
        detected_issues.append({
            "id": str(step.id),
            "type": "Locator Changed" if "not found" in (step.error_message or "").lower() else "Assertion Failed",
            "test": flow.name if flow else "Unknown Test",
            "step": step.step_name or step.step_type,
            "status": step.status.value,
            "confidence": int((healing_event.confidence_score or 0.95) * 100) if healing_event else 0,
            "old_locator": step.selector_used or "",
            "error_message": step.error_message,
            "suggestions": suggestions
        })
    
    # Get repair history
    healing_events_result = await db.execute(
        select(HealingEvent)
        .where(HealingEvent.execution_run_id.in_([e.id for e in recent_executions]) if recent_executions else False)
        .order_by(desc(HealingEvent.recorded_at))
        .limit(10)
    )
    healing_events = healing_events_result.scalars().all()
    
    repair_history = []
    for event in healing_events:
        exec_run = next((e for e in recent_executions if e.id == event.execution_run_id), None)
        flow = next((f for f in test_flows if exec_run and f.id == exec_run.test_flow_id), None)
        
        repair_history.append({
            "id": str(event.id),
            "date": event.recorded_at.isoformat(),
            "type": f"{event.healing_type.value.title()} Update",
            "test": flow.name if flow else "Unknown Test",
            "action": "Auto-Healed" if event.success else "Manual Review",
            "success": event.success
        })
    
    return {
        "health_score": analytics["success_rate"],
        "total_tests": total_tests,
        "issues_detected": len(detected_issues),
        "auto_healed_this_week": analytics["total_healed"],
        "detected_issues": detected_issues,
        "repair_history": repair_history,
        "analytics": analytics,
        "config": {
            "auto_apply_low_risk": True,
            "notify_on_issues": True,
            "visual_matching": True,
            "confidence_threshold": 90
        }
    }

@router.post("/self-heal/scan/{flow_id}")
async def scan_test_flow_health(
    flow_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Proactively scan a test flow for broken locators
    """
    heal_service = SelfHealService(db)
    risks = await heal_service.analyze_test_flow_health(flow_id)
    return {"flow_id": flow_id, "risks": risks}

@router.post("/self-heal/apply-all")
async def apply_all_pending_fixes(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Bulk apply all high-confidence pending fixes for a project
    """
    # Simply update all high confidence LocatorAlternatives
    heal_service = SelfHealService(db)
    # This logic would be implemented in heal_service to find all pending high-conf fixes
    # For now, return a placeholder success message
    return {"success": True, "message": "Applying all high-confidence fixes..."}


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
                    project_id = message.get("projectId")
                    
                    # Video recording settings
                    record_video = message.get("recordVideo", False)
                    video_dir = None
                    if record_video and project_id:
                        video_dir = f"./artifacts/{project_id}/videos"
                    
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
                            headless=headless,
                            record_video=record_video,
                            video_dir=video_dir,
                            project_id=project_id
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
                            
                            # Generate human-friendly execution ID (EXE-XXXXX)
                            import random
                            exec_human_id = f"EXE-{random.randint(10000, 99999)}"
                            
                            execution_run = ExecutionRun(
                                id=uuid.uuid4(),
                                test_flow_id=test_flow.id,
                                project_id=test_flow.project_id,
                                human_id=exec_human_id,
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
                            
                            # Extract execution settings from message
                            exec_settings = message.get("executionSettings", {})
                            healing_enabled = exec_settings.get("aiSelfHeal", True)
                            screenshot_on_failure = exec_settings.get("screenshotOnFailure", True)
                            screenshot_each_step = exec_settings.get("screenshotEachStep", False)
                            video_recording = exec_settings.get("videoRecording", True)
                            
                            # Track results
                            passed_count = 0
                            failed_count = 0
                            skipped_count = 0
                            healed_count = 0
                            stop_on_failure = True  # Stop executing after first failure
                            has_failure = False
                            execution_variables = {}  # Store extracted data during execution
                            start_time = datetime.utcnow()
                            
                            # Execute each step
                            for i, step in enumerate(steps):
                                step_start = datetime.utcnow()
                                
                                # Track actual values captured during execution
                                actual_title = None
                                actual_url = None
                                
                                # Skip remaining steps if a previous step failed
                                if has_failure and stop_on_failure:
                                    step_data = step.get("data", step)
                                    step_type = step_data.get("action") or step_data.get("type") or step.get("action") or step.get("type") or "unknown"
                                    step_id = step.get("id", str(uuid.uuid4()))
                                    step_name = step_data.get("description") or step.get("description") or step_data.get("name") or step.get("name") or f"Step {i + 1}"
                                    
                                    # Record as skipped
                                    step_result = StepResult(
                                        id=uuid.uuid4(),
                                        execution_run_id=execution_run.id,
                                        step_id=step_id,
                                        step_name=step_name,
                                        step_type=step_type,
                                        step_order=i,
                                        status=StepStatus.SKIPPED,
                                        duration_ms=0,
                                        error_message="Skipped due to previous step failure",
                                        was_healed=False
                                    )
                                    db.add(step_result)
                                    skipped_count += 1
                                    
                                    await websocket.send_json({
                                        "type": "step_completed",
                                        "stepIndex": i,
                                        "status": "skipped",
                                        "error": "Skipped due to previous step failure"
                                    })
                                    continue
                                
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
                                was_healed = False
                                healing_info = None
                                
                                # Get alternatives for self-healing
                                alternatives = step_data.get("alternatives") or step.get("alternatives") or []
                                
                                # Initialize AI service for healing if enabled
                                ai_service = GeminiService() if healing_enabled else None
                                
                                try:
                                    # Execute step based on type
                                    if step_type == "navigate":
                                        url = step_data.get("url") or step.get("url") or ""
                                        if url:
                                            await session.navigate(url)
                                    
                                    elif step_type == "click":
                                        if selector_used:
                                            try:
                                                await session.click_element(selector_used)
                                            except Exception as click_err:
                                                # Try self-healing if enabled
                                                if healing_enabled and ai_service:
                                                    healer = SelfHealingLocator(selector_used, alternatives, ai_service)
                                                    try:
                                                        locator, healing_info = await healer.find_element(session.page, step_id, step_type)
                                                        if locator and healing_info:
                                                            await locator.click()
                                                            was_healed = True
                                                            selector_used = healing_info.get("healed", selector_used)
                                                        else:
                                                            raise click_err
                                                    except Exception:
                                                        raise click_err
                                                else:
                                                    raise click_err
                                    
                                    elif step_type == "type" or step_type == "fill":
                                        value = step_data.get("value") or step.get("value") or ""
                                        if selector_used:
                                            try:
                                                await session.type_into_element(selector_used, value)
                                            except Exception as type_err:
                                                # Try self-healing if enabled
                                                if healing_enabled and ai_service:
                                                    healer = SelfHealingLocator(selector_used, alternatives, ai_service)
                                                    try:
                                                        locator, healing_info = await healer.find_element(session.page, step_id, step_type)
                                                        if locator and healing_info:
                                                            await locator.fill(value)
                                                            was_healed = True
                                                            selector_used = healing_info.get("healed", selector_used)
                                                        else:
                                                            raise type_err
                                                    except Exception:
                                                        raise type_err
                                                else:
                                                    raise type_err
                                    elif step_type == "wait":
                                        timeout = step_data.get("timeout") or step.get("timeout") or 1000
                                        import asyncio
                                        await asyncio.sleep(timeout / 1000)
                                    elif step_type == "assert":
                                        if selector_used:
                                            element_info = await session.get_element_info(selector_used)
                                            if not element_info:
                                                raise Exception(f"Assertion failed: Element not found: {selector_used}")
                                    
                                    # Assert Title - compare expected vs actual page title
                                    elif step_type == "assert_title":
                                        expected_title = (
                                            step_data.get("expected_title") or 
                                            step_data.get("value") or 
                                            step.get("expected_title") or 
                                            step.get("value") or 
                                            ""
                                        )
                                        comparison = step_data.get("comparison") or step.get("comparison") or "equals"
                                        
                                        # Get actual page title from Playwright
                                        actual_title = await session.page.title()
                                        
                                        passed = False
                                        if comparison == "equals":
                                            passed = actual_title == expected_title
                                        elif comparison == "contains":
                                            passed = expected_title in actual_title
                                        elif comparison == "starts_with":
                                            passed = actual_title.startswith(expected_title)
                                        elif comparison == "ends_with":
                                            passed = actual_title.endswith(expected_title)
                                        elif comparison == "regex":
                                            import re
                                            passed = bool(re.search(expected_title, actual_title))
                                        
                                        if not passed:
                                            # Try assertion healing if enabled
                                            if healing_enabled and ai_service:
                                                try:
                                                    # Ask AI to analyze if actual title is a valid update
                                                    heal_prompt = f"""Analyze this page title assertion failure:

Expected Title: "{expected_title}"
Actual Title: "{actual_title}"
Page URL: {session.page.url}
Comparison Type: {comparison}

Determine if the actual title is a VALID page title that represents the same or similar page content.

Rules for accepting:
- Minor text changes (e.g., "Login" vs "Sign In") are acceptable
- Same semantic meaning is acceptable
- Completely unrelated titles should NOT be accepted (e.g., "Login" vs "Error 404")

Respond with JSON only:
{{"accept": true/false, "confidence": 0.0-1.0, "reasoning": "brief explanation"}}"""
                                                    
                                                    ai_response = await ai_service.generate_content(heal_prompt)
                                                    heal_result = json.loads(ai_response.strip().replace("```json", "").replace("```", ""))
                                                    
                                                    if heal_result.get("accept") and heal_result.get("confidence", 0) >= 0.7:
                                                        # Accept the actual title - mark as healed
                                                        was_healed = True
                                                        healing_info = {
                                                            "type": HealingType.ASSERTION.value,
                                                            "strategy": HealingStrategy.AI.value,
                                                            "original": expected_title,
                                                            "healed": actual_title,
                                                            "ai_reasoning": heal_result.get("reasoning", ""),
                                                            "confidence_score": heal_result.get("confidence", 0.8)
                                                        }
                                                        passed = True  # Consider it passed after healing
                                                except Exception as heal_err:
                                                    print(f"Title assertion healing failed: {heal_err}")
                                        
                                        if not passed:
                                            raise Exception(f"Title assertion failed: expected '{expected_title}' ({comparison}), got '{actual_title}'")
                                        
                                        # Store actual title for action_details
                                    
                                    # Assert URL - compare expected vs actual page URL
                                    elif step_type == "assert_url":
                                        expected_url = (
                                            step_data.get("expected_url") or 
                                            step_data.get("value") or 
                                            step.get("expected_url") or 
                                            step.get("value") or 
                                            ""
                                        )
                                        comparison = step_data.get("comparison") or step.get("comparison") or "equals"
                                        
                                        # Get actual page URL from Playwright
                                        actual_url = session.page.url
                                        
                                        passed = False
                                        if comparison == "equals":
                                            passed = actual_url == expected_url
                                        elif comparison == "contains":
                                            passed = expected_url in actual_url
                                        elif comparison == "starts_with":
                                            passed = actual_url.startswith(expected_url)
                                        elif comparison == "regex":
                                            import re
                                            passed = bool(re.search(expected_url, actual_url))
                                        
                                        if not passed:
                                            # Try assertion healing if enabled
                                            if healing_enabled and ai_service:
                                                try:
                                                    # Ask AI to analyze if actual URL is a valid update
                                                    heal_prompt = f"""Analyze this page URL assertion failure:

Expected URL: "{expected_url}"
Actual URL: "{actual_url}"
Comparison Type: {comparison}

Determine if the actual URL represents the SAME or equivalent page as the expected URL.

Rules for accepting:
- Query parameter differences are acceptable if core path is same
- Trailing slashes differences are acceptable
- Same domain with minor path variations may be acceptable
- Completely different domains should NOT be accepted
- Error pages (404, 500, etc.) should NOT be accepted

Respond with JSON only:
{{"accept": true/false, "confidence": 0.0-1.0, "reasoning": "brief explanation"}}"""
                                                    
                                                    ai_response = await ai_service.generate_content(heal_prompt)
                                                    heal_result = json.loads(ai_response.strip().replace("```json", "").replace("```", ""))
                                                    
                                                    if heal_result.get("accept") and heal_result.get("confidence", 0) >= 0.7:
                                                        # Accept the actual URL - mark as healed
                                                        was_healed = True
                                                        healing_info = {
                                                            "type": HealingType.ASSERTION.value,
                                                            "strategy": HealingStrategy.AI.value,
                                                            "original": expected_url,
                                                            "healed": actual_url,
                                                            "ai_reasoning": heal_result.get("reasoning", ""),
                                                            "confidence_score": heal_result.get("confidence", 0.8)
                                                        }
                                                        passed = True  # Consider it passed after healing
                                                except Exception as heal_err:
                                                    print(f"URL assertion healing failed: {heal_err}")
                                        
                                        if not passed:
                                            raise Exception(f"URL assertion failed: expected '{expected_url}' ({comparison}), got '{actual_url}'")
                                        
                                        # Store actual URL for action_details
                                    
                                    # Additional browser actions
                                    elif step_type == "double_click":
                                        if selector_used:
                                            await session.double_click(selector_used)
                                    
                                    elif step_type == "right_click":
                                        if selector_used:
                                            await session.right_click(selector_used)
                                    
                                    elif step_type == "hover":
                                        if selector_used:
                                            await session.hover(selector_used)
                                    
                                    elif step_type == "focus":
                                        if selector_used:
                                            await session.focus(selector_used)
                                    
                                    elif step_type == "clear":
                                        if selector_used:
                                            await session.clear_input(selector_used)
                                    
                                    elif step_type == "select":
                                        value = step_data.get("value") or step.get("value") or ""
                                        if selector_used:
                                            await session.select_option(selector_used, value)
                                    
                                    elif step_type == "check":
                                        if selector_used:
                                            await session.check(selector_used)
                                    
                                    elif step_type == "uncheck":
                                        if selector_used:
                                            await session.uncheck(selector_used)
                                    
                                    elif step_type == "go_back":
                                        await session.go_back()
                                    
                                    elif step_type == "go_forward":
                                        await session.go_forward()
                                    
                                    elif step_type == "reload":
                                        await session.reload()
                                    
                                    elif step_type == "scroll":
                                        direction = step_data.get("direction") or step.get("direction") or "down"
                                        amount = step_data.get("amount") or step.get("amount") or 300
                                        await session.scroll_page(direction, amount)
                                    
                                    elif step_type == "press":
                                        key = step_data.get("key") or step.get("key") or step_data.get("value") or step.get("value") or ""
                                        if key:
                                            await session.press_key(key)
                                    
                                    # ============================================
                                    # File and Drag/Drop Actions
                                    # ============================================
                                    elif step_type == "upload":
                                        file_path = step_data.get("file_path") or step.get("file_path") or step_data.get("value") or step.get("value") or ""
                                        if selector_used and file_path:
                                            await session.upload_file(selector_used, file_path)
                                    
                                    elif step_type == "drag_drop":
                                        target_selector = step_data.get("target_selector") or step.get("target_selector") or step_data.get("target") or step.get("target") or ""
                                        if selector_used and target_selector:
                                            await session.drag_and_drop(selector_used, target_selector)
                                    
                                    # ============================================
                                    # Wait Actions
                                    # ============================================
                                    elif step_type == "wait_network":
                                        timeout = step_data.get("timeout") or step.get("timeout") or 30000
                                        await session.wait_for_network_idle(timeout)
                                    
                                    elif step_type == "wait_url":
                                        url_pattern = step_data.get("url_pattern") or step.get("url_pattern") or step_data.get("value") or step.get("value") or ""
                                        timeout = step_data.get("timeout") or step.get("timeout") or 30000
                                        if url_pattern:
                                            await session.wait_for_url(url_pattern, timeout)
                                    
                                    # ============================================
                                    # Dialog Handling
                                    # ============================================
                                    elif step_type == "accept_dialog":
                                        prompt_text = step_data.get("prompt_text") or step.get("prompt_text") or step_data.get("value") or step.get("value")
                                        await session.accept_dialog(prompt_text)
                                    
                                    elif step_type == "dismiss_dialog":
                                        await session.dismiss_dialog()
                                    
                                    # ============================================
                                    # Tab/Window Management
                                    # ============================================
                                    elif step_type == "new_tab":
                                        url = step_data.get("url") or step.get("url") or "about:blank"
                                        await session.new_tab(url)
                                    
                                    elif step_type == "switch_tab":
                                        index = int(step_data.get("index") or step.get("index") or step_data.get("value") or step.get("value") or 0)
                                        await session.switch_tab(index)
                                    
                                    elif step_type == "close_tab":
                                        index = step_data.get("index") or step.get("index")
                                        await session.close_tab(int(index) if index else None)
                                    
                                    # ============================================
                                    # Frame Handling
                                    # ============================================
                                    elif step_type == "switch_to_frame":
                                        if selector_used:
                                            await session.switch_to_frame(selector_used)
                                    
                                    elif step_type == "switch_to_main":
                                        await session.switch_to_main_frame()
                                    
                                    # ============================================
                                    # Cookie Management
                                    # ============================================
                                    elif step_type == "get_cookie":
                                        cookie_name = step_data.get("cookie_name") or step.get("cookie_name") or step_data.get("value") or step.get("value") or ""
                                        if cookie_name:
                                            result = await session.get_cookie(cookie_name)
                                            # Store in variables if variable_name provided
                                            variable_name = step_data.get("variable_name") or step.get("variable_name")
                                            if variable_name and result.get("value"):
                                                execution_variables[variable_name] = result.get("value")
                                    
                                    elif step_type == "set_cookie":
                                        cookie_name = step_data.get("cookie_name") or step.get("cookie_name") or ""
                                        cookie_value = step_data.get("cookie_value") or step.get("cookie_value") or step_data.get("value") or step.get("value") or ""
                                        domain = step_data.get("domain") or step.get("domain")
                                        if cookie_name:
                                            await session.set_cookie(cookie_name, cookie_value, domain)
                                    
                                    elif step_type == "delete_cookie":
                                        cookie_name = step_data.get("cookie_name") or step.get("cookie_name") or step_data.get("value") or step.get("value") or ""
                                        if cookie_name:
                                            await session.delete_cookie(cookie_name)
                                    
                                    elif step_type == "clear_cookies":
                                        await session.clear_cookies()
                                    
                                    # ============================================
                                    # Local Storage
                                    # ============================================
                                    elif step_type == "get_local_storage":
                                        storage_key = step_data.get("key") or step.get("key") or step_data.get("value") or step.get("value") or ""
                                        if storage_key:
                                            result = await session.get_local_storage(storage_key)
                                            variable_name = step_data.get("variable_name") or step.get("variable_name")
                                            if variable_name and result.get("value"):
                                                execution_variables[variable_name] = result.get("value")
                                    
                                    elif step_type == "set_local_storage":
                                        storage_key = step_data.get("key") or step.get("key") or ""
                                        storage_value = step_data.get("value") or step.get("value") or ""
                                        if storage_key:
                                            await session.set_local_storage(storage_key, storage_value)
                                    
                                    elif step_type == "clear_local_storage":
                                        await session.clear_local_storage()
                                    
                                    # ============================================
                                    # Session Storage
                                    # ============================================
                                    elif step_type == "get_session_storage":
                                        storage_key = step_data.get("key") or step.get("key") or step_data.get("value") or step.get("value") or ""
                                        if storage_key:
                                            result = await session.get_session_storage(storage_key)
                                            variable_name = step_data.get("variable_name") or step.get("variable_name")
                                            if variable_name and result.get("value"):
                                                execution_variables[variable_name] = result.get("value")
                                    
                                    elif step_type == "set_session_storage":
                                        storage_key = step_data.get("key") or step.get("key") or ""
                                        storage_value = step_data.get("value") or step.get("value") or ""
                                        if storage_key:
                                            await session.set_session_storage(storage_key, storage_value)
                                    
                                    elif step_type == "clear_session_storage":
                                        await session.clear_session_storage()
                                    
                                    # ============================================
                                    # Data Extraction
                                    # ============================================
                                    elif step_type == "extract_text":
                                        if selector_used:
                                            result = await session.extract_text(selector_used)
                                            variable_name = step_data.get("variable_name") or step.get("variable_name")
                                            if variable_name and result.get("text"):
                                                execution_variables[variable_name] = result.get("text")
                                    
                                    elif step_type == "extract_attribute":
                                        attribute = step_data.get("attribute") or step.get("attribute") or step_data.get("value") or step.get("value") or ""
                                        if selector_used and attribute:
                                            result = await session.extract_attribute(selector_used, attribute)
                                            variable_name = step_data.get("variable_name") or step.get("variable_name")
                                            if variable_name and result.get("value"):
                                                execution_variables[variable_name] = result.get("value")
                                    
                                    elif step_type == "set_variable":
                                        variable_name = step_data.get("variable_name") or step.get("variable_name") or ""
                                        variable_value = step_data.get("value") or step.get("value") or ""
                                        if variable_name:
                                            execution_variables[variable_name] = variable_value
                                    
                                    elif step_type == "get_element_count":
                                        if selector_used:
                                            result = await session.get_element_count(selector_used)
                                            variable_name = step_data.get("variable_name") or step.get("variable_name")
                                            if variable_name:
                                                execution_variables[variable_name] = result.get("count", 0)
                                    
                                    # ============================================
                                    # JavaScript Execution
                                    # ============================================
                                    elif step_type == "execute_script":
                                        script = step_data.get("script") or step.get("script") or step_data.get("value") or step.get("value") or ""
                                        if script:
                                            result = await session.execute_script(script)
                                            variable_name = step_data.get("variable_name") or step.get("variable_name")
                                            if variable_name and result.get("result") is not None:
                                                execution_variables[variable_name] = result.get("result")
                                    
                                    # ============================================
                                    # Viewport and Device
                                    # ============================================
                                    elif step_type == "set_viewport":
                                        width = int(step_data.get("width") or step.get("width") or 1280)
                                        height = int(step_data.get("height") or step.get("height") or 720)
                                        await session.set_viewport(width, height)
                                    
                                    elif step_type == "set_geolocation":
                                        latitude = float(step_data.get("latitude") or step.get("latitude") or 0)
                                        longitude = float(step_data.get("longitude") or step.get("longitude") or 0)
                                        accuracy = float(step_data.get("accuracy") or step.get("accuracy") or 100)
                                        await session.set_geolocation(latitude, longitude, accuracy)
                                    
                                    # ============================================
                                    # Screenshot
                                    # ============================================
                                    elif step_type == "screenshot":
                                        # Take manual screenshot (separate from auto-capture)
                                        screenshot_name = step_data.get("name") or step.get("name") or f"manual_{i}"
                                        full_page = step_data.get("full_page") or step.get("full_page") or False
                                        await session.take_screenshot(full_page=full_page)
                                    
                                    # ============================================
                                    # Additional Assertions
                                    # ============================================
                                    elif step_type == "assert_element_count":
                                        expected_count = int(step_data.get("expected_count") or step.get("expected_count") or step_data.get("value") or step.get("value") or 0)
                                        comparison = step_data.get("comparison") or step.get("comparison") or "equals"
                                        if selector_used:
                                            result = await session.get_element_count(selector_used)
                                            actual_count = result.get("count", 0)
                                            passed = False
                                            if comparison == "equals":
                                                passed = actual_count == expected_count
                                            elif comparison == "greater_than":
                                                passed = actual_count > expected_count
                                            elif comparison == "less_than":
                                                passed = actual_count < expected_count
                                            elif comparison == "at_least":
                                                passed = actual_count >= expected_count
                                            if not passed:
                                                raise Exception(f"Element count assertion failed: expected {expected_count} ({comparison}), got {actual_count}")
                                    
                                    elif step_type == "assert_not_visible":
                                        if selector_used:
                                            result = await session.get_element_info(selector_used)
                                            if result.get("visible"):
                                                raise Exception(f"Assert not visible failed: element {selector_used} is visible")
                                    
                                    elif step_type == "soft_assert":
                                        # Soft assert - log failure but don't throw
                                        try:
                                            if selector_used:
                                                result = await session.get_element_info(selector_used)
                                                if not result.get("visible"):
                                                    print(f"Soft assertion warning: element not visible {selector_used}")
                                        except Exception as soft_err:
                                            print(f"Soft assertion warning: {soft_err}")
                                    
                                    # ============================================
                                    # Clipboard
                                    # ============================================
                                    elif step_type == "copy_to_clipboard":
                                        text = step_data.get("text") or step.get("text") or step_data.get("value") or step.get("value") or ""
                                        if text:
                                            await session.copy_to_clipboard(text)
                                    
                                    elif step_type == "paste_from_clipboard":
                                        result = await session.paste_from_clipboard()
                                        variable_name = step_data.get("variable_name") or step.get("variable_name")
                                        if variable_name and result.get("text"):
                                            execution_variables[variable_name] = result.get("text")
                                    
                                    # ============================================
                                    # Performance
                                    # ============================================
                                    elif step_type == "measure_load_time":
                                        result = await session.measure_load_time()
                                        variable_name = step_data.get("variable_name") or step.get("variable_name")
                                        if variable_name and result.get("timing"):
                                            execution_variables[variable_name] = result.get("timing")
                                    
                                    elif step_type == "get_performance_metrics":
                                        result = await session.get_performance_metrics()
                                        variable_name = step_data.get("variable_name") or step.get("variable_name")
                                        if variable_name and result.get("metrics"):
                                            execution_variables[variable_name] = result.get("metrics")
                                    
                                    # ============================================
                                    # Element highlighting
                                    # ============================================
                                    elif step_type == "highlight_element":
                                        duration_ms = int(step_data.get("duration_ms") or step.get("duration_ms") or 2000)
                                        if selector_used:
                                            await session.highlight_element(selector_used, duration_ms)
                                    
                                    # ============================================
                                    # Debugging
                                    # ============================================
                                    elif step_type == "log":
                                        message = step_data.get("message") or step.get("message") or step_data.get("value") or step.get("value") or ""
                                        # Substitute variables in message using execution_variables
                                        import re
                                        def substitute_vars(text, variables):
                                            if not text or not variables:
                                                return text
                                            def get_nested_value(var_path, vars_dict):
                                                parts = var_path.split('.')
                                                root = parts[0]
                                                if root not in vars_dict:
                                                    return None
                                                value = vars_dict[root]
                                                for part in parts[1:]:
                                                    if isinstance(value, dict) and part in value:
                                                        value = value[part]
                                                    else:
                                                        return None
                                                if isinstance(value, dict):
                                                    import json
                                                    return json.dumps(value)
                                                return str(value) if value is not None else None
                                            def replace_match(m):
                                                result = get_nested_value(m.group(1), variables)
                                                return result if result is not None else m.group(0)
                                            return re.sub(r'\$\{([a-zA-Z_][a-zA-Z0-9_.]*)\}', replace_match, text)
                                        
                                        substituted_message = substitute_vars(message, execution_variables)
                                        print(f"[LOG] {substituted_message}")
                                        
                                        # Also send to websocket for frontend console
                                        await websocket.send_json({
                                            "type": "log_message",
                                            "level": step_data.get("level") or step.get("level") or "info",
                                            "message": substituted_message,
                                            "stepIndex": i
                                        })
                                    
                                    elif step_type == "make_api_call":
                                        import aiohttp
                                        import base64
                                        from urllib.parse import urlencode
                                        
                                        # Helper to substitute variables
                                        def sub_var(text):
                                            if not text or not isinstance(text, str):
                                                return text
                                            import re
                                            def get_val(path):
                                                parts = path.split('.')
                                                root = parts[0]
                                                if root not in execution_variables:
                                                    return None
                                                val = execution_variables[root]
                                                for p in parts[1:]:
                                                    if isinstance(val, dict) and p in val:
                                                        val = val[p]
                                                    else:
                                                        return None
                                                return str(val) if val is not None else None
                                            def repl(m):
                                                r = get_val(m.group(1))
                                                return r if r is not None else m.group(0)
                                            return re.sub(r'\$\{([a-zA-Z_][a-zA-Z0-9_.]*)\}', repl, text)
                                        
                                        url = sub_var(step_data.get("url") or step.get("url") or "")
                                        method = (step_data.get("method") or step.get("method") or "GET").upper()
                                        variable_name = step_data.get("variable_name") or step.get("variable_name")
                                        timeout_ms = step_data.get("timeout") or step.get("timeout") or 30000
                                        timeout = aiohttp.ClientTimeout(total=timeout_ms / 1000)
                                        
                                        # Build headers
                                        request_headers = {}
                                        headers_data = step_data.get("headers") or step.get("headers") or {}
                                        if isinstance(headers_data, list):
                                            for h in headers_data:
                                                if h.get("enabled", True) and h.get("key"):
                                                    request_headers[h["key"]] = sub_var(h.get("value", ""))
                                        elif isinstance(headers_data, dict):
                                            request_headers = {k: sub_var(v) for k, v in headers_data.items()}
                                        
                                        # Handle query params
                                        query_params = step_data.get("query_params") or step.get("query_params") or []
                                        if query_params:
                                            params = {}
                                            for p in query_params:
                                                if p.get("enabled", True) and p.get("key"):
                                                    params[p["key"]] = sub_var(p.get("value", ""))
                                            if params:
                                                sep = "&" if "?" in url else "?"
                                                url = url + sep + urlencode(params)
                                        
                                        # Handle auth
                                        auth_type = step_data.get("auth_type") or step.get("auth_type") or "none"
                                        if auth_type == "basic":
                                            username = sub_var(step_data.get("auth_basic_username") or step.get("auth_basic_username") or "")
                                            password = sub_var(step_data.get("auth_basic_password") or step.get("auth_basic_password") or "")
                                            creds = base64.b64encode(f"{username}:{password}".encode()).decode()
                                            request_headers["Authorization"] = f"Basic {creds}"
                                        elif auth_type == "bearer":
                                            token = sub_var(step_data.get("auth_bearer_token") or step.get("auth_bearer_token") or "")
                                            request_headers["Authorization"] = f"Bearer {token}"
                                        elif auth_type == "api-key":
                                            key_name = sub_var(step_data.get("auth_api_key_key") or step.get("auth_api_key_key") or "")
                                            key_val = sub_var(step_data.get("auth_api_key_value") or step.get("auth_api_key_value") or "")
                                            add_to = step_data.get("auth_api_key_add_to") or step.get("auth_api_key_add_to") or "header"
                                            if add_to == "header":
                                                request_headers[key_name] = key_val
                                            else:
                                                sep = "&" if "?" in url else "?"
                                                url = url + sep + urlencode({key_name: key_val})
                                        
                                        # Handle body
                                        body_type = step_data.get("body_type") or step.get("body_type") or "none"
                                        request_body = None
                                        json_body = None
                                        
                                        if body_type == "raw":
                                            raw_body = sub_var(step_data.get("body") or step.get("body") or "")
                                            raw_type = step_data.get("body_raw_type") or step.get("body_raw_type") or "json"
                                            if raw_type == "json":
                                                request_headers.setdefault("Content-Type", "application/json")
                                                try:
                                                    json_body = json.loads(raw_body)
                                                except:
                                                    request_body = raw_body
                                            else:
                                                request_body = raw_body
                                        elif body_type == "x-www-form-urlencoded":
                                            request_headers.setdefault("Content-Type", "application/x-www-form-urlencoded")
                                            form_params = {}
                                            for item in (step_data.get("body_urlencoded") or step.get("body_urlencoded") or []):
                                                if item.get("enabled", True) and item.get("key"):
                                                    form_params[item["key"]] = sub_var(item.get("value", ""))
                                            request_body = urlencode(form_params)
                                        elif body_type == "graphql":
                                            request_headers.setdefault("Content-Type", "application/json")
                                            query = sub_var(step_data.get("body_graphql_query") or step.get("body_graphql_query") or "")
                                            vars_str = sub_var(step_data.get("body_graphql_variables") or step.get("body_graphql_variables") or "{}")
                                            try:
                                                variables_json = json.loads(vars_str) if vars_str else {}
                                            except:
                                                variables_json = {}
                                            json_body = {"query": query, "variables": variables_json}
                                        
                                        # Make request
                                        async with aiohttp.ClientSession(timeout=timeout) as api_session:
                                            kwargs = {"headers": request_headers}
                                            if json_body is not None:
                                                kwargs["json"] = json_body
                                            elif request_body is not None:
                                                kwargs["data"] = request_body
                                            
                                            if method == "GET":
                                                async with api_session.get(url, **kwargs) as resp:
                                                    response_text = await resp.text()
                                                    status_code = resp.status
                                                    resp_headers = dict(resp.headers)
                                            elif method == "POST":
                                                async with api_session.post(url, **kwargs) as resp:
                                                    response_text = await resp.text()
                                                    status_code = resp.status
                                                    resp_headers = dict(resp.headers)
                                            elif method == "PUT":
                                                async with api_session.put(url, **kwargs) as resp:
                                                    response_text = await resp.text()
                                                    status_code = resp.status
                                                    resp_headers = dict(resp.headers)
                                            elif method == "PATCH":
                                                async with api_session.patch(url, **kwargs) as resp:
                                                    response_text = await resp.text()
                                                    status_code = resp.status
                                                    resp_headers = dict(resp.headers)
                                            elif method == "DELETE":
                                                async with api_session.delete(url, **kwargs) as resp:
                                                    response_text = await resp.text()
                                                    status_code = resp.status
                                                    resp_headers = dict(resp.headers)
                                            else:
                                                raise Exception(f"Unsupported HTTP method: {method}")
                                        
                                        # Store response
                                        if variable_name:
                                            try:
                                                parsed_body = json.loads(response_text)
                                            except:
                                                parsed_body = response_text
                                            execution_variables[variable_name] = {
                                                "body": parsed_body,
                                                "status": status_code,
                                                "headers": resp_headers
                                            }
                                            print(f"[API] Stored response in {variable_name} - status: {status_code}")
                                        
                                        # Send result to frontend
                                        await websocket.send_json({
                                            "type": "api_response",
                                            "stepIndex": i,
                                            "status": status_code,
                                            "variableName": variable_name
                                        })
                                    
                                    elif step_type == "comment":
                                        # No-op, just a comment step
                                        pass
                                    
                                    # ============================================
                                    # Snippet Execution (Reusable Step Groups)
                                    # ============================================
                                    elif step_type == "call_snippet":
                                        from app.models.snippet import TestSnippet
                                        from app.api.v1.snippets import substitute_parameters
                                        
                                        snippet_id = step_data.get("snippet_id") or step.get("snippet_id")
                                        snippet_params = step_data.get("parameters") or step.get("parameters") or {}
                                        
                                        if snippet_id:
                                            # Circular reference detection
                                            # Use a stack to track current snippet execution chain
                                            snippet_call_stack = getattr(session, '_snippet_call_stack', set())
                                            if snippet_id in snippet_call_stack:
                                                raise Exception(f"Circular snippet reference detected: snippet {snippet_id} is already in the call stack")
                                            
                                            # Add current snippet to call stack
                                            snippet_call_stack.add(snippet_id)
                                            setattr(session, '_snippet_call_stack', snippet_call_stack)
                                            
                                            try:
                                                # Fetch snippet from database
                                                snippet_result = await db.execute(
                                                    select(TestSnippet).where(TestSnippet.id == snippet_id)
                                                )
                                                snippet = snippet_result.scalar_one_or_none()
                                                
                                                if not snippet:
                                                    raise Exception(f"Snippet not found: {snippet_id}")
                                                
                                                # Send snippet info to frontend
                                                await websocket.send_json({
                                                    "type": "snippet_started",
                                                    "stepIndex": i,
                                                    "snippetId": str(snippet_id),
                                                    "snippetName": snippet.name,
                                                    "totalSubSteps": len(snippet.steps or [])
                                                })
                                            
                                                # Debug: Log snippet params received
                                                print(f"[SNIPPET DEBUG] snippet_params received: {snippet_params}")
                                                print(f"[SNIPPET DEBUG] snippet.parameters definitions: {snippet.parameters}")
                                                
                                                # Merge default parameter values with provided values
                                                merged_params = {}
                                                for param_def in (snippet.parameters or []):
                                                    param_name = param_def.get("name")
                                                    merged_params[param_name] = snippet_params.get(
                                                        param_name, 
                                                        param_def.get("default", "")
                                                    )
                                                
                                                # Include execution variables in parameter substitution
                                                merged_params.update({f"var_{k}": v for k, v in execution_variables.items()})
                                                
                                                print(f"[SNIPPET DEBUG] merged_params for substitution: {merged_params}")
                                                
                                                # Substitute parameters in snippet steps
                                                expanded_steps = substitute_parameters(snippet.steps or [], merged_params)
                                                
                                                print(f"[SNIPPET DEBUG] First expanded step: {expanded_steps[0] if expanded_steps else 'empty'}")
                                                
                                                # Execute each expanded step (recursive-like execution)
                                                for sub_idx, sub_step in enumerate(expanded_steps):
                                                    sub_step_type = sub_step.get("action") or sub_step.get("type") or "unknown"
                                                    sub_selector = sub_step.get("selector", "")
                                                    sub_value = sub_step.get("value", "")
                                                    sub_url = sub_step.get("url", "")
                                                    sub_timeout = sub_step.get("timeout") or sub_step.get("amount") or ""
                                                    sub_expected_url = sub_step.get("expected_url", "")
                                                    sub_expected_title = sub_step.get("expected_title", "")
                                                    sub_comparison = sub_step.get("comparison", "")
                                                    
                                                    # Notify frontend about sub-step starting
                                                    await websocket.send_json({
                                                        "type": "snippet_substep_started",
                                                        "stepIndex": i,
                                                        "subStepIndex": sub_idx,
                                                        "subStepType": sub_step_type,
                                                        "subStepName": sub_step_type.replace('_', ' ').title(),
                                                        "selector": sub_selector,
                                                        "value": sub_value,
                                                        "url": sub_url,
                                                        "timeout": sub_timeout,
                                                        "expectedUrl": sub_expected_url,
                                                        "expectedTitle": sub_expected_title,
                                                        "comparison": sub_comparison
                                                    })
                                                    
                                                    try:
                                                        # Execute based on step type - comprehensive support
                                                        if sub_step_type == "navigate":
                                                            url = sub_step.get("url") or sub_value
                                                            if url:
                                                                await session.navigate(url)
                                                        elif sub_step_type == "click":
                                                            if sub_selector:
                                                                await session.click_element(sub_selector)
                                                        elif sub_step_type in ("type", "fill"):
                                                            if sub_selector:
                                                                await session.type_into_element(sub_selector, sub_value)
                                                        elif sub_step_type == "wait":
                                                            timeout = sub_step.get("timeout") or 1000
                                                            import asyncio
                                                            await asyncio.sleep(timeout / 1000)
                                                        elif sub_step_type == "assert":
                                                            if sub_selector:
                                                                el_info = await session.get_element_info(sub_selector)
                                                                if not el_info:
                                                                    raise Exception(f"Snippet assertion failed: {sub_selector}")
                                                        
                                                        # Assert URL - check current page URL
                                                        elif sub_step_type == "assert_url":
                                                            expected_url = sub_step.get("expected_url") or sub_step.get("value") or sub_value or ""
                                                            comparison = sub_step.get("comparison") or "contains"
                                                            actual_url = session.page.url
                                                            passed = False
                                                            if comparison == "equals":
                                                                passed = actual_url == expected_url
                                                            elif comparison == "contains":
                                                                passed = expected_url in actual_url
                                                            elif comparison == "starts_with":
                                                                passed = actual_url.startswith(expected_url)
                                                            elif comparison == "regex":
                                                                import re
                                                                passed = bool(re.search(expected_url, actual_url))
                                                            if not passed:
                                                                raise Exception(f"Snippet URL assertion failed: expected '{expected_url}' ({comparison}), got '{actual_url}'")
                                                        
                                                        # Assert Title
                                                        elif sub_step_type == "assert_title":
                                                            expected_title = sub_step.get("expected_title") or sub_step.get("value") or sub_value or ""
                                                            comparison = sub_step.get("comparison") or "equals"
                                                            actual_title = await session.page.title()
                                                            passed = False
                                                            if comparison == "equals":
                                                                passed = actual_title == expected_title
                                                            elif comparison == "contains":
                                                                passed = expected_title in actual_title
                                                            elif comparison == "starts_with":
                                                                passed = actual_title.startswith(expected_title)
                                                            if not passed:
                                                                raise Exception(f"Snippet title assertion failed: expected '{expected_title}' ({comparison}), got '{actual_title}'")
                                                        
                                                        # Additional click actions
                                                        elif sub_step_type == "double_click":
                                                            if sub_selector:
                                                                await session.double_click(sub_selector)
                                                        elif sub_step_type == "right_click":
                                                            if sub_selector:
                                                                await session.right_click(sub_selector)
                                                        elif sub_step_type == "hover":
                                                            if sub_selector:
                                                                await session.hover(sub_selector)
                                                        
                                                        # Form actions
                                                        elif sub_step_type == "clear":
                                                            if sub_selector:
                                                                await session.clear_input(sub_selector)
                                                        elif sub_step_type == "select":
                                                            if sub_selector:
                                                                await session.select_option(sub_selector, sub_value)
                                                        elif sub_step_type == "check":
                                                            if sub_selector:
                                                                await session.check(sub_selector)
                                                        elif sub_step_type == "uncheck":
                                                            if sub_selector:
                                                                await session.uncheck(sub_selector)
                                                        
                                                        # Keyboard
                                                        elif sub_step_type == "press":
                                                            key = sub_step.get("key") or sub_value
                                                            if key:
                                                                await session.press_key(key)
                                                        
                                                        # Navigation
                                                        elif sub_step_type == "go_back":
                                                            await session.go_back()
                                                        elif sub_step_type == "go_forward":
                                                            await session.go_forward()
                                                        elif sub_step_type == "reload":
                                                            await session.reload()
                                                        
                                                        # Scroll
                                                        elif sub_step_type == "scroll":
                                                            direction = sub_step.get("direction") or "down"
                                                            amount = sub_step.get("amount") or 300
                                                            await session.scroll_page(direction, amount)
                                                        
                                                        # Wait variations
                                                        elif sub_step_type == "wait_network":
                                                            timeout = sub_step.get("timeout") or 30000
                                                            await session.wait_for_network_idle(timeout)
                                                        
                                                        # Dialogs
                                                        elif sub_step_type == "accept_dialog":
                                                            await session.accept_dialog(sub_step.get("prompt_text"))
                                                        elif sub_step_type == "dismiss_dialog":
                                                            await session.dismiss_dialog()
                                                        
                                                        # Screenshot
                                                        elif sub_step_type == "screenshot":
                                                            full_page = sub_step.get("full_page") or False
                                                            await session.take_screenshot(full_page=full_page)
                                                        
                                                        # Focus
                                                        elif sub_step_type == "focus":
                                                            if sub_selector:
                                                                await session.focus(sub_selector)
                                                        
                                                        # Log/Comment (no-op for comments)
                                                        elif sub_step_type == "log":
                                                            message = sub_step.get("message") or sub_value
                                                            print(f"[SNIPPET LOG] {message}")
                                                        elif sub_step_type == "comment":
                                                            pass  # No-op
                                                        
                                                        # Unknown - log warning but continue
                                                        else:
                                                            print(f"[SNIPPET] Unsupported step type in snippet: {sub_step_type}")
                                                        
                                                        # Notify sub-step completed successfully
                                                        await websocket.send_json({
                                                            "type": "snippet_substep_completed",
                                                            "stepIndex": i,
                                                            "subStepIndex": sub_idx,
                                                            "status": "passed"
                                                        })
                                                    except Exception as sub_step_err:
                                                        # Notify sub-step failed
                                                        await websocket.send_json({
                                                            "type": "snippet_substep_completed",
                                                            "stepIndex": i,
                                                            "subStepIndex": sub_idx,
                                                            "status": "failed",
                                                            "error": str(sub_step_err)
                                                        })
                                                        raise  # Re-raise to fail the entire call_snippet step
                                                
                                                # Update snippet usage count
                                                snippet.usage_count = (snippet.usage_count or 0) + 1
                                                await db.commit()
                                            finally:
                                                # Remove snippet from call stack after execution
                                                snippet_call_stack.discard(snippet_id)
                                    
                                    passed_count += 1
                                    
                                except Exception as step_err:
                                    step_status = StepStatus.FAILED
                                    step_error = str(step_err)
                                    failed_count += 1
                                    has_failure = True  # Mark that we've had a failure
                                
                                step_end = datetime.utcnow()
                                step_duration = int((step_end - step_start).total_seconds() * 1000)
                                
                                # Update status if step was healed
                                if was_healed and step_status == StepStatus.PASSED:
                                    step_status = StepStatus.HEALED
                                
                                # Create step result record with action details
                                action_details = {
                                    "url": step_data.get("url") or step.get("url"),
                                    "value": step_data.get("value") or step.get("value"),
                                    "expected_title": step_data.get("expected_title") or step.get("expected_title"),
                                    "expected_url": step_data.get("expected_url") or step.get("expected_url"),
                                    "comparison": step_data.get("comparison") or step.get("comparison"),
                                    "actual_title": actual_title,  # Add actual captured title
                                    "actual_url": actual_url,  # Add actual captured URL
                                }
                                # Filter out None values
                                action_details = {k: v for k, v in action_details.items() if v}
                                
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
                                    action_details=action_details,
                                    error_message=step_error,
                                    was_healed=was_healed
                                )
                                db.add(step_result)
                                
                                # Capture screenshot based on execution settings
                                screenshot_url = None
                                # Check if this is an assertion step (skip for screenshot_each_step)
                                is_assertion_step = step_type.startswith('assert')
                                should_capture = (
                                    (screenshot_on_failure and step_status == StepStatus.FAILED) or
                                    (screenshot_each_step and not is_assertion_step)
                                )
                                if should_capture and session.page:
                                    try:
                                        from app.models.artifact import TestArtifact, ArtifactType
                                        
                                        # Create screenshots directory
                                        screenshots_dir = Path(f"./artifacts/{test_flow.project_id}/screenshots")
                                        screenshots_dir.mkdir(parents=True, exist_ok=True)
                                        
                                        # Generate artifact ID upfront for proper URL
                                        artifact_id = uuid.uuid4()
                                        
                                        # Capture screenshot
                                        screenshot_filename = f"{execution_run.human_id}_{i}_{step_type}.png"
                                        screenshot_path = screenshots_dir / screenshot_filename
                                        await session.page.screenshot(path=str(screenshot_path))
                                        
                                        # Create artifact record with proper URL using artifact ID
                                        artifact = TestArtifact(
                                            id=artifact_id,
                                            project_id=str(test_flow.project_id),
                                            execution_run_id=str(execution_run.id),
                                            step_result_id=str(step_result.id),
                                            name=screenshot_filename,
                                            type=ArtifactType.SCREENSHOT,
                                            file_path=str(screenshot_path),
                                            file_url=f"/api/v1/projects/{test_flow.project_id}/artifacts/{artifact_id}/download",
                                            size_bytes=os.path.getsize(screenshot_path),
                                            test_name=test_flow.name,
                                            step_name=step_name
                                        )
                                        db.add(artifact)
                                        screenshot_url = artifact.file_url
                                        
                                        # Update step result with screenshot URL
                                        step_result.screenshot_url = screenshot_url
                                    except Exception as ss_err:
                                        print(f"Failed to capture screenshot: {ss_err}")
                                
                                # Record HealingEvent if healing occurred
                                if was_healed and healing_info:
                                    healing_event = HealingEvent(
                                        id=uuid.uuid4(),
                                        execution_run_id=execution_run.id,
                                        step_result_id=step_result.id,
                                        healing_type=HealingType(healing_info.get("type", "locator")),
                                        strategy=HealingStrategy(healing_info.get("strategy", "ai")),
                                        original_value=healing_info.get("original", ""),
                                        healed_value=healing_info.get("healed", ""),
                                        step_id=step_id,
                                        step_type=step_type,
                                        success=True,
                                        confidence_score=healing_info.get("confidence_score", 0.8),
                                        ai_reasoning=healing_info.get("ai_reasoning", ""),
                                        page_url=session.page.url
                                    )
                                    db.add(healing_event)
                                
                                await websocket.send_json({
                                    "type": "step_completed",
                                    "stepIndex": i,
                                    "status": step_status.value,
                                    "error": step_error,
                                    "healed": was_healed,
                                    "healing_info": healing_info if was_healed else None
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
                            
                            # Save video artifact if recording was enabled
                            if video_recording and session and session.record_video:
                                try:
                                    # Close page to finalize video
                                    if session.page:
                                        video = session.page.video
                                        if video:
                                            video_path = await video.path()
                                            if video_path and os.path.exists(video_path):
                                                from app.models.artifact import TestArtifact, ArtifactType
                                                
                                                video_id = uuid.uuid4()
                                                video_filename = f"{execution_run.human_id}_recording.webm"
                                                
                                                video_artifact = TestArtifact(
                                                    id=video_id,
                                                    project_id=str(test_flow.project_id),
                                                    execution_run_id=str(execution_run.id),
                                                    name=video_filename,
                                                    type=ArtifactType.VIDEO,
                                                    file_path=str(video_path),
                                                    file_url=f"/api/v1/projects/{test_flow.project_id}/artifacts/{video_id}/download",
                                                    size_bytes=os.path.getsize(video_path),
                                                    duration_ms=total_duration,
                                                    test_name=test_flow.name
                                                )
                                                db.add(video_artifact)
                                                await db.commit()
                                except Exception as video_err:
                                    print(f"Failed to save video artifact: {video_err}")
                            
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

