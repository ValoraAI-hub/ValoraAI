/**
 * Calendar module types.
 *
 * Wraps Google Calendar API responses in domain-friendly shapes.
 */

export interface TimeSlot {
  startsAt: string; // ISO 8601
  endsAt: string;   // ISO 8601
}

export interface CheckAvailabilityInput {
  calendarId: string;    // tenant's Google Calendar ID
  date: string;          // YYYY-MM-DD
  durationMinutes: number;
  timezone: string;
}

export interface CreateCalendarEventInput {
  calendarId: string;
  title: string;         // e.g. "Hårklipp – Anna Hansen"
  description?: string;
  startsAt: string;      // ISO 8601
  endsAt: string;        // ISO 8601
  attendeeEmail?: string;
}

export interface CalendarEvent {
  googleEventId: string;
  htmlLink: string;
  startsAt: string;
  endsAt: string;
}
