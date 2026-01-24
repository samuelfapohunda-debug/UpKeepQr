import { Request, Response, NextFunction } from 'express';
import { verifySession } from '../lib/magicLink.js';
import jwt from 'jsonwebtoken';

export interface SessionAuthRequest extends Request {
  sessionHouseholdId?: string;
  sessionEmail?: string;
  isAdminAccess?: boolean;
  agentId?: string;
  agentEmail?: string;
}

export async function requireSessionAuth(
  req: SessionAuthRequest, 
  res: Response, 
  next: NextFunction
) {
  const sessionToken = req.cookies?.upkeepqr_session;
  
  if (!sessionToken) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const session = await verifySession(sessionToken);
    
    if (!session) {
      res.clearCookie('upkeepqr_session');
      res.clearCookie('upkeepqr_household');
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    
    req.sessionHouseholdId = session.householdId;
    req.sessionEmail = session.email;
    next();
  } catch (error) {
    console.error('Session auth error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

export function validateHouseholdAccess(
  req: SessionAuthRequest,
  res: Response,
  next: NextFunction
) {
  const requestedHouseholdId = req.params.householdId || req.params.id || req.query.household;
  
  if (req.isAdminAccess) {
    next();
    return;
  }
  
  if (!req.sessionHouseholdId) {
    return res.status(401).json({ error: 'Session not authenticated' });
  }
  
  if (requestedHouseholdId && requestedHouseholdId !== req.sessionHouseholdId) {
    console.warn(`🔒 Unauthorized access attempt: session=${req.sessionHouseholdId}, requested=${requestedHouseholdId}`);
    return res.status(403).json({ error: 'Access denied to this household' });
  }
  
  next();
}

export async function requireSessionOrAdminAuth(
  req: SessionAuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  const adminToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  
  if (adminToken) {
    const jwtSecret = process.env.JWT_SECRET;
    const adminEmail = process.env.ADMIN_EMAIL;
    
    if (!jwtSecret) {
      return res.status(500).json({ error: 'JWT_SECRET not configured' });
    }
    
    try {
      const decoded = jwt.verify(adminToken, jwtSecret) as { agentId: string; email: string };
      
      if (adminEmail && decoded.email === adminEmail) {
        req.isAdminAccess = true;
        req.agentId = decoded.agentId;
        req.agentEmail = decoded.email;
        console.log('[Auth] Admin access granted for:', decoded.email);
        next();
        return;
      }
    } catch (error) {
      console.log('[Auth] Admin token invalid, trying session auth');
    }
  }
  
  const sessionToken = req.cookies?.upkeepqr_session;
  
  if (!sessionToken) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const session = await verifySession(sessionToken);
    
    if (!session) {
      res.clearCookie('upkeepqr_session');
      res.clearCookie('upkeepqr_household');
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    
    req.sessionHouseholdId = session.householdId;
    req.sessionEmail = session.email;
    req.isAdminAccess = false;
    next();
  } catch (error) {
    console.error('Session auth error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}
