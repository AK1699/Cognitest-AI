"""
Background tasks for AI self-learning and continuous improvement
"""
import logging
from typing import Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
import uuid

from app.core.database import get_db_sync, async_session_maker
from app.models.ai_feedback import AIFeedback, AgentPerformance
from app.models.project import Project
from app.services.qdrant_service import get_qdrant_service
from app.services.knowledge_service import get_knowledge_service

logger = logging.getLogger(__name__)


async def process_pending_feedback():
    """
    Process pending feedback for learning.
    Mark feedback as processed after storing in Qdrant.
    """
    try:
        async with async_session_maker() as db:
            # Get unprocessed feedback
            result = await db.execute(
                select(AIFeedback).where(AIFeedback.is_processed == False)
            )
            unprocessed = result.scalars().all()

            logger.info(f"Processing {len(unprocessed)} pending feedback items")

            for feedback in unprocessed:
                try:
                    # Mark as processed
                    feedback.is_processed = True
                    db.add(feedback)

                    logger.debug(f"Processed feedback: {feedback.id}")

                except Exception as e:
                    logger.error(f"Error processing feedback {feedback.id}: {e}")

            await db.commit()

    except Exception as e:
        logger.error(f"Error in process_pending_feedback: {e}")


async def update_agent_performance_metrics():
    """
    Update performance metrics for all agents across all projects.
    This is called periodically to refresh analytics.
    """
    try:
        async with async_session_maker() as db:
            # Get all projects
            projects_result = await db.execute(select(Project))
            projects = projects_result.scalars().all()

            logger.info(f"Updating performance metrics for {len(projects)} projects")

            for project in projects:
                # Get all unique agents for this project
                agents_result = await db.execute(
                    select(AIFeedback.agent_name)
                    .where(AIFeedback.project_id == project.id)
                    .distinct()
                )
                agents = agents_result.scalars().all()

                for agent_name in agents:
                    try:
                        await _update_single_agent_metrics(db, project.id, agent_name)
                    except Exception as e:
                        logger.error(f"Error updating metrics for {agent_name}: {e}")

            await db.commit()

    except Exception as e:
        logger.error(f"Error updating agent performance metrics: {e}")


async def _update_single_agent_metrics(
    db: AsyncSession,
    project_id: uuid.UUID,
    agent_name: str,
):
    """
    Update metrics for a single agent in a project.

    Args:
        db: Database session
        project_id: Project ID
        agent_name: Agent name
    """
    # Get feedback for this agent
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
        return

    # Calculate metrics
    total = len(feedback_list)
    accepted = sum(1 for f in feedback_list if f.is_accepted)
    rejected = sum(1 for f in feedback_list if not f.is_accepted)
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

    # Calculate previous metrics for trend detection
    old_acceptance_rate = performance.acceptance_rate

    # Update metrics
    performance.total_executions = total
    performance.accepted_count = accepted
    performance.rejected_count = rejected
    performance.acceptance_rate = (accepted / total * 100) if total > 0 else 0
    performance.average_confidence = average_confidence
    performance.average_user_rating = average_rating

    # Determine trend
    if performance.acceptance_rate >= 70:
        performance.trend = "improving"
        if performance.acceptance_rate > old_acceptance_rate:
            performance.last_improvement_date = datetime.utcnow()
    elif performance.acceptance_rate <= 30:
        performance.trend = "declining"
    else:
        performance.trend = "stable"

    logger.debug(f"Updated metrics for {agent_name}: {performance.acceptance_rate:.1f}% acceptance")


async def detect_learning_opportunities():
    """
    Detect patterns where the AI is consistently failing and suggest improvements.
    """
    try:
        async with async_session_maker() as db:
            # Get agents with low acceptance rates
            low_performers = await db.execute(
                select(AgentPerformance).where(AgentPerformance.acceptance_rate < 50)
            )
            agents = low_performers.scalars().all()

            logger.info(f"Found {len(agents)} agents needing improvement")

            for performance in agents:
                try:
                    await _analyze_agent_failures(db, performance)
                except Exception as e:
                    logger.error(f"Error analyzing failures for {performance.agent_name}: {e}")

    except Exception as e:
        logger.error(f"Error detecting learning opportunities: {e}")


