import { Router } from 'express';
import { createEvent } from '../lib/ics.js';
import { z } from 'zod';

const router = Router();

const eventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  start: z.string().datetime(),
  end: z.string().datetime(),
  location: z.string().optional(),
});

router.post('/event', async (req, res) => {
  try {
    const eventData = eventSchema.parse(req.body);
    
    const icsContent = createEvent(eventData);
    
    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', 'attachment; filename="event.ics"');
    res.send(icsContent);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create calendar event' });
  }
});

router.get('/events/:agentId', (req, res) => {
  try {
    const { agentId } = req.params;
    
    // TODO: Fetch agent events from database
    const events = [];
    
    res.json({ 
      success: true, 
      events,
      agentId 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

export default router;
