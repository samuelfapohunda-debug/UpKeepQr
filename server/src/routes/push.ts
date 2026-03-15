import { Router, Response } from 'express';
import webpush from 'web-push';
import { db } from '../../db';
import { pushSubscriptionsTable } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { requireSessionAuth, SessionAuthRequest } from '../../middleware/sessionAuth';

const router = Router();

webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:support@maintcue.com',
  process.env.VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || '',
);

/**
 * POST /api/push/subscribe
 * Saves or reactivates a push subscription for the authenticated household.
 */
router.post('/subscribe', requireSessionAuth, async (req: SessionAuthRequest, res: Response) => {
  try {
    const householdId = req.sessionHouseholdId!;
    const { endpoint, keys, userAgent } = req.body as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
      userAgent?: string;
    };

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: 'endpoint, keys.p256dh and keys.auth are required' });
    }

    // Upsert — one row per endpoint (unique index handles conflicts)
    await db
      .insert(pushSubscriptionsTable)
      .values({
        householdId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: userAgent || null,
        isActive: true,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: pushSubscriptionsTable.endpoint,
        set: {
          householdId,
          p256dh: keys.p256dh,
          auth: keys.auth,
          userAgent: userAgent || null,
          isActive: true,
          updatedAt: new Date(),
        },
      });

    console.log(`📲 Push subscription saved for household ${householdId}`);
    return res.json({ success: true });
  } catch (error) {
    console.error('POST /api/push/subscribe error:', error);
    return res.status(500).json({ error: 'Failed to save subscription' });
  }
});

/**
 * DELETE /api/push/unsubscribe
 * Marks a push subscription as inactive.
 */
router.delete('/unsubscribe', requireSessionAuth, async (req: SessionAuthRequest, res: Response) => {
  try {
    const householdId = req.sessionHouseholdId!;
    const { endpoint } = req.body as { endpoint: string };

    if (!endpoint) {
      return res.status(400).json({ error: 'endpoint is required' });
    }

    await db
      .update(pushSubscriptionsTable)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(pushSubscriptionsTable.endpoint, endpoint),
          eq(pushSubscriptionsTable.householdId, householdId),
        )
      );

    console.log(`🔕 Push subscription deactivated for household ${householdId}`);
    return res.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/push/unsubscribe error:', error);
    return res.status(500).json({ error: 'Failed to remove subscription' });
  }
});

/**
 * POST /api/push/test
 * Sends a test push notification to all active subscriptions for the household.
 */
router.post('/test', requireSessionAuth, async (req: SessionAuthRequest, res: Response) => {
  try {
    const householdId = req.sessionHouseholdId!;

    const subscriptions = await db
      .select()
      .from(pushSubscriptionsTable)
      .where(
        and(
          eq(pushSubscriptionsTable.householdId, householdId),
          eq(pushSubscriptionsTable.isActive, true),
        )
      );

    if (subscriptions.length === 0) {
      return res.status(404).json({ error: 'No active subscriptions found' });
    }

    const payload = JSON.stringify({
      title: 'MaintCue ✓',
      body: 'Push notifications are working! You\'ll receive maintenance alerts here.',
      tag: 'maintcue-test',
      url: '/my-home',
    });

    let sent = 0;
    const stale: string[] = [];

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        );
        sent++;
      } catch (err: any) {
        // 410 Gone = subscription expired; deactivate it
        if (err.statusCode === 410) {
          stale.push(sub.endpoint);
        } else {
          console.error(`Push send failed for ${sub.endpoint}:`, err.message);
        }
      }
    }

    // Clean up stale subscriptions
    for (const endpoint of stale) {
      await db
        .update(pushSubscriptionsTable)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(pushSubscriptionsTable.endpoint, endpoint));
    }

    return res.json({ success: true, sent, staleRemoved: stale.length });
  } catch (error) {
    console.error('POST /api/push/test error:', error);
    return res.status(500).json({ error: 'Failed to send test notification' });
  }
});

export default router;
