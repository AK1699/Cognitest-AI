from pydantic import BaseModel, Field, HttpUrl
from typing import Optional
from datetime import datetime
from uuid import UUID

class OrganisationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Organization name")
    website: Optional[str] = Field(None, max_length=500, description="Organization website URL")
    description: Optional[str] = Field(None, description="Organization description")
    logo: Optional[str] = Field(None, description="Organization logo URL or base64 encoded image")

class OrganisationCreate(OrganisationBase):
    pass

class OrganisationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    website: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    logo: Optional[str] = None

class OrganisationResponse(OrganisationBase):
    id: UUID
    owner_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
