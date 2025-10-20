"""
Playwright Test Recorder - Generates test scripts from user actions.
This module provides a visual UI builder that generates Playwright test code.
"""

from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict
import json
from enum import Enum

class ActionType(str, Enum):
    """Types of actions that can be recorded"""
    NAVIGATE = "navigate"
    CLICK = "click"
    TYPE = "type"
    SELECT = "select"
    HOVER = "hover"
    WAIT = "wait"
    ASSERT_TEXT = "assert_text"
    ASSERT_VISIBLE = "assert_visible"
    SCREENSHOT = "screenshot"
    SCROLL = "scroll"

@dataclass
class TestAction:
    """Represents a single test action"""
    type: ActionType
    selector: Optional[str] = None
    value: Optional[str] = None
    description: Optional[str] = None
    wait_time: Optional[int] = None
    options: Dict[str, Any] = None

    def __post_init__(self):
        if self.options is None:
            self.options = {}

class PlaywrightCodeGenerator:
    """
    Generates Playwright test code from recorded actions.
    """

    def __init__(self, test_name: str, language: str = "python"):
        self.test_name = test_name
        self.language = language
        self.actions: List[TestAction] = []

    def add_action(self, action: TestAction):
        """Add an action to the test sequence"""
        self.actions.append(action)

    def generate_code(self) -> str:
        """Generate Playwright test code from recorded actions"""
        if self.language == "python":
            return self._generate_python_code()
        elif self.language == "javascript":
            return self._generate_javascript_code()
        else:
            raise ValueError(f"Unsupported language: {self.language}")

    def _generate_python_code(self) -> str:
        """Generate Python Playwright code"""
        code_lines = [
            "from playwright.sync_api import Page, expect",
            "",
            f"def test_{self.test_name}(page: Page):",
        ]

        for action in self.actions:
            code_lines.extend(self._action_to_python(action))

        return "\n".join(code_lines)

    def _action_to_python(self, action: TestAction) -> List[str]:
        """Convert a single action to Python code lines"""
        indent = "    "
        lines = []

        if action.description:
            lines.append(f'{indent}# {action.description}')

        if action.type == ActionType.NAVIGATE:
            lines.append(f'{indent}page.goto("{action.value}")')

        elif action.type == ActionType.CLICK:
            lines.append(f'{indent}page.click("{action.selector}")')

        elif action.type == ActionType.TYPE:
            lines.append(f'{indent}page.fill("{action.selector}", "{action.value}")')

        elif action.type == ActionType.SELECT:
            lines.append(f'{indent}page.select_option("{action.selector}", "{action.value}")')

        elif action.type == ActionType.HOVER:
            lines.append(f'{indent}page.hover("{action.selector}")')

        elif action.type == ActionType.WAIT:
            if action.wait_time:
                lines.append(f'{indent}page.wait_for_timeout({action.wait_time})')
            elif action.selector:
                lines.append(f'{indent}page.wait_for_selector("{action.selector}")')

        elif action.type == ActionType.ASSERT_TEXT:
            lines.append(f'{indent}expect(page.locator("{action.selector}")).to_contain_text("{action.value}")')

        elif action.type == ActionType.ASSERT_VISIBLE:
            lines.append(f'{indent}expect(page.locator("{action.selector}")).to_be_visible()')

        elif action.type == ActionType.SCREENSHOT:
            filename = action.value or f"{self.test_name}_screenshot.png"
            lines.append(f'{indent}page.screenshot(path="{filename}")')

        elif action.type == ActionType.SCROLL:
            lines.append(f'{indent}page.evaluate("window.scrollTo(0, document.body.scrollHeight)")')

        lines.append("")  # Add blank line after each action
        return lines

    def _generate_javascript_code(self) -> str:
        """Generate JavaScript/TypeScript Playwright code"""
        code_lines = [
            "import { test, expect } from '@playwright/test';",
            "",
            f"test('{self.test_name}', async ({{ page }}) => {{",
        ]

        for action in self.actions:
            code_lines.extend(self._action_to_javascript(action))

        code_lines.append("});")
        return "\n".join(code_lines)

    def _action_to_javascript(self, action: TestAction) -> List[str]:
        """Convert a single action to JavaScript code lines"""
        indent = "  "
        lines = []

        if action.description:
            lines.append(f'{indent}// {action.description}')

        if action.type == ActionType.NAVIGATE:
            lines.append(f'{indent}await page.goto("{action.value}");')

        elif action.type == ActionType.CLICK:
            lines.append(f'{indent}await page.click("{action.selector}");')

        elif action.type == ActionType.TYPE:
            lines.append(f'{indent}await page.fill("{action.selector}", "{action.value}");')

        elif action.type == ActionType.SELECT:
            lines.append(f'{indent}await page.selectOption("{action.selector}", "{action.value}");')

        elif action.type == ActionType.HOVER:
            lines.append(f'{indent}await page.hover("{action.selector}");')

        elif action.type == ActionType.WAIT:
            if action.wait_time:
                lines.append(f'{indent}await page.waitForTimeout({action.wait_time});')
            elif action.selector:
                lines.append(f'{indent}await page.waitForSelector("{action.selector}");')

        elif action.type == ActionType.ASSERT_TEXT:
            lines.append(f'{indent}await expect(page.locator("{action.selector}")).toContainText("{action.value}");')

        elif action.type == ActionType.ASSERT_VISIBLE:
            lines.append(f'{indent}await expect(page.locator("{action.selector}")).toBeVisible();')

        elif action.type == ActionType.SCREENSHOT:
            filename = action.value or f"{self.test_name}_screenshot.png"
            lines.append(f'{indent}await page.screenshot({{ path: "{filename}" }});')

        elif action.type == ActionType.SCROLL:
            lines.append(f'{indent}await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));')

        lines.append("")
        return lines

    def to_json(self) -> str:
        """Export test actions as JSON"""
        return json.dumps([asdict(action) for action in self.actions], indent=2)

    @classmethod
    def from_json(cls, test_name: str, json_data: str, language: str = "python"):
        """Import test actions from JSON"""
        generator = cls(test_name, language)
        actions_data = json.loads(json_data)

        for action_data in actions_data:
            action = TestAction(**action_data)
            generator.add_action(action)

        return generator

# Example usage
if __name__ == "__main__":
    # Create a test recorder
    generator = PlaywrightCodeGenerator("login_flow", language="python")

    # Record actions
    generator.add_action(TestAction(
        type=ActionType.NAVIGATE,
        value="https://example.com/login",
        description="Navigate to login page"
    ))

    generator.add_action(TestAction(
        type=ActionType.TYPE,
        selector="input[name='email']",
        value="user@example.com",
        description="Enter email"
    ))

    generator.add_action(TestAction(
        type=ActionType.TYPE,
        selector="input[name='password']",
        value="password123",
        description="Enter password"
    ))

    generator.add_action(TestAction(
        type=ActionType.CLICK,
        selector="button[type='submit']",
        description="Click login button"
    ))

    generator.add_action(TestAction(
        type=ActionType.ASSERT_VISIBLE,
        selector=".dashboard",
        description="Verify dashboard is visible"
    ))

    # Generate code
    print(generator.generate_code())
    print("\n" + "="*50 + "\n")
    print(generator.to_json())
