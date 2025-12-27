import asyncio
import redis.asyncio as redis
import os
import sys

# Ensure backend is in sys.path
sys.path.append(os.getcwd())

from app.core.config import settings

async def run():
    print(f"Connecting to Redis at {settings.REDIS_URL}")
    try:
        r = redis.from_url(settings.REDIS_URL)
        pattern = "orgs:user:694d32dc-7e4e-4a9f-a507-7cf63a022c97"
        print(f"Deleting keys matching {pattern}")
        keys = await r.keys(pattern)
        print(f"Found keys: {keys}")
        if keys:
            await r.delete(*keys)
            print("Deleted successfully")
        else:
            print("No keys found to delete")
            
        # Also let's just flush all org related patterns for this user if any exist
        pattern2 = "org:*:user:694d32dc-7e4e-4a9f-a507-7cf63a022c97"
        keys2 = await r.keys(pattern2)
        if keys2:
            print(f"Found more keys: {keys2}")
            await r.delete(*keys2)
            
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == '__main__':
    asyncio.run(run())
