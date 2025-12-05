"""
Redis-based session management service.
Stores user session data (current organization, project, preferences) server-side.
"""
import json
from typing import Optional, Any, Dict
from uuid import UUID

from app.core.cache import get_redis_client, CacheService
from app.core.config import settings


class SessionService:
    """
    Manages user sessions in Redis.
    
    Session data includes:
    - current_organization_id: User's selected organization
    - current_project_id: User's selected project
    - preferences: User UI preferences
    """
    
    SESSION_PREFIX = "session"
    SESSION_TTL = 7 * 24 * 60 * 60  # 7 days in seconds
    
    @classmethod
    def _get_session_key(cls, user_id: str) -> str:
        """Generate Redis key for user session."""
        return f"{cls.SESSION_PREFIX}:{user_id}"
    
    @classmethod
    async def get_session(cls, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get complete session data for a user.
        
        Args:
            user_id: The user's UUID as string
            
        Returns:
            Session data dict or None if no session exists
        """
        try:
            client = await get_redis_client()
            key = cls._get_session_key(user_id)
            data = await client.get(key)
            
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            print(f"Session get error: {e}")
            return None
    
    @classmethod
    async def set_session(cls, user_id: str, data: Dict[str, Any]) -> bool:
        """
        Set complete session data for a user.
        
        Args:
            user_id: The user's UUID as string
            data: Session data to store
            
        Returns:
            True if successful, False otherwise
        """
        try:
            client = await get_redis_client()
            key = cls._get_session_key(user_id)
            await client.setex(key, cls.SESSION_TTL, json.dumps(data))
            return True
        except Exception as e:
            print(f"Session set error: {e}")
            return False
    
    @classmethod
    async def update_session(cls, user_id: str, updates: Dict[str, Any]) -> bool:
        """
        Update specific fields in user session without overwriting others.
        
        Args:
            user_id: The user's UUID as string
            updates: Fields to update
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Get current session
            current = await cls.get_session(user_id) or {}
            
            # Merge updates
            current.update(updates)
            
            # Save back
            return await cls.set_session(user_id, current)
        except Exception as e:
            print(f"Session update error: {e}")
            return False
    
    @classmethod
    async def get_field(cls, user_id: str, field: str) -> Optional[Any]:
        """
        Get a specific field from user session.
        
        Args:
            user_id: The user's UUID as string
            field: Field name to retrieve
            
        Returns:
            Field value or None
        """
        session = await cls.get_session(user_id)
        if session:
            return session.get(field)
        return None
    
    @classmethod
    async def set_field(cls, user_id: str, field: str, value: Any) -> bool:
        """
        Set a specific field in user session.
        
        Args:
            user_id: The user's UUID as string
            field: Field name to set
            value: Value to store
            
        Returns:
            True if successful, False otherwise
        """
        return await cls.update_session(user_id, {field: value})
    
    @classmethod
    async def delete_session(cls, user_id: str) -> bool:
        """
        Delete user session entirely.
        
        Args:
            user_id: The user's UUID as string
            
        Returns:
            True if successful, False otherwise
        """
        try:
            client = await get_redis_client()
            key = cls._get_session_key(user_id)
            await client.delete(key)
            return True
        except Exception as e:
            print(f"Session delete error: {e}")
            return False
    
    @classmethod
    async def extend_session(cls, user_id: str) -> bool:
        """
        Extend session TTL (call on user activity).
        
        Args:
            user_id: The user's UUID as string
            
        Returns:
            True if successful, False otherwise
        """
        try:
            client = await get_redis_client()
            key = cls._get_session_key(user_id)
            return await client.expire(key, cls.SESSION_TTL)
        except Exception as e:
            print(f"Session extend error: {e}")
            return False
    
    # Convenience methods for common session fields
    
    @classmethod
    async def get_current_organization(cls, user_id: str) -> Optional[str]:
        """Get user's current organization ID."""
        return await cls.get_field(user_id, "current_organization_id")
    
    @classmethod
    async def set_current_organization(cls, user_id: str, org_id: str) -> bool:
        """Set user's current organization ID."""
        return await cls.set_field(user_id, "current_organization_id", org_id)
    
    @classmethod
    async def get_current_project(cls, user_id: str) -> Optional[str]:
        """Get user's current project ID."""
        return await cls.get_field(user_id, "current_project_id")
    
    @classmethod
    async def set_current_project(cls, user_id: str, project_id: str) -> bool:
        """Set user's current project ID."""
        return await cls.set_field(user_id, "current_project_id", project_id)