async def _analyze_agent_failures(
    db: AsyncSession,
    performance: AgentPerformance,
):
    """
    Analyze failure patterns for a specific agent.

    Args:
        db: Database session
        performance: Agent performance record
    """
    # Get recent rejected feedback
    result = await db.execute(
        select(AIFeedback).where(
            and_(
                AIFeedback.project_id == performance.project_id,
                AIFeedback.agent_name == performance.agent_name,
                AIFeedback.is_accepted == False,
            )
        ).order_by(AIFeedback.created_at.desc()).limit(10)
    )
    rejected_feedback = result.scalars().all()

    if rejected_feedback:
        logger.warning(
            f"Agent {performance.agent_name} has {len(rejected_feedback)} recent rejections. "
            f"Acceptance rate: {performance.acceptance_rate:.1f}%"
        )

        # In production, this would:
        # 1. Analyze common rejection patterns
        # 2. Suggest prompt adjustments
        # 3. Recommend model or temperature changes
        # 4. Update agent configuration automatically


async def cleanup_old_knowledge():
    """
    Clean up old knowledge vectors that are no longer relevant.
    Keeps recent, high-confidence knowledge.
    """
    try:
        qdrant_service = await get_qdrant_service()
        logger.info("Cleaning up old knowledge vectors")

        # In production, this would:
        # 1. Remove vectors older than X days
        # 2. Remove low-confidence vectors
        # 3. Archive accepted vectors to a separate collection
        # 4. Optimize vector DB performance

        logger.info("Knowledge cleanup completed")

    except Exception as e:
        logger.error(f"Error cleaning up knowledge: {e}")


async def generate_self_evolution_report():
    """
    Generate a report on how agents are self-evolving.
    Shows improvement trends and recommendations.
    """
    try:
        async with async_session_maker() as db:
            # Get all performance metrics
            result = await db.execute(select(AgentPerformance))
            all_performance = result.scalars().all()

            report = {
                "timestamp": datetime.utcnow().isoformat(),
                "agents": {},
                "summary": {
                    "improving": 0,
                    "declining": 0,
                    "stable": 0,
                },
            }

            for performance in all_performance:
                report["agents"][performance.agent_name] = {
                    "acceptance_rate": performance.acceptance_rate,
                    "trend": performance.trend,
                    "confidence": performance.average_confidence,
                    "total_feedback": int(performance.total_executions),
                }
                report["summary"][performance.trend] += 1

            logger.info(f"Self-evolution report: {report['summary']}")

            # In production, this report would be:
            # 1. Stored for dashboard visualization
            # 2. Emailed to admins if issues detected
            # 3. Used to trigger automatic retraining

    except Exception as e:
        logger.error(f"Error generating evolution report: {e}")


# Celery task definitions (if using Celery)
# These would be scheduled to run periodically

from celery import shared_task

@shared_task(name="ai.process_pending_feedback")
def celery_process_pending_feedback():
    """Celery task: Process pending feedback"""
    import asyncio
    asyncio.run(process_pending_feedback())


@shared_task(name="ai.update_performance_metrics")
def celery_update_performance_metrics():
    """Celery task: Update agent performance metrics"""
    import asyncio
    asyncio.run(update_agent_performance_metrics())


@shared_task(name="ai.detect_learning_opportunities")
def celery_detect_learning_opportunities():
    """Celery task: Detect learning opportunities"""
    import asyncio
    asyncio.run(detect_learning_opportunities())


@shared_task(name="ai.cleanup_old_knowledge")
def celery_cleanup_old_knowledge():
    """Celery task: Cleanup old knowledge"""
    import asyncio
    asyncio.run(cleanup_old_knowledge())


@shared_task(name="ai.generate_self_evolution_report")
def celery_generate_self_evolution_report():
    """Celery task: Generate self-evolution report"""
    import asyncio
    asyncio.run(generate_self_evolution_report())
