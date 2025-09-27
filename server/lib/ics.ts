/**
 * ICS (iCalendar) event generation utilities
 */

export interface IcsEventData {
  title: string;
  startDate: Date;
  description: string;
  durationHours?: number;
  location?: string;
}

/**
 * Generate an ICS calendar event file as a Buffer
 */
export function makeIcsEvent(data: IcsEventData): Buffer {
  const { title, startDate, description, durationHours = 1, location } = data;
  
  // Calculate end date (1 hour default duration)
  const endDate = new Date(startDate.getTime() + (durationHours * 60 * 60 * 1000));
  
  // Format dates in UTC for ICS format (YYYYMMDDTHHMMSSZ)
  const formatIcsDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };
  
  // Generate unique identifier
  const uid = `maintenance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@agenthub.com`;
  
  // Current timestamp for DTSTAMP
  const now = new Date();
  const dtstamp = formatIcsDate(now);
  
  // Escape special characters in text fields
  const escapeIcsText = (text: string): string => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '');
  };
  
  // Build ICS content
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AgentHub//Home Maintenance//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${formatIcsDate(startDate)}`,
    `DTEND:${formatIcsDate(endDate)}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    location ? `LOCATION:${escapeIcsText(location)}` : null,
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'CATEGORIES:Home Maintenance',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M', // 15 minutes before
    'ACTION:DISPLAY',
    `DESCRIPTION:Reminder: ${escapeIcsText(title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(line => line !== null).join('\r\n');
  
  return Buffer.from(icsContent, 'utf8');
}

/**
 * Create maintenance task reminder event
 */
export function createMaintenanceReminderEvent(
  taskName: string,
  dueDate: Date,
  description: string,
  homeAddress?: string
): Buffer {
  return makeIcsEvent({
    title: `🏠 ${taskName}`,
    startDate: dueDate,
    description: `Home Maintenance Task: ${description}\n\nScheduled via AgentHub - Smart Home Maintenance`,
    durationHours: 2, // Most maintenance tasks take 1-2 hours
    location: homeAddress || 'Your Home'
  });
}