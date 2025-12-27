from sqlalchemy import Column, String, DateTime, JSON, Text, ForeignKey, Enum as SQLEnum, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


class ApprovalStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CHANGES_REQUESTED = "changes_requested"


class ApprovalRole(str, enum.Enum):
    QA_LEAD = "qa_lead"
    TECHNICAL_LEAD = "technical_lead"
    PRODUCT_OWNER = "product_owner"
    PROJECT_ADMIN = "project_admin"


class EscalationStatus(str, enum.Enum):
    ENABLED = "enabled"
    DISABLED = "disabled"


class WorkflowStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class EscalationFlag(str, enum.Enum):
    YES = "yes"
    NO = "no"


class ApprovalWorkflow(Base):
    """
    Represents an approval workflow configuration for test plans.
    Defines the stages and roles required for approval.
    """
    __tablename__ = "approval_workflows"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False)

    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Workflow configuration
    # Each stage is: {"order": 1, "role": "qa_lead", "required": true, "parallel": false}
    stages = Column(JSON, default=list)

    # Escalation settings
    escalation_enabled = Column(SQLEnum(EscalationStatus), default=EscalationStatus.DISABLED)
    escalation_sla_hours = Column(Integer, default=48)  # Hours before escalation

    # Active status
    is_active = Column(SQLEnum(WorkflowStatus), default=WorkflowStatus.ACTIVE)

    # Metadata
    meta_data = Column(JSON, default=dict)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(String(255), nullable=False)

    # Relationships
    project = relationship("Project", back_populates="approval_workflows")
    organisation = relationship("Organisation")

    def __repr__(self):
        return f"<ApprovalWorkflow {self.name}>"


class TestPlanApproval(Base):
    """
    Represents the approval process instance for a specific test plan.
    Tracks the current stage and overall status.
    """
    __tablename__ = "test_plan_approvals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    test_plan_id = Column(UUID(as_uuid=True), ForeignKey("test_plans.id", ondelete="CASCADE"),
                          nullable=False, unique=True)
    workflow_id = Column(UUID(as_uuid=True), ForeignKey("approval_workflows.id", ondelete="SET NULL"),
                        nullable=True)

    # Current status
    overall_status = Column(SQLEnum(ApprovalStatus), default=ApprovalStatus.PENDING)
    current_stage = Column(Integer, default=1)  # Current approval stage order

    # Timestamps
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    test_plan = relationship("TestPlan", back_populates="approval")
    workflow = relationship("ApprovalWorkflow")
    approval_stages = relationship("ApprovalStage", back_populates="test_plan_approval",
                                   cascade="all, delete-orphan", order_by="ApprovalStage.stage_order")

    def __repr__(self):
        return f"<TestPlanApproval for {self.test_plan_id}>"


class ApprovalStage(Base):
    """
    Represents an individual approval stage within a test plan approval process.
    """
    __tablename__ = "approval_stages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    test_plan_approval_id = Column(UUID(as_uuid=True),
                                   ForeignKey("test_plan_approvals.id", ondelete="CASCADE"),
                                   nullable=False)

    stage_order = Column(Integer, nullable=False)  # Order in the workflow
    stage_role = Column(SQLEnum(ApprovalRole), nullable=False)
    stage_name = Column(String(255), nullable=False)  # e.g., "Technical Review"

    # Approver information
    approver_email = Column(String(255), nullable=True)  # Assigned approver
    approver_name = Column(String(255), nullable=True)

    # Decision
    status = Column(SQLEnum(ApprovalStatus), default=ApprovalStatus.PENDING)
    decision = Column(String(50), nullable=True)  # "Approved", "Rejected", "Changes Requested"
    comments = Column(Text, nullable=True)
    feedback = Column(JSON, default=list)  # List of feedback items

    # Timestamps
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    # SLA tracking
    sla_deadline = Column(DateTime(timezone=True), nullable=True)
    is_escalated = Column(SQLEnum(EscalationFlag), default=EscalationFlag.NO)

    # Metadata
    meta_data = Column(JSON, default=dict)

    # Relationships
    test_plan_approval = relationship("TestPlanApproval", back_populates="approval_stages")

    def __repr__(self):
        return f"<ApprovalStage {self.stage_name} - {self.status}>"


class ApprovalHistory(Base):
    """
    Audit trail for all approval actions and modifications.
    """
    __tablename__ = "approval_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    test_plan_approval_id = Column(UUID(as_uuid=True),
                                   ForeignKey("test_plan_approvals.id", ondelete="CASCADE"),
                                   nullable=False)
    approval_stage_id = Column(UUID(as_uuid=True),
                              ForeignKey("approval_stages.id", ondelete="SET NULL"),
                              nullable=True)

    # Action details
    action = Column(String(100), nullable=False)  # "submitted", "approved", "rejected", etc.
    actor_email = Column(String(255), nullable=False)
    actor_name = Column(String(255), nullable=True)

    # Previous and new values
    previous_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=True)

    # Details
    comments = Column(Text, nullable=True)
    changes = Column(JSON, default=dict)  # Document changes made

    # Notification tracking
    notifications_sent = Column(JSON, default=list)  # List of emails notified

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    test_plan_approval = relationship("TestPlanApproval")
    approval_stage = relationship("ApprovalStage")

    def __repr__(self):
        return f"<ApprovalHistory {self.action} by {self.actor_email}>"
