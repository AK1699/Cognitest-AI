# Wave 4: Incident Response Procedures

**Phase**: 6 Wave 4 (Production Readiness)
**Purpose**: Handle production incidents systematically
**Date**: March 8, 2026
**Status**: Complete

---

## Incident Response Overview

This guide provides step-by-step procedures for responding to production incidents, from detection through post-mortem analysis.

---

## Severity Classifications

### Severity 1 (Critical): Widespread Outage
- **User Impact**: >50% of users affected
- **Service**: Core features unavailable
- **Duration Target**: <5 minutes
- **Response**: Immediate all-hands incident response
- **Escalation**: Page on-call engineer immediately

**Examples**:
- Entire backend down
- Database completely unavailable
- WebRTC streaming not working for all users
- Authentication system down

### Severity 2 (Major): Significant Degradation
- **User Impact**: 10-50% of users affected
- **Service**: Important features degraded
- **Duration Target**: <15 minutes
- **Response**: Dedicated incident commander + technical lead
- **Escalation**: Page technical lead, notify manager

**Examples**:
- 25% of sessions failing
- Average latency >200ms
- Browser containers crashing intermittently
- Database queries timing out frequently

### Severity 3 (Minor): Limited Impact
- **User Impact**: <10% of users affected
- **Service**: Specific feature or user group impacted
- **Duration Target**: <1 hour
- **Response**: Single engineer investigation
- **Escalation**: Notify team lead if not resolved in 30 minutes

**Examples**:
- Single browser type broken (e.g., Safari only)
- Specific user account issue
- Non-critical feature unavailable
- Performance degradation in one region

### Severity 4 (Trivial): Single User or Cosmetic
- **User Impact**: Single user or internal only
- **Service**: Workaround available
- **Duration Target**: <24 hours
- **Response**: Standard troubleshooting
- **Escalation**: None required

**Examples**:
- Single user authentication issue
- UI rendering glitch
- Documentation error
- Non-critical log warnings

---

## Incident Response Phases

### Phase 1: Detection & Initial Response (0-2 minutes)

#### Automated Detection

```
Monitoring Alert → AlertManager → Slack Notification → On-Call Engineer
```

**Alert Rules**:
```
- Error Rate >2% for >2 minutes → CRITICAL
- Latency P95 >200ms for >5 minutes → CRITICAL
- HTTP 5xx errors >100/min → CRITICAL
- CPU >90% for >3 minutes → MAJOR
- Memory >85% for >3 minutes → MAJOR
- Failed health checks 3/3 → CRITICAL
- WebRTC connection failures >20% → MAJOR
```

#### Manual Detection

- User reports issue via Slack/Email/Support
- Team member notices unusual metrics
- Automated tests fail

#### Initial Steps (Immediately)

1. **Acknowledge incident**
   ```bash
   # Post to #incidents Slack channel
   "Incident: [Brief description] - Severity [1-4] - Investigating"
   ```

2. **Check if already mitigated**
   ```bash
   # Refresh monitoring dashboard
   # Check if alert is still firing
   # If resolved: Document as brief outage
   ```

3. **Page escalation if Severity 1**
   ```bash
   # Via PagerDuty or on-call system
   # Contact: On-Call Engineer, Technical Lead
   ```

4. **Open incident bridge** (Severity 1-2)
   ```bash
   # Start Zoom: cognitest-incident-bridge
   # Post link to #incidents
   # Attendees: On-Call Eng, Tech Lead, relevant engineers
   ```

5. **Start incident timer**
   ```bash
   # Note incident start time
   # Create ticket/document with: start_time, severity, description
   ```

### Phase 2: Triage & Root Cause Analysis (2-15 minutes)

#### 1. Determine Affected Service

```bash
# Check health endpoints
for svc in backend database redis frontend; do
  echo "=== $svc ==="
  curl http://localhost:8000/health/$svc
done

# Check error logs
docker logs cognitest-backend 2>&1 | grep ERROR | head -20

# Check metrics dashboard
# Prometheus: Query error_rate, latency_p95, cpu_usage
```

#### 2. Confirm User Impact

```bash
# Check active sessions
curl http://localhost:8000/api/v1/admin/sessions | jq '.active_sessions'

# Check success rate
curl http://localhost:9090/api/v1/query?query='rate(http_requests_total{status="200"}[5m])'

# Estimate % of users affected
# impacted_users = total_errors / total_requests
```

