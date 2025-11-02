from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID
import logging

from app.core.deps import get_db, get_current_active_user
from app.models.test_plan import TestPlan, GenerationType
from app.models.project import Project
from app.models.organisation import Organisation
from app.models.user import User
from app.schemas.test_plan import (
    TestPlanCreate,
    TestPlanUpdate,
    TestPlanResponse,
    TestPlanAIGenerateRequest,
    TestPlanAIGenerateResponse,
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

    # Create test plan
    test_plan = TestPlan(**test_plan_data.model_dump())
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
    for key, value in test_plan_data.model_dump(exclude_unset=True).items():
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
        test_plan = TestPlan(
            project_id=request.project_id,
            name=plan_data.get("name", "AI Generated Test Plan"),
            description=plan_data.get("description"),
            objectives=request.objectives or plan_data.get("objectives", []),
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

        return {
            "test_plan": test_plan,
            "confidence_score": generation_result.get("confidence", "high"),
            "suggestions": plan_data.get("suggestions", []),
            "warnings": [],
        }

    except HTTPException:
        raise
    except Exception as e:
        logger = logging.getLogger(__name__)
        logger.error(f"Error generating test plan: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate test plan due to an internal error",
        )
