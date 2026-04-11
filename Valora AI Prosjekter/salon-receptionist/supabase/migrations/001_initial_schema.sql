-- ─────────────────────────────────────────────────────────────────────────────
-- 001_initial_schema.sql
-- Initial database schema for the multi-tenant salon receptionist.
--
-- Run with:
--   npx supabase db push
-- or paste into the Supabase SQL editor.
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─── Tenants ────────────────────────────────────────────────────────────────
-- One row per hair salon.
create table if not exists tenants (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  salon_name          text not null,
  phone_number        text not null unique,          -- +47 E.164 format
  google_calendar_id  text not null,                 -- usually a Google email
  vapi_assistant_id   text not null,                 -- Vapi assistant UUID
  timezone            text not null default 'Europe/Oslo',
  locale              text not null default 'nb-NO',
  active              boolean not null default true
);

comment on table tenants is 'One record per onboarded hair salon (tenant).';

-- ─── Bookings ────────────────────────────────────────────────────────────────
-- One row per appointment booked through the AI receptionist.
create table if not exists bookings (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  tenant_id         uuid not null references tenants(id) on delete cascade,
  customer_name     text not null,
  customer_phone    text not null,                   -- E.164
  service           text not null,                   -- e.g. "Hårklipp dame"
  staff_member      text,                            -- optional, if salon tracks this
  starts_at         timestamptz not null,
  ends_at           timestamptz not null,
  google_event_id   text,                            -- set after Calendar event created
  status            text not null default 'pending'
                      check (status in ('pending', 'confirmed', 'cancelled')),
  sms_sent          boolean not null default false,
  call_id           uuid                             -- FK to call_logs (nullable)
);

create index bookings_tenant_id_idx on bookings(tenant_id);
create index bookings_starts_at_idx on bookings(starts_at);

comment on table bookings is 'Appointments created by the AI receptionist.';

-- ─── Call Logs ───────────────────────────────────────────────────────────────
-- One row per inbound call, regardless of outcome.
create table if not exists call_logs (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  tenant_id         uuid not null references tenants(id) on delete cascade,
  vapi_call_id      text not null unique,            -- Vapi's call identifier
  caller_number     text not null,                   -- E.164 caller ID
  duration_seconds  integer,                         -- set on call-ended event
  outcome           text not null default 'no_action'
                      check (outcome in ('booked','cancelled','info_only','no_action','error')),
  transcript        text,                            -- full call transcript (optional)
  booking_id        uuid references bookings(id)
);

create index call_logs_tenant_id_idx on call_logs(tenant_id);
create index call_logs_created_at_idx on call_logs(created_at desc);

comment on table call_logs is 'Log of every inbound call handled by the AI receptionist.';

-- ─── Row Level Security ──────────────────────────────────────────────────────
-- RLS is enabled so each tenant can only see their own data when accessed
-- with a per-tenant JWT (future: Supabase Auth + tenant claims).
-- The service-role key bypasses RLS for server-side operations.

alter table tenants   enable row level security;
alter table bookings  enable row level security;
alter table call_logs enable row level security;

-- Placeholder RLS policies (tighten before going multi-user on the frontend):
create policy "Service role bypass" on tenants   using (true);
create policy "Service role bypass" on bookings  using (true);
create policy "Service role bypass" on call_logs using (true);
