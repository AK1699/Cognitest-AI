# Phase 5: Pre-Deployment Validation Checklist

**Purpose**: Verify everything is ready before starting deployment
**Duration**: 2-3 hours
**Status**: Execute before deployment

---

## Part 1: Code & Security Validation (45 minutes)

### 1.1 Code Quality Check

```bash
# Navigate to project
cd /path/to/cognitest-ai

# 1. Run all tests
echo "=== Running All Tests ==="
npm test --prefix frontend              # Frontend unit tests
pytest backend/tests/                    # Backend unit tests
python -m pytest --cov backend/          # Coverage report
vitest frontend/__tests__/               # Integration tests

# Expected output:
# ✓ Frontend tests: PASS (all tests)
# ✓ Backend tests: PASS (coverage >80%)
# ✓ No failing tests

# 2. Check linting
echo "=== Linting Check ==="
eslint frontend/                         # Frontend linting
flake8 backend/                          # Backend linting
pylint backend/                          # Python analysis

# Expected: No critical errors
# Acceptable: Warnings only

# 3. Type checking
echo "=== Type Checking ==="
tsc --noEmit                             # TypeScript
mypy backend/                            # Python type checking

# Expected: No type errors

# 4. Security audit
echo "=== Security Audit ==="
npm audit --prefix frontend              # JS dependencies
pip-audit --desc                         # Python dependencies

# Expected: No critical vulnerabilities
# If vulnerabilities found:
# - Fix: npm audit fix / pip install --upgrade
# - If can't fix: Document risk and proceed with caution
```

**Validation Result**:
- [ ] All tests passing
- [ ] No linting errors (warnings OK)
- [ ] Type checking pass
- [ ] No critical vulnerabilities

### 1.2 Build Verification

```bash
# Build both frontend and backend
echo "=== Building Frontend ==="
cd frontend
npm run build
# Expected: build/ directory created, no errors

echo "=== Building Backend ==="
cd ../backend
python setup.py build
# Expected: dist/ directory created, no errors

# Docker builds (if using containers)
echo "=== Docker Build ==="
docker build -t cognitest-frontend:v1.1.0 -f frontend/Dockerfile .
docker build -t cognitest-backend:v1.1.0 -f backend/Dockerfile .

# Expected: Both images build successfully
docker images | grep cognitest
```

**Validation Result**:
- [ ] Frontend build successful
- [ ] Backend build successful
- [ ] Docker images built (if applicable)

---

## Part 2: Infrastructure Validation (45 minutes)

### 2.1 Server Health Check

```bash
# Check all servers are running
echo "=== Server Health Check ==="

# Current production servers
for server in api.cognitest.com db.cognitest.com cache.cognitest.com; do
  echo "Checking $server..."
  ping -c 1 $server
  # Expected: Packets returned, latency <100ms
done

# SSH test (ensure access)
ssh -i ~/.ssh/cognitest.pem ubuntu@api.cognitest.com "echo 'SSH OK'"
# Expected: "SSH OK"
```

### 2.2 Database Validation

```bash
echo "=== Database Health Check ==="

# Connect to database
psql -h db.cognitest.com -U postgres -d cognitest -c "SELECT version();"
# Expected: PostgreSQL version info

# Check replication (if applicable)
psql -h db.cognitest.com -U postgres -d postgres \
  -c "SELECT slot_name, restart_lsn FROM pg_replication_slots;"
# Expected: All slots active

# Check database size
psql -h db.cognitest.com -U postgres -d cognitest \
  -c "SELECT pg_size_pretty(pg_database_size('cognitest'));"
# Expected: Size displayed

# Test backup
echo "Creating backup..."
pg_dump -h db.cognitest.com -U postgres cognitest | gzip > test_backup.sql.gz
# Expected: Backup file created

# Test restore
echo "Testing restore (dry run)..."
gunzip -c test_backup.sql.gz | head -100 | psql -h test-db.cognitest.com -U postgres
# Expected: No errors (on test server)

# Clean up
rm test_backup.sql.gz
```

**Validation Result**:
- [ ] All servers accessible
- [ ] Database healthy
- [ ] Replication working
- [ ] Backup/restore working

### 2.3 Monitoring System Check

```bash
echo "=== Monitoring System Check ==="

# Prometheus
curl http://prometheus.cognitest.com:9090/-/healthy
# Expected: Status 200

# Check metrics available
curl 'http://prometheus.cognitest.com:9090/api/v1/query?query=up' | jq '.status'
# Expected: "success"

# Grafana
curl http://grafana.cognitest.com:3000/api/health
# Expected: {"status":"ok"}

# AlertManager
curl http://alertmanager.cognitest.com:9093/api/v1/status | jq '.data'
# Expected: Status shown

# Test alert (create test alert)
curl -X POST http://alertmanager.cognitest.com:9093/api/v1/alerts \
  -H "Content-Type: application/json" \
  -d '[{"labels":{"alertname":"TestAlert"}}]'
# Expected: 200 OK

# Verify it fires
# Check Grafana/AlertManager dashboard
# Expected: Test alert appears
```

