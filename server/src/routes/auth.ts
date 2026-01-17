import { Router } from 'express';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { verifyMagicLink, createSession } from '../../lib/magicLink.js';

const router = Router();

// Rate limiter for auth endpoints
const authApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit login attempts
  message: "Too many login attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const registerSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

const agentLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/login', (req, res) => {
  try {
    const { username } = loginSchema.parse(req.body);
    
    // TODO: Implement actual authentication logic
    const token = nanoid();
    
    res.json({ 
      success: true, 
      token,
      user: { username }
    });
  } catch {
    res.status(400).json({ error: 'Invalid credentials' });
  }
});

router.post('/register', (req, res) => {
  try {
    const userData = registerSchema.parse(req.body);
    
    // TODO: Implement user registration logic
    const token = nanoid();
    
    res.json({ 
      success: true, 
      token,
      user: { 
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName
      }
    });
  } catch {
    res.status(400).json({ error: 'Registration failed' });
  }
});

// Agent/Admin login endpoint
router.post('/agent/login', authApiLimiter, (req, res) => {
  try {
    const { email, password } = agentLoginSchema.parse(req.body);

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "JWT_SECRET not configured" });
    }

    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      return res.status(500).json({ error: "Admin credentials not configured" });
    }
    
    // Validate credentials from environment variables
    if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ 
        error: "Invalid email or password" 
      });
    }

    const agentId = 'agent_samuel';
    
    // Generate JWT token with role information
    const token = jwt.sign(
      { agentId, email, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      agent: {
        id: agentId,
        email,
        role: 'admin'
      }
    });
  } catch (error: any) {
    console.error("Agent login error:", error);
    if (error?.name === 'ZodError') {
      res.status(400).json({ error: "Invalid email or password", details: error.errors });
    } else {
      res.status(500).json({ error: "Login failed" });
    }
  }
});

const pendingMagicLinks = new Map<string, { email: string; householdId: string; expiresAt: Date }>();

router.get('/magic', async (req, res) => {
  const { token } = req.query;
  
  if (!token || typeof token !== 'string') {
    return res.redirect('/auth/error?message=invalid-link');
  }
  
  try {
    console.log("🔗 Verifying magic link token");
    const { email, householdId } = await verifyMagicLink(token);
    
    if (!householdId) {
      console.error("❌ Magic link has no household_id");
      return res.redirect('/auth/error?message=invalid-link');
    }
    
    const exchangeCode = nanoid(32);
    pendingMagicLinks.set(exchangeCode, {
      email,
      householdId,
      expiresAt: new Date(Date.now() + 60 * 1000)
    });
    
    setTimeout(() => pendingMagicLinks.delete(exchangeCode), 65 * 1000);
    
    console.log("✅ Magic link verified, returning exchange code");
    
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Logging in...</title>
          <style>
            body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .card { background: white; padding: 2rem; border-radius: 8px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .spinner { border: 3px solid #f3f3f3; border-top: 3px solid #667eea; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
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
    console.error("❌ Magic link verification error:", error.message);
    
    let message = 'invalid-link';
    if (error.message.includes('expired')) {
      message = 'link-expired';
    } else if (error.message.includes('used')) {
      message = 'link-already-used';
    }
    
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
    console.warn("❌ Invalid or expired exchange code");
    return res.redirect('/auth/error?message=invalid-link');
  }
  
  if (new Date() > pending.expiresAt) {
    pendingMagicLinks.delete(code);
    console.warn("❌ Exchange code expired");
    return res.redirect('/auth/error?message=link-expired');
  }
  
  pendingMagicLinks.delete(code);
  
  try {
    const sessionToken = await createSession(pending.email, pending.householdId);
    console.log("✅ Session created for household:", pending.householdId);
    
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('upkeepqr_session', sessionToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/'
    });
    
    return res.redirect('/my-home');
  } catch (error) {
    console.error("❌ Failed to create session:", error);
    return res.redirect('/auth/error?message=invalid-link');
  }
});

router.get('/session/verify', async (req, res) => {
  const sessionToken = req.cookies?.upkeepqr_session;
  
  if (!sessionToken) {
    return res.status(401).json({ valid: false, error: 'No session found' });
  }
  
  try {
    const { verifySession } = await import('../../lib/magicLink.js');
    const session = await verifySession(sessionToken);
    
    if (!session) {
      res.clearCookie('upkeepqr_session');
      res.clearCookie('upkeepqr_household');
      return res.status(401).json({ valid: false, error: 'Invalid or expired session' });
    }
    
    return res.json({
      valid: true,
      email: session.email,
      householdId: session.householdId
    });
  } catch (error) {
    console.error("Session verification error:", error);
    return res.status(500).json({ valid: false, error: 'Failed to verify session' });
  }
});

router.post('/session/logout', async (req, res) => {
  res.clearCookie('upkeepqr_session');
  return res.json({ success: true });
});

export default router;
