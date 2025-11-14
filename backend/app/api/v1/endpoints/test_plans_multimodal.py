"""
Enhanced Test Plan Generation API with Multimodal Input Support
Accepts text + images and uses organization memory for AI suggestions
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Dict, Any
import uuid
import logging
import json

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.organisation_memory import (
    TestPlanMultimodalResponse,
    AISuggestionsResponse,
)
from app.services.organisation_memory_service import get_organisation_memory_service
from app.services.test_plan_service import TestPlanService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/test-plans-multimodal", tags=["test-plans-multimodal"])


@router.post("/generate", response_model=TestPlanMultimodalResponse, status_code=status.HTTP_201_CREATED)
async def generate_test_plan_with_multimodal_input(
    # Form fields
    organisation_id: str = Form(...),
    project_id: str = Form(...),
    description: str = Form(...),
    use_org_memory: bool = Form(default=True),

    # Optional fields
    project_type: Optional[str] = Form(None),
    features: Optional[str] = Form(None),  # JSON string
    platforms: Optional[str] = Form(None),  # JSON string
    priority: str = Form(default="medium"),
    complexity: str = Form(default="medium"),

    # Images
    images: Optional[List[UploadFile]] = File(None),

    # Dependencies
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TestPlanMultimodalResponse:
    """
    Generate test plan with multimodal input (text + images)

    This endpoint:
    1. Accepts text description + optional screenshots
    2. Stores input in organization memory
    3. Analyzes images with Vision AI
    4. Gets AI suggestions from organization memory
    5. Generates comprehensive test plan

    Features:
    - Copy/paste screenshots directly
    - AI learns from all inputs across organization
    - Self-evolving suggestions based on history
    - Comprehensive IEEE 829 test plans

    Args:
        organisation_id: Organisation UUID
        project_id: Project UUID
        description: Text description from user
        use_org_memory: Whether to use org memory for suggestions
        project_type: Type of project
        features: JSON string of features
        platforms: JSON string of platforms
        priority: Priority level
        complexity: Complexity level
        images: List of uploaded/pasted images
        current_user: Current user
        db: Database session

    Returns:
        Test plan generation response
    """
    try:
        # Parse UUIDs
        org_uuid = uuid.UUID(organisation_id)
        proj_uuid = uuid.UUID(project_id)

        # Parse JSON strings
        features_list = json.loads(features) if features else []
        platforms_list = json.loads(platforms) if platforms else []

        # Get memory service
        memory_service = await get_organisation_memory_service(db)

        # Step 1: Store memory with images
        logger.info(
            f"Storing memory for org {organisation_id}, project {project_id} "
            f"with {len(images) if images else 0} images"
        )

        memory_result = await memory_service.store_memory(
            organisation_id=org_uuid,
            user_description=description,
            image_files=images,
            project_id=proj_uuid,
            user_id=current_user.id,
            source="test_plan_generator",
            tags=["test-plan", project_type] if project_type else ["test-plan"],
        )

        memory_id = memory_result["memory_id"]
        image_analysis = memory_result["analysis"]

        # Step 2: Get AI suggestions if enabled
        suggestions = None
        if use_org_memory:
            logger.info(f"Getting AI suggestions from organization memory")
            suggestions_result = await memory_service.get_ai_suggestions(
                organisation_id=org_uuid,
                user_input=description,
                project_id=proj_uuid,
            )

            if suggestions_result.get("has_suggestions"):
                suggestions = AISuggestionsResponse(**suggestions_result)

        # Step 3: Build enhanced context for test plan generation
        enhanced_description = description

        # Add image analysis to context
        if image_analysis.get("extracted_features"):
            enhanced_description += "\n\n[Extracted Features from Images]:\n"
            for feature in image_analysis["extracted_features"]:
                enhanced_description += f"- {feature}\n"

        if image_analysis.get("ui_elements"):
            enhanced_description += "\n\n[UI Elements Identified]:\n"
            for element in image_analysis["ui_elements"][:10]:
                enhanced_description += f"- {element}\n"

        if image_analysis.get("workflows"):
            enhanced_description += "\n\n[User Workflows]:\n"
            for workflow in image_analysis["workflows"]:
                enhanced_description += f"- {workflow}\n"

        # Add AI suggestions to context
        if suggestions and suggestions.suggested_features:
            enhanced_description += "\n\n[AI Suggestions from Organization History]:\n"
            enhanced_description += "Based on similar projects in your organization:\n"
            for feature in suggestions.suggested_features[:5]:
                enhanced_description += f"- {feature}\n"

        # Step 4: Generate test plan
        logger.info(f"Generating test plan with enhanced context")

        # Build generation request
        generation_request = {
            "project_id": str(proj_uuid),
            "description": enhanced_description,
            "project_type": project_type,
            "features": features_list,
            "platforms": platforms_list,
            "priority": priority,
            "complexity": complexity,
            "source_memory_id": memory_id,
            "created_by": str(current_user.id),
        }

        # Use test plan service to generate
        test_plan_service = TestPlanService(db)
        test_plan = await test_plan_service.generate_comprehensive_test_plan(generation_request)

        # Step 5: Link memory to generated test plan
        await memory_service.log_memory_usage(
            organisation_id=org_uuid,
            memory_id=uuid.UUID(memory_id),
            used_in_generation="test_plan",
            generation_id=uuid.UUID(test_plan["id"]) if test_plan else None,
            query_text=description,
            similarity_score=0.9,
        )

        logger.info(
            f"Generated test plan {test_plan.get('id')} for user {current_user.id} "
            f"with {len(images) if images else 0} images and org memory"
        )

        return TestPlanMultimodalResponse(
            status="success",
            memory_id=memory_id,
            test_plan_id=test_plan.get("id"),
            message=f"Test plan generated successfully using {len(images) if images else 0} screenshots and organization memory",
            images_processed=len(images) if images else 0,
            ai_suggestions_used=use_org_memory and suggestions is not None,
            suggestions=suggestions,
            test_plan=test_plan,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid input: {str(e)}",
        )
    except Exception as e:
        logger.error(f"Error generating test plan with multimodal input: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate test plan: {str(e)}",
        )


@router.post("/preview-suggestions")
async def preview_ai_suggestions(
    organisation_id: str = Form(...),
    project_id: Optional[str] = Form(None),
    description: str = Form(...),
    images: Optional[List[UploadFile]] = File(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Preview AI suggestions without generating test plan

    This endpoint shows what suggestions the AI can provide based on:
    1. Current text description
    2. Uploaded screenshots (if any)
    3. Organization memory

    Args:
        organisation_id: Organisation UUID
        project_id: Optional project UUID
        description: Text description
        images: Optional images
        current_user: Current user
        db: Database session

    Returns:
        AI suggestions preview
    """
    try:
        org_uuid = uuid.UUID(organisation_id)
        proj_uuid = uuid.UUID(project_id) if project_id else None

        # Get memory service
        memory_service = await get_organisation_memory_service(db)

        # If images provided, analyze them quickly
        image_insights = {"features": [], "ui_elements": [], "workflows": []}

        if images:
            from app.services.vision_ai_service import get_vision_ai_service
            import tempfile

            vision_service = await get_vision_ai_service()

            for image in images[:3]:  # Limit to first 3 images for preview
                # Save temp file
                with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp:
                    content = await image.read()
                    tmp.write(content)
                    tmp_path = tmp.name

                # Quick analysis
                analysis = await vision_service.analyze_screenshot(tmp_path, "comprehensive")

                if analysis["status"] == "success":
                    structured = analysis.get("structured_data", {})
                    if "features" in structured:
                        image_insights["features"].extend(structured["features"])
                    if "ui_elements" in structured:
                        image_insights["ui_elements"].extend(structured["ui_elements"])
                    if "workflows" in structured:
                        image_insights["workflows"].extend(structured["workflows"])

                # Clean up
                import os
                os.unlink(tmp_path)

        # Get AI suggestions from org memory
        suggestions = await memory_service.get_ai_suggestions(
            organisation_id=org_uuid,
            user_input=description,
            project_id=proj_uuid,
        )

        return {
            "status": "success",
            "suggestions": suggestions,
            "image_insights": image_insights,
            "images_analyzed": len(images) if images else 0,
        }

    except Exception as e:
        logger.error(f"Error previewing suggestions: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to preview suggestions: {str(e)}",
        )
