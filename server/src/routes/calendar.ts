import { Router, Request, Response } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { db } from '../../db';
import { 
  calendarConnectionsTable, 
  calendarSyncEventsTable,
  householdsTable,
  toggleCalendarSyncSchema,
  disconnectCalendarSchema,
} from '../../../shared/schema';
import { eq, count } from 'drizzle-orm';
import {
  generateAuthUrl,
  exchangeCodeForTokens,
  getUserCalendarInfo,
  storeCalendarConnection,
  syncMaintenanceTasksToCalendar,
  deleteAllCalendarEvents,
  revokeCalendarAccess,
} from '../../lib/calendarSync';
import {
  generateHmacState,
  verifyHmacState,
  generateNonce,
} from '../../lib/encryption';

const router = Router();

const oauthRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many OAuth requests, please try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

const syncRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        return decoded.householdId || req.ip || 'unknown';
      } catch {
        return req.ip || 'unknown';
      }
    }
    return req.ip || 'unknown';
  },
  message: { error: 'Too many sync requests, please try again in 1 hour' },
});

async function extractHouseholdId(req: Request): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    if (decoded.householdId) {
      return decoded.householdId;
    }
  } catch {
  }
  
  const [household] = await db.select({ id: householdsTable.id })
    .from(householdsTable)
    .where(eq(householdsTable.magnetToken, token))
    .limit(1);
  
  return household?.id || null;
}

async function requireAuth(req: Request, res: Response, next: Function) {
  const householdId = await extractHouseholdId(req);
  if (!householdId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  (req as any).householdId = householdId;
  next();
}

router.post('/google/auth-url', oauthRateLimiter, requireAuth, async (req: Request, res: Response) => {
  try {
    const householdId = (req as any).householdId;
    
    const state = generateHmacState({
      householdId,
      timestamp: Date.now(),
      nonce: generateNonce(),
    });
    
    const authUrl = generateAuthUrl(state);
    
    res.json({ authUrl });
  } catch (error: any) {
    console.error('[Calendar] Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate authorization URL' });
  }
});

router.get('/google/callback', oauthRateLimiter, async (req: Request, res: Response) => {
  try {
    const { code, state, error } = req.query;
    
    const frontendUrl = process.env.FRONTEND_URL || 'https://upkeepqr.com';
    const errorRedirect = `${frontendUrl}/dashboard/settings?calendar_error=`;
    const successRedirect = `${frontendUrl}/dashboard/settings?calendar_connected=true`;
    
    if (error) {
      console.error('[Calendar] OAuth error:', error);
      return res.redirect(`${errorRedirect}${encodeURIComponent(String(error))}`);
    }
    
    if (!code || !state) {
      return res.redirect(`${errorRedirect}missing_parameters`);
    }
    
    const stateVerification = verifyHmacState(String(state));
    if (!stateVerification.valid || !stateVerification.payload) {
      console.error('[Calendar] Invalid state:', stateVerification.error);
      return res.redirect(`${errorRedirect}invalid_state`);
    }
    
    const { householdId } = stateVerification.payload;
    
    const [household] = await db.select()
      .from(householdsTable)
      .where(eq(householdsTable.id, householdId))
      .limit(1);
    
    if (!household) {
      return res.redirect(`${errorRedirect}household_not_found`);
    }
    
    const tokens = await exchangeCodeForTokens(String(code));
    
    const calendarInfo = await getUserCalendarInfo(tokens.accessToken);
    
    const connectionId = await storeCalendarConnection({
      householdId,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiry: tokens.expiryDate,
      calendarId: calendarInfo.calendarId,
      calendarName: calendarInfo.calendarName,
      timezone: calendarInfo.timezone,
    });
    
    await db.update(householdsTable)
      .set({
        calendarSyncPreference: 'enabled',
        updatedAt: new Date(),
      })
      .where(eq(householdsTable.id, householdId));
    
    console.log(`[Calendar] Connected calendar for household ${householdId}`);
    
    try {
      await syncMaintenanceTasksToCalendar(householdId, connectionId);
    } catch (syncError) {
      console.error('[Calendar] Initial sync failed (non-blocking):', syncError);
    }
    
    res.redirect(successRedirect);
  } catch (error: any) {
    console.error('[Calendar] Callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'https://upkeepqr.com';
    res.redirect(`${frontendUrl}/dashboard/settings?calendar_error=connection_failed`);
  }
});

router.get('/connection/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const householdId = (req as any).householdId;
    
    const [connection] = await db.select()
      .from(calendarConnectionsTable)
      .where(eq(calendarConnectionsTable.householdId, householdId))
      .limit(1);
    
    if (!connection) {
      return res.json({
        connected: false,
        syncEnabled: false,
      });
    }
    
    const [eventCount] = await db.select({ count: count() })
      .from(calendarSyncEventsTable)
      .where(eq(calendarSyncEventsTable.connectionId, connection.id));
    
    res.json({
      connected: true,
      provider: connection.provider,
      calendarName: connection.calendarName,
      calendarTimezone: connection.calendarTimezone,
      syncEnabled: connection.syncEnabled,
      lastSync: connection.lastSync?.toISOString() || null,
      lastSyncStatus: connection.lastSyncStatus,
      totalEventsSynced: eventCount?.count || 0,
    });
  } catch (error: any) {
    console.error('[Calendar] Error fetching status:', error);
    res.status(500).json({ error: 'Failed to fetch calendar status' });
  }
});

