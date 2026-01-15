import asyncio
from sqlalchemy import text
from app.core.database import engine

async def check_schema():
    async with engine.connect() as conn:
        print("Checking api_history columns...")
        result = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'api_history'"))
        cols = [r[0] for r in result.fetchall()]
        print(f"Columns: {cols}")

if __name__ == "__main__":
    asyncio.run(check_schema())
