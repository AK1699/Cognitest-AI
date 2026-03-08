# Phase 5: Production Deployment Execution Guide

**Phase**: Phase 5 (Final Execution)
**Purpose**: Execute production deployment following blue-green canary strategy
**Duration**: 6 hours total
**Date**: [Deployment Date]
**Status**: Ready for Execution

---

## Pre-Deployment Timeline

### T-7 Days: Notification Window
```bash
# Day 1: Send customer notification
Email: "Scheduled maintenance window coming on [Date]"
- Time: [X:XX AM - Y:YY AM UTC]
- Duration: ~6 hours
- What's new: List major features, improvements
- Impact: No downtime expected
- Support: Contact us at [support email]

# Post to status page
"Scheduled maintenance: [Date] [Time]. We'll be deploying new features with zero downtime."

# Notify stakeholders
- Engineering team (Slack #engineering)
- Support team (Slack #support)
- Management (Email)
```

### T-1 Day: Final Validation

```bash
# 1. Execute pre-deployment checklist
✅ Code quality review complete
✅ Security validation passed
✅ Infrastructure validation complete
✅ Testing verified (all 140+ tests pass)
✅ Documentation complete
✅ Team trained and ready

# 2. Staging environment final test
cd /path/to/cognitest-ai
docker-compose -f docker-compose.staging.yml up -d

# Run smoke tests
python scripts/smoke_tests.py
# Expected: All tests PASS ✅

# 3. Verify backup systems
# Database backup
docker exec cognitest-db pg_dump -U postgres cognitest > backup_pre_deployment_$(date +%Y%m%d).sql

# Verify restore works
docker exec cognitest-db psql -U postgres cognitest < backup_pre_deployment_*.sql

# 4. Schedule on-call team
# Confirm: On-call engineer, Technical lead available
# Setup: Incident bridge (Zoom) ready
# Test: Page system working

# 5. Prepare communication templates
# Status page updates ready
# Slack message templates ready
# Customer email ready
```

### T-0 (Deployment Day): 1 Hour Before Start

```bash
# 1. Team assembly
# All team members on call and on incident bridge
# Zoom: cognitest-incident-bridge
# Slack: #deployment-live

# 2. Dashboard setup
# Open Grafana dashboard: System Health
# Open Prometheus: Query latency, errors, CPU, memory
# Open application logs: tail -f /var/log/cognitest/*.log

# 3. Baseline metrics
echo "Recording baseline metrics..."
BASELINE_TIME=$(date +%s)
BASELINE_ERROR_RATE=$(curl -s http://localhost:9090/api/v1/query?query='rate(http_requests_total{status=~"5.."}[1m])' | jq '.data.result[0].value[1]')
BASELINE_LATENCY=$(curl -s http://localhost:9090/api/v1/query?query='histogram_quantile(0.95,http_requests_duration_seconds)' | jq '.data.result[0].value[1]')
BASELINE_MEMORY=$(free -h | grep Mem | awk '{print $3}')
BASELINE_CPU=$(top -b -n 1 | grep "Cpu(s)" | awk '{print $2}')

echo "Baseline - Error Rate: $BASELINE_ERROR_RATE, Latency P95: $BASELINE_LATENCY, Memory: $BASELINE_MEMORY, CPU: $BASELINE_CPU"

# 4. Final health check
curl http://localhost:8000/health
# Expected: {"status": "healthy"}

# 5. Announce in Slack
echo "Deployment starting in 1 minute. Current status: All systems green. 🟢"
```

---

## Phase 1: Blue-Green Setup (T+0 to T+15 minutes)

### Step 1: Verify Blue (Current) Environment

```bash
# Check current version running
docker ps -a | grep cognitest
kubectl get deployments -n cognitest

# Verify it's handling traffic normally
curl http://localhost:8000/api/v1/health
# Expected: {"status": "healthy", "version": "1.0.0"}

# Check current metrics
BLUE_ERROR_RATE=$(curl -s http://localhost:9090/api/v1/query?query='rate(http_requests_total{status=~"5.."}[1m])' | jq '.data.result[0].value[1]')
BLUE_LATENCY=$(curl -s http://localhost:9090/api/v1/query?query='histogram_quantile(0.95,http_requests_duration_seconds)' | jq '.data.result[0].value[1]')

echo "Blue Environment: Error Rate: $BLUE_ERROR_RATE, Latency: $BLUE_LATENCY"
```

