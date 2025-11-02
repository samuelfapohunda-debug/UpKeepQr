import { Router } from 'express';
import { z } from 'zod';
import { nanoid } from 'nanoid';

const router = Router();

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

router.post('/login', (req, res) => {
  try {
    const { username, _password } = loginSchema.parse(req.body);
    
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

export default router;
