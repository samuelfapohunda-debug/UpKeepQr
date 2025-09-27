import { createEvent as icsCreateEvent, EventAttributes } from 'ics';

export interface CalendarEvent {
  title: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
}

export function createEvent(eventData: CalendarEvent): string {
  const startDate = new Date(eventData.start);
  const endDate = new Date(eventData.end);
  
  const event: EventAttributes = {
    start: [
      startDate.getFullYear(),
      startDate.getMonth() + 1,
      startDate.getDate(),
      startDate.getHours(),
      startDate.getMinutes(),
    ],
    end: [
      endDate.getFullYear(),
      endDate.getMonth() + 1,
      endDate.getDate(),
      endDate.getHours(),
      endDate.getMinutes(),
    ],
    title: eventData.title,
    description: eventData.description,
    location: eventData.location,
    status: 'CONFIRMED',
    busyStatus: 'BUSY',
  };

  const { error, value } = icsCreateEvent(event);
  
  if (error) {
    throw new Error(`Failed to create ICS event: ${error.message}`);
  }
  
  return value || '';
}

export function createAgentScheduleEvent(agentId: string, eventData: CalendarEvent): string {
  return createEvent({
    ...eventData,
    title: `[Agent ${agentId}] ${eventData.title}`,
  });
}
