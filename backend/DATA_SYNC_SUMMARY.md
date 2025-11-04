# Data Sync Summary ✅

Complete solution for copying your local database to another laptop.

---

## What You Have Now

### 📄 Documentation (Start Here)

1. **QUICK_SYNC.md** ⭐
   - Super fast guide (30 seconds to understand)
   - Step-by-step workflow
   - Common issues & fixes
   - **Start with this file**

2. **DATABASE_SYNC.md**
   - Complete reference guide
   - 3 different sync methods
   - Automation and scripts
   - Advanced tips
   - Detailed troubleshooting

### 🛠️ Automated Scripts (Executable)

1. **backup_db.sh**
   - Creates backup of your database
   - Interactive prompts
   - Colored output
   - Smart error handling
   - Suggests next steps

2. **restore_db.sh**
   - Restores backup on another laptop
   - Verifies PostgreSQL is running
   - Confirms data replacement
   - Shows statistics
   - Error recovery

---

## Fastest Way (30 Seconds)

### Current Laptop:
```bash
cd backend
./backup_db.sh
# Choose format → File created → Done
```

### Other Laptop:
```bash
cd backend
./restore_db.sh cognitest_backup_*.sql
# Confirms replacement → Restores data → Done
```

That's it! Same data on both laptops.

---

## What Gets Copied

✅ **All database data:**
- Users and authentication
- Organizations and projects
- Test plans, suites, and cases
- Approval workflows
- API collections
- AI feedback
- Issues and tracking
- All relationships and constraints

✅ **Preserves:**
- Foreign key relationships
- Indexes for performance
- Data integrity
- Timestamps
- User permissions

---

## Transfer Methods

| Method | Speed | Ease | Best For |
|--------|-------|------|----------|
| **AirDrop** | Fast | Easy | macOS to macOS |
| **Email/Cloud** | Slow | Easy | Any laptops |
| **USB Drive** | Fast | Medium | No internet |
| **Network** | Very fast | Medium | Same WiFi |

---

## File Sizes

Typical backup sizes:

- Empty schema: 100-200 KB
- Small project: 500 KB - 2 MB
- Medium project: 2-10 MB
- Large project: 10-50 MB

**Tip:** Use compressed format (option 2 in backup_db.sh) for 30-50% smaller files.

---

## Quick Commands Reference

### Backup
```bash
./backup_db.sh                          # Interactive
pg_dump -U postgres cognitest > backup.sql    # Manual
pg_dump -U postgres -Fc cognitest > backup.dump  # Compressed
```

### Restore
```bash
./restore_db.sh backup.sql              # Interactive
createdb cognitest && psql -U postgres cognitest < backup.sql  # Manual
pg_restore -U postgres -d cognitest backup.dump  # From dump
```

---

## Complete Setup Flow

```
Current Laptop          Transfer File        Other Laptop
─────────────────────────────────────────────────────────

1. Run:
   ./backup_db.sh

2. Created:
   cognitest_backup_*.sql

                    ──────────────>

                   (AirDrop, email,
                    cloud, USB, etc.)

                                        3. Receive file
                                           in backend/

                                        4. Run:
                                           ./restore_db.sh *.sql

                                        5. Ready to use!
```

---

## Next Steps

1. **Read QUICK_SYNC.md** for detailed instructions
2. **Run `./backup_db.sh`** to create backup
3. **Transfer** the backup file
4. **Run `./restore_db.sh`** to restore
5. **Verify**: `alembic upgrade head` + `uvicorn app.main:app --reload`

---

## Troubleshooting

### PostgreSQL not found
```bash
brew install postgresql
brew services start postgresql
```

### Scripts won't run
```bash
chmod +x backup_db.sh restore_db.sh
```

### Backup failed
```bash
# Check PostgreSQL
brew services list
# Or check DATABASE_SYNC.md troubleshooting
```

### Restore failed
See DATABASE_SYNC.md "Troubleshooting" section

---

## Pro Tips

### Before Major Code Changes
```bash
./backup_db.sh
git pull origin get-started
# If something breaks, easily restore
```

### Team Collaboration
```bash
# One person creates backup
./backup_db.sh

# Upload to shared location (Google Drive, Dropbox)
# Team members download and restore
./restore_db.sh master_backup.sql
```

### Large Databases
- Use compressed format (option 2)
- Smaller files transfer faster
- Same restore process

### Verify Restore Success
```bash
psql -U postgres -d cognitest -c "SELECT COUNT(*) FROM test_cases;"
```

---

## Important Notes

⚠️ **Restore will replace all data**
- It drops the existing database
- Creates a fresh one
- Restores from backup
- All previous data is lost

✅ **Always backup first**
- Before updating code
- Before major changes
- Keep multiple backups
- Use timestamps in filenames

---

## Related Documentation

Also see:
- **MIGRATIONS.md** - Database schema management
- **SETUP_NEW_LAPTOP.md** - Full developer setup
- **MIGRATION_SETUP_COMPLETE.md** - Migration system summary

---

## FAQ

**Q: How long does backup take?**
A: Depends on database size. Typically seconds to minutes.

**Q: How long does restore take?**
A: Similar to backup time. Shows progress in terminal.

**Q: Can I backup while application is running?**
A: Better to stop the app first. Scripts will warn if there are active connections.

**Q: What if I want to keep my current data?**
A: Backup your current data first:
```bash
pg_dump -U postgres cognitest > current_backup.sql
# Then restore new data
./restore_db.sh new_backup.sql
```

**Q: Can I backup only specific tables?**
A: Yes, see DATABASE_SYNC.md "Backup Size Optimization"

**Q: How often should I backup?**
A: Before major changes. Or daily with cron job (see DATABASE_SYNC.md).

---

## Example Workflow

```bash
# === Day 1: Set up on current laptop ===
cd backend
./backup_db.sh
# Creates: cognitest_backup_20251104_140000.sql (2.3M)

# === Transfer to other laptop (AirDrop, email, etc.) ===

# === Day 2: Set up on other laptop ===
cd backend
./restore_db.sh cognitest_backup_20251104_140000.sql
# ✓ PostgreSQL running
# ✓ Database dropped
# ✓ Fresh database created
# ✓ Data restored
# ✓ Statistics shown
# Ready to use!

# === Verify it worked ===
alembic upgrade head
uvicorn app.main:app --reload
# Visit: http://localhost:8000/api/docs
# Same data as current laptop!
```

---

## Summary

✅ **Backup**: `./backup_db.sh`
✅ **Transfer**: AirDrop/Email/USB/Cloud
✅ **Restore**: `./restore_db.sh backup.sql`
✅ **Verify**: `alembic upgrade head` + run app

Everything works automatically with the scripts!

---

For detailed information, see **QUICK_SYNC.md** or **DATABASE_SYNC.md**.
