"""
Web Automation Service
Core execution engine for no-code test automation with self-healing
"""
import asyncio
import json
import time
import re
from typing import Dict, Any, List, Optional
from datetime import datetime
from uuid import UUID
from playwright.async_api import async_playwright, Page, Browser, BrowserContext, Error as PlaywrightError
from sqlalchemy.orm import Session
from sqlalchemy import select, text

from app.models.web_automation import (
    TestFlow, ExecutionRun, StepResult, HealingEvent, LocatorAlternative,
    BrowserType, ExecutionMode, ExecutionRunStatus, StepStatus,
    HealingType, HealingStrategy
)
from app.services.gemini_service import GeminiService
from app.services.self_heal_service import SelfHealService


def _parse_ai_json(raw: str) -> Optional[Dict[str, Any]]:
    if not raw:
        return None
    text = raw.strip()
    fence_match = re.search(r"```(?:json)?\s*(\{.*\})\s*```", text, re.DOTALL)
    if fence_match:
        text = fence_match.group(1).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return None


class SelfHealingLocator:
    """
    Self-healing locator with AI-powered fallback strategies
    """
    
    def __init__(
        self,
        primary_selector: str,
        alternatives: List[Dict[str, Any]],
        ai_service: GeminiService,
        confidence_threshold: Optional[float] = None
    ):
        self.primary_selector = primary_selector
        self.alternatives = alternatives or []
        self.ai_service = ai_service
        self.confidence_threshold = confidence_threshold
        self.healing_history = []
    
    async def find_element(self, page: Page, step_id: str, step_type: str) -> tuple[Any, Optional[Dict[str, Any]]]:
        """
        Find element with progressive fallback strategies
        Returns: (element, healing_info)
        """
        start_time = time.perf_counter()

        # Strategy 1: Try primary selector
        try:
            locator = page.locator(self.primary_selector)
            await locator.wait_for(timeout=5000, state="visible")
            return locator, None
        except PlaywrightError as e:
            print(f"Primary selector failed: {self.primary_selector} - {str(e)}")
        
        # Strategy 2: Try alternative selectors
        for idx, alt in enumerate(self.alternatives):
            try:
                locator = page.locator(alt["value"])
                await locator.wait_for(timeout=3000, state="visible")
                
                healing_info = {
                    "type": HealingType.LOCATOR.value,
                    "strategy": HealingStrategy.ALTERNATIVE.value,
                    "original": self.primary_selector,
                    "healed": alt["value"],
                    "alternative_index": idx,
                    "confidence_score": alt.get("success_rate", 0.7),
                    "alternatives_tried": [a.get("value") for a in self.alternatives if a.get("value")],
                    "healing_duration_ms": int((time.perf_counter() - start_time) * 1000),
                    "success": True
                }
                return locator, healing_info
            except PlaywrightError:
                continue

        # Strategy 3: Heuristic healing (name/id fallback)
        try:
            healed_locator, healing_info = await self.heuristic_heal(page)
            if healed_locator:
                if healing_info is not None and "healing_duration_ms" not in healing_info:
                    healing_info["healing_duration_ms"] = int((time.perf_counter() - start_time) * 1000)
                return healed_locator, healing_info
        except Exception as e:
            print(f"Heuristic healing failed: {str(e)}")
        
        # Strategy 4: AI-powered healing
        try:
            healed_locator, healing_info = await self.ai_heal(page, step_id, step_type)
            if healed_locator:
                return healed_locator, healing_info
        except Exception as e:
            print(f"AI healing failed: {str(e)}")
        
        # Strategy 5: Similarity-based matching
        try:
            healed_locator, healing_info = await self.similarity_heal(page)
            if healed_locator:
                if healing_info is not None and "healing_duration_ms" not in healing_info:
                    healing_info["healing_duration_ms"] = int((time.perf_counter() - start_time) * 1000)
                return healed_locator, healing_info
        except Exception as e:
            print(f"Similarity healing failed: {str(e)}")
        
        raise Exception(f"Unable to locate element with any strategy: {self.primary_selector}")

    async def heuristic_heal(self, page: Page) -> tuple[Any, Dict[str, Any]]:
        """
        Heuristic healing for common selector patterns like name/id
        """
        heal_start = time.perf_counter()
        selector = (self.primary_selector or "").strip()
        if not selector:
            return None, None

        # Only attempt if selector looks like a simple token (no CSS operators)
        if any(ch in selector for ch in [' ', '#', '.', '[', ']', '>', ':', '(', ')', '=', '"', "'"]):
            return None, None

        # Try Playwright semantic selectors first
        semantic_candidates = [
            ("label", lambda: page.get_by_label(selector, exact=False)),
            ("placeholder", lambda: page.get_by_placeholder(selector, exact=False)),
            ("role_textbox", lambda: page.get_by_role("textbox", name=selector)),
        ]

        for strategy, locator_fn in semantic_candidates:
            try:
                locator = locator_fn()
                await locator.first.wait_for(timeout=3000, state="visible")
                healing_info = {
                    "type": HealingType.LOCATOR.value,
                    "strategy": HealingStrategy.CONTEXT.value,
                    "original": selector,
                    "healed": f"{strategy}:{selector}",
                    "confidence_score": 0.75,
                    "alternatives_tried": [],
                    "healing_duration_ms": int((time.perf_counter() - heal_start) * 1000),
                    "success": True
                }
                return locator.first, healing_info
            except PlaywrightError:
                continue

        candidates = [
            f"[name='{selector}']",
            f"input[name='{selector}']",
            f"textarea[name='{selector}']",
            f"[id='{selector}']",
            f"#{selector}",
            f"[name*='{selector}']",
            f"input[name*='{selector}']",
            f"[id*='{selector}']",
            f"input[id*='{selector}']",
            f"[placeholder*='{selector}']",
            f"input[placeholder*='{selector}']",
            f"[aria-label*='{selector}']",
            f"input[aria-label*='{selector}']",
        ]

        for idx, cand in enumerate(candidates):
            try:
                locator = page.locator(cand)
                await locator.wait_for(timeout=3000, state="visible")
                healing_info = {
                    "type": HealingType.LOCATOR.value,
                    "strategy": HealingStrategy.CONTEXT.value,
                    "original": selector,
                    "healed": cand,
                    "confidence_score": 0.7,
                    "alternatives_tried": candidates[:idx],
                    "healing_duration_ms": int((time.perf_counter() - heal_start) * 1000),
                    "success": True
                }
                return locator, healing_info
            except PlaywrightError:
                continue

        return None, None
    
    async def ai_heal(self, page: Page, step_id: str, step_type: str) -> tuple[Any, Dict[str, Any]]:
        """
        Use AI to suggest alternative selectors
        """
        heal_start = time.perf_counter()
        # Get DOM snapshot
        dom_html = await page.content()
        page_url = page.url
        try:
            page_title = await page.title()
        except Exception:
            page_title = None
        
        # Prepare AI prompt
        prompt = f"""
        I need to find an element on a web page that has changed.
        
        Original selector: {self.primary_selector}
        Step type: {step_type}
        Current URL: {page_url}
        
        Failed alternatives tried:
        {json.dumps([alt["value"] for alt in self.alternatives], indent=2)}
        
        Here's the current page DOM (truncated to relevant section):
        {dom_html[:5000]}
        
        Please suggest 3 alternative CSS selectors that might locate the intended element.
        Consider:
        - The element's purpose based on the step type
        - Common selector patterns for {step_type} actions
        - Robust selectors (data-testid, role, aria-label)
        
        Respond in JSON format:
        {{
            "selectors": [
                {{"selector": "...", "reasoning": "...", "confidence": 0.9}},
                ...
            ]
        }}
        """
        
        # Call AI service
        ai_response_raw = await self.ai_service.generate_completion(
            messages=[{"role": "user", "content": prompt}],
            json_mode=True
        )
        
        try:
            # Parse AI response
            suggestions = _parse_ai_json(ai_response_raw) or {}
            
            # Try each suggested selector
            selector_suggestions = suggestions.get("selectors", [])
            selector_suggestions = sorted(
                selector_suggestions,
                key=lambda s: s.get("confidence", 0.0),
                reverse=True
            )
            for suggestion in selector_suggestions:
                try:
                    selector = suggestion["selector"]
                    confidence = suggestion.get("confidence", 0.5)
                    if self.confidence_threshold is not None and confidence < self.confidence_threshold:
                        continue
                    locator = page.locator(selector)
                    await locator.wait_for(timeout=3000, state="visible")
                    
                    healing_info = {
                        "type": HealingType.LOCATOR.value,
                        "strategy": HealingStrategy.AI.value,
                        "original": self.primary_selector,
                        "healed": selector,
                        "ai_reasoning": suggestion.get("reasoning", ""),
                        "confidence_score": confidence,
                        "ai_prompt": prompt,
                        "ai_response": suggestions,
                        "alternatives_tried": [a.get("value") for a in self.alternatives if a.get("value")],
                        "dom_snapshot": dom_html[:5000],
                        "page_title": page_title,
                        "healing_duration_ms": int((time.perf_counter() - heal_start) * 1000),
                        "success": True
                    }
                    return locator, healing_info
                except PlaywrightError:
                    continue
        except Exception:
            pass
        
        return None, None
    
    async def similarity_heal(self, page: Page) -> tuple[Any, Dict[str, Any]]:
        """
        Find similar elements based on text content, position, or attributes
        """
        heal_start = time.perf_counter()
        # Extract selector type and value
        selector_parts = self.primary_selector.split('[')
        
        # Try text-based matching
        if 'text=' in self.primary_selector or selector_parts[0] in ['button', 'a', 'input']:
            try:
                # Try finding by role and approximate text
                element_type = selector_parts[0] if selector_parts else 'button'
                locator = page.locator(f"{element_type}:visible")
                count = await locator.count()
                
                if count > 0:
                    # Return first visible element of same type
                    healing_info = {
                        "type": HealingType.LOCATOR.value,
                        "strategy": HealingStrategy.SIMILARITY.value,
                        "original": self.primary_selector,
                        "healed": f"{element_type}:visible",
                        "confidence_score": 0.6,
                        "healing_duration_ms": int((time.perf_counter() - heal_start) * 1000),
                        "success": True
                    }
                    return locator.first, healing_info
            except PlaywrightError:
                pass
        
        return None, None


