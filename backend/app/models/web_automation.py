"""
Web Automation Module Models
Comprehensive no-code test automation with self-healing capabilities
"""
from sqlalchemy import Column, String, DateTime, JSON, Text, ForeignKey, Enum as SQLEnum, Boolean, Integer, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


class BrowserType(str, enum.Enum):
    CHROME = "chrome"
    FIREFOX = "firefox"
    SAFARI = "safari"
    EDGE = "edge"
    CHROMIUM = "chromium"


class ExecutionMode(str, enum.Enum):
    HEADED = "headed"
    HEADLESS = "headless"


class TestFlowStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"


class ExecutionRunStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    STOPPED = "stopped"
    ERROR = "error"


class StepStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    PASSED = "passed"
    FAILED = "failed"
    SKIPPED = "skipped"
    HEALED = "healed"


class HealingType(str, enum.Enum):
    LOCATOR = "locator"
    ASSERTION = "assertion"
    NETWORK = "network"
    TIMEOUT = "timeout"


class HealingStrategy(str, enum.Enum):
    AI = "ai"
    ALTERNATIVE = "alternative"
    CONTEXT = "context"
    SIMILARITY = "similarity"


class TestFlow(Base):
    """
    Test Flow - Visual drag-and-drop test automation script
    """
    __tablename__ = "test_flows"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False)

    # Flow Details
    name = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(SQLEnum(TestFlowStatus, values_callable=lambda x: [e.value for e in x]), default=TestFlowStatus.DRAFT)

    # Flow Configuration
    base_url = Column(String(1000), nullable=False)
    flow_json = Column(JSON, nullable=False)  # Complete React Flow structure
    
    # Visual Flow Data
    nodes = Column(JSON, default=list)  # Flow nodes (test actions)
    edges = Column(JSON, default=list)  # Flow connections
    viewport = Column(JSON, default=dict)  # Canvas viewport state

    # Execution Configuration
    default_browser = Column(SQLEnum(BrowserType, values_callable=lambda x: [e.value for e in x]), default=BrowserType.CHROME)
    default_mode = Column(SQLEnum(ExecutionMode, values_callable=lambda x: [e.value for e in x]), default=ExecutionMode.HEADED)
    timeout = Column(Integer, default=30000)  # milliseconds
    retry_policy = Column(String(50), default="exponential")
    max_retries = Column(Integer, default=3)

    # Self-Healing Configuration
    healing_enabled = Column(Boolean, default=True)
    auto_update_selectors = Column(Boolean, default=False)  # Auto-update healed selectors
    healing_confidence_threshold = Column(Float, default=0.75)

    # Browser Options
    browser_options = Column(JSON, default=dict)  # viewport, user agent, etc.
    
    # Tags & Metadata
    tags = Column(JSON, default=list)
    category = Column(String(255), nullable=True)
    version = Column(String(50), default="1.0.0")

    # Statistics
    total_executions = Column(Integer, default=0)
    successful_executions = Column(Integer, default=0)
    failed_executions = Column(Integer, default=0)
    average_duration = Column(Integer, default=0)  # milliseconds
    healing_success_rate = Column(Float, default=0.0)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    last_executed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    project = relationship("Project")
    organisation = relationship("Organisation")
    creator = relationship("User", foreign_keys=[created_by])
    execution_runs = relationship("ExecutionRun", back_populates="test_flow", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<TestFlow {self.name}>"


class ExecutionRun(Base):
    """
    Execution Run - Record of a test flow execution
    """
    __tablename__ = "execution_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    test_flow_id = Column(UUID(as_uuid=True), ForeignKey("test_flows.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    
    # Human-friendly ID for display (EXE-XXXXX)
    human_id = Column(String(12), unique=True, nullable=True)

    # Execution Configuration
    browser_type = Column(SQLEnum(BrowserType, values_callable=lambda x: [e.value for e in x]), nullable=False)
    execution_mode = Column(SQLEnum(ExecutionMode, values_callable=lambda x: [e.value for e in x]), nullable=False)
    
    # Execution State
    status = Column(SQLEnum(ExecutionRunStatus, values_callable=lambda x: [e.value for e in x]), default=ExecutionRunStatus.PENDING)
    
    # Results Summary
    total_steps = Column(Integer, default=0)
    passed_steps = Column(Integer, default=0)
    failed_steps = Column(Integer, default=0)
    skipped_steps = Column(Integer, default=0)
    healed_steps = Column(Integer, default=0)

    # Performance Metrics
    duration_ms = Column(Integer, nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    ended_at = Column(DateTime(timezone=True), nullable=True)

    # Environment Info
    execution_environment = Column(JSON, default=dict)  # OS, browser version, viewport, etc.
    
    # Media & Artifacts
    video_url = Column(String(1000), nullable=True)
    trace_url = Column(String(1000), nullable=True)
    screenshots_dir = Column(String(1000), nullable=True)

    # Error Info
    error_message = Column(Text, nullable=True)
    error_stack = Column(Text, nullable=True)

    # Metadata
    triggered_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    trigger_source = Column(String(100), nullable=True)  # manual, ci, scheduled
    tags = Column(JSON, default=list)
    notes = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    test_flow = relationship("TestFlow", back_populates="execution_runs")
    project = relationship("Project")
    triggered_by_user = relationship("User", foreign_keys=[triggered_by])
    step_results = relationship("StepResult", back_populates="execution_run", cascade="all, delete-orphan")
    healing_events = relationship("HealingEvent", back_populates="execution_run", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ExecutionRun {self.id} - {self.status}>"


class StepResult(Base):
    """
    Step Result - Individual test step execution result
    """
    __tablename__ = "step_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    execution_run_id = Column(UUID(as_uuid=True), ForeignKey("execution_runs.id", ondelete="CASCADE"), nullable=False)
    
    # Step Identification
    step_id = Column(String(100), nullable=False)  # Matches node ID from flow
    step_name = Column(String(500), nullable=True)
    step_type = Column(String(100), nullable=False)  # click, type, assert, etc.
    step_order = Column(Integer, nullable=False)

    # Execution Status
    status = Column(SQLEnum(StepStatus, values_callable=lambda x: [e.value for e in x]), default=StepStatus.PENDING)
    
    # Step Details
    selector_used = Column(JSON, nullable=True)  # Actual selector that worked
    action_details = Column(JSON, default=dict)  # Input values, options, etc.
    
    # Results
    actual_result = Column(Text, nullable=True)
    expected_result = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    error_stack = Column(Text, nullable=True)

    # Performance
    duration_ms = Column(Integer, nullable=True)
    retry_count = Column(Integer, default=0)
    
    # Media
    screenshot_url = Column(String(1000), nullable=True)
    screenshot_before_url = Column(String(1000), nullable=True)
    screenshot_after_url = Column(String(1000), nullable=True)

    # Healing Info
    was_healed = Column(Boolean, default=False)
    healing_applied = Column(JSON, nullable=True)  # Details of healing applied

    # Console & Logs
    console_logs = Column(JSON, default=list)
    network_logs = Column(JSON, default=list)

    # Timestamps
    started_at = Column(DateTime(timezone=True), nullable=True)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    execution_run = relationship("ExecutionRun", back_populates="step_results")

    def __repr__(self):
        return f"<StepResult {self.step_id} - {self.status}>"


class HealingEvent(Base):
    """
    Healing Event - Record of self-healing actions
    """
    __tablename__ = "healing_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    execution_run_id = Column(UUID(as_uuid=True), ForeignKey("execution_runs.id", ondelete="CASCADE"), nullable=False)
    step_result_id = Column(UUID(as_uuid=True), ForeignKey("step_results.id", ondelete="CASCADE"), nullable=True)

    # Healing Details
    healing_type = Column(SQLEnum(HealingType, values_callable=lambda x: [e.value for e in x]), nullable=False)
    strategy = Column(SQLEnum(HealingStrategy, values_callable=lambda x: [e.value for e in x]), nullable=False)
    
    # Original vs Healed
    original_value = Column(Text, nullable=False)
    healed_value = Column(Text, nullable=False)
    
    # Context
    step_id = Column(String(100), nullable=False)
    step_type = Column(String(100), nullable=False)
    failure_reason = Column(Text, nullable=True)

    # Success Metrics
    success = Column(Boolean, nullable=False)
    confidence_score = Column(Float, nullable=True)  # 0.0 to 1.0
    retry_attempts = Column(Integer, default=1)

    # AI Details (if AI strategy used)
    ai_model = Column(String(100), nullable=True)
    ai_prompt = Column(Text, nullable=True)
    ai_response = Column(JSON, nullable=True)
    ai_reasoning = Column(Text, nullable=True)

    # Alternative Strategies Tried
    alternatives_tried = Column(JSON, default=list)
    
    # DOM Context
    dom_snapshot = Column(Text, nullable=True)  # Relevant DOM at time of healing
    page_url = Column(String(1000), nullable=True)
    page_title = Column(String(500), nullable=True)

    # Performance
    healing_duration_ms = Column(Integer, nullable=True)

    # Timestamps
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    execution_run = relationship("ExecutionRun", back_populates="healing_events")
    step_result = relationship("StepResult")

    def __repr__(self):
        return f"<HealingEvent {self.healing_type} - {self.success}>"


class LocatorAlternative(Base):
    """
    Locator Alternative - Stored alternative selectors for elements
    """
    __tablename__ = "locator_alternatives"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    test_flow_id = Column(UUID(as_uuid=True), ForeignKey("test_flows.id", ondelete="CASCADE"), nullable=False)
    
    # Element Identification
    step_id = Column(String(100), nullable=False)
    element_identifier = Column(String(500), nullable=False)  # Descriptive name
    
    # Primary Selector
    primary_selector = Column(Text, nullable=False)
    primary_strategy = Column(String(50), nullable=False)  # css, xpath, text, role, testid
    
    # Alternative Selectors
    alternatives = Column(JSON, default=list)  # [{strategy, value, priority, success_rate}]
    
    # Learning Data
    success_count = Column(Integer, default=0)
    failure_count = Column(Integer, default=0)
    last_successful_selector = Column(Text, nullable=True)
    last_failed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Element Context
    element_attributes = Column(JSON, default=dict)
    element_context = Column(JSON, default=dict)  # parent, siblings info
    page_url_pattern = Column(String(1000), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    test_flow = relationship("TestFlow")

    def __repr__(self):
        return f"<LocatorAlternative {self.element_identifier}>"
