import { Router } from 'express';

const router = Router();

// POST /api/calendar/google/auth-url
router.post('/google/auth-url', (req, res) => {
  return res.json({
    authUrl: 'test-url',
    state: 'test-state',
  });
});

export default router;
