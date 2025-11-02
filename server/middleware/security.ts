import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { storage } from '../storage';

/**
 * Rate limiting configurations for different endpoint types
 */
export const publicApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later."
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

export const authApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    error: "Too many login attempts, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const smsApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // Limit SMS requests to 3 per minute per IP
  message: {
    error: "Too many SMS requests, please try again in a minute."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Custom morgan format for detailed logging
 */
export const loggerFormat = morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms', {
  stream: {
    write: (message: string) => {
      // Log to console and audit trail
      console.log(message.trim());
    }
  }
});

/**
 * Audit logging middleware
 */
export function createAuditLogger(action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actor = req.ip || 'unknown';
      const meta = {
        method: req.method,
        url: req.url,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString()
      };

      // Log to audit table
      await storage.createAuditLog({
        actor,
        action: `${req.method} ${action}`,
        meta
      });
    } catch (error) {
      console.error('Audit logging error:', error);
      // Don't fail the request if audit logging fails
    }
    next();
  };
}

/**
 * Generic error handler that logs details but returns sanitized errors
 */
export function handleError(error: unknown, action: string, res: Response) {
  // Log full error details server-side
  console.error(`Error in ${action}:`, {
    message: error.message,
    stack: error.stack,
    name: error.name,
    timestamp: new Date().toISOString()
  });

  // Return generic error to client
  if (error?.name === 'ZodError') {
    return res.status(400).json({ 
      error: "Invalid input data",
      // Only include field names, not values, for security
      fields: error.errors?.map((e: { path: string[] }) => e.path[0]).filter(Boolean) || []
    });
  }

  // Generic server error
  return res.status(500).json({ 
    error: "An error occurred processing your request" 
  });
}