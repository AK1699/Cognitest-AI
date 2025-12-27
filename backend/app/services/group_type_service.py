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
                "name": "Project Admin",
                "description": "Full project control — can manage billing, delete the project, assign roles, and configure settings",
                "role_type": "project_admin",
                "is_default": True,
            },
        ],
    },
    "QUALITY_ASSURANCE": {
        "name": "Quality Assurance",
        "description": "QA team for testing, strategy, and automation",
        "access_level": "project",
        "can_manage_users": False,
        "can_manage_groups": False,
        "can_manage_roles": False,
        "can_manage_organization": False,
        "roles": [
            {
                "name": "QA Lead",
                "description": "Test strategy owner — designs test plans, manages QA assignments, and reviews technical execution",
                "role_type": "qa_lead",
                "is_default": False,
            },
            {
                "name": "Automation Engineer",
                "description": "Manages automation flows, AI scripts, and continuous testing pipelines",
                "role_type": "auto_eng",
                "is_default": False,
            },
            {
                "name": "QA Engineer",
                "description": "Creates, executes, and maintains automated and manual tests",
                "role_type": "qa_engineer",
                "is_default": True,
            },
        ],
    },
    "DEVELOPMENT": {
        "name": "Development",
        "description": "Development and engineering team",
        "access_level": "project",
        "can_manage_users": False,
        "can_manage_groups": False,
        "can_manage_roles": False,
        "can_manage_organization": False,
        "roles": [
            {
                "name": "Technical Lead",
                "description": "Technical reviewer — validates testing approach, environment readiness, and technical strategy",
                "role_type": "technical_lead",
                "is_default": False,
            },
            {
                "name": "Developer",
                "description": "Read-only access to test artifacts, can record evidence and view dashboards",
                "role_type": "developer",
                "is_default": True,
            },
        ],
    },
    "BUSINESS": {
        "name": "Business",
        "description": "Business stakeholders and product management",
        "access_level": "project",
        "can_manage_users": False,
        "can_manage_groups": False,
        "can_manage_roles": False,
        "can_manage_organization": False,
        "roles": [
            {
                "name": "Product Owner",
                "description": "Business stakeholder — validates scenarios, reviews requirements coverage, and performs business sign-off",
                "role_type": "product_owner",
                "is_default": True,
            },
        ],
    },
    "READ_ONLY": {
        "name": "Read Only",
        "description": "Stakeholders with view-only access",
        "access_level": "project",
        "can_manage_users": False,
        "can_manage_groups": False,
        "can_manage_roles": False,
        "can_manage_organization": False,
        "roles": [
            {
                "name": "Viewer",
                "description": "Has view-only access to dashboards, reports, and analytics",
                "role_type": "viewer",
                "is_default": True,
            },
        ],
    },
}


class GroupTypeService:
    """Service for managing group types"""

    @staticmethod
    async def initialize_group_types(db: AsyncSession, organization_id, created_by: str = "system") -> None:
        """
        Initialize default group types for an organization
        """
        # Convert UUID to string if needed
        org_id_str = str(organization_id)

        for group_type_code, config in DEFAULT_GROUP_TYPES.items():
            # Check if already exists
            result = await db.execute(
                select(GroupType).where(
                    GroupType.code == group_type_code,
                    GroupType.organization_id == org_id_str,
                )
            )
            existing_group_type = result.scalar_one_or_none()

            # Skip if it already exists
            if existing_group_type:
                continue

            # Create group type
            group_type = GroupType(
                code=group_type_code,
                name=config["name"],
                description=config["description"],
                organization_id=org_id_str,
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
                        ProjectRole.organisation_id == org_id_str,
                    )
                )
                role = result.scalar_one_or_none()

                if not role:
                    # Create new role
                    role = ProjectRole(
                        name=role_config["name"],
                        role_type=role_config["role_type"],
                        description=role_config.get("description", ""),
                        organisation_id=org_id_str,
                        created_by=created_by,
                        is_system_role=False,
                        is_active=True,
                    )
                    db.add(role)
                    await db.flush()

                # Check if group type role already exists
                result = await db.execute(
                    select(GroupTypeRole).where(
                        GroupTypeRole.group_type_id == group_type.id,
                        GroupTypeRole.role_id == role.id,
                    )
                )
                if not result.scalar_one_or_none():
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

            # Check if access configuration already exists
            result = await db.execute(
                select(GroupTypeAccess).where(
                    GroupTypeAccess.group_type_id == group_type.id,
                    GroupTypeAccess.organization_id == org_id_str,
                )
            )
            if not result.scalar_one_or_none():
                # Create access configuration
                access = GroupTypeAccess(
                    group_type_id=group_type.id,
                    organization_id=org_id_str,
                    access_level=config["access_level"],
                    accessible_modules=None,  # All modules
                    can_manage_users=config["can_manage_users"],
                    can_manage_groups=config["can_manage_groups"],
                    can_manage_roles=config["can_manage_roles"],
                    can_manage_organization=config["can_manage_organization"],
                )
                db.add(access)

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
