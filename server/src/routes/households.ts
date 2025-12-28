import { Router, Request, Response } from 'express';
import { storage } from '../../storage.js';
import { authenticateAgent } from '../../middleware/auth.js';

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

router.get('/admin/households/:id/tasks', authenticateAgent, async (req: Request, res: Response) => {
  try {
    const { id: householdId } = req.params;
    
    const household = await storage.getHousehold(householdId);
    if (!household) {
      return res.status(404).json({ message: 'Household not found' });
    }
    
    const tasks = await storage.getTasksWithDetailsByHousehold(householdId);
    
    const summary = {
      total: tasks.length,
      pending: tasks.filter((t: any) => t.status === 'pending').length,
      overdue: tasks.filter((t: any) => t.status === 'overdue').length,
      completed: tasks.filter((t: any) => t.status === 'completed').length
    };
    
    return res.json({
      householdId,
      householdName: household.name || 'Unknown',
      summary,
      tasks
    });
  } catch (error: any) {
    console.error('Error fetching household tasks:', error);
    return res.status(500).json({ message: 'Failed to fetch household tasks' });
  }
});

export default router;
