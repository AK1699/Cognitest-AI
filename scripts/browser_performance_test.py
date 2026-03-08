#!/usr/bin/env python3
"""
Browser Performance Testing Script
Profiles performance across all supported browsers and generates optimization report
"""

import asyncio
import sys
import json
from pathlib import Path
from datetime import datetime

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'backend'))

from app.services.browser_performance_profiler import (
    BrowserPerformanceProfiler,
    BrowserType
)
from app.services.performance_optimizer import PerformanceOptimizer


class BrowserPerformanceTester:
    """Run performance tests across all browsers"""

    # Browser configurations
    BROWSERS = [
        {
            'type': BrowserType.CHROME,
            'os': 'Desktop',
            'version': '120.0.0'
        },
        {
            'type': BrowserType.FIREFOX,
            'os': 'Desktop',
            'version': '121.0'
        },
        {
            'type': BrowserType.SAFARI,
            'os': 'macOS',
            'version': '17.2'
        },
        {
            'type': BrowserType.EDGE,
            'os': 'Desktop',
            'version': '120.0.0'
        },
        {
            'type': BrowserType.SAFARI_IOS,
            'os': 'iOS',
            'version': '17.2'
        },
        {
            'type': BrowserType.CHROME_ANDROID,
            'os': 'Android',
            'version': '120.0.0'
        }
    ]

    def __init__(self, test_duration: float = 30.0):
        """Initialize performance tester"""
        self.test_duration = test_duration
        self.profiler = BrowserPerformanceProfiler()
        self.optimizer = PerformanceOptimizer()

    async def run_all_tests(self) -> Dict:
        """Run performance tests for all browsers"""
        print("\n" + "="*80)
        print("BROWSER PERFORMANCE TESTING")
        print("="*80)
        print(f"Test Duration: {self.test_duration}s per browser")
        print(f"Browsers to test: {len(self.BROWSERS)}")
        print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*80)

        for i, browser_config in enumerate(self.BROWSERS, 1):
            browser_type = browser_config['type']
            os_name = browser_config['os']
            version = browser_config['version']

            print(f"\n[{i}/{len(self.BROWSERS)}] Testing {browser_type.value} ({os_name}) v{version}...", end=' ', flush=True)

            try:
                profile = await self.profiler.profile_browser(
                    browser=browser_type,
                    os=os_name,
                    version=version,
                    test_duration_seconds=self.test_duration,
                    interactions_per_second=10.0
                )
                print("✅ Complete")
            except Exception as e:
                print(f"❌ Error: {str(e)}")

        print("\n" + "="*80)
        print("Performance profiling complete!")
        print("="*80)

        # Generate reports
        self._generate_reports()

    def _generate_reports(self):
        """Generate performance and optimization reports"""
        print("\nGenerating reports...")

        # Print profiler summary
        self.profiler.print_summary()

        # Analyze results and generate optimization recommendations
        profiles = {
            name: profile.get_statistics()
            for name, profile in self.profiler.get_all_profiles().items()
        }

        optimization_ops = self.optimizer.analyze_profiles(
            profiles,
            self.profiler.TARGETS
        )

        print(f"\nFound {len(optimization_ops)} optimization opportunities")

        # Print optimizer summary
        self.optimizer.print_optimization_report()

        # Export to JSON files
        self._export_results(profiles)

    def _export_results(self, profiles: Dict):
        """Export results to JSON files"""
        results_dir = Path(__file__).parent.parent / 'reports' / 'wave_3_phase_2'
        results_dir.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

        # Export performance profiles
        profiles_file = results_dir / f'performance_profiles_{timestamp}.json'
        self.profiler.export_to_json(str(profiles_file))
        print(f"\n✅ Performance profiles exported to: {profiles_file}")

        # Export optimization report
        optimizations_file = results_dir / f'optimizations_{timestamp}.json'
        self.optimizer.export_to_json(str(optimizations_file))
        print(f"✅ Optimization report exported to: {optimizations_file}")

        # Create summary report
        summary_file = results_dir / f'summary_{timestamp}.json'
        summary = {
            'test_date': datetime.now().isoformat(),
            'test_duration_seconds': self.test_duration,
            'browsers_tested': len(self.BROWSERS),
            'performance_summary': self.profiler.generate_comparison_report(),
            'optimization_summary': self.optimizer.get_optimization_summary(),
        }

        with open(summary_file, 'w') as f:
            json.dump(summary, f, indent=2)
        print(f"✅ Summary report exported to: {summary_file}")

        print(f"\nAll reports saved to: {results_dir}")


async def main():
    """Main entry point"""
    # Parse command line arguments
    test_duration = 30.0  # Default 30 seconds per browser
    if len(sys.argv) > 1:
        try:
            test_duration = float(sys.argv[1])
        except ValueError:
            print(f"Invalid test duration: {sys.argv[1]}")
            print("Usage: python browser_performance_test.py [duration_seconds]")
            sys.exit(1)

    # Run tests
    tester = BrowserPerformanceTester(test_duration=test_duration)
    await tester.run_all_tests()

    print("\n✅ Browser performance testing complete!")


if __name__ == '__main__':
    asyncio.run(main())
