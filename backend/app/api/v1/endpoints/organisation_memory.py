"""
Organisation Memory API endpoints
Handles multimodal inputs (text + images) for organization-level learning
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional, Dict, Any
import uuid
import logging
import json

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.organisation_memory import OrganisationMemory
from app.schemas.organisation_memory import (
    MemoryCreateResponse,
    MemoryDetailResponse,
    MemoryListResponse,
    AISuggestionsRequest,
    AISuggestionsResponse,
    MemoryImageResponse,
)
from app.services.organisation_memory_service import get_organisation_memory_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/organisation-memory", tags=["organisation-memory"])


@router.post("/store", response_model=MemoryCreateResponse, status_code=status.HTTP_201_CREATED)
async def store_memory_with_images(
    organisation_id: str = Form(...),
    description: str = Form(...),
    project_id: Optional[str] = Form(None),
    source: str = Form(default="user_input"),
    tags: Optional[str] = Form(None),  # JSON string of tags array
    images: Optional[List[UploadFile]] = File(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MemoryCreateResponse:
    """
    Store organization memory with text and optional images

    This endpoint allows users to:
    1. Submit text descriptions
    2. Upload/paste screenshots
    3. Store multimodal context at organization level
    4. Enable AI learning from all inputs

    Args:
        organisation_id: Organisation UUID
        description: Text description from user
        project_id: Optional project UUID
        source: Source of memory (test_plan_generator, user_input, etc.)
        tags: JSON string of tags (e.g., '["feature-x", "ui"]')
        images: List of uploaded image files
        current_user: Current user
        db: Database session

    Returns:
        Memory creation response with analysis
    """
    try:
        # Validate and parse inputs
        org_uuid = uuid.UUID(organisation_id)
        proj_uuid = uuid.UUID(project_id) if project_id else None

        # Parse tags
        tags_list = []
        if tags:
            try:
                tags_list = json.loads(tags)
            except json.JSONDecodeError:
                tags_list = [t.strip() for t in tags.split(",")]

        # Get memory service
        memory_service = await get_organisation_memory_service(db)

        # Store memory
        result = await memory_service.store_memory(
            organisation_id=org_uuid,
            user_description=description,
            image_files=images,
            project_id=proj_uuid,
            user_id=current_user.id,
            source=source,
            tags=tags_list,
        )

        logger.info(
            f"User {current_user.id} stored memory {result['memory_id']} "
            f"for org {organisation_id} with {result['image_count']} images"
        )

        return MemoryCreateResponse(
            status="success",
            memory_id=result["memory_id"],
            message=f"Memory stored successfully with {result['image_count']} images",
            image_count=result["image_count"],
            analysis=result["analysis"],
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid UUID format: {str(e)}",
        )
    except Exception as e:
        logger.error(f"Error storing memory: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to store memory: {str(e)}",
        )


@router.get("/organisation/{organisation_id}", response_model=MemoryListResponse)
async def list_organisation_memories(
    organisation_id: uuid.UUID,
    project_id: Optional[uuid.UUID] = None,
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MemoryListResponse:
    """
    List all memories for an organisation

    Args:
        organisation_id: Organisation UUID
        project_id: Optional project filter
        limit: Max results
        offset: Pagination offset
        current_user: Current user
        db: Database session

    Returns:
        List of memories
    """
    try:
        query = select(OrganisationMemory).where(
            and_(
                OrganisationMemory.organisation_id == organisation_id,
                OrganisationMemory.is_active == 1,
            )
        )

        if project_id:
            query = query.where(OrganisationMemory.project_id == project_id)

        # Get total count
        from sqlalchemy import func as sql_func
        count_query = select(sql_func.count()).select_from(OrganisationMemory).where(
            and_(
                OrganisationMemory.organisation_id == organisation_id,
                OrganisationMemory.is_active == 1,
            )
        )
        if project_id:
            count_query = count_query.where(OrganisationMemory.project_id == project_id)

        count_result = await db.execute(count_query)
        total = count_result.scalar()

        # Get memories
        query = query.order_by(OrganisationMemory.created_at.desc()).limit(limit).offset(offset)
        result = await db.execute(query)
        memories = result.scalars().all()

        return MemoryListResponse(
            total=total,
            memories=[
                MemoryDetailResponse(
                    memory_id=str(mem.id),
                    organisation_id=str(mem.organisation_id),
                    project_id=str(mem.project_id) if mem.project_id else None,
                    description=mem.user_description,
                    input_type=mem.input_type,
                    source=mem.source,
                    has_images=mem.has_images == 1,
                    image_count=mem.total_images,
                    extracted_features=mem.extracted_features or [],
                    ui_elements=mem.ui_elements or [],
                    workflows=mem.workflows or [],
                    tags=mem.tags or [],
                    times_referenced=mem.times_referenced,
                    effectiveness_score=mem.effectiveness_score,
                    created_at=mem.created_at.isoformat(),
                )
                for mem in memories
            ],
        )

    except Exception as e:
        logger.error(f"Error listing memories: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to list memories",
        )


@router.post("/suggestions", response_model=AISuggestionsResponse)
async def get_ai_suggestions(
    request: AISuggestionsRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AISuggestionsResponse:
    """
    Get AI-powered suggestions based on organization memory

    This endpoint analyzes user input and provides:
    1. Similar past inputs
    2. Suggested features from historical data
    3. UI elements commonly used
    4. Workflow patterns
    5. Test scenarios

    Args:
        request: Suggestions request
        current_user: Current user
        db: Database session

    Returns:
        AI suggestions
    """
    try:
        # Get memory service
        memory_service = await get_organisation_memory_service(db)

        # Get suggestions
        suggestions = await memory_service.get_ai_suggestions(
            organisation_id=request.organisation_id,
            user_input=request.user_input,
            project_id=request.project_id,
        )

        logger.info(
            f"Generated AI suggestions for org {request.organisation_id}: "
            f"{suggestions.get('similar_inputs_count', 0)} similar inputs found"
        )

        return AISuggestionsResponse(
            has_suggestions=suggestions.get("has_suggestions", False),
            similar_inputs_count=suggestions.get("similar_inputs_count", 0),
            suggested_features=suggestions.get("suggested_features", []),
            suggested_ui_elements=suggestions.get("suggested_ui_elements", []),
            suggested_workflows=suggestions.get("suggested_workflows", []),
            suggested_test_scenarios=suggestions.get("suggested_test_scenarios", []),
            context=suggestions.get("context", []),
        )

    except Exception as e:
        logger.error(f"Error getting suggestions: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to get suggestions: {str(e)}",
        )


@router.get("/{memory_id}", response_model=MemoryDetailResponse)
async def get_memory_detail(
    memory_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MemoryDetailResponse:
    """
    Get detailed information about a specific memory

    Args:
        memory_id: Memory UUID
        current_user: Current user
        db: Database session

    Returns:
        Memory details
    """
    try:
        result = await db.execute(
            select(OrganisationMemory).where(OrganisationMemory.id == memory_id)
        )
        memory = result.scalar_one_or_none()

        if not memory:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Memory not found",
            )

        # Get associated images
        from app.models.organisation_memory import OrganisationMemoryImage
        images_result = await db.execute(
            select(OrganisationMemoryImage)
            .where(OrganisationMemoryImage.memory_id == memory_id)
            .order_by(OrganisationMemoryImage.image_order)
        )
        images = images_result.scalars().all()

        return MemoryDetailResponse(
            memory_id=str(memory.id),
            organisation_id=str(memory.organisation_id),
            project_id=str(memory.project_id) if memory.project_id else None,
            description=memory.user_description,
            input_type=memory.input_type,
            source=memory.source,
            has_images=memory.has_images == 1,
            image_count=memory.total_images,
            extracted_features=memory.extracted_features or [],
            ui_elements=memory.ui_elements or [],
            workflows=memory.workflows or [],
            tags=memory.tags or [],
            times_referenced=memory.times_referenced,
            effectiveness_score=memory.effectiveness_score,
            created_at=memory.created_at.isoformat(),
            images=[
                MemoryImageResponse(
                    id=str(img.id),
                    file_name=img.file_name,
                    file_size=img.file_size,
                    mime_type=img.mime_type,
                    vision_analysis=img.vision_analysis or {},
                    extracted_text=img.extracted_text,
                    image_order=img.image_order,
                )
                for img in images
            ] if images else None,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting memory detail: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to get memory detail",
        )


@router.delete("/{memory_id}")
async def delete_memory(
    memory_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, str]:
    """
    Delete a memory (mark as inactive)

    Args:
        memory_id: Memory UUID
        current_user: Current user
        db: Database session

    Returns:
        Deletion confirmation
    """
    try:
        result = await db.execute(
            select(OrganisationMemory).where(OrganisationMemory.id == memory_id)
        )
        memory = result.scalar_one_or_none()

        if not memory:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Memory not found",
            )

        # Mark as inactive
        memory.is_active = 0
        await db.commit()

        logger.info(f"User {current_user.id} deleted memory {memory_id}")

        return {"message": "Memory deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting memory: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to delete memory",
        )
