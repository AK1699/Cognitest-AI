from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain.schema import SystemMessage, HumanMessage
import uuid

from app.core.config import settings
from app.services.ai_service import get_ai_service


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
        Currently a placeholder - will be implemented when Qdrant is set up.

        Args:
            collection_name: Name of the collection
            text: Text to store
            metadata: Metadata associated with the text
            point_id: Optional ID for the point
        """
        # TODO: Implement Qdrant integration
        print(f"Knowledge storage placeholder: {collection_name}")
        pass

    async def retrieve_knowledge(
        self,
        collection_name: str,
        query: str,
        limit: int = 5,
        score_threshold: float = 0.7,
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant knowledge from vector database.
        Currently a placeholder - will be implemented when Qdrant is set up.

        Args:
            collection_name: Name of the collection
            query: Search query
            limit: Maximum number of results
            score_threshold: Minimum similarity score

        Returns:
            List of relevant documents with metadata
        """
        # TODO: Implement Qdrant integration
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
        Currently a placeholder - will be implemented when Qdrant is set up.

        Args:
            input_data: Original input to the agent
            output_data: Agent's output
            feedback: User feedback (accepted/rejected, modifications, etc.)
        """
        # TODO: Implement feedback storage in Qdrant
        print(f"Feedback learning placeholder for {self.agent_name}")
        pass
