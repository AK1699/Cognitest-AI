"""
Performance Testing API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from uuid import UUID
import json
import asyncio

from ....models.performance import (
    PerformanceTest, PerformanceMetrics, TestExecution, 
    PerformanceAlert, TestType, TestStatus
)
from ....schemas.performance import (
    PerformanceTestCreate, PerformanceTestUpdate, PerformanceTestResponse,
    PerformanceTestDetailResponse, PerformanceTestListResponse,
    PerformanceMetricsResponse, TestExecutionListResponse,
    PerformanceAlertResponse, AcknowledgeAlertRequest,
    LighthouseScanRequest, LoadTestRequest, StressTestRequest,
    PerformanceDashboardStats, PerformanceTrendResponse
)
from ....api.deps import get_db, get_performance_testing_service, get_current_user_id

router = APIRouter()


async def execute_test_task(service, test_id: UUID):
    """Background task to execute a performance test"""
    await service.execute_test(test_id)


@router.post("/tests", response_model=PerformanceTestResponse, status_code=status.HTTP_201_CREATED)
async def create_performance_test(
    project_id: UUID,
    test_data: PerformanceTestCreate,
    service = Depends(get_performance_testing_service),
    user_id: str = Depends(get_current_user_id)
):
    """Create a new performance test"""
    # Note: In a real system, we'd verify project access here or via a dependency
    # For now, we assume the gateway has checked permissions
    
    test = await service.create_test(
        project_id=project_id,
        organisation_id=UUID("00000000-0000-0000-0000-000000000000"), # Mocked or extracted from header
        user_id=UUID(user_id) if user_id != "00000000-0000-0000-0000-000000000000" else None,
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
    service = Depends(get_performance_testing_service),
    user_id: str = Depends(get_current_user_id)
):
    """List performance tests for a project"""
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
    service = Depends(get_performance_testing_service),
    user_id: str = Depends(get_current_user_id)
):
    """Get performance test details with metrics"""
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


@router.post("/tests/{test_id}/execute", response_model=PerformanceTestResponse)
async def execute_performance_test(
    test_id: UUID,
    background_tasks: BackgroundTasks,
    service = Depends(get_performance_testing_service),
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """Execute a performance test"""
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
    background_tasks.add_task(execute_test_task, service, test.id)
    
    await db.refresh(test)
    return test


@router.get("/dashboard/{project_id}/stats", response_model=PerformanceDashboardStats)
async def get_dashboard_stats(
    project_id: UUID,
    service = Depends(get_performance_testing_service),
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """Get performance testing dashboard statistics"""
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
        tests_last_30_days=0,
        pass_rate=stats["pass_rate"],
        avg_performance_score=stats["avg_performance_score"],
        avg_latency_p95=None,
        avg_rps=None,
        avg_error_rate=None,
        performance_trend="stable",
        recent_tests=list(recent_tests),
        active_tests=stats["active_tests"],
        scheduled_tests=0,
        active_alerts=stats["active_alerts"],
        critical_alerts=0
    )
