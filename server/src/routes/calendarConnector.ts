/**
 * Calendar API routes using Replit's Google Calendar connector
 * This provides a simplified interface for calendar operations
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { db } from '../../db';
import { 
  calendarSyncEventsTable,
  householdTaskAssignmentsTable,
  homeMaintenanceTasksTable,
} from '../../../shared/schema';
import { eq, and, count } from 'drizzle-orm';
import {
  isCalendarConnected,
  getCalendarInfo,
  createCalendarEvent,
  deleteCalendarEvent,
  CalendarEventData,
} from '../../lib/replitCalendar';

const router = Router();

const syncRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Too many sync requests, please try again in 1 hour' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/status', async (req: Request, res: Response) => {
  try {
    const connected = await isCalendarConnected();
    
    if (!connected) {
      return res.json({
        connected: false,
        syncEnabled: false,
      });
    }

    const calendarInfo = await getCalendarInfo();
    
    const [eventCount] = await db.select({ count: count() })
      .from(calendarSyncEventsTable);

    return res.json({
      connected: true,
      provider: 'google',
      calendarName: calendarInfo?.calendarName || 'Google Calendar',
      calendarTimezone: calendarInfo?.timezone,
      syncEnabled: true,
      totalEventsSynced: eventCount?.count || 0,
    });
  } catch (error) {
    console.error('[CalendarConnector] Status error:', error);
    return res.json({
      connected: false,
      syncEnabled: false,
      error: 'Failed to check calendar status',
    });
  }
});

router.post('/sync', syncRateLimiter, async (req: Request, res: Response) => {
  try {
    const connected = await isCalendarConnected();
    if (!connected) {
      return res.status(400).json({ error: 'Google Calendar is not connected' });
    }

    const tasks = await db.select({
      assignment: householdTaskAssignmentsTable,
      task: homeMaintenanceTasksTable,
    })
      .from(householdTaskAssignmentsTable)
      .innerJoin(
        homeMaintenanceTasksTable,
        eq(householdTaskAssignmentsTable.taskId, homeMaintenanceTasksTable.id)
      )
      .where(eq(householdTaskAssignmentsTable.isActive, true));

    let eventsCreated = 0;
    let eventsUpdated = 0;
    let eventsDeleted = 0;

    for (const { assignment, task } of tasks) {
      if (!assignment.dueDate) continue;

      const existingEvents = await db.select()
        .from(calendarSyncEventsTable)
        .where(
          and(
            eq(calendarSyncEventsTable.taskAssignmentId, assignment.id),
            eq(calendarSyncEventsTable.eventStart, assignment.dueDate)
          )
        );

      if (existingEvents.length > 0) {
        eventsUpdated++;
        continue;
      }

      const eventData: CalendarEventData = {
        summary: `Maintenance: ${task.taskName}`,
        description: task.howTo || task.description || `Home maintenance task: ${task.taskName}`,
        startDate: assignment.dueDate,
        allDay: true,
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 * 7 },
            { method: 'popup', minutes: 24 * 60 },
          ],
        },
      };

      const googleEventId = await createCalendarEvent(eventData);

      if (googleEventId) {
        await db.insert(calendarSyncEventsTable).values({
          taskAssignmentId: assignment.id,
          taskCode: task.taskCode,
          taskTitle: task.taskName,
          googleEventId,
          calendarId: 'primary',
          eventStart: assignment.dueDate,
          eventEnd: assignment.dueDate,
          eventStatus: 'confirmed',
          syncStatus: 'synced',
          lastSyncAt: new Date(),
        });
        eventsCreated++;
      }
    }

    console.log(`[CalendarConnector] Sync complete: ${eventsCreated} created, ${eventsUpdated} updated`);

    return res.json({
      eventsCreated,
      eventsUpdated,
      eventsDeleted,
      totalSynced: eventsCreated + eventsUpdated,
    });
  } catch (error) {
    console.error('[CalendarConnector] Sync error:', error);
    return res.status(500).json({ error: 'Calendar sync failed' });
  }
});

router.delete('/events/:taskAssignmentId', async (req: Request, res: Response) => {
  try {
    const { taskAssignmentId } = req.params;
    
    const events = await db.select()
      .from(calendarSyncEventsTable)
      .where(eq(calendarSyncEventsTable.taskAssignmentId, parseInt(taskAssignmentId)));

    for (const event of events) {
      if (event.googleEventId) {
        await deleteCalendarEvent(event.googleEventId);
      }
    }

    await db.delete(calendarSyncEventsTable)
      .where(eq(calendarSyncEventsTable.taskAssignmentId, parseInt(taskAssignmentId)));

    return res.json({ 
      success: true, 
      deletedCount: events.length 
    });
  } catch (error) {
    console.error('[CalendarConnector] Delete error:', error);
    return res.status(500).json({ error: 'Failed to delete calendar events' });
  }
});

export default router;
