"""
Analytics endpoints for AI self-evolution metrics
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from typing import List, Dict, Any
import uuid
from datetime import datetime, timedelta
import logging

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.ai_feedback import AIFeedback, AgentPerformance, FeedbackType
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai/analytics", tags=["ai-analytics"])


@router.get("/self-evolution-report/{project_id}")
async def get_self_evolution_report(
    project_id: uuid.UUID,
    days: int = 7,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get comprehensive self-evolution report for all AI agents in a project.

    Shows:
    - Overall improvement trends
    - Agent-specific metrics
    - Feedback patterns
    - Recommendations for improvement

    Args:
        project_id: Project ID
        days: Number of days to analyze (default 7)
        current_user: Current user
        db: Database session

    Returns:
        Self-evolution report
    """
    try:
        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)

        # Get all feedback for the project in the date range
        feedback_result = await db.execute(
            select(AIFeedback).where(
                and_(
                    AIFeedback.project_id == project_id,
                    AIFeedback.created_at >= start_date,
                )
            )
        )
        all_feedback = feedback_result.scalars().all()

        # Get all agent performance records
        perf_result = await db.execute(
            select(AgentPerformance).where(AgentPerformance.project_id == project_id)
        )
        all_performance = perf_result.scalars().all()

        # Build report
        report = {
            "project_id": str(project_id),
            "period": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat(),
                "days": days,
            },
            "summary": {
                "total_feedback_items": len(all_feedback),
                "total_agents": len(all_performance),
                "overall_acceptance_rate": 0.0,
                "overall_average_confidence": 0.0,
                "overall_average_rating": None,
                "trend": "stable",
            },
            "agents": [],
            "insights": [],
            "recommendations": [],
        }

        if all_feedback:
            # Calculate overall metrics
            total_accepted = sum(1 for f in all_feedback if f.is_accepted)
            overall_acceptance = (total_accepted / len(all_feedback)) * 100 if all_feedback else 0
            avg_confidence = sum(f.confidence_score for f in all_feedback) / len(all_feedback)
            ratings = [f.user_rating for f in all_feedback if f.user_rating]
            avg_rating = sum(ratings) / len(ratings) if ratings else None

            report["summary"]["overall_acceptance_rate"] = round(overall_acceptance, 2)
            report["summary"]["overall_average_confidence"] = round(avg_confidence, 3)
            report["summary"]["overall_average_rating"] = round(avg_rating, 2) if avg_rating else None

        # Determine overall trend
        improving_agents = sum(1 for p in all_performance if p.trend == "improving")
        declining_agents = sum(1 for p in all_performance if p.trend == "declining")

        if improving_agents > declining_agents:
            report["summary"]["trend"] = "improving"
        elif declining_agents > improving_agents:
            report["summary"]["trend"] = "declining"
        else:
            report["summary"]["trend"] = "stable"

        # Build agent details
        for performance in all_performance:
            agent_info = {
                "name": performance.agent_name,
                "acceptance_rate": round(performance.acceptance_rate, 2),
                "average_confidence": round(performance.average_confidence, 3),
                "average_rating": round(performance.average_user_rating, 2) if performance.average_user_rating else None,
                "trend": performance.trend,
                "total_executions": int(performance.total_executions),
                "accepted_count": int(performance.accepted_count),
                "rejected_count": int(performance.rejected_count),
                "modified_count": int(performance.modified_count),
            }

            if performance.last_improvement_date:
                agent_info["last_improvement"] = performance.last_improvement_date.isoformat()

            report["agents"].append(agent_info)

        # Generate insights
        report["insights"] = _generate_insights(all_feedback, all_performance)

        # Generate recommendations
        report["recommendations"] = _generate_recommendations(all_performance)

        logger.info(f"Generated self-evolution report for project {project_id}")
        return report

    except Exception as e:
        logger.error(f"Error generating evolution report: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to generate report",
        )


