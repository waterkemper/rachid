#!/bin/bash

# Manual deployment script for EC2
# Usage: ./scripts/deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
PROJECT_DIR="/home/$USER/rachid"

echo "🚀 Starting deployment to EC2..."
echo "Environment: $ENVIRONMENT"
echo "Project directory: $PROJECT_DIR"

# Change to project directory
cd "$PROJECT_DIR" || {
    echo "❌ Error: Project directory not found: $PROJECT_DIR"
    exit 1
}

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env file from .env.example"
    exit 1
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down || true

# Pull latest code (if using git)
if [ -d .git ]; then
    echo "📥 Pulling latest code..."
    git pull origin main || git pull origin master || echo "⚠️  Could not pull latest code"
fi

# Build and start containers
echo "🔨 Building and starting containers..."
docker-compose up -d --build

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 30

# Health checks
echo "🏥 Running health checks..."

# Check backend
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    docker-compose logs backend
    exit 1
fi

# Check frontend (direct container access on port 8080)
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend health check failed"
    docker-compose logs frontend
    exit 1
fi

# Check database (existing PostgreSQL container)
if docker exec pg17 pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ Database is healthy"
else
    echo "⚠️  Database health check failed (check if pg17 container is running)"
fi

# Show container status
echo ""
echo "📊 Container status:"
docker-compose ps

# Cleanup old images
echo ""
echo "🧹 Cleaning up old images..."
docker image prune -f

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "View logs with: docker-compose logs -f"
echo "Stop services with: docker-compose down"

