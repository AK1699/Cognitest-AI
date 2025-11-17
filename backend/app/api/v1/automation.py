from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from typing import Dict, Any, List, Optional
from uuid import UUID
import logging

from app.automation.playwright.recorder import PlaywrightCodeGenerator, TestAction, ActionType
from app.core.deps import get_db, get_current_active_user
from app.models.automation import (
    AutomationScript,
    TestCaseExecutionRecord,
    AutomationScriptType,
    AutomationScriptStatus,
    ExecutionStatus,
)
from app.models.test_case import TestCase
from app.models.project import Project
from app.models.user import User
from app.schemas.automation import (
    AutomationScriptCreate,
    AutomationScriptUpdate,
    AutomationScriptResponse,
    ExecutionRecordCreate,
    ExecutionRecordUpdate,
    ExecutionRecordResponse,
    LinkAutomationRequest,
    TriggerExecutionRequest,
    TriggerExecutionResponse,
)

router = APIRouter()
logger = logging.getLogger(__name__)


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

    # Verify user has access to the organisation (owner or member)
    from sqlalchemy import text
    access_check = await db.execute(
        text("""
            SELECT 1 FROM organisations o
            LEFT JOIN user_organisations uo ON o.id = uo.organisation_id
            WHERE o.id = :org_id
            AND (o.owner_id = :user_id OR uo.user_id = :user_id)
            LIMIT 1
        """),
        {"org_id": str(project.organisation_id), "user_id": str(current_user.id)}
    )

    if not access_check.fetchone():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this project"
        )

    return project


# ==================== Automation Scripts Management ====================

