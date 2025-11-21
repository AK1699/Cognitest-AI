from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID
import logging

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


def _parse_case_hid(hid: str) -> tuple[int, int, int] | None:
    # Expect TP-XXX-TS-YYY-TC-ZZZ
    try:
        parts = hid.split("-")
        if len(parts) != 6 or parts[0] != "TP" or parts[2] != "TS" or parts[4] != "TC":
            return None
        return int(parts[1]), int(parts[3]), int(parts[5])
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
    parent_suite = None
    parent_plan = None
    if test_case_data.test_suite_id:
        result = await db.execute(
            select(TestSuite).where(
                TestSuite.id == test_case_data.test_suite_id,
                TestSuite.project_id == test_case_data.project_id
            )
        )
        parent_suite = result.scalar_one_or_none()
        if not parent_suite:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Test suite not found or does not belong to this project"
            )
        # Load parent plan
        if parent_suite.test_plan_id:
            res_plan = await db.execute(select(TestPlan).where(TestPlan.id == parent_suite.test_plan_id))
            parent_plan = res_plan.scalar_one_or_none()

    # Create test case
    test_case = TestCase(**test_case_data.model_dump())
    db.add(test_case)

    # Allocate human-friendly IDs for case
    try:
        from app.services.human_id_service import HumanIdAllocator, format_case, format_plan, format_suite
        allocator = HumanIdAllocator(db)

        # Ensure parent suite and plan numeric_ids
        plan_numeric = 0
        suite_numeric = 0
        if parent_plan:
            if not parent_plan.numeric_id:
                plan_n = await db.run_sync(lambda sync: allocator.allocate_plan())
                parent_plan.numeric_id = plan_n
                parent_plan.human_id = format_plan(plan_n)
            plan_numeric = parent_plan.numeric_id
        if parent_suite:
            if not parent_suite.numeric_id:
                # Need a suite number for this suite under its plan
                suite_n = await db.run_sync(lambda sync: allocator.allocate_suite(str(parent_suite.test_plan_id)))
                parent_suite.numeric_id = suite_n
                parent_suite.human_id = format_suite(plan_numeric, suite_n)
            suite_numeric = parent_suite.numeric_id

        case_n = await db.run_sync(lambda sync: allocator.allocate_case(str(test_case.test_suite_id) if test_case.test_suite_id else "global"))
        test_case.numeric_id = case_n
        test_case.human_id = format_case(plan_numeric, suite_numeric, case_n)
    except Exception as e:
        import logging as _logging
        _logging.getLogger(__name__).error(f"Failed to allocate human_id for test case: {e}")

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


@router.get("/by-id/{plan_numeric_id}/{suite_numeric_id}/{human_id}", response_model=TestCaseResponse)
async def get_test_case_by_human_id(
    plan_numeric_id: int,
    suite_numeric_id: int,
    human_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Lookup a test case by human-friendly ID (TP-XXX-TS-YYY-TC-ZZZ) and validate hierarchy."""
    parsed = _parse_case_hid(human_id)
    if not parsed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid human_id format")
    plan_num, suite_num, case_num = parsed
    if plan_num != plan_numeric_id or suite_num != suite_numeric_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Plan/Suite mismatch")

    # Find plan and suite first
    res_plan = await db.execute(select(TestPlan).where(TestPlan.numeric_id == plan_num))
    plan = res_plan.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test plan not found")

    res_suite = await db.execute(select(TestSuite).where(TestSuite.test_plan_id == plan.id, TestSuite.numeric_id == suite_num))
    suite = res_suite.scalar_one_or_none()
    if not suite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test suite not found")

    # Now test case by (suite_id, numeric_id)
    res_case = await db.execute(select(TestCase).where(TestCase.test_suite_id == suite.id, TestCase.numeric_id == case_num))
    case = res_case.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test case not found")

    await verify_project_access(plan.project_id, current_user, db)
    return case


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
    Uses LangChain and OpenAI to generate comprehensive test cases with steps and expected results.
    """
    # Verify project access
    project = await verify_project_access(request.project_id, current_user, db)

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

    try:
        from app.services.test_plan_service import get_test_plan_service
        from app.models.test_plan import GenerationType
        from app.models.test_case import TestCasePriority, TestCaseStatus

        # Get test plan service
        test_plan_service = get_test_plan_service()

        # Generate test cases using AI
        generation_result = await test_plan_service.generate_test_cases(
            project_id=request.project_id,
            feature_description=request.feature_description,
            test_scenarios=request.test_scenarios,
            user_stories=request.user_stories,
            count=request.count,
            db=db,
        )

        if generation_result["status"] != "success":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate test cases: {generation_result.get('error', 'Unknown error')}",
            )

        # Create test cases in database
        created_test_cases = []
        for case_data in generation_result["data"]:
            # Parse steps
            steps = []
            if isinstance(case_data.get("steps"), list):
                steps = case_data["steps"]
            elif isinstance(case_data.get("steps"), str):
                # Parse string steps
                step_lines = case_data["steps"].split("\n")
                for i, line in enumerate(step_lines, 1):
                    if line.strip():
                        steps.append({
                            "step_number": i,
                            "action": line.strip(),
                            "expected_result": ""
                        })

            # Map priority
            priority_str = case_data.get("priority", "medium").lower()
            try:
                priority = TestCasePriority(priority_str)
            except (ValueError, KeyError):
                priority = TestCasePriority.MEDIUM

            # Create test case
            test_case = TestCase(
                project_id=request.project_id,
                test_suite_id=request.test_suite_id,
                title=case_data.get("title", f"Generated Test Case"),
                description=case_data.get("description"),
                steps=steps,
                expected_result=case_data.get("expected_result"),
                priority=priority,
                status=TestCaseStatus.DRAFT,
                ai_generated=True,
                generated_by=GenerationType.AI,
                tags=case_data.get("tags", []),
                meta_data=case_data.get("meta_data", {}),
                created_by=current_user.email,
            )

            db.add(test_case)
            created_test_cases.append(test_case)

        # Commit all test cases
        await db.commit()
        for case in created_test_cases:
            await db.refresh(case)

        return {
            "test_cases": created_test_cases,
            "coverage_analysis": generation_result.get("data", {}).get("coverage_analysis", "AI-generated test cases covering feature functionality"),
            "suggestions": generation_result.get("data", {}).get("suggestions", []),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger = logging.getLogger(__name__)
        logger.error(f"Error generating test cases: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate test cases due to an internal error",
        )
