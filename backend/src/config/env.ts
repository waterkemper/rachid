import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Environment variable validation schema
 * Validates all required and optional environment variables at startup
 */
const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().regex(/^\d+$/).transform(Number).default('3001'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),

  // Database Configuration
  DATABASE_URL: z.string().url().optional(),
  DB_HOST: z.string().optional(),
  DB_PORT: z.string().regex(/^\d+$/).transform(Number).optional(),
  DB_USERNAME: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
  DB_DATABASE: z.string().optional(),

  // JWT Configuration
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // SendGrid Email Configuration
  SENDGRID_API_KEY: z.string().min(1, 'SENDGRID_API_KEY is required').optional(),
  SENDGRID_FROM_EMAIL: z.string().email().optional(),
  SENDGRID_FROM_NAME: z.string().optional(),

  // AWS S3 Configuration
  AWS_REGION: z.string().default('sa-east-1'),
  AWS_S3_BUCKET_NAME: z.string().optional(),
  AWS_CLOUDFRONT_DOMAIN: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),

  // PayPal Configuration
  PAYPAL_MODE: z.enum(['sandbox', 'production']).default('sandbox'),
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),
  PAYPAL_PRODUCT_ID: z.string().optional(),
  PAYPAL_PLAN_ID_MONTHLY: z.string().optional(),
  PAYPAL_PLAN_ID_YEARLY: z.string().optional(),
  PAYPAL_WEBHOOK_ID: z.string().optional(),

  // Google OAuth Configuration
  GOOGLE_CLIENT_ID: z.string().optional(),

  // Asaas Configuration
  ASAAS_API_KEY: z.string().optional(),
  ASAAS_ENVIRONMENT: z.enum(['sandbox', 'production']).default('sandbox'),
  ASAAS_WEBHOOK_TOKEN: z.string().optional(),

  // Webhook Security
  WEBHOOK_SECRET_PATH: z.string().min(10, 'WEBHOOK_SECRET_PATH should be at least 10 characters for security').optional(),

  // Optional Configuration
  MIN_INSTALLMENT_VALUE: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).default('30'),
  IMAGE_MAX_WIDTH: z.string().regex(/^\d+$/).transform(Number).default('1920'),
  IMAGE_JPEG_QUALITY: z.string().regex(/^\d+$/).transform(Number).default('85'),
  IMAGE_PNG_QUALITY: z.string().regex(/^\d+$/).transform(Number).default('80'),
  IMAGE_ENABLE_WEBP: z.string().transform((val) => val === 'true').default('true'),
});

/**
 * Validated environment variables
 * Throws error at startup if validation fails
 */
export const env = (() => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment variable validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      console.error('\nPlease check your .env file and ensure all required variables are set.');
      process.exit(1);
    }
    throw error;
  }
})();

/**
 * Validate database configuration
 * Either DATABASE_URL or all DB_* variables must be set
 */
export function validateDatabaseConfig() {
  if (env.DATABASE_URL) {
    return; // DATABASE_URL is set, no need for individual variables
  }

  const required = ['DB_HOST', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Database configuration incomplete:');
    console.error(`  Missing: ${missing.join(', ')}`);
    console.error('  Either set DATABASE_URL or all DB_* variables');
    process.exit(1);
  }
}

/**
 * Validate AWS S3 configuration (if file uploads are used)
 */
export function validateS3Config() {
  const required = ['AWS_S3_BUCKET_NAME', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.warn('⚠️  AWS S3 configuration incomplete (file uploads may not work):');
    console.warn(`  Missing: ${missing.join(', ')}`);
    console.warn('  File upload features will be disabled');
  }
}

// Run validations at module load
validateDatabaseConfig();
validateS3Config();
