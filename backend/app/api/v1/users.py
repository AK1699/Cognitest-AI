from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID

from app.core.deps import get_db, get_current_user, get_current_active_user
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate

router = APIRouter()


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific user by ID.
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    user_data: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a user's information.
    Only admins or the user themselves can update user info.
    """
    # Get the user to update
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Check permissions: user can update themselves, or must be superuser or org owner/admin
    if str(current_user.id) != str(user_id) and not current_user.is_superuser:
        # Check if current user is an owner or admin of any organization that the target user belongs to
        from app.models.organisation import UserOrganisation, Organisation
        
        # Get organizations where current user is owner or admin
        current_user_orgs = await db.execute(
            select(UserOrganisation).where(
                UserOrganisation.user_id == current_user.id,
                UserOrganisation.role.in_(['owner', 'admin'])
            )
        )
        current_user_org_ids = {uo.organisation_id for uo in current_user_orgs.scalars().all()}
        
        # Also check if current user owns any organizations
        owned_orgs = await db.execute(
            select(Organisation).where(Organisation.owner_id == current_user.id)
        )
        current_user_org_ids.update({org.id for org in owned_orgs.scalars().all()})
        
        # Get organizations that the target user belongs to
        target_user_orgs = await db.execute(
            select(UserOrganisation).where(UserOrganisation.user_id == user_id)
        )
        target_user_org_ids = {uo.organisation_id for uo in target_user_orgs.scalars().all()}
        
        # Check if there's any overlap (current user manages an org that target user belongs to)
        if not current_user_org_ids.intersection(target_user_org_ids):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this user"
            )

    # Check if email is being changed and is unique
    if user_data.email and user_data.email != user.email:
        result = await db.execute(select(User).where(User.email == user_data.email))
        existing_email = result.scalar_one_or_none()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use"
            )
        user.email = user_data.email

    # Check if username is being changed and is unique
    if user_data.username and user_data.username != user.username:
        result = await db.execute(select(User).where(User.username == user_data.username))
        existing_username = result.scalar_one_or_none()
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        user.username = user_data.username

    # Update other fields if provided
    if user_data.full_name is not None:
        user.full_name = user_data.full_name

    if user_data.is_active is not None:
        # Only superusers and org owners/admins can change active status
        can_change_status = current_user.is_superuser
        
        if not can_change_status:
            # Check if current user is owner/admin of user's organization
            from app.models.organisation import UserOrganisation, Organisation
            
            current_user_orgs = await db.execute(
                select(UserOrganisation).where(
                    UserOrganisation.user_id == current_user.id,
                    UserOrganisation.role.in_(['owner', 'admin'])
                )
            )
            current_user_org_ids = {uo.organisation_id for uo in current_user_orgs.scalars().all()}
            
            owned_orgs = await db.execute(
                select(Organisation).where(Organisation.owner_id == current_user.id)
            )
            current_user_org_ids.update({org.id for org in owned_orgs.scalars().all()})
            
            target_user_orgs = await db.execute(
                select(UserOrganisation).where(UserOrganisation.user_id == user_id)
            )
            target_user_org_ids = {uo.organisation_id for uo in target_user_orgs.scalars().all()}
            
            can_change_status = bool(current_user_org_ids.intersection(target_user_org_ids))
        
        if not can_change_status:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to change user active status"
            )
        user.is_active = user_data.is_active

    if user_data.password:
        from app.core.security import get_password_hash
        user.hashed_password = get_password_hash(user_data.password)

    await db.commit()
    await db.refresh(user)

    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a user.
    Superusers can delete any user.
    Organization owners/admins can delete users within their organization.
    """
    # Get the user to delete
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Don't allow deleting yourself
    if str(current_user.id) == str(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete yourself"
        )

    # Check authorization
    if not current_user.is_superuser:
        # Check if current user is an owner or admin of any organization that the target user belongs to
        from app.models.organisation import UserOrganisation, Organisation
        
        # Get organizations where current user is owner or admin
        current_user_orgs = await db.execute(
            select(UserOrganisation).where(
                UserOrganisation.user_id == current_user.id,
                UserOrganisation.role.in_(['owner', 'admin'])
            )
        )
        current_user_org_ids = {uo.organisation_id for uo in current_user_orgs.scalars().all()}
        
        # Also check if current user owns any organizations
        owned_orgs = await db.execute(
            select(Organisation).where(Organisation.owner_id == current_user.id)
        )
        current_user_org_ids.update({org.id for org in owned_orgs.scalars().all()})
        
        # Get organizations that the target user belongs to
        target_user_orgs = await db.execute(
            select(UserOrganisation).where(UserOrganisation.user_id == user_id)
        )
        target_user_org_ids = {uo.organisation_id for uo in target_user_orgs.scalars().all()}
        
        # Check if there's any overlap (current user manages an org that target user belongs to)
        if not current_user_org_ids.intersection(target_user_org_ids):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this user. You must be an owner or admin of an organization this user belongs to."
            )

    # Delete the user
    await db.delete(user)
    await db.commit()

    return None
