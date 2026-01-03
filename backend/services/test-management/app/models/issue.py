from sqlalchemy import Column, String, DateTime, JSON, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from cognitest_common import Base

class IssueSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class IssueStatus(str, enum.Enum):
    NEW = "new"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    FIXED = "fixed"
    RETESTED = "retested"
    CLOSED = "closed"
    REOPENED = "reopened"
    WONT_FIX = "wont_fix"
    DUPLICATE = "duplicate"
    DEFERRED = "deferred"

class IssuePriority(str, enum.Enum):
    TRIVIAL = "trivial"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"
    BLOCKER = "blocker"

class IssueDetectedBy(str, enum.Enum):
    AI = "ai"
    MANUAL = "manual"
    AUTOMATION = "automation"

class Issue(Base):
    __tablename__ = "issues"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)

    # Related entities
    related_test_case_id = Column(UUID(as_uuid=True), ForeignKey("test_cases.id", ondelete="SET NULL"), nullable=True)
    test_run_id = Column(UUID(as_uuid=True), nullable=True)  # Link to test execution run
    test_plan_id = Column(UUID(as_uuid=True), ForeignKey("test_plans.id", ondelete="SET NULL"), nullable=True)

    # External tool linkage
    external_issue_key = Column(String(255), nullable=True)  # JIRA-123, GitHub #456, etc.
    external_system = Column(String(100), nullable=True)  # "jira", "github", "testrail"
    external_url = Column(String(500), nullable=True)

    # Basic Information
    title = Column(String(500), nullable=False, index=True)
    description = Column(Text, nullable=True)

    # Classification
    severity = Column(SQLEnum(IssueSeverity), default=IssueSeverity.MEDIUM, index=True)
    priority = Column(SQLEnum(IssuePriority), default=IssuePriority.MEDIUM, index=True)
    status = Column(SQLEnum(IssueStatus), default=IssueStatus.NEW, index=True)
    detected_by = Column(SQLEnum(IssueDetectedBy), default=IssueDetectedBy.MANUAL)

    # Assignment and ownership
    created_by = Column(String(255), nullable=False)
    assigned_to = Column(UUID(as_uuid=True), nullable=True)  # User ID of assignee
    assigned_to_name = Column(String(255), nullable=True)  # Name for display
    reporter_id = Column(UUID(as_uuid=True), nullable=True)  # User ID of reporter

    # Resolution tracking
    resolution = Column(String(255), nullable=True)  # "Fixed", "Duplicate", "Works as Designed", etc.
    resolution_notes = Column(Text, nullable=True)
    fixed_in_version = Column(String(100), nullable=True)

    # AI Remediation
    remediation_suggestions = Column(JSON, default=list)  # AI-generated fix suggestions
    ai_confidence = Column(String(50), nullable=True)
    root_cause_analysis = Column(Text, nullable=True)  # AI-generated RCA

    # Tracking
    steps_to_reproduce = Column(JSON, default=list)
    actual_result = Column(Text, nullable=True)
    expected_result = Column(Text, nullable=True)
    environment = Column(JSON, default=dict)  # Browser, OS, device info
    attachments = Column(JSON, default=list)  # Screenshots, logs, videos

    # Impact Assessment
    affected_features = Column(JSON, default=list)  # List of affected features
    affected_users = Column(String(255), nullable=True)  # "All users", "Premium users", etc.
    workaround = Column(Text, nullable=True)

    # History and Comments
    comments = Column(JSON, default=list)  # Issue comments/updates
    status_history = Column(JSON, default=list)  # Status change history

    # Metrics
    estimated_effort_hours = Column(String(50), nullable=True)
    actual_effort_hours = Column(String(50), nullable=True)

    # Metadata
    tags = Column(JSON, default=list)
    labels = Column(JSON, default=list)
    meta_data = Column(JSON, default=dict)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    assigned_at = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    retested_at = Column(DateTime(timezone=True), nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    project = relationship("Project")  # Removed back_populates since Project.issues is commented out
    test_plan = relationship("TestPlan", foreign_keys=[test_plan_id])

    def __repr__(self):
        return f"<Issue {self.title}>"
