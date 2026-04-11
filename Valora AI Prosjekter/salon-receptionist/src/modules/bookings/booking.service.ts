/**
 * Booking service — orchestrates booking lifecycle.
 *
 * confirm() is called by the n8n webhook handler after n8n has
 * successfully created the Google Calendar event. It:
 *   1. Updates booking status to 'confirmed'
 *   2. Stores the googleEventId
 *   3. Triggers SMS confirmation via smsService
 *
 * cancel() is called either mid-call (caller changed their mind)
 * or later (salon cancels). It:
 *   1. Updates booking status to 'cancelled'
 *   2. Deletes the Google Calendar event (via calendarService)
 *   3. Sends cancellation SMS
 */

import { bookingRepository } from './booking.repository';
// import { smsService } from '../sms/sms.service'; // TODO
// import { calendarService } from '../calendar/calendar.service'; // TODO
import type { Booking, CreateBookingInput } from './booking.types';

export const bookingService = {
  async create(input: CreateBookingInput): Promise<Booking> {
    // TODO: validate input
    // TODO: check no conflicting booking in our DB (double-book guard)
    return bookingRepository.create(input);
  },

  async confirm(bookingId: string, googleEventId: string): Promise<void> {
    const booking = await bookingRepository.confirm(bookingId, googleEventId);

    // TODO: await smsService.sendConfirmation(booking);
    await bookingRepository.markSmsSent(bookingId);

    void booking;
  },

  async cancel(bookingId: string): Promise<void> {
    const booking = await bookingRepository.cancel(bookingId);

    // TODO: if (booking.googleEventId) await calendarService.deleteEvent(...)
    // TODO: await smsService.sendCancellation(booking);

    void booking;
  },

  async listByTenant(tenantId: string): Promise<Booking[]> {
    return bookingRepository.findByTenant(tenantId);
  },
};
