import { Router, Response, Request } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../../db.js';
import { realtorClientsTable, householdsTable, maintenanceTasksTable } from '@shared/schema';
import { eq, and, count } from 'drizzle-orm';
import { requireSessionAuth, SessionAuthRequest } from '../../middleware/sessionAuth.js';
import { generateMagicLink } from '../../lib/magicLink.js';
import { sendRealtorClientActivationEmail, sendRealtorClientWelcomeEmail } from '../../lib/subscriptionEmails.js';
import { generateMaintenanceSchedule } from '../../services/homeResearchAgent.js';
import { canonicalizeEmail } from '../../lib/emailCanonicalization.js';

const router = Router();
const MAX_CLIENTS = 25;

// ── helpers ────────────────────────────────────────────────────────────────

function assertRealtorId(req: SessionAuthRequest, res: Response): string | null {
  const id = req.sessionHouseholdId;
  if (!id) {
    res.status(401).json({ error: 'Session has no associated household' });
    return null;
  }
  return id;
}

async function assertRealtorPlan(householdId: string, res: Response): Promise<boolean> {
  const [household] = await db
    .select({ subscriptionTier: householdsTable.subscriptionTier, name: householdsTable.name })
    .from(householdsTable)
    .where(eq(householdsTable.id, householdId))
    .limit(1);
  if (!household || household.subscriptionTier !== 'realtor') {
    res.status(403).json({ error: 'Realtor/Agent plan required' });
    return false;
  }
  return true;
}

async function getClientCount(realtorHouseholdId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(realtorClientsTable)
    .where(
      and(
        eq(realtorClientsTable.realtorHouseholdId, realtorHouseholdId),
        eq(realtorClientsTable.activationStatus, 'inactive'),
      ),
    );
  // Count all non-inactive clients
  const [total] = await db
    .select({ value: count() })
    .from(realtorClientsTable)
    .where(eq(realtorClientsTable.realtorHouseholdId, realtorHouseholdId));
  const [inactive] = await db
    .select({ value: count() })
    .from(realtorClientsTable)
    .where(
      and(
        eq(realtorClientsTable.realtorHouseholdId, realtorHouseholdId),
        eq(realtorClientsTable.activationStatus, 'inactive'),
      ),
    );
  return Number(total?.value ?? 0) - Number(inactive?.value ?? 0);
}

// Fire-and-forget: generate schedule for realtor client household
async function generateClientSchedule(
  householdId: string,
  address: string, city: string, state: string, zip: string,
  propertyType: string,
) {
  try {
    await generateMaintenanceSchedule({
      householdId,
      address, city, state, zip,
      homeType: propertyType as any,
      appliances: [],
    });
    console.log(`[Realtor] Schedule generated for client household ${householdId}`);
  } catch (err) {
    console.error(`[Realtor] Schedule generation failed for ${householdId}:`, err);
  }
}

// ── GET /activate/:clientId (PUBLIC — no auth) ──────────────────────────────
// Returns prefill data for the onboarding form
router.get('/activate/:clientId', async (req: Request, res: Response) => {
  try {
    const [client] = await db
      .select()
      .from(realtorClientsTable)
      .where(eq(realtorClientsTable.id, req.params.clientId as string))
      .limit(1);

    if (!client) return res.status(404).json({ error: 'Invitation not found' });
    if (client.activationStatus === 'activated') {
      return res.status(409).json({ error: 'This invitation has already been used', alreadyActivated: true });
    }
    if (client.activationStatus === 'inactive') {
      return res.status(410).json({ error: 'This invitation is no longer active' });
    }

    // Get realtor name
    const [realtor] = await db
      .select({ name: householdsTable.name })
      .from(householdsTable)
      .where(eq(householdsTable.id, client.realtorHouseholdId))
      .limit(1);

    return res.json({
      clientName:      client.clientName,
      clientEmail:     client.clientEmail,
      clientPhone:     client.clientPhone,
      propertyAddress: client.propertyAddress,
      propertyCity:    client.propertyCity,
      propertyState:   client.propertyState,
      propertyZip:     client.propertyZip,
      propertyType:    client.propertyType,
      realtorName:     realtor?.name ?? 'Your Realtor',
    });
  } catch (err) {
    console.error('[Realtor] GET /activate/:clientId error:', err);
    return res.status(500).json({ error: 'Failed to fetch invitation' });
  }
});

