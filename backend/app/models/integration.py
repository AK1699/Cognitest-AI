"""
Integration Configuration Models for external tools (JIRA, GitHub, TestRail)
"""
from sqlalchemy import Column, String, DateTime, JSON, Text, ForeignKey, Boolean, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


class IntegrationType(str, enum.Enum):
    JIRA = "jira"
    GITHUB = "github"
    TESTRAIL = "testrail"
    GITLAB = "gitlab"
    AZURE_DEVOPS = "azure_devops"
    CUSTOM = "custom"


class IntegrationStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"
    TESTING = "testing"


class SyncDirection(str, enum.Enum):
    ONE_WAY_TO_EXTERNAL = "one_way_to_external"  # Cognitest → External
    ONE_WAY_FROM_EXTERNAL = "one_way_from_external"  # External → Cognitest
    BI_DIRECTIONAL = "bi_directional"  # Both ways


class Integration(Base):
    """
    Store integration configurations for external tools.
    Each project/organization can have multiple integrations.
    """
    __tablename__ = "integrations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)

    # Integration Details
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    integration_type = Column(SQLEnum(IntegrationType), nullable=False, index=True)
    status = Column(SQLEnum(IntegrationStatus), default=IntegrationStatus.INACTIVE, index=True)

    # Connection Details (encrypted in production)
    base_url = Column(String(500), nullable=False)  # e.g., https://company.atlassian.net
    username = Column(String(255), nullable=True)
    api_token = Column(Text, nullable=False)  # Should be encrypted
    api_key = Column(String(500), nullable=True)  # Alternative auth method

    # Configuration
    config = Column(JSON, default=dict)  # Integration-specific configuration
    # Example for JIRA:
    # {
    #   "project_key": "PROJ",
    #   "issue_types": ["Bug", "Story"],
    #   "custom_field_mappings": {...}
    # }

    # Sync Settings
    sync_direction = Column(SQLEnum(SyncDirection), default=SyncDirection.BI_DIRECTIONAL)
    auto_sync_enabled = Column(Boolean, default=False)
    sync_interval_minutes = Column(String(50), nullable=True)  # e.g., "15", "30", "60"

    # Sync Filters
    sync_filters = Column(JSON, default=dict)
    # Example:
    # {
    #   "only_specific_labels": ["automation", "critical"],
    #   "exclude_statuses": ["Closed", "Done"],
    #   "date_range": "last_7_days"
    # }

    # Field Mappings (map Cognitest fields to external fields)
    field_mappings = Column(JSON, default=dict)
    # Example for JIRA:
    # {
    #   "priority": {"high": "High", "medium": "Medium", "low": "Low"},
    #   "status": {"new": "Open", "in_progress": "In Progress", "closed": "Done"},
    #   "custom_fields": {"cf_10000": "acceptance_criteria"}
    # }

    # Webhooks
    webhook_url = Column(String(500), nullable=True)  # External webhook URL to receive events
    webhook_secret = Column(String(255), nullable=True)  # Webhook secret for verification

    # Last Sync Info
    last_sync_at = Column(DateTime(timezone=True), nullable=True)
    last_sync_status = Column(String(50), nullable=True)  # "success", "failed", "partial"
    last_sync_details = Column(JSON, default=dict)
    # {
    #   "items_synced": 10,
    #   "items_failed": 2,
    #   "errors": ["..."],
    #   "sync_duration_seconds": 5.2
    # }

    # Statistics
    total_synced_items = Column(String(50), default="0")
    total_sync_errors = Column(String(50), default="0")
    last_error = Column(Text, nullable=True)

    # Metadata
    tags = Column(JSON, default=list)
    meta_data = Column(JSON, default=dict)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(String(255), nullable=False)

    # Relationships
    organisation = relationship("Organisation", back_populates="integrations")
    project = relationship("Project", back_populates="integrations")
    sync_logs = relationship("IntegrationSyncLog", back_populates="integration", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Integration {self.name} ({self.integration_type})>"


class IntegrationSyncLog(Base):
    """
    Log of all sync operations for auditing and debugging.
    """
    __tablename__ = "integration_sync_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    integration_id = Column(UUID(as_uuid=True), ForeignKey("integrations.id", ondelete="CASCADE"), nullable=False)

    # Sync Details
    sync_type = Column(String(50), nullable=False)  # "manual", "automatic", "webhook"
    sync_direction = Column(String(50), nullable=False)  # "to_external", "from_external"
    status = Column(String(50), nullable=False, index=True)  # "success", "failed", "partial"

    # What was synced
    entity_type = Column(String(100), nullable=False)  # "issue", "test_case", "user_story"
    entity_id = Column(UUID(as_uuid=True), nullable=True)  # Internal entity ID
    external_entity_id = Column(String(255), nullable=True)  # External entity ID

    # Sync Result
    items_processed = Column(String(50), default="0")
    items_succeeded = Column(String(50), default="0")
    items_failed = Column(String(50), default="0")

    # Error Details
    error_message = Column(Text, nullable=True)
    error_details = Column(JSON, default=dict)

    # Performance
    duration_seconds = Column(String(50), nullable=True)

    # Full sync details
    sync_data = Column(JSON, default=dict)

    # Timestamps
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    triggered_by = Column(String(255), nullable=True)  # User who triggered

    # Relationships
    integration = relationship("Integration", back_populates="sync_logs")

    def __repr__(self):
        return f"<IntegrationSyncLog {self.sync_type} - {self.status}>"
