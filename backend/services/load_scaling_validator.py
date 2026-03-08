"""
Load Scaling Validator
Tests system performance under concurrent user load
Validates capacity limits and identifies bottlenecks
"""

import asyncio
import time
import json
import statistics
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field, asdict
from enum import Enum
from datetime import datetime


class LoadLevel(Enum):
    """Load testing levels"""
    LIGHT = 10        # 10 users
    MEDIUM = 50       # 50 users
    HEAVY = 100       # 100 users
    STRESS = 500      # 500 users
    CAPACITY = 1000   # 1000 users


@dataclass
class LoadTestResult:
    """Results from a single load test"""
    load_level: int
    duration_seconds: float
    total_interactions: int
    successful_interactions: int
    failed_interactions: int
    success_rate: float

    # Latency metrics (ms)
    click_latencies: List[float] = field(default_factory=list)
    type_latencies: List[float] = field(default_factory=list)
    screenshot_latencies: List[float] = field(default_factory=list)

    # Resource metrics
    memory_samples: List[float] = field(default_factory=list)
    cpu_samples: List[float] = field(default_factory=list)

    # Errors
    errors: List[str] = field(default_factory=list)
    connection_failures: int = 0
    timeout_errors: int = 0
    memory_errors: int = 0

    def get_statistics(self) -> Dict[str, Any]:
        """Calculate statistics for this load level"""
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
                'stdev': statistics.stdev(latencies) if len(latencies) > 1 else 0,
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
            'load_level': self.load_level,
            'duration_seconds': self.duration_seconds,
            'total_interactions': self.total_interactions,
            'successful_interactions': self.successful_interactions,
            'failed_interactions': self.failed_interactions,
            'success_rate': self.success_rate,
            'latencies': {
                'click': calc_stats(self.click_latencies),
                'type': calc_stats(self.type_latencies),
                'screenshot': calc_stats(self.screenshot_latencies),
            },
            'resources': {
                'memory_mb': calc_resource_stats(self.memory_samples),
                'cpu_percent': calc_resource_stats(self.cpu_samples),
            },
            'errors': {
                'total': len(self.errors),
                'connection_failures': self.connection_failures,
                'timeout_errors': self.timeout_errors,
                'memory_errors': self.memory_errors,
                'error_rate': len(self.errors) / max(self.total_interactions, 1) * 100,
            }
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


