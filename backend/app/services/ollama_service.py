"""
Ollama AI Service for local LLM inference.
Uses Ollama API for AI-powered test generation with dual-model support.
"""
import logging
import httpx
from typing import List, Dict, Any, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


class OllamaService:
    """
    Service for AI operations using Ollama (local LLMs).
    Supports dual-model architecture: main model (Llama 3) + helper model (Mistral).
    """

    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL
        self.main_model = settings.OLLAMA_MODEL
        self.helper_model = settings.OLLAMA_HELPER_MODEL
        self._client: Optional[httpx.AsyncClient] = None

    def _get_client(self) -> httpx.AsyncClient:
        """Get or create async HTTP client."""
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=120.0)
        return self._client

    async def generate_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        json_mode: bool = False,
        use_helper: bool = False,
    ) -> str:
        """
        Generate text completion from messages.

        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Controls randomness
            max_tokens: Maximum tokens in response
            json_mode: Force JSON response format
            use_helper: Use helper model (Mistral) instead of main model (Llama 3)

        Returns:
            Generated text
        """
        model = self.helper_model if use_helper else self.main_model
        client = self._get_client()

        # Convert messages to Ollama chat format
        ollama_messages = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            # Map 'system' to 'system', 'user' to 'user', 'assistant' to 'assistant'
            ollama_messages.append({"role": role, "content": content})

        payload = {
            "model": model,
            "messages": ollama_messages,
            "stream": False,
            "options": {
                "temperature": temperature,
            }
        }

        if max_tokens:
            payload["options"]["num_predict"] = max_tokens

        if json_mode:
            payload["format"] = "json"

        try:
            response = await client.post(
                f"{self.base_url}/api/chat",
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            return data.get("message", {}).get("content", "")

        except httpx.HTTPStatusError as e:
            logger.error(f"Ollama API error: {e.response.status_code} - {e.response.text}")
            raise ValueError(f"Ollama API error: {e.response.status_code}")
        except httpx.RequestError as e:
            logger.error(f"Ollama connection error: {e}")
            raise ValueError(f"Failed to connect to Ollama at {self.base_url}. Is Ollama running?")
        except Exception as e:
            logger.error(f"Ollama generation failed: {e}")
            raise ValueError(f"Failed to generate with Ollama: {str(e)}")

    async def generate_with_prompt(
        self,
        template: str,
        variables: Dict[str, Any],
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        use_helper: bool = False,
    ) -> str:
        """
        Generate text using a prompt template.

        Args:
            template: Prompt template string with {variables}
            variables: Dictionary of variables to fill in template
            temperature: Controls randomness
            max_tokens: Maximum tokens in response
            use_helper: Use helper model instead of main model

        Returns:
            Generated text
        """
        try:
            prompt = template.format(**variables)
            messages = [{"role": "user", "content": prompt}]
            return await self.generate_completion(
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                use_helper=use_helper,
            )
        except Exception as e:
            logger.error(f"Ollama template generation failed: {e}")
            raise ValueError(f"Failed to generate with template: {str(e)}")

    async def create_embedding(self, text: str) -> List[float]:
        """
        Create embedding vector for text.
        Note: Ollama embedding support depends on model.

        Args:
            text: Input text

        Returns:
            Embedding vector as list of floats
        """
        client = self._get_client()

        try:
            response = await client.post(
                f"{self.base_url}/api/embeddings",
                json={
                    "model": self.main_model,
                    "prompt": text,
                },
            )
            response.raise_for_status()
            data = response.json()
            return data.get("embedding", [])

        except Exception as e:
            logger.warning(f"Ollama embedding failed, returning empty: {e}")
            # Return empty embedding if not supported
            return []

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

    async def close(self):
        """Close the HTTP client."""
        if self._client:
            await self._client.aclose()
            self._client = None


# Singleton instance
_ollama_service: Optional[OllamaService] = None


def get_ollama_service() -> OllamaService:
    """
    Get singleton Ollama service instance.

    Returns:
        OllamaService instance
    """
    global _ollama_service
    if _ollama_service is None:
        _ollama_service = OllamaService()
    return _ollama_service
