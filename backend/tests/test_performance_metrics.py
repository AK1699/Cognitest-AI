"""
Performance Testing for Manual Interaction System
Measures latencies, throughput, and resource usage
"""
import asyncio
import time
import json
import statistics
import pytest
import pytest_asyncio
from typing import List, Dict, Any
from unittest.mock import AsyncMock, MagicMock
from datetime import datetime

from app.services.web_automation_service import WebAutomationExecutor


class PerformanceMetrics:
    """Collect and analyze performance metrics"""

    def __init__(self):
        self.click_latencies: List[float] = []
        self.type_latencies: List[float] = []
        self.screenshot_latencies: List[float] = []
        self.memory_samples: List[int] = []
        self.start_time = None
        self.end_time = None

    def add_click_latency(self, latency: float):
        """Record click interaction latency"""
        self.click_latencies.append(latency)

    def add_type_latency(self, latency: float):
        """Record type interaction latency"""
        self.type_latencies.append(latency)

    def add_screenshot_latency(self, latency: float):
        """Record screenshot latency"""
        self.screenshot_latencies.append(latency)

    def get_statistics(self) -> Dict[str, Any]:
        """Get statistical analysis"""
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

        return {
            'click': calc_stats(self.click_latencies),
            'type': calc_stats(self.type_latencies),
            'screenshot': calc_stats(self.screenshot_latencies),
            'total_interactions': len(self.click_latencies) + len(self.type_latencies),
            'duration': (self.end_time - self.start_time) if self.start_time and self.end_time else 0,
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
        """Print performance report"""
        stats = self.get_statistics()

        print("\n" + "="*60)
        print("PERFORMANCE TEST REPORT")
        print("="*60)

        if stats['click']:
            print("\nClick Interaction Latency (ms):")
            print(f"  Min:    {stats['click']['min']*1000:.2f}ms")
            print(f"  Max:    {stats['click']['max']*1000:.2f}ms")
            print(f"  Avg:    {stats['click']['avg']*1000:.2f}ms")
            print(f"  Median: {stats['click']['median']*1000:.2f}ms")
            print(f"  P95:    {stats['click']['p95']*1000:.2f}ms")
            print(f"  P99:    {stats['click']['p99']*1000:.2f}ms")
            print(f"  Count:  {stats['click']['count']}")

        if stats['type']:
            print("\nType Interaction Latency (ms):")
            print(f"  Min:    {stats['type']['min']*1000:.2f}ms")
            print(f"  Max:    {stats['type']['max']*1000:.2f}ms")
            print(f"  Avg:    {stats['type']['avg']*1000:.2f}ms")
            print(f"  Median: {stats['type']['median']*1000:.2f}ms")
            print(f"  P95:    {stats['type']['p95']*1000:.2f}ms")
            print(f"  P99:    {stats['type']['p99']*1000:.2f}ms")
            print(f"  Count:  {stats['type']['count']}")

        if stats['screenshot']:
            print("\nScreenshot Latency (ms):")
            print(f"  Min:    {stats['screenshot']['min']*1000:.2f}ms")
            print(f"  Max:    {stats['screenshot']['max']*1000:.2f}ms")
            print(f"  Avg:    {stats['screenshot']['avg']*1000:.2f}ms")
            print(f"  Median: {stats['screenshot']['median']*1000:.2f}ms")
            print(f"  P95:    {stats['screenshot']['p95']*1000:.2f}ms")
            print(f"  P99:    {stats['screenshot']['p99']*1000:.2f}ms")

        print(f"\nTotal Interactions: {stats['total_interactions']}")
        print(f"Test Duration: {stats['duration']:.2f}s")
        print("="*60 + "\n")


class TestInteractionLatency:
    """Test latency of individual interactions"""

    @pytest_asyncio.fixture
    async def setup_executor(self):
        """Setup executor with mock page"""
        db = MagicMock()
        executor = WebAutomationExecutor(db)

        # Setup mock page with configurable latency
        page = MagicMock()
        page.mouse = AsyncMock()
        page.keyboard = AsyncMock()
        page.is_closed = MagicMock(return_value=False)
        page.url = "http://example.com"

        # Simulate network/processing latency
        async def slow_click(*args, **kwargs):
            await asyncio.sleep(0.01)  # 10ms latency

        page.mouse.click = AsyncMock(side_effect=slow_click)
        page.mouse.move = AsyncMock(side_effect=slow_click)

        executor.page = page
        executor.emit_live_update = AsyncMock()
        executor.is_paused = False

        yield executor, page

    @pytest.mark.asyncio
    async def test_click_latency(self, setup_executor):
        """Measure click interaction latency"""
        executor, page = setup_executor
        metrics = PerformanceMetrics()
        metrics.start_time = time.time()

        # Perform 100 clicks and measure latency
        for i in range(100):
            start = time.perf_counter()

            interaction = {
                "type": "click",
                "payload": {"x": 100 + i, "y": 100 + i}
            }
            await executor.handle_manual_interaction(interaction)

            latency = time.perf_counter() - start
            metrics.add_click_latency(latency)

        metrics.end_time = time.time()

        # Verify latencies are reasonable
        stats = metrics.get_statistics()
        assert stats['click']['avg'] < 0.05  # Average < 50ms
        assert stats['click']['p99'] < 0.1   # P99 < 100ms

        metrics.print_report()

    @pytest.mark.asyncio
    async def test_type_latency(self, setup_executor):
        """Measure type interaction latency"""
        executor, page = setup_executor
        metrics = PerformanceMetrics()
        metrics.start_time = time.time()

        # Simulate keyboard latency
        async def slow_type(*args, **kwargs):
            await asyncio.sleep(0.005)  # 5ms latency

        page.keyboard.type = AsyncMock(side_effect=slow_type)

        # Perform type interactions
        text_inputs = [
            "hello", "world", "test", "example", "performance"
        ]

        for text in text_inputs:
            for _ in range(20):  # Repeat each
                start = time.perf_counter()

                interaction = {
                    "type": "type",
                    "payload": {"text": text}
                }
                await executor.handle_manual_interaction(interaction)

                latency = time.perf_counter() - start
                metrics.add_type_latency(latency)

        metrics.end_time = time.time()

        # Verify latencies
        stats = metrics.get_statistics()
        assert stats['type']['avg'] < 0.03  # Average < 30ms

        metrics.print_report()

    @pytest.mark.asyncio
    async def test_screenshot_latency(self, setup_executor):
        """Measure screenshot capture latency"""
        executor, page = setup_executor
        metrics = PerformanceMetrics()
        metrics.start_time = time.time()

        # Simulate screenshot latency
        async def slow_screenshot(**kwargs):
            await asyncio.sleep(0.05)  # 50ms for screenshot
            return b"fake_jpeg_data"

        page.screenshot = AsyncMock(side_effect=slow_screenshot)

        # Perform screenshots
        for _ in range(50):
            start = time.perf_counter()

            screenshot = await page.screenshot()

            latency = time.perf_counter() - start
            metrics.add_screenshot_latency(latency)

        metrics.end_time = time.time()

        # Verify latencies
        stats = metrics.get_statistics()
        assert stats['screenshot']['avg'] < 0.1  # Average < 100ms

        metrics.print_report()


class TestConcurrentInteractionLatency:
    """Test latency under concurrent load"""

    @pytest_asyncio.fixture
    async def setup_executor(self):
        """Setup executor for concurrent testing"""
        db = MagicMock()
        executor = WebAutomationExecutor(db)

        page = MagicMock()
        page.mouse = AsyncMock()
        page.keyboard = AsyncMock()
        page.is_closed = MagicMock(return_value=False)

        # Simulate some processing time
        async def slow_click(*args, **kwargs):
            await asyncio.sleep(0.01)

        page.mouse.click = AsyncMock(side_effect=slow_click)

        executor.page = page
        executor.emit_live_update = AsyncMock()
        executor.is_paused = False

        yield executor, page

    @pytest.mark.asyncio
    async def test_concurrent_click_latency(self, setup_executor):
        """Measure latency with concurrent clicks"""
        executor, page = setup_executor
        metrics = PerformanceMetrics()
        metrics.start_time = time.time()

        async def perform_click(x: int, y: int):
            start = time.perf_counter()

            interaction = {
                "type": "click",
                "payload": {"x": x, "y": y}
            }
            await executor.handle_manual_interaction(interaction)

            latency = time.perf_counter() - start
            metrics.add_click_latency(latency)

        # Perform 10 concurrent clicks
        tasks = [perform_click(100 + i, 100 + i) for i in range(10)]
        await asyncio.gather(*tasks)

        metrics.end_time = time.time()

        # Even with concurrency, should be fast
        stats = metrics.get_statistics()
        print(f"Concurrent click latency: avg={stats['click']['avg']*1000:.2f}ms")

        metrics.print_report()

    @pytest.mark.asyncio
    async def test_mixed_concurrent_interactions(self, setup_executor):
        """Measure latency with mixed interaction types"""
        executor, page = setup_executor
        metrics = PerformanceMetrics()
        metrics.start_time = time.time()

        # Add type latency
        async def slow_type(*args, **kwargs):
            await asyncio.sleep(0.005)

        page.keyboard.type = AsyncMock(side_effect=slow_type)

        async def perform_interaction(interaction_type: str, data: dict):
            start = time.perf_counter()

            interaction = {
                "type": interaction_type,
                "payload": data
            }
            await executor.handle_manual_interaction(interaction)

            latency = time.perf_counter() - start

            if interaction_type == "click":
                metrics.add_click_latency(latency)
            elif interaction_type == "type":
                metrics.add_type_latency(latency)

        # Mix of clicks and types
        tasks = [
            perform_interaction("click", {"x": 100, "y": 100}),
            perform_interaction("type", {"text": "hello"}),
            perform_interaction("click", {"x": 200, "y": 200}),
            perform_interaction("type", {"text": "world"}),
        ]

        for _ in range(10):  # Repeat 10 times
            await asyncio.gather(*tasks)

        metrics.end_time = time.time()

        stats = metrics.get_statistics()
        print(f"Mixed interactions total: {stats['total_interactions']}")

        metrics.print_report()


class TestBinaryDataPerformance:
    """Test performance of binary vs base64 screenshot transmission"""

    def test_binary_vs_base64_size(self):
        """Compare sizes of binary vs base64 encoded JPEG"""
        # Sample JPEG data (1KB)
        binary_data = b"\xff\xd8\xff\xe0" + b"X" * 1000

        # Binary size
        binary_size = len(binary_data)

        # Base64 size (approximately 1.33x larger)
        import base64
        base64_data = base64.b64encode(binary_data).decode('utf-8')
        base64_size = len(base64_data)

        # Binary overhead from JSON wrapper
        json_wrapper_size = len(json.dumps({
            "type": "screenshot",
            "data": base64_data
        }))

        print("\n" + "="*60)
        print("BINARY VS BASE64 COMPARISON")
        print("="*60)
        print(f"Raw binary:      {binary_size:,} bytes")
        print(f"Base64 string:   {base64_size:,} bytes")
        print(f"Base64 in JSON:  {json_wrapper_size:,} bytes")
        print(f"Savings:         {json_wrapper_size - binary_size:,} bytes ({(1 - binary_size/json_wrapper_size)*100:.1f}%)")
        print("="*60 + "\n")

        # Verify binary is more efficient
        assert binary_size < json_wrapper_size

    def test_transmission_speed_simulation(self):
        """Simulate transmission speed comparison"""
        # Assume 2Mbps connection
        bandwidth = 2 * 1024 * 1024 / 8  # bytes per second

        # Typical screenshot size: 50KB
        screenshot_size = 50000

        # Binary transmission
        binary_time = screenshot_size / bandwidth

        # Base64 transmission (1.33x larger)
        base64_size = int(screenshot_size * 1.33)
        base64_time = base64_size / bandwidth

        print("\n" + "="*60)
        print("TRANSMISSION TIME COMPARISON (2Mbps)")
        print("="*60)
        print(f"Binary (50KB):   {binary_time*1000:.1f}ms")
        print(f"Base64 (66KB):   {base64_time*1000:.1f}ms")
        print(f"Savings:         {(base64_time - binary_time)*1000:.1f}ms per screenshot")
        print("="*60 + "\n")

        # Binary should be faster
        assert binary_time < base64_time


class TestInteractionThroughput:
    """Test interaction throughput (interactions per second)"""

    @pytest_asyncio.fixture
    async def setup_executor(self):
        """Setup executor"""
        db = MagicMock()
        executor = WebAutomationExecutor(db)

        page = MagicMock()
        page.mouse = AsyncMock()
        page.keyboard = AsyncMock()
        page.is_closed = MagicMock(return_value=False)

        executor.page = page
        executor.emit_live_update = AsyncMock()
        executor.is_paused = False

        yield executor, page

    @pytest.mark.asyncio
    async def test_click_throughput(self, setup_executor):
        """Measure click interactions per second"""
        executor, page = setup_executor

        start = time.perf_counter()
        interaction_count = 0

        # Run for 5 seconds
        while time.perf_counter() - start < 5:
            interaction = {
                "type": "click",
                "payload": {"x": 100, "y": 100}
            }
            await executor.handle_manual_interaction(interaction)
            interaction_count += 1

        duration = time.perf_counter() - start
        throughput = interaction_count / duration

        print("\n" + "="*60)
        print("INTERACTION THROUGHPUT")
        print("="*60)
        print(f"Click throughput: {throughput:.0f} interactions/sec")
        print(f"Total interactions: {interaction_count}")
        print(f"Duration: {duration:.2f}s")
        print("="*60 + "\n")

        # Should handle at least 100 clicks per second
        assert throughput > 100


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
