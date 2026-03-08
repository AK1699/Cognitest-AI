# Wave 4: Operational Runbooks

**Phase**: 6 Wave 4 (Production Readiness)
**Purpose**: Step-by-step procedures for production operations
**Date**: March 8, 2026
**Status**: Complete

---

## Runbook Overview

This document contains operational procedures for running Cognitest-AI in production, covering daily operations, incident response, scaling, and troubleshooting.

---

## 1. Startup Procedure

### Prerequisites
- [ ] All secrets configured in environment variables
- [ ] Database credentials verified
- [ ] Network connectivity confirmed
- [ ] SSL certificates valid
- [ ] Disk space available (>50GB)
- [ ] System resources available (8GB RAM, 4 CPU cores minimum)

### Docker Startup (Development/Small Scale)

**Estimated Time**: 5 minutes

```bash
# 1. Navigate to project directory
cd /path/to/cognitest-ai

# 2. Verify environment variables
cat .env.production

# 3. Start services
docker-compose -f docker-compose.yml up -d

# 4. Wait for services to start
sleep 10

# 5. Verify all containers running
docker ps

# Expected output: frontend, backend, database, redis, coturn services running

# 6. Health check
curl http://localhost:8000/health
# Expected: {"status": "healthy"}

# 7. Check logs
docker-compose logs -f --tail=100

# 8. Stop on signal (Ctrl+C)
```

### Kubernetes Startup (Production Scale)

**Estimated Time**: 10 minutes

```bash
# 1. Verify kubeconfig
kubectl cluster-info

# 2. Deploy configuration
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml

# 3. Deploy services (in order)
kubectl apply -f k8s/database-deployment.yaml
sleep 30
kubectl apply -f k8s/redis-deployment.yaml
sleep 10
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml

# 4. Verify deployments
kubectl get deployments -n cognitest

# Expected: All deployments READY (e.g., 3/3)

# 5. Verify pods running
kubectl get pods -n cognitest

# Expected: All pods Running status

# 6. Check service endpoints
kubectl get services -n cognitest

# 7. Scale browser containers
kubectl scale deployment browser-container --replicas=10 -n cognitest

# 8. Verify scaling
kubectl get pods -n cognitest | grep browser

# 9. View logs
kubectl logs -f -l app=backend -n cognitest --tail=100

# 10. Health check
kubectl exec -it <backend-pod-name> -n cognitest -- curl http://localhost:8000/health
```

### Startup Checklist

- [ ] All services started successfully
- [ ] Database connections established
- [ ] Redis cache accessible
- [ ] Backend API responding to health checks
- [ ] Frontend serving assets correctly
- [ ] Browser containers (Docker/K8s) available
- [ ] STUN/TURN servers reachable
- [ ] Monitoring (Prometheus) scraping targets
- [ ] Logging (ELK/Loki) receiving logs
- [ ] Alerts configured and active

---

## 2. Shutdown Procedure

### Graceful Shutdown (Preferred)

**Estimated Time**: 2 minutes per 100 active users

```bash
# 1. Announce maintenance
# Send message to Slack: "Maintenance window starting in 10 minutes"

# 2. Set maintenance mode (prevents new sessions)
curl -X POST http://localhost:8000/admin/maintenance/enable

# 3. Wait for existing sessions to complete (max 5 minutes)
sleep 300

# 4. Check active sessions
curl http://localhost:8000/admin/sessions/active
# Should return minimal count

# 5. Drain connections gracefully
docker-compose down  # OR: kubectl delete -f k8s/ --grace-period=30

# 6. Verify shutdown (should complete in <2 minutes)
docker ps  # Should show stopped containers
kubectl get pods -n cognitest  # Should show no running pods

# 7. Post-shutdown checks
docker volume ls  # Verify data volumes intact
kubectl get pvc -n cognitest  # Verify persistent volumes intact

# 8. Announce completion
# Send message to Slack: "Maintenance complete"
```

### Emergency Shutdown (System Failure)

**Estimated Time**: 30 seconds (data loss possible)

```bash
# 1. Kill all containers immediately
docker-compose kill  # OR: kubectl delete pods -n cognitest --all

# 2. Verify stopped
docker ps  # Should show no running containers

# 3. Check system status
free -h  # Verify memory freed
df -h   # Verify disk space

# 4. Document incident
# Create incident report with timestamp and reason for emergency shutdown
```

