import { Router, Response } from 'express';
import { db } from '../../db';
import { householdsTable, homeProfileExtras, maintenanceTasksTable, householdTaskAssignmentsTable } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { requireSessionAuth, validateHouseholdAccess, SessionAuthRequest } from '../../middleware/sessionAuth';
import { generateMaintenanceSchedule } from '../../services/homeResearchAgent.js';

const router = Router();

function frequencyToMonths(frequency: string): number {
  switch (frequency?.toLowerCase()) {
    case 'monthly':   return 1;
    case 'quarterly': return 3;
    case 'biannual':  return 6;
    case 'annual':    return 12;
    default:          return 12;
  }
}

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
      streetAddress: household.addressLine1 || '',
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

    const rows = await db
      .select()
      .from(maintenanceTasksTable)
      .where(eq(maintenanceTasksTable.householdId, householdId))
      .orderBy(maintenanceTasksTable.month, maintenanceTasksTable.priority);

    console.log('📊 maintenance_tasks query:', { householdId, count: rows.length });

    const now = new Date();

    const tasks = rows.map(t => ({
      id: t.id,
      taskName: t.title,
      description: t.description,
      category: t.category,
      priority: t.priority,
      status: t.isCompleted
        ? 'completed'
        : (t.dueDate && new Date(t.dueDate) < now ? 'overdue' : 'pending'),
      dueDate: t.dueDate,
      frequency: t.frequency,
      frequencyMonths: frequencyToMonths(t.frequency),
      estimatedCostMin: t.estimatedCostMin,
      estimatedCostMax: t.estimatedCostMax,
      estimatedDiyCost: t.estimatedDiyCost,
      estimatedProCost: t.estimatedProCost,
      month: t.month,
    }));

    const total     = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const overdue   = tasks.filter(t => t.status === 'overdue').length;
    const pending   = total - completed - overdue;

    return res.json({
      tasks,
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
    const taskId = parseInt(String(req.params.taskId), 10);

    if (!householdId) {
      return res.status(401).json({ error: 'Session not authenticated' });
    }

    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task id' });
    }

    const [task] = await db
      .select()
      .from(maintenanceTasksTable)
      .where(
        and(
          eq(maintenanceTasksTable.id, taskId),
          eq(maintenanceTasksTable.householdId, householdId)
        )
      )
      .limit(1);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.isCompleted) {
      return res.status(400).json({
        error: 'Task already completed',
        details: `Task was completed on ${task.completedAt ? new Date(task.completedAt).toLocaleDateString() : 'a previous date'}`
      });
    }

    const completedAt = new Date();

    const [updated] = await db
      .update(maintenanceTasksTable)
      .set({ isCompleted: true, completedAt, updatedAt: new Date() } as any)
      .where(eq(maintenanceTasksTable.id, taskId))
      .returning();

    return res.json({
      id: updated.id,
      taskName: updated.title,
      description: updated.description,
      category: updated.category,
      priority: updated.priority,
      status: 'completed',
      dueDate: updated.dueDate,
      frequency: updated.frequency,
      frequencyMonths: frequencyToMonths(updated.frequency),
      completedAt: updated.completedAt,
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return res.status(500).json({ error: 'Failed to update task' });
  }
});

/**
 * POST /api/customer/setup-home
 * Session-authenticated endpoint for new subscribers to save their home profile
 * and trigger AI maintenance task generation.
 */
router.post('/setup-home', requireSessionAuth, async (req: SessionAuthRequest, res: Response) => {
  const householdId = req.sessionHouseholdId;
  if (!householdId) {
    return res.status(401).json({ error: 'Session not authenticated' });
  }

  const {
    streetAddress, city, state, zip,
    homeType, sqft, yearBuilt, bedrooms, bathrooms,
    hvacType, waterHeater, roofAgeYears,
    isOwner, hasPool, garage,
  } = req.body;

  if (!streetAddress || !city || !state || !zip) {
    return res.status(400).json({ error: 'Address fields are required' });
  }

  const now = new Date();

  // STEP 1: Update core address fields — only columns guaranteed to exist in all DB versions.
  // Do NOT include optional columns (smsOptIn, phone, etc.) that may be missing in older schemas.
  try {
    await db
      .update(householdsTable)
      .set({
        addressLine1: streetAddress,
        city,
        state: state.toUpperCase(),
        zipcode: zip,
        updatedAt: now,
      })
      .where(eq(householdsTable.id, householdId));
    console.log(`✅ [setup-home] Address saved for household ${householdId}`);
  } catch (addressError) {
    console.error('❌ [setup-home] Failed to save address:', addressError);
    return res.status(500).json({ error: 'Failed to save address. Please try again.' });
  }

  // STEP 2: Upsert home_profile_extras (non-critical — don't fail the whole request if this errors)
  try {
    const existing = await db
      .select({ id: homeProfileExtras.id })
      .from(homeProfileExtras)
      .where(eq(homeProfileExtras.householdId, householdId))
      .limit(1);

    const profileData = {
      homeType: homeType || null,
      yearBuilt: yearBuilt || null,
      squareFootage: sqft || null,
      bedrooms: bedrooms || null,
      bathrooms: bathrooms || null,
      hvacType: hvacType || null,
      waterHeaterType: waterHeater || null,
      roofAgeYears: roofAgeYears || null,
      ownerType: isOwner === true ? 'owner' : null,
      updatedAt: now,
    };

    if (existing.length > 0) {
      await db
        .update(homeProfileExtras)
        .set(profileData)
        .where(eq(homeProfileExtras.householdId, householdId));
    } else {
      await db
        .insert(homeProfileExtras)
        .values({ householdId, ...profileData, createdAt: now });
    }
    console.log(`✅ [setup-home] Home profile saved for household ${householdId}`);
  } catch (profileError) {
    console.error('⚠️ [setup-home] Home profile extras failed (non-critical):', profileError);
    // Continue — address is already saved, AI can still generate from address alone
  }

  // STEP 3: Trigger AI maintenance schedule generation (non-critical)
  try {
    await generateMaintenanceSchedule({
      householdId,
      address: streetAddress,
      city,
      state: state.toUpperCase(),
      zip,
      yearBuilt: yearBuilt || undefined,
      squareFootage: sqft || undefined,
      homeType: homeType || undefined,
      hvacType: hvacType || undefined,
      appliances: [
        ...(hasPool ? ['pool'] : []),
        ...(garage ? ['garage'] : []),
      ],
    });
    console.log(`✅ [setup-home] AI schedule generation triggered for household ${householdId}`);
  } catch (aiError) {
    console.error('⚠️ [setup-home] AI schedule generation failed (non-critical):', aiError);
  }

  return res.json({ success: true });
});

export default router;
