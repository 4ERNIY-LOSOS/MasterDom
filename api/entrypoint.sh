#!/bin/sh
# entrypoint.sh

# Exit immediately if a command exits with a non-zero status.
set -e

# Run the database migrations
echo "Running database migrations..."
/app/migrate -path /app/migration -database "$DB_URL" up

echo "Migrations complete. Starting server."

# Execute the main command (passed to this script)
exec "$@"
