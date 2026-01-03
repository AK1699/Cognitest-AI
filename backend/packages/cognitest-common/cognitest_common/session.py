import json
from typing import Optional, Any, Dict
from redis.asyncio import Redis

class SessionService:
    """Manages user sessions in Redis."""
    
    SESSION_PREFIX = "session"
    SESSION_TTL = 7 * 24 * 60 * 60  # 7 days
    
    @classmethod
    def _get_session_key(cls, user_id: str) -> str:
        return f"{cls.SESSION_PREFIX}:{user_id}"
    
    @classmethod
    async def get_session(cls, redis_client: Redis, user_id: str) -> Optional[Dict[str, Any]]:
        try:
            key = cls._get_session_key(user_id)
            data = await redis_client.get(key)
            return json.loads(data) if data else None
        except Exception:
            return None
    
    @classmethod
    async def set_session(cls, redis_client: Redis, user_id: str, data: Dict[str, Any]) -> bool:
        try:
            key = cls._get_session_key(user_id)
            await redis_client.setex(key, cls.SESSION_TTL, json.dumps(data))
            return True
        except Exception:
            return False
    
    @classmethod
    async def update_session(cls, redis_client: Redis, user_id: str, updates: Dict[str, Any]) -> bool:
        current = await cls.get_session(redis_client, user_id) or {}
        current.update(updates)
        return await cls.set_session(redis_client, user_id, current)
    
    @classmethod
    async def delete_session(cls, redis_client: Redis, user_id: str) -> bool:
        try:
            key = cls._get_session_key(user_id)
            await redis_client.delete(key)
            return True
        except Exception:
            return False

    @classmethod
    async def extend_session(cls, redis_client: Redis, user_id: str) -> bool:
        try:
            key = cls._get_session_key(user_id)
            return await redis_client.expire(key, cls.SESSION_TTL)
        except Exception:
            return False
