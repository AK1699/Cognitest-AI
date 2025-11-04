# Database Data Sync Guide

How to copy the same database data from one laptop to another.

## Overview

There are 3 methods to sync database data:

1. **pg_dump + SQL file** (Recommended) - Full backup and restore
2. **Cloud storage** - For easy sharing
3. **Direct PostgreSQL transfer** - For network-connected laptops

---

## Method 1: Using pg_dump (Recommended)

Best for: Complete data backup and transfer via file

### On Source Laptop (Current Machine)

**Step 1: Backup the database**

```bash
# Backup entire database with data
pg_dump -U postgres cognitest > cognitest_backup.sql

# Or for compressed backup (smaller file)
pg_dump -U postgres -Fc cognitest > cognitest_backup.dump
```

**Step 2: Verify the backup**

```bash
# Check file size
ls -lh cognitest_backup.sql

# Quick sanity check (should contain CREATE TABLE, INSERT statements)
head -20 cognitest_backup.sql
```

**Step 3: Transfer the file to other laptop**

Choose one:

```bash
# Option A: Using AirDrop (macOS)
# Just drag the file to the other Mac

# Option B: Using email/cloud
# Email the file or upload to Google Drive, Dropbox, etc.

# Option C: Using scp (if both on same network)
scp cognitest_backup.sql user@other-laptop:/path/to/backend/

# Option D: Using a USB drive
# Copy file to USB and transfer physically
```

### On Target Laptop (Other Machine)

**Step 1: Ensure database exists**

```bash
# Create fresh database (skip if exists)
createdb cognitest
```

**Step 2: Drop existing data (if needed)**

```bash
# If you want to replace existing data
dropdb cognitest
createdb cognitest
```

**Step 3: Restore the backup**

```bash
# For SQL file backup
psql -U postgres cognitest < cognitest_backup.sql

# Or for compressed backup
pg_restore -U postgres -d cognitest cognitest_backup.dump
```

**Step 4: Verify restoration**

```bash
# Check if data exists
psql -U postgres -d cognitest -c "SELECT COUNT(*) FROM users;"
psql -U postgres -d cognitest -c "SELECT COUNT(*) FROM projects;"

# Check a few records
psql -U postgres -d cognitest -c "SELECT * FROM users LIMIT 5;"
```

---

## Method 2: Using Cloud Storage (Easiest Sharing)

Best for: Easy file transfer between laptops

### Upload Backup

```bash
# On source laptop, create backup
pg_dump -U postgres cognitest > cognitest_backup.sql

# Upload to cloud storage (Google Drive, Dropbox, OneDrive, etc.)
# Or use command line:

# For Google Drive (if installed):
# Or upload manually through web interface

# For AWS S3:
aws s3 cp cognitest_backup.sql s3://your-bucket/cognitest_backup.sql

# For DigitalOcean Spaces:
aws s3 cp cognitest_backup.sql s3://your-space/cognitest_backup.sql --endpoint-url https://your-region.digitaloceanspaces.com
```

### Download and Restore

```bash
# On target laptop
# Download the file from cloud storage

# Restore
createdb cognitest
psql -U postgres cognitest < cognitest_backup.sql
```

---

## Method 3: Direct PostgreSQL Transfer (Network)

Best for: If both laptops are on same network

### On Source Laptop

```bash
# Create a backup file
pg_dump -U postgres cognitest > cognitest_backup.sql

# Start a simple HTTP server to share the file
cd /path/to/backup
python3 -m http.server 8000

# Note the URL: http://YOUR_IP:8000/cognitest_backup.sql
# Find your IP:
ifconfig | grep inet
```

### On Target Laptop

```bash
# Download from source laptop
curl -O http://SOURCE_IP:8000/cognitest_backup.sql

# Or using wget
wget http://SOURCE_IP:8000/cognitest_backup.sql

# Restore
createdb cognitest
psql -U postgres cognitest < cognitest_backup.sql
```

---

## Complete Script for One-Command Backup

Save this as `backup_db.sh` in your backend directory:

```bash
#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="cognitest_backup_${TIMESTAMP}.sql"

echo -e "${BLUE}Starting database backup...${NC}"

# Backup database
pg_dump -U postgres cognitest > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
    echo -e "${GREEN}✓ Backup successful!${NC}"
    echo -e "  File: $BACKUP_FILE"
    echo -e "  Size: $SIZE"
    echo ""
    echo "To restore on another laptop:"
    echo "  1. Transfer the file: $BACKUP_FILE"
    echo "  2. Run: createdb cognitest"
    echo "  3. Run: psql -U postgres cognitest < $BACKUP_FILE"
else
    echo "Backup failed!"
    exit 1
fi
```

Make it executable:

```bash
chmod +x backup_db.sh
./backup_db.sh
```

---

## Complete Script for One-Command Restore

Save this as `restore_db.sh` in your backend directory:

