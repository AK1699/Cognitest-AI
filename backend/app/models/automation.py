"""
Automation Hub Models for Web and Workflow Automation
"""
from sqlalchemy import Column, String, DateTime, JSON, Text, ForeignKey, Enum as SQLEnum, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


class AutomationScriptType(str, enum.Enum):
    WEB = "web"
    WORKFLOW = "workflow"
    API = "api"
    MOBILE = "mobile"


class AutomationScriptStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    INACTIVE = "inactive"
    DEPRECATED = "deprecated"


class ExecutionStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    PASSED = "passed"
    FAILED = "failed"
    ERROR = "error"
    SKIPPED = "skipped"
    CANCELLED = "cancelled"


class AutomationScript(Base):
    """
    Automation scripts from Automation Hub
    """
    __tablename__ = "automation_scripts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False)

    # Script Details
    name = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    script_type = Column(SQLEnum(AutomationScriptType, values_callable=lambda x: [e.value for e in x]), nullable=False)
    status = Column(SQLEnum(AutomationScriptStatus, values_callable=lambda x: [e.value for e in x]), default=AutomationScriptStatus.DRAFT)

    # Script Content & Configuration
    script_content = Column(Text, nullable=True)  # For simple scripts
    script_path = Column(String(1000), nullable=True)  # For file-based scripts
    script_repository = Column(String(500), nullable=True)  # Git repo URL

    # Execution Configuration
    execution_environment = Column(String(255), nullable=True)  # browser, os, etc.
    execution_timeout = Column(Integer, default=300)  # seconds
    retry_count = Column(Integer, default=0)

    # Trigger Configuration
    trigger_parameters = Column(JSON, default=dict)  # Parameters needed for execution
    environment_variables = Column(JSON, default=dict)  # Environment vars

    # Dependencies
    dependencies = Column(JSON, default=list)  # Required packages/libraries
    prerequisites = Column(JSON, default=list)  # Setup requirements

    # Metadata
    tags = Column(JSON, default=list)
    version = Column(String(50), default="1.0.0")
    category = Column(String(255), nullable=True)

    # Statistics
    total_executions = Column(Integer, default=0)
    successful_executions = Column(Integer, default=0)
    failed_executions = Column(Integer, default=0)
    average_duration = Column(Integer, default=0)  # seconds

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(String(255), nullable=False)
    last_executed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    project = relationship("Project")
    organisation = relationship("Organisation")
    test_case_executions = relationship("TestCaseExecutionRecord", back_populates="automation_script")

    def __repr__(self):
        return f"<AutomationScript {self.name}>"


class TestCaseExecutionRecord(Base):
    """
    Execution records for test cases (manual or automated)
    """
    __tablename__ = "test_case_execution_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    test_case_id = Column(UUID(as_uuid=True), ForeignKey("test_cases.id", ondelete="CASCADE"), nullable=False)
    automation_script_id = Column(UUID(as_uuid=True), ForeignKey("automation_scripts.id", ondelete="SET NULL"), nullable=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)

    # Execution Details
    execution_type = Column(String(50), default="manual")  # manual, automated
    status = Column(SQLEnum(ExecutionStatus, values_callable=lambda x: [e.value for e in x]), default=ExecutionStatus.PENDING)

    # Results
    result = Column(String(50), nullable=True)  # pass, fail, blocked, skipped
    actual_result = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)

    # Execution Logs
    execution_logs = Column(JSON, default=list)  # Detailed step-by-step logs
    console_logs = Column(Text, nullable=True)  # Raw console output
    screenshots = Column(JSON, default=list)  # URLs to screenshots
    attachments = Column(JSON, default=list)  # Other attachments

    # Performance Metrics
    duration = Column(Integer, nullable=True)  # seconds
    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True)

    # Environment Info
    execution_environment = Column(JSON, default=dict)  # browser, os, version, etc.
    triggered_by = Column(String(255), nullable=True)  # user or system

    # Test Data
    test_data = Column(JSON, default=dict)  # Input parameters used

    # Metadata
    meta_data = Column(JSON, default=dict)
    notes = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    executed_by = Column(String(255), nullable=False)

    # Relationships
    test_case = relationship("TestCase", back_populates="execution_records")
    automation_script = relationship("AutomationScript", back_populates="test_case_executions")
    project = relationship("Project")

    def __repr__(self):
        return f"<TestCaseExecutionRecord {self.id} - {self.status}>"
