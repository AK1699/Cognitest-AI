# Phase 5: Rollback Procedures & Post-Deployment Validation

**Purpose**: Rollback guide and post-deployment validation checklist
**Status**: Quick reference during and after deployment

---

## ROLLBACK PROCEDURES

### Immediate Rollback (When to Use)

**Trigger Immediately If**:
```
✗ Error rate >2% (doubled from baseline)
✗ Latency P95 >200ms (doubled from baseline)
✗ Critical errors in logs (>10 errors/minute)
✗ Data corruption detected
✗ Service unavailable
✗ Any Severity 1 issue
```

### Rollback Steps (< 5 minutes)

#### Docker Rollback

```bash
#!/bin/bash
# Emergency rollback script

echo "=== ROLLBACK INITIATED ==="
ROLLBACK_TIME=$(date)
echo "Time: $ROLLBACK_TIME"

# 1. Stop green environment
echo "Stopping green environment..."
docker-compose -f docker-compose.green.yml down

# 2. Start blue environment (if not running)
echo "Ensuring blue environment is running..."
docker-compose -f docker-compose.blue.yml up -d

# 3. Verify blue is healthy
echo "Verifying blue environment health..."
for i in {1..10}; do
  STATUS=$(curl -s http://localhost:8000/health | jq '.status' 2>/dev/null)
  if [ "$STATUS" == '"healthy"' ]; then
    echo "✓ Blue environment healthy"
    break
  else
    echo "Waiting for blue to come up... ($i/10)"
    sleep 2
  fi
done

# 4. Route all traffic to blue
echo "Routing traffic back to blue..."
# Update load balancer config
# docker exec load-balancer update-config blue 100%

# Or update service selector
# docker service update --rollback cognitest-api

# 5. Verify traffic routing
echo "Verifying traffic routing..."
curl http://localhost:8000/api/v1/health | jq '.'
# Expected: version "1.0.0"

# 6. Monitor for 5 minutes
echo "Monitoring rollback for 5 minutes..."
for i in {1..30}; do
  ERROR_RATE=$(curl -s http://localhost:9090/api/v1/query?query='rate(http_requests_total{status=~"5.."}[1m])' | jq '.data.result[0].value[1]' 2>/dev/null)
  LATENCY=$(curl -s http://localhost:9090/api/v1/query?query='histogram_quantile(0.95,http_requests_duration_seconds)' | jq '.data.result[0].value[1]' 2>/dev/null)

  echo "[$i/30] Error Rate: $ERROR_RATE, Latency: $LATENCY ms"

  if (( $(echo "$ERROR_RATE < 0.01" | bc -l) )); then
    echo "✓ Rollback successful - metrics normalizing"
    break
  fi

  sleep 10
done

# 7. Announce rollback
echo "=== ROLLBACK COMPLETE ==="
echo "Deployment rolled back to version 1.0.0"
echo "Time completed: $(date)"
echo ""
echo "Next steps:"
echo "1. Investigate root cause"
echo "2. Fix issues"
echo "3. Redeploy with fixes"
```

#### Kubernetes Rollback

```bash
#!/bin/bash
# Kubernetes rollback script

echo "=== KUBERNETES ROLLBACK INITIATED ==="

# 1. Check rollout history
kubectl rollout history deployment/backend -n cognitest
# Shows all versions deployed

# 2. Rollback to previous version
echo "Rolling back to previous version..."
kubectl rollout undo deployment/backend -n cognitest
kubectl rollout undo deployment/frontend -n cognitest

# 3. Monitor rollback progress
echo "Monitoring rollback..."
kubectl rollout status deployment/backend -n cognitest --timeout=5m
kubectl rollout status deployment/frontend -n cognitest --timeout=5m

# 4. Verify pods are running
echo "Verifying pods..."
kubectl get pods -n cognitest -l app=backend
# Expected: All Running status

# 5. Verify traffic routing
kubectl get service cognitest-api -n cognitest -o jsonpath='{.spec.selector.version}'
# Expected: v1.0.0

# 6. Health check
POD=$(kubectl get pods -n cognitest -l app=backend -o jsonpath='{.items[0].metadata.name}')
kubectl exec -it $POD -n cognitest -- curl http://localhost:8000/health

# 7. Scale down green (if still running)
echo "Cleaning up green environment..."
kubectl scale deployment backend-green --replicas=0 -n cognitest
kubectl scale deployment frontend-green --replicas=0 -n cognitest

# 8. Announce rollback
echo "=== ROLLBACK COMPLETE ==="
kubectl logs -f deployment/backend -n cognitest --tail=50
```

