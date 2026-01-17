import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export interface LogContext {
  requestId?: string;
  userId?: string;
  email?: string;
  role?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  ip?: string;
  userAgent?: string;
  [key: string]: unknown;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'security';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  security: 4,
};

const currentLogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[currentLogLevel];
}

function formatLogEntry(entry: LogEntry): string {
  return JSON.stringify(entry);
}

export const logger = {
  debug(message: string, context: LogContext = {}) {
    if (!shouldLog('debug')) return;
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'debug',
      message,
      context,
    };
    console.log(formatLogEntry(entry));
  },

  info(message: string, context: LogContext = {}) {
    if (!shouldLog('info')) return;
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      context,
    };
    console.log(formatLogEntry(entry));
  },

  warn(message: string, context: LogContext = {}) {
    if (!shouldLog('warn')) return;
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      context,
    };
    console.warn(formatLogEntry(entry));
  },

  error(message: string, context: LogContext = {}) {
    if (!shouldLog('error')) return;
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      context,
    };
    console.error(formatLogEntry(entry));
  },

  security(message: string, context: LogContext = {}) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'security',
      message,
      context,
    };
    console.warn('[SECURITY]', formatLogEntry(entry));
  },
};

export function generateRequestId(): string {
  return crypto.randomUUID();
}

export interface RequestWithId extends Request {
  requestId?: string;
  startTime?: number;
}

export function requestIdMiddleware(req: RequestWithId, res: Response, next: NextFunction) {
  req.requestId = req.headers['x-request-id'] as string || generateRequestId();
  req.startTime = Date.now();
  
  res.setHeader('x-request-id', req.requestId);
  
  next();
}

export function requestLoggerMiddleware(req: RequestWithId, res: Response, next: NextFunction) {
  const startTime = req.startTime || Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const context: LogContext = {
      requestId: req.requestId,
      path: req.path,
      method: req.method,
      statusCode: res.statusCode,
      duration,
      ip: req.ip || req.headers['x-forwarded-for'] as string,
      userAgent: req.headers['user-agent'],
    };
    
    if (res.statusCode >= 500) {
      logger.error('Request failed', context);
    } else if (res.statusCode >= 400) {
      logger.warn('Request error', context);
    } else {
      logger.info('Request completed', context);
    }
  });
  
  next();
}

export function auditLog(action: string, context: LogContext = {}) {
  logger.info(`AUDIT: ${action}`, {
    ...context,
    auditAction: action,
    auditTimestamp: new Date().toISOString(),
  });
}

export function securityEvent(event: string, context: LogContext = {}) {
  logger.security(event, {
    ...context,
    securityEvent: event,
    securityTimestamp: new Date().toISOString(),
  });
}
