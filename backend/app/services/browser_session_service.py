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
import os
import platform
import shutil

from playwright.async_api import async_playwright, Browser, BrowserContext, Page


def _playwright_executable_exists(browser_engine) -> bool:
    try:
        executable_path = browser_engine.executable_path
    except Exception:
        return True
    return bool(executable_path) and os.path.exists(executable_path)


def _detect_chromium_fallback() -> dict:
    system = platform.system().lower()

    if system == "darwin":
        chrome_path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        if os.path.exists(chrome_path):
            return {"channel": "chrome"}
        edge_path = "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
        if os.path.exists(edge_path):
            return {"channel": "msedge"}

    if system == "windows":
        chrome_paths = [
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        ]
        if any(os.path.exists(path) for path in chrome_paths):
            return {"channel": "chrome"}

        edge_paths = [
            r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
            r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        ]
        if any(os.path.exists(path) for path in edge_paths):
            return {"channel": "msedge"}

    chrome_bins = ["google-chrome", "google-chrome-stable", "chrome"]
    if any(shutil.which(name) for name in chrome_bins):
        return {"channel": "chrome"}

    edge_bins = ["msedge", "microsoft-edge"]
    if any(shutil.which(name) for name in edge_bins):
        return {"channel": "msedge"}

    chromium_bins = ["chromium", "chromium-browser"]
    for name in chromium_bins:
        executable = shutil.which(name)
        if executable:
            return {"executable_path": executable}

    return {}


def _is_missing_browser_error(err: Exception) -> bool:
    message = str(err).lower()
    return (
        "playwright install" in message
        or "executable doesn't exist" in message
        or "download new browsers" in message
    )


def _format_launch_error(err: Exception) -> str:
    message = str(err).strip()
    if not message:
        return "Browser launch failed."
    if _is_missing_browser_error(err):
        return (
            "Playwright browsers are not installed. Run `python -m playwright install` "
            "in the backend environment (or `playwright install`) and retry."
        )
    return message


def _is_transient_page_error(err: Exception) -> bool:
    message = str(err).lower()
    return any(token in message for token in [
        "execution context was destroyed",
        "cannot find context",
        "context was destroyed",
        "navigation",
        "is not available"
    ])


