from sqlalchemy import Column, String, DateTime, Text, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base

class Organisation(Base):
    __tablename__ = "organisations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    website = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    logo = Column(Text, nullable=True)

    # Owner
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    # Settings - stores enabled modules and other org-level settings
    settings = Column(JSON, default=dict)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships - commented out until ready
    # owner = relationship("User", back_populates="organisations")
    # projects = relationship("Project", back_populates="organisation", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Organisation {self.name}>"
