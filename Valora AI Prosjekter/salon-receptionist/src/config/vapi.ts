/**
 * Vapi.ai API client (thin axios wrapper).
 *
 * Vapi is the voice AI layer. This module provides:
 * - A pre-configured axios instance pointing at the Vapi REST API
 * - Webhook signature verification for incoming Vapi events
 *
 * Key Vapi concepts used in this project:
 * - Assistant:  One Vapi assistant per tenant, configured with the salon's
 *               name, language (nb-NO), voice, and system prompt.
 * - Phone Number: Vapi phone numbers are linked to Twilio numbers. Twilio
 *                 routes calls → Vapi assistant.
 * - Tool calls: Vapi calls our n8n webhook URLs to check availability /
 *               create bookings mid-call.
 * - Call events: Vapi posts webhook events (call-started, transcript,
 *                call-ended) to /api/v1/vapi/events.
 */

import axios from 'axios';
import crypto from 'crypto';
import { env } from './env';

export const vapiClient = axios.create({
  baseURL: 'https://api.vapi.ai',
  headers: {
    Authorization: `Bearer ${env.VAPI_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

/**
 * Verify that an incoming webhook request was signed by Vapi.
 * Vapi sends an `x-vapi-signature` header (HMAC-SHA256).
 */
export function validateVapiSignature(rawBody: string, signature: string): boolean {
  const expected = crypto
    .createHmac('sha256', env.VAPI_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
