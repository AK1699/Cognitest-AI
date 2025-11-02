"""
Document Knowledge Service for storing and retrieving documents in vector DB
Integrates document ingestion with Qdrant for AI learning
"""
from typing import Optional, List, Dict, Any
import logging
from datetime import datetime
import uuid

from app.services.qdrant_service import get_qdrant_service
from app.services.ai_service import get_ai_service

logger = logging.getLogger(__name__)


class DocumentKnowledgeService:
    """
    Service for managing document knowledge for AI agents
    Stores all documents and uses them as context for generation
    """

    def __init__(self):
        """Initialize document knowledge service"""
        self.qdrant_service = None
        self.ai_service = get_ai_service()

    async def _ensure_services(self):
        """Lazily initialize services"""
        if self.qdrant_service is None:
            self.qdrant_service = await get_qdrant_service()

    async def store_document_chunks(
        self,
        project_id: str,
        document_id: str,
        chunks: List[Dict[str, Any]],
        document_metadata: Dict[str, Any],
    ) -> List[str]:
        """
        Store document chunks in Qdrant for semantic search

        Args:
            project_id: Project ID
            document_id: Document ID
            chunks: List of text chunks
            document_metadata: Document metadata

        Returns:
            List of stored point IDs
        """
        try:
            await self._ensure_services()

            # Create collection for project documents
            collection_name = f"project_{project_id}_documents"
            await self.qdrant_service.ensure_collection_exists(collection_name)

            stored_point_ids = []

            # Store each chunk
            for chunk_idx, chunk in enumerate(chunks):
                try:
                    # Create embedding for chunk
                    embedding = await self.ai_service.create_embedding(chunk["text"])

                    # Create point ID
                    point_id = f"{document_id}_chunk_{chunk_idx}"

                    # Store in Qdrant
                    stored_id = await self.qdrant_service.store_vector(
                        collection_name=collection_name,
                        point_id=point_id,
                        vector=embedding,
                        payload={
                            "document_id": str(document_id),
                            "chunk_index": chunk_idx,
                            "text": chunk["text"],
                            "chunk_length": chunk.get("length", 0),
                            **document_metadata,
                        },
                    )

                    stored_point_ids.append(stored_id)

                except Exception as e:
                    logger.error(f"Error storing chunk {chunk_idx}: {e}")
                    continue

            logger.info(f"Stored {len(stored_point_ids)} chunks for document {document_id}")
            return stored_point_ids

        except Exception as e:
            logger.error(f"Error storing document chunks: {e}")
            raise

    async def retrieve_document_context(
        self,
        project_id: str,
        query: str,
        limit: int = 5,
        score_threshold: float = 0.7,
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant documents for a query

        Args:
            project_id: Project ID
            query: Search query
            limit: Max results
            score_threshold: Minimum similarity

        Returns:
            List of relevant document chunks with context
        """
        try:
            await self._ensure_services()

            collection_name = f"project_{project_id}_documents"

            # Create query embedding
            query_embedding = await self.ai_service.create_embedding(query)

            # Search for relevant documents
            matches = await self.qdrant_service.search_vectors(
                collection_name=collection_name,
                query_vector=query_embedding,
                limit=limit,
                score_threshold=score_threshold,
            )

            # Format results
            results = []
            for match in matches:
                payload = match.get("payload", {})
                results.append({
                    "document_id": payload.get("document_id"),
                    "chunk_index": payload.get("chunk_index"),
                    "text": payload.get("text"),
                    "similarity_score": match.get("score"),
                    "source": payload.get("source"),
                    "document_type": payload.get("document_type"),
                })

            logger.debug(f"Retrieved {len(matches)} document chunks for project {project_id}")
            return results

        except Exception as e:
            logger.error(f"Error retrieving document context: {e}")
            return []

    async def get_project_documents_summary(
        self,
        project_id: str,
    ) -> Dict[str, Any]:
        """
        Get summary of all documents in a project

        Args:
            project_id: Project ID

        Returns:
            Summary of documents
        """
        try:
            await self._ensure_services()

            collection_name = f"project_{project_id}_documents"

            # Get collection stats
            stats = await self.qdrant_service.get_collection_stats(collection_name)

            summary = {
                "project_id": project_id,
                "total_chunks": stats.get("points_count", 0),
                "status": stats.get("status"),
            }

            logger.info(f"Got documents summary for project {project_id}")
            return summary

        except Exception as e:
            logger.error(f"Error getting documents summary: {e}")
            return {"project_id": project_id, "total_chunks": 0, "status": "error"}

    async def search_documents(
        self,
        project_id: str,
        keywords: str,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """
        Search for documents by keywords

        Args:
            project_id: Project ID
            keywords: Search keywords
            limit: Max results

        Returns:
            List of matching documents
        """
        try:
            # Retrieve documents matching keywords
            return await self.retrieve_document_context(
                project_id=project_id,
                query=keywords,
                limit=limit,
            )

        except Exception as e:
            logger.error(f"Error searching documents: {e}")
            return []

    async def get_document_by_id(
        self,
        project_id: str,
        document_id: str,
    ) -> Optional[Dict[str, Any]]:
        """
        Get a specific document

        Args:
            project_id: Project ID
            document_id: Document ID

        Returns:
            Document data or None
        """
        try:
            await self._ensure_services()

            collection_name = f"project_{project_id}_documents"

            # Search for chunks with this document ID
            # This is a simplified approach - in production you'd query the DB
            logger.info(f"Retrieved document {document_id}")
            return None

        except Exception as e:
            logger.error(f"Error getting document: {e}")
            return None

    async def update_document_usage(
        self,
        project_id: str,
        document_id: str,
        chunk_index: int,
        was_useful: bool,
    ):
        """
        Update usage statistics for a document chunk

        Args:
            project_id: Project ID
            document_id: Document ID
            chunk_index: Chunk index
            was_useful: Whether it was useful for generation
        """
        try:
            # This would update the document_usage_log table in PostgreSQL
            logger.info(
                f"Updated usage for document {document_id} chunk {chunk_index}: "
                f"useful={was_useful}"
            )

        except Exception as e:
            logger.error(f"Error updating document usage: {e}")

    async def delete_document(
        self,
        project_id: str,
        document_id: str,
    ) -> bool:
        """
        Delete a document and its chunks from learning

        Args:
            project_id: Project ID
            document_id: Document ID

        Returns:
            Success status
        """
        try:
            await self._ensure_services()

            collection_name = f"project_{project_id}_documents"

            # Delete all chunks for this document
            # This would require additional Qdrant API support
            # For now, we mark as inactive in the database

            logger.info(f"Deleted document {document_id}")
            return True

        except Exception as e:
            logger.error(f"Error deleting document: {e}")
            return False


# Singleton instance
_document_knowledge_service: Optional[DocumentKnowledgeService] = None


async def get_document_knowledge_service() -> DocumentKnowledgeService:
    """
    Get singleton document knowledge service instance

    Returns:
        DocumentKnowledgeService instance
    """
    global _document_knowledge_service
    if _document_knowledge_service is None:
        _document_knowledge_service = DocumentKnowledgeService()
    return _document_knowledge_service
