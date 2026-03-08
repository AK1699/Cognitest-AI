#!/usr/bin/env python3
"""
Load Testing Script for Remote Browser Streaming
Simulates concurrent users performing interactions
"""
import asyncio
import aiohttp
import time
import json
import random
import statistics
from typing import List, Dict, Any
from datetime import datetime


class LoadTestMetrics:
    """Track metrics from load test"""

    def __init__(self):
        self.success_count = 0
        self.failure_count = 0
        self.latencies: List[float] = []
        self.errors: List[str] = []
        self.start_time = None
        self.end_time = None

    def add_success(self, latency: float):
        """Record successful interaction"""
        self.success_count += 1
        self.latencies.append(latency)

    def add_failure(self, error: str):
        """Record failed interaction"""
        self.failure_count += 1
        self.errors.append(error)

    def get_statistics(self) -> Dict[str, Any]:
        """Get statistics"""
        total = self.success_count + self.failure_count
        success_rate = (self.success_count / total * 100) if total > 0 else 0

        if self.latencies:
            return {
                'total_interactions': total,
                'success_count': self.success_count,
                'failure_count': self.failure_count,
                'success_rate': success_rate,
                'avg_latency': statistics.mean(self.latencies),
                'min_latency': min(self.latencies),
                'max_latency': max(self.latencies),
                'p95_latency': self._percentile(self.latencies, 95),
                'p99_latency': self._percentile(self.latencies, 99),
                'errors': len(set(self.errors)),
            }
        else:
            return {
                'total_interactions': total,
                'success_count': self.success_count,
                'failure_count': self.failure_count,
                'success_rate': success_rate,
            }

    @staticmethod
    def _percentile(data: List[float], p: int) -> float:
        """Calculate percentile"""
        sorted_data = sorted(data)
        index = (p / 100) * (len(sorted_data) - 1)
        lower = int(index)
        upper = lower + 1

        if upper >= len(sorted_data):
            return sorted_data[lower]

        return sorted_data[lower] + (index - lower) * (sorted_data[upper] - sorted_data[lower])

    def print_report(self):
        """Print load test report"""
        stats = self.get_statistics()
        duration = (self.end_time - self.start_time) if self.start_time and self.end_time else 0

        print("\n" + "="*70)
        print("LOAD TEST REPORT")
        print("="*70)
        print(f"Test Duration:      {duration:.2f}s")
        print(f"Total Interactions: {stats['total_interactions']}")
        print(f"Successful:         {stats['success_count']} ({stats['success_rate']:.1f}%)")
        print(f"Failed:             {stats['failure_count']}")

        if stats['success_count'] > 0:
            print(f"\nLatency (ms):")
            print(f"  Avg:    {stats['avg_latency']*1000:.2f}ms")
            print(f"  Min:    {stats['min_latency']*1000:.2f}ms")
            print(f"  Max:    {stats['max_latency']*1000:.2f}ms")
            print(f"  P95:    {stats['p95_latency']*1000:.2f}ms")
            print(f"  P99:    {stats['p99_latency']*1000:.2f}ms")
            print(f"\nThroughput:         {stats['total_interactions']/duration:.0f} interactions/sec")

        if stats['errors'] > 0:
            print(f"\nUnique Errors:      {stats['errors']}")

        print("="*70 + "\n")

        return stats


class UserSimulator:
    """Simulate a user performing interactions"""

    def __init__(self, user_id: int, base_url: str = "http://localhost:8000"):
        self.user_id = user_id
        self.base_url = base_url
        self.execution_id = None
        self.metrics = LoadTestMetrics()
        self.session = None

    async def connect(self):
        """Create HTTP session"""
        self.session = aiohttp.ClientSession()

    async def disconnect(self):
        """Close HTTP session"""
        if self.session:
            await self.session.close()

    async def start_browser(self) -> bool:
        """Start browser for this user"""
        try:
            # This would normally call the API to start a browser
            # For load testing, we simulate this
            self.execution_id = f"run-{self.user_id}-{int(time.time()*1000)}"
            return True
        except Exception as e:
            print(f"User {self.user_id}: Failed to start browser: {e}")
            return False

    async def perform_interaction(self, interaction_type: str, data: dict = None) -> bool:
        """Perform a single interaction"""
        if not self.execution_id:
            return False

        try:
            start = time.perf_counter()

            # Simulate WebSocket interaction
            # In real test, this would connect to actual WebSocket
            await asyncio.sleep(random.uniform(0.01, 0.05))  # Simulate latency

            latency = time.perf_counter() - start
            self.metrics.add_success(latency)
            return True

        except Exception as e:
            self.metrics.add_failure(str(e))
            return False

    async def run_interaction_sequence(self, num_interactions: int = 10):
        """Run a sequence of interactions"""
        if not await self.start_browser():
            return False

        interaction_types = [
            ("click", {"x": random.randint(100, 1180), "y": random.randint(100, 620)}),
            ("type", {"text": random.choice(["hello", "test", "example", "data"])}),
            ("press", {"key": "Enter"}),
        ]

        for i in range(num_interactions):
            interaction_type, data = random.choice(interaction_types)
            await self.perform_interaction(interaction_type, data)
            await asyncio.sleep(random.uniform(0.1, 0.5))  # Think time

        return True


