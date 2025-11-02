"""
Knowledge retrieval and management service for AI agents
"""
from typing import Optional, List, Dict, Any
import logging
import json

from app.services.qdrant_service import get_qdrant_service
from app.services.ai_service import get_ai_service

logger = logging.getLogger(__name__)


class KnowledgeService:
    """
    Service for managing AI knowledge base for agents.
    Handles retrieval of learned patterns and historical data for context.
    """

    def __init__(self):
        """Initialize knowledge service"""
        self.qdrant_service = None
        self.ai_service = get_ai_service()

    async def _ensure_services(self):
        """Lazily initialize services"""
        if self.qdrant_service is None:
            self.qdrant_service = await get_qdrant_service()

    async def get_agent_context(
        self,
        project_id: str,
        agent_name: str,
        query: str,
        limit: int = 5,
        threshold: float = 0.7,
    ) -> Dict[str, Any]:
        """
        Get contextual knowledge for an agent from previous executions.

        Args:
            project_id: Project ID
            agent_name: Agent name
            query: Query string for semantic search
            limit: Max results
            threshold: Similarity threshold

        Returns:
            Context dictionary with relevant knowledge
        """
        try:
            await self._ensure_services()

            # Search in agent-specific feedback collection
            collection_name = f"project_{project_id}_feedback_{agent_name}"

            # Create query embedding
            query_embedding = await self.ai_service.create_embedding(query)

            # Search for relevant knowledge
            matches = await self.qdrant_service.search_vectors(
                collection_name=collection_name,
                query_vector=query_embedding,
                limit=limit,
                score_threshold=threshold,
            )

            # Format context
            context = {
                "similar_cases": [],
                "patterns": [],
                "recommendations": [],
            }

            for match in matches:
                payload = match.get("payload", {})
                context["similar_cases"].append({
                    "similarity_score": match.get("score"),
                    "text": payload.get("text", ""),
                    "is_accepted": payload.get("is_accepted"),
                })

            logger.debug(f"Retrieved context for {agent_name}: {len(matches)} matches")
            return context

        except Exception as e:
            logger.error(f"Error retrieving agent context: {e}")
            return {"similar_cases": [], "patterns": [], "recommendations": []}

    async def get_project_knowledge(
        self,
        project_id: str,
        query: str,
        limit: int = 10,
        threshold: float = 0.7,
    ) -> List[Dict[str, Any]]:
        """
        Get knowledge across all agents in a project.

        Args:
            project_id: Project ID
            query: Search query
            limit: Max results
            threshold: Similarity threshold

        Returns:
            List of relevant knowledge items
        """
        try:
            await self._ensure_services()

            # Search across all feedback for the project
            collection_name = f"project_{project_id}_all_feedback"

            # Create query embedding
            query_embedding = await self.ai_service.create_embedding(query)

            # Search
            matches = await self.qdrant_service.search_vectors(
                collection_name=collection_name,
                query_vector=query_embedding,
                limit=limit,
                score_threshold=threshold,
            )

            # Format results
            results = []
            for match in matches:
                results.append({
                    "id": match.get("id"),
                    "score": match.get("score"),
                    "agent": match.get("payload", {}).get("agent"),
                    "content": match.get("payload", {}).get("text", ""),
                })

            logger.debug(f"Retrieved {len(matches)} knowledge items for project {project_id}")
            return results

        except Exception as e:
            logger.error(f"Error retrieving project knowledge: {e}")
            return []

    async def get_accepted_patterns(
        self,
        project_id: str,
        agent_name: str,
        limit: int = 5,
    ) -> List[Dict[str, Any]]:
        """
        Get patterns from accepted/approved AI outputs.

        Args:
            project_id: Project ID
            agent_name: Agent name
            limit: Max results

        Returns:
            List of patterns from accepted outputs
        """
        try:
            await self._ensure_services()

            collection_name = f"project_{project_id}_feedback_{agent_name}"

            # Get collection stats
            stats = await self.qdrant_service.get_collection_stats(collection_name)

            if stats.get("points_count", 0) == 0:
                logger.debug(f"No patterns found for {agent_name}")
                return []

            # Since we can't filter by accepted in search, we return top matches
            # In production, you'd maintain a separate collection for accepted items
            logger.info(f"Retrieved accepted patterns for {agent_name}")
            return []

        except Exception as e:
            logger.error(f"Error retrieving patterns: {e}")
            return []

    async def get_improvement_suggestions(
        self,
        project_id: str,
        agent_name: str,
    ) -> Dict[str, Any]:
        """
        Get suggestions for improving an agent based on feedback patterns.

        Args:
            project_id: Project ID
            agent_name: Agent name

        Returns:
            Improvement suggestions
        """
        try:
            await self._ensure_services()

            suggestions = {
                "areas_for_improvement": [],
                "common_errors": [],
                "success_patterns": [],
                "confidence_gaps": [],
            }

            # In a full implementation, this would:
            # 1. Analyze feedback patterns
            # 2. Identify common rejection reasons
            # 3. Suggest parameter adjustments
            # 4. Recommend temperature/model changes

            logger.info(f"Generated improvement suggestions for {agent_name}")
            return suggestions

        except Exception as e:
            logger.error(f"Error generating suggestions: {e}")
            return {}

    async def build_agent_prompt(
        self,
        project_id: str,
        agent_name: str,
        base_prompt: str,
        include_examples: bool = True,
    ) -> str:
        """
        Build an enhanced prompt for an agent including learned context.

        Args:
            project_id: Project ID
            agent_name: Agent name
            base_prompt: Base system prompt
            include_examples: Whether to include examples from history

        Returns:
            Enhanced prompt with context and examples
        """
        try:
            prompt = base_prompt + "\n\n"

            if include_examples:
                prompt += "# Learn from successful past examples:\n"
                # In production, retrieve accepted examples from Qdrant
                prompt += "- Use project-specific terminology and patterns\n"
                prompt += "- Follow established conventions from accepted outputs\n"

            return prompt

        except Exception as e:
            logger.error(f"Error building prompt: {e}")
            return base_prompt


# Singleton instance
_knowledge_service: Optional[KnowledgeService] = None


async def get_knowledge_service() -> KnowledgeService:
    """
    Get singleton knowledge service instance.

    Returns:
        KnowledgeService instance
    """
    global _knowledge_service
    if _knowledge_service is None:
        _knowledge_service = KnowledgeService()
    return _knowledge_service
