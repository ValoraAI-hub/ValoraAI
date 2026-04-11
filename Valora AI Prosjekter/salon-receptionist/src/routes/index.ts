/**
 * Root router — mounts all sub-routers under /api/v1.
 *
 * Route map:
 *   POST /api/v1/twilio/voice        ← Twilio calls this when a call arrives
 *   POST /api/v1/twilio/status       ← Twilio call status callbacks
 *   POST /api/v1/vapi/events         ← Vapi posts call lifecycle events here
 *   POST /api/v1/n8n/booking         ← n8n calls this to confirm a booking
 *   GET  /api/v1/admin/tenants       ← Admin: list tenants
 *   POST /api/v1/admin/tenants       ← Admin: create tenant
 *   GET  /api/v1/health              ← Health check (no auth)
 */

import { Router } from 'express';
import { twilioRouter } from './twilio.routes';
import { vapiRouter } from './vapi.routes';
import { n8nRouter } from './n8n.routes';
import { adminRouter } from './admin.routes';

export const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok' }));

router.use('/twilio', twilioRouter);
router.use('/vapi', vapiRouter);
router.use('/n8n', n8nRouter);
router.use('/admin', adminRouter);
