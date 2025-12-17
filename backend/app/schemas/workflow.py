"""
Workflow Automation API Schemas
Pydantic models for request/response validation
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime
from enum import Enum


# ============================================================================
# ENUMS
# ============================================================================

class WorkflowStatusEnum(str, Enum):
    """Status of a workflow"""
    DRAFT = "draft"
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"


class TriggerTypeEnum(str, Enum):
    """Types of workflow triggers"""
    MANUAL = "manual"
    SCHEDULE = "schedule"
    WEBHOOK = "webhook"
    EVENT = "event"


class ExecutionStatusEnum(str, Enum):
    """Status of workflow execution"""
    PENDING = "pending"
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    STOPPED = "stopped"
    WAITING = "waiting"
    TIMEOUT = "timeout"


class StepStatusEnum(str, Enum):
    """Status of execution step"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"
    WAITING = "waiting"


# ============================================================================
# NODE SCHEMAS
# ============================================================================

class NodePosition(BaseModel):
    """Position of node on canvas"""
    x: float = 0
    y: float = 0


class NodeData(BaseModel):
    """Data associated with a workflow node"""
    label: str = ""
    type: str = ""
    integration_type: Optional[str] = None
    config: Dict[str, Any] = Field(default_factory=dict)
    credentials_id: Optional[str] = None
    description: Optional[str] = None
    disabled: bool = False


class WorkflowNodeSchema(BaseModel):
    """Schema for a workflow node (React Flow format)"""
    id: str
    type: str  # React Flow node type
    position: NodePosition
    data: NodeData
    width: Optional[float] = None
    height: Optional[float] = None
    selected: Optional[bool] = None
    dragging: Optional[bool] = None


class WorkflowEdgeSchema(BaseModel):
    """Schema for a workflow edge (React Flow format)"""
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None
    label: Optional[str] = None
    type: Optional[str] = None
    animated: Optional[bool] = None
    data: Optional[Dict[str, Any]] = None


class ViewportSchema(BaseModel):
    """Canvas viewport state"""
    x: float = 0
    y: float = 0
    zoom: float = 1


# ============================================================================
# WORKFLOW SCHEMAS
# ============================================================================

class RetryPolicySchema(BaseModel):
    """Retry policy configuration"""
    max_retries: int = 3
    retry_delay_seconds: int = 10
    backoff_multiplier: float = 2
    retry_on_error_types: List[str] = Field(default_factory=lambda: ["timeout", "connection_error"])


class ErrorHandlingSchema(BaseModel):
    """Error handling configuration"""
    on_error: str = "stop"  # stop, continue, goto_error_handler
    notify_on_failure: bool = True
    notification_channel: Optional[str] = None


class WorkflowCreate(BaseModel):
    """Schema for creating a workflow"""
    name: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    project_id: UUID
    trigger_type: TriggerTypeEnum = TriggerTypeEnum.MANUAL
    trigger_config: Dict[str, Any] = Field(default_factory=dict)
    nodes: List[WorkflowNodeSchema] = Field(default_factory=list)
    edges: List[WorkflowEdgeSchema] = Field(default_factory=list)
    viewport: ViewportSchema = Field(default_factory=ViewportSchema)
    global_variables: Dict[str, Any] = Field(default_factory=dict)
    timeout_seconds: int = 3600
    retry_policy: RetryPolicySchema = Field(default_factory=RetryPolicySchema)
    error_handling: ErrorHandlingSchema = Field(default_factory=ErrorHandlingSchema)
    tags: List[str] = Field(default_factory=list)
    category: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None


class WorkflowUpdate(BaseModel):
    """Schema for updating a workflow"""
    name: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    status: Optional[WorkflowStatusEnum] = None
    trigger_type: Optional[TriggerTypeEnum] = None
    trigger_config: Optional[Dict[str, Any]] = None
    nodes: Optional[List[WorkflowNodeSchema]] = None
    edges: Optional[List[WorkflowEdgeSchema]] = None
    viewport: Optional[ViewportSchema] = None
    global_variables: Optional[Dict[str, Any]] = None
    timeout_seconds: Optional[int] = None
    retry_policy: Optional[RetryPolicySchema] = None
    error_handling: Optional[ErrorHandlingSchema] = None
    tags: Optional[List[str]] = None
    category: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    notes: Optional[str] = None


