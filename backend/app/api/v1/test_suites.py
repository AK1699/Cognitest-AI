from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID

from app.core.deps import get_db, get_current_active_user
from app.models.test_suite import TestSuite
from app.models.test_plan import TestPlan
from app.models.project import Project
from app.models.organisation import Organisation
from app.models.user import User
from app.schemas.test_suite import (
    TestSuiteCreate,
    TestSuiteUpdate,
    TestSuiteResponse,
    TestSuiteAIGenerateRequest,
    TestSuiteAIGenerateResponse,
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


@router.post("/", response_model=TestSuiteResponse, status_code=status.HTTP_201_CREATED)
async def create_test_suite(
    test_suite_data: TestSuiteCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new test suite for a project.
    """
    # Verify project access
    await verify_project_access(test_suite_data.project_id, current_user, db)

    # If test_plan_id is provided, verify it exists and belongs to the same project
    if test_suite_data.test_plan_id:
        result = await db.execute(
            select(TestPlan).where(
                TestPlan.id == test_suite_data.test_plan_id,
                TestPlan.project_id == test_suite_data.project_id
            )
        )
        test_plan = result.scalar_one_or_none()
        if not test_plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Test plan not found or does not belong to this project"
            )

    # Create test suite
    test_suite = TestSuite(**test_suite_data.model_dump())
    db.add(test_suite)
    await db.commit()
    await db.refresh(test_suite)
    return test_suite


@router.get("/", response_model=List[TestSuiteResponse])
async def list_test_suites(
    project_id: UUID,
    test_plan_id: UUID = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List all test suites for a project, optionally filtered by test plan.
    """
    # Verify project access
    await verify_project_access(project_id, current_user, db)

    # Build query
    query = select(TestSuite).where(TestSuite.project_id == project_id)
    if test_plan_id:
        query = query.where(TestSuite.test_plan_id == test_plan_id)

    result = await db.execute(query)
    test_suites = result.scalars().all()
    return test_suites


@router.get("/{test_suite_id}", response_model=TestSuiteResponse)
async def get_test_suite(
    test_suite_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a specific test suite by ID.
    """
    result = await db.execute(
        select(TestSuite).where(TestSuite.id == test_suite_id)
    )
    test_suite = result.scalar_one_or_none()

    if not test_suite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test suite not found"
        )

    # Verify project access
    await verify_project_access(test_suite.project_id, current_user, db)

    return test_suite


@router.put("/{test_suite_id}", response_model=TestSuiteResponse)
async def update_test_suite(
    test_suite_id: UUID,
    test_suite_data: TestSuiteUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update a test suite.
    """
    result = await db.execute(
        select(TestSuite).where(TestSuite.id == test_suite_id)
    )
    test_suite = result.scalar_one_or_none()

    if not test_suite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test suite not found"
        )

    # Verify project access
    await verify_project_access(test_suite.project_id, current_user, db)

    # If updating test_plan_id, verify it exists and belongs to the same project
    if test_suite_data.test_plan_id is not None:
        result = await db.execute(
            select(TestPlan).where(
                TestPlan.id == test_suite_data.test_plan_id,
                TestPlan.project_id == test_suite.project_id
            )
        )
        test_plan = result.scalar_one_or_none()
        if not test_plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Test plan not found or does not belong to this project"
            )

    # Update fields
    for key, value in test_suite_data.model_dump(exclude_unset=True).items():
        setattr(test_suite, key, value)

    await db.commit()
    await db.refresh(test_suite)
    return test_suite


@router.delete("/{test_suite_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_test_suite(
    test_suite_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a test suite.
    """
    result = await db.execute(
        select(TestSuite).where(TestSuite.id == test_suite_id)
    )
    test_suite = result.scalar_one_or_none()

    if not test_suite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test suite not found"
        )

    # Verify project access
    await verify_project_access(test_suite.project_id, current_user, db)

    await db.delete(test_suite)
    await db.commit()

    return None


@router.post("/ai-generate", response_model=TestSuiteAIGenerateResponse, status_code=status.HTTP_201_CREATED)
async def ai_generate_test_suite(
    request: TestSuiteAIGenerateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate a test suite using AI based on requirements.
    This is a placeholder - AI integration will be implemented later.
    """
    # Verify project access
    await verify_project_access(request.project_id, current_user, db)

    # If test_plan_id is provided, verify it exists
    if request.test_plan_id:
        result = await db.execute(
            select(TestPlan).where(
                TestPlan.id == request.test_plan_id,
                TestPlan.project_id == request.project_id
            )
        )
        test_plan = result.scalar_one_or_none()
        if not test_plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Test plan not found or does not belong to this project"
            )

    # TODO: Implement AI generation with LangChain
    # For now, return a placeholder response
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="AI generation not yet implemented. Will be available after LangChain integration."
    )
