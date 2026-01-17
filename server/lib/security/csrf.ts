import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const CSRF_TOKEN_HEADER = 'x-csrf-token';
const CSRF_COOKIE_NAME = 'csrf-token';
const TOKEN_LENGTH = 32;

export function generateCsrfToken(): string {
  return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
}

export function setCsrfCookie(res: Response, token?: string): string {
  const csrfToken = token || generateCsrfToken();
  
  res.cookie(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
  });
  
  return csrfToken;
}

export function getCsrfTokenFromRequest(req: Request): string | undefined {
  return req.headers[CSRF_TOKEN_HEADER] as string | undefined;
}

export function getCsrfCookieFromRequest(req: Request): string | undefined {
  return req.cookies?.[CSRF_COOKIE_NAME];
}

export function verifyCsrfToken(req: Request): boolean {
  const headerToken = getCsrfTokenFromRequest(req);
  const cookieToken = getCsrfCookieFromRequest(req);
  
  if (!headerToken || !cookieToken) {
    return false;
  }
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(headerToken),
      Buffer.from(cookieToken)
    );
  } catch {
    return false;
  }
}

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  
  if (safeMethods.includes(req.method)) {
    return next();
  }
  
  const authHeader = req.headers['authorization'];
  if (authHeader?.startsWith('Bearer ')) {
    return next();
  }
  
  if (!verifyCsrfToken(req)) {
    console.warn('CSRF validation failed', {
      path: req.path,
      method: req.method,
      ip: req.ip,
      hasHeader: !!getCsrfTokenFromRequest(req),
      hasCookie: !!getCsrfCookieFromRequest(req),
    });
    
    return res.status(403).json({ 
      error: 'CSRF token validation failed',
      code: 'CSRF_VALIDATION_FAILED'
    });
  }
  
  next();
}

export function csrfTokenMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!getCsrfCookieFromRequest(req)) {
    setCsrfCookie(res);
  }
  next();
}
