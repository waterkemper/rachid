# GitHub Actions CI/CD Setup Guide

This guide explains how to configure GitHub Actions for automated deployment to your EC2 instance.

## Overview

The GitHub Actions workflow automatically:
1. Builds Docker images
2. Copies files to EC2 via SCP
3. Deploys containers using docker-compose
4. Runs health checks
5. Cleans up old images

## Prerequisites

1. GitHub repository with Actions enabled
2. EC2 instance with SSH access configured
3. SSH key pair for EC2 access
4. All environment variables ready

## Setup Steps

### 1. Generate SSH Key for EC2 (if not already done)

On your local machine:

```bash
# Generate SSH key pair
ssh-keygen -t rsa -b 4096 -C "github-actions" -f ~/.ssh/github-actions-ec2

# Copy public key to EC2
ssh-copy-id -i ~/.ssh/github-actions-ec2.pub ec2-user@your-ec2-ip

# Test connection
ssh -i ~/.ssh/github-actions-ec2 ec2-user@your-ec2-ip
```

**Important**: Keep the private key (`github-actions-ec2`) secure - you'll add it to GitHub Secrets.

### 2. Configure GitHub Secrets

Go to your GitHub repository:
1. Click **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add each secret one by one:

#### Required Secrets

**EC2 Connection:**
- `EC2_HOST`: Your EC2 instance IP or hostname (e.g., `54.123.45.67` or `ec2-54-123-45-67.compute-1.amazonaws.com`)
- `EC2_USER`: SSH username (usually `ec2-user` for Amazon Linux 2, or `ubuntu` for Ubuntu)
- `EC2_SSH_KEY`: Private SSH key content (entire content of `~/.ssh/github-actions-ec2`)

**Database:**
- `DATABASE_URL`: Full PostgreSQL connection string (optional if using individual variables)
- `DB_HOST`: Database host (`host.docker.internal`)
- `DB_PORT`: Database port (`5437`)
- `DB_USERNAME`: Database username (`postgres`)
- `DB_PASSWORD`: Database password
- `DB_DATABASE`: Database name (`rachid`)

**Application:**
- `JWT_SECRET`: Strong random secret key (generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)
- `FRONTEND_URL`: Frontend URL (`https://orachid.com.br`)

**SendGrid (Email):**
- `SENDGRID_API_KEY`: SendGrid API key
- `SENDGRID_FROM_EMAIL`: Sender email address
- `SENDGRID_FROM_NAME`: Sender name (`Rachid`)

**PayPal (Subscriptions):**
- `PAYPAL_CLIENT_ID`: PayPal REST API Client ID
- `PAYPAL_CLIENT_SECRET`: PayPal REST API Client Secret
- `PAYPAL_MODE`: `sandbox` or `live`
- `PAYPAL_WEBHOOK_ID`: PayPal Webhook ID (starts with `WH-`)
- `PAYPAL_PLAN_ID_MONTHLY`: Monthly plan ID (starts with `P-`) - Optional (can be from database)
- `PAYPAL_PLAN_ID_YEARLY`: Yearly plan ID (starts with `P-`) - Optional (can be from database)
- `PAYPAL_LIFETIME_AMOUNT`: Lifetime purchase amount (`499.00`)
- `PAYPAL_PRODUCT_ID`: PayPal Product ID (starts with `PROD-`)

**AWS S3 (File Uploads):**
- `AWS_REGION`: AWS region (e.g., `sa-east-1`, `us-east-1`)
- `AWS_ACCESS_KEY_ID`: AWS IAM access key ID
- `AWS_SECRET_ACCESS_KEY`: AWS IAM secret access key
- `AWS_S3_BUCKET_NAME`: S3 bucket name (e.g., `orachid-despesas`)
- `AWS_CLOUDFRONT_DOMAIN`: CloudFront distribution domain (optional, e.g., `d1234567890.cloudfront.net`)

**Image Optimization (Optional):**
- `IMAGE_MAX_WIDTH`: Max image width (`1920`)
- `IMAGE_JPEG_QUALITY`: JPEG quality (`85`)
- `IMAGE_PNG_QUALITY`: PNG quality (`80`)
- `IMAGE_ENABLE_WEBP`: Enable WebP (`true`)

**Frontend Build:**
- `VITE_API_URL`: Backend API URL (`https://api.orachid.com.br`)
- `VITE_GOOGLE_CLIENT_ID`: Google OAuth Client ID

### 3. Verify Workflow File

The workflow file is located at `.github/workflows/deploy.yml`. It should:
- Trigger on push to `main` or `master` branch
- Trigger manually via `workflow_dispatch`
- Create `.env` file with all secrets
- Copy files to EC2
- Deploy using docker-compose
- Run health checks

### 4. Test the Workflow

1. **Manual Trigger (Recommended for first test):**
   - Go to **Actions** tab in GitHub
   - Select **Deploy to EC2** workflow
   - Click **Run workflow**
   - Select branch and click **Run workflow**

