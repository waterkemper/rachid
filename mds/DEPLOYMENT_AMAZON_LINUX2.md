# Quick Start Guide - Amazon Linux 2

This is a quick reference guide specifically for Amazon Linux 2. For detailed documentation, see [DEPLOYMENT.md](DEPLOYMENT.md).

## Prerequisites

- EC2 instance running Amazon Linux 2
- Root or sudo access
- Domain names configured to point to EC2 IP

## Quick Setup

### 1. Install Docker and Docker Compose

```bash
# Update system
sudo yum update -y

# Install Docker
sudo yum install docker -y

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group
sudo usermod -aG docker $USER
newgrp docker  # Apply group change without logging out

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker --version
docker-compose --version
```

### 2. Install and Configure Apache

```bash
# Install Apache
sudo yum install httpd -y

# Enable required modules in /etc/httpd/conf/httpd.conf
sudo sed -i 's/#LoadModule proxy_module/LoadModule proxy_module/' /etc/httpd/conf/httpd.conf
sudo sed -i 's/#LoadModule proxy_http_module/LoadModule proxy_http_module/' /etc/httpd/conf/httpd.conf
sudo sed -i 's/#LoadModule headers_module/LoadModule headers_module/' /etc/httpd/conf/httpd.conf
sudo sed -i 's/#LoadModule ssl_module/LoadModule ssl_module/' /etc/httpd/conf/httpd.conf

# Copy virtual host configurations
sudo cp apache/orachid-frontend.conf /etc/httpd/conf.d/
sudo cp apache/orachid-api.conf /etc/httpd/conf.d/

# Test configuration
sudo httpd -t

# Start and enable Apache
sudo systemctl start httpd
sudo systemctl enable httpd
```

### 3. Setup Project

```bash
# Create project directory
mkdir -p ~/rachid
cd ~/rachid

# Clone repository or copy files
git clone <your-repo-url> .  # if using git

# Create .env file (see ENV_TEMPLATE.md)
nano .env
```

### 4. Configure Environment Variables

Create `.env` file with:

```env
NODE_ENV=production
PORT=3001

# Database - your existing PostgreSQL container 'pg17' on port 5437
DB_HOST=host.docker.internal
DB_PORT=5437
DB_USERNAME=postgres
DB_PASSWORD=your-password
DB_DATABASE=rachid  # or your actual database name

JWT_SECRET=your-jwt-secret
FRONTEND_URL=https://orachid.com.br
VITE_API_URL=https://api.orachid.com.br
VITE_GOOGLE_CLIENT_ID=your-google-client-id

SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM_EMAIL=noreply@orachid.com.br
SENDGRID_FROM_NAME=Rachid
```

### 5. Deploy

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Deploy
./scripts/deploy.sh
```

### 6. Configure Firewall (Security Group)

In AWS EC2 Console, open these ports in Security Group:
- 22 (SSH)
- 80 (HTTP)
- 443 (HTTPS)

### 7. Setup SSL (Optional but Recommended)

```bash
# Enable EPEL
sudo amazon-linux-extras install epel -y

# Install Certbot
sudo yum install certbot python3-certbot-apache -y

# Get certificates
sudo certbot --apache -d orachid.com.br -d www.orachid.com.br
sudo certbot --apache -d api.orachid.com.br

# Uncomment SSL configuration in Apache config files
# Edit /etc/httpd/conf.d/orachid-frontend.conf and orachid-api.conf
# Uncomment SSLEngine and certificate lines
sudo systemctl restart httpd
```

## Useful Commands

```bash
# View Docker containers
docker ps
docker-compose ps

# View logs
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f frontend

# Apache logs
sudo tail -f /var/log/httpd/error_log
sudo tail -f /var/log/httpd/orachid-frontend-access.log

# Restart services
docker-compose restart
sudo systemctl restart httpd

# Health check
./scripts/health-check.sh

# Check ports
sudo ss -tulpn | grep -E ':(80|443|8080|3001|5437)'
```

## Troubleshooting

### Docker permission denied

```bash
sudo usermod -aG docker $USER
newgrp docker
```

### Apache won't start

```bash
# Check configuration
sudo httpd -t

# Check if modules are loaded
httpd -M | grep proxy

# Check logs
sudo tail -f /var/log/httpd/error_log
```

### Containers won't start

```bash
# Check logs
docker-compose logs

# Check if ports are in use
sudo ss -tulpn | grep -E ':(8080|3001)'
```

### Database connection fails

```bash
# Check if PostgreSQL container is running
docker ps | grep pg17

# Test connection from host
docker exec pg17 psql -U postgres -c "SELECT 1"

# Check backend logs
docker-compose logs backend
```

## Next Steps

- See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed documentation
- See [DOCKER_SETUP.md](DOCKER_SETUP.md) for Docker-specific info
- See [apache/README.md](apache/README.md) for Apache configuration

