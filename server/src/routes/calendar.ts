import { Router } from 'express';
import { google } from 'googleapis';

const router = Router();

// POST /api/calendar/google/auth-url
router.post('/google/auth-url', async (req, res) => {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.BACKEND_URL || 'https://upkeepqr-backend.onrender.com'}/api/calendar/google/callback`
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
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
      return res.redirect(`${process.env.FRONTEND_URL || 'https://upkeepqr.com'}/dashboard?calendar_sync=error&message=${error}`);
    }

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL || 'https://upkeepqr.com'}/dashboard?calendar_sync=error&message=no_code`);
    }

    // For now, just redirect to success
    // We'll add token storage in the next step
    console.log('OAuth callback received with code:', code);
    res.redirect(`${process.env.FRONTEND_URL || 'https://upkeepqr.com'}/dashboard?calendar_sync=success`);
    
  } catch (error: any) {
    console.error('Callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'https://upkeepqr.com'}/dashboard?calendar_sync=error&message=server_error`);
  }
});

export default router;
