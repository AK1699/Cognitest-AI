from sqlalchemy import Column, String, DateTime, JSON, Text, ForeignKey, Enum as SQLEnum, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base

class APIRequest(Base):
    __tablename__ = "api_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    collection_id = Column(UUID(as_uuid=True), ForeignKey("api_collections.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String(255), nullable=False)
    method = Column(String(10), nullable=False, default="GET")
    url = Column(Text, nullable=False)
    
    params = Column(JSON, default=list)
    headers = Column(JSON, default=list)
    body = Column(JSON, default=lambda: {"type": "none", "content": ""})
    auth = Column(JSON, default=lambda: {"type": "none"})
    
    pre_request_script = Column(Text, nullable=True)
    test_script = Column(Text, nullable=True)
    
    order = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    collection = relationship("ApiCollection", back_populates="api_requests")

    def __repr__(self):
        return f"<APIRequest {self.method} {self.name}>"
