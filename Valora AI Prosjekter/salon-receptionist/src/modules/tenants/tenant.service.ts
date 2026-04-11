/**
 * Tenant service — business logic layer.
 *
 * Orchestrates:
 * - Creating a new tenant (validate → insert DB → provision Vapi assistant)
 * - Resolving a tenant from an incoming phone number (hot path: cache this)
 * - Deactivating a tenant (DB update + optionally release Twilio number)
 *
 * Cache strategy (TODO):
 *   Phone-number → tenant lookups happen on every inbound call.
 *   Use an in-memory LRU cache (or Redis) with a short TTL (e.g., 60s)
 *   to avoid a DB round-trip on every call.
 */

import { tenantRepository } from './tenant.repository';
import type { Tenant, CreateTenantInput } from './tenant.types';
import type { TenantContext } from '../../types';

export const tenantService = {
  async listAll(): Promise<Tenant[]> {
    return tenantRepository.findAll();
  },

  async getById(id: string): Promise<Tenant | null> {
    return tenantRepository.findById(id);
  },

  async getByPhoneNumber(phoneNumber: string): Promise<TenantContext | null> {
    const tenant = await tenantRepository.findByPhoneNumber(phoneNumber);
    if (!tenant) return null;

    // Map DB model → TenantContext (attached to req.tenant)
    return {
      tenantId: tenant.id,
      salonName: tenant.salonName,
      phoneNumber: tenant.phoneNumber,
      googleCalendarId: tenant.googleCalendarId,
      vapiAssistantId: tenant.vapiAssistantId,
      timezone: tenant.timezone,
      locale: tenant.locale,
    };
  },

  async create(input: CreateTenantInput): Promise<Tenant> {
    // TODO: validate input with CreateTenantSchema
    // TODO: check phone number not already in use
    // TODO: provision Vapi assistant (vapiService.createAssistant(input))
    // TODO: insert tenant with vapiAssistantId
    return tenantRepository.create(input);
  },

  async update(id: string, patch: Partial<CreateTenantInput>): Promise<Tenant> {
    return tenantRepository.update(id, patch);
  },

  async deactivate(id: string): Promise<void> {
    // TODO: optionally call vapiClient to delete assistant
    return tenantRepository.deactivate(id);
  },
};
