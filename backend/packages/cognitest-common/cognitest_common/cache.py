import redis.asyncio as redis
import json
import hashlib
from typing import Optional, Any
from functools import wraps

_redis_client: Optional[redis.Redis] = None

async def get_redis_client(redis_url: str) -> redis.Redis:
    """Get or create singleton Redis client."""
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(redis_url, decode_responses=True)
    return _redis_client

async def close_redis():
    """Close Redis client."""
    global _redis_client
    if _redis_client:
        await _redis_client.close()
        _redis_client = None

class CacheService:
    """Redis caching service with common operations."""

    @staticmethod
    async def get(redis_client: redis.Redis, key: str) -> Optional[Any]:
        try:
            value = await redis_client.get(key)
            return json.loads(value) if value else None
        except Exception:
            return None

    @staticmethod
    async def set(redis_client: redis.Redis, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        try:
            serialized = json.dumps(value)
            if ttl:
                await redis_client.setex(key, ttl, serialized)
            else:
                await redis_client.set(key, serialized)
            return True
        except Exception:
            return False

    @staticmethod
    async def delete(redis_client: redis.Redis, key: str) -> bool:
        try:
            await redis_client.delete(key)
            return True
        except Exception:
            return False

    @staticmethod
    async def delete_pattern(redis_client: redis.Redis, pattern: str) -> int:
        try:
            keys = []
            async for key in redis_client.scan_iter(match=pattern):
                keys.append(key)
            if keys:
                return await redis_client.delete(*keys)
            return 0
        except Exception:
            return 0

    @staticmethod
    def generate_cache_key(*args, prefix: str = "cognitest", **kwargs) -> str:
        key_parts = [str(arg) for arg in args]
        key_parts.extend([f"{k}={v}" for k, v in sorted(kwargs.items())])
        key_string = ":".join(key_parts)
        if len(key_string) > 100:
            key_hash = hashlib.md5(key_string.encode()).hexdigest()
            return f"{prefix}:{key_hash}"
        return f"{prefix}:{key_string}"

async def invalidate_cache_pattern(redis_client: redis.Redis, pattern: str):
    """Invalidate all cache keys matching pattern."""
    return await CacheService.delete_pattern(redis_client, pattern)

async def invalidate_org_caches(redis_client: redis.Redis, org_id: str, user_id: str = None):
    """Invalidate cache entries for an organization."""
    await invalidate_cache_pattern(redis_client, f"org:{org_id}:*")
    if user_id:
        await invalidate_cache_pattern(redis_client, f"orgs:user:{user_id}")