**Validation Result**:
- [ ] Prometheus responding
- [ ] Grafana dashboard accessible
- [ ] AlertManager working
- [ ] Alerts test firing correctly

### 2.4 Network & DNS Check

```bash
echo "=== Network & DNS Check ==="

# DNS resolution
nslookup api.cognitest.com 8.8.8.8
# Expected: Points to correct IP

# DNS resolution for staging (green)
nslookup api-green.cognitest.com 8.8.8.8
# Expected: Points to green server IP

# Network latency (internal)
ping -c 5 backend-internal.cognitest.com | tail -1
# Expected: <10ms latency

# Network latency (external)
ping -c 5 api.cognitest.com | tail -1
# Expected: <50ms latency

# STUN/TURN server connectivity
timeout 5 bash -c 'cat </dev/null >/dev/tcp/stun.cognitest.com/3478'
echo $?
# Expected: 0 (success)

timeout 5 bash -c 'cat </dev/null >/dev/tcp/turn.cognitest.com/3478'
echo $?
# Expected: 0 (success)
```

**Validation Result**:
- [ ] DNS resolving correctly
- [ ] Network latency acceptable
- [ ] STUN/TURN reachable

---

## Part 3: Application Validation (45 minutes)

### 3.1 Staging Environment Test

```bash
echo "=== Staging Environment Test ==="

# Deploy to staging (green environment)
docker-compose -f docker-compose.staging.yml up -d

# Wait for startup
sleep 30

# Health check
curl http://localhost:8000/health
# Expected: {"status": "healthy"}

# Run smoke tests
python scripts/smoke_tests.py
# Expected: All tests PASS

# Test browser launching
curl -X POST http://localhost:8000/api/v1/executions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -d '{
    "browser_type": "chrome",
    "url": "https://example.com",
    "duration": 30
  }'
# Expected: {"execution_id": "...", "status": "starting"}

# Verify execution starts
sleep 5
curl http://localhost:8000/api/v1/executions/$EXECUTION_ID \
  -H "Authorization: Bearer $TEST_TOKEN"
# Expected: {"status": "running", "browser_ready": true}

# Test manual interaction
curl -X POST http://localhost:8000/api/v1/executions/$EXECUTION_ID/actions/click \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -d '{"x": 100, "y": 100}'
# Expected: {"success": true}

# Stop execution
curl -X POST http://localhost:8000/api/v1/executions/$EXECUTION_ID/stop \
  -H "Authorization: Bearer $TEST_TOKEN"
# Expected: {"status": "stopped"}
```

**Validation Result**:
- [ ] Staging deployment successful
- [ ] All smoke tests pass
- [ ] Browser launching works
- [ ] Manual interaction works
- [ ] Execution lifecycle works

### 3.2 Performance Baseline

```bash
echo "=== Performance Baseline ==="

# Run performance test on staging
python scripts/browser_performance_test.py --environment staging

# Expected output should match Phase 2 baselines:
# Chrome: Click 4.2ms, Type 2.9ms, Screenshot 62ms
# If significantly different: Investigate before deployment

# Compare results
cat reports/wave_3_phase_2/performance_profiles_*.json > baseline.json
python -c "
import json

with open('baseline.json') as f:
  baseline = json.load(f)

for browser, metrics in baseline.items():
  print(f'{browser}:')
  print(f'  Click: {metrics[\"latencies\"][\"click\"][\"avg\"]}ms')
  print(f'  Type: {metrics[\"latencies\"][\"type\"][\"avg\"]}ms')
  print(f'  Screenshot: {metrics[\"latencies\"][\"screenshot\"][\"avg\"]}ms')
"

# If deviations:
# - <5%: Acceptable, proceed
# - 5-10%: Investigate, but can proceed
# - >10%: DO NOT PROCEED, investigate root cause
```

**Validation Result**:
- [ ] Performance matches baseline (within 10%)
- [ ] All metrics within expected ranges

### 3.3 Load Testing (Quick Check)

```bash
echo "=== Quick Load Test ==="

# Run 50-user load test (quick check)
python scripts/load_scaling_test.py --quick 30
# Runs: 10, 50, 100 users at 30 seconds each

# Expected results:
# 10 users: 99%+ success rate
# 50 users: 98%+ success rate
# 100 users: 98%+ success rate

# If any level fails:
# - Stop deployment
# - Investigate failure
# - Fix issue
# - Retry

# Check capacity estimate
python -c "
import json, glob
f = glob.glob('reports/wave_3_phase_3/load_scaling_report_*.json')[-1]
with open(f) as fp:
  data = json.load(fp)
  capacity = data['analysis']['capacity_analysis']
  print(f'Estimated Capacity: {capacity[\"estimated_capacity\"]} users')
  print(f'Recommended Max: {capacity[\"recommended_max_users\"]} users')
"
```

