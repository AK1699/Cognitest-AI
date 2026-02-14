"""
Prompt to Steps Service

Converts natural language prompts into structured test steps using AI.
"""

import json
from typing import List, Dict, Any, Optional
from app.services.ai_service import get_ai_service


# Available actions that can be generated
AVAILABLE_ACTIONS = """
Available actions for test steps:

NAVIGATION:
- navigate: Navigate to a URL. Requires: url
- go_back: Go back in browser history
- go_forward: Go forward in browser history
- reload: Reload the current page

CLICK ACTIONS:
- click: Click an element. Requires: selector
- double_click: Double click an element. Requires: selector
- right_click: Right click an element. Requires: selector

INPUT ACTIONS:
- type: Type text into an input. Requires: selector, value
- clear: Clear an input field. Requires: selector
- press: Press a keyboard key. Requires: key (e.g., "Enter", "Tab", "Escape")

ELEMENT ACTIONS:
- hover: Hover over an element. Requires: selector
- focus: Focus on an element. Requires: selector
- scroll: Scroll the page. Optional: direction ("up", "down"), amount (pixels)

FORM ACTIONS:
- select: Select dropdown option. Requires: selector, value
- check: Check a checkbox. Requires: selector
- uncheck: Uncheck a checkbox. Requires: selector
- upload: Upload a file. Requires: selector, file_path

WAIT ACTIONS:
- wait: Wait for a duration. Requires: timeout (milliseconds)
- wait_for_element: Wait for element to appear. Requires: selector, timeout (optional)
- wait_for_navigation: Wait for page navigation. Requires: timeout (optional)

ASSERTIONS:
- assert_visible: Assert element is visible. Requires: selector
- assert_text: Assert element contains text. Requires: selector, value
- assert_value: Assert input has value. Requires: selector, value
- assert_url: Assert current URL matches. Requires: value (URL pattern)
- assert_title: Assert page title. Requires: value

ADVANCED:
- screenshot: Take a screenshot. Optional: name
- execute_script: Run JavaScript. Requires: script
"""

SYSTEM_PROMPT = f"""You are an expert test automation engineer specializing in Playwright-based browser automation. Your task is to convert natural language test descriptions into structured, executable test steps.

{AVAILABLE_ACTIONS}

RULES:
1. Output ONLY valid JSON array of steps — no markdown, no explanation, no code blocks
2. Each step must have an "action" field matching one of the available actions above
3. Use realistic CSS selectors based on common patterns:
   - For inputs: input[name="fieldname"], input[type="email"], #id, .classname
   - For buttons: button[type="submit"], button:has-text("Login"), .btn-primary
   - For links: a[href="/path"], a:has-text("Link Text")
   - For forms: form#formId, form[action="/submit"]
4. Include appropriate waits between navigation actions
5. Add assertions where appropriate to verify expected behavior
6. Use descriptive "description" fields for each step

SELECTOR PRIORITY (use the most resilient option available):
1. data-testid attributes: [data-testid="login-button"] (BEST — most stable)
2. aria-label attributes: [aria-label="Submit form"]
3. name attributes for form fields: [name="email"]
4. id attributes: #submit-btn
5. Text content for buttons/links: button:has-text("Submit")
6. CSS classes (LAST RESORT): .btn-primary
- NEVER use fragile selectors: positional indexes (nth-child), deep nesting (div > div > div > span), or auto-generated class names

WAIT STRATEGY:
- After navigate: always add a wait_for_selector step for a key element on the target page
- After click that triggers navigation: add wait_for_selector for new page content
- For dynamic content (modals, dropdowns, AJAX): use wait_for_selector before interacting
- Default wait timeout: use reasonable selectors that appear quickly

ERROR RECOVERY:
- If a test description is ambiguous, choose the most common user interpretation
- If a selector target is unclear, use the most generic stable selector (e.g., button:has-text("Submit") over .btn-class-xyz)
- If the test needs data, use realistic placeholder values (e.g., "john@example.com", "Test123!")

NEGATIVE EXAMPLE — DO NOT generate steps like this:
[{{"action": "click", "selector": "div:nth-child(3) > div > button.sc-abc123", "description": "Click button"}}]
Problems: fragile positional selector, auto-generated class name, vague description.

OUTPUT FORMAT:
```json
[
  {{
    "action": "action_name",
    "selector": "css_selector",  // if needed
    "value": "value",  // if needed
    "description": "Human readable description of this step"
  }}
]
```
"""


