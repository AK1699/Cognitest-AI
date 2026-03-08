# Wave 3 Phase 3: Load Scaling Testing Guide

**Phase**: 6 Wave 3 Phase 3
**Purpose**: Validate system performance under concurrent load (10-1000 users)
**Duration**: ~5 minutes for full test

---

## Quick Start

### Run Full Load Scaling Tests
```bash
# All 5 load levels (10, 50, 100, 500, 1000 users)
cd /path/to/cognitest-ai
python scripts/load_scaling_test.py

# Quick mode (only 10, 50, 100 users) - ~3 minutes
python scripts/load_scaling_test.py --quick

# Custom duration (60 seconds per load level)
python scripts/load_scaling_test.py 60

# Short test (10 seconds for CI/CD)
python scripts/load_scaling_test.py 10
```

### View Results
```bash
# Navigate to results directory
ls -la reports/wave_3_phase_3/

# View detailed JSON results
cat reports/wave_3_phase_3/load_scaling_results_*.json | jq .

# View capacity analysis
cat reports/wave_3_phase_3/load_scaling_report_*.json | jq '.analysis.capacity_analysis'

# View bottlenecks
cat reports/wave_3_phase_3/load_scaling_report_*.json | jq '.analysis.bottlenecks'
```

---

## Test Scenarios

### Scenario 1: Baseline Verification (Quick)
```bash
python scripts/load_scaling_test.py 30 --quick
```
- Tests: 10, 50, 100 users only
- Duration: ~3 minutes
- Purpose: Verify Phase 2 baselines hold true
- Expected: All PASS ✅

### Scenario 2: Standard Testing
```bash
python scripts/load_scaling_test.py 60
```
- Tests: All 5 load levels
- Duration: ~5 minutes
- Purpose: Full capacity validation
- Expected: Pass up to 500 users, fail at 1000

### Scenario 3: Stress Testing
```bash
python scripts/load_scaling_test.py 120
```
- Tests: All 5 load levels, 2 minutes each
- Duration: ~10 minutes
- Purpose: Extended stress and stability
- Expected: Identify memory leaks, connection limits

### Scenario 4: CI/CD Fast Check
```bash
python scripts/load_scaling_test.py 5 --quick
```
- Tests: 10, 50, 100 users (5 seconds each)
- Duration: <1 minute
- Purpose: Quick regression check
- Expected: Fast feedback, minimal overhead

---

## Load Levels Explained

### Level 1: Light Load (10 users)

**Purpose**: Baseline verification - should match Phase 2 single-user profiles

**Expected Results**:
```
Success Rate: 99%+ (essentially no failures)
Click Latency: ~4.23ms (Chrome baseline)
Memory: ~250MB
CPU: ~25%
Status: ✅ PASS - Validate Phase 2 assumptions
```

**Interpretation**:
- If this fails, something fundamentally wrong
- Should match Phase 2 performance profiles exactly
- Used as reference for all other levels

### Level 2: Medium Load (50 users)

**Purpose**: Standard operation - typical expected load

**Expected Results**:
```
Success Rate: 98%+
Click Latency: ~4.86ms (5% load overhead)
Memory: ~1.5GB
CPU: ~40%
Status: ✅ PASS - Expected for normal operation
```

**Interpretation**:
- Represents typical peak during business hours
- Should feel responsive to users
- Memory and CPU well within limits
- Platform should handle easily

### Level 3: Heavy Load (100 users)

**Purpose**: Peak expected load - worst-case normal operation

**Expected Results**:
```
Success Rate: 98%+
Click Latency: ~5.5ms (30% load overhead)
Memory: ~3GB
CPU: ~55%
Status: ✅ PASS - Handle peak periods
```

**Interpretation**:
- Represents peak concurrent users expected
- Still responsive but showing load effects
- Memory usage manageable
- CPU has headroom
- Most production deployments stay here

### Level 4: Stress Test (500 users)

**Purpose**: Stress testing - what happens above normal load

**Expected Results**:
```
Success Rate: 95%+ (maybe 96-97%)
Click Latency: ~9.87ms (130% load overhead)
Memory: ~10-15GB
CPU: ~75-80%
Status: ⚠️ PASS or FAIL (degradation acceptable)
```

