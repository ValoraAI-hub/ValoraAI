/**
 * Vapi.ai webhook routes.
 *
 * Vapi posts events to these endpoints throughout a call's lifecycle.
 * All requests are verified with HMAC-SHA256 (see config/vapi.ts).
 *
 * POST /vapi/events
 *   Receives a stream of call events:
 *     - call-started       → create call_logs row
 *     - transcript         → optional real-time transcript storage
 *     - tool-call-result   → Vapi confirms it executed a booking tool
 *     - call-ended         → finalise call_logs, trigger post-call flow
 *
 * POST /vapi/tool-calls  (optional — only if using server-side tool execution)
 *   If configured in the Vapi assistant as a "server URL" tool, Vapi will
 *   POST here to request tool execution (e.g., check-availability,
 *   create-booking). This is an alternative to routing through n8n.
 */

import { Router } from 'express';
// import { validateVapiSignature } from '../config/vapi'; // TODO
// import { handleVapiEvent, handleVapiToolCall } from '../modules/calls/call.controller'; // TODO

export const vapiRouter = Router();

vapiRouter.post('/events', (_req, res) => {
  // TODO: verify x-vapi-signature header
  // TODO: route to correct handler based on event.type
  // TODO: for call-ended → trigger SMS confirmation via 46elks if booking was made
  res.sendStatus(200);
});

vapiRouter.post('/tool-calls', (_req, res) => {
  // TODO: verify x-vapi-signature header
  // TODO: dispatch to booking or calendar service based on tool name
  // TODO: respond with { result: ... } within 10 seconds (Vapi timeout)
  res.json({ result: 'not implemented' });
});