async def generate_steps_from_prompt(
    prompt: str,
    context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Convert a natural language prompt into test steps.
    
    Args:
        prompt: Natural language description of the test scenario
        context: Optional context including current URL, existing steps
        
    Returns:
        Dictionary with generated steps and explanation
    """
    ai_service = get_ai_service()
    
    # Build the user message with context
    user_message = f"Convert this test scenario into structured test steps:\n\n{prompt}"
    
    if context:
        if context.get("currentUrl"):
            user_message += f"\n\nCurrent page URL: {context['currentUrl']}"
        if context.get("existingSteps") and len(context["existingSteps"]) > 0:
            user_message += f"\n\nExisting steps in the test (continue from here):\n{json.dumps(context['existingSteps'], indent=2)}"
    
    user_message += "\n\nGenerate the test steps as a JSON array:"
    
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_message}
    ]
    
    try:
        response = await ai_service.generate_completion(
            messages=messages,
            temperature=0.3,  # Lower temperature for more consistent output
            json_mode=True
        )
        
        # Parse the JSON response
        # Try to extract JSON from the response (handle markdown code blocks)
        json_str = response.strip()
        if json_str.startswith("```"):
            # Remove markdown code block
            lines = json_str.split("\n")
            json_lines = []
            in_block = False
            for line in lines:
                if line.startswith("```"):
                    in_block = not in_block
                    continue
                if in_block:
                    json_lines.append(line)
            json_str = "\n".join(json_lines)
        
        steps = json.loads(json_str)
        
        # Validate and normalize steps
        normalized_steps = []
        for i, step in enumerate(steps):
            if not isinstance(step, dict) or "action" not in step:
                continue
                
            normalized_step = {
                "id": f"gen-{i+1}",
                "action": step.get("action"),
                "description": step.get("description", f"Step {i+1}: {step.get('action')}")
            }
            
            # Copy over other fields
            for key in ["selector", "value", "url", "key", "timeout", "script", 
                       "file_path", "direction", "amount", "name"]:
                if key in step:
                    normalized_step[key] = step[key]
            
            normalized_steps.append(normalized_step)
        
        return {
            "success": True,
            "steps": normalized_steps,
            "explanation": f"Generated {len(normalized_steps)} test steps from your description",
            "rawResponse": response
        }
        
    except json.JSONDecodeError as e:
        return {
            "success": False,
            "steps": [],
            "error": f"Failed to parse AI response as JSON: {str(e)}",
            "rawResponse": response if 'response' in dir() else None
        }
    except Exception as e:
        return {
            "success": False,
            "steps": [],
            "error": str(e)
        }


async def refine_step_with_context(
    step: Dict[str, Any],
    page_html: Optional[str] = None,
    available_elements: Optional[List[Dict]] = None
) -> Dict[str, Any]:
    """
    Refine a generated step with actual page context.
    
    Args:
        step: The step to refine
        page_html: HTML of the current page
        available_elements: List of elements extracted from the page
        
    Returns:
        Refined step with better selectors
    """
    if not available_elements and not page_html:
        return step
    
    ai_service = get_ai_service()
    
    context_info = ""
    if available_elements:
        context_info = f"Available elements on page:\n{json.dumps(available_elements[:20], indent=2)}"
    elif page_html:
        # Truncate HTML to avoid token limits
        context_info = f"Page HTML (truncated):\n{page_html[:5000]}"
    
    messages = [
        {"role": "system", "content": """You are a test automation expert. Given a test step and page context, 
improve the CSS selector to be more reliable and specific. Output only the improved step as JSON."""},
        {"role": "user", "content": f"""
Original step:
{json.dumps(step, indent=2)}

{context_info}

Return the improved step with a better selector:"""}
    ]
    
    try:
        response = await ai_service.generate_completion(
            messages=messages,
            temperature=0.2,
            json_mode=True
        )
        
        refined_step = json.loads(response.strip())
        return refined_step
    except:
        return step