---

## 3. Scaling Procedures

### Scale Up (Add Capacity)

**When**: CPU >70%, Memory >75%, or Error Rate >1%
**Estimated Time**: 5-10 minutes

#### Docker Scaling

```bash
# 1. Check current capacity
docker ps | grep browser-container | wc -l
# Note current count (e.g., 5 browsers)

# 2. Check system resources
free -h  # Verify RAM available
df -h   # Verify disk space
top -b -n 1 | head -5  # Check CPU

# 3. Calculate new count
# Rule: 1 browser = 30MB RAM, add containers until 75% RAM utilization
# Current: 250MB (base) + (5 × 30MB) = 400MB
# Available: 8GB = 8000MB
# Capacity: (8000MB × 0.75 - 250MB) / 30MB = 198 containers per host

# 4. Launch additional containers
for i in {6..10}; do
  docker run -d \
    --name browser-container-$i \
    --memory=2g \
    -p 700$i:7000 \
    cognitest-browser-streaming:latest
done

# 5. Verify new containers
docker ps | grep browser-container | wc -l
# Should show 10

# 6. Update load balancer (if applicable)
# Add new container IPs to load balancer configuration

# 7. Test new containers
curl http://localhost:7001/health
curl http://localhost:7010/health
# Expected: All respond with 200 OK

# 8. Verify metrics
# Check Prometheus dashboard: CPU <50%, Memory <60%
```

#### Kubernetes Scaling

```bash
# 1. Check current replicas
kubectl get deployment browser-container -n cognitest

# 2. Check resource utilization
kubectl top nodes -n cognitest
kubectl top pods -n cognitest

# 3. Scale up
kubectl scale deployment browser-container --replicas=15 -n cognitest

# 4. Verify new pods starting
kubectl get pods -n cognitest | grep browser-container
# Watch until all show "Running"

# 5. Verify traffic distribution
kubectl logs -l app=browser-container -n cognitest | tail -20

# 6. Check metrics
# Verify Prometheus shows reduced CPU/Memory pressure

# 7. Monitor for 10 minutes
# Ensure no errors in new containers
```

### Scale Down (Remove Capacity)

**When**: CPU <30% for >30 minutes AND no requests pending
**Estimated Time**: 5-10 minutes

```bash
# 1. Verify safe to scale down
# Check: No long-running sessions, CPU consistently low

# 2. Docker scale down
# Identify lowest-traffic containers
docker stats --no-stream | grep browser-container | sort -k8 | head -5

# 3. Gracefully terminate (wait for session completion)
docker stop browser-container-10 browser-container-9
sleep 120  # Wait for any active sessions to complete

# 4. Verify no active connections
docker logs browser-container-10 | grep -i "active\|session"

# 5. Remove containers
docker rm browser-container-10 browser-container-9

# OR Kubernetes scale down
kubectl scale deployment browser-container --replicas=10 -n cognitest

# 6. Verify scale down
docker ps | grep browser-container | wc -l
kubectl get pods -n cognitest | grep browser-container | wc -l

# 7. Verify metrics
# CPU/Memory should increase slightly but remain balanced
```

---

## 4. Database Operations

### Backup Procedure

**Frequency**: Daily at 2 AM UTC
**Estimated Time**: 5 minutes per GB of data

```bash
# 1. Trigger backup
# Automated: Via cron job
# Manual:
docker exec cognitest-db pg_dump -U postgres cognitest > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Verify backup integrity
docker exec cognitest-db psql -U postgres cognitest -c "SELECT COUNT(*) FROM users;"

# 3. Archive backup
tar czf cognitest_backup_$(date +%Y%m%d_%H%M%S).sql.tar.gz backup_*.sql

# 4. Upload to cloud storage (AWS S3, GCS, etc.)
aws s3 cp cognitest_backup_*.sql.tar.gz s3://cognitest-backups/

# 5. Verify upload
aws s3 ls s3://cognitest-backups/ | tail -5

# 6. Clean local backups (keep last 7 days)
find . -name "cognitest_backup_*.sql.tar.gz" -mtime +7 -delete
```

