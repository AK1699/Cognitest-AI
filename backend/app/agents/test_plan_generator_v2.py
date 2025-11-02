"""
Enhanced Test Plan Generator with BRD + JIRA Integration + Self-Learning
Learns from BRDs, user stories, feedback, and past test plans
"""
from typing import Optional, List, Dict, Any
import logging
from datetime import datetime
import json

from app.agents.base_agent import BaseAgent
from app.services.document_knowledge_service import get_document_knowledge_service
from app.services.jira_integration_service import get_jira_service
from app.core.config import settings

logger = logging.getLogger(__name__)


class TestPlanGeneratorV2(BaseAgent):
    """
    Enhanced test plan generator that learns from:
    1. BRD Documents
    2. JIRA User Stories
    3. Past Test Plans
    4. User Feedback
    """

    def __init__(self):
        """Initialize enhanced test plan generator"""
        super().__init__(
            agent_name="test_plan_generator_v2",
            system_prompt="""You are an expert test plan generator that creates comprehensive test plans.

You have access to:
- Business Requirements Documents (BRDs)
- User stories from JIRA
- Acceptance criteria
- Past test plans (successful ones)
- User feedback on previous plans

Your test plans should:
1. Cover all acceptance criteria
2. Include edge cases and error scenarios
3. Consider performance and security
4. Reference relevant components
5. Be based on project standards

Format the test plan clearly with:
- Overview
- Test Scope
- Test Strategy
- Test Cases (with steps, expected results)
- Entry/Exit Criteria
- Risk Assessment
""",
            model_name="gpt-4-turbo-preview",
            temperature=0.7,
        )

    async def execute(
        self,
        user_story_key: Optional[str] = None,
        user_story_text: Optional[str] = None,
        brd_document_id: Optional[str] = None,
        project_id: Optional[str] = None,
        jira_config: Optional[Dict[str, str]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate test plan from user story, BRD, and learned patterns

        Args:
            user_story_key: JIRA user story key (e.g., 'PROJ-123')
            user_story_text: User story text (if not from JIRA)
            brd_document_id: Document ID of BRD
            project_id: Project ID for context
            jira_config: JIRA configuration (url, username, token)
            **kwargs: Additional context

        Returns:
            Test plan with metadata
        """
        try:
            logger.info(f"Generating test plan for story: {user_story_key}")

            context_parts = []
            metadata = {
                "user_story_key": user_story_key,
                "brd_document_id": brd_document_id,
                "project_id": project_id,
                "generation_timestamp": datetime.utcnow().isoformat(),
            }

            # 1. FETCH USER STORY FROM JIRA
            user_story = None
            if user_story_key and jira_config:
                user_story = await self._fetch_jira_story(user_story_key, jira_config)
                if user_story:
                    context_parts.append(f"User Story: {user_story}")
                    metadata["jira_story"] = user_story
            elif user_story_text:
                context_parts.append(f"User Story: {user_story_text}")

            # 2. RETRIEVE BRD CONTEXT
            if brd_document_id and project_id:
                brd_context = await self._get_brd_context(brd_document_id, project_id)
                if brd_context:
                    context_parts.append(f"BRD Reference: {brd_context}")
                    metadata["brd_used"] = True

            # 3. RETRIEVE SIMILAR PAST TEST PLANS
            if project_id:
                similar_plans = await self._get_similar_test_plans(
                    project_id,
                    user_story_key or user_story_text,
                )
                if similar_plans:
                    context_parts.append(f"Similar Test Plans:\n{similar_plans}")
                    metadata["similar_plans_count"] = len(similar_plans)

            # 4. RETRIEVE LEARNED PATTERNS FROM FEEDBACK
            if project_id:
                learned_patterns = await self._get_learned_patterns(project_id)
                if learned_patterns:
                    context_parts.append(f"Learned Patterns:\n{learned_patterns}")
                    metadata["patterns_applied"] = learned_patterns

            # 5. BUILD ENHANCED PROMPT
            enhanced_prompt = self._build_test_plan_prompt(
                user_story or user_story_text,
                context_parts,
                project_id,
            )

            # 6. GENERATE TEST PLAN
            test_plan = await self.generate_response(
                user_input=enhanced_prompt,
                context={"project_id": project_id},
            )

            # 7. STORE GENERATED PLAN FOR LEARNING
            if project_id:
                await self._store_generated_plan(
                    project_id,
                    user_story_key or "text_input",
                    test_plan,
                    metadata,
                )

            # 8. EXTRACT TEST CASES FROM PLAN
            test_cases = await self._extract_test_cases_from_plan(test_plan)

            return {
                "status": "success",
                "test_plan": test_plan,
                "test_cases": test_cases,
                "metadata": metadata,
                "user_story_key": user_story_key,
                "brd_used": brd_document_id is not None,
                "similar_plans_referenced": len(similar_plans) if "similar_plans" in locals() else 0,
            }

        except Exception as e:
            logger.error(f"Error generating test plan: {e}")
            return {
                "status": "error",
                "error": str(e),
                "user_story_key": user_story_key,
            }

    async def _fetch_jira_story(
        self,
        story_key: str,
        jira_config: Dict[str, str],
    ) -> Optional[str]:
        """
        Fetch user story from JIRA

        Args:
            story_key: JIRA story key
            jira_config: JIRA configuration

        Returns:
            Story text or None
        """
        try:
            jira_service = await get_jira_service(
                jira_url=jira_config.get("url") or settings.JIRA_URL,
                jira_username=jira_config.get("username") or settings.JIRA_USERNAME,
                jira_api_token=jira_config.get("token") or settings.JIRA_API_TOKEN,
            )

            issue = await jira_service.fetch_issue_details(story_key)
            if issue:
                text = jira_service._convert_to_text(issue)
                logger.info(f"Fetched JIRA story: {story_key}")
                return text

            return None

        except Exception as e:
            logger.error(f"Error fetching JIRA story: {e}")
            return None

    async def _get_brd_context(
        self,
        brd_document_id: str,
        project_id: str,
    ) -> Optional[str]:
        """
        Retrieve BRD document context

        Args:
            brd_document_id: Document ID
            project_id: Project ID

        Returns:
            BRD context text or None
        """
        try:
            doc_service = await get_document_knowledge_service()

            # This would retrieve the specific document from database
            # For now, return a placeholder
            logger.debug(f"Retrieved BRD context: {brd_document_id}")
            return f"[BRD Document referenced: {brd_document_id}]"

        except Exception as e:
            logger.error(f"Error getting BRD context: {e}")
            return None

    async def _get_similar_test_plans(
        self,
        project_id: str,
        query: str,
        limit: int = 3,
    ) -> Optional[str]:
        """
        Retrieve similar past test plans

        Args:
            project_id: Project ID
            query: Search query
            limit: Max plans to retrieve

        Returns:
            Similar plans text or None
        """
        try:
            doc_service = await get_document_knowledge_service()

            # Search for similar test plans in vector DB
            similar_docs = await doc_service.retrieve_document_context(
                project_id=project_id,
                query=query,
                limit=limit,
            )

            if not similar_docs:
                return None

            # Format similar plans
            plans_text = "Previous similar test plans:\n"
            for doc in similar_docs:
                plans_text += f"- {doc['text'][:200]}...\n"

            logger.debug(f"Retrieved {len(similar_docs)} similar test plans")
            return plans_text

        except Exception as e:
            logger.error(f"Error getting similar plans: {e}")
            return None

    async def _get_learned_patterns(
        self,
        project_id: str,
    ) -> Optional[str]:
        """
        Retrieve learned patterns from feedback

        Args:
            project_id: Project ID

        Returns:
            Learned patterns text or None
        """
        try:
            # This would retrieve patterns from ai_feedback table
            # and analysis of what works in this project
            logger.debug(f"Retrieved learned patterns for project {project_id}")
            return "- Focus on acceptance criteria coverage\n- Include edge cases\n- Document assumptions"

        except Exception as e:
            logger.error(f"Error getting learned patterns: {e}")
            return None

    async def _store_generated_plan(
        self,
        project_id: str,
        story_key: str,
        test_plan: str,
        metadata: Dict[str, Any],
    ):
        """
        Store generated test plan for learning

        Args:
            project_id: Project ID
            story_key: Story key
            test_plan: Test plan text
            metadata: Metadata
        """
        try:
            # Store in vector DB for future context
            await self.store_knowledge(
                collection_name=f"project_{project_id}_test_plans",
                text=test_plan,
                metadata={
                    "story_key": story_key,
                    "type": "test_plan",
                    "generated_at": datetime.utcnow().isoformat(),
                    **metadata,
                },
            )

            logger.info(f"Stored test plan for {story_key}")

        except Exception as e:
            logger.error(f"Error storing test plan: {e}")

    async def _extract_test_cases_from_plan(
        self,
        test_plan: str,
    ) -> List[Dict[str, Any]]:
        """
        Extract test cases from generated test plan

        Args:
            test_plan: Test plan text

        Returns:
            List of test cases
        """
        try:
            # Parse test plan to extract individual test cases
            # This is a simplified extraction
            test_cases = []

            lines = test_plan.split("\n")
            current_case = {}

            for line in lines:
                line = line.strip()

                if line.startswith("Test Case") or line.startswith("TC"):
                    if current_case:
                        test_cases.append(current_case)
                    current_case = {"title": line}

                elif "Steps:" in line:
                    current_case["steps"] = line

                elif "Expected:" in line or "Expected Result:" in line:
                    current_case["expected_result"] = line

            if current_case:
                test_cases.append(current_case)

            logger.debug(f"Extracted {len(test_cases)} test cases")
            return test_cases

        except Exception as e:
            logger.error(f"Error extracting test cases: {e}")
            return []

    def _build_test_plan_prompt(
        self,
        user_story: str,
        context_parts: List[str],
        project_id: Optional[str],
    ) -> str:
        """
        Build enhanced prompt with all context

        Args:
            user_story: User story text
            context_parts: List of context strings
            project_id: Project ID

        Returns:
            Enhanced prompt
        """
        prompt = self.system_prompt + "\n\n"

        # Add all context
        if context_parts:
            prompt += "REFERENCE INFORMATION:\n"
            for context in context_parts:
                prompt += f"{context}\n\n"

        # Add the user story to test
        prompt += f"Create a comprehensive test plan for the following user story:\n\n{user_story}\n\n"

        prompt += """Include:
1. Test Plan Overview
2. Scope and Objectives
3. Test Strategy
4. Test Cases (detailed steps and expected results)
5. Entry and Exit Criteria
6. Risk Assessment
7. Deliverables

Format each test case clearly with:
- ID
- Title
- Preconditions
- Steps
- Expected Results
- Actual Results (to be filled during execution)
"""

        return prompt
