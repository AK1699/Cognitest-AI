"""
WebPageTest Integration Service
Advanced page performance analysis using WebPageTest API
"""

import asyncio
import httpx
from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel
from enum import Enum


class TestLocation(str, Enum):
    """Available test locations"""
    DULLES = "Dulles"
    CALIFORNIA = "ec2-us-west-1"
    VIRGINIA = "ec2-us-east-1"
    FRANKFURT = "ec2-eu-central-1"
    LONDON = "ec2-eu-west-1"
    SYDNEY = "ec2-ap-southeast-2"
    TOKYO = "ec2-ap-northeast-1"
    SINGAPORE = "ec2-ap-southeast-1"
    MUMBAI = "ec2-ap-south-1"
    SAO_PAULO = "ec2-sa-east-1"


class Browser(str, Enum):
    """Available browsers"""
    CHROME = "Chrome"
    FIREFOX = "Firefox"
    EDGE = "Edge"


class ConnectionType(str, Enum):
    """Connection speed profiles"""
    CABLE = "Cable"
    DSL = "DSL"
    FIOS = "FIOS"
    DIAL = "Dial"
    EDGE_MOBILE = "Edge"
    THREE_G = "3G"
    THREE_G_FAST = "3GFast"
    FOUR_G = "4G"
    LTE = "LTE"
    NATIVE = "Native"


class WebPageTestConfig(BaseModel):
    """Configuration for a WebPageTest run"""
    url: str
    location: TestLocation = TestLocation.DULLES
    browser: Browser = Browser.CHROME
    connection: ConnectionType = ConnectionType.CABLE
    runs: int = 3  # Number of test runs
    first_view_only: bool = False
    video: bool = True  # Capture video
    lighthouse: bool = True  # Include Lighthouse audit
    mobile: bool = False  # Emulate mobile device
    private: bool = True  # Keep test private
    label: Optional[str] = None


class WebPageTestResult(BaseModel):
    """WebPageTest result summary"""
    test_id: str
    status: str
    url: str
    location: str
    completed_at: Optional[datetime] = None
    
    # First View metrics
    first_view: Optional[Dict[str, Any]] = None
    
    # Repeat View metrics (if available)
    repeat_view: Optional[Dict[str, Any]] = None
    
    # Lighthouse scores (if enabled)
    lighthouse: Optional[Dict[str, Any]] = None
    
    # Filmstrip and video URLs
    filmstrip_url: Optional[str] = None
    video_url: Optional[str] = None
    
    # Waterfall data
    waterfall: Optional[List[Dict[str, Any]]] = None
    
    # Raw data URL
    json_url: Optional[str] = None
    

