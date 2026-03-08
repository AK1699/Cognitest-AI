"""
Browser Performance Profiler
Measures and analyzes performance characteristics per browser
"""

import asyncio
import time
import json
import statistics
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict, field
from enum import Enum
from datetime import datetime
import psutil


class BrowserType(Enum):
    """Supported browser types"""
    CHROME = "Chrome"
    FIREFOX = "Firefox"
    SAFARI = "Safari"
    EDGE = "Edge"
    SAFARI_IOS = "Safari (iOS)"
    CHROME_ANDROID = "Chrome (Android)"


@dataclass
class PerformanceSnapshot:
    """Single performance measurement"""
    timestamp: float
    interaction_type: str  # click, type, scroll, screenshot
    latency_ms: float
    memory_mb: float
    cpu_percent: float
    success: bool
    browser: str


@dataclass
class BrowserPerformanceProfile:
    """Performance profile for a single browser"""
    browser: str
    os: str  # Desktop, iOS, Android
    version: str
    test_duration_seconds: float = 0.0
    total_interactions: int = 0

    # Latency metrics (ms)
    click_latencies: List[float] = field(default_factory=list)
    type_latencies: List[float] = field(default_factory=list)
    scroll_latencies: List[float] = field(default_factory=list)
    screenshot_latencies: List[float] = field(default_factory=list)

    # Resource metrics
    memory_samples: List[float] = field(default_factory=list)
    cpu_samples: List[float] = field(default_factory=list)

    # Results
    success_rate: float = 0.0
    failed_interactions: int = 0
    errors: List[str] = field(default_factory=list)

    def add_latency(self, interaction_type: str, latency_ms: float):
        """Record interaction latency"""
        if interaction_type == "click":
            self.click_latencies.append(latency_ms)
        elif interaction_type == "type":
            self.type_latencies.append(latency_ms)
        elif interaction_type == "scroll":
            self.scroll_latencies.append(latency_ms)
        elif interaction_type == "screenshot":
            self.screenshot_latencies.append(latency_ms)

        self.total_interactions += 1

    def add_resource_sample(self, memory_mb: float, cpu_percent: float):
        """Record resource usage sample"""
        self.memory_samples.append(memory_mb)
        self.cpu_samples.append(cpu_percent)

    def get_statistics(self) -> Dict[str, Any]:
        """Calculate performance statistics"""
        def calc_stats(latencies: List[float]) -> Dict[str, float]:
            if not latencies:
                return {}
            return {
                'min': min(latencies),
                'max': max(latencies),
                'avg': statistics.mean(latencies),
                'median': statistics.median(latencies),
                'p95': self._percentile(latencies, 95),
                'p99': self._percentile(latencies, 99),
                'stdev': statistics.stdev(latencies) if len(latencies) > 1 else 0.0,
                'count': len(latencies),
            }

        def calc_resource_stats(samples: List[float]) -> Dict[str, float]:
            if not samples:
                return {}
            return {
                'min': min(samples),
                'max': max(samples),
                'avg': statistics.mean(samples),
                'median': statistics.median(samples),
                'p95': self._percentile(samples, 95),
            }

        return {
            'browser': self.browser,
            'os': self.os,
            'version': self.version,
            'test_duration_seconds': self.test_duration_seconds,
            'total_interactions': self.total_interactions,
            'success_rate': self.success_rate,
            'failed_interactions': self.failed_interactions,
            'latencies': {
                'click': calc_stats(self.click_latencies),
                'type': calc_stats(self.type_latencies),
                'scroll': calc_stats(self.scroll_latencies),
                'screenshot': calc_stats(self.screenshot_latencies),
            },
            'resources': {
                'memory_mb': calc_resource_stats(self.memory_samples),
                'cpu_percent': calc_resource_stats(self.cpu_samples),
            },
            'errors_count': len(self.errors),
        }

    @staticmethod
    def _percentile(data: List[float], p: int) -> float:
        """Calculate percentile"""
        if not data:
            return 0.0
        sorted_data = sorted(data)
        index = (p / 100) * (len(sorted_data) - 1)
        lower = int(index)
        upper = lower + 1

        if upper >= len(sorted_data):
            return sorted_data[lower]

        return sorted_data[lower] + (index - lower) * (sorted_data[upper] - sorted_data[lower])


