from sqlalchemy import Column, String, DateTime, JSON, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base

class IssueSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class IssueStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"
    WONT_FIX = "wont_fix"

class IssueDetectedBy(str, enum.Enum):
    AI = "ai"
    MANUAL = "manual"
    AUTOMATION = "automation"

class Issue(Base):
    __tablename__ = "issues"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    related_test_case_id = Column(UUID(as_uuid=True), ForeignKey("test_cases.id", ondelete="SET NULL"), nullable=True)

    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)

    # Classification
    severity = Column(SQLEnum(IssueSeverity), default=IssueSeverity.MEDIUM)
    status = Column(SQLEnum(IssueStatus), default=IssueStatus.OPEN)
    detected_by = Column(SQLEnum(IssueDetectedBy), default=IssueDetectedBy.MANUAL)

    # AI Remediation
    remediation_suggestions = Column(JSON, default=list)  # AI-generated fix suggestions
    ai_confidence = Column(String(50), nullable=True)

    # Tracking
    steps_to_reproduce = Column(JSON, default=list)
    environment = Column(JSON, default=dict)
    attachments = Column(JSON, default=list)

    # Metadata
    tags = Column(JSON, default=list)
    metadata = Column(JSON, default=dict)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    created_by = Column(String(255), nullable=False)
    assigned_to = Column(String(255), nullable=True)

    # Relationships
    project = relationship("Project", back_populates="issues")

    def __repr__(self):
        return f"<Issue {self.title}>"
