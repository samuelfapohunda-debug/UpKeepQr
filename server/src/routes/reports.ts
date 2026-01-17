import { Router, Request, Response } from 'express';
import { db } from '../../db';
import { 
  maintenanceLogsTable, 
  householdAppliancesTable,
  householdsTable,
  householdTaskAssignmentsTable
} from '@shared/schema';
import { eq, and, desc, asc, gte, lte, sql, isNull, not } from 'drizzle-orm';
import { getUserFromAuth } from '../../middleware/auth';

const router = Router();

function calculateWarrantyDaysRemaining(warrantyExpiration: Date | null): number | null {
  if (!warrantyExpiration) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(warrantyExpiration);
  expDate.setHours(0, 0, 0, 0);
  const diffTime = expDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

router.get('/households/:householdId/reports/maintenance-history', async (req: Request, res: Response) => {
  try {
    const { householdId } = req.params;
    const authUser = await getUserFromAuth(req);
    
    if (!authUser) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { start_date, end_date, appliance_id } = req.query;
    
    const [household] = await db.select()
      .from(householdsTable)
      .where(eq(householdsTable.id, householdId))
      .limit(1);
    
    if (!household) {
      return res.status(404).json({ error: 'Household not found' });
    }
    
    const conditions = [eq(maintenanceLogsTable.householdId, householdId)];
    
    const startDate = start_date ? new Date(start_date as string) : new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    const endDate = end_date ? new Date(end_date as string) : new Date();
    
    conditions.push(gte(maintenanceLogsTable.maintenanceDate, startDate));
    conditions.push(lte(maintenanceLogsTable.maintenanceDate, endDate));
    
    if (appliance_id && typeof appliance_id === 'string') {
      conditions.push(eq(maintenanceLogsTable.applianceId, appliance_id));
    }
    
    const logs = await db.select()
      .from(maintenanceLogsTable)
      .leftJoin(householdAppliancesTable, eq(maintenanceLogsTable.applianceId, householdAppliancesTable.id))
      .where(and(...conditions))
      .orderBy(desc(maintenanceLogsTable.maintenanceDate));
    
    let totalCost = 0;
    let scheduledCount = 0;
    let manualCount = 0;
    let emergencyCount = 0;
    let onTimeCount = 0;
    let lateCount = 0;
    const applianceMap = new Map<string, { 
      applianceId: string;
      applianceType: string;
      location: string | null;
      maintenanceCount: number;
      totalCost: number;
      lastMaintenanceDate: Date | null;
    }>();
    const monthlyData = new Map<string, { totalCost: number; eventCount: number }>();
    
    for (const row of logs) {
      const log = row.maintenance_logs;
      const appliance = row.household_appliances;
      
      const cost = parseFloat(log.cost || '0');
      totalCost += cost;
      
      if (log.logType === 'scheduled') scheduledCount++;
      else if (log.logType === 'manual') manualCount++;
      else if (log.logType === 'emergency') emergencyCount++;
      
      if (log.wasOnTime === true) onTimeCount++;
      else if (log.wasOnTime === false) lateCount++;
      
      if (appliance && log.applianceId) {
        if (!applianceMap.has(log.applianceId)) {
          applianceMap.set(log.applianceId, {
            applianceId: log.applianceId,
            applianceType: appliance.applianceType,
            location: appliance.location,
            maintenanceCount: 0,
            totalCost: 0,
            lastMaintenanceDate: null
          });
        }
        const appData = applianceMap.get(log.applianceId)!;
        appData.maintenanceCount++;
        appData.totalCost += cost;
        if (!appData.lastMaintenanceDate || log.maintenanceDate > appData.lastMaintenanceDate) {
          appData.lastMaintenanceDate = log.maintenanceDate;
        }
      }
      
      const monthKey = log.maintenanceDate.toISOString().substring(0, 7);
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { totalCost: 0, eventCount: 0 });
      }
      const monthData = monthlyData.get(monthKey)!;
      monthData.totalCost += cost;
      monthData.eventCount++;
    }
    
    const totalEvents = logs.length;
    const scheduledTotal = scheduledCount;
    const skippedCount = 0;
    
    const costTrend = Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        totalCost: data.totalCost,
        eventCount: data.eventCount
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
    
    const byAppliance = Array.from(applianceMap.values());
    
    const formattedLogs = logs.map(row => ({
      date: row.maintenance_logs.maintenanceDate,
      applianceType: row.household_appliances?.applianceType || null,
      task: row.maintenance_logs.taskPerformed,
      cost: parseFloat(row.maintenance_logs.cost || '0'),
      wasOnTime: row.maintenance_logs.wasOnTime,
      logType: row.maintenance_logs.logType
    }));
    
    res.json({
      household: {
        id: household.id,
        name: household.name,
        address: `${household.addressLine1 || ''}, ${household.city || ''}, ${household.state || ''} ${household.zipcode || ''}`
      },
      reportPeriod: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      },
      summary: {
        totalMaintenanceEvents: totalEvents,
        scheduledTasksCompleted: scheduledCount,
        manualLogsAdded: manualCount,
        emergencyEvents: emergencyCount,
        totalCost,
        averageCostPerEvent: totalEvents > 0 ? totalCost / totalEvents : 0,
        onTimeCompletionRate: scheduledTotal > 0 ? onTimeCount / scheduledTotal : 0,
        appliancesServiced: applianceMap.size
      },
      byAppliance,
      costTrend,
      compliance: {
        scheduledTasksTotal: scheduledTotal + skippedCount,
        completedOnTime: onTimeCount,
        completedLate: lateCount,
        skipped: skippedCount,
        complianceRate: (scheduledTotal + skippedCount) > 0 
          ? onTimeCount / (scheduledTotal + skippedCount) 
          : 0
      },
      logs: formattedLogs,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating maintenance history report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

router.get('/households/:householdId/reports/warranty-status', async (req: Request, res: Response) => {
  try {
    const { householdId } = req.params;
    const authUser = await getUserFromAuth(req);
    
    if (!authUser) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const appliances = await db.select()
      .from(householdAppliancesTable)
      .where(and(
        eq(householdAppliancesTable.householdId, householdId),
        eq(householdAppliancesTable.isActive, true)
      ))
      .orderBy(asc(householdAppliancesTable.warrantyExpiration));
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fourteenDaysFromNow = new Date(today.getTime() + (14 * 24 * 60 * 60 * 1000));
    
    const underWarranty: typeof appliances = [];
    const expired: typeof appliances = [];
    const expiringSoon: typeof appliances = [];
    const noWarranty: typeof appliances = [];
    
    for (const appliance of appliances) {
      if (!appliance.warrantyExpiration) {
        noWarranty.push(appliance);
      } else {
        const expDate = new Date(appliance.warrantyExpiration);
        expDate.setHours(0, 0, 0, 0);
        
        if (expDate < today) {
          expired.push(appliance);
        } else if (expDate <= fourteenDaysFromNow) {
          expiringSoon.push(appliance);
        } else {
          underWarranty.push(appliance);
        }
      }
    }
    
    res.json({
      summary: {
        totalAppliances: appliances.length,
        underWarranty: underWarranty.length,
        warrantyExpired: expired.length,
        noWarranty: noWarranty.length,
        expiringSoon14Days: expiringSoon.length
      },
      expiringSoon: expiringSoon.map(a => ({
        applianceId: a.id,
        applianceType: a.applianceType,
        brand: a.brand,
        warrantyExpiration: a.warrantyExpiration,
        daysRemaining: calculateWarrantyDaysRemaining(a.warrantyExpiration),
        warrantyProvider: a.warrantyProvider
      })),
      underWarranty: underWarranty.map(a => ({
        applianceId: a.id,
        applianceType: a.applianceType,
        brand: a.brand,
        warrantyExpiration: a.warrantyExpiration,
        daysRemaining: calculateWarrantyDaysRemaining(a.warrantyExpiration)
      })),
      expired: expired.map(a => ({
        applianceId: a.id,
        applianceType: a.applianceType,
        brand: a.brand,
        warrantyExpiration: a.warrantyExpiration,
        daysExpired: -(calculateWarrantyDaysRemaining(a.warrantyExpiration) || 0)
      }))
    });
  } catch (error) {
    console.error('Error generating warranty status report:', error);
    res.status(500).json({ error: 'Failed to generate warranty status report' });
  }
});

export default router;
