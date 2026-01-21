# Environment Variables Template

This file documents all required environment variables. Copy this to `.env` and fill in your values.

**IMPORTANT**: Never commit the `.env` file to version control!

## .env File Template

Create a `.env` file in the project root with the following variables:

```env
# Application Environment
NODE_ENV=production

# Backend Configuration
PORT=3001

# Database Configuration
# Your PostgreSQL is already running in Docker container 'pg17' on port 5437
# Option 1: Use DATABASE_URL (recommended)
DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:5437/rachid

# Option 2: Use individual variables
DB_HOST=host.docker.internal
DB_PORT=5437
DB_USERNAME=postgres
DB_PASSWORD=your-postgres-password
DB_DATABASE=rachid

# JWT Secret (generate a strong random key)
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your-jwt-secret-key-here

# Frontend URL
FRONTEND_URL=https://orachid.com.br

# SendGrid Configuration (Email Service)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@orachid.com.br
SENDGRID_FROM_NAME=Rachid

   # PayPal Configuration (Subscription Service)
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_MODE=sandbox
PAYPAL_WEBHOOK_ID=your-paypal-webhook-id
PAYPAL_PLAN_ID_MONTHLY=your-monthly-plan-id
PAYPAL_PLAN_ID_YEARLY=your-yearly-plan-id
PAYPAL_LIFETIME_AMOUNT=499.00
PAYPAL_PRODUCT_ID=your-product-id

# AWS S3 Configuration (File Upload)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_S3_BUCKET_NAME=orachid-despesas
AWS_CLOUDFRONT_DOMAIN=d1234567890.cloudfront.net

# Image Optimization Settings
IMAGE_MAX_WIDTH=1920
IMAGE_JPEG_QUALITY=85
IMAGE_PNG_QUALITY=80
IMAGE_ENABLE_WEBP=true

# Frontend Build Variables
VITE_API_URL=https://api.orachid.com.br
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

## Variable Descriptions

### NODE_ENV
- **Required**: Yes
- **Values**: `production` or `development`
- **Description**: Environment mode

### PORT
- **Required**: No (default: 3001)
- **Description**: Backend server port

### Database Variables

#### DATABASE_URL (Option 1 - Recommended)
- **Required**: If not using individual DB variables
- **Format**: `postgresql://username:password@host:port/database`
- **Example**: `postgresql://postgres:password@postgres:5432/racha_contas`
- **Description**: Full PostgreSQL connection string

