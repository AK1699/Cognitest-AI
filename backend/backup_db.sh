#!/bin/bash

# Cognitest Database Backup Script
# Creates a PostgreSQL backup file that can be transferred to another laptop

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="cognitest"
DB_USER="postgres"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="cognitest_backup_${TIMESTAMP}.sql"
COMPRESSED_FILE="cognitest_backup_${TIMESTAMP}.dump"

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
print_header "Cognitest Database Backup"

# Check if PostgreSQL is installed
if ! command -v pg_dump &> /dev/null; then
    print_error "PostgreSQL is not installed or pg_dump not found"
    exit 1
fi

print_info "Database: $DB_NAME"
print_info "User: $DB_USER"
echo ""

# Check for active connections
print_info "Checking for active connections..."
ACTIVE=$(psql -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) FROM pg_stat_activity WHERE pid <> pg_backend_pid();" -t 2>/dev/null | tr -d ' ')

if [ "$ACTIVE" -gt 0 ]; then
    print_error "There are $ACTIVE active connections to the database"
    print_info "Please close all applications using the database"
    echo "Active connections:"
    psql -U $DB_USER -d $DB_NAME -c "SELECT usename, application_name FROM pg_stat_activity WHERE pid <> pg_backend_pid();" 2>/dev/null
    exit 1
fi

print_success "No active connections"
echo ""

# Ask for compression preference
echo -e "${YELLOW}Backup format:${NC}"
echo "  1) SQL text file (larger, human-readable)"
echo "  2) Binary dump (smaller, compressed)"
read -p "Choose format (1 or 2) [1]: " format
format=${format:-1}

echo ""
print_info "Creating backup..."

if [ "$format" = "2" ]; then
    # Binary compressed format
    if pg_dump -U $DB_USER -Fc $DB_NAME > "$COMPRESSED_FILE"; then
        SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
        print_success "Backup created successfully!"
        echo -e "  File: ${BLUE}$COMPRESSED_FILE${NC}"
        echo -e "  Size: ${BLUE}$SIZE${NC}"

        RESTORE_CMD="pg_restore -U $DB_USER -d $DB_NAME $COMPRESSED_FILE"
        BACKUP_RESULT_FILE="$COMPRESSED_FILE"
    else
        print_error "Backup failed"
        exit 1
    fi
else
    # SQL text format (default)
    if pg_dump -U $DB_USER $DB_NAME > "$BACKUP_FILE"; then
        SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        print_success "Backup created successfully!"
        echo -e "  File: ${BLUE}$BACKUP_FILE${NC}"
        echo -e "  Size: ${BLUE}$SIZE${NC}"

        RESTORE_CMD="psql -U $DB_USER $DB_NAME < $BACKUP_FILE"
        BACKUP_RESULT_FILE="$BACKUP_FILE"
    else
        print_error "Backup failed"
        exit 1
    fi
fi

echo ""
print_header "Next Steps"

echo ""
echo "1️⃣  Transfer the backup file to the other laptop:"
echo -e "   ${BLUE}$BACKUP_RESULT_FILE${NC}"
echo ""
echo "   Options:"
echo "   • AirDrop (drag to another Mac)"
echo "   • Email or cloud storage (Google Drive, Dropbox)"
echo "   • USB drive"
echo "   • SCP: scp $BACKUP_RESULT_FILE user@other-laptop:/path/"
echo ""

echo "2️⃣  On the other laptop, run:"
echo "   ${BLUE}./restore_db.sh $BACKUP_RESULT_FILE${NC}"
echo ""

echo "3️⃣  Or manually restore:"
echo "   ${BLUE}createdb cognitest${NC}"
echo "   ${BLUE}$RESTORE_CMD${NC}"
echo ""

echo -e "${GREEN}Backup complete!${NC}"
echo ""
