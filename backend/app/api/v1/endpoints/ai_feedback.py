"""
API endpoints for AI feedback and self-learning system
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Dict, Any
import uuid
import logging

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.ai_feedback import AIFeedback, AgentPerformance, FeedbackType
from app.models.user import User
from app.schemas.ai_feedback import (
    AIFeedbackCreate,
    AIFeedbackResponse,
    AgentPerformanceResponse,
)
from app.services.ai_service import get_ai_service
from app.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai/feedback", tags=["ai-feedback"])


@router.post("/submit", response_model=AIFeedbackResponse, status_code=status.HTTP_201_CREATED)
async def submit_feedback(
    feedback_data: AIFeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AIFeedbackResponse:
    """
    Submit feedback on AI agent output for self-learning.

    This endpoint accepts user feedback on AI-generated content, which is then:
    1. Stored in PostgreSQL for tracking and analytics
    2. Stored in Qdrant vector database for semantic search and learning
    3. Used to improve future AI suggestions

    Args:
        feedback_data: Feedback submission
        current_user: Current authenticated user
        db: Database session

    Returns:
        Created feedback record
    """
    try:
        # Create feedback record
        feedback = AIFeedback(
            project_id=feedback_data.project_id,
            agent_name=feedback_data.agent_name,
            agent_type=feedback_data.agent_type,
            feedback_type=feedback_data.feedback_type,
            input_data=feedback_data.input_data,
            output_data=feedback_data.output_data,
            user_feedback=feedback_data.user_feedback,
            is_accepted=feedback_data.is_accepted,
            confidence_score=feedback_data.confidence_score,
            user_rating=feedback_data.user_rating,
            modifications=feedback_data.modifications,
            user_id=current_user.id,
        )

        db.add(feedback)
        await db.commit()
        await db.refresh(feedback)

        # Trigger async learning (store in vector DB)
        # This is done asynchronously to not block the request
        try:
            await _store_feedback_in_qdrant(
                feedback_id=feedback.id,
                project_id=feedback.project_id,
                agent_name=feedback.agent_name,
                input_data=feedback.input_data,
                output_data=feedback.output_data,
                user_feedback=feedback.user_feedback,
                is_accepted=feedback.is_accepted,
                confidence_score=feedback.confidence_score,
            )
        except Exception as e:
            logger.warning(f"Failed to store feedback in Qdrant: {e}")
            # Don't fail the request if Qdrant storage fails

        logger.info(f"User {current_user.id} submitted feedback for {feedback.agent_name}")

        return AIFeedbackResponse.from_orm(feedback)

    except Exception as e:
        logger.error(f"Error submitting feedback: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to submit feedback: {str(e)}",
        )


@router.get("/project/{project_id}", response_model=List[AIFeedbackResponse])
async def get_project_feedback(
    project_id: uuid.UUID,
    agent_name: str = None,
    is_accepted: bool = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[AIFeedbackResponse]:
    """
    Get feedback records for a project.

    Args:
        project_id: Project ID
        agent_name: Optional filter by agent name
        is_accepted: Optional filter by acceptance status
        current_user: Current authenticated user
        db: Database session

    Returns:
        List of feedback records
    """
    try:
        query = select(AIFeedback).where(AIFeedback.project_id == project_id)

        if agent_name:
            query = query.where(AIFeedback.agent_name == agent_name)

        if is_accepted is not None:
            query = query.where(AIFeedback.is_accepted == is_accepted)

        result = await db.execute(query)
        feedback_list = result.scalars().all()

        return [AIFeedbackResponse.from_orm(f) for f in feedback_list]

    except Exception as e:
        logger.error(f"Error retrieving feedback: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to retrieve feedback",
        )


@router.get("/performance/{project_id}", response_model=List[AgentPerformanceResponse])
async def get_agent_performance(
    project_id: uuid.UUID,
    agent_name: str = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[AgentPerformanceResponse]:
    """
    Get AI agent performance metrics for a project.

    Shows metrics like:
    - Acceptance rate
    - Average confidence score
    - Average user rating
    - Performance trend (improving/declining/stable)

    Args:
        project_id: Project ID
        agent_name: Optional filter by agent name
        current_user: Current authenticated user
        db: Database session

    Returns:
        List of performance metrics
    """
    try:
        query = select(AgentPerformance).where(AgentPerformance.project_id == project_id)

        if agent_name:
            query = query.where(AgentPerformance.agent_name == agent_name)

        result = await db.execute(query)
        performance_list = result.scalars().all()

        return [AgentPerformanceResponse.from_orm(p) for p in performance_list]

    except Exception as e:
        logger.error(f"Error retrieving performance metrics: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to retrieve performance metrics",
        )


@router.post("/performance/update/{project_id}")
async def update_performance_metrics(
    project_id: uuid.UUID,
    agent_name: str,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Update performance metrics for an agent based on recent feedback.

    This calculates metrics like acceptance rate, average confidence, etc.

    Args:
        project_id: Project ID
        agent_name: Agent name
        db: Database session

    Returns:
        Updated metrics
    """
    try:
        # Get all feedback for this agent and project
        result = await db.execute(
            select(AIFeedback).where(
                and_(
                    AIFeedback.project_id == project_id,
                    AIFeedback.agent_name == agent_name,
                )
            )
        )
        feedback_list = result.scalars().all()

        if not feedback_list:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No feedback found for this agent",
            )

        # Calculate metrics
        total = len(feedback_list)
        accepted = sum(1 for f in feedback_list if f.is_accepted)
        rejected = sum(1 for f in feedback_list if not f.is_accepted)
        modified = sum(1 for f in feedback_list if f.feedback_type == FeedbackType.MODIFIED)
        average_confidence = sum(f.confidence_score for f in feedback_list) / total if total > 0 else 0
        ratings = [f.user_rating for f in feedback_list if f.user_rating is not None]
        average_rating = sum(ratings) / len(ratings) if ratings else None

        # Get or create performance record
        perf_result = await db.execute(
            select(AgentPerformance).where(
                and_(
                    AgentPerformance.project_id == project_id,
                    AgentPerformance.agent_name == agent_name,
                )
            )
        )
        performance = perf_result.scalar_one_or_none()

        if not performance:
            performance = AgentPerformance(
                project_id=project_id,
                agent_name=agent_name,
            )
            db.add(performance)

        # Update metrics
        performance.total_executions = total
        performance.accepted_count = accepted
        performance.rejected_count = rejected
        performance.modified_count = modified
        performance.acceptance_rate = (accepted / total * 100) if total > 0 else 0
        performance.average_confidence = average_confidence
        performance.average_user_rating = average_rating

        # Determine trend (simple: if acceptance rate > 70%, improving)
        if performance.acceptance_rate >= 70:
            performance.trend = "improving"
        elif performance.acceptance_rate <= 30:
            performance.trend = "declining"
        else:
            performance.trend = "stable"

        await db.commit()
        await db.refresh(performance)

        logger.info(f"Updated performance metrics for {agent_name}")

        return AgentPerformanceResponse.from_orm(performance).dict()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating performance metrics: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update performance metrics",
        )


