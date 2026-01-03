from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

from app.models.approval_workflow import ApprovalStatus, ApprovalRole


# Workflow Stage Schema
class WorkflowStage(BaseModel):
    order: int = Field(..., ge=1, description="Stage order in the workflow")
    role: ApprovalRole
    required: bool = True
    parallel: bool = False  # Can this stage run in parallel with others
    stage_name: str = Field(..., description="Human-readable stage name")


# Approval Workflow Base
class ApprovalWorkflowBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    stages: List[Dict[str, Any]] = Field(default_factory=list)
    escalation_enabled: str = "disabled"
    escalation_sla_hours: int = 48


# Create Workflow
class ApprovalWorkflowCreate(ApprovalWorkflowBase):
    project_id: UUID
    organisation_id: UUID
    created_by: str


# Update Workflow
class ApprovalWorkflowUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    stages: Optional[List[Dict[str, Any]]] = None
    escalation_enabled: Optional[str] = None
    escalation_sla_hours: Optional[int] = None
    is_active: Optional[str] = None


# Workflow Response
class ApprovalWorkflowResponse(ApprovalWorkflowBase):
    id: UUID
    project_id: UUID
    organisation_id: UUID
    is_active: str
    meta_data: Dict[str, Any]
    created_at: datetime
    updated_at: Optional[datetime]
    created_by: str

    class Config:
        from_attributes = True


# Approval Stage Schema
class ApprovalStageBase(BaseModel):
    stage_order: int
    stage_role: ApprovalRole
    stage_name: str
    approver_email: Optional[str] = None
    approver_name: Optional[str] = None


class ApprovalStageResponse(ApprovalStageBase):
    id: UUID
    test_plan_approval_id: UUID
    status: ApprovalStatus
    decision: Optional[str]
    comments: Optional[str]
    feedback: List[Dict[str, Any]]
    assigned_at: datetime
    reviewed_at: Optional[datetime]
    sla_deadline: Optional[datetime]
    is_escalated: str
    meta_data: Dict[str, Any]

    class Config:
        from_attributes = True


# Test Plan Approval Schema
class TestPlanApprovalBase(BaseModel):
    test_plan_id: UUID
    workflow_id: Optional[UUID] = None


class TestPlanApprovalCreate(TestPlanApprovalBase):
    pass


class TestPlanApprovalResponse(TestPlanApprovalBase):
    id: UUID
    overall_status: ApprovalStatus
    current_stage: int
    submitted_at: datetime
    completed_at: Optional[datetime]
    approval_stages: List[ApprovalStageResponse] = []

    class Config:
        from_attributes = True


# Approval Decision Schema
class ApprovalDecision(BaseModel):
    decision: str = Field(..., description="approved, rejected, or changes_requested")
    comments: Optional[str] = Field(None, description="Comments from the approver")
    feedback: List[Dict[str, Any]] = Field(default_factory=list, description="Structured feedback items")


# Submit for Approval Request
class SubmitForApprovalRequest(BaseModel):
    test_plan_id: UUID
    workflow_id: Optional[UUID] = Field(None, description="If not provided, uses default workflow")


# Approval History Schema
class ApprovalHistoryResponse(BaseModel):
    id: UUID
    test_plan_approval_id: UUID
    approval_stage_id: Optional[UUID]
    action: str
    actor_email: str
    actor_name: Optional[str]
    previous_status: Optional[str]
    new_status: Optional[str]
    comments: Optional[str]
    changes: Dict[str, Any]
    notifications_sent: List[str]
    created_at: datetime

    class Config:
        from_attributes = True
