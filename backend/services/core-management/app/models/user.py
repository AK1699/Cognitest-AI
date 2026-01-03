from sqlalchemy import Column, String, Boolean, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from cognitest_common import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # MFA / Two-Factor Authentication
    mfa_secret = Column(String(32), nullable=True)  # TOTP secret key (base32 encoded)
    mfa_enabled = Column(Boolean, default=False)    # Whether MFA is active
    mfa_backup_codes = Column(JSON, nullable=True)  # List of hashed backup codes

    # Relationships
    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")
    groups = relationship(
        "Group",
        secondary="user_groups",
        back_populates="users"
    )
    project_roles = relationship("UserProjectRole", back_populates="user", cascade="all, delete-orphan")
    oauth_accounts = relationship("OAuthAccount", back_populates="user", cascade="all, delete-orphan")
    organisation_memberships = relationship("UserOrganisation", foreign_keys="UserOrganisation.user_id", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User {self.email}>"