// ── POST /activate/:clientId/complete (PUBLIC — no auth) ───────────────────
// Called by Onboarding after form submission; creates the client household
router.post('/activate/:clientId/complete', async (req: Request, res: Response) => {
  try {
    const [client] = await db
      .select()
      .from(realtorClientsTable)
      .where(eq(realtorClientsTable.id, req.params.clientId as string))
      .limit(1);

    if (!client) return res.status(404).json({ error: 'Invitation not found' });
    if (client.activationStatus === 'activated') {
      return res.status(409).json({ error: 'Account already activated', alreadyActivated: true });
    }
    if (client.activationStatus === 'inactive') {
      return res.status(410).json({ error: 'This invitation is no longer active' });
    }

    const { fullName, email, phone, streetAddress, city, state, zip } = req.body;
    if (!fullName || !email || !streetAddress || !city || !state || !zip) {
      return res.status(400).json({ error: 'fullName, email, streetAddress, city, state, zip are required' });
    }

    const canonical = canonicalizeEmail(email.toLowerCase());

    // Create client household
    const [household] = await db.insert(householdsTable).values({
      name:               fullName,
      email:              email.toLowerCase(),
      canonicalEmail:     canonical,
      subscriptionTier:   'basic',
      subscriptionStatus: 'active',
      setupStatus:        'completed',
      phone:              phone ?? null,
      createdBy:          'realtor',
      termsAcceptedAt:    new Date(),
      privacyAcceptedAt:  new Date(),
    } as any).returning();

    // Link client to realtor record
    await db.update(realtorClientsTable).set({
      clientHouseholdId: household.id,
      activationStatus:  'activated',
      activatedAt:       new Date(),
      updatedAt:         new Date(),
    }).where(eq(realtorClientsTable.id, client.id));

    // Fire-and-forget AI schedule
    generateClientSchedule(
      household.id,
      streetAddress, city, state, zip,
      client.propertyType,
    ).catch(() => {});

    // Generate magic link and send welcome email
    const magicLink = await generateMagicLink(email.toLowerCase(), household.id);

    const [realtor] = await db
      .select({ name: householdsTable.name })
      .from(householdsTable)
      .where(eq(householdsTable.id, client.realtorHouseholdId))
      .limit(1);

    await sendRealtorClientWelcomeEmail(
      email.toLowerCase(),
      fullName,
      realtor?.name ?? 'Your Realtor',
      `${streetAddress}, ${city}, ${state} ${zip}`,
      magicLink,
    ).catch((err) => console.error('[Realtor] Failed to send welcome email:', err));

    return res.json({ success: true, householdId: household.id });
  } catch (err) {
    console.error('[Realtor] POST /activate/:clientId/complete error:', err);
    return res.status(500).json({ error: 'Failed to complete account setup' });
  }
});

