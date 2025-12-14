"""
Snippet Schemas for API Request/Response
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Literal
from uuid import UUID
from datetime import datetime


class SnippetParameter(BaseModel):
    """Definition of a snippet parameter"""
    name: str = Field(..., description="Parameter name (used in {{name}} substitution)")
    type: Literal["string", "number", "boolean", "selector"] = Field(default="string")
    default: Optional[str] = Field(default="", description="Default value if not provided")
    description: Optional[str] = Field(default="", description="Help text for the parameter")


class SnippetCreate(BaseModel):
    """Request schema for creating a snippet"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    parameters: List[SnippetParameter] = Field(default_factory=list)
    steps: List[Dict[str, Any]] = Field(..., description="Array of step objects")
    tags: List[str] = Field(default_factory=list)
    is_global: bool = Field(default=False, description="Share across all projects in org")
    version: str = Field(default="1.0.0")


class SnippetUpdate(BaseModel):
    """Request schema for updating a snippet"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    parameters: Optional[List[SnippetParameter]] = None
    steps: Optional[List[Dict[str, Any]]] = None
    tags: Optional[List[str]] = None
    is_global: Optional[bool] = None
    version: Optional[str] = None


class SnippetResponse(BaseModel):
    """Response schema for snippet"""
    id: UUID
    project_id: UUID
    organisation_id: UUID
    name: str
    description: Optional[str]
    parameters: List[SnippetParameter]
    steps: List[Dict[str, Any]]
    tags: List[str]
    is_global: bool
    version: str
    usage_count: int
    created_at: datetime
    updated_at: Optional[datetime]
    created_by: Optional[UUID]

    class Config:
        from_attributes = True


class SnippetFromStepsRequest(BaseModel):
    """Request to create a snippet from selected steps"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    step_ids: List[str] = Field(..., description="IDs of steps to include in snippet")
    steps: List[Dict[str, Any]] = Field(..., description="The actual step data")
    parameters: List[SnippetParameter] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)


class CallSnippetStep(BaseModel):
    """Schema for a call_snippet step in a test flow"""
    snippet_id: UUID
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Parameter values to use")