### Restore Procedure

**Estimated Time**: 10 minutes per GB of data

```bash
# 1. Download backup from cloud storage
aws s3 cp s3://cognitest-backups/cognitest_backup_20260308_020000.sql.tar.gz .

# 2. Extract backup
tar xzf cognitest_backup_20260308_020000.sql.tar.gz

# 3. Stop application (if running)
docker-compose down  # OR: kubectl scale deployment --replicas=0

# 4. Restore database
docker exec -i cognitest-db psql -U postgres cognitest < backup_20260308_020000.sql

# 5. Verify restoration
docker exec cognitest-db psql -U postgres cognitest -c "SELECT COUNT(*) FROM users;"
docker exec cognitest-db psql -U postgres cognitest -c "SELECT COUNT(*) FROM executions;"

# 6. Restart application
docker-compose up -d  # OR: kubectl scale deployment --replicas=3

# 7. Test functionality
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/users

# 8. Monitor logs for errors
docker-compose logs -f --tail=50 backend
```

### Database Maintenance

**Weekly (Sunday 3 AM UTC)**:

```bash
# 1. Vacuum and analyze
docker exec cognitest-db psql -U postgres cognitest -c "VACUUM ANALYZE;"

# 2. Reindex (if fragmentation >20%)
docker exec cognitest-db psql -U postgres cognitest -c "REINDEX DATABASE cognitest;"

# 3. Check for corruption
docker exec cognitest-db pg_verify_checksums -D /var/lib/postgresql/data

# 4. Update statistics
docker exec cognitest-db psql -U postgres cognitest -c "ANALYZE;"

# 5. Verify connection health
docker exec cognitest-db psql -U postgres cognitest -c "SELECT * FROM pg_stat_activity WHERE state IS NOT NULL;"
```

---

## 5. Monitoring and Alerting

### Daily Health Check

**Run**: Every morning (9 AM UTC)

```bash
# 1. System resources
echo "=== SYSTEM RESOURCES ==="
free -h
df -h
top -b -n 1 | head -10

# 2. Service health
echo "=== SERVICE HEALTH ==="
curl http://localhost:8000/health
curl http://localhost:3000/api/health  # Frontend

# 3. Active sessions
echo "=== ACTIVE SESSIONS ==="
curl http://localhost:8000/api/v1/admin/sessions | jq '.active_sessions'

# 4. Error rate (last hour)
echo "=== ERROR RATE ==="
curl http://localhost:9090/api/v1/query?query='rate(http_requests_total{status=~\"5..\"}[1h])'

# 5. Database health
echo "=== DATABASE HEALTH ==="
docker exec cognitest-db psql -U postgres cognitest -c \
  "SELECT datname, usename, state, count(*) FROM pg_stat_activity GROUP BY datname, usename, state;"

# 6. Disk usage
echo "=== DISK USAGE ==="
du -sh /* | sort -rh | head -10

# 7. Container logs (check for errors)
echo "=== ERROR LOGS ==="
docker-compose logs --since 1h backend | grep -i error | tail -10

# 8. Alert summary
echo "=== OPEN ALERTS ==="
curl http://localhost:9093/api/v1/alerts | jq '.data[] | select(.status=="firing")'
```

### Weekly Review

**Run**: Every Monday (10 AM UTC)

```bash
# 1. Capacity trends
# Review Grafana dashboard: System Metrics → CPU/Memory trends
# Check: Are we trending toward limits?

# 2. Performance trends
# Review Grafana dashboard: Performance → Latency trends
# Check: Any degradation over time?

# 3. Error trends
# Review Grafana dashboard: Errors → Error rate trends
# Check: Any spike patterns?

# 4. Incident review
# Check AlertManager: Recent alerts and resolutions
# Verify: All were handled appropriately

# 5. Scaling analysis
# Review: Current vs. historical resource utilization
# Decide: Do we need to scale up/down?

# 6. Cost analysis
# Check: Current infrastructure costs vs. budget
# Optimize: Any cost-saving opportunities?
```

---

## 6. Common Procedures

### Adding New User

```bash
# 1. Create user via API
curl -X POST http://localhost:8000/api/v1/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "User Name",
    "password": "TempPassword123!",
    "role": "user"
  }'

# 2. User receives welcome email (automated)
# Email: Confirm email and set permanent password

# 3. Verify user can log in
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "TempPassword123!"}'
```

