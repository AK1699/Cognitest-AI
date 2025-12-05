"""
Web Automation Service
Core execution engine for no-code test automation with self-healing
"""
import asyncio
import json
import time
from typing import Dict, Any, List, Optional
from datetime import datetime
from uuid import UUID
from playwright.async_api import async_playwright, Page, Browser, BrowserContext, Error as PlaywrightError
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.web_automation import (
    TestFlow, ExecutionRun, StepResult, HealingEvent, LocatorAlternative,
    BrowserType, ExecutionMode, ExecutionRunStatus, StepStatus,
    HealingType, HealingStrategy
)
from app.services.gemini_service import GeminiService


class SelfHealingLocator:
    """
    Self-healing locator with AI-powered fallback strategies
    """
    
    def __init__(self, primary_selector: str, alternatives: List[Dict[str, Any]], ai_service: GeminiService):
        self.primary_selector = primary_selector
        self.alternatives = alternatives or []
        self.ai_service = ai_service
        self.healing_history = []
    
    async def find_element(self, page: Page, step_id: str, step_type: str) -> tuple[Any, Optional[Dict[str, Any]]]:
        """
        Find element with progressive fallback strategies
        Returns: (element, healing_info)
        """
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
                    "success": True
                }
                return locator, healing_info
            except PlaywrightError:
                continue
        
        # Strategy 3: AI-powered healing
        try:
            healed_locator, healing_info = await self.ai_heal(page, step_id, step_type)
            if healed_locator:
                return healed_locator, healing_info
        except Exception as e:
            print(f"AI healing failed: {str(e)}")
        
        # Strategy 4: Similarity-based matching
        try:
            healed_locator, healing_info = await self.similarity_heal(page)
            if healed_locator:
                return healed_locator, healing_info
        except Exception as e:
            print(f"Similarity healing failed: {str(e)}")
        
        raise Exception(f"Unable to locate element with any strategy: {self.primary_selector}")
    
    async def ai_heal(self, page: Page, step_id: str, step_type: str) -> tuple[Any, Dict[str, Any]]:
        """
        Use AI to suggest alternative selectors
        """
        # Get DOM snapshot
        dom_html = await page.content()
        page_url = page.url
        
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
        ai_response = await self.ai_service.generate_content(prompt)
        
        try:
            # Parse AI response
            suggestions = json.loads(ai_response)
            
            # Try each suggested selector
            for suggestion in suggestions.get("selectors", []):
                try:
                    selector = suggestion["selector"]
                    locator = page.locator(selector)
                    await locator.wait_for(timeout=3000, state="visible")
                    
                    healing_info = {
                        "type": HealingType.LOCATOR.value,
                        "strategy": HealingStrategy.AI.value,
                        "original": self.primary_selector,
                        "healed": selector,
                        "ai_reasoning": suggestion.get("reasoning", ""),
                        "confidence_score": suggestion.get("confidence", 0.5),
                        "success": True
                    }
                    return locator, healing_info
                except PlaywrightError:
                    continue
        except json.JSONDecodeError:
            pass
        
        return None, None
    
    async def similarity_heal(self, page: Page) -> tuple[Any, Dict[str, Any]]:
        """
        Find similar elements based on text content, position, or attributes
        """
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
        
        elif assertion_type == "visible":
            locator = page.locator(selector)
            return await locator.is_visible()
        
        elif assertion_type == "url":
            return page.url == expected_value
        
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
            ai_response = await self.ai_service.generate_content(prompt)
            suggestion = json.loads(ai_response)
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

    def substitute_variables(self, text: str) -> str:
        """
        Substitute environment variables in text using ${VAR_NAME} format
        """
        if not text or not isinstance(text, str):
            return text
            
        if not self.variables:
            return text
            
        import re
        
        def replace(match):
            var_name = match.group(1)
            return self.variables.get(var_name, match.group(0))
            
        return re.sub(r'\$\{([a-zA-Z_][a-zA-Z0-9_]*)\}', replace, text)

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
        variables: Optional[Dict[str, str]] = None
    ) -> ExecutionRun:
        """
        Execute a complete test flow
        """
        # Load test flow
        test_flow = self.db.query(TestFlow).filter(TestFlow.id == test_flow_id).first()
        if not test_flow:
            raise ValueError(f"Test flow not found: {test_flow_id}")
            
        # Set variables
        self.variables = variables or {}
        
        # Create execution run record
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
        self.db.commit()
        self.db.refresh(self.execution_run)
        
        try:
            # Setup browser
            await self.setup_browser(browser_type, execution_mode, test_flow.browser_options)
            
            # Update status to running
            self.execution_run.status = ExecutionRunStatus.RUNNING
            self.execution_run.started_at = datetime.utcnow()
            self.db.commit()
            
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
            
            self.db.commit()
            
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
            self.db.commit()
            
            await self.emit_live_update("executionFailed", {
                "error": str(e)
            })
            
            raise
        
        finally:
            await self.teardown_browser()
        
        return self.execution_run
    
    async def setup_browser(
        self,
        browser_type: BrowserType,
        mode: ExecutionMode,
        options: Dict[str, Any]
    ):
        """
        Initialize browser instance
        """
        playwright = await async_playwright().start()
        
        launch_options = {
            "headless": mode == ExecutionMode.HEADLESS,
            **options.get("launch_options", {})
        }
        
        # Select browser
        if browser_type == BrowserType.CHROME:
            self.browser = await playwright.chromium.launch(channel="chrome", **launch_options)
        elif browser_type == BrowserType.FIREFOX:
            self.browser = await playwright.firefox.launch(**launch_options)
        elif browser_type == BrowserType.SAFARI:
            self.browser = await playwright.webkit.launch(**launch_options)
        elif browser_type == BrowserType.EDGE:
            self.browser = await playwright.chromium.launch(channel="msedge", **launch_options)
        else:
            self.browser = await playwright.chromium.launch(**launch_options)
        
        # Create context
        context_options = {
            "viewport": options.get("viewport", {"width": 1280, "height": 720}),
            "ignore_https_errors": True,
            "accept_downloads": True,
            **options.get("context_options", {})
        }
        
        if mode == ExecutionMode.HEADED:
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
        
        # Create step result record
        step_result = StepResult(
            execution_run_id=self.execution_run.id,
            step_id=step_id,
            step_name=step_data.get("label", step_type),
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
            healing_info = await self.execute_action(step_type, step_data, test_flow)
            
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
            
            self.execution_run.passed_steps += 1
            
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
        test_flow: TestFlow
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
                selector_data, action_type, test_flow
            )
            await locator.click()
        
        elif action_type == "type":
            selector_data = action_data.get("selector", {})
            value = self.substitute_variables(action_data.get("value", ""))
            locator, healing_info = await self.get_locator_with_healing(
                selector_data, action_type, test_flow
            )
            await locator.fill(value)
        
        elif action_type == "assert":
            assertion = action_data.get("assertion", {})
            assertor = SelfHealingAssertion(self.ai_service)
            success, healing_info = await assertor.assert_with_healing(self.page, assertion)
            if not success:
                raise Exception(f"Assertion failed: {assertion}")
        
        elif action_type == "wait":
            wait_type = action_data.get("waitType", "time")
            if wait_type == "time":
                duration = action_data.get("duration", 1000)
                await asyncio.sleep(duration / 1000)
            elif wait_type == "element":
                selector_data = action_data.get("selector", {})
                locator, healing_info = await self.get_locator_with_healing(
                    selector_data, action_type, test_flow
                )
                await locator.wait_for(state="visible")
        
        elif action_type == "screenshot":
            path = action_data.get("path", "screenshot.png")
            await self.page.screenshot(path=path)
        
        # Add more action types as needed
        
        return healing_info
    
    async def get_locator_with_healing(
        self,
        selector_data: Dict[str, Any],
        step_type: str,
        test_flow: TestFlow
    ) -> tuple[Any, Optional[Dict[str, Any]]]:
        """
        Get locator with self-healing enabled
        """
        primary = selector_data.get("primary", "")
        alternatives = selector_data.get("alternatives", [])
        
        if test_flow.healing_enabled:
            healer = SelfHealingLocator(primary, alternatives, self.ai_service)
            locator, healing_info = await healer.find_element(self.page, "", step_type)
            
            # Record healing event if healing occurred
            if healing_info:
                healing_event = HealingEvent(
                    execution_run_id=self.execution_run.id,
                    healing_type=HealingType.LOCATOR,
                    strategy=HealingStrategy[healing_info["strategy"].upper()],
                    original_value=healing_info["original"],
                    healed_value=healing_info["healed"],
                    step_id="",
                    step_type=step_type,
                    success=True,
                    confidence_score=healing_info.get("confidence_score", 0.8),
                    page_url=self.page.url
                )
                self.db.add(healing_event)
                self.db.commit()
            
            return locator, healing_info
        else:
            # No healing, use primary selector only
            locator = self.page.locator(primary)
            return locator, None