### Manual Rollback Confirmation

```bash
# Verify rollback successful

# 1. Check deployed version
curl http://api.cognitest.com/api/v1/version
# Expected: {"version": "1.0.0"}

# 2. Check error metrics
curl 'http://prometheus:9090/api/v1/query?query=rate(http_requests_total{status=~"5.."}[5m])'
# Expected: Error rate <0.5%

# 3. Check latency
curl 'http://prometheus:9090/api/v1/query?query=histogram_quantile(0.95,http_requests_duration_seconds)'
# Expected: <100ms

# 4. Database data integrity
psql -h db.cognitest.com -U postgres -d cognitest -c \
  "SELECT COUNT(*) FROM executions WHERE created_at > NOW() - INTERVAL '1 hour';"
# Expected: Count shows recent data intact

# 5. Manual smoke test
# Open browser, log in, try to launch browser session
# Verify: Works without errors
```

### Incident Report (After Rollback)

```markdown
# Incident Report

## Summary
- **Time Started**: [Timestamp]
- **Time Detected**: [Timestamp]
- **Time Mitigated (Rollback)**: [Timestamp]
- **Total Duration**: [X minutes]
- **Users Affected**: [%]
- **Severity**: [1-4]

## What Happened
[Description of issue]

## Root Cause (Preliminary)
[What we think caused it]

## What We Did
1. [Step 1] at [time]
2. [Step 2] at [time]
3. Rolled back to v1.0.0 at [time]

## Impact
- Users affected: [%]
- Data loss: [Yes/No]
- Services affected: [List]

## Next Steps
1. Deep investigation required
2. Root cause analysis
3. Fix implementation
4. Additional testing before redeployment

## Follow-Up Meeting
- Post-mortem scheduled: [Date/Time]
- Attendees: [Names]
```

---

## POST-DEPLOYMENT VALIDATION

### Hour 1: Immediate Checks (Every 5 minutes)

```bash
#!/bin/bash
# Immediate post-deployment validation

echo "=== POST-DEPLOYMENT VALIDATION STARTING ==="
START_TIME=$(date +%s)

# Run for first hour (60 minutes)
for minute in {1..12}; do  # Check every 5 minutes for 60 minutes
  ELAPSED=$((minute * 5))
  echo ""
  echo "=== Check $minute (T+$ELAPSED minutes) ==="

  # 1. Error Rate
  ERROR_RATE=$(curl -s 'http://prometheus:9090/api/v1/query?query=rate(http_requests_total{status=~"5.."}[5m])' | jq '.data.result[0].value[1]')
  echo "Error Rate: $ERROR_RATE (target: <0.001 = 0.1%)"
  if (( $(echo "$ERROR_RATE > 0.01" | bc -l) )); then
    echo "⚠️  ERROR RATE HIGH - Consider rollback"
  fi

  # 2. Latency P95
  LATENCY=$(curl -s 'http://prometheus:9090/api/v1/query?query=histogram_quantile(0.95,http_requests_duration_seconds)' | jq '.data.result[0].value[1]')
  echo "Latency P95: ${LATENCY}ms (target: <100ms)"
  if (( $(echo "$LATENCY > 150" | bc -l) )); then
    echo "⚠️  LATENCY HIGH - Monitor closely"
  fi

  # 3. Memory Usage
  MEMORY=$(free -h | grep Mem | awk '{print $3 "/" $2}')
  echo "Memory: $MEMORY (target: <80% used)"

  # 4. CPU Usage
  CPU=$(top -b -n 1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us//')
  echo "CPU: ${CPU}% (target: <70%)"
  if (( $(echo "$CPU > 80" | bc -l) )); then
    echo "⚠️  CPU HIGH - May need to scale"
  fi

  # 5. Database Connections
  CONNECTIONS=$(docker exec cognitest-db psql -U postgres -d cognitest -t -c "SELECT count(*) FROM pg_stat_activity;")
  echo "DB Connections: $CONNECTIONS (target: <100)"

  # 6. Active Sessions
  SESSIONS=$(curl -s http://localhost:8000/api/v1/admin/stats | jq '.active_sessions')
  echo "Active Sessions: $SESSIONS"

  # 7. Critical Errors in Logs
  ERRORS=$(docker logs cognitest-backend 2>&1 | tail -100 | grep -i "ERROR\|EXCEPTION" | wc -l)
  echo "Critical Errors (last 100 lines): $ERRORS"
  if [ "$ERRORS" -gt 10 ]; then
    echo "⚠️  HIGH ERROR COUNT - Investigate logs"
    docker logs cognitest-backend 2>&1 | grep -i "ERROR" | tail -5
  fi

  # 8. Overall Status
  HEALTH=$(curl -s http://localhost:8000/health | jq '.status')
  echo "Overall Health: $HEALTH"

  if [ "$minute" -lt 12 ]; then
    echo "Next check in 5 minutes..."
    sleep 300
  fi
done

echo ""
echo "=== FIRST HOUR VALIDATION COMPLETE ==="
```