2. **Or push to main/master:**
   ```bash
   git push origin main
   ```

3. **Monitor the workflow:**
   - Go to **Actions** tab
   - Click on the running workflow
   - Watch the logs in real-time

### 5. Verify Deployment

After workflow completes:

```bash
# SSH into EC2
ssh ec2-user@your-ec2-ip

# Check containers
docker-compose ps

# Check logs
docker-compose logs -f

# Test health endpoints
curl http://localhost:3001/health
curl http://localhost:8080/health
```

## Workflow Details

### What Happens During Deployment

1. **Checkout Code**: GitHub Actions checks out your repository
2. **Set up Docker Buildx**: Prepares Docker for building images
3. **Create .env File**: Creates environment file with all secrets
4. **Copy Files to EC2**: Uses SCP to copy entire repository to EC2
5. **Deploy**: 
   - Stops existing containers
   - Removes old images
   - Builds new images
   - Starts containers
   - Waits for services
   - Runs health checks
6. **Cleanup**: Removes dangling Docker images

### Deployment Location

Files are copied to: `/home/{EC2_USER}/rachid`

For example, if `EC2_USER=ec2-user`, files go to: `/home/ec2-user/rachid`

### Health Checks

The workflow checks:
- Backend health: `http://localhost:3001/health`
- Frontend health: `http://localhost:8080/health`

If either check fails, the workflow fails.

## Troubleshooting

### Workflow Fails at "Copy files to EC2"

**Possible causes:**
- SSH key incorrect or not added to EC2
- EC2_HOST incorrect
- EC2_USER incorrect
- Firewall blocking SSH (port 22)

**Solutions:**
- Verify SSH key works manually: `ssh -i ~/.ssh/github-actions-ec2 ec2-user@your-ec2-ip`
- Check EC2 Security Group allows port 22 from GitHub Actions IPs
- Verify EC2_HOST and EC2_USER in GitHub Secrets

### Workflow Fails at "Deploy to EC2"

**Possible causes:**
- Docker not installed on EC2
- Docker Compose not installed
- Ports already in use
- Environment variables missing

**Solutions:**
- SSH into EC2 and verify: `docker --version` and `docker-compose --version`
- Check if ports are in use: `sudo ss -tulpn | grep -E ':(8080|3001)'`
- Verify all secrets are set in GitHub
- Check EC2 logs: `docker-compose logs`

### Health Checks Fail

**Possible causes:**
- Services not starting correctly
- Database connection issues
- Missing environment variables

**Solutions:**
- Check container logs: `docker-compose logs backend`
- Verify database is accessible: `docker exec pg17 pg_isready`
- Check `.env` file on EC2: `cat /home/ec2-user/rachid/.env`
- Verify all required secrets are set

### Build Fails

**Possible causes:**
- Dockerfile errors
- Missing dependencies
- Sharp build issues

**Solutions:**
- Check build logs in GitHub Actions
- Test build locally: `docker-compose build`
- Verify Dockerfile syntax

## Security Best Practices

1. **SSH Key Security:**
   - Use a dedicated SSH key for GitHub Actions
   - Never commit private keys to repository
   - Rotate keys periodically

2. **Secrets Management:**
   - Never commit secrets to code
   - Use GitHub Secrets for all sensitive data
   - Review secrets regularly

3. **EC2 Security:**
   - Restrict SSH access to specific IPs (if possible)
   - Use SSH keys, not passwords
   - Keep EC2 instance updated

4. **Network Security:**
   - Only open necessary ports (22, 80, 443)
   - Use Security Groups to restrict access
   - Consider VPN for additional security

## Advanced Configuration

### Deploy Only on Tags

To deploy only when creating a tag:

```yaml
on:
  push:
    tags:
      - 'v*'
```

### Deploy to Different Environments

Create separate workflows for staging/production:

- `.github/workflows/deploy-staging.yml`
- `.github/workflows/deploy-production.yml`

Use different secrets:
- `EC2_HOST_STAGING`
- `EC2_HOST_PRODUCTION`

### Add Notifications

Add Slack/Discord notifications:

```yaml
- name: Notify on Success
  if: success()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## Manual Deployment Alternative

If you prefer manual deployment or GitHub Actions isn't working:

```bash
# SSH into EC2
ssh ec2-user@your-ec2-ip

# Navigate to project
cd ~/rachid

# Pull latest code (if using git)
git pull origin main

# Deploy
./scripts/deploy.sh
```

## Next Steps

1. Configure all GitHub Secrets
2. Test workflow with manual trigger
3. Monitor first deployment
4. Set up notifications (optional)
5. Configure branch protection (optional)

## Reference

- **Workflow File**: `.github/workflows/deploy.yml`
- **Deployment Script**: `scripts/deploy.sh`
- **Environment Template**: `ENV_TEMPLATE.md`
- **Deployment Guide**: `DEPLOYMENT.md`