#### DB_HOST (Option 2)
- **Required**: If not using DATABASE_URL
- **Default**: `host.docker.internal` (allows container to access host's PostgreSQL)
- **Description**: Database hostname (use `host.docker.internal` to access PostgreSQL on host port 5437)

#### DB_PORT (Option 2)
- **Required**: If not using DATABASE_URL
- **Default**: `5437` (your existing PostgreSQL container port)
- **Description**: Database port

#### DB_USERNAME (Option 2)
- **Required**: If not using DATABASE_URL
- **Description**: Database username

#### DB_PASSWORD (Option 2)
- **Required**: If not using DATABASE_URL
- **Description**: Database password

#### DB_DATABASE (Option 2)
- **Required**: If not using DATABASE_URL
- **Description**: Database name

### JWT_SECRET
- **Required**: Yes
- **Description**: Secret key for JWT token signing
- **How to generate**:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- **Security**: Use a strong, random value. Never commit to version control.

### FRONTEND_URL
- **Required**: Yes
- **Example**: `https://orachid.com.br`
- **Description**: Frontend URL for CORS configuration

### SendGrid Variables

#### SENDGRID_API_KEY
- **Required**: Yes (for email functionality)
- **Description**: SendGrid API key for sending emails
- **How to get**: 
  1. Create account at [SendGrid](https://sendgrid.com)
  2. Go to Settings → API Keys
  3. Create API key with "Mail Send" permission

#### SENDGRID_FROM_EMAIL
- **Required**: Yes (for email functionality)
- **Example**: `noreply@orachid.com.br`
- **Description**: Email address to send from
- **Note**: Must be verified in SendGrid

#### SENDGRID_FROM_NAME
- **Required**: No (default: "Rachid")
- **Description**: Display name for email sender

### PayPal Variables (Subscription System)

#### PAYPAL_CLIENT_ID
- **Required**: Yes (for subscription functionality)
- **Description**: PayPal REST API Client ID
- **How to get**:
  1. Create PayPal Business account at [PayPal Developer](https://developer.paypal.com)
  2. Create a new app in Dashboard
  3. Copy Client ID from app credentials

#### PAYPAL_CLIENT_SECRET
- **Required**: Yes (for subscription functionality)
- **Description**: PayPal REST API Client Secret
- **How to get**: Same as PAYPAL_CLIENT_ID, copy Client Secret from app credentials
- **Security**: Keep this secret! Never commit to version control.

#### PAYPAL_MODE
- **Required**: Yes
- **Values**: `sandbox` or `live`
- **Default**: `sandbox`
- **Description**: PayPal environment mode
- **Note**: Use `sandbox` for testing, `live` for production

#### PAYPAL_WEBHOOK_ID
- **Required**: Yes (for webhook verification)
- **Description**: PayPal Webhook ID for subscription events
- **How to get**:
  1. Go to PayPal Developer Dashboard → My Apps & Credentials
  2. Click on your app → Webhooks
  3. Create webhook with URL: `https://api.orachid.com.br/api/subscriptions/webhook`
  4. Select events: `BILLING.SUBSCRIPTION.*`, `PAYMENT.SALE.*`, `PAYMENT.CAPTURE.*`
  5. Copy Webhook ID

#### PAYPAL_PLAN_ID_MONTHLY
- **Required**: Yes (for monthly subscriptions)
- **Description**: PayPal Subscription Plan ID for monthly PRO plan
- **How to get**:
  1. Create subscription plan in PayPal Dashboard or via API
  2. Copy Plan ID (starts with `P-`)
- **Note**: Plan must be created before using monthly subscriptions

#### PAYPAL_PLAN_ID_YEARLY
- **Required**: Yes (for yearly subscriptions)
- **Description**: PayPal Subscription Plan ID for yearly PRO plan
- **How to get**: Same as PAYPAL_PLAN_ID_MONTHLY
- **Note**: Plan must be created before using yearly subscriptions

#### PAYPAL_LIFETIME_AMOUNT
- **Required**: No (default: `499.00`)
- **Description**: Price for lifetime subscription in BRL
- **Format**: Decimal number as string (e.g., `499.00`)
- **Note**: Used for one-time lifetime payments (not subscription plans)

#### PAYPAL_PRODUCT_ID
- **Required**: No (optional)
- **Description**: PayPal Product ID for subscription plans
- **How to get**:
  1. Create product in PayPal Dashboard
  2. Copy Product ID (starts with `PROD-`)
- **Note**: Optional, only needed if creating plans via API

### Frontend Build Variables

These variables are baked into the frontend build at build time (not runtime).

#### VITE_API_URL
- **Required**: Yes
- **Example**: `https://api.orachid.com.br`
- **Description**: Backend API URL for frontend requests
- **Note**: Must include protocol (http/https)

#### VITE_GOOGLE_CLIENT_ID
- **Required**: Yes (for Google OAuth)
- **Description**: Google OAuth 2.0 client ID
- **How to get**:
  1. Go to [Google Cloud Console](https://console.cloud.google.com)
  2. Create OAuth 2.0 credentials
  3. Copy Client ID

### AWS S3 Variables (File Upload)

#### AWS_REGION
- **Required**: Yes (for file upload functionality)
- **Example**: `us-east-1`
- **Description**: AWS region where S3 bucket is located
- **Common values**: `us-east-1`, `us-west-2`, `sa-east-1` (São Paulo)

#### AWS_ACCESS_KEY_ID
- **Required**: Yes (for file upload functionality)
- **Description**: AWS IAM user access key ID
- **How to get**:
  1. Go to AWS Console → IAM → Users
  2. Create user with S3 permissions (or use existing)
  3. Create access key in Security Credentials tab
  4. Copy Access Key ID
- **Security**: Keep this secret! Never commit to version control.

#### AWS_SECRET_ACCESS_KEY
- **Required**: Yes (for file upload functionality)
- **Description**: AWS IAM user secret access key
- **How to get**: Same as AWS_ACCESS_KEY_ID, copy Secret Access Key
- **Security**: Keep this secret! Never commit to version control. Only shown once when created.

#### AWS_S3_BUCKET_NAME
- **Required**: Yes (for file upload functionality)
- **Example**: `orachid-despesas`
- **Description**: Name of S3 bucket for storing expense attachments
- **Note**: Bucket must exist and be accessible with provided credentials

#### AWS_CLOUDFRONT_DOMAIN
- **Required**: No (recommended for production)
- **Example**: `d1234567890.cloudfront.net`
- **Description**: CloudFront distribution domain for CDN
- **How to get**:
  1. Create CloudFront distribution pointing to S3 bucket
  2. Copy distribution domain name
- **Note**: If not set, files will be served directly from S3 (slower, no CDN)

### Image Optimization Variables

#### IMAGE_MAX_WIDTH
- **Required**: No (default: `1920`)
- **Description**: Maximum width in pixels for image resizing
- **Note**: Images larger than this will be resized maintaining aspect ratio

#### IMAGE_JPEG_QUALITY
- **Required**: No (default: `85`)
- **Description**: JPEG compression quality (1-100)
- **Note**: Higher values = better quality but larger files

#### IMAGE_PNG_QUALITY
- **Required**: No (default: `80`)
- **Description**: PNG compression quality (1-100)
- **Note**: Higher values = better quality but larger files

#### IMAGE_ENABLE_WEBP
- **Required**: No (default: `true`)
- **Description**: Enable WebP conversion for better compression
- **Values**: `true` or `false`
- **Note**: WebP provides ~30% better compression than JPEG/PNG

## Setting Up Environment Variables

### Local Development

1. Copy template to `.env`:
   ```bash
   cp ENV_TEMPLATE.md .env
   # Or manually create .env file
   ```

2. Fill in values (use development/local values)

3. Never commit `.env` to git

### Production (EC2)

1. Create `.env` file on EC2:
   ```bash
   cd ~/rachid
   nano .env
   ```

2. Fill in production values

3. Ensure file permissions:
   ```bash
   chmod 600 .env
   ```

### GitHub Actions / CI/CD

Set environment variables as GitHub Secrets:
- Go to repository → Settings → Secrets and variables → Actions
- Add each variable as a secret
- Reference in workflow file using `${{ secrets.VARIABLE_NAME }}`

## Security Best Practices

1. **Never commit `.env` files**
   - Add `.env` to `.gitignore`
   - Use `.env.example` or templates

2. **Use strong secrets**
   - Generate random values for JWT_SECRET
   - Use strong database passwords

3. **Limit access**
   - Set proper file permissions: `chmod 600 .env`
   - Don't share secrets via insecure channels

4. **Rotate secrets regularly**
   - Change JWT_SECRET periodically
   - Rotate API keys if compromised

5. **Use different values per environment**
   - Different secrets for dev/staging/production
   - Never use production secrets in development

## Troubleshooting

### Database connection fails

- Check `DB_HOST` is correct (use `postgres` for Docker service name)
- Verify `DB_PASSWORD` is correct
- Check database container is running: `docker-compose ps postgres`

### JWT errors

- Verify `JWT_SECRET` is set
- Ensure `JWT_SECRET` is the same across all backend instances
- Check secret is strong enough (at least 32 characters)

### Email not sending

- Verify `SENDGRID_API_KEY` is correct
- Check `SENDGRID_FROM_EMAIL` is verified in SendGrid
- Check SendGrid API key has "Mail Send" permission

### PayPal/Subscription errors

- Verify `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` are correct
- Check `PAYPAL_MODE` matches your environment (`sandbox` vs `live`)
- Ensure `PAYPAL_PLAN_ID_MONTHLY` and `PAYPAL_PLAN_ID_YEARLY` are valid plan IDs
- Verify `PAYPAL_WEBHOOK_ID` is correct and webhook URL is accessible
- Check PayPal app has required permissions (Subscriptions, Payments)

### Frontend can't connect to API

- Verify `VITE_API_URL` matches your API domain
- Check URL includes protocol (https://)
- Rebuild frontend after changing `VITE_API_URL`

## Example .env Files

### Development

```env
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5437
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=rachid_dev
JWT_SECRET=dev-secret-key-change-in-production
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=your-dev-google-client-id
# SendGrid optional in dev (emails logged to console)
# PayPal - use sandbox credentials for development
PAYPAL_CLIENT_ID=your-sandbox-client-id
PAYPAL_CLIENT_SECRET=your-sandbox-client-secret
PAYPAL_MODE=sandbox
PAYPAL_WEBHOOK_ID=your-sandbox-webhook-id
PAYPAL_PLAN_ID_MONTHLY=your-sandbox-monthly-plan-id
PAYPAL_PLAN_ID_YEARLY=your-sandbox-yearly-plan-id
PAYPAL_LIFETIME_AMOUNT=499.00
```

### Production

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://postgres:strong-password@host.docker.internal:5437/rachid
JWT_SECRET=very-strong-random-secret-key-64-chars-minimum
FRONTEND_URL=https://orachid.com.br
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@orachid.com.br
SENDGRID_FROM_NAME=Rachid
PAYPAL_CLIENT_ID=your-live-paypal-client-id
PAYPAL_CLIENT_SECRET=your-live-paypal-client-secret
PAYPAL_MODE=live
PAYPAL_WEBHOOK_ID=your-live-paypal-webhook-id
PAYPAL_PLAN_ID_MONTHLY=your-live-monthly-plan-id
PAYPAL_PLAN_ID_YEARLY=your-live-yearly-plan-id
PAYPAL_LIFETIME_AMOUNT=499.00
VITE_API_URL=https://api.orachid.com.br
VITE_GOOGLE_CLIENT_ID=your-production-google-client-id
```

