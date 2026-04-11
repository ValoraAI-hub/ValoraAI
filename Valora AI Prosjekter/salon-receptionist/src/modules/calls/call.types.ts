/**
 * Call log domain types.
 *
 * Every inbound call is logged regardless of outcome.
 * This drives reporting (calls per salon, conversion rates, etc.)
 * and makes debugging easier (full transcript + Vapi call ID).
 */

export type CallOutcome = 'booked' | 'cancelled' | 'info_only' | 'no_action' | 'error';

export interface CallLog {
  id: string;
  createdAt: string;
  tenantId: string;
  vapiCallId: string;
  callerNumber: string;
  durationSeconds: number | null;
  outcome: CallOutcome;
  transcript: string | null;
  bookingId: string | null;
}

export interface CreateCallLogInput {
  tenantId: string;
  vapiCallId: string;
  callerNumber: string;
}

/** Shape of the Vapi call-ended event payload (partial — add fields as needed). */
export interface VapiCallEndedEvent {
  type: 'call-ended';
  call: {
    id: string;
    endedReason: string;
    duration: number;
    transcript?: string;
    customer?: { number: string };
  };
}

export interface VapiCallStartedEvent {
  type: 'call-started';
  call: {
    id: string;
    customer?: { number: string };
  };
}
