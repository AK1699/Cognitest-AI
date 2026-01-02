"""
Enterprise Performance Testing API Endpoints
RESTful API for performance testing, load testing, and metrics
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from uuid import UUID
from datetime import datetime
import asyncio
import json

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.performance_test import (
    PerformanceTest, PerformanceMetrics, TestExecution, 
    PerformanceAlert, PerformanceSchedule, PerformanceReport,
    TestType, TestStatus, LoadProfile, DeviceType, ConnectionType
)
from app.schemas.performance import (
    PerformanceTestCreate, PerformanceTestUpdate, PerformanceTestResponse,
    PerformanceTestDetailResponse, PerformanceTestListResponse,
    PerformanceMetricsResponse, TestExecutionResponse, TestExecutionListResponse,
    PerformanceAlertResponse, AcknowledgeAlertRequest,
    LighthouseScanRequest, LoadTestRequest, StressTestRequest,
    PerformanceScheduleCreate, PerformanceScheduleUpdate, PerformanceScheduleResponse,
    GenerateReportRequest, PerformanceReportResponse, ShareReportRequest,
    PerformanceDashboardStats, PerformanceTrendResponse, ComparisonRequest, ComparisonResponse,
    AIAnalysisRequest, AIAnalysisResponse
)
from app.services.performance_testing_service import PerformanceTestingService
from app.core.config import settings

router = APIRouter()


# ============================================================================
# Helper Functions
# ============================================================================

def get_performance_service(db: AsyncSession) -> PerformanceTestingService:
    """Get performance testing service with configured API keys"""
    return PerformanceTestingService(
        db=db,
        pagespeed_api_key=getattr(settings, 'PAGESPEED_API_KEY', None),
        loader_api_key=getattr(settings, 'LOADERIO_API_KEY', None),
    )


async def execute_test_task(db: AsyncSession, test_id: UUID):
    """Background task to execute a performance test"""
    service = get_performance_service(db)
    await service.execute_test(test_id)


# ============================================================================
# Performance Tests CRUD
# ============================================================================

@router.post("/tests", response_model=PerformanceTestResponse, status_code=status.HTTP_201_CREATED)
async def create_performance_test(
    project_id: UUID,
    test_data: PerformanceTestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new performance test
    
    Test types:
    - **lighthouse**: Web page performance (Core Web Vitals)
    - **load**: Steady load testing
    - **stress**: Ramp up until failure
    - **spike**: Sudden traffic bursts
    - **endurance**: Sustained load over time
    - **api**: API endpoint performance
    """
    # Verify project access
    project = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = project.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    service = get_performance_service(db)
    
    test = await service.create_test(
        project_id=project_id,
        organisation_id=project.organisation_id,
        user_id=current_user.id,
        name=test_data.name,
        test_type=test_data.test_type,
        target_url=test_data.target_url,
        description=test_data.description,
        target_method=test_data.target_method,
        target_headers=test_data.target_headers,
        target_body=test_data.target_body,
        device_type=test_data.device_type,
        connection_type=test_data.connection_type,
        test_location=test_data.test_location,
        virtual_users=test_data.virtual_users,
        duration_seconds=test_data.duration_seconds,
        ramp_up_seconds=test_data.ramp_up_seconds,
        ramp_down_seconds=test_data.ramp_down_seconds,
        load_profile=test_data.load_profile,
        stages=test_data.stages,
        thresholds=test_data.thresholds,
        tags=test_data.tags,
        notes=test_data.notes,
    )
    
    return test


