#!/bin/bash

# Health check script for all services
# Usage: ./scripts/health-check.sh

set -e

PROJECT_DIR=${1:-/home/$USER/rachid}

echo "🏥 Running health checks..."
echo "Project directory: $PROJECT_DIR"

cd "$PROJECT_DIR" || {
    echo "❌ Error: Project directory not found: $PROJECT_DIR"
    exit 1
}

# Check if containers are running
if ! docker-compose ps | grep -q "Up"; then
    echo "❌ No containers are running!"
    echo "Start containers with: docker-compose up -d"
    exit 1
fi

echo ""
echo "Checking services..."
echo "===================="

# Check backend
echo -n "Backend (http://localhost:3001/health): "
if curl -f -s http://localhost:3001/health > /dev/null; then
    echo "✅ OK"
else
    echo "❌ FAILED"
    exit 1
fi

# Check backend database connection
echo -n "Backend DB (http://localhost:3001/health/db): "
if curl -f -s http://localhost:3001/health/db > /dev/null; then
    echo "✅ OK"
else
    echo "⚠️  WARNING (database may not be connected)"
fi

# Check frontend (direct container access)
echo -n "Frontend (http://localhost:8080/health): "
if curl -f -s http://localhost:8080/health > /dev/null; then
    echo "✅ OK"
else
    echo "❌ FAILED"
    exit 1
fi

# Check database (existing PostgreSQL container)
echo -n "PostgreSQL (pg17 container): "
if docker exec pg17 pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ OK"
else
    echo "⚠️  FAILED or container not found (check if pg17 is running)"
fi

# Check Apache (if running)
if systemctl is-active --quiet apache2 || systemctl is-active --quiet httpd; then
    echo -n "Apache: "
    echo "✅ Running"
else
    echo -n "Apache: "
    echo "⚠️  Not running (may be expected if not configured)"
fi

echo ""
echo "✅ All health checks passed!"
echo ""
echo "Container status:"
docker-compose ps

