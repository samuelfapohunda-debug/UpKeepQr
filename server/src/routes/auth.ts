import { Router } from 'express';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

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

export default router;