#### 3. Identify Root Cause

| Symptom | Likely Cause | Check Command |
|---------|--------------|----------------|
| High error rate, normal latency | Resource limit (connections/FDs) | `ulimit -a` |
| High latency, normal errors | CPU saturation | `top`, `docker stats` |
| Memory spike | Memory leak, buffer overflow | `docker stats`, memory graphs |
| Specific service down | Process crashed | `docker ps`, `systemctl status` |
| Database errors | DB connection pool exhausted | `psql ... pg_stat_activity` |
| WebRTC failures | STUN/TURN unreachable | `ping stun.example.com` |
| Browser crashes | OOM in container | `docker logs browser-*` |

#### 4. Severity Confirmation

Confirm incident severity based on actual impact:

```bash
# Error rate
ERROR_RATE=$(curl -s http://localhost:9090/api/v1/query?query='rate(http_requests_total{status=~"5.."}[1m])' | jq '.data.result[0].value[1]' | tr -d '"')

if (( $(echo "$ERROR_RATE > 0.02" | bc -l) )); then
  echo "CRITICAL: Error rate > 2%"
  SEVERITY=1
elif (( $(echo "$ERROR_RATE > 0.01" | bc -l) )); then
  echo "MAJOR: Error rate > 1%"
  SEVERITY=2
else
  echo "MINOR"
  SEVERITY=3
fi
```

### Phase 3: Mitigation (Action-Based)

#### Mitigation Actions by Root Cause

**Resource Exhaustion: Scale Up**

```bash
# Kubernetes
kubectl scale deployment browser-container --replicas=15 -n cognitest
kubectl scale deployment backend --replicas=5 -n cognitest

# Monitor mitigation
kubectl get pods -n cognitest --watch
watch -n 5 'curl http://localhost:9090/api/v1/query?query="rate(http_requests_total{status=~\"5..\"}[1m])"'

# Success criteria: Error rate drops to <0.5%
```

**Service Crash: Restart Service**

```bash
# Kubernetes
kubectl rollout restart deployment/backend -n cognitest

# Docker
docker-compose restart backend
docker-compose logs -f backend --tail=50

# Success criteria: Service becomes healthy
```

**Memory Leak: Restart Affected Containers**

```bash
# Identify high-memory containers
kubectl top pods -n cognitest | sort -k3 -rn | head -5

# Restart affected container (graceful)
kubectl delete pod <pod-name> -n cognitest
# New pod auto-creates via ReplicaSet

# Success criteria: Memory stabilizes
```

**Database Issues: Failover/Restart**

```bash
# If replication available: failover to standby
# Command depends on database system (PostgreSQL, etc.)

# If no replication: restart database
docker-compose restart database
docker exec cognitest-db psql -U postgres cognitest -c "SELECT 1;"

# Success criteria: Database responds
```

**Network Issues: Check Connectivity**

```bash
# Check STUN/TURN servers
timeout 5 bash -c 'cat </dev/null >/dev/tcp/stun.example.com/3478' && echo "STUN OK" || echo "STUN FAIL"
timeout 5 bash -c 'cat </dev/null >/dev/tcp/turn.example.com/3478' && echo "TURN OK" || echo "TURN FAIL"

# Check DNS
nslookup api.example.com
nslookup database.example.com

# Check firewall
telnet stun.example.com 3478
telnet database.example.com 5432

# Success criteria: Connectivity restored
```

**Code Bug: Rollback Deployment**

```bash
# Kubernetes rollback
kubectl rollout history deployment/backend -n cognitest
kubectl rollout undo deployment/backend -n cognitest

# Or manual deployment of previous version
kubectl set image deployment/backend backend=cognitest-backend:v1.2.3 -n cognitest

# Success criteria: Service restored
```

### Phase 4: Verification (5-10 minutes)

After mitigation, verify the fix:

