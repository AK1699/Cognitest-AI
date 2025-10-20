from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any

from app.core.database import get_db
from app.agents.test_plan_generator import TestPlanGeneratorAgent

router = APIRouter()

@router.post("/generate")
async def generate_test_plan(
    requirements: str,
    project_id: str,
    source_documents: list[str] = None,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Generate a test plan using AI from requirements.
    """
    agent = TestPlanGeneratorAgent()

    project_context = {
        "project_id": project_id,
        "project_type": "web application",
        "tech_stack": ["Python", "JavaScript", "React"],
    }

    test_plan = await agent.execute(
        requirements=requirements,
        project_context=project_context,
        source_documents=source_documents or [],
    )

    return test_plan