@router.post("/scripts/", response_model=AutomationScriptResponse, status_code=status.HTTP_201_CREATED)
async def create_automation_script(
    script_data: AutomationScriptCreate,
    project_id: UUID = Query(..., description="Project ID"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new automation script in the Automation Hub.
    """
    # Verify project access
    project = await verify_project_access(project_id, current_user, db)

    # Create automation script
    script = AutomationScript(
        project_id=project_id,
        organisation_id=project.organisation_id,
        created_by=current_user.email,
        **script_data.model_dump()
    )
    db.add(script)
    await db.commit()
    await db.refresh(script)

    logger.info(f"Created automation script {script.id} by {current_user.email}")
    return script


@router.get("/scripts/", response_model=List[AutomationScriptResponse])
async def list_automation_scripts(
    project_id: Optional[UUID] = Query(None, description="Filter by project ID"),
    script_type: Optional[AutomationScriptType] = Query(None, description="Filter by script type"),
    status_filter: Optional[AutomationScriptStatus] = Query(None, description="Filter by status", alias="status"),
    search: Optional[str] = Query(None, description="Search in name and description"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List all automation scripts accessible to the user.
    """
    # Build query
    conditions = []

    if project_id:
        # Verify project access
        await verify_project_access(project_id, current_user, db)
        conditions.append(AutomationScript.project_id == project_id)

    if script_type:
        conditions.append(AutomationScript.script_type == script_type)

    if status_filter:
        conditions.append(AutomationScript.status == status_filter)

    if search:
        search_pattern = f"%{search}%"
        conditions.append(
            or_(
                AutomationScript.name.ilike(search_pattern),
                AutomationScript.description.ilike(search_pattern)
            )
        )

    query = select(AutomationScript)
    if conditions:
        query = query.where(and_(*conditions))

    query = query.offset(skip).limit(limit).order_by(AutomationScript.created_at.desc())

    result = await db.execute(query)
    scripts = result.scalars().all()

    return scripts


@router.get("/scripts/{script_id}", response_model=AutomationScriptResponse)
async def get_automation_script(
    script_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get details of a specific automation script.
    """
    result = await db.execute(
        select(AutomationScript).where(AutomationScript.id == script_id)
    )
    script = result.scalar_one_or_none()

    if not script:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Automation script not found"
        )

    # Verify project access
    await verify_project_access(script.project_id, current_user, db)

    return script


@router.put("/scripts/{script_id}", response_model=AutomationScriptResponse)
async def update_automation_script(
    script_id: UUID,
    script_data: AutomationScriptUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update an existing automation script.
    """
    result = await db.execute(
        select(AutomationScript).where(AutomationScript.id == script_id)
    )
    script = result.scalar_one_or_none()

    if not script:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Automation script not found"
        )

    # Verify project access
    await verify_project_access(script.project_id, current_user, db)

    # Update script
    update_data = script_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(script, key, value)

    await db.commit()
    await db.refresh(script)

    logger.info(f"Updated automation script {script_id} by {current_user.email}")
    return script


@router.delete("/scripts/{script_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_automation_script(
    script_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete an automation script.
    """
    result = await db.execute(
        select(AutomationScript).where(AutomationScript.id == script_id)
    )
    script = result.scalar_one_or_none()

    if not script:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Automation script not found"
        )

    # Verify project access
    await verify_project_access(script.project_id, current_user, db)

    await db.delete(script)
    await db.commit()

    logger.info(f"Deleted automation script {script_id} by {current_user.email}")
    return None


# ==================== Test Case Automation Linking ====================

@router.post("/test-cases/{test_case_id}/link-automation", response_model=Dict[str, Any])
async def link_automation_to_test_case(
    test_case_id: UUID,
    link_data: LinkAutomationRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Link an automation script to a test case.
    """
    # Get test case
    result = await db.execute(
        select(TestCase).where(TestCase.id == test_case_id)
    )
    test_case = result.scalar_one_or_none()

    if not test_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test case not found"
        )

    # Verify project access
    await verify_project_access(test_case.project_id, current_user, db)

    # Verify automation script exists and belongs to same project
    result = await db.execute(
        select(AutomationScript).where(
            AutomationScript.id == link_data.automation_script_id,
            AutomationScript.project_id == test_case.project_id
        )
    )
    script = result.scalar_one_or_none()

    if not script:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Automation script not found or does not belong to the same project"
        )

    # Link automation to test case
    test_case.automation_script_id = link_data.automation_script_id
    test_case.automation_enabled = True
    test_case.automation_metadata = link_data.automation_metadata

    await db.commit()
    await db.refresh(test_case)

    logger.info(f"Linked automation script {script.id} to test case {test_case_id}")

    return {
        "success": True,
        "message": "Automation script linked successfully",
        "test_case_id": test_case_id,
        "automation_script_id": link_data.automation_script_id
    }


@router.delete("/test-cases/{test_case_id}/unlink-automation", response_model=Dict[str, Any])
async def unlink_automation_from_test_case(
    test_case_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Unlink automation script from a test case.
    """
    # Get test case
    result = await db.execute(
        select(TestCase).where(TestCase.id == test_case_id)
    )
    test_case = result.scalar_one_or_none()

    if not test_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test case not found"
        )

    # Verify project access
    await verify_project_access(test_case.project_id, current_user, db)

    # Unlink automation
    test_case.automation_script_id = None
    test_case.automation_enabled = False
    test_case.automation_metadata = {}

    await db.commit()

    logger.info(f"Unlinked automation from test case {test_case_id}")

    return {
        "success": True,
        "message": "Automation script unlinked successfully",
        "test_case_id": test_case_id
    }


@router.get("/test-cases/{test_case_id}/automation", response_model=Optional[AutomationScriptResponse])
async def get_test_case_automation(
    test_case_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get the linked automation script for a test case.
    """
    # Get test case
    result = await db.execute(
        select(TestCase).where(TestCase.id == test_case_id)
    )
    test_case = result.scalar_one_or_none()

    if not test_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test case not found"
        )

    # Verify project access
    await verify_project_access(test_case.project_id, current_user, db)

    if not test_case.automation_script_id:
        return None

    # Get automation script
    result = await db.execute(
        select(AutomationScript).where(AutomationScript.id == test_case.automation_script_id)
    )
    script = result.scalar_one_or_none()

    return script


# ==================== Execution Management ====================

@router.post("/test-cases/{test_case_id}/execute", response_model=TriggerExecutionResponse)
async def trigger_test_execution(
    test_case_id: UUID,
    execution_data: TriggerExecutionRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Trigger automation execution for a test case.
    """
    # Get test case
    result = await db.execute(
        select(TestCase).where(TestCase.id == test_case_id)
    )
    test_case = result.scalar_one_or_none()

    if not test_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test case not found"
        )

    # Verify project access
    await verify_project_access(test_case.project_id, current_user, db)

    # Verify automation is enabled
    if not test_case.automation_enabled or not test_case.automation_script_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Test case does not have automation enabled"
        )

    # Get automation script
    result = await db.execute(
        select(AutomationScript).where(AutomationScript.id == test_case.automation_script_id)
    )
    script = result.scalar_one_or_none()

    if not script:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Linked automation script not found"
        )

    # Create execution record
    from datetime import datetime
    execution = TestCaseExecutionRecord(
        test_case_id=test_case_id,
        automation_script_id=script.id,
        project_id=test_case.project_id,
        execution_type="automated",
        status=ExecutionStatus.RUNNING,
        test_data=execution_data.test_data,
        execution_environment=execution_data.execution_environment or {},
        executed_by=current_user.email,
        triggered_by=current_user.email,
        start_time=datetime.utcnow()
    )
    db.add(execution)

    # Update script statistics
    script.total_executions += 1

    await db.commit()
    await db.refresh(execution)

    logger.info(f"Triggered execution {execution.id} for test case {test_case_id}")

    # TODO: Integrate with actual automation execution engine
    # This is a placeholder - actual execution would be handled by a background task

    return TriggerExecutionResponse(
        success=True,
        message="Automation execution triggered successfully",
        execution_id=execution.id,
        status=execution.status
    )


@router.get("/test-cases/{test_case_id}/executions", response_model=List[ExecutionRecordResponse])
async def get_test_case_executions(
    test_case_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get execution history for a test case.
    """
    # Get test case
    result = await db.execute(
        select(TestCase).where(TestCase.id == test_case_id)
    )
    test_case = result.scalar_one_or_none()

    if not test_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test case not found"
        )

    # Verify project access
    await verify_project_access(test_case.project_id, current_user, db)

    # Get executions
    query = select(TestCaseExecutionRecord).where(
        TestCaseExecutionRecord.test_case_id == test_case_id
    ).offset(skip).limit(limit).order_by(TestCaseExecutionRecord.created_at.desc())

    result = await db.execute(query)
    executions = result.scalars().all()

    return executions


@router.get("/executions/{execution_id}", response_model=ExecutionRecordResponse)
async def get_execution_details(
    execution_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get detailed information about a specific execution.
    """
    result = await db.execute(
        select(TestCaseExecutionRecord).where(TestCaseExecutionRecord.id == execution_id)
    )
    execution = result.scalar_one_or_none()

    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution record not found"
        )

    # Verify project access
    await verify_project_access(execution.project_id, current_user, db)

    return execution


@router.put("/executions/{execution_id}", response_model=ExecutionRecordResponse)
async def update_execution_results(
    execution_id: UUID,
    execution_data: ExecutionRecordUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update execution results (typically called by automation engine or webhook).
    """
    result = await db.execute(
        select(TestCaseExecutionRecord).where(TestCaseExecutionRecord.id == execution_id)
    )
    execution = result.scalar_one_or_none()

    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution record not found"
        )

    # Verify project access
    await verify_project_access(execution.project_id, current_user, db)

    # Update execution
    update_data = execution_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(execution, key, value)

    # If status is being set to completed/failed, update end_time
    if execution_data.status in [ExecutionStatus.PASSED, ExecutionStatus.FAILED]:
        from datetime import datetime
        execution.end_time = datetime.utcnow()

        # Update duration if not provided
        if not execution.duration and execution.start_time:
            duration = (execution.end_time - execution.start_time).total_seconds()
            execution.duration = int(duration)

        # Update automation script statistics
        if execution.automation_script_id:
            result = await db.execute(
                select(AutomationScript).where(AutomationScript.id == execution.automation_script_id)
            )
            script = result.scalar_one_or_none()

            if script:
                if execution_data.status == ExecutionStatus.PASSED:
                    script.successful_executions += 1
                elif execution_data.status == ExecutionStatus.FAILED:
                    script.failed_executions += 1

                # Update average duration
                if script.average_duration == 0:
                    script.average_duration = execution.duration
                else:
                    script.average_duration = (script.average_duration + execution.duration) // 2

    await db.commit()
    await db.refresh(execution)

    logger.info(f"Updated execution {execution_id} with status {execution.status}")
    return execution


# ==================== Playwright Code Generation (Legacy) ====================

@router.post("/playwright/generate")
async def generate_playwright_code(
    test_name: str,
    actions: List[Dict[str, Any]],
    language: str = "python"
) -> Dict[str, Any]:
    """
    Generate Playwright test code from recorded actions.
    """
    generator = PlaywrightCodeGenerator(test_name, language)

    for action_data in actions:
        action = TestAction(**action_data)
        generator.add_action(action)

    code = generator.generate_code()

    return {
        "test_name": test_name,
        "language": language,
        "code": code,
        "actions_count": len(actions)
    }


@router.get("/workflows")
async def list_workflows():
    """
    List all automation workflows.
    """
    return {"message": "Workflows endpoint - to be implemented"}
