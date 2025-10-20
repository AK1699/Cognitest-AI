from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from langchain.chat_models import ChatOpenAI
from langchain.embeddings import OpenAIEmbeddings
from langchain.prompts import ChatPromptTemplate
from langchain.schema import SystemMessage, HumanMessage
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import uuid

from app.core.config import settings

class BaseAgent(ABC):
    """
    Base class for all AI agents in Cognitest.
    Provides common functionality for LLM interaction, embeddings, and vector storage.
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

        # Initialize LLM
        self.llm = ChatOpenAI(
            model=self.model_name,
            temperature=self.temperature,
            openai_api_key=settings.OPENAI_API_KEY,
        )

        # Initialize embeddings
        self.embeddings = OpenAIEmbeddings(
            model=settings.OPENAI_EMBEDDING_MODEL,
            openai_api_key=settings.OPENAI_API_KEY,
        )

        # Initialize vector DB client
        self.vector_db = QdrantClient(
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_API_KEY if settings.QDRANT_API_KEY else None,
        )

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
            SystemMessage(content=self.system_prompt),
            HumanMessage(content=self._format_input(user_input, context)),
        ]

        response = await self.llm.agenerate([messages])
        return response.generations[0][0].text

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
        return await self.embeddings.aembed_query(text)

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
        # Ensure collection exists
        try:
            self.vector_db.get_collection(collection_name)
        except Exception:
            self.vector_db.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
            )

        # Create embedding
        vector = await self.create_embedding(text)

        # Store in vector DB
        point_id = point_id or str(uuid.uuid4())
        self.vector_db.upsert(
            collection_name=collection_name,
            points=[
                PointStruct(
                    id=point_id,
                    vector=vector,
                    payload={"text": text, **metadata},
                )
            ],
        )

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
            # Create query embedding
            query_vector = await self.create_embedding(query)

            # Search in vector DB
            results = self.vector_db.search(
                collection_name=collection_name,
                query_vector=query_vector,
                limit=limit,
                score_threshold=score_threshold,
            )

            return [
                {
                    "text": hit.payload.get("text"),
                    "metadata": hit.payload,
                    "score": hit.score,
                }
                for hit in results
            ]
        except Exception as e:
            print(f"Error retrieving knowledge: {e}")
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
        collection_name = f"{self.agent_name}_feedback"

        # Store feedback as knowledge
        feedback_text = f"""
        Input: {input_data}
        Output: {output_data}
        Feedback: {feedback}
        """

        await self.store_knowledge(
            collection_name=collection_name,
            text=feedback_text,
            metadata={
                "input": input_data,
                "output": output_data,
                "feedback": feedback,
                "agent": self.agent_name,
            },
        )
