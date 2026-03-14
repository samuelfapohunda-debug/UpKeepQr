import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { lookupProperty } from '../../services/attomService.js';

const router = Router();

const lookupLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many property lookups, please try again later.',
});

router.get('/lookup', lookupLimiter, async (req: Request, res: Response) => {
  const { streetAddress, city, state, zip } = req.query as Record<string, string>;

  if (!streetAddress?.trim() || !zip?.trim()) {
    return res.json({ found: false });
  }

  try {
    const address1 = streetAddress.trim();
    const address2 = [city, state, zip].filter(Boolean).join(', ').trim();

    const data = await lookupProperty(address1, address2);
    if (!data) return res.json({ found: false });

    return res.json({ found: true, ...data });
  } catch {
    return res.json({ found: false });
  }
});

export default router;