```bash
# 1. Check error rate
curl -s http://localhost:9090/api/v1/query?query='rate(http_requests_total{status=~"5.."}[5m])'
# Target: <0.5%

# 2. Check latency
curl -s http://localhost:9090/api/v1/query?query='histogram_quantile(0.95,http_requests_duration_seconds)'
# Target: <100ms

# 3. Manual smoke test
# From UI: Try to execute a browser session
# Verify: Browser launches, latency reasonable, no errors

# 4. Check resource usage
docker stats --no-stream
kubectl top pods -n cognitest
# Verify: CPU <70%, Memory <80%

# 5. Check user complaints
# Monitor Slack for new incident reports
# If none: Incident mitigated

# Success: All checks pass
```

### Phase 5: Communication

#### Incident Bridge Update (Every 5-10 minutes)

```
"Current Status: [INVESTIGATING/MITIGATING/RESOLVED]
Affected: [% of users, which features]
Root Cause: [If known, describe problem]
Actions: [What we're doing to fix]
ETA: [Estimated resolution time]"
```

#### Customer Notification (Severity 1-2)

**Slack Announcement** (First 2 minutes):
```
":warning: We're experiencing an incident affecting [service].
Our team is investigating.
Status page: https://status.cognitest.com
```

**Status Page Update** (Ongoing):
```
INVESTIGATING: We're currently investigating reports of [issue].
Updates every 10 minutes.
```

**All Clear Announcement** (After resolution):
```
":white_check_mark: Incident resolved at [time].
Affected users: [%]
Duration: [minutes]
Root cause: [brief explanation]
Our apologize for the disruption."
```

### Phase 6: Post-Incident (Immediately After Resolution)

```bash
# 1. Record incident details
echo "
Incident Report
Time: $(date)
Severity: $SEVERITY
Root Cause: $ROOT_CAUSE
Duration: $DURATION minutes
Affected Users: $AFFECTED_PCT%
Mitigation: $MITIGATION_TAKEN
Time to Mitigation: $TTM minutes
" >> /var/log/cognitest/incidents.log

# 2. Close incident ticket
# Mark as RESOLVED
# Record: severity, root_cause, ttm, resolution

# 3. Schedule post-mortem
# If Severity 1-2: Schedule within 24 hours
# Include: on-call eng, tech lead, manager, affected team

# 4. Notify stakeholders
# Post to #incidents: "Incident resolved"
# Email: Customers (if Severity 1)
```

---

## Common Incident Scenarios

### Scenario 1: WebRTC Connection Failures

**Detection**: Alert: WebRTC failures >20%
**Duration Target**: <10 minutes

```bash
# Check STUN/TURN
ping stun.example.com
curl -v stun.example.com:3478

# Check firewall rules
iptables -L | grep 3478
iptables -L | grep 443

# Check coturn status
docker logs coturn | grep ERROR

# Restart STUN/TURN if needed
docker-compose restart coturn

# Fallback: Enable screenshot mode
curl -X POST http://localhost:8000/admin/config \
  -d '{"webrtc_enabled": false}'

# Success: WebRTC failures drop to <2%
```

### Scenario 2: Database Connection Pool Exhausted

**Detection**: Alert: DB connection timeout errors spike
**Duration Target**: <5 minutes

```bash
# Check connections
psql -h localhost -U postgres -d cognitest -c "SELECT count(*) FROM pg_stat_activity;"

# Check pool size
grep "pool_size" backend/config.py

# Increase pool size (temporary)
# In backend: connection_pool.max_size = 50

# Restart backend
docker-compose restart backend

# Verify
docker logs backend | grep "pool"

# Success: Connection errors resolve
```

### Scenario 3: Browser Container Memory Leak

**Detection**: Alert: Memory usage growing continuously
**Duration Target**: <5 minutes

```bash
# Identify affected containers
kubectl top pods -n cognitest --sort-by=memory | head -5

# Kill affected container (auto-restart)
kubectl delete pod <pod-name> -n cognitest

# Monitor for recurrence
kubectl logs -f <pod-name> -n cognitest | grep -i memory

# If recurring: Increase memory limit
kubectl set resources deployment browser-container \
  --limits=memory=3Gi -n cognitest

# Success: Memory stays stable after restart
```

### Scenario 4: High Latency (Single Region)

**Detection**: Alert: Latency P95 >200ms for >5 min
**Duration Target**: <15 minutes

