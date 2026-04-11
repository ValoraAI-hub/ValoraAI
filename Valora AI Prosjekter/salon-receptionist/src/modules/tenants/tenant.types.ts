/**
 * Tenant domain types.
 *
 * A tenant = one hair salon. Each tenant has:
 * - A dedicated +47 phone number (Twilio)
 * - A dedicated Vapi assistant (configured with their salon info & voice)
 * - A dedicated Google Calendar for appointments
 * - Their own rows in bookings and call_logs (isolated by tenant_id)
 */

import { z } from 'zod';

export const CreateTenantSchema = z.object({
  salonName: z.string().min(2).max(100),
  phoneNumber: z.string().regex(/^\+47\d{8}$/, 'Must be a valid Norwegian number'),
  googleCalendarId: z.string().email('Must be a Google Calendar ID'),
  vapiAssistantId: z.string().min(1),
  timezone: z.string().default('Europe/Oslo'),
  locale: z.string().default('nb-NO'),
});

export type CreateTenantInput = z.infer<typeof CreateTenantSchema>;

export interface Tenant {
  id: string;
  createdAt: string;
  salonName: string;
  phoneNumber: string;
  googleCalendarId: string;
  vapiAssistantId: string;
  timezone: string;
  locale: string;
  active: boolean;
}
