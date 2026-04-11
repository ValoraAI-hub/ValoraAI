/**
 * n8n integration routes.
 *
 * n8n workflows call these endpoints to push booking results back to
 * this service after processing check-availability / create-booking logic.
 *
 * All requests must include the shared secret:
 *   Authorization: Bearer <N8N_WEBHOOK_SECRET>
 *
 * POST /n8n/booking/confirm
 *   n8n calls this after successfully creating a booking in Google Calendar.
 *   Body: { bookingId, googleEventId, startsAt, endsAt }
 *   Action: update booking status → 'confirmed', trigger SMS via 46elks.
 *
 * POST /n8n/booking/cancel
 *   n8n calls this after cancelling a booking.
 *   Body: { bookingId }
 *   Action: update booking status → 'cancelled', send cancellation SMS.
 */

import { Router } from 'express';
// import { handleBookingConfirm, handleBookingCancel } from '../modules/bookings/booking.controller'; // TODO

export const n8nRouter = Router();

n8nRouter.post('/booking/confirm', (_req, res) => {
  // TODO: verify N8N_WEBHOOK_SECRET
  // TODO: call bookingService.confirm(req.body)
  // TODO: send SMS confirmation via smsService
  res.sendStatus(204);
});

n8nRouter.post('/booking/cancel', (_req, res) => {
  // TODO: verify N8N_WEBHOOK_SECRET
  // TODO: call bookingService.cancel(req.body.bookingId)
  // TODO: send cancellation SMS
  res.sendStatus(204);
});
