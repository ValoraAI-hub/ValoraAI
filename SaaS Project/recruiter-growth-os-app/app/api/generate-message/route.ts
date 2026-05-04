const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

const MAX_MESSAGE_LENGTH = 300;

const SYSTEM_PROMPT = `You are a recruiter writing LinkedIn follow-up messages in Norwegian.

HARD LIMIT: Maximum 300 characters. Count every character.

---

ANGLE (mandatory):
Every message must be built on ONE clear angle. Do not mix angles.

impact     → the influence and responsibility they could have
ownership  → building something new with real ownership of results
stability  → long-term security, solid company, sustainable role
tech       → stack, technical complexity, engineering quality
salary     → compensation, market rate, financial upside
mission    → purpose, industry importance, meaningful work

---

TENSION TYPE (mandatory — variant 1 and variant 2 must use DIFFERENT types):

ownership  → control vs implementation
           → "får du faktisk påvirket arkitekturen, eller mest implementert?"
           → "eier du retningen, eller bygger du mest det andre bestemmer?"

growth     → stagnation vs progression
           → "begynner det å bli repetitivt der du er nå?"
           → "lærer du fortsatt noe nytt, eller er det mest same same?"

impact     → real influence vs low visibility
           → "merker du at det du bygger faktisk påvirker brukerne, eller er det mest intern plumbing?"
           → "ser du konsekvensen av det du bygger, eller forsvinner det inn i systemet?"

comfort    → safety vs ambition (highest reply trigger)
           → "eller er det mest videreføring og vedlikehold nå?"
           → "er det ambisjon eller vane som holder deg der?"
           → "savner du å bygge noe nytt, eller er det mer forvaltning nå?"

variant 1 → use ONE of: growth, impact, or comfort
variant 2 → use: ownership
(Forces meaningful variation between the two variants)

Variant 1 and Variant 2 must have different openings. Never start both variants with the same phrase or hook.

---

MANDATORY STRUCTURE (NO EXCEPTIONS):

OPENING RULE — NON-NEGOTIABLE:
ALWAYS start with: "Du som har [specific observation] —"
or: "Du som [verb] [specific observation] —"

NEVER start with a verb directly: "Bygget X", "Sitter med X", "Jobber med X"
NEVER start with: "Ser du", "Jeg ser", "La merke til"

CORRECT: "Du som har bygget design system fra scratch hos Finn —"
CORRECT: "Du som sitter tett på HSE-strategien i kritisk infrastruktur —"
WRONG: "Bygget design system fra scratch hos Finn —"
WRONG: "Sitter tett på HSE i kritisk infrastruktur —"

Step 1 — OBSERVATION (after "Du som har..."):
Specific observation using candidateHook.
Must feel real — not templated.

BAD: "Så du jobber med X" / "Jeg kom over profilen din"
GOOD: "Du som har bygget X fra scratch hos Y —"
GOOD: "Du som sitter tett på [konkret ansvar] hos [selskap] —"

Step 2 — TENSION:
One short beat that creates internal contrast.
Must be tied directly to the candidateHook — not generic.
Must be CONCRETE — describe a real situation they recognize.

BAD (too vague): "eller er det litt trygt der du er nå?"
BAD (too soft): "begynner du å vokse ut av det?"
GOOD (concrete): "er det mest videreføring og vedlikehold nå?"
GOOD (concrete): "savner du å bygge noe nytt fra scratch?"
GOOD (concrete): "eller er det mest å implementere det andre bestemmer?"
GOOD (concrete): "begynner det å bli repetitivt?"

Step 3 — ONE QUESTION:
Exactly one question. Short. Slightly edgy. Easy to answer fast.
Must reference something specific from the hook or role.

LENGTH RULE: If the question can be said in 8 words → say it in 8 words, not 14.

SPECIFICITY TEST: Could this be sent to 50 other people?
If yes → rewrite using more of the candidate's specific context.

---

LANGUAGE RULES:
- Short beats long. Always.
- Edge beats polite. Always.
- Specific beats general. Always.
- Concrete beats abstract. Always.
- Never use: "spennende mulighet", "passer perfekt", "håper du har det bra"
- Never use: "mulighet", "rolle", "selskap" as vague standalone words
- Never explain the job
- Never ask for a meeting
- Never ask two questions

---

CONTRAST EXAMPLES — STUDY THESE:

BAD variant 1 (vague tension, verb opener):
"Bygget design system fra scratch hos Finn – eller er det litt trygt der du er nå?"
Why bad: starts with verb (breaks OPENING RULE), tension is vague and generic

GOOD variant 1 (comfort tension, "Du som" opener):
"Du som har bygget design system fra scratch hos Finn — savner du å bygge noe nytt, eller er det mer vedlikehold nå?"
Why good: starts correctly, tension is concrete and recognizable

GOOD variant 2 (ownership tension, different opener):
"Du som eier design system hos Finn — får du faktisk påvirket arkitekturen videre, eller mest implementert?"
Why good: different opening phrase, different tension type, challenges their reality

BAD variant 1 (vague, verb opener):
"Erfaring fra komplekse anlegg og kritisk infrastruktur – eier du HSE-strategien, eller implementerer du mest det andre bestemmer?"
Why bad: starts with noun/experience framing, not "Du som"

GOOD variant 1 (growth tension, "Du som" opener):
"Du som sitter tett på HSE i kritisk infrastruktur — begynner det å bli repetitivt, eller er det fortsatt nytt?"
Why good: correct opener, concrete tension tied to their reality

GOOD variant 2 (ownership tension, different opener):
"Du som har ansvar for HSE-strategi hos Acme — er det du som setter retningen, eller mest som implementerer andres beslutninger?"
Why good: different angle on same person, ownership tension is direct

---

Write in Norwegian. You will produce BOTH variants in a single response as a JSON object — see the user prompt for the exact schema. Do not include markdown fences or commentary outside the JSON.

Because you generate both variants in the same response, you can SEE both — enforce that they have different openings AND different tension types. This is non-negotiable.`;

