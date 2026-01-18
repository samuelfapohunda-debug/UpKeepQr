import { Router, Response } from 'express';
import { db } from '../../db';
import { householdsTable, homeProfileExtras, householdTaskAssignmentsTable, homeMaintenanceTasksTable } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
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
        frequency: householdTaskAssignmentsTable.frequency
      })
      .from(householdTaskAssignmentsTable)
      .innerJoin(homeMaintenanceTasksTable, eq(householdTaskAssignmentsTable.taskId, homeMaintenanceTasksTable.id))
      .where(eq(householdTaskAssignmentsTable.householdId, householdId));
    
    console.log('📊 Query result:', { householdId, assignmentsCount: assignments?.length, firstTask: assignments?.[0] });
    
    if (!assignments || !Array.isArray(assignments)) {
      console.error('Assignments is not an array:', assignments);
      return res.json({ tasks: [], summary: { total: 0, completed: 0, pending: 0, overdue: 0 } });
    }

    const now = new Date();
    console.log('🔍 About to process assignments:', { hasAssignments: !!assignments, isArray: Array.isArray(assignments) });
    const total = assignments?.length || 0;
    const completed = (assignments || []).filter(t => t?.status === 'completed').length;
    const overdue = (assignments || []).filter(t => {
      if (t?.status === 'completed') return false;
      if (!t.dueDate) return false;
      try {
        return new Date(t.dueDate) < now;
      } catch {
        return false;
      }
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

router.patch('/tasks/:taskId', requireSessionAuth, async (req: SessionAuthRequest, res: Response) => {
  try {
    const householdId = req.sessionHouseholdId;
    const { taskId } = req.params;
    
    if (!householdId) {
      return res.status(401).json({ error: 'Session not authenticated' });
    }
    
    const [assignment] = await db
      .select()
      .from(householdTaskAssignmentsTable)
      .where(
        and(
          eq(householdTaskAssignmentsTable.id, parseInt(taskId)),
          eq(householdTaskAssignmentsTable.householdId, householdId)
        )
      )
      .limit(1);
    
    if (!assignment) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    if (assignment.status === 'completed') {
      return res.status(400).json({ 
        error: 'Task already completed',
        details: `Task was completed on ${assignment.completedAt ? new Date(assignment.completedAt).toLocaleDateString() : 'a previous date'}`
      });
    }
    
    const completedAt = new Date();
    
    const [updatedAssignment] = await db
      .update(householdTaskAssignmentsTable)
      .set({ 
        status: 'completed',
        completedAt,
        updatedAt: new Date()
      })
      .where(eq(householdTaskAssignmentsTable.id, parseInt(taskId)))
      .returning();
    
    if (!updatedAssignment) {
      return res.status(500).json({ error: 'Failed to update task' });
    }
    
    const [taskDetails] = await db
      .select({
        taskName: homeMaintenanceTasksTable.taskName,
        description: homeMaintenanceTasksTable.description,
        category: homeMaintenanceTasksTable.category,
        frequencyMonths: homeMaintenanceTasksTable.frequencyMonths
      })
      .from(homeMaintenanceTasksTable)
      .where(eq(homeMaintenanceTasksTable.id, updatedAssignment.taskId))
      .limit(1);
    
    return res.json({
      id: updatedAssignment.id,
      taskName: taskDetails?.taskName || '',
      description: taskDetails?.description || '',
      category: taskDetails?.category || '',
      priority: updatedAssignment.priority,
      status: updatedAssignment.status,
      dueDate: updatedAssignment.dueDate,
      frequencyMonths: taskDetails?.frequencyMonths || 12,
      completedAt: updatedAssignment.completedAt
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return res.status(500).json({ error: 'Failed to update task' });
  }
});

export default router;