@router.get("/agent-history/{project_id}/{agent_name}")
async def get_agent_learning_history(
    project_id: uuid.UUID,
    agent_name: str,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get detailed learning history for a specific agent.

    Args:
        project_id: Project ID
        agent_name: Agent name
        limit: Max records to return
        current_user: Current user
        db: Database session

    Returns:
        Agent learning history
    """
    try:
        # Get feedback history
        feedback_result = await db.execute(
            select(AIFeedback)
            .where(
                and_(
                    AIFeedback.project_id == project_id,
                    AIFeedback.agent_name == agent_name,
                )
            )
            .order_by(AIFeedback.created_at.desc())
            .limit(limit)
        )
        feedback_history = feedback_result.scalars().all()

        # Get performance metrics
        perf_result = await db.execute(
            select(AgentPerformance).where(
                and_(
                    AgentPerformance.project_id == project_id,
                    AgentPerformance.agent_name == agent_name,
                )
            )
        )
        performance = perf_result.scalar_one_or_none()

        # Analyze acceptance trend
        acceptance_trend = []
        window_size = 5  # 5-item rolling window
        for i in range(0, len(feedback_history), window_size):
            window = feedback_history[i:i + window_size]
            if window:
                acceptance = sum(1 for f in window if f.is_accepted) / len(window) * 100
                acceptance_trend.append({
                    "window": i // window_size,
                    "acceptance_rate": round(acceptance, 2),
                })

        history = {
            "project_id": str(project_id),
            "agent_name": agent_name,
            "feedback_count": len(feedback_history),
            "performance": None,
            "feedback_items": [],
            "acceptance_trend": acceptance_trend,
        }

        if performance:
            history["performance"] = {
                "acceptance_rate": round(performance.acceptance_rate, 2),
                "trend": performance.trend,
                "total_executions": int(performance.total_executions),
                "average_confidence": round(performance.average_confidence, 3),
                "average_rating": round(performance.average_user_rating, 2) if performance.average_user_rating else None,
            }

        # Build feedback items (simplified)
        for feedback in feedback_history[:10]:  # Show last 10
            history["feedback_items"].append({
                "id": str(feedback.id),
                "type": feedback.feedback_type,
                "is_accepted": feedback.is_accepted,
                "confidence_score": feedback.confidence_score,
                "user_rating": feedback.user_rating,
                "created_at": feedback.created_at.isoformat(),
            })

        return history

    except Exception as e:
        logger.error(f"Error retrieving agent history: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to retrieve history",
        )


@router.get("/feedback-patterns/{project_id}")
async def get_feedback_patterns(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Analyze feedback patterns to understand AI performance characteristics.

    Args:
        project_id: Project ID
        current_user: Current user
        db: Database session

    Returns:
        Feedback patterns analysis
    """
    try:
        # Get all feedback for project
        feedback_result = await db.execute(
            select(AIFeedback).where(AIFeedback.project_id == project_id)
        )
        all_feedback = feedback_result.scalars().all()

        patterns = {
            "project_id": str(project_id),
            "by_feedback_type": {},
            "by_agent": {},
            "confidence_distribution": {
                "low": 0,  # 0-0.3
                "medium": 0,  # 0.3-0.7
                "high": 0,  # 0.7-1.0
            },
            "rating_distribution": {},
        }

        # Analyze by feedback type
        for feedback_type in FeedbackType:
            type_feedback = [f for f in all_feedback if f.feedback_type == feedback_type]
            if type_feedback:
                patterns["by_feedback_type"][feedback_type.value] = {
                    "count": len(type_feedback),
                    "accepted_rate": sum(1 for f in type_feedback if f.is_accepted) / len(type_feedback) * 100,
                }

        # Analyze by agent
        agents = set(f.agent_name for f in all_feedback)
        for agent_name in agents:
            agent_feedback = [f for f in all_feedback if f.agent_name == agent_name]
            patterns["by_agent"][agent_name] = {
                "count": len(agent_feedback),
                "accepted_rate": sum(1 for f in agent_feedback if f.is_accepted) / len(agent_feedback) * 100,
                "avg_confidence": sum(f.confidence_score for f in agent_feedback) / len(agent_feedback),
            }

        # Analyze confidence distribution
        for feedback in all_feedback:
            if feedback.confidence_score < 0.3:
                patterns["confidence_distribution"]["low"] += 1
            elif feedback.confidence_score < 0.7:
                patterns["confidence_distribution"]["medium"] += 1
            else:
                patterns["confidence_distribution"]["high"] += 1

        # Analyze rating distribution
        for feedback in all_feedback:
            if feedback.user_rating:
                rating = int(feedback.user_rating)
                patterns["rating_distribution"][rating] = patterns["rating_distribution"].get(rating, 0) + 1

        return patterns

    except Exception as e:
        logger.error(f"Error analyzing patterns: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to analyze patterns",
        )


def _generate_insights(feedback: List[AIFeedback], performance: List[AgentPerformance]) -> List[str]:
    """Generate insights from feedback and performance data"""
    insights = []

    if not performance:
        return insights

    # Find best and worst performers
    sorted_by_acceptance = sorted(performance, key=lambda p: p.acceptance_rate, reverse=True)

    if sorted_by_acceptance:
        best = sorted_by_acceptance[0]
        if best.acceptance_rate >= 70:
            insights.append(f"{best.agent_name} is performing well with {best.acceptance_rate:.1f}% acceptance rate")

    if len(sorted_by_acceptance) > 1:
        worst = sorted_by_acceptance[-1]
        if worst.acceptance_rate < 50:
            insights.append(f"{worst.agent_name} needs improvement (only {worst.acceptance_rate:.1f}% acceptance)")

    # Trend insights
    improving = sum(1 for p in performance if p.trend == "improving")
    if improving > 0:
        insights.append(f"{improving} agent(s) are showing improvement trends")

    return insights


def _generate_recommendations(performance: List[AgentPerformance]) -> List[str]:
    """Generate improvement recommendations"""
    recommendations = []

    low_performers = [p for p in performance if p.acceptance_rate < 50]
    for agent in low_performers:
        recommendations.append(
            f"Consider retraining {agent.agent_name} or adjusting its parameters "
            f"(current accuracy: {agent.acceptance_rate:.1f}%)"
        )

    high_performers = [p for p in performance if p.acceptance_rate >= 80]
    if high_performers:
        names = ", ".join(p.agent_name for p in high_performers)
        recommendations.append(f"Use {names} as reference models for other agents")

    return recommendations
