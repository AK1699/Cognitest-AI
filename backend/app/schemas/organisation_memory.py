"""
Pydantic schemas for Organisation Memory API
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import uuid
from datetime import datetime


class MemoryCreateRequest(BaseModel):
    """Request for creating organization memory"""
    organisation_id: uuid.UUID
    project_id: Optional[uuid.UUID] = None
    description: str = Field(..., min_length=1, description="Text description from user")
    source: str = Field(default="user_input", description="Source of memory")
    tags: Optional[List[str]] = Field(default=None, description="Optional tags")


class MemoryImageResponse(BaseModel):
    """Response for memory image"""
    id: str
    file_name: str
    file_size: int
    mime_type: str
    vision_analysis: Dict[str, Any]
    extracted_text: Optional[str]
    image_order: int


class MemoryCreateResponse(BaseModel):
    """Response for memory creation"""
    status: str
    memory_id: str
    message: str
    image_count: int
    analysis: Dict[str, Any]


class MemoryDetailResponse(BaseModel):
    """Response for memory details"""
    memory_id: str
    organisation_id: str
    project_id: Optional[str]
    description: str
    input_type: str
    source: str
    has_images: bool
    image_count: int
    extracted_features: List[str]
    ui_elements: List[Any]
    workflows: List[Any]
    tags: List[str]
    times_referenced: int
    effectiveness_score: float
    created_at: str
    images: Optional[List[MemoryImageResponse]] = None


class MemoryListResponse(BaseModel):
    """Response for memory list"""
    total: int
    memories: List[MemoryDetailResponse]


class AISuggestionsRequest(BaseModel):
    """Request for AI suggestions"""
    organisation_id: uuid.UUID
    project_id: Optional[uuid.UUID] = None
    user_input: str = Field(..., min_length=1, description="Current user input text")


class AISuggestionsResponse(BaseModel):
    """Response for AI suggestions"""
    has_suggestions: bool
    similar_inputs_count: int
    suggested_features: List[str]
    suggested_ui_elements: List[str]
    suggested_workflows: List[str]
    suggested_test_scenarios: List[str]
    context: List[Dict[str, Any]]


class TestPlanMultimodalRequest(BaseModel):
    """Request for test plan generation with multimodal input"""
    project_id: uuid.UUID
    organisation_id: uuid.UUID
    description: str = Field(..., min_length=1, description="Text description")
    use_org_memory: bool = Field(default=True, description="Use organization memory for suggestions")

    # Optional fields for additional context
    project_type: Optional[str] = None
    features: Optional[List[str]] = None
    platforms: Optional[List[str]] = None
    priority: Optional[str] = "medium"
    complexity: Optional[str] = "medium"


class TestPlanMultimodalResponse(BaseModel):
    """Response for multimodal test plan generation"""
    status: str
    memory_id: str
    test_plan_id: Optional[str] = None
    message: str
    images_processed: int
    ai_suggestions_used: bool
    suggestions: Optional[AISuggestionsResponse] = None
    test_plan: Optional[Dict[str, Any]] = None
