# Deployment Guide - EC2 with Docker

This guide covers deploying the Rachid application to an EC2 instance using Docker and Docker Compose.

## Architecture Overview

- **Frontend**: React/Vite application served via nginx in Docker
- **Backend**: Node.js/Express API in Docker
- **Database**: PostgreSQL 17 in Docker (existing container)
- **Reverse Proxy**: Apache on the host machine
- **CI/CD**: GitHub Actions with SSH deployment

## Prerequisites

1. EC2 instance running with:
   - Docker and Docker Compose installed
   - Apache web server installed
   - SSH access configured
   - Ports 22, 80, 443, 3001 open in security group
2. Domain names configured:
   - `orachid.com.br` → EC2 instance IP
   - `api.orachid.com.br` → EC2 instance IP
3. GitHub repository with GitHub Actions enabled
4. Environment variables and secrets configured

## Initial Setup on EC2

### 1. Install Docker and Docker Compose

```bash
# Update system (Amazon Linux 2)
sudo yum update -y

# Install Docker
sudo yum install docker -y

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group (to run docker without sudo)
sudo usermod -aG docker $USER
# Log out and log back in for this to take effect
# Or run: newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 2. Install and Configure Apache (Amazon Linux 2)

```bash
# Install Apache
sudo yum install httpd -y

# Enable required Apache modules (edit /etc/httpd/conf/httpd.conf)
# Find and uncomment these lines if commented:
# LoadModule proxy_module modules/mod_proxy.so
# LoadModule proxy_http_module modules/mod_proxy_http.so
# LoadModule headers_module modules/mod_headers.so
# LoadModule ssl_module modules/mod_ssl.so

# Or use sed to uncomment them:
sudo sed -i 's/#LoadModule proxy_module/LoadModule proxy_module/' /etc/httpd/conf/httpd.conf
sudo sed -i 's/#LoadModule proxy_http_module/LoadModule proxy_http_module/' /etc/httpd/conf/httpd.conf
sudo sed -i 's/#LoadModule headers_module/LoadModule headers_module/' /etc/httpd/conf/httpd.conf
sudo sed -i 's/#LoadModule ssl_module/LoadModule ssl_module/' /etc/httpd/conf/httpd.conf

# Copy Apache configuration files
sudo cp apache/orachid-frontend.conf /etc/httpd/conf.d/
sudo cp apache/orachid-api.conf /etc/httpd/conf.d/

# Test Apache configuration
sudo httpd -t

# Start and enable Apache
sudo systemctl start httpd
sudo systemctl enable httpd

# Restart Apache to apply changes
sudo systemctl restart httpd
```

### 3. Clone Repository and Setup Environment

```bash
# Create project directory
mkdir -p ~/rachid
cd ~/rachid

# Clone repository (or copy files)
git clone <your-repo-url> .  # if using git
# or manually copy files to ~/rachid

# Create .env file (see ENV_TEMPLATE.md for template)
# Copy values from ENV_TEMPLATE.md or create manually
nano .env
```

### 4. Configure Environment Variables

Edit `.env` file with your actual values:

```env
NODE_ENV=production
PORT=3001

# Database - your existing PostgreSQL container 'pg17' is on port 5437
DATABASE_URL=postgresql://postgres:your-password@host.docker.internal:5437/racha_contas
# OR use individual variables:
DB_HOST=host.docker.internal
DB_PORT=5437
DB_USERNAME=postgres
DB_PASSWORD=your-password
DB_DATABASE=racha_contas

# JWT Secret (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=your-jwt-secret-here

# Frontend URL
FRONTEND_URL=https://orachid.com.br

# SendGrid
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@orachid.com.br
SENDGRID_FROM_NAME=Rachid

# Frontend build variables
VITE_API_URL=https://api.orachid.com.br
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### 5. Make Scripts Executable

```bash
chmod +x scripts/deploy.sh
chmod +x scripts/health-check.sh
```

## Deployment

### Manual Deployment

```bash
cd ~/rachid
./scripts/deploy.sh
```

### Using Docker Compose Directly

```bash
cd ~/rachid

# Stop existing containers
docker-compose down

# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### Automated Deployment via GitHub Actions

1. Configure GitHub Secrets:
   - Go to repository → Settings → Secrets and variables → Actions
   - Add the following secrets:
     - `EC2_HOST`: Your EC2 instance IP or hostname
     - `EC2_USER`: SSH username (usually `ec2-user` or `ubuntu`)
     - `EC2_SSH_KEY`: Private SSH key for EC2 access
     - `DATABASE_URL`: PostgreSQL connection string
     - `DB_HOST`: Database host
     - `DB_PORT`: Database port
     - `DB_USERNAME`: Database username
     - `DB_PASSWORD`: Database password
     - `DB_DATABASE`: Database name
     - `JWT_SECRET`: JWT secret key
     - `FRONTEND_URL`: Frontend URL
     - `SENDGRID_API_KEY`: SendGrid API key
     - `SENDGRID_FROM_EMAIL`: SendGrid from email
     - `SENDGRID_FROM_NAME`: SendGrid from name
     - `VITE_API_URL`: Frontend API URL
     - `VITE_GOOGLE_CLIENT_ID`: Google OAuth client ID

2. Push to main/master branch:
   ```bash
   git push origin main
   ```

3. GitHub Actions will automatically:
   - Build Docker images
   - Deploy to EC2 via SSH
   - Start containers
   - Run health checks

## SSL/TLS Configuration (Let's Encrypt)

```bash
# Install Certbot
sudo yum install certbot python3-certbot-apache -y  # Amazon Linux / CentOS
# or
sudo apt install certbot python3-certbot-apache -y  # Ubuntu/Debian

# Get SSL certificates
sudo certbot --apache -d orachid.com.br -d www.orachid.com.br
sudo certbot --apache -d api.orachid.com.br

# Auto-renewal (already configured by certbot)
sudo certbot renew --dry-run
```

After SSL setup, uncomment SSL configuration in Apache virtual host files.

## Health Checks

Run health check script:
```bash
./scripts/health-check.sh
```

Or check manually:
```bash
# Backend
curl http://localhost:3001/health

# Frontend
curl http://localhost/health

# Database
docker-compose exec postgres pg_isready -U postgres
```

## Monitoring and Logs

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Apache logs (Amazon Linux 2)
sudo tail -f /var/log/httpd/orachid-frontend-access.log
sudo tail -f /var/log/httpd/orachid-api-access.log
sudo tail -f /var/log/httpd/error_log
```

### Container Status

```bash
docker-compose ps
docker stats
```

### Database Access

```bash
# Connect to database (existing PostgreSQL container)
docker exec -it pg17 psql -U postgres -d rachid

# Backup database
docker exec pg17 pg_dump -U postgres racha_contas > backup.sql

# Restore database
docker exec -i pg17 psql -U postgres racha_contas < backup.sql
```

## Troubleshooting

### Containers won't start

```bash
# Check logs
docker-compose logs

# Check if ports are in use (Amazon Linux 2)
sudo netstat -tulpn | grep -E ':(80|443|8080|3001|5437)'
# Or use ss command
sudo ss -tulpn | grep -E ':(80|443|8080|3001|5437)'

# Restart Docker service
sudo systemctl restart docker
```

### Apache proxy not working

```bash
# Check Apache configuration (Amazon Linux 2)
sudo httpd -t

# Check Apache logs
sudo tail -f /var/log/httpd/error_log
sudo tail -f /var/log/httpd/orachid-frontend-error.log
sudo tail -f /var/log/httpd/orachid-api-error.log

# Check if Apache is running
sudo systemctl status httpd

# Restart Apache
sudo systemctl restart httpd

# Check if modules are loaded
httpd -M | grep -E 'proxy|headers'
```

### Database connection issues

```bash
# Check if database container is running
docker ps | grep pg17

# Check database logs
docker logs pg17

# Test connection
docker exec pg17 psql -U postgres -c "SELECT 1"

# Verify port 5437 is accessible
nc -zv localhost 5437
```

### Frontend can't connect to backend

1. Verify `VITE_API_URL` in `.env` matches your API domain
2. Check CORS configuration in `backend/src/server.ts`
3. Verify Apache proxy configuration
4. Check browser console for errors

## Updating the Application

### Manual Update

```bash
cd ~/rachid
git pull  # or copy new files
./scripts/deploy.sh
```

### Via GitHub Actions

Just push to main/master branch - deployment is automatic.

## Backup and Recovery

### Database Backup

```bash
# Create backup (existing PostgreSQL container)
docker exec pg17 pg_dump -U postgres rachid > backup-$(date +%Y%m%d-%H%M%S).sql

# Restore from backup
docker exec -i pg17 psql -U postgres rachid < backup-YYYYMMDD-HHMMSS.sql
```

### Volume Backup

```bash
# Backup Docker volumes
docker run --rm -v rachid_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-data-$(date +%Y%m%d).tar.gz /data
```

## Security Considerations

1. **Firewall**: Only open necessary ports (22, 80, 443)
2. **SSH Keys**: Use SSH keys instead of passwords
3. **Environment Variables**: Never commit `.env` file
4. **SSL/TLS**: Always use HTTPS in production
5. **Updates**: Regularly update Docker images and system packages
6. **Backups**: Set up automated database backups
7. **Monitoring**: Set up monitoring and alerting

## Next Steps

1. Set up SSL certificates (Let's Encrypt)
2. Configure automated backups
3. Set up monitoring (e.g., CloudWatch, Datadog)
4. Configure log aggregation
5. Set up alerting for service failures
6. Configure DNS properly
7. Set up CDN for static assets (optional)