### Step 2: Build Green Environment

```bash
# Build new version
echo "Building new version..."
cd /path/to/cognitest-ai

# Docker approach
docker build -t cognitest-backend:v1.1.0 -f backend/Dockerfile .
docker build -t cognitest-frontend:v1.1.0 -f frontend/Dockerfile .

# Tag as latest
docker tag cognitest-backend:v1.1.0 cognitest-backend:latest
docker tag cognitest-frontend:v1.1.0 cognitest-frontend:latest

# Or Kubernetes approach
kubectl set image deployment/backend backend=cognitest-backend:v1.1.0 -n cognitest --record
kubectl set image deployment/frontend frontend=cognitest-frontend:v1.1.0 -n cognitest --record

# Verify build successful
docker images | grep cognitest
# Expected: All images present with v1.1.0 tag
```

### Step 3: Security Scan Green Build

```bash
# Scan for vulnerabilities
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image --severity HIGH,CRITICAL cognitest-backend:v1.1.0

# Expected: High/Critical vulnerabilities: 0
# If found: Do NOT proceed, fix vulnerabilities first
```

### Step 4: Deploy Green in Staging

```bash
# Docker: Start green containers (on different ports)
docker-compose -f docker-compose.green.yml up -d

# Or Kubernetes: Scale up green replicas
kubectl scale deployment backend-green --replicas=3 -n cognitest

# Wait for startup
sleep 30

# Verify green is healthy
curl http://green-backend:8000/health
# Expected: {"status": "healthy", "version": "1.1.0"}

# Run health checks
for i in {1..10}; do
  curl -s http://green-backend:8000/api/v1/health | jq '.status'
  sleep 1
done
# Expected: All return "healthy"
```

### Step 5: Database Migrations (If Needed)

```bash
# Check if migrations needed
python scripts/check_migrations.py

# If migrations needed:
echo "Running database migrations..."

# Test in staging first
docker exec cognitest-db-staging psql -U postgres cognitest_staging \
  -c "BEGIN; [MIGRATION SQL]; ROLLBACK;"
# Expected: No errors

# Apply migrations (backward compatible)
docker exec cognitest-db psql -U postgres cognitest \
  -c "[MIGRATION SQL];"

# Verify schema change
docker exec cognitest-db psql -U postgres cognitest -c "SELECT * FROM [table];"

# Note: Execution time should be <5 minutes
```

**Status Check**:
```
✅ Blue environment: Running and healthy
✅ Green environment: Built, scanned, deployed
✅ Database: Migrated (if needed)
✅ Time elapsed: 15 minutes
```

---

## Phase 2: Canary Deployment - 10% Traffic (T+15 to T+75 minutes)

### Step 1: Route 10% Traffic to Green

```bash
# Docker/HAProxy approach
# Update load balancer config: 10% to green, 90% to blue

# Or Kubernetes approach
kubectl patch service cognitest-api -p \
  '{"spec": {"selector": {"version": "v1.1.0"}}}'

# Or use Istio/Kuma for advanced traffic splitting
kubectl apply -f - <<EOF
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: cognitest-api
spec:
  hosts:
  - cognitest-api
  http:
  - match:
    - uri:
        prefix: /
    route:
    - destination:
        host: cognitest-api-blue
      weight: 90
    - destination:
        host: cognitest-api-green
      weight: 10
EOF

# Verify traffic routing
echo "Traffic routing: 90% Blue, 10% Green"
```

### Step 2: Monitor First 5 Minutes (Critical Window)

```bash
# Every 30 seconds, check metrics
for i in {1..10}; do
  echo "=== Check $i (at T+$((i*30)) seconds) ==="

  # Error rate
  ERROR_RATE=$(curl -s http://localhost:9090/api/v1/query?query='rate(http_requests_total{status=~"5.."}[1m])' | jq '.data.result[0].value[1]')
  echo "Error Rate: $ERROR_RATE (target: <0.01)"

  # Latency
  LATENCY=$(curl -s http://localhost:9090/api/v1/query?query='histogram_quantile(0.95,http_requests_duration_seconds)' | jq '.data.result[0].value[1]')
  echo "Latency P95: $LATENCY ms (target: <120ms)"

  # Green health
  GREEN_HEALTH=$(curl -s http://green-backend:8000/health | jq '.status')
  echo "Green Status: $GREEN_HEALTH"

  # Check for errors in logs
  docker logs cognitest-green-backend 2>&1 | grep ERROR | tail -5

  sleep 30
done
```

