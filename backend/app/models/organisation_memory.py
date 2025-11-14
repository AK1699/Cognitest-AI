"""
Organisation Memory Model for storing all user inputs (text + images) at organization level
This enables AI to learn from all inputs across projects within an organization
"""
from sqlalchemy import Column, String, DateTime, JSON, Text, ForeignKey, Integer, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


class MemoryInputType(str, enum.Enum):
    """Type of memory input"""
    TEXT_ONLY = "text_only"
    TEXT_WITH_IMAGES = "text_with_images"
    SCREENSHOT_ANALYSIS = "screenshot_analysis"


class MemorySource(str, enum.Enum):
    """Source of memory"""
    TEST_PLAN_GENERATOR = "test_plan_generator"
    TEST_CASE_GENERATOR = "test_case_generator"
    DOCUMENT_UPLOAD = "document_upload"
    USER_INPUT = "user_input"


class OrganisationMemory(Base):
    """
    Model for storing organization-level memory (text + images)
    Enables cross-project learning and AI suggestions
    """
    __tablename__ = "organisation_memory"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Organization and project context
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=True, index=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Input metadata
    input_type = Column(String(50), nullable=False, index=True)  # Using String for enum
    source = Column(String(50), nullable=False, index=True)  # Using String for enum

    # Text content
    user_description = Column(Text, nullable=False)  # User's original text input
    processed_text = Column(Text, nullable=True)  # AI-processed/enhanced text

    # Image references
    has_images = Column(Integer, default=0, index=True)  # Boolean flag
    total_images = Column(Integer, default=0)

    # AI-extracted information from images
    image_analysis = Column(JSON, default=dict)  # AI vision analysis of screenshots
    extracted_features = Column(JSON, default=list)  # Features extracted from images
    ui_elements = Column(JSON, default=list)  # UI elements identified
    workflows = Column(JSON, default=list)  # User workflows identified

    # Combined searchable text (text + image analysis)
    searchable_content = Column(Text, nullable=False)  # For full-text search

    # Vector DB reference
    qdrant_collection = Column(String(255), nullable=True)
    qdrant_point_id = Column(String(255), nullable=True)

    # Usage tracking
    times_referenced = Column(Integer, default=0)  # How often used in suggestions
    effectiveness_score = Column(Float, default=0.0)  # How useful (0-1)
    last_referenced_at = Column(DateTime(timezone=True), nullable=True)

    # Linked outputs (what was generated from this memory)
    generated_test_plan_ids = Column(JSON, default=list)
    generated_test_case_ids = Column(JSON, default=list)

    # Metadata
    tags = Column(JSON, default=list)
    meta_data = Column(JSON, default=dict)

    # Status
    is_active = Column(Integer, default=1, index=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    organisation = relationship("Organisation", foreign_keys=[organisation_id])
    project = relationship("Project", foreign_keys=[project_id])
    user = relationship("User", foreign_keys=[created_by])
    images = relationship("OrganisationMemoryImage", back_populates="memory", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<OrganisationMemory {self.id} ({self.input_type})>"


class OrganisationMemoryImage(Base):
    """
    Model for storing image files associated with organization memory
    """
    __tablename__ = "organisation_memory_images"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Link to parent memory
    memory_id = Column(UUID(as_uuid=True), ForeignKey("organisation_memory.id", ondelete="CASCADE"), nullable=False, index=True)

    # Image information
    file_name = Column(String(500), nullable=False)
    file_path = Column(String(1000), nullable=False)  # Storage path (S3 or local)
    file_size = Column(Integer, nullable=False)  # Size in bytes
    mime_type = Column(String(100), nullable=False)  # image/png, image/jpeg, etc.

    # Image dimensions
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)

    # AI Vision analysis
    vision_analysis = Column(JSON, default=dict)  # Raw AI vision output
    extracted_text = Column(Text, nullable=True)  # OCR text from image
    identified_elements = Column(JSON, default=list)  # UI elements, buttons, forms, etc.

    # Metadata
    image_order = Column(Integer, default=0)  # Order in sequence
    meta_data = Column(JSON, default=dict)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    memory = relationship("OrganisationMemory", back_populates="images")

    def __repr__(self):
        return f"<OrganisationMemoryImage {self.file_name}>"


class MemoryUsageLog(Base):
    """
    Track when and how organization memory is used in AI generation
    """
    __tablename__ = "memory_usage_log"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # References
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False, index=True)
    memory_id = Column(UUID(as_uuid=True), ForeignKey("organisation_memory.id", ondelete="CASCADE"), nullable=False, index=True)

    # Usage context
    used_in_generation = Column(String(255), nullable=False)  # test_plan, test_case, etc.
    generation_id = Column(UUID(as_uuid=True), nullable=True)  # ID of generated item
    similarity_score = Column(Float, nullable=False)  # How similar was the query

    # User feedback
    was_helpful = Column(Integer, nullable=True)  # 1=yes, 0=no, null=unknown
    user_rating = Column(Float, nullable=True)  # 0-5 rating

    # Metadata
    query_text = Column(Text, nullable=True)
    meta_data = Column(JSON, default=dict)

    # Timestamp
    used_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationships
    organisation = relationship("Organisation", foreign_keys=[organisation_id])
    memory = relationship("OrganisationMemory", foreign_keys=[memory_id])

    def __repr__(self):
        return f"<MemoryUsageLog {self.memory_id}>"
