"""
Pydantic schemas for document management
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class DocumentUploadResponse(BaseModel):
    """Response for document upload"""
    document_id: str
    document_name: str
    source: str  # text_input, file_upload, structured_data
    file_type: Optional[str] = None
    total_chunks: int
    content_length: int = 0
    message: str


class DocumentListResponse(BaseModel):
    """Response for document list"""
    document_id: str
    document_name: str
    document_type: str  # description, requirement, specification, etc.
    source: str
    total_chunks: int
    content_length: int
    times_used: int = 0
    created_at: str


class DocumentDetailResponse(BaseModel):
    """Response for document detail"""
    document_id: str
    document_name: str
    document_type: str
    source: str
    content_preview: Optional[str] = None
    total_chunks: int
    content_length: int
    times_used: int = 0
    relevance_score: float = 0.0
    learning_contribution: float = 0.0
    tags: List[str] = []
    created_at: str
    last_used_at: Optional[str] = None


class DocumentSearchRequest(BaseModel):
    """Request for document search"""
    project_id: str
    query: str
    limit: int = Field(default=5, ge=1, le=100)
    score_threshold: float = Field(default=0.7, ge=0.0, le=1.0)


class DocumentSearchResponse(BaseModel):
    """Response for document search"""
    query: str
    total_results: int
    results: List[dict]


class DocumentUsageResponse(BaseModel):
    """Response for document usage update"""
    document_id: str
    chunk_index: int
    was_useful: bool
    message: str
