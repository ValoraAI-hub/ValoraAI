/**
 * Supabase client (service-role).
 *
 * The service-role client bypasses Row Level Security and is used
 * exclusively server-side. Never expose this key to clients.
 *
 * For per-tenant RLS contexts, create a separate client with the
 * tenant's JWT from Supabase Auth (TODO: per-tenant auth flow).
 */

import { createClient } from '@supabase/supabase-js';
import { env } from './env';
import type { Database } from '../types/database';

export const supabase = createClient<Database>(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
