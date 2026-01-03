from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class GroupBase(BaseModel):
    """Base schema for Group"""
    name: str = Field(..., min_length=1, max_length=255, description="Group name")
    description: Optional[str] = Field(None, description="Group description")


class GroupCreate(GroupBase):
    """Schema for creating a new group"""
    organisation_id: UUID = Field(..., description="Organisation ID")
    group_type_id: Optional[UUID] = Field(None, description="Group Type ID (for predefined group types)")


class GroupUpdate(BaseModel):
    """Schema for updating a group"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class GroupInDB(GroupBase):
    """Schema for Group in database"""
    id: UUID
    organisation_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]
    created_by: str
    group_type_id: Optional[UUID] = None

    class Config:
        from_attributes = True


class Group(GroupInDB):
    """Schema for Group response"""
    pass


class GroupWithUsers(GroupInDB):
    """Schema for Group with users list"""
    user_count: int = Field(..., description="Number of users in group")
    # users: List['UserBasic'] = []  # Can be added if needed


class GroupAddUser(BaseModel):
    """Schema for adding a user to a group"""
    user_id: UUID = Field(..., description="User ID to add")


class GroupRemoveUser(BaseModel):
    """Schema for removing a user from a group"""
    user_id: UUID = Field(..., description="User ID to remove")


class GroupList(BaseModel):
    """Schema for list of groups"""
    groups: List[Group]
    total: int = Field(..., description="Total number of groups")
