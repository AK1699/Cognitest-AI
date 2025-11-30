"""
Service for Test Plan, Test Suite, and Test Case management.
Handles creation, retrieval, and AI-powered generation of test artifacts.
"""
import logging
import json
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc

from app.models.test_plan import TestPlan, GenerationType
from app.models.test_suite import TestSuite
from app.models.test_case import TestCase, TestCaseStatus, TestCasePriority
from app.models.project import Project
from app.schemas.test_plan import TestPlanCreate, TestPlanUpdate
from app.schemas.test_suite import TestSuiteCreate, TestSuiteUpdate
from app.schemas.test_case import TestCaseCreate, TestCaseUpdate, TestStep
from app.services.ai_service import AIService
from app.services.document_knowledge_service import get_document_knowledge_service
from app.services.jira_integration_service import get_jira_service
from app.core.config import settings

logger = logging.getLogger(__name__)


class TestPlanService:
    """Service for managing test plans with AI generation capabilities."""

    def __init__(self, ai_service: AIService):
        self.ai_service = ai_service

    async def generate_test_plan_from_brd(
        self,
        project_id: UUID,
        document_ids: List[str],
        additional_context: Optional[str] = None,
        db: Optional[AsyncSession] = None,
    ) -> Dict[str, Any]:
        """
        Generate test plan from Business Requirements Documents.

        Args:
            project_id: Project ID
            document_ids: List of document IDs to base plan on
            additional_context: Additional context for generation
            db: Database session

        Returns:
            Generated test plan with metadata
        """
        try:
            logger.info(f"Generating test plan from BRD for project {project_id}")

            # Build context from documents
            context_parts = []
            doc_service = await get_document_knowledge_service()

            for doc_id in document_ids:
                doc_context = await doc_service.retrieve_document_context(
                    project_id=str(project_id),
                    query=f"document:{doc_id}",
                    limit=1,
                )
                if doc_context:
                    context_parts.extend(doc_context)

            # Build prompt
            prompt = self._build_test_plan_generation_prompt(
                context_parts, additional_context
            )

            # Generate test plan using AI
            llm = self.ai_service.get_llm(temperature=0.7, max_tokens=2000)
            response = await self.ai_service.generate_completion(
                messages=[
                    {
                        "role": "system",
                        "content": self._get_test_plan_system_prompt(),
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.7,
                max_tokens=2000,
            )

            # Parse response
            test_plan_data = self._parse_test_plan_response(response)

            return {
                "status": "success",
                "data": test_plan_data,
                "confidence": "high",
                "source_documents": document_ids,
            }

        except Exception as e:
            logger.error(f"Error generating test plan from BRD: {e}")
            return {
                "status": "error",
                "error": str(e),
            }

    async def generate_test_suite_from_requirements(
        self,
        project_id: UUID,
        test_plan_id: Optional[UUID],
        requirements: str,
        test_scenarios: Optional[List[str]] = None,
        db: Optional[AsyncSession] = None,
    ) -> Dict[str, Any]:
        """
        Generate test suite from requirements.

        Args:
            project_id: Project ID
            test_plan_id: Optional test plan ID
            requirements: Requirements text
            test_scenarios: List of test scenarios
            db: Database session

        Returns:
            Generated test suite data
        """
        try:
            logger.info(f"Generating test suite for project {project_id}")

            # Build prompt
            prompt = self._build_test_suite_generation_prompt(
                requirements, test_scenarios
            )

            # Generate test suite
            response = await self.ai_service.generate_completion(
                messages=[
                    {
                        "role": "system",
                        "content": self._get_test_suite_system_prompt(),
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.7,
                max_tokens=1500,
            )

            # Parse response
            test_suite_data = self._parse_test_suite_response(response)

            return {
                "status": "success",
                "data": test_suite_data,
                "confidence": "high",
            }

        except Exception as e:
            logger.error(f"Error generating test suite: {e}")
            return {
                "status": "error",
                "error": str(e),
            }

    async def generate_test_cases(
        self,
        project_id: UUID,
        feature_description: str,
        test_scenarios: Optional[List[str]] = None,
        user_stories: Optional[List[str]] = None,
        count: int = 5,
        db: Optional[AsyncSession] = None,
    ) -> Dict[str, Any]:
        """
        Generate test cases for a feature.

        Args:
            project_id: Project ID
            feature_description: Description of feature to test
            test_scenarios: List of test scenarios
            user_stories: List of user stories
            count: Number of test cases to generate
            db: Database session

        Returns:
            Generated test cases
        """
        try:
            logger.info(
                f"Generating {count} test cases for feature in project {project_id}"
            )

            # Build prompt
            prompt = self._build_test_case_generation_prompt(
                feature_description, test_scenarios, user_stories, count
            )

            # Generate test cases
            response = await self.ai_service.generate_completion(
                messages=[
                    {
                        "role": "system",
                        "content": self._get_test_case_system_prompt(),
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.7,
                max_tokens=3000,
            )

            # Parse response
            test_cases_data = self._parse_test_cases_response(response, count)

            return {
                "status": "success",
                "data": test_cases_data,
                "count": len(test_cases_data),
                "confidence": "high",
            }

        except Exception as e:
            logger.error(f"Error generating test cases: {e}")
            return {
                "status": "error",
                "error": str(e),
            }

    def _get_test_plan_system_prompt(self) -> str:
        """Get system prompt for test plan generation."""
        return """You are an expert test plan generator. Create comprehensive test plans that include:
1. Test Scope - what will and won't be tested
2. Test Strategy - approach and methodology
3. Test Schedule and Resources
4. Test Cases organized by feature/module
5. Entry and Exit Criteria
6. Risk Assessment
7. Assumptions and Dependencies

Format your response as structured JSON with clear sections."""

    def _get_test_suite_system_prompt(self) -> str:
        """Get system prompt for test suite generation."""
        return """You are an expert QA engineer. Create organized test suites that group related test cases.
For each test suite, provide:
1. Suite Name - descriptive name
2. Description - what this suite tests
3. Suggested Test Cases - list of test cases that should be in this suite
4. Tags - categorization tags
5. Preconditions - setup needed to run tests
6. Exit Criteria - conditions for suite completion

Format your response as structured JSON."""

    def _get_test_case_system_prompt(self) -> str:
        """Get system prompt for test case generation."""
        return """You are an expert test case designer. Create detailed, actionable test cases that include:
1. Test Case ID and Title
2. Description - what is being tested
3. Priority - critical, high, medium, or low
4. Preconditions - setup required
5. Test Steps - numbered, clear action steps
6. Expected Results - what should happen
7. Tags - for organization and filtering

Format each test case clearly with step numbers and expected results. Make steps atomic and testable."""

    def _build_test_plan_generation_prompt(
        self,
        context_parts: List[Dict[str, Any]],
        additional_context: Optional[str] = None,
    ) -> str:
        """Build prompt for test plan generation."""
        context_text = ""
        if context_parts:
            context_text = "Reference Documents:\n"
            for part in context_parts:
                if isinstance(part, dict):
                    context_text += f"\n{part.get('text', '')}\n"
                else:
                    context_text += f"\n{part}\n"

        prompt = context_text

        if additional_context:
            prompt += f"\n\nAdditional Context:\n{additional_context}"

        prompt += """

Based on the above requirements and context, generate a comprehensive test plan with:
1. Test scope and objectives
2. Test strategy and approach
3. Detailed test cases organized by feature
4. Entry and exit criteria
5. Risk assessment and mitigation
6. Schedule and resource planning

Provide the response as structured JSON."""

        return prompt

    def _build_test_suite_generation_prompt(
        self,
        requirements: str,
        test_scenarios: Optional[List[str]] = None,
    ) -> str:
        """Build prompt for test suite generation."""
        prompt = f"""Requirements:
{requirements}

"""

        if test_scenarios:
            prompt += "Test Scenarios to Cover:\n"
            for scenario in test_scenarios:
                prompt += f"- {scenario}\n"
            prompt += "\n"

        prompt += """Create test suites that logically group test cases. For each suite, provide:
1. Suite name and description
2. List of test cases that should be in this suite
3. Preconditions and setup requirements
4. Exit criteria for suite completion
5. Tags for organization

Provide as structured JSON with arrays of test cases."""

        return prompt

    def _build_test_case_generation_prompt(
        self,
        feature_description: str,
        test_scenarios: Optional[List[str]] = None,
        user_stories: Optional[List[str]] = None,
        count: int = 5,
    ) -> str:
        """Build prompt for test case generation."""
        prompt = f"""Feature to Test:
{feature_description}

"""

        if user_stories:
            prompt += "User Stories:\n"
            for story in user_stories:
                prompt += f"- {story}\n"
            prompt += "\n"

        if test_scenarios:
            prompt += "Test Scenarios to Cover:\n"
            for scenario in test_scenarios:
                prompt += f"- {scenario}\n"
            prompt += "\n"

        prompt += f"""Generate {count} comprehensive test cases for this feature. For each test case include:
1. Unique ID and descriptive title
2. Description of what is being tested
3. Priority level (critical, high, medium, low)
4. Preconditions and setup
5. Numbered test steps (atomic, testable steps)
6. Expected results for each step
7. Relevant tags

Include both happy path and edge cases. Ensure good coverage of functionality.

Provide response as a JSON array of test case objects."""

        return prompt

    def _parse_test_plan_response(self, response: str) -> Dict[str, Any]:
        """Parse AI-generated test plan response."""
        try:
            # Try to extract JSON from response
            import re

            json_match = re.search(r"\{[\s\S]*\}", response)
            if json_match:
                return json.loads(json_match.group())

            # Fallback: structure the response
            return {
                "name": "AI Generated Test Plan",
                "description": response[:500],
                "objectives": ["Comprehensive feature testing"],
                "status": "draft",
            }
        except Exception as e:
            logger.error(f"Error parsing test plan response: {e}")
            return {
                "name": "AI Generated Test Plan",
                "description": response[:500],
                "objectives": ["Feature testing"],
            }

    def _parse_test_suite_response(self, response: str) -> Dict[str, Any]:
        """Parse AI-generated test suite response."""
        try:
            import re

            json_match = re.search(r"\{[\s\S]*\}", response)
            if json_match:
                return json.loads(json_match.group())

            return {
                "name": "AI Generated Test Suite",
                "description": response[:500],
                "test_cases": [],
            }
        except Exception as e:
            logger.error(f"Error parsing test suite response: {e}")
            return {
                "name": "AI Generated Test Suite",
                "description": response[:500],
                "test_cases": [],
            }

    def _parse_test_cases_response(
        self, response: str, count: int
    ) -> List[Dict[str, Any]]:
        """Parse AI-generated test cases response."""
        try:
            import re

            # Try to find JSON array
            json_match = re.search(r"\[[\s\S]*\]", response)
            if json_match:
                test_cases = json.loads(json_match.group())
                if isinstance(test_cases, list):
                    return test_cases[:count]

            # Try to find individual JSON objects
            objects = re.findall(r"\{[^{}]*\}", response)
            if objects:
                test_cases = []
                for obj_str in objects:
                    try:
                        test_cases.append(json.loads(obj_str))
                    except:
                        pass
                return test_cases[:count]

            # Fallback: create basic test case structure
            return [
                {
                    "title": f"Generated Test Case {i + 1}",
                    "description": f"Test case from AI generation",
                    "priority": "medium",
                    "steps": [
                        {
                            "step_number": 1,
                            "action": "Perform action",
                            "expected_result": "Verify result",
                        }
                    ],
                }
                for i in range(min(count, 5))
            ]

        except Exception as e:
            logger.error(f"Error parsing test cases response: {e}")
            return []

    async def store_generated_artifacts(
        self,
        project_id: UUID,
        test_plan: Optional[TestPlan] = None,
        test_suites: Optional[List[TestSuite]] = None,
        test_cases: Optional[List[TestCase]] = None,
        db: Optional[AsyncSession] = None,
    ):
        """Store generated test artifacts for learning."""
        try:
            doc_service = await get_document_knowledge_service()

            # Store test plan
            if test_plan:
                await doc_service.store_document_knowledge(
                    project_id=str(project_id),
                    title=test_plan.name,
                    content=test_plan.description or "",
                    source="ai_generated_test_plan",
                    metadata={
                        "type": "test_plan",
                        "test_plan_id": str(test_plan.id),
                        "objectives": test_plan.objectives,
                    },
                )

            # Store test suites
            if test_suites:
                for suite in test_suites:
                    await doc_service.store_document_knowledge(
                        project_id=str(project_id),
                        title=suite.name,
                        content=suite.description or "",
                        source="ai_generated_test_suite",
                        metadata={
                            "type": "test_suite",
                            "test_suite_id": str(suite.id),
                            "test_plan_id": str(suite.test_plan_id)
                            if suite.test_plan_id
                            else None,
                        },
                    )

            # Store test cases
            if test_cases:
                for case in test_cases:
                    steps_text = "\n".join(
                        [
                            f"Step {s.get('step_number', i)}: {s.get('action', '')} -> {s.get('expected_result', '')}"
                            for i, s in enumerate(case.steps or [], 1)
                        ]
                    )

                    await doc_service.store_document_knowledge(
                        project_id=str(project_id),
                        title=case.title,
                        content=f"{case.description or ''}\n\n{steps_text}",
                        source="ai_generated_test_case",
                        metadata={
                            "type": "test_case",
                            "test_case_id": str(case.id),
                            "priority": case.priority.value if hasattr(case.priority, 'value') else str(case.priority),
                        },
                    )

            logger.info(f"Stored AI-generated artifacts for project {project_id}")

        except Exception as e:
            logger.error(f"Error storing generated artifacts: {e}")


class TestSuiteService:
    """Service for managing test suites."""

    async def get_suite_with_cases(
        self, suite_id: UUID, db: AsyncSession
    ) -> Optional[Dict[str, Any]]:
        """Get test suite with all its test cases."""
        result = await db.execute(
            select(TestSuite).where(TestSuite.id == suite_id)
        )
        suite = result.scalar_one_or_none()

        if not suite:
            return None

        # Get all test cases in this suite
        cases_result = await db.execute(
            select(TestCase).where(TestCase.test_suite_id == suite_id)
        )
        test_cases = cases_result.scalars().all()

        return {
            "suite": suite,
            "test_cases": test_cases,
            "case_count": len(test_cases),
        }

    async def get_execution_summary(
        self, suite_id: UUID, db: AsyncSession
    ) -> Dict[str, Any]:
        """Get execution summary for a test suite."""
        result = await db.execute(
            select(TestCase).where(TestCase.test_suite_id == suite_id)
        )
        test_cases = result.scalars().all()

        summary = {
            "total": len(test_cases),
            "passed": sum(1 for tc in test_cases if tc.status == TestCaseStatus.PASSED),
            "failed": sum(1 for tc in test_cases if tc.status == TestCaseStatus.FAILED),
            "blocked": sum(
                1 for tc in test_cases if tc.status == TestCaseStatus.BLOCKED
            ),
            "skipped": sum(
                1 for tc in test_cases if tc.status == TestCaseStatus.SKIPPED
            ),
            "in_progress": sum(
                1 for tc in test_cases if tc.status == TestCaseStatus.IN_PROGRESS
            ),
            "draft": sum(1 for tc in test_cases if tc.status == TestCaseStatus.DRAFT),
        }

        # Calculate pass rate
        if summary["total"] > 0:
            summary["pass_rate"] = (summary["passed"] / summary["total"]) * 100
        else:
            summary["pass_rate"] = 0

        return summary


class TestCaseService:
    """Service for managing test cases."""

    async def get_case_with_logs(
        self, case_id: UUID, db: AsyncSession
    ) -> Optional[Dict[str, Any]]:
        """Get test case with execution logs."""
        result = await db.execute(
            select(TestCase).where(TestCase.id == case_id)
        )
        test_case = result.scalar_one_or_none()

        if not test_case:
            return None

        return {
            "test_case": test_case,
            "execution_logs": test_case.execution_logs or [],
            "last_execution": (
                test_case.execution_logs[-1] if test_case.execution_logs else None
            ),
        }

    async def get_cases_by_priority(
        self, project_id: UUID, priority: TestCasePriority, db: AsyncSession
    ) -> List[TestCase]:
        """Get all test cases by priority."""
        result = await db.execute(
            select(TestCase).where(
                and_(
                    TestCase.project_id == project_id,
                    TestCase.priority == priority,
                )
            )
        )
        return result.scalars().all()

    async def get_cases_by_status(
        self, project_id: UUID, status: TestCaseStatus, db: AsyncSession
    ) -> List[TestCase]:
        """Get all test cases by status."""
        result = await db.execute(
            select(TestCase).where(
                and_(
                    TestCase.project_id == project_id,
                    TestCase.status == status,
                )
            )
        )
        return result.scalars().all()

    async def get_test_cases_paginated(
        self,
        project_id: UUID,
        page: int,
        size: int,
        db: AsyncSession,
        search: Optional[str] = None,
        status: Optional[TestCaseStatus] = None,
        priority: Optional[TestCasePriority] = None,
        suite_id: Optional[UUID] = None,
    ) -> Dict[str, Any]:
        """Get paginated test cases."""
        query = select(TestCase).where(TestCase.project_id == project_id)

        if search:
            search_pattern = f"%{search}%"
            query = query.where(
                or_(
                    TestCase.title.ilike(search_pattern),
                    TestCase.description.ilike(search_pattern)
                )
            )
        
        if status:
            query = query.where(TestCase.status == status)
            
        if priority:
            query = query.where(TestCase.priority == priority)
            
        if suite_id:
            query = query.where(TestCase.test_suite_id == suite_id)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar_one()

        # Get paginated items - order by numeric_id ascending for proper human_id ordering
        query = query.order_by(TestCase.numeric_id.asc()).offset((page - 1) * size).limit(size)
        result = await db.execute(query)
        items = result.scalars().all()

        return {
            "items": items,
            "total": total,
            "page": page,
            "size": size
        }


def get_test_plan_service() -> TestPlanService:
    """Get test plan service instance."""
    from app.services.ai_service import get_ai_service

    ai_service = get_ai_service()
    return TestPlanService(ai_service)


def get_test_suite_service() -> TestSuiteService:
    """Get test suite service instance."""
    return TestSuiteService()


def get_test_case_service() -> TestCaseService:
    """Get test case service instance."""
    return TestCaseService()
