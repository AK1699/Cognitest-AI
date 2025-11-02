"""
Integration tests for AI self-learning system
"""
import pytest
import uuid
import json
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai_feedback import AIFeedback, AgentPerformance, FeedbackType
from app.models.project import Project
from app.models.user import User
from app.services.qdrant_service import QdrantService
from app.services.knowledge_service import KnowledgeService
from app.agents.base_agent import BaseAgent
from app.core.database import async_session_maker


class MockAgent(BaseAgent):
    """Mock agent for testing"""

    def __init__(self):
        super().__init__(
            agent_name="test_agent",
            system_prompt="Test prompt",
        )

    async def execute(self, **kwargs):
        return {"result": "test"}


@pytest.mark.asyncio
class TestAISelfLearning:
    """Test suite for AI self-learning functionality"""

    async def test_store_knowledge(self):
        """Test storing knowledge in vector database"""
        agent = MockAgent()

        # Store knowledge
        point_id = await agent.store_knowledge(
            collection_name="test_collection",
            text="This is test knowledge about test plans",
            metadata={
                "type": "test",
                "project_id": "test-123",
            },
        )

        assert point_id is not None
        assert isinstance(point_id, str)

    async def test_retrieve_knowledge(self):
        """Test retrieving knowledge from vector database"""
        agent = MockAgent()

        # Store some knowledge first
        await agent.store_knowledge(
            collection_name="test_collection_retrieve",
            text="Test plan for user authentication",
            metadata={"type": "test_plan", "project": "auth_testing"},
        )

        # Retrieve similar knowledge
        results = await agent.retrieve_knowledge(
            collection_name="test_collection_retrieve",
            query="authentication testing",
            limit=5,
        )

        assert isinstance(results, list)

    async def test_learn_from_feedback(self):
        """Test learning from user feedback"""
        agent = MockAgent()

        input_data = {
            "requirement": "Generate test plan for login feature",
            "project_id": "project-123",
        }

        output_data = {
            "test_plan": "Test cases for login flow",
            "coverage": 85,
        }

        feedback = {
            "is_accepted": True,
            "confidence_score": 0.92,
            "user_rating": 5,
            "project_id": "project-123",
        }

        # Learn from feedback
        await agent.learn_from_feedback(
            input_data=input_data,
            output_data=output_data,
            feedback=feedback,
        )

        # Verify storage succeeded (no exception raised)
        assert True

    async def test_feedback_storage_in_db(self):
        """Test storing feedback in PostgreSQL"""
        async with async_session_maker() as db:
            # Create test feedback
            feedback = AIFeedback(
                project_id=uuid.uuid4(),
                agent_name="test_plan_generator",
                agent_type="test_plan",
                feedback_type=FeedbackType.ACCEPTED,
                input_data={"requirement": "test"},
                output_data={"plan": "test plan"},
                user_feedback={"comment": "good"},
                is_accepted=True,
                confidence_score=0.9,
                user_rating=5.0,
            )

            db.add(feedback)
            await db.commit()
            await db.refresh(feedback)

            # Verify feedback was stored
            assert feedback.id is not None
            assert feedback.is_accepted is True

    async def test_agent_performance_metrics(self):
        """Test tracking agent performance metrics"""
        async with async_session_maker() as db:
            project_id = uuid.uuid4()

            # Create performance record
            performance = AgentPerformance(
                project_id=project_id,
                agent_name="test_agent",
                total_executions=100,
                accepted_count=85,
                rejected_count=15,
                acceptance_rate=85.0,
                average_confidence=0.88,
                trend="improving",
            )

            db.add(performance)
            await db.commit()
            await db.refresh(performance)

            # Verify metrics were stored
            assert performance.acceptance_rate == 85.0
            assert performance.trend == "improving"

    async def test_knowledge_service_get_agent_context(self):
        """Test knowledge service retrieving agent context"""
        service = await KnowledgeService()

        context = await service.get_agent_context(
            project_id="project-123",
            agent_name="test_plan_generator",
            query="user authentication test cases",
        )

        assert isinstance(context, dict)
        assert "similar_cases" in context
        assert "patterns" in context
        assert "recommendations" in context

    async def test_knowledge_service_get_project_knowledge(self):
        """Test knowledge service retrieving project-wide knowledge"""
        service = await KnowledgeService()

        knowledge = await service.get_project_knowledge(
            project_id="project-123",
            query="API testing",
        )

        assert isinstance(knowledge, list)

    async def test_end_to_end_learning_workflow(self):
        """Test complete end-to-end self-learning workflow"""
        agent = MockAgent()
        project_id = "project-e2e-test"

        # 1. Agent generates output
        input_data = {
            "requirement": "Create comprehensive test plan",
            "project_id": project_id,
        }
        output = await agent.generate_response("Create test plan")

        # 2. User provides feedback
        feedback = {
            "is_accepted": True,
            "confidence_score": 0.95,
            "user_rating": 5,
            "project_id": project_id,
        }

        # 3. Agent learns from feedback
        await agent.learn_from_feedback(
            input_data=input_data,
            output_data={"output": output},
            feedback=feedback,
        )

        # 4. Agent retrieves learned knowledge for next time
        context = await agent.retrieve_knowledge(
            collection_name=f"project_{project_id}_feedback_test_agent",
            query=input_data["requirement"],
        )

        # Verify workflow completed
        assert context is not None

    async def test_multiple_feedback_items(self):
        """Test processing multiple feedback items"""
        async with async_session_maker() as db:
            project_id = uuid.uuid4()

            # Create multiple feedback items
            feedback_items = []
            for i in range(5):
                feedback = AIFeedback(
                    project_id=project_id,
                    agent_name="test_agent",
                    agent_type="test",
                    feedback_type=FeedbackType.RATING,
                    input_data={"index": i},
                    output_data={"result": f"output_{i}"},
                    user_feedback={"rating": 4 + (i % 2)},
                    is_accepted=i % 2 == 0,
                    confidence_score=0.7 + (i * 0.05),
                    user_rating=4.0 + (i % 2),
                )
                feedback_items.append(feedback)
                db.add(feedback)

            await db.commit()

            # Verify all feedback was stored
            from sqlalchemy import select
            result = await db.execute(
                select(AIFeedback).where(AIFeedback.project_id == project_id)
            )
            stored = result.scalars().all()
            assert len(stored) == 5

    async def test_agent_trend_detection(self):
        """Test detecting agent performance trends"""
        async with async_session_maker() as db:
            project_id = uuid.uuid4()

            # Simulate performance trend over time
            for i in range(3):
                acceptance_rate = 40 + (i * 20)  # 40% -> 60% -> 80%

                performance = AgentPerformance(
                    project_id=project_id,
                    agent_name="improving_agent",
                    total_executions=10 * (i + 1),
                    accepted_count=int(10 * (i + 1) * acceptance_rate / 100),
                    acceptance_rate=acceptance_rate,
                    average_confidence=0.6 + (i * 0.1),
                    trend="improving" if acceptance_rate > 60 else "stable",
                )

                db.add(performance)

            await db.commit()

            # Verify trend was captured
            from sqlalchemy import select
            result = await db.execute(
                select(AgentPerformance)
                .where(AgentPerformance.project_id == project_id)
                .order_by(AgentPerformance.total_executions.desc())
                .limit(1)
            )
            latest = result.scalar_one()
            assert latest.acceptance_rate > 70

    async def test_knowledge_collection_isolation(self):
        """Test that knowledge collections are properly isolated by project"""
        agent = MockAgent()

        # Store knowledge in project-specific collections
        id1 = await agent.store_knowledge(
            collection_name="project_proj1_feedback_test_agent",
            text="Project 1 specific knowledge",
            metadata={"project": "proj1"},
        )

        id2 = await agent.store_knowledge(
            collection_name="project_proj2_feedback_test_agent",
            text="Project 2 specific knowledge",
            metadata={"project": "proj2"},
        )

        # Verify both were stored
        assert id1 is not None
        assert id2 is not None
        assert id1 != id2


@pytest.mark.asyncio
async def test_feedback_schema_validation():
    """Test that feedback validation works correctly"""
    # Valid feedback
    valid_feedback = AIFeedback(
        project_id=uuid.uuid4(),
        agent_name="test",
        feedback_type=FeedbackType.ACCEPTED,
        input_data={},
        output_data={},
        user_feedback={},
        is_accepted=True,
        confidence_score=0.8,
    )

    assert valid_feedback.is_accepted is True
    assert 0 <= valid_feedback.confidence_score <= 1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
