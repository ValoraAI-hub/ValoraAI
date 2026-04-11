/**
 * Authentication middleware for internal / admin routes.
 *
 * Admin routes (e.g., creating a tenant, viewing all call logs) are
 * protected by a static API key sent in the Authorization header:
 *
 *   Authorization: Bearer <API_SECRET_KEY>
 *
 * For Twilio webhooks, signature validation (see config/twilio.ts) is
 * used instead of this middleware.
 *
 * For Vapi webhooks, HMAC signature validation (see config/vapi.ts) is used.
 */

import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token || token !== env.API_SECRET_KEY) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  next();
}
