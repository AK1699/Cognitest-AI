#!/bin/bash

# Clean up sensitive data from git history
# This script removes .env files from git history completely

echo "⚠️  WARNING: This will rewrite git history!"
echo "Make sure you have a backup before proceeding."
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

echo "Starting cleanup..."

# Remove .env files from git history
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch backend/.env' \
  --prune-empty --tag-name-filter cat -- --all

echo "Cleanup complete!"
echo ""
echo "Next steps:"
echo "1. Force push to remote: git push origin --force --all"
echo "2. Force push tags: git push origin --force --tags"
echo "3. Tell all collaborators to re-clone the repository"
echo ""
echo "⚠️  WARNING: This will require all team members to re-clone!"
