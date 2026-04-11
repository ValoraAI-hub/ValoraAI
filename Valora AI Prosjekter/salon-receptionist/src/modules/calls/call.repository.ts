/**
 * Call log repository — Supabase data access for call_logs table.
 */

import { supabase } from '../../config/supabase';
import type { CallLog, CreateCallLogInput, CallOutcome } from './call.types';

// ── Row mapper ────────────────────────────────────────────────────────────────
function mapRow(row: Record<string, unknown>): CallLog {
  return {
    id: row.id as string,
    createdAt: row.created_at as string,
    tenantId: row.tenant_id as string,
    vapiCallId: row.vapi_call_id as string,
    callerNumber: row.caller_number as string,
    durationSeconds: row.duration_seconds as number | null,
    outcome: row.outcome as CallOutcome,
    transcript: row.transcript as string | null,
    bookingId: row.booking_id as string | null,
  };
}

export const callRepository = {
  /** Insert a new call log row as soon as Vapi fires call-started. */
  async create(input: CreateCallLogInput): Promise<CallLog> {
    const { data, error } = await supabase
      .from('call_logs')
      .insert({
        tenant_id: input.tenantId,
        vapi_call_id: input.vapiCallId,
        caller_number: input.callerNumber,
        outcome: 'no_action',
      })
      .select()
      .single();
    if (error) throw error;
    return mapRow(data);
  },

  /** Update the call log once Vapi fires call-ended. */
  async finalise(
    vapiCallId: string,
    update: {
      outcome: CallOutcome;
      durationSeconds: number;
      transcript?: string;
      bookingId?: string;
    },
  ): Promise<void> {
    const patch: Record<string, unknown> = {
      outcome: update.outcome,
      duration_seconds: update.durationSeconds,
    };
    if (update.transcript !== undefined) patch.transcript  = update.transcript;
    if (update.bookingId  !== undefined) patch.booking_id  = update.bookingId;

    const { error } = await supabase
      .from('call_logs')
      .update(patch)
      .eq('vapi_call_id', vapiCallId);
    if (error) throw error;
  },

  async findByTenant(tenantId: string): Promise<CallLog[]> {
    const { data, error } = await supabase
      .from('call_logs')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapRow);
  },
};
