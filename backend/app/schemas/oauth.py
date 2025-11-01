from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from uuid import UUID

class GoogleAuthorizationRequest(BaseModel):
    """Request to get Google OAuth authorization URL."""
    pass

class GoogleCallbackRequest(BaseModel):
    """Request with Google authorization code."""
    code: str
    state: str

class OAuthUserInfo(BaseModel):
    """User information from OAuth provider."""
    email: EmailStr
    name: Optional[str] = None
    picture_url: Optional[str] = None
    provider_user_id: str

class OAuthAccountResponse(BaseModel):
    """Response for OAuth account info."""
    id: UUID
    user_id: UUID
    provider: str
    email: str
    name: Optional[str] = None
    picture_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class GoogleSignInRequest(BaseModel):
    """Request for Google Sign In."""
    id_token: str
    access_token: Optional[str] = None

class GoogleSignUpRequest(BaseModel):
    """Request for Google Sign Up."""
    id_token: str
    access_token: Optional[str] = None
    username: Optional[str] = None
