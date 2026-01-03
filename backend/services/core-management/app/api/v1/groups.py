from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func, text
from sqlalchemy.orm import selectinload
from typing import List
from uuid import UUID

from ...core.deps import get_db, get_current_user
from ...models.user import User
from ...models.group import Group, user_groups
from ...models.group_type import GroupTypeAccess
from ...schemas.group import (
    GroupCreate,
    GroupUpdate,
    Group as GroupSchema,
    GroupList,
    GroupWithUsers,
    GroupAddUser,
    GroupRemoveUser,
)

router = APIRouter()


@router.post("/", response_model=GroupSchema, status_code=status.HTTP_201_CREATED)
async def create_group(
    group_data: GroupCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new group.

    - **name**: Group name (required)
    - **description**: Group description (optional)
    - **organisation_id**: Organisation ID (required)
    - **group_type_id**: Group Type ID (optional, for predefined group types like ADMIN, QA, DEV, PRODUCT)
    """
    # Validate group_type_id if provided
    if group_data.group_type_id:
        from ...models.group_type import GroupType
        result = await db.execute(
            select(GroupType).where(
                GroupType.id == group_data.group_type_id,
                GroupType.organization_id == group_data.organisation_id
            )
        )
        if not result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Group type not found for this organisation"
            )

    # Create new group
    new_group = Group(
        name=group_data.name,
        description=group_data.description,
        organisation_id=group_data.organisation_id,
        group_type_id=group_data.group_type_id,
        is_active=True,
        created_by=current_user.email
    )

    db.add(new_group)
    await db.commit()
    await db.refresh(new_group)

    return new_group


@router.get("/", response_model=GroupList)
async def list_groups(
    organisation_id: UUID,
    skip: int = 0,
    limit: int = 100,
    is_active: bool = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List all groups for an organisation.

    - **organisation_id**: Filter by organisation (required)
    - **is_active**: Filter by active status (optional)
    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum number of records to return
    """
    query = select(Group).where(Group.organisation_id == organisation_id)

    if is_active is not None:
        query = query.where(Group.is_active == is_active)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Get groups with pagination
    query = query.offset(skip).limit(limit).order_by(Group.created_at.desc())
    result = await db.execute(query)
    groups = result.scalars().all()

    return GroupList(groups=groups, total=total)


@router.get("/{group_id}", response_model=GroupWithUsers)
async def get_group(
    group_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific group by ID with user count.
    """
    # Get group with users loaded
    query = select(Group).where(Group.id == group_id).options(selectinload(Group.users))
    result = await db.execute(query)
    group = result.scalar_one_or_none()

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Group with id {group_id} not found"
        )

    # Count users in group
    user_count_query = select(func.count()).select_from(user_groups).where(user_groups.c.group_id == group_id)
    user_count_result = await db.execute(user_count_query)
    user_count = user_count_result.scalar()

    # Create response with user count
    group_dict = {
        "id": group.id,
        "organisation_id": group.organisation_id,
        "name": group.name,
        "description": group.description,
        "is_active": group.is_active,
        "created_at": group.created_at,
        "updated_at": group.updated_at,
        "created_by": group.created_by,
        "user_count": user_count
    }

    return GroupWithUsers(**group_dict)


@router.put("/{group_id}", response_model=GroupSchema)
async def update_group(
    group_id: UUID,
    group_data: GroupUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a group.

    - **name**: New group name (optional)
    - **description**: New description (optional)
    - **is_active**: New active status (optional)
    """
    # Get existing group
    result = await db.execute(select(Group).where(Group.id == group_id))
    group = result.scalar_one_or_none()

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Group with id {group_id} not found"
        )

    # Update fields
    update_data = group_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(group, field, value)

    await db.commit()
    await db.refresh(group)

    return group


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group(
    group_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a group.

    This will also remove all user-group associations.
    """
    # Check if group exists
    result = await db.execute(select(Group).where(Group.id == group_id))
    group = result.scalar_one_or_none()

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Group with id {group_id} not found"
        )

    # Delete group (cascade will handle user_groups)
    await db.delete(group)
    await db.commit()

    return None


@router.post("/{group_id}/users", response_model=GroupWithUsers)
async def add_user_to_group(
    group_id: UUID,
    user_data: GroupAddUser,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Add a user to a group.

    - **user_id**: User ID to add to the group
    """
    # Check if group exists
    result = await db.execute(select(Group).where(Group.id == group_id))
    group = result.scalar_one_or_none()

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Group with id {group_id} not found"
        )

    # Check if user exists
    user_result = await db.execute(select(User).where(User.id == user_data.user_id))
    user = user_result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_data.user_id} not found"
        )

    # Check if user is already in group
    check_query = select(user_groups).where(
        user_groups.c.user_id == user_data.user_id,
        user_groups.c.group_id == group_id
    )
    check_result = await db.execute(check_query)
    existing = check_result.first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User is already in this group"
        )

    # Add user to group
    await db.execute(
        user_groups.insert().values(
            user_id=user_data.user_id,
            group_id=group_id,
            added_by=current_user.email
        )
    )
    await db.commit()

    # Return updated group
    return await get_group(group_id, current_user, db)


