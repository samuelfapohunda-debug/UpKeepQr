import { google, calendar_v3 } from 'googleapis';
import { db } from '../db';
import { 
  calendarConnectionsTable, 
  calendarSyncEventsTable,
  householdTaskAssignmentsTable,
  householdsTable,
  homeMaintenanceTasksTable,
} from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { encrypt, decrypt } from './encryption';

const OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

export function createOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const backendUrl = process.env.BACKEND_URL || process.env.VITE_API_URL || 'http://localhost:5000';
  
  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)');
  }
  
  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    `${backendUrl}/api/calendar/google/callback`
  );
}

export function generateAuthUrl(state: string): string {
  const oauth2Client = createOAuth2Client();
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: OAUTH_SCOPES,
    state,
    prompt: 'consent',
  });
}

export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiryDate: Date;
}> {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  
  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Failed to obtain tokens from Google');
  }
  
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600 * 1000),
  };
}

export async function getValidAccessToken(connectionId: string): Promise<string> {
  const [connection] = await db.select()
    .from(calendarConnectionsTable)
    .where(eq(calendarConnectionsTable.id, connectionId))
    .limit(1);
  
  if (!connection) {
    throw new Error('Calendar connection not found');
  }
  
  const decryptedAccessToken = decrypt(connection.accessToken);
  
  if (connection.tokenExpiry && new Date(connection.tokenExpiry) > new Date(Date.now() + 5 * 60 * 1000)) {
    return decryptedAccessToken;
  }
  
  const decryptedRefreshToken = decrypt(connection.refreshToken);
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: decryptedRefreshToken });
  
  const { credentials } = await oauth2Client.refreshAccessToken();
  
  if (!credentials.access_token) {
    throw new Error('Failed to refresh access token');
  }
  
  const encryptedAccessToken = encrypt(credentials.access_token);
  const newExpiry = credentials.expiry_date ? new Date(credentials.expiry_date) : new Date(Date.now() + 3600 * 1000);
  
  await db.update(calendarConnectionsTable)
    .set({
      accessToken: encryptedAccessToken,
      tokenExpiry: newExpiry,
      updatedAt: new Date(),
    })
    .where(eq(calendarConnectionsTable.id, connectionId));
  
  return credentials.access_token;
}

