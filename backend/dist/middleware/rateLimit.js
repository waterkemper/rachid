"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookRateLimiter = exports.passwordResetRateLimiter = exports.readRateLimiter = exports.mutationRateLimiter = exports.authRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const isDevelopment = process.env.NODE_ENV === 'development';
/** Skip rate limiting on localhost / development */
function skipOnLocalhost(_req) {
    if (isDevelopment)
        return true;
    const ip = _req.ip ?? _req.socket?.remoteAddress ?? '';
    return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
}
/**
 * Strict rate limiter for authentication endpoints
 * Prevents brute force attacks
 */
exports.authRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: {
        error: 'Too many authentication attempts, please try again after 15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skip: skipOnLocalhost,
});
/**
 * Moderate rate limiter for mutation endpoints (POST, PUT, DELETE)
 * Prevents database flooding
 */
exports.mutationRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // Limit each IP to 30 requests per minute
    message: {
        error: 'Too many requests, please try again later',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipOnLocalhost,
});
/**
 * Lenient rate limiter for read endpoints (GET)
 * Allows more requests but still prevents abuse
 */
exports.readRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // Limit each IP to 100 requests per minute
    message: {
        error: 'Too many requests, please try again later',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipOnLocalhost,
});
/**
 * Strict rate limiter for password reset endpoints
 * Prevents enumeration attacks
 */
exports.passwordResetRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 password reset requests per hour
    message: {
        error: 'Too many password reset attempts, please try again after 1 hour',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skip: skipOnLocalhost,
});
/**
 * Rate limiter for webhook endpoints
 * Webhooks should be verified by signature, but still limit to prevent abuse
 */
exports.webhookRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 50, // Limit each IP to 50 webhook requests per minute
    message: {
        error: 'Too many webhook requests',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipOnLocalhost,
});
