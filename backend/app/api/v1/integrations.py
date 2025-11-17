"""
External Integration API endpoints for managing JIRA, GitHub, TestRail integrations
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc
from typing import List, Optional, Dict, Any
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


@router.get("/{integration_id}/fetch-items")
async def fetch_available_items(
    integration_id: UUID,
    entity_type: str = Query("issue", description="Type: issue, test_case, user_story"),
    project_key: Optional[str] = Query(None, description="External project key"),
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    max_results: int = Query(50, le=200),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch available items from external system for selection before import.
    Supports JIRA, TestRail, and GitHub.
    """
    # Get integration configuration
    result = await db.execute(
        select(Integration).where(Integration.id == integration_id)
    )
    integration = result.scalar_one_or_none()

    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")

    # Verify permissions
    await verify_organisation_access(integration.organisation_id, current_user, db)

    try:
        # Route to appropriate service
        if integration.integration_type == IntegrationType.JIRA:
            from app.services.jira_integration_service import get_jira_service
            service = await get_jira_service(
                jira_url=integration.base_url,
                jira_username=integration.username or "",
                jira_api_token=integration.api_token,
            )

            items = await service.fetch_user_stories(
                project_key=project_key or integration.config.get("default_project", ""),
                max_results=max_results,
            )

            # Transform to standard format
            return [
                {
                    "key": item.get("key"),
                    "id": item.get("id"),
                    "summary": item.get("fields", {}).get("summary", ""),
                    "description": item.get("fields", {}).get("description", ""),
                    "status": item.get("fields", {}).get("status", {}).get("name"),
                    "type": item.get("fields", {}).get("issuetype", {}).get("name"),
                    "assignee": item.get("fields", {}).get("assignee", {}).get("displayName") if item.get("fields", {}).get("assignee") else None,
                    "labels": item.get("fields", {}).get("labels", []),
                }
                for item in items
            ]

        elif integration.integration_type == IntegrationType.GITHUB:
            from app.services.github_integration_service import get_github_service
            owner = integration.config.get("owner", "")
            repo = integration.config.get("repo", "")
            service = await get_github_service(
                github_token=integration.api_token,
                owner=owner,
                repo=repo,
            )

            issues = await service.fetch_issues(
                state=status_filter or "open",
                labels=[],
                max_results=max_results,
            )

            return [
                {
                    "key": f"#{issue.get('number')}",
                    "id": str(issue.get("number")),
                    "summary": issue.get("title", ""),
                    "description": issue.get("body", ""),
                    "status": issue.get("state", "").capitalize(),
                    "type": "Issue",
                    "assignee": issue.get("assignee", {}).get("login") if issue.get("assignee") else None,
                    "labels": [label.get("name") for label in issue.get("labels", [])],
                }
                for issue in issues
            ]

        else:
            raise HTTPException(
                status_code=400,
                detail=f"Integration type {integration.integration_type} not supported for fetching items"
            )

    except Exception as e:
        logger.error(f"Error fetching items from {integration.integration_type}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch items: {str(e)}"
        )


