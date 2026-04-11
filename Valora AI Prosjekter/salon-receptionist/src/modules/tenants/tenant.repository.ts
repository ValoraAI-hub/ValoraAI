/**
 * Tenant repository — direct Supabase access layer.
 *
 * Only this file should run raw Supabase queries for the tenants table.
 * Business logic lives in tenant.service.ts.
 */

import { supabase } from '../../config/supabase';
import type { Tenant, CreateTenantInput } from './tenant.types';

// ── Row mapper ────────────────────────────────────────────────────────────────
// Translates snake_case DB columns → camelCase domain model.
function mapRow(row: Record<string, unknown>): Tenant {
  return {
    id: row.id as string,
    createdAt: row.created_at as string,
    salonName: row.salon_name as string,
    phoneNumber: row.phone_number as string,
    googleCalendarId: row.google_calendar_id as string,
    vapiAssistantId: row.vapi_assistant_id as string,
    timezone: row.timezone as string,
    locale: row.locale as string,
    active: row.active as boolean,
  };
}

export const tenantRepository = {
  async findAll(): Promise<Tenant[]> {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapRow);
  },

  async findById(id: string): Promise<Tenant | null> {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', id)
      .single();
    // PGRST116 = "no rows returned" — not a real error
    if (error && error.code !== 'PGRST116') throw error;
    return data ? mapRow(data) : null;
  },

  async findByPhoneNumber(phoneNumber: string): Promise<Tenant | null> {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('phone_number', phoneNumber)
      .eq('active', true)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? mapRow(data) : null;
  },

  async create(input: CreateTenantInput): Promise<Tenant> {
    const { data, error } = await supabase
      .from('tenants')
      .insert({
        salon_name: input.salonName,
        phone_number: input.phoneNumber,
        google_calendar_id: input.googleCalendarId,
        vapi_assistant_id: input.vapiAssistantId,
        timezone: input.timezone,
        locale: input.locale,
      })
      .select()
      .single();
    if (error) throw error;
    return mapRow(data);
  },

  async update(id: string, patch: Partial<CreateTenantInput>): Promise<Tenant> {
    // Build a DB-column patch object from only the provided fields
    const dbPatch: Record<string, unknown> = {};
    if (patch.salonName !== undefined)        dbPatch.salon_name         = patch.salonName;
    if (patch.phoneNumber !== undefined)      dbPatch.phone_number       = patch.phoneNumber;
    if (patch.googleCalendarId !== undefined) dbPatch.google_calendar_id = patch.googleCalendarId;
    if (patch.vapiAssistantId !== undefined)  dbPatch.vapi_assistant_id  = patch.vapiAssistantId;
    if (patch.timezone !== undefined)         dbPatch.timezone           = patch.timezone;
    if (patch.locale !== undefined)           dbPatch.locale             = patch.locale;

    const { data, error } = await supabase
      .from('tenants')
      .update(dbPatch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapRow(data);
  },

  async deactivate(id: string): Promise<void> {
    const { error } = await supabase
      .from('tenants')
      .update({ active: false })
      .eq('id', id);
    if (error) throw error;
  },
};
