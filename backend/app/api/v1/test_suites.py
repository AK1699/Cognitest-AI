from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID
import logging

from app.core.deps import get_db, get_current_active_user
from app.models.test_suite import TestSuite
from app.models.test_plan import TestPlan, GenerationType
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


def _parse_suite_hid(hid: str) -> tuple[int, int] | None:
    # Expect TP-XXX-TS-YYY
    try:
        parts = hid.split("-")
        if len(parts) != 4 or parts[0] != "TP" or parts[2] != "TS":
            return None
        return int(parts[1]), int(parts[3])
    except Exception:
        return None


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

    # Allocate human-friendly IDs for suite (and ensure parent plan has numeric_id)
    try:
        from app.services.human_id_service import HumanIdAllocator, format_suite
        allocator = HumanIdAllocator(db)

        # Ensure parent plan numeric_id if linked
        plan_numeric = None
        if test_suite.test_plan_id:
            result = await db.execute(select(TestPlan).where(TestPlan.id == test_suite.test_plan_id))
            parent_plan = result.scalar_one_or_none()
            if parent_plan:
                if not parent_plan.numeric_id:
                    # allocate a plan id if missing (legacy)
                    plan_n = await db.run_sync(lambda sync_sess: allocator.allocate_plan())
                    parent_plan.numeric_id = plan_n
                    parent_plan.human_id = __import__('app.services.human_id_service', fromlist=['format_plan']).format_plan(plan_n)
                plan_numeric = parent_plan.numeric_id

        # Allocate suite number using per-plan counter (uses plan_id for locking)
        suite_n = await db.run_sync(lambda sync_sess: allocator.allocate_suite(str(test_suite.test_plan_id) if test_suite.test_plan_id else "global"))
        test_suite.numeric_id = suite_n

        # Format human id; if no plan, use 000 as plan segment
        from app.services.human_id_service import pad3
        if plan_numeric is None:
            plan_numeric = 0
        test_suite.human_id = format_suite(plan_numeric, suite_n)
    except Exception as e:
        import logging as _logging
        _logging.getLogger(__name__).error(f"Failed to allocate human_id for test suite: {e}")

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


@router.get("/by-id/{plan_numeric_id}/{human_id}", response_model=TestSuiteResponse)
async def get_test_suite_by_human_id(
    plan_numeric_id: int,
    human_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Lookup a test suite by human-friendly ID (TP-XXX-TS-YYY) and validate plan."""
    parsed = _parse_suite_hid(human_id)
    if not parsed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid human_id format")
    plan_num, suite_num = parsed
    if plan_num != plan_numeric_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Plan mismatch")

    # Find plan by numeric_id to ensure we reference the right project
    res_plan = await db.execute(select(TestPlan).where(TestPlan.numeric_id == plan_num))
    plan = res_plan.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test plan not found")

    # Now find suite by (plan_id, numeric_id)
    res_suite = await db.execute(select(TestSuite).where(TestSuite.project_id == plan.project_id, TestSuite.test_plan_id == plan.id, TestSuite.numeric_id == suite_num))
    suite = res_suite.scalar_one_or_none()
    if not suite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test suite not found")

    await verify_project_access(plan.project_id, current_user, db)
    return suite


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
    Uses LangChain and OpenAI to generate organized test suites.
    """
    # Verify project access
    project = await verify_project_access(request.project_id, current_user, db)

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

    try:
        from app.services.test_plan_service import get_test_plan_service
        from app.models.test_plan import GenerationType

        # Get test plan service
        test_plan_service = get_test_plan_service()

        # Generate test suite using AI
        generation_result = await test_plan_service.generate_test_suite_from_requirements(
            project_id=request.project_id,
            test_plan_id=request.test_plan_id,
            requirements=request.requirements or "Feature testing",
            test_scenarios=request.test_scenarios,
            db=db,
        )

        if generation_result["status"] != "success":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate test suite: {generation_result.get('error', 'Unknown error')}",
            )

        # Create test suite in database
        suite_data = generation_result["data"]
        test_suite = TestSuite(
            project_id=request.project_id,
            test_plan_id=request.test_plan_id,
            name=suite_data.get("name", "AI Generated Test Suite"),
            description=suite_data.get("description"),
            generated_by=GenerationType.AI,
            tags=suite_data.get("tags", []),
            meta_data=suite_data.get("meta_data", {}),
            created_by=current_user.email,
        )

        db.add(test_suite)
        await db.commit()
        await db.refresh(test_suite)

        return {
            "test_suite": test_suite,
            "suggested_test_cases": suite_data.get("test_cases", []),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger = logging.getLogger(__name__)
        logger.error(f"Error generating test suite: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate test suite due to an internal error",
        )
