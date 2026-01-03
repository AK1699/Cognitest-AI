from typing import AsyncGenerator, Optional
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt, JWTError
from uuid import UUID

from cognitest_common import create_session_factory, decode_token
from .config import settings
from ..models.user import User

# Create session factory
SessionLocal = create_session_factory(settings.DATABASE_URL)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session

async def get_current_user(
    token: str = Depends(lambda: None), # Will be handled by security or direct cookie check
    db: AsyncSession = Depends(get_db)
) -> User:
    # This is a simplified version, ideally we would use the shared security logic
    # but for now we re-implement or call the shared decode_token
    # In a real microservice, this might call the IAM service or validate the JWT locally
    
    # For now, we assume the token is in a cookie or header and we validate it using the shared secret
    # This matches the current monolithic/extracted IAM logic
    
    from fastapi import Request
    def get_token_from_request(request: Request):
        return request.cookies.get("access_token") or request.headers.get("Authorization", "").replace("Bearer ", "")

    # We need a way to get the token, FastAPI's Depends can be nested
    return await _get_user_from_token(db,token)

async def _get_user_from_token(db: AsyncSession, token: str) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    
    try:
        payload = decode_token(token, settings.SECRET_KEY, settings.ALGORITHM)
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )
        user_id = UUID(user_id_str)
    except (JWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
    
    from sqlalchemy import select
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user
