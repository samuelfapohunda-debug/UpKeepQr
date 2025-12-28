import { Router, Request, Response } from 'express';
import { storage } from '../../storage.js';
import { authenticateAgent } from '../../middleware/auth.js';
import { db } from '../../db.js';
import { householdTaskAssignmentsTable, maintenanceLogsTable } from '../../../shared/schema.js';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

const completeTaskSchema = z.object({
  completionDate: z.string().optional(),
  cost: z.number().optional(),
  serviceProvider: z.string().optional(),
  notes: z.string().optional(),
  partsReplaced: z.string().optional(),
});

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

router.patch('/admin/households/:householdId/tasks/:taskAssignmentId/complete', authenticateAgent, async (req: Request, res: Response) => {
  try {
    const { householdId, taskAssignmentId } = req.params;
    
    const validated = completeTaskSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({ error: 'Invalid data', details: validated.error.errors });
    }
    
    const data = validated.data;
    const completionDate = data.completionDate ? new Date(data.completionDate) : new Date();
    
    const [existingTask] = await db.select()
      .from(householdTaskAssignmentsTable)
      .where(eq(householdTaskAssignmentsTable.id, taskAssignmentId))
      .limit(1);
    
    if (!existingTask) {
      return res.status(404).json({ error: 'Task assignment not found' });
    }
    
    if (existingTask.householdId !== householdId) {
      return res.status(403).json({ error: 'Task does not belong to this household' });
    }
    
    const [updatedTask] = await db.update(householdTaskAssignmentsTable)
      .set({
        status: 'completed',
        completedAt: completionDate,
        updatedAt: new Date(),
        notes: data.notes || existingTask.notes
      })
      .where(eq(householdTaskAssignmentsTable.id, taskAssignmentId))
      .returning();
    
    const taskDetails = await storage.getTasksWithDetailsByHousehold(householdId);
    const taskInfo = taskDetails.find((t: any) => t.id === taskAssignmentId);
    const taskName = taskInfo?.taskName || 'Maintenance Task';
    
    const costValue = data.cost !== undefined && data.cost !== null && !isNaN(data.cost) 
      ? String(data.cost) 
      : null;
    const dueDateTime = new Date(existingTask.dueDate).getTime();
    const completionDateTime = completionDate.getTime();
    const wasOnTime = completionDateTime <= dueDateTime;
    const daysLate = wasOnTime ? 0 : Math.ceil((completionDateTime - dueDateTime) / (1000 * 60 * 60 * 24));
    
    await db.insert(maintenanceLogsTable).values({
      householdId,
      taskAssignmentId,
      maintenanceDate: completionDate,
      taskPerformed: taskName,
      logType: 'scheduled',
      cost: costValue,
      serviceProvider: data.serviceProvider || null,
      partsReplaced: data.partsReplaced || null,
      notes: data.notes || null,
      createdBy: 'admin',
      wasOnTime,
      daysLate
    });
    
    console.log(`Task ${taskAssignmentId} marked complete for household ${householdId}`);
    
    res.json({
      success: true,
      message: 'Task marked as completed',
      task: updatedTask
    });
  } catch (error: any) {
    console.error('Error completing task:', error);
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

export default router;
