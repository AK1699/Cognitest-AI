"""
Prompt Management Service for AI-based test generation.

This service loads, manages, and renders prompt templates using Jinja2.
Supports versioning, caching, and template validation.
"""

import logging
from pathlib import Path
from typing import Dict, Any, Optional
from jinja2 import Environment, FileSystemLoader, TemplateNotFound
import json

logger = logging.getLogger(__name__)


class PromptManager:
    """
    Manages AI prompts for test plan, test suite, and test case generation.

    Features:
    - Template loading with Jinja2
    - Variable substitution and validation
    - Prompt caching for performance
    - Version control support
    """

    def __init__(self, templates_dir: Optional[str] = None):
        """
        Initialize PromptManager with template directory.

        Args:
            templates_dir: Path to templates directory. If None, uses default.
        """
        if templates_dir is None:
            # Default to app/prompts/templates
            base_dir = Path(__file__).parent
            templates_dir = str(base_dir / "templates")

        self.templates_dir = templates_dir

        # Initialize Jinja2 environment
        self.env = Environment(
            loader=FileSystemLoader(self.templates_dir),
            trim_blocks=True,
            lstrip_blocks=True,
            keep_trailing_newline=True,
        )

        # Cache for rendered prompts (optional performance optimization)
        self._cache: Dict[str, str] = {}

        logger.info(f"PromptManager initialized with templates from: {self.templates_dir}")

    def load_test_plan_prompt(self, variables: Dict[str, Any]) -> str:
        """
        Load and render test plan generation prompt.

        Args:
            variables: Dictionary containing:
                - projectType: Type of project (web-app, mobile-app, etc.)
                - description: Project description
                - platforms: List of target platforms
                - features: List of key features
                - priority: Priority level (low, medium, high, critical)
                - complexity: Complexity level (low, medium, high)
                - timeframe: Expected timeframe

        Returns:
            Rendered prompt string ready for AI consumption
        """
        return self._render_template("test_plan_generation.j2", variables)

    def load_test_suite_prompt(self, variables: Dict[str, Any]) -> str:
        """
        Load and render test suite generation prompt.

        Args:
            variables: Dictionary containing:
                - testPlanName: Name of the test plan
                - description: Test plan description
                - projectType: Type of project
                - platforms: Platforms (comma-separated string or list)
                - features: Features (comma-separated string or list)
                - objectives: Objectives (comma-separated string or list)
                - scope: JSON string of scope
                - priority: Priority level
                - testCategories: Test categories (comma-separated string or list)

        Returns:
            Rendered prompt string
        """
        # Normalize list/string inputs
        normalized = self._normalize_variables(variables)
        return self._render_template("test_suite_generation.j2", normalized)

    def load_test_case_prompt(self, variables: Dict[str, Any]) -> str:
        """
        Load and render test case generation prompt.

        Args:
            variables: Dictionary containing:
                - feature: Feature name
                - description: Feature description
                - userStory: User story (optional)
                - acceptanceCriteria: Acceptance criteria (optional)
                - testType: Type of test (functional, security, performance, etc.)
                - priority: Priority level
                - complexity: Complexity level
                - platform: Target platform(s)
                - numberOfTestCases: Number of test cases to generate
                - projectType: Type of project (optional)

        Returns:
            Rendered prompt string
        """
        # Normalize list/string inputs
        normalized = self._normalize_variables(variables)

        # Provide defaults for optional fields
        normalized.setdefault('userStory', 'Not provided')
        normalized.setdefault('acceptanceCriteria', 'Not provided')
        normalized.setdefault('projectType', 'Not specified')
        normalized.setdefault('numberOfTestCases', 5)

        return self._render_template("test_case_generation.j2", normalized)

    def _render_template(self, template_name: str, variables: Dict[str, Any]) -> str:
        """
        Render a Jinja2 template with given variables.

        Args:
            template_name: Name of the template file
            variables: Dictionary of variables to substitute

        Returns:
            Rendered template string

        Raises:
            TemplateNotFound: If template file doesn't exist
            Exception: For template rendering errors
        """
        try:
            template = self.env.get_template(template_name)
            rendered = template.render(**variables)

            logger.debug(f"Successfully rendered template: {template_name}")
            logger.debug(f"  Variables provided: {list(variables.keys())}")
            logger.debug(f"  Rendered length: {len(rendered)} characters")

            return rendered

        except TemplateNotFound:
            logger.error(f"Template not found: {template_name} in {self.templates_dir}")
            raise
        except Exception as e:
            logger.error(f"Error rendering template {template_name}: {e}")
            logger.error(f"  Variables: {variables}")
            raise

    def _normalize_variables(self, variables: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize variable types for template rendering.

        Converts lists to comma-separated strings if needed,
        handles None values, and ensures proper formatting.

        Args:
            variables: Raw variables dictionary

        Returns:
            Normalized variables dictionary
        """
        normalized = variables.copy()

        # Fields that should be comma-separated strings
        list_fields = ['platforms', 'features', 'objectives', 'testCategories', 'platform']

        for field in list_fields:
            if field in normalized:
                value = normalized[field]
                if isinstance(value, list):
                    normalized[field] = ', '.join(str(v) for v in value)
                elif value is None:
                    normalized[field] = 'N/A'

        # Handle acceptance criteria specially (can be list of strings)
        if 'acceptanceCriteria' in normalized:
            criteria = normalized['acceptanceCriteria']
            if isinstance(criteria, list):
                normalized['acceptanceCriteria'] = '; '.join(criteria)
            elif criteria is None:
                normalized['acceptanceCriteria'] = 'Not provided'

        # Handle scope as JSON string if it's a dict
        if 'scope' in normalized:
            scope = normalized['scope']
            if isinstance(scope, dict):
                normalized['scope'] = json.dumps(scope, indent=2)

        return normalized

    def validate_prompt_variables(
        self,
        prompt_type: str,
        variables: Dict[str, Any]
    ) -> tuple[bool, list[str]]:
        """
        Validate that all required variables are present for a prompt type.

        Args:
            prompt_type: Type of prompt ('test_plan', 'test_suite', 'test_case')
            variables: Variables to validate

        Returns:
            Tuple of (is_valid, missing_fields)
        """
        required_fields = {
            'test_plan': [
                'projectType', 'description', 'platforms', 'features',
                'priority', 'complexity', 'timeframe'
            ],
            'test_suite': [
                'testPlanName', 'description', 'projectType', 'platforms',
                'features', 'objectives', 'scope', 'priority', 'testCategories'
            ],
            'test_case': [
                'feature', 'description', 'testType', 'priority',
                'complexity', 'platform'
            ],
        }

        if prompt_type not in required_fields:
            return False, [f"Unknown prompt type: {prompt_type}"]

        missing = []
        for field in required_fields[prompt_type]:
            if field not in variables or variables[field] is None:
                missing.append(field)

        is_valid = len(missing) == 0
        return is_valid, missing

    def get_template_info(self, template_name: str) -> Dict[str, Any]:
        """
        Get metadata about a template.

        Args:
            template_name: Name of the template file

        Returns:
            Dictionary with template metadata
        """
        template_path = Path(self.templates_dir) / template_name

        if not template_path.exists():
            return {
                "exists": False,
                "path": str(template_path),
            }

        return {
            "exists": True,
            "path": str(template_path),
            "size_bytes": template_path.stat().st_size,
            "modified": template_path.stat().st_mtime,
        }

    def list_available_templates(self) -> list[str]:
        """
        List all available prompt templates.

        Returns:
            List of template file names
        """
        templates_path = Path(self.templates_dir)
        if not templates_path.exists():
            return []

        templates = [
            f.name for f in templates_path.glob("*.j2")
        ]

        return sorted(templates)


# Singleton instance
_prompt_manager_instance: Optional[PromptManager] = None


def get_prompt_manager() -> PromptManager:
    """
    Get singleton PromptManager instance.

    Returns:
        PromptManager instance
    """
    global _prompt_manager_instance

    if _prompt_manager_instance is None:
        _prompt_manager_instance = PromptManager()

    return _prompt_manager_instance
