"""
Web Automation Module Schemas
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

from app.models.web_automation import (
    BrowserType, ExecutionMode, TestFlowStatus, 
    ExecutionRunStatus, StepStatus, HealingType, HealingStrategy
)


# Test Flow Schemas
class TestFlowCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    base_url: str = Field(default="")
    flow_json: Dict[str, Any] = Field(default_factory=dict)
    nodes: List[Dict[str, Any]] = Field(default_factory=list)
    edges: List[Dict[str, Any]] = Field(default_factory=list)
    viewport: Dict[str, Any] = Field(default_factory=dict)
    default_browser: BrowserType = BrowserType.CHROME
    default_mode: ExecutionMode = ExecutionMode.HEADED
    timeout: int = Field(default=30000, ge=1000, le=300000)
    retry_policy: str = Field(default="exponential")
    max_retries: int = Field(default=3, ge=0, le=10)
    healing_enabled: bool = True
    auto_update_selectors: bool = False
    healing_confidence_threshold: float = Field(default=0.75, ge=0.0, le=1.0)
    browser_options: Dict[str, Any] = Field(default_factory=dict)
    tags: List[str] = Field(default_factory=list)
    category: Optional[str] = None
    version: str = Field(default="1.0.0")


class TestFlowUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    status: Optional[TestFlowStatus] = None
    base_url: Optional[str] = None
    flow_json: Optional[Dict[str, Any]] = None
    nodes: Optional[List[Dict[str, Any]]] = None
    edges: Optional[List[Dict[str, Any]]] = None
    viewport: Optional[Dict[str, Any]] = None
    default_browser: Optional[BrowserType] = None
    default_mode: Optional[ExecutionMode] = None
    timeout: Optional[int] = Field(None, ge=1000, le=300000)
    retry_policy: Optional[str] = None
    max_retries: Optional[int] = Field(None, ge=0, le=10)
    healing_enabled: Optional[bool] = None
    auto_update_selectors: Optional[bool] = None
    healing_confidence_threshold: Optional[float] = Field(None, ge=0.0, le=1.0)
    browser_options: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    category: Optional[str] = None
    version: Optional[str] = None


class TestFlowResponse(BaseModel):
    id: UUID
    project_id: UUID
    organisation_id: UUID
    name: str
    description: Optional[str]
    status: TestFlowStatus
    base_url: str
    flow_json: Dict[str, Any]
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    viewport: Dict[str, Any]
    default_browser: BrowserType
    default_mode: ExecutionMode
    timeout: int
    retry_policy: str
    max_retries: int
    healing_enabled: bool
    auto_update_selectors: bool
    healing_confidence_threshold: float
    browser_options: Dict[str, Any]
    tags: List[str]
    category: Optional[str]
    version: str
    total_executions: int
    successful_executions: int
    failed_executions: int
    average_duration: int
    healing_success_rate: float
    created_at: datetime
    updated_at: Optional[datetime]
    created_by: Optional[UUID]
    last_executed_at: Optional[datetime]

    class Config:
        from_attributes = True


# Execution Schemas
class ExecutionRunCreate(BaseModel):
    browser_type: Optional[BrowserType] = None
    execution_mode: Optional[ExecutionMode] = None
    tags: List[str] = Field(default_factory=list)
    notes: Optional[str] = None
    trigger_source: str = Field(default="manual")


class ExecutionRunResponse(BaseModel):
    id: UUID
    test_flow_id: UUID
    project_id: UUID
    browser_type: BrowserType
    execution_mode: ExecutionMode
    status: ExecutionRunStatus
    total_steps: int
    passed_steps: int
    failed_steps: int
    skipped_steps: int
    healed_steps: int
    duration_ms: Optional[int]
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    execution_environment: Dict[str, Any]
    video_url: Optional[str]
    trace_url: Optional[str]
    screenshots_dir: Optional[str]
    error_message: Optional[str]
    error_stack: Optional[str]
    triggered_by: Optional[UUID]
    trigger_source: Optional[str]
    tags: List[str]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ExecutionRunDetailResponse(ExecutionRunResponse):
    step_results: List["StepResultResponse"] = []
    healing_events: List["HealingEventResponse"] = []


# Step Result Schemas
class StepResultResponse(BaseModel):
    id: UUID
    execution_run_id: UUID
    step_id: str
    step_name: Optional[str]
    step_type: str
    step_order: int
    status: StepStatus
    selector_used: Optional[Dict[str, Any]]
    action_details: Dict[str, Any]
    actual_result: Optional[str]
    expected_result: Optional[str]
    error_message: Optional[str]
    error_stack: Optional[str]
    duration_ms: Optional[int]
    retry_count: int
    screenshot_url: Optional[str]
    screenshot_before_url: Optional[str]
    screenshot_after_url: Optional[str]
    was_healed: bool
    healing_applied: Optional[Dict[str, Any]]
    console_logs: List[Dict[str, Any]]
    network_logs: List[Dict[str, Any]]
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


# Healing Event Schemas
class HealingEventResponse(BaseModel):
    id: UUID
    execution_run_id: UUID
    step_result_id: Optional[UUID]
    healing_type: HealingType
    strategy: HealingStrategy
    original_value: str
    healed_value: str
    step_id: str
    step_type: str
    failure_reason: Optional[str]
    success: bool
    confidence_score: Optional[float]
    retry_attempts: int
    ai_model: Optional[str]
    ai_reasoning: Optional[str]
    alternatives_tried: List[Dict[str, Any]]
    page_url: Optional[str]
    page_title: Optional[str]
    healing_duration_ms: Optional[int]
    recorded_at: datetime

    class Config:
        from_attributes = True


# Execution Request Schemas
class MultiBrowserExecutionRequest(BaseModel):
    browsers: List[BrowserType] = Field(..., min_items=1)
    execution_mode: ExecutionMode = ExecutionMode.HEADLESS
    parallel: bool = True
    tags: List[str] = Field(default_factory=list)
    notes: Optional[str] = None


class StopExecutionRequest(BaseModel):
    reason: Optional[str] = None


# Healing Suggestion Schemas
class LocatorHealingRequest(BaseModel):
    original_selector: str
    selector_strategy: str
    dom_snapshot: str
    page_url: str
    element_context: Dict[str, Any] = Field(default_factory=dict)
    failed_alternatives: List[Dict[str, Any]] = Field(default_factory=list)


class LocatorHealingSuggestion(BaseModel):
    suggested_selector: str
    strategy: HealingStrategy
    confidence_score: float
    reasoning: str
    alternatives: List[Dict[str, Any]] = Field(default_factory=list)


class AssertionHealingRequest(BaseModel):
    assertion_type: str
    expected_value: str
    actual_value: str
    selector: str
    tolerance: Optional[float] = None
    context: Dict[str, Any] = Field(default_factory=dict)


class AssertionHealingSuggestion(BaseModel):
    should_update: bool
    new_expected_value: Optional[str] = None
    confidence_score: float
    reasoning: str
    is_legitimate_change: bool


# Analytics Schemas
class HealingReportResponse(BaseModel):
    execution_run_id: UUID
    total_healings: int
    successful_healings: int
    failed_healings: int
    by_type: Dict[str, int]
    by_strategy: Dict[str, int]
    success_rate: float
    average_confidence: float
    timeline: List[Dict[str, Any]]


class TestFlowAnalytics(BaseModel):
    test_flow_id: UUID
    total_executions: int
    success_rate: float
    average_duration_ms: int
    healing_statistics: Dict[str, Any]
    browser_statistics: Dict[str, int]
    trend_data: List[Dict[str, Any]]


# Live Preview Schemas
class LiveUpdateMessage(BaseModel):
    type: str  # stepComplete, screenUpdate, console, locatorFound, assertion
    execution_run_id: UUID
    step_id: Optional[str] = None
    payload: Dict[str, Any]
    timestamp: datetime


# Locator Alternative Schemas
class LocatorAlternativeCreate(BaseModel):
    step_id: str
    element_identifier: str
    primary_selector: str
    primary_strategy: str
    alternatives: List[Dict[str, Any]] = Field(default_factory=list)
    element_attributes: Dict[str, Any] = Field(default_factory=dict)
    element_context: Dict[str, Any] = Field(default_factory=dict)
    page_url_pattern: Optional[str] = None


class LocatorAlternativeResponse(BaseModel):
    id: UUID
    test_flow_id: UUID
    step_id: str
    element_identifier: str
    primary_selector: str
    primary_strategy: str
    alternatives: List[Dict[str, Any]]
    success_count: int
    failure_count: int
    last_successful_selector: Optional[str]
    last_failed_at: Optional[datetime]
    element_attributes: Dict[str, Any]
    element_context: Dict[str, Any]
    page_url_pattern: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# Update forward references
ExecutionRunDetailResponse.model_rebuild()
