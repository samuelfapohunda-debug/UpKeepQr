import { Router, Request, Response } from 'express';
import { db } from '../../db';
import { 
  maintenanceLogsTable, 
  householdAppliancesTable,
  insertMaintenanceLogSchema,
  updateMaintenanceLogSchema,
  maintenanceLogFiltersSchema
} from '@shared/schema';
import { eq, and, desc, asc, gte, lte, sql } from 'drizzle-orm';
import { getUserFromAuth } from '../../middleware/auth';

const router = Router();

router.post('/households/:householdId/maintenance-logs', async (req: Request, res: Response) => {
  try {
    const { householdId } = req.params;
    const authUser = await getUserFromAuth(req);
    
    if (!authUser) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const validated = insertMaintenanceLogSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({ error: 'Invalid data', details: validated.error.errors });
    }
    
    const data = validated.data;
    
    const maintenanceDate = new Date(data.maintenanceDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (maintenanceDate > today) {
      return res.status(400).json({ error: 'Maintenance date cannot be in the future' });
    }
    
    if (data.applianceId) {
      const [appliance] = await db.select()
        .from(householdAppliancesTable)
        .where(and(
          eq(householdAppliancesTable.id, data.applianceId),
          eq(householdAppliancesTable.householdId, householdId)
        ))
        .limit(1);
      
      if (!appliance) {
        return res.status(400).json({ error: 'Appliance not found in this household' });
      }
    }
    
    const insertData: Parameters<typeof maintenanceLogsTable.$inferInsert> = {
      householdId,
      taskAssignmentId: data.taskAssignmentId || null,
      applianceId: data.applianceId || null,
      maintenanceDate: new Date(data.maintenanceDate),
      taskPerformed: data.taskPerformed,
      logType: data.logType,
      cost: data.cost ? String(data.cost) : null,
      serviceProvider: data.serviceProvider || null,
      partsReplaced: data.partsReplaced || null,
      notes: data.notes || null,
      createdBy: authUser?.role === 'admin' ? 'admin' : 'customer',
      createdByUserId: authUser?.id || null,
    };
    
    const [log] = await db.insert(maintenanceLogsTable).values(insertData as typeof maintenanceLogsTable.$inferInsert).returning();
    
    console.log(`Created maintenance log ${log.id} for household ${householdId}`);
    res.status(201).json(log);
  } catch (error) {
    console.error('Error creating maintenance log:', error);
    res.status(500).json({ error: 'Failed to create maintenance log' });
  }
});

router.get('/households/:householdId/maintenance-logs', async (req: Request, res: Response) => {
  try {
    const { householdId } = req.params;
    const authUser = await getUserFromAuth(req);
    
    if (!authUser) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const filters = maintenanceLogFiltersSchema.parse({
      startDate: req.query.start_date,
      endDate: req.query.end_date,
      applianceId: req.query.appliance_id,
      logType: req.query.log_type,
      page: req.query.page ? Number(req.query.page) : 1,
      pageSize: req.query.page_size ? Number(req.query.page_size) : 25,
      sortBy: req.query.sort_by || 'maintenanceDate',
      sortDir: req.query.sort_dir || 'desc',
    });
    
    const conditions = [eq(maintenanceLogsTable.householdId, householdId)];
    
    if (filters.startDate) {
      conditions.push(gte(maintenanceLogsTable.maintenanceDate, new Date(filters.startDate)));
    }
    if (filters.endDate) {
      conditions.push(lte(maintenanceLogsTable.maintenanceDate, new Date(filters.endDate)));
    }
    if (filters.applianceId) {
      conditions.push(eq(maintenanceLogsTable.applianceId, filters.applianceId));
    }
    if (filters.logType) {
      conditions.push(eq(maintenanceLogsTable.logType, filters.logType));
    }
    
    const offset = (filters.page - 1) * filters.pageSize;
    
    const orderByColumn = filters.sortBy === 'maintenanceDate' 
      ? maintenanceLogsTable.maintenanceDate 
      : filters.sortBy === 'cost' 
        ? maintenanceLogsTable.cost 
        : maintenanceLogsTable.createdAt;
    
    const orderDir = filters.sortDir === 'asc' ? asc : desc;
    
    const logs = await db.select()
      .from(maintenanceLogsTable)
      .leftJoin(householdAppliancesTable, eq(maintenanceLogsTable.applianceId, householdAppliancesTable.id))
      .where(and(...conditions))
      .orderBy(orderDir(orderByColumn))
      .limit(filters.pageSize)
      .offset(offset);
    
    const [countResult] = await db.select({ count: sql<number>`count(*)` })
      .from(maintenanceLogsTable)
      .where(and(...conditions));
    
    const totalLogs = Number(countResult?.count || 0);
    
    const [summaryResult] = await db.select({
      totalCost: sql<string>`COALESCE(SUM(CAST(${maintenanceLogsTable.cost} AS DECIMAL)), 0)`,
      scheduledCount: sql<number>`COUNT(*) FILTER (WHERE ${maintenanceLogsTable.logType} = 'scheduled')`,
      manualCount: sql<number>`COUNT(*) FILTER (WHERE ${maintenanceLogsTable.logType} = 'manual')`,
      emergencyCount: sql<number>`COUNT(*) FILTER (WHERE ${maintenanceLogsTable.logType} = 'emergency')`,
      onTimeCount: sql<number>`COUNT(*) FILTER (WHERE ${maintenanceLogsTable.wasOnTime} = true)`,
      lateCount: sql<number>`COUNT(*) FILTER (WHERE ${maintenanceLogsTable.wasOnTime} = false)`,
    }).from(maintenanceLogsTable).where(and(...conditions));
    
    const enrichedLogs = logs.map(row => ({
      ...row.maintenance_logs,
      applianceType: row.household_appliances?.applianceType || null,
      applianceLocation: row.household_appliances?.location || null,
      applianceBrand: row.household_appliances?.brand || null,
    }));
    
    const scheduledTotal = Number(summaryResult?.scheduledCount || 0);
    const onTimeTotal = Number(summaryResult?.onTimeCount || 0);
    
    res.json({
      logs: enrichedLogs,
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        totalLogs,
        totalPages: Math.ceil(totalLogs / filters.pageSize)
      },
      summary: {
        totalCost: parseFloat(summaryResult?.totalCost || '0'),
        scheduledCount: Number(summaryResult?.scheduledCount || 0),
        manualCount: Number(summaryResult?.manualCount || 0),
        emergencyCount: Number(summaryResult?.emergencyCount || 0),
        onTimeCompletionRate: scheduledTotal > 0 ? onTimeTotal / scheduledTotal : 0
      }
    });
  } catch (error) {
    console.error('Error fetching maintenance logs:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance logs' });
  }
});

