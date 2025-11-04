#!/bin/bash

# Cognitest Database Restore Script
# Restores a PostgreSQL backup file on a new laptop

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
DB_NAME="cognitest"
DB_USER="postgres"

# Functions
print_header() {
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Main script
print_header "Cognitest Database Restore"

# Check arguments
if [ -z "$1" ]; then
    print_error "No backup file specified"
    echo ""
    echo "Usage: $0 <backup_file>"
    echo ""
    echo "Available backup files:"
    ls -lh cognitest_backup* 2>/dev/null || print_error "No backup files found in current directory"
    exit 1
fi

BACKUP_FILE="$1"

# Check if file exists
if [ ! -f "$BACKUP_FILE" ]; then
    print_error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

print_info "Backup file: $BACKUP_FILE"
SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
print_info "File size: $SIZE"
echo ""

# Detect file type
if [[ $BACKUP_FILE == *.dump ]]; then
    FILE_TYPE="binary"
    RESTORE_CMD="pg_restore -U $DB_USER -d $DB_NAME $BACKUP_FILE"
else
    FILE_TYPE="sql"
    RESTORE_CMD="psql -U $DB_USER $DB_NAME < $BACKUP_FILE"
fi

print_info "Detected format: $FILE_TYPE"
echo ""

# Confirmation
echo -e "${YELLOW}⚠️  This will replace all data in the '$DB_NAME' database!${NC}"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    print_error "Restore cancelled"
    exit 1
fi

echo ""

# Check if PostgreSQL is running
print_info "Checking PostgreSQL connection..."
if ! psql -U $DB_USER -c "SELECT 1" > /dev/null 2>&1; then
    print_error "Cannot connect to PostgreSQL"
    print_info "Make sure PostgreSQL is running"
    print_info "Try: brew services start postgresql"
    exit 1
fi

print_success "PostgreSQL is running"
echo ""

# Drop existing database
print_info "Dropping existing database (if any)..."
if dropdb -U $DB_USER $DB_NAME 2>/dev/null; then
    print_success "Dropped existing database"
else
    print_info "No existing database to drop"
fi

echo ""

# Create fresh database
print_info "Creating fresh database..."
if createdb -U $DB_USER $DB_NAME; then
    print_success "Database created"
else
    print_error "Failed to create database"
    exit 1
fi

echo ""

# Restore backup
print_header "Restoring Backup"

print_info "Restoring data... (this may take a while)"
echo ""

if eval "$RESTORE_CMD"; then
    print_success "Restore completed successfully!"

    echo ""
    print_header "Database Statistics"

    # Show table counts
    psql -U $DB_USER -d $DB_NAME << EOF
SELECT
    'users' as table_name,
    COUNT(*) as row_count
FROM users
UNION ALL
SELECT 'projects', COUNT(*) FROM projects
UNION ALL
SELECT 'test_plans', COUNT(*) FROM test_plans
UNION ALL
SELECT 'test_suites', COUNT(*) FROM test_suites
UNION ALL
SELECT 'test_cases', COUNT(*) FROM test_cases
UNION ALL
SELECT 'organisations', COUNT(*) FROM organisations
UNION ALL
SELECT 'oauth_accounts', COUNT(*) FROM oauth_accounts
ORDER BY table_name;
EOF

    echo ""
    print_header "Restore Complete"
    echo ""
    echo "✅ Database is ready to use!"
    echo ""
    echo "Next steps:"
    echo "  1. Update .env if needed (database credentials)"
    echo "  2. Run migrations: ${BLUE}alembic upgrade head${NC}"
    echo "  3. Start the application: ${BLUE}uvicorn app.main:app --reload${NC}"
    echo ""
else
    print_error "Restore failed!"
    print_info "Attempting to recover..."

    # Try to drop and recreate
    dropdb -U $DB_USER $DB_NAME 2>/dev/null || true
    createdb -U $DB_USER $DB_NAME 2>/dev/null || true

    print_error "Database is empty. Please check the backup file and try again."
    exit 1
fi
