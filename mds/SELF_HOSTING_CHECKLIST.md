# Self-Hosting Checklist - EC2 Deployment

This checklist covers all requirements for self-hosting the Rachid application on EC2, including recent implementations (PayPal, S3 uploads, image optimization).

## ✅ Core Infrastructure (Already Configured)

- [x] Docker and Docker Compose setup
- [x] PostgreSQL container (pg17 on port 5437)
- [x] Apache reverse proxy configuration
- [x] GitHub Actions CI/CD pipeline
- [x] Environment variable templates

## 🔑 Required Environment Variables

### 1. Basic Application

```env
NODE_ENV=production
PORT=3001
JWT_SECRET=your-jwt-secret-key-here
FRONTEND_URL=https://orachid.com.br
```

### 2. Database (PostgreSQL)

```env
DB_HOST=host.docker.internal
DB_PORT=5437
DB_USERNAME=postgres
DB_PASSWORD=your-postgres-password
DB_DATABASE=rachid
# OR use DATABASE_URL:
DATABASE_URL=postgresql://postgres:password@host.docker.internal:5437/rachid
```

### 3. Email Service (SendGrid)

```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@orachid.com.br
SENDGRID_FROM_NAME=Rachid
```

**Setup Required:**
- [ ] Create SendGrid account at [sendgrid.com](https://sendgrid.com)
- [ ] Create API key with "Mail Send" permission
- [ ] Verify sender email address or domain
- [ ] Add API key to `.env`

### 4. PayPal Integration (Subscription System)

```env
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_MODE=sandbox  # or 'live' for production
PAYPAL_WEBHOOK_ID=WH-xxxxxxxxxxxxx
PAYPAL_PLAN_ID_MONTHLY=P-xxxxxxxxxxxxx  # Optional (now from database)
PAYPAL_PLAN_ID_YEARLY=P-yyyyyyyyyyyyy  # Optional (now from database)
PAYPAL_LIFETIME_AMOUNT=499.00
PAYPAL_PRODUCT_ID=PROD-xxxxxxxxxxxxx
```

**Setup Required:**
- [ ] Create PayPal Business account at [developer.paypal.com](https://developer.paypal.com)
- [ ] Create app in PayPal Developer Dashboard
- [ ] Copy Client ID and Client Secret
- [ ] Create subscription plans (Monthly, Yearly) in PayPal Dashboard
- [ ] Copy Plan IDs (start with `P-`)
- [ ] Create webhook:
  - URL: `https://api.orachid.com.br/api/subscriptions/webhook`
  - Events: `BILLING.SUBSCRIPTION.*`, `PAYMENT.SALE.*`, `PAYMENT.CAPTURE.*`
- [ ] Copy Webhook ID (starts with `WH-`)
- [ ] Create product in PayPal Dashboard
- [ ] Copy Product ID (starts with `PROD-`)
- [ ] Add all credentials to `.env`
- [ ] **Important**: Set `PAYPAL_MODE=live` for production (after testing)

**Note**: Plan IDs can also be managed via admin interface at `/admin/plans` after initial setup.

### 5. AWS S3 (File Uploads)

```env
AWS_REGION=sa-east-1  # or us-east-1, etc.
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET_NAME=orachid-despesas
AWS_CLOUDFRONT_DOMAIN=d1234567890.cloudfront.net  # Optional but recommended
```

**Setup Required:**
- [ ] Create AWS account (if not already have one)
- [ ] Create S3 bucket:
  - Name: `orachid-despesas` (or your preferred name)
  - Region: Choose closest to your users (e.g., `sa-east-1` for Brazil)
  - Block Public Access: **Enabled** (access via CloudFront only)
  - Encryption: Enable SSE-S3
- [ ] Create IAM user for S3 access:
  - User name: `orachid-s3-uploader`
  - Permissions: S3 read/write/delete for the bucket only
  - Create access key
  - Copy Access Key ID and Secret Access Key
- [ ] Configure S3 CORS (see `backend/database/S3_CLOUDFRONT_SETUP.md`)
- [ ] (Optional but recommended) Create CloudFront distribution:
  - Origin: Your S3 bucket
  - Use Origin Access Control (OAC)
  - Enable HTTPS only
  - Copy distribution domain name
- [ ] Add all credentials to `.env`

**Detailed Setup Guide**: See `backend/database/S3_CLOUDFRONT_SETUP.md`

### 6. Image Optimization (Optional Configuration)

```env
IMAGE_MAX_WIDTH=1920
IMAGE_JPEG_QUALITY=85
IMAGE_PNG_QUALITY=80
IMAGE_ENABLE_WEBP=true
```

**No Setup Required**: These are optional and have defaults. Sharp library handles image processing automatically.

### 7. Frontend Build Variables

```env
VITE_API_URL=https://api.orachid.com.br
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

**Setup Required:**
- [ ] Create Google OAuth credentials at [Google Cloud Console](https://console.cloud.google.com)
- [ ] Add authorized redirect URIs:
  - `https://orachid.com.br` (production)
  - `http://localhost:5173` (development)
- [ ] Copy Client ID
- [ ] Add to `.env` (baked into frontend build)

### 8. Scheduled Jobs (Optional)

```env
VENCIMENTO_CRON=0 10 * * *  # Daily at 10:00 UTC (07:00 BRT)
```

**No Setup Required**: Default cron schedule for subscription expiration reminders.

## 📦 Docker Dependencies

### Native Dependencies (Sharp)

The `sharp` library uses pre-built binaries for Alpine Linux. The Dockerfile includes vips support for optimal performance.

- [x] Backend Dockerfile includes vips (already configured in Dockerfile)
- [ ] Verify Sharp installs correctly during `docker-compose build`
- [ ] Test image optimization after deployment (upload an image to an expense)

**Note**: Sharp should work out of the box. The Dockerfile already includes `vips-dev` and `vips` packages for image processing.

## 🔧 Additional Setup Tasks

### 1. Database Initialization

- [ ] Run database migrations (if any)
- [ ] Initialize plan_limits table with default values
- [ ] Initialize plans table with PayPal plan IDs
- [ ] Set up pg-boss schema (for scheduled jobs):
  ```bash
  docker-compose exec backend npm run setup-pgboss
  ```

### 2. PayPal Webhook Configuration

- [ ] Ensure webhook URL is publicly accessible: `https://api.orachid.com.br/api/subscriptions/webhook`
- [ ] Test webhook delivery in PayPal Dashboard
- [ ] Verify webhook events are being received (check backend logs)

### 3. S3 Bucket Configuration

- [ ] Verify bucket CORS allows your frontend domain
- [ ] Test file upload functionality
- [ ] Verify CloudFront distribution (if using) serves files correctly
- [ ] Check file access permissions

### 4. SSL/TLS Certificates

- [ ] Install Certbot on EC2
- [ ] Get SSL certificates for:
  - `orachid.com.br`
  - `www.orachid.com.br`
  - `api.orachid.com.br`
- [ ] Uncomment SSL configuration in Apache virtual host files
- [ ] Restart Apache

### 5. Firewall/Security Group

- [ ] Open ports in EC2 Security Group:
  - 22 (SSH)
  - 80 (HTTP)
  - 443 (HTTPS)
- [ ] Close unnecessary ports
- [ ] Configure fail2ban or similar (optional but recommended)

### 6. Monitoring and Logging

- [ ] Set up log rotation for Apache logs
- [ ] Configure Docker log rotation
- [ ] Set up monitoring (CloudWatch, Datadog, etc.) - optional
- [ ] Configure alerts for service failures - optional

## 🧪 Testing Checklist

### Basic Functionality

- [ ] Frontend loads at `https://orachid.com.br`
- [ ] API responds at `https://api.orachid.com.br/api/health`
- [ ] Database connection works
- [ ] User registration works
- [ ] User login works
- [ ] Google OAuth login works

### PayPal Integration

- [ ] Subscription plans display correctly
- [ ] Can create monthly subscription (test in sandbox)
- [ ] Can create yearly subscription (test in sandbox)
- [ ] Can create lifetime purchase (test in sandbox)
- [ ] Webhook receives events (check logs)
- [ ] Subscription activation works after PayPal approval
- [ ] Subscription status syncs correctly

### File Upload (S3)

- [ ] Can upload image attachment to expense
- [ ] Image is optimized (check file size reduction)
- [ ] Image is converted to WebP (if enabled)
- [ ] File is accessible via CloudFront URL (if configured)
- [ ] Can delete attachment
- [ ] File is removed from S3 when deleted

### Email Service

- [ ] Password recovery email sends
- [ ] Welcome email sends
- [ ] Subscription emails send (payment failed, expired, etc.)
- [ ] Email templates render correctly

### Scheduled Jobs

- [ ] Subscription expiration reminders send (if configured)
- [ ] Jobs run on schedule (check logs)

## 🔄 CI/CD Setup (GitHub Actions)

### GitHub Actions Configuration

- [ ] Generate SSH key for EC2 access
- [ ] Add SSH public key to EC2 authorized_keys
- [ ] Configure all GitHub Secrets (see `.github/GITHUB_ACTIONS_SETUP.md`)
- [ ] Test workflow with manual trigger
- [ ] Verify deployment works correctly
- [ ] Set up branch protection (optional)

**Complete Setup Guide**: See `.github/GITHUB_ACTIONS_SETUP.md`

**Required GitHub Secrets:**
- EC2 connection: `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`
- Database: `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`
- Application: `JWT_SECRET`, `FRONTEND_URL`
- SendGrid: `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `SENDGRID_FROM_NAME`
- PayPal: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MODE`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_PRODUCT_ID`, etc.
- AWS S3: `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME`, `AWS_CLOUDFRONT_DOMAIN`
- Frontend: `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`
- Image optimization: `IMAGE_MAX_WIDTH`, `IMAGE_JPEG_QUALITY`, `IMAGE_PNG_QUALITY`, `IMAGE_ENABLE_WEBP`

## 📋 Pre-Deployment Checklist

Before going live:

- [ ] All environment variables configured
- [ ] All external services (PayPal, S3, SendGrid) configured
- [ ] GitHub Actions secrets configured
- [ ] CI/CD workflow tested
- [ ] SSL certificates installed
- [ ] PayPal mode set to `live` (not `sandbox`)
- [ ] Database backed up
- [ ] Health checks passing
- [ ] All tests completed
- [ ] Monitoring configured
- [ ] Documentation updated

## 🚨 Critical Notes

### PayPal

1. **Sandbox vs Live**: Always test in sandbox first, then switch to `live` mode
2. **Webhook URL**: Must be publicly accessible and use HTTPS
3. **Plan IDs**: Can be managed via admin interface, but initial setup requires PayPal Dashboard
4. **Webhook Security**: PayPal webhook ID is used for verification

### S3

1. **Bucket Security**: Never make bucket publicly accessible
2. **CloudFront**: Highly recommended for production (CDN, better performance)
3. **CORS**: Must allow your frontend domain
4. **Costs**: Monitor S3 storage and CloudFront bandwidth costs

### Image Optimization

1. **Sharp Library**: Requires native binaries (handled by Docker)
2. **Memory**: Image processing can be memory-intensive for large images
3. **Performance**: WebP conversion improves file sizes significantly

### Database

1. **Backups**: Set up automated backups for PostgreSQL
2. **pg-boss**: Required for scheduled jobs (subscription reminders)
3. **Migrations**: Run any pending migrations before deployment

## 📚 Reference Documentation

- **PayPal Setup**: `PAYPAL_OPERATION_GUIDE.md`
- **S3/CloudFront Setup**: `backend/database/S3_CLOUDFRONT_SETUP.md`
- **Deployment Guide**: `DEPLOYMENT.md`
- **Docker Setup**: `DOCKER_SETUP.md`
- **Environment Variables**: `ENV_TEMPLATE.md`
- **Amazon Linux 2 Quick Start**: `DEPLOYMENT_AMAZON_LINUX2.md`

## 🔄 Post-Deployment

After deployment:

1. Monitor logs for errors
2. Test all critical paths
3. Verify scheduled jobs are running
4. Check PayPal webhook delivery
5. Monitor S3 costs
6. Set up automated backups
7. Configure monitoring alerts

## 💰 Estimated Monthly Costs

- **EC2 Instance**: $10-50/month (depending on size)
- **S3 Storage**: ~$0.12/month (for small usage)
- **CloudFront**: ~$0.10-1/month (depending on traffic)
- **SendGrid**: Free tier (up to 100 emails/day) or $15+/month
- **PayPal**: Transaction fees only (no monthly fee)
- **Domain**: ~$10-15/year

**Total**: ~$15-70/month (excluding transaction fees)
