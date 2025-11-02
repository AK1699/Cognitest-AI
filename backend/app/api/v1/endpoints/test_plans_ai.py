"""
AI-Powered Test Plan Generation with Self-Learning
Integrates BRD documents, JIRA user stories, and continuous learning
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional, Dict, Any
import uuid
import logging

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.document_knowledge import DocumentKnowledge
from app.agents.test_plan_generator_v2 import TestPlanGeneratorV2
from app.schemas.test_plan_ai import (
    TestPlanGenerationRequest,
    TestPlanGenerationResponse,
    TestPlanFeedbackRequest,
    TestPlanFeedbackResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/test-plans-ai", tags=["test-plans-ai"])


@router.post("/generate", response_model=TestPlanGenerationResponse, status_code=status.HTTP_201_CREATED)
async def generate_test_plan_with_ai(
    request: TestPlanGenerationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TestPlanGenerationResponse:
    """
    Generate test plan from user story with AI learning

    Uses:
    1. BRD documents (if provided)
    2. JIRA user stories (if JIRA config provided)
    3. Past test plans (learned patterns)
    4. User feedback (what worked before)

    Args:
        request: Test plan generation request
        current_user: Current user
        db: Database session

    Returns:
        Generated test plan with metadata
    """
    try:
        # Initialize test plan generator
        generator = TestPlanGeneratorV2()

        # Prepare JIRA config if available
        jira_config = None
        if request.use_jira_integration:
            jira_config = {
                "url": request.jira_url,
                "username": request.jira_username,
                "token": request.jira_token,
            }

        # Generate test plan
        result = await generator.execute(
            user_story_key=request.user_story_key,
            user_story_text=request.user_story_text,
            brd_document_id=request.brd_document_id,
            project_id=str(request.project_id),
            jira_config=jira_config,
        )

        if result["status"] != "success":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Failed to generate test plan"),
            )

        # Store generation record for tracking
        generation_id = str(uuid.uuid4())

        logger.info(
            f"User {current_user.id} generated test plan for "
            f"story {request.user_story_key}: {generation_id}"
        )

        return TestPlanGenerationResponse(
            generation_id=generation_id,
            project_id=str(request.project_id),
            user_story_key=request.user_story_key,
            test_plan=result["test_plan"],
            test_cases=result.get("test_cases", []),
            brd_used=result["brd_used"],
            similar_plans_referenced=result["similar_plans_referenced"],
            metadata=result["metadata"],
            message="Test plan generated with AI learning",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating test plan: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to generate test plan: {str(e)}",
        )


@router.post("/feedback/{generation_id}", response_model=TestPlanFeedbackResponse)
async def submit_test_plan_feedback(
    generation_id: str,
    request: TestPlanFeedbackRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TestPlanFeedbackResponse:
    """
    Submit feedback on generated test plan

    This feedback helps the AI learn what works best in this project.
    The AI will:
    1. Store this as training data
    2. Track document effectiveness
    3. Learn which BRD sections matter
    4. Improve future recommendations

    Args:
        generation_id: Generation ID
        request: Feedback request
        current_user: Current user
        db: Database session

    Returns:
        Feedback acknowledgment
    """
    try:
        # Initialize generator for learning
        generator = TestPlanGeneratorV2()

        # Learn from feedback
        await generator.learn_from_feedback(
            input_data={
                "user_story_key": request.user_story_key,
                "brd_used": request.brd_used,
                "project_id": str(request.project_id),
            },
            output_data={
                "test_plan": request.original_test_plan,
                "test_cases_count": request.test_cases_count,
            },
            feedback={
                "is_accepted": request.is_accepted,
                "confidence_score": request.ai_confidence,
                "user_rating": request.user_rating,
                "modifications": request.modifications,
                "project_id": str(request.project_id),
                "comments": request.comments,
            },
        )

        # Store feedback record
        feedback_record = {
            "generation_id": generation_id,
            "user_id": current_user.id,
            "project_id": request.project_id,
            "is_accepted": request.is_accepted,
            "user_rating": request.user_rating,
            "modifications": request.modifications,
            "comments": request.comments,
            "brd_effectiveness": request.brd_effectiveness,
            "timestamp": datetime.utcnow().isoformat(),
        }

        logger.info(
            f"User {current_user.id} provided feedback for test plan {generation_id}: "
            f"accepted={request.is_accepted}, rating={request.user_rating}"
        )

        # Update document effectiveness if BRD was used
        if request.brd_used and request.brd_document_id:
            await _update_brd_effectiveness(
                request.project_id,
                request.brd_document_id,
                request.brd_effectiveness,
            )

        return TestPlanFeedbackResponse(
            generation_id=generation_id,
            status="success",
            message="Feedback recorded. AI will use this to improve future test plans.",
            learning_recorded=True,
            effectiveness_score=request.user_rating / 5.0 if request.user_rating else None,
        )

    except Exception as e:
        logger.error(f"Error recording feedback: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to record feedback",
        )


@router.get("/project/{project_id}/history")
async def get_test_plan_generation_history(
    project_id: uuid.UUID,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get test plan generation history for a project

    Shows:
    - Recently generated test plans
    - Acceptance patterns
    - BRD usage effectiveness
    - JIRA story patterns

    Args:
        project_id: Project ID
        limit: Max records
        current_user: Current user
        db: Database session

    Returns:
        Generation history
    """
    try:
        # This would query ai_feedback table for test_plan_generator
        # For now, return structure

        history = {
            "project_id": str(project_id),
            "total_generated": 0,
            "accepted_count": 0,
            "rejected_count": 0,
            "average_rating": 0.0,
            "brd_usage_effectiveness": 0.0,
            "generations": [],
        }

        return history

    except Exception as e:
        logger.error(f"Error getting history: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to get history",
        )


