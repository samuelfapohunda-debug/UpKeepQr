import { Router } from 'express';
import { google } from 'googleapis';
import { db } from '../../db.js';
import { calendarConnectionsTable } from '../../../shared/schema.js';
import { encryptToken } from '../../lib/encryption.js';
import { randomUUID } from 'crypto';

const router = Router();

// POST /api/calendar/google/auth-url
router.post('/google/auth-url', async (req, res) => {
  try {
    const redirectUri = `${process.env.BACKEND_URL || 'https://upkeepqr-backend.onrender.com'}/api/calendar/google/callback`;
    console.log('OAuth redirect_uri:', redirectUri);
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      response_type: 'code',
      scope: [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.readonly',
      ],
      prompt: 'consent',
    });

    res.json({ authUrl });
  } catch (error: any) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate authorization URL' });
  }
});

// GET /api/calendar/google/callback
router.get('/google/callback', async (req, res) => {
  try {
    const { code, error } = req.query;

    // Handle OAuth errors
    if (error) {
      console.error('Google OAuth error:', error);
      return res.redirect(`${process.env.FRONTEND_URL || 'https://upkeepqr.com'}/admin?calendar_sync=error&message=${error}`);
    }

    if (!code || typeof code !== 'string') {
      return res.redirect(`${process.env.FRONTEND_URL || 'https://upkeepqr.com'}/admin?calendar_sync=error&message=no_code`);
    }

    // Exchange code for tokens
    const redirectUri = `${process.env.BACKEND_URL || 'https://upkeepqr-backend.onrender.com'}/api/calendar/google/callback`;
    console.log('Callback OAuth redirect_uri:', redirectUri);
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Missing tokens from Google');
    }

    console.log('Tokens received:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiryDate: tokens.expiry_date
    });

    // Get calendar info
    oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const calendarList = await calendar.calendarList.list();
    const primaryCalendar = calendarList.data.items?.find(cal => cal.primary);

    if (!primaryCalendar) {
      throw new Error('No primary calendar found');
    }

    // Encrypt tokens
    const encryptedAccessToken = encryptToken(tokens.access_token);
    const encryptedRefreshToken = encryptToken(tokens.refresh_token);

    // TODO: Get real household_id from authenticated user session
    // For now, using the test household
    const testHouseholdId = 'test-household-calendar';

    // Save to database
    await db.insert(calendarConnectionsTable).values({
      id: randomUUID(),
      household_id: testHouseholdId,
      provider: 'google',
      access_token: encryptedAccessToken,
      refresh_token: encryptedRefreshToken,
      token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      calendar_id: primaryCalendar.id || 'primary',
      calendar_name: primaryCalendar.summary || 'Primary Calendar',
      calendar_timezone: primaryCalendar.timeZone || 'America/New_York',
      sync_enabled: true,
    });

    console.log('✅ Calendar connection saved to database');

    res.redirect(`${process.env.FRONTEND_URL || 'https://upkeepqr.com'}/admin?calendar_sync=success&connection_saved=true`);
    
  } catch (error: any) {
    console.error('Callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'https://upkeepqr.com'}/admin?calendar_sync=error&message=server_error`);
  }
});

// POST /api/calendar/sync
router.post('/sync', async (req, res) => {
  try {
    // TODO: Get household_id from authenticated user
    // For now, using test household
    const householdId = req.body.householdId || 'test-household-calendar';
    console.log('Starting calendar sync for household:', householdId);

    const { syncTasksToCalendar } = await import('../../lib/calendarSync.js');
    const result = await syncTasksToCalendar(householdId);

    if (!result.success) {
      return res.status(404).json({ error: result.message });
    }

    res.json({
      success: true,
      created: result.created,
      skipped: result.skipped,
      message: `Synced ${result.created} tasks to calendar`,
    });
  } catch (error: any) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Failed to sync calendar', details: error.message });
  }
});

// GET /api/calendar/sync-test - Temporary browser testing endpoint
router.get('/sync-test', async (req, res) => {
  try {
    const householdId = (req.query.householdId as string) || 'test-household-calendar';
    console.log('Browser test: Starting calendar sync for household:', householdId);
    
    const { syncTasksToCalendar } = await import('../../lib/calendarSync.js');
    const result = await syncTasksToCalendar(householdId);

    if (!result.success) {
      return res.send(`Calendar sync failed: ${result.message}`);
    }

    res.send(`Calendar sync triggered for household: ${householdId} - Created: ${result.created}, Skipped: ${result.skipped}`);
  } catch (error: any) {
    console.error('Sync test error:', error);
    res.status(500).send(`Sync test failed: ${error.message}`);
  }
});

export default router;
