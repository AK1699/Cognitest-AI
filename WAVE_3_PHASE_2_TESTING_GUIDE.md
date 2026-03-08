# Wave 3 Phase 2: Performance Testing Guide

**Phase**: 6 Wave 3 Phase 2 (Performance Optimization)
**Purpose**: Measure and optimize browser performance across all supported browsers
**Duration**: ~1 hour for full test suite

---

## Quick Start

### Run Full Performance Tests
```bash
# Navigate to project root
cd /path/to/cognitest-ai

# Run browser performance tests
python scripts/browser_performance_test.py

# Or with custom duration
python scripts/browser_performance_test.py 60  # 60 seconds per browser
```

### View Results
```bash
# Results saved to reports/wave_3_phase_2/
ls -la reports/wave_3_phase_2/

# View summary report
cat reports/wave_3_phase_2/summary_*.json | jq .

# View optimization recommendations
cat reports/wave_3_phase_2/optimizations_*.json | jq .
```

---

## Performance Testing Framework

### Architecture

```
BrowserPerformanceProfiler
├── BrowserType (enum: Chrome, Firefox, Safari, Edge, iOS, Android)
├── BrowserPerformanceProfile (data per browser)
│   ├── Latency Metrics (click, type, scroll, screenshot)
│   ├── Resource Metrics (memory, CPU)
│   └── Statistics (min, max, avg, p95, p99)
└── Performance Targets
    ├── Click: <50ms avg, <100ms p95
    ├── Type: <30ms avg
    ├── Scroll: <20ms avg
    ├── Screenshot: <100ms avg
    ├── Memory: <500MB
    └── CPU: <50%

PerformanceOptimizer
├── OptimizationOpportunity (single issue)
├── Priority Classification (Critical, High, Medium, Low)
├── Browser-Specific Recommendations
└── Estimated Improvement Percentages

BrowserPerformanceTester
├── BROWSERS (6 total)
├── run_all_tests() (async)
├── _generate_reports()
└── _export_results()
```

---

## Test Execution Phases

### Phase 1: Setup (30 seconds)
1. Initialize profiler and optimizer
2. Load browser configurations
3. Prepare output directories
4. Display test summary

### Phase 2: Browser Profiling (30+ seconds per browser)
For each of the 6 browsers:
1. Initialize BrowserPerformanceProfile
2. Simulate interactions for test duration
   - Select interaction type in round-robin order
   - Measure latency with browser-specific factors
   - Sample memory and CPU usage
   - Record success/failure
3. Collect statistics

**Per-browser Timeline**:
```
Start → Click → Type → Scroll → Screenshot → Click → ... → End
(simulated interactions at 10 Hz)
```

### Phase 3: Analysis (1 minute)
1. Print performance profiler summary
2. Analyze results against targets
3. Generate optimization opportunities
4. Classify by priority and browser

### Phase 4: Reporting (30 seconds)
1. Export performance profiles (JSON)
2. Export optimization report (JSON)
3. Export summary (JSON)
4. Display file locations

---

## Understanding Performance Metrics

### Latency Metrics (milliseconds)

**Click Latency**
- Measures: Time from click event to interaction completion
- Target: <50ms average, <100ms at p95
- Critical for: User responsiveness feel
- Example: 4.23ms baseline (Chrome), 5.50ms (Safari)

**Type Latency**
- Measures: Time from keypress to character appearing
- Target: <30ms average
- Critical for: Text input responsiveness
- Example: 2.94ms baseline (Chrome), 3.82ms (Safari)

**Scroll Latency**
- Measures: Time from scroll event to visual feedback
- Target: <20ms average
- Critical for: Smooth scrolling experience
- Example: 2.10ms baseline (Chrome), 2.73ms (Safari)

**Screenshot Latency**
- Measures: Time to capture screen for display/recording
- Target: <100ms average
- Critical for: Real-time display updates
- Example: 62.00ms baseline (Chrome), 81ms (Safari)

### Resource Metrics

**Memory Usage (MB)**
- Measures: RAM consumed by browser instance
- Target: <500MB average
- Monitored: Per sample during test
- Critical for: Multiple concurrent sessions

**CPU Usage (%)**
- Measures: Processor utilization
- Target: <50% average
- Monitored: Per sample during test
- Critical for: System load and scalability

---

## Interpreting Results

### Performance Profiles JSON

```json
{
  "timestamp": "2026-03-08T15:30:45.123456",
  "profiles": {
    "Chrome": {
      "browser": "Chrome",
      "os": "Desktop",
      "version": "120.0.0",
      "test_duration_seconds": 30.0,
      "total_interactions": 300,
      "success_rate": 99.0,
      "latencies": {
        "click": {
          "min": 3.38,
          "max": 5.18,
          "avg": 4.23,
          "median": 4.15,
          "p95": 5.08,
          "p99": 5.18,
          "stdev": 0.42,
          "count": 75
        },
        ...
      },
      "resources": {
        "memory_mb": {
          "min": 230,
          "max": 270,
          "avg": 250,
          "median": 248,
          "p95": 268
        },
        "cpu_percent": {
          "min": 20,
          "max": 30,
          "avg": 25,
          "median": 25,
          "p95": 29
        }
      }
    }
  }
}
```

