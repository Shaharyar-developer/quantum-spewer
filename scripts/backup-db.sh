#!/bin/bash
set -e
BACKUP_DIR="$HOME/sqlite-backups"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_FILE="$SCRIPT_DIR/../data/sqlite.db"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"
cp "$DB_FILE" "$BACKUP_DIR/sqlite_${TIMESTAMP}.db"