async def run_load_test(
    num_users: int,
    interactions_per_user: int,
    concurrent_groups: int = 1,
) -> LoadTestMetrics:
    """Run load test with specified parameters"""

    print("\n" + "="*70)
    print(f"LOAD TEST: {num_users} users × {interactions_per_user} interactions")
    print("="*70)

    # Create user simulators
    users = [UserSimulator(i) for i in range(num_users)]

    # Connect all users
    print(f"Connecting {num_users} users...")
    for user in users:
        await user.connect()

    start_time = time.time()

    # Run in concurrent groups to avoid overwhelming system
    group_size = num_users // concurrent_groups
    all_metrics = LoadTestMetrics()
    all_metrics.start_time = start_time

    for group_idx in range(concurrent_groups):
        print(f"\nRunning group {group_idx + 1}/{concurrent_groups}...")
        group_start = group_idx * group_size
        group_end = group_start + group_size if group_idx < concurrent_groups - 1 else num_users

        user_group = users[group_start:group_end]

        # Run all users in group concurrently
        tasks = [
            user.run_interaction_sequence(interactions_per_user)
            for user in user_group
        ]
        results = await asyncio.gather(*tasks)

        # Collect metrics
        for user in user_group:
            all_metrics.success_count += user.metrics.success_count
            all_metrics.failure_count += user.metrics.failure_count
            all_metrics.latencies.extend(user.metrics.latencies)
            all_metrics.errors.extend(user.metrics.errors)

    end_time = time.time()
    all_metrics.end_time = end_time

    # Disconnect all users
    print("Disconnecting users...")
    for user in users:
        await user.disconnect()

    return all_metrics


async def main():
    """Run load test scenarios"""

    print("\n" + "#"*70)
    print("# REMOTE BROWSER STREAMING - LOAD TEST")
    print("#"*70)

    scenarios = [
        {
            'name': 'Light Load',
            'users': 10,
            'interactions': 20,
            'description': '10 concurrent users, 20 interactions each'
        },
        {
            'name': 'Medium Load',
            'users': 50,
            'interactions': 20,
            'description': '50 concurrent users, 20 interactions each'
        },
        {
            'name': 'Heavy Load',
            'users': 100,
            'interactions': 20,
            'description': '100 concurrent users, 20 interactions each'
        },
    ]

    all_results = []

    for scenario in scenarios:
        print(f"\n\nScenario: {scenario['name']}")
        print(f"Description: {scenario['description']}")

        metrics = await run_load_test(
            num_users=scenario['users'],
            interactions_per_user=scenario['interactions'],
            concurrent_groups=5,  # Run in 5 groups to avoid overwhelming
        )

        stats = metrics.print_report()
        stats['scenario'] = scenario['name']
        all_results.append(stats)

        # Wait between scenarios
        await asyncio.sleep(2)

    # Print summary
    print("\n" + "#"*70)
    print("# SUMMARY")
    print("#"*70)

    for result in all_results:
        print(f"\n{result['scenario']}:")
        print(f"  Success Rate: {result['success_rate']:.1f}%")
        if 'avg_latency' in result:
            print(f"  Avg Latency:  {result['avg_latency']*1000:.2f}ms")
            print(f"  P95 Latency:  {result['p95_latency']*1000:.2f}ms")
            print(f"  P99 Latency:  {result['p99_latency']*1000:.2f}ms")

    print("\n" + "#"*70)


if __name__ == "__main__":
    asyncio.run(main())
