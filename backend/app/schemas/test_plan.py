from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

from app.models.test_plan import GenerationType


# Base schema
class TestPlanBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    objectives: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    meta_data: Dict[str, Any] = Field(default_factory=dict)


# Schema for creating a test plan
class TestPlanCreate(TestPlanBase):
    project_id: UUID
    generated_by: GenerationType = GenerationType.MANUAL
    source_documents: List[str] = Field(default_factory=list)
    created_by: str


# Schema for updating a test plan
class TestPlanUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    objectives: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    meta_data: Optional[Dict[str, Any]] = None


# Schema for response
class TestPlanResponse(TestPlanBase):
    id: UUID
    project_id: UUID
    generated_by: GenerationType
    source_documents: List[str]
    confidence_score: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    created_by: str

    class Config:
        from_attributes = True


# Schema for AI generation request
class TestPlanAIGenerateRequest(BaseModel):
    project_id: UUID
    source_documents: List[str] = Field(..., description="URLs or paths to requirement documents")
    additional_context: Optional[str] = Field(None, description="Additional context for AI")
    objectives: Optional[List[str]] = Field(default_factory=list, description="Specific objectives to focus on")


# Schema for AI generation response
class TestPlanAIGenerateResponse(BaseModel):
    test_plan: TestPlanResponse
    confidence_score: str
    suggestions: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
