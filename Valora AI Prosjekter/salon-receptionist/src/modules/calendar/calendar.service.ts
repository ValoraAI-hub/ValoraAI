/**
 * Calendar service — Google Calendar integration.
 *
 * checkAvailability:
 *   Fetches busy periods from the tenant's calendar using the freebusy API.
 *   Returns a list of free TimeSlots that fit the requested duration.
 *   Called by Vapi tool `check_availability` (via n8n or direct tool call).
 *
 * createEvent:
 *   Inserts a new event into the tenant's calendar.
 *   Called by n8n after the caller confirms a booking.
 *
 * deleteEvent:
 *   Removes an event (on cancellation).
 *
 * Note: all times should be stored and returned in UTC;
 * display conversion to Europe/Oslo happens at the edge (SMS, Vapi TTS).
 */

import { calendarClient } from '../../config/google-calendar';
import type {
  CheckAvailabilityInput,
  CreateCalendarEventInput,
  CalendarEvent,
  TimeSlot,
} from './calendar.types';

export const calendarService = {
  async checkAvailability(input: CheckAvailabilityInput): Promise<TimeSlot[]> {
    // TODO:
    // 1. Define time window = start of input.date to end of input.date (in input.timezone)
    // 2. Call calendarClient.freebusy.query({ requestBody: { timeMin, timeMax, items: [{ id }] } })
    // 3. Parse busy periods, compute free slots of input.durationMinutes
    // 4. Return array of TimeSlot
    void calendarClient; void input;
    return [];
  },

  async createEvent(input: CreateCalendarEventInput): Promise<CalendarEvent> {
    // TODO:
    // const { data } = await calendarClient.events.insert({
    //   calendarId: input.calendarId,
    //   requestBody: { summary: input.title, description: input.description,
    //     start: { dateTime: input.startsAt }, end: { dateTime: input.endsAt },
    //     attendees: input.attendeeEmail ? [{ email: input.attendeeEmail }] : [] }
    // });
    // return { googleEventId: data.id!, htmlLink: data.htmlLink!, ... }
    void input;
    throw new Error('Not implemented');
  },

  async deleteEvent(calendarId: string, eventId: string): Promise<void> {
    // TODO: await calendarClient.events.delete({ calendarId, eventId })
    void calendarId; void eventId;
  },
};
