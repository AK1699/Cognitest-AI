#!/usr/bin/env python3
"""
Initialize database tables
"""
import asyncio
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import settings
from app.core.database import Base
from app.models.user import User
from app.models.organisation import Organisation  # Import all models

async def init_db():
    """Create all database tables"""
    print("Creating database tables...")

    # Use async engine but run_sync for create_all
    engine = create_async_engine(settings.DATABASE_URL, echo=True)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    await engine.dispose()
    print("✅ Database tables created successfully!")

if __name__ == "__main__":
    asyncio.run(init_db())