### Step 3: Decision Point - After 1 Hour

**Success Criteria**:
```
✅ Error rate: <0.01 (baseline <0.005)
✅ Latency P95: <120ms (baseline ~100ms)
✅ Memory: Normal (no spikes)
✅ CPU: Normal (no spikes)
✅ No critical errors in logs
✅ Green version handling traffic normally
✅ User feedback: No complaints
```

**Decision Logic**:
```
IF all criteria met:
  → PROCEED to Phase 2 ✅
ELSE IF errors or issues:
  → ROLLBACK immediately ❌
  → Investigate root cause
  → Fix and restart deployment
```

**Rollback (If Needed)**:
```bash
# Immediate rollback
kubectl patch service cognitest-api -p \
  '{"spec": {"selector": {"version": "v1.0.0"}}}'

# Or
docker-compose -f docker-compose.blue.yml up -d --force-recreate

# Verify rollback complete
curl http://localhost:8000/api/v1/health
# Expected: {"status": "healthy", "version": "1.0.0"}

# Announce rollback
echo "Rollback complete. Investigating issue."
```

**Status Check**:
```
✅ 10% of users on green version
✅ No increased error rate
✅ Latency stable
✅ Decision: PROCEED or ROLLBACK
✅ Time elapsed: 60 minutes
```

---

## Phase 3: Phase 2 Deployment - 25% Traffic (T+75 to T+195 minutes)

### Step 1: Increase to 25% Traffic

```bash
# Update traffic split: 75% Blue, 25% Green
kubectl patch virtualservice cognitest-api --type merge -p \
  '{"spec":{"http":[{"route":[{"destination":{"host":"cognitest-api-blue"},"weight":75},{"destination":{"host":"cognitest-api-green"},"weight":25}]}]}}'

echo "Traffic routing: 75% Blue, 25% Green"
```

### Step 2: Monitor for 2 Hours

```bash
# Continuous monitoring (every 5 minutes)
while true; do
  TIME=$(date '+%H:%M:%S')

  ERROR_RATE=$(curl -s http://localhost:9090/api/v1/query?query='rate(http_requests_total{status=~"5.."}[5m])' | jq '.data.result[0].value[1]')
  LATENCY=$(curl -s http://localhost:9090/api/v1/query?query='histogram_quantile(0.95,http_requests_duration_seconds)' | jq '.data.result[0].value[1]')
  MEMORY=$(docker stats --no-stream cognitest-green-backend | tail -1 | awk '{print $7}')
  CPU=$(docker stats --no-stream cognitest-green-backend | tail -1 | awk '{print $3}')

  echo "[$TIME] Error: $ERROR_RATE, Latency: $LATENCY ms, Memory: $MEMORY, CPU: $CPU"

  # Check thresholds
  if (( $(echo "$ERROR_RATE > 0.02" | bc -l) )); then
    echo "ERROR RATE EXCEEDED! Considering rollback..."
  fi

  sleep 300  # Check every 5 minutes
done
```

**Success Criteria**:
```
✅ Error rate: <0.01 (stable)
✅ Latency: <120ms (stable)
✅ No memory leaks (linear growth only)
✅ CPU: <70% (headroom available)
✅ User feedback: Positive
✅ 25% of users seeing improvements
```

**Status Check**:
```
✅ 25% of users on green version
✅ All metrics stable and healthy
✅ No customer complaints
✅ Decision: PROCEED to Phase 3
✅ Time elapsed: 120 minutes
```

---

## Phase 4: Phase 3 Deployment - 50% Traffic (T+195 to T+375 minutes)

### Step 1: Increase to 50% Traffic

```bash
# Perfect split: 50% Blue, 50% Green
kubectl patch virtualservice cognitest-api --type merge -p \
  '{"spec":{"http":[{"route":[{"destination":{"host":"cognitest-api-blue"},"weight":50},{"destination":{"host":"cognitest-api-green"},"weight":50}]}]}}'

echo "Traffic routing: 50% Blue, 50% Green (Perfect Split)"
```

### Step 2: Extended Monitoring (3 Hours)

```bash
# Same monitoring as Phase 2 but run for 3 hours
# Continue checking every 5 minutes

# Additional checks at this stage:
# - Database replication lag
# - Session persistence
# - Data consistency across versions
```

