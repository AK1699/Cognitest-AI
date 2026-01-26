import asyncio
import os
import sys

# Add backend directory to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text, inspect

from app.core.config import settings

async def check_schema():
    # Database URL
    DATABASE_URL = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
    
    engine = create_async_engine(DATABASE_URL, echo=False)
    
    async with engine.connect() as conn:
        # Check columns in performance_metrics table
        result = await conn.execute(text(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'performance_metrics';"
        ))
        columns = result.fetchall()
        print("Columns in performance_metrics:")
        has_raw = False
        for col in columns:
            print(f"- {col[0]} ({col[1]})")
            if col[0] == 'raw_response':
                has_raw = True
        
        print(f"\nHas raw_response column: {has_raw}")

if __name__ == "__main__":
    asyncio.run(check_schema())
