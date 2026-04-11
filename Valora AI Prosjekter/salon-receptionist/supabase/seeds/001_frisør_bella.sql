-- ─────────────────────────────────────────────────────────────────────────────
-- seeds/001_frisør_bella.sql
--
-- Test tenant: Frisør Bella, Lillehammer
--
-- Prerequisites (run these migrations first):
--   001_initial_schema.sql
--   002_add_config_to_tenants.sql
--
-- To run: paste into the Supabase SQL Editor, or:
--   npx supabase db reset   (re-runs all migrations + seeds)
--
-- Placeholders to replace before going live:
--   vapi_assistant_id  → real Vapi assistant UUID from app.vapi.ai
--   google_calendar_id → service-account-delegated Google Calendar ID
-- ─────────────────────────────────────────────────────────────────────────────

insert into tenants (
  salon_name,
  phone_number,
  google_calendar_id,
  vapi_assistant_id,
  timezone,
  locale,
  active,
  config
)
values (
  'Frisør Bella',
  '+4700000000',                          -- placeholder; replace with real Twilio number
  'placeholder-calendar@placeholder.com', -- replace with real Google Calendar ID
  'placeholder-vapi-assistant-id',        -- replace with real Vapi assistant UUID
  'Europe/Oslo',
  'nb-NO',
  true,

  -- ── Salon config ────────────────────────────────────────────────────────────
  jsonb_build_object(

    -- Basic info
    'salon_name',   'Frisør Bella',
    'city',         'Lillehammer',
    'address',      'Storgata 14, 2609 Lillehammer',
    'phone_display','47 00 00 00',     -- human-readable format for SMS / voice

    -- ── Greeting script (read by the Vapi assistant on call connect) ──────────
    'greeting',
      'Hei og velkommen til Frisør Bella i Lillehammer! '
      'Du har nådd vår digitale resepsjon. '
      'Jeg kan hjelpe deg med å bestille time, avbestille en time, '
      'eller svare på spørsmål om våre tjenester og priser. '
      'Hva kan jeg hjelpe deg med i dag?',

    -- ── Opening hours ─────────────────────────────────────────────────────────
    -- closed_reason shown when called outside hours
    'opening_hours', jsonb_build_object(
      'monday',    jsonb_build_object('open', '09:00', 'close', '18:00'),
      'tuesday',   jsonb_build_object('open', '09:00', 'close', '18:00'),
      'wednesday', jsonb_build_object('open', '09:00', 'close', '18:00'),
      'thursday',  jsonb_build_object('open', '09:00', 'close', '20:00'), -- extended
      'friday',    jsonb_build_object('open', '09:00', 'close', '18:00'),
      'saturday',  jsonb_build_object('open', '09:00', 'close', '16:00'),
      'sunday',    jsonb_build_object('closed', true)
    ),
    'closed_message',
      'Vi er dessverre stengt akkurat nå. '
      'Åpningstidene våre er mandag til fredag 09–18, torsdag til 20, og lørdag 09–16. '
      'Ring oss igjen i åpningstiden, så hjelper vi deg gjerne!',

    -- ── Services & prices ─────────────────────────────────────────────────────
    -- duration_minutes is used when creating Google Calendar events
    'services', jsonb_build_array(

      jsonb_build_object(
        'id',                 'klipp-dame',
        'name',               'Klipp dame',
        'description',        'Inkluderer vask og føn',
        'price_nok',          650,
        'duration_minutes',   60
      ),

      jsonb_build_object(
        'id',                 'klipp-herre',
        'name',               'Klipp herre',
        'description',        'Inkluderer vask',
        'price_nok',          395,
        'duration_minutes',   30
      ),

      jsonb_build_object(
        'id',                 'klipp-barn',
        'name',               'Klipp barn (under 12 år)',
        'description',        'Inkluderer vask',
        'price_nok',          275,
        'duration_minutes',   30
      ),

      jsonb_build_object(
        'id',                 'helfarging',
        'name',               'Helfarging',
        'description',        'Inkluderer klipp og føn',
        'price_nok',          1150,
        'duration_minutes',   120
      ),

      jsonb_build_object(
        'id',                 'stiper-hoydepunkter',
        'name',               'Striper / høydepunkter',
        'description',        'Inkluderer klipp og føn',
        'price_nok',          1450,
        'duration_minutes',   150
      ),

      jsonb_build_object(
        'id',                 'balayage',
        'name',               'Balayage',
        'description',        'Inkluderer klipp og føn. Prisen kan variere etter hårlengde.',
        'price_nok',          1750,
        'duration_minutes',   180
      ),

      jsonb_build_object(
        'id',                 'keratin-behandling',
        'name',               'Keratin behandling',
        'description',        'Glattende og styrkende behandling. Inkluderer vask og føn.',
        'price_nok',          1100,
        'duration_minutes',   120
      ),

      jsonb_build_object(
        'id',                 'harbehandling',
        'name',               'Hårbehandling (Olaplex)',
        'description',        'Reparerende tilleggsbehandling – legges til hvilken som helst tjeneste.',
        'price_nok',          450,
        'duration_minutes',   30,
        'addon',              true
      )

    ), -- end services

    -- ── Stylist roster ────────────────────────────────────────────────────────
    'stylists', jsonb_build_array(

      jsonb_build_object(
        'id',          'maria',
        'name',        'Maria Haugen',
        'title',       'Senior frisør',
        'specialties', jsonb_build_array('balayage', 'helfarging', 'klipp-dame'),
        'bio',         'Maria har 15 års erfaring og er ekspert på fargebehandlinger og moderne klipp.'
      ),

      jsonb_build_object(
        'id',          'ida',
        'name',        'Ida Bakke',
        'title',       'Frisør & kolorist',
        'specialties', jsonb_build_array('stiper-hoydepunkter', 'balayage', 'keratin-behandling'),
        'bio',         'Ida er utdannet kolorist med spesialisering i blondering og naturlige fargetoner.'
      ),

      jsonb_build_object(
        'id',          'lars',
        'name',        'Lars Nygård',
        'title',       'Frisør & barber',
        'specialties', jsonb_build_array('klipp-herre', 'klipp-dame', 'klipp-barn'),
        'bio',         'Lars er salongens herrekspert og tar imot kunder i alle aldre.'
      )

    ), -- end stylists

    -- ── Booking rules ─────────────────────────────────────────────────────────
    'booking_rules', jsonb_build_object(
      'min_advance_minutes',  60,   -- earliest a same-day booking can be made
      'max_advance_days',     60,   -- how far ahead customers can book
      'slot_interval_minutes', 15   -- calendar granularity
    ),

    -- ── Cancellation & no-show policy ─────────────────────────────────────────
    'cancellation_policy', jsonb_build_object(
      'free_cancellation_hours', 24,
      'late_cancellation_fee_pct', 50,
      'no_show_fee_pct', 100,
      'policy_text',
        'Avbestilling må skje senest 24 timer før avtalt time. '
        'Ved avbestilling etter fristen eller uteblivelse uten varsel '
        'forbeholder vi oss retten til å belaste 50 % av tjenestens pris. '
        'Gjentatt uteblivelse kan medføre krav om forhåndsbetaling ved fremtidige bestillinger.'
    )

  ) -- end jsonb_build_object (config)

)
on conflict (phone_number) do update
  set
    salon_name         = excluded.salon_name,
    google_calendar_id = excluded.google_calendar_id,
    vapi_assistant_id  = excluded.vapi_assistant_id,
    timezone           = excluded.timezone,
    locale             = excluded.locale,
    active             = excluded.active,
    config             = excluded.config;

-- Verify the row was written correctly
select
  id,
  salon_name,
  phone_number,
  active,
  config->>'city'                                  as city,
  config->'opening_hours'->'thursday'->>'close'    as thursday_close,
  jsonb_array_length(config->'services')           as service_count,
  jsonb_array_length(config->'stylists')           as stylist_count
from tenants
where phone_number = '+4700000000';
