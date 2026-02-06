import rateLimit from 'express-rate-limit';
import { Request } from 'express';

const isDevelopment = process.env.NODE_ENV === 'development';

/** Skip rate limiting on localhost / development */
function skipOnLocalhost(_req: Request): boolean {
  if (isDevelopment) return true;
  const ip = _req.ip ?? _req.socket?.remoteAddress ?? '';
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
}

/** Skip rate limiting for OPTIONS preflight – CORS handles these before routes, but belt-and-suspenders */
function skipOptions(_req: Request): boolean {
  return _req.method === 'OPTIONS';
}

/**
 * Strict rate limiter for authentication endpoints
 * Prevents brute force attacks
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skip: (req) => skipOnLocalhost(req) || skipOptions(req),
});

/**
 * Moderate rate limiter for mutation endpoints (POST, PUT, DELETE)
 * Prevents database flooding
 */
export const mutationRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per minute
  message: {
    error: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => skipOnLocalhost(req) || skipOptions(req),
});

/**
 * Lenient rate limiter for read endpoints (GET)
 * Allows more requests but still prevents abuse
 */
export const readRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per minute
  message: {
    error: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => skipOnLocalhost(req) || skipOptions(req),
});

/**
 * Strict rate limiter for password reset endpoints
 * Prevents enumeration attacks
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    error: 'Too many password reset attempts, please try again after 1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skip: (req) => skipOnLocalhost(req) || skipOptions(req),
});

/**
 * Rate limiter for webhook endpoints
 * Webhooks should be verified by signature, but still limit to prevent abuse
 */
export const webhookRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // Limit each IP to 50 webhook requests per minute
  message: {
    error: 'Too many webhook requests',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => skipOnLocalhost(req) || skipOptions(req),
});