class WorkflowSummary(BaseModel):
    """Summary view of a workflow (for list responses)"""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    human_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    status: str
    trigger_type: str
    category: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    
    total_executions: int = 0
    successful_executions: int = 0
    failed_executions: int = 0
    last_execution_status: Optional[str] = None
    last_executed_at: Optional[datetime] = None
    
    created_at: datetime
    updated_at: Optional[datetime] = None


class WorkflowDetail(BaseModel):
    """Full workflow details"""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    human_id: Optional[str] = None
    project_id: UUID
    organisation_id: UUID
    
    name: str
    description: Optional[str] = None
    status: str
    
    trigger_type: str
    trigger_config: Dict[str, Any] = Field(default_factory=dict)
    
    nodes: List[WorkflowNodeSchema] = Field(default_factory=list)
    edges: List[WorkflowEdgeSchema] = Field(default_factory=list)
    viewport: ViewportSchema = Field(default_factory=ViewportSchema)
    
    timeout_seconds: int = 3600
    retry_policy: Dict[str, Any] = Field(default_factory=dict)
    error_handling: Dict[str, Any] = Field(default_factory=dict)
    
    global_variables: Dict[str, Any] = Field(default_factory=dict)
    environment: str = "production"
    
    version: str = "1.0.0"
    tags: List[str] = Field(default_factory=list)
    category: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    notes: Optional[str] = None
    
    total_executions: int = 0
    successful_executions: int = 0
    failed_executions: int = 0
    average_duration_ms: int = 0
    last_execution_status: Optional[str] = None
    last_executed_at: Optional[datetime] = None
    
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: Optional[UUID] = None


# ============================================================================
# EXECUTION SCHEMAS
# ============================================================================

class ExecutionCreate(BaseModel):
    """Schema for triggering workflow execution"""
    input_data: Dict[str, Any] = Field(default_factory=dict)
    trigger_source: str = "manual"


class ExecutionStepSummary(BaseModel):
    """Summary of an execution step"""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    node_id: str
    node_type: str
    node_name: Optional[str] = None
    step_order: int
    status: str
    duration_ms: Optional[int] = None
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class ExecutionStepDetail(BaseModel):
    """Full step details"""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    node_id: str
    node_type: str
    node_name: Optional[str] = None
    step_order: int
    status: str
    
    input_data: Dict[str, Any] = Field(default_factory=dict)
    output_data: Dict[str, Any] = Field(default_factory=dict)
    
    error_message: Optional[str] = None
    error_stack: Optional[str] = None
    error_type: Optional[str] = None
    
    duration_ms: Optional[int] = None
    retry_count: int = 0
    
    condition_result: Optional[bool] = None
    condition_expression: Optional[str] = None
    
    loop_index: Optional[int] = None
    loop_total: Optional[int] = None
    
    http_status_code: Optional[int] = None
    response_headers: Optional[Dict[str, Any]] = None
    
    logs: List[Dict[str, Any]] = Field(default_factory=list)
    
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class ExecutionSummary(BaseModel):
    """Summary of a workflow execution"""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    human_id: Optional[str] = None
    workflow_id: UUID
    status: str
    trigger_source: str
    
    duration_ms: Optional[int] = None
    
    total_nodes: int = 0
    completed_nodes: int = 0
    failed_nodes: int = 0
    skipped_nodes: int = 0
    
    error_message: Optional[str] = None
    error_node_id: Optional[str] = None
    
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime


