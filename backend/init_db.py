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
from app.models.organisation import Organisation, UserOrganisation
from app.models.project import Project
from app.models.test_plan import TestPlan
from app.models.test_suite import TestSuite
from app.models.test_case import TestCase
from app.models.invitation import UserInvitation
from app.models.role import Permission, ProjectRole, UserProjectRole, GroupProjectRole
from app.models.group import Group
from app.models.group_type import GroupType, GroupTypeRole, GroupTypeAccess
from app.models.password_reset import PasswordResetCode
from app.models.oauth_account import OAuthAccount

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
