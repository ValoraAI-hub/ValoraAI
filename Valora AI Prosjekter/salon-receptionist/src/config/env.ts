/**
 * Centralised environment variable validation using Zod.
 *
 * Import `env` everywhere instead of accessing process.env directly.
 * The app will throw at startup if any required variable is missing,
 * preventing silent runtime failures.
 */

import { z } from 'zod';

const envSchema = z.object({
  // Server
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  BASE_URL: z.string().url().optional(), // set to your public ngrok/domain URL; required for Twilio signature validation

  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_ANON_KEY: z.string().min(1),

  // Twilio
  TWILIO_ACCOUNT_SID: z.string().startsWith('AC'),
  TWILIO_AUTH_TOKEN: z.string().min(1),

  // Vapi
  VAPI_API_KEY: z.string().min(1),
  VAPI_WEBHOOK_SECRET: z.string().optional().default(''), // required in production; used for webhook HMAC verification

  // Google Calendar (optional until calendar integration is wired up)
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().email().optional(),
  GOOGLE_PRIVATE_KEY: z.string().optional(),
  GOOGLE_PROJECT_ID: z.string().optional(),

  // 46elks
  FORTYSIX_ELKS_API_USERNAME: z.string().min(1),
  FORTYSIX_ELKS_API_PASSWORD: z.string().min(1),
  FORTYSIX_ELKS_FROM_NUMBER: z.string().startsWith('+47').optional(), // required when SMS is wired up

  // n8n (optional until n8n integration is wired up)
  N8N_WEBHOOK_BASE_URL: z.string().url().optional(),
  N8N_WEBHOOK_SECRET: z.string().optional(),

  // Security
  API_SECRET_KEY: z.string().min(1).optional(), // required in production for admin routes
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:\n', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