**Success Criteria**:
```
✅ Both versions equally loaded
✅ Error rates matching (green ≤ blue)
✅ Latencies matching (green ≤ blue)
✅ No data corruption
✅ Sessions maintaining consistency
✅ Users can't tell difference
```

**Status Check**:
```
✅ 50% of users on green version
✅ Both versions performing equally
✅ Zero data issues
✅ Decision: PROCEED to Phase 4 (Full Rollout)
✅ Time elapsed: 180 minutes
```

---

## Phase 5: Phase 4 - Full Rollout - 100% Traffic (T+375 to T+390 minutes)

### Step 1: Route 100% Traffic to Green

```bash
# Complete cutover: All traffic to green
kubectl patch virtualservice cognitest-api --type merge -p \
  '{"spec":{"http":[{"route":[{"destination":{"host":"cognitest-api-green"},"weight":100}]}]}}'

# Or update service selector
kubectl patch service cognitest-api -p \
  '{"spec": {"selector": {"version": "v1.1.0"}}}'

echo "Traffic routing: 100% Green"
```

### Step 2: Final Verification (15 minutes)

```bash
# Immediate checks
for i in {1..3}; do
  echo "=== Final Check $i ==="
  curl http://localhost:8000/health
  docker ps | grep cognitest
  kubectl get pods -n cognitest | grep Running
  sleep 5
done

# Browser smoke test
# 1. Open http://localhost:3000
# 2. Log in
# 3. Launch browser
# 4. Verify: Video streams, latency <50ms, no errors

# API smoke test
curl -X POST http://localhost:8000/api/v1/executions \
  -H "Content-Type: application/json" \
  -d '{
    "browser_type": "chrome",
    "url": "https://example.com",
    "duration": 60
  }'
# Expected: Execution starts successfully

# Check all features
python scripts/smoke_tests_full.py
# Expected: All tests PASS ✅
```

### Step 3: Blue Decommission (After 24 Hours)

```bash
# Wait 24 hours to ensure stability
# Then safely remove blue environment

# Verify no traffic to blue
kubectl logs deployment/backend-blue -n cognitest | tail -10
# Expected: No requests

# Decommission blue
docker-compose -f docker-compose.blue.yml down -v

# Or Kubernetes
kubectl delete deployment backend-blue -n cognitest
kubectl delete service backend-blue -n cognitest

# Update documentation
echo "Blue environment decommissioned at $(date)"
```

**Status Check**:
```
✅ 100% of users on green version
✅ All metrics optimal
✅ All browsers working
✅ All features functional
✅ Zero errors
✅ DEPLOYMENT SUCCESSFUL! 🎉
```

---

## Post-Deployment (T+390 to T+1440 minutes - First 24 Hours)

### Hour 1: Immediate Post-Deployment

```bash
# 1. Health check every minute
while true; do
  curl http://localhost:8000/health
  sleep 60
done

# 2. Check all endpoints
curl http://localhost:8000/api/v1/users
curl http://localhost:8000/api/v1/executions
curl http://localhost:3000/api/health

# 3. Verify data integrity
docker exec cognitest-db psql -U postgres cognitest -c \
  "SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM executions;"

# 4. Check for errors
docker logs cognitest-backend 2>&1 | grep -i error | head -20
```

### Hours 2-24: Extended Monitoring

```bash
# Continuous monitoring dashboard (every 5 minutes)
# Check:
# - Error rate (target: <0.1%)
# - Latency (target: <100ms P95)
# - Memory (target: stable, no growth)
# - CPU (target: <70%)
# - Database connections (target: normal)
# - User sessions (target: stable count)

# Every hour: Generate summary report
echo "=== Hourly Report $(date) ==="
echo "Errors: $(curl -s ... | jq '.data.result[0].value[1]')"
echo "Latency: $(curl -s ... | jq '.data.result[0].value[1]')"
echo "Active Users: $(curl -s http://localhost:8000/api/v1/admin/stats | jq '.active_users')"
```

### Data Integrity Check

```bash
# Verify all user data intact
docker exec cognitest-db psql -U postgres cognitest -c \
  "SELECT COUNT(*) as users FROM users;"

# Verify all session data
docker exec cognitest-db psql -U postgres cognitest -c \
  "SELECT COUNT(*) as sessions FROM executions;"

# Verify recordings intact
ls -lh /mnt/recordings/ | wc -l
# Should match execution count

# Verify logs complete
docker logs cognitest-backend --tail=100 | wc -l
# Should show normal operation
```