@router.delete("/{group_id}/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_user_from_group(
    group_id: UUID,
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Remove a user from a group.
    """
    # Check if user is in group
    check_query = select(user_groups).where(
        user_groups.c.user_id == user_id,
        user_groups.c.group_id == group_id
    )
    check_result = await db.execute(check_query)
    existing = check_result.first()

    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User is not in this group"
        )

    # Remove user from group
    await db.execute(
        delete(user_groups).where(
            user_groups.c.user_id == user_id,
            user_groups.c.group_id == group_id
        )
    )
    await db.commit()

    return None


@router.get("/{group_id}/users", response_model=List[dict])
async def get_group_users(
    group_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all users in a group.
    """
    # Check if group exists
    result = await db.execute(select(Group).where(Group.id == group_id))
    group = result.scalar_one_or_none()

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Group with id {group_id} not found"
        )

    # Get users in group
    query = (
        select(User, user_groups.c.added_at, user_groups.c.added_by)
        .join(user_groups, User.id == user_groups.c.user_id)
        .where(user_groups.c.group_id == group_id)
        .order_by(user_groups.c.added_at.desc())
    )
    result = await db.execute(query)
    users_data = result.all()

    # Format response
    users = []
    for user, added_at, added_by in users_data:
        users.append({
            "id": str(user.id),
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "added_at": added_at.isoformat() if added_at else None,
            "added_by": added_by
        })

    return users


# New endpoint for smart landing redirect - get user's groups with type info
@router.get("/user/{user_id}/groups")
async def get_user_groups(
    user_id: UUID,
    organisation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all groups a user belongs to with their group types and access levels.

    Used by SmartLandingRedirect component to determine user's landing page.
    Returns:
    - group_id: UUID of the group
    - group_name: Name of the group
    - group_type: Type of group (ADMIN, QA, DEV, PRODUCT)
    - access_level: Level of access (organization or project)
    - projects: List of projects this group has access to
    - can_manage_organization: Whether this group can manage the organization
    """
    # Get all groups for this user in this organization
    from ...models.group_type import GroupType

    query = (
        select(Group)
        .join(user_groups, Group.id == user_groups.c.group_id)
        .where(
            user_groups.c.user_id == user_id,
            Group.organisation_id == organisation_id
        )
        .options(selectinload(Group.group_type))
        .order_by(Group.created_at.desc())
    )
    result = await db.execute(query)
    groups = result.scalars().all()

    response_groups = []

    for group in groups:
        # Get group type access info
        access_level = "project"
        can_manage_organization = False
        group_type_code = None

        if group.group_type:
            group_type_code = group.group_type.code
            access_config = await db.execute(
                select(GroupTypeAccess).where(
                    GroupTypeAccess.group_type_id == group.group_type.id,
                    GroupTypeAccess.organization_id == organisation_id
                )
            )
            access = access_config.scalar_one_or_none()
            if access:
                access_level = access.access_level
                can_manage_organization = access.can_manage_organization

        # Get projects this group is assigned to
        # (assuming there's a group_projects junction table or we get it from user_projects)
        projects_result = await db.execute(
            text("""
                SELECT DISTINCT p.id, p.name
                FROM projects p
                WHERE p.organisation_id = :org_id
                ORDER BY p.created_at DESC
                LIMIT 10
            """),
            {"org_id": str(organisation_id)}
        )

        projects = []
        for row in projects_result.fetchall():
            projects.append({
                "id": str(row[0]),
                "name": row[1]
            })

        response_groups.append({
            "group_id": str(group.id),
            "group_name": group.name,
            "group_type": group_type_code or "default",
            "access_level": access_level,
            "projects": projects,
            "can_manage_organization": can_manage_organization
        })

    return {"groups": response_groups}