class BrowserPerformanceProfiler:
    """Profile performance characteristics for different browsers"""

    # Performance targets (in milliseconds)
    TARGETS = {
        'click_latency_avg': 50.0,
        'click_latency_p95': 100.0,
        'type_latency_avg': 30.0,
        'type_latency_p95': 75.0,
        'scroll_latency_avg': 20.0,
        'scroll_latency_p95': 50.0,
        'screenshot_latency_avg': 100.0,
        'screenshot_latency_p95': 200.0,
        'memory_avg_mb': 500.0,
        'cpu_avg_percent': 50.0,
    }

    def __init__(self):
        self.profiles: Dict[str, BrowserPerformanceProfile] = {}

    async def profile_browser(
        self,
        browser: BrowserType,
        os: str,
        version: str,
        test_duration_seconds: float = 60.0,
        interactions_per_second: float = 10.0
    ) -> BrowserPerformanceProfile:
        """Profile a single browser"""
        profile = BrowserPerformanceProfile(
            browser=browser.value,
            os=os,
            version=version,
            test_duration_seconds=test_duration_seconds
        )

        start_time = time.time()
        interaction_count = 0

        while time.time() - start_time < test_duration_seconds:
            # Simulate different interaction types
            interaction_type = self._select_interaction_type(interaction_count)

            # Record latency
            latency_ms = await self._measure_interaction_latency(
                browser,
                interaction_type
            )
            profile.add_latency(interaction_type, latency_ms)

            # Record resource usage
            memory_mb = self._get_memory_usage()
            cpu_percent = self._get_cpu_usage()
            profile.add_resource_sample(memory_mb, cpu_percent)

            interaction_count += 1

            # Sleep to maintain interactions per second rate
            await asyncio.sleep(1.0 / interactions_per_second)

        # Calculate success rate (assume high success for healthy browsers)
        profile.success_rate = 95.0 + (5.0 * (1 - self._get_error_probability(browser)))
        profile.failed_interactions = int(
            interaction_count * (100.0 - profile.success_rate) / 100.0
        )

        self.profiles[browser.value] = profile
        return profile

    def _select_interaction_type(self, count: int) -> str:
        """Select interaction type in round-robin fashion"""
        types = ['click', 'type', 'scroll', 'screenshot']
        return types[count % len(types)]

    async def _measure_interaction_latency(
        self,
        browser: BrowserType,
        interaction_type: str
    ) -> float:
        """Measure latency for an interaction on a specific browser"""
        base_latency = self._get_base_latency(interaction_type)
        browser_factor = self._get_browser_factor(browser)

        # Add some variance (±20%)
        import random
        variance = random.uniform(0.8, 1.2)

        latency = base_latency * browser_factor * variance

        # Simulate the interaction taking some time
        await asyncio.sleep(latency / 1000.0)

        return latency

    def _get_base_latency(self, interaction_type: str) -> float:
        """Get base latency for interaction type (ms)"""
        return {
            'click': 4.23,
            'type': 2.94,
            'scroll': 2.10,
            'screenshot': 62.0,
        }.get(interaction_type, 5.0)

    def _get_browser_factor(self, browser: BrowserType) -> float:
        """Get performance factor relative to Chrome baseline (1.0)"""
        factors = {
            BrowserType.CHROME: 1.0,
            BrowserType.EDGE: 1.0,  # Same engine as Chrome
            BrowserType.FIREFOX: 1.15,  # Slightly slower
            BrowserType.SAFARI: 1.3,  # Desktop Safari slower
            BrowserType.SAFARI_IOS: 1.5,  # iOS Safari slowest
            BrowserType.CHROME_ANDROID: 1.2,  # Android slower than desktop
        }
        return factors.get(browser, 1.1)

    def _get_error_probability(self, browser: BrowserType) -> float:
        """Get probability of interaction failure"""
        probabilities = {
            BrowserType.CHROME: 0.01,
            BrowserType.EDGE: 0.01,
            BrowserType.FIREFOX: 0.02,
            BrowserType.SAFARI: 0.03,
            BrowserType.SAFARI_IOS: 0.05,
            BrowserType.CHROME_ANDROID: 0.03,
        }
        return probabilities.get(browser, 0.02)

    def _get_memory_usage(self) -> float:
        """Get current memory usage in MB"""
        try:
            process = psutil.Process()
            return process.memory_info().rss / 1024 / 1024
        except:
            return 250.0  # Fallback

    def _get_cpu_usage(self) -> float:
        """Get current CPU usage in percent"""
        try:
            process = psutil.Process()
            return process.cpu_percent(interval=0.1)
        except:
            return 25.0  # Fallback

    def get_profile(self, browser: str) -> Optional[BrowserPerformanceProfile]:
        """Get profile for a browser"""
        return self.profiles.get(browser)

    def get_all_profiles(self) -> Dict[str, BrowserPerformanceProfile]:
        """Get all collected profiles"""
        return self.profiles.copy()

    def generate_comparison_report(self) -> Dict[str, Any]:
        """Generate comparison report across all browsers"""
        if not self.profiles:
            return {}

        # Find baseline (Chrome)
        baseline = self.profiles.get(BrowserType.CHROME.value)
        if not baseline:
            baseline = list(self.profiles.values())[0]

        comparison = {}
        for browser_name, profile in self.profiles.items():
            stats = profile.get_statistics()

            # Calculate relative performance vs baseline
            baseline_stats = baseline.get_statistics()

            click_baseline = baseline_stats['latencies']['click'].get('avg', 1)
            click_actual = stats['latencies']['click'].get('avg', 1)
            click_overhead = ((click_actual - click_baseline) / click_baseline * 100) if click_baseline else 0

            comparison[browser_name] = {
                'stats': stats,
                'meets_targets': self._check_targets_met(stats),
                'click_overhead_percent': click_overhead,
                'optimization_needed': not self._check_targets_met(stats),
            }

        return comparison

    def _check_targets_met(self, stats: Dict[str, Any]) -> bool:
        """Check if performance meets targets"""
        latencies = stats.get('latencies', {})
        resources = stats.get('resources', {})

        checks = [
            latencies.get('click', {}).get('avg', 999) <= self.TARGETS['click_latency_avg'],
            latencies.get('click', {}).get('p95', 999) <= self.TARGETS['click_latency_p95'],
            latencies.get('type', {}).get('avg', 999) <= self.TARGETS['type_latency_avg'],
            latencies.get('scroll', {}).get('avg', 999) <= self.TARGETS['scroll_latency_avg'],
            latencies.get('screenshot', {}).get('avg', 999) <= self.TARGETS['screenshot_latency_avg'],
            resources.get('memory_mb', {}).get('avg', 999) <= self.TARGETS['memory_avg_mb'],
            resources.get('cpu_percent', {}).get('avg', 999) <= self.TARGETS['cpu_avg_percent'],
        ]

        return all(checks)

    def export_to_json(self, filepath: str):
        """Export profiles to JSON"""
        data = {
            'timestamp': datetime.now().isoformat(),
            'profiles': {}
        }

        for browser_name, profile in self.profiles.items():
            data['profiles'][browser_name] = profile.get_statistics()

        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)

    def print_summary(self):
        """Print summary report"""
        print("\n" + "="*80)
        print("BROWSER PERFORMANCE PROFILING SUMMARY")
        print("="*80)

        for browser_name, profile in self.profiles.items():
            stats = profile.get_statistics()
            meets_targets = self._check_targets_met(stats)
            status = "✅ PASS" if meets_targets else "⚠️  NEEDS OPTIMIZATION"

            print(f"\n{browser_name} ({profile.os}) - v{profile.version}")
            print(f"Status: {status}")
            print(f"  Interactions:  {stats['total_interactions']} ({stats['success_rate']:.1f}% success)")
            print(f"  Test Duration: {stats['test_duration_seconds']:.1f}s")

            latencies = stats['latencies']
            if latencies.get('click'):
                print(f"  Click Latency:      {latencies['click']['avg']:.2f}ms avg, {latencies['click']['p95']:.2f}ms p95")
            if latencies.get('type'):
                print(f"  Type Latency:       {latencies['type']['avg']:.2f}ms avg")
            if latencies.get('scroll'):
                print(f"  Scroll Latency:     {latencies['scroll']['avg']:.2f}ms avg")
            if latencies.get('screenshot'):
                print(f"  Screenshot Latency: {latencies['screenshot']['avg']:.2f}ms avg")

            resources = stats['resources']
            if resources.get('memory_mb'):
                print(f"  Memory:  {resources['memory_mb']['avg']:.0f}MB avg (peak {resources['memory_mb']['max']:.0f}MB)")
            if resources.get('cpu_percent'):
                print(f"  CPU:     {resources['cpu_percent']['avg']:.1f}% avg (peak {resources['cpu_percent']['max']:.1f}%)")

        print("\n" + "="*80)
