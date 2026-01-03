"""
Qdrant Vector Database Service for Knowledge Storage and Retrieval
"""
from typing import Optional, List, Dict, Any
from qdrant_client import QdrantClient, models
from qdrant_client.models import Distance, VectorParams, PointStruct
import logging
import uuid
from datetime import datetime

from ..core.config import settings

logger = logging.getLogger(__name__)


class QdrantService:
    """
    Service for interacting with Qdrant vector database.
    Handles collection management, vector storage, and semantic search.
    """

    def __init__(self):
        """Initialize Qdrant client connection."""
        try:
            if settings.QDRANT_API_KEY:
                self.client = QdrantClient(
                    url=settings.QDRANT_URL,
                    api_key=settings.QDRANT_API_KEY
                )
            else:
                self.client = QdrantClient(url=settings.QDRANT_URL)
            logger.info(f"Connected to Qdrant at {settings.QDRANT_URL}")
        except Exception as e:
            logger.error(f"Failed to connect to Qdrant: {e}")
            raise

    async def ensure_collection_exists(
        self,
        collection_name: str,
        vector_size: int = 1536,  # OpenAI text-embedding-3-small size
    ) -> bool:
        """
        Ensure a collection exists in Qdrant. Creates it if it doesn't.

        Args:
            collection_name: Name of the collection
            vector_size: Size of vectors (default for OpenAI embeddings)

        Returns:
            True if collection exists or was created successfully
        """
        try:
            collections = self.client.get_collections()
            if collection_name in [col.name for col in collections.collections]:
                logger.debug(f"Collection '{collection_name}' already exists")
                return True

            # Create collection
            self.client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
            )
            logger.info(f"Created collection '{collection_name}'")
            return True
        except Exception as e:
            logger.error(f"Error ensuring collection exists: {e}")
            raise

    async def store_vector(
        self,
        collection_name: str,
        point_id: Optional[str] = None,
        vector: Optional[List[float]] = None,
        payload: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Store a vector point in Qdrant.

        Args:
            collection_name: Name of the collection
            point_id: Optional custom ID for the point
            vector: Vector embeddings
            payload: Additional metadata to store with the vector

        Returns:
            The point ID
        """
        try:
            if point_id is None:
                point_id = str(uuid.uuid4())

            if payload is None:
                payload = {}

            # Add timestamp to payload
            payload["stored_at"] = datetime.utcnow().isoformat()

            # Convert UUID string to integer for Qdrant point ID
            point_id_int = int(uuid.UUID(point_id).int) % (2 ** 63)

            point = PointStruct(
                id=point_id_int,
                vector=vector,
                payload=payload,
            )

            self.client.upsert(
                collection_name=collection_name,
                points=[point],
            )

            logger.debug(f"Stored vector in '{collection_name}' with ID {point_id}")
            return point_id

        except Exception as e:
            logger.error(f"Error storing vector: {e}")
            raise

    async def search_vectors(
        self,
        collection_name: str,
        query_vector: List[float],
        limit: int = 5,
        score_threshold: float = 0.7,
    ) -> List[Dict[str, Any]]:
        """
        Search for similar vectors in a collection.

        Args:
            collection_name: Name of the collection
            query_vector: Query embedding vector
            limit: Maximum number of results
            score_threshold: Minimum similarity score (0-1)

        Returns:
            List of matching points with metadata
        """
        try:
            results = self.client.search(
                collection_name=collection_name,
                query_vector=query_vector,
                limit=limit,
                score_threshold=score_threshold,
            )

            # Format results
            matches = []
            for result in results:
                match = {
                    "id": str(result.id),
                    "score": result.score,
                    "payload": result.payload,
                }
                matches.append(match)

            logger.debug(f"Found {len(matches)} matches in '{collection_name}'")
            return matches

        except Exception as e:
            logger.error(f"Error searching vectors: {e}")
            return []

    async def delete_point(
        self,
        collection_name: str,
        point_id: str,
    ) -> bool:
        """
        Delete a point from a collection.

        Args:
            collection_name: Name of the collection
            point_id: ID of the point to delete

        Returns:
            True if successful
        """
        try:
            point_id_int = int(uuid.UUID(point_id).int) % (2 ** 63)

            self.client.delete(
                collection_name=collection_name,
                points_selector=models.PointIdsList(
                    points=[point_id_int],
                ),
            )

            logger.debug(f"Deleted point {point_id} from '{collection_name}'")
            return True

        except Exception as e:
            logger.error(f"Error deleting point: {e}")
            return False

    async def delete_collection(self, collection_name: str) -> bool:
        """
        Delete an entire collection.

        Args:
            collection_name: Name of the collection to delete

        Returns:
            True if successful
        """
        try:
            self.client.delete_collection(collection_name=collection_name)
            logger.info(f"Deleted collection '{collection_name}'")
            return True

        except Exception as e:
            logger.error(f"Error deleting collection: {e}")
            return False

    async def get_collection_stats(self, collection_name: str) -> Dict[str, Any]:
        """
        Get statistics about a collection.

        Args:
            collection_name: Name of the collection

        Returns:
            Collection statistics
        """
        try:
            collection_info = self.client.get_collection(collection_name)
            return {
                "points_count": collection_info.points_count,
                "vectors_count": collection_info.vectors_count,
                "status": collection_info.status,
            }
        except Exception as e:
            logger.error(f"Error getting collection stats: {e}")
            return {}


# Singleton instance
_qdrant_service: Optional[QdrantService] = None


async def get_qdrant_service() -> QdrantService:
    """
    Get singleton Qdrant service instance.

    Returns:
        QdrantService instance
    """
    global _qdrant_service
    if _qdrant_service is None:
        _qdrant_service = QdrantService()
    return _qdrant_service
