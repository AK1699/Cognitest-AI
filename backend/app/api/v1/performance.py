"""
Performance Testing API Proxy
Proxies requests to the standalone performance-testing microservice
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks, Request
from fastapi.responses import StreamingResponse
import httpx
import os
from typing import List, Optional
from uuid import UUID

from app.api.v1.auth import get_current_user
from app.models.user import User
from app.schemas.performance import (
    PerformanceTestCreate, PerformanceTestUpdate, PerformanceTestResponse,
    PerformanceTestDetailResponse, PerformanceTestListResponse,
    PerformanceMetricsResponse, TestExecutionListResponse,
    PerformanceAlertResponse, AcknowledgeAlertRequest,
    LighthouseScanRequest, LoadTestRequest, StressTestRequest,
    PerformanceDashboardStats, PerformanceTrendResponse
)

router = APIRouter()

# Microservice URL
PERFORMANCE_SERVICE_URL = os.getenv("PERFORMANCE_SERVICE_URL", "http://localhost:8005")

async def proxy_request(
    method: str, 
    path: str, 
    user_id: str, 
    params: Optional[dict] = None, 
    json_data: Optional[dict] = None
):
    """Generic proxy helper"""
    async with httpx.AsyncClient() as client:
        url = f"{PERFORMANCE_SERVICE_URL}/api/v1/performance{path}"
        headers = {"X-User-ID": user_id}
        
        try:
            response = await client.request(
                method=method,
                url=url,
                params=params,
                json=json_data,
                headers=headers,
                timeout=30.0
            )
            
            if response.status_code >= 400:
                try:
                    detail = response.json().get("detail", "Error from performance service")
                except:
                    detail = "Error from performance service"
                raise HTTPException(status_code=response.status_code, detail=detail)
                
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Performance service unavailable: {str(e)}")


@router.post("/tests", response_model=PerformanceTestResponse, status_code=status.HTTP_201_CREATED)
async def create_performance_test(
    project_id: UUID,
    test_data: PerformanceTestCreate,
    current_user: User = Depends(get_current_user)
):
    """Proxy to performance-testing service"""
    return await proxy_request(
        "POST", 
        "/tests", 
        str(current_user.id), 
        params={"project_id": str(project_id)}, 
        json_data=test_data.model_dump()
    )


@router.get("/tests", response_model=PerformanceTestListResponse)
async def list_performance_tests(
    project_id: UUID,
    test_type: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    """Proxy to performance-testing service"""
    params = {
        "project_id": str(project_id),
        "test_type": test_type,
        "status": status_filter,
        "page": page,
        "page_size": page_size
    }
    return await proxy_request("GET", "/tests", str(current_user.id), params=params)


@router.get("/tests/{test_id}", response_model=PerformanceTestDetailResponse)
async def get_performance_test(
    test_id: UUID,
    current_user: User = Depends(get_current_user)
):
    """Proxy to performance-testing service"""
    return await proxy_request("GET", f"/tests/{test_id}", str(current_user.id))


@router.post("/tests/{test_id}/execute", response_model=PerformanceTestResponse)
async def execute_performance_test(
    test_id: UUID,
    current_user: User = Depends(get_current_user)
):
    """Proxy to performance-testing service"""
    return await proxy_request("POST", f"/tests/{test_id}/execute", str(current_user.id))


@router.get("/dashboard/{project_id}/stats", response_model=PerformanceDashboardStats)
async def get_dashboard_stats(
    project_id: UUID,
    current_user: User = Depends(get_current_user)
):
    """Proxy to performance-testing service"""
    return await proxy_request("GET", f"/dashboard/{project_id}/stats", str(current_user.id))


@router.get("/tests/{test_id}/stream")
async def stream_test_progress(
    test_id: UUID,
    current_user: User = Depends(get_current_user)
):
    """Direct stream from performance-testing service"""
    # This might need special handling for SSE, but for now we'll just redirect or use httpx stream
    async def event_generator():
        async with httpx.AsyncClient() as client:
            url = f"{PERFORMANCE_SERVICE_URL}/api/v1/performance/tests/{test_id}/stream"
            headers = {"X-User-ID": str(current_user.id)}
            
            async with client.stream("GET", url, headers=headers, timeout=None) as response:
                async for line in response.aiter_lines():
                    if line:
                        yield line + "\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )
