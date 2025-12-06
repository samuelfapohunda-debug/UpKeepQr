/**
 * Google Calendar integration using Replit's connector
 * This module provides calendar access through the Replit-managed OAuth connection
 */
import { google, calendar_v3 } from 'googleapis';

let connectionSettings: any;

async function getAccessToken(): Promise<string> {
  if (connectionSettings && connectionSettings.settings?.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  if (!hostname) {
    throw new Error('REPLIT_CONNECTORS_HOSTNAME not configured');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-calendar',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Calendar not connected via Replit connector');
  }
  return accessToken;
}

export async function getGoogleCalendarClient(): Promise<calendar_v3.Calendar> {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export async function isCalendarConnected(): Promise<boolean> {
  try {
    await getAccessToken();
    return true;
  } catch {
    return false;
  }
}

export async function getCalendarInfo(): Promise<{
  calendarId: string;
  calendarName: string;
  timezone: string;
} | null> {
  try {
    const calendar = await getGoogleCalendarClient();
    const response = await calendar.calendars.get({ calendarId: 'primary' });
    
    return {
      calendarId: response.data.id || 'primary',
      calendarName: response.data.summary || 'Primary Calendar',
      timezone: response.data.timeZone || 'America/New_York',
    };
  } catch (error) {
    console.error('[ReplitCalendar] Failed to get calendar info:', error);
    return null;
  }
}

export interface CalendarEventData {
  summary: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  allDay?: boolean;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{ method: 'email' | 'popup'; minutes: number }>;
  };
}

export async function createCalendarEvent(eventData: CalendarEventData): Promise<string | null> {
  try {
    const calendar = await getGoogleCalendarClient();
    
    const event: calendar_v3.Schema$Event = {
      summary: eventData.summary,
      description: eventData.description,
      start: eventData.allDay 
        ? { date: eventData.startDate.toISOString().split('T')[0] }
        : { dateTime: eventData.startDate.toISOString() },
      end: eventData.allDay
        ? { date: (eventData.endDate || eventData.startDate).toISOString().split('T')[0] }
        : { dateTime: (eventData.endDate || new Date(eventData.startDate.getTime() + 60 * 60 * 1000)).toISOString() },
      reminders: eventData.reminders,
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    console.log('[ReplitCalendar] Event created:', response.data.id);
    return response.data.id || null;
  } catch (error) {
    console.error('[ReplitCalendar] Failed to create event:', error);
    return null;
  }
}

export async function updateCalendarEvent(eventId: string, eventData: Partial<CalendarEventData>): Promise<boolean> {
  try {
    const calendar = await getGoogleCalendarClient();
    
    const event: calendar_v3.Schema$Event = {};
    
    if (eventData.summary) event.summary = eventData.summary;
    if (eventData.description) event.description = eventData.description;
    if (eventData.startDate) {
      event.start = eventData.allDay
        ? { date: eventData.startDate.toISOString().split('T')[0] }
        : { dateTime: eventData.startDate.toISOString() };
    }
    if (eventData.endDate || eventData.startDate) {
      const endDate = eventData.endDate || (eventData.startDate ? new Date(eventData.startDate.getTime() + 60 * 60 * 1000) : undefined);
      if (endDate) {
        event.end = eventData.allDay
          ? { date: endDate.toISOString().split('T')[0] }
          : { dateTime: endDate.toISOString() };
      }
    }

    await calendar.events.patch({
      calendarId: 'primary',
      eventId,
      requestBody: event,
    });

    console.log('[ReplitCalendar] Event updated:', eventId);
    return true;
  } catch (error) {
    console.error('[ReplitCalendar] Failed to update event:', error);
    return false;
  }
}

export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  try {
    const calendar = await getGoogleCalendarClient();
    
    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });

    console.log('[ReplitCalendar] Event deleted:', eventId);
    return true;
  } catch (error) {
    console.error('[ReplitCalendar] Failed to delete event:', error);
    return false;
  }
}

export async function listCalendarEvents(
  timeMin?: Date,
  timeMax?: Date,
  maxResults: number = 100
): Promise<calendar_v3.Schema$Event[]> {
  try {
    const calendar = await getGoogleCalendarClient();
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin?.toISOString(),
      timeMax: timeMax?.toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items || [];
  } catch (error) {
    console.error('[ReplitCalendar] Failed to list events:', error);
    return [];
  }
}
