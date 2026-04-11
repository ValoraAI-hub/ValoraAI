/**
 * Twilio client.
 *
 * Used for:
 * - Verifying incoming webhook signatures (validate every request from Twilio)
 * - Programmatically purchasing / releasing phone numbers per tenant (TODO)
 * - Fetching call metadata (duration, recording URL)
 *
 * Each tenant is assigned a dedicated +47 Norwegian number in the
 * `tenants` table. Twilio routes incoming calls to our /api/v1/twilio/voice
 * webhook, which looks up the tenant by `To` number and forwards to
 * the correct Vapi assistant.
 */

import twilio from 'twilio';
import { env } from './env';

export const twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

/** Validate that an incoming request genuinely came from Twilio. */
export function validateTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>,
): boolean {
  return twilio.validateRequest(env.TWILIO_AUTH_TOKEN, signature, url, params);
}
