"""
Group Type Service
Manages predefined group types and their roles
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
import uuid

from app.models.group_type import GroupType, GroupTypeRole, GroupTypeAccess
from app.models.role import ProjectRole, Permission


# Predefined Group Types Configuration
DEFAULT_GROUP_TYPES = {
    "ADMIN": {
        "name": "Administration",
        "description": "Administrative team with full organization and project control",
        "access_level": "organization",
        "can_manage_users": True,
        "can_manage_groups": True,
        "can_manage_roles": True,
        "can_manage_organization": True,
        "roles": [
            {
                "name": "Owner",
                "description": "Organization owner with full control",
                "role_type": "administrator",
                "is_default": True,
            },
            {
                "name": "Admin",
                "description": "Administrator with full control",
                "role_type": "administrator",
                "is_default": False,
            },
        ],
    },
    "QA": {
        "name": "Quality Assurance",
        "description": "QA team for testing",
        "access_level": "project",
        "can_manage_users": False,
        "can_manage_groups": False,
        "can_manage_roles": False,
        "can_manage_organization": False,
        "roles": [
            {
                "name": "QA Lead",
                "description": "QA team lead with project management",
                "role_type": "project_manager",
                "is_default": False,
            },
            {
                "name": "QA Manager",
                "description": "QA Manager for quality oversight",
                "role_type": "project_manager",
                "is_default": False,
            },
            {
                "name": "QA Engineer",
                "description": "Senior QA Engineer",
                "role_type": "developer",
                "is_default": False,
            },
            {
                "name": "Tester",
                "description": "QA Tester",
                "role_type": "tester",
                "is_default": True,
            },
        ],
    },
    "DEV": {
        "name": "Development",
        "description": "Development team",
        "access_level": "project",
        "can_manage_users": False,
        "can_manage_groups": False,
        "can_manage_roles": False,
        "can_manage_organization": False,
        "roles": [
            {
                "name": "Dev Lead",
                "description": "Development team lead",
                "role_type": "project_manager",
                "is_default": False,
            },
            {
                "name": "Developer",
                "description": "Software Developer",
                "role_type": "developer",
                "is_default": True,
            },
            {
                "name": "Junior Developer",
                "description": "Junior Software Developer",
                "role_type": "tester",
                "is_default": False,
            },
        ],
    },
    "PRODUCT": {
        "name": "Product Management",
        "description": "Product and business team",
        "access_level": "project",
        "can_manage_users": False,
        "can_manage_groups": False,
        "can_manage_roles": False,
        "can_manage_organization": False,
        "roles": [
            {
                "name": "Product Owner",
                "description": "Product Owner",
                "role_type": "project_manager",
                "is_default": False,
            },
            {
                "name": "Business Analyst",
                "description": "Business Analyst",
                "role_type": "developer",
                "is_default": True,
            },
            {
                "name": "Stakeholder",
                "description": "Project Stakeholder",
                "role_type": "viewer",
                "is_default": False,
            },
        ],
    },
}


class GroupTypeService:
    """Service for managing group types"""

    @staticmethod
    async def initialize_group_types(db: AsyncSession, organization_id: str) -> None:
        """
        Initialize default group types for an organization
        """
        for group_type_code, config in DEFAULT_GROUP_TYPES.items():
            # Check if already exists
            result = await db.execute(
                select(GroupType).where(
                    GroupType.code == group_type_code,
                    GroupType.organization_id == organization_id,
                )
            )
            if result.scalar_one_or_none():
                continue

            # Create group type
            group_type = GroupType(
                code=group_type_code,
                name=config["name"],
                description=config["description"],
                organization_id=organization_id,
                is_system_type=False,
                order=list(DEFAULT_GROUP_TYPES.keys()).index(group_type_code),
            )
            db.add(group_type)
            await db.flush()  # Get the ID

            # Create associated roles
            for role_config in config["roles"]:
                # Get or create the project role
                result = await db.execute(
                    select(ProjectRole).where(
                        ProjectRole.name == role_config["name"],
                        ProjectRole.organisation_id == organization_id,
                    )
                )
                role = result.scalar_one_or_none()

                if not role:
                    # Create new role
                    role = ProjectRole(
                        name=role_config["name"],
                        role_type=role_config["role_type"],
                        description=role_config.get("description", ""),
                        organization_id=organization_id,
                        is_system_role=False,
                        is_active=True,
                    )
                    db.add(role)
                    await db.flush()

                # Link role to group type
                group_type_role = GroupTypeRole(
                    group_type_id=group_type.id,
                    role_id=role.id,
                    role_name=role_config["name"],
                    description=role_config.get("description", ""),
                    is_default=role_config.get("is_default", False),
                    order=config["roles"].index(role_config),
                )
                db.add(group_type_role)

            # Create access configuration
            access = GroupTypeAccess(
                group_type_id=group_type.id,
                organization_id=organization_id,
                access_level=config["access_level"],
                accessible_modules=None,  # All modules
                can_manage_users=config["can_manage_users"],
                can_manage_groups=config["can_manage_groups"],
                can_manage_roles=config["can_manage_roles"],
                can_manage_organization=config["can_manage_organization"],
            )
            db.add(access)

        await db.commit()

    @staticmethod
    async def get_group_type(db: AsyncSession, group_type_id: str):
        """Get group type by ID"""
        result = await db.execute(select(GroupType).where(GroupType.id == group_type_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_group_type_by_code(db: AsyncSession, code: str, organization_id: str):
        """Get group type by code"""
        result = await db.execute(
            select(GroupType).where(
                GroupType.code == code,
                GroupType.organization_id == organization_id,
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def list_group_types(db: AsyncSession, organization_id: str) -> List[GroupType]:
        """List all group types for organization"""
        result = await db.execute(
            select(GroupType)
            .where(GroupType.organization_id == organization_id)
            .order_by(GroupType.order)
        )
        return result.scalars().all()

    @staticmethod
    async def get_group_type_roles(db: AsyncSession, group_type_id: str) -> List[GroupTypeRole]:
        """Get roles for a group type"""
        result = await db.execute(
            select(GroupTypeRole)
            .where(GroupTypeRole.group_type_id == group_type_id)
            .order_by(GroupTypeRole.order)
        )
        return result.scalars().all()

    @staticmethod
    async def get_group_type_access(db: AsyncSession, group_type_id: str, organization_id: str):
        """Get access configuration for group type"""
        result = await db.execute(
            select(GroupTypeAccess).where(
                GroupTypeAccess.group_type_id == group_type_id,
                GroupTypeAccess.organization_id == organization_id,
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def can_access_organization(db: AsyncSession, group_type_id: str, organization_id: str) -> bool:
        """Check if group type has organization-level access"""
        access = await GroupTypeService.get_group_type_access(db, group_type_id, organization_id)
        return access is not None and access.access_level == "organization"

    @staticmethod
    async def can_manage_organization(db: AsyncSession, group_type_id: str, organization_id: str) -> bool:
        """Check if group type can manage organization settings"""
        access = await GroupTypeService.get_group_type_access(db, group_type_id, organization_id)
        return access is not None and access.can_manage_organization

    @staticmethod
    async def can_manage_users(db: AsyncSession, group_type_id: str, organization_id: str) -> bool:
        """Check if group type can manage users"""
        access = await GroupTypeService.get_group_type_access(db, group_type_id, organization_id)
        return access is not None and access.can_manage_users
