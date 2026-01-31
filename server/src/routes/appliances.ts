import { Router, Request, Response } from 'express';
import { db } from '../../db';
import { 
  householdAppliancesTable, 
  commonAppliancesTable,
  warrantyNotificationsTable,
  insertHouseholdApplianceSchema,
  updateHouseholdApplianceSchema,
  HouseholdAppliance
} from '@shared/schema';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { requireSessionAuth, requireSessionOrAdminAuth, SessionAuthRequest, validateHouseholdAccess } from '../../middleware/sessionAuth';

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

function isWarrantyExpiringSoon(warrantyExpiration: Date | null, daysThreshold: number = 14): boolean {
  const daysRemaining = calculateWarrantyDaysRemaining(warrantyExpiration);
  if (daysRemaining === null) return false;
  return daysRemaining > 0 && daysRemaining <= daysThreshold;
}

router.get('/common-appliances', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    
    let query = db.select().from(commonAppliancesTable);
    
    if (category && typeof category === 'string') {
      query = query.where(eq(commonAppliancesTable.category, category)) as typeof query;
    }
    
    const appliances = await query.orderBy(asc(commonAppliancesTable.category), asc(commonAppliancesTable.applianceType));
    
    res.json({ appliances });
  } catch (error) {
    console.error('Error fetching common appliances:', error);
    res.status(500).json({ error: 'Failed to fetch common appliances' });
  }
});

router.post('/households/:householdId/appliances', requireSessionOrAdminAuth, validateHouseholdAccess, async (req: SessionAuthRequest, res: Response) => {
  try {
    const { householdId } = req.params;
    // Auth handled by middleware
    
    const validated = insertHouseholdApplianceSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({ error: 'Invalid data', details: validated.error.errors });
    }
    
    const data = validated.data;
    
    const existingAppliance = await db.select()
      .from(householdAppliancesTable)
      .where(eq(householdAppliancesTable.serialNumber, data.serialNumber))
      .limit(1);
    
    if (existingAppliance.length > 0) {
      return res.status(400).json({ error: 'Serial number already exists in system' });
    }
    
    const purchaseDate = new Date(data.purchaseDate);
    if (purchaseDate > new Date()) {
      return res.status(400).json({ error: 'Purchase date cannot be in the future' });
    }
    
    if (data.warrantyExpiration) {
      const warrantyDate = new Date(data.warrantyExpiration);
      if (warrantyDate <= purchaseDate) {
        return res.status(400).json({ error: 'Warranty expiration must be after purchase date' });
      }
    }
    
    const [appliance] = await db.insert(householdAppliancesTable).values({
      householdId,
      applianceType: data.applianceType,
      brand: data.brand,
      modelNumber: data.modelNumber,
      serialNumber: data.serialNumber,
      purchaseDate: new Date(data.purchaseDate),
      purchasePrice: data.purchasePrice ? String(data.purchasePrice) : null,
      installationDate: data.installationDate ? new Date(data.installationDate) : null,
      location: data.location || null,
      notes: data.notes || null,
      warrantyType: data.warrantyType || null,
      warrantyExpiration: data.warrantyExpiration ? new Date(data.warrantyExpiration) : null,
      warrantyProvider: data.warrantyProvider || null,
      warrantyPolicyNumber: data.warrantyPolicyNumber || null,
      warrantyCoverageDetails: data.warrantyCoverageDetails || null,
      createdBy: 'customer',
      createdByUserId: null,
    }).returning();
    
    console.log(`Created appliance ${appliance.id} for household ${householdId}`);
    res.status(201).json(appliance);
  } catch (error) {
    console.error('Error creating appliance:', error);
    res.status(500).json({ error: 'Failed to create appliance' });
  }
});

router.get('/households/:householdId/appliances', requireSessionOrAdminAuth, validateHouseholdAccess, async (req: SessionAuthRequest, res: Response) => {
  try {
    const { householdId } = req.params;
    // Auth handled by middleware
    
    const { is_active, appliance_type } = req.query;
    
    const isActiveFilter = is_active === 'false' ? false : true;
    
    const conditions = [
      eq(householdAppliancesTable.householdId, householdId),
      eq(householdAppliancesTable.isActive, isActiveFilter)
    ];
    
    if (appliance_type && typeof appliance_type === 'string') {
      conditions.push(eq(householdAppliancesTable.applianceType, appliance_type));
    }
    
    const appliances = await db.select()
      .from(householdAppliancesTable)
      .where(and(...conditions))
      .orderBy(desc(householdAppliancesTable.createdAt));
    
    const enrichedAppliances = appliances.map(a => ({
      ...a,
      warrantyDaysRemaining: calculateWarrantyDaysRemaining(a.warrantyExpiration),
      isWarrantyExpiringSoon: isWarrantyExpiringSoon(a.warrantyExpiration)
    }));
    
    const warrantiesExpiringSoon = enrichedAppliances.filter(a => a.isWarrantyExpiringSoon).length;
    
    res.json({
      appliances: enrichedAppliances,
      total: enrichedAppliances.length,
      warrantiesExpiringSoon
    });
  } catch (error) {
    console.error('Error fetching appliances:', error);
    res.status(500).json({ error: 'Failed to fetch appliances' });
  }
});