export async function getCalendarClient(connectionId: string): Promise<calendar_v3.Calendar> {
  const accessToken = await getValidAccessToken(connectionId);
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export async function getUserCalendarInfo(accessToken: string): Promise<{
  calendarId: string;
  calendarName: string;
  timezone: string;
}> {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  const response = await calendar.calendars.get({ calendarId: 'primary' });
  
  return {
    calendarId: response.data.id || 'primary',
    calendarName: response.data.summary || 'Primary Calendar',
    timezone: response.data.timeZone || 'America/New_York',
  };
}

export async function storeCalendarConnection(params: {
  householdId: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Date;
  calendarId: string;
  calendarName: string;
  timezone: string;
}): Promise<string> {
  const encryptedAccessToken = encrypt(params.accessToken);
  const encryptedRefreshToken = encrypt(params.refreshToken);
  
  const [existingConnection] = await db.select()
    .from(calendarConnectionsTable)
    .where(eq(calendarConnectionsTable.householdId, params.householdId))
    .limit(1);
  
  if (existingConnection) {
    await db.update(calendarConnectionsTable)
      .set({
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiry: params.tokenExpiry,
        calendarId: params.calendarId,
        calendarName: params.calendarName,
        calendarTimezone: params.timezone,
        syncEnabled: true,
        updatedAt: new Date(),
      })
      .where(eq(calendarConnectionsTable.id, existingConnection.id));
    
    return existingConnection.id;
  }
  
  const [newConnection] = await db.insert(calendarConnectionsTable)
    .values({
      householdId: params.householdId,
      provider: 'google',
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      tokenExpiry: params.tokenExpiry,
      calendarId: params.calendarId,
      calendarName: params.calendarName,
      calendarTimezone: params.timezone,
      syncEnabled: true,
    })
    .returning();
  
  return newConnection.id;
}

export async function syncMaintenanceTasksToCalendar(
  householdId: string,
  connectionId: string
): Promise<{ eventsCreated: number; eventsUpdated: number; eventsFailed: number }> {
  const [connection] = await db.select()
    .from(calendarConnectionsTable)
    .where(and(
      eq(calendarConnectionsTable.id, connectionId),
      eq(calendarConnectionsTable.syncEnabled, true)
    ))
    .limit(1);
  
  if (!connection) {
    throw new Error('Calendar connection not found or sync disabled');
  }
  
  const tasksWithDetails = await db.select({
    assignment: householdTaskAssignmentsTable,
    task: homeMaintenanceTasksTable,
  })
    .from(householdTaskAssignmentsTable)
    .innerJoin(
      homeMaintenanceTasksTable,
      eq(householdTaskAssignmentsTable.taskId, homeMaintenanceTasksTable.id)
    )
    .where(and(
      eq(householdTaskAssignmentsTable.householdId, householdId),
      eq(householdTaskAssignmentsTable.status, 'pending')
    ));
  
  if (tasksWithDetails.length === 0) {
    console.log(`[CalendarSync] No pending tasks found for household ${householdId}`);
    return { eventsCreated: 0, eventsUpdated: 0, eventsFailed: 0 };
  }
  
  const calendar = await getCalendarClient(connectionId);
  
  const [household] = await db.select()
    .from(householdsTable)
    .where(eq(householdsTable.id, householdId))
    .limit(1);
  
  const propertyAddress = household?.addressLine1 
    ? `${household.addressLine1}, ${household.city || ''}, ${household.state || ''}`
    : undefined;
  
  let eventsCreated = 0;
  let eventsUpdated = 0;
  let eventsFailed = 0;
  
  for (const { assignment, task } of tasksWithDetails) {
    try {
      if (!assignment.dueDate) continue;
      
      const [existingEvent] = await db.select()
        .from(calendarSyncEventsTable)
        .where(and(
          eq(calendarSyncEventsTable.connectionId, connectionId),
          eq(calendarSyncEventsTable.taskAssignmentId, assignment.id),
          eq(calendarSyncEventsTable.eventStart, assignment.dueDate)
        ))
        .limit(1);
      
      if (existingEvent) {
        if (existingEvent.syncStatus === 'failed') {
          try {
            await updateGoogleCalendarEvent(
              calendar,
              connection.calendarId,
              existingEvent.googleEventId,
              {
                taskTitle: task.taskName,
                taskDescription: task.howTo || '',
                propertyAddress,
                eventDate: assignment.dueDate,
                duration: connection.defaultEventDuration,
                timezone: connection.calendarTimezone,
              }
            );
            
            await db.update(calendarSyncEventsTable)
              .set({
                syncStatus: 'synced',
                eventStatus: 'scheduled',
                lastSyncAttempt: new Date(),
                syncErrorMessage: null,
                updatedAt: new Date(),
              })
              .where(eq(calendarSyncEventsTable.id, existingEvent.id));
            
            eventsUpdated++;
          } catch (error) {
            console.error(`[CalendarSync] Failed to update event ${existingEvent.id}:`, error);
            eventsFailed++;
          }
        }
        continue;
      }
      
      const googleEvent = await createGoogleCalendarEvent(
        calendar,
        connection.calendarId,
        {
          taskId: assignment.id,
          taskCode: task.taskCode,
          taskTitle: task.taskName,
          taskDescription: task.howTo || '',
          propertyAddress,
          eventDate: assignment.dueDate,
          duration: connection.defaultEventDuration,
          timezone: connection.calendarTimezone,
        }
      );
      
      const eventEnd = calculateEventEnd(assignment.dueDate, connection.defaultEventDuration);
      
      await db.insert(calendarSyncEventsTable).values({
        connectionId,
        householdId,
        taskAssignmentId: assignment.id,
        taskCode: task.taskCode,
        taskTitle: task.taskName,
        propertyAddress,
        googleEventId: googleEvent.id!,
        eventStart: assignment.dueDate,
        eventEnd,
        eventStatus: 'scheduled',
        syncStatus: 'synced',
        lastSyncAttempt: new Date(),
        eventMetadata: {
          htmlLink: googleEvent.htmlLink || undefined,
          iCalUID: googleEvent.iCalUID || undefined,
          colorId: googleEvent.colorId || undefined,
          updated: googleEvent.updated || undefined,
        },
      });
      
      eventsCreated++;
    } catch (error: any) {
      console.error(`[CalendarSync] Failed to create event for task ${assignment.id}:`, error);
      eventsFailed++;
    }
  }
  
  await db.update(calendarConnectionsTable)
    .set({
      lastSync: new Date(),
      lastSyncStatus: eventsFailed > 0 ? 'failed' : 'success',
      lastSyncError: eventsFailed > 0 ? `${eventsFailed} events failed` : null,
      updatedAt: new Date(),
    })
    .where(eq(calendarConnectionsTable.id, connectionId));
  
  console.log(`[CalendarSync] Sync complete for household ${householdId}: ${eventsCreated} created, ${eventsUpdated} updated, ${eventsFailed} failed`);
  
  return { eventsCreated, eventsUpdated, eventsFailed };
}

async function createGoogleCalendarEvent(
  calendar: calendar_v3.Calendar,
  calendarId: string,
  eventData: {
    taskId: string;
    taskCode: string;
    taskTitle: string;
    taskDescription: string;
    propertyAddress?: string;
    eventDate: Date;
    duration: string;
    timezone: string;
  }
): Promise<calendar_v3.Schema$Event> {
  const [hours, minutes] = eventData.duration.split(':').map(Number);
  const endDate = new Date(eventData.eventDate);
  endDate.setHours(endDate.getHours() + (hours || 1), endDate.getMinutes() + (minutes || 0));
  
  const eventTitle = eventData.propertyAddress
    ? `Home Maintenance: ${eventData.taskTitle} (${eventData.propertyAddress})`
    : `Home Maintenance: ${eventData.taskTitle}`;
  
  const frontendUrl = process.env.FRONTEND_URL || 'https://upkeepqr.com';
  
  const description = `
${eventData.taskDescription}

View in Dashboard: ${frontendUrl}/dashboard/tasks/${eventData.taskId}

Powered by UpKeepQR - Your Home Maintenance Assistant
  `.trim();
  
  const event = {
    summary: eventTitle,
    description,
    start: {
      dateTime: eventData.eventDate.toISOString(),
      timeZone: eventData.timezone,
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: eventData.timezone,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup' as const, minutes: 60 },
      ],
    },
    colorId: '7',
  };
  
  const response = await calendar.events.insert({
    calendarId,
    requestBody: event,
  });
  
  return response.data;
}

