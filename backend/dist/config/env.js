"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
exports.validateDatabaseConfig = validateDatabaseConfig;
exports.validateS3Config = validateS3Config;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
/**
 * Environment variable validation schema
 * Validates all required and optional environment variables at startup
 */
const envSchema = zod_1.z.object({
    // Server Configuration
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().regex(/^\d+$/).transform(Number).default('3001'),
    FRONTEND_URL: zod_1.z.string().url().default('http://localhost:5173'),
    // Database Configuration
    DATABASE_URL: zod_1.z.string().url().optional(),
    DB_HOST: zod_1.z.string().optional(),
    DB_PORT: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
    DB_USERNAME: zod_1.z.string().optional(),
    DB_PASSWORD: zod_1.z.string().optional(),
    DB_DATABASE: zod_1.z.string().optional(),
    // JWT Configuration
    JWT_SECRET: zod_1.z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_EXPIRES_IN: zod_1.z.string().default('7d'),
    // SendGrid Email Configuration
    SENDGRID_API_KEY: zod_1.z.string().min(1, 'SENDGRID_API_KEY is required').optional(),
    SENDGRID_FROM_EMAIL: zod_1.z.string().email().optional(),
    SENDGRID_FROM_NAME: zod_1.z.string().optional(),
    // AWS S3 Configuration
    AWS_REGION: zod_1.z.string().default('sa-east-1'),
    AWS_S3_BUCKET_NAME: zod_1.z.string().optional(),
    AWS_CLOUDFRONT_DOMAIN: zod_1.z.string().optional(),
    AWS_ACCESS_KEY_ID: zod_1.z.string().optional(),
    AWS_SECRET_ACCESS_KEY: zod_1.z.string().optional(),
    // PayPal Configuration
    PAYPAL_MODE: zod_1.z.enum(['sandbox', 'production']).default('sandbox'),
    PAYPAL_CLIENT_ID: zod_1.z.string().optional(),
    PAYPAL_CLIENT_SECRET: zod_1.z.string().optional(),
    PAYPAL_PRODUCT_ID: zod_1.z.string().optional(),
    PAYPAL_PLAN_ID_MONTHLY: zod_1.z.string().optional(),
    PAYPAL_PLAN_ID_YEARLY: zod_1.z.string().optional(),
    PAYPAL_WEBHOOK_ID: zod_1.z.string().optional(),
    // Google OAuth Configuration
    GOOGLE_CLIENT_ID: zod_1.z.string().optional(),
    // Asaas Configuration
    ASAAS_API_KEY: zod_1.z.string().optional(),
    ASAAS_ENVIRONMENT: zod_1.z.enum(['sandbox', 'production']).default('sandbox'),
    ASAAS_WEBHOOK_TOKEN: zod_1.z.string().optional(),
    // Webhook Security
    WEBHOOK_SECRET_PATH: zod_1.z.string().min(10, 'WEBHOOK_SECRET_PATH should be at least 10 characters for security').optional(),
    // Optional Configuration
    MIN_INSTALLMENT_VALUE: zod_1.z.string().regex(/^\d+(\.\d+)?$/).transform(Number).default('30'),
    IMAGE_MAX_WIDTH: zod_1.z.string().regex(/^\d+$/).transform(Number).default('1920'),
    IMAGE_JPEG_QUALITY: zod_1.z.string().regex(/^\d+$/).transform(Number).default('85'),
    IMAGE_PNG_QUALITY: zod_1.z.string().regex(/^\d+$/).transform(Number).default('80'),
    IMAGE_ENABLE_WEBP: zod_1.z.string().transform((val) => val === 'true').default('true'),
});
/**
 * Validated environment variables
 * Throws error at startup if validation fails
 */
exports.env = (() => {
    try {
        return envSchema.parse(process.env);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
function validateDatabaseConfig() {
    if (exports.env.DATABASE_URL) {
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
function validateS3Config() {
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
