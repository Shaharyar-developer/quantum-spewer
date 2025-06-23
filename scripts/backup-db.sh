#!/bin/bash
set -e
mkdir -p "$HOME/sqlite-backups"
BACKUP_DIR="$HOME/sqlite-backups"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_FILE="$HOME/quantum-spewer/data/sqlite.db"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$BACKUP_DIR/backup.log"

mkdir -p "$BACKUP_DIR"

{
    echo "[$(date)] Starting backup..."
    echo "[$(date)] Database file: $DB_FILE"
    cp "$DB_FILE" "$BACKUP_DIR/sqlite_${TIMESTAMP}.db"
    echo "[$(date)] Backup completed: $BACKUP_DIR/sqlite_${TIMESTAMP}.db"
} >> "$LOG_FILE" 2>&1
