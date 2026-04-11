/**
 * Admin routes (protected by API key).
 *
 * Used internally to manage tenants and inspect system state.
 * Not exposed to callers or salon staff.
 *
 * GET  /admin/tenants             → list all tenants
 * POST /admin/tenants             → onboard a new salon
 * GET  /admin/tenants/:id         → get tenant details
 * PATCH /admin/tenants/:id        → update tenant config
 * DELETE /admin/tenants/:id       → deactivate tenant
 *
 * GET  /admin/tenants/:id/calls   → call log for a tenant
 * GET  /admin/tenants/:id/bookings → bookings for a tenant
 */

import { Router } from 'express';
import { requireApiKey } from '../middleware/auth.middleware';
// import { tenantController } from '../modules/tenants/tenant.controller'; // TODO

export const adminRouter = Router();

adminRouter.use(requireApiKey);

adminRouter.get('/tenants', (_req, res) => {
  // TODO: return tenantService.listAll()
  res.json({ success: true, data: [] });
});

adminRouter.post('/tenants', (_req, res) => {
  // TODO: validate body with Zod schema
  // TODO: call tenantService.create(req.body)
  // TODO: provision Vapi assistant for the new tenant
  // TODO: link Twilio number to Vapi
  res.status(201).json({ success: true, data: null });
});

adminRouter.get('/tenants/:id', (_req, res) => {
  // TODO: return tenantService.getById(req.params.id)
  res.json({ success: true, data: null });
});

adminRouter.patch('/tenants/:id', (_req, res) => {
  // TODO: validate body, call tenantService.update(req.params.id, req.body)
  res.json({ success: true, data: null });
});

adminRouter.delete('/tenants/:id', (_req, res) => {
  // TODO: call tenantService.deactivate(req.params.id)
  res.sendStatus(204);
});

adminRouter.get('/tenants/:id/calls', (_req, res) => {
  // TODO: return callLogRepository.findByTenant(req.params.id)
  res.json({ success: true, data: [] });
});

adminRouter.get('/tenants/:id/bookings', (_req, res) => {
  // TODO: return bookingRepository.findByTenant(req.params.id)
  res.json({ success: true, data: [] });
});
