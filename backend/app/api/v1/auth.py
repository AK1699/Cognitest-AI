from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timedelta

from app.core.deps import get_db, get_current_user, get_current_active_user
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
    create_password_reset_token,
    decode_password_reset_token
)
from app.core.config import settings
from app.models.user import User
from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserResponse,
    Token,
    RefreshTokenRequest,
    UserUpdate,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    VerifyResetCodeRequest
)
from app.utils.email import send_email, render_template
from app.models.password_reset import PasswordResetCode
import random
import string

router = APIRouter()

def set_auth_cookies(response: Response, access_token: str, refresh_token: str, remember_me: bool = False):
    """
    Set HttpOnly cookies for access and refresh tokens.

    Args:
        response: FastAPI Response object
        access_token: JWT access token
        refresh_token: JWT refresh token
        remember_me: If True, sets longer expiration times
    """
    # Access token cookie settings
    access_max_age = settings.REMEMBER_ME_ACCESS_TOKEN_EXPIRE_MINUTES * 60 if remember_me else settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

    # In production, secure should be True. For local development over HTTP, use False
    is_production = settings.FRONTEND_URL.startswith("https://")

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,  # Prevents JavaScript access (XSS protection)
        secure=is_production,    # Only sent over HTTPS in production
        samesite="lax", # CSRF protection (use "strict" for even more security)
        max_age=access_max_age,
        path="/"
    )

    # Refresh token cookie settings
    refresh_max_age = settings.REMEMBER_ME_REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60 if remember_me else 7 * 24 * 60 * 60

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=is_production,
        samesite="lax",
        max_age=refresh_max_age,
        path="/"
    )

def clear_auth_cookies(response: Response):
    """Clear authentication cookies on logout."""
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")

@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(user_data: UserCreate, response: Response, db: AsyncSession = Depends(get_db)):
    """
    Create a new user account.

    Sets HttpOnly cookies with JWT access and refresh tokens.
    """
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Check if username already exists
    result = await db.execute(select(User).where(User.username == user_data.username))
    existing_username = result.scalar_one_or_none()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        username=user_data.username,
        full_name=user_data.full_name,
        hashed_password=hashed_password,
        is_active=True,
        is_superuser=False
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # Create tokens
    access_token = create_access_token(data={"sub": str(new_user.id), "email": new_user.email})
    refresh_token = create_refresh_token(data={"sub": str(new_user.id)})

    # Set HttpOnly cookies
    set_auth_cookies(response, access_token, refresh_token, remember_me=True)

    return {
        "message": "Account created successfully",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "id": str(new_user.id),
            "email": new_user.email,
            "username": new_user.username
        }
    }

@router.post("/login")
async def login(credentials: UserLogin, response: Response, db: AsyncSession = Depends(get_db)):
    """
    Authenticate user and set HttpOnly cookies with JWT tokens.

    Accepts email and password, sets access and refresh token cookies.
    """
    # Find user by email
    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )

    # Create tokens
    access_token_expires = None
    refresh_token_expires = None

    if credentials.remember_me:
        access_token_expires = timedelta(minutes=settings.REMEMBER_ME_ACCESS_TOKEN_EXPIRE_MINUTES)
        refresh_token_expires = timedelta(days=settings.REMEMBER_ME_REFRESH_TOKEN_EXPIRE_DAYS)

    access_token = create_access_token(data={"sub": str(user.id), "email": user.email}, expires_delta=access_token_expires)
    refresh_token = create_refresh_token(data={"sub": str(user.id)}, expires_delta=refresh_token_expires)

    # Set HttpOnly cookies
    set_auth_cookies(response, access_token, refresh_token, remember_me=credentials.remember_me)

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

