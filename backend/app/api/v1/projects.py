from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from typing import List
from uuid import UUID

from app.core.deps import get_db, get_current_active_user
from app.models.project import Project
from app.models.organisation import Organisation
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse

router = APIRouter()

async def is_user_org_admin(user_id: UUID, organisation_id: UUID, db: AsyncSession) -> bool:
    """
    Check if a user has the owner or admin role for an organization.
    This grants automatic access to all projects in the organization.
    """
    result = await db.execute(
        text("""
            SELECT 1 FROM user_project_roles upr
            INNER JOIN project_roles pr ON upr.role_id = pr.id
            WHERE pr.organisation_id = :org_id
              AND pr.role_type IN ('owner', 'admin')
              AND upr.user_id = :user_id
            LIMIT 1
        """),
        {"org_id": str(organisation_id), "user_id": str(user_id)}
    )
    return result.fetchone() is not None

@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new project within an organisation.
    """
    # Verify user owns the organisation
    result = await db.execute(
        select(Organisation).where(
            Organisation.id == project_data.organisation_id,
            Organisation.owner_id == current_user.id
        )
    )
    organisation = result.scalar_one_or_none()

    if not organisation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organisation not found or you don't have permission"
        )

    # Check if project limit is reached
    from app.api.v1.subscription import check_organisation_limit
    limit_check = await check_organisation_limit(db, project_data.organisation_id, "projects")
    if limit_check.limit_reached:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=limit_check.message
        )

    # Create project
    project = Project(**project_data.model_dump())
    db.add(project)
    await db.commit()
    await db.refresh(project)

    # Automatically assign the creator to the project with Owner role
    # First, get the Owner role for this organisation
    owner_role_result = await db.execute(
        text("""
            SELECT id FROM project_roles
            WHERE organisation_id = :org_id
              AND role_type = 'owner'
              AND is_system_role = true
            LIMIT 1
        """),
        {"org_id": str(project.organisation_id)}
    )
    owner_role = owner_role_result.fetchone()

    if owner_role:
        # Insert user-project-role assignment
        from uuid import uuid4
        await db.execute(
            text("""
                INSERT INTO user_project_roles (id, user_id, project_id, role_id, assigned_by)
                VALUES (:id, :user_id, :project_id, :role_id, :assigned_by)
                ON CONFLICT DO NOTHING
            """),
            {
                "id": str(uuid4()),
                "user_id": str(project.owner_id),
                "project_id": str(project.id),
                "role_id": str(owner_role[0]),
                "assigned_by": str(current_user.id)
            }
        )
        await db.commit()

    return project

@router.get("/", response_model=List[ProjectResponse])
async def list_projects(
    organisation_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List projects for an organisation.
    - Owners: See all projects in the organisation
    - Admins (with owner or admin role): See all projects in the organisation
    - Members: Only see projects they're assigned to
    """

    # Check if user is the owner of the organisation
    org_result = await db.execute(
        select(Organisation).where(Organisation.id == organisation_id)
    )
    organisation = org_result.scalar_one_or_none()

    if not organisation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organisation not found"
        )

    is_owner = organisation.owner_id == current_user.id
    is_admin = await is_user_org_admin(current_user.id, organisation_id, db)

    # Verify user has access to the organisation (owner or member)
    if not is_owner:
        access_check = await db.execute(
            text("""
                SELECT 1 FROM user_organisations
                WHERE organisation_id = :org_id AND user_id = :user_id
                LIMIT 1
            """),
            {"org_id": str(organisation_id), "user_id": str(current_user.id)}
        )
        if not access_check.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organisation not found or you don't have permission"
            )

    # Get projects based on user role
    if is_owner or is_admin:
        # Owners and admins see all projects in the organisation
        result = await db.execute(
            select(Project).where(Project.organisation_id == organisation_id)
        )
    else:
        # Members only see projects they're assigned to
        result = await db.execute(
            text("""
                SELECT p.* FROM projects p
                INNER JOIN user_projects up ON p.id = up.project_id
                WHERE p.organisation_id = :org_id AND up.user_id = :user_id
            """),
            {"org_id": str(organisation_id), "user_id": str(current_user.id)}
        )
        # Fetch Project objects manually since we used raw SQL
        project_rows = result.fetchall()
        project_ids = [row[0] for row in project_rows] if project_rows else []

        if not project_ids:
            return []

        result = await db.execute(
            select(Project).where(Project.id.in_(project_ids))
        )

    projects = result.scalars().all()
    return projects

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a specific project by ID.
    - Owners: Can access any project in their organisation
    - Admins (with owner or admin role): Can access any project in their organisation
    - Members: Can only access projects they're assigned to
    """
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    # Get organisation to check ownership
    org_result = await db.execute(
        select(Organisation).where(Organisation.id == project.organisation_id)
    )
    organisation = org_result.scalar_one_or_none()

    if not organisation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organisation not found"
        )

    is_owner = organisation.owner_id == current_user.id
    is_admin = await is_user_org_admin(current_user.id, project.organisation_id, db)

    # Verify user has access to the project
    if is_owner or is_admin:
        # Owners and admins have access to all projects in their organisation
        return project
    else:
        # Members must be assigned to the project
        access_check = await db.execute(
            text("""
                SELECT 1 FROM user_projects
                WHERE project_id = :project_id AND user_id = :user_id
                LIMIT 1
            """),
            {"project_id": str(project_id), "user_id": str(current_user.id)}
        )

        if not access_check.fetchone():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to access this project"
            )

    return project

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: UUID,
    project_data: ProjectUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update a project.
    """
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    # Verify user owns the organisation
    result = await db.execute(
        select(Organisation).where(
            Organisation.id == project.organisation_id,
            Organisation.owner_id == current_user.id
        )
    )
    organisation = result.scalar_one_or_none()

    if not organisation:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this project"
        )

    for key, value in project_data.model_dump(exclude_unset=True).items():
        setattr(project, key, value)

    await db.commit()
    await db.refresh(project)
    return project

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a project.
    """
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    # Verify user owns the organisation
    result = await db.execute(
        select(Organisation).where(
            Organisation.id == project.organisation_id,
            Organisation.owner_id == current_user.id
        )
    )
    organisation = result.scalar_one_or_none()

    if not organisation:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this project"
        )

    try:
        # Clean up tables without CASCADE - use raw connection for independent transactions
        cleanup_queries = [
            "DELETE FROM user_projects WHERE project_id = :project_id",
            "DELETE FROM agent_performance WHERE project_id = :project_id",
            "DELETE FROM ai_feedback WHERE project_id = :project_id",
            "DELETE FROM document_chunks WHERE document_id IN (SELECT id FROM document_knowledge WHERE project_id = :project_id)",
            "DELETE FROM document_knowledge WHERE project_id = :project_id",
            "DELETE FROM organisation_memory WHERE project_id = :project_id",
        ]
        
        for query in cleanup_queries:
            try:
                await db.execute(text(query), {"project_id": str(project_id)})
            except Exception:
                # Rollback this specific query error but continue
                await db.rollback()
                # Re-fetch the project since we rolled back
                result = await db.execute(
                    select(Project).where(Project.id == project_id)
                )
                project = result.scalar_one_or_none()
                if not project:
                    return None  # Already deleted somehow

        # Now delete the project (CASCADE will handle the rest)
        await db.delete(project)
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete project: {str(e)}"
        )

    return None


@router.post("/{project_id}/members", status_code=status.HTTP_201_CREATED)
async def assign_user_to_project(
    project_id: UUID,
    user_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Assign a user to a project.
    Only organisation owners can assign users.
    """
    # Get project
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    # Verify current user owns the organisation
    org_result = await db.execute(
        select(Organisation).where(Organisation.id == project.organisation_id)
    )
    organisation = org_result.scalar_one_or_none()

    if not organisation or organisation.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organisation owners can assign users to projects"
        )

    # Verify the user being assigned is a member of the organisation
    from sqlalchemy import text
    member_check = await db.execute(
        text("""
            SELECT 1 FROM user_organisations
            WHERE user_id = :user_id AND organisation_id = :org_id
            LIMIT 1
        """),
        {"user_id": str(user_id), "org_id": str(project.organisation_id)}
    )

    if not member_check.fetchone():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not a member of this organisation"
        )

    # Assign user to project
    try:
        await db.execute(
            text("""
                INSERT INTO user_projects (user_id, project_id, role, assigned_by)
                VALUES (:user_id, :project_id, :role, :assigned_by)
                ON CONFLICT (user_id, project_id) DO NOTHING
            """),
            {
                "user_id": str(user_id),
                "project_id": str(project_id),
                "role": "member",
                "assigned_by": str(current_user.id)
            }
        )
        await db.commit()
        return {"message": "User assigned to project successfully"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to assign user: {str(e)}"
        )


