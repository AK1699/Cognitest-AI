"""
Local Lighthouse Service
Runs Lighthouse CLI locally via subprocess to avoid PageSpeed API rate limits
"""
import asyncio
import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime
import subprocess
import os

logger = logging.getLogger(__name__)


class LocalLighthouseService:
    """
    Local Lighthouse implementation using Node.js CLI
    Runs lighthouse as a subprocess and parses JSON output
    """
    
    def __init__(self):
        """Initialize Local Lighthouse service"""
        pass
    
    async def run_audit(
        self, 
        url: str, 
        strategy: str = "mobile",
        categories: list = None
    ) -> Dict[str, Any]:
        """
        Execute Lighthouse audit locally
        
        Args:
            url: Target URL to test
            strategy: 'mobile' or 'desktop'
            categories: List of categories to audit (ignored, lighthouse runs all)
        
        Returns:
            Dict with performance metrics matching PageSpeed API format
        """
        logger.info(f"Running local Lighthouse audit for {url} ({strategy})")
        
        try:
            # Build lighthouse command
            # Use new headless mode (better for modern Chrome)
            cmd = [
                "npx",
                "lighthouse",
                url,
                "--output=json",
                "--quiet",
                "--chrome-flags=--headless=new",
            ]
            
            # Add preset for desktop
            if strategy.lower() == "desktop":
                cmd.append("--preset=desktop")
            
            # Run lighthouse in subprocess
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=os.path.dirname(os.path.dirname(os.path.dirname(__file__)))  # backend dir
            )
            
            # Wait for completion with timeout
            try:
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(),
                    timeout=120  # 2 minutes timeout
                )
            except asyncio.TimeoutError:
                process.kill()
                raise Exception("Lighthouse scan timed out after 120 seconds")
            
            if process.returncode != 0:
                error_msg = stderr.decode('utf-8') if stderr else "Unknown error"
                logger.error(f"Lighthouse failed: {error_msg}")
                raise Exception(f"Lighthouse CLI failed: {error_msg}")
            
            # Parse JSON output
            lighthouse_result = json.loads(stdout.decode('utf-8'))
            
            # Convert to PageSpeed API format
            metrics = self._parse_lighthouse_result(lighthouse_result)
            metrics["tested_url"] = url
            metrics["strategy"] = strategy
            metrics["tested_at"] = datetime.utcnow().isoformat()
            
            logger.info(f"Local Lighthouse audit complete. Score: {metrics.get('performance_score', 'N/A')}")
            return metrics
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Lighthouse JSON output: {e}")
            raise Exception(f"Invalid Lighthouse output: {e}")
        except FileNotFoundError:
            logger.error("Lighthouse CLI not found. Please run: npm install lighthouse chrome-launcher")
            raise Exception("Lighthouse not installed. Run: npm install lighthouse chrome-launcher")
        except Exception as e:
            logger.error(f"Local Lighthouse audit failed: {e}")
            raise
    
    def _parse_lighthouse_result(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse Lighthouse result to match PageSpeed API format"""
        categories = data.get("categories", {})
        audits = data.get("audits", {})
        
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
            
            # Timing
            "fetch_time": data.get("fetchTime"),
            "lighthouse_version": data.get("lighthouseVersion"),
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
    
    def _extract_opportunities(self, audits: Dict) -> list:
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
    
    def _extract_diagnostics(self, audits: Dict) -> list:
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


# Singleton instance
_local_lighthouse_service: Optional[LocalLighthouseService] = None


def get_local_lighthouse_service() -> LocalLighthouseService:
    """Get or create Local Lighthouse service instance"""
    global _local_lighthouse_service
    if _local_lighthouse_service is None:
        _local_lighthouse_service = LocalLighthouseService()
    return _local_lighthouse_service
