/**
 * Google Calendar API client (service account).
 *
 * Each tenant has one Google Calendar. The calendar ID is stored in
 * the `tenants` table (`google_calendar_id`).
 *
 * The service account must be granted "Make changes to events" access
 * on each tenant's calendar (shared via the Google Calendar UI or API).
 *
 * Scopes used:
 * - https://www.googleapis.com/auth/calendar  (read + write events)
 */

import { google } from 'googleapis';
import { env } from './env';

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

export const calendarClient = google.calendar({ version: 'v3', auth });