async function updateGoogleCalendarEvent(
  calendar: calendar_v3.Calendar,
  calendarId: string,
  eventId: string,
  eventData: {
    taskTitle: string;
    taskDescription: string;
    propertyAddress?: string;
    eventDate: Date;
    duration: string;
    timezone: string;
  }
): Promise<void> {
  const [hours, minutes] = eventData.duration.split(':').map(Number);
  const endDate = new Date(eventData.eventDate);
  endDate.setHours(endDate.getHours() + (hours || 1), endDate.getMinutes() + (minutes || 0));
  
  const eventTitle = eventData.propertyAddress
    ? `Home Maintenance: ${eventData.taskTitle} (${eventData.propertyAddress})`
    : `Home Maintenance: ${eventData.taskTitle}`;
  
  await calendar.events.patch({
    calendarId,
    eventId,
    requestBody: {
      summary: eventTitle,
      start: {
        dateTime: eventData.eventDate.toISOString(),
        timeZone: eventData.timezone,
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: eventData.timezone,
      },
    },
  });
}

function calculateEventEnd(start: Date, duration: string): Date {
  const [hours, minutes] = duration.split(':').map(Number);
  const end = new Date(start);
  end.setHours(end.getHours() + (hours || 1), end.getMinutes() + (minutes || 0));
  return end;
}

