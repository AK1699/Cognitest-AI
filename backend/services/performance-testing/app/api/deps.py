from typing import Generator, Optional, AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends, Header, HTTPException
import os

from ..core.database import async_session_maker
from ..services.performance_testing_service import PerformanceTestingService


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting async database session"""
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


async def get_performance_testing_service(
    db: AsyncSession = Depends(get_db)
) -> PerformanceTestingService:
    """Dependency for getting performance testing service"""
    return PerformanceTestingService(
        db=db,
        pagespeed_api_key=os.getenv("PAGESPEED_API_KEY"),
        loader_api_key=os.getenv("LOADERIO_API_KEY"),
        wpt_api_key=os.getenv("WPT_API_KEY"),
        google_api_key=os.getenv("GOOGLE_API_KEY"),
    )


async def get_current_user_id(
    x_user_id: Optional[str] = Header(None)
) -> str:
    """
    Get current user ID from headers.
    In a microservices architecture, the gateway/monolith validates the token
    and forwards the user ID in a header.
    """
    if not x_user_id:
        # For development/local testing, you might want to allow this or use a default
        # raise HTTPException(status_code=401, detail="User ID header missing")
        return "00000000-0000-0000-0000-000000000000"
    return x_user_id
