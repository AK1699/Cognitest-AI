from sqlalchemy import Column, String, DateTime, JSON, Text, ForeignKey, Enum as SQLEnum, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base
from app.models.test_plan import GenerationType

# Forward declarations for circular import handling
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.models.automation import AutomationScript, TestCaseExecutionRecord

class TestCaseStatus(str, enum.Enum):
    DRAFT = "draft"
    READY = "ready"
    IN_PROGRESS = "in_progress"
    PASSED = "passed"
    FAILED = "failed"
    BLOCKED = "blocked"
    SKIPPED = "skipped"

class TestCasePriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class TestCase(Base):
    __tablename__ = "test_cases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    test_suite_id = Column(UUID(as_uuid=True), ForeignKey("test_suites.id", ondelete="CASCADE"), nullable=True)

    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)

    # Test steps
    steps = Column(JSON, default=list)  # [{"step": "...", "expected": "..."}]

    # Results
    expected_result = Column(Text, nullable=True)
    actual_result = Column(Text, nullable=True)

    # Status & Priority
    status = Column(SQLEnum(TestCaseStatus, values_callable=lambda x: [e.value for e in x]), default=TestCaseStatus.DRAFT)
    priority = Column(SQLEnum(TestCasePriority, values_callable=lambda x: [e.value for e in x]), default=TestCasePriority.MEDIUM)

    # AI Generation
    ai_generated = Column(Boolean, default=False)
    generated_by = Column(SQLEnum(GenerationType, values_callable=lambda x: [e.value for e in x]), default=GenerationType.MANUAL)
    confidence_score = Column(String(50), nullable=True)

    # Execution logs
    execution_logs = Column(JSON, default=list)

    # Automation Integration
    automation_script_id = Column(UUID(as_uuid=True), ForeignKey("automation_scripts.id", ondelete="SET NULL"), nullable=True)
    automation_enabled = Column(Boolean, default=False)
    automation_metadata = Column(JSON, default=dict)  # Script config, parameters, etc.

    # Metadata
    tags = Column(JSON, default=list)
    attachments = Column(JSON, default=list)
    meta_data = Column(JSON, default=dict)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(String(255), nullable=False)
    assigned_to = Column(String(255), nullable=True)

    # Relationships
    project = relationship("Project", back_populates="test_cases")
    test_suite = relationship("TestSuite", back_populates="test_cases")
    automation_script = relationship("AutomationScript", foreign_keys=[automation_script_id])
    execution_records = relationship("TestCaseExecutionRecord", back_populates="test_case", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<TestCase {self.title}>"
