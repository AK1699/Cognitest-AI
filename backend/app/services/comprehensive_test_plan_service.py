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

from app.models.test_plan import TestPlan, GenerationType
from app.models.test_suite import TestSuite
from app.models.test_case import TestCase, TestCasePriority, TestCaseStatus
from app.services.ai_service import AIService

logger = logging.getLogger(__name__)


class ComprehensiveTestPlanService:
    """
    Comprehensive test plan generation service following IEEE 829 standard.
    Generates detailed test plans with 11+ industry-standard sections.
    """

    def __init__(self, ai_service: AIService):
        self.ai_service = ai_service

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

            # Generate using AI
            logger.info("Calling AI service to generate test plan...")
            response = await self.ai_service.generate_completion(
                messages=[
                    {
                        "role": "system",
                        "content": self._get_ieee_system_prompt(),
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.7,
                max_tokens=10000,  # Balanced to avoid timeout while allowing good responses
                json_mode=True,  # Force JSON response, eliminates markdown wrapping
            )

            logger.info(f"AI response received: {len(response)} characters")

            # Parse AI response
            test_plan_data = self._parse_comprehensive_response(response, requirements)

            logger.info(f"✅ AI-generated test plan successfully! Confidence: HIGH")
            return {
                "status": "success",
                "data": test_plan_data,
                "confidence": "high",
            }

        except Exception as e:
            logger.error(f"❌ Error generating comprehensive test plan with AI: {e}")
            logger.error(f"Error type: {type(e).__name__}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")

            # Fallback to rule-based generation
            logger.warning("⚠️  Falling back to rule-based generation")
            fallback_data = self._generate_fallback_test_plan(requirements)
            return {
                "status": "success",
                "data": fallback_data,
                "confidence": "medium",
                "note": "Generated using fallback mechanism due to AI error",
            }

    def _get_ieee_system_prompt(self) -> str:
        """Get system prompt for IEEE 829 standard test plan generation."""
        return """You are a senior QA manager and test strategist with 15+ years of experience creating comprehensive, industry-standard test plans.

Generate a complete test plan following IEEE 829 and industry best practices.

Your test plans should be:
1. Comprehensive and detailed
2. Following IEEE 829 standard structure
3. Industry best practices compliant
4. Actionable and realistic
5. Risk-aware and quality-focused

Format your response as valid JSON only, no additional text or markdown."""

    def _build_comprehensive_prompt(self, requirements: Dict[str, Any]) -> str:
        """Build comprehensive prompt for test plan generation."""
        project_type = requirements.get("project_type", "web-app")
        description = requirements.get("description", "")
        features = requirements.get("features", [])
        platforms = requirements.get("platforms", ["web"])
        priority = requirements.get("priority", "medium")
        complexity = requirements.get("complexity", "medium")
        timeframe = requirements.get("timeframe", "2-4 weeks")

        prompt = f"""
Generate a comprehensive test plan following IEEE 829 standard.

**Project Details:**
- Type: {project_type}
- Description: {description}
- Target Platforms: {", ".join(platforms)}
- Key Features: {", ".join(features)}
- Priority Level: {priority}
- Complexity: {complexity}
- Timeframe: {timeframe}

**Generate a comprehensive test plan with ALL industry-standard sections:**

1. **Test Objectives** (2-4 objectives):
   - Clear, measurable objectives with success criteria
   - Quality goals and specific outcomes
   - Risk mitigation targets

2. **Scope of Testing**:
   - What WILL be tested (in-scope)
   - What will NOT be tested (out-of-scope)
   - Features, systems, environments covered
   - Types of testing to be performed

3. **Test Approach/Strategy**:
   - Testing methodology (Agile, Waterfall, V-Model)
   - Types of testing (functional, non-functional, exploratory)
   - Test techniques and methods
   - Automation vs manual approach
   - Tools and frameworks

4. **Assumptions and Constraints**:
   - Testing assumptions
   - Resource constraints and limitations
   - Technology or timeline constraints
   - Risk factors and dependencies

5. **Test Schedule and Milestones**:
   - Testing phases with dates and durations
   - Key milestones and deliverables
   - Dependencies and critical path

6. **Resources and Roles**:
   - Team roles and responsibilities
   - Skills required for each role
   - Resource allocation

7. **Test Environment**:
   - Hardware and software requirements
   - Network configurations
   - Test data specifications
   - Access requirements

8. **Entry and Exit Criteria**:
   - Conditions to start testing
   - Conditions to complete testing
   - Quality gates and checkpoints

9. **Risk Management**:
   - Detailed risk analysis
   - Mitigation strategies
   - Contingency plans

10. **Deliverables and Reporting**:
    - Test artifacts and documentation
    - Reporting structure
    - Communication plan
    - Quality metrics

11. **Approval/Sign-off**:
    - Approval process
    - Key approvers
    - Sign-off criteria

12. **Test Suites with Test Cases**:
    - At least 5-7 comprehensive test suites
    - Each suite with 3-10 detailed test cases
    - Cover functional, integration, security, performance, UI/UX

**Response Format (JSON only):**
{{
  "name": "string",
  "description": "string",
  "priority": "{priority}",
  "estimated_hours": number,
  "complexity": "{complexity}",
  "timeframe": "{timeframe}",
  "project_type": "{project_type}",
  "platforms": {json.dumps(platforms)},
  "features": {json.dumps(features)},
  "tags": ["tag1", "tag2"],

  "test_objectives": [
    {{
      "id": "OBJ-001",
      "objective": "Main objective",
      "description": "Detailed description",
      "success_criteria": ["criteria1", "criteria2"],
      "quality_goals": ["goal1", "goal2"]
    }}
  ],

  "scope_of_testing": {{
    "in_scope": ["items in scope"],
    "out_of_scope": ["items out of scope"],
    "features": {json.dumps(features)},
    "systems": ["systems involved"],
    "environments": ["test environments"],
    "test_types": ["testing types"]
  }},

  "test_approach": {{
    "methodology": "Agile|Waterfall|V-Model",
    "testing_types": [
      {{
        "type": "Functional Testing",
        "description": "Description",
        "coverage": "80%",
        "priority": "High"
      }}
    ],
    "test_techniques": ["technique1"],
    "automation_approach": "Approach description",
    "tools_and_frameworks": ["tool1", "tool2"]
  }},

  "assumptions_and_constraints": [
    {{
      "type": "assumption|constraint",
      "description": "Description",
      "impact": "Impact description",
      "mitigation": "Mitigation strategy"
    }}
  ],

  "test_schedule": {{
    "phases": [
      {{
        "name": "Phase name",
        "description": "Description",
        "start_date": "YYYY-MM-DD",
        "end_date": "YYYY-MM-DD",
        "duration": "X weeks",
        "deliverables": ["deliverable1"],
        "resources": ["resource1"]
      }}
    ],
    "milestones": [
      {{
        "name": "Milestone name",
        "description": "Description",
        "target_date": "YYYY-MM-DD",
        "criteria": ["criteria1"],
        "dependencies": ["dependency1"]
      }}
    ],
    "dependencies": ["dependency1"],
    "critical_path": ["activity1"]
  }},

  "resources_and_roles": [
    {{
      "role": "Test Manager",
      "responsibilities": ["resp1"],
      "skills_required": ["skill1"],
      "allocation": "100%",
      "reporting_to": "Project Manager"
    }}
  ],

  "test_environment": {{
    "environments": [
      {{
        "name": "Test Environment",
        "purpose": "Purpose",
        "configuration": "Config details",
        "availability": "24/7",
        "owner": "QA Team"
      }}
    ],
    "hardware": [
      {{
        "component": "Server",
        "specifications": "Specs",
        "quantity": 1,
        "purpose": "Purpose"
      }}
    ],
    "software": [
      {{
        "software": "Software name",
        "version": "1.0",
        "purpose": "Purpose",
        "license": "License type"
      }}
    ],
    "network_requirements": ["requirement1"],
    "test_data": [
      {{
        "data_type": "User data",
        "description": "Description",
        "source": "Source",
        "volume": "Volume",
        "refresh_frequency": "Daily"
      }}
    ],
    "access_requirements": ["requirement1"]
  }},

  "entry_exit_criteria": {{
    "entry": [
      {{
        "criterion": "Criterion name",
        "description": "Description",
        "measurable": true,
        "owner": "Owner"
      }}
    ],
    "exit": [
      {{
        "criterion": "Exit criterion",
        "description": "Description",
        "measurable": true,
        "owner": "Owner"
      }}
    ],
    "suspension": [],
    "resumption": []
  }},

  "risk_management": {{
    "risks": [
      {{
        "id": "RISK-001",
        "category": "Technical",
        "description": "Risk description",
        "probability": "High|Medium|Low",
        "impact": "Critical|High|Medium|Low",
        "risk_level": "High|Medium|Low",
        "owner": "Owner",
        "mitigation": "Mitigation strategy",
        "contingency": "Contingency plan",
        "status": "Open|Mitigated|Closed"
      }}
    ],
    "mitigation": [
      {{
        "risk_id": "RISK-001",
        "strategy": "Strategy",
        "actions": ["action1"],
        "timeline": "Timeline",
        "owner": "Owner"
      }}
    ],
    "contingency_plans": [
      {{
        "trigger": "Trigger condition",
        "actions": ["action1"],
        "timeline": "Timeline",
        "resources": ["resource1"],
        "owner": "Owner"
      }}
    ],
    "risk_matrix": {{
      "high": 0,
      "medium": 0,
      "low": 0,
      "total_risks": 0
    }}
  }},

  "deliverables_and_reporting": {{
    "deliverables": [
      {{
        "name": "Test Plan",
        "description": "Description",
        "format": "PDF",
        "frequency": "One-time",
        "audience": ["Team"],
        "owner": "Test Manager",
        "template": "Template name"
      }}
    ],
    "reporting_structure": {{
      "daily_reports": ["Status"],
      "weekly_reports": ["Summary"],
      "milestone_reports": ["Report"],
      "escalation_path": ["Lead", "Manager"]
    }},
    "communication_plan": {{
      "stakeholders": [
        {{
          "name": "Stakeholder",
          "role": "Role",
          "involvement": "High|Medium|Low",
          "communication": ["Email"]
        }}
      ],
      "meetings": [
        {{
          "type": "Daily standup",
          "frequency": "Daily",
          "participants": ["Team"],
          "agenda": ["Status"]
        }}
      ],
      "notifications": [
        {{
          "trigger": "Trigger",
          "recipients": ["Team"],
          "method": "Email",
          "template": "Template"
        }}
      ]
    }},
    "metrics": [
      {{
        "metric": "Test Coverage",
        "description": "Description",
        "target": "95%",
        "measurement": "Tool",
        "frequency": "Daily"
      }}
    ]
  }},

  "approval_signoff": {{
    "approvers": [
      {{
        "role": "QA Manager",
        "name": "TBD",
        "responsibility": "Test plan approval",
        "authority": "Full authority",
        "sign_off_level": "Level 1"
      }}
    ],
    "sign_off_criteria": ["criteria1"],
    "approval_process": ["Review", "Approve"],
    "escalation_matrix": ["Lead", "Manager"],
    "documents_required": ["Test plan"]
  }},

  "test_suites": [
    {{
      "name": "Functional Test Suite",
      "description": "Description",
      "category": "functional",
      "test_cases": [
        {{
          "name": "Test case name",
          "description": "Description",
          "steps": [
            {{
              "step_number": 1,
              "action": "Action",
              "expected_result": "Result"
            }}
          ],
          "expected_result": "Overall result",
          "priority": "high|medium|low|critical",
          "estimated_time": 15
        }}
      ]
    }}
  ]
}}

**Important:**
- Return ONLY valid JSON, no markdown or additional text
- Generate at least 5-7 test suites
- Each test suite should have 3-10 test cases
- Test cases should have 3-8 specific steps
- Base on project type {project_type} and features {", ".join(features)}
"""
        return prompt

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

            # Ensure all required fields with fallbacks
            result = {
                "name": parsed.get("name", f"{requirements.get('project_type', 'Test')} Plan"),
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
            return self._generate_fallback_test_plan(requirements)
        except Exception as e:
            logger.error(f"Error parsing AI response: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return self._generate_fallback_test_plan(requirements)

    def _generate_fallback_test_plan(self, requirements: Dict[str, Any]) -> Dict[str, Any]:
        """Generate fallback test plan using rule-based approach."""
        logger.info("Using fallback test plan generation")

        return {
            "name": f"{requirements.get('project_type', 'Test').title()} Plan",
            "description": requirements.get("description", "Comprehensive test plan"),
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
        """Generate default test suites."""
        features = requirements.get("features", ["Core functionality"])

        return [
            {
                "name": "Functional Test Suite",
                "description": "Core feature validation",
                "category": "functional",
                "test_cases": [
                    {
                        "name": f"Verify {features[0] if features else 'feature'} functionality",
                        "description": "Test core functionality",
                        "steps": [
                            {
                                "step_number": 1,
                                "action": "Navigate to feature",
                                "expected_result": "Feature loads successfully",
                            },
                            {
                                "step_number": 2,
                                "action": "Execute main function",
                                "expected_result": "Function works correctly",
                            },
                        ],
                        "expected_result": "Feature works as expected",
                        "priority": "high",
                        "estimated_time": 30,
                    }
                ],
            }
        ]


def get_comprehensive_test_plan_service() -> ComprehensiveTestPlanService:
    """Get comprehensive test plan service instance."""
    from app.services.ai_service import get_ai_service

    ai_service = get_ai_service()
    return ComprehensiveTestPlanService(ai_service)
