"""
Integration Configuration Schemas for external tools
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

from app.models.integration import IntegrationType, IntegrationStatus, SyncDirection


# ========== BASE SCHEMA ==========
class IntegrationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Integration name")
    description: Optional[str] = Field(None, description="Integration description")
    integration_type: IntegrationType = Field(..., description="Type of integration")
    status: IntegrationStatus = Field(default=IntegrationStatus.INACTIVE, description="Integration status")

    # Connection Details
    base_url: str = Field(..., description="Base URL for the external service")
    username: Optional[str] = Field(None, description="Username for authentication")
    api_token: str = Field(..., description="API token or password")
    api_key: Optional[str] = Field(None, description="API key (alternative auth)")

    # Configuration
    config: Dict[str, Any] = Field(default_factory=dict, description="Integration-specific configuration")

    # Sync Settings
    sync_direction: SyncDirection = Field(default=SyncDirection.BI_DIRECTIONAL, description="Sync direction")
    auto_sync_enabled: bool = Field(default=False, description="Enable automatic sync")
    sync_interval_minutes: Optional[str] = Field(None, description="Auto-sync interval in minutes")

    # Filters and Mappings
    sync_filters: Dict[str, Any] = Field(default_factory=dict, description="Sync filters")
    field_mappings: Dict[str, Any] = Field(default_factory=dict, description="Field mappings")

    # Webhooks
    webhook_url: Optional[str] = Field(None, description="Webhook URL for receiving events")
    webhook_secret: Optional[str] = Field(None, description="Webhook secret")

    # Metadata
    tags: List[str] = Field(default_factory=list, description="Tags")
    meta_data: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")


# ========== CREATE SCHEMA ==========
class IntegrationCreate(IntegrationBase):
    organisation_id: UUID = Field(..., description="Organisation ID")
    project_id: Optional[UUID] = Field(None, description="Project ID (optional for org-level integrations)")
    created_by: str = Field(..., description="Creator email or ID")


# ========== UPDATE SCHEMA ==========
class IntegrationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[IntegrationStatus] = None

    base_url: Optional[str] = None
    username: Optional[str] = None
    api_token: Optional[str] = None
    api_key: Optional[str] = None

    config: Optional[Dict[str, Any]] = None

    sync_direction: Optional[SyncDirection] = None
    auto_sync_enabled: Optional[bool] = None
    sync_interval_minutes: Optional[str] = None

    sync_filters: Optional[Dict[str, Any]] = None
    field_mappings: Optional[Dict[str, Any]] = None

    webhook_url: Optional[str] = None
    webhook_secret: Optional[str] = None

    tags: Optional[List[str]] = None
    meta_data: Optional[Dict[str, Any]] = None


# ========== RESPONSE SCHEMA ==========
class IntegrationResponse(IntegrationBase):
    id: UUID
    organisation_id: UUID
    project_id: Optional[UUID]

    # Last Sync Info
    last_sync_at: Optional[datetime]
    last_sync_status: Optional[str]
    last_sync_details: Dict[str, Any]

    # Statistics
    total_synced_items: str
    total_sync_errors: str
    last_error: Optional[str]

    # Timestamps
    created_at: datetime
    updated_at: Optional[datetime]
    created_by: str

    class Config:
        from_attributes = True


# ========== SYNC LOG SCHEMAS ==========
class IntegrationSyncLogBase(BaseModel):
    sync_type: str = Field(..., description="Type of sync (manual, automatic, webhook)")
    sync_direction: str = Field(..., description="Direction (to_external, from_external)")
    status: str = Field(..., description="Sync status")

    entity_type: str = Field(..., description="Entity type being synced")
    entity_id: Optional[UUID] = Field(None, description="Internal entity ID")
    external_entity_id: Optional[str] = Field(None, description="External entity ID")

    items_processed: str = Field(default="0")
    items_succeeded: str = Field(default="0")
    items_failed: str = Field(default="0")

    error_message: Optional[str] = None
    error_details: Dict[str, Any] = Field(default_factory=dict)

    duration_seconds: Optional[str] = None
    sync_data: Dict[str, Any] = Field(default_factory=dict)

    triggered_by: Optional[str] = None


class IntegrationSyncLogResponse(IntegrationSyncLogBase):
    id: UUID
    integration_id: UUID
    started_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


# ========== TEST CONNECTION SCHEMA ==========
class IntegrationTestRequest(BaseModel):
    """Test integration connection"""
    integration_type: IntegrationType
    base_url: str
    username: Optional[str] = None
    api_token: str
    api_key: Optional[str] = None
    config: Dict[str, Any] = Field(default_factory=dict)


class IntegrationTestResponse(BaseModel):
    """Test connection response"""
    success: bool
    message: str
    details: Dict[str, Any] = Field(default_factory=dict)


# ========== MANUAL SYNC SCHEMA ==========
class IntegrationSyncRequest(BaseModel):
    """Trigger manual sync"""
    entity_type: Optional[str] = Field(None, description="Specific entity type to sync")
    entity_ids: List[UUID] = Field(default_factory=list, description="Specific entities to sync")
    sync_direction: Optional[SyncDirection] = Field(None, description="Override sync direction")
    force: bool = Field(default=False, description="Force sync even if recently synced")


class IntegrationSyncResponse(BaseModel):
    """Sync response"""
    success: bool
    message: str
    sync_log_id: UUID
    items_synced: int
    items_failed: int
    errors: List[str] = Field(default_factory=list)


# ========== IMPORT FROM EXTERNAL SCHEMAS ==========
class ImportFromExternalRequest(BaseModel):
    """Import data from external system"""
    entity_type: str = Field(..., description="Type of entity (issue, test_case, user_story)")
    external_keys: List[str] = Field(..., description="External entity keys to import")
    import_related: bool = Field(default=False, description="Import related entities")
    map_users: bool = Field(default=True, description="Map external users to internal users")


class ImportFromExternalResponse(BaseModel):
    """Import response"""
    success: bool
    message: str
    imported_entities: List[Dict[str, Any]]
    failed_imports: List[Dict[str, str]]


# ========== EXPORT TO EXTERNAL SCHEMAS ==========
class ExportToExternalRequest(BaseModel):
    """Export data to external system"""
    entity_type: str = Field(..., description="Type of entity")
    entity_ids: List[UUID] = Field(..., description="Entity IDs to export")
    create_if_not_exists: bool = Field(default=True, description="Create in external system if not exists")
    update_existing: bool = Field(default=True, description="Update if already exists")


class ExportToExternalResponse(BaseModel):
    """Export response"""
    success: bool
    message: str
    exported_entities: List[Dict[str, Any]]
    failed_exports: List[Dict[str, str]]


# ========== WEBHOOK EVENT SCHEMAS ==========
class WebhookEventRequest(BaseModel):
    """Incoming webhook event"""
    event_type: str
    entity_type: str
    external_entity_id: str
    payload: Dict[str, Any]
    timestamp: datetime


class WebhookEventResponse(BaseModel):
    """Webhook response"""
    acknowledged: bool
    processed: bool
    message: str
