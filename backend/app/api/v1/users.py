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

    # Authorization check for others (self-deletion is allowed)
    if str(current_user.id) != str(user_id):
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

    # Prevent deleting the only owner of an organization
    from app.models.organisation import UserOrganisation, Organisation, OrgRoleType
    
    # Get all organizations where this user is an owner
    user_owned_orgs_query = await db.execute(
        select(UserOrganisation).where(
            UserOrganisation.user_id == user_id,
            UserOrganisation.role == OrgRoleType.OWNER.value
        )
    )
    user_owned_orgs = user_owned_orgs_query.scalars().all()
    
    for uo in user_owned_orgs:
        # Check if there are any other members in this organization (not just owners)
        other_members_result = await db.execute(
            select(UserOrganisation).where(
                UserOrganisation.organisation_id == uo.organisation_id,
                UserOrganisation.user_id != user_id
            )
        )
        other_members = other_members_result.scalars().all()
        
        if len(other_members) > 0:
            # If there are other members, check if any of them are also owners
            other_owners = [m for m in other_members if m.role == OrgRoleType.OWNER.value]
            if not other_owners:
                org_query = await db.execute(select(Organisation).where(Organisation.id == uo.organisation_id))
                org = org_query.scalar_one_or_none()
                org_name = org.name if org else "Unknown Organization"
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot delete user as they are the only owner of organization '{org_name}'. Please promote another member to owner or transfer ownership first."
                )
            else:
                # Transfer primary owner_id to one of the other owners
                org_query = await db.execute(select(Organisation).where(Organisation.id == uo.organisation_id))
                org = org_query.scalar_one_or_none()
                if org and org.owner_id == user_id:
                    org.owner_id = other_owners[0].user_id
                    db.add(org)
                    # We'll commit after the loop or now
                    await db.flush()
        if len(other_members) == 0:
            # If there are NO other members, delete the entire organization with full dependency purge
            org_result = await db.execute(select(Organisation).where(Organisation.id == uo.organisation_id))
            org = org_result.scalar_one_or_none()
            if org:
                # 1. Delete user organisations
                await db.execute(text("DELETE FROM user_organisations WHERE organisation_id = :org_id"), {"org_id": str(org.id)})
                
                # 2. Delete group type access (US spelling organization_id)
                await db.execute(text("DELETE FROM group_type_access WHERE organization_id = :org_id"), {"org_id": str(org.id)})
                
                # 3. Delete group type roles
                await db.execute(text("""
                    DELETE FROM group_type_roles 
                    WHERE group_type_id IN (SELECT id FROM group_types WHERE organization_id = :org_id)
                """), {"org_id": str(org.id)})
                
                # 4. Delete group types
                await db.execute(text("DELETE FROM group_types WHERE organization_id = :org_id"), {"org_id": str(org.id)})
                
                # 5. Delete groups
                await db.execute(text("DELETE FROM groups WHERE organisation_id = :org_id"), {"org_id": str(org.id)})
                
                # 6. Delete project roles data
                await db.execute(text("""
                    DELETE FROM user_project_roles 
                    WHERE project_id IN (SELECT id FROM projects WHERE organisation_id = :org_id)
                """), {"org_id": str(org.id)})
                
                # 7. Delete projects
                await db.execute(text("DELETE FROM projects WHERE organisation_id = :org_id"), {"org_id": str(org.id)})
                
                # 8. Delete role permissions
                await db.execute(text("""
                    DELETE FROM role_permissions 
                    WHERE role_id IN (SELECT id FROM project_roles WHERE organisation_id = :org_id)
                """), {"org_id": str(org.id)})
                
                # 9. Delete project roles
                await db.execute(text("DELETE FROM project_roles WHERE organisation_id = :org_id"), {"org_id": str(org.id)})
                
                # 10. Delete organization roles
                await db.execute(text("DELETE FROM organization_roles WHERE organisation_id = :org_id"), {"org_id": str(org.id)})
                
                # 11. Finally delete the organisation itself
                await db.delete(org)
                # Flush to clear FK pointers before continue to next org or user deletion
                await db.flush()

    # Refresh user object if it was potentially affected by org deletions (unlikely but safe)
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user:
        # Delete the user
        await db.delete(user)
        await db.commit()

    return None
