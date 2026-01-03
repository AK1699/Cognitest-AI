"""
Google Gemini AI Service for test plan generation.
Uses Google's Gemini API for AI-powered test generation.
"""
import logging
from typing import List, Dict, Any, Optional
import google.generativeai as genai

from cognitest_common.gemini_service import GeminiService as SharedGeminiService
from app.core.config import settings

logger = logging.getLogger(__name__)


class GeminiService(SharedGeminiService):
    """
    Service for AI operations using Google Gemini.
    Provides cost-effective alternative to OpenAI.
    """

    def __init__(self):
        super().__init__(
            api_key=settings.GOOGLE_API_KEY,
            model_name=settings.GEMINI_MODEL,
            embedding_model=settings.GEMINI_EMBEDDING_MODEL
        )

    async def generate_with_prompt(
        self,
        template: str,
        variables: Dict[str, Any],
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> str:
        """
        Generate text using a prompt template.

        Args:
            template: Prompt template string with {variables}
            variables: Dictionary of variables to fill in template
            temperature: Controls randomness
            max_tokens: Maximum tokens in response

        Returns:
            Generated text
        """
        # This method is kept as it's a specific wrapper for prompt templates
        # The underlying generation logic will use the inherited generate_completion
        try:
            # Fill template with variables
            prompt = template.format(**variables)

            # Use the inherited generate_completion method
            # Note: generate_completion expects messages, so we need to wrap the prompt
            messages = [{"role": "user", "content": prompt}]
            return await self.generate_completion(
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                json_mode=False # Assuming template generation is not typically JSON
            )

        except Exception as e:
            logger.error(f"Gemini template generation failed: {e}")
            raise ValueError(f"Failed to generate with template: {str(e)}")

    async def create_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Create embedding vectors for multiple texts.

        Args:
            texts: List of input texts

        Returns:
            List of embedding vectors
        """
        embeddings = []
        for text in texts:
            embedding = await self.create_embedding(text)
            embeddings.append(embedding)
        return embeddings


# Singleton instance
_gemini_service: Optional[GeminiService] = None


def get_gemini_service() -> GeminiService:
    """
    Get singleton Gemini service instance.

    Returns:
        GeminiService instance
    """
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService()
    return _gemini_service