class SelfHealingAssertion:
    """
    Self-healing assertions with context-aware validation
    """
    
    def __init__(self, ai_service: GeminiService):
        self.ai_service = ai_service
    
    async def assert_with_healing(
        self, 
        page: Page, 
        assertion: Dict[str, Any]
    ) -> tuple[bool, Optional[Dict[str, Any]]]:
        """
        Validate assertion with AI-powered healing
        Returns: (success, healing_info)
        """
        assertion_type = assertion.get("type")
        selector = assertion.get("selector")
        expected_value = assertion.get("expectedValue")
        tolerance = assertion.get("tolerance", 0)
        
        try:
            # Try standard assertion
            success = await self.standard_assert(page, assertion)
            return success, None
        except Exception as e:
            # Get actual value
            actual_value = await self.get_actual_value(page, selector, assertion_type)
            
            # Ask AI if this is a legitimate change
            healing_info = await self.suggest_assertion_update(
                assertion_type=assertion_type,
                expected_value=expected_value,
                actual_value=actual_value,
                tolerance=tolerance,
                context={"error": str(e), "url": page.url}
            )
            
            if healing_info and healing_info.get("should_update"):
                # Update expectation and retry
                assertion["expectedValue"] = healing_info["new_value"]
                success = await self.standard_assert(page, assertion)
                
                healing_info.update({
                    "type": HealingType.ASSERTION.value,
                    "strategy": HealingStrategy.AI.value,
                    "original": expected_value,
                    "healed": healing_info["new_value"],
                    "confidence_score": healing_info.get("confidence", 0.5),
                    "ai_reasoning": healing_info.get("reasoning", ""),
                    "success": success
                })
                return success, healing_info
            
            # Healing not applicable, raise original error
            raise
    
    async def standard_assert(self, page: Page, assertion: Dict[str, Any]) -> bool:
        """
        Execute standard assertion without healing
        """
        assertion_type = assertion.get("type")
        selector = assertion.get("selector")
        expected_value = assertion.get("expectedValue")
        
        if assertion_type == "text":
            locator = page.locator(selector)
            actual_text = await locator.text_content()
            return actual_text == expected_value

        elif assertion_type == "title":
            actual_title = await page.title()
            comparison = assertion.get("comparison", "equals")
            if comparison == "equals":
                return actual_title == expected_value
            if comparison == "contains":
                return expected_value in actual_title
            if comparison == "starts_with":
                return actual_title.startswith(expected_value)
            if comparison == "ends_with":
                return actual_title.endswith(expected_value)
            if comparison == "regex":
                import re
                return bool(re.search(expected_value, actual_title))
            return actual_title == expected_value
        
        elif assertion_type == "visible":
            locator = page.locator(selector)
            return await locator.is_visible()
        
        elif assertion_type == "url":
            comparison = assertion.get("comparison", "equals")
            actual_url = page.url
            if comparison == "equals":
                return actual_url == expected_value
            if comparison == "contains":
                return expected_value in actual_url
            if comparison == "starts_with":
                return actual_url.startswith(expected_value)
            if comparison == "ends_with":
                return actual_url.endswith(expected_value)
            if comparison == "regex":
                import re
                return bool(re.search(expected_value, actual_url))
            return actual_url == expected_value
        
        elif assertion_type == "attribute":
            locator = page.locator(selector)
            attr_name = assertion.get("attributeName")
            actual_value = await locator.get_attribute(attr_name)
            return actual_value == expected_value
        
        return False
    
    async def get_actual_value(self, page: Page, selector: str, assertion_type: str) -> str:
        """
        Get actual value from page
        """
        try:
            if assertion_type == "text":
                locator = page.locator(selector)
                return await locator.text_content() or ""
            elif assertion_type == "title":
                return await page.title()
            elif assertion_type == "url":
                return page.url
            elif assertion_type == "visible":
                locator = page.locator(selector)
                return str(await locator.is_visible())
            elif assertion_type == "attribute":
                locator = page.locator(selector)
                return await locator.get_attribute("value") or ""
        except Exception:
            return "ERROR: Could not retrieve value"
    
    async def suggest_assertion_update(
        self,
        assertion_type: str,
        expected_value: str,
        actual_value: str,
        tolerance: float,
        context: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Use AI to determine if assertion should be updated
        """
        prompt = f"""
        An assertion has failed during test execution. Determine if this is a legitimate change or a real failure.
        
        Assertion Type: {assertion_type}
        Expected Value: {expected_value}
        Actual Value: {actual_value}
        Tolerance: {tolerance}
        Context: {json.dumps(context)}
        
        Consider:
        - Are these values semantically equivalent? (e.g., "Login" vs "Log In")
        - Is this a minor formatting change? (e.g., whitespace, capitalization)
        - Could this be a dynamic value that legitimately changes? (e.g., timestamps, counters)
        - Is the actual value still functionally correct for the test's purpose?
        
        Respond in JSON:
        {{
            "should_update": true/false,
            "new_value": "suggested value if should_update is true",
            "confidence": 0.0-1.0,
            "reasoning": "explanation",
            "is_legitimate_change": true/false
        }}
        """
        
        try:
            ai_response_raw = await self.ai_service.generate_completion(
                messages=[{"role": "user", "content": prompt}],
                json_mode=True
            )
            suggestion = _parse_ai_json(ai_response_raw)
            if not suggestion:
                return None
            ai_response_payload = dict(suggestion)
            suggestion["ai_prompt"] = prompt
            suggestion["ai_response"] = ai_response_payload
            return suggestion
        except Exception as e:
            print(f"AI assertion suggestion failed: {str(e)}")
            return None


class WebAutomationExecutor:
    """
    Main execution engine for web automation tests
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.ai_service = GeminiService()
        self.self_heal_service = SelfHealService(db)
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        self.execution_run: Optional[ExecutionRun] = None
        self.variables: Dict[str, str] = {}
        self.ws_callbacks = []  # WebSocket callbacks for live updates
    
    def register_ws_callback(self, callback):
        """Register callback for live updates"""
        self.ws_callbacks.append(callback)
    
    async def emit_live_update(self, update_type: str, payload: Dict[str, Any]):
        """Emit live update to all registered callbacks"""
        from datetime import datetime
        message = {
            "execution_run_id": str(self.execution_run.id) if self.execution_run else None,
            "type": update_type,
            "payload": payload,
            "recorded_at": datetime.utcnow().isoformat()
        }
        for callback in self.ws_callbacks:
            try:
                await callback(message)
            except Exception as e:
                print(f"WebSocket callback error: {str(e)}")

    def substitute_variables(self, text: str) -> str:
        """
        Substitute environment variables in text using ${VAR_NAME} format
        Supports nested access like ${apiResponse.body} or ${apiResponse.body.userId}
        """
        if not text or not isinstance(text, str):
            return text
            
        if not self.variables:
            return text
            
        import re
        
        def get_nested_value(var_path: str):
            """Get value from nested path like 'apiResponse.body.userId'"""
            parts = var_path.split('.')
            root = parts[0]
            
            # First check if full path exists as a direct key (for backward compatibility)
            if var_path in self.variables:
                return str(self.variables[var_path])
            
            # Then try to get the root variable
            if root not in self.variables:
                return None
            
            value = self.variables[root]
            
            # Navigate through nested properties
            for part in parts[1:]:
                if isinstance(value, dict):
                    if part in value:
                        value = value[part]
                    else:
                        return None
                elif isinstance(value, str):
                    # Try to parse as JSON
                    import json
                    try:
                        parsed = json.loads(value)
                        if isinstance(parsed, dict) and part in parsed:
                            value = parsed[part]
                        else:
                            return None
                    except:
                        return None
                else:
                    return None
            
            # Convert to string for substitution
            if isinstance(value, dict):
                import json
                return json.dumps(value)
            return str(value) if value is not None else None
        
        def replace(match):
            var_path = match.group(1)
            result = get_nested_value(var_path)
            return result if result is not None else match.group(0)
            
        # Updated regex to support dot notation in variable names
        return re.sub(r'\$\{([a-zA-Z_][a-zA-Z0-9_.]*)\}', replace, text)

    async def emit_live_update(self, update_type: str, payload: Dict[str, Any]):
        """Emit live update to all registered callbacks"""
        message = {
            "type": update_type,
            "execution_run_id": str(self.execution_run.id) if self.execution_run else None,
            "payload": payload,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        for callback in self.ws_callbacks:
            try:
                await callback(message)
            except Exception as e:
                print(f"WebSocket callback error: {str(e)}")
    
    async def execute_test_flow(
        self,
        test_flow_id: UUID,
        browser_type: BrowserType = BrowserType.CHROME,
        execution_mode: ExecutionMode = ExecutionMode.HEADED,
        triggered_by: Optional[UUID] = None,
        variables: Optional[Dict[str, str]] = None,
        execution_run_id: Optional[UUID] = None
    ) -> ExecutionRun:
        """
        Execute a complete test flow
        """
        # Load test flow
        result = await self.db.execute(select(TestFlow).where(TestFlow.id == test_flow_id))
        test_flow = result.scalar_one_or_none()
        
        if not test_flow:
            raise ValueError(f"Test flow not found: {test_flow_id}")
            
        # Set variables
        self.variables = variables or {}
        
        # Get or Create execution run
        if execution_run_id:
            result = await self.db.execute(select(ExecutionRun).where(ExecutionRun.id == execution_run_id))
            self.execution_run = result.scalar_one_or_none()
            if not self.execution_run:
                 raise ValueError(f"Execution run not found: {execution_run_id}")
            # Ensure session is attached
            self.execution_run = await self.db.merge(self.execution_run)
        else:
            self.execution_run = ExecutionRun(
                test_flow_id=test_flow.id,
                project_id=test_flow.project_id,
                browser_type=browser_type,
                execution_mode=execution_mode,
                status=ExecutionRunStatus.PENDING,
                triggered_by=triggered_by,
                total_steps=len(test_flow.nodes),
                execution_environment={
                    "browser": browser_type.value,
                    "mode": execution_mode.value,
                    "platform": "linux",  # TODO: detect actual platform
                    "variables": self.variables
                }
            )
            self.db.add(self.execution_run)
            await self.db.commit()
            await self.db.refresh(self.execution_run)
        
        try:
            # Setup browser
            await self.setup_browser(browser_type, execution_mode, test_flow.browser_options)
            
            # Update status to running
            self.execution_run.status = ExecutionRunStatus.RUNNING
            self.execution_run.started_at = datetime.utcnow()
            await self.db.commit()
            
            await self.emit_live_update("executionStarted", {
                "test_flow_name": test_flow.name,
                "browser": browser_type.value,
                "mode": execution_mode.value
            })
            
            # Navigate to base URL
            base_url = self.substitute_variables(test_flow.base_url)
            await self.page.goto(base_url, wait_until="networkidle")
            await self.emit_live_update("navigation", {"url": base_url})
            
            # Execute each step
            for idx, node in enumerate(test_flow.nodes):
                await self.execute_step(node, idx, test_flow)
            
            # Calculate summary
            self.execution_run.status = ExecutionRunStatus.COMPLETED
            self.execution_run.ended_at = datetime.utcnow()
            duration = (self.execution_run.ended_at - self.execution_run.started_at).total_seconds() * 1000
            self.execution_run.duration_ms = int(duration)
            
            # Update test flow statistics
            test_flow.total_executions += 1
            if self.execution_run.failed_steps == 0:
                test_flow.successful_executions += 1
            else:
                test_flow.failed_executions += 1
            
            test_flow.last_executed_at = datetime.utcnow()
            
            await self.db.commit()
            
            await self.emit_live_update("executionCompleted", {
                "status": "success",
                "duration_ms": self.execution_run.duration_ms,
                "passed_steps": self.execution_run.passed_steps,
                "failed_steps": self.execution_run.failed_steps
            })
            
        except Exception as e:
            self.execution_run.status = ExecutionRunStatus.FAILED
            self.execution_run.error_message = str(e)
            self.execution_run.ended_at = datetime.utcnow()
            await self.db.commit()
            
            await self.emit_live_update("executionFailed", {
                "error": str(e)
            })
            
            raise
        
        finally:
            await self.cleanup()
        
        return self.execution_run
    
    async def cleanup(self):
        """Clean up browser resources"""
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()
            
    async def start_recording(self, url: str):
        """
        Start a recording session
        """
        self.playwright = await async_playwright().start()
        
        # Launch browser in headed mode for recording
        self.browser = await self.playwright.chromium.launch(
            headless=False,
            args=['--start-maximized']
        )
        
        # Create context
        self.context = await self.browser.new_context(
            viewport=None,
            record_video_dir=None
        )
        
        # Create page
        self.page = await self.context.new_page()
        
        # Expose binding for recording events
        await self.page.expose_function("record_event", self.handle_recorded_event)
        
        # Navigate
        try:
            await self.page.goto(url, wait_until="domcontentloaded")
            await self._inject_recorder_script()
        except Exception as e:
            print(f"Recording navigation error: {e}")
            
    async def stop_recording(self):
        """Stop recording session"""
        await self.cleanup()
        
    async def handle_recorded_event(self, event: Dict[str, Any]):
        """Handle event from browser"""
        # Emit to WebSocket
        await self.emit_live_update("recorded_event", event)
        
    async def _inject_recorder_script(self):
        """Inject observer script into page"""
        script = """
        (() => {
            if (window._recorderActive) return;
            window._recorderActive = true;
            
            function getCssSelector(el) {
                if (!(el instanceof Element)) return;
                const path = [];
                while (el.nodeType === Node.ELEMENT_NODE) {
                    let selector = el.nodeName.toLowerCase();
                    if (el.id) {
                        selector += '#' + el.id;
                        path.unshift(selector);
                        break;
                    } else {
                        let sib = el, nth = 1;
                        while (sib = sib.previousElementSibling) {
                            if (sib.nodeName.toLowerCase() == selector)
                                nth++;
                        }
                        if (nth != 1)
                            selector += ":nth-of-type(" + nth + ")";
                    }
                    path.unshift(selector);
                    el = el.parentNode;
                }
                return path.join(" > ");
            }
            
            // Click Handler
            document.addEventListener('click', (e) => {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
                const selector = getCssSelector(e.target);
                window.record_event({
                    type: 'click',
                    selector: { css: selector },
                    description: `Click on ${e.target.innerText || selector}`
                });
            }, true);
            
            // Input Handler
            document.addEventListener('change', (e) => {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                    const selector = getCssSelector(e.target);
                    window.record_event({
                        type: 'input',
                        selector: { css: selector },
                        value: e.target.value,
                        description: `Type '${e.target.value}' into ${selector}`
                    });
                }
            }, true);
            
            // Navigation (handled by page events usually, but capturing clicks on links helps)
            
            console.log("Cognitest Recorder Injected");
        })();
        """
        await self.page.add_init_script(script)
        # Also run immediately in case page is already loaded
        await self.page.evaluate(script)

    async def setup_browser(
        self,
        browser_type: BrowserType,
        execution_mode: ExecutionMode,
        options: Dict[str, Any] = None
    ):
        """
        Initialize browser instance
        """
        self.playwright = await async_playwright().start()
        
        options = options or {}

        launch_options = {
            "headless": execution_mode == ExecutionMode.HEADLESS,
            **options.get("launch_options", {})
        }
        
        # Select browser
        if browser_type == BrowserType.CHROME:
            self.browser = await self.playwright.chromium.launch(channel="chrome", **launch_options)
        elif browser_type == BrowserType.FIREFOX:
            self.browser = await self.playwright.firefox.launch(**launch_options)
        elif browser_type == BrowserType.SAFARI:
            self.browser = await self.playwright.webkit.launch(**launch_options)
        elif browser_type == BrowserType.EDGE:
            self.browser = await self.playwright.chromium.launch(channel="msedge", **launch_options)
        else:
            self.browser = await self.playwright.chromium.launch(**launch_options)
        
        # Create context
        context_options = {
            "viewport": options.get("viewport", {"width": 1280, "height": 720}),
            "ignore_https_errors": True,
            "accept_downloads": True,
            **options.get("context_options", {})
        }
        
        if execution_mode == ExecutionMode.HEADED:
            context_options["record_video_dir"] = "videos/"
        
        self.context = await self.browser.new_context(**context_options)
        self.page = await self.context.new_page()
        
        # Setup page listeners
        self.page.on("console", lambda msg: asyncio.create_task(
            self.emit_live_update("console", {"level": msg.type, "text": msg.text})
        ))
    
    async def teardown_browser(self):
        """
        Cleanup browser resources
        """
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
    
    async def execute_step(self, node: Dict[str, Any], step_order: int, test_flow: TestFlow):
        """
        Execute a single test step
        """
        step_id = node.get("id")
        step_data = node.get("data", {})
        step_type = step_data.get("actionType", "unknown")
        
        # Generate human-friendly step name
        def format_action_name(action_type: str) -> str:
            """Convert action_type to human-friendly name"""
            action_names = {
                'navigate': 'Navigate',
                'click': 'Click',
                'type': 'Type',
                'fill': 'Fill',
                'assert': 'Assert',
                'assert_title': 'Assert Title',
                'assert_url': 'Assert URL',
                'assert_visible': 'Assert Visible',
                'assert_text': 'Assert Text',
                'assert_not_visible': 'Assert Hidden',
                'assert_element_count': 'Assert Count',
                'soft_assert': 'Soft Assert',
                'wait': 'Wait',
                'screenshot': 'Screenshot',
                'hover': 'Hover',
                'scroll': 'Scroll',
                'select': 'Select',
                'upload': 'Upload',
                'press': 'Press Key',
                'double_click': 'Double Click',
                'right_click': 'Right Click',
                'focus': 'Focus',
                'drag_drop': 'Drag and Drop',
                'execute_script': 'Execute Script',
                'set_variable': 'Set Variable',
                'log': 'Log',
                'reload': 'Reload',
                'go_back': 'Go Back',
                'go_forward': 'Go Forward',
            }
            return action_names.get(action_type, action_type.replace('_', ' ').title())
        
        step_name = step_data.get("label") or step_data.get("description") or format_action_name(step_type)
        
        # Create step result record
        step_result = StepResult(
            execution_run_id=self.execution_run.id,
            step_id=step_id,
            step_name=step_name,
            step_type=step_type,
            step_order=step_order,
            status=StepStatus.RUNNING,
            action_details=step_data
        )
        self.db.add(step_result)
        self.db.commit()
        self.db.refresh(step_result)
        
        step_result.started_at = datetime.utcnow()
        
        await self.emit_live_update("stepStarted", {
            "step_id": step_id,
            "step_type": step_type,
            "step_name": step_result.step_name
        })
        
        try:
            # Execute action based on type
            healing_info = await self.execute_action(
                step_type,
                step_data,
                test_flow,
                step_id=step_id,
                step_result_id=step_result.id
            )
            
            # Capture screenshot
            screenshot = await self.page.screenshot()
            step_result.screenshot_url = f"screenshots/{self.execution_run.id}/{step_id}.png"
            # TODO: Save screenshot to storage
            
            await self.emit_live_update("screenUpdate", {
                "step_id": step_id,
                "screenshot": f"data:image/png;base64,{screenshot.hex()}",
                "url": self.page.url
            })
            
            # Update step result
            step_result.status = StepStatus.PASSED
            if healing_info:
                step_result.was_healed = True
                step_result.healing_applied = healing_info
                self.execution_run.healed_steps += 1
                # Live updates for healing
                await self.emit_live_update("healingApplied", {
                    "step_id": step_id,
                    "healing_info": healing_info
                })
            
            self.execution_run.passed_steps += 1

            if healing_info and not healing_info.get("event_recorded"):
                await self.record_healing_event(
                    healing_info=healing_info,
                    step_id=step_id,
                    step_type=step_type,
                    step_result_id=step_result.id
                )
            
            await self.emit_live_update("stepCompleted", {
                "step_id": step_id,
                "status": "passed",
                "healed": bool(healing_info)
            })
            
        except Exception as e:
            step_result.status = StepStatus.FAILED
            step_result.error_message = str(e)
            self.execution_run.failed_steps += 1
            
            await self.emit_live_update("stepFailed", {
                "step_id": step_id,
                "error": str(e)
            })
        
        finally:
            step_result.ended_at = datetime.utcnow()
            duration = (step_result.ended_at - step_result.started_at).total_seconds() * 1000
            step_result.duration_ms = int(duration)
            self.db.commit()
    
    async def execute_action(
        self,
        action_type: str,
        action_data: Dict[str, Any],
        test_flow: TestFlow,
        step_id: Optional[str] = None,
        step_result_id: Optional[UUID] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Execute specific action type with self-healing
        Returns healing_info if healing was applied
        """
        healing_info = None
        
        if action_type == "navigate":
            url = self.substitute_variables(action_data.get("url"))
            await self.page.goto(url, wait_until="networkidle")
        
        elif action_type == "click":
            selector_data = action_data.get("selector", {})
            locator, healing_info = await self.get_locator_with_healing(
                selector_data, action_type, test_flow, step_id=step_id, step_result_id=step_result_id
            )
            await locator.click()
        
        elif action_type == "type":
            selector_data = action_data.get("selector", {})
            value = self.substitute_variables(action_data.get("value", ""))
            locator, healing_info = await self.get_locator_with_healing(
                selector_data, action_type, test_flow, step_id=step_id, step_result_id=step_result_id
            )
            await locator.fill(value)
        
        elif action_type == "assert":
            assertion = action_data.get("assertion", {})
            assertor = SelfHealingAssertion(self.ai_service)
            if test_flow.healing_enabled:
                success, healing_info = await assertor.assert_with_healing(self.page, assertion)
                if not success:
                    raise Exception(f"Assertion failed: {assertion}")
            else:
                success = await assertor.standard_assert(self.page, assertion)
                if not success:
                    raise Exception(f"Assertion failed: {assertion}")
        
        elif action_type == "assert_title":
            # Check expected_title first, fallback to value (frontend uses 'value' field)
            expected_title = self.substitute_variables(
                action_data.get("expected_title") or action_data.get("value", "")
            )
            comparison = action_data.get("comparison", "equals")
            assertion = {"type": "title", "expectedValue": expected_title, "comparison": comparison}
            assertor = SelfHealingAssertion(self.ai_service)
            if test_flow.healing_enabled:
                success, healing_info = await assertor.assert_with_healing(self.page, assertion)
                if not success:
                    actual_title = await self.page.title()
                    raise Exception(f"Title assertion failed: expected '{expected_title}' ({comparison}), got '{actual_title}'")
            else:
                success = await assertor.standard_assert(self.page, assertion)
                if not success:
                    actual_title = await self.page.title()
                    raise Exception(f"Title assertion failed: expected '{expected_title}' ({comparison}), got '{actual_title}'")
        
        elif action_type == "assert_url":
            # Check expected_url first, fallback to value (frontend uses 'value' field)
            expected_url = self.substitute_variables(
                action_data.get("expected_url") or action_data.get("value", "")
            )
            comparison = action_data.get("comparison", "equals")
            assertion = {"type": "url", "expectedValue": expected_url, "comparison": comparison}
            assertor = SelfHealingAssertion(self.ai_service)
            if test_flow.healing_enabled:
                success, healing_info = await assertor.assert_with_healing(self.page, assertion)
                if not success:
                    actual_url = self.page.url
                    raise Exception(f"URL assertion failed: expected '{expected_url}' ({comparison}), got '{actual_url}'")
            else:
                success = await assertor.standard_assert(self.page, assertion)
                if not success:
                    actual_url = self.page.url
                    raise Exception(f"URL assertion failed: expected '{expected_url}' ({comparison}), got '{actual_url}'")
        
        elif action_type == "wait":
            wait_type = action_data.get("waitType", "time")
            if wait_type == "time":
                # Frontend uses 'amount', also check 'duration' and 'timeout' for compatibility
                duration = action_data.get("amount") or action_data.get("duration") or action_data.get("timeout") or 5000
                print(f"[WAIT DEBUG] action_data: {action_data}")
                print(f"[WAIT DEBUG] Waiting for {duration}ms")
                await asyncio.sleep(duration / 1000)
            elif wait_type == "element":
                selector_data = action_data.get("selector", {})
                locator, healing_info = await self.get_locator_with_healing(
                    selector_data, action_type, test_flow, step_id=step_id, step_result_id=step_result_id
                )
                await locator.wait_for(state="visible")
        
        elif action_type == "screenshot":
            path = action_data.get("path", "screenshot.png")
            full_page = action_data.get("full_page", False)
            await self.page.screenshot(path=path, full_page=full_page)

        # --- Hover ---
        elif action_type == "hover":
            selector_data = action_data.get("selector", {})
            locator, healing_info = await self.get_locator_with_healing(
                selector_data, action_type, test_flow, step_id=step_id, step_result_id=step_result_id
            )
            await locator.hover()

        # --- Select Dropdown ---
        elif action_type == "select":
            selector_data = action_data.get("selector", {})
            locator, healing_info = await self.get_locator_with_healing(
                selector_data, action_type, test_flow, step_id=step_id, step_result_id=step_result_id
            )
            # Support selecting by value, label, or index
            select_by = action_data.get("select_by", "value")  # value, label, index
            option = self.substitute_variables(action_data.get("option", ""))
            
            if select_by == "value":
                await locator.select_option(value=option)
            elif select_by == "label":
                await locator.select_option(label=option)
            elif select_by == "index":
                await locator.select_option(index=int(option))
            else:
                await locator.select_option(option)

        # --- File Upload ---
        elif action_type == "upload":
            selector_data = action_data.get("selector", {})
            locator, healing_info = await self.get_locator_with_healing(
                selector_data, action_type, test_flow, step_id=step_id, step_result_id=step_result_id
            )
            file_path = self.substitute_variables(action_data.get("file_path", ""))
            if file_path:
                await locator.set_input_files(file_path)

        # --- Press Keyboard Key ---
        elif action_type == "press":
            key = action_data.get("key", "Enter")
            # If a selector is provided, focus on element first
            selector_data = action_data.get("selector", {})
            if selector_data and selector_data.get("primary"):
                locator, healing_info = await self.get_locator_with_healing(
                    selector_data, action_type, test_flow, step_id=step_id, step_result_id=step_result_id
                )
                await locator.press(key)
            else:
                await self.page.keyboard.press(key)

        # --- Scroll ---
        elif action_type == "scroll":
            scroll_type = action_data.get("scroll_type", "page")  # page, element, coordinates
            direction = action_data.get("direction", "down")  # up, down, left, right
            amount = action_data.get("amount", 500)  # pixels
            
            if scroll_type == "element":
                selector_data = action_data.get("selector", {})
                locator, healing_info = await self.get_locator_with_healing(
                    selector_data, action_type, test_flow, step_id=step_id, step_result_id=step_result_id
                )
                await locator.scroll_into_view_if_needed()
            elif scroll_type == "coordinates":
                x = action_data.get("x", 0)
                y = action_data.get("y", 0)
                await self.page.evaluate(f"window.scrollTo({x}, {y})")
            else:
                # Scroll page
                if direction == "down":
                    await self.page.evaluate(f"window.scrollBy(0, {amount})")
                elif direction == "up":
                    await self.page.evaluate(f"window.scrollBy(0, -{amount})")
                elif direction == "right":
                    await self.page.evaluate(f"window.scrollBy({amount}, 0)")
                elif direction == "left":
                    await self.page.evaluate(f"window.scrollBy(-{amount}, 0)")
                elif direction == "bottom":
                    await self.page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                elif direction == "top":
                    await self.page.evaluate("window.scrollTo(0, 0)")

        # --- Double Click ---
        elif action_type == "double_click":
            selector_data = action_data.get("selector", {})
            locator, healing_info = await self.get_locator_with_healing(
                selector_data, action_type, test_flow, step_id=step_id, step_result_id=step_result_id
            )
            await locator.dblclick()

        # --- Right Click (Context Menu) ---
        elif action_type == "right_click":
            selector_data = action_data.get("selector", {})
            locator, healing_info = await self.get_locator_with_healing(
                selector_data, action_type, test_flow, step_id=step_id, step_result_id=step_result_id
            )
            await locator.click(button="right")

        # --- Focus ---
        elif action_type == "focus":
            selector_data = action_data.get("selector", {})
            locator, healing_info = await self.get_locator_with_healing(
                selector_data, action_type, test_flow, step_id=step_id, step_result_id=step_result_id
            )
            await locator.focus()

        # --- Clear Input ---
        elif action_type == "clear":
            selector_data = action_data.get("selector", {})
            locator, healing_info = await self.get_locator_with_healing(
                selector_data, action_type, test_flow, step_id=step_id, step_result_id=step_result_id
            )
            await locator.clear()

        # --- Check/Uncheck Checkbox ---
        elif action_type == "check":
            selector_data = action_data.get("selector", {})
            locator, healing_info = await self.get_locator_with_healing(
                selector_data, action_type, test_flow, step_id=step_id, step_result_id=step_result_id
            )
            await locator.check()

        elif action_type == "uncheck":
            selector_data = action_data.get("selector", {})
            locator, healing_info = await self.get_locator_with_healing(
                selector_data, action_type, test_flow, step_id=step_id, step_result_id=step_result_id
            )
            await locator.uncheck()

        # --- Drag and Drop ---
        elif action_type == "drag_drop":
            source_selector = action_data.get("source_selector", {})
            target_selector = action_data.get("target_selector", {})
            
            source_locator, _ = await self.get_locator_with_healing(
                source_selector, action_type, test_flow, step_id=step_id, step_result_id=step_result_id
            )
            target_locator, _ = await self.get_locator_with_healing(
                target_selector, action_type, test_flow, step_id=step_id, step_result_id=step_result_id
            )
            await source_locator.drag_to(target_locator)

        # --- Wait for Network Idle ---
        elif action_type == "wait_network":
            timeout = action_data.get("timeout", 30000)
            await self.page.wait_for_load_state("networkidle", timeout=timeout)

        # --- Wait for URL ---
        elif action_type == "wait_url":
            url_pattern = self.substitute_variables(action_data.get("url", ""))
            timeout = action_data.get("timeout", 30000)
            await self.page.wait_for_url(url_pattern, timeout=timeout)

        # --- Go Back ---
        elif action_type == "go_back":
            await self.page.go_back()

        # --- Go Forward ---
        elif action_type == "go_forward":
            await self.page.go_forward()

        # --- Reload ---
        elif action_type == "reload":
            await self.page.reload()

        # --- Data Extraction ---
        elif action_type == "extract_text":
            selector_data = action_data.get("selector", {})
            variable_name = action_data.get("variable_name")
            if variable_name:
                locator, healing_info = await self.get_locator_with_healing(
                    selector_data, action_type, test_flow, step_id=step_id, step_result_id=step_result_id
                )
                text = await locator.text_content()
                self.variables[variable_name] = text
                
        elif action_type == "extract_attribute":
            selector_data = action_data.get("selector", {})
            attribute_name = action_data.get("attribute_name")
            variable_name = action_data.get("variable_name")
            if variable_name and attribute_name:
                locator, healing_info = await self.get_locator_with_healing(
                    selector_data, action_type, test_flow, step_id=step_id, step_result_id=step_result_id
                )
                value = await locator.get_attribute(attribute_name)
                self.variables[variable_name] = value or ""

        elif action_type == "set_variable":
            variable_name = action_data.get("variable_name")
            value = self.substitute_variables(action_data.get("value", ""))
            if variable_name:
                self.variables[variable_name] = value

        # --- Scripting ---
        elif action_type == "execute_script":
            script = action_data.get("script", "")
            variable_name = action_data.get("variable_name")
            if script:
                result = await self.page.evaluate(script)
                if variable_name:
                    self.variables[variable_name] = str(result)

        # --- Cookies ---
        elif action_type == "get_cookie":
            name = action_data.get("name")
            variable_name = action_data.get("variable_name")
            if name and variable_name:
                cookies = await self.context.cookies()
                for cookie in cookies:
                    if cookie["name"] == name:
                        self.variables[variable_name] = cookie["value"]
                        break
        
        elif action_type == "set_cookie":
            name = self.substitute_variables(action_data.get("name", ""))
            value = self.substitute_variables(action_data.get("value", ""))
            url = action_data.get("url", self.page.url)
            if name and value:
                await self.context.add_cookies([{"name": name, "value": value, "url": url}])
        
        elif action_type == "delete_cookie":
            name = action_data.get("name")
            # Playwright doesn't have a direct delete_cookie for a specific cookie easily exposed on context without clearing needed logic, 
            # but we can use client implementation or script if needed. 
            # For now, using evaluate to delete from document if possible or finding it in context.
            # Actually context.clear_cookies() clears all. To delete one, we might need to filter and re-add?
            # Easier: use browser script.
            if name:
                await self.page.evaluate(f"document.cookie = '{name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'")

        elif action_type == "clear_cookies":
            await self.context.clear_cookies()

        # --- Local/Session Storage ---
        elif action_type == "get_local_storage":
            key = action_data.get("key")
            variable_name = action_data.get("variable_name")
            if key and variable_name:
                value = await self.page.evaluate(f"localStorage.getItem('{key}')")
                self.variables[variable_name] = value or ""
        
        elif action_type == "set_local_storage":
            key = action_data.get("key")
            value = self.substitute_variables(action_data.get("value", ""))
            if key:
                await self.page.evaluate(f"localStorage.setItem('{key}', '{value}')")
        
        elif action_type == "clear_local_storage":
             await self.page.evaluate("localStorage.clear()")

        elif action_type == "get_session_storage":
            key = action_data.get("key")
            variable_name = action_data.get("variable_name")
            if key and variable_name:
                value = await self.page.evaluate(f"sessionStorage.getItem('{key}')")
                self.variables[variable_name] = value or ""
        
        elif action_type == "set_session_storage":
            key = action_data.get("key")
            value = self.substitute_variables(action_data.get("value", ""))
            if key:
                await self.page.evaluate(f"sessionStorage.setItem('{key}', '{value}')")
        
        elif action_type == "clear_session_storage":
             await self.page.evaluate("sessionStorage.clear()")

        # --- Conditional Logic ---
        elif action_type == "set_variable_ternary":
            variable_name = action_data.get("variable_name")
            condition = action_data.get("condition")
            true_value = self.substitute_variables(action_data.get("true_value", ""))
            false_value = self.substitute_variables(action_data.get("false_value", ""))
            
            if variable_name and condition:
                # Evaluate condition in browser context
                result = await self.page.evaluate(condition)
                self.variables[variable_name] = true_value if result else false_value

        elif action_type == "if_condition":
            condition = action_data.get("condition")
            nested_action_type = action_data.get("nested_action_type")
            nested_action_data = action_data.get("nested_action_data", {})
            
            if condition and nested_action_type:
                # Evaluate condition
                should_run = await self.page.evaluate(condition)
                if should_run:
                    # Recursively execute the nested action
                    # Note: We don't return healing info from nested for now to simple maintain flow
                    await self.execute_action(nested_action_type, nested_action_data, test_flow)

        # --- Control Flow: For Loop ---
        elif action_type == "for-loop" or action_type == "for_loop":
            iterations = action_data.get("iterations", 1)
            loop_variable = action_data.get("loop_variable", "i")
            nested_steps = action_data.get("nested_steps", [])
            
            for i in range(iterations):
                # Set loop variable
                self.variables[loop_variable] = str(i)
                
                # Execute all nested steps
                for step in nested_steps:
                    step_type = step.get("action") or step.get("actionType")
                    step_data = step.get("data", step)
                    await self.execute_action(step_type, step_data, test_flow)

        # --- Control Flow: While Loop ---
        elif action_type == "while-loop" or action_type == "while_loop":
            condition = action_data.get("condition")
            max_iterations = action_data.get("max_iterations", 100)  # Safety limit
            nested_steps = action_data.get("nested_steps", [])
            
            iteration = 0
            while iteration < max_iterations:
                # Evaluate condition in browser
                should_continue = await self.page.evaluate(condition)
                if not should_continue:
                    break
                
                # Execute nested steps
                for step in nested_steps:
                    step_type = step.get("action") or step.get("actionType")
                    step_data = step.get("data", step)
                    await self.execute_action(step_type, step_data, test_flow)
                
                iteration += 1
                self.variables["loop_iteration"] = str(iteration)

        # --- Control Flow: Try-Catch ---
        elif action_type == "try-catch" or action_type == "try_catch":
            try_steps = action_data.get("try_steps", [])
            catch_steps = action_data.get("catch_steps", [])
            finally_steps = action_data.get("finally_steps", [])
            
            try:
                for step in try_steps:
                    step_type = step.get("action") or step.get("actionType")
                    step_data = step.get("data", step)
                    await self.execute_action(step_type, step_data, test_flow)
            except Exception as e:
                self.variables["error_message"] = str(e)
                for step in catch_steps:
                    step_type = step.get("action") or step.get("actionType")
                    step_data = step.get("data", step)
                    await self.execute_action(step_type, step_data, test_flow)
            finally:
                for step in finally_steps:
                    step_type = step.get("action") or step.get("actionType")
                    step_data = step.get("data", step)
                    await self.execute_action(step_type, step_data, test_flow)

        # --- Random Data Generation ---
        elif action_type == "random-data" or action_type == "random_data":
            import random
            import string
            import uuid as uuid_lib
            
            data_type = action_data.get("data_type", "string")  # string, number, email, name, uuid, phone, date
            variable_name = action_data.get("variable_name")
            length = action_data.get("length", 10)
            min_val = action_data.get("min", 0)
            max_val = action_data.get("max", 1000)
            prefix = action_data.get("prefix", "")
            suffix = action_data.get("suffix", "")
            
            generated_value = ""
            
            if data_type == "string":
                generated_value = ''.join(random.choices(string.ascii_letters, k=length))
            elif data_type == "alphanumeric":
                generated_value = ''.join(random.choices(string.ascii_letters + string.digits, k=length))
            elif data_type == "number":
                generated_value = str(random.randint(min_val, max_val))
            elif data_type == "float":
                generated_value = str(round(random.uniform(min_val, max_val), 2))
            elif data_type == "email":
                rand_str = ''.join(random.choices(string.ascii_lowercase, k=8))
                domains = ["gmail.com", "yahoo.com", "outlook.com", "test.com"]
                generated_value = f"{rand_str}@{random.choice(domains)}"
            elif data_type == "name":
                first_names = ["John", "Jane", "Bob", "Alice", "Charlie", "Diana", "Eve", "Frank"]
                last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller"]
                generated_value = f"{random.choice(first_names)} {random.choice(last_names)}"
            elif data_type == "first_name":
                first_names = ["John", "Jane", "Bob", "Alice", "Charlie", "Diana", "Eve", "Frank"]
                generated_value = random.choice(first_names)
            elif data_type == "last_name":
                last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller"]
                generated_value = random.choice(last_names)
            elif data_type == "uuid":
                generated_value = str(uuid_lib.uuid4())
            elif data_type == "phone":
                generated_value = f"+1{random.randint(200, 999)}{random.randint(1000000, 9999999)}"
            elif data_type == "date":
                # ISO format date within last year
                from datetime import datetime, timedelta
                days_ago = random.randint(0, 365)
                date = datetime.now() - timedelta(days=days_ago)
                generated_value = date.strftime("%Y-%m-%d")
            elif data_type == "datetime":
                from datetime import datetime, timedelta
                days_ago = random.randint(0, 365)
                date = datetime.now() - timedelta(days=days_ago)
                generated_value = date.isoformat()
            elif data_type == "password":
                # Generate a random password with mixed characters
                chars = string.ascii_letters + string.digits + "!@#$%"
                generated_value = ''.join(random.choices(chars, k=max(length, 12)))
            elif data_type == "sentence":
                words = ["the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog", "test", "automation"]
                generated_value = ' '.join(random.choices(words, k=length)) + "."
            elif data_type == "paragraph":
                words = ["the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog", "test", "automation", "web", "browser"]
                sentences = []
                for _ in range(3):
                    sentence = ' '.join(random.choices(words, k=random.randint(5, 10))) + "."
                    sentences.append(sentence.capitalize())
                generated_value = ' '.join(sentences)
            elif data_type == "url":
                rand_str = ''.join(random.choices(string.ascii_lowercase, k=8))
                generated_value = f"https://example.com/{rand_str}"
            elif data_type == "address":
                streets = ["Main St", "Oak Ave", "Elm Blvd", "Park Rd", "Lake Dr"]
                cities = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"]
                generated_value = f"{random.randint(100, 9999)} {random.choice(streets)}, {random.choice(cities)}"
            elif data_type == "company":
                prefixes = ["Tech", "Global", "Smart", "Innovative", "Future"]
                suffixes = ["Solutions", "Systems", "Corp", "Inc", "Labs"]
                generated_value = f"{random.choice(prefixes)} {random.choice(suffixes)}"
            
            # Apply prefix/suffix
            generated_value = f"{prefix}{generated_value}{suffix}"
            
            if variable_name:
                self.variables[variable_name] = generated_value

        # --- Alert/Dialog Handling ---
        elif action_type == "accept_dialog":
            # This requires setting up dialog handler before triggering the dialog
            self.page.on("dialog", lambda dialog: asyncio.create_task(dialog.accept()))

        elif action_type == "dismiss_dialog":
            self.page.on("dialog", lambda dialog: asyncio.create_task(dialog.dismiss()))

        elif action_type == "fill_dialog":
            prompt_text = self.substitute_variables(action_data.get("text", ""))
            self.page.on("dialog", lambda dialog: asyncio.create_task(dialog.accept(prompt_text)))

        # --- Frame Handling ---
        elif action_type == "switch_to_frame":
            frame_selector = action_data.get("selector", "")
            if frame_selector:
                frame = self.page.frame_locator(frame_selector)
                # Store reference for subsequent operations
                self.current_frame = frame

        elif action_type == "switch_to_main":
            self.current_frame = None  # Reset to main page

        # --- Tab/Window Handling ---
        elif action_type == "new_tab":
            new_page = await self.context.new_page()
            url = action_data.get("url")
            if url:
                await new_page.goto(self.substitute_variables(url))
            # Store reference
            self.pages = getattr(self, 'pages', [self.page])
            self.pages.append(new_page)

        elif action_type == "switch_tab":
            tab_index = action_data.get("index", 0)
            pages = getattr(self, 'pages', [self.page])
            if 0 <= tab_index < len(pages):
                self.page = pages[tab_index]

        elif action_type == "close_tab":
            tab_index = action_data.get("index")
            pages = getattr(self, 'pages', [self.page])
            if tab_index is not None and 0 <= tab_index < len(pages):
                await pages[tab_index].close()
                pages.pop(tab_index)
            else:
                await self.page.close()

        # --- Download Handling ---
        elif action_type == "wait_for_download":
            download_path = action_data.get("download_path", "./downloads")
            variable_name = action_data.get("variable_name")
            timeout = action_data.get("timeout", 30000)
            
            # Wait for download to start
            async with self.page.expect_download(timeout=timeout) as download_info:
                # The download is triggered by a previous action, we just wait
                pass
            download = await download_info.value
            
            # Save the downloaded file
            save_path = f"{download_path}/{download.suggested_filename}"
            await download.save_as(save_path)
            
            if variable_name:
                self.variables[variable_name] = save_path
                self.variables[f"{variable_name}_filename"] = download.suggested_filename

        elif action_type == "verify_download":
            import os
            file_path = self.substitute_variables(action_data.get("file_path", ""))
            min_size = action_data.get("min_size", 0)  # Minimum file size in bytes
            
            if not os.path.exists(file_path):
                raise Exception(f"Downloaded file not found: {file_path}")
            
            file_size = os.path.getsize(file_path)
            if file_size < min_size:
                raise Exception(f"File size {file_size} is less than expected {min_size}")
            
            # Store file info in variables
            self.variables["downloaded_file_size"] = str(file_size)

        # --- Viewport/Device ---
        elif action_type == "set_viewport":
            width = action_data.get("width", 1920)
            height = action_data.get("height", 1080)
            device_scale_factor = action_data.get("device_scale_factor", 1)
            is_mobile = action_data.get("is_mobile", False)
            has_touch = action_data.get("has_touch", False)
            
            await self.page.set_viewport_size({"width": width, "height": height})
            
        elif action_type == "set_device":
            device_name = action_data.get("device", "iPhone 13")
            # Playwright has predefined device descriptors
            from playwright.sync_api import sync_playwright
            devices = {
                "iPhone 13": {"viewport": {"width": 390, "height": 844}, "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)", "is_mobile": True, "has_touch": True},
                "iPhone 13 Pro Max": {"viewport": {"width": 428, "height": 926}, "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)", "is_mobile": True, "has_touch": True},
                "Pixel 5": {"viewport": {"width": 393, "height": 851}, "user_agent": "Mozilla/5.0 (Linux; Android 11; Pixel 5)", "is_mobile": True, "has_touch": True},
                "iPad": {"viewport": {"width": 768, "height": 1024}, "user_agent": "Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X)", "is_mobile": True, "has_touch": True},
                "Desktop Chrome": {"viewport": {"width": 1920, "height": 1080}, "is_mobile": False, "has_touch": False},
                "Desktop Firefox": {"viewport": {"width": 1920, "height": 1080}, "is_mobile": False, "has_touch": False},
            }
            device = devices.get(device_name, devices["Desktop Chrome"])
            await self.page.set_viewport_size(device["viewport"])

        # --- Network/API ---
        elif action_type == "wait_for_response":
            url_pattern = self.substitute_variables(action_data.get("url", ""))
            variable_name = action_data.get("variable_name")
            timeout = action_data.get("timeout", 30000)
            
            response = await self.page.wait_for_response(url_pattern, timeout=timeout)
            
            if variable_name:
                self.variables[variable_name] = str(response.status)
                try:
                    body = await response.json()
                    self.variables[f"{variable_name}_body"] = str(body)
                except:
                    self.variables[f"{variable_name}_body"] = await response.text()

        elif action_type == "wait_for_request":
            url_pattern = self.substitute_variables(action_data.get("url", ""))
            timeout = action_data.get("timeout", 30000)
            
            await self.page.wait_for_request(url_pattern, timeout=timeout)

        elif action_type == "make_api_call":
            import aiohttp
            import base64
            from urllib.parse import urlencode
            
            url = self.substitute_variables(action_data.get("url", ""))
            method = action_data.get("method", "GET").upper()
            variable_name = action_data.get("variable_name")
            timeout_ms = action_data.get("timeout", 30000)
            timeout = aiohttp.ClientTimeout(total=timeout_ms / 1000)
            
            # Build headers from array or dict
            request_headers = {}
            headers_data = action_data.get("headers", {})
            if isinstance(headers_data, list):
                for h in headers_data:
                    if h.get("enabled", True) and h.get("key"):
                        request_headers[h["key"]] = self.substitute_variables(h.get("value", ""))
            elif isinstance(headers_data, dict):
                request_headers = {k: self.substitute_variables(v) for k, v in headers_data.items()}
            elif isinstance(headers_data, str):
                import json as json_module
                try:
                    parsed = json_module.loads(headers_data)
                    request_headers = {k: self.substitute_variables(v) for k, v in parsed.items()}
                except:
                    pass
            
            # Handle query parameters
            query_params = action_data.get("query_params", [])
            if query_params:
                params = {}
                for p in query_params:
                    if p.get("enabled", True) and p.get("key"):
                        params[p["key"]] = self.substitute_variables(p.get("value", ""))
                if params:
                    separator = "&" if "?" in url else "?"
                    url = url + separator + urlencode(params)
            
            # Handle authentication
            auth_type = action_data.get("auth_type", "none")
            if auth_type == "basic":
                username = self.substitute_variables(action_data.get("auth_basic_username", ""))
                password = self.substitute_variables(action_data.get("auth_basic_password", ""))
                credentials = base64.b64encode(f"{username}:{password}".encode()).decode()
                request_headers["Authorization"] = f"Basic {credentials}"
            elif auth_type == "bearer":
                token = self.substitute_variables(action_data.get("auth_bearer_token", ""))
                request_headers["Authorization"] = f"Bearer {token}"
            elif auth_type == "api-key":
                key_name = self.substitute_variables(action_data.get("auth_api_key_key", ""))
                key_value = self.substitute_variables(action_data.get("auth_api_key_value", ""))
                add_to = action_data.get("auth_api_key_add_to", "header")
                if add_to == "header":
                    request_headers[key_name] = key_value
                else:
                    separator = "&" if "?" in url else "?"
                    url = url + separator + urlencode({key_name: key_value})
            
            # Handle body based on body_type
            body_type = action_data.get("body_type", "none")
            request_body = None
            data = None
            json_body = None
            
            if body_type == "raw":
                raw_type = action_data.get("body_raw_type", "json")
                raw_body = self.substitute_variables(action_data.get("body", ""))
                if raw_type == "json":
                    request_headers.setdefault("Content-Type", "application/json")
                    import json as json_module
                    try:
                        json_body = json_module.loads(raw_body)
                    except:
                        request_body = raw_body
                elif raw_type == "xml":
                    request_headers.setdefault("Content-Type", "application/xml")
                    request_body = raw_body
                elif raw_type == "html":
                    request_headers.setdefault("Content-Type", "text/html")
                    request_body = raw_body
                else:
                    request_headers.setdefault("Content-Type", "text/plain")
                    request_body = raw_body
            elif body_type == "form-data":
                form_data = aiohttp.FormData()
                for item in action_data.get("body_form_data", []):
                    if item.get("enabled", True) and item.get("key"):
                        key = item["key"]
                        value = self.substitute_variables(item.get("value", ""))
                        item_type = item.get("type", "text")
                        if item_type == "file":
                            # value is file path
                            import os
                            if os.path.exists(value):
                                form_data.add_field(key, open(value, 'rb'), filename=os.path.basename(value))
                        else:
                            form_data.add_field(key, value)
                data = form_data
            elif body_type == "x-www-form-urlencoded":
                request_headers.setdefault("Content-Type", "application/x-www-form-urlencoded")
                form_params = {}
                for item in action_data.get("body_urlencoded", []):
                    if item.get("enabled", True) and item.get("key"):
                        form_params[item["key"]] = self.substitute_variables(item.get("value", ""))
                request_body = urlencode(form_params)
            elif body_type == "binary":
                binary_path = self.substitute_variables(action_data.get("body_binary_path", ""))
                import os
                if os.path.exists(binary_path):
                    with open(binary_path, 'rb') as f:
                        request_body = f.read()
                    request_headers.setdefault("Content-Type", "application/octet-stream")
            elif body_type == "graphql":
                request_headers.setdefault("Content-Type", "application/json")
                query = self.substitute_variables(action_data.get("body_graphql_query", ""))
                variables_str = self.substitute_variables(action_data.get("body_graphql_variables", "{}"))
                import json as json_module
                try:
                    variables = json_module.loads(variables_str) if variables_str else {}
                except:
                    variables = {}
                json_body = {"query": query, "variables": variables}
            
            # Make the request
            async with aiohttp.ClientSession(timeout=timeout) as session:
                kwargs = {"headers": request_headers}
                if json_body is not None:
                    kwargs["json"] = json_body
                elif data is not None:
                    kwargs["data"] = data
                elif request_body is not None:
                    kwargs["data"] = request_body
                
                if method == "GET":
                    async with session.get(url, **kwargs) as resp:
                        response_text = await resp.text()
                        status = resp.status
                        response_headers = dict(resp.headers)
                elif method == "POST":
                    async with session.post(url, **kwargs) as resp:
                        response_text = await resp.text()
                        status = resp.status
                        response_headers = dict(resp.headers)
                elif method == "PUT":
                    async with session.put(url, **kwargs) as resp:
                        response_text = await resp.text()
                        status = resp.status
                        response_headers = dict(resp.headers)
                elif method == "PATCH":
                    async with session.patch(url, **kwargs) as resp:
                        response_text = await resp.text()
                        status = resp.status
                        response_headers = dict(resp.headers)
                elif method == "DELETE":
                    async with session.delete(url, **kwargs) as resp:
                        response_text = await resp.text()
                        status = resp.status
                        response_headers = dict(resp.headers)
                else:
                    raise Exception(f"Unsupported HTTP method: {method}")
            
            # Store response in variables
            if variable_name:
                # Try to parse as JSON for easier access
                import json as json_module
                try:
                    parsed_body = json_module.loads(response_text)
                except:
                    parsed_body = response_text
                
                # Store as a structured object for easy access
                self.variables[variable_name] = {
                    "body": parsed_body,
                    "status": status,
                    "headers": response_headers
                }
                # Also store individual parts for backward compatibility
                self.variables[f"{variable_name}.body"] = response_text
                self.variables[f"{variable_name}.status"] = str(status)
                self.variables[f"{variable_name}.headers"] = str(response_headers)

        # --- Logging/Debugging ---
        elif action_type == "log":
            raw_message = action_data.get("message", "")
            message = self.substitute_variables(raw_message)
            level = action_data.get("level", "info")  # info, warn, error, debug
            
            # Emit log message via live update
            log_data = {"level": level, "message": message}
            await self.emit_live_update("log", log_data)
            
            # Also store in test execution logs
            if not hasattr(self, 'logs'):
                self.logs = []
            self.logs.append({"level": level, "message": message})

        elif action_type == "comment":
            # Just a no-op for documentation purposes
            pass

        elif action_type == "highlight_element":
            selector_data = action_data.get("selector", {})
            duration = action_data.get("duration", 2000)
            color = action_data.get("color", "red")
            
            locator, healing_info = await self.get_locator_with_healing(
                selector_data, action_type, test_flow, step_id=step_id, step_result_id=step_result_id
            )
            
            # Add highlight style
            await locator.evaluate(f"""
                element => {{
                    const originalStyle = element.style.cssText;
                    element.style.cssText = 'border: 3px solid {color} !important; background: rgba(255,0,0,0.1) !important;';
                    setTimeout(() => {{ element.style.cssText = originalStyle; }}, {duration});
                }}
            """)
            await asyncio.sleep(duration / 1000)

        # --- Advanced Assertions ---
        elif action_type == "assert_element_count":
            selector_data = action_data.get("selector", {})
            expected_count = action_data.get("expected_count", 0)
            comparison = action_data.get("comparison", "equals")  # equals, greater, less, at_least, at_most
            
            selector = selector_data.get("primary") or selector_data.get("css") or selector_data
            if isinstance(selector, str):
                count = await self.page.locator(selector).count()
            else:
                count = await self.page.locator(selector.get("css", selector.get("primary", ""))).count()
            
            self.variables["element_count"] = str(count)
            
            passed = False
            if comparison == "equals":
                passed = count == expected_count
            elif comparison == "greater":
                passed = count > expected_count
            elif comparison == "less":
                passed = count < expected_count
            elif comparison == "at_least":
                passed = count >= expected_count
            elif comparison == "at_most":
                passed = count <= expected_count
            
            if not passed:
                raise Exception(f"Element count assertion failed: found {count}, expected {comparison} {expected_count}")

        elif action_type == "assert_not_visible":
            selector_data = action_data.get("selector", {})
            selector = selector_data.get("primary") or selector_data.get("css") or selector_data
            if isinstance(selector, str):
                is_visible = await self.page.locator(selector).is_visible()
            else:
                is_visible = await self.page.locator(selector.get("css", "")).is_visible()
            
            if is_visible:
                raise Exception(f"Element is visible but expected to be hidden: {selector}")

        elif action_type == "soft_assert":
            # Like assert but doesn't stop execution
            try:
                assertion = action_data.get("assertion", {})
                assertor = SelfHealingAssertion(self.ai_service)
                success, _ = await assertor.assert_with_healing(self.page, assertion)
                
                if not hasattr(self, 'soft_assert_failures'):
                    self.soft_assert_failures = []
                
                if not success:
                    self.soft_assert_failures.append(assertion)
                    self.variables["soft_assert_failed"] = "true"
            except Exception as e:
                if not hasattr(self, 'soft_assert_failures'):
                    self.soft_assert_failures = []
                self.soft_assert_failures.append(str(e))

        # --- Element Count/Info ---
        elif action_type == "get_element_count":
            selector_data = action_data.get("selector", {})
            variable_name = action_data.get("variable_name")
            
            selector = selector_data.get("primary") or selector_data.get("css") or selector_data
            if isinstance(selector, str):
                count = await self.page.locator(selector).count()
            else:
                count = await self.page.locator(selector.get("css", "")).count()
            
            if variable_name:
                self.variables[variable_name] = str(count)

        # --- Performance ---
        elif action_type == "measure_load_time":
            variable_name = action_data.get("variable_name", "load_time")
            
            # Get performance timing
            timing = await self.page.evaluate("""
                () => {
                    const perf = window.performance.timing;
                    return {
                        dns: perf.domainLookupEnd - perf.domainLookupStart,
                        connection: perf.connectEnd - perf.connectStart,
                        ttfb: perf.responseStart - perf.requestStart,
                        download: perf.responseEnd - perf.responseStart,
                        domParsing: perf.domInteractive - perf.responseEnd,
                        domComplete: perf.domComplete - perf.domInteractive,
                        total: perf.loadEventEnd - perf.navigationStart
                    }
                }
            """)
            
            self.variables[variable_name] = str(timing.get("total", 0))
            self.variables[f"{variable_name}_ttfb"] = str(timing.get("ttfb", 0))
            self.variables[f"{variable_name}_details"] = str(timing)

        elif action_type == "get_performance_metrics":
            variable_name = action_data.get("variable_name", "perf")
            
            # Get Core Web Vitals and other metrics
            metrics = await self.page.evaluate("""
                () => {
                    return new Promise((resolve) => {
                        const metrics = {};
                        
                        // Get paint timing
                        const paintEntries = performance.getEntriesByType('paint');
                        paintEntries.forEach(entry => {
                            metrics[entry.name] = entry.startTime;
                        });
                        
                        // Get navigation timing
                        const navEntries = performance.getEntriesByType('navigation');
                        if (navEntries.length > 0) {
                            metrics.domContentLoaded = navEntries[0].domContentLoadedEventEnd;
                            metrics.loadComplete = navEntries[0].loadEventEnd;
                        }
                        
                        resolve(metrics);
                    });
                }
            """)
            
            self.variables[variable_name] = str(metrics)

        # --- Clipboard ---
        elif action_type == "copy_to_clipboard":
            text = self.substitute_variables(action_data.get("text", ""))
            await self.page.evaluate(f"navigator.clipboard.writeText('{text}')")

        elif action_type == "paste_from_clipboard":
            selector_data = action_data.get("selector", {})
            locator, healing_info = await self.get_locator_with_healing(
                selector_data, action_type, test_flow, step_id=step_id, step_result_id=step_result_id
            )
            await locator.press("Control+v")

        # --- Data Files ---
        elif action_type == "read_csv":
            import csv
            file_path = self.substitute_variables(action_data.get("file_path", ""))
            variable_name = action_data.get("variable_name", "csv_data")
            
            with open(file_path, 'r') as f:
                reader = csv.DictReader(f)
                data = list(reader)
            
            self.variables[variable_name] = str(data)
            self.variables[f"{variable_name}_count"] = str(len(data))
            # Store as iterable for loops
            if not hasattr(self, 'datasets'):
                self.datasets = {}
            self.datasets[variable_name] = data

        elif action_type == "read_json":
            import json
            file_path = self.substitute_variables(action_data.get("file_path", ""))
            variable_name = action_data.get("variable_name", "json_data")
            
            with open(file_path, 'r') as f:
                data = json.load(f)
            
            self.variables[variable_name] = str(data)
            if isinstance(data, list):
                self.variables[f"{variable_name}_count"] = str(len(data))
                if not hasattr(self, 'datasets'):
                    self.datasets = {}
                self.datasets[variable_name] = data

        elif action_type == "iterate_dataset":
            dataset_name = action_data.get("dataset_name", "")
            loop_variable = action_data.get("loop_variable", "row")
            nested_steps = action_data.get("nested_steps", [])
            
            if hasattr(self, 'datasets') and dataset_name in self.datasets:
                for i, row in enumerate(self.datasets[dataset_name]):
                    self.variables[loop_variable] = str(row)
                    self.variables[f"{loop_variable}_index"] = str(i)
                    
                    # Make row fields accessible
                    if isinstance(row, dict):
                        for key, value in row.items():
                            self.variables[f"{loop_variable}_{key}"] = str(value)
                    
                    # Execute nested steps
                    for step in nested_steps:
                        step_type = step.get("action") or step.get("actionType")
                        step_data = step.get("data", step)
                        await self.execute_action(step_type, step_data, test_flow)

        # --- Geolocation ---
        elif action_type == "set_geolocation":
            latitude = action_data.get("latitude", 0)
            longitude = action_data.get("longitude", 0)
            accuracy = action_data.get("accuracy", 100)
            
            await self.context.set_geolocation({
                "latitude": latitude,
                "longitude": longitude,
                "accuracy": accuracy
            })
            await self.context.grant_permissions(["geolocation"])

        # --- Timezone ---
        elif action_type == "set_timezone":
            timezone = action_data.get("timezone", "America/New_York")
            # Note: This needs to be set at context creation, so we store for next context
            self.variables["_timezone"] = timezone

        
        # Add more action types as needed
        
        return healing_info

    async def record_healing_event(
        self,
        healing_info: Dict[str, Any],
        step_id: Optional[str],
        step_type: str,
        step_result_id: Optional[UUID]
    ) -> None:
        if not healing_info:
            return

        healing_type_value = healing_info.get("type", HealingType.LOCATOR.value)
        try:
            healing_type_enum = HealingType(healing_type_value)
        except Exception:
            healing_type_enum = HealingType.LOCATOR

        strategy_value = healing_info.get("strategy", HealingStrategy.AI.value)
        try:
            strategy_enum = HealingStrategy[strategy_value.upper()]
        except KeyError:
            strategy_enum = HealingStrategy.AI

        page_title = None
        try:
            page_title = await self.page.title()
        except Exception:
            page_title = None

        healing_event = HealingEvent(
            execution_run_id=self.execution_run.id,
            step_result_id=step_result_id,
            healing_type=healing_type_enum,
            strategy=strategy_enum,
            original_value=healing_info.get("original", "") or "",
            healed_value=healing_info.get("healed", "") or "",
            step_id=step_id or "",
            step_type=step_type,
            success=bool(healing_info.get("success", True)),
            confidence_score=healing_info.get("confidence_score", healing_info.get("confidence", 0.8)),
            ai_prompt=healing_info.get("ai_prompt"),
            ai_response=healing_info.get("ai_response"),
            ai_reasoning=healing_info.get("ai_reasoning", ""),
            alternatives_tried=healing_info.get("alternatives_tried", []),
            dom_snapshot=healing_info.get("dom_snapshot"),
            page_url=self.page.url if self.page else None,
            page_title=healing_info.get("page_title") or page_title,
            healing_duration_ms=healing_info.get("healing_duration_ms")
        )
        self.db.add(healing_event)
        self.db.commit()
        self.db.refresh(healing_event)
        healing_info["event_recorded"] = True
        healing_info["healing_event_id"] = str(healing_event.id)
    
    async def get_locator_with_healing(
        self,
        selector_data: Dict[str, Any],
        step_type: str,
        test_flow: TestFlow,
        step_id: Optional[str] = None,
        step_result_id: Optional[UUID] = None
    ) -> tuple[Any, Optional[Dict[str, Any]]]:
        """
        Get locator with self-healing enabled
        """
        primary = ""
        alternatives = []
        if isinstance(selector_data, str):
            primary = selector_data
        elif isinstance(selector_data, dict):
            primary = selector_data.get("primary") or selector_data.get("css") or selector_data.get("selector") or ""
            alternatives = selector_data.get("alternatives", []) or []

        # Merge stored alternatives from previous healings
        stored_alternatives = []
        if step_id:
            alt_record = (
                self.db.query(LocatorAlternative)
                .filter(
                    LocatorAlternative.test_flow_id == test_flow.id,
                    LocatorAlternative.step_id == step_id
                )
                .first()
            )
            if alt_record and alt_record.alternatives:
                stored_alternatives = sorted(
                    alt_record.alternatives,
                    key=lambda a: a.get("success_rate", 0.0),
                    reverse=True
                )

        merged_alternatives = []
        seen = set()
        for alt in (alternatives + stored_alternatives):
            if isinstance(alt, dict):
                value = alt.get("value")
                if not value or value in seen:
                    continue
                merged_alternatives.append(alt)
                seen.add(value)
            elif isinstance(alt, str):
                if alt in seen:
                    continue
                merged_alternatives.append({"value": alt, "strategy": HealingStrategy.ALTERNATIVE.value})
                seen.add(alt)

        alternatives = merged_alternatives
        
        if test_flow.healing_enabled:
            healer = SelfHealingLocator(primary, alternatives, self.ai_service)
            locator, healing_info = await healer.find_element(self.page, step_id or "", step_type)
            
            # Record healing event if healing occurred
            if healing_info:
                page_title = None
                try:
                    page_title = await self.page.title()
                except Exception:
                    page_title = None

                strategy_value = healing_info.get("strategy", HealingStrategy.AI.value)
                try:
                    strategy_enum = HealingStrategy[strategy_value.upper()]
                except KeyError:
                    strategy_enum = HealingStrategy.AI

                healing_event = HealingEvent(
                    execution_run_id=self.execution_run.id,
                    step_result_id=step_result_id,
                    healing_type=HealingType.LOCATOR,
                    strategy=strategy_enum,
                    original_value=healing_info.get("original", primary) or "",
                    healed_value=healing_info.get("healed", "") or "",
                    step_id=step_id or "",
                    step_type=step_type,
                    success=True,
                    confidence_score=healing_info.get("confidence_score", 0.8),
                    ai_prompt=healing_info.get("ai_prompt"),
                    ai_response=healing_info.get("ai_response"),
                    ai_reasoning=healing_info.get("ai_reasoning", ""),
                    alternatives_tried=healing_info.get("alternatives_tried", []),
                    dom_snapshot=healing_info.get("dom_snapshot"),
                    page_url=self.page.url
                )
                healing_event.page_title = healing_info.get("page_title") or page_title
                healing_event.healing_duration_ms = healing_info.get("healing_duration_ms")
                self.db.add(healing_event)
                self.db.commit()
                self.db.refresh(healing_event)
                healing_info["event_recorded"] = True
                healing_info["healing_event_id"] = str(healing_event.id)
                
                # Emit live update for healing
                await self.emit_live_update("healingApplied", {
                    "step_id": step_id or "",
                    "type": healing_info["type"],
                    "strategy": healing_info["strategy"],
                    "original": healing_info["original"],
                    "healed": healing_info["healed"],
                    "confidence": healing_info.get("confidence_score", 0.8)
                })

                # Auto-update locator patterns if enabled
                if test_flow.auto_update_selectors:
                    await self.self_heal_service.auto_update_locator(
                        healing_event.id, 
                        confidence_threshold=test_flow.healing_confidence_threshold
                    )
            
            return locator, healing_info
        else:
            # No healing, use primary selector only
            locator = self.page.locator(primary)
            return locator, None
