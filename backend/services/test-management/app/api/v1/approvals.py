from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID
from datetime import datetime, timedelta

from ...core.deps import get_db, get_current_active_user
from ...models.approval_workflow import (
    ApprovalWorkflow,
    TestPlanApproval,
    ApprovalStage,
    ApprovalHistory,
    ApprovalStatus,
    ApprovalRole,
)
from ...models.test_plan import TestPlan
from ...models.project import Project
from ...models.organisation import Organisation
from ...models.user import User
from ...schemas.approval_workflow import (
    ApprovalWorkflowCreate,
    ApprovalWorkflowUpdate,
    ApprovalWorkflowResponse,
    TestPlanApprovalResponse,
    SubmitForApprovalRequest,
    ApprovalDecision,
    ApprovalHistoryResponse,
)

router = APIRouter()


async def verify_project_access(
    project_id: UUID,
    current_user: User,
    db: AsyncSession,
) -> Project:
    """Verify that the current user has access to the project."""
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    # Verify user owns the organisation
    result = await db.execute(
        select(Organisation).where(
            Organisation.id == project.organisation_id,
            Organisation.owner_id == current_user.id
        )
    )
    organisation = result.scalar_one_or_none()

    if not organisation:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this project"
        )

    return project


# ==================== Approval Workflows ====================

@router.post("/workflows", response_model=ApprovalWorkflowResponse, status_code=status.HTTP_201_CREATED)
async def create_approval_workflow(
    workflow_data: ApprovalWorkflowCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new approval workflow for a project."""
    await verify_project_access(workflow_data.project_id, current_user, db)

    workflow = ApprovalWorkflow(**workflow_data.model_dump())
    db.add(workflow)
    await db.commit()
    await db.refresh(workflow)
    return workflow


@router.get("/workflows", response_model=List[ApprovalWorkflowResponse])
async def list_approval_workflows(
    project_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List all approval workflows for a project."""
    await verify_project_access(project_id, current_user, db)

    result = await db.execute(
        select(ApprovalWorkflow).where(ApprovalWorkflow.project_id == project_id)
    )
    workflows = result.scalars().all()
    return workflows


@router.get("/workflows/{workflow_id}", response_model=ApprovalWorkflowResponse)
async def get_approval_workflow(
    workflow_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific approval workflow."""
    result = await db.execute(
        select(ApprovalWorkflow).where(ApprovalWorkflow.id == workflow_id)
    )
    workflow = result.scalar_one_or_none()

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Approval workflow not found"
        )

    await verify_project_access(workflow.project_id, current_user, db)
    return workflow


@router.put("/workflows/{workflow_id}", response_model=ApprovalWorkflowResponse)
async def update_approval_workflow(
    workflow_id: UUID,
    workflow_data: ApprovalWorkflowUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an approval workflow."""
    result = await db.execute(
        select(ApprovalWorkflow).where(ApprovalWorkflow.id == workflow_id)
    )
    workflow = result.scalar_one_or_none()

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Approval workflow not found"
        )

    await verify_project_access(workflow.project_id, current_user, db)

    for key, value in workflow_data.model_dump(exclude_unset=True).items():
        setattr(workflow, key, value)

    await db.commit()
    await db.refresh(workflow)
    return workflow


@router.delete("/workflows/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_approval_workflow(
    workflow_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an approval workflow."""
    result = await db.execute(
        select(ApprovalWorkflow).where(ApprovalWorkflow.id == workflow_id)
    )
    workflow = result.scalar_one_or_none()

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Approval workflow not found"
        )

    await verify_project_access(workflow.project_id, current_user, db)
    await db.delete(workflow)
    await db.commit()
    return None


# ==================== Test Plan Approvals ====================

@router.post("/submit", response_model=TestPlanApprovalResponse, status_code=status.HTTP_201_CREATED)
async def submit_test_plan_for_approval(
    request: SubmitForApprovalRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Submit a test plan for approval. Creates approval stages based on the workflow.
    """
    # Get test plan
    result = await db.execute(
        select(TestPlan).where(TestPlan.id == request.test_plan_id)
    )
    test_plan = result.scalar_one_or_none()

    if not test_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test plan not found"
        )

    await verify_project_access(test_plan.project_id, current_user, db)

    # Check if already has approval
    result = await db.execute(
        select(TestPlanApproval).where(TestPlanApproval.test_plan_id == request.test_plan_id)
    )
    existing_approval = result.scalar_one_or_none()

    if existing_approval:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Test plan already submitted for approval"
        )

    # Get workflow
    workflow_id = request.workflow_id
    if not workflow_id:
        # Get default active workflow for project
        result = await db.execute(
            select(ApprovalWorkflow).where(
                ApprovalWorkflow.project_id == test_plan.project_id,
                ApprovalWorkflow.is_active == "active"
            ).limit(1)
        )
        workflow = result.scalar_one_or_none()
        if not workflow:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active approval workflow found for this project"
            )
        workflow_id = workflow.id
    else:
        result = await db.execute(
            select(ApprovalWorkflow).where(ApprovalWorkflow.id == workflow_id)
        )
        workflow = result.scalar_one_or_none()

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Approval workflow not found"
        )

    # Create approval
    approval = TestPlanApproval(
        test_plan_id=request.test_plan_id,
        workflow_id=workflow_id,
        overall_status=ApprovalStatus.PENDING,
        current_stage=1,
    )
    db.add(approval)
    await db.flush()

    # Create approval stages from workflow
    for stage_config in workflow.stages:
        sla_deadline = None
        if workflow.escalation_enabled == "enabled":
            sla_deadline = datetime.utcnow() + timedelta(hours=workflow.escalation_sla_hours)

        stage = ApprovalStage(
            test_plan_approval_id=approval.id,
            stage_order=stage_config.get("order"),
            stage_role=ApprovalRole(stage_config.get("role")),
            stage_name=stage_config.get("name", stage_config.get("role")),
            status=ApprovalStatus.PENDING if stage_config.get("order") == 1 else ApprovalStatus.PENDING,
            sla_deadline=sla_deadline,
        )
        db.add(stage)

    # Create history entry
    history = ApprovalHistory(
        test_plan_approval_id=approval.id,
        action="submitted",
        actor_email=current_user.email,
        actor_name=f"{current_user.first_name} {current_user.last_name}",
        new_status=ApprovalStatus.PENDING.value,
        comments="Test plan submitted for approval",
    )
    db.add(history)

    await db.commit()
    await db.refresh(approval)

    # Load relationships
    result = await db.execute(
        select(TestPlanApproval)
        .where(TestPlanApproval.id == approval.id)
    )
    approval = result.scalar_one()

    return approval


