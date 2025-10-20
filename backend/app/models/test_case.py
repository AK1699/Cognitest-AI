from sqlalchemy import Column, String, DateTime, JSON, Text, ForeignKey, Enum as SQLEnum, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base
from app.models.test_plan import GenerationType

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
    status = Column(SQLEnum(TestCaseStatus), default=TestCaseStatus.DRAFT)
    priority = Column(SQLEnum(TestCasePriority), default=TestCasePriority.MEDIUM)

    # AI Generation
    ai_generated = Column(Boolean, default=False)
    generated_by = Column(SQLEnum(GenerationType), default=GenerationType.MANUAL)
    confidence_score = Column(String(50), nullable=True)

    # Execution logs
    execution_logs = Column(JSON, default=list)

    # Metadata
    tags = Column(JSON, default=list)
    attachments = Column(JSON, default=list)
    metadata = Column(JSON, default=dict)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(String(255), nullable=False)
    assigned_to = Column(String(255), nullable=True)

    # Relationships
    project = relationship("Project", back_populates="test_cases")
    test_suite = relationship("TestSuite", back_populates="test_cases")

    def __repr__(self):
        return f"<TestCase {self.title}>"
