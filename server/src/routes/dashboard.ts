import { Router, Request, Response } from 'express';

const router = Router();

router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token required' });
    }

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dashboardData = {
      property: {
        name: 'My Home',
        address: {
          street: '123 Main Street',
          city: 'Atlanta',
          state: 'GA',
          zip: '30308'
        }
      },
      status: 'tasks_due' as const,
      nextTask: {
        id: '1',
        name: 'Change HVAC Filter',
        dueDate: tomorrow.toISOString(),
        instruction: 'Replace your HVAC filter with a new filter to maintain air quality and system efficiency.',
        appliance: 'HVAC System'
      },
      upcomingTask: {
        id: '2',
        name: 'Clean Gutters',
        dueDate: new Date('2026-02-15').toISOString(),
        instruction: 'Remove debris and check for proper drainage.',
        appliance: 'Roof System'
      },
      upcomingTasks: [
        {
          id: '2',
          name: 'Clean Gutters',
          appliance: 'Roof System',
          dueDate: new Date('2026-02-15').toISOString(),
          status: 'upcoming' as const,
          instruction: 'Remove debris and check for proper drainage.'
        },
        {
          id: '3',
          name: 'Test Smoke Alarms',
          appliance: 'Safety Systems',
          dueDate: new Date('2026-03-01').toISOString(),
          status: 'upcoming' as const,
          instruction: 'Press test button on each alarm and replace batteries if needed.'
        }
      ],
      completedTasks: [
        {
          id: '100',
          name: 'Changed HVAC Filter',
          completedDate: new Date('2026-01-08').toISOString(),
          completedBy: 'self',
          notes: ''
        },
        {
          id: '101',
          name: 'Inspected Water Heater',
          completedDate: new Date('2025-12-15').toISOString(),
          completedBy: 'ABC Plumbing',
          notes: 'All systems functioning normally'
        }
      ],
      reminders: {
        email: true,
        sms: true
      },
      qrAssets: [
        {
          id: 'qr1',
          label: 'QR Magnet #1',
          location: 'HVAC Closet',
          activatedAt: new Date('2025-11-20').toISOString()
        },
        {
          id: 'qr2',
          label: 'QR Magnet #2',
          location: 'Water Heater',
          activatedAt: new Date('2025-11-20').toISOString()
        }
      ]
    };

    return res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

router.post('/dashboard/tasks/:taskId/complete', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log(`Task ${taskId} marked as complete by token: ${token.substring(0, 10)}...`);
    
    return res.json({ 
      success: true,
      message: 'Task completed successfully' 
    });
  } catch (error) {
    console.error('Task completion error:', error);
    return res.status(500).json({ error: 'Failed to complete task' });
  }
});

export default router;