### User Feedback Collection

```bash
# Send post-deployment survey
# "How is the new version working for you?"
# - Faster/Same/Slower
# - Any issues?
# - New features working?

# Monitor support tickets
# Check for new error reports
# Track any complaints

# Expected: Positive feedback, minimal issues
```

---

## Monitoring Dashboard Setup

### Grafana Dashboard: Deployment Progress

Create dashboard showing:

```
Panel 1: Traffic Distribution
- Y-axis: % of users
- X-axis: Time
- Series: Blue, Green
- Expected: Blue 100% → 90% → 75% → 50% → 0%
           Green 0% → 10% → 25% → 50% → 100%

Panel 2: Error Rate Comparison
- Blue error rate (should stay flat)
- Green error rate (should match or be lower)
- Target: Both <0.1%

Panel 3: Latency Comparison (P95)
- Blue latency (baseline)
- Green latency (should be similar or better)
- Target: Both <100ms

Panel 4: Resource Usage
- Blue CPU/Memory
- Green CPU/Memory
- Target: Both within limits

Panel 5: Phase Duration
- Phase 1 (canary): Should take 1 hour
- Phase 2 (25%): Should take 2 hours
- Phase 3 (50%): Should take 3 hours
- Phase 4 (100%): Instant
```

---

## Troubleshooting During Deployment

### Issue: High Error Rate During Canary

```bash
# Immediate action: ROLLBACK
kubectl patch service cognitest-api -p \
  '{"spec": {"selector": {"version": "v1.0.0"}}}'

# Investigation:
docker logs cognitest-green-backend 2>&1 | grep ERROR | head -20

# Check for common issues:
# 1. Database connection pool exhausted
# 2. WebRTC STUN/TURN unreachable
# 3. Memory spike/leak
# 4. Dependency issue (npm, pip package)

# Fix and restart
```

### Issue: Latency Spike at 25% Traffic

```bash
# Check if it's load-related
docker stats cognitest-green-backend

# If CPU >80%:
# 1. Scale up: kubectl scale deployment backend-green --replicas=5
# 2. Re-analyze: Maybe green has less efficient code
# 3. Rollback if issue persists

# If Memory spike:
# 1. Check for memory leak: Memory growth over time
# 2. Restart container: kubectl delete pod <pod-name>
# 3. Investigate: Review recent code changes
```

### Issue: Data Inconsistency Between Versions

```bash
# If users report data issues:
# 1. PAUSE deployment (keep at current %)
# 2. Investigate: Compare database states
# 3. If corruption: ROLLBACK to blue
# 4. Fix data and redeploy

# Comparison queries:
# Blue database: SELECT COUNT(*) FROM executions
# Green database: SELECT COUNT(*) FROM executions
# Should match exactly
```

---

## Sign-Offs

```
Deployment Team Sign-Offs:
- [ ] On-Call Engineer: _________________ Time: _______
- [ ] Technical Lead: _________________ Time: _______
- [ ] Engineering Manager: _________________ Time: _______

Post-Deployment Sign-Offs (After 24 hours):
- [ ] Engineering Lead: _________________ Time: _______
- [ ] Operations Lead: _________________ Time: _______
- [ ] Product Manager: _________________ Time: _______
```

---

## Success Checklist

### Pre-Deployment
- [ ] All tests passing (140+)
- [ ] Security scan clean
- [ ] Staging deployment successful
- [ ] Team trained and ready
- [ ] Customers notified
- [ ] Status page ready

### During Deployment
- [ ] Canary phase: Error rate <0.01 for 1 hour
- [ ] Phase 2: 25% users for 2 hours, all green
- [ ] Phase 3: 50% users for 3 hours, all green
- [ ] Phase 4: 100% rollout successful
- [ ] All smoke tests pass
- [ ] Zero data loss

### Post-Deployment (24 hours)
- [ ] Error rate <0.1% consistently
- [ ] Latency stable (<100ms P95)
- [ ] Memory stable (no growth)
- [ ] CPU <70%
- [ ] Database healthy
- [ ] User feedback positive
- [ ] No critical incidents

---

**Deployment Execution Guide Complete**: March 8, 2026 ✅
**Ready to Execute**: Phase 5 Deployment

