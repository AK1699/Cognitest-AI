"""
Enterprise Performance Testing Module Models
Comprehensive load testing, stress testing, and web performance analytics
"""
from sqlalchemy import Column, String, DateTime, JSON, Text, ForeignKey, Enum as SQLEnum, Boolean, Integer, Float, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


# ============================================================================
# Enums
# ============================================================================

class TestType(str, enum.Enum):
    """Type of performance test"""
    LIGHTHOUSE = "lighthouse"           # Web page performance (Core Web Vitals)
    LOAD = "load"                       # Steady load testing
    STRESS = "stress"                   # Ramp up until failure
    SPIKE = "spike"                     # Sudden traffic bursts
    ENDURANCE = "endurance"             # Sustained load over time
    API = "api"                         # API endpoint performance


class TestStatus(str, enum.Enum):
    """Status of a performance test"""
    PENDING = "pending"
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class LoadProfile(str, enum.Enum):
    """Load profile patterns for load testing"""
    CONSTANT = "constant"               # Steady VU count
    RAMP_UP = "ramp_up"                 # Gradual increase
    RAMP_DOWN = "ramp_down"             # Gradual decrease
    SPIKE = "spike"                     # Sudden burst
    STEP = "step"                       # Step increases
    CUSTOM = "custom"                   # Custom staging


class DeviceType(str, enum.Enum):
    """Device type for Lighthouse testing"""
    MOBILE = "mobile"
    DESKTOP = "desktop"


class ConnectionType(str, enum.Enum):
    """Connection throttling for testing"""
    CABLE = "cable"                     # Fast connection
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
# Models
# ============================================================================