class ExecutionDetail(BaseModel):
    """Full execution details"""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    human_id: Optional[str] = None
    workflow_id: UUID
    project_id: UUID
    
    workflow_version: str
    status: str
    trigger_source: str
    trigger_data: Dict[str, Any] = Field(default_factory=dict)
    
    output_data: Dict[str, Any] = Field(default_factory=dict)
    execution_path: List[str] = Field(default_factory=list)
    current_node_id: Optional[str] = None
    
    error_message: Optional[str] = None
    error_node_id: Optional[str] = None
    error_stack: Optional[str] = None
    retry_count: int = 0
    
    duration_ms: Optional[int] = None
    total_nodes: int = 0
    completed_nodes: int = 0
    failed_nodes: int = 0
    skipped_nodes: int = 0
    
    steps: List[ExecutionStepSummary] = Field(default_factory=list)
    
    triggered_by: Optional[UUID] = None
    execution_context: Dict[str, Any] = Field(default_factory=dict)
    notes: Optional[str] = None
    
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime


# ============================================================================
# SCHEDULE SCHEMAS
# ============================================================================

class ScheduleCreate(BaseModel):
    """Schema for creating a schedule"""
    cron_expression: str = Field(..., description="Cron expression (e.g., '0 9 * * 1-5' for 9 AM weekdays)")
    timezone: str = "UTC"
    enabled: bool = True
    trigger_data: Dict[str, Any] = Field(default_factory=dict)


class ScheduleUpdate(BaseModel):
    """Schema for updating a schedule"""
    cron_expression: Optional[str] = None
    timezone: Optional[str] = None
    enabled: Optional[bool] = None
    trigger_data: Optional[Dict[str, Any]] = None


class ScheduleDetail(BaseModel):
    """Full schedule details"""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    workflow_id: UUID
    cron_expression: str
    timezone: str
    enabled: bool
    
    next_run_at: Optional[datetime] = None
    last_run_at: Optional[datetime] = None
    last_run_status: Optional[str] = None
    
    total_runs: int = 0
    successful_runs: int = 0
    failed_runs: int = 0
    consecutive_failures: int = 0
    
    auto_disabled: bool = False
    auto_disabled_at: Optional[datetime] = None
    
    trigger_data: Dict[str, Any] = Field(default_factory=dict)
    
    created_at: datetime
    updated_at: Optional[datetime] = None


# ============================================================================
# WEBHOOK SCHEMAS
# ============================================================================

class WebhookCreate(BaseModel):
    """Schema for creating a webhook"""
    method: str = "POST"
    secret_key: Optional[str] = None
    require_auth: bool = False
    allowed_ips: List[str] = Field(default_factory=list)
    response_mode: str = "immediate"
    response_data: Dict[str, Any] = Field(default_factory=lambda: {"message": "Workflow triggered"})
    rate_limit_enabled: bool = False
    rate_limit_max_calls: int = 100
    rate_limit_window_seconds: int = 60


class WebhookUpdate(BaseModel):
    """Schema for updating a webhook"""
    enabled: Optional[bool] = None
    method: Optional[str] = None
    secret_key: Optional[str] = None
    require_auth: Optional[bool] = None
    allowed_ips: Optional[List[str]] = None
    response_mode: Optional[str] = None
    response_data: Optional[Dict[str, Any]] = None
    rate_limit_enabled: Optional[bool] = None
    rate_limit_max_calls: Optional[int] = None
    rate_limit_window_seconds: Optional[int] = None


class WebhookDetail(BaseModel):
    """Full webhook details"""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    workflow_id: UUID
    path: str
    method: str
    enabled: bool
    
    require_auth: bool
    allowed_ips: List[str] = Field(default_factory=list)
    
    response_mode: str
    response_data: Dict[str, Any] = Field(default_factory=dict)
    
    total_calls: int = 0
    successful_calls: int = 0
    failed_calls: int = 0
    last_called_at: Optional[datetime] = None
    
    rate_limit_enabled: bool
    rate_limit_max_calls: int
    rate_limit_window_seconds: int
    
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Computed field for full webhook URL
    webhook_url: Optional[str] = None


# ============================================================================
# CREDENTIAL SCHEMAS
# ============================================================================