router.get('/households/:householdId/appliances/:applianceId', requireSessionOrAdminAuth, validateHouseholdAccess, async (req: SessionAuthRequest, res: Response) => {
  try {
    const { householdId, applianceId } = req.params;
    // Auth handled by middleware
    
    const [appliance] = await db.select()
      .from(householdAppliancesTable)
      .where(and(
        eq(householdAppliancesTable.id, applianceId),
        eq(householdAppliancesTable.householdId, householdId)
      ))
      .limit(1);
    
    if (!appliance) {
      return res.status(404).json({ error: 'Appliance not found' });
    }
    
    res.json({
      ...appliance,
      warrantyDaysRemaining: calculateWarrantyDaysRemaining(appliance.warrantyExpiration),
      isWarrantyExpiringSoon: isWarrantyExpiringSoon(appliance.warrantyExpiration)
    });
  } catch (error) {
    console.error('Error fetching appliance:', error);
    res.status(500).json({ error: 'Failed to fetch appliance' });
  }
});

router.patch('/households/:householdId/appliances/:applianceId', requireSessionOrAdminAuth, validateHouseholdAccess, async (req: SessionAuthRequest, res: Response) => {
  try {
    const { householdId, applianceId } = req.params;
    // Auth handled by middleware
    
    const validated = updateHouseholdApplianceSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({ error: 'Invalid data', details: validated.error.errors });
    }
    
    const data = validated.data;
    
    const [existing] = await db.select()
      .from(householdAppliancesTable)
      .where(and(
        eq(householdAppliancesTable.id, applianceId),
        eq(householdAppliancesTable.householdId, householdId)
      ))
      .limit(1);
    
    if (!existing) {
      return res.status(404).json({ error: 'Appliance not found' });
    }
    
    if (data.serialNumber && data.serialNumber !== existing.serialNumber) {
      const conflict = await db.select()
        .from(householdAppliancesTable)
        .where(eq(householdAppliancesTable.serialNumber, data.serialNumber))
        .limit(1);
      
      if (conflict.length > 0) {
        return res.status(400).json({ error: 'Serial number already exists in system' });
      }
    }
    
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    
    if (data.applianceType) updateData.applianceType = data.applianceType;
    if (data.brand) updateData.brand = data.brand;
    if (data.modelNumber) updateData.modelNumber = data.modelNumber;
    if (data.serialNumber) updateData.serialNumber = data.serialNumber;
    if (data.purchaseDate) updateData.purchaseDate = new Date(data.purchaseDate);
    if (data.purchasePrice !== undefined) updateData.purchasePrice = data.purchasePrice ? String(data.purchasePrice) : null;
    if (data.installationDate) updateData.installationDate = new Date(data.installationDate);
    if (data.location !== undefined) updateData.location = data.location || null;
    if (data.notes !== undefined) updateData.notes = data.notes || null;
    if (data.warrantyType !== undefined) updateData.warrantyType = data.warrantyType || null;
    if (data.warrantyExpiration) updateData.warrantyExpiration = new Date(data.warrantyExpiration);
    if (data.warrantyProvider !== undefined) updateData.warrantyProvider = data.warrantyProvider || null;
    if (data.warrantyPolicyNumber !== undefined) updateData.warrantyPolicyNumber = data.warrantyPolicyNumber || null;
    if (data.warrantyCoverageDetails !== undefined) updateData.warrantyCoverageDetails = data.warrantyCoverageDetails || null;
    
    const [updated] = await db.update(householdAppliancesTable)
      .set(updateData)
      .where(eq(householdAppliancesTable.id, applianceId))
      .returning();
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating appliance:', error);
    res.status(500).json({ error: 'Failed to update appliance' });
  }
});

router.delete('/households/:householdId/appliances/:applianceId', requireSessionOrAdminAuth, validateHouseholdAccess, async (req: SessionAuthRequest, res: Response) => {
  try {
    const { householdId, applianceId } = req.params;
    // Auth handled by middleware
    
    const [existing] = await db.select()
      .from(householdAppliancesTable)
      .where(and(
        eq(householdAppliancesTable.id, applianceId),
        eq(householdAppliancesTable.householdId, householdId)
      ))
      .limit(1);
    
    if (!existing) {
      return res.status(404).json({ error: 'Appliance not found' });
    }
    
    await db.update(householdAppliancesTable)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(householdAppliancesTable.id, applianceId));
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting appliance:', error);
    res.status(500).json({ error: 'Failed to delete appliance' });
  }
});

router.get('/households/:householdId/warranty-notifications', requireSessionOrAdminAuth, validateHouseholdAccess, async (req: SessionAuthRequest, res: Response) => {
  try {
    const { householdId } = req.params;
    
    const notifications = await db
      .select({
        notification: warrantyNotificationsTable,
        appliance: {
          id: householdAppliancesTable.id,
          applianceType: householdAppliancesTable.applianceType,
          brand: householdAppliancesTable.brand,
          modelNumber: householdAppliancesTable.modelNumber,
          warrantyExpiration: householdAppliancesTable.warrantyExpiration
        }
      })
      .from(warrantyNotificationsTable)
      .leftJoin(
        householdAppliancesTable,
        eq(warrantyNotificationsTable.householdApplianceId, householdAppliancesTable.id)
      )
      .where(eq(warrantyNotificationsTable.householdId, householdId))
      .orderBy(desc(warrantyNotificationsTable.createdAt));
    
    res.json({ notifications });
  } catch (error) {
    console.error('Error fetching warranty notifications:', error);
    res.status(500).json({ error: 'Failed to fetch warranty notifications' });
  }
});

export default router;
