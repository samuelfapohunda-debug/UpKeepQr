import { Router, Response } from 'express';
import { db } from '../../db';
import { householdsTable, homeProfileExtras, householdTaskAssignmentsTable, homeMaintenanceTasksTable } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { requireSessionAuth, validateHouseholdAccess, SessionAuthRequest } from '../../middleware/sessionAuth';

const router = Router();

router.get('/household', requireSessionAuth, async (req: SessionAuthRequest, res: Response) => {
  try {
    const householdId = req.sessionHouseholdId;
    
    if (!householdId) {
      return res.status(401).json({ error: 'Session not authenticated' });
    }
    
    const [household] = await db
      .select()
      .from(householdsTable)
      .where(eq(householdsTable.id, householdId))
      .limit(1);
    
    if (!household) {
      return res.status(404).json({ error: 'Household not found' });
    }
    
    const nameParts = household.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    const [homeProfile] = await db
      .select()
      .from(homeProfileExtras)
      .where(eq(homeProfileExtras.householdId, householdId))
      .limit(1);
    
    return res.json({
      id: household.id,
      firstName,
      lastName,
      email: household.email,
      homeType: homeProfile?.homeType || 'Single Family',
      city: household.city || '',
      state: household.state || '',
      zip: household.zipcode || ''
    });
  } catch (error) {
    console.error('Error fetching customer household:', error);
    return res.status(500).json({ error: 'Failed to fetch household' });
  }
});

router.get('/tasks', requireSessionAuth, async (req: SessionAuthRequest, res: Response) => {
  try {
    const householdId = req.sessionHouseholdId;
    
    if (!householdId) {
      return res.status(401).json({ error: 'Session not authenticated' });
    }
    
    const assignments = await db
      .select({
        id: householdTaskAssignmentsTable.id,
        taskName: homeMaintenanceTasksTable.taskName,
        description: homeMaintenanceTasksTable.description,
        category: homeMaintenanceTasksTable.category,
        priority: householdTaskAssignmentsTable.priority,
        status: householdTaskAssignmentsTable.status,
        dueDate: householdTaskAssignmentsTable.dueDate,
        frequencyMonths: homeMaintenanceTasksTable.frequencyMonths
      })
      .from(householdTaskAssignmentsTable)
      .innerJoin(homeMaintenanceTasksTable, eq(householdTaskAssignmentsTable.taskId, homeMaintenanceTasksTable.id))
      .where(eq(householdTaskAssignmentsTable.householdId, householdId));
    
    const now = new Date();
    const total = assignments.length;
    const completed = assignments.filter(t => t.status === 'completed').length;
    const overdue = assignments.filter(t => {
      if (t.status === 'completed') return false;
      return t.dueDate && new Date(t.dueDate) < now;
    }).length;
    const pending = total - completed - overdue;
    
    return res.json({
      tasks: assignments,
      summary: { total, completed, pending, overdue }
    });
  } catch (error) {
    console.error('Error fetching customer tasks:', error);
    return res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

export default router;
