"""
Browser Session Manager for Live Browser Preview
Handles browser session lifecycle, screenshot streaming, and event capture
"""
import asyncio
import base64
from datetime import datetime
from typing import Dict, Optional, Any, Callable, List
from dataclasses import dataclass, field
from enum import Enum
import json

from playwright.async_api import async_playwright, Browser, BrowserContext, Page


class SessionStatus(str, Enum):
    LAUNCHING = "launching"
    RUNNING = "running"
    PAUSED = "paused"
    STOPPED = "stopped"
    ERROR = "error"


class DevicePreset:
    """Common device presets for mobile emulation"""
    DEVICES = {
        "desktop_chrome": {
            "viewport": {"width": 1920, "height": 1080},
            "user_agent": None,
            "is_mobile": False,
            "has_touch": False
        },
        "desktop_1280": {
            "viewport": {"width": 1280, "height": 720},
            "user_agent": None,
            "is_mobile": False,
            "has_touch": False
        },
        "iphone_14": {
            "viewport": {"width": 390, "height": 844},
            "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
            "is_mobile": True,
            "has_touch": True,
            "device_scale_factor": 3
        },
        "iphone_14_pro_max": {
            "viewport": {"width": 430, "height": 932},
            "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
            "is_mobile": True,
            "has_touch": True,
            "device_scale_factor": 3
        },
        "pixel_7": {
            "viewport": {"width": 412, "height": 915},
            "user_agent": "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36",
            "is_mobile": True,
            "has_touch": True,
            "device_scale_factor": 2.625
        },
        "ipad_pro": {
            "viewport": {"width": 1024, "height": 1366},
            "user_agent": "Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
            "is_mobile": True,
            "has_touch": True,
            "device_scale_factor": 2
        },
        "galaxy_s21": {
            "viewport": {"width": 360, "height": 800},
            "user_agent": "Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36",
            "is_mobile": True,
            "has_touch": True,
            "device_scale_factor": 3
        }
    }

    @classmethod
    def get(cls, name: str) -> dict:
        return cls.DEVICES.get(name, cls.DEVICES["desktop_chrome"])


@dataclass
class NetworkRequest:
    """Captured network request"""
    id: str
    url: str
    method: str
    resource_type: str
    status: Optional[int] = None
    response_time: Optional[float] = None
    size: Optional[int] = None
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class ConsoleMessage:
    """Captured console message"""
    level: str  # log, info, warn, error
    text: str
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())


