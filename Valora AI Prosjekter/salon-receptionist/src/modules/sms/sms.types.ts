/**
 * SMS module types.
 *
 * 46elks is used for SMS because it has excellent Norwegian number support
 * and lets us send from a real +47 number (better delivery, no spam filters).
 *
 * All SMS messages are in Norwegian (nb-NO).
 */

export interface SendSmsInput {
  to: string;      // E.164, e.g. +4798765432
  message: string; // Max 160 chars for single SMS; 46elks auto-splits longer messages
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
