/**
 * Shared domain types used across modules.
 *
 * Keep this file focused on lightweight shared contracts.
 * Module-specific types live in their own *.types.ts files.
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/** Attached to express.Request after tenantMiddleware runs. */
export interface TenantContext {
  tenantId: string;
  salonName: string;
  phoneNumber: string;      // E.164 format, e.g. +4712345678
  googleCalendarId: string;
  vapiAssistantId: string;
  timezone: string;         // e.g. "Europe/Oslo"
  locale: string;           // e.g. "nb-NO"
}

declare global {
  namespace Express {
    interface Request {
      tenant?: TenantContext;
    }
  }
}
