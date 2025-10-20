from typing import Optional, List, Dict, Any
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain.prompts import ChatPromptTemplate, PromptTemplate
from langchain.output_parsers import PydanticOutputParser, StructuredOutputParser
from langchain.schema import HumanMessage, SystemMessage, AIMessage

from app.core.config import settings


class AIService:
    """
    Service for AI operations using LangChain and OpenAI.
    """

    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model_name = settings.OPENAI_MODEL
        self.embedding_model = settings.OPENAI_EMBEDDING_MODEL
        self._llm: Optional[ChatOpenAI] = None
        self._embeddings: Optional[OpenAIEmbeddings] = None

    def _check_api_key(self):
        """Check if API key is configured."""
        if not self.api_key or self.api_key == "sk-your-openai-api-key-here":
            raise ValueError(
                "OpenAI API key not configured. Please set OPENAI_API_KEY in .env file."
            )

    def get_llm(
        self,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        model: Optional[str] = None,
    ) -> ChatOpenAI:
        """
        Get LangChain ChatOpenAI instance.

        Args:
            temperature: Controls randomness (0=deterministic, 1=creative)
            max_tokens: Maximum tokens in response
            model: Model name override

        Returns:
            ChatOpenAI instance
        """
        self._check_api_key()

        return ChatOpenAI(
            api_key=self.api_key,
            model=model or self.model_name,
            temperature=temperature,
            max_tokens=max_tokens,
        )

    def get_embeddings(self) -> OpenAIEmbeddings:
        """
        Get OpenAI embeddings instance.

        Returns:
            OpenAIEmbeddings instance
        """
        self._check_api_key()

        if self._embeddings is None:
            self._embeddings = OpenAIEmbeddings(
                api_key=self.api_key,
                model=self.embedding_model,
            )

        return self._embeddings

    async def generate_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> str:
        """
        Generate text completion from messages.

        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Controls randomness
            max_tokens: Maximum tokens in response

        Returns:
            Generated text
        """
        llm = self.get_llm(temperature=temperature, max_tokens=max_tokens)

        # Convert dict messages to LangChain message format
        langchain_messages = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")

            if role == "system":
                langchain_messages.append(SystemMessage(content=content))
            elif role == "assistant":
                langchain_messages.append(AIMessage(content=content))
            else:
                langchain_messages.append(HumanMessage(content=content))

        # Generate response
        response = await llm.ainvoke(langchain_messages)
        return response.content

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
        llm = self.get_llm(temperature=temperature, max_tokens=max_tokens)

        prompt = ChatPromptTemplate.from_template(template)
        chain = prompt | llm

        result = await chain.ainvoke(variables)
        return result.content

    async def generate_structured_output(
        self,
        prompt: str,
        output_schema: Dict[str, str],
        temperature: float = 0.7,
    ) -> Dict[str, Any]:
        """
        Generate structured output based on schema.

        Args:
            prompt: Input prompt
            output_schema: Schema defining expected output structure
            temperature: Controls randomness

        Returns:
            Parsed structured output as dictionary
        """
        llm = self.get_llm(temperature=temperature)

        # Create output parser
        parser = StructuredOutputParser.from_response_schemas([
            {"name": k, "description": v}
            for k, v in output_schema.items()
        ])

        # Create prompt with format instructions
        format_instructions = parser.get_format_instructions()
        full_prompt = f"{prompt}\n\n{format_instructions}"

        # Generate and parse response
        response = await llm.ainvoke([HumanMessage(content=full_prompt)])
        parsed = parser.parse(response.content)

        return parsed

    async def create_embedding(self, text: str) -> List[float]:
        """
        Create embedding vector for text.

        Args:
            text: Input text

        Returns:
            Embedding vector as list of floats
        """
        embeddings = self.get_embeddings()
        vector = await embeddings.aembed_query(text)
        return vector

    async def create_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Create embedding vectors for multiple texts.

        Args:
            texts: List of input texts

        Returns:
            List of embedding vectors
        """
        embeddings = self.get_embeddings()
        vectors = await embeddings.aembed_documents(texts)
        return vectors


# Singleton instance
_ai_service: Optional[AIService] = None


def get_ai_service() -> AIService:
    """
    Get singleton AI service instance.

    Returns:
        AIService instance
    """
    global _ai_service
    if _ai_service is None:
        _ai_service = AIService()
    return _ai_service