**Interpretation**:
- Not expected in normal operation
- Testing system resilience
- Latency increases significantly
- Some errors acceptable (connection timeouts)
- Used to understand scaling limits

### Level 5: Capacity Test (1000 users)

**Purpose**: Find maximum capacity - breaking point

**Expected Results**:
```
Success Rate: 90%+ (might be 88-92%)
Click Latency: ~14-15ms (250%+ overhead)
Memory: ~20GB+
CPU: ~85-90%+
Status: ❌ FAIL expected (acceptable at capacity)
```

**Interpretation**:
- System will show signs of stress
- Failure rate higher (5-10%)
- Latency noticeably high
- Memory constraints visible
- Used to estimate safe capacity limit

---

## Interpreting Console Output

### Success Indicator

```
✅ PASS  = Load level meets success criteria
⚠️ WARNING = Borderline, some concerns
❌ FAIL  = Exceeds acceptable limits
```

### Latency Indicators

```
3-5ms:     Excellent (like single-user)
5-8ms:     Good (acceptable load)
8-12ms:    Fair (noticeable but ok)
12-20ms:   Poor (load effects visible)
20+ms:     Bad (needs optimization)
```

### Memory Indicators

```
<500MB:    Single user (baseline)
500MB-2GB: Light load (10-50 users)
2-5GB:     Medium load (50-150 users)
5-10GB:    Heavy load (150-500 users)
10GB+:     Stress/capacity (500+ users)
```

### CPU Indicators

```
<30%:      Optimal (can handle more)
30-50%:    Good (headroom available)
50-70%:    Loaded (approaching limits)
70-80%:    Heavy (limited headroom)
80%+:      Stressed (at or near capacity)
```

---

## Key Metrics Explained

### Success Rate
**Definition**: (Successful Interactions / Total Interactions) × 100

**Example**:
```
At 100 users:
  Total Interactions: 6000
  Successful: 5988
  Failed: 12
  Success Rate: 99.8% ✅
```

**What It Means**:
- 99%+ = Excellent reliability
- 98%+ = Good reliability
- 95%+ = Acceptable (some errors)
- <90% = Too many failures

### Latency (Click)
**Definition**: Time from click event to completion

**Percentiles**:
- **Avg**: Average latency (most interactions)
- **Median**: 50th percentile (typical user experience)
- **P95**: 95th percentile (slow 5% of interactions)
- **P99**: 99th percentile (very slow <1%)

**Example at 100 users**:
```
Avg: 5.5ms - Most clicks this fast
P95: 6.6ms - 95% of clicks under 6.6ms
P99: 7.2ms - Even slow interactions under 7.2ms
```

**Why Percentiles Matter**:
- Avg might be good but P95 bad = tail latency issue
- P95 more important than Avg for user experience
- Target: P95 < 100ms (what users perceive)

### Memory Usage
**Definition**: RAM consumed by browser sessions

**Scaling**:
```
10 users:   250MB (baseline)
50 users:   1.5GB (30MB per user)
100 users:  3GB (30MB per user)
```

**What To Watch**:
- Linear scaling: Predictable, good
- Exponential scaling: Memory leak, bad
- Memory spike: Connection issue, investigate

### CPU Usage
**Definition**: Processor utilization percentage

**Interpretation**:
- 25%: 1 of 4 cores busy (good)
- 50%: 2 of 4 cores busy (optimal)
- 75%: 3 of 4 cores busy (loaded)
- 90%: Nearly at limit (approaching capacity)

---

## Analyzing Results

### Step 1: Check Pass/Fail Status

```
Light (10 users):    ✅ PASS?  → Baseline valid
Medium (50 users):   ✅ PASS?  → Normal operation ok
Heavy (100 users):   ✅ PASS?  → Peak handling ok
Stress (500 users):  ⚠️ ?      → Stress response acceptable
Capacity (1000):     ❌ FAIL?  → Expected, find safe limit
```

### Step 2: Verify Latency Scaling

