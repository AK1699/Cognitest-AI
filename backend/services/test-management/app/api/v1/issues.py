"""
Issues/Defects API endpoints for comprehensive defect lifecycle management
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc
from typing import List, Optional
from uuid import UUID
import logging
from datetime import datetime
import uuid as uuid_lib

from ...core.deps import get_db, get_current_active_user
from ...models.issue import Issue, IssueSeverity, IssuePriority, IssueStatus
from ...models.test_case import TestCase
from ...models.project import Project
from ...models.user import User
from ...schemas.issue import (
    IssueCreate,
    IssueUpdate,
    IssueResponse,
    IssueStatusChangeRequest,
    IssueAssignmentRequest,
    IssueCommentRequest,
    IssueMetrics,
    IssueBulkUpdateRequest,
    IssueBulkAssignRequest,
    IssueAIAnalysisRequest,
    IssueAIAnalysisResponse,
    IssueExternalSyncRequest,
    IssueExternalSyncResponse,
)

router = APIRouter()
logger = logging.getLogger(__name__)


async def verify_project_access(
    project_id: UUID,
    current_user: User,
    db: AsyncSession,
) -> Project:
    """Verify that the current user has access to the project."""
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    # Verify user has access to the organisation (owner or member)
    from sqlalchemy import text
    access_check = await db.execute(
        text("""
            SELECT 1 FROM organisations o
            LEFT JOIN user_organisations uo ON o.id = uo.organisation_id
            WHERE o.id = :org_id
            AND (o.owner_id = :user_id OR uo.user_id = :user_id)
            LIMIT 1
        """),
        {"org_id": str(project.organisation_id), "user_id": str(current_user.id)}
    )

    if not access_check.fetchone():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this project"
        )

    return project


@router.post("/", response_model=IssueResponse, status_code=status.HTTP_201_CREATED)
async def create_issue(
    issue_data: IssueCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new issue/defect.
    Can be created manually by users or automatically from test execution.
    """
    # Verify project access
    await verify_project_access(issue_data.project_id, current_user, db)

    # Convert data to dict for processing
    data = issue_data.model_dump()

    # Handle nested schemas
    if 'steps_to_reproduce' in data and data['steps_to_reproduce']:
        data['steps_to_reproduce'] = [
            step.model_dump() if hasattr(step, 'model_dump') else step
            for step in data['steps_to_reproduce']
        ]

    if 'comments' in data and data['comments']:
        data['comments'] = [
            comment.model_dump() if hasattr(comment, 'model_dump') else comment
            for comment in data['comments']
        ]

    # Initialize status history
    data['status_history'] = [{
        'changed_at': datetime.utcnow().isoformat(),
        'changed_by': str(current_user.id),
        'changed_by_name': current_user.email,
        'from_status': None,
        'to_status': data.get('status', 'new'),
        'notes': 'Issue created',
    }]

    # Create issue
    issue = Issue(**data)
    db.add(issue)
    await db.commit()
    await db.refresh(issue)

    return issue


