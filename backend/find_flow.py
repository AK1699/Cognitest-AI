import asyncio
import os
import sys
sys.path.append(os.getcwd())
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.test_flow import TestFlow

async def main():
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(TestFlow).limit(5))
            flows = result.scalars().all()
            if flows:
                for flow in flows:
                    print(f"FLOW_ID: {flow.id} | NAME: {flow.name}")
            else:
                print("NO_FLOWS_FOUND")
    except Exception as e:
        print(f"ERROR: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main())
