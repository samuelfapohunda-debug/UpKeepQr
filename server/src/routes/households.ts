import { Router, Request, Response } from 'express';
import { storage } from '../../storage.js';

const router = Router();

router.get('/households/:householdId/tasks', async (req: Request, res: Response) => {
  try {
    const { householdId } = req.params;
    
    const tasks = await storage.getTasksByHousehold(householdId);
    
    const summary = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      overdue: tasks.filter(t => t.status === 'overdue').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      skipped: tasks.filter(t => t.status === 'skipped').length
    };
    
    res.json({ tasks, summary });
  } catch (error) {
    console.error('Error fetching household tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

export default router;
