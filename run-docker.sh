#!/bin/bash

# Ensure the script is made executable: chmod +x run-docker.sh

echo "Building and starting Athena Microservices via Docker Compose..."

# Load environment variables from .env file if it exists
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Variables required by docker-compose.yml.
# IF NOT SET in your environment, these fallbacks (or empty strings) will be used.
export SUPABASE_DB_URL="${SUPABASE_DB_URL:-jdbc:postgresql://host.docker.internal:5432/postgres}"
export SUPABASE_DB_USERNAME="${SUPABASE_DB_USERNAME:-postgres}"
export SUPABASE_DB_PASSWORD="${SUPABASE_DB_PASSWORD:-postgres}"
export SUPABASE_JWT_ISSUER="${SUPABASE_JWT_ISSUER:-}"
export SUPABASE_URL="${SUPABASE_URL:-}"
export SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-}"

# Compose up
docker-compose up --build -d

echo "Services are starting in the background!"
echo " - Frontend (React):   http://localhost:5173"
echo " - Attendance Service: http://localhost:8081"
echo " - Auth Service:       http://localhost:8082"
echo "To view logs, run: docker-compose logs -f"
echo "To stop services, run: docker-compose down"
