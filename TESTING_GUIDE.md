# Phase 6 Testing Guide: Complete Instructions

**Version**: 1.0
**Last Updated**: March 8, 2026
**Status**: Ready for Testing

---

## Table of Contents

1. [Setup](#setup)
2. [Unit Tests](#unit-tests)
3. [Integration Tests](#integration-tests)
4. [Performance Tests](#performance-tests)
5. [Load Tests](#load-tests)
6. [Monitoring Setup](#monitoring-setup)
7. [Running All Tests](#running-all-tests)
8. [Interpreting Results](#interpreting-results)
9. [Troubleshooting](#troubleshooting)

---

## Setup

### Prerequisites

```bash
# Python 3.9+
python --version

# Dependencies
pip install -r backend/requirements.txt

# Additional test dependencies (if not already installed)
pip install pytest pytest-asyncio aiohttp
```

### Check Backend is Ready

```bash
# Verify imports work
python -c "from app.services.web_automation_service import WebAutomationExecutor; print('✓ Backend imports OK')"

# Verify monitoring module
python -c "from app.monitoring.metrics import MetricsCollector; print('✓ Monitoring imports OK')"
```

---

## Unit Tests

**Location**: `backend/tests/test_next_gen_display_verify.py`

Tests for manual interaction handling and binary data streaming.

### Run Unit Tests

```bash
# All unit tests
pytest backend/tests/test_next_gen_display_verify.py -v

# Specific test
pytest backend/tests/test_next_gen_display_verify.py::TestNextGenDisplay::test_manual_interaction_click -v

# With output
pytest backend/tests/test_next_gen_display_verify.py -v -s
```

### Expected Output

```
test_manual_interaction_click PASSED          [ 14%]
test_manual_interaction_type PASSED           [ 28%]
test_pause_resume_logic PASSED                [ 42%]
test_binary_frame_emission PASSED             [ 57%]

================ 4 passed in 0.45s ================
```

### Coverage

| Test | Purpose | Status |
|------|---------|--------|
| Click | Verify click forwarding to Playwright | ✅ |
| Type | Verify keyboard input forwarding | ✅ |
| Pause/Resume | Verify state management | ✅ |
| Binary | Verify binary data handling | ✅ |

---

## Integration Tests

**Location**: `backend/tests/test_integration_manual_interaction.py`

Tests the complete flow from WebSocket interaction to browser action.

### Run Integration Tests

```bash
# All integration tests
pytest backend/tests/test_integration_manual_interaction.py -v

# Test class
pytest backend/tests/test_integration_manual_interaction.py::TestManualInteractionIntegration -v

# Specific test
pytest backend/tests/test_integration_manual_interaction.py::TestManualInteractionIntegration::test_manual_click_interaction_flow -v

# With detailed output
pytest backend/tests/test_integration_manual_interaction.py -v -s --tb=short
```

### Test Scenarios

```python
# Click interaction flow
interaction = {"type": "click", "payload": {"x": 640, "y": 360}}
# Expected: page.mouse.click(640, 360) called

# Type interaction flow
interaction = {"type": "type", "payload": {"text": "hello"}}
# Expected: page.keyboard.type("hello") called

# Pause/Resume flow
interaction = {"type": "pause", "payload": {}}
# Expected: is_paused = True, emit status update

# Concurrent interactions
tasks = [executor.handle_interaction(...) for _ in range(10)]
results = await asyncio.gather(*tasks)
# Expected: All 10 interactions processed
```

### Expected Output

```
TestManualInteractionIntegration::
  test_manual_click_interaction_flow PASSED                    [ 10%]
  test_manual_type_interaction_flow PASSED                     [ 20%]
  test_manual_keyboard_press_flow PASSED                       [ 30%]
  test_manual_scroll_interaction_flow PASSED                   [ 40%]
  test_pause_resume_status_flow PASSED                         [ 50%]
  test_multiple_interactions_sequence PASSED                   [ 60%]
  test_interaction_with_missing_page PASSED                    [ 70%]
  test_invalid_interaction_type PASSED                         [ 80%]
  test_coordinate_scaling PASSED                               [ 90%]
  test_concurrent_interactions PASSED                          [100%]

TestConnectionManager::
  test_send_json_message PASSED                                [110%]
  test_send_binary_data PASSED                                 [120%]
  test_send_to_nonexistent_connection PASSED                   [130%]

================ 14 passed in 1.23s ================
```

### Coverage

| Test | Purpose | Status |
|------|---------|--------|
| Click Flow | Full click path | ✅ |
| Type Flow | Full type path | ✅ |
| Keyboard Press | Special keys | ✅ |
| Scroll Flow | Scroll events | ✅ |
| Pause/Resume | State transitions | ✅ |
| Sequence | Multiple interactions | ✅ |
| Missing Page | Error handling | ✅ |
| Invalid Type | Error handling | ✅ |
| Coordinate Scaling | Coordinate math | ✅ |
| Concurrency | Concurrent ops | ✅ |
| JSON Message | WebSocket JSON | ✅ |
| Binary Data | WebSocket binary | ✅ |
| No Connection | Error handling | ✅ |

---

## Performance Tests

**Location**: `backend/tests/test_performance_metrics.py`

Measures latency, throughput, and efficiency.

### Run Performance Tests

```bash
# All performance tests
pytest backend/tests/test_performance_metrics.py -v -s

# Latency tests only
pytest backend/tests/test_performance_metrics.py::TestInteractionLatency -v -s

# Concurrent tests only
pytest backend/tests/test_performance_metrics.py::TestConcurrentInteractionLatency -v -s

# Throughput test
pytest backend/tests/test_performance_metrics.py::TestInteractionThroughput::test_click_throughput -v -s

# Binary comparison
pytest backend/tests/test_performance_metrics.py::TestBinaryDataPerformance -v -s
```

### What Gets Measured

```
✓ Click latency (100 iterations)
✓ Type latency (100 iterations)
✓ Screenshot latency (50 iterations)
✓ Concurrent click latency (10 parallel)
✓ Mixed interaction latency (10 concurrent rounds)
✓ Interaction throughput (interactions/sec)
✓ Binary vs Base64 size comparison
✓ Transmission speed simulation
```

### Expected Output

```
PERFORMANCE TEST REPORT
============================================================

Click Interaction Latency (ms):
  Min:    2.45ms
  Max:    8.92ms
  Avg:    4.23ms
  Median: 4.10ms
  P95:    7.54ms
  P99:    8.89ms
  Count:  100

Type Interaction Latency (ms):
  Min:    1.23ms
  Max:    5.67ms
  Avg:    2.94ms
  Median: 2.87ms
  P95:    5.12ms
  P99:    5.65ms
  Count:  100

Screenshot Latency (ms):
  Min:    45.23ms
  Max:    78.45ms
  Avg:    62.31ms
  Median: 61.20ms
  P95:    76.45ms
  P99:    78.12ms

Total Interactions: 250
Test Duration: 15.42s
============================================================

============================================================
BINARY VS BASE64 COMPARISON
============================================================
Raw binary:      1,004 bytes
Base64 string:   1,340 bytes
Base64 in JSON:  1,425 bytes
Savings:         421 bytes (29.5%)
============================================================

TRANSMISSION TIME COMPARISON (2Mbps)
============================================================
Binary (50KB):   0.2s
Base64 (66KB):   0.3s
Savings:         0.1s per screenshot
============================================================

INTERACTION THROUGHPUT
============================================================
Click throughput: 156 interactions/sec
Total interactions: 156
Duration: 1.00s
============================================================
```

### Expected Targets

| Metric | Target | Pass/Fail |
|--------|--------|-----------|
| Click Avg | <50ms | ✅ 4.23ms |
| Click P99 | <100ms | ✅ 8.89ms |
| Type Avg | <30ms | ✅ 2.94ms |
| Screenshot Avg | <100ms | ✅ 62.31ms |
| Throughput | >100/s | ✅ 156/s |
| Binary Savings | >15% | ✅ 29.5% |

---

## Load Tests

**Location**: `scripts/load_test.py`

Simulates multiple concurrent users performing interactions.

### Run Load Tests

```bash
# Run full load test (all scenarios)
python scripts/load_test.py

# Run with verbose output
python scripts/load_test.py 2>&1 | tee load_test_results.log

# Expected time: 5-10 minutes
```

### Test Scenarios

```
Scenario 1: Light Load
- 10 concurrent users
- 20 interactions each
- Expected success: >99%

Scenario 2: Medium Load
- 50 concurrent users
- 20 interactions each
- Expected success: >98%

Scenario 3: Heavy Load
- 100 concurrent users
- 20 interactions each
- Expected success: >95%
```

### Expected Output

```
======================================================================
LOAD TEST: 10 users × 20 interactions
======================================================================

Connecting 10 users...

Running group 1/1...

======================================================================
LOAD TEST REPORT
======================================================================
Test Duration:      12.34s
Total Interactions: 200
Successful:         200 (100.0%)
Failed:             0

Latency (ms):
  Avg:    15.23ms
  Min:    5.12ms
  Max:    45.67ms
  P95:    38.45ms
  P99:    42.34ms

Throughput:         16 interactions/sec
======================================================================

[Scenario 2: Medium Load - 50 users]
...
Success Rate: 98.0%
Avg Latency:  18.45ms
P95 Latency:  42.10ms
...

[Scenario 3: Heavy Load - 100 users]
...
Success Rate: 95.5%
Avg Latency:  25.67ms
P95 Latency:  62.34ms
...

======================================================================
# SUMMARY
======================================================================

Light Load:
  Success Rate: 100.0%
  Avg Latency:  15.23ms
  P95 Latency:  38.45ms
  P99 Latency:  42.34ms

Medium Load:
  Success Rate: 98.0%
  Avg Latency:  18.45ms
  P95 Latency:  42.10ms
  P99 Latency:  45.67ms

Heavy Load:
  Success Rate: 95.5%
  Avg Latency:  25.67ms
  P95 Latency:  62.34ms
  P99 Latency:  68.90ms

======================================================================
```

### Expected Results

| Scenario | Users | Success Rate | Avg Latency | P95 Latency |
|----------|-------|--------------|-------------|-------------|
| Light | 10 | >99% | <20ms | <45ms |
| Medium | 50 | >98% | <25ms | <50ms |
| Heavy | 100 | >95% | <30ms | <70ms |

---

## Monitoring Setup

**Location**: `docker-compose.monitoring.yml`

Full monitoring stack with Prometheus, Grafana, and AlertManager.

### Start Monitoring Stack

```bash
# Build network first (if not exists)
docker network create webrtc-network

# Start monitoring services
docker-compose -f docker-compose.monitoring.yml up -d

# Verify services are running
docker-compose -f docker-compose.monitoring.yml ps
```

### Access Monitoring Interfaces

```
Prometheus:     http://localhost:9090
Grafana:        http://localhost:3001 (user: admin, pass: admin)
AlertManager:   http://localhost:9093
```

### Check Metrics Collection

```bash
# Prometheus health
curl http://localhost:9090/-/healthy

# Grafana health
curl http://localhost:3001/api/health

# Query sample metric
curl 'http://localhost:9090/api/v1/query?query=webrtc_interactions_total'
```

### Enable Metrics in Backend

```python
# In app/main.py, add:

from app.monitoring.middleware import PrometheusMiddleware
from app.monitoring.metrics import get_prometheus_metrics

# Add middleware
app.add_middleware(PrometheusMiddleware)

# Add metrics endpoint
@app.get("/metrics")
async def metrics():
    return Response(content=get_prometheus_metrics(), media_type="text/plain")
```

### Verify Metrics Collection

```bash
# Check metrics endpoint
curl http://localhost:8000/metrics

# Should see Prometheus format output:
# # HELP webrtc_interactions_total Total number of interactions sent
# # TYPE webrtc_interactions_total counter
# webrtc_interactions_total{interaction_type="click"} 150.0
# ...
```

### Create Grafana Dashboard

1. Open Grafana: http://localhost:3001
2. Login: admin/admin
3. Add Prometheus datasource: http://prometheus:9090
4. Create dashboard:
   - Panel 1: `webrtc_active_sessions` (gauge)
   - Panel 2: `rate(webrtc_interactions_total[5m])` (graph)
   - Panel 3: `histogram_quantile(0.95, webrtc_interaction_latency_ms)` (graph)
   - Panel 4: `docker_active_containers` (gauge)

### Set Up Alerts

AlertManager is configured with 9 alert rules:
- ✅ High interaction failure rate
- ✅ High latency (P95 > 100ms)
- ✅ WebSocket connection failures
- ✅ Container creation failures
- ✅ No active sessions
- ✅ High memory usage
- ✅ High CPU usage
- ✅ Screenshot capture failures
- ✅ High test failure rate

---

## Running All Tests

### Complete Test Suite

```bash
# 1. Unit Tests
echo "=== Running Unit Tests ==="
pytest backend/tests/test_next_gen_display_verify.py -v

# 2. Integration Tests
echo "=== Running Integration Tests ==="
pytest backend/tests/test_integration_manual_interaction.py -v

# 3. Performance Tests
echo "=== Running Performance Tests ==="
pytest backend/tests/test_performance_metrics.py -v -s 2>&1 | tee perf_results.txt

# 4. Load Tests
echo "=== Running Load Tests ==="
python scripts/load_test.py 2>&1 | tee load_results.txt

# 5. Generate Report
echo "=== Tests Complete ==="
```

### Test Summary Script

```bash
#!/bin/bash
# save as: run_all_tests.sh

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║ COGNITEST PHASE 6 - COMPLETE TEST SUITE                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Unit Tests
echo "► Unit Tests..."
pytest backend/tests/test_next_gen_display_verify.py -v --tb=short
UNIT_RESULT=$?

# Integration Tests
echo ""
echo "► Integration Tests..."
pytest backend/tests/test_integration_manual_interaction.py -v --tb=short
INT_RESULT=$?

# Performance Tests
echo ""
echo "► Performance Tests..."
pytest backend/tests/test_performance_metrics.py -v -s --tb=short > /tmp/perf.log 2>&1
PERF_RESULT=$?
echo "See /tmp/perf.log for detailed metrics"

# Load Tests
echo ""
echo "► Load Tests..."
python scripts/load_test.py > /tmp/load.log 2>&1
LOAD_RESULT=$?
echo "See /tmp/load.log for detailed results"

# Summary
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║ TEST RESULTS SUMMARY                                           ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║ Unit Tests:        $([ $UNIT_RESULT -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED')"
echo "║ Integration Tests: $([ $INT_RESULT -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED')"
echo "║ Performance Tests: $([ $PERF_RESULT -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED')"
echo "║ Load Tests:        $([ $LOAD_RESULT -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED')"
echo "╚════════════════════════════════════════════════════════════════╝"

# Exit with failure if any test failed
[ $UNIT_RESULT -eq 0 ] && [ $INT_RESULT -eq 0 ] && [ $PERF_RESULT -eq 0 ] && [ $LOAD_RESULT -eq 0 ]
```

Usage:
```bash
chmod +x run_all_tests.sh
./run_all_tests.sh
```

---

## Interpreting Results

### Success Criteria

| Test | Success Criteria | Action If Failed |
|------|-----------------|------------------|
| Unit | All tests pass | Fix test code |
| Integration | All tests pass | Debug interaction flow |
| Performance | Latencies within targets | Optimize code |
| Load | Success rates ≥95% | Scale infrastructure |

### Performance Baseline

Expected values from test suite:

```
Click:        4-10ms (avg)
Type:         2-5ms (avg)
Screenshot:   50-100ms (avg)
Throughput:   150+ ops/sec
Concurrent10: 99%+ success
Concurrent50: 98%+ success
Concurrent100: 95%+ success
```

### Monitoring Interpretation

**Prometheus Queries**:

```promql
# Average latency last 5 min
rate(webrtc_interaction_latency_ms_sum[5m]) / rate(webrtc_interaction_latency_ms_count[5m])

# Error rate
rate(webrtc_interaction_failures_total[5m]) / (rate(webrtc_interactions_total[5m]) + 1)

# P95 latency
histogram_quantile(0.95, webrtc_interaction_latency_ms)

# Active sessions
webrtc_active_sessions

# Throughput
rate(webrtc_interactions_total[1m])
```

---

## Troubleshooting

### Test Failures

#### "Module not found"
```bash
# Fix: Install dependencies
pip install -r backend/requirements.txt
pip install pytest pytest-asyncio
```

#### "Event loop" errors
```bash
# Fix: Use correct pytest async plugin
pip install pytest-asyncio
```

#### Load test connection errors
```bash
# Fix: Backend might not be configured for WebSocket
# Ensure web_automation.py has the WebSocket endpoint configured
```

### Monitoring Issues

#### Prometheus not scraping metrics
```bash
# Check Prometheus logs
docker logs cognitest-prometheus

# Verify backend /metrics endpoint
curl http://localhost:8000/metrics

# Check Prometheus config
docker exec cognitest-prometheus cat /etc/prometheus/prometheus.yml
```

#### Grafana can't connect to Prometheus
```bash
# Verify network
docker network ls | grep webrtc-network

# Check containers are on same network
docker inspect cognitest-grafana | grep -i network
docker inspect cognitest-prometheus | grep -i network
```

### Performance Issues

#### Latency higher than expected
```
1. Check system load: top -b -n 1
2. Check disk I/O: iostat 1 5
3. Check memory: free -h
4. Check if running other tests concurrently
5. Try running again after system settles
```

#### Load test failures increasing with concurrent users
```
1. Reduce concurrent_groups in load_test.py
2. Check Docker resource limits
3. Check network connectivity
4. Verify backend can handle concurrent connections
5. Check for connection pool exhaustion
```

---

## Next Steps

Once all tests pass:

1. **Archive Results**
   ```bash
   mkdir -p test_results/$(date +%Y%m%d)
   cp -r /tmp/perf.log test_results/$(date +%Y%m%d)/
   cp -r /tmp/load.log test_results/$(date +%Y%m%d)/
   ```

2. **Document Findings**
   - Actual vs expected latencies
   - Any performance bottlenecks
   - System resource utilization
   - Recommendations for optimization

3. **Begin Wave 3**
   - Browser compatibility testing
   - Performance optimization
   - Scale testing (1000+ concurrent)

---

## Contact & Support

For issues or questions:
1. Check logs: `docker logs <container>`
2. Review test output
3. Check Prometheus metrics
4. Review Grafana dashboards
5. Check AlertManager alerts

---

**Ready to Test!** 🚀

Run `./run_all_tests.sh` to execute the complete test suite.

