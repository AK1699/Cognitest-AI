from fastapi import APIRouter
from typing import Dict, Any, List
from app.automation.playwright.recorder import PlaywrightCodeGenerator, TestAction, ActionType

router = APIRouter()

@router.post("/playwright/generate")
async def generate_playwright_code(
    test_name: str,
    actions: List[Dict[str, Any]],
    language: str = "python"
) -> Dict[str, Any]:
    """
    Generate Playwright test code from recorded actions.
    """
    generator = PlaywrightCodeGenerator(test_name, language)

    for action_data in actions:
        action = TestAction(**action_data)
        generator.add_action(action)

    code = generator.generate_code()

    return {
        "test_name": test_name,
        "language": language,
        "code": code,
        "actions_count": len(actions)
    }

@router.get("/workflows")
async def list_workflows():
    """
    List all automation workflows.
    """
    return {"message": "Workflows endpoint - to be implemented"}
