from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain.schema import SystemMessage, HumanMessage
import uuid
import json
import logging

from app.core.config import settings
from app.services.ai_service import get_ai_service
from app.services.qdrant_service import get_qdrant_service

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """
    Base class for all AI agents in Cognitest.
    Provides common functionality for LLM interaction and embeddings.
    """

    def __init__(
        self,
        agent_name: str,
        system_prompt: str,
        model_name: str = None,
        temperature: float = 0.7,
    ):
        self.agent_name = agent_name
        self.system_prompt = system_prompt
        self.model_name = model_name or settings.OPENAI_MODEL
        self.temperature = temperature

        # Get AI service
        self.ai_service = get_ai_service()

    async def generate_response(
        self,
        user_input: str,
        context: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> str:
        """
        Generate a response using the LLM.

        Args:
            user_input: User's input/query
            context: Additional context for the agent
            **kwargs: Additional arguments to pass to the LLM

        Returns:
            Generated response as string
        """
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": self._format_input(user_input, context)},
        ]

        response = await self.ai_service.generate_completion(
            messages=messages,
            temperature=self.temperature,
            **kwargs
        )
        return response

    def _format_input(self, user_input: str, context: Optional[Dict[str, Any]] = None) -> str:
        """
        Format the user input with additional context.

        Args:
            user_input: Raw user input
            context: Additional context dictionary

        Returns:
            Formatted input string
        """
        if not context:
            return user_input

        context_str = "\n".join([f"{k}: {v}" for k, v in context.items()])
        return f"Context:\n{context_str}\n\nUser Input:\n{user_input}"

    async def create_embedding(self, text: str) -> List[float]:
        """
        Create embedding vector for the given text.

        Args:
            text: Text to embed

        Returns:
            Embedding vector as list of floats
        """
        return await self.ai_service.create_embedding(text)

    async def store_knowledge(
        self,
        collection_name: str,
        text: str,
        metadata: Dict[str, Any],
        point_id: Optional[str] = None,
    ):
        """
        Store knowledge in vector database for future retrieval.

        Args:
            collection_name: Name of the collection
            text: Text to store
            metadata: Metadata associated with the text
            point_id: Optional ID for the point
        """
        try:
            # Get Qdrant service
            qdrant_service = await get_qdrant_service()

            # Ensure collection exists
            await qdrant_service.ensure_collection_exists(collection_name)

            # Create embedding for the text
            embedding = await self.create_embedding(text)

            # Prepare payload with metadata
            payload = {
                "text": text,
                "agent": self.agent_name,
                **metadata,
            }

            # Store in Qdrant
            stored_id = await qdrant_service.store_vector(
                collection_name=collection_name,
                point_id=point_id,
                vector=embedding,
                payload=payload,
            )

            logger.info(f"Stored knowledge in '{collection_name}' with ID {stored_id}")
            return stored_id

        except Exception as e:
            logger.error(f"Error storing knowledge: {e}")
            raise

    async def retrieve_knowledge(
        self,
        collection_name: str,
        query: str,
        limit: int = 5,
        score_threshold: float = 0.7,
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant knowledge from vector database.

        Args:
            collection_name: Name of the collection
            query: Search query
            limit: Maximum number of results
            score_threshold: Minimum similarity score

        Returns:
            List of relevant documents with metadata
        """
        try:
            # Get Qdrant service
            qdrant_service = await get_qdrant_service()

            # Create embedding for the query
            query_embedding = await self.create_embedding(query)

            # Search for similar vectors
            matches = await qdrant_service.search_vectors(
                collection_name=collection_name,
                query_vector=query_embedding,
                limit=limit,
                score_threshold=score_threshold,
            )

            logger.debug(f"Retrieved {len(matches)} knowledge items from '{collection_name}'")
            return matches

        except Exception as e:
            logger.error(f"Error retrieving knowledge: {e}")
            return []

    @abstractmethod
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Execute the agent's main task.
        Must be implemented by subclasses.

        Returns:
            Result dictionary
        """
        pass

    async def learn_from_feedback(
        self,
        input_data: Dict[str, Any],
        output_data: Dict[str, Any],
        feedback: Dict[str, Any],
    ):
        """
        Learn from user feedback to improve future responses.

        Args:
            input_data: Original input to the agent
            output_data: Agent's output
            feedback: User feedback (accepted/rejected, modifications, etc.)
        """
        try:
            # Create a feedback record combining input, output, and user feedback
            feedback_record = {
                "input": json.dumps(input_data) if isinstance(input_data, dict) else str(input_data),
                "output": json.dumps(output_data) if isinstance(output_data, dict) else str(output_data),
                "feedback": json.dumps(feedback) if isinstance(feedback, dict) else str(feedback),
                "agent": self.agent_name,
                "is_accepted": feedback.get("is_accepted", False),
                "confidence_score": feedback.get("confidence_score", 0.0),
            }

            # Get project ID from context if available
            project_id = input_data.get("project_id") or feedback.get("project_id", "default")
            collection_name = f"project_{project_id}_feedback_{self.agent_name}"

            # Store feedback as knowledge
            feedback_text = f"Input: {feedback_record['input']}\nOutput: {feedback_record['output']}\nFeedback: {feedback_record['feedback']}"

            stored_id = await self.store_knowledge(
                collection_name=collection_name,
                text=feedback_text,
                metadata={
                    "type": "user_feedback",
                    "is_accepted": feedback_record["is_accepted"],
                    "confidence_score": feedback_record["confidence_score"],
                    "feedback_details": feedback,
                },
            )

            logger.info(f"Stored feedback for {self.agent_name} with ID {stored_id}")

            # Also store the feedback in a separate feedback collection for analytics
            await self.store_knowledge(
                collection_name=f"project_{project_id}_all_feedback",
                text=f"{self.agent_name}: {feedback_text}",
                metadata={
                    "agent": self.agent_name,
                    "type": "feedback",
                    "is_accepted": feedback_record["is_accepted"],
                },
            )

        except Exception as e:
            logger.error(f"Error learning from feedback: {e}")
            # Don't raise, as this is an async learning process
