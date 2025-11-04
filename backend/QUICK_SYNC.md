# Quick Database Sync Guide

Fastest way to copy your local database to another laptop.

## TL;DR (Super Quick)

### On Current Laptop:

```bash
cd backend
./backup_db.sh
```

Then transfer the created file (`cognitest_backup_*.sql` or `.dump`) to the other laptop.

### On Other Laptop:

```bash
cd backend
./restore_db.sh cognitest_backup_*.sql
```

Done! Same data on both laptops.

---

## Step-by-Step (with explanation)

### Step 1: Create Backup on Current Laptop

```bash
cd /path/to/Cognitest-AI/backend

# Run the backup script
./backup_db.sh
```

Output will show:
```
✓ Backup created successfully!
  File: cognitest_backup_20251104_120000.sql
  Size: 2.5M
```

### Step 2: Transfer File to Other Laptop

Pick one method:

**Method A: AirDrop (macOS)**
- Open Finder
- Find the backup file in `backend/` folder
- Right-click → AirDrop → Select other Mac

**Method B: Email/Cloud (Universal)**
```bash
# Option 1: Cloud storage
# Upload cognitest_backup_*.sql to Google Drive/Dropbox/OneDrive
# Download on other laptop

# Option 2: Via email
# Email the backup file to yourself
```

**Method C: USB Drive (Offline)**
```bash
# Copy cognitest_backup_*.sql to USB drive
# Insert USB on other laptop
# Copy file to backend directory
```

**Method D: Direct Network (Same WiFi)**
```bash
# On source laptop, find your IP:
ifconfig | grep inet | grep -v 127

# Start simple server:
cd /path/to/backend
python3 -m http.server 8000

# On target laptop:
curl -O http://YOUR_IP:8000/cognitest_backup_*.sql
```

### Step 3: Restore on Other Laptop

```bash
cd /path/to/Cognitest-AI/backend

# Ensure you have the backup file here
ls cognitest_backup*

# Run restore script
./restore_db.sh cognitest_backup_20251104_120000.sql

# Or just: ./restore_db.sh cognitest_backup*.sql
```

Script will:
- Drop existing database
- Create fresh database
- Restore all your data
- Show statistics

### Step 4: Verify Everything

```bash
# Check that migrations are up to date
alembic upgrade head

# Start the application
uvicorn app.main:app --reload

# Test in browser: http://localhost:8000/api/docs
```

---

## Manual Commands (If Not Using Scripts)

### Backup (without script):

```bash
# Create backup
pg_dump -U postgres cognitest > cognitest_backup.sql

# Or compressed (smaller file)
pg_dump -U postgres -Fc cognitest > cognitest_backup.dump
```

### Restore (without script):

```bash
# Create fresh database
createdb cognitest

# Restore from SQL file
psql -U postgres cognitest < cognitest_backup.sql

# Or restore from dump file
pg_restore -U postgres -d cognitest cognitest_backup.dump
```

---

## Common Issues & Fixes

### "PostgreSQL is not installed"

```bash
# macOS
brew install postgresql

# Make sure it's running
brew services start postgresql
```

### "Connection refused"

PostgreSQL might not be running:

```bash
# Check if running
brew services list

# Start it
brew services start postgresql
```

### "database 'cognitest' already exists"

Drop the existing database first:

```bash
dropdb cognitest
./restore_db.sh cognitest_backup.sql
```

### "Permission denied" on scripts

Make them executable:

```bash
chmod +x backup_db.sh restore_db.sh
```

### Backup file is huge (>500MB)

Use compressed format when backing up:

```bash
# On source laptop, choose option 2 (Binary dump) in backup_db.sh
# Or manually:
pg_dump -U postgres -Fc cognitest > cognitest_backup.dump
```

---

## Verification

After restore, verify data integrity:

```bash
# Count records in main tables
psql -U postgres -d cognitest << 'EOF'
SELECT 'users' as table_name, COUNT(*) FROM users UNION ALL
SELECT 'projects', COUNT(*) FROM projects UNION ALL
SELECT 'test_plans', COUNT(*) FROM test_plans UNION ALL
SELECT 'test_cases', COUNT(*) FROM test_cases;
EOF
```

Should match the counts from your original laptop.

---

## File Size Estimates

Typical backup sizes:

| Scenario | Size |
|----------|------|
| Empty database (schema only) | 100-200 KB |
| Small projects (< 100 test cases) | 500 KB - 2 MB |
| Medium projects (100-1000 test cases) | 2-10 MB |
| Large projects (1000+ test cases) | 10-50 MB |

**Compressed (`.dump`) is typically 30-50% smaller than SQL files.**

---

## Backup Retention

Keep backups for at least a few weeks:

```bash
# See all backups
ls -lh cognitest_backup*

# Delete old backups (older than 30 days)
find . -name "cognitest_backup*" -mtime +30 -delete
```

Or set up automatic daily backups:

```bash
# macOS: Add to crontab
crontab -e

# Add this line:
0 2 * * * cd /Users/akash/work/Cognitest-AI/backend && ./backup_db.sh
```

---

## File Transfer Comparison

| Method | Speed | Ease | Best For |
|--------|-------|------|----------|
| AirDrop | Fast | Very easy | macOS + macOS |
| Email/Cloud | Slow | Easy | Any laptops |
| USB Drive | Fast | Medium | No internet |
| Network | Very fast | Medium | Same WiFi |

---

## Complete Workflow Example

```bash
# === ON SOURCE LAPTOP ===

# 1. Ensure your code is committed
git status
git add .
git commit -m "Work in progress"

# 2. Create backup
cd backend
./backup_db.sh

# Output: cognitest_backup_20251104_140000.sql (2.3M)

# 3. Upload to cloud
# (manually via web or using CLI)

# === ON TARGET LAPTOP ===

# 1. Pull latest code
git pull origin get-started

# 2. Download backup file from cloud
# (to backend/ directory)

# 3. Restore database
cd backend
./restore_db.sh cognitest_backup_20251104_140000.sql

# 4. Update schema
alembic upgrade head

# 5. Run migrations if needed
alembic current

# 6. Start development
uvicorn app.main:app --reload
```

---

## Pro Tips

### Backup Before Major Changes

```bash
# Before updating code
./backup_db.sh

# Then pull/update
git pull origin get-started

# If something breaks, easy restore:
./restore_db.sh cognitest_backup_latest.sql
```

### Compare Databases

After restore, verify data matches:

```bash
# On original laptop
psql -U postgres -d cognitest -c "SELECT COUNT(*) FROM test_cases;" > counts_original.txt

# On restored laptop
psql -U postgres -d cognitest -c "SELECT COUNT(*) FROM test_cases;" > counts_restored.txt

# Compare
diff counts_original.txt counts_restored.txt
```

### Export Specific Tables Only

If you only want certain data:

```bash
# Backup only test cases
pg_dump -U postgres -t test_cases cognitest > test_cases_only.sql

# Backup excluding large tables
pg_dump -U postgres --exclude-table=document_chunks cognitest > backup_small.sql
```

---

## For Large Teams

If multiple team members need the same data:

```bash
# 1. Create master backup
./backup_db.sh

# 2. Upload to shared location:
#    - Google Drive
#    - Dropbox
#    - S3 bucket
#    - Team Slack

# 3. Each developer downloads and restores:
./restore_db.sh master_backup.sql
```

---

## Questions?

See [DATABASE_SYNC.md](./DATABASE_SYNC.md) for more detailed information.

---

**Remember**: Always have a backup before running restore!
