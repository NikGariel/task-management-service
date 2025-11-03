#!/bin/bash

echo "Setting up Task Management API..."

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo "Error: Bun is not installed. Please install Bun first."
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
bun install

# Start infrastructure services
echo "Starting infrastructure services..."
docker-compose up -d postgres redis

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 5

# Generate database migrations
echo "Generating database migrations..."
bun run db:generate

# Run migrations
echo "Running database migrations..."
bun run db:migrate

echo "Setup complete! You can now run 'bun run dev' to start the application."