```bash
#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

if [ -z "$1" ]; then
    echo "Usage: ./restore_db.sh <backup_file>"
    echo ""
    echo "Available backups:"
    ls -lh cognitest_backup*.sql 2>/dev/null || echo "No backup files found"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: File not found: $BACKUP_FILE${NC}"
    exit 1
fi

echo -e "${BLUE}This will replace the current database!${NC}"
echo "File: $BACKUP_FILE"
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

echo -e "${BLUE}Dropping existing database...${NC}"
dropdb -U postgres cognitest 2>/dev/null || true

echo -e "${BLUE}Creating fresh database...${NC}"
createdb -U postgres cognitest

echo -e "${BLUE}Restoring backup...${NC}"
if psql -U postgres cognitest < "$BACKUP_FILE"; then
    echo -e "${GREEN}✓ Restore successful!${NC}"

    # Show stats
    echo ""
    echo "Database statistics:"
    psql -U postgres -d cognitest -c "SELECT
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM projects) as projects,
        (SELECT COUNT(*) FROM test_plans) as test_plans,
        (SELECT COUNT(*) FROM test_cases) as test_cases;"
else
    echo -e "${RED}Restore failed!${NC}"
    exit 1
fi
```

Make it executable:

```bash
chmod +x restore_db.sh
./restore_db.sh cognitest_backup_20251104_120000.sql
```

---

## Comparison of Methods

| Method | Pros | Cons | Best For |
|--------|------|------|----------|
| **pg_dump + File** | Simple, reliable, portable | Need to transfer file | Most use cases |
| **Cloud Storage** | Easy sharing, no network setup | Extra upload/download step | Sharing with team |
| **Network Transfer** | Fast on same network | Requires network access | Same WiFi network |

---

## Tips & Best Practices

### Before Backing Up

```bash
# Ensure database is not being used
psql -U postgres -d cognitest -c "SELECT datname, usename, application_name FROM pg_stat_activity WHERE datname='cognitest';"

# Stop application if running
# Ctrl+C in terminal where uvicorn is running
```

### Backup Size Optimization

```bash
# Exclude large tables if needed
pg_dump -U postgres cognitest --exclude-table=document_chunks > cognitest_backup.sql

# Or compress for smaller file
pg_dump -U postgres cognitest | gzip > cognitest_backup.sql.gz

# To restore compressed:
gunzip -c cognitest_backup.sql.gz | psql -U postgres cognitest
```

### Incremental Backup (Advanced)

If database is very large and you only want recent changes:

```bash
# Use pg_dump with verbose output
pg_dump -U postgres -v cognitest > cognitest_backup.sql 2>&1 | tee backup.log
```

### Verify Data Integrity

After restore:

```bash
# Compare row counts
echo "Source laptop counts:" > compare.txt
psql -U postgres -d cognitest_source -c "SELECT 'users' as table, COUNT(*) FROM users UNION ALL SELECT 'projects', COUNT(*) FROM projects UNION ALL SELECT 'test_cases', COUNT(*) FROM test_cases;" >> compare.txt

echo "Target laptop counts:" >> compare.txt
psql -U postgres -d cognitest -c "SELECT 'users' as table, COUNT(*) FROM users UNION ALL SELECT 'projects', COUNT(*) FROM projects UNION ALL SELECT 'test_cases', COUNT(*) FROM test_cases;" >> compare.txt

cat compare.txt
```

---

## Troubleshooting

### "database is being accessed by other users"

```bash
# Kill active connections
psql -U postgres -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE datname = 'cognitest' AND pid <> pg_backend_pid();"

# Then drop and recreate
dropdb -U postgres cognitest
createdb -U postgres cognitest
```

### "permission denied" error

```bash
# Make sure PostgreSQL user is correct
psql -U postgres -d cognitest -c "SELECT current_user;"

# Might need to add password to .pgpass file
echo "localhost:5432:*:postgres:your_password" >> ~/.pgpass
chmod 600 ~/.pgpass
```

### "Restore stuck" or "very slow"

```bash
# You can interrupt and:
# 1. Check PostgreSQL logs
# 2. Verify disk space: df -h
# 3. Try with less verbose: psql -q -U postgres cognitest < backup.sql
```

### Data validation issues

```bash
# Check for foreign key violations
psql -U postgres -d cognitest -c "SET session_replication_role = 'replica';"

# Or rebuild indexes
psql -U postgres -d cognitest -c "REINDEX DATABASE cognitest;"
```

---

## Quick Command Reference

```bash
# Backup
pg_dump -U postgres cognitest > backup.sql

# Restore
createdb cognitest && psql -U postgres cognitest < backup.sql

# Compressed backup
pg_dump -U postgres -Fc cognitest > backup.dump

# Restore compressed
pg_restore -U postgres -d cognitest backup.dump

# Check database size
psql -U postgres -l

# Count records in table
psql -U postgres -d cognitest -c "SELECT COUNT(*) FROM table_name;"

# List all tables
psql -U postgres -d cognitest -c "\dt"
```

---

## Next Steps

After syncing data:

1. Run migrations to ensure schema is up to date:
   ```bash
   alembic upgrade head
   ```

2. Start the application:
   ```bash
   uvicorn app.main:app --reload
   ```

3. Verify data is accessible:
   ```bash
   curl http://localhost:8000/api/v1/organisations -H "Authorization: Bearer YOUR_TOKEN"
   ```

---

## Automating Regular Backups

Save this as a cron job (macOS/Linux):

```bash
# Edit crontab
crontab -e

# Add line to backup daily at 2 AM
0 2 * * * cd /path/to/backend && ./backup_db.sh
```

This creates daily backups automatically!