router.get('/households/:householdId/maintenance-logs/:logId', async (req: Request, res: Response) => {
  try {
    const { householdId, logId } = req.params;
    const authUser = await getUserFromAuth(req);
    
    if (!authUser) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const [result] = await db.select()
      .from(maintenanceLogsTable)
      .leftJoin(householdAppliancesTable, eq(maintenanceLogsTable.applianceId, householdAppliancesTable.id))
      .where(and(
        eq(maintenanceLogsTable.id, logId),
        eq(maintenanceLogsTable.householdId, householdId)
      ))
      .limit(1);
    
    if (!result) {
      return res.status(404).json({ error: 'Maintenance log not found' });
    }
    
    res.json({
      ...result.maintenance_logs,
      applianceDetails: result.household_appliances ? {
        applianceType: result.household_appliances.applianceType,
        brand: result.household_appliances.brand,
        modelNumber: result.household_appliances.modelNumber,
        location: result.household_appliances.location
      } : null
    });
  } catch (error) {
    console.error('Error fetching maintenance log:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance log' });
  }
});

router.patch('/households/:householdId/maintenance-logs/:logId', async (req: Request, res: Response) => {
  try {
    const { householdId, logId } = req.params;
    const authUser = await getUserFromAuth(req);
    
    if (!authUser) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const validated = updateMaintenanceLogSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({ error: 'Invalid data', details: validated.error.errors });
    }
    
    const data = validated.data;
    
    const [existing] = await db.select()
      .from(maintenanceLogsTable)
      .where(and(
        eq(maintenanceLogsTable.id, logId),
        eq(maintenanceLogsTable.householdId, householdId)
      ))
      .limit(1);
    
    if (!existing) {
      return res.status(404).json({ error: 'Maintenance log not found' });
    }
    
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    
    if (data.maintenanceDate) updateData.maintenanceDate = new Date(data.maintenanceDate);
    if (data.taskPerformed) updateData.taskPerformed = data.taskPerformed;
    if (data.logType) updateData.logType = data.logType;
    if (data.cost !== undefined) updateData.cost = data.cost ? String(data.cost) : null;
    if (data.serviceProvider !== undefined) updateData.serviceProvider = data.serviceProvider || null;
    if (data.partsReplaced !== undefined) updateData.partsReplaced = data.partsReplaced || null;
    if (data.notes !== undefined) updateData.notes = data.notes || null;
    if (data.applianceId !== undefined) updateData.applianceId = data.applianceId || null;
    
    const [updated] = await db.update(maintenanceLogsTable)
      .set(updateData)
      .where(eq(maintenanceLogsTable.id, logId))
      .returning();
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating maintenance log:', error);
    res.status(500).json({ error: 'Failed to update maintenance log' });
  }
});

router.delete('/households/:householdId/maintenance-logs/:logId', async (req: Request, res: Response) => {
  try {
    const { householdId, logId } = req.params;
    const authUser = await getUserFromAuth(req);
    
    if (!authUser) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const [existing] = await db.select()
      .from(maintenanceLogsTable)
      .where(and(
        eq(maintenanceLogsTable.id, logId),
        eq(maintenanceLogsTable.householdId, householdId)
      ))
      .limit(1);
    
    if (!existing) {
      return res.status(404).json({ error: 'Maintenance log not found' });
    }
    
    if (existing.logType === 'scheduled' && existing.taskAssignmentId) {
      return res.status(400).json({ error: 'Cannot delete logs auto-generated from scheduled tasks' });
    }
    
    await db.delete(maintenanceLogsTable)
      .where(eq(maintenanceLogsTable.id, logId));
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting maintenance log:', error);
    res.status(500).json({ error: 'Failed to delete maintenance log' });
  }
});

export default router;
