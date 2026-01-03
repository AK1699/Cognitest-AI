from sqlalchemy import Column, String, DateTime, JSON, Text, ForeignKey, Boolean, Integer, LargeBinary, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from .base import Base

class WorkflowDefStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"

class TriggerType(str, enum.Enum):
    MANUAL = "manual"
    SCHEDULE = "schedule"
    WEBHOOK = "webhook"
    EVENT = "event"

class ExecutionStatus(str, enum.Enum):
    PENDING = "pending"
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    STOPPED = "stopped"
    WAITING = "waiting"
    TIMEOUT = "timeout"

class StepStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"
    WAITING = "waiting"

class CredentialType(str, enum.Enum):
    API_KEY = "api_key"
    OAUTH2 = "oauth2"
    BASIC_AUTH = "basic_auth"
    BEARER_TOKEN = "bearer_token"
    CUSTOM = "custom"

class WorkflowDefinition(Base):
    __tablename__ = "workflow_definitions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False, index=True)
    human_id = Column(String(20), unique=True, nullable=True, index=True)
    name = Column(String(500), nullable=False, index=True)
    description = Column(Text, nullable=True)
    status = Column(SQLEnum(WorkflowDefStatus, name='workflow_def_status', values_callable=lambda x: [e.value for e in x]), default=WorkflowDefStatus.DRAFT, index=True)
    trigger_type = Column(SQLEnum(TriggerType, values_callable=lambda x: [e.value for e in x]), default=TriggerType.MANUAL)
    trigger_config = Column(JSON, default=dict)
    nodes_json = Column(JSON, default=list)
    edges_json = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    executions = relationship("WorkflowExecution", back_populates="workflow")

class WorkflowExecution(Base):
    __tablename__ = "workflow_executions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id = Column(UUID(as_uuid=True), ForeignKey("workflow_definitions.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    human_id = Column(String(20), unique=True, nullable=True, index=True)
    status = Column(SQLEnum(ExecutionStatus, values_callable=lambda x: [e.value for e in x]), default=ExecutionStatus.PENDING, index=True)
    trigger_source = Column(String(50), nullable=False)
    trigger_data = Column(JSON, default=dict)
    output_data = Column(JSON, default=dict)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    duration_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    workflow = relationship("WorkflowDefinition", back_populates="executions")
    steps = relationship("WorkflowExecutionStep", back_populates="execution")

class WorkflowExecutionStep(Base):
    __tablename__ = "workflow_execution_steps"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    execution_id = Column(UUID(as_uuid=True), ForeignKey("workflow_executions.id", ondelete="CASCADE"), nullable=False, index=True)
    node_id = Column(String(100), nullable=False)
    node_type = Column(String(100), nullable=False)
    status = Column(SQLEnum(StepStatus, values_callable=lambda x: [e.value for e in x]), default=StepStatus.PENDING, index=True)
    input_data = Column(JSON, default=dict)
    output_data = Column(JSON, default=dict)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    execution = relationship("WorkflowExecution", back_populates="steps")

class WorkflowCredential(Base):
    __tablename__ = "workflow_credentials"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)
    credential_type = Column(SQLEnum(CredentialType, values_callable=lambda x: [e.value for e in x]), nullable=False)
    encrypted_data = Column(LargeBinary, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
