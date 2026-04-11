# Salon Receptionist — AI Phone Receptionist for Norwegian Hair Salons

A multi-tenant voice AI receptionist that answers calls, checks availability, and books appointments — in Norwegian.

---

## Architecture Overview

```
Caller (📞)
    │
    ▼
Twilio (+47 number)
    │  routes call by destination number
    ▼
Vapi.ai (Voice AI)
    │  speech-to-text → LLM → text-to-speech (nb-NO)
    │  tool calls for booking actions
    ▼
┌───────────────────────────────┐
│  This Express Server          │
│  /api/v1/twilio/voice         │  ← Twilio webhook (call routing)
│  /api/v1/vapi/events          │  ← Vapi lifecycle events
│  /api/v1/vapi/tool-calls      │  ← Vapi tool execution (optional)
│  /api/v1/n8n/booking/*        │  ← n8n booking results
│  /api/v1/admin/*              │  ← Internal management
└───────────┬───────────────────┘
            │
     ┌──────┴──────┐
     │             │
     ▼             ▼
  Supabase      n8n (automation)
  (PostgreSQL)      │
                    ├── Google Calendar API (per tenant)
                    └── 46elks (SMS confirmations)
```

### Multi-tenancy

Each hair salon is a **tenant** with:
- A dedicated Norwegian phone number (`+47xxxxxxxx`) registered in Twilio
- A dedicated Vapi assistant (personalised with salon name, services, voice)
- A dedicated Google Calendar for appointments
- Isolated data rows in Supabase (filtered by `tenant_id`)

Tenant resolution happens at the webhook layer: when Twilio posts an inbound call, the `To` field (the dialled number) is looked up in the `tenants` table to identify the salon.

---

## Call Flow (Happy Path)

```
1. Customer calls +47 12 34 56 78 (Salon A's number)
2. Twilio → POST /api/v1/twilio/voice?To=+4712345678
3. Server looks up tenant by phone number → finds Salon A
4. Server returns TwiML connecting call to Salon A's Vapi assistant
5. Vapi greets caller in Norwegian, asks how it can help
6. Caller: "Jeg vil booke hårklipp på fredag klokka 14"
7. Vapi calls tool `check_availability` → n8n workflow
8. n8n queries Salon A's Google Calendar → returns free slots
9. Vapi confirms slot with caller
10. Vapi calls tool `create_booking` → n8n workflow
11. n8n creates Google Calendar event → POST /api/v1/n8n/booking/confirm
12. Server saves booking to Supabase, sends SMS via 46elks
13. SMS: "Hei! Din time hos Salon A er bekreftet: Hårklipp fredag 14:00"
```

---

## Project Structure

```
salon-receptionist/
├── src/
│   ├── index.ts                    # Express app bootstrap
│   ├── config/
│   │   ├── env.ts                  # Zod-validated env vars (fail-fast)
│   │   ├── logger.ts               # Winston logger
│   │   ├── supabase.ts             # Supabase service-role client
│   │   ├── twilio.ts               # Twilio client + signature validation
│   │   ├── vapi.ts                 # Vapi axios client + HMAC validation
│   │   └── google-calendar.ts      # Google Calendar service account client
│   ├── middleware/
│   │   ├── auth.middleware.ts      # API key guard for admin routes
│   │   ├── tenant.middleware.ts    # Resolves tenant from phone number / ID
│   │   └── error.middleware.ts     # Global error handler
│   ├── routes/
│   │   ├── index.ts                # Root router
│   │   ├── twilio.routes.ts        # Twilio webhook endpoints
│   │   ├── vapi.routes.ts          # Vapi event + tool-call endpoints
│   │   ├── n8n.routes.ts           # n8n booking callback endpoints
│   │   └── admin.routes.ts         # Tenant management (API key protected)
│   ├── modules/
│   │   ├── tenants/
│   │   │   ├── tenant.types.ts
│   │   │   ├── tenant.repository.ts   # Supabase queries
│   │   │   └── tenant.service.ts      # Business logic
│   │   ├── bookings/
│   │   │   ├── booking.types.ts
│   │   │   ├── booking.repository.ts
│   │   │   └── booking.service.ts
│   │   ├── calls/
│   │   │   ├── call.types.ts
│   │   │   ├── call.repository.ts
│   │   │   └── call.service.ts
│   │   ├── calendar/
│   │   │   ├── calendar.types.ts
│   │   │   └── calendar.service.ts    # Google Calendar wrapper
│   │   └── sms/
│   │       ├── sms.types.ts
│   │       └── sms.service.ts         # 46elks SMS sender
│   └── types/
│       ├── index.ts                   # Shared domain types (TenantContext etc.)
│       └── database.ts                # Supabase generated types (update with CLI)
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql     # tenants, bookings, call_logs tables
├── .env.example                       # All required env vars with descriptions
├── package.json
├── tsconfig.json
└── README.md
```

---

## Getting Started

### 1. Clone and install

```bash
npm install
```

### 2. Environment variables

```bash
cp .env.example .env
# Fill in all values
```

### 3. Database

```bash
# Option A: Supabase CLI
npx supabase db push

# Option B: paste supabase/migrations/001_initial_schema.sql into the SQL editor
```

### 4. Generate Supabase types (after schema is applied)

```bash
npx supabase gen types typescript --project-id <your-project-id> > src/types/database.ts
```

### 5. Run in development

```bash
npm run dev
```

Use [ngrok](https://ngrok.com/) or similar to expose your local server to Twilio and Vapi:

```bash
ngrok http 3000
# Copy the HTTPS URL to .env BASE_URL and configure it in Twilio + Vapi
```

---

## Key Integrations

| Service | Purpose | Auth method |
|---------|---------|-------------|
| Twilio | Inbound call reception, Norwegian +47 numbers | Signature validation (HMAC) |
| Vapi.ai | Speech-to-text, LLM conversation, text-to-speech | HMAC webhook secret |
| n8n | Booking automation workflow | Shared secret header |
| Supabase | PostgreSQL database (tenants, bookings, calls) | Service role key |
| Google Calendar | Per-tenant appointment calendar | Service account (OAuth2) |
| 46elks | Norwegian SMS confirmations | HTTP Basic auth |

---

## Onboarding a New Salon

1. Register a +47 number in Twilio, configure it to POST to `/api/v1/twilio/voice`
2. Create a Vapi assistant for the salon (Norwegian language, custom system prompt with salon info)
3. Share the service account with the salon's Google Calendar
4. POST to `/api/v1/admin/tenants` with the salon's details
5. Done — the AI answers calls for the new salon immediately

---

## Environment Variables

See `.env.example` for a full list with descriptions.
