#!/bin/bash
set -euo pipefail

if [ -f /app/.env ]; then
  echo "Loading environment variables"
  set -a
  . /app/.env
  set +a
fi

echo "Running migrations"
./bin/ngfk eval "Ngfk.Release.migrate"

echo "Starting the application"
exec "$@"