```
10 users:  4.2ms (baseline)
50 users:  4.9ms (16% increase) ✅
100 users: 5.5ms (30% increase) ✅
500 users: 9.9ms (135% increase) ⚠️
1000 users: 14.5ms (244% increase) ❌
```

**Good Scaling**: Linear increase with users
**Bad Scaling**: Exponential jump (indicates bottleneck)

### Step 3: Check Memory Scaling

```
10 users:   250MB (baseline)
50 users:   1.5GB (6x - 30MB per user) ✅
100 users:  3GB (12x - 30MB per user) ✅
500 users:  15GB (60x - 30MB per user) ⚠️
1000 users: 30GB+ (120x - degradation) ❌
```

**What To Look For**:
- Consistent per-user memory: Good
- Sudden jumps: Memory leak or buffer issue
- Exponential growth: Severe problem

### Step 4: Identify Bottlenecks

**From JSON report**:
```json
"bottlenecks": {
  "interaction_handling": "Click latency increased 244%...",
  "memory_usage": "Memory usage increased 11900%..."
}
```

**Interpret**:
- 50% increase: Normal scaling
- 100-200% increase: Performance degradation (acceptable)
- >300% increase: Bottleneck found (needs optimization)

### Step 5: Determine Capacity Limit

**From JSON report**:
```json
"capacity_analysis": {
  "estimated_capacity": 500,
  "recommended_max_users": 400,
  "note": "Use 80% of capacity limit for safe operation"
}
```

**What It Means**:
- Estimated: Last level where success ≥ 90%
- Recommended: 80% of estimated (safety margin)
- Use recommended for production

---

## Comparing With Phase 2

### Validate Single-User Baselines

**Phase 2 Profiles** (single user per browser):
```
Chrome:  4.23ms click
Firefox: 4.86ms click
Safari:  5.50ms click
```

**Phase 3 Light (10 users)** should show:
```
Avg: ~4.5ms (slight overhead from contention)
Matches Phase 2 within ±10%
```

**If Significant Difference**:
- Phase 2 may be wrong
- System changed since Phase 2
- Investigate differences

### Scaling Expectations

**Linear Scaling** (ideal):
```
1 user:   5ms
10 users: 5.5ms (10% increase)
100 users: 7.5ms (50% increase)
```

**Acceptable Scaling**:
```
1 user:   5ms
10 users: 5.5ms
100 users: 8-10ms (doubling acceptable)
```

**Poor Scaling** (investigate):
```
1 user:   5ms
10 users: 8ms (60% increase too much)
100 users: 20ms (4x increase indicates bottleneck)
```

---

## Troubleshooting

### Issue: 10 users FAIL (should always pass)

**Likely Causes**:
1. System overloaded with other processes
2. Network latency issues
3. Backend service down
4. Memory exhausted

**Debug Steps**:
```bash
# Check system resources
top -b -n 1 | head -20

# Check memory
free -h

# Check network
ping localhost

# Restart backend
systemctl restart backend-service
```

### Issue: Latency spikes at specific load level

**Likely Causes**:
1. Connection pool limit reached (e.g., at 50 users)
2. Resource contention threshold crossed
3. Garbage collection pause
4. Thread pool exhausted

**Debug Steps**:
```bash
# Profile the specific level
python scripts/load_scaling_test.py 120  # Longer test
# Re-run at suspected level for more data

# Check logs
tail -f backend/logs/app.log | grep ERROR

# Monitor resources
watch -n 1 'free -h && top -b -n 1 | head -15'
```

### Issue: Memory grows unbounded

**Likely Causes**:
1. Memory leak in WebRTC connections
2. Screenshot buffer not cleared
3. Event listener not removed
4. Connection pool accumulating