@router.get("/", response_model=List[IssueResponse])
async def list_issues(
    project_id: UUID,
    status: Optional[IssueStatus] = Query(None, description="Filter by status"),
    severity: Optional[IssueSeverity] = Query(None, description="Filter by severity"),
    priority: Optional[IssuePriority] = Query(None, description="Filter by priority"),
    assigned_to: Optional[UUID] = Query(None, description="Filter by assignee"),
    created_by: Optional[str] = Query(None, description="Filter by creator"),
    search: Optional[str] = Query(None, description="Search in title/description"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List all issues for a project with optional filtering.
    """
    # Verify project access
    await verify_project_access(project_id, current_user, db)

    # Build query with filters
    query = select(Issue).where(Issue.project_id == project_id)

    if status:
        query = query.where(Issue.status == status)
    if severity:
        query = query.where(Issue.severity == severity)
    if priority:
        query = query.where(Issue.priority == priority)
    if assigned_to:
        query = query.where(Issue.assigned_to == assigned_to)
    if created_by:
        query = query.where(Issue.created_by == created_by)
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                Issue.title.ilike(search_pattern),
                Issue.description.ilike(search_pattern)
            )
        )

    # Add pagination and ordering
    query = query.order_by(desc(Issue.created_at)).offset(skip).limit(limit)

    result = await db.execute(query)
    issues = result.scalars().all()
    return issues


@router.get("/{issue_id}", response_model=IssueResponse)
async def get_issue(
    issue_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific issue by ID."""
    result = await db.execute(
        select(Issue).where(Issue.id == issue_id)
    )
    issue = result.scalar_one_or_none()

    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue not found"
        )

    # Verify project access
    await verify_project_access(issue.project_id, current_user, db)

    return issue


@router.put("/{issue_id}", response_model=IssueResponse)
async def update_issue(
    issue_id: UUID,
    issue_data: IssueUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an issue."""
    result = await db.execute(
        select(Issue).where(Issue.id == issue_id)
    )
    issue = result.scalar_one_or_none()

    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue not found"
        )

    # Verify project access
    await verify_project_access(issue.project_id, current_user, db)

    # Update fields
    update_data = issue_data.model_dump(exclude_unset=True)

    # Handle nested schemas
    if 'steps_to_reproduce' in update_data and update_data['steps_to_reproduce'] is not None:
        update_data['steps_to_reproduce'] = [
            step.model_dump() if hasattr(step, 'model_dump') else step
            for step in update_data['steps_to_reproduce']
        ]

    for key, value in update_data.items():
        setattr(issue, key, value)

    await db.commit()
    await db.refresh(issue)
    return issue


@router.delete("/{issue_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_issue(
    issue_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an issue."""
    result = await db.execute(
        select(Issue).where(Issue.id == issue_id)
    )
    issue = result.scalar_one_or_none()

    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue not found"
        )

    # Verify project access
    await verify_project_access(issue.project_id, current_user, db)

    await db.delete(issue)
    await db.commit()

    return None


@router.post("/{issue_id}/status", response_model=IssueResponse)
async def change_issue_status(
    issue_id: UUID,
    status_data: IssueStatusChangeRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Change the status of an issue.
    Automatically updates status history and relevant timestamps.
    """
    result = await db.execute(
        select(Issue).where(Issue.id == issue_id)
    )
    issue = result.scalar_one_or_none()

    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue not found"
        )

    # Verify project access
    await verify_project_access(issue.project_id, current_user, db)

    # Update status history
    old_status = issue.status
    status_history = issue.status_history or []
    status_history.append({
        'changed_at': datetime.utcnow().isoformat(),
        'changed_by': str(status_data.user_id),
        'changed_by_name': status_data.user_name,
        'from_status': old_status.value if old_status else None,
        'to_status': status_data.status.value,
        'notes': status_data.notes,
    })

    issue.status = status_data.status
    issue.status_history = status_history

    # Update relevant timestamps
    now = datetime.utcnow()
    if status_data.status == IssueStatus.FIXED:
        issue.resolved_at = now
    elif status_data.status == IssueStatus.CLOSED:
        issue.closed_at = now
    elif status_data.status == IssueStatus.RETESTED:
        issue.retested_at = now
    elif status_data.status == IssueStatus.REOPENED:
        # Clear resolution timestamps
        issue.resolved_at = None
        issue.closed_at = None

    await db.commit()
    await db.refresh(issue)

    # TODO: Send notification about status change
    logger.info(f"Issue {issue_id} status changed from {old_status} to {status_data.status}")

    return issue


@router.post("/{issue_id}/assign", response_model=IssueResponse)
async def assign_issue(
    issue_id: UUID,
    assignment_data: IssueAssignmentRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Assign an issue to a user."""
    result = await db.execute(
        select(Issue).where(Issue.id == issue_id)
    )
    issue = result.scalar_one_or_none()

    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue not found"
        )

    # Verify project access
    await verify_project_access(issue.project_id, current_user, db)

    # Update assignment
    issue.assigned_to = assignment_data.assigned_to
    issue.assigned_to_name = assignment_data.assigned_to_name
    issue.assigned_at = datetime.utcnow()

    # Update status to ASSIGNED if currently NEW
    if issue.status == IssueStatus.NEW:
        old_status = issue.status
        issue.status = IssueStatus.ASSIGNED

        # Update status history
        status_history = issue.status_history or []
        status_history.append({
            'changed_at': datetime.utcnow().isoformat(),
            'changed_by': str(current_user.id),
            'changed_by_name': current_user.email,
            'from_status': old_status.value,
            'to_status': IssueStatus.ASSIGNED.value,
            'notes': f'Assigned to {assignment_data.assigned_to_name}',
        })
        issue.status_history = status_history

    await db.commit()
    await db.refresh(issue)

    # TODO: Send notification if requested
    if assignment_data.notify:
        logger.info(f"Notification should be sent for issue {issue_id} assignment")

    return issue


@router.post("/{issue_id}/comment", response_model=IssueResponse)
async def add_comment(
    issue_id: UUID,
    comment_data: IssueCommentRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a comment to an issue."""
    result = await db.execute(
        select(Issue).where(Issue.id == issue_id)
    )
    issue = result.scalar_one_or_none()

    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue not found"
        )

    # Verify project access
    await verify_project_access(issue.project_id, current_user, db)

    # Add comment
    comments = issue.comments or []
    comments.append({
        'comment_id': str(uuid_lib.uuid4()),
        'user_id': str(comment_data.user_id),
        'user_name': comment_data.user_name,
        'comment': comment_data.comment,
        'created_at': datetime.utcnow().isoformat(),
        'attachments': comment_data.attachments,
    })
    issue.comments = comments

    await db.commit()
    await db.refresh(issue)

    return issue


@router.get("/project/{project_id}/metrics", response_model=IssueMetrics)
async def get_issue_metrics(
    project_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get issue metrics for a project including:
    - Total, open, closed, in-progress counts
    - Distribution by severity, priority, status
    - Average resolution time
    - Defect density
    """
    # Verify project access
    await verify_project_access(project_id, current_user, db)

    # Get total counts
    total_result = await db.execute(
        select(func.count(Issue.id)).where(Issue.project_id == project_id)
    )
    total_issues = total_result.scalar() or 0

    # Get counts by status
    open_result = await db.execute(
        select(func.count(Issue.id)).where(
            and_(
                Issue.project_id == project_id,
                Issue.status.in_([IssueStatus.NEW, IssueStatus.ASSIGNED, IssueStatus.REOPENED])
            )
        )
    )
    open_issues = open_result.scalar() or 0

    closed_result = await db.execute(
        select(func.count(Issue.id)).where(
            and_(Issue.project_id == project_id, Issue.status == IssueStatus.CLOSED)
        )
    )
    closed_issues = closed_result.scalar() or 0

    in_progress_result = await db.execute(
        select(func.count(Issue.id)).where(
            and_(Issue.project_id == project_id, Issue.status == IssueStatus.IN_PROGRESS)
        )
    )
    in_progress_issues = in_progress_result.scalar() or 0

    # Get distribution by severity
    by_severity = {}
    for severity in IssueSeverity:
        result = await db.execute(
            select(func.count(Issue.id)).where(
                and_(Issue.project_id == project_id, Issue.severity == severity)
            )
        )
        by_severity[severity.value] = result.scalar() or 0

    # Get distribution by priority
    by_priority = {}
    for priority in IssuePriority:
        result = await db.execute(
            select(func.count(Issue.id)).where(
                and_(Issue.project_id == project_id, Issue.priority == priority)
            )
        )
        by_priority[priority.value] = result.scalar() or 0

    # Get distribution by status
    by_status = {}
    for issue_status in IssueStatus:
        result = await db.execute(
            select(func.count(Issue.id)).where(
                and_(Issue.project_id == project_id, Issue.status == issue_status)
            )
        )
        by_status[issue_status.value] = result.scalar() or 0

    # Calculate average resolution time (simplified)
    resolution_time_result = await db.execute(
        select(
            func.avg(
                func.extract('epoch', Issue.resolved_at) - func.extract('epoch', Issue.created_at)
            ) / 3600  # Convert to hours
        ).where(
            and_(Issue.project_id == project_id, Issue.resolved_at.isnot(None))
        )
    )
    avg_resolution_time = resolution_time_result.scalar()

    return IssueMetrics(
        total_issues=total_issues,
        open_issues=open_issues,
        closed_issues=closed_issues,
        in_progress_issues=in_progress_issues,
        by_severity=by_severity,
        by_priority=by_priority,
        by_status=by_status,
        avg_resolution_time_hours=avg_resolution_time,
        defect_density=None,  # TODO: Calculate based on test cases or LOC
    )


@router.post("/bulk-update", response_model=List[IssueResponse])
async def bulk_update_issues(
    bulk_data: IssueBulkUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Bulk update multiple issues at once."""
    # Fetch all issues
    result = await db.execute(
        select(Issue).where(Issue.id.in_(bulk_data.issue_ids))
    )
    issues = result.scalars().all()

    if not issues:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No issues found with the provided IDs"
        )

    # Verify access to all issues
    for issue in issues:
        await verify_project_access(issue.project_id, current_user, db)

    # Update all issues
    update_data = bulk_data.update_data.model_dump(exclude_unset=True)

    for issue in issues:
        for key, value in update_data.items():
            setattr(issue, key, value)

    await db.commit()

    # Refresh all issues
    for issue in issues:
        await db.refresh(issue)

    return issues


@router.post("/bulk-assign", response_model=List[IssueResponse])
async def bulk_assign_issues(
    bulk_data: IssueBulkAssignRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Bulk assign multiple issues to a user."""
    # Fetch all issues
    result = await db.execute(
        select(Issue).where(Issue.id.in_(bulk_data.issue_ids))
    )
    issues = result.scalars().all()

    if not issues:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No issues found with the provided IDs"
        )

    # Verify access to all issues
    for issue in issues:
        await verify_project_access(issue.project_id, current_user, db)

    # Assign all issues
    now = datetime.utcnow()
    for issue in issues:
        issue.assigned_to = bulk_data.assigned_to
        issue.assigned_to_name = bulk_data.assigned_to_name
        issue.assigned_at = now

        # Update status if NEW
        if issue.status == IssueStatus.NEW:
            issue.status = IssueStatus.ASSIGNED

    await db.commit()

    # Refresh all issues
    for issue in issues:
        await db.refresh(issue)

    return issues


@router.post("/{issue_id}/ai-analysis", response_model=IssueAIAnalysisResponse)
async def ai_analyze_issue(
    issue_id: UUID,
    request: IssueAIAnalysisRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Analyze an issue using AI to:
    - Perform root cause analysis
    - Generate remediation suggestions
    - Find similar issues
    """
    result = await db.execute(
        select(Issue).where(Issue.id == issue_id)
    )
    issue = result.scalar_one_or_none()

    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue not found"
        )

    # Verify project access
    await verify_project_access(issue.project_id, current_user, db)

    # TODO: Implement AI analysis using AI service
    # For now, return placeholder data
    logger.info(f"AI analysis requested for issue {issue_id}")

    return IssueAIAnalysisResponse(
        root_cause_analysis="AI root cause analysis will be implemented",
        remediation_suggestions=["Suggestion 1", "Suggestion 2"],
        similar_issues=[],
        confidence="medium",
    )


@router.post("/{issue_id}/sync-external", response_model=IssueExternalSyncResponse)
async def sync_with_external_system(
    issue_id: UUID,
    sync_request: IssueExternalSyncRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Sync issue with external system (JIRA, GitHub, TestRail).
    Can create new issue in external system or link to existing one.
    """
    result = await db.execute(
        select(Issue).where(Issue.id == issue_id)
    )
    issue = result.scalar_one_or_none()

    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue not found"
        )

    # Verify project access
    await verify_project_access(issue.project_id, current_user, db)

    # TODO: Implement external system sync
    logger.info(f"External sync requested for issue {issue_id} with {sync_request.external_system}")

    return IssueExternalSyncResponse(
        success=True,
        external_issue_key="EXT-123",
        external_url="https://external-system.com/issue/EXT-123",
        message="External sync will be implemented",
    )
