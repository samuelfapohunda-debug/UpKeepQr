import { Router, Response } from 'express';
import Papa from 'papaparse';
import { db } from '../../db';
import { managedPropertiesTable, bulkUploadJobsTable } from '@shared/schema';
import { eq, and, count } from 'drizzle-orm';
import { requireSessionAuth, SessionAuthRequest } from '../../middleware/sessionAuth';
import { lookupProperty } from '../../services/attomService.js';
import { generateMaintenanceSchedule } from '../../services/homeResearchAgent.js';

const router = Router();
const MAX_PROPERTIES = 200;

// ── helpers ────────────────────────────────────────────────────────────────

async function getPortfolioCount(householdId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(managedPropertiesTable)
    .where(eq(managedPropertiesTable.portfolioHouseholdId, householdId));
  return Number(row?.value ?? 0);
}

// Fire-and-forget: ATTOM enrich + schedule generation
async function enrichAndSchedule(
  propertyId: string,
  householdId: string,
  property: { address: string; city: string; state: string; zip: string; yearBuilt?: number | null; squareFootage?: number | null; propertyType?: string | null; hvacType?: string | null },
) {
  try {
    const attom = await lookupProperty(
      property.address,
      `${property.city} ${property.state} ${property.zip}`,
    );

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (attom) {
      if (attom.yearBuilt)     updates.yearBuilt     = attom.yearBuilt;
      if (attom.squareFootage) updates.squareFootage  = attom.squareFootage;
      if (attom.hvacType)      updates.hvacType       = attom.hvacType;
      if (attom.homeType)      updates.propertyType   = attom.homeType;
    }
    await db.update(managedPropertiesTable).set(updates)
      .where(eq(managedPropertiesTable.id, propertyId));

    const tasks = await generateMaintenanceSchedule({
      householdId,
      address:       property.address,
      city:          property.city,
      state:         property.state,
      zip:           property.zip,
      yearBuilt:     attom?.yearBuilt     ?? property.yearBuilt     ?? undefined,
      squareFootage: attom?.squareFootage ?? property.squareFootage ?? undefined,
      homeType:      (attom?.homeType  ?? property.propertyType) as Parameters<typeof generateMaintenanceSchedule>[0]['homeType'],
      hvacType:      (attom?.hvacType  ?? property.hvacType)     as Parameters<typeof generateMaintenanceSchedule>[0]['hvacType'],
      appliances: [],
    });

    await db.update(managedPropertiesTable)
      .set({ scheduleGenerated: true, updatedAt: new Date() })
      .where(eq(managedPropertiesTable.id, propertyId));

    console.log(`[Portfolio] Enriched + scheduled property ${propertyId}: ${tasks.length} tasks`);
  } catch (err) {
    console.error(`[Portfolio] enrichAndSchedule failed for ${propertyId}:`, err);
  }
}

// ── POST /properties ────────────────────────────────────────────────────────
router.post('/properties', requireSessionAuth, async (req: SessionAuthRequest, res: Response) => {
  const householdId = req.sessionHouseholdId!;
  const { propertyName, address, city, state, zip, unitNumber, propertyType,
          yearBuilt, squareFootage, hvacType } = req.body;

  if (!propertyName || !address || !city || !state || !zip) {
    return res.status(400).json({ error: 'propertyName, address, city, state, zip are required' });
  }

  const currentCount = await getPortfolioCount(householdId);
  if (currentCount >= MAX_PROPERTIES) {
    return res.status(403).json({ error: `Portfolio limit of ${MAX_PROPERTIES} properties reached` });
  }

  const [property] = await db.insert(managedPropertiesTable).values({
    portfolioHouseholdId: householdId,
    propertyName,
    address,
    city,
    state,
    zip,
    unitNumber:       unitNumber       ?? null,
    propertyType:     propertyType     ?? 'single_family',
    yearBuilt:        yearBuilt        ?? null,
    squareFootage:    squareFootage    ?? null,
    hvacType:         hvacType         ?? null,
    activationStatus: 'pending',
    scheduleGenerated: false,
  }).returning();

  // Fire-and-forget — does not block response
  enrichAndSchedule(property.id, householdId, property).catch(() => {});

  res.status(201).json(property);
});

// ── GET /properties ─────────────────────────────────────────────────────────
router.get('/properties', requireSessionAuth, async (req: SessionAuthRequest, res: Response) => {
  const householdId = req.sessionHouseholdId!;

  const properties = await db
    .select()
    .from(managedPropertiesTable)
    .where(eq(managedPropertiesTable.portfolioHouseholdId, householdId))
    .orderBy(managedPropertiesTable.createdAt);

  res.json(properties);
});

// ── GET /properties/:id ─────────────────────────────────────────────────────
router.get('/properties/:id', requireSessionAuth, async (req: SessionAuthRequest, res: Response) => {
  const householdId = req.sessionHouseholdId!;

  const [property] = await db
    .select()
    .from(managedPropertiesTable)
    .where(and(
      eq(managedPropertiesTable.id, req.params.id as string),
      eq(managedPropertiesTable.portfolioHouseholdId, householdId),
    ));

  if (!property) return res.status(404).json({ error: 'Property not found' });
  res.json(property);
});