**Debug Steps**:
```bash
# Take memory snapshot before/after
python -c "
import psutil
p = psutil.Process()
print(f'Memory: {p.memory_info().rss / 1024 / 1024:.0f}MB')
"

# Check for leaks over time
for i in {1..5}; do
  echo \"Sample $i:\"
  ps aux | grep python
  sleep 60
done
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Load Scaling Test

on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.9'

      - name: Install dependencies
        run: pip install psutil aiohttp

      - name: Run load tests
        run: python scripts/load_scaling_test.py 30 --quick

      - name: Upload results
        if: always()
        uses: actions/upload-artifact@v2
        with:
          name: load-test-results
          path: reports/wave_3_phase_3/

      - name: Check capacity
        run: |
          python -c "
          import json
          with open('reports/wave_3_phase_3/load_scaling_report_*.json') as f:
            data = json.load(f)
            capacity = data['analysis']['capacity_analysis']
            if 'estimated_capacity' in capacity:
              if capacity['estimated_capacity'] < 400:
                print('WARNING: Capacity below 400 users')
                exit(1)
          "
```

### Manual Testing in Pipeline

```bash
# Before deployment
python scripts/load_scaling_test.py 60

# Check results
python -c "
import json, glob
f = glob.glob('reports/wave_3_phase_3/load_scaling_report_*.json')[-1]
with open(f) as fp:
  data = json.load(fp)
  for users, result in data['results_summary'].items():
    if not result['meets_criteria']:
      print(f'FAIL: {users} users')
      exit(1)
print('All tests PASS ✅')
"
```

---

## Performance Benchmarking

### Creating Baseline

**First Run** (establish baseline):
```bash
python scripts/load_scaling_test.py 60 > baseline_results.txt
```

**Store for comparison**:
```bash
cp reports/wave_3_phase_3/* benchmarks/baseline/
```

### Comparing Runs

**After optimization**:
```bash
python scripts/load_scaling_test.py 60 > optimized_results.txt

# Compare
diff baseline_results.txt optimized_results.txt
```

**Calculate improvement**:
```bash
python -c "
import json
with open('benchmarks/baseline/load_scaling_report_*.json') as f:
  baseline = json.load(f)
with open('reports/wave_3_phase_3/load_scaling_report_*.json') as f:
  current = json.load(f)

for users in [100]:
  base_lat = baseline['results'][users]['click']['avg']
  curr_lat = current['results'][users]['click']['avg']
  improvement = ((base_lat - curr_lat) / base_lat * 100)
  print(f'{users} users: {improvement:.1f}% improvement')
"
```

---

## Expected Timeline

### Test Execution

| Scenario | Duration | Use Case |
|----------|----------|----------|
| Quick Mode (3 levels) | ~3 min | Quick validation |
| Standard (5 levels, 60s) | ~5 min | Full testing |
| Extended (5 levels, 120s) | ~10 min | Stress testing |
| CI/CD Fast (5s quick) | <1 min | Regression check |

### Daily Testing
```
Quick validation: ~3 minutes
Can run multiple times per day
Part of continuous integration
```

### Weekly Testing
```
Full load test: ~5 minutes
Once per week during off-hours
Monitor for regressions
```

### Monthly Testing
```
Extended stress: ~10 minutes
Once per month
Full capacity analysis
Update capacity documentation
```

---

## Success Checklist

### Prerequisites
- [ ] Backend services running
- [ ] All 6 browsers available for profiling
- [ ] Prometheus monitoring operational (for resource stats)
- [ ] At least 8GB RAM available
- [ ] 2+ CPU cores

### Execution
- [ ] Phase 2 results available for baseline comparison
- [ ] No other heavy processes running
- [ ] Network connectivity stable
- [ ] Disk space for JSON results

### Results
- [ ] 10 users PASS (baseline valid)
- [ ] 50 users PASS (normal operation)
- [ ] 100 users PASS (peak handling)
- [ ] Capacity limit identified (500-600 users)
- [ ] Bottlenecks documented if any
- [ ] JSON reports generated

### Analysis
- [ ] Compare with Phase 2 baselines
- [ ] Verify latency scaling is linear
- [ ] Check memory per-user consistency
- [ ] Identify any new bottlenecks
- [ ] Determine recommended max users
- [ ] Plan optimizations if needed

---

## Summary

Phase 3 Load Scaling Testing validates:
- ✅ System performance under 10-1000 concurrent users
- ✅ Scaling assumptions from Phase 2
- ✅ Capacity limits and bottlenecks
- ✅ Resource usage (memory, CPU) at scale
- ✅ Success rate degradation patterns

**Ready to Execute**: `python scripts/load_scaling_test.py`

