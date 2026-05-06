const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

const SHORT_REPLY_CLARIFY =
  "Bare for å forstå deg riktig — hva tenker du på?";

type NextAction = "continue" | "clarify" | "soft_push" | "book" | "close";

const NEXT_ACTION_VALUES = new Set<NextAction>([
  "continue",
  "clarify",
  "soft_push",
  "book",
  "close",
]);

type HistoryTurn = {
  direction: "outbound" | "inbound";
  content: string;
};

type RequestBody = {
  candidateId?: unknown;
  candidateMessage?: unknown;
  history?: unknown;
};

type AnthropicTextBlock = { type?: string; text?: string };

type AnthropicErrorBody = {
  error?: { message?: string };
  content?: AnthropicTextBlock[];
};

const SYSTEM_PROMPT = `Du genererer korte LinkedIn-/chat-svar i en pågående samtale. Du er en norsk rekrutterer eller tech-talent som svarer.

SPRÅK OG STIL:
- Språk: norsk (Bokmål).
- Du svarer midt i samtalen på mobil. Du reagerer, ikke skriver sjenerøse templater.
- Bygg på det de sa — gjenbruk eller speil noe naturlig fra meldingen deres.
- Si så lite som mulig som fortsatt driver samtalen videre.
- Ikke ta alt — la noe ligge med vilje med mening.
- Flyt: Hvis det er driv i samtalen, fortsett den — ikke nullstill med nytt tema eller unødig spørsmål.
- Bare still et spørsmål hvis det reelt flytter noe framover. Det er helt greit å ikke spørre om noe.
- Tone: ingen utfyllingsord eller småkomplimenter før innhold («Nice», «Kult», «Flott», «Bra», «Interessant» mv.).
- Litt upolert og menneskelig slår glatt perfeksjonisme.
- Start ALDRI med: Nice, Kult, Bra, Flott, Interessant (med stor eller liten forbokstav).
- Maks ett spørsmål per melding — helst ikke flere enn ett tegn '?'.
- Første setning må være en reaksjon eller en kort observasjon, ikke et spørsmål.
- When nextAction is soft_push: tease ONE reason this could be relevant. Do NOT explain the role. Do NOT mention salary, title, or details unless the candidate asked.
- When nextAction is book: suggest next step in one natural sentence. No explanation needed.
- When candidate says "ja", "ok", "ja!", "kult" or any short affirmative: treat as momentum — continue forward, never clarify.
- If you catch yourself explaining more than one thing: stop. Cut it.
- Max 1-2 sentences per message. If candidate reply is short, your reply must be shorter.
- Do not explain what the company does unless explicitly asked. No product descriptions, team descriptions, or role responsibilities.
- Hint instead of explaining. One concrete detail maximum — leave the rest unsaid.
- Once the candidate shows interest twice, move toward a short call. Do not keep exploring.
- When candidate says "ja" or similar affirmative to a question: do not elaborate — move the conversation forward instead.
- The value is the conversation, not the information.
- If the candidate clearly agrees or confirms interest, move toward booking instead of asking more questions
- Never ask "har du lyst til å høre mer" — assume interest and move forward
- When in doubt between asking and moving forward: move forward

NEXTACTION-BESLUTNINGER (sett feltet nextAction eksakt til én av: continue | clarify | soft_push | book | close):
- Tydelig interesse OG ber om konkretheter / vil vite mer om rollen → soft_push.
- Uttalt enighet, vil booke, spør om tid / neste steg → book.
- Kort positiv puls (f.eks. «kult», «lyder interessant», kort bekreftelse) uten konkret hinder → continue.
- Tvil, begrensninger, «må tenke», uklar intensjon → clarify.
- Tydelig avslag eller avvisende («ikke aktuelt», «passer ikke») → close.
- Tidlig tråd (ca. 1–2 runder totalt utvekslet) → prioriter helst continue eller clarify; book og soft_push må være svært begrunnede.
- Mellom-fase (3–4 innholdsrike runder med tegn på interesse) → soft_push kan være passende ved passende signaler.
- Sen fase med sterk konkret interesse → book kan være passende.

EKSTRAREGEL OM OUTPUT:
Svaret ditt må være KUN ett JSON-objekt, ingen forklaring før eller etter (ingen markdown fences).
Feltene skal hete eksakt:
- message: strengen som skal sendes til kandidaten ( norsk, kort, i tråd med alle reglene over )
- nextAction: én av continue | clarify | soft_push | book | close
- confidence: et tall mellom 0.0 og 1.0 som reflekterer hvor trygg du er på valget av nextAction

NextAction-feltet må alltid gjenspeile reglene ovenfor; confidence reflekterer usikkerhet om den klassifikasjonen.`;

function clarifyResponse(message: string, confidence = 0.45): Response {
  const c = clampConfidence(confidence);
  return Response.json(
    { message, nextAction: "clarify" satisfies NextAction, confidence: c },
    { status: 200 }
  );
}

function clampConfidence(n: number): number {
  if (!Number.isFinite(n)) return 0.5;
  return Math.min(1, Math.max(0, n));
}

function isHistoryTurn(row: unknown): row is HistoryTurn {
  if (!row || typeof row !== "object") return false;
  const r = row as Record<string, unknown>;
  return (
    (r.direction === "outbound" || r.direction === "inbound") &&
    typeof r.content === "string"
  );
}

