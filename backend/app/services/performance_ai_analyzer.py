"""
AI Performance Analyzer Service
Uses Gemini AI for bottleneck detection, recommendations, and predictive analysis
"""
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
import json

# Using unified AIService which routes to Ollama/Gemini based on AI_PROVIDER setting
from app.services.ai_service import get_ai_service, AIService

logger = logging.getLogger(__name__)


class PerformanceAIAnalyzer:
    """
    AI-powered performance analysis service
    Provides bottleneck detection, recommendations, and risk assessment
    """
    
    def __init__(self, api_key: Optional[str] = None):
        self.gemini: Optional[AIService] = None
        try:
            self.gemini = get_ai_service()
        except Exception as e:
            logger.warning(f"Gemini service not available: {e}")
    
    async def analyze_lighthouse_results(
        self, 
        metrics: Dict[str, Any],
        url: str
    ) -> Dict[str, Any]:
        """
        Analyze Lighthouse/PageSpeed results and provide recommendations
        """
        if not self.gemini:
            return self._fallback_lighthouse_analysis(metrics)
        
        # Build context for AI
        prompt = self._build_lighthouse_prompt(metrics, url)
        
        try:
            response = await self.gemini.generate_completion(
                messages=[
                    {"role": "system", "content": self._get_performance_expert_prompt()},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                json_mode=True
            )
            
            analysis = json.loads(response)
            return {
                "summary": analysis.get("summary", ""),
                "bottlenecks": analysis.get("bottlenecks", []),
                "recommendations": analysis.get("recommendations", []),
                "risk_level": analysis.get("risk_level", "medium"),
                "is_production_ready": analysis.get("is_production_ready", False),
                "blockers": analysis.get("blockers", []),
                "generated_at": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"AI analysis failed: {e}")
            return self._fallback_lighthouse_analysis(metrics)
    
    async def analyze_load_test_results(
        self,
        metrics: Dict[str, Any],
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Analyze load test results for bottlenecks and scaling recommendations
        """
        if not self.gemini:
            return self._fallback_load_test_analysis(metrics, config)
        
        prompt = self._build_load_test_prompt(metrics, config)
        
        try:
            response = await self.gemini.generate_completion(
                messages=[
                    {"role": "system", "content": self._get_load_test_expert_prompt()},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                json_mode=True
            )
            
            analysis = json.loads(response)
            return {
                "summary": analysis.get("summary", ""),
                "bottlenecks": analysis.get("bottlenecks", []),
                "recommendations": analysis.get("recommendations", []),
                "scaling_advice": analysis.get("scaling_advice", ""),
                "breaking_point_estimate": analysis.get("breaking_point_estimate"),
                "risk_level": analysis.get("risk_level", "medium"),
                "is_production_ready": analysis.get("is_production_ready", False),
                "generated_at": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"AI load test analysis failed: {e}")
            return self._fallback_load_test_analysis(metrics, config)
    
    async def predict_breaking_point(
        self,
        timeline_data: List[Dict[str, Any]],
        current_vus: int
    ) -> Dict[str, Any]:
        """
        Predict system breaking point based on stress test trends
        """
        if not self.gemini:
            return {"predicted_vus": None, "confidence": "low", "reason": "AI service unavailable"}
        
        # Analyze trend data
        latencies = [p.get("avg_response_time", 0) for p in timeline_data]
        errors = [p.get("errors", 0) for p in timeline_data]
        
        # Check for degradation patterns
        if len(latencies) >= 5:
            recent_trend = latencies[-5:]
            if all(recent_trend[i] < recent_trend[i+1] for i in range(len(recent_trend)-1)):
                # Exponential latency growth - system is stressed
                return {
                    "predicted_vus": int(current_vus * 1.2),
                    "confidence": "high",
                    "reason": "Exponential latency growth detected",
                    "failure_mode": "Response time degradation"
                }
        
        # Check error rate acceleration
        if len(errors) >= 3 and sum(errors[-3:]) > sum(errors[:3]) * 2:
            return {
                "predicted_vus": int(current_vus * 1.1),
                "confidence": "medium",
                "reason": "Error rate acceleration detected",
                "failure_mode": "Error threshold breach"
            }
        
        return {
            "predicted_vus": int(current_vus * 2),
            "confidence": "low",
            "reason": "System appears stable, no degradation detected",
            "failure_mode": None
        }
    
    def _get_performance_expert_prompt(self) -> str:
        return """You are a Senior Web Performance Consultant with expertise in Core Web Vitals optimization, Lighthouse auditing, and frontend performance engineering.

## Your Analysis Process
1. ASSESS each Core Web Vital against Google's thresholds:
   - LCP: Good < 2500ms | Needs Improvement 2500-4000ms | Poor > 4000ms
   - FID: Good < 100ms | Needs Improvement 100-300ms | Poor > 300ms
   - CLS: Good < 0.1 | Needs Improvement 0.1-0.25 | Poor > 0.25
   - FCP: Good < 1800ms | Needs Improvement 1800-3000ms | Poor > 3000ms
   - TTFB: Good < 800ms | Needs Improvement 800-1800ms | Poor > 1800ms
2. IDENTIFY bottleneck patterns (render-blocking resources, unoptimized images, excessive DOM, slow server response)
3. PRIORITIZE recommendations by impact (fix high-impact issues first)
4. DETERMINE production readiness based on Core Web Vitals pass/fail

## Severity Scoring
- "high" impact: Directly affects Core Web Vitals or causes >500ms delay
- "medium" impact: Affects secondary metrics or causes 100-500ms delay
- "low" impact: Minor optimization opportunity with <100ms improvement

## Output Format
Respond with valid JSON:
{
    "summary": "Brief executive summary citing specific metric values",
    "bottlenecks": [{"issue": "Specific problem", "impact": "high|medium|low", "component": "rendering|network|javascript|images|fonts|server"}],
    "recommendations": [{"title": "Actionable title", "description": "Specific implementation steps", "expected_impact": "Quantified improvement estimate", "effort": "low|medium|high"}],
    "risk_level": "low|medium|high|critical",
    "is_production_ready": true|false,
    "blockers": ["Critical issues that MUST be fixed before production deployment"]
}

## Rules
- Always cite specific metric values in the summary (e.g., 'LCP of 3200ms exceeds the 2500ms threshold')
- Recommendations must include specific implementation steps, not generic advice
- is_production_ready is false if ANY Core Web Vital is in the 'Poor' range
- Order recommendations by expected_impact descending"""

    def _get_load_test_expert_prompt(self) -> str:
        return """You are a Senior Performance Engineer specializing in load testing, capacity planning, and system scalability.

## Your Analysis Process
1. EVALUATE against industry SLA benchmarks:
   - P95 latency: Good < 500ms | Acceptable < 1000ms | Degraded < 3000ms | Critical > 3000ms
   - Error rate: Good < 0.1% | Acceptable < 1% | Degraded < 5% | Critical > 5%
   - Throughput: Compare requests/second against expected capacity
2. IDENTIFY bottleneck layer:
   - "frontend": Slow static asset delivery, CDN issues
   - "backend": Application logic, CPU/memory saturation
   - "database": Slow queries, connection pool exhaustion, lock contention
   - "network": High latency, packet loss, DNS resolution
3. PREDICT breaking point by analyzing latency growth patterns
4. RECOMMEND scaling strategy (vertical vs. horizontal, caching, async processing)

## Breaking Point Estimation
- If latency grows linearly: breaking point ≈ current_vus × (threshold / current_p95)
- If latency grows exponentially: breaking point ≈ current_vus × 1.2 (system is near limit)
- If error rate is accelerating: breaking point is at current load level

## Output Format
Respond with valid JSON:
{
    "summary": "Executive summary with key metrics cited",
    "bottlenecks": [{"issue": "Specific bottleneck", "impact": "high|medium|low", "layer": "frontend|backend|database|network"}],
    "recommendations": [{"title": "Actionable title", "description": "Implementation steps", "expected_impact": "Quantified improvement", "effort": "low|medium|high"}],
    "scaling_advice": "Specific scaling recommendation with justification",
    "breaking_point_estimate": {"vus": 500, "reason": "Based on latency growth pattern..."},
    "risk_level": "low|medium|high|critical",
    "is_production_ready": true|false
}

## Rules
- Always compare metrics against the SLA benchmarks defined above
- breaking_point_estimate must include mathematical reasoning
- is_production_ready is false if error_rate > 1% or P95 > 2000ms
- scaling_advice must specify whether horizontal or vertical scaling is recommended and why"""

    def _build_lighthouse_prompt(self, metrics: Dict[str, Any], url: str) -> str:
        return f"""Analyze the following Lighthouse performance results for {url}:

**Scores (0-100):**
- Performance: {metrics.get('performance_score', 'N/A')}
- Accessibility: {metrics.get('accessibility_score', 'N/A')}
- SEO: {metrics.get('seo_score', 'N/A')}
- Best Practices: {metrics.get('best_practices_score', 'N/A')}

**Core Web Vitals:**
- LCP (Largest Contentful Paint): {metrics.get('largest_contentful_paint', 'N/A')}ms
- FID (First Input Delay): {metrics.get('first_input_delay', 'N/A')}ms
- CLS (Cumulative Layout Shift): {metrics.get('cumulative_layout_shift', 'N/A')}
- FCP (First Contentful Paint): {metrics.get('first_contentful_paint', 'N/A')}ms
- TTFB (Time to First Byte): {metrics.get('time_to_first_byte', 'N/A')}ms

**Additional Metrics:**
- Speed Index: {metrics.get('speed_index', 'N/A')}
- Time to Interactive: {metrics.get('time_to_interactive', 'N/A')}ms
- Total Blocking Time: {metrics.get('total_blocking_time', 'N/A')}ms
- Total Page Weight: {metrics.get('total_byte_weight', 'N/A')} bytes
- Total Requests: {metrics.get('total_requests', 'N/A')}

**Opportunities Identified:**
{json.dumps(metrics.get('opportunities', [])[:5], indent=2)}

Provide a detailed analysis with specific, actionable recommendations."""

    def _build_load_test_prompt(self, metrics: Dict[str, Any], config: Dict[str, Any]) -> str:
        return f"""Analyze the following load test results:

**Test Configuration:**
- Virtual Users: {config.get('virtual_users', 'N/A')}
- Duration: {config.get('duration_seconds', 'N/A')} seconds
- Target URL: {config.get('target_url', 'N/A')}

**Results:**
- Total Requests: {metrics.get('total_requests_made', 'N/A')}
- Requests/Second: {metrics.get('requests_per_second', 'N/A')}

**Latency (ms):**
- Min: {metrics.get('latency_min', 'N/A')}
- Avg: {metrics.get('latency_avg', 'N/A')}
- P50: {metrics.get('latency_p50', 'N/A')}
- P95: {metrics.get('latency_p95', 'N/A')}
- P99: {metrics.get('latency_p99', 'N/A')}
- Max: {metrics.get('latency_max', 'N/A')}

**Errors:**
- Error Count: {metrics.get('error_count', 0)}
- Error Rate: {metrics.get('error_rate', 0)}%

Analyze the performance characteristics, identify bottlenecks, and provide scaling recommendations."""

    def _fallback_lighthouse_analysis(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Rule-based fallback when AI is unavailable"""
        bottlenecks = []
        recommendations = []
        risk_level = "low"
        blockers = []
        
        perf_score = metrics.get('performance_score')
        lcp = metrics.get('largest_contentful_paint')
        cls = metrics.get('cumulative_layout_shift')
        
        # Check performance score
        if perf_score is not None:
            if perf_score < 50:
                risk_level = "high"
                bottlenecks.append({"issue": "Poor performance score", "impact": "high", "component": "overall"})
                blockers.append("Performance score is below acceptable threshold")
            elif perf_score < 75:
                risk_level = "medium"
                bottlenecks.append({"issue": "Moderate performance score", "impact": "medium", "component": "overall"})
        
        # Check LCP
        if lcp is not None and lcp > 2500:
            bottlenecks.append({"issue": "Slow LCP", "impact": "high" if lcp > 4000 else "medium", "component": "rendering"})
            recommendations.append({
                "title": "Optimize Largest Contentful Paint",
                "description": "Optimize images, preload critical resources, use efficient caching",
                "expected_impact": "20-40% LCP improvement",
                "effort": "medium"
            })
        
        # Check CLS
        if cls is not None and cls > 0.1:
            bottlenecks.append({"issue": "Layout shift issues", "impact": "medium", "component": "layout"})
            recommendations.append({
                "title": "Fix Cumulative Layout Shift",
                "description": "Set explicit dimensions for images and embeds, avoid inserting content above existing content",
                "expected_impact": "Improved visual stability",
                "effort": "low"
            })
        
        return {
            "summary": f"Performance score: {perf_score or 'N/A'}/100. {'Needs optimization.' if risk_level != 'low' else 'Acceptable performance.'}",
            "bottlenecks": bottlenecks,
            "recommendations": recommendations,
            "risk_level": risk_level,
            "is_production_ready": risk_level == "low" and not blockers,
            "blockers": blockers,
            "generated_at": datetime.utcnow().isoformat()
        }
    
    def _fallback_load_test_analysis(self, metrics: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
        """Rule-based fallback for load test analysis"""
        bottlenecks = []
        recommendations = []
        risk_level = "low"
        
        error_rate = metrics.get('error_rate', 0)
        p95_latency = metrics.get('latency_p95')
        
        # Check error rate
        if error_rate > 5:
            risk_level = "critical"
            bottlenecks.append({"issue": "High error rate", "impact": "high", "layer": "backend"})
        elif error_rate > 1:
            risk_level = "high"
            bottlenecks.append({"issue": "Elevated error rate", "impact": "medium", "layer": "backend"})
        
        # Check P95 latency
        if p95_latency is not None:
            if p95_latency > 3000:
                risk_level = max(risk_level, "high")
                bottlenecks.append({"issue": "Slow P95 response time", "impact": "high", "layer": "backend"})
                recommendations.append({
                    "title": "Optimize Response Time",
                    "description": "Consider database query optimization, caching, or horizontal scaling",
                    "expected_impact": "50%+ latency reduction",
                    "effort": "high"
                })
            elif p95_latency > 1000:
                bottlenecks.append({"issue": "Moderate P95 latency", "impact": "medium", "layer": "backend"})
        
        vus = config.get('virtual_users', 0)
        
        return {
            "summary": f"Tested with {vus} virtual users. Error rate: {error_rate}%, P95 latency: {p95_latency or 'N/A'}ms",
            "bottlenecks": bottlenecks,
            "recommendations": recommendations,
            "scaling_advice": "Consider horizontal scaling if load increases" if risk_level != "low" else "Current setup handles load well",
            "breaking_point_estimate": {"vus": vus * 2, "reason": "Estimated based on current metrics"} if risk_level == "low" else {"vus": vus, "reason": "Already showing degradation"},
            "risk_level": risk_level,
            "is_production_ready": risk_level in ["low", "medium"],
            "generated_at": datetime.utcnow().isoformat()
        }


# Singleton instance
_performance_ai_analyzer: Optional[PerformanceAIAnalyzer] = None


def get_performance_ai_analyzer(api_key: Optional[str] = None) -> PerformanceAIAnalyzer:
    """Get or create performance AI analyzer instance"""
    global _performance_ai_analyzer
    if _performance_ai_analyzer is None:
        _performance_ai_analyzer = PerformanceAIAnalyzer(api_key=api_key)
    return _performance_ai_analyzer
