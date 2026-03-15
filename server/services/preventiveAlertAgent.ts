import Anthropic from '@anthropic-ai/sdk';
import webpush from 'web-push';
import { db } from '../db.js';
import { pushSubscriptionsTable, alertsSentTable, maintenanceTasksTable } from '../../shared/schema.js';
import { eq, and } from 'drizzle-orm';

webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:support@maintcue.com',
  process.env.VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || '',
);

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export interface HomeProfileSummary {
  city?: string;
  state?: string;
  climateZone?: string;
  yearBuilt?: number;
  homeType?: string;
}

export interface AlertInput {
  householdId: string;
  homeProfile: HomeProfileSummary;
}

interface GeneratedAlert {
  title: string;
  body: string;
  urgency: 'critical' | 'high' | 'medium';
  category: string;
  estimatedCostIfIgnored: string;
  taskIds: number[];
}

/**
 * Fetches maintenance tasks for a household and runs the AI alert agent.
 * Sends push notifications for critical/high alerts immediately;
 * medium alerts only on Mondays (weekly digest behaviour).
 */
export async function runPreventiveAlertAgent(input: AlertInput): Promise<number> {
  const { householdId, homeProfile } = input;

  // --- 1. Fetch active push subscriptions ---
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
    return 0; // No subscribers — skip AI call
  }

  // --- 2. Fetch maintenance tasks ---
  const allTasks = await db
    .select()
    .from(maintenanceTasksTable)
    .where(eq(maintenanceTasksTable.householdId, householdId));

  const now = new Date();
  const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const currentMonth = now.getMonth() + 1;
  const isMonday = now.getDay() === 1;

  const upcoming = allTasks.filter(t =>
    !t.isCompleted &&
    t.dueDate &&
    new Date(t.dueDate) >= now &&
    new Date(t.dueDate) <= in60Days,
  ).map(t => ({ id: t.id, title: t.title, category: t.category, priority: t.priority, dueDate: t.dueDate }));

  const overdue = allTasks.filter(t =>
    !t.isCompleted && t.dueDate && new Date(t.dueDate) < now,
  ).map(t => ({ id: t.id, title: t.title, category: t.category, priority: t.priority, dueDate: t.dueDate }));

  if (upcoming.length === 0 && overdue.length === 0) {
    return 0; // Nothing to alert on
  }

  // --- 3. Call Claude ---
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const currentYear = now.getFullYear();
  const homeAge = homeProfile.yearBuilt ? currentYear - homeProfile.yearBuilt : null;

  const userPrompt = `Analyze this home's maintenance situation and identify preventive alerts:

Home: ${homeProfile.homeType || 'Single Family'} in ${homeProfile.city || 'Unknown'}, ${homeProfile.state || 'Unknown'} (${homeProfile.climateZone || 'Mixed/Humid'} climate)
Year Built: ${homeProfile.yearBuilt || 'Unknown'}${homeAge !== null ? ` (Age: ${homeAge} years)` : ''}
Current Month: ${MONTH_NAMES[currentMonth]}

Upcoming tasks (next 60 days):
${JSON.stringify(upcoming, null, 2)}

Overdue tasks:
${JSON.stringify(overdue, null, 2)}

Generate 1-3 high-priority preventive alerts. Each alert must be:
{
  "title": "string (max 60 chars)",
  "body": "string (max 120 chars)",
  "urgency": "critical" | "high" | "medium",
  "category": "hvac" | "plumbing" | "electrical" | "exterior" | "appliances" | "seasonal",
  "estimatedCostIfIgnored": "string (e.g. '$200-500')",
  "taskIds": [number]
}

Only generate alerts for genuinely important issues. If nothing is urgent, return an empty array [].
Respond with valid JSON array only. No markdown, no commentary.`;

  let alerts: GeneratedAlert[] = [];

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: 'You are a preventive home maintenance advisor. Analyze household data and identify the most important upcoming maintenance risks. Always respond with strictly valid JSON only. No markdown, no commentary.',
      messages: [{ role: 'user', content: userPrompt }],
    });

    const raw = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim()
      .replace(/^```(?:json)?/m, '')
      .replace(/```$/m, '')
      .trim();

    const parsed = JSON.parse(raw);
    alerts = Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error(`[PreventiveAlertAgent] AI call failed for household ${householdId}:`, err);
    return 0;
  }

  if (alerts.length === 0) return 0;

  // --- 4. Filter by urgency + day-of-week ---
  const alertsToSend = alerts.filter(a =>
    a.urgency === 'critical' || a.urgency === 'high' || (a.urgency === 'medium' && isMonday),
  );

  if (alertsToSend.length === 0) return 0;

  // --- 5. Send push notifications ---
  let delivered = 0;
  const stale: string[] = [];

  for (const alert of alertsToSend) {
    const payload = JSON.stringify({
      title: alert.title,
      body: `${alert.body} (If ignored: ${alert.estimatedCostIfIgnored})`,
      tag: `maintcue-alert-${alert.category}`,
      url: '/my-home',
      requireInteraction: alert.urgency === 'critical',
    });

    let wasDelivered = false;

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        );
        wasDelivered = true;
        delivered++;
      } catch (err: any) {
        if (err.statusCode === 410) {
          stale.push(sub.endpoint);
        } else {
          console.error(`[PreventiveAlertAgent] Push failed for ${sub.endpoint}:`, err.message);
        }
      }
    }

    // Log to alerts_sent
    await db.insert(alertsSentTable).values({
      householdId,
      alertTitle: alert.title.slice(0, 255),
      alertBody: alert.body,
      urgency: alert.urgency,
      category: alert.category,
      wasDelivered,
      deliveredAt: wasDelivered ? new Date() : null,
    });
  }

  // Clean up stale subscriptions
  for (const endpoint of stale) {
    await db
      .update(pushSubscriptionsTable)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(pushSubscriptionsTable.endpoint, endpoint));
  }

  console.log(`[PreventiveAlertAgent] household=${householdId} alerts=${alertsToSend.length} delivered=${delivered} staleRemoved=${stale.length}`);
  return delivered;
}
