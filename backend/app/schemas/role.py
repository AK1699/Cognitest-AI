from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID


# ==================== Permission Schemas ====================

class PermissionBase(BaseModel):
    """Base schema for Permission"""
    name: str = Field(..., description="Permission name (e.g., 'create_project')")
    resource: str = Field(..., description="Resource type (e.g., 'project', 'test_plan')")
    action: str = Field(..., description="Action type (e.g., 'create', 'read', 'update', 'delete')")
    description: Optional[str] = Field(None, description="Permission description")


class PermissionCreate(PermissionBase):
    """Schema for creating a new permission"""
    is_system_permission: bool = Field(False, description="Whether this is a system permission")


class PermissionInDB(PermissionBase):
    """Schema for Permission in database"""
    id: UUID
    is_system_permission: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Permission(PermissionInDB):
    """Schema for Permission response"""
    pass


class PermissionList(BaseModel):
    """Schema for list of permissions"""
    permissions: List[Permission]
    total: int = Field(..., description="Total number of permissions")


# ==================== Project Role Schemas ====================

class ProjectRoleBase(BaseModel):
    """Base schema for ProjectRole"""
    name: str = Field(..., min_length=1, max_length=255, description="Role display name")
    role_type: str = Field(..., description="Role type (owner, admin, qa_manager, qa_lead, qa_engineer, product_owner, viewer)")
    description: Optional[str] = Field(None, description="Role description")


class ProjectRoleCreate(ProjectRoleBase):
    """Schema for creating a new project role"""
    organisation_id: UUID = Field(..., description="Organisation ID")
    permission_ids: List[UUID] = Field(default=[], description="List of permission IDs to assign to this role")


class ProjectRoleUpdate(BaseModel):
    """Schema for updating a project role"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    is_active: Optional[bool] = None
    permission_ids: Optional[List[UUID]] = Field(None, description="List of permission IDs (replaces existing)")


class ProjectRoleInDB(ProjectRoleBase):
    """Schema for ProjectRole in database"""
    id: UUID
    organisation_id: UUID
    is_system_role: bool
    is_active: bool
    meta_data: Dict[str, Any]
    created_at: datetime
    updated_at: Optional[datetime]
    created_by: str

    class Config:
        from_attributes = True


class ProjectRole(ProjectRoleInDB):
    """Schema for ProjectRole response"""
    pass


class ProjectRoleWithPermissions(ProjectRole):
    """Schema for ProjectRole with permissions list"""
    permissions: List[Permission] = Field(default=[], description="List of permissions assigned to this role")
    permission_count: int = Field(..., description="Number of permissions")


class ProjectRoleList(BaseModel):
    """Schema for list of project roles"""
    roles: List[ProjectRoleWithPermissions]
    total: int = Field(..., description="Total number of roles")


# ==================== User Project Role Schemas ====================

class UserProjectRoleBase(BaseModel):
    """Base schema for UserProjectRole assignment"""
    user_id: UUID = Field(..., description="User ID")
    project_id: UUID = Field(..., description="Project ID")
    role_id: UUID = Field(..., description="Role ID")


class UserProjectRoleCreate(UserProjectRoleBase):
    """Schema for assigning a role to a user for a project"""
    expires_at: Optional[datetime] = Field(None, description="Optional expiration date")


class UserProjectRoleInDB(UserProjectRoleBase):
    """Schema for UserProjectRole in database"""
    id: UUID
    assigned_at: datetime
    assigned_by: str
    expires_at: Optional[datetime]

    class Config:
        from_attributes = True


class UserProjectRole(UserProjectRoleInDB):
    """Schema for UserProjectRole response"""
    pass


class UserProjectRoleWithDetails(UserProjectRole):
    """Schema for UserProjectRole with role and user details"""
    role_name: str = Field(..., description="Role name")
    role_type: str = Field(..., description="Role type")
    user_email: str = Field(..., description="User email")
    user_name: Optional[str] = Field(None, description="User full name")


class UserProjectRoleList(BaseModel):
    """Schema for list of user project roles"""
    assignments: List[UserProjectRoleWithDetails]
    total: int = Field(..., description="Total number of assignments")


# ==================== Group Project Role Schemas ====================

class GroupProjectRoleBase(BaseModel):
    """Base schema for GroupProjectRole assignment"""
    group_id: UUID = Field(..., description="Group ID")
    project_id: UUID = Field(..., description="Project ID")
    role_id: UUID = Field(..., description="Role ID")


class GroupProjectRoleCreate(GroupProjectRoleBase):
    """Schema for assigning a role to a group for a project"""
    expires_at: Optional[datetime] = Field(None, description="Optional expiration date")


class GroupProjectRoleInDB(GroupProjectRoleBase):
    """Schema for GroupProjectRole in database"""
    id: UUID
    assigned_at: datetime
    assigned_by: str
    expires_at: Optional[datetime]

    class Config:
        from_attributes = True


class GroupProjectRole(GroupProjectRoleInDB):
    """Schema for GroupProjectRole response"""
    pass


class GroupProjectRoleWithDetails(GroupProjectRole):
    """Schema for GroupProjectRole with role and group details"""
    role_name: str = Field(..., description="Role name")
    role_type: str = Field(..., description="Role type")
    group_name: str = Field(..., description="Group name")


class GroupProjectRoleList(BaseModel):
    """Schema for list of group project roles"""
    assignments: List[GroupProjectRoleWithDetails]
    total: int = Field(..., description="Total number of assignments")


# ==================== Permission Check Schemas ====================

class PermissionCheckRequest(BaseModel):
    """Schema for checking if user has a permission"""
    user_id: UUID = Field(..., description="User ID")
    project_id: UUID = Field(..., description="Project ID")
    permission_name: str = Field(..., description="Permission name to check")


class PermissionCheckResponse(BaseModel):
    """Schema for permission check response"""
    has_permission: bool = Field(..., description="Whether user has the permission")
    reason: Optional[str] = Field(None, description="Reason (e.g., 'via role Administrator', 'via group QA Team')")


class UserPermissionsResponse(BaseModel):
    """Schema for user's all permissions for a project"""
    user_id: UUID
    project_id: UUID
    permissions: List[Permission] = Field(..., description="List of all permissions user has")
    roles: List[ProjectRole] = Field(..., description="List of roles user has (directly or via groups)")


# ==================== Role Initialization Schema ====================

class InitializeRolesRequest(BaseModel):
    """Schema for initializing default roles for an organisation"""
    organisation_id: UUID = Field(..., description="Organisation ID")


class InitializeRolesResponse(BaseModel):
    """Schema for role initialization response"""
    success: bool
    roles_created: int = Field(..., description="Number of roles created")
    message: str
    roles: List[ProjectRole] = Field(..., description="List of created roles")
