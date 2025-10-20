from typing import Dict, Any, List
from app.agents.base_agent import BaseAgent
import json

class TestPlanGeneratorAgent(BaseAgent):
    """
    AI Agent for generating comprehensive test plans from requirements,
    BRDs, JIRA tickets, and other documentation.
    """

    def __init__(self):
        system_prompt = """
        You are an expert QA engineer and test strategist. Your role is to analyze
        requirements, business documents, and technical specifications to create
        comprehensive, well-structured test plans.

        When creating a test plan, you should:
        1. Identify all testable features and functionalities
        2. Determine appropriate test types (functional, integration, E2E, etc.)
        3. Suggest test coverage areas
        4. Identify potential edge cases and risk areas
        5. Provide clear test objectives and success criteria
        6. Organize tests into logical suites

        Output your test plan as a structured JSON object with:
        - name: Test plan name
        - description: Detailed description
        - objectives: List of test objectives
        - test_suites: List of recommended test suites with descriptions
        - coverage_areas: Areas of the application to test
        - risks: Potential risks to consider
        - confidence_score: Your confidence in the test plan (0-100)

        Be thorough, practical, and focus on quality and coverage.
        """

        super().__init__(
            agent_name="test_plan_generator",
            system_prompt=system_prompt,
            temperature=0.7,
        )

    async def execute(
        self,
        requirements: str,
        project_context: Dict[str, Any] = None,
        source_documents: List[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate a test plan from requirements.

        Args:
            requirements: Requirements text or BRD content
            project_context: Project-specific context (tech stack, existing tests, etc.)
            source_documents: List of source document URLs/paths

        Returns:
            Generated test plan dictionary
        """
        # Retrieve relevant historical knowledge
        similar_plans = await self.retrieve_knowledge(
            collection_name=f"project_{project_context.get('project_id')}_test_plans",
            query=requirements,
            limit=3,
        ) if project_context else []

        # Build context
        context = {
            "requirements": requirements,
            "project_type": project_context.get("project_type", "web application") if project_context else "web application",
            "tech_stack": project_context.get("tech_stack", []) if project_context else [],
            "similar_plans": [plan["text"] for plan in similar_plans],
        }

        # Generate test plan
        user_input = f"""
        Generate a comprehensive test plan for the following requirements:

        {requirements}

        Project Type: {context['project_type']}
        Tech Stack: {', '.join(context['tech_stack'])}

        {f"Here are similar test plans from this project for reference: {context['similar_plans']}" if similar_plans else ""}

        Provide the test plan as a valid JSON object.
        """

        response = await self.generate_response(user_input)

        # Parse JSON response
        try:
            test_plan = self._parse_json_response(response)
        except Exception as e:
            print(f"Error parsing test plan: {e}")
            test_plan = {
                "name": "Generated Test Plan",
                "description": response,
                "objectives": [],
                "test_suites": [],
                "coverage_areas": [],
                "risks": [],
                "confidence_score": "50",
            }

        # Store this test plan as knowledge for future reference
        if project_context and project_context.get("project_id"):
            await self.store_knowledge(
                collection_name=f"project_{project_context['project_id']}_test_plans",
                text=json.dumps(test_plan),
                metadata={
                    "project_id": project_context["project_id"],
                    "requirements_summary": requirements[:500],
                    "source_documents": source_documents or [],
                },
            )

        return test_plan

    def _parse_json_response(self, response: str) -> Dict[str, Any]:
        """
        Parse JSON from LLM response, handling markdown code blocks.
        """
        # Remove markdown code blocks if present
        response = response.strip()
        if response.startswith("```json"):
            response = response[7:]
        if response.startswith("```"):
            response = response[3:]
        if response.endswith("```"):
            response = response[:-3]

        return json.loads(response.strip())

    async def refine_test_plan(
        self,
        existing_plan: Dict[str, Any],
        feedback: str,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Refine an existing test plan based on user feedback.

        Args:
            existing_plan: Current test plan
            feedback: User feedback for refinement

        Returns:
            Refined test plan
        """
        user_input = f"""
        Here is an existing test plan:
        {json.dumps(existing_plan, indent=2)}

        User feedback:
        {feedback}

        Please refine the test plan based on the feedback and return the updated version as JSON.
        """

        response = await self.generate_response(user_input)
        return self._parse_json_response(response)
