#!/bin/sh
set -e

DATE=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_DIR=${BACKUP_DIR:-/backups/postgres}

DB_NAME=${DB_NAME:-proxyo_prod}
DB_USER=${DB_USER:-proxyo_user}
DB_HOST=${DB_HOST:-db}
DB_PORT=${DB_PORT:-5432}

mkdir -p "$BACKUP_DIR"

echo "Starting PostgreSQL backup..."
echo "Database: $DB_NAME"
echo "Host: $DB_HOST"

PGPASSWORD="$DB_PASSWORD" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  "$DB_NAME" | gzip > "$BACKUP_DIR/${DB_NAME}_${DATE}.sql.gz"

echo "Backup completed: $BACKUP_DIR/${DB_NAME}_${DATE}.sql.gz"