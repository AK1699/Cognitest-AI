"""
Document Knowledge Model for storing all user input documents and extracted knowledge
"""
from sqlalchemy import Column, String, DateTime, JSON, Text, ForeignKey, Integer, Float, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


class DocumentSource(str, enum.Enum):
    """Source of document"""
    TEXT_INPUT = "text_input"
    FILE_UPLOAD = "file_upload"
    STRUCTURED_DATA = "structured_data"
    API_REQUEST = "api_request"
    REQUIREMENT = "requirement"
    SPECIFICATION = "specification"
    TEST_PLAN = "test_plan"
    TEST_CASE = "test_case"


class DocumentType(str, enum.Enum):
    """Type of document"""
    DESCRIPTION = "description"
    REQUIREMENT = "requirement"
    SPECIFICATION = "specification"
    TEST_PLAN = "test_plan"
    TEST_CASE = "test_case"
    DOCUMENT = "document"
    CODE = "code"
    DATA = "data"
    METADATA = "metadata"
    OTHER = "other"


class DocumentKnowledge(Base):
    """
    Model for storing all documents and inputs that contribute to AI learning
    """

    __tablename__ = "document_knowledge"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Project context
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False, index=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Document metadata
    document_name = Column(String(500), nullable=True)
    document_type = Column(SQLEnum(DocumentType), default=DocumentType.DOCUMENT, index=True)
    source = Column(SQLEnum(DocumentSource), default=DocumentSource.TEXT_INPUT, index=True)
    file_type = Column(String(50), nullable=True)  # .pdf, .docx, .csv, .json, etc.

    # Content
    content = Column(Text, nullable=False)  # Full document content
    content_preview = Column(String(1000), nullable=True)  # First 1000 chars for quick view
    content_length = Column(Integer, default=0)  # Length in characters

    # Chunking information
    total_chunks = Column(Integer, default=1)  # How many chunks this document has
    chunk_hashes = Column(JSON, default=list)  # List of chunk IDs in vector DB

    # Metadata
    metadata = Column(JSON, default=dict)  # Additional metadata (title, author, tags, etc.)
    tags = Column(JSON, default=list)  # Searchable tags

    # Learning tracking
    times_used_in_generation = Column(Integer, default=0)  # How many times used as context
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    relevance_score = Column(Float, default=0.0)  # How relevant to agent outputs
    learning_contribution = Column(Float, default=0.0)  # How much it improved outputs (0-1)

    # Vector DB references
    qdrant_collection = Column(String(255), nullable=True)  # Collection name in Qdrant
    qdrant_point_ids = Column(JSON, default=list)  # List of point IDs in Qdrant

    # Status
    is_active = Column(Integer, default=1, index=True)  # Whether this doc is used for learning
    is_indexed = Column(Integer, default=0)  # Whether indexed in vector DB

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    indexed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    project = relationship("Project", foreign_keys=[project_id])
    user = relationship("User", foreign_keys=[created_by])

    def __repr__(self):
        return f"<DocumentKnowledge {self.document_name}:{self.id}>"


class DocumentChunk(Base):
    """
    Model for storing individual document chunks
    Allows tracking which chunks are most useful
    """

    __tablename__ = "document_chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Reference to parent document
    document_id = Column(UUID(as_uuid=True), ForeignKey("document_knowledge.id"), nullable=False, index=True)

    # Chunk information
    chunk_index = Column(Integer, nullable=False)  # Which chunk number (0-based)
    chunk_text = Column(Text, nullable=False)
    chunk_length = Column(Integer, nullable=False)

    # Vector DB reference
    qdrant_point_id = Column(String(255), nullable=True, unique=True)

    # Learning tracking
    times_used = Column(Integer, default=0)  # How many times this chunk was used
    effectiveness_score = Column(Float, default=0.0)  # How much it helped (0-1)
    user_rating = Column(Float, nullable=True)  # User rating if provided

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_used_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    document = relationship("DocumentKnowledge", foreign_keys=[document_id])

    def __repr__(self):
        return f"<DocumentChunk {self.document_id}:{self.chunk_index}>"


class DocumentUsageLog(Base):
    """
    Log when and how documents are used in AI generation
    Helps track learning effectiveness
    """

    __tablename__ = "document_usage_log"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # References
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False, index=True)
    document_id = Column(UUID(as_uuid=True), ForeignKey("document_knowledge.id"), nullable=False, index=True)
    chunk_id = Column(UUID(as_uuid=True), ForeignKey("document_chunks.id"), nullable=True)
    agent_name = Column(String(255), nullable=False, index=True)  # Which agent used it

    # Usage context
    query = Column(Text, nullable=False)  # What query matched this document
    similarity_score = Column(Float, nullable=False)  # How similar was the match
    generation_id = Column(String(255), nullable=True)  # Link to generated output

    # Outcome
    was_useful = Column(Integer, nullable=True)  # Did user accept the output (1=yes, 0=no, null=unknown)
    user_feedback = Column(Text, nullable=True)  # User comments on usefulness

    # Metadata
    metadata = Column(JSON, default=dict)

    # Timestamp
    used_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationships
    project = relationship("Project", foreign_keys=[project_id])
    document = relationship("DocumentKnowledge", foreign_keys=[document_id])

    def __repr__(self):
        return f"<DocumentUsageLog {self.document_id}:{self.agent_name}>"
