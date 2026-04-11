-- ─────────────────────────────────────────────────────────────────────────────
-- 002_add_config_to_tenants.sql
--
-- Adds a `config` JSONB column to the tenants table.
-- This column stores all salon-specific knowledge the Vapi assistant needs:
--   • Opening hours
--   • Services and prices
--   • Stylist roster
--   • Greeting script
--   • Cancellation / no-show policy
--   • Any other per-salon metadata (address, city, Instagram, etc.)
--
-- Using JSONB (not a flat column per field) keeps the tenants table stable as
-- we onboard salons with different offerings, while still allowing indexed
-- queries (e.g. config->>'city' = 'Lillehammer') if needed later.
-- ─────────────────────────────────────────────────────────────────────────────

alter table tenants
  add column if not exists config jsonb not null default '{}'::jsonb;

comment on column tenants.config is
  'Salon-specific configuration: opening hours, services, stylists, greeting, policies, etc.';

-- Optional GIN index for future fast JSONB lookups (e.g. full-text search on config)
create index if not exists tenants_config_gin_idx on tenants using gin (config);
