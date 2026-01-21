# Self-Hosting Summary - Recent Implementations Review

This document summarizes recent implementations (PayPal, S3 uploads, image optimization) and what's needed for self-hosting on EC2.

## 📋 Recent Implementations Review

### 1. PayPal Subscription System ✅

**What it does:**
- Handles monthly/yearly subscriptions and lifetime purchases
- Manages subscription status, billing cycles, and webhooks
- Automatically downgrades users on payment failure
- Sends email notifications for subscription events

**Dependencies:**
- PayPal Business account
- PayPal REST API credentials (Client ID, Secret)
- PayPal webhook configuration
- Plan IDs stored in database (can be managed via admin interface)

**Environment Variables Required:**
```env
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_MODE=sandbox|live
PAYPAL_WEBHOOK_ID=WH-...
PAYPAL_PLAN_ID_MONTHLY=P-...  # Optional (from database)
PAYPAL_PLAN_ID_YEARLY=P-...   # Optional (from database)
PAYPAL_LIFETIME_AMOUNT=499.00
PAYPAL_PRODUCT_ID=PROD-...
```

**Setup Steps:**
1. Create PayPal Business account
2. Create app in PayPal Developer Dashboard
3. Create subscription plans (Monthly, Yearly)
4. Create webhook pointing to `https://api.orachid.com.br/api/subscriptions/webhook`
5. Add credentials to `.env`

**Documentation:** `PAYPAL_OPERATION_GUIDE.md`

### 2. S3 File Upload System ✅

**What it does:**
- Uploads expense attachments (receipts, images, PDFs) to AWS S3
- Only available for PRO plan users
- Supports images, PDFs, and office documents
- Files organized by expense ID in S3

**Dependencies:**
- AWS account
- S3 bucket
- IAM user with S3 permissions
- CloudFront distribution (optional but recommended)

**Environment Variables Required:**
```env
AWS_REGION=sa-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET_NAME=orachid-despesas
AWS_CLOUDFRONT_DOMAIN=d1234567890.cloudfront.net  # Optional
```

**Setup Steps:**
1. Create S3 bucket
2. Configure CORS for your domain
3. Create IAM user with S3 permissions
4. (Optional) Create CloudFront distribution
5. Add credentials to `.env`

**Documentation:** `backend/database/S3_CLOUDFRONT_SETUP.md`

### 3. Image Optimization ✅

**What it does:**
- Automatically optimizes uploaded images
- Resizes large images (max width: 1920px)
- Converts to WebP format for better compression (~30% smaller)
- Compresses JPEG and PNG files

**Dependencies:**
- `sharp` npm package (native binaries)
- `vips` library in Docker (already configured)

**Environment Variables (Optional):**
```env
IMAGE_MAX_WIDTH=1920
IMAGE_JPEG_QUALITY=85
IMAGE_PNG_QUALITY=80
IMAGE_ENABLE_WEBP=true
```

**Setup Steps:**
- ✅ Already configured in Dockerfile (vips included)
- No additional setup needed

**Note:** Sharp uses pre-built binaries for Alpine Linux, so it should work out of the box.

## 🔧 What's Already Configured for Self-Hosting

### Docker Setup ✅
- [x] Backend Dockerfile with Sharp support (vips included)
- [x] Frontend Dockerfile with nginx
- [x] docker-compose.yml configured for existing PostgreSQL
- [x] Health checks for all services
- [x] Non-root users for security

### Infrastructure ✅
- [x] Apache reverse proxy configuration
- [x] GitHub Actions CI/CD pipeline
- [x] Deployment scripts
- [x] Health check scripts
- [x] Environment variable templates

### Documentation ✅
- [x] Complete deployment guide (`DEPLOYMENT.md`)
- [x] Docker setup guide (`DOCKER_SETUP.md`)
- [x] Amazon Linux 2 quick start (`DEPLOYMENT_AMAZON_LINUX2.md`)
- [x] Self-hosting checklist (`SELF_HOSTING_CHECKLIST.md`)

## ⚠️ What You Need to Configure

### 1. External Services (Required)

#### SendGrid (Email)
- [ ] Create account
- [ ] Create API key
- [ ] Verify sender email
- [ ] Add to `.env`

#### PayPal (Subscriptions)
- [ ] Create Business account
- [ ] Create app and get credentials
- [ ] Create subscription plans
- [ ] Configure webhook
- [ ] Add to `.env`