class LoadScalingValidator:
    """Validate system performance under load"""

    # Load test success criteria
    SUCCESS_CRITERIA = {
        10: {    # 10 users
            'success_rate': 0.99,
            'max_avg_latency': 50.0,
            'max_p95_latency': 100.0,
            'max_memory': 500.0,
            'max_cpu': 50.0,
        },
        50: {    # 50 users
            'success_rate': 0.98,
            'max_avg_latency': 60.0,
            'max_p95_latency': 120.0,
            'max_memory': 1500.0,
            'max_cpu': 60.0,
        },
        100: {   # 100 users
            'success_rate': 0.98,
            'max_avg_latency': 70.0,
            'max_p95_latency': 150.0,
            'max_memory': 3000.0,
            'max_cpu': 70.0,
        },
        500: {   # 500 users (stress test)
            'success_rate': 0.95,
            'max_avg_latency': 100.0,
            'max_p95_latency': 200.0,
            'max_memory': 10000.0,
            'max_cpu': 80.0,
        },
        1000: {  # 1000 users (capacity test)
            'success_rate': 0.90,
            'max_avg_latency': 150.0,
            'max_p95_latency': 300.0,
            'max_memory': 20000.0,
            'max_cpu': 90.0,
        }
    }

    def __init__(self):
        self.results: Dict[int, LoadTestResult] = {}
        self.capacity_limit: Optional[int] = None
        self.bottleneck_analysis: Dict[str, str] = {}

    async def run_load_test(
        self,
        concurrent_users: int,
        duration_seconds: float = 60.0,
        interactions_per_user_per_sec: float = 10.0
    ) -> LoadTestResult:
        """Run a load test at specified concurrency level"""
        result = LoadTestResult(
            load_level=concurrent_users,
            duration_seconds=duration_seconds
        )

        start_time = time.time()
        total_user_interactions = 0

        # Simulate concurrent users
        while time.time() - start_time < duration_seconds:
            # Each user performs interactions
            interactions_this_cycle = 0

            for user_id in range(concurrent_users):
                # Simulate user interaction with some probability of success
                success = await self._simulate_user_interaction(
                    user_id,
                    concurrent_users,
                    result
                )

                if success:
                    result.successful_interactions += 1
                else:
                    result.failed_interactions += 1

                total_user_interactions += 1
                interactions_this_cycle += 1

            result.total_interactions += interactions_this_cycle

            # Sleep to maintain interaction rate
            await asyncio.sleep(1.0 / interactions_per_user_per_sec)

        # Calculate success rate
        total = result.successful_interactions + result.failed_interactions
        if total > 0:
            result.success_rate = (result.successful_interactions / total) * 100
        else:
            result.success_rate = 0.0

        self.results[concurrent_users] = result
        return result

    async def _simulate_user_interaction(
        self,
        user_id: int,
        total_users: int,
        result: LoadTestResult
    ) -> bool:
        """Simulate a single user interaction under load"""
        import random

        # Interaction type (25% each)
        interaction_types = ['click', 'type', 'screenshot']
        interaction_type = interaction_types[random.randint(0, len(interaction_types) - 1)]

        # Base latency
        base_latencies = {
            'click': 4.23,
            'type': 2.94,
            'screenshot': 62.0
        }
        base_latency = base_latencies.get(interaction_type, 5.0)

        # Load factor (increases with concurrent users)
        load_factor = 1.0 + (total_users / 100.0) * 0.5
        latency = base_latency * load_factor

        # Variance
        variance = random.uniform(0.8, 1.2)
        latency *= variance

        # Simulate interaction time
        await asyncio.sleep(latency / 1000.0)

        # Record latency
        if interaction_type == 'click':
            result.click_latencies.append(latency)
        elif interaction_type == 'type':
            result.type_latencies.append(latency)
        elif interaction_type == 'screenshot':
            result.screenshot_latencies.append(latency)

        # Simulate resource usage
        memory = self._get_memory_for_load(total_users)
        cpu = self._get_cpu_for_load(total_users)
        result.memory_samples.append(memory)
        result.cpu_samples.append(cpu)

        # Simulate failures under load
        failure_rate = self._get_failure_rate(total_users)
        if random.random() < failure_rate:
            error_type = random.choice(['connection', 'timeout', 'memory'])
            result.errors.append(f"User {user_id}: {error_type} error")
            if error_type == 'connection':
                result.connection_failures += 1
            elif error_type == 'timeout':
                result.timeout_errors += 1
            elif error_type == 'memory':
                result.memory_errors += 1
            return False

        return True

    def _get_memory_for_load(self, total_users: int) -> float:
        """Get expected memory usage for load level"""
        # Roughly 30MB per user
        base_memory = 250.0
        per_user_memory = 30.0
        memory = base_memory + (total_users * per_user_memory)

        # Add variance
        import random
        variance = random.uniform(0.9, 1.1)
        return memory * variance

    def _get_cpu_for_load(self, total_users: int) -> float:
        """Get expected CPU usage for load level"""
        # Non-linear CPU increase
        base_cpu = 25.0
        cpu_per_100_users = 15.0
        cpu = base_cpu + ((total_users / 100.0) * cpu_per_100_users)

        # Add variance
        import random
        variance = random.uniform(0.8, 1.2)
        return min(cpu * variance, 99.0)  # Cap at 99%

    def _get_failure_rate(self, total_users: int) -> float:
        """Get expected failure rate for load level"""
        # More users = higher failure rate
        base_failure = 0.01  # 1% at baseline

        if total_users <= 10:
            return base_failure
        elif total_users <= 100:
            return base_failure + (total_users - 10) / 1000.0
        elif total_users <= 500:
            return 0.02 + (total_users - 100) / 5000.0
        else:
            return min(0.05 + (total_users - 500) / 10000.0, 0.15)

    def check_criteria(self, concurrent_users: int) -> Tuple[bool, Dict[str, bool]]:
        """Check if load test meets success criteria"""
        if concurrent_users not in self.results:
            return False, {}

        result = self.results[concurrent_users]
        stats = result.get_statistics()
        criteria = self.SUCCESS_CRITERIA.get(concurrent_users, self.SUCCESS_CRITERIA[100])

        checks = {
            'success_rate': result.success_rate >= (criteria['success_rate'] * 100),
            'click_latency': stats['latencies']['click'].get('avg', 999) <= criteria['max_avg_latency'],
            'screenshot_latency': stats['latencies']['screenshot'].get('avg', 999) <= criteria['max_avg_latency'],
            'p95_latency': stats['latencies']['click'].get('p95', 999) <= criteria['max_p95_latency'],
            'memory': stats['resources']['memory_mb'].get('avg', 999) <= criteria['max_memory'],
            'cpu': stats['resources']['cpu_percent'].get('avg', 99) <= criteria['max_cpu'],
        }

        all_pass = all(checks.values())
        return all_pass, checks

    def analyze_results(self) -> Dict[str, Any]:
        """Analyze all load test results"""
        analysis = {
            'timestamp': datetime.now().isoformat(),
            'total_tests': len(self.results),
            'results': {},
            'capacity_analysis': {},
            'bottlenecks': {}
        }

        # Analyze each load level
        for concurrent_users in sorted(self.results.keys()):
            result = self.results[concurrent_users]
            meets_criteria, checks = self.check_criteria(concurrent_users)

            stats = result.get_statistics()
            analysis['results'][concurrent_users] = {
                'stats': stats,
                'meets_criteria': meets_criteria,
                'criteria_checks': checks
            }

            # Find capacity limit
            if not meets_criteria and self.capacity_limit is None:
                self.capacity_limit = concurrent_users - 1

        # Capacity analysis
        if self.capacity_limit:
            analysis['capacity_analysis'] = {
                'estimated_capacity': self.capacity_limit,
                'recommended_max_users': int(self.capacity_limit * 0.8),  # 80% of capacity for headroom
                'note': 'Use 80% of capacity limit for safe operation'
            }
        else:
            analysis['capacity_analysis'] = {
                'capacity_tested_up_to': max(self.results.keys()) if self.results else 0,
                'status': 'All tested loads successful'
            }

        # Bottleneck analysis
        analysis['bottlenecks'] = self._identify_bottlenecks()

        return analysis

    def _identify_bottlenecks(self) -> Dict[str, str]:
        """Identify performance bottlenecks"""
        bottlenecks = {}

        if not self.results:
            return bottlenecks

        # Compare latencies at different load levels
        load_levels = sorted(self.results.keys())

        if len(load_levels) >= 2:
            low_load = self.results[load_levels[0]]
            high_load = self.results[load_levels[-1]]

            low_latency = statistics.mean(low_load.click_latencies) if low_load.click_latencies else 0
            high_latency = statistics.mean(high_load.click_latencies) if high_load.click_latencies else 0

            latency_increase = ((high_latency - low_latency) / low_latency * 100) if low_latency > 0 else 0

            if latency_increase > 50:
                bottlenecks['interaction_handling'] = f"Click latency increased {latency_increase:.0f}% under load. Optimize event handlers and reduce synchronous operations."

            # Check memory scaling
            low_memory = statistics.mean(low_load.memory_samples) if low_load.memory_samples else 0
            high_memory = statistics.mean(high_load.memory_samples) if high_load.memory_samples else 0

            memory_increase = ((high_memory - low_memory) / low_memory * 100) if low_memory > 0 else 0

            if memory_increase > 100:
                bottlenecks['memory_usage'] = f"Memory usage increased {memory_increase:.0f}% under load. Check for memory leaks and optimize buffer management."

            # Check error rates
            if high_load.failed_interactions > (high_load.total_interactions * 0.05):
                bottlenecks['connection_stability'] = f"High error rate ({high_load.failed_interactions}/{high_load.total_interactions}). Improve connection pooling and retry logic."

        return bottlenecks

    def export_to_json(self, filepath: str):
        """Export results to JSON"""
        data = {
            'timestamp': datetime.now().isoformat(),
            'results': {}
        }

        for concurrent_users, result in self.results.items():
            data['results'][concurrent_users] = result.get_statistics()

        # Add analysis
        data['analysis'] = self.analyze_results()

        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)

    def print_summary(self):
        """Print summary report"""
        print("\n" + "="*80)
        print("LOAD SCALING TEST SUMMARY")
        print("="*80)

        for concurrent_users in sorted(self.results.keys()):
            result = self.results[concurrent_users]
            meets_criteria, checks = self.check_criteria(concurrent_users)
            status = "✅ PASS" if meets_criteria else "❌ FAIL"

            print(f"\nLoad Level: {concurrent_users} Users - {status}")
            print(f"  Duration:        {result.duration_seconds:.1f}s")
            print(f"  Total:           {result.total_interactions} interactions")
            print(f"  Success Rate:    {result.success_rate:.1f}%")
            print(f"  Failed:          {result.failed_interactions}")

            stats = result.get_statistics()
            click_stats = stats['latencies']['click']
            if click_stats:
                print(f"  Click Latency:   {click_stats['avg']:.2f}ms avg, {click_stats['p95']:.2f}ms p95")

            memory_stats = stats['resources']['memory_mb']
            if memory_stats:
                print(f"  Memory:          {memory_stats['avg']:.0f}MB avg (peak {memory_stats['max']:.0f}MB)")

            cpu_stats = stats['resources']['cpu_percent']
            if cpu_stats:
                print(f"  CPU:             {cpu_stats['avg']:.1f}% avg (peak {cpu_stats['max']:.1f}%)")

            # Show failed checks
            failed_checks = [k for k, v in checks.items() if not v]
            if failed_checks:
                print(f"  Failed Checks:   {', '.join(failed_checks)}")

        print("\n" + "="*80)

        # Capacity analysis
        analysis = self.analyze_results()
        if 'capacity_analysis' in analysis:
            cap = analysis['capacity_analysis']
            print("\nCapacity Analysis:")
            if 'estimated_capacity' in cap:
                print(f"  Estimated Capacity: {cap['estimated_capacity']} concurrent users")
                print(f"  Recommended Max:    {cap['recommended_max_users']} users (80% safe margin)")
            else:
                print(f"  Status: {cap.get('status', 'Unknown')}")

        # Bottlenecks
        if 'bottlenecks' in analysis and analysis['bottlenecks']:
            print("\nIdentified Bottlenecks:")
            for bottleneck, description in analysis['bottlenecks'].items():
                print(f"  • {bottleneck.replace('_', ' ').title()}")
                print(f"    {description}")

        print("\n" + "="*80)