export async function markCalendarEventComplete(
  taskAssignmentId: string,
  householdId: string,
  completed: boolean = true
): Promise<void> {
  const [event] = await db.select()
    .from(calendarSyncEventsTable)
    .where(and(
      eq(calendarSyncEventsTable.taskAssignmentId, taskAssignmentId),
      eq(calendarSyncEventsTable.householdId, householdId)
    ))
    .limit(1);
  
  if (!event) {
    console.log(`[CalendarSync] No calendar event found for task ${taskAssignmentId}`);
    return;
  }
  
  const [connection] = await db.select()
    .from(calendarConnectionsTable)
    .where(eq(calendarConnectionsTable.id, event.connectionId))
    .limit(1);
  
  if (!connection || !connection.syncEnabled) {
    console.log('[CalendarSync] Calendar sync disabled, skipping event update');
    return;
  }
  
  const calendar = await getCalendarClient(event.connectionId);
  
  if (completed) {
    await calendar.events.patch({
      calendarId: connection.calendarId,
      eventId: event.googleEventId,
      requestBody: {
        summary: `[COMPLETED] ${event.taskTitle}`,
        colorId: '10',
      },
    });
    
    await db.update(calendarSyncEventsTable)
      .set({ 
        eventStatus: 'completed', 
        syncStatus: 'synced',
        updatedAt: new Date(),
      })
      .where(eq(calendarSyncEventsTable.id, event.id));
  } else {
    await calendar.events.patch({
      calendarId: connection.calendarId,
      eventId: event.googleEventId,
      requestBody: {
        summary: `Home Maintenance: ${event.taskTitle}`,
        colorId: '7',
      },
    });
    
    await db.update(calendarSyncEventsTable)
      .set({ 
        eventStatus: 'scheduled', 
        syncStatus: 'synced',
        updatedAt: new Date(),
      })
      .where(eq(calendarSyncEventsTable.id, event.id));
  }
}

export async function deleteAllCalendarEvents(connectionId: string): Promise<number> {
  const events = await db.select()
    .from(calendarSyncEventsTable)
    .where(eq(calendarSyncEventsTable.connectionId, connectionId));
  
  if (events.length === 0) {
    return 0;
  }
  
  const [connection] = await db.select()
    .from(calendarConnectionsTable)
    .where(eq(calendarConnectionsTable.id, connectionId))
    .limit(1);
  
  if (!connection) {
    return 0;
  }
  
  let deletedCount = 0;
  
  try {
    const calendar = await getCalendarClient(connectionId);
    
    for (const event of events) {
      try {
        await calendar.events.delete({
          calendarId: connection.calendarId,
          eventId: event.googleEventId,
        });
        deletedCount++;
      } catch (error: any) {
        if (error.code !== 404) {
          console.error(`[CalendarSync] Failed to delete event ${event.googleEventId}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('[CalendarSync] Failed to initialize calendar client for deletion:', error);
  }
  
  await db.delete(calendarSyncEventsTable)
    .where(eq(calendarSyncEventsTable.connectionId, connectionId));
  
  return deletedCount;
}

export async function revokeCalendarAccess(connectionId: string): Promise<void> {
  const [connection] = await db.select()
    .from(calendarConnectionsTable)
    .where(eq(calendarConnectionsTable.id, connectionId))
    .limit(1);
  
  if (!connection) {
    return;
  }
  
  try {
    const accessToken = decrypt(connection.accessToken);
    const oauth2Client = createOAuth2Client();
    await oauth2Client.revokeToken(accessToken);
  } catch (error) {
    console.error('[CalendarSync] Failed to revoke token (may already be revoked):', error);
  }
  
  await db.delete(calendarConnectionsTable)
    .where(eq(calendarConnectionsTable.id, connectionId));
}