#### AWS S3 (File Storage)
- [ ] Create S3 bucket
- [ ] Create IAM user
- [ ] Configure CORS
- [ ] (Optional) Create CloudFront distribution
- [ ] Add to `.env`

#### Google OAuth (Login)
- [ ] Create OAuth credentials
- [ ] Add redirect URIs
- [ ] Add to `.env`

### 2. Environment Variables

All required variables are documented in:
- `ENV_TEMPLATE.md` - Complete template with descriptions
- `SELF_HOSTING_CHECKLIST.md` - Setup checklist

**Quick Reference:**
```env
# Core
NODE_ENV=production
PORT=3001
JWT_SECRET=...
FRONTEND_URL=https://orachid.com.br

# Database
DB_HOST=host.docker.internal
DB_PORT=5437
DB_USERNAME=postgres
DB_PASSWORD=...
DB_DATABASE=rachid

# SendGrid
SENDGRID_API_KEY=...
SENDGRID_FROM_EMAIL=...
SENDGRID_FROM_NAME=Rachid

# PayPal
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_MODE=live
PAYPAL_WEBHOOK_ID=...
PAYPAL_PRODUCT_ID=...

# AWS S3
AWS_REGION=sa-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET_NAME=...
AWS_CLOUDFRONT_DOMAIN=...  # Optional

# Frontend
VITE_API_URL=https://api.orachid.com.br
VITE_GOOGLE_CLIENT_ID=...
```

### 3. Database Setup

- [ ] Run migrations (if any)
- [ ] Initialize `plan_limits` table
- [ ] Initialize `plans` table with PayPal plan IDs
- [ ] Set up pg-boss schema for scheduled jobs:
  ```bash
  docker-compose exec backend npm run setup-pgboss
  ```

### 4. SSL/TLS

- [ ] Install Certbot
- [ ] Get SSL certificates for all domains
- [ ] Uncomment SSL config in Apache files
- [ ] Restart Apache

## 🚀 Deployment Steps

1. **Follow `DEPLOYMENT_AMAZON_LINUX2.md`** for quick setup
2. **Configure all external services** (SendGrid, PayPal, AWS, Google)
3. **Create `.env` file** with all variables
4. **Deploy** using `./scripts/deploy.sh` or GitHub Actions
5. **Test** all functionality (see testing checklist in `SELF_HOSTING_CHECKLIST.md`)
6. **Set up SSL** certificates
7. **Configure monitoring** and backups

## 📊 Feature Dependencies Matrix

| Feature | External Service | Required? | Cost |
|---------|-----------------|-----------|------|
| User Registration/Login | Google OAuth | Optional | Free |
| Email Sending | SendGrid | Yes | Free tier or $15+/mo |
| Subscriptions | PayPal | Yes | Transaction fees only |
| File Uploads | AWS S3 | Yes | ~$0.12-1/mo |
| Image Optimization | Sharp (local) | No | Free |
| CDN for Files | CloudFront | Optional | ~$0.10-1/mo |

## 🔍 Testing Checklist

After deployment, test:

- [ ] User registration and login
- [ ] Google OAuth login
- [ ] Password recovery email
- [ ] Subscription creation (PayPal sandbox)
- [ ] Subscription webhook reception
- [ ] File upload to expense
- [ ] Image optimization (check file size)
- [ ] File deletion
- [ ] Subscription status sync

## 📚 Documentation Files

- **`SELF_HOSTING_CHECKLIST.md`** - Complete checklist (START HERE)
- **`DEPLOYMENT.md`** - Detailed deployment guide
- **`DEPLOYMENT_AMAZON_LINUX2.md`** - Quick start for Amazon Linux 2
- **`ENV_TEMPLATE.md`** - All environment variables explained
- **`PAYPAL_OPERATION_GUIDE.md`** - PayPal setup and operation
- **`backend/database/S3_CLOUDFRONT_SETUP.md`** - S3/CloudFront setup
- **`DOCKER_SETUP.md`** - Docker-specific documentation

## 💡 Key Points

1. **PayPal**: Start with sandbox mode, test thoroughly, then switch to live
2. **S3**: CloudFront is optional but recommended for production (CDN, better performance)
3. **Sharp**: Already configured in Dockerfile, should work out of the box
4. **Webhooks**: PayPal webhook must be publicly accessible via HTTPS
5. **Database**: pg-boss schema needed for scheduled jobs (subscription reminders)

## 🎯 Next Steps

1. Review `SELF_HOSTING_CHECKLIST.md` for complete setup
2. Configure all external services
3. Set up environment variables
4. Deploy and test
5. Go live!
