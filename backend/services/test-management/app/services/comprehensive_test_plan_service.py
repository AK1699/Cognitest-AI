"""
Comprehensive Test Plan Generator Service following IEEE 829 standard.
Similar to autonomousMVP implementation with enhanced AI prompts and fallback mechanisms.
"""
import logging
import json
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime, date, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from ..models.test_plan import TestPlan, GenerationType
from ..models.test_suite import TestSuite
from ..models.test_case import TestCase, TestCasePriority, TestCaseStatus
from cognitest_common import AIService, get_ai_service
from ..prompts import get_prompt_manager

logger = logging.getLogger(__name__)


class ComprehensiveTestPlanService:
    """
    Comprehensive test plan generation service following IEEE 829 standard.
    Generates detailed test plans with 11+ industry-standard sections.
    """

    def __init__(self, ai_service: AIService):
        self.ai_service = ai_service
        self.prompt_manager = get_prompt_manager()

    async def generate_comprehensive_test_plan(
        self,
        project_id: UUID,
        requirements: Dict[str, Any],
        db: Optional[AsyncSession] = None,
    ) -> Dict[str, Any]:
        """
        Generate a comprehensive test plan following IEEE 829 standard.

        Args:
            project_id: Project ID
            requirements: Test plan requirements dict containing:
                - project_type: Type of project (web-app, mobile-app, api, etc.)
                - description: Project description
                - features: List of features to test
                - platforms: List of target platforms
                - priority: Priority level (low, medium, high, critical)
                - complexity: Complexity level (low, medium, high)
                - timeframe: Expected timeframe
                - additional optional fields
            db: Database session

        Returns:
            Generated test plan with comprehensive IEEE 829 sections
        """
        try:
            logger.info(f"Generating comprehensive test plan for project {project_id}")
            logger.info(f"Using AI provider: {self.ai_service.provider}")

            # Build comprehensive prompt
            prompt = self._build_comprehensive_prompt(requirements)
            logger.info(f"Prompt length: {len(prompt)} characters")

            # Generate using AI with retry logic for completeness
            test_plan_data = await self._generate_with_retry(prompt, requirements, max_retries=2)

            # Post-process: enrich any remaining gaps with intelligent defaults
            test_plan_data = self._enrich_output(test_plan_data, requirements)

            # Validate output structure completeness
            validation_issues = self._validate_output(test_plan_data)
            if validation_issues:
                logger.warning(f"⚠️  Output validation found {len(validation_issues)} issues, auto-repairing...")
                test_plan_data = self._auto_repair(test_plan_data, requirements, validation_issues)

            # Calculate confidence score based on multiple quality factors
            confidence_score = self._calculate_confidence_score(
                test_plan_data=test_plan_data,
                requirements=requirements,
                response_length=len(str(test_plan_data)),
                used_ai=True
            )

            logger.info(f"✅ AI-generated test plan successfully! Confidence: {confidence_score}%")
            return {
                "status": "success",
                "data": test_plan_data,
                "confidence": confidence_score,
            }

        except Exception as e:
            logger.error(f"❌ Error generating comprehensive test plan with AI: {e}")
            logger.error(f"Error type: {type(e).__name__}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")

            # Fallback to rule-based generation
            logger.warning("⚠️  Falling back to rule-based generation")
            fallback_data = self._generate_fallback_test_plan(requirements, error_message=str(e))

            # Calculate confidence for fallback (will be lower)
            confidence_score = self._calculate_confidence_score(
                test_plan_data=fallback_data,
                requirements=requirements,
                response_length=0,
                used_ai=False
            )

            return {
                "status": "success",
                "data": fallback_data,
                "confidence": confidence_score,
                "note": "Generated using fallback mechanism due to AI error",
            }

    # ═══════════════════════════════════════════════════════════════════
    # Optimization Pipeline: Retry → Validate → Enrich → Repair
    # ═══════════════════════════════════════════════════════════════════

    async def _generate_with_retry(
        self, prompt: str, requirements: Dict[str, Any], max_retries: int = 2
    ) -> Dict[str, Any]:
        """
        Generate test plan with intelligent retry logic.
        On each attempt, call AI, parse, and validate.
        If missing critical sections, retry with a targeted follow-up prompt.
        """
        last_parsed = None

        for attempt in range(1, max_retries + 2):
            logger.info(f"🔄 AI generation attempt {attempt}/{max_retries + 1}...")

            if attempt == 1:
                current_prompt = prompt
            else:
                missing_sections = self._find_missing_sections(last_parsed)
                if not missing_sections:
                    logger.info("✅ All sections present, no retry needed")
                    break
                logger.info(f"⚠️  Missing sections: {missing_sections}. Retrying with targeted prompt...")
                current_prompt = self._build_followup_prompt(last_parsed, missing_sections, requirements)

            try:
                response = await self.ai_service.generate_completion(
                    messages=[{"role": "user", "content": current_prompt}],
                    temperature=0.2,
                    max_tokens=8000,
                    json_mode=True,
                )
                logger.info(f"AI response received: {len(response)} characters (attempt {attempt})")
                parsed = self._parse_comprehensive_response(response, requirements)

                if attempt == 1:
                    last_parsed = parsed
                else:
                    last_parsed = self._merge_responses(last_parsed, parsed)
            except Exception as e:
                logger.warning(f"Attempt {attempt} failed: {e}")
                if attempt == max_retries + 1:
                    raise
                continue

        return last_parsed or self._generate_fallback_test_plan(requirements)

    def _find_missing_sections(self, data: Dict[str, Any]) -> List[str]:
        """Identify which IEEE 829 sections are missing or empty."""
        if not data:
            return ["all"]
        required = {
            "test_objectives": lambda v: isinstance(v, list) and len(v) >= 2,
            "scope_of_testing": lambda v: isinstance(v, dict) and v.get("in_scope"),
            "test_approach": lambda v: isinstance(v, dict) and v.get("methodology"),
            "assumptions_and_constraints": lambda v: bool(v),
            "test_schedule": lambda v: bool(v),
            "resources_and_roles": lambda v: isinstance(v, list) and len(v) >= 3,
            "test_environment": lambda v: isinstance(v, dict) and bool(v),
            "entry_exit_criteria": lambda v: isinstance(v, dict) and v.get("entry"),
            "risk_management": lambda v: isinstance(v, dict) and v.get("risks"),
            "deliverables_and_reporting": lambda v: isinstance(v, dict) and bool(v),
            "approval_signoff": lambda v: isinstance(v, dict) and bool(v),
            "test_suites": lambda v: isinstance(v, list) and len(v) >= 5,
        }
        return [s for s, validator in required.items() if not data.get(s) or not validator(data.get(s))]

    def _build_followup_prompt(self, existing: Dict[str, Any], missing: List[str], requirements: Dict[str, Any]) -> str:
        """Build a targeted follow-up prompt to fill only the missing sections."""
        descs = {
            "test_objectives": "3-5 test objectives with title, description, success_criteria, priority",
            "scope_of_testing": "scope with in_scope (6-10 items), out_of_scope (4-6 items), testing_types",
            "test_approach": "test approach with methodology, testing_types, automation_strategy, tools",
            "assumptions_and_constraints": "4-6 assumptions and 3-5 constraints with impact and mitigation",
            "test_schedule": "phases with start/end dates, milestones, deliverables",
            "resources_and_roles": "5-8 team roles with responsibilities, skills, allocation",
            "test_environment": "hardware, software, network, test_data, access requirements",
            "entry_exit_criteria": "entry (5-7), exit (6-8), suspension and resumption conditions",
            "risk_management": "5-8 risks with probability, impact, mitigation, owner, contingency; include risk_matrix",
            "deliverables_and_reporting": "artifacts, reporting structure, stakeholders, metrics",
            "approval_signoff": "approval process, approvers, sign-off criteria",
            "test_suites": "5-7 test suites with 3-10 test cases each including detailed steps",
        }
        missing_desc = "\n".join(f"- **{s}**: {descs.get(s, 'Complete this section')}" for s in missing)
        return (
            "**CRITICAL:** Return ONLY valid JSON. Start with { end with }. No markdown.\n\n"
            f"Project: {requirements.get('project_type', 'web-app')} | "
            f"Features: {requirements.get('features', [])} | "
            f"Priority: {requirements.get('priority', 'medium')}\n\n"
            f"Generate ONLY these missing sections:\n{missing_desc}\n\n"
            "Return a JSON object with only the missing section keys."
        )

    def _merge_responses(self, original: Dict[str, Any], followup: Dict[str, Any]) -> Dict[str, Any]:
        """Merge follow-up AI response into the original, filling gaps."""
        merged = original.copy()
        for key, value in followup.items():
            existing = merged.get(key)
            if not existing or (isinstance(existing, list) and len(existing) == 0):
                merged[key] = value
            elif isinstance(existing, dict) and isinstance(value, dict):
                for sub_key, sub_val in value.items():
                    if sub_key not in existing or not existing[sub_key]:
                        existing[sub_key] = sub_val
        return merged

    def _validate_output(self, data: Dict[str, Any]) -> List[str]:
        """Validate the test plan output for completeness. Returns list of issues."""
        issues = []
        ieee_sections = [
            "test_objectives", "scope_of_testing", "test_approach",
            "assumptions_and_constraints", "test_schedule", "resources_and_roles",
            "test_environment", "entry_exit_criteria", "risk_management",
            "deliverables_and_reporting", "approval_signoff"
        ]
        for section in ieee_sections:
            if not data.get(section):
                issues.append(f"missing_section:{section}")

        suites = data.get("test_suites", [])
        if len(suites) < 5:
            issues.append(f"insufficient_suites:{len(suites)}")
        for suite in suites:
            if not suite.get("test_cases"):
                issues.append(f"empty_suite:{suite.get('name', 'unknown')}")
        if not data.get("name"):
            issues.append("missing_name")
        return issues

    def _enrich_output(self, data: Dict[str, Any], requirements: Dict[str, Any]) -> Dict[str, Any]:
        """Enrich AI output by filling any gaps with high-quality defaults."""
        enriched = data.copy()
        if not enriched.get("name"):
            enriched["name"] = f"{requirements.get('project_type', 'Application').title()} Comprehensive Test Plan"
        if not enriched.get("description"):
            enriched["description"] = requirements.get("description", "Comprehensive test plan")
        if not enriched.get("tags"):
            enriched["tags"] = self._generate_tags(requirements)

        section_defaults = {
            "test_objectives": self._default_test_objectives,
            "scope_of_testing": self._default_scope,
            "test_approach": self._default_approach,
            "assumptions_and_constraints": self._default_assumptions,
            "test_schedule": self._default_schedule,
            "resources_and_roles": self._default_resources,
            "test_environment": self._default_environment,
            "entry_exit_criteria": self._default_criteria,
            "risk_management": self._default_risks,
            "deliverables_and_reporting": self._default_reporting,
            "approval_signoff": self._default_approval,
        }
        for section, default_fn in section_defaults.items():
            if not enriched.get(section):
                logger.info(f"📝 Enriching missing section: {section}")
                enriched[section] = default_fn(requirements)

        # Ensure sufficient test suites
        suites = enriched.get("test_suites", [])
        if len(suites) < 3:
            defaults = self._default_test_suites(requirements)
            existing_names = {s.get("name", "").lower() for s in suites}
            for ds in defaults:
                if ds.get("name", "").lower() not in existing_names:
                    suites.append(ds)
            enriched["test_suites"] = suites
        return enriched

    def _auto_repair(self, data: Dict[str, Any], requirements: Dict[str, Any], issues: List[str]) -> Dict[str, Any]:
        """Auto-repair specific validation issues."""
        repaired = data.copy()
        section_defaults = {
            "test_objectives": self._default_test_objectives,
            "scope_of_testing": self._default_scope,
            "test_approach": self._default_approach,
            "assumptions_and_constraints": self._default_assumptions,
            "test_schedule": self._default_schedule,
            "resources_and_roles": self._default_resources,
            "test_environment": self._default_environment,
            "entry_exit_criteria": self._default_criteria,
            "risk_management": self._default_risks,
            "deliverables_and_reporting": self._default_reporting,
            "approval_signoff": self._default_approval,
        }
        for issue in issues:
            if issue.startswith("missing_section:"):
                section = issue.split(":")[1]
                if section in section_defaults:
                    repaired[section] = section_defaults[section](requirements)
                    logger.info(f"🔧 Auto-repaired: {section}")
            elif issue.startswith("empty_suite:"):
                for suite in repaired.get("test_suites", []):
                    if not suite.get("test_cases"):
                        suite["test_cases"] = [{
                            "name": f"Verify {suite.get('name', 'feature')} primary workflow",
                            "description": f"Validate the main workflow for {suite.get('name', 'this feature')}",
                            "steps": [
                                {"step_number": 1, "action": "Navigate to the feature", "expected_result": "Feature loads successfully"},
                                {"step_number": 2, "action": "Execute primary workflow", "expected_result": "Workflow completes without errors"},
                                {"step_number": 3, "action": "Verify the outcome", "expected_result": "Expected results displayed correctly"},
                            ],
                            "expected_result": "Primary workflow functions as expected",
                            "priority": "high", "estimated_time": 15,
                        }]
            elif issue.startswith("insufficient_suites:"):
                existing = repaired.get("test_suites", [])
                defaults = self._default_test_suites(requirements)
                existing_names = {s.get("name", "").lower() for s in existing}
                for ds in defaults:
                    if len(existing) >= 5:
                        break
                    if ds.get("name", "").lower() not in existing_names:
                        existing.append(ds)
                repaired["test_suites"] = existing
            elif issue == "missing_name":
                repaired["name"] = f"{requirements.get('project_type', 'Application').title()} Test Plan"
        return repaired

    def _build_comprehensive_prompt(self, requirements: Dict[str, Any]) -> str:
        """
        Build comprehensive prompt for test plan generation using PromptManager.

        This method now uses template-based prompts with Chain-of-Thought reasoning
        and few-shot examples for improved AI output quality.
        """
        # Prepare variables for template
        variables = {
            'projectType': requirements.get("project_type", "web-app"),
            'description': requirements.get("description", ""),
            'platforms': requirements.get("platforms", ["web"]),
            'features': requirements.get("features", []),
            'priority': requirements.get("priority", "medium"),
            'complexity': requirements.get("complexity", "medium"),
            'timeframe': requirements.get("timeframe", "2-4 weeks"),
        }

        # Optional: Validate variables (helps catch issues early)
        is_valid, missing = self.prompt_manager.validate_prompt_variables(
            'test_plan', variables
        )
        if not is_valid:
            logger.warning(f"Missing prompt variables: {missing}. Using defaults.")

        # Load and render template
        logger.info("Loading test plan prompt from template...")
        return self.prompt_manager.load_test_plan_prompt(variables)

    def _parse_comprehensive_response(
        self, response: str, requirements: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Parse AI response and ensure all required fields exist."""
        try:
            logger.info(f"Parsing comprehensive response (length: {len(response)})")
            logger.info(f"Response starts with: {repr(response[:100])}")
            logger.info(f"Response ends with: {repr(response[-100:])}")

            import re

            # Clean the response
            cleaned_response = response.strip()

            # Try direct JSON parse first (JSON mode should return pure JSON)
            try:
                parsed = json.loads(cleaned_response)
                logger.info(f"✅ JSON parsed successfully on first attempt!")
                logger.info(f"🔍 AI-generated name field: {repr(parsed.get('name'))}")
                logger.info(f"🔍 AI response has {len(parsed)} top-level keys: {list(parsed.keys())[:20]}")
            except json.JSONDecodeError as first_error:
                logger.info(f"First parse failed: {first_error}, trying extraction...")

                # Fallback: Try to extract JSON from markdown blocks (shouldn't happen with JSON mode)
                json_match = re.search(r'```json\s*(.*?)\s*```', response, re.DOTALL)
                if json_match:
                    json_str = json_match.group(1)
                    logger.info(f"Extracted JSON from markdown block (length: {len(json_str)})")
                else:
                    # Try to find JSON object
                    json_match = re.search(r'\{[\s\S]*\}', response)
                    if not json_match:
                        raise ValueError("No valid JSON found in response")
                    json_str = json_match.group()
                    logger.info(f"Extracted JSON object (length: {len(json_str)})")

                # Remove comments and trailing commas
                cleaned_text = re.sub(r'//.*$', '', json_str, flags=re.MULTILINE)
                cleaned_text = re.sub(r'/\*[\s\S]*?\*/', '', cleaned_text)
                cleaned_text = re.sub(r',(\s*[}\]])', r'\1', cleaned_text)

                logger.info(f"Attempting to parse JSON (length after cleaning: {len(cleaned_text)})")
                parsed = json.loads(cleaned_text)
                logger.info(f"✅ JSON parsed successfully after cleanup!")
                logger.info(f"🔍 AI-generated name field: {repr(parsed.get('name'))}")
                logger.info(f"🔍 AI response has {len(parsed)} top-level keys: {list(parsed.keys())[:20]}")

            # Ensure all required fields with fallbacks
            ai_name = parsed.get("name")
            fallback_name = f"{requirements.get('project_type', 'Test').title()} Plan"

            if ai_name:
                logger.info(f"✅ Using AI-generated name: '{ai_name}'")
            else:
                logger.warning(f"⚠️  No AI name found! Using fallback: '{fallback_name}'")

            result = {
                "name": ai_name or fallback_name,
                "description": parsed.get("description", requirements.get("description", "")),
                "priority": requirements.get("priority", "medium"),
                "estimated_hours": parsed.get("estimated_hours", self._estimate_hours(requirements)),
                "complexity": requirements.get("complexity", "medium"),
                "timeframe": requirements.get("timeframe", "2-4 weeks"),
                "project_type": requirements.get("project_type", "web-app"),
                "platforms": requirements.get("platforms", ["web"]),
                "features": requirements.get("features", []),
                "tags": parsed.get("tags", self._generate_tags(requirements)),

                # IEEE 829 sections
                "test_objectives": parsed.get("test_objectives", self._default_test_objectives(requirements)),
                "scope_of_testing": parsed.get("scope_of_testing", self._default_scope(requirements)),
                "test_approach": parsed.get("test_approach", self._default_approach(requirements)),
                "assumptions_and_constraints": parsed.get("assumptions_and_constraints", self._default_assumptions(requirements)),
                "test_schedule": parsed.get("test_schedule", self._default_schedule(requirements)),
                "resources_and_roles": parsed.get("resources_and_roles", self._default_resources(requirements)),
                "test_environment": parsed.get("test_environment", self._default_environment(requirements)),
                "entry_exit_criteria": parsed.get("entry_exit_criteria", self._default_criteria(requirements)),
                "risk_management": parsed.get("risk_management", self._default_risks(requirements)),
                "deliverables_and_reporting": parsed.get("deliverables_and_reporting", self._default_reporting(requirements)),
                "approval_signoff": parsed.get("approval_signoff", self._default_approval(requirements)),
                "test_suites": parsed.get("test_suites", []),
            }

            return result

        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error: {e}")
            logger.error(f"JSON string attempted (first 500 chars): {cleaned_text[:500] if 'cleaned_text' in locals() else 'N/A'}")
            logger.error(f"JSON string attempted (last 500 chars): {cleaned_text[-500:] if 'cleaned_text' in locals() else 'N/A'}")
            return self._generate_fallback_test_plan(requirements, error_message=f"JSON Parse Error: {e}")
        except Exception as e:
            logger.error(f"Error parsing AI response: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return self._generate_fallback_test_plan(requirements, error_message=f"Response Parsing Error: {e}")

    def _generate_fallback_test_plan(self, requirements: Dict[str, Any], error_message: str = None) -> Dict[str, Any]:
        """Generate fallback test plan using rule-based approach."""
        logger.info("Using fallback test plan generation")

        description = requirements.get("description", "Comprehensive test plan")
        if error_message:
            description = f"⚠️ [AI GENERATION FAILED]\nError: {error_message}\n\nUsing rule-based fallback generation.\n\n{description}"

        return {
            "name": f"{requirements.get('project_type', 'Test').title()} Plan",
            "description": description,
            "priority": requirements.get("priority", "medium"),
            "estimated_hours": self._estimate_hours(requirements),
            "complexity": requirements.get("complexity", "medium"),
            "timeframe": requirements.get("timeframe", "2-4 weeks"),
            "project_type": requirements.get("project_type", "web-app"),
            "platforms": requirements.get("platforms", ["web"]),
            "features": requirements.get("features", []),
            "tags": self._generate_tags(requirements),

            "test_objectives": self._default_test_objectives(requirements),
            "scope_of_testing": self._default_scope(requirements),
            "test_approach": self._default_approach(requirements),
            "assumptions_and_constraints": self._default_assumptions(requirements),
            "test_schedule": self._default_schedule(requirements),
            "resources_and_roles": self._default_resources(requirements),
            "test_environment": self._default_environment(requirements),
            "entry_exit_criteria": self._default_criteria(requirements),
            "risk_management": self._default_risks(requirements),
            "deliverables_and_reporting": self._default_reporting(requirements),
            "approval_signoff": self._default_approval(requirements),
            "test_suites": self._default_test_suites(requirements),
        }

    def _calculate_confidence_score(
        self,
        test_plan_data: Dict[str, Any],
        requirements: Dict[str, Any],
        response_length: int,
        used_ai: bool
    ) -> int:
        """
        Calculate confidence score (0-100%) based on multiple quality factors.

        Factors considered:
        1. AI vs Fallback (40 points)
        2. Input quality - features, description (20 points)
        3. Output completeness - IEEE sections filled (20 points)
        4. Test suite quality - number and detail (10 points)
        5. Response quality - length and detail (10 points)

        Args:
            test_plan_data: Generated test plan data
            requirements: Input requirements
            response_length: Length of AI response
            used_ai: Whether AI was used or fallback

        Returns:
            Confidence score as integer percentage (0-100)
        """
        score = 0

        # Factor 1: AI vs Fallback (40 points)
        if used_ai:
            score += 40  # Full points for using AI
        else:
            score += 10  # Minimal points for fallback

        # Factor 2: Input Quality (20 points)
        input_score = 0
        if requirements.get("description") and len(requirements.get("description", "")) > 50:
            input_score += 5
        if requirements.get("features") and len(requirements.get("features", [])) > 0:
            input_score += 5
        if requirements.get("platforms") and len(requirements.get("platforms", [])) > 0:
            input_score += 3
        if requirements.get("project_type"):
            input_score += 3
        if requirements.get("complexity"):
            input_score += 2
        if requirements.get("priority"):
            input_score += 2
        score += input_score

        # Factor 3: Output Completeness - IEEE 829 sections (20 points)
        ieee_sections = [
            "test_objectives",
            "scope_of_testing",
            "test_approach",
            "assumptions_and_constraints",
            "test_schedule",
            "resources_and_roles",
            "test_environment",
            "entry_exit_criteria",
            "risk_management",
            "deliverables_and_reporting",
            "approval_signoff"
        ]
        filled_sections = sum(1 for section in ieee_sections if test_plan_data.get(section))
        completeness_score = int((filled_sections / len(ieee_sections)) * 20)
        score += completeness_score

        # Factor 4: Test Suite Quality (10 points)
        test_suites = test_plan_data.get("test_suites", [])
        if test_suites:
            suite_score = min(len(test_suites) * 2, 5)  # Up to 5 points for suites
            total_cases = sum(len(suite.get("test_cases", [])) for suite in test_suites)
            case_score = min(total_cases, 5)  # Up to 5 points for test cases
            score += suite_score + case_score

        # Factor 5: Response Quality (10 points)
        if used_ai:
            if response_length > 5000:
                score += 10  # Detailed response
            elif response_length > 2000:
                score += 7  # Good response
            elif response_length > 1000:
                score += 5  # Adequate response
            else:
                score += 3  # Minimal response

        # Cap at 100%
        final_score = min(score, 100)

        logger.info(f"Confidence calculation: AI={used_ai}, Input={input_score}/20, "
                   f"Completeness={completeness_score}/20, Suites={len(test_suites)}, "
                   f"Final={final_score}%")

        return final_score

    # Utility methods
    def _estimate_hours(self, requirements: Dict[str, Any]) -> int:
        """Estimate hours based on complexity and features."""
        complexity = requirements.get("complexity", "medium")
        feature_count = len(requirements.get("features", []))

        base_hours = {"low": 40, "medium": 80, "high": 160}.get(complexity, 80)
        return base_hours + (feature_count * 8)

    def _generate_tags(self, requirements: Dict[str, Any]) -> List[str]:
        """Generate tags based on requirements."""
        tags = [
            requirements.get("project_type", "web-app"),
            requirements.get("priority", "medium"),
            requirements.get("complexity", "medium"),
            "ai-generated",
        ]
        tags.extend(requirements.get("platforms", []))
        return tags

    # Default section generators (IEEE 829 compliant)
    def _default_test_objectives(self, requirements: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate default test objectives."""
        features = requirements.get("features", [])
        platforms = requirements.get("platforms", ["web"])

        return [
            {
                "id": "OBJ-001",
                "objective": "Verify core functionality meets requirements",
                "description": f"Ensure all {', '.join(features[:3])} function correctly",
                "success_criteria": ["95% test pass rate", "Zero critical defects"],
                "quality_goals": ["High reliability", "User satisfaction"],
            },
            {
                "id": "OBJ-002",
                "objective": "Validate cross-platform compatibility",
                "description": f"Confirm system works on {', '.join(platforms)}",
                "success_criteria": ["Cross-platform testing complete", "Consistent UX"],
                "quality_goals": ["Platform consistency", "Performance"],
            },
        ]

    def _default_scope(self, requirements: Dict[str, Any]) -> Dict[str, Any]:
        """Generate default scope of testing."""
        features = requirements.get("features", [])
        return {
            "in_scope": features + ["Core functionality", "User interface", "Integration points"],
            "out_of_scope": ["Third-party internals", "Infrastructure testing"],
            "features": features,
            "systems": [f"{requirements.get('project_type', 'Application')}", "Database"],
            "environments": ["Development", "Testing", "Staging"],
            "test_types": ["Functional", "Integration", "UI", "Security"],
        }

    def _default_approach(self, requirements: Dict[str, Any]) -> Dict[str, Any]:
        """Generate default test approach."""
        return {
            "methodology": "Agile",
            "testing_types": [
                {
                    "type": "Functional Testing",
                    "description": "Verify feature functionality",
                    "coverage": "90%",
                    "priority": "High",
                },
                {
                    "type": "Integration Testing",
                    "description": "Test system interfaces",
                    "coverage": "80%",
                    "priority": "High",
                },
            ],
            "test_techniques": ["Equivalence partitioning", "Boundary value analysis"],
            "automation_approach": "Progressive automation focusing on regression",
            "tools_and_frameworks": ["Pytest", "Selenium", "Postman"],
        }

    def _default_assumptions(self, requirements: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate default assumptions and constraints."""
        return [
            {
                "type": "assumption",
                "description": "Test environment available during testing period",
                "impact": "Critical - testing cannot proceed without environment",
                "mitigation": "Backup environment provisioned",
            },
            {
                "type": "constraint",
                "description": f"Limited timeframe of {requirements.get('timeframe', '2-4 weeks')}",
                "impact": "Medium - requires test prioritization",
                "mitigation": "Risk-based testing approach",
            },
        ]

    def _default_schedule(self, requirements: Dict[str, Any]) -> Dict[str, Any]:
        """Generate default test schedule."""
        start_date = date.today()

        return {
            "phases": [
                {
                    "name": "Test Preparation",
                    "description": "Test planning and setup",
                    "start_date": start_date.isoformat(),
                    "end_date": (start_date + timedelta(days=3)).isoformat(),
                    "duration": "3 days",
                    "deliverables": ["Test cases", "Environment setup"],
                    "resources": ["Test Lead", "Test Engineers"],
                },
                {
                    "name": "Test Execution",
                    "description": "Execute test cases",
                    "start_date": (start_date + timedelta(days=4)).isoformat(),
                    "end_date": (start_date + timedelta(days=14)).isoformat(),
                    "duration": "10 days",
                    "deliverables": ["Test results", "Defect reports"],
                    "resources": ["Test Engineers"],
                },
            ],
            "milestones": [
                {
                    "name": "Test Readiness",
                    "description": "Ready to begin testing",
                    "target_date": (start_date + timedelta(days=2)).isoformat(),
                    "criteria": ["Test cases approved", "Environment ready"],
                    "dependencies": ["Dev complete"],
                }
            ],
            "dependencies": ["Application build", "Test environment"],
            "critical_path": ["Environment setup", "Test execution"],
        }

    def _default_resources(self, requirements: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate default resources and roles."""
        return [
            {
                "role": "Test Manager",
                "responsibilities": ["Test planning", "Resource coordination"],
                "skills_required": ["Test management", "Risk assessment"],
                "allocation": "50%",
                "reporting_to": "Project Manager",
            },
            {
                "role": "Test Lead",
                "responsibilities": ["Test design", "Test execution"],
                "skills_required": ["Test design", "Domain knowledge"],
                "allocation": "100%",
                "reporting_to": "Test Manager",
            },
        ]

    def _default_environment(self, requirements: Dict[str, Any]) -> Dict[str, Any]:
        """Generate default test environment."""
        return {
            "environments": [
                {
                    "name": "Test Environment",
                    "purpose": "Primary testing",
                    "configuration": "Application with test database",
                    "availability": "Business hours",
                    "owner": "QA Team",
                }
            ],
            "hardware": [
                {
                    "component": "Application Server",
                    "specifications": "4 CPU, 8GB RAM",
                    "quantity": 1,
                    "purpose": "Application hosting",
                }
            ],
            "software": [
                {
                    "software": "Test Management Tool",
                    "version": "Latest",
                    "purpose": "Test case management",
                    "license": "Team license",
                }
            ],
            "network_requirements": ["Stable internet", "VPN access"],
            "test_data": [
                {
                    "data_type": "User accounts",
                    "description": "Test users with various roles",
                    "source": "Generated",
                    "volume": "50 accounts",
                    "refresh_frequency": "Weekly",
                }
            ],
            "access_requirements": ["Test credentials", "Database access"],
        }

    def _default_criteria(self, requirements: Dict[str, Any]) -> Dict[str, Any]:
        """Generate default entry/exit criteria."""
        return {
            "entry": [
                {
                    "criterion": "Build ready",
                    "description": "Stable build deployed",
                    "measurable": True,
                    "owner": "Dev Team",
                },
                {
                    "criterion": "Test cases approved",
                    "description": "All test cases reviewed",
                    "measurable": True,
                    "owner": "Test Lead",
                },
            ],
            "exit": [
                {
                    "criterion": "Test execution complete",
                    "description": "95% tests executed",
                    "measurable": True,
                    "owner": "Test Team",
                },
                {
                    "criterion": "Critical defects resolved",
                    "description": "Zero open critical defects",
                    "measurable": True,
                    "owner": "Dev Team",
                },
            ],
            "suspension": [],
            "resumption": [],
        }

    def _default_risks(self, requirements: Dict[str, Any]) -> Dict[str, Any]:
        """Generate default risk management."""
        risks = [
            {
                "id": "RISK-001",
                "category": "Schedule",
                "description": "Testing timeline compressed",
                "probability": "Medium",
                "impact": "Medium",
                "risk_level": "Medium",
                "owner": "Test Manager",
                "mitigation": "Risk-based testing prioritization",
                "contingency": "Extended testing phase",
                "status": "Open",
            }
        ]

        return {
            "risks": risks,
            "mitigation": [
                {
                    "risk_id": "RISK-001",
                    "strategy": "Prioritize critical test cases",
                    "actions": ["Risk assessment", "Test prioritization"],
                    "timeline": "Ongoing",
                    "owner": "Test Manager",
                }
            ],
            "contingency_plans": [
                {
                    "trigger": "Critical failure",
                    "actions": ["Escalate", "Activate backup"],
                    "timeline": "Immediate",
                    "resources": ["Emergency team"],
                    "owner": "Test Manager",
                }
            ],
            "risk_matrix": {
                "high": 0,
                "medium": 1,
                "low": 0,
                "total_risks": 1,
            },
        }

    def _default_reporting(self, requirements: Dict[str, Any]) -> Dict[str, Any]:
        """Generate default deliverables and reporting."""
        return {
            "deliverables": [
                {
                    "name": "Test Plan Document",
                    "description": "Comprehensive test plan",
                    "format": "PDF",
                    "frequency": "One-time",
                    "audience": ["Stakeholders"],
                    "owner": "Test Manager",
                    "template": "Standard template",
                },
                {
                    "name": "Test Execution Report",
                    "description": "Daily test status",
                    "format": "Dashboard",
                    "frequency": "Daily",
                    "audience": ["Project Team"],
                    "owner": "Test Engineer",
                    "template": "Execution template",
                },
            ],
            "reporting_structure": {
                "daily_reports": ["Execution status", "Defect summary"],
                "weekly_reports": ["Progress summary", "Metrics"],
                "milestone_reports": ["Milestone achievement"],
                "escalation_path": ["Lead", "Manager", "Director"],
            },
            "communication_plan": {
                "stakeholders": [
                    {
                        "name": "Project Manager",
                        "role": "Coordination",
                        "involvement": "High",
                        "communication": ["Weekly reports"],
                    }
                ],
                "meetings": [
                    {
                        "type": "Daily standup",
                        "frequency": "Daily",
                        "participants": ["Test Team"],
                        "agenda": ["Status", "Blockers"],
                    }
                ],
                "notifications": [
                    {
                        "trigger": "Critical defect",
                        "recipients": ["Test Manager"],
                        "method": "Email",
                        "template": "Defect notification",
                    }
                ],
            },
            "metrics": [
                {
                    "metric": "Test Coverage",
                    "description": "Requirements coverage",
                    "target": "95%",
                    "measurement": "Test tool",
                    "frequency": "Weekly",
                }
            ],
        }

    def _default_approval(self, requirements: Dict[str, Any]) -> Dict[str, Any]:
        """Generate default approval and sign-off."""
        return {
            "approvers": [
                {
                    "role": "Test Manager",
                    "name": "TBD",
                    "responsibility": "Test plan approval",
                    "authority": "Test strategy",
                    "sign_off_level": "Level 1",
                },
                {
                    "role": "Project Manager",
                    "name": "TBD",
                    "responsibility": "Resource approval",
                    "authority": "Project scope",
                    "sign_off_level": "Level 2",
                },
            ],
            "sign_off_criteria": [
                "All sections complete",
                "Risk assessment approved",
                "Resources confirmed",
            ],
            "approval_process": [
                "Technical review",
                "Resource review",
                "Final approval",
            ],
            "escalation_matrix": ["Lead", "Manager", "Director"],
            "documents_required": ["Signed test plan", "Risk acceptance"],
        }

    def _default_test_suites(self, requirements: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate comprehensive default test suites (5 minimum for 100% confidence)."""
        features = requirements.get("features", ["Core functionality"])
        project_type = requirements.get("project_type", "web-app")

        suites = [
            {
                "name": "Functional Test Suite",
                "description": f"Core feature validation for {project_type}",
                "category": "Functional",
                "test_cases": [
                    {
                        "name": f"Verify {f} happy path" if isinstance(f, str) else f"Verify feature {i+1} happy path",
                        "description": f"Validate that {f} works correctly under normal conditions",
                        "steps": [
                            {"step_number": 1, "action": f"Navigate to {f}", "expected_result": "Page/feature loads successfully"},
                            {"step_number": 2, "action": "Execute primary workflow with valid data", "expected_result": "Workflow completes without errors"},
                            {"step_number": 3, "action": "Verify output/result", "expected_result": "Expected results displayed correctly"},
                        ],
                        "expected_result": f"{f} functions as specified in requirements",
                        "priority": "high",
                        "estimated_time": 15,
                    }
                    for i, f in enumerate(features[:5])
                ],
            },
            {
                "name": "Integration Test Suite",
                "description": "Validates data flow and communication between system components and external services",
                "category": "Integration",
                "test_cases": [
                    {
                        "name": "Verify end-to-end data flow between frontend and backend",
                        "description": "Test that data entered in the UI is correctly persisted in the database and retrievable",
                        "steps": [
                            {"step_number": 1, "action": "Submit data via the frontend form", "expected_result": "Submission succeeds with confirmation"},
                            {"step_number": 2, "action": "Query the backend API directly", "expected_result": "API returns the submitted data correctly"},
                            {"step_number": 3, "action": "Verify data in database", "expected_result": "Database record matches submitted values"},
                        ],
                        "expected_result": "Data integrity maintained across all layers",
                        "priority": "high",
                        "estimated_time": 20,
                    },
                    {
                        "name": "Verify API error handling for invalid input",
                        "description": "Test that API endpoints properly reject malformed requests with descriptive errors",
                        "steps": [
                            {"step_number": 1, "action": "Send malformed JSON to API endpoint", "expected_result": "HTTP 400 with descriptive error message"},
                            {"step_number": 2, "action": "Send request with missing required fields", "expected_result": "HTTP 422 with list of missing fields"},
                        ],
                        "expected_result": "API handles errors gracefully without crashing",
                        "priority": "high",
                        "estimated_time": 10,
                    },
                ],
            },
            {
                "name": "Security Test Suite",
                "description": "Validates authentication, authorization, input sanitization, and data protection controls",
                "category": "Security",
                "test_cases": [
                    {
                        "name": "Verify authentication required for protected endpoints",
                        "description": "Test that all protected resources reject unauthenticated access",
                        "steps": [
                            {"step_number": 1, "action": "Access protected resource without authentication", "expected_result": "HTTP 401 Unauthorized returned"},
                            {"step_number": 2, "action": "Access with expired token", "expected_result": "HTTP 401 with token expired message"},
                            {"step_number": 3, "action": "Access with valid token", "expected_result": "HTTP 200 with resource data"},
                        ],
                        "expected_result": "Authentication properly enforced on all protected routes",
                        "priority": "critical",
                        "estimated_time": 15,
                    },
                    {
                        "name": "Verify XSS prevention in user inputs",
                        "description": "Test that script injection attempts are sanitized and not rendered",
                        "steps": [
                            {"step_number": 1, "action": "Enter <script>alert('XSS')</script> in input fields", "expected_result": "Input is sanitized or escaped"},
                            {"step_number": 2, "action": "View the stored data on page", "expected_result": "Script tags are displayed as text, not executed"},
                        ],
                        "expected_result": "XSS attacks are prevented across all user-facing inputs",
                        "priority": "critical",
                        "estimated_time": 10,
                    },
                ],
            },
            {
                "name": "Performance Test Suite",
                "description": "Tests response times, load handling, and resource usage under various conditions",
                "category": "Performance",
                "test_cases": [
                    {
                        "name": "Verify page load time under 3 seconds",
                        "description": "Test that primary pages load within acceptable performance thresholds",
                        "steps": [
                            {"step_number": 1, "action": "Clear browser cache and navigate to main page", "expected_result": "Page begins loading"},
                            {"step_number": 2, "action": "Measure time to First Contentful Paint (FCP)", "expected_result": "FCP < 1.5 seconds"},
                            {"step_number": 3, "action": "Measure time to full page interactive", "expected_result": "Page fully interactive within 3 seconds"},
                        ],
                        "expected_result": "All primary pages meet performance SLAs",
                        "priority": "high",
                        "estimated_time": 20,
                    },
                ],
            },
            {
                "name": "Regression Test Suite",
                "description": "Validates that existing functionality remains intact after code changes and deployments",
                "category": "Regression",
                "test_cases": [
                    {
                        "name": "Verify core user workflow after deployment",
                        "description": "Smoke test the critical user journey to ensure nothing is broken post-deployment",
                        "steps": [
                            {"step_number": 1, "action": "Login with valid credentials", "expected_result": "Login succeeds and dashboard loads"},
                            {"step_number": 2, "action": "Navigate to primary feature", "expected_result": "Feature page loads correctly"},
                            {"step_number": 3, "action": "Execute a create/update operation", "expected_result": "Operation completes successfully"},
                            {"step_number": 4, "action": "Verify data persistence", "expected_result": "Data is saved and retrievable"},
                        ],
                        "expected_result": "Core user workflow functions identically to pre-deployment baseline",
                        "priority": "critical",
                        "estimated_time": 15,
                    },
                ],
            },
        ]

        return suites


def get_comprehensive_test_plan_service() -> ComprehensiveTestPlanService:
    """Get comprehensive test plan service instance."""
    from cognitest_common import get_ai_service
    from ..core.config import settings

    ai_service = get_ai_service(settings)
    return ComprehensiveTestPlanService(ai_service)
