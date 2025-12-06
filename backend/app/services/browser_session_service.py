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
        headless: bool = False
    ):
        self.session_id = session_id
        self.on_update = on_update
        self.browser_type = browser_type
        self.device = device
        self.headless = headless
        
        self.playwright = None
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        
        self.status = SessionStatus.LAUNCHING
        self.current_url = ""
        self.is_streaming = False
        self._screenshot_task: Optional[asyncio.Task] = None
        self._pending_requests: Dict[str, NetworkRequest] = {}
        
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
        
        # Console messages
        self.page.on("console", self._handle_console)
        
        # Network requests
        self.page.on("request", self._handle_request)
        self.page.on("response", self._handle_response)
        self.page.on("requestfailed", self._handle_request_failed)
        
        # Navigation
        self.page.on("framenavigated", self._handle_navigation)
    
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
        while self.is_streaming and self.page:
            try:
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
            await self.page.goto(url, wait_until="domcontentloaded")
            self.current_url = self.page.url
            return True
        except Exception as e:
            await self._emit_update({
                "type": "error",
                "error": f"Navigation failed: {str(e)}"
            })
            return False
    
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
                        bestSelector: bestSelector
                    }};
                }})()
            """)
            
            return element_info or {}
        except Exception as e:
            return {"error": str(e)}
    
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

    
    async def stop(self):
        """Stop and cleanup browser session"""
        self.stop_streaming()
        self.status = SessionStatus.STOPPED
        
        try:
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
            "session_id": self.session_id
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
        headless: bool = False
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
            headless=headless
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