class WebPageTestService:
    """Service for interacting with WebPageTest API"""
    
    BASE_URL = "https://www.webpagetest.org"
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize WebPageTest service
        
        Args:
            api_key: WebPageTest API key. Free tier allows limited tests.
                    Get a key at https://www.webpagetest.org/getkey.php
        """
        self.api_key = api_key
        self.client = httpx.AsyncClient(timeout=60.0)
    
    async def submit_test(self, config: WebPageTestConfig) -> Dict[str, Any]:
        """
        Submit a new test to WebPageTest
        
        Args:
            config: Test configuration
            
        Returns:
            Dict containing test_id and status_url
        """
        params = {
            "url": config.url,
            "location": f"{config.location.value}:{config.browser.value}",
            "runs": config.runs,
            "fvonly": 1 if config.first_view_only else 0,
            "video": 1 if config.video else 0,
            "lighthouse": 1 if config.lighthouse else 0,
            "mobile": 1 if config.mobile else 0,
            "private": 1 if config.private else 0,
            "f": "json",  # JSON response format
        }
        
        if self.api_key:
            params["k"] = self.api_key
        
        if config.connection != ConnectionType.NATIVE:
            params["connectivity"] = config.connection.value
            
        if config.label:
            params["label"] = config.label
        
        response = await self.client.get(
            f"{self.BASE_URL}/runtest.php",
            params=params
        )
        response.raise_for_status()
        
        data = response.json()
        
        if data.get("statusCode") != 200:
            raise Exception(f"WebPageTest error: {data.get('statusText', 'Unknown error')}")
        
        return {
            "test_id": data["data"]["testId"],
            "status_url": data["data"]["jsonUrl"],
            "user_url": data["data"]["userUrl"]
        }
    
    async def get_test_status(self, test_id: str) -> Dict[str, Any]:
        """
        Check the status of a test
        
        Args:
            test_id: The test ID returned from submit_test
            
        Returns:
            Dict with status information
        """
        response = await self.client.get(
            f"{self.BASE_URL}/testStatus.php",
            params={"test": test_id, "f": "json"}
        )
        response.raise_for_status()
        
        data = response.json()
        
        return {
            "status_code": data.get("statusCode"),
            "status_text": data.get("statusText"),
            "complete": data.get("statusCode") == 200,
            "behind": data.get("data", {}).get("behindCount", 0)
        }
    
    async def get_test_results(self, test_id: str) -> WebPageTestResult:
        """
        Fetch complete test results
        
        Args:
            test_id: The test ID
            
        Returns:
            WebPageTestResult with all metrics
        """
        response = await self.client.get(
            f"{self.BASE_URL}/jsonResult.php",
            params={"test": test_id}
        )
        response.raise_for_status()
        
        data = response.json()
        
        if data.get("statusCode") != 200:
            raise Exception(f"Test not complete or failed: {data.get('statusText')}")
        
        test_data = data.get("data", {})
        runs = test_data.get("runs", {})
        median_run = test_data.get("median", {})
        
        # Extract first view metrics from median run
        first_view = None
        if median_run.get("firstView"):
            fv = median_run["firstView"]
            first_view = {
                "load_time": fv.get("loadTime"),
                "ttfb": fv.get("TTFB"),
                "first_paint": fv.get("firstPaint"),
                "first_contentful_paint": fv.get("firstContentfulPaint"),
                "largest_contentful_paint": fv.get("chromeUserTiming.LargestContentfulPaint"),
                "cumulative_layout_shift": fv.get("chromeUserTiming.CumulativeLayoutShift"),
                "total_blocking_time": fv.get("TotalBlockingTime"),
                "speed_index": fv.get("SpeedIndex"),
                "fully_loaded": fv.get("fullyLoaded"),
                "dom_elements": fv.get("domElements"),
                "requests": fv.get("requests"),
                "bytes_in": fv.get("bytesIn"),
                "bytes_out": fv.get("bytesOut"),
                "connections": fv.get("connections"),
                "render": fv.get("render"),
                "doc_time": fv.get("docTime"),
            }
        
        # Extract repeat view metrics if available
        repeat_view = None
        if median_run.get("repeatView"):
            rv = median_run["repeatView"]
            repeat_view = {
                "load_time": rv.get("loadTime"),
                "ttfb": rv.get("TTFB"),
                "first_paint": rv.get("firstPaint"),
                "speed_index": rv.get("SpeedIndex"),
                "fully_loaded": rv.get("fullyLoaded"),
                "requests": rv.get("requests"),
                "bytes_in": rv.get("bytesIn"),
            }
        
        # Extract Lighthouse scores
        lighthouse = None
        if test_data.get("lighthouse"):
            lh = test_data["lighthouse"]
            lighthouse = {
                "performance": lh.get("categories", {}).get("performance", {}).get("score", 0) * 100,
                "accessibility": lh.get("categories", {}).get("accessibility", {}).get("score", 0) * 100,
                "best_practices": lh.get("categories", {}).get("best-practices", {}).get("score", 0) * 100,
                "seo": lh.get("categories", {}).get("seo", {}).get("score", 0) * 100,
                "pwa": lh.get("categories", {}).get("pwa", {}).get("score", 0) * 100
            }
        
        return WebPageTestResult(
            test_id=test_id,
            status="complete",
            url=test_data.get("url", ""),
            location=test_data.get("location", ""),
            completed_at=datetime.now(),
            first_view=first_view,
            repeat_view=repeat_view,
            lighthouse=lighthouse,
            filmstrip_url=f"{self.BASE_URL}/video/filmstrip.php?test={test_id}",
            video_url=f"{self.BASE_URL}/video/video.php?test={test_id}",
            json_url=f"{self.BASE_URL}/jsonResult.php?test={test_id}"
        )
    
    async def run_test_and_wait(
        self, 
        config: WebPageTestConfig,
        poll_interval: int = 10,
        max_wait: int = 600
    ) -> WebPageTestResult:
        """
        Submit a test and wait for completion
        
        Args:
            config: Test configuration
            poll_interval: Seconds between status checks
            max_wait: Maximum seconds to wait
            
        Returns:
            WebPageTestResult with complete metrics
        """
        submission = await self.submit_test(config)
        test_id = submission["test_id"]
        
        elapsed = 0
        while elapsed < max_wait:
            status = await self.get_test_status(test_id)
            
            if status["complete"]:
                return await self.get_test_results(test_id)
            
            await asyncio.sleep(poll_interval)
            elapsed += poll_interval
        
        raise TimeoutError(f"Test {test_id} did not complete within {max_wait} seconds")
    
    async def get_test_history(
        self, 
        days: int = 30,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Get recent test history (requires API key)
        
        Args:
            days: Number of days to look back
            limit: Maximum tests to return
            
        Returns:
            List of recent tests with basic info
        """
        if not self.api_key:
            return []
        
        response = await self.client.get(
            f"{self.BASE_URL}/testlog.php",
            params={
                "k": self.api_key,
                "days": days,
                "f": "json"
            }
        )
        response.raise_for_status()
        
        data = response.json()
        tests = data.get("data", {}).get("tests", [])
        
        return [
            {
                "test_id": t.get("id"),
                "url": t.get("url"),
                "location": t.get("location"),
                "label": t.get("label"),
                "created": t.get("created"),
                "completed": t.get("completed"),
                "first_view_load": t.get("fvLoadTime"),
                "first_view_speed_index": t.get("fvSpeedIndex")
            }
            for t in tests[:limit]
        ]
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()


# Convenience function for quick tests
async def quick_test(url: str, api_key: Optional[str] = None) -> WebPageTestResult:
    """
    Run a quick WebPageTest with default settings
    
    Args:
        url: URL to test
        api_key: Optional API key
        
    Returns:
        WebPageTestResult
    """
    service = WebPageTestService(api_key)
    try:
        config = WebPageTestConfig(url=url)
        return await service.run_test_and_wait(config)
    finally:
        await service.close()
