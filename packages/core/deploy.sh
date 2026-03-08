#!/bin/bash
set -e

echo "🚀 Deploying Ferthe Core API..."

# Check if .env.production exists
if [ ! -f .env.production ]; then
  echo "❌ Error: .env.production not found"
  echo "   Copy .env.production.example and fill in your secrets"
  exit 1
fi

# Stop running containers
echo "🛑 Stopping existing containers..."
docker-compose down 2>/dev/null || true

# Build image
echo "🏗️  Building Docker image..."
docker-compose build --no-cache

# Start container
echo "▶️  Starting container..."
docker-compose up -d

# Wait for health check
echo "⏳ Waiting for API to be healthy..."
sleep 5

# Check if container is running
if [ "$(docker-compose ps -q ferthe-core-api)" ]; then
  echo "✅ Deployment successful!"
  echo ""
  echo "📊 Container status:"
  docker-compose ps
  echo ""
  echo "📝 View logs: docker-compose logs -f"
  echo "🛑 Stop: docker-compose down"
else
  echo "❌ Container failed to start"
  echo "📝 Check logs: docker-compose logs"
  exit 1
fi