@router.post("/approve/{approval_stage_id}", response_model=TestPlanApprovalResponse)
async def approve_stage(
    approval_stage_id: UUID,
    decision: ApprovalDecision,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Approve, reject, or request changes for an approval stage.
    """
    # Get approval stage
    result = await db.execute(
        select(ApprovalStage).where(ApprovalStage.id == approval_stage_id)
    )
    stage = result.scalar_one_or_none()

    if not stage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Approval stage not found"
        )

    # Get approval
    result = await db.execute(
        select(TestPlanApproval).where(TestPlanApproval.id == stage.test_plan_approval_id)
    )
    approval = result.scalar_one()

    # Get test plan and verify access
    result = await db.execute(
        select(TestPlan).where(TestPlan.id == approval.test_plan_id)
    )
    test_plan = result.scalar_one()

    await verify_project_access(test_plan.project_id, current_user, db)

    # Update stage
    previous_status = stage.status
    if decision.decision.lower() == "approved":
        stage.status = ApprovalStatus.APPROVED
    elif decision.decision.lower() == "rejected":
        stage.status = ApprovalStatus.REJECTED
    elif decision.decision.lower() == "changes_requested":
        stage.status = ApprovalStatus.CHANGES_REQUESTED
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid decision. Must be 'approved', 'rejected', or 'changes_requested'"
        )

    stage.decision = decision.decision
    stage.comments = decision.comments
    stage.feedback = decision.feedback
    stage.reviewed_at = datetime.utcnow()
    stage.approver_email = current_user.email
    stage.approver_name = f"{current_user.first_name} {current_user.last_name}"

    # Update overall approval status
    if stage.status == ApprovalStatus.REJECTED or stage.status == ApprovalStatus.CHANGES_REQUESTED:
        approval.overall_status = stage.status
        approval.completed_at = datetime.utcnow()
    elif stage.status == ApprovalStatus.APPROVED:
        # Check if this was the last stage
        result = await db.execute(
            select(ApprovalStage).where(
                ApprovalStage.test_plan_approval_id == approval.id,
                ApprovalStage.stage_order > stage.stage_order
            )
        )
        next_stages = result.scalars().all()

        if not next_stages:
            # All stages complete
            approval.overall_status = ApprovalStatus.APPROVED
            approval.completed_at = datetime.utcnow()
        else:
            # Move to next stage
            approval.current_stage += 1

    # Create history entry
    history = ApprovalHistory(
        test_plan_approval_id=approval.id,
        approval_stage_id=stage.id,
        action=decision.decision,
        actor_email=current_user.email,
        actor_name=f"{current_user.first_name} {current_user.last_name}",
        previous_status=previous_status.value,
        new_status=stage.status.value,
        comments=decision.comments,
        changes={"feedback": decision.feedback},
    )
    db.add(history)

    await db.commit()
    await db.refresh(approval)

    return approval


@router.get("/test-plan/{test_plan_id}", response_model=TestPlanApprovalResponse)
async def get_test_plan_approval(
    test_plan_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the approval status for a test plan."""
    result = await db.execute(
        select(TestPlanApproval).where(TestPlanApproval.test_plan_id == test_plan_id)
    )
    approval = result.scalar_one_or_none()

    if not approval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No approval found for this test plan"
        )

    # Get test plan and verify access
    result = await db.execute(
        select(TestPlan).where(TestPlan.id == test_plan_id)
    )
    test_plan = result.scalar_one()

    await verify_project_access(test_plan.project_id, current_user, db)

    return approval


@router.get("/history/{approval_id}", response_model=List[ApprovalHistoryResponse])
async def get_approval_history(
    approval_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the complete history of an approval process."""
    # Get approval
    result = await db.execute(
        select(TestPlanApproval).where(TestPlanApproval.id == approval_id)
    )
    approval = result.scalar_one_or_none()

    if not approval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Approval not found"
        )

    # Get test plan and verify access
    result = await db.execute(
        select(TestPlan).where(TestPlan.id == approval.test_plan_id)
    )
    test_plan = result.scalar_one()

    await verify_project_access(test_plan.project_id, current_user, db)

    # Get history
    result = await db.execute(
        select(ApprovalHistory)
        .where(ApprovalHistory.test_plan_approval_id == approval_id)
        .order_by(ApprovalHistory.created_at.desc())
    )
    history = result.scalars().all()

    return history
