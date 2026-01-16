from sqlalchemy import Column, String, DateTime, JSON, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


class ApiEnvironment(Base):
    """
    Stores API testing environments at the project level.
    Each environment contains a list of variables that can be used
    for variable interpolation in API requests (e.g., {{baseUrl}}).
    """
    __tablename__ = "api_environments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String(255), nullable=False)
    
    # Variables stored as JSON array: [{id, key, value, enabled, secret}]
    variables = Column(JSON, default=list)
    
    # Mark one environment as default for the project
    is_default = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Relationships
    project = relationship("Project", back_populates="api_environments")

    def __repr__(self):
        return f"<ApiEnvironment {self.name}>"
