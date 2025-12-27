import redis.asyncio as redis
import json
from typing import Optional, Any
from functools import wraps
import hashlib

from app.core.config import settings

# Redis connection pool
_redis_pool: Optional[redis.ConnectionPool] = None


async def get_redis_client() -> redis.Redis:
    """
    Get Redis client with connection pooling.
    """
    global _redis_pool

    if _redis_pool is None:
        _redis_pool = redis.ConnectionPool.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            max_connections=10
        )

    return redis.Redis(connection_pool=_redis_pool)


async def close_redis():
    """
    Close Redis connection pool.
    """
    global _redis_pool
    if _redis_pool is not None:
        await _redis_pool.disconnect()
        _redis_pool = None


class CacheService:
    """
    Redis caching service with common operations.
    """

    @staticmethod
    async def get(key: str) -> Optional[Any]:
        """
        Get value from cache.
        """
        try:
            client = await get_redis_client()
            value = await client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            print(f"Cache get error: {e}")
            return None

    @staticmethod
    async def set(key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """
        Set value in cache with optional TTL.
        """
        try:
            client = await get_redis_client()
            serialized = json.dumps(value)
            if ttl:
                await client.setex(key, ttl, serialized)
            else:
                await client.set(key, serialized)
            return True
        except Exception as e:
            print(f"Cache set error: {e}")
            return False

    @staticmethod
    async def delete(key: str) -> bool:
        """
        Delete key from cache.
        """
        try:
            client = await get_redis_client()
            await client.delete(key)
            return True
        except Exception as e:
            print(f"Cache delete error: {e}")
            return False

    @staticmethod
    async def delete_pattern(pattern: str) -> int:
        """
        Delete all keys matching pattern.
        """
        try:
            client = await get_redis_client()
            keys = []
            async for key in client.scan_iter(match=pattern):
                keys.append(key)

            if keys:
                return await client.delete(*keys)
            return 0
        except Exception as e:
            print(f"Cache delete pattern error: {e}")
            return 0

    @staticmethod
    async def exists(key: str) -> bool:
        """
        Check if key exists in cache.
        """
        try:
            client = await get_redis_client()
            return await client.exists(key) > 0
        except Exception as e:
            print(f"Cache exists error: {e}")
            return False

    @staticmethod
    async def expire(key: str, ttl: int) -> bool:
        """
        Set expiration time for key.
        """
        try:
            client = await get_redis_client()
            return await client.expire(key, ttl)
        except Exception as e:
            print(f"Cache expire error: {e}")
            return False

    @staticmethod
    def generate_cache_key(*args, prefix: str = "cognitest", **kwargs) -> str:
        """
        Generate cache key from arguments.
        """
        # Create a string representation of args and kwargs
        key_parts = [str(arg) for arg in args]
        key_parts.extend([f"{k}={v}" for k, v in sorted(kwargs.items())])
        key_string = ":".join(key_parts)

        # Hash if too long
        if len(key_string) > 100:
            key_hash = hashlib.md5(key_string.encode()).hexdigest()
            return f"{prefix}:{key_hash}"

        return f"{prefix}:{key_string}"


def cache_result(ttl: Optional[int] = None, key_prefix: str = "cache"):
    """
    Decorator to cache function results.

    Usage:
        @cache_result(ttl=3600, key_prefix="user")
        async def get_user(user_id: str):
            ...
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = CacheService.generate_cache_key(
                *args,
                prefix=f"{key_prefix}:{func.__name__}",
                **kwargs
            )

            # Try to get from cache
            cached_value = await CacheService.get(cache_key)
            if cached_value is not None:
                return cached_value

            # Execute function
            result = await func(*args, **kwargs)

            # Cache result
            if result is not None:
                await CacheService.set(
                    cache_key,
                    result,
                    ttl=ttl or settings.REDIS_CACHE_TTL
                )

            return result

        return wrapper
    return decorator


async def invalidate_cache_pattern(pattern: str):
    """
    Invalidate all cache keys matching pattern.

    Usage:
        await invalidate_cache_pattern("user:*")
    """
    return await CacheService.delete_pattern(pattern)


async def invalidate_org_caches(org_id: str, user_id: str = None):
    """Invalidate cache entries for an organization."""
    await invalidate_cache_pattern(f"org:{org_id}:*")
    if user_id:
        await invalidate_cache_pattern(f"orgs:user:{user_id}")
