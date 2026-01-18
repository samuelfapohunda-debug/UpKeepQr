import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { db } from '../../db';
import { adminUsersTable, sessionsTable } from '@shared/schema';
import { eq, and, gt, lt, or, isNull } from 'drizzle-orm';
import { logger } from '../utils/logger';
import { adminLoginLimiter } from '../middleware/adminRateLimit';
import { requireAdmin, AdminAuthRequest } from '../middleware/adminAuth';

const router = Router();

router.post('/login', adminLoginLimiter, async (req, res: Response) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Missing credentials' });
    }
    
    const [admin] = await db
      .select()
      .from(adminUsersTable)
      .where(eq(adminUsersTable.username, username))
      .limit(1);
    
    if (!admin) {
      logger.security('Admin login failed - username not found', { username });
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    if (admin.lockedUntil && new Date(admin.lockedUntil) > new Date()) {
      logger.security('Admin login failed - account locked', { 
        username,
        lockedUntil: admin.lockedUntil 
      });
      
      return res.status(403).json({ 
        error: 'Account temporarily locked',
        message: 'Too many failed attempts. Try again later.'
      });
    }
    
    const valid = await bcrypt.compare(password, admin.passwordHash);
    
    if (!valid) {
      const newAttempts = (admin.failedLoginAttempts || 0) + 1;
      const shouldLock = newAttempts >= 5;
      
      await db
        .update(adminUsersTable)
        .set({
          failedLoginAttempts: newAttempts,
          lastFailedLogin: new Date(),
          lockedUntil: shouldLock ? new Date(Date.now() + 15 * 60 * 1000) : null,
          updatedAt: new Date()
        })
        .where(eq(adminUsersTable.id, admin.id));
      
      logger.security('Admin login failed - invalid password', { 
        username, 
        attempts: newAttempts 
      });
      
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    await db
      .update(adminUsersTable)
      .set({
        failedLoginAttempts: 0,
        lockedUntil: null,
        updatedAt: new Date()
      })
      .where(eq(adminUsersTable.id, admin.id));
    
    const sessionToken = nanoid(64);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    await db.insert(sessionsTable).values({
      token: sessionToken,
      email: admin.email || username,
      householdId: null,
      role: 'admin',
      expiresAt,
      createdAt: new Date()
    });
    
    res.cookie('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
      path: '/'
    });
    
    logger.info('Admin login successful', { username });
    
    res.json({ 
      success: true,
      role: 'admin',
      redirectTo: '/admin/dashboard',
      expiresAt: expiresAt.toISOString()
    });
    
  } catch (error) {
    logger.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/session/verify', async (req, res: Response) => {
  try {
    const sessionToken = req.cookies?.['session_token'];
    
    if (!sessionToken) {
      return res.json({ authenticated: false });
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
      return res.json({ authenticated: false });
    }
    
    res.json({
      authenticated: true,
      role: session.role || 'customer',
      householdId: session.householdId || null,
      email: session.email,
      sessionId: session.id,
      expiresAt: session.expiresAt.toISOString()
    });
  } catch (error) {
    logger.error('Session verify error:', error);
    res.status(500).json({ error: 'Failed to verify session' });
  }
});

router.post('/session/refresh', async (req, res: Response) => {
  try {
    const sessionToken = req.cookies?.['session_token'];
    
    if (!sessionToken) {
      return res.status(401).json({ error: 'No session' });
    }
    
    const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    const [updated] = await db
      .update(sessionsTable)
      .set({
        expiresAt: newExpiresAt,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(sessionsTable.token, sessionToken),
          gt(sessionsTable.expiresAt, new Date())
        )
      )
      .returning();
    
    if (!updated) {
      return res.status(401).json({ error: 'Session expired' });
    }
    
    logger.info('Session refreshed', { sessionId: updated.id.substring(0, 8) + '...' });
    
    res.json({
      success: true,
      expiresAt: newExpiresAt.toISOString()
    });
    
  } catch (error) {
    logger.error('Session refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh session' });
  }
});

router.post('/logout', async (req, res: Response) => {
  try {
    const sessionToken = req.cookies?.['session_token'];
    
    if (sessionToken) {
      const [session] = await db
        .select({ role: sessionsTable.role })
        .from(sessionsTable)
        .where(eq(sessionsTable.token, sessionToken))
        .limit(1);
      
      const role = session?.role || 'customer';
      
      await db
        .delete(sessionsTable)
        .where(eq(sessionsTable.token, sessionToken));
      
      res.clearCookie('session_token', { path: '/' });
      
      const redirectTo = role === 'admin' ? '/admin/login' : '/';
      
      logger.info('User logged out', { role });
      
      res.json({ 
        success: true,
        redirectTo,
        clearCache: true
      });
    } else {
      res.json({ success: true, redirectTo: '/', clearCache: true });
    }
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

router.get('/me', requireAdmin, async (req: AdminAuthRequest, res: Response) => {
  res.json({
    authenticated: true,
    role: 'admin',
    email: req.adminSession?.email,
    expiresAt: req.adminSession?.expiresAt
  });
});

export default router;
