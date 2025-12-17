"""
Workflow Automation Models - n8n-style visual workflow builder
Enables visual construction and execution of automation workflows
"""
from sqlalchemy import Column, String, DateTime, JSON, Text, ForeignKey, Boolean, Integer, Float, LargeBinary
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from typing import Optional

from app.core.database import Base


# ============================================================================
# ENUMS
# ============================================================================

class WorkflowDefStatus(str, enum.Enum):
    """Status of a workflow definition"""
    DRAFT = "draft"
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"


class TriggerType(str, enum.Enum):
    """Types of workflow triggers"""
    MANUAL = "manual"
    SCHEDULE = "schedule"
    WEBHOOK = "webhook"
    EVENT = "event"  # Internal events (test completion, etc.)


class NodeType(str, enum.Enum):
    """Types of workflow nodes"""
    TRIGGER = "trigger"
    ACTION = "action"
    CONDITION = "condition"
    LOOP = "loop"
    SWITCH = "switch"
    WAIT = "wait"
    SET_VARIABLE = "set_variable"
    TRANSFORM = "transform"
    FILTER = "filter"
    MERGE = "merge"
    ERROR_HANDLER = "error_handler"
    SUBWORKFLOW = "subworkflow"


class IntegrationNodeType(str, enum.Enum):
    """Types of integration nodes"""
    HTTP_REQUEST = "http_request"
    SLACK = "slack"
    EMAIL = "email"
    JIRA = "jira"
    GITHUB = "github"
    GITLAB = "gitlab"
    GOOGLE_SHEETS = "google_sheets"
    POSTGRESQL = "postgresql"
    MYSQL = "mysql"
    MONGODB = "mongodb"
    WEBHOOK = "webhook"
    TEST_AUTOMATION = "test_automation"
    CUSTOM_CODE = "custom_code"


class ExecutionStatus(str, enum.Enum):
    """Status of workflow execution"""
    PENDING = "pending"
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    STOPPED = "stopped"
    WAITING = "waiting"  # Waiting for external event
    TIMEOUT = "timeout"


