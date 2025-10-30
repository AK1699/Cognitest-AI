from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID

from app.core.deps import get_db, get_current_active_user
from app.models.project import Project
from app.models.organisation import Organisation
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse

router = APIRouter()

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

    # Create project
    project = Project(**project_data.model_dump())
    db.add(project)
    await db.commit()
    await db.refresh(project)

    # Automatically assign the creator to the project
    from sqlalchemy import text
    await db.execute(
        text("""
            INSERT INTO user_projects (user_id, project_id, role, assigned_by)
            VALUES (:user_id, :project_id, :role, :assigned_by)
            ON CONFLICT (user_id, project_id) DO NOTHING
        """),
        {
            "user_id": str(project.owner_id),
            "project_id": str(project.id),
            "role": "owner",
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
    - Members: Only see projects they're assigned to
    """
    from sqlalchemy import text

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
    if is_owner:
        # Owners see all projects in the organisation
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

    # Verify user has access to the project
    from sqlalchemy import text
    if is_owner:
        # Owners have access to all projects in their organisation
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

    await db.delete(project)
    await db.commit()

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

    # Verify user has access (owner or member)
    org_result = await db.execute(
        select(Organisation).where(Organisation.id == project.organisation_id)
    )
    organisation = org_result.scalar_one_or_none()

    is_owner = organisation and organisation.owner_id == current_user.id

    if not is_owner:
        # Check if user has access to this project
        from sqlalchemy import text
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
                detail="You don't have permission to view this project's members"
            )

    # Get all members
    from sqlalchemy import text
    members_result = await db.execute(
        text("""
            SELECT u.id, u.email, u.username, u.full_name, up.role, up.assigned_at
            FROM user_projects up
            JOIN users u ON up.user_id = u.id
            WHERE up.project_id = :project_id
            ORDER BY up.assigned_at DESC
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
            "role": row[4],
            "assigned_at": row[5].isoformat() if row[5] else None
        })

    return members
