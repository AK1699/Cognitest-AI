from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func
from sqlalchemy.orm import selectinload
from typing import List
from uuid import UUID

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.group import Group, user_groups
from app.schemas.group import (
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
    """
    # Create new group
    new_group = Group(
        name=group_data.name,
        description=group_data.description,
        organisation_id=group_data.organisation_id,
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
