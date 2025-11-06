"""
External Integration API endpoints for managing JIRA, GitHub, TestRail integrations
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc
from typing import List, Optional
from uuid import UUID
import logging
from datetime import datetime

from app.core.deps import get_db, get_current_active_user
from app.models.integration import Integration, IntegrationSyncLog, IntegrationType, IntegrationStatus
from app.models.project import Project
from app.models.organisation import Organisation
from app.models.user import User
from app.schemas.integration import (
    IntegrationCreate,
    IntegrationUpdate,
    IntegrationResponse,
    IntegrationTestRequest,
    IntegrationTestResponse,
    IntegrationSyncRequest,
    IntegrationSyncResponse,
    IntegrationSyncLogResponse,
    ImportFromExternalRequest,
    ImportFromExternalResponse,
    ExportToExternalRequest,
    ExportToExternalResponse,
    WebhookEventRequest,
    WebhookEventResponse,
)

router = APIRouter()
logger = logging.getLogger(__name__)


async def verify_organisation_access(
    organisation_id: UUID,
    current_user: User,
    db: AsyncSession,
) -> Organisation:
    """Verify that the current user has access to the organisation."""
    result = await db.execute(
        select(Organisation).where(Organisation.id == organisation_id)
    )
    organisation = result.scalar_one_or_none()

    if not organisation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organisation not found"
        )

    # Verify user has access
    from sqlalchemy import text
    access_check = await db.execute(
        text("""
            SELECT 1 FROM organisations o
            LEFT JOIN user_organisations uo ON o.id = uo.organisation_id
            WHERE o.id = :org_id
            AND (o.owner_id = :user_id OR uo.user_id = :user_id)
            LIMIT 1
        """),
        {"org_id": str(organisation_id), "user_id": str(current_user.id)}
    )

    if not access_check.fetchone():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this organisation"
        )

    return organisation


@router.post("/", response_model=IntegrationResponse, status_code=status.HTTP_201_CREATED)
async def create_integration(
    integration_data: IntegrationCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new external tool integration.
    Can be organization-level or project-level.
    """
    # Verify organisation access
    await verify_organisation_access(integration_data.organisation_id, current_user, db)

    # If project_id is provided, verify project access
    if integration_data.project_id:
        result = await db.execute(
            select(Project).where(Project.id == integration_data.project_id)
        )
        project = result.scalar_one_or_none()
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )

    # Convert data to dict
    data = integration_data.model_dump()

    # TODO: Encrypt sensitive data (api_token, api_key) before storing
    # For now, storing as-is (should implement encryption in production)

    # Create integration
    integration = Integration(**data)
    db.add(integration)
    await db.commit()
    await db.refresh(integration)

    return integration