### Hours 2-24: Extended Monitoring

```bash
#!/bin/bash
# Extended monitoring (run continuously for 24 hours)

echo "=== EXTENDED MONITORING (24 HOURS) ==="

MONITORING_HOURS=24
CHECK_INTERVAL=300  # 5 minutes

for hour in $(seq 1 $MONITORING_HOURS); do
  for check in {1..12}; do  # 12 checks per hour × 5 min interval
    TIME=$(date '+%H:%M:%S')
    HOURS_ELAPSED=$(( (hour - 1) + (check / 12) ))

    echo ""
    echo "[$TIME] Hour $HOURS_ELAPSED/24"

    # Quick health check
    STATUS=$(curl -s http://localhost:8000/health | jq '.status')
    ERROR_RATE=$(curl -s 'http://prometheus:9090/api/v1/query?query=rate(http_requests_total{status=~"5.."}[5m])' | jq '.data.result[0].value[1]')
    LATENCY=$(curl -s 'http://prometheus:9090/api/v1/query?query=histogram_quantile(0.95,http_requests_duration_seconds)' | jq '.data.result[0].value[1]')

    echo "Status: $STATUS | Errors: $ERROR_RATE | Latency: ${LATENCY}ms"

    # Hourly detailed check
    if [ $check -eq 1 ]; then
      echo "=== HOURLY DETAILED CHECK ==="

      # Memory trend
      MEMORY=$(free -h | grep Mem | awk '{print $3}')
      echo "Memory: $MEMORY"

      # Database stats
      DB_SIZE=$(docker exec cognitest-db psql -U postgres -t -c "SELECT pg_size_pretty(pg_database_size('cognitest'));")
      echo "DB Size: $DB_SIZE"

      # User activity
      USERS=$(curl -s http://localhost:8000/api/v1/admin/stats | jq '.active_users')
      echo "Active Users: $USERS"

      # Error summary
      TOTAL_ERRORS=$(docker logs cognitest-backend --since 1h 2>&1 | grep -i ERROR | wc -l)
      echo "Errors (last hour): $TOTAL_ERRORS"
    fi

    sleep $CHECK_INTERVAL
  done
done

echo ""
echo "=== 24-HOUR MONITORING COMPLETE ==="
```

### Data Integrity Validation

