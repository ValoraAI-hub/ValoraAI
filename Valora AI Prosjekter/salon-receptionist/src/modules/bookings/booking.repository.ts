/**
 * Booking repository — Supabase data access for bookings table.
 */

import { supabase } from '../../config/supabase';
import type { Booking, CreateBookingInput } from './booking.types';

export const bookingRepository = {
  async create(input: CreateBookingInput): Promise<Booking> {
    // TODO: insert into bookings, return row
    void input; void supabase;
    throw new Error('Not implemented');
  },

  async findByTenant(tenantId: string): Promise<Booking[]> {
    // TODO: select * from bookings where tenant_id = tenantId order by starts_at desc
    void tenantId;
    return [];
  },

  async findById(id: string): Promise<Booking | null> {
    // TODO: select single booking
    void id;
    return null;
  },

  async confirm(id: string, googleEventId: string): Promise<Booking> {
    // TODO: update status = 'confirmed', google_event_id = googleEventId
    void id; void googleEventId;
    throw new Error('Not implemented');
  },

  async cancel(id: string): Promise<Booking> {
    // TODO: update status = 'cancelled'
    void id;
    throw new Error('Not implemented');
  },

  async markSmsSent(id: string): Promise<void> {
    // TODO: update sms_sent = true
    void id;
  },
};
