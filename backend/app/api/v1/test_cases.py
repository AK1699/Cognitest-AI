from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID

from app.core.deps import get_db, get_current_active_user
from app.models.test_case import TestCase
from app.models.test_suite import TestSuite
from app.models.project import Project
from app.models.organisation import Organisation
from app.models.user import User
from app.schemas.test_case import (
    TestCaseCreate,
    TestCaseUpdate,
    TestCaseResponse,
    TestCaseAIGenerateRequest,
    TestCaseAIGenerateResponse,
    TestExecutionRequest,
    TestExecutionResponse,
)

router = APIRouter()


async def verify_project_access(
    project_id: UUID,
    current_user: User,
    db: AsyncSession,
) -> Project:
    """
    Verify that the current user has access to the project.
    Returns the project if access is granted, raises HTTPException otherwise.
    """
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


@router.post("/", response_model=TestCaseResponse, status_code=status.HTTP_201_CREATED)
async def create_test_case(
    test_case_data: TestCaseCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new test case for a project.
    """
    # Verify project access
    await verify_project_access(test_case_data.project_id, current_user, db)

    # If test_suite_id is provided, verify it exists and belongs to the same project
    if test_case_data.test_suite_id:
        result = await db.execute(
            select(TestSuite).where(
                TestSuite.id == test_case_data.test_suite_id,
                TestSuite.project_id == test_case_data.project_id
            )
        )
        test_suite = result.scalar_one_or_none()
        if not test_suite:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Test suite not found or does not belong to this project"
            )

    # Create test case
    test_case = TestCase(**test_case_data.model_dump())
    db.add(test_case)
    await db.commit()
    await db.refresh(test_case)
    return test_case


@router.get("/", response_model=List[TestCaseResponse])
async def list_test_cases(
    project_id: UUID,
    test_suite_id: UUID = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List all test cases for a project, optionally filtered by test suite.
    """
    # Verify project access
    await verify_project_access(project_id, current_user, db)

    # Build query
    query = select(TestCase).where(TestCase.project_id == project_id)
    if test_suite_id:
        query = query.where(TestCase.test_suite_id == test_suite_id)

    result = await db.execute(query)
    test_cases = result.scalars().all()
    return test_cases


@router.get("/{test_case_id}", response_model=TestCaseResponse)
async def get_test_case(
    test_case_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a specific test case by ID.
    """
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

    return test_case


@router.put("/{test_case_id}", response_model=TestCaseResponse)
async def update_test_case(
    test_case_id: UUID,
    test_case_data: TestCaseUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update a test case.
    """
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

    # If updating test_suite_id, verify it exists and belongs to the same project
    if test_case_data.test_suite_id is not None:
        result = await db.execute(
            select(TestSuite).where(
                TestSuite.id == test_case_data.test_suite_id,
                TestSuite.project_id == test_case.project_id
            )
        )
        test_suite = result.scalar_one_or_none()
        if not test_suite:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Test suite not found or does not belong to this project"
            )

    # Update fields
    for key, value in test_case_data.model_dump(exclude_unset=True).items():
        setattr(test_case, key, value)

    await db.commit()
    await db.refresh(test_case)
    return test_case


@router.delete("/{test_case_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_test_case(
    test_case_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a test case.
    """
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

    await db.delete(test_case)
    await db.commit()

    return None


@router.post("/execute", response_model=TestExecutionResponse)
async def execute_test_case(
    execution_data: TestExecutionRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Record the execution of a test case.
    """
    result = await db.execute(
        select(TestCase).where(TestCase.id == execution_data.test_case_id)
    )
    test_case = result.scalar_one_or_none()

    if not test_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test case not found"
        )

    # Verify project access
    await verify_project_access(test_case.project_id, current_user, db)

    # Update test case with execution results
    test_case.status = execution_data.status
    if execution_data.actual_result:
        test_case.actual_result = execution_data.actual_result

    # Add attachments if provided
    if execution_data.attachments:
        existing_attachments = test_case.attachments or []
        test_case.attachments = existing_attachments + execution_data.attachments

    # Create execution log entry
    from datetime import datetime
    execution_log = {
        "timestamp": datetime.utcnow().isoformat(),
        "executed_by": current_user.email,
        "status": execution_data.status.value,
        "actual_result": execution_data.actual_result,
        "notes": execution_data.execution_notes,
        "attachments": execution_data.attachments or [],
    }

    # Add to execution logs
    existing_logs = test_case.execution_logs or []
    test_case.execution_logs = existing_logs + [execution_log]

    await db.commit()
    await db.refresh(test_case)

    return {
        "success": True,
        "test_case": test_case,
        "execution_log": execution_log,
    }


@router.post("/ai-generate", response_model=TestCaseAIGenerateResponse, status_code=status.HTTP_201_CREATED)
async def ai_generate_test_cases(
    request: TestCaseAIGenerateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate test cases using AI based on feature description.
    This is a placeholder - AI integration will be implemented later.
    """
    # Verify project access
    await verify_project_access(request.project_id, current_user, db)

    # If test_suite_id is provided, verify it exists
    if request.test_suite_id:
        result = await db.execute(
            select(TestSuite).where(
                TestSuite.id == request.test_suite_id,
                TestSuite.project_id == request.project_id
            )
        )
        test_suite = result.scalar_one_or_none()
        if not test_suite:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Test suite not found or does not belong to this project"
            )

    # TODO: Implement AI generation with LangChain
    # For now, return a placeholder response
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="AI generation not yet implemented. Will be available after LangChain integration."
    )