@router.post("/import-and-generate")
async def import_and_generate_test_plan(
    data: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Import items from external system and auto-generate test plan with suites and cases.

    Request body:
    {
        "integration_id": "uuid",
        "project_id": "uuid",
        "entity_type": "issue" | "test_case" | "user_story",
        "external_keys": ["PROJ-123", "PROJ-124"],
        "test_plan_name": "Optional custom name",
        "generate_suites": true,
        "generate_cases": true
    }
    """
    integration_id = data.get("integration_id")
    project_id = data.get("project_id")
    entity_type = data.get("entity_type", "issue")
    external_keys = data.get("external_keys", [])
    test_plan_name = data.get("test_plan_name")
    generate_suites = data.get("generate_suites", True)
    generate_cases = data.get("generate_cases", True)

    if not integration_id or not project_id or not external_keys:
        raise HTTPException(
            status_code=400,
            detail="integration_id, project_id, and external_keys are required"
        )

    # Get integration
    result = await db.execute(
        select(Integration).where(Integration.id == UUID(integration_id))
    )
    integration = result.scalar_one_or_none()

    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")

    # Verify permissions
    await verify_organisation_access(integration.organisation_id, current_user, db)

    try:
        # Step 1: Import items from external system
        logger.info(f"Importing {len(external_keys)} items from {integration.integration_type}")

        imported_entities = []
        failed_imports = []

        # Route to appropriate service
        if integration.integration_type == IntegrationType.JIRA:
            from app.services.jira_integration_service import get_jira_service
            service = await get_jira_service(
                jira_url=integration.base_url,
                jira_username=integration.username or "",
                jira_api_token=integration.api_token,
            )

            for key in external_keys:
                try:
                    issue = await service.fetch_issue_by_key(key)
                    imported_entities.append({
                        "key": key,
                        "summary": issue.get("fields", {}).get("summary"),
                        "description": issue.get("fields", {}).get("description", ""),
                        "type": issue.get("fields", {}).get("issuetype", {}).get("name"),
                        "status": issue.get("fields", {}).get("status", {}).get("name"),
                    })
                except Exception as e:
                    logger.error(f"Failed to import {key}: {e}")
                    failed_imports.append({"key": key, "error": str(e)})

        elif integration.integration_type == IntegrationType.GITHUB:
            from app.services.github_integration_service import get_github_service
            owner = integration.config.get("owner", "")
            repo = integration.config.get("repo", "")
            service = await get_github_service(
                github_token=integration.api_token,
                owner=owner,
                repo=repo,
            )

            for key in external_keys:
                try:
                    issue_number = int(key.replace("#", ""))
                    issue = await service.fetch_issue(issue_number)
                    imported_entities.append({
                        "key": key,
                        "summary": issue.get("title"),
                        "description": issue.get("body", ""),
                        "type": "Issue",
                        "status": issue.get("state"),
                    })
                except Exception as e:
                    logger.error(f"Failed to import {key}: {e}")
                    failed_imports.append({"key": key, "error": str(e)})

        # Step 2: Combine all descriptions for AI analysis
        combined_description = f"# Test Plan: {test_plan_name or 'Imported Requirements'}\n\n"
        combined_description += "## Requirements from External System\n\n"

        for idx, entity in enumerate(imported_entities, 1):
            combined_description += f"### {idx}. {entity['summary']} ({entity['key']})\n"
            combined_description += f"**Type**: {entity['type']}\n"
            combined_description += f"**Status**: {entity['status']}\n\n"
            if entity.get("description"):
                combined_description += f"{entity['description']}\n\n"
            combined_description += "---\n\n"

        # Step 3: Generate comprehensive test plan using AI
        logger.info("Generating comprehensive test plan with AI")

        from app.services.ai_test_plan_service import get_ai_test_plan_service
        ai_service = await get_ai_test_plan_service()

        plan_data = await ai_service.generate_comprehensive_plan(
            description=combined_description,
            features=[entity["summary"] for entity in imported_entities],
            platforms=data.get("platforms", ["Web", "Mobile"]),
            include_performance=True,
            include_security=True,
        )

        # Step 4: Create test plan in database
        from app.models.test_management import TestPlan, TestSuite, TestCase, GenerationType, TestCasePriority, TestCaseStatus

        test_plan = TestPlan(
            project_id=UUID(project_id),
            name=test_plan_name or plan_data.get("test_plan_name", "Imported Test Plan"),
            description=plan_data.get("description", ""),
            objectives=plan_data.get("objectives", []),
            scope=plan_data.get("scope", {}),
            test_strategy=plan_data.get("test_strategy", {}),
            schedule=plan_data.get("schedule", {}),
            resources=plan_data.get("resources", {}),
            risks=plan_data.get("risks", []),
            deliverables=plan_data.get("deliverables", []),
            tags=["imported", integration.integration_type.value],
            generated_by=GenerationType.AI.value,
            ai_generated=True,
            created_by=current_user.email,
        )
        db.add(test_plan)
        await db.flush()

        # Step 5: Create test suites if requested
        test_suites = []
        test_cases_count = 0

        if generate_suites:
            test_suites_data = plan_data.get("test_suites", [])

            for suite_data in test_suites_data:
                test_suite = TestSuite(
                    project_id=UUID(project_id),
                    test_plan_id=test_plan.id,
                    name=suite_data.get("name", "Test Suite"),
                    description=suite_data.get("description", ""),
                    tags=suite_data.get("tags", []),
                    generated_by=GenerationType.AI.value,
                    ai_generated=True,
                    created_by=current_user.email,
                )
                db.add(test_suite)
                await db.flush()
                test_suites.append(test_suite)

                # Step 6: Create test cases if requested
                if generate_cases:
                    test_cases_data = suite_data.get("test_cases", [])

                    for case_data in test_cases_data:
                        # Parse steps
                        steps = []
                        steps_data = case_data.get("steps", [])
                        for step in steps_data:
                            steps.append({
                                "step_number": step.get("step_number", len(steps) + 1),
                                "action": step.get("action", ""),
                                "expected_result": step.get("expected_result", ""),
                            })

                        test_case = TestCase(
                            project_id=UUID(project_id),
                            test_suite_id=test_suite.id,
                            title=case_data.get("name", "Test Case"),
                            description=case_data.get("description", ""),
                            steps=steps,
                            expected_result=case_data.get("expected_result", ""),
                            priority=TestCasePriority[case_data.get("priority", "medium").upper()].value,
                            status=TestCaseStatus.DRAFT.value,
                            tags=case_data.get("tags", []),
                            generated_by=GenerationType.AI.value,
                            ai_generated=True,
                            created_by=current_user.email,
                        )
                        db.add(test_case)
                        test_cases_count += 1

        await db.commit()

        # Step 7: Return comprehensive result
        return {
            "success": True,
            "message": f"Successfully imported {len(imported_entities)} items and generated test plan",
            "import_result": {
                "success": len(failed_imports) == 0,
                "imported_entities": imported_entities,
                "failed_imports": failed_imports,
            },
            "test_plan": {
                "id": str(test_plan.id),
                "name": test_plan.name,
                "description": test_plan.description,
            },
            "test_suites": [
                {
                    "id": str(suite.id),
                    "name": suite.name,
                    "description": suite.description,
                }
                for suite in test_suites
            ],
            "statistics": {
                "items_imported": len(imported_entities),
                "items_failed": len(failed_imports),
                "test_suites_created": len(test_suites),
                "test_cases_created": test_cases_count,
                "test_plan_id": str(test_plan.id),
            },
        }

    except Exception as e:
        logger.error(f"Error in import-and-generate workflow: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to import and generate test plan: {str(e)}"
        )