**Validation Result**:
- [ ] 10 users PASS
- [ ] 50 users PASS
- [ ] 100 users PASS
- [ ] Capacity estimate confirms >400 users

---

## Part 4: Team & Communication Validation (30 minutes)

### 4.1 Team Readiness

```bash
# Send Slack message to team
curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "Pre-deployment validation starting. Is everyone ready?",
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "Pre-deployment checklist:\n✓ Code quality: Pass\n✓ Security: Pass\n✓ Infrastructure: Pass\n✓ Performance: Pass\n\nStatus: Ready to deploy?"
        }
      }
    ]
  }'

# Verify team responses:
# - [ ] On-call Engineer confirmed ready
# - [ ] Technical Lead confirmed ready
# - [ ] Engineering Manager confirmed ready
# - [ ] Operations Team confirmed ready
```

### 4.2 Communication Channels

```bash
# Test Slack notification
curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
  -H 'Content-Type: application/json' \
  -d '{"text": "Test notification - Deployment ready 🚀"}'

# Expected: Message appears in #deployment-live channel

# Test email notification (for status page)
mail -s "Deployment Test" support@cognitest.com <<< "Test email"

# Expected: Email received (check spam folder)

# Verify status page
curl https://status.cognitest.com/
# Expected: Page loads normally
```

### 4.3 Schedule Confirmation

```bash
# Verify deployment window still correct
echo "Deployment scheduled for:"
echo "Date: [DEPLOYMENT_DATE]"
echo "Time: [DEPLOYMENT_TIME] UTC"
echo "Duration: 6 hours"
echo "Expected completion: [END_TIME] UTC"

# Confirm all stakeholders aware
# - [ ] Engineering team notified
# - [ ] Support team notified
# - [ ] Management notified
# - [ ] Customers notified (24 hours in advance)
```

---

## Part 5: Documentation Validation (15 minutes)

### 5.1 Runbook Verification

```bash
# Verify all documentation exists and is accessible
ls -la *.md | grep -E "WAVE_4|PHASE_5|DEPLOYMENT|INCIDENT|OPERATIONAL"

# Expected files present:
# ✓ PHASE_5_DEPLOYMENT_EXECUTION.md
# ✓ WAVE_4_OPERATIONAL_RUNBOOKS.md
# ✓ WAVE_4_INCIDENT_RESPONSE.md
# ✓ DEPLOYMENT_CHECKLIST.md

# Verify all critical links/commands in docs are correct
grep -r "http://localhost:" *.md | head -5
# Verify endpoints match actual services

# Print critical procedures for reference
echo "=== Critical Runbook URLs ==="
echo "Grafana Dashboard: http://grafana.cognitest.com:3000"
echo "Prometheus: http://prometheus.cognitest.com:9090"
echo "API Health: http://api.cognitest.com:8000/health"
echo "Incident Bridge: https://zoom.us/j/[ROOM_ID]"
echo "Slack Channel: #deployment-live"
```

---

## Final Validation Summary

### Green Light Checklist

```
CODE & SECURITY
✓ All 140+ tests passing
✓ No linting errors
✓ Type checking clean
✓ No critical vulnerabilities

INFRASTRUCTURE
✓ All servers accessible
✓ Database healthy & backed up
✓ Monitoring working
✓ Network latency acceptable
✓ STUN/TURN reachable

APPLICATION
✓ Staging deployment successful
✓ All smoke tests pass
✓ Performance matches baseline
✓ Load tests pass (50/100 users)

TEAM & COMMUNICATION
✓ All team members confirmed ready
✓ Slack channels working
✓ Status page accessible
✓ Customers notified
✓ Documentation complete

SIGN-OFF
✓ Engineering Lead: __________ ✓
✓ Operations Lead: __________ ✓
✓ On-Call Engineer: __________ ✓
```

### Red Light Check

**STOP and investigate if any of these are true**:
- ❌ Any tests failing
- ❌ Critical vulnerabilities found
- ❌ Database not responding
- ❌ Performance >10% deviation from baseline
- ❌ Load test failure
- ❌ Team not ready
- ❌ Status page down
- ❌ Documentation missing

---

## Final Status

```
Date: [DEPLOYMENT_DATE]
Time: [TIME]
Status: [READY / NOT READY]

If READY:
→ Proceed to Phase 5 Deployment Execution
→ Start with PHASE_5_DEPLOYMENT_EXECUTION.md

If NOT READY:
→ Document issues found
→ Fix issues
→ Re-run validation
→ Reschedule deployment
```

---

**Pre-Deployment Validation Complete** ✅
**Status**: Ready for execution

