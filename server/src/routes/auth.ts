import { Router } from 'express';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import { verifyMagicLink, createSession } from '../../lib/magicLink.js';
import { db } from '../../db.js';
import { householdsTable } from '@shared/schema';
import { eq, and, gt } from 'drizzle-orm';
import { sendResendEmail } from '../../lib/resend.js';
import { stripe } from '../lib/stripe.js';

const router = Router();

const BASE_URL = process.env.PUBLIC_BASE_URL || 'https://maintcue.com';
const FROM_EMAIL = process.env.FROM_EMAIL || 'MaintCue <no-reply@maintcue.com>';
const BCRYPT_ROUNDS = 12;

// ---------------------------------------------------------------------------
// Rate limiters
// ---------------------------------------------------------------------------
const authApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later.',
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many requests, please try again later.',
});

// ---------------------------------------------------------------------------
// Helper: set session cookie and redirect/respond
// ---------------------------------------------------------------------------
async function issueSession(res: any, householdId: string, email: string) {
  const sessionToken = await createSession(email, householdId);
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('maintcue_session', sessionToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  });
  return sessionToken;
}

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------
router.post('/register', authApiLimiter, async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
  });

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(req.body);
  } catch (err: any) {
    return res.status(400).json({ error: err.errors?.[0]?.message || 'Invalid input' });
  }

  const { email, password, firstName, lastName } = body;

  try {
    const [existing] = await db
      .select()
      .from(householdsTable)
      .where(eq(householdsTable.email, email.toLowerCase()))
      .limit(1);

    if (existing) {
      if (existing.passwordHash) {
        return res.status(409).json({ error: 'An account with this email already exists. Please sign in.' });
      }
      // Upgrade magic-link / OAuth account to password auth
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      await db
        .update(householdsTable)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(householdsTable.id, existing.id));

      await issueSession(res, existing.id, email.toLowerCase());
      return res.json({
        success: true,
        user: {
          id: existing.id,
          email: existing.email,
          firstName: existing.name?.split(' ')[0] ?? firstName,
          lastName: existing.name?.split(' ').slice(1).join(' ') ?? lastName,
          subscriptionTier: existing.subscriptionTier,
        },
      });
    }

    // New account
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const [created] = await db
      .insert(householdsTable)
      .values({
        name: `${firstName} ${lastName}`.trim(),
        email: email.toLowerCase(),
        passwordHash,
        subscriptionStatus: 'incomplete',
      })
      .returning();

    await issueSession(res, created.id, email.toLowerCase());
    return res.json({
      success: true,
      user: {
        id: created.id,
        email: created.email,
        firstName,
        lastName,
        subscriptionTier: created.subscriptionTier,
      },
    });
  } catch (err: any) {
    console.error('[auth/register]', err);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
router.post('/login', authApiLimiter, async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  });

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(req.body);
  } catch {
    return res.status(400).json({ error: 'Invalid email or password' });
  }

  const { email, password } = body;
  const GENERIC_ERROR = 'Invalid email or password';

  try {
    const [household] = await db
      .select()
      .from(householdsTable)
      .where(eq(householdsTable.email, email.toLowerCase()))
      .limit(1);

    if (!household || !household.passwordHash) {
      return res.status(401).json({ error: GENERIC_ERROR });
    }

    const match = await bcrypt.compare(password, household.passwordHash);
    if (!match) {
      return res.status(401).json({ error: GENERIC_ERROR });
    }

    await issueSession(res, household.id, household.email);
    return res.json({
      success: true,
      user: {
        id: household.id,
        email: household.email,
        firstName: household.name?.split(' ')[0] ?? '',
        lastName: household.name?.split(' ').slice(1).join(' ') ?? '',
        subscriptionTier: household.subscriptionTier,
      },
    });
  } catch (err: any) {
    console.error('[auth/login]', err);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/logout   (alias for session/logout)
// ---------------------------------------------------------------------------
router.post('/logout', async (_req, res) => {
  res.clearCookie('maintcue_session', { path: '/' });
  return res.json({ success: true });
});

// ---------------------------------------------------------------------------
// POST /api/auth/forgot-password
// ---------------------------------------------------------------------------
router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  const schema = z.object({ email: z.string().email() });
  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(req.body);
  } catch {
    // Always 200 to prevent enumeration
    return res.json({ success: true });
  }

  const { email } = body;

  try {
    const [household] = await db
      .select()
      .from(householdsTable)
      .where(eq(householdsTable.email, email.toLowerCase()))
      .limit(1);

    if (household) {
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db
        .update(householdsTable)
        .set({ resetToken: token, resetTokenExpires: expires, updatedAt: new Date() })
        .where(eq(householdsTable.id, household.id));

      const resetUrl = `${BASE_URL}/reset-password?token=${token}`;

      await sendResendEmail({
        to: email.toLowerCase(),
        from: FROM_EMAIL,
        subject: 'Reset your MaintCue password',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #333;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="font-size: 28px; font-weight: 700; color: #10b981;">Maint</span><span style="font-size: 28px; font-weight: 700; color: #1E3A5F;">Cue</span>
            </div>
            <h2 style="margin-top: 0;">Reset your password</h2>
            <p>We received a request to reset your MaintCue password. Click the button below to set a new password.</p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${resetUrl}" style="display: inline-block; background: #10b981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">Reset Password</a>
            </div>
            <p style="font-size: 13px; color: #6b7280;">This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
          </div>
        `,
        text: `Reset your MaintCue password: ${resetUrl} (expires in 1 hour)`,
      });
    }
  } catch (err: any) {
    console.error('[auth/forgot-password]', err);
    // Still return 200 — don't reveal errors
  }

  return res.json({ success: true });
});

// ---------------------------------------------------------------------------
// POST /api/auth/reset-password   (also used by /set-password page)
// ---------------------------------------------------------------------------
router.post('/reset-password', async (req, res) => {
  const schema = z.object({
    token: z.string().min(1),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  });

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(req.body);
  } catch (err: any) {
    return res.status(400).json({ error: err.errors?.[0]?.message || 'Invalid input' });
  }

  const { token, password } = body;

  try {
    const now = new Date();
    const [household] = await db
      .select()
      .from(householdsTable)
      .where(
        and(
          eq(householdsTable.resetToken, token),
          gt(householdsTable.resetTokenExpires, now)
        )
      )
      .limit(1);

    if (!household) {
      return res.status(400).json({ error: 'Reset link is invalid or has expired.' });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await db
      .update(householdsTable)
      .set({
        passwordHash,
        resetToken: null,
        resetTokenExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(householdsTable.id, household.id));

    await issueSession(res, household.id, household.email);
    return res.json({
      success: true,
      user: {
        id: household.id,
        email: household.email,
        subscriptionTier: household.subscriptionTier,
      },
    });
  } catch (err: any) {
    console.error('[auth/reset-password]', err);
    return res.status(500).json({ error: 'Password reset failed. Please try again.' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/auth/setup-info?token=TOKEN
// Used by SetPassword page to pre-fill the email field
// ---------------------------------------------------------------------------
router.get('/setup-info', async (req, res) => {
  const token = typeof req.query.token === 'string' ? req.query.token : null;
  if (!token) {
    return res.status(400).json({ error: 'Missing token' });
  }

  try {
    const now = new Date();
    const [household] = await db
      .select({ email: householdsTable.email })
      .from(householdsTable)
      .where(
        and(
          eq(householdsTable.resetToken, token),
          gt(householdsTable.resetTokenExpires, now)
        )
      )
      .limit(1);

    if (!household) {
      return res.status(400).json({ error: 'Setup link is invalid or has expired.' });
    }

    return res.json({ email: household.email });
  } catch (err: any) {
    console.error('[auth/setup-info]', err);
    return res.status(500).json({ error: 'Failed to verify setup link.' });
  }
});

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// GET /api/auth/setup-token?session_id=SESSION_ID
// Called by SubscriptionSuccess page to get the setup token for the CTA button.
// Looks up the Stripe checkout session → finds the household by customer email →
// returns the reset_token if it is still valid (not expired).
// ---------------------------------------------------------------------------
router.get('/setup-token', async (req, res) => {
  const sessionId = typeof req.query.session_id === 'string' ? req.query.session_id : null;
  if (!sessionId) {
    return res.status(400).json({ error: 'Missing session_id' });
  }

  if (!stripe) {
    return res.status(503).json({ error: 'Payment service unavailable' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const email = session.customer_details?.email || session.customer_email;
    if (!email) {
      return res.status(404).json({ error: 'No email on session' });
    }

    const now = new Date();
    const [household] = await db
      .select({ resetToken: householdsTable.resetToken, resetTokenExpires: householdsTable.resetTokenExpires })
      .from(householdsTable)
      .where(eq(householdsTable.email, email.toLowerCase()))
      .limit(1);

    if (!household || !household.resetToken || !household.resetTokenExpires || household.resetTokenExpires <= now) {
      return res.status(404).json({ error: 'Setup token not found or expired' });
    }

    return res.json({ token: household.resetToken });
  } catch (err: any) {
    console.error('[auth/setup-token]', err?.message);
    return res.status(500).json({ error: 'Failed to retrieve setup token' });
  }
});

// Admin/Agent JWT login (unchanged)
// ---------------------------------------------------------------------------
const agentLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/agent/login', authApiLimiter, (req, res) => {
  try {
    const { email, password } = agentLoginSchema.parse(req.body);

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: 'JWT_SECRET not configured' });
    }
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      return res.status(500).json({ error: 'Admin credentials not configured' });
    }

    if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const agentId = 'agent_samuel';
    const token = jwt.sign(
      { agentId, email, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ success: true, token, agent: { id: agentId, email, role: 'admin' } });
  } catch (error: any) {
    console.error('Agent login error:', error);
    if (error?.name === 'ZodError') {
      res.status(400).json({ error: 'Invalid email or password', details: error.errors });
    } else {
      res.status(500).json({ error: 'Login failed' });
    }
  }
});

// ---------------------------------------------------------------------------
// Magic link routes (kept for backward compat / QR scan flow)
// ---------------------------------------------------------------------------
const pendingMagicLinks = new Map<string, { email: string; householdId: string; expiresAt: Date }>();

router.get('/magic', async (req, res) => {
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.redirect('/auth/error?message=invalid-link');
  }

  try {
    console.log('🔗 Verifying magic link token');
    const { email, householdId } = await verifyMagicLink(token);

    if (!householdId) {
      console.error('❌ Magic link has no household_id');
      return res.redirect('/auth/error?message=invalid-link');
    }

    const exchangeCode = nanoid(32);
    pendingMagicLinks.set(exchangeCode, {
      email,
      householdId,
      expiresAt: new Date(Date.now() + 60 * 1000),
    });

    setTimeout(() => pendingMagicLinks.delete(exchangeCode), 65 * 1000);

    console.log('✅ Magic link verified, returning exchange code');

    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Logging in...</title>
          <style>
            body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #10b981; }
            .card { background: white; padding: 2rem; border-radius: 8px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .spinner { border: 3px solid #f3f3f3; border-top: 3px solid #10b981; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="spinner"></div>
            <p>Logging you in...</p>
            <form id="auth-form" method="POST" action="/api/auth/magic/complete">
              <input type="hidden" name="code" value="${exchangeCode}" />
            </form>
            <script>document.getElementById('auth-form').submit();</script>
            <noscript>
              <p>JavaScript is disabled. Please click the button below:</p>
              <button type="submit" form="auth-form">Continue to Dashboard</button>
            </noscript>
          </div>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error('❌ Magic link verification error:', error.message);
    let message = 'invalid-link';
    if (error.message.includes('expired')) message = 'link-expired';
    else if (error.message.includes('used')) message = 'link-already-used';
    return res.redirect(`/auth/error?message=${message}`);
  }
});

router.post('/magic/complete', async (req, res) => {
  const { code } = req.body;

  if (!code || typeof code !== 'string') {
    return res.redirect('/auth/error?message=invalid-link');
  }

  const pending = pendingMagicLinks.get(code);
  if (!pending) {
    console.warn('❌ Invalid or expired exchange code');
    return res.redirect('/auth/error?message=invalid-link');
  }

  if (new Date() > pending.expiresAt) {
    pendingMagicLinks.delete(code);
    console.warn('❌ Exchange code expired');
    return res.redirect('/auth/error?message=link-expired');
  }

  pendingMagicLinks.delete(code);

  try {
    const sessionToken = await createSession(pending.email, pending.householdId);
    console.log('✅ Session created for household:', pending.householdId);

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('maintcue_session', sessionToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    let redirectPath = '/my-home';
    try {
      const [household] = await db
        .select({ subscriptionTier: householdsTable.subscriptionTier })
        .from(householdsTable)
        .where(eq(householdsTable.id, pending.householdId))
        .limit(1);
      if (household?.subscriptionTier === 'property_manager') redirectPath = '/property-manager';
      else if (household?.subscriptionTier === 'realtor') redirectPath = '/realtor';
    } catch (tierErr) {
      console.warn('⚠️ Could not look up subscription tier for redirect:', tierErr);
    }

    return res.redirect(redirectPath);
  } catch (error) {
    console.error('❌ Failed to create session:', error);
    return res.redirect('/auth/error?message=invalid-link');
  }
});

router.get('/session/verify', async (req, res) => {
  const sessionToken = req.cookies?.maintcue_session;

  if (!sessionToken) {
    return res.status(401).json({ valid: false, error: 'No session found' });
  }

  try {
    const { verifySession } = await import('../../lib/magicLink.js');
    const session = await verifySession(sessionToken);

    if (!session) {
      res.clearCookie('maintcue_session');
      res.clearCookie('maintcue_household');
      return res.status(401).json({ valid: false, error: 'Invalid or expired session' });
    }

    return res.json({ valid: true, email: session.email, householdId: session.householdId });
  } catch (error) {
    console.error('Session verification error:', error);
    return res.status(500).json({ valid: false, error: 'Failed to verify session' });
  }
});

router.post('/session/logout', async (_req, res) => {
  res.clearCookie('maintcue_session', { path: '/' });
  return res.json({ success: true });
});

export default router;