class PerformanceTest(Base):
    """
    Performance Test - Main entity for any type of performance test
    Supports: Lighthouse, Load, Stress, Spike, Endurance, API tests
    """
    __tablename__ = "performance_tests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False)
    
    # Human-friendly ID for display (PERF-XXXXX)
    human_id = Column(String(15), unique=True, nullable=True)

    # Test Identification
    name = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    test_type = Column(SQLEnum(TestType, values_callable=lambda x: [e.value for e in x]), nullable=False)
    
    # Target Configuration
    target_url = Column(String(2000), nullable=False)
    target_method = Column(String(10), default="GET")  # GET, POST, PUT, DELETE
    target_headers = Column(JSON, default=dict)
    target_body = Column(Text, nullable=True)
    
    # Status & Progress
    status = Column(SQLEnum(TestStatus, values_callable=lambda x: [e.value for e in x]), default=TestStatus.PENDING)
    progress_percentage = Column(Integer, default=0)
    
    # Provider Configuration
    provider = Column(SQLEnum(TestProvider, values_callable=lambda x: [e.value for e in x]), nullable=True)
    provider_test_id = Column(String(255), nullable=True)  # External test ID
    
    # Lighthouse Specific
    device_type = Column(SQLEnum(DeviceType, values_callable=lambda x: [e.value for e in x]), nullable=True)
    connection_type = Column(SQLEnum(ConnectionType, values_callable=lambda x: [e.value for e in x]), nullable=True)
    test_location = Column(String(100), default="us-central1")  # For WebPageTest
    
    # Load Test Specific
    virtual_users = Column(Integer, default=10)
    duration_seconds = Column(Integer, default=60)
    ramp_up_seconds = Column(Integer, default=10)
    ramp_down_seconds = Column(Integer, default=10)
    load_profile = Column(SQLEnum(LoadProfile, values_callable=lambda x: [e.value for e in x]), nullable=True)
    stages = Column(JSON, nullable=True)  # Custom stages: [{duration, target}]
    
    # Thresholds for Pass/Fail
    thresholds = Column(JSON, default=dict)  # {p95: 500, error_rate: 0.01}
    threshold_passed = Column(Boolean, nullable=True)
    
    # Performance Metrics
    duration_ms = Column(Integer, nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Error Handling
    error_message = Column(Text, nullable=True)
    error_details = Column(JSON, nullable=True)
    
    # AI Analysis
    ai_analysis = Column(Text, nullable=True)
    ai_recommendations = Column(JSON, default=list)
    ai_risk_level = Column(String(20), nullable=True)  # low, medium, high, critical
    
    # Metadata
    tags = Column(JSON, default=list)
    notes = Column(Text, nullable=True)
    triggered_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    trigger_source = Column(String(100), default="manual")  # manual, scheduled, ci, api
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    project = relationship("Project")
    organisation = relationship("Organisation")
    triggered_by_user = relationship("User", foreign_keys=[triggered_by])
    metrics = relationship("PerformanceMetrics", back_populates="test", cascade="all, delete-orphan", uselist=False)
    executions = relationship("TestExecution", back_populates="test", cascade="all, delete-orphan")
    alerts = relationship("PerformanceAlert", back_populates="test", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index('ix_performance_tests_project_id', 'project_id'),
        Index('ix_performance_tests_organisation_id', 'organisation_id'),
        Index('ix_performance_tests_status', 'status'),
        Index('ix_performance_tests_test_type', 'test_type'),
        Index('ix_performance_tests_created_at', 'created_at'),
    )


class PerformanceMetrics(Base):
    """
    Performance Metrics - Detailed metrics from a test run
    Stores both Lighthouse (Core Web Vitals) and Load Test metrics
    """
    __tablename__ = "performance_metrics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    test_id = Column(UUID(as_uuid=True), ForeignKey("performance_tests.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    # ======= Lighthouse / Web Vitals Metrics =======
    # Score (0-100)
    performance_score = Column(Float, nullable=True)
    accessibility_score = Column(Float, nullable=True)
    seo_score = Column(Float, nullable=True)
    best_practices_score = Column(Float, nullable=True)
    pwa_score = Column(Float, nullable=True)
    
    # Core Web Vitals (milliseconds)
    largest_contentful_paint = Column(Float, nullable=True)  # LCP
    first_input_delay = Column(Float, nullable=True)         # FID
    cumulative_layout_shift = Column(Float, nullable=True)   # CLS
    first_contentful_paint = Column(Float, nullable=True)    # FCP
    time_to_first_byte = Column(Float, nullable=True)        # TTFB
    
    # Additional Lighthouse Metrics
    speed_index = Column(Float, nullable=True)
    time_to_interactive = Column(Float, nullable=True)
    total_blocking_time = Column(Float, nullable=True)
    
    # Page Resources
    total_byte_weight = Column(Integer, nullable=True)
    total_requests = Column(Integer, nullable=True)
    dom_size = Column(Integer, nullable=True)
    
    # Opportunities and Diagnostics
    opportunities = Column(JSON, default=list)  # [{title, description, savings_ms}]
    diagnostics = Column(JSON, default=list)
    
    # ======= Load Test Metrics =======
    # Request Metrics
    total_requests_made = Column(Integer, nullable=True)
    requests_per_second = Column(Float, nullable=True)
    
    # Latency Metrics (milliseconds)
    latency_min = Column(Float, nullable=True)
    latency_max = Column(Float, nullable=True)
    latency_avg = Column(Float, nullable=True)
    latency_p50 = Column(Float, nullable=True)
    latency_p75 = Column(Float, nullable=True)
    latency_p90 = Column(Float, nullable=True)
    latency_p95 = Column(Float, nullable=True)
    latency_p99 = Column(Float, nullable=True)
    
    # Throughput
    data_received_bytes = Column(Integer, nullable=True)
    data_sent_bytes = Column(Integer, nullable=True)
    throughput_bytes_per_second = Column(Float, nullable=True)
    
    # Error Metrics
    error_count = Column(Integer, default=0)
    error_rate = Column(Float, default=0.0)
    errors_by_type = Column(JSON, default=dict)  # {timeout: 5, 500: 2, 502: 1}
    
    # Virtual Users
    max_virtual_users = Column(Integer, nullable=True)
    virtual_users_timeline = Column(JSON, default=list)  # [{timestamp, vus}]
    
    # Time Series Data
    latency_timeline = Column(JSON, default=list)   # [{timestamp, p50, p95, p99}]
    rps_timeline = Column(JSON, default=list)       # [{timestamp, rps}]
    errors_timeline = Column(JSON, default=list)    # [{timestamp, count}]
    
    # ======= WebPageTest Specific =======
    waterfall_url = Column(String(2000), nullable=True)
    filmstrip_url = Column(String(2000), nullable=True)
    screenshot_url = Column(String(2000), nullable=True)
    video_url = Column(String(2000), nullable=True)
    
    # Render Metrics
    start_render_ms = Column(Float, nullable=True)
    visually_complete_ms = Column(Float, nullable=True)
    
    # Raw Data
    raw_response = Column(JSON, nullable=True)  # Full API response for reference
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    test = relationship("PerformanceTest", back_populates="metrics")


class TestExecution(Base):
    """
    Test Execution - Historical record of individual test runs
    Enables trending and comparison over time
    """
    __tablename__ = "test_executions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    test_id = Column(UUID(as_uuid=True), ForeignKey("performance_tests.id", ondelete="CASCADE"), nullable=False)
    
    # Human-friendly ID (EXEC-XXXXX)
    human_id = Column(String(15), unique=True, nullable=True)
    
    # Execution Details
    run_number = Column(Integer, nullable=False)  # Sequential run number
    status = Column(SQLEnum(TestStatus, values_callable=lambda x: [e.value for e in x]), default=TestStatus.PENDING)
    
    # Timing
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    duration_ms = Column(Integer, nullable=True)
    
    # Key Metrics Snapshot (for quick comparison)
    performance_score = Column(Float, nullable=True)
    latency_p95 = Column(Float, nullable=True)
    requests_per_second = Column(Float, nullable=True)
    error_rate = Column(Float, nullable=True)
    
    # Threshold Results
    threshold_passed = Column(Boolean, nullable=True)
    threshold_details = Column(JSON, default=dict)
    
    # Full Metrics (stored as JSON for historical runs)
    metrics_snapshot = Column(JSON, default=dict)
    
    # Provider Details
    provider = Column(SQLEnum(TestProvider, values_callable=lambda x: [e.value for e in x]), nullable=True)
    provider_test_id = Column(String(255), nullable=True)
    provider_report_url = Column(String(2000), nullable=True)
    
    # Error Info
    error_message = Column(Text, nullable=True)
    
    # Triggered By
    triggered_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    trigger_source = Column(String(100), default="manual")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    test = relationship("PerformanceTest", back_populates="executions")
    triggered_by_user = relationship("User", foreign_keys=[triggered_by])

    # Indexes
    __table_args__ = (
        Index('ix_test_executions_test_id', 'test_id'),
        Index('ix_test_executions_created_at', 'created_at'),
    )


class PerformanceAlert(Base):
    """
    Performance Alert - Threshold violations and performance warnings
    """
    __tablename__ = "performance_alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    test_id = Column(UUID(as_uuid=True), ForeignKey("performance_tests.id", ondelete="CASCADE"), nullable=False)
    execution_id = Column(UUID(as_uuid=True), ForeignKey("test_executions.id", ondelete="CASCADE"), nullable=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    
    # Alert Details
    severity = Column(SQLEnum(AlertSeverity, values_callable=lambda x: [e.value for e in x]), nullable=False)
    title = Column(String(500), nullable=False)
    message = Column(Text, nullable=False)
    
    # Metric Details
    metric_name = Column(String(100), nullable=False)  # e.g., "latency_p95", "error_rate"
    threshold_value = Column(Float, nullable=False)
    actual_value = Column(Float, nullable=False)
    
    # Status
    is_acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    test = relationship("PerformanceTest", back_populates="alerts")
    project = relationship("Project")
    acknowledged_by_user = relationship("User", foreign_keys=[acknowledged_by])

    # Indexes
    __table_args__ = (
        Index('ix_performance_alerts_project_id', 'project_id'),
        Index('ix_performance_alerts_severity', 'severity'),
    )


class PerformanceSchedule(Base):
    """
    Performance Schedule - Automated recurring performance tests
    """
    __tablename__ = "performance_schedules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False)
    
    # Schedule Details
    name = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    
    # Test Configuration (what to run)
    test_type = Column(SQLEnum(TestType, values_callable=lambda x: [e.value for e in x]), nullable=False)
    target_url = Column(String(2000), nullable=False)
    test_config = Column(JSON, default=dict)  # Full test configuration
    
    # Schedule Configuration
    frequency = Column(SQLEnum(ScheduleFrequency, values_callable=lambda x: [e.value for e in x]), nullable=False)
    cron_expression = Column(String(100), nullable=True)
    timezone = Column(String(100), default="UTC")
    
    # Status
    is_enabled = Column(Boolean, default=True)
    
    # Execution Tracking
    last_run_at = Column(DateTime(timezone=True), nullable=True)
    next_run_at = Column(DateTime(timezone=True), nullable=True)
    last_test_id = Column(UUID(as_uuid=True), ForeignKey("performance_tests.id", ondelete="SET NULL"), nullable=True)
    total_runs = Column(Integer, default=0)
    
    # Notifications
    notify_on_complete = Column(Boolean, default=True)
    notify_on_failure = Column(Boolean, default=True)
    notify_on_threshold_breach = Column(Boolean, default=True)
    notification_emails = Column(JSON, default=list)
    notification_slack_webhook = Column(String(500), nullable=True)
    
    # Metadata
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    project = relationship("Project")
    organisation = relationship("Organisation")
    creator = relationship("User", foreign_keys=[created_by])
    last_test = relationship("PerformanceTest", foreign_keys=[last_test_id])


class PerformanceReport(Base):
    """
    Performance Report - Generated shareable reports
    """
    __tablename__ = "performance_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    test_id = Column(UUID(as_uuid=True), ForeignKey("performance_tests.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    
    # Report Details
    title = Column(String(500), nullable=False)
    format = Column(String(20), nullable=False)  # pdf, html, json
    
    # Access
    share_token = Column(String(100), unique=True, nullable=True)  # For shareable links
    is_public = Column(Boolean, default=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Storage
    file_path = Column(String(1000), nullable=True)
    file_size_bytes = Column(Integer, nullable=True)
    
    # Content (for HTML reports)
    html_content = Column(Text, nullable=True)
    
    # Metadata
    generated_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    download_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    test = relationship("PerformanceTest")
    project = relationship("Project")
    generated_by_user = relationship("User", foreign_keys=[generated_by])
