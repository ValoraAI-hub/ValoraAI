/**
 * Booking domain types.
 *
 * A booking is created mid-call by Vapi (via tool call → n8n → Google Calendar).
 * The call flow:
 *   1. Caller says they want to book a haircut on Friday at 14:00
 *   2. Vapi calls the `check_availability` tool → n8n workflow
 *   3. n8n checks Google Calendar, returns available slots
 *   4. Caller confirms slot
 *   5. Vapi calls `create_booking` tool → n8n workflow
 *   6. n8n creates Google Calendar event, POSTs result to /n8n/booking/confirm
 *   7. We insert booking row, send SMS confirmation via 46elks
 */

import { z } from 'zod';

export const CreateBookingSchema = z.object({
  tenantId: z.string().uuid(),
  customerName: z.string().min(2).max(100),
  customerPhone: z.string().regex(/^\+47\d{8}$/),
  service: z.string().min(2),
  staffMember: z.string().optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  callId: z.string().optional(),
});

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Booking {
  id: string;
  createdAt: string;
  tenantId: string;
  customerName: string;
  customerPhone: string;
  service: string;
  staffMember: string | null;
  startsAt: string;
  endsAt: string;
  googleEventId: string | null;
  status: BookingStatus;
  smsSent: boolean;
  callId: string | null;
}
