from sqlalchemy import Column, String, DateTime, JSON, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base

class HttpMethod(str, enum.Enum):
    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    PATCH = "PATCH"
    DELETE = "DELETE"
    HEAD = "HEAD"
    OPTIONS = "OPTIONS"

class ApiCollection(Base):
    __tablename__ = "api_collections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)

    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # API Requests
    requests = Column(JSON, default=list)  # List of API request objects

    # Environment variables
    environment = Column(JSON, default=dict)

    # Import source
    imported_from = Column(String(100), nullable=True)  # "openapi", "postman", "manual"
    source_url = Column(String(500), nullable=True)

    # Metadata
    tags = Column(JSON, default=list)
    metadata = Column(JSON, default=dict)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(String(255), nullable=False)

    # Relationships
    project = relationship("Project", back_populates="api_collections")

    def __repr__(self):
        return f"<ApiCollection {self.name}>"
