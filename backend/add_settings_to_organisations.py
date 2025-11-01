"""
Add settings column to organisations table
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from app.core.config import settings


async def migrate():
    """Add settings column to organisations table"""
    # Create async engine
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        try:
            print("Adding settings column to organisations table...")

            # Check if column already exists
            check_stmt = text("""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'organisations' AND column_name = 'settings'
            """)
            result = await session.execute(check_stmt)
            column_exists = result.scalar() is not None

            if column_exists:
                print("✓ Settings column already exists")
            else:
                # Add the column
                add_column_stmt = text("""
                    ALTER TABLE organisations
                    ADD COLUMN settings JSON DEFAULT '{}'
                """)
                await session.execute(add_column_stmt)
                await session.commit()
                print("✓ Settings column added successfully")

        except Exception as e:
            await session.rollback()
            print(f"❌ Migration failed: {str(e)}")
            import traceback
            traceback.print_exc()
        finally:
            await engine.dispose()


if __name__ == "__main__":
    asyncio.run(migrate())