@router.delete("/{project_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_user_from_project(
    project_id: UUID,
    user_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Remove a user from a project.
    Only organisation owners can remove users.
    """
    # Get project
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    # Verify current user owns the organisation
    org_result = await db.execute(
        select(Organisation).where(Organisation.id == project.organisation_id)
    )
    organisation = org_result.scalar_one_or_none()

    if not organisation or organisation.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organisation owners can remove users from projects"
        )

    # Remove user from project
    from sqlalchemy import text
    try:
        await db.execute(
            text("""
                DELETE FROM user_projects
                WHERE user_id = :user_id AND project_id = :project_id
            """),
            {"user_id": str(user_id), "project_id": str(project_id)}
        )
        await db.commit()
        return None
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove user: {str(e)}"
        )


@router.get("/{project_id}/members", response_model=List[dict])
async def list_project_members(
    project_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List all users assigned to a project.
    """
    # Get project
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    # Verify user has access (owner, member, or org admin)
    org_result = await db.execute(
        select(Organisation).where(Organisation.id == project.organisation_id)
    )
    organisation = org_result.scalar_one_or_none()

    is_owner = organisation and organisation.owner_id == current_user.id

    # If not owner, check if user is an organisation member or has project access
    if not is_owner:
        # Check if user is member of the organisation
        from sqlalchemy import text
        org_member_check = await db.execute(
            text("""
                SELECT 1 FROM user_organisations
                WHERE organisation_id = :org_id AND user_id = :user_id
                LIMIT 1
            """),
            {"org_id": str(project.organisation_id), "user_id": str(current_user.id)}
        )

        is_org_member = org_member_check.fetchone() is not None

        # If not org member, check if user has project access
        if not is_org_member:
            access_check = await db.execute(
                text("""
                    SELECT 1 FROM user_projects
                    WHERE project_id = :project_id AND user_id = :user_id
                    LIMIT 1
                """),
                {"project_id": str(project_id), "user_id": str(current_user.id)}
            )

            has_project_access = access_check.fetchone() is not None

            # Also check user_project_roles as backup
            if not has_project_access:
                role_check = await db.execute(
                    text("""
                        SELECT 1 FROM user_project_roles
                        WHERE project_id = :project_id AND user_id = :user_id
                        LIMIT 1
                    """),
                    {"project_id": str(project_id), "user_id": str(current_user.id)}
                )
                has_project_access = role_check.fetchone() is not None

            if not has_project_access:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You don't have permission to view this project's members"
                )

    # Get all members
    from sqlalchemy import text
    members_result = await db.execute(
        text("""
            SELECT u.id, u.email, u.username, u.full_name, up.role
            FROM user_projects up
            JOIN users u ON up.user_id = u.id
            WHERE up.project_id = :project_id
            ORDER BY u.created_at DESC
        """),
        {"project_id": str(project_id)}
    )

    members = []
    for row in members_result.fetchall():
        members.append({
            "id": str(row[0]),
            "email": row[1],
            "username": row[2],
            "full_name": row[3],
            "role": row[4]
        })

    return members