class BrowserSession:
    """
    Manages a single browser session for live preview
    """
    
    def __init__(
        self,
        session_id: str,
        on_update: Callable[[dict], Any],
        browser_type: str = "chromium",
        device: str = "desktop_chrome",
        headless: bool = False,
        record_video: bool = False,
        video_dir: str = None,
        project_id: str = None
    ):
        self.session_id = session_id
        self.on_update = on_update
        self.browser_type = browser_type
        self.device = device
        self.headless = headless
        self.record_video = record_video
        self.video_dir = video_dir
        self.project_id = project_id
        
        self.playwright = None
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        
        self.status = SessionStatus.LAUNCHING
        self.current_url = ""
        self.is_streaming = False
        self._screenshot_task: Optional[asyncio.Task] = None
        self._pending_requests: Dict[str, NetworkRequest] = {}
        
        # Video recording
        self.video_path: Optional[str] = None
        
        # Captured data
        self.console_logs: List[ConsoleMessage] = []
        self.network_requests: List[NetworkRequest] = []
    
    async def launch(self, initial_url: str = "about:blank") -> bool:
        """Launch browser session"""
        try:
            self.playwright = await async_playwright().start()
            
            # Select browser
            if self.browser_type == "firefox":
                browser_engine = self.playwright.firefox
            elif self.browser_type == "webkit":
                browser_engine = self.playwright.webkit
            else:
                browser_engine = self.playwright.chromium
            
            # Launch browser
            self.browser = await browser_engine.launch(headless=self.headless)
            
            # Create context with device settings
            device_config = DevicePreset.get(self.device)
            context_options = {
                "viewport": device_config["viewport"],
                "is_mobile": device_config.get("is_mobile", False),
                "has_touch": device_config.get("has_touch", False),
            }
            
            if device_config.get("user_agent"):
                context_options["user_agent"] = device_config["user_agent"]
            if device_config.get("device_scale_factor"):
                context_options["device_scale_factor"] = device_config["device_scale_factor"]
            
            # Add video recording if enabled
            if self.record_video and self.video_dir:
                import os
                os.makedirs(self.video_dir, exist_ok=True)
                context_options["record_video_dir"] = self.video_dir
                context_options["record_video_size"] = {"width": 1280, "height": 720}
            
            self.context = await self.browser.new_context(**context_options)
            self.page = await self.context.new_page()
            
            # Set up event listeners
            self._setup_event_listeners()
            
            # Navigate to initial URL
            if initial_url and initial_url != "about:blank":
                await self.page.goto(initial_url, wait_until="domcontentloaded")
            
            self.current_url = self.page.url
            self.status = SessionStatus.RUNNING
            
            # Start screenshot streaming
            self.start_streaming()
            
            await self._emit_update({
                "type": "session_started",
                "session_id": self.session_id,
                "url": self.current_url,
                "device": self.device,
                "viewport": device_config["viewport"]
            })
            
            return True
            
        except Exception as e:
            self.status = SessionStatus.ERROR
            await self._emit_update({
                "type": "error",
                "error": str(e)
            })
            return False
    
    def _setup_event_listeners(self):
        """Setup Playwright event listeners for console and network"""
        if not self.context:
            return
            
        # Context-level listeners
        self.context.on("page", self._handle_new_page)
        
        # Attach to initial page
        if self.page:
            self._attach_page_listeners(self.page)
            
    def _attach_page_listeners(self, page: Page):
        """Attach all required listeners to a specific page"""
        try:
            page.on("console", self._handle_console)
            page.on("request", self._handle_request)
            page.on("response", self._handle_response)
            page.on("requestfailed", self._handle_request_failed)
            page.on("framenavigated", self._handle_navigation)
            page.on("close", lambda p: asyncio.create_task(self._handle_page_closed(p)))
        except Exception as e:
            print(f"Error attaching listeners to page: {e}")

    async def _handle_new_page(self, page: Page):
        """Handle new tab/popup creation"""
        self._attach_page_listeners(page)
        self.page = page  # Automatically switch to newest tab
        self.current_url = page.url
        await self._emit_update({
            "type": "tab_switched",
            "url": self.current_url,
            "page_count": len(self.context.pages) if self.context else 1
        })

    async def _handle_page_closed(self, page: Page):
        """Handle page closure by switching to another active page if available"""
        if self.page == page:
            if self.context and self.context.pages:
                # Find the last non-closed page
                active_pages = [p for p in self.context.pages if not p.is_closed()]
                if active_pages:
                    self.page = active_pages[-1]
                    self.current_url = self.page.url
                    await self._emit_update({
                        "type": "tab_switched",
                        "url": self.current_url,
                        "message": "Primary tab closed, switched to neighbor tab"
                    })
                else:
                    self.page = None
                    self.current_url = ""
    
    async def _handle_console(self, msg):
        """Handle console message"""
        console_msg = ConsoleMessage(
            level=msg.type,
            text=msg.text
        )
        self.console_logs.append(console_msg)
        
        # Keep only last 100 messages
        if len(self.console_logs) > 100:
            self.console_logs = self.console_logs[-100:]
        
        await self._emit_update({
            "type": "console",
            "level": console_msg.level,
            "text": console_msg.text,
            "timestamp": console_msg.timestamp
        })
    
    async def _handle_request(self, request):
        """Handle network request start"""
        req_id = str(id(request))
        network_req = NetworkRequest(
            id=req_id,
            url=request.url,
            method=request.method,
            resource_type=request.resource_type
        )
        self._pending_requests[req_id] = network_req
    
    async def _handle_response(self, response):
        """Handle network response"""
        req_id = str(id(response.request))
        
        if req_id in self._pending_requests:
            network_req = self._pending_requests.pop(req_id)
            network_req.status = response.status
            
            try:
                # Get response size from headers
                content_length = response.headers.get("content-length")
                if content_length:
                    network_req.size = int(content_length)
            except:
                pass
            
            self.network_requests.append(network_req)
            
            # Keep only last 50 requests
            if len(self.network_requests) > 50:
                self.network_requests = self.network_requests[-50:]
            
            await self._emit_update({
                "type": "network",
                "request": {
                    "id": network_req.id,
                    "url": network_req.url,
                    "method": network_req.method,
                    "resource_type": network_req.resource_type,
                    "status": network_req.status,
                    "size": network_req.size,
                    "timestamp": network_req.timestamp
                }
            })
    
    async def _handle_request_failed(self, request):
        """Handle failed request"""
        req_id = str(id(request))
        if req_id in self._pending_requests:
            network_req = self._pending_requests.pop(req_id)
            network_req.status = 0  # Failed
            
            await self._emit_update({
                "type": "network",
                "request": {
                    "id": network_req.id,
                    "url": network_req.url,
                    "method": network_req.method,
                    "resource_type": network_req.resource_type,
                    "status": 0,
                    "error": "Request failed",
                    "timestamp": network_req.timestamp
                }
            })
    
    async def _handle_navigation(self, frame):
        """Handle page navigation"""
        if frame == self.page.main_frame:
            self.current_url = self.page.url
            await self._emit_update({
                "type": "navigation",
                "url": self.current_url
            })
    
    def start_streaming(self):
        """Start screenshot streaming"""
        if not self.is_streaming:
            self.is_streaming = True
            self._screenshot_task = asyncio.create_task(self._screenshot_loop())
    
    def stop_streaming(self):
        """Stop screenshot streaming"""
        self.is_streaming = False
        if self._screenshot_task:
            self._screenshot_task.cancel()
    
    async def _screenshot_loop(self):
        """Continuously capture and stream screenshots"""
        while self.is_streaming:
            try:
                # Ensure we have a valid, open page
                if not self.page or self.page.is_closed():
                    # Try to recover from context pages if primary is lost
                    if self.context and self.context.pages:
                        active_pages = [p for p in self.context.pages if not p.is_closed()]
                        if active_pages:
                            self.page = active_pages[-1]
                        else:
                            await asyncio.sleep(1)
                            continue
                    else:
                        await asyncio.sleep(1)
                        continue

                # Capture screenshot as JPEG for smaller size
                screenshot = await self.page.screenshot(
                    type="jpeg",
                    quality=70,
                    full_page=False
                )
                
                # Encode to base64
                screenshot_b64 = base64.b64encode(screenshot).decode('utf-8')
                
                await self._emit_update({
                    "type": "screenshot",
                    "data": f"data:image/jpeg;base64,{screenshot_b64}",
                    "url": self.page.url,
                    "timestamp": datetime.now().isoformat()
                })
                
                # 3 FPS = ~333ms between frames
                await asyncio.sleep(0.333)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                # Don't spam errors, just skip this frame
                await asyncio.sleep(0.5)
    
    async def navigate(self, url: str) -> bool:
        """Navigate to URL"""
        try:
            # Ensure we have an active page before navigating
            page = await self.get_active_page()
            if not page:
                return False
                
            await page.goto(url, wait_until="domcontentloaded")
            self.current_url = page.url
            return True
        except Exception as e:
            await self._emit_update({
                "type": "error",
                "error": f"Navigation failed: {str(e)}"
            })
            return False
            
    async def get_active_page(self, wait_timeout_ms: int = 4000) -> Optional[Page]:
        """
        Hyper-aggressive page recovery. Tries to find an active page, and if 
        the context is alive but truly empty, it creates a new page as a fallback.
        """
        start_time = asyncio.get_event_loop().time()
        
        while (asyncio.get_event_loop().time() - start_time) * 1000 < wait_timeout_ms:
            # 1. Check if current page is still valid
            if self.page and not self.page.is_closed():
                return self.page
                
            # 2. Try to recover from other pages in the context
            if self.context:
                try:
                    pages = self.context.pages
                    active_pages = [p for p in pages if not p.is_closed()]
                    if active_pages:
                        # Prefer page with a real URL (not about:blank)
                        meaningful = [p for p in active_pages if "about:blank" not in p.url]
                        self.page = meaningful[-1] if meaningful else active_pages[-1]
                        self.current_url = self.page.url
                        await self._emit_update({
                            "type": "tab_switched",
                            "url": self.current_url,
                            "message": "Automatically recovered active page from context"
                        })
                        return self.page
                except Exception as e:
                    # Context might be in a transient state
                    pass
            
            # Wait a bit before retrying
            await asyncio.sleep(0.5)
            
        # 3. Final Fallback: If context exists but is empty, create a new page to keep session alive
        if self.context:
            try:
                # Double check context state before creating page
                if not getattr(self.context, "_closed", False):
                    self.page = await self.context.new_page()
                    self.current_url = "about:blank"
                    await self._emit_update({
                        "type": "tab_switched",
                        "url": self.current_url,
                        "message": "All pages were closed. Created a new blank page to keep session alive."
                    })
                    return self.page
            except Exception as e:
                print(f"Failed to create fallback page: {e}")
                
        return None
    
    async def highlight_element(self, selector: str, duration_ms: int = 2000):
        """Highlight an element on the page"""
        try:
            await self.page.evaluate(f"""
                (() => {{
                    const el = document.querySelector('{selector}');
                    if (el) {{
                        const rect = el.getBoundingClientRect();
                        const highlight = document.createElement('div');
                        highlight.id = 'cognitest-highlight';
                        highlight.style.cssText = `
                            position: fixed;
                            top: ${{rect.top}}px;
                            left: ${{rect.left}}px;
                            width: ${{rect.width}}px;
                            height: ${{rect.height}}px;
                            border: 3px solid #3B82F6;
                            background: rgba(59, 130, 246, 0.1);
                            z-index: 999999;
                            pointer-events: none;
                            transition: all 0.3s ease;
                        `;
                        document.body.appendChild(highlight);
                        setTimeout(() => highlight.remove(), {duration_ms});
                    }}
                }})()
            """)
        except:
            pass
    
    async def click_at_point(self, x: int, y: int) -> dict:
        """Click at a specific point and return info about clicked element"""
        try:
            # Get element info at point before clicking
            element_info = await self.get_element_at_point(x, y)
            
            # Perform the click
            await self.page.mouse.click(x, y)
            
            return {
                "success": True,
                "element": element_info,
                "action": "click",
                "x": x,
                "y": y
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def type_text(self, text: str) -> dict:
        """Type text at the currently focused element"""
        try:
            await self.page.keyboard.type(text)
            return {"success": True, "action": "type", "text": text}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def type_into_element(self, selector: str, text: str) -> dict:
        """Type text into a specific element by selector"""
        try:
            await self.page.fill(selector, text)
            return {"success": True, "action": "type", "selector": selector, "text": text}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def press_key(self, key: str) -> dict:
        """Press a keyboard key"""
        try:
            await self.page.keyboard.press(key)
            return {"success": True, "action": "press", "key": key}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def get_element_at_point(self, x: int, y: int) -> dict:
        """Get element information at a specific point on the page"""
        try:
            element_info = await self.page.evaluate(f"""
                (() => {{
                    const el = document.elementFromPoint({x}, {y});
                    if (!el) return null;
                    
                    // Generate multiple selector strategies
                    const generateSelectors = (element) => {{
                        const selectors = {{}};
                        
                        // ID selector (most reliable)
                        if (element.id) {{
                            selectors.id = '#' + element.id;
                        }}
                        
                        // Data-testid (common testing attribute)
                        if (element.dataset.testid) {{
                            selectors.testId = `[data-testid="${{element.dataset.testid}}"]`;
                        }}
                        
                        // Name attribute
                        if (element.name) {{
                            selectors.name = `[name="${{element.name}}"]`;
                        }}
                        
                        // Aria-label
                        if (element.getAttribute('aria-label')) {{
                            selectors.ariaLabel = `[aria-label="${{element.getAttribute('aria-label')}}"]`;
                        }}
                        
                        // Class-based selector
                        if (element.className && typeof element.className === 'string') {{
                            const classes = element.className.trim().split(/\\s+/).filter(c => c.length > 0 && !c.includes(':'));
                            if (classes.length > 0) {{
                                selectors.class = element.tagName.toLowerCase() + '.' + classes.slice(0, 2).join('.');
                            }}
                        }}
                        
                        // Text content selector (for buttons, links)
                        const text = element.textContent?.trim().slice(0, 50);
                        if (text && ['BUTTON', 'A', 'SPAN', 'LABEL'].includes(element.tagName)) {{
                            selectors.text = `${{element.tagName.toLowerCase()}}:has-text("${{text}}")`;
                        }}
                        
                        // Full CSS path
                        const getCssPath = (el) => {{
                            const path = [];
                            while (el && el.nodeType === Node.ELEMENT_NODE) {{
                                let selector = el.tagName.toLowerCase();
                                if (el.id) {{
                                    selector = '#' + el.id;
                                    path.unshift(selector);
                                    break;
                                }}
                                let sibling = el;
                                let nth = 1;
                                while (sibling = sibling.previousElementSibling) {{
                                    if (sibling.tagName === el.tagName) nth++;
                                }}
                                if (nth > 1) selector += `:nth-of-type(${{nth}})`;
                                path.unshift(selector);
                                el = el.parentNode;
                            }}
                            return path.join(' > ');
                        }};
                        selectors.cssPath = getCssPath(element);
                        
                        // XPath
                        const getXPath = (el) => {{
                            if (el.id) return `//*[@id="${{el.id}}"]`;
                            const parts = [];
                            while (el && el.nodeType === Node.ELEMENT_NODE) {{
                                let idx = 1;
                                let sibling = el;
                                while (sibling = sibling.previousElementSibling) {{
                                    if (sibling.tagName === el.tagName) idx++;
                                }}
                                const tagName = el.tagName.toLowerCase();
                                parts.unshift(idx > 1 ? `${{tagName}}[${{idx}}]` : tagName);
                                el = el.parentNode;
                            }}
                            return '/' + parts.join('/');
                        }};
                        selectors.xpath = getXPath(element);
                        
                        return selectors;
                    }};
                    
                    const rect = el.getBoundingClientRect();
                    const selectors = generateSelectors(el);
                    
                    // Find best selector (prefer id, testId, name, then others)
                    const bestSelector = selectors.id || selectors.testId || selectors.name || 
                                        selectors.ariaLabel || selectors.class || selectors.cssPath;
                    
                    // Calculate element index among matching elements for each attribute
                    const getElementIndex = (selector) => {{
                        try {{
                            const allMatching = document.querySelectorAll(selector);
                            for (let i = 0; i < allMatching.length; i++) {{
                                if (allMatching[i] === el) return {{ index: i, total: allMatching.length }};
                            }}
                        }} catch (e) {{}}
                        return {{ index: 0, total: 1 }};
                    }};
                    
                    // Get indices for common selectors
                    const indices = {{}};
                    if (el.getAttribute('type')) {{
                        indices.type = getElementIndex(`[type="${{el.getAttribute('type')}}"]`);
                    }}
                    if (el.getAttribute('name')) {{
                        indices.name = getElementIndex(`[name="${{el.getAttribute('name')}}"]`);
                    }}
                    if (el.getAttribute('placeholder')) {{
                        indices.placeholder = getElementIndex(`[placeholder="${{el.getAttribute('placeholder')}}"]`);
                    }}
                    if (el.tagName) {{
                        indices.tag = getElementIndex(el.tagName.toLowerCase());
                    }}
                    
                    return {{
                        tagName: el.tagName.toLowerCase(),
                        id: el.id || null,
                        className: el.className || null,
                        name: el.getAttribute('name'),
                        type: el.getAttribute('type'),
                        placeholder: el.getAttribute('placeholder'),
                        text: el.textContent?.trim().slice(0, 100) || null,
                        href: el.href || null,
                        value: el.value || null,
                        isInput: ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName),
                        isClickable: ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName) || 
                                    el.onclick != null || 
                                    getComputedStyle(el).cursor === 'pointer',
                        rect: {{
                            x: rect.x,
                            y: rect.y,
                            width: rect.width,
                            height: rect.height
                        }},
                        selectors: selectors,
                        bestSelector: bestSelector,
                        indices: indices
                    }};
                }})()
            """)
            
            return element_info or {}
        except Exception as e:
            return {"error": str(e)}
    
    async def click_element(self, selector: str) -> dict:
        """Click an element by selector"""
        try:
            await self.page.click(selector)
            return {"success": True, "action": "click", "selector": selector}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def double_click(self, selector: str) -> dict:
        """Double click an element by selector"""
        try:
            await self.page.dblclick(selector)
            return {"success": True, "action": "double_click", "selector": selector}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def right_click(self, selector: str) -> dict:
        """Right click an element by selector"""
        try:
            await self.page.click(selector, button="right")
            return {"success": True, "action": "right_click", "selector": selector}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def hover(self, selector: str) -> dict:
        """Hover over an element"""
        try:
            await self.page.hover(selector)
            return {"success": True, "action": "hover", "selector": selector}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def focus(self, selector: str) -> dict:
        """Focus on an element"""
        try:
            await self.page.focus(selector)
            return {"success": True, "action": "focus", "selector": selector}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def clear_input(self, selector: str) -> dict:
        """Clear an input field"""
        try:
            await self.page.fill(selector, "")
            return {"success": True, "action": "clear", "selector": selector}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def select_option(self, selector: str, value: str) -> dict:
        """Select option from dropdown"""
        try:
            await self.page.select_option(selector, value)
            return {"success": True, "action": "select", "selector": selector, "value": value}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def check(self, selector: str) -> dict:
        """Check a checkbox"""
        try:
            await self.page.check(selector)
            return {"success": True, "action": "check", "selector": selector}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def uncheck(self, selector: str) -> dict:
        """Uncheck a checkbox"""
        try:
            await self.page.uncheck(selector)
            return {"success": True, "action": "uncheck", "selector": selector}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def go_back(self) -> dict:
        """Go back in browser history"""
        try:
            await self.page.go_back()
            return {"success": True, "action": "go_back"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def go_forward(self) -> dict:
        """Go forward in browser history"""
        try:
            await self.page.go_forward()
            return {"success": True, "action": "go_forward"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def reload(self) -> dict:
        """Reload the page"""
        try:
            await self.page.reload()
            return {"success": True, "action": "reload"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def get_element_info(self, selector: str) -> dict:
        """Get information about an element"""
        try:
            element = await self.page.query_selector(selector)
            if element:
                is_visible = await element.is_visible()
                text = await element.inner_text() if is_visible else ""
                return {"success": True, "visible": is_visible, "text": text, "selector": selector}
            return {"success": False, "error": "Element not found"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def scroll_page(self, direction: str = "down", amount: int = 300) -> dict:
        """Scroll the page"""
        try:
            if direction == "down":
                await self.page.evaluate(f"window.scrollBy(0, {amount})")
            elif direction == "up":
                await self.page.evaluate(f"window.scrollBy(0, -{amount})")
            elif direction == "left":
                await self.page.evaluate(f"window.scrollBy(-{amount}, 0)")
            elif direction == "right":
                await self.page.evaluate(f"window.scrollBy({amount}, 0)")
            return {"success": True, "action": "scroll", "direction": direction}
        except Exception as e:
            return {"success": False, "error": str(e)}

    # ============================================
    # File Upload
    # ============================================
    async def upload_file(self, selector: str, file_path: str) -> dict:
        """Upload a file to a file input"""
        try:
            await self.page.set_input_files(selector, file_path)
            return {"success": True, "action": "upload", "file": file_path}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    # ============================================
    # Drag and Drop
    # ============================================
    async def drag_and_drop(self, source_selector: str, target_selector: str) -> dict:
        """Drag element from source to target"""
        try:
            await self.page.drag_and_drop(source_selector, target_selector)
            return {"success": True, "action": "drag_drop"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    # ============================================
    # Wait Actions
    # ============================================
    async def wait_for_selector(self, selector: str, timeout: int = 30000) -> dict:
        """Wait for element to appear"""
        try:
            await self.page.wait_for_selector(selector, timeout=timeout)
            return {"success": True, "action": "wait", "selector": selector}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def wait_for_network_idle(self, timeout: int = 30000) -> dict:
        """Wait for network to be idle"""
        try:
            await self.page.wait_for_load_state("networkidle", timeout=timeout)
            return {"success": True, "action": "wait_network"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def wait_for_url(self, url_pattern: str, timeout: int = 30000) -> dict:
        """Wait for URL to match pattern"""
        try:
            await self.page.wait_for_url(url_pattern, timeout=timeout)
            return {"success": True, "action": "wait_url"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    # ============================================
    # Dialog Handling
    # ============================================
    async def accept_dialog(self, prompt_text: str = None) -> dict:
        """Accept alert/confirm/prompt dialog"""
        try:
            self.page.on("dialog", lambda dialog: dialog.accept(prompt_text) if prompt_text else dialog.accept())
            return {"success": True, "action": "accept_dialog"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def dismiss_dialog(self) -> dict:
        """Dismiss alert/confirm dialog"""
        try:
            self.page.on("dialog", lambda dialog: dialog.dismiss())
            return {"success": True, "action": "dismiss_dialog"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    # ============================================
    # Tab/Window Management
    # ============================================
    async def new_tab(self, url: str = "about:blank") -> dict:
        """Open a new tab"""
        try:
            new_page = await self.context.new_page()
            if url != "about:blank":
                await new_page.goto(url)
            return {"success": True, "action": "new_tab", "url": url}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def switch_tab(self, index: int) -> dict:
        """Switch to tab by index"""
        try:
            pages = self.context.pages
            if 0 <= index < len(pages):
                self.page = pages[index]
                await self.page.bring_to_front()
                return {"success": True, "action": "switch_tab", "index": index}
            return {"success": False, "error": f"Tab index {index} out of range"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def close_tab(self, index: int = None) -> dict:
        """Close current or specified tab"""
        try:
            if index is not None:
                pages = self.context.pages
                if 0 <= index < len(pages):
                    await pages[index].close()
            else:
                await self.page.close()
            return {"success": True, "action": "close_tab"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    # ============================================
    # Frame Handling
    # ============================================
    async def switch_to_frame(self, selector: str) -> dict:
        """Switch to iframe"""
        try:
            frame = self.page.frame_locator(selector)
            return {"success": True, "action": "switch_to_frame", "selector": selector, "frame": frame}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def switch_to_main_frame(self) -> dict:
        """Switch back to main frame"""
        try:
            # Main frame is always accessible via self.page
            return {"success": True, "action": "switch_to_main"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    # ============================================
    # Cookie Management
    # ============================================
    async def get_cookie(self, name: str) -> dict:
        """Get cookie value by name"""
        try:
            cookies = await self.context.cookies()
            for cookie in cookies:
                if cookie.get("name") == name:
                    return {"success": True, "value": cookie.get("value"), "cookie": cookie}
            return {"success": False, "error": f"Cookie '{name}' not found"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def set_cookie(self, name: str, value: str, domain: str = None, path: str = "/") -> dict:
        """Set a cookie"""
        try:
            cookie = {"name": name, "value": value, "path": path}
            if domain:
                cookie["domain"] = domain
            else:
                cookie["url"] = self.page.url
            await self.context.add_cookies([cookie])
            return {"success": True, "action": "set_cookie", "name": name}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def delete_cookie(self, name: str) -> dict:
        """Delete a specific cookie"""
        try:
            cookies = await self.context.cookies()
            filtered = [c for c in cookies if c.get("name") != name]
            await self.context.clear_cookies()
            if filtered:
                await self.context.add_cookies(filtered)
            return {"success": True, "action": "delete_cookie", "name": name}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def clear_cookies(self) -> dict:
        """Clear all cookies"""
        try:
            await self.context.clear_cookies()
            return {"success": True, "action": "clear_cookies"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    # ============================================
    # Local Storage
    # ============================================
    async def get_local_storage(self, key: str) -> dict:
        """Get localStorage item"""
        try:
            value = await self.page.evaluate(f"localStorage.getItem('{key}')")
            return {"success": True, "key": key, "value": value}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def set_local_storage(self, key: str, value: str) -> dict:
        """Set localStorage item"""
        try:
            await self.page.evaluate(f"localStorage.setItem('{key}', '{value}')")
            return {"success": True, "action": "set_local_storage", "key": key}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def clear_local_storage(self) -> dict:
        """Clear all localStorage"""
        try:
            await self.page.evaluate("localStorage.clear()")
            return {"success": True, "action": "clear_local_storage"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    # ============================================
    # Session Storage
    # ============================================
    async def get_session_storage(self, key: str) -> dict:
        """Get sessionStorage item"""
        try:
            value = await self.page.evaluate(f"sessionStorage.getItem('{key}')")
            return {"success": True, "key": key, "value": value}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def set_session_storage(self, key: str, value: str) -> dict:
        """Set sessionStorage item"""
        try:
            await self.page.evaluate(f"sessionStorage.setItem('{key}', '{value}')")
            return {"success": True, "action": "set_session_storage", "key": key}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def clear_session_storage(self) -> dict:
        """Clear all sessionStorage"""
        try:
            await self.page.evaluate("sessionStorage.clear()")
            return {"success": True, "action": "clear_session_storage"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    # ============================================
    # Data Extraction
    # ============================================
    async def extract_text(self, selector: str) -> dict:
        """Extract text from element"""
        try:
            text = await self.page.inner_text(selector)
            return {"success": True, "text": text, "selector": selector}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def extract_attribute(self, selector: str, attribute: str) -> dict:
        """Extract attribute from element"""
        try:
            value = await self.page.get_attribute(selector, attribute)
            return {"success": True, "attribute": attribute, "value": value}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def get_element_count(self, selector: str) -> dict:
        """Get count of matching elements"""
        try:
            elements = await self.page.query_selector_all(selector)
            return {"success": True, "count": len(elements), "selector": selector}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    # ============================================
    # JavaScript Execution
    # ============================================
    async def execute_script(self, script: str) -> dict:
        """Execute JavaScript code"""
        try:
            result = await self.page.evaluate(script)
            return {"success": True, "result": result}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    # ============================================
    # Viewport and Device
    # ============================================
    async def set_viewport(self, width: int, height: int) -> dict:
        """Set viewport size"""
        try:
            await self.page.set_viewport_size({"width": width, "height": height})
            return {"success": True, "action": "set_viewport", "width": width, "height": height}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def set_geolocation(self, latitude: float, longitude: float, accuracy: float = 100) -> dict:
        """Set geolocation"""
        try:
            await self.context.set_geolocation({"latitude": latitude, "longitude": longitude, "accuracy": accuracy})
            return {"success": True, "action": "set_geolocation"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    # ============================================
    # Screenshots
    # ============================================
    async def take_screenshot(self, path: str = None, full_page: bool = False) -> dict:
        """Take screenshot"""
        try:
            screenshot_bytes = await self.page.screenshot(path=path, full_page=full_page)
            return {"success": True, "action": "screenshot", "path": path, "bytes": len(screenshot_bytes) if screenshot_bytes else 0}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    # ============================================
    # Clipboard
    # ============================================
    async def copy_to_clipboard(self, text: str) -> dict:
        """Copy text to clipboard"""
        try:
            await self.page.evaluate(f"navigator.clipboard.writeText('{text}')")
            return {"success": True, "action": "copy_to_clipboard"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def paste_from_clipboard(self) -> dict:
        """Paste from clipboard (reads clipboard)"""
        try:
            text = await self.page.evaluate("navigator.clipboard.readText()")
            return {"success": True, "text": text}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    # ============================================
    # Performance
    # ============================================
    async def measure_load_time(self) -> dict:
        """Measure page load time"""
        try:
            timing = await self.page.evaluate("""() => {
                const perf = performance.getEntriesByType('navigation')[0];
                return {
                    loadTime: perf.loadEventEnd - perf.startTime,
                    domContentLoaded: perf.domContentLoadedEventEnd - perf.startTime,
                    firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0
                };
            }""")
            return {"success": True, "timing": timing}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def get_performance_metrics(self) -> dict:
        """Get Web Vitals and performance metrics"""
        try:
            metrics = await self.page.evaluate("""() => {
                return {
                    memory: performance.memory ? {
                        usedJSHeapSize: performance.memory.usedJSHeapSize,
                        totalJSHeapSize: performance.memory.totalJSHeapSize
                    } : null,
                    navigation: performance.getEntriesByType('navigation')[0],
                    resources: performance.getEntriesByType('resource').length
                };
            }""")
            return {"success": True, "metrics": metrics}
        except Exception as e:
            return {"success": False, "error": str(e)}

    
    async def stop(self):
        """Stop and cleanup browser session"""
        self.stop_streaming()
        self.status = SessionStatus.STOPPED
        
        try:
            # Get video path before closing context
            if self.record_video and self.page:
                try:
                    video = self.page.video
                    if video:
                        self.video_path = await video.path()
                except Exception as e:
                    print(f"Failed to get video path: {e}")
            
            if self.context:
                await self.context.close()
            if self.browser:
                await self.browser.close()
            if self.playwright:
                await self.playwright.stop()
        except:
            pass
        
        await self._emit_update({
            "type": "session_stopped",
            "session_id": self.session_id,
            "video_path": self.video_path
        })
    
    async def _emit_update(self, data: dict):
        """Emit update via callback"""
        try:
            if asyncio.iscoroutinefunction(self.on_update):
                await self.on_update(data)
            else:
                self.on_update(data)
        except Exception as e:
            print(f"Failed to emit update: {e}")
    
    def get_state(self) -> dict:
        """Get current session state"""
        return {
            "session_id": self.session_id,
            "status": self.status.value,
            "url": self.current_url,
            "device": self.device,
            "browser_type": self.browser_type,
            "is_streaming": self.is_streaming
        }


class BrowserSessionManager:
    """
    Manages multiple browser sessions
    """
    
    def __init__(self):
        self.sessions: Dict[str, BrowserSession] = {}
    
    async def create_session(
        self,
        session_id: str,
        on_update: Callable,
        browser_type: str = "chromium",
        device: str = "desktop_chrome",
        initial_url: str = "about:blank",
        headless: bool = False,
        record_video: bool = False,
        video_dir: str = None,
        project_id: str = None
    ) -> Optional[BrowserSession]:
        """Create and launch a new browser session"""
        
        # Stop existing session if any
        if session_id in self.sessions:
            await self.stop_session(session_id)
        
        session = BrowserSession(
            session_id=session_id,
            on_update=on_update,
            browser_type=browser_type,
            device=device,
            headless=headless,
            record_video=record_video,
            video_dir=video_dir,
            project_id=project_id
        )
        
        success = await session.launch(initial_url)
        
        if success:
            self.sessions[session_id] = session
            return session
        
        return None
    
    def get_session(self, session_id: str) -> Optional[BrowserSession]:
        """Get session by ID"""
        return self.sessions.get(session_id)
    
    async def stop_session(self, session_id: str) -> bool:
        """Stop and remove session"""
        if session_id in self.sessions:
            session = self.sessions.pop(session_id)
            await session.stop()
            return True
        return False
    
    async def stop_all_sessions(self):
        """Stop all sessions"""
        for session_id in list(self.sessions.keys()):
            await self.stop_session(session_id)
    
    def get_all_sessions(self) -> List[dict]:
        """Get state of all sessions"""
        return [session.get_state() for session in self.sessions.values()]


# Global session manager instance
browser_session_manager = BrowserSessionManager()
