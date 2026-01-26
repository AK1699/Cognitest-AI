"""
Performance Testing API
Directly interacts with the monolithic performance testing service
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Dict, Any
from uuid import UUID
import os
import json
from datetime import datetime
import asyncio

from app.api.v1.auth import get_current_user
from app.core.deps import get_db
from app.core.config import settings
from app.models.user import User
from app.models.project import Project
from app.models.performance import TestType, TestStatus, PerformanceSchedule
from app.services.performance_testing_service import PerformanceTestingService
from sqlalchemy import select
from app.schemas.performance import (
    PerformanceTestDetailResponse, PerformanceTestListResponse,
    PerformanceMetricsResponse, TestExecutionListResponse,
    PerformanceAlertResponse, AcknowledgeAlertRequest,
    LighthouseScanRequest, LoadTestRequest, StressTestRequest,
    SpikeTestRequest, SoakTestRequest,
    PerformanceDashboardStats, PerformanceTrendResponse,
    PerformanceTestResponse, PerformanceTestCreate
)

router = APIRouter()

def get_performance_service(db: AsyncSession = Depends(get_db)) -> PerformanceTestingService:
    """Dependency to get performance service instance"""
    return PerformanceTestingService(
        db=db,
        pagespeed_api_key=os.getenv("PAGESPEED_API_KEY", settings.GOOGLE_API_KEY),
        loader_api_key=os.getenv("LOADER_IO_API_KEY"),
        wpt_api_key=os.getenv("WEBPAGETEST_API_KEY"),
        google_api_key=settings.GOOGLE_API_KEY
    )


# =============================================================================
# Helper function to create generic test from specific request
# =============================================================================
async def _create_and_run_test(
    project_id: UUID, 
    service: PerformanceTestingService, 
    user: User,
    name: str,
    test_type: TestType,
    target_url: str,
    **kwargs
):
    # Retrieve organisation_id from project (would usually do this via project service, 
    # but here let's assume valid project_id and we need org_id. 
    # Service create_test requires organisation_id. 
    # For now we'll fetch project efficiently in the service or assume strict access control is done elsewhere)
    
    # We need to get org_id. Service could derive it but method sign needs it.
    # Hack for now: Pass a dummy UUID if service re-fetches or make service fetch it.
    from app.models.project import Project
    from app.models.performance import PerformanceTest
    from sqlalchemy import select
    
    # Check for existing test for the same project, type and URL
    stmt = select(PerformanceTest).where(
        PerformanceTest.project_id == project_id,
        PerformanceTest.test_type == test_type,
        PerformanceTest.target_url == target_url
    )
    result = await service.db.execute(stmt)
    existing_test = result.scalar_one_or_none()
    
    if existing_test:
        # Update existing test configuration instead of creating new one
        existing_test.name = name
        existing_test.triggered_by = user.id
        # Update connection/device details from kwargs
        for key, value in kwargs.items():
            if hasattr(existing_test, key):
                setattr(existing_test, key, value)
        
        await service.db.commit()
        await service.db.refresh(existing_test)
        return existing_test

    result = await service.db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    test = await service.create_test(
        project_id=project_id,
        organisation_id=project.organisation_id,
        user_id=user.id,
        name=name,
        test_type=test_type,
        target_url=target_url,
        **kwargs
    )
    
    return test

async def run_test_background(test_id: UUID):
    """Background task to run test with its own session"""
    from app.core.database import AsyncSessionLocal
    
    async with AsyncSessionLocal() as db:
        service = PerformanceTestingService(
            db=db,
            pagespeed_api_key=os.getenv("PAGESPEED_API_KEY", settings.GOOGLE_API_KEY),
            loader_api_key=os.getenv("LOADER_IO_API_KEY"),
            wpt_api_key=os.getenv("WEBPAGETEST_API_KEY"),
            google_api_key=settings.GOOGLE_API_KEY
        )
        await service.execute_test(test_id)


# =============================================================================
# Convenience Endpoints
# =============================================================================

@router.post("/lighthouse", response_model=PerformanceTestResponse)
async def run_lighthouse_audit(
    background_tasks: BackgroundTasks,
    project_id: UUID,
    request: LighthouseScanRequest,
    current_user: User = Depends(get_current_user),
    service: PerformanceTestingService = Depends(get_performance_service)
):
    """Run a quick Lighthouse audit"""
    # Create test
    test = await _create_and_run_test(
        project_id, service, current_user,
        name=f"Lighthouse Scan: {request.target_url}",
        test_type=TestType.LIGHTHOUSE,
        target_url=request.target_url,
        device_type=request.device_type,
        audit_mode=request.mode,
        categories=request.categories
    )
    
    # Run in background
    background_tasks.add_task(run_test_background, test.id)
    
    return test


@router.post("/load-test", response_model=PerformanceTestResponse)
async def run_load_test(
    background_tasks: BackgroundTasks,
    project_id: UUID,
    request: LoadTestRequest,
    current_user: User = Depends(get_current_user),
    service: PerformanceTestingService = Depends(get_performance_service)
):
    """Run a quick load test"""
    test = await _create_and_run_test(
        project_id, service, current_user,
        name=f"Load Test: {request.target_url}",
        test_type=TestType.LOAD,
        target_url=request.target_url,
        virtual_users=request.virtual_users,
        duration_seconds=request.duration_seconds,
        ramp_up_seconds=request.ramp_up_seconds,
        target_method=request.target_method
    )
    
    # Start execution in background
    test.status = TestStatus.RUNNING
    test.started_at = datetime.utcnow()
    await service.db.commit()
    await service.db.refresh(test)
    background_tasks.add_task(run_test_background, test.id)
    
    return test

@router.post("/stress-test", response_model=PerformanceTestResponse)
async def run_stress_test(
    background_tasks: BackgroundTasks,
    project_id: UUID,
    request: StressTestRequest,
    current_user: User = Depends(get_current_user),
    service: PerformanceTestingService = Depends(get_performance_service)
):
    """Run a quick stress test"""
    # Calculate stages dynamically based on request
    steps = int((request.max_vus - request.start_vus) / request.step_increase)
    stages = [
        {"duration": request.step_duration_seconds, "target": request.start_vus + (request.step_increase * i)}
        for i in range(steps + 1)
    ]
    
    test = await _create_and_run_test(
        project_id, service, current_user,
        name=f"Stress Test: {request.target_url}",
        test_type=TestType.STRESS,
        target_url=request.target_url,
        virtual_users=request.max_vus,
        stages=stages
    )
    
    # Start execution in background
    test.status = TestStatus.RUNNING
    test.started_at = datetime.utcnow()
    await service.db.commit()
    await service.db.refresh(test)
    background_tasks.add_task(run_test_background, test.id)
    
    return test


@router.post("/spike-test", response_model=PerformanceTestResponse)
async def run_spike_test(
    background_tasks: BackgroundTasks,
    project_id: UUID,
    request: SpikeTestRequest,
    current_user: User = Depends(get_current_user),
    service: PerformanceTestingService = Depends(get_performance_service)
):
    """Run a quick spike test"""
    # Create spike stages
    # 1. Warmup (20%)
    # 2. Spike (10% ramp up)
    # 3. Hold Spike (40%)
    # 4. Ramp Down (10%)
    # 5. Cooldown (20%)
    
    total_duration = request.total_duration_seconds
    warmup = int(total_duration * 0.2)
    spike_up = int(total_duration * 0.1)
    spike_hold = int(total_duration * 0.4)
    spike_down = int(total_duration * 0.1)
    cooldown = int(total_duration * 0.2)
    
    stages = [
        {"duration": warmup, "target": request.base_users},
        {"duration": spike_up, "target": request.spike_users},
        {"duration": spike_hold, "target": request.spike_users},
        {"duration": spike_down, "target": request.base_users},
        {"duration": cooldown, "target": request.base_users}
    ]
    
    test = await _create_and_run_test(
        project_id, service, current_user,
        name=f"Spike Test: {request.target_url}",
        test_type=TestType.SPIKE,
        target_url=request.target_url,
        virtual_users=request.spike_users,
        duration_seconds=request.total_duration_seconds,
        stages=stages
    )
    
    # Start execution in background
    test.status = TestStatus.RUNNING
    test.started_at = datetime.utcnow()
    await service.db.commit()
    await service.db.refresh(test)
    background_tasks.add_task(run_test_background, test.id)
    
    return test


@router.post("/soak-test", response_model=PerformanceTestResponse)
async def run_soak_test(
    background_tasks: BackgroundTasks,
    project_id: UUID,
    request: SoakTestRequest,
    current_user: User = Depends(get_current_user),
    service: PerformanceTestingService = Depends(get_performance_service)
):
    """Run a soak/endurance test"""
    test = await _create_and_run_test(
        project_id, service, current_user,
        name=f"Soak Test: {request.target_url}",
        test_type=TestType.ENDURANCE,
        target_url=request.target_url,
        virtual_users=request.virtual_users,
        duration_seconds=request.duration_seconds,
        ramp_up_seconds=request.ramp_up_seconds,
        target_method=request.target_method,
        target_headers=request.target_headers,
        target_body=request.target_body,
        # Thresholds
        thresholds={
            "latency_p95": request.max_p95_latency_ms,
            "error_rate": request.max_error_rate
        } if request.max_p95_latency_ms or request.max_error_rate else {}
    )
    
    # Start execution in background
    test.status = TestStatus.RUNNING
    test.started_at = datetime.utcnow()
    await service.db.commit()
    await service.db.refresh(test)
    background_tasks.add_task(run_test_background, test.id)
    
    return test

# =============================================================================
# Standard CRUD
# =============================================================================

@router.post("/tests", response_model=PerformanceTestResponse, status_code=status.HTTP_201_CREATED)
async def create_performance_test(
    project_id: UUID,
    test_data: PerformanceTestCreate,
    current_user: User = Depends(get_current_user),
    service: PerformanceTestingService = Depends(get_performance_service)
):
    """Create a new performance test"""
    # Fetch project to get organisation_id
    result = await service.db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return await service.create_test(
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
        audit_mode=test_data.audit_mode,
        categories=test_data.categories,
    )


@router.get("/tests", response_model=PerformanceTestListResponse)
async def list_performance_tests(
    project_id: UUID,
    test_type: Optional[TestType] = None,
    status_filter: Optional[TestStatus] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    service: PerformanceTestingService = Depends(get_performance_service)
):
    """List performance tests"""
    items, total = await service.list_tests(
        project_id=project_id,
        page=page,
        page_size=page_size,
        test_type=test_type,
        status=status_filter
    )
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size
    }


@router.get("/tests/{test_id}", response_model=PerformanceTestDetailResponse)
async def get_performance_test(
    test_id: UUID,
    current_user: User = Depends(get_current_user),
    service: PerformanceTestingService = Depends(get_performance_service)
):
    """Get a specific test"""
    test = await service.get_test(test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    return test

@router.delete("/tests/{test_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_performance_test(
    test_id: UUID,
    current_user: User = Depends(get_current_user),
    service: PerformanceTestingService = Depends(get_performance_service)
):
    """Delete a test"""
    success = await service.delete_test(test_id)
    if not success:
        raise HTTPException(status_code=404, detail="Test not found")
    return None

@router.post("/tests/{test_id}/execute", response_model=PerformanceTestResponse)
async def execute_performance_test(
    test_id: UUID,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    service: PerformanceTestingService = Depends(get_performance_service)
):
    """Execute a performance test"""
    # Verify existence
    test = await service.get_test(test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    # Execute in background
    test.status = TestStatus.RUNNING
    test.started_at = datetime.utcnow()
    test.progress_percentage = 5
    await service.db.commit()
    await service.db.refresh(test)
    
    background_tasks.add_task(run_test_background, test.id)
    
    return test


@router.get("/dashboard/{project_id}/stats", response_model=PerformanceDashboardStats)
async def get_dashboard_stats(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    service: PerformanceTestingService = Depends(get_performance_service)
):
    """Get dashboard stats"""
    return await service.get_dashboard_stats(project_id)


@router.get("/tests/{test_id}/stream")
async def stream_test_progress(
    test_id: UUID,
    current_user: User = Depends(get_current_user),
    service: PerformanceTestingService = Depends(get_performance_service)
):
    """Stream test progress via SSE"""
    async def event_generator():
        while True:
            test = await service.get_test(test_id)
            if not test:
                break
                
            data = {
                "id": str(test.id),
                "status": test.status,
                "progress": test.progress_percentage
            }
            yield f"data: {json.dumps(data)}\n\n"
            
            if test.status in [TestStatus.COMPLETED, TestStatus.FAILED, TestStatus.STOPPED]:
                break
                
            await asyncio.sleep(2)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )

# =============================================================================
# Advanced Features
# =============================================================================

@router.get("/compare", response_model=Any)
async def compare_tests(
    test1: UUID,
    test2: UUID,
    current_user: User = Depends(get_current_user),
    service: PerformanceTestingService = Depends(get_performance_service)
):
    """Compare two tests"""
    return await service.compare_tests(test1, test2)

@router.get("/trends", response_model=List[Any])
async def get_trends(
    project_id: UUID,
    days: int = 30,
    current_user: User = Depends(get_current_user),
    service: PerformanceTestingService = Depends(get_performance_service)
):
    """Get historical trends"""
    return await service.get_trends(project_id, days)

@router.get("/tests/{test_id}/report")
async def get_report(
    test_id: UUID,
    format: str = "pdf",
    current_user: User = Depends(get_current_user),
    service: PerformanceTestingService = Depends(get_performance_service)
):
    """Get test report"""
    content = await service.generate_report(test_id, format)
    
    if format == "json":
        return Response(content=content, media_type="application/json")
    elif format == "html":
        return Response(content=content, media_type="text/html")
    else:
        return Response(
            content=content.encode("utf-8"), 
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=report_{test_id}.pdf"}
        )

@router.post("/schedules", status_code=status.HTTP_201_CREATED)
async def schedule_test(
    project_id: UUID,
    config: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    service: PerformanceTestingService = Depends(get_performance_service)
):
    """Schedule a test"""
    schedule = await service.create_schedule(project_id, current_user.id, config)
    return {"id": str(schedule.id), "next_run": "2024-01-01T00:00:00Z"} # Mock next run

@router.get("/tests/{test_id}/ai-analysis")
async def get_ai_analysis(
    test_id: UUID,
    current_user: User = Depends(get_current_user),
    service: PerformanceTestingService = Depends(get_performance_service)
):
    """Get AI analysis for a test"""
    test = await service.get_test(test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
        
    return {
        "summary": test.ai_analysis,
        "risk_level": test.ai_risk_level,
        "recommendations": test.ai_recommendations,
        "bottlenecks": [], # If available
        "optimization_score": 85 # Mock
    }