router.post('/sync', syncRateLimiter, requireAuth, async (req: Request, res: Response) => {
  try {
    const householdId = (req as any).householdId;
    
    const [connection] = await db.select()
      .from(calendarConnectionsTable)
      .where(eq(calendarConnectionsTable.householdId, householdId))
      .limit(1);
    
    if (!connection) {
      return res.status(400).json({ error: 'No calendar connected' });
    }
    
    if (!connection.syncEnabled) {
      return res.status(400).json({ error: 'Calendar sync is disabled' });
    }
    
    const result = await syncMaintenanceTasksToCalendar(householdId, connection.id);
    
    res.json({
      ...result,
      syncTimestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Calendar] Sync error:', error);
    res.status(500).json({ error: 'Sync failed' });
  }
});

router.patch('/toggle-sync', requireAuth, async (req: Request, res: Response) => {
  try {
    const householdId = (req as any).householdId;
    const body = toggleCalendarSyncSchema.parse(req.body);
    
    const [connection] = await db.select()
      .from(calendarConnectionsTable)
      .where(eq(calendarConnectionsTable.householdId, householdId))
      .limit(1);
    
    if (!connection) {
      return res.status(400).json({ error: 'No calendar connected' });
    }
    
    await db.update(calendarConnectionsTable)
      .set({
        syncEnabled: body.syncEnabled,
        updatedAt: new Date(),
      })
      .where(eq(calendarConnectionsTable.id, connection.id));
    
    await db.update(householdsTable)
      .set({
        calendarSyncPreference: body.syncEnabled ? 'enabled' : 'disabled',
        updatedAt: new Date(),
      })
      .where(eq(householdsTable.id, householdId));
    
    res.json({ success: true, syncEnabled: body.syncEnabled });
  } catch (error: any) {
    console.error('[Calendar] Toggle sync error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update sync setting' });
  }
});

router.delete('/disconnect', requireAuth, async (req: Request, res: Response) => {
  try {
    const householdId = (req as any).householdId;
    const body = disconnectCalendarSchema.parse(req.body);
    
    const [connection] = await db.select()
      .from(calendarConnectionsTable)
      .where(eq(calendarConnectionsTable.householdId, householdId))
      .limit(1);
    
    if (!connection) {
      return res.status(400).json({ error: 'No calendar connected' });
    }
    
    if (body.deleteEvents) {
      await deleteAllCalendarEvents(connection.id);
    }
    
    await revokeCalendarAccess(connection.id);
    
    await db.update(householdsTable)
      .set({
        calendarSyncPreference: 'not_configured',
        updatedAt: new Date(),
      })
      .where(eq(householdsTable.id, householdId));
    
    console.log(`[Calendar] Disconnected calendar for household ${householdId}`);
    
    res.json({ success: true, eventsDeleted: body.deleteEvents });
  } catch (error: any) {
    console.error('[Calendar] Disconnect error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to disconnect calendar' });
  }
});

export default router;
