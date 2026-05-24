#!/bin/sh
set -e

if [ -z "$1" ]; then
  echo "Usage: ./restore_postgres.sh /path/to/backup.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"

DB_NAME=${DB_NAME:-proxyo_prod}
DB_USER=${DB_USER:-proxyo_user}
DB_HOST=${DB_HOST:-db}
DB_PORT=${DB_PORT:-5432}

echo "Restoring PostgreSQL database..."
echo "Backup file: $BACKUP_FILE"
echo "Database: $DB_NAME"

gunzip -c "$BACKUP_FILE" | PGPASSWORD="$DB_PASSWORD" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  "$DB_NAME"

echo "Restore completed successfully."