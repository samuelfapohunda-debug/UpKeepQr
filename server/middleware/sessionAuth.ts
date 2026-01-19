import { Request, Response, NextFunction } from 'express';
import { verifySession } from '../lib/magicLink.js';

export interface SessionAuthRequest extends Request {
  sessionHouseholdId?: string;
  sessionEmail?: string;
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
  
  if (!req.sessionHouseholdId) {
    return res.status(401).json({ error: 'Session not authenticated' });
  }
  
  if (requestedHouseholdId && requestedHouseholdId !== req.sessionHouseholdId) {
    console.warn(`🔒 Unauthorized access attempt: session=${req.sessionHouseholdId}, requested=${requestedHouseholdId}`);
    return res.status(403).json({ error: 'Access denied to this household' });
  }
  
  next();
}
