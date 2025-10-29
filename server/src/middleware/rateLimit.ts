import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for home profile extra data endpoints
 * Limits: 20 requests per 10 minutes per IP/user
 */
export const homeExtraLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // 20 requests per window
  message: {
    error: "Too many requests. Please try again in a few minutes.",
    retryAfter: "10 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use IP + user session for rate limiting
  keyGenerator: (req) => {
    return req.ip + (req.session?.userId || "");
  },
});
