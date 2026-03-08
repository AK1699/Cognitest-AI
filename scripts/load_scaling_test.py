#!/usr/bin/env python3
"""
Load Scaling Test Script
Tests system performance under concurrent load (10, 50, 100, 500, 1000 users)
Validates capacity limits and identifies bottlenecks
"""

import asyncio
import sys
import json
from pathlib import Path
from datetime import datetime

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'backend'))

from app.services.load_scaling_validator import (
    LoadScalingValidator,
    LoadLevel
)


class LoadScalingTestRunner:
    """Run load scaling tests at multiple concurrency levels"""

    # Test configuration
    LOAD_LEVELS = [
        (LoadLevel.LIGHT.value, "Light Load (Baseline verification)"),
        (LoadLevel.MEDIUM.value, "Medium Load (Standard operation)"),
        (LoadLevel.HEAVY.value, "Heavy Load (Peak expected)"),
        (LoadLevel.STRESS.value, "Stress Test (Above normal)"),
        (LoadLevel.CAPACITY.value, "Capacity Test (Maximum limit)"),
    ]

    def __init__(self, test_duration: float = 60.0, quick_mode: bool = False):
        """Initialize load scaling tester"""
        self.test_duration = test_duration
        self.quick_mode = quick_mode
        self.validator = LoadScalingValidator()

    async def run_all_tests(self) -> Dict:
        """Run load tests at all concurrency levels"""
        print("\n" + "="*80)
        print("LOAD SCALING TEST SUITE")
        print("="*80)
        print(f"Test Duration: {self.test_duration}s per load level")
        print(f"Load Levels: {len(self.LOAD_LEVELS)}")
        print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

        if self.quick_mode:
            print("Quick Mode: Testing selected load levels only")
            load_levels = self.LOAD_LEVELS[:3]  # Only 10, 50, 100
        else:
            load_levels = self.LOAD_LEVELS

        print("="*80)

        for i, (concurrent_users, description) in enumerate(load_levels, 1):
            print(f"\n[{i}/{len(load_levels)}] {description}...", end=' ', flush=True)

            try:
                result = await self.validator.run_load_test(
                    concurrent_users=concurrent_users,
                    duration_seconds=self.test_duration,
                    interactions_per_user_per_sec=10.0
                )
                print("✅ Complete")
            except Exception as e:
                print(f"❌ Error: {str(e)}")

        print("\n" + "="*80)
        print("Load scaling tests complete!")
        print("="*80)

        # Generate reports
        self._generate_reports()

    def _generate_reports(self):
        """Generate load scaling reports"""
        print("\nGenerating reports...")

        # Print validator summary
        self.validator.print_summary()

        # Analyze results
        analysis = self.validator.analyze_results()

        print(f"\nAnalysis complete - {len(self.validator.results)} load levels tested")

        # Export to JSON files
        self._export_results()

    def _export_results(self):
        """Export results to JSON files"""
        results_dir = Path(__file__).parent.parent / 'reports' / 'wave_3_phase_3'
        results_dir.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

        # Export load scaling results
        results_file = results_dir / f'load_scaling_results_{timestamp}.json'
        self.validator.export_to_json(str(results_file))
        print(f"\n✅ Load scaling results exported to: {results_file}")

        # Create detailed report
        report_file = results_dir / f'load_scaling_report_{timestamp}.json'
        report = {
            'test_date': datetime.now().isoformat(),
            'test_duration_seconds': self.test_duration,
            'load_levels_tested': len(self.validator.results),
            'quick_mode': self.quick_mode,
            'results_summary': {}
        }

        for concurrent_users, result in sorted(self.validator.results.items()):
            meets_criteria, checks = self.validator.check_criteria(concurrent_users)
            report['results_summary'][concurrent_users] = {
                'status': 'PASS' if meets_criteria else 'FAIL',
                'success_rate': result.success_rate,
                'failed_interactions': result.failed_interactions,
                'meets_criteria': meets_criteria,
                'criteria_checks': checks
            }

        # Add analysis
        report['analysis'] = self.validator.analyze_results()

        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
        print(f"✅ Load scaling report exported to: {report_file}")

        print(f"\nAll reports saved to: {results_dir}")


async def main():
    """Main entry point"""
    # Parse command line arguments
    quick_mode = '--quick' in sys.argv
    test_duration = 60.0  # Default 60 seconds per load level

    if len(sys.argv) > 1 and sys.argv[1] not in ['--quick', '--help']:
        try:
            test_duration = float(sys.argv[1])
        except ValueError:
            print("Usage: python load_scaling_test.py [duration_seconds] [--quick]")
            print("  duration_seconds: Test duration per load level (default: 60)")
            print("  --quick: Test only light, medium, heavy loads (skip stress/capacity)")
            sys.exit(1)

    if '--help' in sys.argv:
        print("Load Scaling Test Suite")
        print("Usage: python load_scaling_test.py [duration_seconds] [--quick]")
        print("\nLoad Levels:")
        print("  Light:    10 concurrent users (baseline)")
        print("  Medium:   50 concurrent users (standard)")
        print("  Heavy:   100 concurrent users (peak)")
        print("  Stress:  500 concurrent users (stress test)")
        print("  Capacity: 1000 concurrent users (capacity test)")
        print("\nOptions:")
        print("  --quick: Test only light, medium, heavy loads")
        print("  --help: Show this help message")
        print("\nExample:")
        print("  python load_scaling_test.py 30      # 30s per load level")
        print("  python load_scaling_test.py 60 --quick  # 60s, quick mode")
        sys.exit(0)

    # Run tests
    runner = LoadScalingTestRunner(test_duration=test_duration, quick_mode=quick_mode)
    await runner.run_all_tests()

    print("\n✅ Load scaling testing complete!")


if __name__ == '__main__':
    asyncio.run(main())
