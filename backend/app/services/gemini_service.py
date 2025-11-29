"""
Google Gemini AI Service for test plan generation.
Uses Google's Gemini API for AI-powered test generation.
"""
import logging
from typing import List, Dict, Any, Optional
import google.generativeai as genai

from app.core.config import settings

logger = logging.getLogger(__name__)


class GeminiService:
    """
    Service for AI operations using Google Gemini.
    Provides cost-effective alternative to OpenAI.
    """

    def __init__(self):
        self.api_key = settings.GOOGLE_API_KEY
        self.model_name = settings.GEMINI_MODEL
        self.embedding_model = settings.GEMINI_EMBEDDING_MODEL
        self._model = None
        self._configure_api()

    def _configure_api(self):
        """Configure Gemini API."""
        if not self.api_key:
            logger.warning("Google API key not configured. Set GOOGLE_API_KEY in .env file.")
            return

        try:
            genai.configure(api_key=self.api_key)
            logger.info(f"Gemini API configured with model: {self.model_name}")
        except Exception as e:
            logger.error(f"Failed to configure Gemini API: {e}")

    def _check_api_key(self):
        """Check if API key is configured."""
        if not self.api_key:
            raise ValueError(
                "Google API key not configured. Please set GOOGLE_API_KEY in .env file.\n"
                "Get your free API key at: https://makersuite.google.com/app/apikey"
            )

    def get_model(
        self,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        json_mode: bool = False,
    ):
        """
        Get Gemini model instance.

        Args:
            temperature: Controls randomness (0=deterministic, 1=creative)
            max_tokens: Maximum tokens in response
            json_mode: Force JSON response format (eliminates markdown wrapping)

        Returns:
            Gemini model instance
        """
        self._check_api_key()

        generation_config = {
            "temperature": temperature,
            "top_p": 0.95,
            "top_k": 40,
        }

        if max_tokens:
            generation_config["max_output_tokens"] = max_tokens

        # Force JSON mode to eliminate markdown wrapping issues
        if json_mode:
            generation_config["response_mime_type"] = "application/json"

        return genai.GenerativeModel(
            model_name=self.model_name,
            generation_config=generation_config,
        )

    async def generate_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        json_mode: bool = False,
    ) -> str:
        """
        Generate text completion from messages.

        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Controls randomness
            max_tokens: Maximum tokens in response
            json_mode: Force JSON response format (eliminates markdown wrapping)

        Returns:
            Generated text
        """
        self._check_api_key()

        try:
            model = self.get_model(temperature=temperature, max_tokens=max_tokens, json_mode=json_mode)

            # Convert messages to Gemini format
            # Gemini uses a simpler prompt format
            prompt = self._convert_messages_to_prompt(messages)

            # Generate response asynchronously
            response = await model.generate_content_async(prompt)

            # Handle multi-part responses properly
            try:
                # Try simple text accessor first
                return response.text
            except ValueError as ve:
                # Handle multi-part response
                logger.info(f"Handling multi-part Gemini response (error: {ve})")

                # Try multiple methods to extract text
                text_parts = []

                # Method 1: Try response.parts directly (as error message suggests)
                if hasattr(response, 'parts'):
                    logger.info("Trying response.parts accessor")
                    try:
                        for idx, part in enumerate(response.parts):
                            if hasattr(part, 'text'):
                                text_parts.append(part.text)
                                logger.info(f"Extracted {len(part.text)} chars from response.parts[{idx}]")
                    except Exception as ex:
                        logger.warning(f"Failed to use response.parts: {ex}")

                # Method 2: Try candidates[0].content.parts
                if not text_parts and response.candidates:
                    logger.info(f"Trying candidates[0].content.parts")
                    parts = response.candidates[0].content.parts
                    logger.info(f"Found {len(parts)} parts in candidate.content")

                    for idx, part in enumerate(parts):
                        logger.info(f"Part {idx}: has text={hasattr(part, 'text')}")
                        if hasattr(part, 'text'):
                            try:
                                part_text = part.text
                                logger.info(f"Part {idx} text length: {len(part_text)}")
                                text_parts.append(part_text)
                            except Exception as ex:
                                logger.warning(f"Failed to get text from part {idx}: {ex}")

                # Method 3: Try to get prompt_feedback or other fields
                if not text_parts:
                    logger.warning("No text found in parts, checking response structure")
                    logger.info(f"Response type: {type(response)}")
                    logger.info(f"Response attributes: {[a for a in dir(response) if not a.startswith('_')][:20]}")

                    # Sometimes the response might be blocked or filtered
                    if hasattr(response, 'prompt_feedback'):
                        logger.info(f"Prompt feedback: {response.prompt_feedback}")

                if text_parts:
                    result = ''.join(text_parts)
                    logger.info(f"Multi-part extraction complete: {len(result)} total characters")
                    return result
                else:
                    raise ValueError("No valid text content found in Gemini response")

        except Exception as e:
            logger.error(f"Gemini generation failed: {e}")
            raise ValueError(f"Failed to generate with Gemini: {str(e)}")

    def _convert_messages_to_prompt(self, messages: List[Dict[str, str]]) -> str:
        """
        Convert OpenAI-style messages to Gemini prompt format.

        Args:
            messages: List of message dicts

        Returns:
            Formatted prompt string
        """
        prompt_parts = []

        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")

            if role == "system":
                prompt_parts.append(f"SYSTEM INSTRUCTIONS:\n{content}\n")
            elif role == "assistant":
                prompt_parts.append(f"ASSISTANT: {content}\n")
            else:
                prompt_parts.append(f"USER: {content}\n")

        return "\n".join(prompt_parts)

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
        self._check_api_key()

        try:
            # Fill template with variables
            prompt = template.format(**variables)

            model = self.get_model(temperature=temperature, max_tokens=max_tokens)
            response = await model.generate_content_async(prompt)

            return response.text

        except Exception as e:
            logger.error(f"Gemini template generation failed: {e}")
            raise ValueError(f"Failed to generate with template: {str(e)}")

    async def create_embedding(self, text: str) -> List[float]:
        """
        Create embedding vector for text using Gemini.

        Args:
            text: Input text

        Returns:
            Embedding vector as list of floats
        """
        self._check_api_key()

        try:
            result = genai.embed_content(
                model=self.embedding_model,
                content=text,
                task_type="retrieval_document",
            )
            return result['embedding']

        except Exception as e:
            logger.error(f"Gemini embedding failed: {e}")
            raise ValueError(f"Failed to create embedding: {str(e)}")

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
