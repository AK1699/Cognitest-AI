"""
Performance Optimizer
Analyzes performance results and identifies optimization opportunities
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from enum import Enum
import json


class OptimizationPriority(Enum):
    """Priority levels for optimizations"""
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


@dataclass
class OptimizationOpportunity:
    """Single optimization opportunity"""
    browser: str
    issue: str
    metric: str
    current_value: float
    target_value: float
    priority: OptimizationPriority
    recommendation: str
    estimated_improvement: float  # percentage

    def to_dict(self) -> Dict[str, Any]:
        return {
            'browser': self.browser,
            'issue': self.issue,
            'metric': self.metric,
            'current_value': self.current_value,
            'target_value': self.target_value,
            'priority': self.priority.value,
            'recommendation': self.recommendation,
            'estimated_improvement_percent': self.estimated_improvement,
        }


class PerformanceOptimizer:
    """Identify and recommend optimizations"""

    def __init__(self):
        self.opportunities: List[OptimizationOpportunity] = []

    def analyze_profiles(
        self,
        profiles: Dict[str, Dict[str, Any]],
        targets: Dict[str, float]
    ) -> List[OptimizationOpportunity]:
        """Analyze performance profiles and identify optimization opportunities"""
        self.opportunities = []

        for browser_name, stats in profiles.items():
            self._analyze_browser(browser_name, stats, targets)

        return self.opportunities

    def _analyze_browser(
        self,
        browser_name: str,
        stats: Dict[str, Any],
        targets: Dict[str, float]
    ):
        """Analyze single browser's performance"""
        latencies = stats.get('latencies', {})
        resources = stats.get('resources', {})

        # Analyze click latency
        click_stats = latencies.get('click', {})
        if click_stats:
            avg = click_stats.get('avg', 0)
            p95 = click_stats.get('p95', 0)
            target = targets.get('click_latency_avg', 50)

            if avg > target:
                overhead = ((avg - target) / target) * 100
                self.opportunities.append(OptimizationOpportunity(
                    browser=browser_name,
                    issue=f"Click latency above target ({avg:.2f}ms vs {target:.2f}ms target)",
                    metric="click_latency_avg",
                    current_value=avg,
                    target_value=target,
                    priority=self._determine_priority(overhead),
                    recommendation=self._get_click_optimization_recommendation(browser_name, avg),
                    estimated_improvement=20.0 if avg > target * 2 else 10.0,
                ))

            if p95 > targets.get('click_latency_p95', 100):
                overhead = ((p95 - targets['click_latency_p95']) / targets['click_latency_p95']) * 100
                self.opportunities.append(OptimizationOpportunity(
                    browser=browser_name,
                    issue=f"Click P95 latency high ({p95:.2f}ms)",
                    metric="click_latency_p95",
                    current_value=p95,
                    target_value=targets['click_latency_p95'],
                    priority=self._determine_priority(overhead),
                    recommendation="Investigate tail latencies. May be caused by: 1) Event loop blocking, 2) Garbage collection pauses, 3) Browser rendering overhead. Consider preemptive rendering optimization.",
                    estimated_improvement=15.0,
                ))

        # Analyze type latency
        type_stats = latencies.get('type', {})
        if type_stats:
            avg = type_stats.get('avg', 0)
            target = targets.get('type_latency_avg', 30)

            if avg > target:
                self.opportunities.append(OptimizationOpportunity(
                    browser=browser_name,
                    issue=f"Type latency above target ({avg:.2f}ms vs {target:.2f}ms)",
                    metric="type_latency_avg",
                    current_value=avg,
                    target_value=target,
                    priority=self._determine_priority(((avg - target) / target) * 100),
                    recommendation=self._get_type_optimization_recommendation(browser_name),
                    estimated_improvement=12.0,
                ))

        # Analyze scroll latency
        scroll_stats = latencies.get('scroll', {})
        if scroll_stats:
            avg = scroll_stats.get('avg', 0)
            target = targets.get('scroll_latency_avg', 20)

            if avg > target:
                self.opportunities.append(OptimizationOpportunity(
                    browser=browser_name,
                    issue=f"Scroll latency above target ({avg:.2f}ms vs {target:.2f}ms)",
                    metric="scroll_latency_avg",
                    current_value=avg,
                    target_value=target,
                    priority=OptimizationPriority.MEDIUM,
                    recommendation="Enable hardware acceleration. Use `will-change` CSS for scroll containers. Consider RAF throttling for scroll events.",
                    estimated_improvement=18.0,
                ))

        # Analyze screenshot latency
        ss_stats = latencies.get('screenshot', {})
        if ss_stats:
            avg = ss_stats.get('avg', 0)
            target = targets.get('screenshot_latency_avg', 100)

            if avg > target:
                self.opportunities.append(OptimizationOpportunity(
                    browser=browser_name,
                    issue=f"Screenshot latency above target ({avg:.2f}ms vs {target:.2f}ms)",
                    metric="screenshot_latency_avg",
                    current_value=avg,
                    target_value=target,
                    priority=self._determine_priority(((avg - target) / target) * 100),
                    recommendation=self._get_screenshot_optimization_recommendation(browser_name, avg),
                    estimated_improvement=25.0,
                ))

        # Analyze memory usage
        mem_stats = resources.get('memory_mb', {})
        if mem_stats:
            avg = mem_stats.get('avg', 0)
            target = targets.get('memory_avg_mb', 500)

            if avg > target:
                overhead = ((avg - target) / target) * 100
                self.opportunities.append(OptimizationOpportunity(
                    browser=browser_name,
                    issue=f"Memory usage above target ({avg:.0f}MB vs {target:.0f}MB)",
                    metric="memory_avg_mb",
                    current_value=avg,
                    target_value=target,
                    priority=self._determine_priority(overhead),
                    recommendation=self._get_memory_optimization_recommendation(browser_name),
                    estimated_improvement=20.0,
                ))

        # Analyze CPU usage
        cpu_stats = resources.get('cpu_percent', {})
        if cpu_stats:
            avg = cpu_stats.get('avg', 0)
            target = targets.get('cpu_avg_percent', 50)

            if avg > target:
                overhead = ((avg - target) / target) * 100
                self.opportunities.append(OptimizationOpportunity(
                    browser=browser_name,
                    issue=f"CPU usage above target ({avg:.1f}% vs {target:.1f}%)",
                    metric="cpu_avg_percent",
                    current_value=avg,
                    target_value=target,
                    priority=self._determine_priority(overhead),
                    recommendation=self._get_cpu_optimization_recommendation(browser_name),
                    estimated_improvement=15.0,
                ))

    def _determine_priority(self, overhead_percent: float) -> OptimizationPriority:
        """Determine priority based on overhead percentage"""
        if overhead_percent > 50:
            return OptimizationPriority.CRITICAL
        elif overhead_percent > 25:
            return OptimizationPriority.HIGH
        elif overhead_percent > 10:
            return OptimizationPriority.MEDIUM
        else:
            return OptimizationPriority.LOW

    def _get_click_optimization_recommendation(self, browser_name: str, latency: float) -> str:
        """Get click-specific optimization recommendations"""
        recommendations = {
            "Chrome": "Click is already optimized. If still high, check: 1) Event handler overhead, 2) DOM mutation overhead, 3) Browser extensions affecting performance.",
            "Firefox": "Click latency in Firefox can be improved by: 1) Reducing event handler complexity, 2) Using pointer events instead of click, 3) Debouncing rapid clicks.",
            "Safari": "Safari specific: 1) Use passive event listeners, 2) Avoid synchronous DOM queries in click handlers, 3) Consider using touch events as primary input.",
            "Edge": "Similar to Chrome. Check event loop blocking and background tasks.",
            "Safari (iOS)": "iOS optimization: 1) Increase touch target size, 2) Use touch-action CSS, 3) Pre-focus input elements, 4) Consider custom gesture handling.",
            "Chrome (Android)": "Android optimization: 1) Handle low-end device performance, 2) Reduce JavaScript execution time, 3) Use Web Workers for heavy computations.",
        }
        return recommendations.get(browser_name, "Check JavaScript execution efficiency and DOM manipulation patterns.")

    def _get_type_optimization_recommendation(self, browser_name: str) -> str:
        """Get type-specific optimization recommendations"""
        recommendations = {
            "Chrome": "Type latency is acceptable. Monitor for edge cases with rapid consecutive keystrokes.",
            "Firefox": "Firefox may benefit from: 1) Input buffering, 2) Debouncing text input events, 3) Asynchronous processing of input validation.",
            "Safari": "Safari keyboard: 1) Use oninput instead of onchange, 2) Minimize reflows during input, 3) Cache computed styles.",
            "Edge": "Type optimization similar to Chrome.",
            "Safari (iOS)": "iOS keyboard is on-screen. Optimize by: 1) Pre-show keyboard early, 2) Use contenteditable carefully, 3) Minimize layout thrashing.",
            "Chrome (Android)": "Android keyboard varies. Use: 1) Composition events for IME, 2) Input method aware event handling, 3) Hardware keyboard support.",
        }
        return recommendations.get(browser_name, "Review input event handlers for efficiency.")

    def _get_screenshot_optimization_recommendation(self, browser_name: str, latency: float) -> str:
        """Get screenshot-specific optimization recommendations"""
        if latency > 150:
            priority = "Critical optimization needed"
        elif latency > 100:
            priority = "Moderate optimization recommended"
        else:
            priority = "Minor optimization possible"

        recommendations = {
            "Chrome": f"{priority}. Try: 1) Use CDP screenshotAsStream instead of full screenshot, 2) Reduce screenshot quality (JPEG compression 70%), 3) Implement incremental screenshots for viewport changes.",
            "Firefox": f"{priority}. Firefox screenshot slower than Chrome. Consider: 1) Canvas-based rendering capture, 2) Viewport clipping, 3) Async screenshot generation.",
            "Safari": f"{priority}. Safari has no native CDP. Implement: 1) Canvas rendering capture, 2) WebGL readPixels for H.264 fallback, 3) Consider screenshot frequency reduction.",
            "Edge": f"{priority}. Same as Chrome. Use CDP optimization.",
            "Safari (iOS)": f"{priority}. iOS constraints: 1) Reduce resolution, 2) Increase screenshot interval, 3) Implement viewport caching.",
            "Chrome (Android)": f"{priority}. Mobile optimization: 1) Reduce screenshot size, 2) Increase interval on low-end devices, 3) Implement GPU-accelerated rendering.",
        }
        return recommendations.get(browser_name, "Review screenshot capture method and parameters.")

    def _get_memory_optimization_recommendation(self, browser_name: str) -> str:
        """Get memory optimization recommendations"""
        return f"{browser_name} memory usage can be reduced by: 1) Implementing proper cleanup for event listeners, 2) Avoiding memory leaks in WebRTC connections, 3) Periodic garbage collection, 4) Limiting screenshot buffer size, 5) Using ImageBitmap for efficient image handling."

    def _get_cpu_optimization_recommendation(self, browser_name: str) -> str:
        """Get CPU optimization recommendations"""
        return f"{browser_name} CPU usage can be reduced by: 1) Reducing screenshot capture frequency, 2) Using Web Workers for heavy computations, 3) Implementing request throttling, 4) Optimizing event handlers, 5) Using requestIdleCallback for non-critical tasks."

    def get_optimization_summary(self) -> Dict[str, Any]:
        """Get summary of optimization opportunities"""
        if not self.opportunities:
            return {'status': 'All performance targets met!', 'opportunities': 0}

        by_priority = {}
        for opp in self.opportunities:
            priority = opp.priority.value
            if priority not in by_priority:
                by_priority[priority] = []
            by_priority[priority].append(opp)

        by_browser = {}
        for opp in self.opportunities:
            browser = opp.browser
            if browser not in by_browser:
                by_browser[browser] = []
            by_browser[browser].append(opp)

        return {
            'total_opportunities': len(self.opportunities),
            'by_priority': {k: len(v) for k, v in by_priority.items()},
            'by_browser': {k: len(v) for k, v in by_browser.items()},
            'critical_count': len(by_priority.get('Critical', [])),
            'high_count': len(by_priority.get('High', [])),
        }

    def export_to_json(self, filepath: str):
        """Export optimization opportunities to JSON"""
        data = {
            'summary': self.get_optimization_summary(),
            'opportunities': [opp.to_dict() for opp in self.opportunities]
        }

        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)

    def print_optimization_report(self):
        """Print optimization report"""
        if not self.opportunities:
            print("\n" + "="*80)
            print("PERFORMANCE OPTIMIZATION REPORT")
            print("="*80)
            print("\n✅ All performance targets are being met!")
            print("No optimizations needed at this time.\n")
            return

        print("\n" + "="*80)
        print("PERFORMANCE OPTIMIZATION REPORT")
        print("="*80)

        # Group by priority
        by_priority = {}
        for opp in self.opportunities:
            priority = opp.priority.value
            if priority not in by_priority:
                by_priority[priority] = []
            by_priority[priority].append(opp)

        priority_order = ['Critical', 'High', 'Medium', 'Low']

        for priority in priority_order:
            if priority not in by_priority:
                continue

            print(f"\n{priority.upper()} PRIORITY ({len(by_priority[priority])} issues)")
            print("-" * 80)

            for opp in by_priority[priority]:
                print(f"\n  {opp.browser}: {opp.issue}")
                print(f"    Current: {opp.current_value:.2f}, Target: {opp.target_value:.2f}")
                print(f"    Metric: {opp.metric}")
                print(f"    Estimated improvement: {opp.estimated_improvement}%")
                print(f"    Recommendation: {opp.recommendation}")

        print("\n" + "="*80)
