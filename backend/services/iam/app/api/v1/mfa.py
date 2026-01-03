"""
MFA (Multi-Factor Authentication) API endpoints.

Provides endpoints for:
- Setting up MFA (generate secret, get QR code)
- Enabling MFA (verify initial TOTP)
- Disabling MFA
- Verifying MFA during login
- Managing backup codes
"""

from fastapi import APIRouter, Depends, HTTPException, status, Response
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List

from ...core.deps import get_db, get_current_active_user
from ...core.mfa import (
    generate_mfa_secret,
    get_totp_uri,
    generate_qr_code_base64,
    verify_totp,
    generate_backup_codes,
    verify_backup_code,
)
from ...models.user import User


router = APIRouter()


# Request/Response Schemas

class MFASetupResponse(BaseModel):
    """Response for MFA setup initiation."""
    secret: str
    qr_code: str  # Base64 encoded PNG
    uri: str


class MFAVerifyRequest(BaseModel):
    """Request to verify a TOTP code."""
    code: str


class MFAEnableResponse(BaseModel):
    """Response after successfully enabling MFA."""
    message: str
    backup_codes: List[str]


class MFAStatusResponse(BaseModel):
    """Response for MFA status check."""
    mfa_enabled: bool
    has_backup_codes: bool


class MFABackupCodeRequest(BaseModel):
    """Request to use a backup code."""
    backup_code: str


class MFADisableRequest(BaseModel):
    """Request to disable MFA."""
    code: str  # Current TOTP code or backup code to confirm


class RegenerateBackupCodesResponse(BaseModel):
    """Response with new backup codes."""
    message: str
    backup_codes: List[str]


# Endpoints

@router.get("/status", response_model=MFAStatusResponse)
async def get_mfa_status(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get the current MFA status for the authenticated user.
    """
    return MFAStatusResponse(
        mfa_enabled=current_user.mfa_enabled or False,
        has_backup_codes=bool(current_user.mfa_backup_codes and len(current_user.mfa_backup_codes) > 0)
    )


@router.post("/setup", response_model=MFASetupResponse)
async def setup_mfa(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Initiate MFA setup by generating a new secret and QR code.
    
    This does NOT enable MFA yet - the user must verify the code first
    using the /mfa/enable endpoint.
    """
    if current_user.mfa_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA is already enabled. Disable it first to set up again."
        )
    
    # Generate new secret
    secret = generate_mfa_secret()
    
    # Store secret temporarily (not enabled yet)
    current_user.mfa_secret = secret
    current_user.mfa_enabled = False
    await db.commit()
    
    # Generate provisioning URI and QR code
    uri = get_totp_uri(secret, current_user.email)
    qr_code = generate_qr_code_base64(uri)
    
    return MFASetupResponse(
        secret=secret,
        qr_code=qr_code,
        uri=uri
    )


@router.post("/enable", response_model=MFAEnableResponse)
async def enable_mfa(
    request: MFAVerifyRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Enable MFA after verifying the initial TOTP code.
    
    The user must first call /mfa/setup to get the secret,
    then verify they can generate codes before enabling.
    """
    if current_user.mfa_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA is already enabled"
        )
    
    if not current_user.mfa_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA setup not initiated. Call /mfa/setup first."
        )
    
    # Verify the TOTP code
    if not verify_totp(current_user.mfa_secret, request.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code. Please try again."
        )
    
    # Generate backup codes
    plain_codes, hashed_codes = generate_backup_codes(count=10)
    
    # Enable MFA
    current_user.mfa_enabled = True
    current_user.mfa_backup_codes = hashed_codes
    await db.commit()
    
    return MFAEnableResponse(
        message="MFA has been successfully enabled",
        backup_codes=plain_codes
    )


@router.post("/disable")
async def disable_mfa(
    request: MFADisableRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Disable MFA for the current user.
    
    Requires a current TOTP code or backup code for confirmation.
    """
    if not current_user.mfa_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA is not enabled"
        )
    
    # Verify the code (try TOTP first, then backup code)
    is_valid = verify_totp(current_user.mfa_secret, request.code)
    
    if not is_valid and current_user.mfa_backup_codes:
        backup_index = verify_backup_code(request.code, current_user.mfa_backup_codes)
        is_valid = backup_index is not None
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code"
        )
    
    # Disable MFA
    current_user.mfa_enabled = False
    current_user.mfa_secret = None
    current_user.mfa_backup_codes = None
    await db.commit()
    
    return {"message": "MFA has been disabled"}


