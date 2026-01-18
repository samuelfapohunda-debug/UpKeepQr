import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';

export const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  
  handler: (req, res) => {
    logger.security('Admin login rate limit exceeded', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      username: req.body?.username
    });
    
    res.status(429).json({
      error: 'Too many login attempts',
      message: 'Please try again in 15 minutes'
    });
  },
  
  keyGenerator: (req) => req.ip || 'unknown'
});
