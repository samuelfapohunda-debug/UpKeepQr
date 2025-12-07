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

export default router;