def _is_target_closed_error(err: Exception) -> bool:
    message = str(err).lower()
    return any(token in message for token in [
        "target page, context or browser has been closed",
        "target closed",
        "browser has been closed",
        "context has been closed",
        "page has been closed",
        "page closed"
    ])


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
        self.last_error: Optional[str] = None

        # Execution state
        self.is_executing: bool = False
        self._keepalive_task: Optional[asyncio.Task] = None
        
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
            browser_type = (self.browser_type or "chromium").lower()
            if browser_type == "firefox":
                browser_engine = self.playwright.firefox
            elif browser_type in ["webkit", "safari"]:
                browser_engine = self.playwright.webkit
            else:
                browser_engine = self.playwright.chromium
            
            # Launch browser
            launch_options = {"headless": self.headless}
            if browser_engine == self.playwright.chromium:
                if browser_type in ["chrome", "google-chrome"]:
                    launch_options["channel"] = "chrome"
                elif browser_type in ["edge", "msedge", "microsoft-edge"]:
                    launch_options["channel"] = "msedge"
                elif not _playwright_executable_exists(browser_engine):
                    launch_options.update(_detect_chromium_fallback())

            try:
                self.browser = await browser_engine.launch(**launch_options)
            except Exception as launch_error:
                # If Playwright browsers are missing, attempt a system Chromium fallback
                if (
                    browser_engine == self.playwright.chromium
                    and "channel" not in launch_options
                    and "executable_path" not in launch_options
                    and _is_missing_browser_error(launch_error)
                ):
                    fallback = _detect_chromium_fallback()
                    if fallback:
                        self.browser = await browser_engine.launch(**{"headless": self.headless, **fallback})
                        if fallback.get("channel"):
                            self.browser_type = fallback["channel"]
                    else:
                        raise launch_error
                else:
                    raise launch_error
            
            # Create context with device settings
            device_config = DevicePreset.get(self.device)
            context_options = {
                "viewport": device_config["viewport"],
                "is_mobile": device_config.get("is_mobile", False),
                "has_touch": device_config.get("has_touch", False),
                "ignore_https_errors": True,
                "accept_downloads": True,
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
            self.start_keepalive()
            
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
            self.last_error = _format_launch_error(e)
            await self._cleanup_on_error()
            await self._emit_update({
                "type": "error",
                "error": self.last_error
            })
            return False

    async def _cleanup_on_error(self):
        """Cleanup partial resources after a failed launch."""
        try:
            if self.page:
                await self.page.close()
        except Exception:
            pass
        try:
            if self.context:
                await self.context.close()
        except Exception:
            pass
        try:
            if self.browser:
                await self.browser.close()
        except Exception:
            pass
        try:
            if self.playwright:
                await self.playwright.stop()
        except Exception:
            pass
    
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
        if not self.is_streaming or self._screenshot_task is None or self._screenshot_task.done():
            self.is_streaming = True
            self._screenshot_task = asyncio.create_task(self._screenshot_loop())
    
    def stop_streaming(self):
        """Stop screenshot streaming"""
        self.is_streaming = False
        if self._screenshot_task:
            self._screenshot_task.cancel()

    def start_keepalive(self):
        """Start keepalive loop to prevent page/context from closing mid-run."""
        if not self._keepalive_task:
            self._keepalive_task = asyncio.create_task(self._keepalive_loop())

    def stop_keepalive(self):
        """Stop keepalive loop."""
        if self._keepalive_task:
            self._keepalive_task.cancel()
            self._keepalive_task = None
    
    async def _screenshot_loop(self):
        """Continuously capture and stream screenshots"""
        while self.is_streaming:
            try:
                if not self.page or self.page.is_closed():
                    await asyncio.sleep(0.5)
                    continue
                # Capture screenshot as JPEG for smaller size
                screenshot = await self.page.screenshot(
                    type="jpeg",
                    quality=70,
                    full_page=False
                )
                
                # Encode to base64
                screenshot_b64 = base64.b64encode(screenshot).decode('utf-8')
                
                # print(f"DEBUG: Emitting screenshot {len(screenshot_b64)} bytes")
                
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
                print(f"Screenshot failed: {e}")
                await asyncio.sleep(0.5)

    async def _keepalive_loop(self):
        """Keep browser/page alive during execution."""
        while True:
            try:
                await asyncio.sleep(2.0)
                if not self.is_executing:
                    continue

                browser_connected = False
                try:
                    browser_connected = bool(self.browser) and self.browser.is_connected()
                except Exception:
                    browser_connected = bool(self.browser)

                if not browser_connected:
                    # Avoid tearing down a healthy page during execution
                    if self.page and not self.page.is_closed():
                        continue
                    await self.launch(initial_url=self.current_url or "about:blank")
                    continue

                if not self.page or self.page.is_closed():
                    await self.ensure_page(self.current_url or "about:blank", force_navigate=True)
            except asyncio.CancelledError:
                break
            except Exception:
                await asyncio.sleep(1.0)

    async def ensure_page(self, url: Optional[str] = None, force_navigate: bool = False, force_recreate: bool = False) -> bool:
        """Ensure page/context is available; optionally navigate to url."""
        try:
            should_recreate = force_recreate
            recreated = False
            
            # If we think we have a page, verify it's actually alive
            if not should_recreate and self.page and not self.page.is_closed():
                try:
                    # Simple liveness check
                    await self.page.evaluate("1", timeout=1000)
                except Exception as e:
                    if self.page and not self.page.is_closed():
                        if _is_target_closed_error(e):
                            should_recreate = True
                        elif _is_transient_page_error(e):
                            # Continue without tearing down the page during navigation
                            should_recreate = False
                        else:
                            # If page is still open, avoid aggressive recreation during navigation
                            should_recreate = False
                    else:
                        should_recreate = True

            if should_recreate or not self.page or self.page.is_closed():
                # Close existing if they strictly exist but are broken
                if self.page:
                    try:
                        await self.page.close()
                    except:
                        pass
                if self.context:
                    try:
                        await self.context.close()
                        self.context = None  # Force context recreation too as it might be corrupted
                    except:
                        pass

                # For forced recreates, prefer a full relaunch to avoid bad browser state
                if force_recreate and self.browser:
                    try:
                        await self.browser.close()
                    except Exception:
                        pass
                    self.browser = None

                # Try to reuse browser if connected
                browser_connected = False
                try:
                    browser_connected = bool(self.browser) and self.browser.is_connected()
                except Exception:
                    browser_connected = bool(self.browser)

                if browser_connected:
                    try:
                        device_config = DevicePreset.get(self.device)
                        context_options = {
                            "viewport": device_config["viewport"],
                            "is_mobile": device_config.get("is_mobile", False),
                            "has_touch": device_config.get("has_touch", False),
                            "ignore_https_errors": True,
                            "accept_downloads": True
                        }
                        if device_config.get("user_agent"):
                            context_options["user_agent"] = device_config["user_agent"]
                        if device_config.get("device_scale_factor"):
                            context_options["device_scale_factor"] = device_config["device_scale_factor"]
                        if self.record_video and self.video_dir:
                            import os
                            os.makedirs(self.video_dir, exist_ok=True)
                            context_options["record_video_dir"] = self.video_dir
                            context_options["record_video_size"] = {"width": 1280, "height": 720}
                        
                        self.context = await self.browser.new_context(**context_options)
                        self.page = await self.context.new_page()
                        self._setup_event_listeners()
                        recreated = True
                    except Exception as ctx_err:
                        print(f"Failed to create context from existing browser: {ctx_err}")
                        browser_connected = False # Fallback to full relaunch

                if not browser_connected:
                    # Full relaunch
                    if self.browser:
                        try:
                            await self.browser.close()
                        except:
                            pass
                    return await self.launch(initial_url=url or "about:blank")

            if url and (force_navigate or not self.current_url or recreated):
                await self.page.goto(url, wait_until="domcontentloaded")
                self.current_url = self.page.url
            # Make sure streaming resumes if it was interrupted
            self.start_streaming()
            return True
        except Exception as e:
            await self._emit_update({
                "type": "error",
                "error": f"Ensure page failed: {str(e)}"
            })
            return False
    
    async def navigate(self, url: str) -> bool:
        """Navigate to URL"""
        try:
            # Ensure we have a valid page/context
            if not self.page or self.page.is_closed():
                if self.context and not self.context.is_closed():
                    self.page = await self.context.new_page()
                    self._setup_event_listeners()
                elif self.browser and not self.browser.is_closed():
                    # Recreate context with device settings
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
                    if self.record_video and self.video_dir:
                        import os
                        os.makedirs(self.video_dir, exist_ok=True)
                        context_options["record_video_dir"] = self.video_dir
                        context_options["record_video_size"] = {"width": 1280, "height": 720}
                    self.context = await self.browser.new_context(**context_options)
                    self.page = await self.context.new_page()
                    self._setup_event_listeners()
                else:
                    # No active browser/context, relaunch
                    return await self.launch(initial_url=url)

            await self.page.goto(url, wait_until="domcontentloaded")
            self.current_url = self.page.url
            self.start_streaming()
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
    
    async def type_into_element(self, selector: str, text: str) -> dict:
        """Type text into a specific element by selector.
        If selector is a simple name (no CSS operators), try common patterns."""
        try:
            await self.page.fill(selector, text, timeout=5000)
            return {"success": True, "action": "type", "selector": selector, "text": text}
        except Exception as e:
            # Check if selector is a simple token (no CSS operators)
            simple_selector = selector.strip() if selector else ""
            has_css_operators = any(ch in simple_selector for ch in [' ', '#', '.', '[', ']', '>', ':', '(', ')', '=', '"', "'"])
            
            if simple_selector and not has_css_operators:
                # Try common selector patterns for simple names
                fallback_patterns = [
                    f"[name='{simple_selector}']",
                    f"input[name='{simple_selector}']",
                    f"textarea[name='{simple_selector}']",
                    f"#{simple_selector}",
                    f"[id='{simple_selector}']",
                    f"input[id='{simple_selector}']",
                    f"[placeholder*='{simple_selector}' i]",
                    f"input[placeholder*='{simple_selector}' i]",
                ]
                
                for pattern in fallback_patterns:
                    try:
                        await self.page.fill(pattern, text, timeout=3000)
                        return {"success": True, "action": "type", "selector": pattern, "text": text, "normalized_from": simple_selector}
                    except Exception:
                        continue
            
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
        """Click an element by selector.
        If selector is a simple name (no CSS operators), try common patterns."""
        try:
            await self.page.click(selector, timeout=5000)
            return {"success": True, "action": "click", "selector": selector}
        except Exception as e:
            # Check if selector is a simple token (no CSS operators)
            simple_selector = selector.strip() if selector else ""
            has_css_operators = any(ch in simple_selector for ch in [' ', '#', '.', '[', ']', '>', ':', '(', ')', '=', '"', "'"])
            
            if simple_selector and not has_css_operators:
                # Try common selector patterns for simple names
                fallback_patterns = [
                    f"[name='{simple_selector}']",
                    f"[id='{simple_selector}']",
                    f"#{simple_selector}",
                    f"[data-testid='{simple_selector}']",
                    f"button[name='{simple_selector}']",
                    f"a[name='{simple_selector}']",
                    f"[aria-label*='{simple_selector}' i]",
                ]
                
                for pattern in fallback_patterns:
                    try:
                        await self.page.click(pattern, timeout=3000)
                        return {"success": True, "action": "click", "selector": pattern, "normalized_from": simple_selector}
                    except Exception:
                        continue
            
            return {"success": False, "error": str(e)}
    
    async def double_click(self, selector: str) -> dict:
        """Double click an element by selector"""
        try:
            await self.page.dblclick(selector, timeout=5000)
            return {"success": True, "action": "double_click", "selector": selector}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def right_click(self, selector: str) -> dict:
        """Right click an element by selector"""
        try:
            await self.page.click(selector, button="right", timeout=5000)
            return {"success": True, "action": "right_click", "selector": selector}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def hover(self, selector: str) -> dict:
        """Hover over an element"""
        try:
            await self.page.hover(selector, timeout=5000)
            return {"success": True, "action": "hover", "selector": selector}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def focus(self, selector: str) -> dict:
        """Focus on an element"""
        try:
            await self.page.focus(selector, timeout=5000)
            return {"success": True, "action": "focus", "selector": selector}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def clear_input(self, selector: str) -> dict:
        """Clear an input field"""
        try:
            await self.page.fill(selector, "", timeout=5000)
            return {"success": True, "action": "clear", "selector": selector}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def select_option(self, selector: str, value: str) -> dict:
        """Select option from dropdown"""
        try:
            await self.page.select_option(selector, value, timeout=5000)
            return {"success": True, "action": "select", "selector": selector, "value": value}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def check(self, selector: str) -> dict:
        """Check a checkbox"""
        try:
            await self.page.check(selector, timeout=5000)
            return {"success": True, "action": "check", "selector": selector}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def uncheck(self, selector: str) -> dict:
        """Uncheck a checkbox"""
        try:
            await self.page.uncheck(selector, timeout=5000)
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
        self.stop_keepalive()
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
        self.last_error: Optional[str] = None
    
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
            self.last_error = None
            return session
        self.last_error = session.last_error or "Failed to launch browser session"
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
