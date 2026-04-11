/**
 * Twilio webhook routes.
 *
 * POST /twilio/voice
 *   Receives every inbound call on any tenant phone number.
 *   1. Validates the Twilio request signature (skipped if BASE_URL is unset / dev).
 *   2. resolveTenantByPhone middleware resolves the salon from the `To` number.
 *   3. Responds with TwiML that redirects the call to the tenant's Vapi assistant.
 *      Vapi then drives the conversation and fires events back to /vapi/events.
 *
 * POST /twilio/status
 *   Receives call-status change callbacks (ringing → in-progress → completed).
 *   Used for lightweight logging; the canonical call record is written by the
 *   Vapi call-started / call-ended events.
 */

import { Router, type Request, type Response } from 'express';
import twilio from 'twilio';
import { resolveTenantByPhone } from '../middleware/tenant.middleware';
import { validateTwilioSignature } from '../config/twilio';
import { env } from '../config/env';
import { logger } from '../config/logger';

export const twilioRouter = Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Verify the `X-Twilio-Signature` header so we only process genuine Twilio
 * requests.  Signature validation requires knowing the full public URL Twilio
 * used when it made the request, so it is skipped in development when BASE_URL
 * is not configured (e.g. running without ngrok).
 */
function isTwilioSignatureValid(req: Request, path: string): boolean {
  if (!env.BASE_URL) {
    // No public URL configured — skip in dev, warn so it's not missed.
    logger.warn('BASE_URL not set; skipping Twilio signature validation');
    return true;
  }
  const signature = req.headers['x-twilio-signature'] as string | undefined;
  if (!signature) return false;
  const url = `${env.BASE_URL}/api/v1/twilio${path}`;
  return validateTwilioSignature(signature, url, req.body as Record<string, string>);
}

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * Inbound call handler.
 *
 * The `resolveTenantByPhone` middleware runs first and attaches `req.tenant`
 * (or returns 404 if the dialled number has no active tenant).
 */
twilioRouter.post('/voice', resolveTenantByPhone, (req: Request, res: Response) => {
  // 1. Validate Twilio signature
  if (!isTwilioSignatureValid(req, '/voice')) {
    logger.warn({ ip: req.ip }, 'Rejected request with invalid Twilio signature on /voice');
    // Respond with TwiML <Reject> so Twilio plays the busy tone and hangs up cleanly.
    res
      .status(403)
      .type('text/xml')
      .send('<?xml version="1.0" encoding="UTF-8"?><Response><Reject reason="busy"/></Response>');
    return;
  }

  const tenant = req.tenant!; // guaranteed by resolveTenantByPhone
  const callerNumber = (req.body as Record<string, string>).From ?? 'unknown';

  logger.info(
    {
      salon: tenant.salonName,
      to: tenant.phoneNumber,
      from: callerNumber,
      vapiAssistantId: tenant.vapiAssistantId,
    },
    'Routing inbound call to Vapi assistant',
  );

  // 2. Build TwiML that hands the call off to Vapi.
  //    Twilio will POST all call parameters to Vapi's inbound webhook, which
  //    then creates a call session for the specified assistant.
  const twiml = new twilio.twiml.VoiceResponse();
  twiml.redirect(
    { method: 'POST' },
    `https://api.vapi.ai/twilio?assistantId=${tenant.vapiAssistantId}`,
  );

  res.type('text/xml').send(twiml.toString());
});

/**
 * Call-status callback.
 *
 * Twilio fires this when call state changes: queued → ringing → in-progress
 * → completed (or no-answer / busy / failed).  We log the transition here;
 * the full call record (duration, transcript, outcome) is written by the Vapi
 * call-ended event handler in vapi.routes.ts.
 */
twilioRouter.post('/status', (req: Request, res: Response) => {
  if (!isTwilioSignatureValid(req, '/status')) {
    logger.warn({ ip: req.ip }, 'Rejected request with invalid Twilio signature on /status');
    res.sendStatus(403);
    return;
  }

  const { CallSid, CallStatus, CallDuration, To, From } = req.body as Record<string, string>;

  logger.info(
    { CallSid, CallStatus, CallDuration, To, From },
    'Twilio status callback',
  );

  // 204 No Content — Twilio does not expect a body here.
  res.sendStatus(204);
});
