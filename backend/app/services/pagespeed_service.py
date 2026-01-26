"""
PageSpeed Insights Service
Integration with Google PageSpeed Insights API for web performance testing
"""
import aiohttp
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime

logger = logging.getLogger(__name__)


class PageSpeedInsightsService:
    """
    Google PageSpeed Insights API integration
    Provides Lighthouse-powered performance audits without local installation
    
    API Docs: https://developers.google.com/speed/docs/insights/v5/get-started
    """
    
    BASE_URL = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
    
    # Category mappings
    CATEGORIES = {
        "performance": "PERFORMANCE",
        "accessibility": "ACCESSIBILITY", 
        "best-practices": "BEST_PRACTICES",
        "seo": "SEO",
        "pwa": "PWA"
    }
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize PageSpeed Insights service
        
        Args:
            api_key: Optional Google API key for higher quotas
        """
        self.api_key = api_key
    
    async def run_audit(
        self, 
        url: str, 
        strategy: str = "mobile",
        categories: List[str] = None
    ) -> Dict[str, Any]:
        """
        Execute PageSpeed Insights audit
        
        Args:
            url: Target URL to test
            strategy: 'mobile' or 'desktop'
            categories: List of categories to audit (default: all)
        
        Returns:
            Dict with performance metrics and scores
        """
        if categories is None:
            categories = ["performance", "accessibility", "best-practices", "seo"]
        
        # Build request parameters
        params = {
            "url": url,
            "strategy": strategy.upper(),
        }
        
        # Add categories
        for cat in categories:
            if cat in self.CATEGORIES:
                params[f"category"] = self.CATEGORIES[cat]
        
        # Add API key if available
        if self.api_key:
            params["key"] = self.api_key
        
        import asyncio
        import random
        
        max_retries = 3
        retry_delay = 1.0  # Initial delay in seconds
        
        logger.info(f"Running PageSpeed audit for {url} ({strategy})")
        
        for attempt in range(max_retries + 1):
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get(
                        self.BASE_URL, 
                        params=params,
                        timeout=aiohttp.ClientTimeout(total=120)
                    ) as response:
                        if response.status == 200:
                            data = await response.json()
                            break  # Success
                        
                        # Handle retriable errors
                        if response.status in [429, 500, 502, 503, 504]:
                            if attempt < max_retries:
                                # Exponential backoff with jitter
                                sleep_time = (retry_delay * (2 ** attempt)) + (random.random() * 0.5)
                                logger.warning(f"PageSpeed API {response.status} (attempt {attempt + 1}). Retrying in {sleep_time:.2f}s...")
                                await asyncio.sleep(sleep_time)
                                continue
                        
                        # Non-retriable or max retries reached
                        error_text = await response.text()
                        logger.error(f"PageSpeed API error: {response.status} - {error_text}")
                        raise Exception(f"PageSpeed API error: {response.status}")
                
            except aiohttp.ClientError as e:
                if attempt < max_retries:
                    sleep_time = (retry_delay * (2 ** attempt)) + (random.random() * 0.5)
                    logger.warning(f"HTTP error (attempt {attempt + 1}): {e}. Retrying in {sleep_time:.2f}s...")
                    await asyncio.sleep(sleep_time)
                    continue
                logger.error(f"HTTP error during PageSpeed audit: {e}")
                raise Exception(f"Failed to connect to PageSpeed API: {e}")
            except Exception as e:
                logger.error(f"PageSpeed audit failed: {e}")
                raise
        
        # Parse and extract metrics
        metrics = self._parse_lighthouse_result(data)
        metrics["raw_response"] = data  # Store for reference
        metrics["tested_url"] = url
        metrics["strategy"] = strategy
        metrics["tested_at"] = datetime.utcnow().isoformat()
        
        logger.info(f"PageSpeed audit complete. Score: {metrics.get('performance_score', 'N/A')}")
        return metrics
            

    
    def _parse_lighthouse_result(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse Lighthouse result from PageSpeed API response"""
        lighthouse = data.get("lighthouseResult", {})
        categories = lighthouse.get("categories", {})
        audits = lighthouse.get("audits", {})
        
        metrics = {
            # Scores (0-100)
            "performance_score": self._get_score(categories, "performance"),
            "accessibility_score": self._get_score(categories, "accessibility"),
            "seo_score": self._get_score(categories, "seo"),
            "best_practices_score": self._get_score(categories, "best-practices"),
            "pwa_score": self._get_score(categories, "pwa"),
            
            # Core Web Vitals (milliseconds)
            "largest_contentful_paint": self._get_audit_value(audits, "largest-contentful-paint"),
            "first_input_delay": self._get_audit_value(audits, "max-potential-fid"),
            "cumulative_layout_shift": self._get_audit_value(audits, "cumulative-layout-shift"),
            "first_contentful_paint": self._get_audit_value(audits, "first-contentful-paint"),
            "time_to_first_byte": self._get_audit_value(audits, "server-response-time"),
            
            # Additional Performance Metrics
            "speed_index": self._get_audit_value(audits, "speed-index"),
            "time_to_interactive": self._get_audit_value(audits, "interactive"),
            "total_blocking_time": self._get_audit_value(audits, "total-blocking-time"),
            
            # Page Resources
            "total_byte_weight": self._get_audit_value(audits, "total-byte-weight"),
            "total_requests": self._get_network_requests(audits),
            "dom_size": self._get_audit_value(audits, "dom-size"),
            
            # Opportunities (improvements with savings)
            "opportunities": self._extract_opportunities(audits),
            
            # Diagnostics (informational audits)
            "diagnostics": self._extract_diagnostics(audits),
            
            # Screenshots/Filmstrip if available
            "screenshot": self._get_screenshot(audits),
            "filmstrip": self._get_filmstrip(audits),
            
            # Timing
            "fetch_time": lighthouse.get("fetchTime"),
            "lighthouse_version": lighthouse.get("lighthouseVersion"),
        }
        
        return metrics
    
    def _get_score(self, categories: Dict, category: str) -> Optional[float]:
        """Extract score (0-100) from category"""
        cat = categories.get(category, {})
        score = cat.get("score")
        if score is not None:
            return round(score * 100, 1)
        return None
    
    def _get_audit_value(self, audits: Dict, audit_id: str) -> Optional[float]:
        """Extract numeric value from audit"""
        audit = audits.get(audit_id, {})
        return audit.get("numericValue")
    
    def _get_network_requests(self, audits: Dict) -> Optional[int]:
        """Get total number of network requests"""
        network_audit = audits.get("network-requests", {})
        details = network_audit.get("details", {})
        items = details.get("items", [])
        return len(items) if items else None
    
    def _extract_opportunities(self, audits: Dict) -> List[Dict[str, Any]]:
        """Extract optimization opportunities"""
        opportunities = []
        
        opportunity_audits = [
            "render-blocking-resources",
            "unminified-css",
            "unminified-javascript",
            "unused-css-rules",
            "unused-javascript",
            "uses-responsive-images",
            "offscreen-images",
            "uses-optimized-images",
            "uses-webp-images",
            "uses-text-compression",
            "uses-rel-preconnect",
            "server-response-time",
            "redirects",
            "uses-rel-preload",
            "efficient-animated-content",
            "duplicated-javascript",
            "legacy-javascript",
            "total-byte_weight",
        ]
        
        for audit_id in opportunity_audits:
            audit = audits.get(audit_id, {})
            score = audit.get("score")
            
            # Only include if not passing (score < 0.9) and has savings
            if score is not None and score < 0.9:
                opportunity = {
                    "id": audit_id,
                    "title": audit.get("title", audit_id),
                    "description": audit.get("description", ""),
                    "score": round(score * 100, 1) if score else 0,
                    "savings_ms": audit.get("numericValue", 0),
                    "display_value": audit.get("displayValue", ""),
                }
                
                # Extract details if available
                details = audit.get("details", {})
                if details.get("overallSavingsMs"):
                    opportunity["savings_ms"] = details["overallSavingsMs"]
                if details.get("overallSavingsBytes"):
                    opportunity["savings_bytes"] = details["overallSavingsBytes"]
                
                opportunities.append(opportunity)
        
        # Sort by savings (highest first)
        opportunities.sort(key=lambda x: x.get("savings_ms", 0), reverse=True)
        return opportunities[:10]  # Top 10 opportunities
    
    def _extract_diagnostics(self, audits: Dict) -> List[Dict[str, Any]]:
        """Extract diagnostic information"""
        diagnostics = []
        
        diagnostic_audits = [
            "largest-contentful-paint-element",
            "layout-shift-elements",
            "long-tasks",
            "no-document-write",
            "uses-passive-event-listeners",
            "mainthread-work-breakdown",
            "bootup-time",
            "font-display",
            "third-party-summary",
            "dom-size",
        ]
        
        for audit_id in diagnostic_audits:
            audit = audits.get(audit_id, {})
            if audit.get("details"):
                diagnostics.append({
                    "id": audit_id,
                    "title": audit.get("title", audit_id),
                    "description": audit.get("description", ""),
                    "display_value": audit.get("displayValue", ""),
                    "score": round(audit.get("score", 0) * 100, 1) if audit.get("score") else None,
                })
        
        return diagnostics
    
    def _get_screenshot(self, audits: Dict) -> Optional[str]:
        """Get final screenshot data URL"""
        screenshot = audits.get("final-screenshot", {})
        details = screenshot.get("details", {})
        return details.get("data")  # Base64 encoded image
    
    def _get_filmstrip(self, audits: Dict) -> List[Dict[str, Any]]:
        """Get filmstrip frames"""
        filmstrip_audit = audits.get("screenshot-thumbnails", {})
        details = filmstrip_audit.get("details", {})
        items = details.get("items", [])
        
        return [
            {
                "timing": item.get("timing"),
                "timestamp": item.get("timestamp"),
                "data": item.get("data"),  # Base64
            }
            for item in items
        ]
    
    async def get_core_web_vitals_summary(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a summary of Core Web Vitals with pass/fail status
        """
        def assess_metric(value: Optional[float], good_threshold: float, poor_threshold: float) -> str:
            if value is None:
                return "unknown"
            if value <= good_threshold:
                return "good"
            elif value <= poor_threshold:
                return "needs_improvement"
            else:
                return "poor"
        
        lcp = metrics.get("largest_contentful_paint")
        fid = metrics.get("first_input_delay")
        cls = metrics.get("cumulative_layout_shift")
        
        return {
            "lcp": {
                "value": lcp,
                "unit": "ms",
                "status": assess_metric(lcp, 2500, 4000),
            },
            "fid": {
                "value": fid,
                "unit": "ms", 
                "status": assess_metric(fid, 100, 300),
            },
            "cls": {
                "value": cls,
                "unit": "",
                "status": assess_metric(cls, 0.1, 0.25),
            },
            "overall_status": self._get_overall_cwv_status(lcp, fid, cls),
        }
    
    def _get_overall_cwv_status(
        self, 
        lcp: Optional[float], 
        fid: Optional[float], 
        cls: Optional[float]
    ) -> str:
        """Determine overall Core Web Vitals pass/fail"""
        # All metrics must be "good" to pass
        lcp_good = lcp is not None and lcp <= 2500
        fid_good = fid is not None and fid <= 100
        cls_good = cls is not None and cls <= 0.1
        
        if lcp_good and fid_good and cls_good:
            return "passed"
        elif (lcp is not None and lcp > 4000) or \
             (fid is not None and fid > 300) or \
             (cls is not None and cls > 0.25):
            return "failed"
        else:
            return "needs_improvement"


# Singleton instance
_pagespeed_service: Optional[PageSpeedInsightsService] = None


def get_pagespeed_service(api_key: Optional[str] = None) -> PageSpeedInsightsService:
    """Get or create PageSpeed Insights service instance"""
    global _pagespeed_service
    if _pagespeed_service is None:
        _pagespeed_service = PageSpeedInsightsService(api_key=api_key)
    elif api_key and not _pagespeed_service.api_key:
        _pagespeed_service.api_key = api_key
    return _pagespeed_service
