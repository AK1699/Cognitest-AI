from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from typing import List, Optional, Dict, Any
from uuid import UUID
import logging
from datetime import datetime

from app.core.deps import get_db, get_current_active_user
from app.models.test_plan import TestPlan, GenerationType, TestPlanType, ReviewStatus
from app.models.test_suite import TestSuite
from app.models.test_case import TestCase, TestCasePriority, TestCaseStatus
from app.models.project import Project
from app.models.organisation import Organisation
from app.models.user import User
from app.schemas.test_plan import (
    TestPlanCreate,
    TestPlanUpdate,
    TestPlanResponse,
    TestPlanAIGenerateRequest,
    TestPlanAIGenerateResponse,
    TestPlanApprovalRequest,
    TestPlanBulkUpdateRequest,
)

router = APIRouter()
logger = logging.getLogger(__name__)


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


@router.post("/", response_model=TestPlanResponse, status_code=status.HTTP_201_CREATED)
async def create_test_plan(
    test_plan_data: TestPlanCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new test plan for a project.
    """
    # Verify project access
    await verify_project_access(test_plan_data.project_id, current_user, db)

    # Convert data to dict for processing
    plan_data = test_plan_data.model_dump()

    # Handle milestone conversion if present
    if 'milestones' in plan_data and plan_data['milestones']:
        plan_data['milestones'] = [
            milestone.model_dump() if hasattr(milestone, 'model_dump') else milestone
            for milestone in plan_data['milestones']
        ]

    # Create test plan
    test_plan = TestPlan(**plan_data)
    db.add(test_plan)
    await db.commit()
    await db.refresh(test_plan)
    return test_plan


@router.get("/", response_model=List[TestPlanResponse])
async def list_test_plans(
    project_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List all test plans for a project.
    """
    # Verify project access
    await verify_project_access(project_id, current_user, db)

    # Get test plans
    result = await db.execute(
        select(TestPlan).where(TestPlan.project_id == project_id)
    )
    test_plans = result.scalars().all()
    return test_plans


@router.get("/{test_plan_id}", response_model=TestPlanResponse)
async def get_test_plan(
    test_plan_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a specific test plan by ID.
    """
    result = await db.execute(
        select(TestPlan).where(TestPlan.id == test_plan_id)
    )
    test_plan = result.scalar_one_or_none()

    if not test_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test plan not found"
        )

    # Verify project access
    await verify_project_access(test_plan.project_id, current_user, db)

    return test_plan


@router.put("/{test_plan_id}", response_model=TestPlanResponse)
async def update_test_plan(
    test_plan_id: UUID,
    test_plan_data: TestPlanUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update a test plan.
    """
    result = await db.execute(
        select(TestPlan).where(TestPlan.id == test_plan_id)
    )
    test_plan = result.scalar_one_or_none()

    if not test_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test plan not found"
        )

    # Verify project access
    await verify_project_access(test_plan.project_id, current_user, db)

    # Update fields
    update_data = test_plan_data.model_dump(exclude_unset=True)

    # Handle milestone conversion if present
    if 'milestones' in update_data and update_data['milestones'] is not None:
        # Convert Pydantic models to dicts for JSON storage
        update_data['milestones'] = [
            milestone.model_dump() if hasattr(milestone, 'model_dump') else milestone
            for milestone in update_data['milestones']
        ]

    # Set last_updated_by if not explicitly provided
    if 'last_updated_by' not in update_data:
        update_data['last_updated_by'] = current_user.email

    for key, value in update_data.items():
        setattr(test_plan, key, value)

    await db.commit()
    await db.refresh(test_plan)
    return test_plan


@router.delete("/{test_plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_test_plan(
    test_plan_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a test plan.
    """
    result = await db.execute(
        select(TestPlan).where(TestPlan.id == test_plan_id)
    )
    test_plan = result.scalar_one_or_none()

    if not test_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test plan not found"
        )

    # Verify project access
    await verify_project_access(test_plan.project_id, current_user, db)

    await db.delete(test_plan)
    await db.commit()

    return None


@router.post("/{test_plan_id}/approve", response_model=TestPlanResponse)
async def approve_or_reject_test_plan(
    test_plan_id: UUID,
    approval_data: TestPlanApprovalRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Approve or reject a test plan.
    Updates the review status and adds the reviewer to the list.
    """
    result = await db.execute(
        select(TestPlan).where(TestPlan.id == test_plan_id)
    )
    test_plan = result.scalar_one_or_none()

    if not test_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test plan not found"
        )

    # Verify project access
    await verify_project_access(test_plan.project_id, current_user, db)

    # Update review status
    test_plan.review_status = approval_data.review_status
    test_plan.review_comments = approval_data.review_comments

    # Add reviewer to the list if not already present
    if approval_data.reviewer_id not in test_plan.reviewed_by_ids:
        reviewed_by = list(test_plan.reviewed_by_ids) if test_plan.reviewed_by_ids else []
        reviewed_by.append(approval_data.reviewer_id)
        test_plan.reviewed_by_ids = reviewed_by

    # Set approval date if approved
    if approval_data.review_status == ReviewStatus.APPROVED:
        test_plan.approval_date = datetime.utcnow()

    # Update last_updated_by
    test_plan.last_updated_by = current_user.email

    await db.commit()
    await db.refresh(test_plan)
    return test_plan


@router.get("/by-status/", response_model=List[TestPlanResponse])
async def list_test_plans_by_status(
    project_id: UUID,
    review_status: Optional[ReviewStatus] = Query(None, description="Filter by review status"),
    test_plan_type: Optional[TestPlanType] = Query(None, description="Filter by test plan type"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List test plans for a project with optional filtering by status and type.
    """
    # Verify project access
    await verify_project_access(project_id, current_user, db)

    # Build query with filters
    query = select(TestPlan).where(TestPlan.project_id == project_id)

    if review_status:
        query = query.where(TestPlan.review_status == review_status)

    if test_plan_type:
        query = query.where(TestPlan.test_plan_type == test_plan_type)

    result = await db.execute(query)
    test_plans = result.scalars().all()
    return test_plans


@router.post("/bulk-update", response_model=List[TestPlanResponse])
async def bulk_update_test_plans(
    bulk_update_data: TestPlanBulkUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Bulk update multiple test plans at once.
    Useful for updating common fields across multiple test plans.
    """
    # Fetch all test plans
    result = await db.execute(
        select(TestPlan).where(TestPlan.id.in_(bulk_update_data.test_plan_ids))
    )
    test_plans = result.scalars().all()

    if not test_plans:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No test plans found with the provided IDs"
        )

    # Verify access to all test plans
    for test_plan in test_plans:
        await verify_project_access(test_plan.project_id, current_user, db)

    # Update all test plans
    update_data = bulk_update_data.update_data.model_dump(exclude_unset=True)

    # Handle milestone conversion if present
    if 'milestones' in update_data and update_data['milestones'] is not None:
        update_data['milestones'] = [
            milestone.model_dump() if hasattr(milestone, 'model_dump') else milestone
            for milestone in update_data['milestones']
        ]

    # Set last_updated_by if not explicitly provided
    if 'last_updated_by' not in update_data:
        update_data['last_updated_by'] = current_user.email

    for test_plan in test_plans:
        for key, value in update_data.items():
            setattr(test_plan, key, value)

    await db.commit()

    # Refresh all test plans
    for test_plan in test_plans:
        await db.refresh(test_plan)

    return test_plans


@router.get("/{test_plan_id}/summary")
async def get_test_plan_summary(
    test_plan_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a summary of the test plan including statistics and progress.
    """
    result = await db.execute(
        select(TestPlan).where(TestPlan.id == test_plan_id)
    )
    test_plan = result.scalar_one_or_none()

    if not test_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test plan not found"
        )

    # Verify project access
    await verify_project_access(test_plan.project_id, current_user, db)

    # Calculate milestone completion
    total_milestones = len(test_plan.milestones) if test_plan.milestones else 0
    completed_milestones = 0
    if test_plan.milestones:
        completed_milestones = sum(
            1 for m in test_plan.milestones
            if isinstance(m, dict) and m.get('status') == 'completed'
        )

    milestone_completion_rate = (completed_milestones / total_milestones * 100) if total_milestones > 0 else 0

    # Calculate schedule status
    schedule_status = "not_started"
    if test_plan.actual_start_date:
        if test_plan.actual_end_date:
            schedule_status = "completed"
        else:
            schedule_status = "in_progress"

    return {
        "id": test_plan.id,
        "name": test_plan.name,
        "review_status": test_plan.review_status,
        "test_plan_type": test_plan.test_plan_type,
        "schedule": {
            "status": schedule_status,
            "planned_start": test_plan.planned_start_date,
            "planned_end": test_plan.planned_end_date,
            "actual_start": test_plan.actual_start_date,
            "actual_end": test_plan.actual_end_date,
        },
        "milestones": {
            "total": total_milestones,
            "completed": completed_milestones,
            "completion_rate": milestone_completion_rate,
        },
        "targets": {
            "test_coverage": test_plan.test_coverage_target,
            "automation_coverage": test_plan.automation_coverage_target,
            "defect_density": test_plan.defect_density_target,
        },
        "team": {
            "test_manager": str(test_plan.test_manager_id) if test_plan.test_manager_id else None,
            "qa_leads_count": len(test_plan.qa_lead_ids) if test_plan.qa_lead_ids else 0,
            "qa_engineers_count": len(test_plan.qa_engineer_ids) if test_plan.qa_engineer_ids else 0,
            "stakeholders_count": len(test_plan.stakeholder_ids) if test_plan.stakeholder_ids else 0,
        },
        "created_at": test_plan.created_at,
        "created_by": test_plan.created_by,
        "last_updated_by": test_plan.last_updated_by,
    }


@router.post("/ai-generate", response_model=TestPlanAIGenerateResponse, status_code=status.HTTP_201_CREATED)
async def ai_generate_test_plan(
    request: TestPlanAIGenerateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate a test plan using AI based on source documents.
    Uses LangChain and OpenAI to generate comprehensive test plans from BRDs.
    """
    logger.info(f"AI Generate Test Plan Request: project_id={request.project_id}, source_docs={request.source_documents}")

    # Verify project access
    project = await verify_project_access(request.project_id, current_user, db)

    try:
        from app.services.test_plan_service import get_test_plan_service

        # Get test plan service
        test_plan_service = get_test_plan_service()

        # Generate test plan using AI
        generation_result = await test_plan_service.generate_test_plan_from_brd(
            project_id=request.project_id,
            document_ids=request.source_documents,
            additional_context=request.additional_context,
            db=db,
        )

        if generation_result["status"] != "success":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate test plan: {generation_result.get('error', 'Unknown error')}",
            )

        # Create test plan in database
        plan_data = generation_result["data"]

        # Extract objectives - handle both simple strings and complex objects
        objectives_raw = request.objectives or plan_data.get("objectives", [])
        objectives_list = [
            obj.get("objective", "") if isinstance(obj, dict) else str(obj)
            for obj in objectives_raw
        ] if objectives_raw else []

        test_plan = TestPlan(
            project_id=request.project_id,
            name=plan_data.get("name", "AI Generated Test Plan"),
            description=plan_data.get("description"),
            objectives=objectives_list,
            generated_by=GenerationType.AI,
            source_documents=request.source_documents,
            confidence_score=generation_result.get("confidence", "high"),
            tags=plan_data.get("tags", []),
            meta_data=plan_data.get("meta_data", {}),
            created_by=current_user.email,
        )

        db.add(test_plan)
        await db.commit()
        await db.refresh(test_plan)

        logger.info(f"Test plan created successfully: {test_plan.id}")
        logger.info(f"Test plan objectives type: {type(test_plan.objectives)}, value: {test_plan.objectives}")

        try:
            response_data = {
                "test_plan": test_plan,
                "confidence_score": generation_result.get("confidence", "high"),
                "suggestions": plan_data.get("suggestions", []),
                "warnings": [],
            }
            logger.info(f"Returning response with test_plan id: {test_plan.id}")
            return response_data
        except Exception as response_error:
            logger.error(f"Error creating response object: {response_error}")
            import traceback
            traceback.print_exc()
            raise

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating test plan: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate test plan: {str(e)}",
        )


@router.post("/generate-comprehensive", response_model=TestPlanResponse, status_code=status.HTTP_201_CREATED)
async def generate_comprehensive_test_plan(
    request: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate a comprehensive test plan following IEEE 829 standard.

    This endpoint creates a comprehensive test plan with all industry-standard sections:
    - Test Objectives
    - Scope of Testing
    - Test Approach
    - Assumptions and Constraints
    - Test Schedule
    - Resources and Roles
    - Test Environment
    - Entry/Exit Criteria
    - Risk Management
    - Deliverables and Reporting
    - Approval/Sign-off
    - Test Suites with Test Cases

    Request body should include:
    - project_id: UUID of the project
    - project_type: Type of project (web-app, mobile-app, api, etc.)
    - description: Project description
    - features: List of features to test
    - platforms: List of target platforms
    - priority: Priority level (low, medium, high, critical)
    - complexity: Complexity level (low, medium, high)
    - timeframe: Expected timeframe (e.g., "2-4 weeks")
    """
    # Log incoming request for debugging
    print(f"\n\n{'='*80}")
    print(f"COMPREHENSIVE TEST PLAN REQUEST RECEIVED")
    print(f"Request data: {request}")
    print(f"{'='*80}\n")
    logger.info(f"Received comprehensive test plan request: {request}")

    # Extract project_id and verify access
    project_id = request.get("project_id")
    if not project_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="project_id is required"
        )

    try:
        from uuid import UUID
        project_id = UUID(project_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project_id format"
        )

    # Verify project access
    await verify_project_access(project_id, current_user, db)

    try:
        from app.services.comprehensive_test_plan_service import get_comprehensive_test_plan_service

        # Get comprehensive test plan service
        comprehensive_service = get_comprehensive_test_plan_service()

        # Generate comprehensive test plan
        generation_result = await comprehensive_service.generate_comprehensive_test_plan(
            project_id=project_id,
            requirements=request,
            db=db,
        )

        if generation_result["status"] != "success":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate test plan: {generation_result.get('error', 'Unknown error')}",
            )

        # Create test plan in database with IEEE 829 sections
        plan_data = generation_result["data"]
        logger.info(f"Creating TestPlan with plan_data keys: {plan_data.keys()}")

        test_plan = TestPlan(
            project_id=project_id,
            name=plan_data.get("name", "Comprehensive Test Plan"),
            description=plan_data.get("description"),
            test_plan_type=TestPlanType.REGRESSION.value,  # Default type - use .value for enum

            # IEEE 829 comprehensive sections
            test_objectives_ieee=plan_data.get("test_objectives", []),
            scope_of_testing_ieee=plan_data.get("scope_of_testing", {}),
            test_approach_ieee=plan_data.get("test_approach", {}),
            assumptions_constraints_ieee=plan_data.get("assumptions_and_constraints", []),
            test_schedule_ieee=plan_data.get("test_schedule", {}),
            resources_roles_ieee=plan_data.get("resources_and_roles", []),
            test_environment_ieee=plan_data.get("test_environment", {}),
            entry_exit_criteria_ieee=plan_data.get("entry_exit_criteria", {}),
            risk_management_ieee=plan_data.get("risk_management", {}),
            deliverables_reporting_ieee=plan_data.get("deliverables_and_reporting", {}),
            approval_signoff_ieee=plan_data.get("approval_signoff", {}),

            # Legacy fields for backward compatibility
            # Extract objective text from test_objectives objects
            objectives=[
                obj.get("objective", "") if isinstance(obj, dict) else str(obj)
                for obj in plan_data.get("test_objectives", [])
            ],
            scope_in=plan_data.get("scope_of_testing", {}).get("in_scope", []),
            scope_out=plan_data.get("scope_of_testing", {}).get("out_of_scope", []),

            # Metadata
            generated_by=GenerationType.AI.value,
            confidence_score=generation_result.get("confidence", "high"),
            review_status=ReviewStatus.DRAFT.value,
            tags=plan_data.get("tags", []),
            meta_data={
                "estimated_hours": plan_data.get("estimated_hours"),
                "complexity": plan_data.get("complexity"),
                "timeframe": plan_data.get("timeframe"),
                "project_type": plan_data.get("project_type"),
                "platforms": plan_data.get("platforms", []),
                "features": plan_data.get("features", []),
            },
            created_by=current_user.email,
        )

        db.add(test_plan)
        logger.info("Added test_plan to session, flushing...")
        await db.flush()  # Flush to get test_plan.id
        logger.info(f"TestPlan created with ID: {test_plan.id}")

        # Create test suites and test cases if provided
        test_suites_data = plan_data.get("test_suites", [])
        for suite_data in test_suites_data:
            # Store category in meta_data if provided
            suite_meta_data = suite_data.get("meta_data", {})
            if "category" in suite_data:
                suite_meta_data["category"] = suite_data["category"]

            test_suite = TestSuite(
                project_id=project_id,
                test_plan_id=test_plan.id,
                name=suite_data.get("name", "Test Suite"),
                description=suite_data.get("description", ""),
                tags=suite_data.get("tags", []),
                meta_data=suite_meta_data,
                generated_by=GenerationType.AI.value,
                created_by=current_user.email,
            )
            db.add(test_suite)
            await db.flush()  # Get suite ID

            # Create test cases for this suite
            test_cases_data = suite_data.get("test_cases", [])
            for case_data in test_cases_data:
                # Convert steps to expected format
                steps = case_data.get("steps", [])
                if steps and isinstance(steps[0], dict):
                    # Already in correct format
                    pass
                else:
                    # Convert simple list to dict format
                    steps = [
                        {
                            "step_number": idx + 1,
                            "action": step if isinstance(step, str) else step.get("action", ""),
                            "expected_result": step.get("expected_result", "") if isinstance(step, dict) else ""
                        }
                        for idx, step in enumerate(steps)
                    ]

                # Store estimated_time in meta_data if provided
                case_meta_data = case_data.get("meta_data", {})
                if "estimated_time" in case_data:
                    case_meta_data["estimated_time"] = case_data["estimated_time"]

                test_case = TestCase(
                    project_id=project_id,
                    test_suite_id=test_suite.id,
                    title=case_data.get("name", "Test Case"),
                    description=case_data.get("description", ""),
                    steps=steps,
                    expected_result=case_data.get("expected_result", ""),
                    priority=TestCasePriority[case_data.get("priority", "medium").upper()].value,
                    status=TestCaseStatus.DRAFT.value,
                    generated_by=GenerationType.AI.value,
                    meta_data=case_meta_data,
                    created_by=current_user.email,
                )
                db.add(test_case)

        await db.commit()
        await db.refresh(test_plan)

        return test_plan

    except HTTPException:
        raise
    except Exception as e:
        print(f"\n\n{'='*80}")
        print(f"ERROR IN COMPREHENSIVE TEST PLAN GENERATION")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        import traceback
        print(f"Traceback:")
        traceback.print_exc()
        print(f"{'='*80}\n")
        logger.error(f"Error generating comprehensive test plan: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate comprehensive test plan: {str(e)}",
        )