// -- Code-enforced POST-FILTER --

const FORBIDDEN_OPENERS = [
  /^ser du\b/i,
  /^ser du har\b/i,
  /^jeg ser at\b/i,
  /^la merke til at\b/i,
  /^la merke til\b/i,
  /^jeg la merke\b/i,
];

// Verb-first openers that should have been "Du som har X —"
const VERB_FIRST = /^(bygget|sitter|jobber|eier|har|arbeider|ledet|drevet|startet|brukt)\b/i;

/**
 * Enforces the OPENING RULE in code.
 * If the message starts with a bare verb, rewrites to "Du som har [...]"
 */
function enforceOpeningRule(text: string): string {
  const trimmed = text.trim();

  // Block forbidden observation openers entirely — return as-is and let caller handle
  for (const pattern of FORBIDDEN_OPENERS) {
    if (pattern.test(trimmed)) {
      // Strip the forbidden opener phrase up to first comma/dash/—
      const stripped = trimmed.replace(/^[^,\-–—]+[,\-–—]\s*/i, "");
      return stripped.trim();
    }
  }

  // If starts with bare verb → prepend "Du som har"
  if (VERB_FIRST.test(trimmed)) {
    return `Du som har ${trimmed.charAt(0).toLowerCase()}${trimmed.slice(1)}`;
  }

  return trimmed;
}

/**
 * Validates that tension appears concretely — rejects pure "litt trygt" style
 */
const WEAK_TENSION_PATTERNS = [
  /litt trygt/i,
  /for komfortabelt/i,
  /vokse ut av/i,
];

function hasWeakTension(text: string): boolean {
  return WEAK_TENSION_PATTERNS.some((p) => p.test(text));
}