@router.post("/refresh")
async def refresh_token(request: Request, response: Response):
    """
    Refresh access token using refresh token from cookie.
    """
    # Get refresh token from cookie
    refresh_token_value = request.cookies.get("refresh_token")

    if not refresh_token_value:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found"
        )

    try:
        payload = decode_token(refresh_token_value)

        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )

        user_id = payload.get("sub")
        email = payload.get("email")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )

        # Create new tokens
        access_token = create_access_token(data={"sub": user_id, "email": email})
        new_refresh_token = create_refresh_token(data={"sub": user_id})

        # Set new HttpOnly cookies
        set_auth_cookies(response, access_token, new_refresh_token)

        return {"message": "Token refreshed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(request: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """
    Generate and send a 6-digit password reset code to the user's email.
    """
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()

    if not user:
        # For security reasons, don't reveal if the email is not registered
        return {"message": "If an account with that email exists, a password reset code has been sent."}

    # Generate a random 6-digit code
    code = ''.join(random.choices(string.digits, k=6))

    # Calculate expiration time (15 minutes from now)
    from datetime import datetime, timedelta
    expires_at = datetime.utcnow() + timedelta(minutes=15)

    # Invalidate any previous unused codes for this user
    await db.execute(
        select(PasswordResetCode)
        .where(PasswordResetCode.user_id == user.id)
        .where(PasswordResetCode.is_used == False)
    )
    previous_codes = (await db.execute(
        select(PasswordResetCode)
        .where(PasswordResetCode.user_id == user.id)
        .where(PasswordResetCode.is_used == False)
    )).scalars().all()

    for prev_code in previous_codes:
        prev_code.is_used = True

    # Create new password reset code
    reset_code = PasswordResetCode(
        user_id=user.id,
        email=user.email,
        code=code,
        expires_at=expires_at
    )
    db.add(reset_code)
    await db.commit()

    # Render HTML email template
    html_body = render_template("password_reset_email.html", code=code)

    # Plain text fallback
    plain_body = f"""
Password Reset Request

Hello,

We received a request to reset your password for your CogniTest account.
Use the verification code below to reset your password:

{code}

This code will expire in 15 minutes.

If you didn't request this password reset, please ignore this email.

Best regards,
CogniTest Team
    """

    await send_email(
        email_to=user.email,
        subject="Password Reset",
        body=plain_body.strip(),
        html_body=html_body
    )

    return {"message": "If an account with that email exists, a password reset code has been sent."}

@router.post("/verify-reset-code", status_code=status.HTTP_200_OK)
async def verify_reset_code(request: VerifyResetCodeRequest, db: AsyncSession = Depends(get_db)):
    """
    Verify if the password reset code is valid.
    """
    from datetime import datetime

    result = await db.execute(
        select(PasswordResetCode)
        .where(PasswordResetCode.email == request.email)
        .where(PasswordResetCode.code == request.code)
        .where(PasswordResetCode.is_used == False)
        .order_by(PasswordResetCode.created_at.desc())
    )
    reset_code = result.scalar_one_or_none()

    if not reset_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code"
        )

    if reset_code.is_expired():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired"
        )

    return {"message": "Verification code is valid"}

@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(request: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """
    Reset user's password using a valid 6-digit code.
    """
    from datetime import datetime

    # Find the reset code
    result = await db.execute(
        select(PasswordResetCode)
        .where(PasswordResetCode.email == request.email)
        .where(PasswordResetCode.code == request.code)
        .where(PasswordResetCode.is_used == False)
        .order_by(PasswordResetCode.created_at.desc())
    )
    reset_code = result.scalar_one_or_none()

    if not reset_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code"
        )

    if reset_code.is_expired():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired"
        )

    # Find the user
    user_result = await db.execute(select(User).where(User.id == reset_code.user_id))
    user = user_result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Update password
    user.hashed_password = get_password_hash(request.new_password)

    # Mark the code as used
    reset_code.is_used = True

    await db.commit()
    await db.refresh(user)

    return {"message": "Password has been reset successfully."}

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """
    Get current authenticated user information.
    """
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update current user's information.
    """
    # Check if email is being changed and is unique
    if user_update.email and user_update.email != current_user.email:
        result = await db.execute(select(User).where(User.email == user_update.email))
        existing_email = result.scalar_one_or_none()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use"
            )
        current_user.email = user_update.email

    # Check if username is being changed and is unique
    if user_update.username and user_update.username != current_user.username:
        result = await db.execute(select(User).where(User.username == user_update.username))
        existing_username = result.scalar_one_or_none()
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        current_user.username = user_update.username

    # Update other fields
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name

    if user_update.password:
        current_user.hashed_password = get_password_hash(user_update.password)

    await db.commit()
    await db.refresh(current_user)

    return current_user

@router.post("/logout")
async def logout(response: Response, current_user: User = Depends(get_current_active_user)):
    """
    Logout current user by clearing HttpOnly cookies.
    """
    clear_auth_cookies(response)
    return {"message": "Successfully logged out"}
