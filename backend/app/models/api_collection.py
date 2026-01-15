from sqlalchemy import Column, String, DateTime, JSON, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, backref
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base

class ApiCollection(Base):
    __tablename__ = "api_collections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("api_collections.id", ondelete="CASCADE"), nullable=True)

    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Environment variables (optionally stored at collection level)
    environment = Column(JSON, default=dict)

    # Metadata
    tags = Column(JSON, default=list)
    meta_data = Column(JSON, default=dict)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Relationships
    project = relationship("Project", back_populates="api_collections")
    api_requests = relationship("APIRequest", back_populates="collection", cascade="all, delete-orphan", order_by="APIRequest.order")
    
    # Self-referential relationship for folders
    children = relationship("ApiCollection", backref=backref("parent", remote_side=[id]), cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ApiCollection {self.name}>"