### Rotating Secrets

**Frequency**: Every 90 days for API keys, Every 6 months for database passwords

```bash
# 1. Generate new secret
openssl rand -base64 32

# 2. Update in secrets management system
# AWS Secrets Manager / HashiCorp Vault / Kubernetes Secrets

# 3. Update application configuration
# For Kubernetes:
kubectl create secret generic api-keys --from-literal=key=newkey --dry-run=client -o yaml | kubectl apply -f -

# 4. Restart affected services (gradual rolling restart)
# For Kubernetes:
kubectl rollout restart deployment/backend -n cognitest

# 5. Verify no errors in new pods
kubectl logs -f -l app=backend -n cognitest --tail=100

# 6. Document rotation in audit log
echo "Secret rotated: api-keys on $(date)" >> /var/log/cognitest/audit.log
```

### Viewing Logs

```bash
# Real-time backend logs
docker logs -f cognitest-backend

# Or Kubernetes:
kubectl logs -f deployment/backend -n cognitest

# View error logs only
docker logs cognitest-backend 2>&1 | grep ERROR

# View last N lines
docker logs --tail=100 cognitest-backend

# View from specific timestamp
docker logs --since=2h cognitest-backend

# Redirect to file for analysis
docker logs cognitest-backend > backend.log 2>&1
```

---

## Troubleshooting Decision Tree

### Issue: High Latency (>100ms)

```
1. Check browser container CPU
   - If >80%: Scale up browser containers
   - If <50%: Check network latency (ping servers)

2. Check WebRTC connection quality
   - View browser console for warnings
   - Check STUN/TURN server reachability

3. Check FFmpeg encoding
   - Monitor CPU: docker stats
   - Monitor dropped frames: docker logs
   - If dropping frames: Reduce quality setting

4. Check database queries
   - Review slow query log
   - Identify expensive queries (N+1 problems)
   - Optimize or add indexes

Action: Run `python scripts/performance_optimization_test.py`
```

### Issue: High Memory Usage (>80% of limit)

```
1. Identify which service is using memory
   - docker stats (shows per-container)
   - kubectl top pods (shows per-pod)

2. If browser-container:
   - Check for memory leaks in WebRTC connections
   - Restart affected containers
   - Check: Are sessions properly cleanup up?

3. If backend:
   - Check for cache accumulation
   - Monitor database connection pool
   - Review recent code changes

4. If database:
   - Run VACUUM ANALYZE
   - Check for long-running transactions
   - Review slow queries

Action: Scale up immediately, then investigate
```

### Issue: High Error Rate (>1%)

```
1. Check error type
   - Connection errors: Check network/STUN-TURN
   - Timeout errors: Check service responsiveness
   - Application errors: Check logs for stack traces

2. Identify affected service
   - View dashboard: Errors by service
   - Check logs: grep ERROR

3. Impact assessment
   - How many users affected?
   - Which features are affected?
   - Is it degrading?

4. Immediate action
   - If <5% users: Monitor and investigate
   - If 5-50% users: Scale up affected service
   - If >50% users: Page on-call engineer

Action: Investigate root cause while mitigating
```

---

## Escalation Procedures

### Level 1: On-Call Engineer (First 30 minutes)

- Assess severity
- Execute troubleshooting procedure
- Page escalation if needed

### Level 2: Team Lead (If Level 1 can't resolve in 30 minutes)

- Approve emergency changes
- Provide additional context
- Authorize scaling/restarts

### Level 3: Engineering Manager (If not resolved in 1 hour)

- Authorize extended outages
- Communicate with customers
- Post-mortem scheduling

---

## Success Metrics

✅ All procedures tested at least monthly
✅ Team trained on all runbooks
✅ Average startup time: <5 minutes
✅ Average graceful shutdown: <2 minutes
✅ Backup/restore tested quarterly
✅ Zero data loss in production
✅ RTO (Recovery Time Objective): <15 minutes
✅ RPO (Recovery Point Objective): <1 hour

---

**Operational Runbooks Complete**: March 8, 2026 ✅
**Next**: Incident Response Procedures