@router.post("/verify")
async def verify_mfa_code(
    request: MFAVerifyRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Verify a TOTP code. Used for additional verification in sensitive operations.
    """
    if not current_user.mfa_enabled or not current_user.mfa_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA is not enabled for this account"
        )
    
    if not verify_totp(current_user.mfa_secret, request.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code"
        )
    
    return {"message": "Code verified successfully", "valid": True}


@router.post("/backup-codes/verify")
async def verify_backup_code_endpoint(
    request: MFABackupCodeRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Verify and consume a backup code.
    
    Once used, a backup code is removed from the list.
    """
    if not current_user.mfa_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA is not enabled"
        )
    
    if not current_user.mfa_backup_codes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No backup codes available"
        )
    
    backup_index = verify_backup_code(request.backup_code, current_user.mfa_backup_codes)
    
    if backup_index is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid backup code"
        )
    
    # Remove the used backup code
    backup_codes = list(current_user.mfa_backup_codes)
    backup_codes.pop(backup_index)
    current_user.mfa_backup_codes = backup_codes
    await db.commit()
    
    remaining = len(backup_codes)
    
    return {
        "message": "Backup code verified successfully",
        "valid": True,
        "remaining_codes": remaining
    }


@router.post("/backup-codes/regenerate", response_model=RegenerateBackupCodesResponse)
async def regenerate_backup_codes(
    request: MFAVerifyRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Regenerate backup codes. Requires current TOTP code for verification.
    
    This invalidates all previous backup codes.
    """
    if not current_user.mfa_enabled or not current_user.mfa_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA is not enabled"
        )
    
    # Verify the TOTP code
    if not verify_totp(current_user.mfa_secret, request.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code"
        )
    
    # Generate new backup codes
    plain_codes, hashed_codes = generate_backup_codes(count=10)
    
    current_user.mfa_backup_codes = hashed_codes
    await db.commit()
    
    return RegenerateBackupCodesResponse(
        message="Backup codes regenerated. Previous codes are now invalid.",
        backup_codes=plain_codes
    )


@router.get("/backup-codes/count")
async def get_backup_codes_count(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get the number of remaining backup codes.
    """
    if not current_user.mfa_enabled:
        return {"remaining_codes": 0, "mfa_enabled": False}
    
    count = len(current_user.mfa_backup_codes) if current_user.mfa_backup_codes else 0
    
    return {
        "remaining_codes": count,
        "mfa_enabled": True
    }


# Login completion endpoint

class MFALoginRequest(BaseModel):
    """Request to complete login with MFA."""
    mfa_token: str
    code: str
    is_backup_code: bool = False
    remember_me: bool = False


@router.post("/verify-login")
async def verify_mfa_login(
    request: MFALoginRequest,
    response: "Response",
    db: AsyncSession = Depends(get_db)
):
    """
    Complete login by verifying MFA code.
    
    Called after receiving mfa_required=true from /auth/login.
    Accepts either a TOTP code or a backup code.
    """
    from fastapi import Response
    from datetime import timedelta
    from cognitest_common import decode_token, create_access_token, create_refresh_token
    from ...core.config import settings
    from .auth import set_auth_cookies
    
    # Decode and validate the MFA token
    try:
        payload = decode_token(request.mfa_token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired MFA token"
        )
    
    if not payload or not payload.get("mfa_pending"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid MFA token"
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    # Get user from database
    from uuid import UUID
    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    if not user.mfa_enabled or not user.mfa_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA is not enabled for this account"
        )
    
    # Verify the code
    is_valid = False
    backup_index = None
    
    if request.is_backup_code:
        # Verify backup code
        if user.mfa_backup_codes:
            backup_index = verify_backup_code(request.code, user.mfa_backup_codes)
            is_valid = backup_index is not None
    else:
        # Verify TOTP code
        is_valid = verify_totp(user.mfa_secret, request.code)
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code"
        )
    
    # If backup code was used, remove it
    if backup_index is not None and user.mfa_backup_codes:
        backup_codes = list(user.mfa_backup_codes)
        backup_codes.pop(backup_index)
        user.mfa_backup_codes = backup_codes
        await db.commit()
    
    # Create tokens
    access_token_expires = None
    refresh_token_expires = None
    
    if request.remember_me:
        access_token_expires = timedelta(minutes=settings.REMEMBER_ME_ACCESS_TOKEN_EXPIRE_MINUTES)
        refresh_token_expires = timedelta(days=settings.REMEMBER_ME_REFRESH_TOKEN_EXPIRE_DAYS)
    
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email},
        expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(
        data={"sub": str(user.id)},
        expires_delta=refresh_token_expires
    )
    
    # Set HttpOnly cookies
    set_auth_cookies(response, access_token, refresh_token, remember_me=request.remember_me)
    
    return {
        "message": "Login successful",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "id": str(user.id),
            "email": user.email,
            "username": user.username
        }
    }
