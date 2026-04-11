/**
 * Tenant resolution middleware.
 *
 * Determines which salon (tenant) owns an incoming request by looking up
 * the destination phone number (`To` field from Twilio, or a `tenantId`
 * query param on internal routes).
 *
 * Flow for inbound Twilio calls:
 *   1. Twilio POSTs to /api/v1/twilio/voice with `To=+4712345678`
 *   2. This middleware queries the `tenants` table by phone_number
 *   3. Attaches the resolved TenantContext to req.tenant
 *   4. Downstream handlers can assume req.tenant is always set
 *
 * Returns 404 if no active tenant matches the number.
 */

import type { Request, Response, NextFunction } from 'express';
import { tenantService } from '../modules/tenants/tenant.service';
import { logger } from '../config/logger';

export async function resolveTenantByPhone(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // Twilio sends the dialled number as `To`; internal callers may use ?phone=
  const toNumber = (req.body?.To ?? req.query?.phone) as string | undefined;

  if (!toNumber) {
    res.status(400).json({ error: 'Missing phone number (expected To field)' });
    return;
  }

  try {
    const tenant = await tenantService.getByPhoneNumber(toNumber);
    if (!tenant) {
      logger.warn({ toNumber }, 'Inbound call to unknown or inactive number');
      res.status(404).json({ error: 'No active tenant found for this number' });
      return;
    }
    req.tenant = tenant;
    next();
  } catch (err) {
    next(err);
  }
}

export async function resolveTenantById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // Accept tenant ID from route params (:tenantId) or a custom header
  const tenantId = (req.params.tenantId ?? req.headers['x-tenant-id']) as string | undefined;

  if (!tenantId) {
    res.status(400).json({ error: 'Missing tenant ID' });
    return;
  }

  try {
    const tenant = await tenantService.getById(tenantId);
    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }
    req.tenant = {
      tenantId: tenant.id,
      salonName: tenant.salonName,
      phoneNumber: tenant.phoneNumber,
      googleCalendarId: tenant.googleCalendarId,
      vapiAssistantId: tenant.vapiAssistantId,
      timezone: tenant.timezone,
      locale: tenant.locale,
    };
    next();
  } catch (err) {
    next(err);
  }
}
