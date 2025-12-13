"""
Artifact Schemas - Pydantic models for artifact API
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

from app.models.artifact import ArtifactType


class ArtifactCreate(BaseModel):
    """Schema for creating an artifact"""
    name: str = Field(..., min_length=1, max_length=500)
    type: ArtifactType
    execution_run_id: Optional[UUID] = None
    step_result_id: Optional[UUID] = None
    test_name: Optional[str] = None
    step_name: Optional[str] = None


class ArtifactResponse(BaseModel):
    """Schema for artifact response"""
    id: UUID
    project_id: UUID
    execution_run_id: Optional[UUID]
    step_result_id: Optional[UUID]
    name: str
    type: ArtifactType
    file_path: str
    file_url: Optional[str]
    size_bytes: Optional[int]
    duration_ms: Optional[int]
    test_name: Optional[str]
    step_name: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ArtifactListResponse(BaseModel):
    """Schema for paginated artifact list"""
    items: List[ArtifactResponse]
    total: int
    page: int
    page_size: int
    has_more: bool
