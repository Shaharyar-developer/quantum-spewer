#!/bin/bash
set -e
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="$PROJECT_ROOT/sqlite-backups"
DB_FILE="$PROJECT_ROOT/data/sqlite.db"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$BACKUP_DIR/backup.log"

mkdir -p "$BACKUP_DIR"

log() {
    echo "[$(date)] $1" | tee -a "$LOG_FILE"
}

log "=== Backup Script Started ==="
log "Project root: $PROJECT_ROOT"
log "Backup directory: $BACKUP_DIR"
log "Database file: $DB_FILE"
if [ -f "$DB_FILE" ]; then
    log "Database file exists. Proceeding with backup."
    if cp "$DB_FILE" "$BACKUP_DIR/sqlite_${TIMESTAMP}.db"; then
        log "Backup completed: $BACKUP_DIR/sqlite_${TIMESTAMP}.db"
    else
        log "ERROR: Failed to copy database file!"
    fi
else
    log "WARNING: Database file does not exist. Skipping backup."
fi
log "=== Backup Script Finished ==="
