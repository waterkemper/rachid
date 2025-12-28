# Docker Setup Guide

This document explains the Docker configuration for the Rachid application.

## Architecture

The application consists of three Docker containers:

1. **Frontend** (nginx): Serves the React/Vite application
2. **Backend** (Node.js): Express API server
3. **PostgreSQL**: Database server

All services are orchestrated using Docker Compose.

## Container Details

### Frontend Container

- **Base Image**: `nginx:alpine`
- **Port**: 80 (mapped to host port 80)
- **Build Process**:
  1. Multi-stage build with Node.js
  2. Builds React app with Vite
  3. Serves static files with nginx
- **Features**:
  - SPA routing support (fallback to index.html)
  - Gzip compression
  - Security headers
  - Static asset caching

### Backend Container

- **Base Image**: `node:18-alpine`
- **Port**: 3001 (mapped to host port 3001)
- **Build Process**:
  1. Multi-stage build
  2. Installs dependencies
  3. Compiles TypeScript to JavaScript
  4. Copies email templates
- **Features**:
  - Non-root user for security
  - Health check endpoint
  - Auto-reconnect to database

### PostgreSQL Container

**Note**: PostgreSQL is not managed by docker-compose. You have an existing PostgreSQL container (`pg17`) running on port 5437. The backend connects to it using `network_mode: host` to access `localhost:5437`.

## Docker Compose Configuration

The `docker-compose.yml` file defines:

- **Services**: frontend, backend (postgres is managed separately)
- **Network**: Backend uses `network_mode: host` to access existing PostgreSQL on port 5437
- **Environment Variables**: Loaded from `.env` file
- **Health Checks**: For frontend and backend services
- **Dependencies**: Frontend depends on backend

## Building Images

### Build all services

```bash
docker-compose build
```

### Build specific service

```bash
docker-compose build backend
docker-compose build frontend
```

### Build without cache

```bash
docker-compose build --no-cache
```

## Running Containers

### Start all services

```bash
docker-compose up -d
```

### Start specific service

```bash
docker-compose up -d backend
```

### View logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
```

### Stop services

```bash
docker-compose down
```

### Stop and remove volumes

```bash
docker-compose down -v
```

## Environment Variables

Environment variables are loaded from the `.env` file in the project root.

### Backend Variables

- `NODE_ENV`: Environment (production/development)
- `PORT`: Server port (default: 3001)
- `DATABASE_URL`: Full PostgreSQL connection string (optional)
- `DB_HOST`: Database host (default: postgres)
- `DB_PORT`: Database port (default: 5432)
- `DB_USERNAME`: Database username
- `DB_PASSWORD`: Database password
- `DB_DATABASE`: Database name
- `JWT_SECRET`: JWT signing secret
- `FRONTEND_URL`: Frontend URL for CORS
- `SENDGRID_API_KEY`: SendGrid API key
- `SENDGRID_FROM_EMAIL`: SendGrid from email
- `SENDGRID_FROM_NAME`: SendGrid from name

### Frontend Build Variables

- `VITE_API_URL`: API URL for frontend
- `VITE_GOOGLE_CLIENT_ID`: Google OAuth client ID

**Note**: Frontend variables are baked into the build at build time, not runtime.

## Networking

Services communicate as follows:

- Backend uses `host.docker.internal` hostname to access existing PostgreSQL on host port 5437
- Frontend is accessible on host port 8080 (proxied by Apache on port 80)
- Backend is accessible on host port 3001
- PostgreSQL is already running on host port 5437 (container `pg17`)
- Both frontend and backend use Docker bridge network for inter-container communication

## Volumes

- PostgreSQL data is managed by your existing `pg17` container
  - Backup: Use `docker exec pg17 pg_dump`

## Health Checks

All services have health checks:

- **Frontend**: HTTP GET to `/health`
- **Backend**: HTTP GET to `/health`
- **PostgreSQL**: Check existing container `pg17` with `docker exec pg17 pg_isready`

View health status:
```bash
docker-compose ps
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs <service-name>

# Check container status
docker-compose ps

# Restart service
docker-compose restart <service-name>
```

### Build fails

```bash
# Clear build cache
docker-compose build --no-cache

# Check Dockerfile syntax
docker build -t test -f backend/Dockerfile backend/
```

### Port already in use

```bash
# Find process using port
sudo lsof -i :80
sudo lsof -i :3001
sudo lsof -i :5432

# Kill process or change port in docker-compose.yml
```

### Database connection issues

1. Check if postgres container is running: `docker ps | grep pg17`
2. Check database logs: `docker logs pg17`
3. Verify environment variables in `.env` (DB_HOST=localhost, DB_PORT=5437)
4. Test connection: `docker exec pg17 psql -U postgres -c "SELECT 1"`
5. Verify port 5437 is accessible: `nc -zv localhost 5437`

### Permission issues

```bash
# Fix file permissions
sudo chown -R $USER:$USER .

# Fix Docker socket permissions (if needed)
sudo usermod -aG docker $USER
# Log out and back in
```

### Out of disk space

```bash
# Clean up Docker
docker system prune -a

# Remove unused volumes
docker volume prune
```

## Development vs Production

### Development

- Use `docker-compose up` (not `-d`) to see logs
- Mount source code as volumes for hot reload
- Use development environment variables

### Production

- Always use `docker-compose up -d` (detached mode)
- Use production environment variables
- Set up proper logging and monitoring
- Configure backups
- Use health checks for monitoring

## Best Practices

1. **Never commit `.env` files**: Use `ENV_TEMPLATE.md` as template
2. **Use specific image tags**: Avoid `latest` tag in production
3. **Regular updates**: Update base images regularly for security
4. **Resource limits**: Set CPU and memory limits in production
5. **Logging**: Configure log rotation
6. **Backups**: Regular database backups
7. **Health checks**: Use health checks for all services
8. **Non-root users**: Use non-root users in containers (already configured)
9. **Secrets**: Use Docker secrets or environment variables, not hardcoded values
10. **Networks**: Use Docker networks for service isolation

## Customization

### Change ports

Edit `docker-compose.yml`:
```yaml
services:
  backend:
    ports:
      - "3002:3001"  # Change host port to 3002
```

### Add environment variables

1. Add to `.env` file
2. Add to `docker-compose.yml` environment section
3. Restart containers: `docker-compose up -d`

### Modify nginx configuration

Edit `frontend/nginx.conf` and rebuild:
```bash
docker-compose build frontend
docker-compose up -d frontend
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [nginx Documentation](https://nginx.org/en/docs/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)