function normalizeHistory(history: unknown): HistoryTurn[] {
  if (!Array.isArray(history)) return [];
  return history.filter(isHistoryTurn);
}

function formatHistory(history: HistoryTurn[]): string {
  if (history.length === 0) return "(ingen tidligere meldinger i historikken)";
  return history
    .map((h, i) => {
      const label = h.direction === "outbound" ? "Meg (utgående)" : "Kandidat (innkommende)";
      return `${i + 1}. [${label}]\n${h.content.trim()}`;
    })
    .join("\n\n");
}

function buildUserPrompt(candidateId: string, candidateMessage: string, history: HistoryTurn[]): string {
  return `Kandidat-ID (kun referanse for deg): ${candidateId}

===== SAMTALEHISTORIKK =====
${formatHistory(history)}

===== NYESTE SVAR FRA KANDIDAT =====
"${candidateMessage.trim()}"

Opprett nå ett JSON-objekt med feltene message, nextAction og confidence akkurat som beskrevet i systeminstruksen. Ikke legg til markdown eller tekst rundt JSON.`;
}

/** Extract first {...} blob that looks like JSON. */
function extractJsonObject(raw: string): string | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return raw.slice(start, end + 1);
}

function coerceNextAction(v: unknown): NextAction | null {
  if (typeof v !== "string") return null;
  const s = v.trim().toLowerCase().replace(/\s+/g, "_");
  const mapped =
    s === "soft-push" ? "soft_push" : (s as NextAction);
  return NEXT_ACTION_VALUES.has(mapped as NextAction) ? (mapped as NextAction) : null;
}

type ParsedAi = {
  message: string;
  nextAction: NextAction;
  confidence: number;
};

function parseReplyPayload(rawText: string): ParsedAi | null {
  let text = rawText.trim();
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const extracted = extractJsonObject(text) ?? text;
  try {
    const obj = JSON.parse(extracted) as Record<string, unknown>;
    const message = typeof obj.message === "string" ? obj.message.trim() : "";
    const na = coerceNextAction(obj.nextAction);
    let confidence = clampConfidence(typeof obj.confidence === "number" ? obj.confidence : Number(obj.confidence));
    if (!message || !na) return null;
    return { message, nextAction: na, confidence };
  } catch {
    return null;
  }
}

function applySafetyBrakes(nextAction: NextAction, confidence: number): NextAction {
  let a = nextAction;
  const c = confidence;
  if (a === "clarify" && c < 0.5) return "continue";
  if (a === "book") {
    if (c < 0.5) return "continue";
    if (c < 0.7) return "soft_push";
  }
  if (a === "soft_push" && c < 0.5) return "continue";
  return a;
}

export async function POST(req: Request) {
  let body: RequestBody = {};
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return clarifyResponse(SHORT_REPLY_CLARIFY, 0.4);
  }

  const candidateId =
    typeof body.candidateId === "string" ? body.candidateId.trim() : "";
  const candidateMessage =
    typeof body.candidateMessage === "string" ? body.candidateMessage : "";
  const history = normalizeHistory(body.history);

  if (!candidateId) {
    return clarifyResponse(SHORT_REPLY_CLARIFY, 0.35);
  }

  if (!candidateMessage.trim() && history.length > 0) {
    return Response.json(
      {
        message: SHORT_REPLY_CLARIFY,
        nextAction: "clarify",
        confidence: clampConfidence(0.75),
      },
      { status: 200 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("generate-reply: ANTHROPIC_API_KEY missing");
    return clarifyResponse(SHORT_REPLY_CLARIFY, 0.35);
  }

  const userPrompt = buildUserPrompt(candidateId, candidateMessage, history);

  let rawText = "";
  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    const data = (await res.json()) as AnthropicErrorBody;

    if (!res.ok || data.error) {
      console.error("Anthropic generate-reply error:", data.error ?? data);
      return clarifyResponse(SHORT_REPLY_CLARIFY, 0.35);
    }

    rawText = data.content?.find((c) => c.type === "text")?.text ?? "";

    const parsed = parseReplyPayload(rawText);
    if (!parsed) {
      console.error("generate-reply: JSON parse failed, raw preview:", rawText.slice(0, 400));
      return clarifyResponse(SHORT_REPLY_CLARIFY, 0.4);
    }

    let { message, nextAction, confidence } = parsed;
    confidence = clampConfidence(confidence);
    nextAction = applySafetyBrakes(nextAction, confidence);

    const msg = candidateMessage.toLowerCase().trim();
    const positiveSignals = ["ja", "klart", "gjerne", "høres bra ut", "absolutt", "ja da", "ja!"];
    const lastOutbound = history.filter(t => t.direction === "outbound").pop()?.content.toLowerCase() || "";
    const wasPush = ["snakke", "prat", "rolle", "utforske", "høre mer", "møtes"].some(w => lastOutbound.includes(w));

    if (positiveSignals.includes(msg) && wasPush) {
      nextAction = "book";
      message = "Da gir det mest mening å ta det på en rask prat egentlig";
      confidence = 0.9;
    }

    return Response.json(
      { message: message.trim(), nextAction, confidence },
      { status: 200 }
    );
  } catch (err) {
    console.error("POST /api/generate-reply failed:", err);
    return clarifyResponse(SHORT_REPLY_CLARIFY, 0.35);
  }
}
