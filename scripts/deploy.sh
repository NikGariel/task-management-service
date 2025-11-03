#!/bin/bash

set -e

echo "🚀 Starting production deployment..."

# Check if .env file exists
if [ ! -f .env ]; then
  echo "⚠️  .env file not found. Creating from .env.production.example..."
  if [ -f .env.production.example ]; then
    cp .env.production.example .env
    echo "✅ .env file created. Please update it with your production values."
  else
    echo "❌ .env.production.example not found. Please create .env manually."
    exit 1
  fi
fi

# Build the application
echo "📦 Building application..."
bun run build

# Check if build was successful
if [ ! -f dist/index.js ]; then
  echo "❌ Build failed: dist/index.js not found"
  exit 1
fi

echo "✅ Build completed successfully"

# Run database migrations
echo "🗄️  Running database migrations..."
bun run db:migrate

echo "✅ Deployment preparation completed!"
echo ""
echo "To start the application:"
echo "  bun run start:prod"
echo ""
echo "Or using Docker:"
echo "  docker-compose -f docker-compose.prod.yml up -d"