class CredentialCreate(BaseModel):
    """Schema for creating credentials"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    credential_type: str  # api_key, oauth2, basic_auth, bearer_token, custom
    integration_type: str  # slack, jira, github, etc.
    data: Dict[str, Any] = Field(..., description="Credential data to be encrypted")
    project_id: Optional[UUID] = None  # None = org-level credentials


class CredentialUpdate(BaseModel):
    """Schema for updating credentials"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


class CredentialSummary(BaseModel):
    """Summary of stored credentials (no sensitive data)"""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    name: str
    description: Optional[str] = None
    credential_type: str
    integration_type: str
    
    is_valid: bool = True
    last_used_at: Optional[datetime] = None
    use_count: int = 0
    
    created_at: datetime
    updated_at: Optional[datetime] = None


# ============================================================================
# INTEGRATION SCHEMAS
# ============================================================================

class IntegrationSchema(BaseModel):
    """Schema for available integration"""
    type: str
    name: str
    description: str
    category: str
    icon: str
    color: str
    auth_type: str  # api_key, oauth2, basic_auth, etc.
    config_schema: Dict[str, Any]  # JSON Schema for node configuration
    credential_fields: List[Dict[str, Any]]  # Fields needed for credentials


class NodeTypeSchema(BaseModel):
    """Schema for available node type"""
    type: str
    name: str
    description: str
    category: str
    icon: str
    color: str
    inputs: int  # Number of input handles
    outputs: int  # Number of output handles
    config_schema: Dict[str, Any]  # JSON Schema for node configuration


# ============================================================================
# TEMPLATE SCHEMAS
# ============================================================================

class TemplateSummary(BaseModel):
    """Summary of workflow template"""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    name: str
    description: Optional[str] = None
    category: str
    icon: Optional[str] = None
    color: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    difficulty: str = "beginner"
    estimated_setup_time: Optional[str] = None
    use_count: int = 0
    rating: Optional[float] = None
    rating_count: int = 0
    is_featured: bool = False


class TemplateDetail(BaseModel):
    """Full template details"""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    name: str
    description: Optional[str] = None
    category: str
    
    nodes: List[WorkflowNodeSchema] = Field(default_factory=list)
    edges: List[WorkflowEdgeSchema] = Field(default_factory=list)
    variables: Dict[str, Any] = Field(default_factory=dict)
    required_credentials: List[str] = Field(default_factory=list)
    
    icon: Optional[str] = None
    color: Optional[str] = None
    preview_image_url: Optional[str] = None
    
    tags: List[str] = Field(default_factory=list)
    difficulty: str = "beginner"
    estimated_setup_time: Optional[str] = None
    
    documentation: Optional[str] = None
    documentation_url: Optional[str] = None
    
    use_count: int = 0
    rating: Optional[float] = None
    rating_count: int = 0
    
    is_public: bool = True
    is_featured: bool = False
    
    created_at: datetime
    updated_at: Optional[datetime] = None


# ============================================================================
# RESPONSE WRAPPERS
# ============================================================================

class WorkflowListResponse(BaseModel):
    """Paginated list of workflows"""
    items: List[WorkflowSummary]
    total: int
    skip: int
    limit: int


class ExecutionListResponse(BaseModel):
    """Paginated list of executions"""
    items: List[ExecutionSummary]
    total: int
    skip: int
    limit: int


class TemplateListResponse(BaseModel):
    """Paginated list of templates"""
    items: List[TemplateSummary]
    total: int
    categories: List[str] = Field(default_factory=list)


# ============================================================================
# WEBSOCKET SCHEMAS
# ============================================================================

class ExecutionUpdate(BaseModel):
    """Real-time execution update via WebSocket"""
    execution_id: str
    type: str  # status_change, step_started, step_completed, step_failed, log
    timestamp: datetime
    data: Dict[str, Any] = Field(default_factory=dict)


class StepLogEntry(BaseModel):
    """Log entry from a step execution"""
    timestamp: datetime
    level: str  # debug, info, warn, error
    message: str
    data: Optional[Dict[str, Any]] = None
