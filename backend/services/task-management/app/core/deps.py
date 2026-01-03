from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_session_maker
from .config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = async_session_maker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session

def get_db_sync():
    """Sync version for Celery tasks if needed (using async_to_sync)"""
    # Note: In a real microservice, you'd handle this more robustly
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    sync_engine = create_engine(settings.DATABASE_URL.replace("postgresql+asyncpg", "postgresql"))
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)
    return SessionLocal()
