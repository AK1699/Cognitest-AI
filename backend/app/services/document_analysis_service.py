"""
Document Analysis Service for extracting testable information from documents.
Uses AI to analyze PDFs, BRDs, and other documents to extract requirements,
features, acceptance criteria, and generate test plans.
"""
import logging
import json
from typing import Optional, Dict, Any, List
from pathlib import Path
import re

from app.services.ai_service import AIService

logger = logging.getLogger(__name__)


class DocumentAnalysisService:
    """
    Service for analyzing documents (PDF, DOCX, etc.) to extract testable information.
    Uses AI to understand requirements, features, and generate test scenarios.
    """

    def __init__(self, ai_service: AIService):
        self.ai_service = ai_service

    async def analyze_document_content(
        self,
        content: str,
        document_type: str = "requirement",
        additional_context: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Analyze document content to extract testable information.

        Args:
            content: Extracted text content from document
            document_type: Type of document (requirement, specification, brd, etc.)
            additional_context: Additional context for analysis

        Returns:
            Structured analysis with requirements, features, test scenarios, etc.
        """
        try:
            logger.info(f"Analyzing document content ({len(content)} characters)")

            # If content is too long, chunk it and analyze in parts
            if len(content) > 12000:
                logger.info("Document is long, using chunked analysis")
                return await self._analyze_long_document(content, document_type, additional_context)

            # Build analysis prompt
            prompt = self._build_analysis_prompt(content, document_type, additional_context)
            logger.info(f"Analysis prompt length: {len(prompt)} characters")

            # Generate AI analysis
            logger.info("Calling AI service to analyze document...")
            response = await self.ai_service.generate_completion(
                messages=[
                    {
                        "role": "system",
                        "content": self._get_document_analysis_system_prompt(),
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,  # Lower temperature for more accurate extraction
                max_tokens=8000,  # Increased to allow complete JSON responses
                json_mode=True,  # Force JSON response, eliminates markdown wrapping
            )

            logger.info(f"AI response received: {len(response)} characters")

            # Parse AI response
            analysis_data = self._parse_analysis_response(response)

            logger.info(f"✅ Document analysis completed: {len(analysis_data.get('features', []))} features, {len(analysis_data.get('requirements', []))} requirements identified")

            return {
                "status": "success",
                "data": analysis_data,
                "content_length": len(content),
            }

        except Exception as e:
            logger.error(f"❌ Error analyzing document with AI: {e}")
            logger.error(f"Error type: {type(e).__name__}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")

            # Fallback to basic extraction
            logger.warning("⚠️  Using fallback basic extraction")
            fallback_data = self._basic_content_extraction(content)
            return {
                "status": "partial",
                "data": fallback_data,
                "error": str(e),
                "note": "Using fallback extraction due to AI error",
            }

    async def _analyze_long_document(
        self,
        content: str,
        document_type: str,
        additional_context: Optional[str],
    ) -> Dict[str, Any]:
        """
        Analyze long documents by chunking and combining results.

        Args:
            content: Document content
            document_type: Document type
            additional_context: Additional context

        Returns:
            Combined analysis results
        """
        logger.info(f"Analyzing long document with {len(content)} characters")

        # Split into chunks (approx 10000 chars each with overlap)
        chunk_size = 10000
        overlap = 1000
        chunks = []
        start = 0

        while start < len(content):
            end = min(start + chunk_size, len(content))
            chunks.append(content[start:end])
            start = end - overlap

        logger.info(f"Split document into {len(chunks)} chunks")

        # Analyze each chunk
        chunk_results = []
        for idx, chunk in enumerate(chunks[:3]):  # Limit to first 3 chunks for efficiency
            try:
                prompt = self._build_analysis_prompt(chunk, document_type, additional_context)
                response = await self.ai_service.generate_completion(
                    messages=[
                        {
                            "role": "system",
                            "content": self._get_document_analysis_system_prompt(),
                        },
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.3,
                    max_tokens=8000,  # Increased to allow complete responses
                    json_mode=True,  # Force JSON response
                )
                chunk_data = self._parse_analysis_response(response)
                chunk_results.append(chunk_data)
            except Exception as e:
                logger.warning(f"Error analyzing chunk {idx}: {e}")

        # Combine results
        combined_data = self._combine_chunk_results(chunk_results)
        return {
            "status": "success",
            "data": combined_data,
            "content_length": len(content),
            "chunks_analyzed": len(chunk_results),
        }

    def _get_document_analysis_system_prompt(self) -> str:
        """Get system prompt for document analysis."""
        return """You are an expert QA analyst and requirements engineer specializing in test automation.

Your task is to analyze requirement documents and extract structured testing information.

CRITICAL: You MUST respond with ONLY valid JSON. Do not include any markdown formatting, code blocks, or additional text.
The response will be parsed directly as JSON, so it must be perfectly formatted."""

    def _build_analysis_prompt(
        self,
        content: str,
        document_type: str,
        additional_context: Optional[str],
    ) -> str:
        """Build comprehensive analysis prompt."""
        context_section = f"\n\nAdditional Context:\n{additional_context}" if additional_context else ""

        prompt = f"""
Analyze the following {document_type} document and extract all testable information.

**Document Content:**
{content}
{context_section}

**Extract and structure the following information in JSON format:**

{{
  "project_name": "Extracted project name or 'Unnamed Project'",
  "project_description": "Brief description of the project/system",
  "project_type": "web-app|mobile-app|api|desktop-app|other",
  "platforms": ["list", "of", "platforms"],

  "features": [
    {{
      "name": "Feature name",
      "description": "Detailed description",
      "priority": "high|medium|low",
      "requirements": ["list", "of", "specific", "requirements"]
    }}
  ],

  "requirements": [
    {{
      "id": "REQ-001",
      "type": "functional|non-functional|performance|security|usability",
      "description": "Requirement description",
      "priority": "high|medium|low|critical",
      "acceptance_criteria": ["criteria 1", "criteria 2"]
    }}
  ],

  "test_scenarios": [
    {{
      "scenario": "Test scenario description",
      "category": "functional|integration|system|acceptance|performance|security",
      "priority": "high|medium|low",
      "steps": ["step 1", "step 2"],
      "expected_result": "Expected outcome"
    }}
  ],

  "constraints": [
    "List of constraints, dependencies, or limitations"
  ],

  "assumptions": [
    "List of assumptions made in the document"
  ],

  "technical_details": {{
    "technologies": ["tech stack"],
    "integrations": ["external systems"],
    "environments": ["dev", "staging", "prod"]
  }},

  "quality_attributes": {{
    "performance_requirements": "Performance expectations",
    "security_requirements": "Security considerations",
    "scalability": "Scalability requirements",
    "availability": "Availability/uptime requirements"
  }},

  "objectives": [
    "List of testing objectives"
  ],

  "complexity": "low|medium|high",
  "estimated_effort": "1-2 weeks|2-4 weeks|1-2 months|etc",

  "key_stakeholders": [
    "List of mentioned stakeholders or roles"
  ],

  "tags": ["relevant", "tags", "for", "categorization"]
}}

**Instructions:**
- Extract ALL mentioned features, even if briefly described
- Identify testable requirements with clear acceptance criteria
- Generate realistic test scenarios based on the requirements
- Be specific and detailed
- Use "N/A" or empty arrays if information is not available
- Ensure all JSON is valid and properly formatted
"""
        return prompt

    def _parse_analysis_response(self, response: str) -> Dict[str, Any]:
        """Parse AI response into structured data."""
        try:
            logger.info(f"Parsing response (length: {len(response)})")
            logger.info(f"Response starts with: {repr(response[:100])}")
            logger.info(f"Response ends with: {repr(response[-100:])}")

            # Clean the response
            cleaned_response = response.strip()

            # Try direct JSON parse first (JSON mode should return pure JSON)
            try:
                data = json.loads(cleaned_response)
                logger.info(f"✅ JSON parsed successfully on first attempt!")
                return data
            except json.JSONDecodeError as first_error:
                logger.info(f"First parse failed: {first_error}, trying extraction...")

                # Fallback: Try to extract JSON from markdown blocks (shouldn't happen with JSON mode)
                json_match = re.search(r'```json\s*(.*?)\s*```', response, re.DOTALL)
                if json_match:
                    json_str = json_match.group(1)
                    logger.info(f"Extracted JSON from markdown block (length: {len(json_str)})")
                else:
                    # Try to find JSON object
                    json_match = re.search(r'\{.*\}', response, re.DOTALL)
                    if json_match:
                        json_str = json_match.group(0)
                        logger.info(f"Found JSON object via regex (length: {len(json_str)})")
                    else:
                        logger.warning("No JSON object found, using raw response")
                        json_str = cleaned_response

                # Clean up trailing commas and extra whitespace
                json_str = re.sub(r',(\s*[}\]])', r'\1', json_str)
                json_str = json_str.strip()

                logger.info(f"JSON string to parse: {repr(json_str[:200])}")
                data = json.loads(json_str)
                logger.info(f"✅ JSON parsed successfully after cleanup!")
                return data

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            logger.error(f"Response length: {len(response)}")
            logger.error(f"Response preview: {response[:500]}")
            logger.error(f"JSON string attempted: {repr(json_str[:200]) if 'json_str' in locals() else 'N/A'}")
            # Return basic structure
            return self._get_empty_analysis_structure()

    def _get_empty_analysis_structure(self) -> Dict[str, Any]:
        """Get empty analysis structure."""
        return {
            "project_name": "Unnamed Project",
            "project_description": "",
            "project_type": "web-app",
            "platforms": ["web"],
            "features": [],
            "requirements": [],
            "test_scenarios": [],
            "constraints": [],
            "assumptions": [],
            "technical_details": {
                "technologies": [],
                "integrations": [],
                "environments": []
            },
            "quality_attributes": {},
            "objectives": [],
            "complexity": "medium",
            "estimated_effort": "2-4 weeks",
            "key_stakeholders": [],
            "tags": []
        }

    def _basic_content_extraction(self, content: str) -> Dict[str, Any]:
        """Basic extraction without AI (fallback)."""
        # Simple heuristics to extract information
        structure = self._get_empty_analysis_structure()

        # Try to extract project name from first lines
        lines = content.split('\n')
        for line in lines[:10]:
            line = line.strip()
            if line and len(line) < 100:
                structure["project_name"] = line
                break

        structure["project_description"] = content[:500]

        # Extract potential features (lines with "Feature", "Function", etc.)
        feature_keywords = ['feature', 'functionality', 'capability', 'function']
        for line in lines:
            line_lower = line.lower()
            if any(kw in line_lower for kw in feature_keywords):
                if len(line.strip()) > 10:
                    structure["features"].append({
                        "name": line.strip()[:100],
                        "description": line.strip(),
                        "priority": "medium",
                        "requirements": []
                    })

        return structure

    def _combine_chunk_results(self, chunk_results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Combine analysis results from multiple chunks."""
        if not chunk_results:
            return self._get_empty_analysis_structure()

        # Start with first chunk
        combined = chunk_results[0].copy()

        # Merge features from all chunks (deduplicate by name)
        all_features = []
        feature_names = set()
        for result in chunk_results:
            for feature in result.get("features", []):
                if feature.get("name") not in feature_names:
                    all_features.append(feature)
                    feature_names.add(feature.get("name"))
        combined["features"] = all_features

        # Merge requirements (deduplicate by description)
        all_requirements = []
        req_descriptions = set()
        for result in chunk_results:
            for req in result.get("requirements", []):
                desc = req.get("description", "")
                if desc not in req_descriptions:
                    all_requirements.append(req)
                    req_descriptions.add(desc)
        combined["requirements"] = all_requirements

        # Merge test scenarios
        all_scenarios = []
        for result in chunk_results:
            all_scenarios.extend(result.get("test_scenarios", []))
        combined["test_scenarios"] = all_scenarios[:20]  # Limit to 20

        # Merge lists
        for key in ["constraints", "assumptions", "objectives", "tags"]:
            combined_list = []
            for result in chunk_results:
                combined_list.extend(result.get(key, []))
            combined[key] = list(set(combined_list))  # Deduplicate

        return combined


# Singleton instance
_analysis_service: Optional[DocumentAnalysisService] = None


def get_document_analysis_service(ai_service: Optional[AIService] = None) -> DocumentAnalysisService:
    """
    Get singleton document analysis service instance.

    Args:
        ai_service: AI service instance (optional, creates new if not provided)

    Returns:
        DocumentAnalysisService instance
    """
    global _analysis_service
    if _analysis_service is None:
        if ai_service is None:
            ai_service = AIService()
        _analysis_service = DocumentAnalysisService(ai_service)
    return _analysis_service
