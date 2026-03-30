/**
 * ONE-TIME admin route: POST /api/admin/wipe-test-data
 * Wipes all user-generated data from the production DB before launch.
 * Protected by x-admin-secret header (ADMIN_PASSWORD env var).
 * DELETE THIS FILE AND ITS REGISTRATION after use.
 */
import { Router, Request, Response } from 'express';
import { query } from '../lib/db.js';

const router = Router();

// One-time hardcoded secret — not tied to ADMIN_PASSWORD env var
const WIPE_SECRET = 'mc-wipe-2026-03-30-x9f2k';

function checkAdminAuth(req: Request, res: Response): boolean {
  const provided = req.headers['x-wipe-secret'];
  if (provided !== WIPE_SECRET) {
    res.status(403).json({ error: 'Forbidden' });
    return false;
  }
  return true;
}

router.post('/wipe-test-data', async (req: Request, res: Response) => {
  if (!checkAdminAuth(req, res)) return;

  // Extra safety: require explicit confirmation body
  if (req.body?.confirm !== 'WIPE_ALL_DATA') {
    return res.status(400).json({
      error: 'Must send { "confirm": "WIPE_ALL_DATA" } in request body'
    });
  }

  try {
    // ── 1. Count before ───────────────────────────────────────────────────
    const beforeResult = await query(`
      SELECT 'households'           AS tbl, COUNT(*)::int AS cnt FROM households
      UNION ALL
      SELECT 'sessions',                    COUNT(*)::int FROM sessions
      UNION ALL
      SELECT 'magic_links',                 COUNT(*)::int FROM magic_links
      UNION ALL
      SELECT 'household_appliances',        COUNT(*)::int FROM household_appliances
      UNION ALL
      SELECT 'household_task_assignments',  COUNT(*)::int FROM household_task_assignments
      UNION ALL
      SELECT 'maintenance_logs',            COUNT(*)::int FROM maintenance_logs
      UNION ALL
      SELECT 'managed_properties',          COUNT(*)::int FROM managed_properties
      UNION ALL
      SELECT 'realtor_clients',             COUNT(*)::int FROM realtor_clients
      UNION ALL
      SELECT 'push_subscriptions',          COUNT(*)::int FROM push_subscriptions
      UNION ALL
      SELECT 'subscription_events',         COUNT(*)::int FROM subscription_events
      UNION ALL
      SELECT 'home_profile_extras',         COUNT(*)::int FROM home_profile_extras
    `);
    const before: Record<string, number> = {};
    for (const row of beforeResult.rows) before[row.tbl] = row.cnt;

    // ── 2. Delete in FK-safe order ────────────────────────────────────────
    // Most child tables have ON DELETE CASCADE from households, but we
    // delete explicitly in order to be safe and get accurate counts.
    await query('DELETE FROM sessions');
    await query('DELETE FROM magic_links');
    await query('DELETE FROM maintenance_logs');
    await query('DELETE FROM household_appliances');
    await query('DELETE FROM household_task_assignments');
    await query('DELETE FROM push_subscriptions');
    await query('DELETE FROM subscription_events');
    await query('DELETE FROM realtor_clients');
    await query('DELETE FROM managed_properties');
    await query('DELETE FROM home_profile_extras');
    await query('DELETE FROM households');

    // ── 3. Add unique constraint on households.email (idempotent) ─────────
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'households_email_unique'
        ) THEN
          ALTER TABLE households ADD CONSTRAINT households_email_unique UNIQUE (email);
        END IF;
      END
      $$;
    `);

    // ── 4. Count after ────────────────────────────────────────────────────
    const afterResult = await query(`
      SELECT 'households'           AS tbl, COUNT(*)::int AS cnt FROM households
      UNION ALL
      SELECT 'sessions',                    COUNT(*)::int FROM sessions
      UNION ALL
      SELECT 'household_appliances',        COUNT(*)::int FROM household_appliances
      UNION ALL
      SELECT 'household_task_assignments',  COUNT(*)::int FROM household_task_assignments
      UNION ALL
      SELECT 'managed_properties',          COUNT(*)::int FROM managed_properties
    `);
    const after: Record<string, number> = {};
    for (const row of afterResult.rows) after[row.tbl] = row.cnt;

    return res.json({
      success: true,
      message: 'All test data wiped. Unique constraint on households.email added.',
      before,
      after,
    });

  } catch (err: any) {
    console.error('Wipe failed:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
