"""
Google Gemini AI Service
Uses Google's Gemini API for AI-powered operations.
"""
import logging
import os
from typing import List, Dict, Any, Optional
import google.generativeai as genai

logger = logging.getLogger(__name__)


class GeminiService:
    """
    Service for AI operations using Google Gemini.
    """

    def __init__(
        self, 
        api_key: Optional[str] = None, 
        model_name: str = "gemini-1.5-pro",
        embedding_model: str = "models/embedding-001"
    ):
        self.api_key = api_key or os.getenv("GOOGLE_API_KEY")
        self.model_name = model_name or os.getenv("GEMINI_MODEL", "gemini-1.5-pro")
        self.embedding_model = embedding_model or os.getenv("GEMINI_EMBEDDING_MODEL", "models/embedding-001")
        self._model = None
        self._configure_api()

    def _configure_api(self):
        """Configure Gemini API."""
        if not self.api_key:
            logger.warning("Google API key not configured. Set GOOGLE_API_KEY environment variable.")
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
                "Google API key not configured. Please set GOOGLE_API_KEY environment variable."
            )

    def get_model(
        self,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        json_mode: bool = False,
    ):
        """Get Gemini model instance."""
        self._check_api_key()

        generation_config = {
            "temperature": temperature,
            "top_p": 0.95,
            "top_k": 40,
        }

        if max_tokens:
            generation_config["max_output_tokens"] = max_tokens

        if json_mode:
            model_lower = self.model_name.lower()
            if any(v in model_lower for v in ["gemini-1.5", "gemini-2.0", "gemini-2.5", "gemini-pro-1.5"]):
                try:
                    generation_config["response_mime_type"] = "application/json"
                except Exception as e:
                    logger.warning(f"response_mime_type not supported: {e}")
            else:
                logger.info(f"Model {self.model_name} may not support response_mime_type, skipping")

        try:
            return genai.GenerativeModel(
                model_name=self.model_name,
                generation_config=generation_config,
            )
        except TypeError as e:
            if "response_mime_type" in str(e):
                logger.warning("response_mime_type not supported by SDK, retrying without it")
                generation_config.pop("response_mime_type", None)
                return genai.GenerativeModel(
                    model_name=self.model_name,
                    generation_config=generation_config,
                )
            raise

    async def generate_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        json_mode: bool = False,
    ) -> str:
        """Generate text completion from messages."""
        self._check_api_key()

        try:
            model = self.get_model(temperature=temperature, max_tokens=max_tokens, json_mode=json_mode)
            prompt = self._convert_messages_to_prompt(messages)
            response = await model.generate_content_async(prompt)

            try:
                return response.text
            except ValueError:
                # Handle multi-part or blocked response
                text_parts = []
                if hasattr(response, 'parts'):
                    for part in response.parts:
                        if hasattr(part, 'text'):
                            text_parts.append(part.text)
                
                if not text_parts and response.candidates:
                    for part in response.candidates[0].content.parts:
                        if hasattr(part, 'text'):
                            text_parts.append(part.text)
                
                if text_parts:
                    return ''.join(text_parts)
                else:
                    raise ValueError("No valid text content found in Gemini response")

        except Exception as e:
            logger.error(f"Gemini generation failed: {e}")
            raise ValueError(f"Failed to generate with Gemini: {str(e)}")

    def _convert_messages_to_prompt(self, messages: List[Dict[str, str]]) -> str:
        """Convert OpenAI-style messages to Gemini prompt format."""
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

    async def create_embedding(self, text: str) -> List[float]:
        """Create embedding vector for text using Gemini."""
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


# Singleton instance
_gemini_service: Optional[GeminiService] = None


def get_gemini_service(
    api_key: Optional[str] = None,
    model_name: Optional[str] = None
) -> GeminiService:
    """Get singleton Gemini service instance."""
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService(api_key=api_key, model_name=model_name)
    return _gemini_service
