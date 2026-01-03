from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from cognitest_common import Base

class OAuthAccount(Base):
    __tablename__ = "oauth_accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    provider = Column(String(50), nullable=False)  # e.g., 'google', 'microsoft', 'apple'
    provider_user_id = Column(String(255), nullable=False)  # The unique ID from the provider
    email = Column(String(255), nullable=False)
    name = Column(String(255), nullable=True)
    picture_url = Column(String(500), nullable=True)
    access_token = Column(String(1000), nullable=True)
    refresh_token = Column(String(1000), nullable=True)
    token_expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="oauth_accounts")

    def __repr__(self):
        return f"<OAuthAccount {self.provider}:{self.provider_user_id}>"
