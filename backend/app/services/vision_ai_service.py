"""
Vision AI Service for analyzing screenshots and images
Extracts UI elements, workflows, and requirements from visual inputs
"""
import base64
import logging
from typing import List, Dict, Any, Optional
from pathlib import Path
import mimetypes

from openai import AsyncOpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)


class VisionAIService:
    """
    Service for analyzing images using AI vision models
    Supports GPT-4 Vision, Claude Vision, etc.
    """

    def __init__(self, model: str = "gpt-4-vision-preview"):
        """
        Initialize Vision AI Service

        Args:
            model: Model to use (gpt-4-vision-preview, gpt-4o, etc.)
        """
        self.model = model
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def analyze_screenshot(
        self,
        image_path: str,
        analysis_type: str = "comprehensive",
        custom_prompt: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Analyze a screenshot image

        Args:
            image_path: Path to the image file
            analysis_type: Type of analysis (comprehensive, ui_elements, workflow, requirements)
            custom_prompt: Custom prompt for specific analysis

        Returns:
            Analysis results
        """
        try:
            # Read and encode image
            image_data = self._encode_image(image_path)

            # Build prompt based on analysis type
            prompt = custom_prompt or self._build_prompt(analysis_type)

            # Call vision API
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_data}",
                                    "detail": "high"
                                },
                            },
                        ],
                    }
                ],
                max_tokens=2000,
                temperature=0.3,
            )

            analysis_text = response.choices[0].message.content

            # Parse the analysis
            result = self._parse_analysis(analysis_text, analysis_type)

            logger.info(f"Successfully analyzed screenshot: {image_path}")
            return result

        except Exception as e:
            logger.error(f"Error analyzing screenshot: {e}")
            return {
                "status": "error",
                "error": str(e),
                "analysis_type": analysis_type,
            }

    async def analyze_multiple_screenshots(
        self,
        image_paths: List[str],
        analysis_type: str = "comprehensive",
    ) -> Dict[str, Any]:
        """
        Analyze multiple screenshots together (for workflows)

        Args:
            image_paths: List of image file paths
            analysis_type: Type of analysis

        Returns:
            Combined analysis results
        """
        try:
            # Encode all images
            image_data_list = [self._encode_image(path) for path in image_paths]

            # Build content with multiple images
            content = [
                {
                    "type": "text",
                    "text": self._build_prompt_for_sequence(analysis_type, len(image_paths))
                }
            ]

            for idx, image_data in enumerate(image_data_list):
                content.append({
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{image_data}",
                        "detail": "high"
                    },
                })

            # Call vision API
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": content}],
                max_tokens=3000,
                temperature=0.3,
            )

            analysis_text = response.choices[0].message.content

            # Parse the analysis
            result = self._parse_workflow_analysis(analysis_text, len(image_paths))

            logger.info(f"Successfully analyzed {len(image_paths)} screenshots")
            return result

        except Exception as e:
            logger.error(f"Error analyzing multiple screenshots: {e}")
            return {
                "status": "error",
                "error": str(e),
                "image_count": len(image_paths),
            }

    def _encode_image(self, image_path: str) -> str:
        """
        Encode image to base64

        Args:
            image_path: Path to image file

        Returns:
            Base64 encoded string
        """
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode("utf-8")

    def _build_prompt(self, analysis_type: str) -> str:
        """
        Build analysis prompt based on type

        Args:
            analysis_type: Type of analysis

        Returns:
            Prompt string
        """
        prompts = {
            "comprehensive": """Analyze this screenshot comprehensively for test planning purposes:

1. **Application Type**: Identify what type of application this is (web, mobile, desktop, etc.)
2. **UI Elements**: List all visible UI elements (buttons, forms, inputs, navigation, etc.)
3. **Features**: Identify the features or functionality shown
4. **User Workflows**: Describe the possible user workflows or actions
5. **Test Scenarios**: Suggest test scenarios based on what you see
6. **Data Elements**: Identify any data inputs, outputs, or validations
7. **Edge Cases**: Suggest potential edge cases or error scenarios

Provide a structured analysis in JSON format with these sections.""",

            "ui_elements": """Analyze this screenshot and extract all UI elements:

List every interactive and non-interactive element visible:
- Buttons (with labels and actions)
- Input fields (type, label, validation hints)
- Dropdowns/Selects
- Checkboxes and Radio buttons
- Navigation elements
- Modals/Dialogs
- Tables/Lists
- Images and Icons

For each element, provide: type, label/text, location, and expected behavior.

Return as structured JSON.""",

            "workflow": """Analyze this screenshot to understand user workflows:

1. **Current Screen**: What page/view is this?
2. **User Intent**: What is the user trying to accomplish?
3. **Actions Available**: What actions can the user take?
4. **Navigation Flow**: Where can the user go from here?
5. **Input Required**: What data/input is needed from the user?
6. **Expected Outcome**: What should happen after user actions?

Provide a clear workflow description.""",

            "requirements": """Extract requirements from this screenshot:

1. **Functional Requirements**: What functionality is shown?
2. **UI Requirements**: What UI/UX requirements are evident?
3. **Validation Requirements**: What validations are needed?
4. **Business Rules**: What business rules can you identify?
5. **Integration Points**: Any integrations or API calls suggested?
6. **Security Requirements**: Any security considerations visible?

List as structured requirements suitable for test planning.""",
        }

        return prompts.get(analysis_type, prompts["comprehensive"])

    def _build_prompt_for_sequence(self, analysis_type: str, image_count: int) -> str:
        """
        Build prompt for analyzing multiple images as a sequence

        Args:
            analysis_type: Type of analysis
            image_count: Number of images

        Returns:
            Prompt string
        """
        return f"""Analyze these {image_count} screenshots as a sequence showing a user workflow:

1. **Workflow Overview**: Describe the complete workflow from start to finish
2. **Step-by-Step Process**: For each screenshot, describe:
   - What screen/page is shown
   - What action the user took to get here
   - What elements are visible
   - What the user should do next

3. **Test Scenarios**: Based on this workflow, suggest:
   - Happy path test cases
   - Alternative paths
   - Error scenarios
   - Edge cases

4. **Requirements**: Extract functional requirements from this workflow

5. **Test Data**: What test data would be needed?

Provide a comprehensive analysis in structured format."""

    def _parse_analysis(self, analysis_text: str, analysis_type: str) -> Dict[str, Any]:
        """
        Parse the AI analysis response

        Args:
            analysis_text: Raw analysis text from AI
            analysis_type: Type of analysis

        Returns:
            Structured analysis
        """
        try:
            # Try to parse as JSON if possible
            import json

            # Look for JSON content in the response
            if "```json" in analysis_text:
                json_start = analysis_text.find("```json") + 7
                json_end = analysis_text.find("```", json_start)
                json_str = analysis_text[json_start:json_end].strip()
                parsed = json.loads(json_str)
            elif analysis_text.strip().startswith("{"):
                parsed = json.loads(analysis_text)
            else:
                # Return as text if not JSON
                parsed = {"analysis": analysis_text}

            return {
                "status": "success",
                "analysis_type": analysis_type,
                "raw_text": analysis_text,
                "structured_data": parsed,
            }

        except json.JSONDecodeError:
            return {
                "status": "success",
                "analysis_type": analysis_type,
                "raw_text": analysis_text,
                "structured_data": {"analysis": analysis_text},
            }

    def _parse_workflow_analysis(self, analysis_text: str, image_count: int) -> Dict[str, Any]:
        """
        Parse workflow analysis from multiple images

        Args:
            analysis_text: Raw analysis text
            image_count: Number of images analyzed

        Returns:
            Structured workflow analysis
        """
        return {
            "status": "success",
            "analysis_type": "workflow_sequence",
            "image_count": image_count,
            "raw_text": analysis_text,
            "workflow": self._extract_workflow_from_text(analysis_text),
        }

    def _extract_workflow_from_text(self, text: str) -> Dict[str, Any]:
        """
        Extract structured workflow information from text

        Args:
            text: Analysis text

        Returns:
            Structured workflow
        """
        # Simple extraction - can be enhanced with better parsing
        lines = text.split("\n")

        workflow = {
            "overview": "",
            "steps": [],
            "test_scenarios": [],
            "requirements": [],
        }

        current_section = None
        for line in lines:
            line = line.strip()
            if not line:
                continue

            if "workflow overview" in line.lower():
                current_section = "overview"
            elif "step" in line.lower() and ("process" in line.lower() or "-" in line):
                current_section = "steps"
            elif "test scenario" in line.lower():
                current_section = "test_scenarios"
            elif "requirement" in line.lower():
                current_section = "requirements"
            elif current_section and line.startswith(("-", "•", "*", "1.", "2.", "3.")):
                workflow[current_section] = workflow[current_section] or []
                if isinstance(workflow[current_section], list):
                    workflow[current_section].append(line.lstrip("-•*123456789. "))

        return workflow

    async def extract_text_from_image(self, image_path: str) -> str:
        """
        Extract text from image using OCR (via vision model)

        Args:
            image_path: Path to image

        Returns:
            Extracted text
        """
        try:
            result = await self.analyze_screenshot(
                image_path,
                custom_prompt="Extract all visible text from this image. Return only the text content, preserving structure and formatting."
            )

            if result["status"] == "success":
                return result.get("raw_text", "")
            return ""

        except Exception as e:
            logger.error(f"Error extracting text from image: {e}")
            return ""


async def get_vision_ai_service(model: str = "gpt-4-vision-preview") -> VisionAIService:
    """
    Get Vision AI Service instance

    Args:
        model: Model to use

    Returns:
        VisionAIService instance
    """
    return VisionAIService(model=model)
