import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

/**
 * Standard API rate limiter: Prevents scraping and aggressive polling.
 * Allows 120 requests per minute per IP.
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: 'Too many requests. Rate limit exceeded, please retry in 1 minute.',
  },
});

/**
 * Strict rate limiter for media ingestion to prevent storage quota exhaustion in Free Tier.
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: 'Upload rate limit exceeded. You can upload up to 20 media items per minute.',
  },
});

/**
 * Helmet Security Middleware configured for API JSON responses and Cloud CDN compatibility.
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: false, // APIs return JSON, static assets served from CDN
  crossOriginEmbedderPolicy: false,
});