```bash
#!/bin/bash
# Validate data integrity after deployment

echo "=== DATA INTEGRITY VALIDATION ==="

# 1. Database row counts
echo "1. Database Row Counts"
USERS=$(docker exec cognitest-db psql -U postgres -d cognitest -t -c "SELECT COUNT(*) FROM users;")
EXECUTIONS=$(docker exec cognitest-db psql -U postgres -d cognitest -t -c "SELECT COUNT(*) FROM executions;")
SESSIONS=$(docker exec cognitest-db psql -U postgres -d cognitest -t -c "SELECT COUNT(*) FROM sessions;")

echo "Users: $USERS"
echo "Executions: $EXECUTIONS"
echo "Sessions: $SESSIONS"

# Compare with backup before deployment
BACKUP_USERS=$(psql -U postgres -d cognitest_backup -t -c "SELECT COUNT(*) FROM users;")
if [ "$USERS" -ge "$BACKUP_USERS" ]; then
  echo "✓ User count increased (new data added)"
else
  echo "⚠️  User count decreased (possible data loss)"
fi

# 2. Data consistency
echo ""
echo "2. Data Consistency Checks"

# Check for orphaned records
ORPHANED=$(docker exec cognitest-db psql -U postgres -d cognitest -t -c \
  "SELECT COUNT(*) FROM executions WHERE user_id NOT IN (SELECT id FROM users);")
if [ "$ORPHANED" -eq 0 ]; then
  echo "✓ No orphaned execution records"
else
  echo "⚠️  Found $ORPHANED orphaned records"
fi

# 3. File integrity
echo ""
echo "3. File Integrity"

# Check recordings directory
RECORDINGS=$(find /mnt/recordings -type f | wc -l)
echo "Recording files: $RECORDINGS"

# Check logs directory
LOGS=$(find /var/log/cognitest -type f | wc -l)
echo "Log files: $LOGS"

# 4. Database replication
echo ""
echo "4. Database Replication Status"
docker exec cognitest-db psql -U postgres -d postgres \
  -c "SELECT slot_name, restart_lsn, confirmed_flush_lsn FROM pg_replication_slots;"
# Expected: All slots showing progress
```

### User Feedback & Monitoring

```bash
#!/bin/bash
# Collect user feedback and monitor support

echo "=== USER FEEDBACK COLLECTION ==="

# 1. Check support tickets
echo "1. Support Ticket Summary"
curl -s http://support-system:8000/api/tickets?status=open&created_after=deployment_time | jq '.tickets | length'
# Should be minimal or relating to expected features

# 2. Check user feedback channel
echo "2. User Feedback (Slack #feedback)"
echo "Check for messages about:"
echo "  - Performance improvements ✓"
echo "  - New features working ✓"
echo "  - Any issues or bugs ⚠️"

# 3. Net Promoter Score (if applicable)
echo "3. NPS Survey"
echo "Send: 'How would you rate the new Cognitest? (1-10)'"

# 4. Error tracking (Sentry/similar)
echo "4. Sentry Error Summary"
curl -s https://sentry.io/api/0/projects/[org]/[project]/events/ \
  | jq '.[] | select(.timestamp > "deployment_time") | .message' | head -10

# Expected: No new critical errors
```

---

## 24-Hour Post-Deployment Checklist

### All Systems

```
✓ Error rate <0.1% consistently
✓ Latency P95 <100ms consistently
✓ Memory usage stable (no growth pattern)
✓ CPU usage <70% consistent
✓ Database healthy and responding
✓ Disk space normal
✓ Backup/restore working
✓ All browsers working (Chrome, Firefox, Safari, Edge)
✓ WebRTC streaming functional
✓ Manual interaction responsive
✓ Console logs capturing
✓ Screenshots saving
✓ Videos recording

✓ No data corruption detected
✓ All user data intact
✓ No orphaned database records
✓ Replication lag <1 second
✓ No transaction rollbacks

✓ Team feedback: All green
✓ User feedback: Positive
✓ Support tickets: Normal volume
✓ No escalations
```

### Sign-Off Checklist

```
After 24 hours, if all checks pass:

Engineering Lead
- [ ] Reviewed all metrics
- [ ] Confirmed no issues
- [ ] Approved production
- Signature: _________________ Date: _______

Operations Lead
- [ ] Monitored systems
- [ ] Verified SLAs met
- [ ] Confirmed operational
- Signature: _________________ Date: _______

Product Manager
- [ ] Reviewed user feedback
- [ ] Confirmed features working
- [ ] Approved release
- Signature: _________________ Date: _______

CTO
- [ ] Overall deployment success
- [ ] Security validated
- [ ] Performance targets met
- Signature: _________________ Date: _______
```

---

## Final Success Criteria

```
✅ Deployment completed: Blue → Green (100%)
✅ Zero downtime achieved
✅ SLAs met: 99.9% uptime, <100ms P95
✅ All tests passing
✅ No data loss
✅ User experience improved
✅ Team confident in production version
✅ Ready for ongoing operations
✅ Ready for future feature development

DEPLOYMENT: SUCCESS 🎉
```

---

**Rollback & Validation Guide Complete** ✅