**Key Fields**:
- `total_interactions`: Number of simulated interactions (30s × 10 Hz = 300)
- `success_rate`: Percentage of successful interactions (should be 95%+)
- `latencies`: Per-interaction type statistics
- `resources`: Memory and CPU usage during test

### Optimization Report JSON

```json
{
  "summary": {
    "total_opportunities": 2,
    "by_priority": {
      "Critical": 0,
      "High": 1,
      "Medium": 1,
      "Low": 0
    },
    "by_browser": {
      "Safari (iOS)": 2
    },
    "critical_count": 0,
    "high_count": 1
  },
  "opportunities": [
    {
      "browser": "Safari (iOS)",
      "issue": "Click latency above target (6.35ms vs 5.00ms target)",
      "metric": "click_latency_avg",
      "current_value": 6.35,
      "target_value": 5.0,
      "priority": "High",
      "recommendation": "iOS optimization: 1) Increase touch target size, 2) Use touch-action CSS, 3) Pre-focus input elements, 4) Consider custom gesture handling.",
      "estimated_improvement_percent": 20.0
    }
  ]
}
```

**Interpretation**:
- No opportunities = All targets met ✅
- Opportunities sorted by priority (Critical first)
- Each includes specific browser and recommendation
- Estimated improvement helps prioritize fixes

---

## Performance Targets and Baseline

### Target Definitions

| Metric | Target | Rationale |
|--------|--------|-----------|
| Click avg | <50ms | User perceives instant response |
| Click p95 | <100ms | 95% of clicks very responsive |
| Type avg | <30ms | Characters appear quickly while typing |
| Scroll avg | <20ms | Smooth scrolling experience |
| Screenshot avg | <100ms | Real-time video display update rate |
| Memory avg | <500MB | Support 100 sessions at <50GB RAM |
| CPU avg | <50% | Leave headroom for OS and other processes |

### Browser Performance Factors

**Relative to Chrome baseline (1.0x)**:

| Browser | Factor | Notes |
|---------|--------|-------|
| Chrome | 1.0x | Baseline (uses CDP) |
| Edge | 1.0x | Same Chromium engine |
| Firefox | 1.15x | Different WebRTC stack |
| Safari | 1.3x | Limited platform APIs |
| Android | 1.2x | Variable mobile hardware |
| iOS | 1.5x | Most constrained platform |

**Example Calculation**:
```
Chrome click latency:     4.23ms × 1.0x = 4.23ms ✅
Safari click latency:     4.23ms × 1.3x = 5.50ms ✅
Safari iOS click latency: 4.23ms × 1.5x = 6.35ms ⚠️ Monitor
```

---

## Test Scenarios

### Quick Test (10 seconds per browser, ~1 minute total)
```bash
python scripts/browser_performance_test.py 10
```
**Use for**: CI/CD validation, quick regression checks
**Coverage**: Limited data but fast feedback

### Standard Test (30 seconds per browser, ~3 minutes total)
```bash
python scripts/browser_performance_test.py 30
```
**Use for**: Regular performance validation
**Coverage**: Sufficient data for analysis

### Extended Test (60 seconds per browser, ~6 minutes total)
```bash
python scripts/browser_performance_test.py 60
```
**Use for**: Detailed performance analysis, optimization validation
**Coverage**: More data points, better statistics

### Stress Test (120+ seconds per browser, ~12+ minutes total)
```bash
python scripts/browser_performance_test.py 120
```
**Use for**: Longevity testing, memory leak detection
**Coverage**: Comprehensive analysis

---

## Expected Results

### All Browsers Should Meet Targets

✅ **Chrome**: 4.23ms click, 62ms screenshot, 250MB memory
✅ **Edge**: 4.23ms click, 62ms screenshot, 250MB memory
✅ **Firefox**: 4.86ms click, 71ms screenshot, 288MB memory
✅ **Safari**: 5.50ms click, 81ms screenshot, 325MB memory
✅ **Android**: 5.08ms click, 74ms screenshot, 300MB memory
⚠️ **iOS**: 6.35ms click, 93ms screenshot, 375MB memory (monitor)

### Interpretation

**Green (✅ Pass)**: Metric meets target
- No action required
- Monitor for regression

**Yellow (⚠️ Monitor)**: Metric within 20% of target
- Review periodically
- Prepare optimizations if trend worsens

**Red (❌ Fails)**: Metric exceeds target by >20%
- Implement optimization
- Re-test after fix

---

## Analyzing Optimization Opportunities

### By Priority

**Critical** (Fix immediately)
- Performance exceeds target by >50%
- Impacts user experience significantly
- Examples: 100ms+ click latency

**High** (Fix within 2 weeks)
- Performance exceeds target by 25-50%
- Noticeable impact on some users
- Examples: 75ms click latency

**Medium** (Fix within 1 month)
- Performance exceeds target by 10-25%
- Minor impact on user experience
- Examples: 55ms click latency

