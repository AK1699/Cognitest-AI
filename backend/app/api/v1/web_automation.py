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


@router.get("/executions/{run_id}", response_model=ExecutionRunDetailResponse)
async def get_execution_run(
    run_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get execution run with detailed results
    """
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
    
    response = ExecutionRunDetailResponse.model_validate(execution_run)
    response.step_results = [StepResultResponse.model_validate(sr) for sr in step_results]
    response.healing_events = [HealingEventResponse.model_validate(he) for he in healing_events]
    
    return response


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