class StepStatus(str, enum.Enum):
    """Status of individual execution step"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"
    WAITING = "waiting"


class CredentialType(str, enum.Enum):
    """Types of stored credentials"""
    API_KEY = "api_key"
    OAUTH2 = "oauth2"
    BASIC_AUTH = "basic_auth"
    BEARER_TOKEN = "bearer_token"
    CUSTOM = "custom"


# ============================================================================
# MODELS
# ============================================================================

class WorkflowDefinition(Base):
    """
    Main workflow entity - represents a complete automation workflow
    Analogous to n8n's workflow definition
    """
    __tablename__ = "workflow_definitions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False, index=True)

    # Human-readable ID (WF-XXXXX)
    human_id = Column(String(20), unique=True, nullable=True, index=True)

    # Workflow Details
    name = Column(String(500), nullable=False, index=True)
    description = Column(Text, nullable=True)
    status = Column(SQLEnum(WorkflowDefStatus, name='workflow_def_status', values_callable=lambda x: [e.value for e in x]), default=WorkflowDefStatus.DRAFT, index=True)
    
    # Trigger Configuration
    trigger_type = Column(SQLEnum(TriggerType, values_callable=lambda x: [e.value for e in x]), default=TriggerType.MANUAL)
    trigger_config = Column(JSON, default=dict)  # Trigger-specific settings

    # Visual Builder Data (React Flow format)
    nodes_json = Column(JSON, default=list)  # React Flow nodes array
    edges_json = Column(JSON, default=list)  # React Flow edges array
    viewport_json = Column(JSON, default=dict)  # Canvas viewport state (zoom, position)

    # Execution Settings
    timeout_seconds = Column(Integer, default=3600)  # 1 hour default
    retry_policy = Column(JSON, default=lambda: {
        "max_retries": 3,
        "retry_delay_seconds": 10,
        "backoff_multiplier": 2,
        "retry_on_error_types": ["timeout", "connection_error"]
    })
    error_handling = Column(JSON, default=lambda: {
        "on_error": "stop",  # stop, continue, goto_error_handler
        "notify_on_failure": True,
        "notification_channel": None
    })

    # Global Variables (available to all nodes)
    global_variables = Column(JSON, default=dict)
    
    # Environment (for different deployment contexts)
    environment = Column(String(50), default="production")

    # Statistics
    total_executions = Column(Integer, default=0)
    successful_executions = Column(Integer, default=0)
    failed_executions = Column(Integer, default=0)
    average_duration_ms = Column(Integer, default=0)
    last_execution_status = Column(String(50), nullable=True)

    # Versioning
    version = Column(String(50), default="1.0.0")
    is_latest = Column(Boolean, default=True)
    parent_version_id = Column(UUID(as_uuid=True), ForeignKey("workflow_definitions.id", ondelete="SET NULL"), nullable=True)

    # Tags & Categories
    tags = Column(JSON, default=list)
    category = Column(String(255), nullable=True)
    icon = Column(String(100), nullable=True)  # Icon identifier
    color = Column(String(20), nullable=True)  # Theme color

    # Documentation
    notes = Column(Text, nullable=True)
    documentation_url = Column(String(1000), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    last_executed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    project = relationship("Project")
    organisation = relationship("Organisation")
    creator = relationship("User", foreign_keys=[created_by])
    executions = relationship("WorkflowExecution", back_populates="workflow", cascade="all, delete-orphan")
    schedule = relationship("WorkflowSchedule", back_populates="workflow", uselist=False, cascade="all, delete-orphan")
    webhook = relationship("WorkflowWebhook", back_populates="workflow", uselist=False, cascade="all, delete-orphan")
    versions = relationship("WorkflowDefinition", backref="parent_version", remote_side=[id])

    def __repr__(self):
        return f"<WorkflowDefinition {self.name} ({self.status})>"


class WorkflowExecution(Base):
    """
    Record of a workflow execution
    Tracks complete execution lifecycle and results
    """
    __tablename__ = "workflow_executions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id = Column(UUID(as_uuid=True), ForeignKey("workflow_definitions.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)

    # Human-readable ID (EX-XXXXX)
    human_id = Column(String(20), unique=True, nullable=True, index=True)

    # Snapshot of workflow at execution time
    workflow_version = Column(String(50), nullable=False)
    workflow_snapshot = Column(JSON, nullable=True)  # Full workflow state at execution

    # Execution Status
    status = Column(SQLEnum(ExecutionStatus, values_callable=lambda x: [e.value for e in x]), default=ExecutionStatus.PENDING, index=True)
    
    # Trigger Information
    trigger_source = Column(String(50), nullable=False)  # manual, schedule, webhook, event
    trigger_data = Column(JSON, default=dict)  # Input data from trigger
    trigger_node_id = Column(String(100), nullable=True)  # Which node triggered

    # Execution Results
    output_data = Column(JSON, default=dict)  # Final output
    current_node_id = Column(String(100), nullable=True)  # Currently executing node
    execution_path = Column(JSON, default=list)  # Path taken through nodes
    
    # Error Information
    error_message = Column(Text, nullable=True)
    error_node_id = Column(String(100), nullable=True)
    error_stack = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)

    # Performance Metrics
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    duration_ms = Column(Integer, nullable=True)
    
    # Node Statistics
    total_nodes = Column(Integer, default=0)
    completed_nodes = Column(Integer, default=0)
    failed_nodes = Column(Integer, default=0)
    skipped_nodes = Column(Integer, default=0)

    # Metadata
    triggered_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    execution_context = Column(JSON, default=dict)  # Environment info, IP, etc.
    notes = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    queued_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    workflow = relationship("WorkflowDefinition", back_populates="executions")
    project = relationship("Project")
    triggered_by_user = relationship("User", foreign_keys=[triggered_by])
    steps = relationship("WorkflowExecutionStep", back_populates="execution", cascade="all, delete-orphan", order_by="WorkflowExecutionStep.step_order")

    def __repr__(self):
        return f"<WorkflowExecution {self.id} - {self.status}>"


class WorkflowExecutionStep(Base):
    """
    Individual step result in workflow execution
    Tracks each node's execution details
    """
    __tablename__ = "workflow_execution_steps"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    execution_id = Column(UUID(as_uuid=True), ForeignKey("workflow_executions.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Node Identification
    node_id = Column(String(100), nullable=False)  # React Flow node ID
    node_type = Column(String(100), nullable=False)
    node_name = Column(String(500), nullable=True)
    step_order = Column(Integer, nullable=False)

    # Execution Status
    status = Column(SQLEnum(StepStatus, values_callable=lambda x: [e.value for e in x]), default=StepStatus.PENDING, index=True)

    # Input/Output
    input_data = Column(JSON, default=dict)
    output_data = Column(JSON, default=dict)
    
    # Error Information
    error_message = Column(Text, nullable=True)
    error_stack = Column(Text, nullable=True)
    error_type = Column(String(100), nullable=True)

    # Performance
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    duration_ms = Column(Integer, nullable=True)
    retry_count = Column(Integer, default=0)

    # Condition Evaluation (for condition nodes)
    condition_result = Column(Boolean, nullable=True)
    condition_expression = Column(Text, nullable=True)

    # Loop Information (for loop nodes)
    loop_index = Column(Integer, nullable=True)
    loop_total = Column(Integer, nullable=True)

    # Integration Response (for integration nodes)
    http_status_code = Column(Integer, nullable=True)
    response_headers = Column(JSON, nullable=True)

    # Logs & Debug
    logs = Column(JSON, default=list)  # Array of log entries

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    execution = relationship("WorkflowExecution", back_populates="steps")

    def __repr__(self):
        return f"<WorkflowExecutionStep {self.node_id} - {self.status}>"


class WorkflowCredential(Base):
    """
    Stored credentials for workflow integrations
    Credentials are encrypted at rest
    """
    __tablename__ = "workflow_credentials"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=True, index=True)

    # Credential Details
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    credential_type = Column(SQLEnum(CredentialType, values_callable=lambda x: [e.value for e in x]), nullable=False)
    integration_type = Column(String(100), nullable=False)  # slack, jira, github, etc.

    # Encrypted Credential Data
    encrypted_data = Column(LargeBinary, nullable=False)  # Fernet encrypted JSON
    
    # Credential Metadata (non-sensitive)
    credential_metadata = Column(JSON, default=dict)  # e.g., {"scope": ["read", "write"], "expires_at": "..."}
    
    # Usage Tracking
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    use_count = Column(Integer, default=0)
    
    # Validity
    is_valid = Column(Boolean, default=True)
    last_validation_at = Column(DateTime(timezone=True), nullable=True)
    validation_error = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    organisation = relationship("Organisation")
    project = relationship("Project")
    creator = relationship("User", foreign_keys=[created_by])

    def __repr__(self):
        return f"<WorkflowCredential {self.name} ({self.integration_type})>"


class WorkflowSchedule(Base):
    """
    Scheduled workflow triggers using cron expressions
    """
    __tablename__ = "workflow_schedules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id = Column(UUID(as_uuid=True), ForeignKey("workflow_definitions.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)

    # Schedule Configuration
    cron_expression = Column(String(100), nullable=False)  # e.g., "0 9 * * 1-5" (9 AM weekdays)
    timezone = Column(String(100), default="UTC")
    
    # Status
    enabled = Column(Boolean, default=True)
    
    # Execution Tracking
    next_run_at = Column(DateTime(timezone=True), nullable=True)
    last_run_at = Column(DateTime(timezone=True), nullable=True)
    last_run_execution_id = Column(UUID(as_uuid=True), ForeignKey("workflow_executions.id", ondelete="SET NULL"), nullable=True)
    last_run_status = Column(String(50), nullable=True)

    # Statistics
    total_runs = Column(Integer, default=0)
    successful_runs = Column(Integer, default=0)
    failed_runs = Column(Integer, default=0)
    consecutive_failures = Column(Integer, default=0)

    # Auto-disable on failures
    max_consecutive_failures = Column(Integer, default=5)  # Auto-disable after N failures
    auto_disabled = Column(Boolean, default=False)
    auto_disabled_at = Column(DateTime(timezone=True), nullable=True)

    # Input data to pass when triggered
    trigger_data = Column(JSON, default=dict)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    workflow = relationship("WorkflowDefinition", back_populates="schedule")
    last_execution = relationship("WorkflowExecution", foreign_keys=[last_run_execution_id])

    def __repr__(self):
        return f"<WorkflowSchedule {self.cron_expression} - {'enabled' if self.enabled else 'disabled'}>"


class WorkflowWebhook(Base):
    """
    Webhook triggers for workflows
    Each workflow can have one incoming webhook
    """
    __tablename__ = "workflow_webhooks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id = Column(UUID(as_uuid=True), ForeignKey("workflow_definitions.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)

    # Webhook Configuration
    path = Column(String(255), unique=True, nullable=False, index=True)  # Unique path for webhook
    method = Column(String(10), default="POST")  # GET, POST
    
    # Security
    secret_key = Column(String(255), nullable=True)  # Optional HMAC verification
    require_auth = Column(Boolean, default=False)
    allowed_ips = Column(JSON, default=list)  # IP whitelist (empty = all allowed)

    # Response Configuration
    response_mode = Column(String(50), default="immediate")  # immediate, on_completion
    response_data = Column(JSON, default=lambda: {"message": "Workflow triggered"})

    # Status
    enabled = Column(Boolean, default=True)
    
    # Statistics
    total_calls = Column(Integer, default=0)
    successful_calls = Column(Integer, default=0)
    failed_calls = Column(Integer, default=0)
    last_called_at = Column(DateTime(timezone=True), nullable=True)
    last_caller_ip = Column(String(50), nullable=True)

    # Rate Limiting
    rate_limit_enabled = Column(Boolean, default=False)
    rate_limit_max_calls = Column(Integer, default=100)
    rate_limit_window_seconds = Column(Integer, default=60)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    workflow = relationship("WorkflowDefinition", back_populates="webhook")

    def __repr__(self):
        return f"<WorkflowWebhook {self.path} - {'enabled' if self.enabled else 'disabled'}>"


class WorkflowTemplate(Base):
    """
    Pre-built workflow templates for quick start
    """
    __tablename__ = "workflow_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Template Details
    name = Column(String(500), nullable=False, index=True)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=False, index=True)  # testing, notifications, ci-cd, etc.
    
    # Template Data
    nodes_json = Column(JSON, default=list)
    edges_json = Column(JSON, default=list)
    variables = Column(JSON, default=dict)  # Variables that need to be configured
    required_credentials = Column(JSON, default=list)  # List of credential types needed

    # Display
    icon = Column(String(100), nullable=True)
    color = Column(String(20), nullable=True)
    preview_image_url = Column(String(1000), nullable=True)

    # Metadata
    tags = Column(JSON, default=list)
    difficulty = Column(String(50), default="beginner")  # beginner, intermediate, advanced
    estimated_setup_time = Column(String(50), nullable=True)  # e.g., "5 minutes"
    
    # Documentation
    documentation = Column(Text, nullable=True)
    documentation_url = Column(String(1000), nullable=True)

    # Statistics
    use_count = Column(Integer, default=0)
    rating = Column(Float, nullable=True)
    rating_count = Column(Integer, default=0)

    # Visibility
    is_public = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=True)  # Null = system template

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    organisation = relationship("Organisation")
    creator = relationship("User", foreign_keys=[created_by])

    def __repr__(self):
        return f"<WorkflowTemplate {self.name}>"