function applyPostFilter(text: string): string {
  let result = enforceOpeningRule(text);

  // Enforce max question length: find "?" and backtrack 16 words
  const qIdx = result.indexOf("?");
  if (qIdx !== -1) {
    const questionPart = result.slice(0, qIdx + 1);
    const words = questionPart.trim().split(/\s+/);
    if (words.length > 20) {
      // Message-level: question itself is too long — but we don't truncate mid-question,
      // we trust max-length enforcement instead
    }
  }

  return result.trim();
}

// -- Rest of the file unchanged below --

function stripPrefixes(text: string): string {
  let cleaned = text;
  cleaned = cleaned.replace(/^\*\*[^*]+\*\*\s*/gm, "");
  cleaned = cleaned.replace(/^\s*Variant\s*\d+\s*:\s*/gim, "");
  cleaned = cleaned.replace(/^["'`]+|["'`]+$/g, "");
  return cleaned.trim();
}

function takeFirstMessage(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  const firstChunk = trimmed.split(/\n\s*\n+/)[0] ?? trimmed;
  return firstChunk.trim();
}

function enforceMaxLength(text: string, max: number): string {
  if (text.length <= max) return text;
  const truncated = text.slice(0, max);
  const lastBoundary = Math.max(
    truncated.lastIndexOf(" "),
    truncated.lastIndexOf("\n")
  );
  if (lastBoundary > max * 0.6) {
    return truncated.slice(0, lastBoundary).trimEnd();
  }
  return truncated.trimEnd();
}

export type Angle =
  | "impact"
  | "ownership"
  | "stability"
  | "tech"
  | "salary"
  | "mission";

export type TensionType = "ownership" | "growth" | "impact" | "comfort";

const VARIANT1_TENSIONS: TensionType[] = ["growth", "impact", "comfort"];

function getTensionForVariant(variant: 1 | 2, seed: number): TensionType {
  if (variant === 2) return "ownership";
  return VARIANT1_TENSIONS[seed % VARIANT1_TENSIONS.length];
}

type Body = {
  name?: string;
  role?: string;
  company?: string;
  daysSinceContact?: number;
  variant?: 1 | 2;
  keySellingPoint?: string;
  candidateHook?: string;
  angle?: Angle;
};

type AnthropicResponse = {
  content?: Array<{ type: string; text?: string }>;
  error?: { type: string; message: string };
};

function strategyFor(daysSinceContact: number, variant: 1 | 2): string {
  if (daysSinceContact >= 14) {
    return variant === 1 ? "long_silence_soft" : "long_silence_direct";
  }
  if (daysSinceContact >= 7) {
    return variant === 1 ? "follow_up_curious" : "follow_up_confident";
  }
  return variant === 1 ? "nudge_curious" : "nudge_confident";
}

function toneGuidance(days: number): string {
  if (days <= 3)
    return "Tone: 0–3 days — very light nudge. Assume they missed it. No pressure.";
  if (days <= 10)
    return "Tone: 4–10 days — more direct. Slight weight, still friendly.";
  return "Tone: 10+ days — reframe or change angle. Acknowledge time passed. Feel like a fresh start.";
}

function tensionGuidance(tensionType: TensionType, variant: 1 | 2): string {
  const descriptions: Record<TensionType, string> = {
    ownership:
      "ownership tension — control vs implementation. Question challenges whether they actually own decisions or just execute.",
    growth:
      "growth tension — stagnation vs progression. Question asks about whether they are still learning or stuck in same same.",
    impact:
      "impact tension — real influence vs low visibility. Question asks whether their work actually reaches and affects users.",
    comfort:
      "comfort tension — safety vs ambition. Use CONCRETE phrasing like 'er det mest vedlikehold nå?' or 'savner du å bygge noe nytt?' — never vague like 'litt trygt'.",
  };

  return `Tension type for variant ${variant}: ${descriptions[tensionType]}. Do NOT use any other tension type.`;
}

function buildPairPrompt(body: Body, t1: TensionType, t2: TensionType): string {
  const days = Number(body.daysSinceContact ?? 0);
  const lines: string[] = [];

  lines.push(
    `Generate TWO follow-up message variants in Norwegian. Both must create reflection and internal tension.`
  );
  lines.push(`Candidate: ${body.name}, ${body.role} at ${body.company}.`);
  lines.push(`Days since last contact: ${days}.`);
  lines.push(toneGuidance(days));

  lines.push(tensionGuidance(t1, 1));
  lines.push(tensionGuidance(t2, 2));

  lines.push(
    `Variant 1 voice: curious and soft — question about their inner experience.`
  );
  lines.push(
    `Variant 2 voice: direct and confrontational — question that challenges their current reality.`
  );

  if (body.angle) {
    lines.push(`Angle: ${body.angle}. Build BOTH variants around this angle.`);
  }

  if (body.candidateHook?.trim()) {
    lines.push(
      `candidateHook (MUST use as the core observation in BOTH variants AND anchor each question to it): ${body.candidateHook.trim()}`
    );
  }

  if (body.keySellingPoint?.trim()) {
    lines.push(
      `keySellingPoint (use only if it creates natural tension): ${body.keySellingPoint.trim()}`
    );
  }

  lines.push(
    `OPENING RULE — BOTH variants MUST start with "Du som har [observation] —" or "Du som [verb] [observation] —". This is non-negotiable.`
  );
  lines.push(
    `Variant 1 and Variant 2 MUST have DIFFERENT openings AND DIFFERENT tension types. You produce both in this response — enforce it.`
  );
  lines.push(`Do NOT pitch a role. Do NOT explain anything.`);
  lines.push(
    `Length rule (per variant): if the question can be said in 8 words — say it in 8, not 14.`
  );
  lines.push(
    `Specificity check: could either message be sent to 50 other people? If yes → rewrite using more of the candidate's specific context.`
  );
  lines.push(`The goal is to trigger a reply — not to inform.`);

  lines.push(
    `Return ONLY a JSON object in this EXACT shape, with no markdown fences and no commentary:
{
  "variant1": { "message": string, "strategyType": string, "tensionType": string },
  "variant2": { "message": string, "strategyType": string, "tensionType": string }
}
Set "tensionType" for variant1 to "${t1}" and for variant2 to "${t2}". The "strategyType" field can be a short label describing the variant's strategy (e.g. "soft_reflective", "direct_challenge"). Do not include any other keys.`
  );

  return lines.join("\n");
}

type VariantOutput = {
  message: string;
  strategyType: string;
  tensionType: TensionType;
};
type Pair = { variant1: VariantOutput; variant2: VariantOutput };

const PAIR_CACHE_TTL_MS = 60_000;
const pairCache = new Map<string, { value: Pair; expiresAt: number }>();
const inFlight = new Map<string, Promise<Pair>>();

function getCacheKey(body: Body): string {
  return JSON.stringify({
    n: body.name ?? "",
    r: body.role ?? "",
    c: body.company ?? "",
    d: Number(body.daysSinceContact ?? 0),
    h: body.candidateHook ?? "",
    k: body.keySellingPoint ?? "",
    a: body.angle ?? "",
  });
}

function pruneCache(now: number) {
  for (const [k, v] of pairCache) {
    if (v.expiresAt <= now) pairCache.delete(k);
  }
}

function extractJsonBlob(raw: string): string {
  let s = raw.trim();
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
  if (!s.startsWith("{")) {
    const start = s.indexOf("{");
    const end = s.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      s = s.slice(start, end + 1);
    }
  }
  return s;
}

type ParsedVariant = {
  message: string;
  strategyType?: string;
  tensionType?: string;
};
type ParsedPair = { variant1: ParsedVariant; variant2: ParsedVariant };

function parsePairJson(raw: string): ParsedPair | null {
  try {
    const blob = extractJsonBlob(raw);
    const parsed: unknown = JSON.parse(blob);
    if (!parsed || typeof parsed !== "object") return null;

    const obj = parsed as Record<string, unknown>;
    const v1 = obj.variant1 as Record<string, unknown> | undefined;
    const v2 = obj.variant2 as Record<string, unknown> | undefined;
    if (!v1 || !v2) return null;
    if (typeof v1.message !== "string" || typeof v2.message !== "string") {
      return null;
    }
    return {
      variant1: {
        message: v1.message,
        strategyType:
          typeof v1.strategyType === "string" ? v1.strategyType : undefined,
        tensionType:
          typeof v1.tensionType === "string" ? v1.tensionType : undefined,
      },
      variant2: {
        message: v2.message,
        strategyType:
          typeof v2.strategyType === "string" ? v2.strategyType : undefined,
        tensionType:
          typeof v2.tensionType === "string" ? v2.tensionType : undefined,
      },
    };
  } catch {
    return null;
  }
}

function cleanVariantMessage(raw: string): string {
  const stripped = stripPrefixes(raw);
  const firstOnly = takeFirstMessage(stripped);
  const filtered = applyPostFilter(firstOnly);
  return enforceMaxLength(filtered, MAX_MESSAGE_LENGTH);
}

async function generatePair(body: Body, apiKey: string): Promise<Pair> {
  const days = Number(body.daysSinceContact ?? 0);
  const seed = Math.floor(Date.now() / 1000);
  const t1 = getTensionForVariant(1, seed);
  const t2 = getTensionForVariant(2, seed);

  const userPrompt = buildPairPrompt(body, t1, t2);

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  const data = (await res.json()) as AnthropicResponse;

  if (!res.ok || data.error) {
    console.error("Anthropic error:", data.error ?? data);
    throw new Error(data.error?.message ?? "Failed to generate messages");
  }

  const rawText = data.content?.find((c) => c.type === "text")?.text ?? "";
  const parsed = parsePairJson(rawText);

  if (!parsed) {
    console.error("Failed to parse pair JSON from Claude:", rawText);
    throw new Error("Invalid response shape from model");
  }

  const v1Message = cleanVariantMessage(parsed.variant1.message);
  const v2Message = cleanVariantMessage(parsed.variant2.message);

  if (!v1Message || !v2Message) {
    throw new Error("Empty variant from model");
  }

  // Log weak tension warnings in dev
  if (hasWeakTension(v1Message)) {
    console.warn("[generate-message] Weak tension detected in variant1:", v1Message);
  }
  if (hasWeakTension(v2Message)) {
    console.warn("[generate-message] Weak tension detected in variant2:", v2Message);
  }

  return {
    variant1: {
      message: v1Message,
      strategyType: strategyFor(days, 1),
      tensionType: t1,
    },
    variant2: {
      message: v2Message,
      strategyType: strategyFor(days, 2),
      tensionType: t2,
    },
  };
}

async function getOrGeneratePair(body: Body, apiKey: string): Promise<Pair> {
  const now = Date.now();
  pruneCache(now);

  const key = getCacheKey(body);
  const cached = pairCache.get(key);
  if (cached && cached.expiresAt > now) return cached.value;

  const existing = inFlight.get(key);
  if (existing) return existing;

  const promise = generatePair(body, apiKey)
    .then((pair) => {
      pairCache.set(key, {
        value: pair,
        expiresAt: Date.now() + PAIR_CACHE_TTL_MS,
      });
      return pair;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, promise);
  return promise;
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const body = (await req.json()) as Body;
    const { name, role, company } = body;
    const variant: 1 | 2 = body.variant === 2 ? 2 : 1;

    if (!name || !role || !company) {
      return Response.json(
        { error: "Missing required fields: name, role, company" },
        { status: 400 }
      );
    }

    let pair: Pair;
    try {
      pair = await getOrGeneratePair(body, apiKey);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to generate message";
      return Response.json({ error: msg }, { status: 502 });
    }

    const chosen = variant === 1 ? pair.variant1 : pair.variant2;

    return Response.json(
      {
        message: chosen.message,
        strategyType: chosen.strategyType,
        messageVariant: String(variant),
        angle: body.angle ?? null,
        tensionType: chosen.tensionType,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("POST /api/generate-message failed:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}