/**
 * Call service — processes Vapi call lifecycle events.
 *
 * onCallStarted:
 *   - Creates a call_log row so we have a record even if the call drops
 *
 * onCallEnded:
 *   - Determines call outcome from Vapi event data
 *   - Finalises the call_log row (duration, transcript, outcome, bookingId)
 *
 * handleToolCall (optional server-side execution):
 *   - If using Vapi "server URL" tools, dispatches to the right service
 *     (calendarService.checkAvailability / bookingService.create)
 *   - Returns the result JSON to Vapi within the 10-second timeout
 */

import { callRepository } from './call.repository';
import type { VapiCallStartedEvent, VapiCallEndedEvent } from './call.types';
import { logger } from '../../config/logger';

export const callService = {
  async onCallStarted(tenantId: string, event: VapiCallStartedEvent): Promise<void> {
    logger.info({ msg: 'Call started', vapiCallId: event.call.id, tenantId });

    // TODO: await callRepository.create({ tenantId, vapiCallId: event.call.id, callerNumber: ... })
    void tenantId; void event; void callRepository;
  },

  async onCallEnded(tenantId: string, event: VapiCallEndedEvent): Promise<void> {
    logger.info({ msg: 'Call ended', vapiCallId: event.call.id, tenantId });

    // TODO: determine outcome (check if a booking was created during this call)
    // TODO: await callRepository.finalise(event.call.id, { outcome, durationSeconds, transcript })
    void tenantId; void event;
  },

  async handleToolCall(
    _toolName: string,
    _args: Record<string, unknown>,
    _tenantId: string,
  ): Promise<unknown> {
    // TODO: switch on toolName:
    //   'check_availability' → calendarService.checkAvailability(tenantId, args)
    //   'create_booking'     → bookingService.create({ tenantId, ...args })
    //   'cancel_booking'     → bookingService.cancel(args.bookingId)
    throw new Error('Not implemented');
  },
};