@router.get("/tests", response_model=PerformanceTestListResponse)
async def list_performance_tests(
    project_id: UUID,
    test_type: Optional[TestType] = None,
    status_filter: Optional[TestStatus] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List performance tests for a project
    """
    service = get_performance_service(db)
    
    tests, total = await service.list_tests(
        project_id=project_id,
        test_type=test_type,
        status=status_filter,
        page=page,
        page_size=page_size
    )
    
    return PerformanceTestListResponse(
        items=tests,
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size
    )


@router.get("/tests/{test_id}", response_model=PerformanceTestDetailResponse)
async def get_performance_test(
    test_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get performance test details with metrics
    """
    service = get_performance_service(db)
    test = await service.get_test(test_id)
    
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    # Load metrics
    metrics_result = await db.execute(
        select(PerformanceMetrics).where(PerformanceMetrics.test_id == test_id)
    )
    metrics = metrics_result.scalar_one_or_none()
    
    # Load recent executions
    exec_result = await db.execute(
        select(TestExecution)
        .where(TestExecution.test_id == test_id)
        .order_by(TestExecution.created_at.desc())
        .limit(10)
    )
    executions = exec_result.scalars().all()
    
    # Load alerts
    alerts_result = await db.execute(
        select(PerformanceAlert)
        .where(PerformanceAlert.test_id == test_id)
        .order_by(PerformanceAlert.created_at.desc())
        .limit(5)
    )
    alerts = alerts_result.scalars().all()
    
    return PerformanceTestDetailResponse(
        **test.__dict__,
        metrics=metrics,
        recent_executions=list(executions),
        alerts=list(alerts)
    )


@router.patch("/tests/{test_id}", response_model=PerformanceTestResponse)
async def update_performance_test(
    test_id: UUID,
    update_data: PerformanceTestUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a performance test
    """
    result = await db.execute(
        select(PerformanceTest).where(PerformanceTest.id == test_id)
    )
    test = result.scalar_one_or_none()
    
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(test, key, value)
    
    await db.commit()
    await db.refresh(test)
    
    return test


@router.delete("/tests/{test_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_performance_test(
    test_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a performance test
    """
    service = get_performance_service(db)
    deleted = await service.delete_test(test_id)
    
    if not deleted:
        raise HTTPException(status_code=404, detail="Test not found")


# ============================================================================
# Test Execution
# ============================================================================

@router.post("/tests/{test_id}/execute", response_model=PerformanceTestResponse)
async def execute_performance_test(
    test_id: UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Execute or re-execute a performance test
    """
    service = get_performance_service(db)
    test = await service.get_test(test_id)
    
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    if test.status == TestStatus.RUNNING:
        raise HTTPException(status_code=400, detail="Test is already running")
    
    # Reset for re-execution
    test.status = TestStatus.QUEUED
    test.progress_percentage = 0
    test.error_message = None
    await db.commit()
    
    # Execute in background
    background_tasks.add_task(execute_test_task, db, test.id)
    
    await db.refresh(test)
    return test


@router.get("/tests/{test_id}/stream")
async def stream_test_progress(
    test_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Stream real-time test progress via Server-Sent Events
    """
    async def event_generator():
        service = get_performance_service(db)
        
        while True:
            test = await service.get_test(test_id)
            if not test:
                yield f"event: error\ndata: {json.dumps({'error': 'Test not found'})}\n\n"
                break
            
            # Send progress update
            yield f"event: progress\ndata: {json.dumps({'status': test.status.value, 'progress': test.progress_percentage})}\n\n"
            
            # Check if complete
            if test.status in [TestStatus.COMPLETED, TestStatus.FAILED, TestStatus.CANCELLED]:
                # Load final metrics
                metrics_result = await db.execute(
                    select(PerformanceMetrics).where(PerformanceMetrics.test_id == test_id)
                )
                metrics = metrics_result.scalar_one_or_none()
                
                final_data = {
                    "status": test.status.value,
                    "progress": 100,
                    "duration_ms": test.duration_ms,
                }
                
                if metrics:
                    final_data["performance_score"] = metrics.performance_score
                    final_data["latency_p95"] = metrics.latency_p95
                    final_data["error_rate"] = metrics.error_rate
                
                yield f"event: complete\ndata: {json.dumps(final_data)}\n\n"
                break
            
            await asyncio.sleep(2)
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


# ============================================================================
# Quick Scans
# ============================================================================

@router.post("/lighthouse", response_model=PerformanceTestResponse, status_code=status.HTTP_201_CREATED)
async def quick_lighthouse_scan(
    project_id: UUID,
    scan_data: LighthouseScanRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Quick Lighthouse scan for web page performance
    
    Returns Core Web Vitals:
    - LCP (Largest Contentful Paint)
    - FID (First Input Delay)  
    - CLS (Cumulative Layout Shift)
    - FCP (First Contentful Paint)
    - TTFB (Time to First Byte)
    """
    project = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = project.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    service = get_performance_service(db)
    
    test = await service.create_test(
        project_id=project_id,
        organisation_id=project.organisation_id,
        user_id=current_user.id,
        name=f"Lighthouse: {scan_data.target_url[:50]}",
        test_type=TestType.LIGHTHOUSE,
        target_url=scan_data.target_url,
        device_type=scan_data.device_type,
        connection_type=scan_data.connection_type,
        trigger_source="quick_scan"
    )
    
    # Execute in background  
    background_tasks.add_task(execute_test_task, db, test.id)
    
    return test


@router.post("/load-test", response_model=PerformanceTestResponse, status_code=status.HTTP_201_CREATED)
async def quick_load_test(
    project_id: UUID,
    test_data: LoadTestRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Quick load test with configurable virtual users and duration
    """
    project = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = project.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    service = get_performance_service(db)
    
    # Build thresholds
    thresholds = {}
    if test_data.max_p95_latency_ms:
        thresholds["latency_p95"] = test_data.max_p95_latency_ms
    if test_data.max_error_rate:
        thresholds["error_rate"] = test_data.max_error_rate
    
    test = await service.create_test(
        project_id=project_id,
        organisation_id=project.organisation_id,
        user_id=current_user.id,
        name=f"Load Test: {test_data.target_url[:50]}",
        test_type=TestType.LOAD,
        target_url=test_data.target_url,
        target_method=test_data.target_method,
        target_headers=test_data.target_headers,
        target_body=test_data.target_body,
        virtual_users=test_data.virtual_users,
        duration_seconds=test_data.duration_seconds,
        ramp_up_seconds=test_data.ramp_up_seconds,
        thresholds=thresholds,
        trigger_source="quick_scan"
    )
    
    background_tasks.add_task(execute_test_task, db, test.id)
    
    return test


@router.post("/stress-test", response_model=PerformanceTestResponse, status_code=status.HTTP_201_CREATED)
async def quick_stress_test(
    project_id: UUID,
    test_data: StressTestRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Quick stress test - gradually increase load until failure
    """
    project = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = project.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    service = get_performance_service(db)
    
    # Calculate stages for stress test
    stages = []
    current_vus = test_data.start_vus
    while current_vus <= test_data.max_vus:
        stages.append({
            "duration": test_data.step_duration_seconds,
            "target": current_vus
        })
        current_vus += test_data.step_increase
    
    test = await service.create_test(
        project_id=project_id,
        organisation_id=project.organisation_id,
        user_id=current_user.id,
        name=f"Stress Test: {test_data.target_url[:50]}",
        test_type=TestType.STRESS,
        target_url=test_data.target_url,
        target_method=test_data.target_method,
        target_headers=test_data.target_headers,
        virtual_users=test_data.max_vus,
        load_profile=LoadProfile.STEP,
        stages=stages,
        trigger_source="quick_scan"
    )
    
    background_tasks.add_task(execute_test_task, db, test.id)
    
    return test


# ============================================================================
# Metrics & Results
# ============================================================================

@router.get("/tests/{test_id}/metrics", response_model=PerformanceMetricsResponse)
async def get_test_metrics(
    test_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed performance metrics for a test
    """
    result = await db.execute(
        select(PerformanceMetrics).where(PerformanceMetrics.test_id == test_id)
    )
    metrics = result.scalar_one_or_none()
    
    if not metrics:
        raise HTTPException(status_code=404, detail="Metrics not found")
    
    return metrics


@router.get("/tests/{test_id}/executions", response_model=TestExecutionListResponse)
async def list_test_executions(
    test_id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List execution history for a test
    """
    # Count
    from sqlalchemy import func
    count_result = await db.execute(
        select(func.count()).where(TestExecution.test_id == test_id)
    )
    total = count_result.scalar() or 0
    
    # Fetch
    result = await db.execute(
        select(TestExecution)
        .where(TestExecution.test_id == test_id)
        .order_by(TestExecution.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    executions = result.scalars().all()
    
    return TestExecutionListResponse(
        items=list(executions),
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size
    )


# ============================================================================
# Alerts
# ============================================================================

@router.get("/alerts", response_model=List[PerformanceAlertResponse])
async def list_performance_alerts(
    project_id: UUID,
    acknowledged: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List performance alerts for a project
    """
    query = select(PerformanceAlert).where(PerformanceAlert.project_id == project_id)
    
    if acknowledged is not None:
        query = query.where(PerformanceAlert.is_acknowledged == acknowledged)
    
    query = query.order_by(PerformanceAlert.created_at.desc()).limit(100)
    
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/alerts/{alert_id}/acknowledge", response_model=PerformanceAlertResponse)
async def acknowledge_alert(
    alert_id: UUID,
    request: AcknowledgeAlertRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Acknowledge a performance alert
    """
    result = await db.execute(
        select(PerformanceAlert).where(PerformanceAlert.id == alert_id)
    )
    alert = result.scalar_one_or_none()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.is_acknowledged = True
    alert.acknowledged_by = current_user.id
    alert.acknowledged_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(alert)
    
    return alert


# ============================================================================
# Dashboard & Statistics
# ============================================================================

@router.get("/dashboard/{project_id}/stats", response_model=PerformanceDashboardStats)
async def get_dashboard_stats(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get performance testing dashboard statistics
    """
    service = get_performance_service(db)
    stats = await service.get_dashboard_stats(project_id)
    
    # Get recent tests
    recent_result = await db.execute(
        select(PerformanceTest)
        .where(PerformanceTest.project_id == project_id)
        .order_by(PerformanceTest.created_at.desc())
        .limit(5)
    )
    recent_tests = recent_result.scalars().all()
    
    return PerformanceDashboardStats(
        project_id=project_id,
        total_tests=stats["total_tests"],
        tests_last_7_days=stats["tests_last_7_days"],
        tests_last_30_days=0,  # Can be added later
        pass_rate=stats["pass_rate"],
        avg_performance_score=stats["avg_performance_score"],
        avg_latency_p95=None,  # Can be added later
        avg_rps=None,
        avg_error_rate=None,
        performance_trend="stable",
        recent_tests=list(recent_tests),
        active_tests=stats["active_tests"],
        scheduled_tests=0,
        active_alerts=stats["active_alerts"],
        critical_alerts=0
    )


@router.get("/trends/{project_id}", response_model=PerformanceTrendResponse)
async def get_performance_trends(
    project_id: UUID,
    metric: str = Query("performance_score", description="Metric to trend"),
    period: str = Query("weekly", description="daily, weekly, or monthly"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get performance trends over time
    """
    # Simplified implementation - can be enhanced with proper time-series aggregation
    from datetime import timedelta
    
    days = {"daily": 7, "weekly": 30, "monthly": 90}
    cutoff = datetime.utcnow() - timedelta(days=days.get(period, 30))
    
    result = await db.execute(
        select(PerformanceTest, PerformanceMetrics)
        .join(PerformanceMetrics)
        .where(
            PerformanceTest.project_id == project_id,
            PerformanceTest.created_at >= cutoff,
            PerformanceTest.status == TestStatus.COMPLETED
        )
        .order_by(PerformanceTest.created_at)
    )
    
    data_points = []
    for test, metrics in result.all():
        value = getattr(metrics, metric, None)
        if value is not None:
            data_points.append({
                "date": test.created_at.isoformat(),
                "value": value,
                "test_id": str(test.id)
            })
    
    return PerformanceTrendResponse(
        period=period,
        metric=metric,
        data_points=data_points
    )


# ============================================================================
# Comparison
# ============================================================================

@router.post("/compare", response_model=ComparisonResponse)
async def compare_tests(
    request: ComparisonRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Compare multiple test runs side by side
    """
    tests_data = []
    metrics_data = {metric: [] for metric in request.metrics}
    
    for test_id in request.test_ids:
        # Get test
        test_result = await db.execute(
            select(PerformanceTest).where(PerformanceTest.id == test_id)
        )
        test = test_result.scalar_one_or_none()
        
        if not test:
            continue
        
        # Get metrics
        metrics_result = await db.execute(
            select(PerformanceMetrics).where(PerformanceMetrics.test_id == test_id)
        )
        metrics = metrics_result.scalar_one_or_none()
        
        tests_data.append({
            "id": str(test.id),
            "name": test.name,
            "created_at": test.created_at.isoformat(),
            "status": test.status.value
        })
        
        if metrics:
            for metric in request.metrics:
                value = getattr(metrics, metric, None)
                metrics_data[metric].append({
                    "test_id": str(test.id),
                    "value": value
                })
    
    # Calculate summary (best/worst for each metric)
    summary = {}
    for metric, values in metrics_data.items():
        valid_values = [v for v in values if v["value"] is not None]
        if valid_values:
            if metric in ["error_rate"]:
                # Lower is better
                best = min(valid_values, key=lambda x: x["value"])
                worst = max(valid_values, key=lambda x: x["value"])
            else:
                # Higher is better
                best = max(valid_values, key=lambda x: x["value"])
                worst = min(valid_values, key=lambda x: x["value"])
            summary[metric] = {"best": best, "worst": worst}
    
    return ComparisonResponse(
        tests=tests_data,
        metrics=metrics_data,
        summary=summary
    )


# ============================================================================
# Test Types Info
# ============================================================================

@router.get("/test-types")
async def list_test_types(
    current_user: User = Depends(get_current_user)
):
    """
    List available test types with descriptions
    """
    return [
        {
            "id": TestType.LIGHTHOUSE.value,
            "name": "Lighthouse Audit",
            "description": "Web page performance analysis with Core Web Vitals",
            "icon": "⚡",
            "provider": "PageSpeed Insights"
        },
        {
            "id": TestType.LOAD.value,
            "name": "Load Test",
            "description": "Steady concurrent user simulation",
            "icon": "📈",
            "provider": "Loader.io"
        },
        {
            "id": TestType.STRESS.value,
            "name": "Stress Test",
            "description": "Gradually increase load until breaking point",
            "icon": "💥",
            "provider": "Loader.io"
        },
        {
            "id": TestType.SPIKE.value,
            "name": "Spike Test",
            "description": "Sudden traffic burst simulation",
            "icon": "⚡",
            "provider": "Loader.io"
        },
        {
            "id": TestType.ENDURANCE.value,
            "name": "Endurance Test",
            "description": "Sustained load over extended period",
            "icon": "⏱️",
            "provider": "Loader.io"
        },
        {
            "id": TestType.API.value,
            "name": "API Performance",
            "description": "Single endpoint performance measurement",
            "icon": "🔌",
            "provider": "PageSpeed Insights"
        }
    ]


# ============================================================================
# AI Analysis
# ============================================================================

@router.post("/tests/{test_id}/ai-analysis", response_model=AIAnalysisResponse)
async def get_ai_analysis(
    test_id: UUID,
    request: AIAnalysisRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get AI-powered analysis of test results
    
    Includes:
    - Executive summary
    - Bottleneck detection
    - Actionable recommendations
    - Risk assessment
    - Production readiness check
    """
    from app.services.performance_ai_analyzer import get_performance_ai_analyzer
    
    # Get test
    test_result = await db.execute(
        select(PerformanceTest).where(PerformanceTest.id == test_id)
    )
    test = test_result.scalar_one_or_none()
    
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    if test.status != TestStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Test must be completed for AI analysis")
    
    # Get metrics
    metrics_result = await db.execute(
        select(PerformanceMetrics).where(PerformanceMetrics.test_id == test_id)
    )
    metrics = metrics_result.scalar_one_or_none()
    
    if not metrics:
        raise HTTPException(status_code=404, detail="No metrics found for this test")
    
    # Get AI analyzer
    analyzer = get_performance_ai_analyzer()
    
    # Convert metrics to dict
    metrics_dict = {
        "performance_score": metrics.performance_score,
        "accessibility_score": metrics.accessibility_score,
        "seo_score": metrics.seo_score,
        "best_practices_score": metrics.best_practices_score,
        "largest_contentful_paint": metrics.largest_contentful_paint,
        "first_input_delay": metrics.first_input_delay,
        "cumulative_layout_shift": metrics.cumulative_layout_shift,
        "first_contentful_paint": metrics.first_contentful_paint,
        "time_to_first_byte": metrics.time_to_first_byte,
        "speed_index": metrics.speed_index,
        "time_to_interactive": metrics.time_to_interactive,
        "total_blocking_time": metrics.total_blocking_time,
        "total_byte_weight": metrics.total_byte_weight,
        "total_requests": metrics.total_requests,
        "opportunities": metrics.opportunities,
        "latency_p95": metrics.latency_p95,
        "latency_avg": metrics.latency_avg,
        "error_rate": metrics.error_rate,
        "requests_per_second": metrics.requests_per_second,
    }
    
    # Run appropriate analysis
    if test.test_type == TestType.LIGHTHOUSE:
        analysis = await analyzer.analyze_lighthouse_results(metrics_dict, test.target_url)
    else:
        config = {
            "virtual_users": test.virtual_users,
            "duration_seconds": test.duration_seconds,
            "target_url": test.target_url,
        }
        analysis = await analyzer.analyze_load_test_results(metrics_dict, config)
    
    # Store in test record
    test.ai_analysis = analysis.get("summary", "")
    test.ai_recommendations = analysis.get("recommendations", [])
    test.ai_risk_level = analysis.get("risk_level", "medium")
    await db.commit()
    
    return AIAnalysisResponse(
        test_id=test_id,
        summary=analysis.get("summary", ""),
        bottlenecks=analysis.get("bottlenecks", []),
        recommendations=analysis.get("recommendations", []),
        risk_level=analysis.get("risk_level", "medium"),
        risk_factors=analysis.get("blockers", []),
        is_production_ready=analysis.get("is_production_ready", False),
        blockers=analysis.get("blockers", []),
        generated_at=datetime.utcnow()
    )