// ── POST /clients ───────────────────────────────────────────────────────────
router.post('/clients', requireSessionAuth, async (req: SessionAuthRequest, res: Response) => {
  try {
    const realtorId = assertRealtorId(req, res);
    if (!realtorId) return;
    if (!(await assertRealtorPlan(realtorId, res))) return;

    const activeCount = await getClientCount(realtorId);
    if (activeCount >= MAX_CLIENTS) {
      return res.status(403).json({ error: `Client limit of ${MAX_CLIENTS} reached` });
    }

    const { client_name, client_email, client_phone, property_address,
            property_city, property_state, property_zip, property_type } = req.body;

    if (!client_name || !client_email || !property_address || !property_city || !property_state || !property_zip) {
      return res.status(400).json({ error: 'client_name, client_email, property_address, property_city, property_state, property_zip are required' });
    }

    const [realtor] = await db
      .select({ name: householdsTable.name })
      .from(householdsTable)
      .where(eq(householdsTable.id, realtorId))
      .limit(1);

    const [client] = await db.insert(realtorClientsTable).values({
      realtorHouseholdId: realtorId,
      clientName:         client_name,
      clientEmail:        client_email.toLowerCase(),
      clientPhone:        client_phone ?? null,
      propertyAddress:    property_address,
      propertyCity:       property_city,
      propertyState:      property_state,
      propertyZip:        property_zip,
      propertyType:       property_type ?? 'single_family',
      activationStatus:   'pending',
    }).returning();

    const APP_URL = process.env.PUBLIC_BASE_URL || 'https://maintcue.com';
    const activationUrl = `${APP_URL}/onboarding?realtorClient=${client.id}`;

    try {
      await sendRealtorClientActivationEmail(
        client_email.toLowerCase(),
        client_name,
        realtor?.name ?? 'Your Realtor',
        `${property_address}, ${property_city}, ${property_state} ${property_zip}`,
        activationUrl,
      );
      await db.update(realtorClientsTable).set({
        activationStatus:       'email_sent',
        activationEmailSentAt:  new Date(),
        updatedAt:              new Date(),
      }).where(eq(realtorClientsTable.id, client.id));
    } catch (emailErr) {
      console.error('[Realtor] Failed to send activation email:', emailErr);
    }

    const [updated] = await db
      .select()
      .from(realtorClientsTable)
      .where(eq(realtorClientsTable.id, client.id));

    return res.status(201).json(updated);
  } catch (err) {
    console.error('[Realtor] POST /clients error:', err);
    return res.status(500).json({ error: 'Failed to add client' });
  }
});

