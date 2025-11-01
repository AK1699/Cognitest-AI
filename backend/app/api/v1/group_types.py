"""
Group Types API Endpoints
Manages predefined group types (ADMIN, QA, DEV, PRODUCT) and their associated roles
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
from uuid import UUID

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.group_type import GroupType, GroupTypeRole, GroupTypeAccess
from app.services.group_type_service import GroupTypeService

router = APIRouter()


# Response schemas
class GroupTypeRoleResponse:
    """Response model for group type role"""
    def __init__(self, id: UUID, role_name: str, description: str, is_default: bool):
        self.id = id
        self.role_name = role_name
        self.description = description
        self.is_default = is_default


class GroupTypeResponse:
    """Response model for group type"""
    def __init__(self, id: UUID, code: str, name: str, description: str, access_level: str, roles: list):
        self.id = id
        self.code = code
        self.name = name
        self.description = description
        self.access_level = access_level
        self.roles = roles


@router.get("/", tags=["group-types"])
async def list_group_types(
    organisation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List all group types for an organisation.

    Returns group types with their associated roles and access information.
    """
    # Get all group types for the organization
    query = (
        select(GroupType)
        .where(GroupType.organization_id == organisation_id)
        .options(selectinload(GroupType.roles))
        .order_by(GroupType.order)
    )
    result = await db.execute(query)
    group_types = result.scalars().all()

    response = []
    for gt in group_types:
        # Get access configuration
        access = await GroupTypeService.get_group_type_access(db, gt.id, organisation_id)

        # Build role list
        roles = []
        for gtr in gt.roles:
            roles.append({
                "id": str(gtr.id),
                "role_name": gtr.role_name,
                "description": gtr.description,
                "is_default": gtr.is_default
            })

        response.append({
            "id": str(gt.id),
            "code": gt.code,
            "name": gt.name,
            "description": gt.description,
            "access_level": access.access_level if access else "project",
            "roles": roles
        })

    return response


@router.get("/{group_type_id}", tags=["group-types"])
async def get_group_type(
    group_type_id: UUID,
    organisation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific group type by ID.

    Returns detailed information about the group type including roles and access configuration.
    """
    # Get group type with roles loaded
    query = (
        select(GroupType)
        .where(
            GroupType.id == group_type_id,
            GroupType.organization_id == organisation_id
        )
        .options(selectinload(GroupType.roles))
    )
    result = await db.execute(query)
    group_type = result.scalar_one_or_none()

    if not group_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group type not found"
        )

    # Get access configuration
    access = await GroupTypeService.get_group_type_access(db, group_type_id, organisation_id)

    # Build role list
    roles = []
    for gtr in group_type.roles:
        roles.append({
            "id": str(gtr.id),
            "role_name": gtr.role_name,
            "description": gtr.description,
            "is_default": gtr.is_default
        })

    return {
        "id": str(group_type.id),
        "code": group_type.code,
        "name": group_type.name,
        "description": group_type.description,
        "access_level": access.access_level if access else "project",
        "roles": roles,
        "can_manage_organization": access.can_manage_organization if access else False,
        "can_manage_users": access.can_manage_users if access else False,
        "can_manage_groups": access.can_manage_groups if access else False,
        "can_manage_roles": access.can_manage_roles if access else False
    }


@router.get("/{group_type_id}/roles", tags=["group-types"])
async def get_group_type_roles(
    group_type_id: UUID,
    organisation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all roles available for a specific group type.

    Returns list of roles that can be assigned to members of this group type.
    """
    # Verify group type belongs to this organization
    result = await db.execute(
        select(GroupType).where(
            GroupType.id == group_type_id,
            GroupType.organization_id == organisation_id
        )
    )
    group_type = result.scalar_one_or_none()

    if not group_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group type not found"
        )

    # Get roles
    roles = await GroupTypeService.get_group_type_roles(db, group_type_id)

    return {
        "group_type_id": str(group_type_id),
        "roles": [
            {
                "id": str(role.id),
                "role_name": role.role_name,
                "description": role.description,
                "is_default": role.is_default
            }
            for role in roles
        ]
    }


@router.get("/{group_type_id}/access", tags=["group-types"])
async def get_group_type_access_config(
    group_type_id: UUID,
    organisation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get access configuration for a specific group type.

    Returns what this group type can manage and its access level (organization vs project).
    """
    # Verify group type belongs to this organization
    result = await db.execute(
        select(GroupType).where(
            GroupType.id == group_type_id,
            GroupType.organization_id == organisation_id
        )
    )
    group_type = result.scalar_one_or_none()

    if not group_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group type not found"
        )

    # Get access configuration
    access = await GroupTypeService.get_group_type_access(db, group_type_id, organisation_id)

    if not access:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Access configuration not found"
        )

    return {
        "group_type_id": str(group_type_id),
        "access_level": access.access_level,
        "can_manage_organization": access.can_manage_organization,
        "can_manage_users": access.can_manage_users,
        "can_manage_groups": access.can_manage_groups,
        "can_manage_roles": access.can_manage_roles,
        "accessible_modules": access.accessible_modules
    }
