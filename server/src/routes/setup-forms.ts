import { Router, Request, Response } from 'express';
import { db } from '../../db.js';
import { householdsTable, setupFormNotesTable, homeProfileExtras } from '../../../shared/schema.js';
import {
  adminSetupFormFiltersSchema,
  updateSetupFormSchema,
  createSetupFormNoteSchema,
  testNotificationSchema,
} from '../../../shared/schema.js';
import { requireSystemAdmin } from '../../middleware/auth.js';
import { createAuditLog, handleError } from './utils.js';
import { eq, and, isNull, sql, desc, asc, like, ilike, or, gte, lte } from 'drizzle-orm';
import { NotificationDispatcher } from '../../lib/notificationDispatcher.js';

const router = Router();

interface AuthRequest extends Request {
  agentId?: string;
  agentEmail?: string;
}

// GET /setup-forms - List all households with filters, search, and pagination
router.get('/', requireSystemAdmin, async (req: any, res: Response) => {
  try {
    await createAuditLog(req, '/api/admin/setup-forms');

    const filters = adminSetupFormFiltersSchema.parse({
      status: req.query.status as string | undefined,
      city: req.query.city as string | undefined,
      state: req.query.state as string | undefined,
      zipcode: req.query.zipcode as string | undefined,
      q: req.query.q as string | undefined,
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo: req.query.dateTo as string | undefined,
      page: req.query.page ? Number(req.query.page) : 1,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : 25,
      sortBy: (req.query.sortBy as never) || 'createdAt',
      sortDir: (req.query.sortDir as never) || 'desc',
    });

    const conditions = [];

    if (filters.status) {
      conditions.push(eq(householdsTable.setupStatus, filters.status));
    }

    if (filters.city) {
      conditions.push(ilike(householdsTable.city, `%${filters.city}%`));
    }

    if (filters.state) {
      conditions.push(eq(householdsTable.state, filters.state));
    }

    if (filters.zipcode) {
      conditions.push(eq(householdsTable.zipcode, filters.zipcode));
    }

    if (filters.q) {
      const searchTerm = `%${filters.q}%`;
      conditions.push(
        or(
          like(householdsTable.name, searchTerm),
          like(householdsTable.email, searchTerm),
          like(householdsTable.addressLine1, searchTerm),
          like(householdsTable.city, searchTerm)
        )!
      );
    }

    if (filters.dateFrom) {
      conditions.push(gte(householdsTable.setupCompletedAt, new Date(filters.dateFrom)));
    }

    if (filters.dateTo) {
      conditions.push(lte(householdsTable.setupCompletedAt, new Date(filters.dateTo)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const sortColumn = {
      name: householdsTable.name,
      setupCompletedAt: householdsTable.setupCompletedAt,
      createdAt: householdsTable.createdAt,
      city: householdsTable.city,
      zipcode: householdsTable.zipcode,
    }[filters.sortBy];

    const orderClause = filters.sortDir === 'asc' ? asc(sortColumn) : desc(sortColumn);

    const offset = (filters.page - 1) * filters.pageSize;

    const baseQuery = db.select().from(householdsTable);
    const countQuery = db.select({ count: sql<number>`count(*)` }).from(householdsTable);

    const [households, totalCountResult] = await Promise.all([
      whereClause
        ? baseQuery.where(whereClause).orderBy(orderClause).limit(filters.pageSize).offset(offset)
        : baseQuery.orderBy(orderClause).limit(filters.pageSize).offset(offset),
      whereClause
        ? countQuery.where(whereClause)
        : countQuery,
    ]);

    const totalCount = Number(totalCountResult[0]?.count || 0);
    const totalPages = Math.ceil(totalCount / filters.pageSize);

    res.json({
      data: households,
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    handleError(error, req.path || 'admin-setup-forms', res);
  }
});

// GET /setup-forms/:id - Get single household with notes and profile extras
router.get('/:id', requireSystemAdmin, async (req: any, res: Response) => {
  try {
    await createAuditLog(req, `/api/admin/setup-forms/${req.params.id}`);

    const householdId = req.params.id;

    const [household] = await db
      .select()
      .from(householdsTable)
      .where(eq(householdsTable.id, householdId))
      .limit(1);

    if (!household) {
      return res.status(404).json({ error: 'Household not found' });
    }

    const [notes, profileExtras] = await Promise.all([
      db
        .select()
        .from(setupFormNotesTable)
        .where(and(
          eq(setupFormNotesTable.householdId, householdId),
          isNull(setupFormNotesTable.deletedAt)
        ))
        .orderBy(desc(setupFormNotesTable.createdAt)),
      db
        .select()
        .from(homeProfileExtras)
        .where(eq(homeProfileExtras.householdId, householdId))
        .limit(1),
    ]);

    // Return flat household object with embedded notes/profileExtras
    res.json({
      ...household,
      notes,
      profileExtras: profileExtras[0] ? Object.entries(profileExtras[0]).map(([key, value]) => ({ key, value })) : [],
    });
  } catch (error) {
    handleError(error, req.path || 'admin-setup-forms', res);
  }
});

// PUT /setup-forms/:id - Update household (with auto-tracking setup completion)
router.put('/:id', requireSystemAdmin, async (req: any, res: Response) => {
  try {
    await createAuditLog(req, `/api/admin/setup-forms/${req.params.id}`);

    const householdId = req.params.id;
    const updateData = updateSetupFormSchema.parse(req.body);

    const result = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(householdsTable)
        .where(eq(householdsTable.id, householdId))
        .limit(1);

      if (!existing) {
        throw new Error('Household not found');
      }

      const updates: Record<string, unknown> = {
        ...updateData,
        lastModifiedBy: req.agentId,
        updatedAt: new Date(),
      };

      if (updateData.setupStatus === 'completed' && existing.setupStatus !== 'completed') {
        updates.setupCompletedAt = new Date();
      }

      if (updateData.setupStatus !== 'completed' && existing.setupStatus === 'completed') {
        updates.setupCompletedAt = null;
      }

      if (existing.setupStartedAt === null && Object.keys(updateData).length > 0) {
        updates.setupStartedAt = new Date();
      }

      const [updated] = await tx
        .update(householdsTable)
        .set(updates)
        .where(eq(householdsTable.id, householdId))
        .returning();

      return updated;
    });

    res.json(result);
  } catch (error) {
    handleError(error, req.path || 'admin-setup-forms', res);
  }
});

// POST /setup-forms/:id/notes - Create internal note
router.post('/:id/notes', requireSystemAdmin, async (req: any, res: Response) => {
  try {
    await createAuditLog(req, `/api/admin/setup-forms/${req.params.id}/notes`);

    const householdId = req.params.id;
    const { content } = createSetupFormNoteSchema.parse(req.body);

    const result = await db.transaction(async (tx) => {
      const [household] = await tx
        .select()
        .from(householdsTable)
        .where(eq(householdsTable.id, householdId))
        .limit(1);

      if (!household) {
        throw new Error('Household not found');
      }

      const [note] = await tx
        .insert(setupFormNotesTable)
        .values({
          householdId,
          createdBy: req.agentEmail || null,
          content,
        })
        .returning();

      return note;
    });

    res.status(201).json(result);
  } catch (error) {
    handleError(error, req.path || 'admin-setup-forms', res);
  }
});

// DELETE /setup-forms/:id/notes/:noteId - Soft delete note
router.delete('/:id/notes/:noteId', requireSystemAdmin, async (req: any, res: Response) => {
  try {
    await createAuditLog(req, `/api/admin/setup-forms/${req.params.id}/notes/${req.params.noteId}`);

    const { id: householdId, noteId } = req.params;

    const result = await db.transaction(async (tx) => {
      const [note] = await tx
        .select()
        .from(setupFormNotesTable)
        .where(and(
          eq(setupFormNotesTable.id, noteId),
          eq(setupFormNotesTable.householdId, householdId),
          isNull(setupFormNotesTable.deletedAt)
        ))
        .limit(1);

      if (!note) {
        throw new Error('Note not found or already deleted');
      }

      const [deleted] = await tx
        .update(setupFormNotesTable)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(setupFormNotesTable.id, noteId))
        .returning();

      return deleted;
    });

    res.json({ message: 'Note deleted successfully', note: result });
  } catch (error) {
    handleError(error, req.path || 'admin-setup-forms', res);
  }
});

// POST /setup-forms/:id/test-notification - Send test notification (rate-limited)
router.post('/:id/test-notification', requireSystemAdmin, async (req: any, res: Response) => {
  try {
    await createAuditLog(req, `/api/admin/setup-forms/${req.params.id}/test-notification`);

    const householdId = req.params.id;
    const { channel } = testNotificationSchema.parse(req.body);

    const [household] = await db
      .select()
      .from(householdsTable)
      .where(eq(householdsTable.id, householdId))
      .limit(1);

    if (!household) {
      return res.status(404).json({ error: 'Household not found' });
    }

    const dispatcher = new NotificationDispatcher();
    
    const testSubject = '[TEST] Admin Setup Form Notification';
    const testHtml = `
      <h2>Test Notification</h2>
      <p>This is a test notification sent from the Admin Setup Forms panel.</p>
      <p><strong>Household:</strong> ${household.name}</p>
      <p><strong>Email:</strong> ${household.email}</p>
      <p><strong>Phone:</strong> ${household.phone || 'N/A'}</p>
      <p><strong>Setup Status:</strong> ${household.setupStatus}</p>
    `;
    const testSms = `TEST Notification\n\nHousehold: ${household.name}\nEmail: ${household.email}\nPhone: ${household.phone || 'N/A'}\nSetup Status: ${household.setupStatus}`;

    const result = await dispatcher.send({
      householdId,
      type: 'test_notification',
      emailSubject: testSubject,
      emailHtml: testHtml,
      smsMessage: testSms,
      channelOverride: channel,
    });

    res.json({
      message: 'Test notification sent',
      result,
      channel,
    });
  } catch (error) {
    handleError(error, req.path || 'admin-setup-forms', res);
  }
});

// POST /setup-forms/create - Create new household (admin only)
router.post('/create', requireSystemAdmin, async (req: any, res: Response) => {
  try {
    await createAuditLog(req, '/api/admin/setup-forms/create');

    const { fullName, email, phone, zip, homeType, skipWelcomeEmail } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ error: 'Full name and email are required' });
    }

    const householdId = crypto.randomUUID();
    const magnetToken = crypto.randomUUID().replace(/-/g, '').substring(0, 16);

    const [newHousehold] = await db
      .insert(householdsTable)
      .values({
        id: householdId,
        magnetToken,
        agentId: req.agentId || null,
        name: fullName,
        email,
        phone: phone || '',
        zipcode: zip || '',
        homeType: homeType || 'single_family',
        setupStatus: 'not_started',
        smsOptIn: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    console.log(`[Admin Create] Household created: ${householdId} by ${req.agentEmail}`);

    res.status(201).json(newHousehold);
  } catch (error) {
    handleError(error, req.path || 'admin-setup-forms-create', res);
  }
});

export default router;
