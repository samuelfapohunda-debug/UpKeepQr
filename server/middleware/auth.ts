import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  user?: { id: string };
  agentId?: string;
  agentEmail?: string;
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