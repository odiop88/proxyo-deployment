#!/bin/sh
set -e

echo "Applying Django migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Running Django checks..."
python manage.py check

echo "Migration completed successfully."