@router.get("/", response_model=List[IntegrationResponse])
async def list_integrations(
    organisation_id: Optional[UUID] = Query(None, description="Filter by organisation"),
    project_id: Optional[UUID] = Query(None, description="Filter by project"),
    integration_type: Optional[IntegrationType] = Query(None, description="Filter by type"),
    status: Optional[IntegrationStatus] = Query(None, description="Filter by status"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List all integrations accessible by the current user.
    Can filter by organisation, project, type, or status.
    """
    # Build query
    query = select(Integration)

    # Filter by user's organisations
    from sqlalchemy import text
    user_orgs_result = await db.execute(
        text("""
            SELECT organisation_id FROM user_organisations
            WHERE user_id = :user_id
            UNION
            SELECT id FROM organisations WHERE owner_id = :user_id
        """),
        {"user_id": str(current_user.id)}
    )
    user_org_ids = [row[0] for row in user_orgs_result.fetchall()]

    if not user_org_ids:
        return []

    query = query.where(Integration.organisation_id.in_([UUID(org_id) for org_id in user_org_ids]))

    # Apply filters
    if organisation_id:
        query = query.where(Integration.organisation_id == organisation_id)
    if project_id:
        query = query.where(Integration.project_id == project_id)
    if integration_type:
        query = query.where(Integration.integration_type == integration_type)
    if status:
        query = query.where(Integration.status == status)

    query = query.order_by(desc(Integration.created_at))

    result = await db.execute(query)
    integrations = result.scalars().all()
    return integrations


@router.get("/{integration_id}", response_model=IntegrationResponse)
async def get_integration(
    integration_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific integration by ID."""
    result = await db.execute(
        select(Integration).where(Integration.id == integration_id)
    )
    integration = result.scalar_one_or_none()

    if not integration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Integration not found"
        )

    # Verify access
    await verify_organisation_access(integration.organisation_id, current_user, db)

    return integration


@router.put("/{integration_id}", response_model=IntegrationResponse)
async def update_integration(
    integration_id: UUID,
    integration_data: IntegrationUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an integration."""
    result = await db.execute(
        select(Integration).where(Integration.id == integration_id)
    )
    integration = result.scalar_one_or_none()

    if not integration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Integration not found"
        )

    # Verify access
    await verify_organisation_access(integration.organisation_id, current_user, db)

    # Update fields
    update_data = integration_data.model_dump(exclude_unset=True)

    # TODO: Encrypt sensitive data if being updated

    for key, value in update_data.items():
        setattr(integration, key, value)

    await db.commit()
    await db.refresh(integration)

    return integration


@router.delete("/{integration_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_integration(
    integration_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an integration."""
    result = await db.execute(
        select(Integration).where(Integration.id == integration_id)
    )
    integration = result.scalar_one_or_none()

    if not integration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Integration not found"
        )

    # Verify access
    await verify_organisation_access(integration.organisation_id, current_user, db)

    await db.delete(integration)
    await db.commit()

    return None


@router.post("/test-connection", response_model=IntegrationTestResponse)
async def test_integration_connection(
    test_request: IntegrationTestRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Test connection to an external system without saving the integration.
    Useful for validating credentials before creating an integration.
    """
    try:
        if test_request.integration_type == IntegrationType.JIRA:
            from app.services.jira_integration_service import get_jira_service
            service = await get_jira_service(
                jira_url=test_request.base_url,
                jira_username=test_request.username or "",
                jira_api_token=test_request.api_token,
            )
            # Try fetching projects as a test
            projects = await service.fetch_user_stories(
                project_key=test_request.config.get("project_key", "TEST"),
                max_results=1
            )
            return IntegrationTestResponse(
                success=True,
                message="JIRA connection successful",
                details={"test": "passed"}
            )

        elif test_request.integration_type == IntegrationType.GITHUB:
            from app.services.github_integration_service import get_github_service
            owner = test_request.config.get("owner", "")
            repo = test_request.config.get("repo", "")
            service = await get_github_service(
                github_token=test_request.api_token,
                owner=owner,
                repo=repo,
            )
            result = await service.test_connection()
            return IntegrationTestResponse(
                success=result["success"],
                message=result["message"],
                details=result["details"]
            )

        elif test_request.integration_type == IntegrationType.TESTRAIL:
            from app.services.testrail_integration_service import get_testrail_service
            service = await get_testrail_service(
                testrail_url=test_request.base_url,
                username=test_request.username or "",
                api_key=test_request.api_token,
            )
            result = await service.test_connection()
            return IntegrationTestResponse(
                success=result["success"],
                message=result["message"],
                details=result["details"]
            )

        else:
            return IntegrationTestResponse(
                success=False,
                message=f"Integration type {test_request.integration_type} not yet supported",
                details={}
            )

    except Exception as e:
        logger.error(f"Error testing connection: {e}")
        return IntegrationTestResponse(
            success=False,
            message=f"Connection test failed: {str(e)}",
            details={}
        )


@router.post("/{integration_id}/test", response_model=IntegrationTestResponse)
async def test_existing_integration(
    integration_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Test connection of an existing integration."""
    result = await db.execute(
        select(Integration).where(Integration.id == integration_id)
    )
    integration = result.scalar_one_or_none()

    if not integration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Integration not found"
        )

    # Verify access
    await verify_organisation_access(integration.organisation_id, current_user, db)

    # Test connection
    test_request = IntegrationTestRequest(
        integration_type=integration.integration_type,
        base_url=integration.base_url,
        username=integration.username,
        api_token=integration.api_token,  # TODO: Decrypt if encrypted
        api_key=integration.api_key,
        config=integration.config,
    )

    return await test_integration_connection(test_request, current_user, db)


@router.post("/{integration_id}/sync", response_model=IntegrationSyncResponse)
async def manual_sync(
    integration_id: UUID,
    sync_request: IntegrationSyncRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Trigger a manual sync operation.
    Can sync specific entities or all entities based on configuration.
    """
    result = await db.execute(
        select(Integration).where(Integration.id == integration_id)
    )
    integration = result.scalar_one_or_none()

    if not integration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Integration not found"
        )

    # Verify access
    await verify_organisation_access(integration.organisation_id, current_user, db)

    # Create sync log
    sync_log = IntegrationSyncLog(
        integration_id=integration_id,
        sync_type="manual",
        sync_direction=sync_request.sync_direction.value if sync_request.sync_direction else integration.sync_direction.value,
        status="in_progress",
        entity_type=sync_request.entity_type or "all",
        triggered_by=current_user.email,
    )
    db.add(sync_log)
    await db.commit()
    await db.refresh(sync_log)

    # TODO: Implement actual sync logic here
    # This would involve:
    # 1. Fetching data from external system
    # 2. Mapping fields
    # 3. Creating/updating records in Cognitest
    # 4. Handling errors
    # 5. Updating sync log

    # For now, return placeholder response
    logger.info(f"Manual sync triggered for integration {integration_id}")

    # Update sync log as completed
    sync_log.status = "success"
    sync_log.completed_at = datetime.utcnow()
    sync_log.items_processed = "0"
    sync_log.items_succeeded = "0"
    sync_log.items_failed = "0"
    await db.commit()

    return IntegrationSyncResponse(
        success=True,
        message="Sync operation initiated (implementation pending)",
        sync_log_id=sync_log.id,
        items_synced=0,
        items_failed=0,
        errors=[]
    )


@router.post("/{integration_id}/import", response_model=ImportFromExternalResponse)
async def import_from_external(
    integration_id: UUID,
    import_request: ImportFromExternalRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Import specific entities from external system.
    Useful for selectively importing issues, test cases, or user stories.
    """
    result = await db.execute(
        select(Integration).where(Integration.id == integration_id)
    )
    integration = result.scalar_one_or_none()

    if not integration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Integration not found"
        )

    # Verify access
    await verify_organisation_access(integration.organisation_id, current_user, db)

    # TODO: Implement import logic
    logger.info(f"Import requested from integration {integration_id}")

    return ImportFromExternalResponse(
        success=True,
        message="Import operation initiated (implementation pending)",
        imported_entities=[],
        failed_imports=[]
    )


@router.post("/{integration_id}/export", response_model=ExportToExternalResponse)
async def export_to_external(
    integration_id: UUID,
    export_request: ExportToExternalRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Export specific entities to external system.
    Useful for pushing test cases, issues, or results to external tools.
    """
    result = await db.execute(
        select(Integration).where(Integration.id == integration_id)
    )
    integration = result.scalar_one_or_none()

    if not integration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Integration not found"
        )

    # Verify access
    await verify_organisation_access(integration.organisation_id, current_user, db)

    # TODO: Implement export logic
    logger.info(f"Export requested to integration {integration_id}")

    return ExportToExternalResponse(
        success=True,
        message="Export operation initiated (implementation pending)",
        exported_entities=[],
        failed_exports=[]
    )


@router.get("/{integration_id}/logs", response_model=List[IntegrationSyncLogResponse])
async def get_sync_logs(
    integration_id: UUID,
    limit: int = Query(50, ge=1, le=500),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get sync logs for an integration.
    Useful for auditing and debugging sync operations.
    """
    result = await db.execute(
        select(Integration).where(Integration.id == integration_id)
    )
    integration = result.scalar_one_or_none()

    if not integration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Integration not found"
        )

    # Verify access
    await verify_organisation_access(integration.organisation_id, current_user, db)

    # Fetch logs
    logs_result = await db.execute(
        select(IntegrationSyncLog)
        .where(IntegrationSyncLog.integration_id == integration_id)
        .order_by(desc(IntegrationSyncLog.started_at))
        .limit(limit)
    )
    logs = logs_result.scalars().all()

    return logs


@router.post("/webhook", response_model=WebhookEventResponse)
async def handle_webhook(
    webhook_event: WebhookEventRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Handle incoming webhook events from external systems.
    This endpoint is called by external systems when events occur.
    """
    # TODO: Implement webhook handling
    # This would involve:
    # 1. Validating webhook signature
    # 2. Finding the correct integration
    # 3. Processing the event
    # 4. Updating relevant entities

    logger.info(f"Webhook received: {webhook_event.event_type} for {webhook_event.entity_type}")

    return WebhookEventResponse(
        acknowledged=True,
        processed=False,
        message="Webhook handling implementation pending"
    )
