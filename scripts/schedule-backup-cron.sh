#!/bin/bash
set -e

BACKUP_SCRIPT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/backup-db.sh"
CRON_LINE="0 * * * * $BACKUP_SCRIPT # quantum-spewer-backup"

# Get current crontab, or empty if none
CRONTAB_CONTENT=$(crontab -l 2>/dev/null || true)

# Check if the cron job already exists
if ! echo "$CRONTAB_CONTENT" | grep -q "# quantum-spewer-backup"; then
  # Add the cron job
  (echo "$CRONTAB_CONTENT"; echo "$CRON_LINE") | crontab -
  echo "Backup cron job added."
else
  echo "Backup cron job already exists."
fi
