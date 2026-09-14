import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for authentication endpoints:
 * Allows 20 requests per 15-minute window per IP to mitigate brute-force attempts.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 requests per IP per window
  standardHeaders: true, // Return standard RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

/**
 * Rate limiter for AI suggestion endpoints:
 * Allows 30 requests per 15-minute window per IP to prevent external API abuse.
 */
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // max 30 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many AI categorization requests. Please try again later or select a category manually.',
  },
});