// ── GET /clients ────────────────────────────────────────────────────────────
router.get('/clients', requireSessionAuth, async (req: SessionAuthRequest, res: Response) => {
  try {
    const realtorId = assertRealtorId(req, res);
    if (!realtorId) return;
    if (!(await assertRealtorPlan(realtorId, res))) return;

    const clients = await db
      .select()
      .from(realtorClientsTable)
      .where(eq(realtorClientsTable.realtorHouseholdId, realtorId))
      .orderBy(realtorClientsTable.createdAt);

    return res.json(clients);
  } catch (err) {
    console.error('[Realtor] GET /clients error:', err);
    return res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// ── GET /clients/:id ────────────────────────────────────────────────────────
router.get('/clients/:id', requireSessionAuth, async (req: SessionAuthRequest, res: Response) => {
  try {
    const realtorId = assertRealtorId(req, res);
    if (!realtorId) return;
    if (!(await assertRealtorPlan(realtorId, res))) return;

    const [client] = await db
      .select()
      .from(realtorClientsTable)
      .where(and(
        eq(realtorClientsTable.id, req.params.id as string),
        eq(realtorClientsTable.realtorHouseholdId, realtorId),
      ));

    if (!client) return res.status(404).json({ error: 'Client not found' });
    return res.json(client);
  } catch (err) {
    console.error('[Realtor] GET /clients/:id error:', err);
    return res.status(500).json({ error: 'Failed to fetch client' });
  }
});

// ── DELETE /clients/:id ─────────────────────────────────────────────────────
router.delete('/clients/:id', requireSessionAuth, async (req: SessionAuthRequest, res: Response) => {
  try {
    const realtorId = assertRealtorId(req, res);
    if (!realtorId) return;
    if (!(await assertRealtorPlan(realtorId, res))) return;

    const [updated] = await db
      .update(realtorClientsTable)
      .set({ activationStatus: 'inactive', updatedAt: new Date() })
      .where(and(
        eq(realtorClientsTable.id, req.params.id as string),
        eq(realtorClientsTable.realtorHouseholdId, realtorId),
      ))
      .returning();

    if (!updated) return res.status(404).json({ error: 'Client not found' });
    return res.status(204).send();
  } catch (err) {
    console.error('[Realtor] DELETE /clients/:id error:', err);
    return res.status(500).json({ error: 'Failed to remove client' });
  }
});

// ── POST /clients/:id/resend-email ──────────────────────────────────────────
router.post('/clients/:id/resend-email', requireSessionAuth, async (req: SessionAuthRequest, res: Response) => {
  try {
    const realtorId = assertRealtorId(req, res);
    if (!realtorId) return;
    if (!(await assertRealtorPlan(realtorId, res))) return;

    const [client] = await db
      .select()
      .from(realtorClientsTable)
      .where(and(
        eq(realtorClientsTable.id, req.params.id as string),
        eq(realtorClientsTable.realtorHouseholdId, realtorId),
      ));

    if (!client) return res.status(404).json({ error: 'Client not found' });
    if (client.activationStatus === 'activated') {
      return res.status(409).json({ error: 'Client has already activated their account' });
    }

    const [realtor] = await db
      .select({ name: householdsTable.name })
      .from(householdsTable)
      .where(eq(householdsTable.id, realtorId))
      .limit(1);

    const APP_URL = process.env.PUBLIC_BASE_URL || 'https://maintcue.com';
    const activationUrl = `${APP_URL}/onboarding?realtorClient=${client.id}`;

    await sendRealtorClientActivationEmail(
      client.clientEmail,
      client.clientName,
      realtor?.name ?? 'Your Realtor',
      `${client.propertyAddress}, ${client.propertyCity}, ${client.propertyState} ${client.propertyZip}`,
      activationUrl,
    );

    await db.update(realtorClientsTable).set({
      activationStatus:      'email_sent',
      activationEmailSentAt: new Date(),
      updatedAt:             new Date(),
    }).where(eq(realtorClientsTable.id, client.id));

    return res.json({ success: true });
  } catch (err) {
    console.error('[Realtor] POST /clients/:id/resend-email error:', err);
    return res.status(500).json({ error: 'Failed to resend email' });
  }
});

// ── GET /summary ────────────────────────────────────────────────────────────
router.get('/summary', requireSessionAuth, async (req: SessionAuthRequest, res: Response) => {
  try {
    const realtorId = assertRealtorId(req, res);
    if (!realtorId) return;
    if (!(await assertRealtorPlan(realtorId, res))) return;

    const all = await db
      .select({ status: realtorClientsTable.activationStatus })
      .from(realtorClientsTable)
      .where(eq(realtorClientsTable.realtorHouseholdId, realtorId));

    const total     = all.filter(c => c.status !== 'inactive').length;
    const active    = all.filter(c => c.status === 'activated').length;
    const pending   = all.filter(c => c.status === 'pending').length;
    const emailSent = all.filter(c => c.status === 'email_sent').length;

    return res.json({
      total_clients:   total,
      active,
      pending,
      email_sent:      emailSent,
      remaining_slots: Math.max(0, MAX_CLIENTS - total),
    });
  } catch (err) {
    console.error('[Realtor] GET /summary error:', err);
    return res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// ── GET /provided-by (called by client dashboard) ───────────────────────────
// Returns realtor info if the current session user is a realtor client
router.get('/provided-by', requireSessionAuth, async (req: SessionAuthRequest, res: Response) => {
  try {
    const householdId = req.sessionHouseholdId;
    if (!householdId) return res.json({ realtorName: null });

    const [client] = await db
      .select({ realtorHouseholdId: realtorClientsTable.realtorHouseholdId })
      .from(realtorClientsTable)
      .where(eq(realtorClientsTable.clientHouseholdId, householdId))
      .limit(1);

    if (!client) return res.json({ realtorName: null });

    const [realtor] = await db
      .select({ name: householdsTable.name })
      .from(householdsTable)
      .where(eq(householdsTable.id, client.realtorHouseholdId))
      .limit(1);

    return res.json({ realtorName: realtor?.name ?? null });
  } catch (err) {
    console.error('[Realtor] GET /provided-by error:', err);
    return res.json({ realtorName: null }); // non-fatal
  }
});

export default router;