```bash
# Check if regional
# Query metrics by region/AZ
curl http://localhost:9090/api/v1/query?query='histogram_quantile(0.95,http_requests_duration_seconds{region="us-west"})'

# Check network path
mtr -r -c 10 region-backend.example.com

# Check local resources
docker stats --no-stream
kubectl top nodes

# If CPU high: Scale up
kubectl scale deployment backend --replicas=6 -n cognitest

# If network issue: Failover to other region
# Update DNS: backend.example.com -> other-region-backend

# Success: Latency returns to <100ms
```

### Scenario 5: Cascade Failure (One Service Down Affects Others)

**Detection**: Multiple alerts firing
**Duration Target**: <10 minutes

```bash
# Example: Database down → Backend errors → WebRTC fails

# 1. Identify root cause
# Check which service failed first in logs
grep "ERROR" /var/log/cognitest/* | sort -t: -k1,1

# 2. Fix root cause
# If database: Restart/failover
# If backend: Restart with fresh connections
# If broker: Clear queue, restart

# 3. Monitor cascade clearing
# Watch error rate by service
# Should decrease as each service recovers

# Success: All services healthy, error rate <0.5%
```

---

## Post-Mortem Process

### Timing
- **Severity 1-2**: Post-mortem within 24 hours
- **Severity 3-4**: Post-mortem within 1 week (or skip if trivial)

### Attendees
- On-call engineer (responder)
- Technical lead
- Engineering manager
- Related team members (database, infrastructure, etc.)

### Template

```markdown
# Post-Mortem Report

## Incident Details
- **Title**: [Brief description]
- **Date/Time**: [When it happened]
- **Duration**: [How long]
- **Severity**: [1-4]
- **Affected Users**: [% and count]

## Timeline
- 14:32: Alert fired for high error rate
- 14:33: On-call engineer acknowledged
- 14:35: Root cause identified (database timeout)
- 14:37: Mitigation applied (increased pool size)
- 14:40: Error rate returned to normal
- **Total Time to Mitigation: 8 minutes**

## Root Cause
[Detailed explanation of what went wrong]

## Immediate Impact
- [List of affected features]
- [List of affected users]
- [Data loss: yes/no]

## Contributing Factors
1. [Why didn't existing monitoring catch this?]
2. [Were there any recent changes?]
3. [Any process gaps?]

## Resolution
[How was it fixed?]

## Action Items (To Prevent Recurrence)
- [ ] Action 1: [Description] - Owner: [Name] - Due: [Date]
- [ ] Action 2: [Description] - Owner: [Name] - Due: [Date]

## Lessons Learned
- [What did we learn?]
- [What went well?]
- [What could be better?]

---
**Post-Mortem Created**: [Date]
**Sign-Off**: [Manager name]
```

### Key Questions to Answer

1. **What caused this?** (Root cause)
2. **Why didn't we catch it sooner?** (Monitoring/prevention gaps)
3. **How do we prevent it?** (Action items)
4. **What did we learn?** (Process improvement)

---

## Incident Metrics & Tracking

### Key Metrics

| Metric | Target | Measured |
|--------|--------|----------|
| MTTR (Mean Time To Resolution) | <30 min | ___ |
| MTTD (Mean Time To Detect) | <5 min | ___ |
| Incidents per month | <3 | ___ |
| User-facing P1 incidents | 0 | ___ |
| Post-mortems completed | 100% | ___ |

### Incident Tracking

```bash
# View all incidents
cat /var/log/cognitest/incidents.log | jq '.' | less

# Query incidents by severity
cat /var/log/cognitest/incidents.log | jq 'select(.severity == 1)'

# Calculate MTTR
# (Sum of all resolution_times) / (Count of incidents)
```

---

## When to Escalate

- **5 minutes with no progress** → Escalate to Technical Lead
- **15 minutes still investigating** → Escalate to Manager
- **30+ minutes unresolved** → Page all hands, activate crisis mode
- **Any data loss suspected** → Immediately escalate to CTO
- **Any security issue suspected** → Immediately notify Security Team

---

## Success Checklist

✅ Incident detected within 2 minutes
✅ Root cause identified within 5 minutes
✅ Mitigation initiated within 10 minutes
✅ Service restored within 30 minutes (target)
✅ All stakeholders communicated to
✅ User impact quantified
✅ Post-mortem scheduled within 24 hours
✅ Action items assigned and tracked
✅ Monitoring improvements implemented

---

**Incident Response Procedures Complete**: March 8, 2026 ✅
**Next**: Capacity Planning Guide
