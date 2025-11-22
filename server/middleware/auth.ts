import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  user?: { id: string };
  agentId?: string;
  agentEmail?: string;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'agent' | 'customer';
}

/**
 * Extract authenticated user from request
 * Returns null if not authenticated or token invalid
 * Used for authorization checks in route handlers
 */
export async function getUserFromAuth(req: Request): Promise<User | null> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return null;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET not configured');
      return null;
    }

    const decoded = jwt.verify(token, jwtSecret) as { agentId: string; email: string };
    
    // Check if user is system admin
    const adminEmail = process.env.ADMIN_EMAIL;
    const isAdmin = adminEmail && decoded.email === adminEmail;

    return {
      id: decoded.agentId,
      email: decoded.email,
      role: isAdmin ? 'admin' : 'agent'
    };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

export function authenticateAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return res.status(500).json({ error: 'JWT_SECRET not configured' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as { id: string };
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export function authenticateAgent(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Agent access token required' });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return res.status(500).json({ error: 'JWT_SECRET not configured' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as { agentId: string; email: string };
    req.agentId = decoded.agentId;
    req.agentEmail = decoded.email;
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid or expired agent token' });
  }
}

export function requireSystemAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }

  const jwtSecret = process.env.JWT_SECRET;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!jwtSecret) {
    return res.status(500).json({ error: 'JWT_SECRET not configured' });
  }

  if (!adminEmail) {
    return res.status(500).json({ error: 'ADMIN_EMAIL not configured' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as { agentId: string; email: string };
    
    if (decoded.email !== adminEmail) {
      return res.status(403).json({ error: 'System admin access required' });
    }

    req.agentId = decoded.agentId;
    req.agentEmail = decoded.email;
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}