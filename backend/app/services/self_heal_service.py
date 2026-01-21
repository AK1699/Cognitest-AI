"""
Self-Heal Service
Orchestrates AI-powered test maintenance and automatic repair across different modules
"""
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc, update

from app.models.web_automation import (
    TestFlow, ExecutionRun, StepResult, HealingEvent,
    LocatorAlternative, HealingType, HealingStrategy
)
from app.services.gemini_service import GeminiService

class SelfHealService:
    def __init__(self, db):
        self.db = db
        self.ai_service = GeminiService()

    async def get_healing_analytics(self, project_id: UUID) -> Dict[str, Any]:
        """
        Get aggregated healing insights for the dashboard
        """
        # Get total healing events
        total_result = await self.db.execute(
            select(func.count(HealingEvent.id))
            .join(ExecutionRun)
            .where(ExecutionRun.project_id == project_id)
        )
        total_healed = total_result.scalar() or 0

        # Get healing events by strategy
        strategy_result = await self.db.execute(
            select(HealingEvent.strategy, func.count(HealingEvent.id))
            .join(ExecutionRun)
            .where(ExecutionRun.project_id == project_id)
            .group_by(HealingEvent.strategy)
        )
        strategy_counts = strategy_result.all()

        # Get healing success rate
        success_result = await self.db.execute(
            select(func.count(HealingEvent.id))
            .join(ExecutionRun)
            .where(ExecutionRun.project_id == project_id)
            .where(HealingEvent.success == True)
        )
        success_count = success_result.scalar() or 0

        success_rate = (success_count / total_healed * 100) if total_healed > 0 else 100

        # Get trends (last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        trends_result = await self.db.execute(
            select(
                func.date(HealingEvent.recorded_at).label('date'),
                func.count(HealingEvent.id).label('count')
            )
            .join(ExecutionRun)
            .where(ExecutionRun.project_id == project_id)
            .where(HealingEvent.recorded_at >= seven_days_ago)
            .group_by(func.date(HealingEvent.recorded_at))
        )
        trends = trends_result.all()

        return {
            "total_healed": total_healed,
            "success_rate": round(success_rate, 2),
            "strategy_distribution": {s.value if s else "unknown": c for s, c in strategy_counts},
            "trends": [{"date": str(t.date), "count": t.count} for t in trends]
        }

    async def auto_update_locator(self, healing_event_id: UUID, confidence_threshold: float = 0.8):
        """
        Update LocatorAlternative if healing was successful and high confidence
        """
        event_result = await self.db.execute(
            select(HealingEvent).where(HealingEvent.id == healing_event_id)
        )
        event = event_result.scalar_one_or_none()
        if not event or not event.success or (event.confidence_score or 0) < confidence_threshold:
            return

        # Find or create locator alternative record
        run_result = await self.db.execute(
            select(ExecutionRun).where(ExecutionRun.id == event.execution_run_id)
        )
        run = run_result.scalar_one_or_none()
        if not run:
            return

        alt_result = await self.db.execute(
            select(LocatorAlternative).where(
                LocatorAlternative.test_flow_id == run.test_flow_id,
                LocatorAlternative.step_id == event.step_id
            )
        )
        alt = alt_result.scalar_one_or_none()

        if alt:
            # Update existing
            alternatives = list(alt.alternatives or [])

            # Check if this healed value is already in alternatives
            exists = False
            for a in alternatives:
                if a.get('value') == event.healed_value:
                    a['success_rate'] = (a.get('success_rate', 0.5) + 1.0) / 2.0
                    exists = True
                    break

            if not exists:
                alternatives.append({
                    "strategy": event.strategy.value if event.strategy else "ai",
                    "value": event.healed_value,
                    "priority": 1,
                    "success_rate": 0.8
                })

            alt.alternatives = alternatives
            alt.success_count += 1
            alt.last_successful_selector = event.healed_value
        else:
            # Create new
            new_alt = LocatorAlternative(
                test_flow_id=run.test_flow_id,
                step_id=event.step_id,
                element_identifier=f"Step {event.step_id}",
                primary_selector=event.original_value,
                primary_strategy="css",
                alternatives=[{
                    "strategy": event.strategy.value if event.strategy else "ai",
                    "value": event.healed_value,
                    "priority": 1,
                    "success_rate": 0.8
                }],
                success_count=1,
                last_successful_selector=event.healed_value
            )
            self.db.add(new_alt)

        await self.db.commit()

    async def analyze_test_flow_health(self, test_flow_id: UUID) -> List[Dict[str, Any]]:
        """
        Proactively scan a test flow for potentially broken locators
        """
        flow_result = await self.db.execute(
            select(TestFlow).where(TestFlow.id == test_flow_id)
        )
        flow = flow_result.scalar_one_or_none()
        if not flow:
            return []

        # Find locators with high failure rates
        risky_result = await self.db.execute(
            select(LocatorAlternative).where(
                LocatorAlternative.test_flow_id == test_flow_id,
                LocatorAlternative.failure_count > LocatorAlternative.success_count
            )
        )
        risky_locators = risky_result.scalars().all()

        return [
            {
                "step_id": l.step_id,
                "identifier": l.element_identifier,
                "risk_level": "high",
                "failure_rate": round(l.failure_count / (l.success_count + l.failure_count), 2) if (l.success_count + l.failure_count) > 0 else 0
            }
            for l in risky_locators
        ]