async def _store_feedback_in_qdrant(
    feedback_id: uuid.UUID,
    project_id: uuid.UUID,
    agent_name: str,
    input_data: Dict[str, Any],
    output_data: Dict[str, Any],
    user_feedback: Dict[str, Any],
    is_accepted: bool,
    confidence_score: float,
):
    """
    Store feedback in Qdrant for semantic search and learning.

    Args:
        feedback_id: Feedback record ID
        project_id: Project ID
        agent_name: Agent name
        input_data: Original input
        output_data: Agent output
        user_feedback: User feedback
        is_accepted: Whether feedback was accepted
        confidence_score: Confidence score
    """
    try:
        from app.services.qdrant_service import get_qdrant_service
        from app.services.ai_service import get_ai_service

        qdrant_service = await get_qdrant_service()
        ai_service = get_ai_service()

        # Create text representation of the feedback
        feedback_text = f"""
        Agent: {agent_name}
        Input: {str(input_data)[:500]}
        Output: {str(output_data)[:500]}
        User Feedback: {str(user_feedback)[:500]}
        Accepted: {is_accepted}
        """

        # Create embedding
        embedding = await ai_service.create_embedding(feedback_text)

        # Store in Qdrant
        collection_name = f"project_{project_id}_feedback_{agent_name}"
        await qdrant_service.ensure_collection_exists(collection_name)

        point_id = await qdrant_service.store_vector(
            collection_name=collection_name,
            point_id=str(feedback_id),
            vector=embedding,
            payload={
                "feedback_id": str(feedback_id),
                "agent": agent_name,
                "is_accepted": is_accepted,
                "confidence_score": confidence_score,
                "input_summary": str(input_data)[:200],
                "output_summary": str(output_data)[:200],
            },
        )

        logger.info(f"Stored feedback in Qdrant: {point_id}")

    except Exception as e:
        logger.error(f"Error storing feedback in Qdrant: {e}")
        raise