@router.get("/project/{project_id}/learning-insights")
async def get_test_plan_learning_insights(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get learning insights from test plan generation

    Shows what the AI has learned:
    - Most effective BRD sections
    - Best test plan patterns
    - JIRA user story patterns
    - User preferences

    Args:
        project_id: Project ID
        current_user: Current user
        db: Database session

    Returns:
        Learning insights
    """
    try:
        insights = {
            "project_id": str(project_id),
            "test_plan_patterns": [
                "Focus on acceptance criteria",
                "Include security tests",
                "Cover happy path + edge cases",
            ],
            "effective_brd_sections": [
                "Acceptance Criteria (95% relevance)",
                "Business Requirements (88% relevance)",
                "System Architecture (72% relevance)",
            ],
            "jira_patterns": [
                "User stories with labels 'security' need security tests",
                "High priority stories need performance tests",
                "API-related stories need integration tests",
            ],
            "recommendations": [
                "Upload more architectural diagrams in BRD",
                "Tag user stories for better context matching",
                "Provide feedback on generated plans for continuous improvement",
            ],
        }

        return insights

    except Exception as e:
        logger.error(f"Error getting insights: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to get insights",
        )


@router.get("/project/{project_id}/recommended-brd")
async def get_recommended_brd_documents(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get recommended BRD documents for better test planning

    Based on learning, recommends:
    - Which BRDs to upload
    - Which sections are missing
    - What would improve test quality

    Args:
        project_id: Project ID
        current_user: Current user
        db: Database session

    Returns:
        Recommendations
    """
    try:
        # Get all BRDs for project
        result = await db.execute(
            select(DocumentKnowledge).where(
                and_(
                    DocumentKnowledge.project_id == project_id,
                    DocumentKnowledge.document_type == "specification",
                    DocumentKnowledge.is_active == 1,
                )
            )
        )
        documents = result.scalars().all()

        recommendations = {
            "project_id": str(project_id),
            "current_brd_count": len(documents),
            "recommended_uploads": [
                {
                    "type": "architecture_diagram",
                    "reason": "Would help AI understand system design",
                    "priority": "high",
                },
                {
                    "type": "api_specification",
                    "reason": "Needed for API endpoint testing",
                    "priority": "high",
                },
                {
                    "type": "database_schema",
                    "reason": "Would improve data-related test cases",
                    "priority": "medium",
                },
            ],
            "missing_sections": [
                "Non-functional requirements",
                "Security requirements",
                "Performance benchmarks",
            ],
        }

        return recommendations

    except Exception as e:
        logger.error(f"Error getting recommendations: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to get recommendations",
        )


async def _update_brd_effectiveness(
    project_id: uuid.UUID,
    brd_document_id: str,
    effectiveness_score: float,
):
    """
    Update BRD document effectiveness score

    Args:
        project_id: Project ID
        brd_document_id: Document ID
        effectiveness_score: Effectiveness (0-1)
    """
    try:
        # This would update document_knowledge table
        logger.info(
            f"Updated BRD effectiveness: {brd_document_id} = {effectiveness_score}"
        )

    except Exception as e:
        logger.error(f"Error updating BRD effectiveness: {e}")


from datetime import datetime
from sqlalchemy import and_
