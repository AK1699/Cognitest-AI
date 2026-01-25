"""
Enterprise Performance Testing Module Schemas
API request/response validation schemas for performance testing
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

import enum

class TestType(str, enum.Enum):
    """Type of performance test"""
    LIGHTHOUSE = "lighthouse"
    LOAD = "load"
    STRESS = "stress"
    SPIKE = "spike"
    ENDURANCE = "endurance"
    API = "api"
    VOLUME = "volume"
    SCALABILITY = "scalability"
    CAPACITY = "capacity"
    BASELINE = "baseline"

class TestStatus(str, enum.Enum):
    """Status of a performance test"""
    PENDING = "pending"
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    STOPPED = "stopped"

class LoadProfile(str, enum.Enum):
    """Load profile patterns for load testing"""
    CONSTANT = "constant"
    RAMP_UP = "ramp_up"
    RAMP_DOWN = "ramp_down"
    SPIKE = "spike"
    STEP = "step"
    CUSTOM = "custom"

class DeviceType(str, enum.Enum):
    """Device type for Lighthouse testing"""
    MOBILE = "mobile"
    DESKTOP = "desktop"

class ConnectionType(str, enum.Enum):
    """Connection throttling for testing"""
    CABLE = "cable"
    DSL = "dsl"
    SLOW_3G = "slow_3g"
    FAST_3G = "fast_3g"
    LTE = "lte"
    NO_THROTTLE = "no_throttle"

class TestProvider(str, enum.Enum):
    """External test provider/service used"""
    PAGESPEED_INSIGHTS = "pagespeed_insights"
    WEBPAGETEST = "webpagetest"
    GTMETRIX = "gtmetrix"
    LOADER_IO = "loader_io"
    K6_CLOUD = "k6_cloud"
    ARTILLERY = "artillery"
    LOCAL = "local"

class ScheduleFrequency(str, enum.Enum):
    """Test schedule frequency"""
    ONCE = "once"
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    CUSTOM = "custom"

class AlertSeverity(str, enum.Enum):
    """Performance alert severity"""
    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"


# ============================================================================
# Performance Test Schemas
# ============================================================================

class PerformanceTestCreate(BaseModel):
    """Create a new performance test"""
    name: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    test_type: TestType
    
    # Target
    target_url: str = Field(..., min_length=1, max_length=2000)
    target_method: str = Field(default="GET")
    target_headers: Dict[str, str] = Field(default_factory=dict)
    target_body: Optional[str] = None
    
    # Lighthouse/Web Performance Options
    device_type: Optional[DeviceType] = DeviceType.MOBILE
    connection_type: Optional[ConnectionType] = ConnectionType.CABLE
    test_location: str = Field(default="us-central1")
    
    # Load Test Options
    virtual_users: int = Field(default=10, ge=1, le=10000)
    duration_seconds: int = Field(default=60, ge=1, le=3600)
    ramp_up_seconds: int = Field(default=10, ge=0, le=300)
    ramp_down_seconds: int = Field(default=10, ge=0, le=300)
    load_profile: Optional[LoadProfile] = LoadProfile.RAMP_UP
    stages: Optional[List[Dict[str, int]]] = None  # [{duration: 30, target: 50}]
    
    # Thresholds
    thresholds: Dict[str, float] = Field(default_factory=dict)
    
    # Metadata
    tags: List[str] = Field(default_factory=list)
    notes: Optional[str] = None


class PerformanceTestUpdate(BaseModel):
    """Update an existing performance test"""
    name: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    thresholds: Optional[Dict[str, float]] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None


class PerformanceTestResponse(BaseModel):
    """Response schema for performance test"""
    id: UUID
    project_id: UUID
    organisation_id: UUID
    human_id: Optional[str]
    name: str
    description: Optional[str]
    test_type: TestType
    
    # Target
    target_url: str
    target_method: str
    target_headers: Dict[str, str]
    target_body: Optional[str]
    
    # Status
    status: TestStatus
    progress_percentage: int
    
    # Provider
    provider: Optional[TestProvider]
    provider_test_id: Optional[str]
    
    # Config
    device_type: Optional[DeviceType]
    connection_type: Optional[ConnectionType]
    test_location: Optional[str]
    virtual_users: int
    duration_seconds: int
    ramp_up_seconds: int
    ramp_down_seconds: int
    load_profile: Optional[LoadProfile]
    stages: Optional[List[Dict[str, int]]]
    
    # Thresholds
    thresholds: Dict[str, float]
    threshold_passed: Optional[bool]
    
    # Performance
    duration_ms: Optional[int]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    
    # Error
    error_message: Optional[str]
    
    # AI Analysis
    ai_analysis: Optional[str]
    ai_recommendations: Optional[List[Dict[str, Any]]] = []
    ai_risk_level: Optional[str]
    
    # Metadata
    tags: List[str]
    notes: Optional[str]
    triggered_by: Optional[UUID]
    trigger_source: str
    
    # Timestamps
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class PerformanceTestDetailResponse(PerformanceTestResponse):
    """Detailed response including metrics"""
    metrics: Optional["PerformanceMetricsResponse"] = None
    executions: List["TestExecutionResponse"] = []
    alerts: List["PerformanceAlertResponse"] = []


class PerformanceTestListResponse(BaseModel):
    """Paginated list of performance tests"""
    items: List[PerformanceTestResponse]
    total: int
    page: int
    page_size: int
    pages: int


# ============================================================================
# Performance Metrics Schemas
# ============================================================================

class PerformanceMetricsResponse(BaseModel):
    """Response schema for performance metrics"""
    id: UUID
    test_id: UUID
    
    # Lighthouse Scores (0-100)
    performance_score: Optional[float]
    accessibility_score: Optional[float]
    seo_score: Optional[float]
    best_practices_score: Optional[float]
    pwa_score: Optional[float]
    
    # Core Web Vitals (ms)
    largest_contentful_paint: Optional[float]
    first_input_delay: Optional[float]
    cumulative_layout_shift: Optional[float]
    first_contentful_paint: Optional[float]
    time_to_first_byte: Optional[float]
    
    # Additional Lighthouse
    speed_index: Optional[float]
    time_to_interactive: Optional[float]
    total_blocking_time: Optional[float]
    
    # Page Resources
    total_byte_weight: Optional[int]
    total_requests: Optional[int]
    dom_size: Optional[int]
    
    # Opportunities
    opportunities: List[Dict[str, Any]]
    diagnostics: List[Dict[str, Any]]
    
    # Load Test Metrics
    total_requests_made: Optional[int]
    requests_per_second: Optional[float]
    
    # Latency (ms)
    latency_min: Optional[float]
    latency_max: Optional[float]
    latency_avg: Optional[float]
    latency_p50: Optional[float]
    latency_p75: Optional[float]
    latency_p90: Optional[float]
    latency_p95: Optional[float]
    latency_p99: Optional[float]
    
    # Throughput
    data_received_bytes: Optional[int]
    data_sent_bytes: Optional[int]
    throughput_bytes_per_second: Optional[float]
    
    # Errors
    error_count: int
    error_rate: float
    errors_by_type: Dict[str, int]
    
    # VU
    max_virtual_users: Optional[int]
    
    # Time Series (for charts)
    virtual_users_timeline: List[Dict[str, Any]]
    latency_timeline: List[Dict[str, Any]]
    rps_timeline: List[Dict[str, Any]]
    errors_timeline: List[Dict[str, Any]]
    
    # WebPageTest
    waterfall_url: Optional[str]
    filmstrip_url: Optional[str]
    screenshot_url: Optional[str]
    video_url: Optional[str]
    start_render_ms: Optional[float]
    visually_complete_ms: Optional[float]
    
    # Timestamps
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# ============================================================================
# Test Execution Schemas
# ============================================================================

class TestExecutionResponse(BaseModel):
    """Response schema for test execution history"""
    id: UUID
    test_id: UUID
    human_id: Optional[str]
    run_number: int
    status: TestStatus
    
    # Timing
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    duration_ms: Optional[int]
    
    # Key Metrics
    performance_score: Optional[float]
    latency_p95: Optional[float]
    requests_per_second: Optional[float]
    error_rate: Optional[float]
    
    # Thresholds
    threshold_passed: Optional[bool]
    threshold_details: Dict[str, Any]
    
    # Provider
    provider: Optional[TestProvider]
    provider_test_id: Optional[str]
    provider_report_url: Optional[str]
    
    # Error
    error_message: Optional[str]
    
    # Trigger
    triggered_by: Optional[UUID]
    trigger_source: str
    
    created_at: datetime

    class Config:
        from_attributes = True


class TestExecutionListResponse(BaseModel):
    """Paginated list of test executions"""
    items: List[TestExecutionResponse]
    total: int
    page: int
    page_size: int
    pages: int


# ============================================================================
# Performance Alert Schemas
# ============================================================================

class PerformanceAlertResponse(BaseModel):
    """Response schema for performance alerts"""
    id: UUID
    test_id: UUID
    execution_id: Optional[UUID]
    project_id: UUID
    
    severity: AlertSeverity
    title: str
    message: str
    
    metric_name: str
    threshold_value: float
    actual_value: float
    
    is_acknowledged: bool
    acknowledged_by: Optional[UUID]
    acknowledged_at: Optional[datetime]
    
    created_at: datetime

    class Config:
        from_attributes = True


class AcknowledgeAlertRequest(BaseModel):
    """Request to acknowledge an alert"""
    notes: Optional[str] = None


# ============================================================================
# Quick Scan Schemas
# ============================================================================

class LighthouseScanRequest(BaseModel):
    """Quick Lighthouse scan request"""
    target_url: str = Field(..., min_length=1, max_length=2000)
    device_type: DeviceType = DeviceType.MOBILE
    connection_type: ConnectionType = ConnectionType.CABLE
    categories: List[str] = Field(default=["performance", "accessibility", "seo", "best-practices"])


class LoadTestRequest(BaseModel):
    """Quick load test request"""
    target_url: str = Field(..., min_length=1, max_length=2000)
    target_method: str = Field(default="GET")
    target_headers: Dict[str, str] = Field(default_factory=dict)
    target_body: Optional[str] = None
    
    virtual_users: int = Field(default=10, ge=1, le=1000)
    duration_seconds: int = Field(default=60, ge=1, le=3600)  # Increased max duration
    ramp_up_seconds: int = Field(default=10, ge=0, le=60)
    
    # Thresholds for pass/fail
    max_p95_latency_ms: Optional[float] = None
    max_error_rate: Optional[float] = None


class SoakTestRequest(BaseModel):
    """Quick soak/endurance test request"""
    target_url: str = Field(..., min_length=1, max_length=2000)
    target_method: str = Field(default="GET")
    target_headers: Dict[str, str] = Field(default_factory=dict)
    target_body: Optional[str] = None
    
    virtual_users: int = Field(default=50, ge=1, le=1000)
    duration_seconds: int = Field(default=3600, ge=300, le=86400) # Min 5 mins, Max 24 hours
    ramp_up_seconds: int = Field(default=60, ge=0, le=600)
    
    max_p95_latency_ms: Optional[float] = None
    max_error_rate: Optional[float] = None


class SpikeTestRequest(BaseModel):
    """Quick spike test request"""
    target_url: str = Field(..., min_length=1, max_length=2000)
    target_method: str = Field(default="GET")
    target_headers: Dict[str, str] = Field(default_factory=dict)
    
    base_users: int = Field(default=10, ge=1, le=500)
    spike_users: int = Field(default=100, ge=10, le=2000)
    spike_duration_seconds: int = Field(default=30, ge=5, le=300)
    total_duration_seconds: int = Field(default=120, ge=30, le=600)


class StressTestRequest(BaseModel):
    """Quick stress test request"""
    target_url: str = Field(..., min_length=1, max_length=2000)
    target_method: str = Field(default="GET")
    target_headers: Dict[str, str] = Field(default_factory=dict)
    
    start_vus: int = Field(default=10, ge=1, le=100)
    max_vus: int = Field(default=200, ge=10, le=1000)
    step_duration_seconds: int = Field(default=30, ge=1, le=300)
    step_increase: int = Field(default=20, ge=5, le=100)


# ============================================================================
# Schedule Schemas
# ============================================================================

class PerformanceScheduleCreate(BaseModel):
    """Create a performance test schedule"""
    name: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    
    test_type: TestType
    target_url: str = Field(..., min_length=1, max_length=2000)
    test_config: Dict[str, Any] = Field(default_factory=dict)
    
    frequency: ScheduleFrequency
    cron_expression: Optional[str] = None
    timezone: str = Field(default="UTC")
    
    is_enabled: bool = True
    notify_on_complete: bool = True
    notify_on_failure: bool = True
    notify_on_threshold_breach: bool = True
    notification_emails: List[str] = Field(default_factory=list)
    notification_slack_webhook: Optional[str] = None


class PerformanceScheduleUpdate(BaseModel):
    """Update performance schedule"""
    name: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    test_config: Optional[Dict[str, Any]] = None
    frequency: Optional[ScheduleFrequency] = None
    cron_expression: Optional[str] = None
    timezone: Optional[str] = None
    is_enabled: Optional[bool] = None
    notify_on_complete: Optional[bool] = None
    notify_on_failure: Optional[bool] = None
    notify_on_threshold_breach: Optional[bool] = None
    notification_emails: Optional[List[str]] = None
    notification_slack_webhook: Optional[str] = None


class PerformanceScheduleResponse(BaseModel):
    """Response schema for performance schedule"""
    id: UUID
    project_id: UUID
    organisation_id: UUID
    name: str
    description: Optional[str]
    test_type: TestType
    target_url: str
    test_config: Dict[str, Any]
    frequency: ScheduleFrequency
    cron_expression: Optional[str]
    timezone: str
    is_enabled: bool
    last_run_at: Optional[datetime]
    next_run_at: Optional[datetime]
    last_test_id: Optional[UUID]
    total_runs: int
    notify_on_complete: bool
    notify_on_failure: bool
    notify_on_threshold_breach: bool
    notification_emails: List[str]
    notification_slack_webhook: Optional[str]
    created_by: Optional[UUID]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# ============================================================================
# Report Schemas
# ============================================================================

class GenerateReportRequest(BaseModel):
    """Request to generate a performance report"""
    format: str = Field(default="pdf")  # pdf, html, json
    include_ai_analysis: bool = True
    include_recommendations: bool = True
    include_charts: bool = True


class PerformanceReportResponse(BaseModel):
    """Response schema for generated report"""
    id: UUID
    test_id: UUID
    project_id: UUID
    title: str
    format: str
    share_token: Optional[str]
    is_public: bool
    expires_at: Optional[datetime]
    file_path: Optional[str]
    file_size_bytes: Optional[int]
    generated_by: Optional[UUID]
    download_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class ShareReportRequest(BaseModel):
    """Request to create shareable link"""
    is_public: bool = True
    expires_in_days: Optional[int] = Field(default=7, ge=1, le=90)


# ============================================================================
# Dashboard & Statistics Schemas
# ============================================================================

class PerformanceDashboardStats(BaseModel):
    """Performance dashboard statistics"""
    project_id: UUID
    
    # Overview
    total_tests: int
    tests_last_7_days: int
    tests_last_30_days: int
    
    # Success Rates
    pass_rate: float
    avg_performance_score: Optional[float]
    
    # Load Test Stats
    avg_latency_p95: Optional[float]
    avg_rps: Optional[float]
    avg_error_rate: Optional[float]
    
    # Trends
    performance_trend: str  # improving, stable, declining
    
    # Recent Activity
    recent_tests: List[PerformanceTestResponse]
    active_tests: int
    scheduled_tests: int
    
    # Alerts
    active_alerts: int
    critical_alerts: int


class PerformanceTrendResponse(BaseModel):
    """Performance trends over time"""
    period: str  # daily, weekly, monthly
    metric: str  # performance_score, latency_p95, rps, error_rate
    data_points: List[Dict[str, Any]]  # [{date, value, test_id}]


class ComparisonRequest(BaseModel):
    """Request to compare multiple test runs"""
    test_ids: List[UUID] = Field(..., min_items=2, max_items=5)
    metrics: List[str] = Field(default=["performance_score", "latency_p95", "error_rate"])


class ComparisonResponse(BaseModel):
    """Comparison between test runs"""
    tests: List[Dict[str, Any]]  # Test details
    metrics: Dict[str, List[Dict[str, Any]]]  # {metric: [{test_id, value, delta}]}
    summary: Dict[str, Any]  # Best/worst performers


# ============================================================================
# AI Analysis Schemas
# ============================================================================

class AIAnalysisRequest(BaseModel):
    """Request AI analysis of test results"""
    include_recommendations: bool = True
    include_bottleneck_analysis: bool = True
    include_risk_assessment: bool = True


class AIAnalysisResponse(BaseModel):
    """AI-powered analysis of performance test"""
    test_id: UUID
    
    # Executive Summary
    summary: str
    
    # Bottlenecks
    bottlenecks: List[Dict[str, Any]]  # [{issue, impact, priority}]
    
    # Recommendations
    recommendations: List[Dict[str, Any]]  # [{title, description, expected_impact, effort}]
    
    # Risk Assessment
    risk_level: str  # low, medium, high, critical
    risk_factors: List[str]
    
    # Production Readiness
    is_production_ready: bool
    blockers: List[str]
    
    generated_at: datetime


# Update forward references
PerformanceTestDetailResponse.model_rebuild()
