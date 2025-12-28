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
VITE_API_URL=https://api.orachid.com.br
VITE_GOOGLE_CLIENT_ID=your-production-google-client-id
```