// ── PATCH /properties/:id ───────────────────────────────────────────────────
router.patch('/properties/:id', requireSessionAuth, async (req: SessionAuthRequest, res: Response) => {
  const householdId = req.sessionHouseholdId!;

  const allowed = ['propertyName', 'address', 'city', 'state', 'zip', 'unitNumber',
                   'propertyType', 'yearBuilt', 'squareFootage', 'hvacType', 'activationStatus'] as const;
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const [updated] = await db
    .update(managedPropertiesTable)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .set(updates as any)
    .where(and(
      eq(managedPropertiesTable.id, req.params.id as string),
      eq(managedPropertiesTable.portfolioHouseholdId, householdId),
    ))
    .returning();

  if (!updated) return res.status(404).json({ error: 'Property not found' });
  res.json(updated);
});

// ── DELETE /properties/:id ──────────────────────────────────────────────────
router.delete('/properties/:id', requireSessionAuth, async (req: SessionAuthRequest, res: Response) => {
  const householdId = req.sessionHouseholdId!;

  const [deleted] = await db
    .delete(managedPropertiesTable)
    .where(and(
      eq(managedPropertiesTable.id, req.params.id as string),
      eq(managedPropertiesTable.portfolioHouseholdId, householdId),
    ))
    .returning();

  if (!deleted) return res.status(404).json({ error: 'Property not found' });
  res.status(204).send();
});

// ── POST /bulk-upload ───────────────────────────────────────────────────────
// Body: { csv: "<raw CSV string>" }
// Required columns: property_name, address, city, state, zip
// Optional columns: unit_number, property_type
router.post('/bulk-upload', requireSessionAuth, async (req: SessionAuthRequest, res: Response) => {
  const householdId = req.sessionHouseholdId!;
  const { csv } = req.body;

  if (!csv || typeof csv !== 'string') {
    return res.status(400).json({ error: 'csv field (string) is required' });
  }

  const parsed = Papa.parse<Record<string, string>>(csv.trim(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '_'),
  });

  const rows = parsed.data;
  if (rows.length === 0) {
    return res.status(400).json({ error: 'CSV contains no data rows' });
  }

  const currentCount = await getPortfolioCount(householdId);
  if (currentCount + rows.length > MAX_PROPERTIES) {
    return res.status(403).json({
      error: `Upload would exceed the ${MAX_PROPERTIES} property limit. Current: ${currentCount}, uploading: ${rows.length}`,
    });
  }

  const [job] = await db.insert(bulkUploadJobsTable).values({
    portfolioHouseholdId: householdId,
    totalProperties: rows.length,
    processed: 0,
    successful: 0,
    failed: 0,
    status: 'processing',
  }).returning();

  // Process in background — response returns immediately with jobId
  (async () => {
    const BATCH_SIZE = 5;
    const BATCH_DELAY_MS = 1000;
    let successful = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);

      await Promise.all(batch.map(async (row, batchIdx) => {
        const rowNum = i + batchIdx + 1;
        const propertyName = row.property_name?.trim();
        const address      = row.address?.trim();
        const city         = row.city?.trim();
        const state        = row.state?.trim();
        const zip          = row.zip?.trim();

        if (!propertyName || !address || !city || !state || !zip) {
          errors.push(`Row ${rowNum}: missing required field(s) (property_name, address, city, state, zip)`);
          failed++;
          return;
        }

        try {
          const [property] = await db.insert(managedPropertiesTable).values({
            portfolioHouseholdId: householdId,
            propertyName,
            address,
            city,
            state,
            zip,
            unitNumber:       row.unit_number?.trim()   || null,
            propertyType:     row.property_type?.trim() || 'single_family',
            activationStatus: 'pending',
            scheduleGenerated: false,
          }).returning();

          enrichAndSchedule(property.id, householdId, property).catch(() => {});
          successful++;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push(`Row ${rowNum}: ${msg}`);
          failed++;
        }
      }));

      await db.update(bulkUploadJobsTable)
        .set({ processed: i + batch.length, successful, failed })
        .where(eq(bulkUploadJobsTable.id, job.id));

      // Rate-limit delay between batches (skip after final batch)
      if (i + BATCH_SIZE < rows.length) {
        await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
      }
    }

    await db.update(bulkUploadJobsTable).set({
      status:      failed === rows.length ? 'failed' : 'completed',
      processed:   rows.length,
      successful,
      failed,
      errorLog:    errors.length > 0 ? errors.join('\n') : null,
      completedAt: new Date(),
    }).where(eq(bulkUploadJobsTable.id, job.id));

    console.log(`[Portfolio] Bulk upload job ${job.id} complete: ${successful} ok, ${failed} failed`);
  })().catch(async (err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Portfolio] Bulk upload job ${job.id} crashed:`, err);
    await db.update(bulkUploadJobsTable)
      .set({ status: 'failed', errorLog: msg, completedAt: new Date() })
      .where(eq(bulkUploadJobsTable.id, job.id));
  });

  res.status(202).json({ jobId: job.id, totalProperties: rows.length, status: 'processing' });
});

// ── GET /bulk-upload/:jobId ─────────────────────────────────────────────────
router.get('/bulk-upload/:jobId', requireSessionAuth, async (req: SessionAuthRequest, res: Response) => {
  const householdId = req.sessionHouseholdId!;
  const jobId = parseInt(req.params.jobId as string, 10);
  if (isNaN(jobId)) return res.status(400).json({ error: 'Invalid job ID' });

  const [job] = await db
    .select()
    .from(bulkUploadJobsTable)
    .where(and(
      eq(bulkUploadJobsTable.id, jobId),
      eq(bulkUploadJobsTable.portfolioHouseholdId, householdId),
    ));

  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

export default router;
