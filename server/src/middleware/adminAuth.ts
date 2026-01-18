import { Request, Response, NextFunction } from 'express';
import { db } from '../../db';
import { sessionsTable } from '@shared/schema';
import { eq, and, gt } from 'drizzle-orm';
import { logger } from '../utils/logger';

export interface AdminAuthRequest extends Request {
  adminSession?: {
    id: string;
    email: string;
    role: string;
    expiresAt: Date;
  };
}

export async function requireAdmin(req: AdminAuthRequest, res: Response, next: NextFunction) {
  try {
    const sessionToken = req.cookies?.['session_token'];
    
    if (!sessionToken) {
      logger.security('Unauthorized admin access attempt - No session', {
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const [session] = await db
      .select()
      .from(sessionsTable)
      .where(
        and(
          eq(sessionsTable.token, sessionToken),
          gt(sessionsTable.expiresAt, new Date())
        )
      )
      .limit(1);
    
    if (!session) {
      logger.security('Unauthorized admin access attempt - Invalid/expired session', {
        path: req.path,
        sessionToken: sessionToken.substring(0, 8) + '...',
        ip: req.ip
      });
      
      return res.status(401).json({ error: 'Session expired' });
    }
    
    if (session.role !== 'admin') {
      logger.security('Unauthorized admin access attempt - Wrong role', {
        path: req.path,
        actualRole: session.role,
        sessionToken: sessionToken.substring(0, 8) + '...',
        ip: req.ip
      });
      
      return res.status(403).json({ 
        error: 'Forbidden - Admin access required' 
      });
    }
    
    req.adminSession = {
      id: session.id,
      email: session.email,
      role: session.role,
      expiresAt: session.expiresAt
    };
    
    next();
  } catch (error) {
    logger.error('Admin auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

export function optionalAdmin(req: AdminAuthRequest, res: Response, next: NextFunction) {
  const sessionToken = req.cookies?.['session_token'];
  
  if (!sessionToken) {
    return next();
  }
  
  db.select()
    .from(sessionsTable)
    .where(
      and(
        eq(sessionsTable.token, sessionToken),
        gt(sessionsTable.expiresAt, new Date()),
        eq(sessionsTable.role, 'admin')
      )
    )
    .limit(1)
    .then(([session]) => {
      if (session) {
        req.adminSession = {
          id: session.id,
          email: session.email,
          role: session.role,
          expiresAt: session.expiresAt
        };
      }
      next();
    })
    .catch(() => next());
}