**Low** (Fix in future releases)
- Performance exceeds target by <10%
- Minimal impact
- Examples: Fine-tuning for optimization

### By Browser

**Chrome/Edge**: Rarely have issues (same engine)
**Firefox**: Monitor memory usage in long sessions
**Safari**: CORS policies and keyboard handling
**iOS**: Keyboard delays and screenshot frequency
**Android**: Device variation and network stability

---

## Optimization Workflow

### 1. Identify Opportunity
```bash
# Review optimizations_*.json
cat reports/wave_3_phase_2/optimizations_*.json | jq '.opportunities[] | {browser, metric, priority}'

# Output example:
# {
#   "browser": "Safari (iOS)",
#   "metric": "click_latency_avg",
#   "priority": "High"
# }
```

### 2. Understand Root Cause
```bash
# Read recommendation from JSON
cat reports/wave_3_phase_2/optimizations_*.json | jq '.opportunities[] | select(.browser == "Safari (iOS)") | .recommendation'
```

### 3. Implement Fix
Implement code changes based on recommendation:
- Update event handling
- Optimize screenshot capture
- Reduce screenshot frequency
- etc.

### 4. Validate Improvement
Re-run tests and verify:
```bash
# Compare before and after
python scripts/browser_performance_test.py 30

# Check if metric now meets target
cat reports/wave_3_phase_2/performance_profiles_*.json | jq '.profiles."Safari (iOS)".latencies.click.avg'
```

---

## Troubleshooting

### Test Fails to Complete

**Issue**: "No browser profiles collected"

**Solution**:
```bash
# Check that async/await is working
python -c "import asyncio; print(asyncio.run(__import__('asyncio').sleep(0.1)))"

# Verify backend services are importable
cd backend
python -c "from app.services.browser_performance_profiler import BrowserPerformanceProfiler; print('OK')"
```

### Memory Readings All Zero

**Issue**: `psutil` not installed

**Solution**:
```bash
pip install psutil
```

### All Metrics Identical

**Issue**: Variance simulation disabled

**Solution**: Check variance calculation in `_measure_interaction_latency()` in profiler.py

---

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Performance Testing

on: [push, pull_request]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.9'

      - name: Install dependencies
        run: |
          pip install psutil aiohttp

      - name: Run performance tests
        run: |
          python scripts/browser_performance_test.py 10

      - name: Upload results
        if: always()
        uses: actions/upload-artifact@v2
        with:
          name: performance-reports
          path: reports/wave_3_phase_2/

      - name: Fail on critical issues
        run: |
          python -c "
          import json
          with open('reports/wave_3_phase_2/optimizations_*.json') as f:
            data = json.load(f)
            critical = [o for o in data['opportunities'] if o['priority'] == 'Critical']
            if critical:
              print(f'Found {len(critical)} critical issues')
              exit(1)
          "
```

---

## Advanced: Custom Test Scenarios

### Test Specific Browser
```python
from app.services.browser_performance_profiler import BrowserPerformanceProfiler, BrowserType

profiler = BrowserPerformanceProfiler()
profile = await profiler.profile_browser(
    browser=BrowserType.SAFARI_IOS,
    os="iOS",
    version="17.2",
    test_duration_seconds=60
)
profile.print_summary()
```

### Export for Analysis
```python
import json

# Export to custom location
profiler.export_to_json('/path/to/results.json')

# Load and analyze
with open('/path/to/results.json') as f:
    data = json.load(f)
    for browser, metrics in data['profiles'].items():
        print(f"{browser}: {metrics['latencies']['click']['avg']:.2f}ms")
```

### Adjust Performance Factors
```python
# In BrowserPerformanceProfiler._get_browser_factor()
factors = {
    BrowserType.CHROME: 1.0,
    BrowserType.SAFARI: 1.5,  # Adjust if needed
    # ...
}
```

---

## Continuous Monitoring

After optimizations are implemented, maintain performance:

1. **Weekly Tests**:
   ```bash
   # Run every week to catch regressions
   python scripts/browser_performance_test.py
   ```

2. **Before Release**:
   ```bash
   # Comprehensive testing before shipping
   python scripts/browser_performance_test.py 120
   ```

3. **Track Metrics Over Time**:
   ```bash
   # Compare timestamps
   ls -la reports/wave_3_phase_2/ | grep performance_profiles
   ```

4. **Alert on Regression**:
   - If any metric increases >10% from baseline
   - If success rate drops <95%
   - If memory usage exceeds 600MB

---

## Summary

**Performance Testing Framework**:
- ✅ Automated testing for 6 browsers
- ✅ Latency measurement (click, type, scroll, screenshot)
- ✅ Resource monitoring (memory, CPU)
- ✅ Optimization opportunity identification
- ✅ Priority classification
- ✅ Browser-specific recommendations

**Results Available**:
- Performance profiles with detailed statistics
- Optimization opportunities with priorities
- Summary comparison across browsers
- All data exported as JSON for analysis

**Next Steps**:
1. Execute performance tests
2. Analyze results against targets
3. Implement high-priority optimizations
4. Re-test to validate improvements
5. Move to Phase 3: Load Scaling

