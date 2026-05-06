const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

const MAX_MESSAGE_LENGTH = 300;

const SYSTEM_PROMPT = `You are a recruiter writing LinkedIn follow-up messages in Norwegian.

HARD LIMIT: Maximum 300 characters. Count every character.

---

ANGLE (mandatory):
Every message must be built on ONE clear angle. Do not mix angles.

impact     → emphasize responsibility and influence they could have
ownership  → building something new, real ownership of results
stability  → long-term security, solid company, sustainable role
tech       → stack, technical complexity, engineering quality
salary     → compensation, market rate, financial upside
mission    → purpose, industry importance, meaningful work

Pick the angle based on what is provided. If no angle is given, infer from role and company.

---

OPENING LINE (critical):
The first line must feel like a real, specific observation — not a generic intro.

BAD:
"Så du jobber med X"
"Jeg kom over profilen din"
"Håper du har det bra"

GOOD:
"Ser du har vært tett på [spesifikk ting]"
"Ser du sitter med mye ansvar rundt [X]"
"Jobber du fortsatt med [konkret ting], eller har det endret seg?"

The opening must create a pattern interrupt. It must feel real, not templated.

---

TONE BY TIME:
Adjust tone based on days since last contact.

0–3 days:
- very light nudge
- assume they just missed the first message
- no pressure at all

4–10 days:
- more direct
- slight weight, not heavy
- still friendly

10+ days:
- reframe or change angle entirely
- acknowledge time has passed without being awkward
- feel like a fresh start, not a chase

---

CANDIDATEHOOK (mandatory if provided):
You MUST use candidateHook as the core of the opening observation.
This is the personal hook — it must appear in the message.
If not provided, infer from role and company.

KEYSELLINGPOINT:
Use only if it feels completely natural. Never force it.

---

STRUCTURE (mandatory):
One specific observation → one simple low-friction question.
Max 2 sentences. No exclamation marks.

variant 1: soft and curious — ask about their situation, no pressure
variant 2: direct — lead with a concrete hook, end with a clear yes/no

---

ANTI-BULLSHIT FILTER:
Never use:
- "spennende mulighet", "passer perfekt", "håper du har det bra"
- "mulighet", "rolle", "selskap" as vague standalone words
- Generic compliments
- Explaining the job
- Asking for a meeting

Prefer concrete over general. One thing said well over two things said vaguely.

---

Write in Norwegian. Return ONLY the message. No labels, no markdown, no quotes.`;

function stripPrefixes(text: string): string {
  let cleaned = text;
  cleaned = cleaned.replace(/^\*\*[^*]+\*\*\s*/gm, "");
  cleaned = cleaned.replace(/^\s*Variant\s*\d+\s*:\s*/gim, "");
  cleaned = cleaned.replace(/^["'`]+|["'`]+$/g, "");
  return cleaned.trim();
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

function buildUserPrompt(body: Body, variant: 1 | 2): string {
  const days = Number(body.daysSinceContact ?? 0);
  const lines: string[] = [];

  lines.push(
    `Write a follow-up message for ${body.name}, ${body.role} at ${body.company}.`
  );
  lines.push(`Days since last contact: ${days}.`);
  lines.push(toneGuidance(days));
  lines.push(
    `Variant ${variant}: ${variant === 1 ? "soft curious tone" : "direct confident tone"}.`
  );

  if (body.angle) {
    lines.push(`Angle: ${body.angle}. Build the entire message around this angle.`);
  }

  if (body.candidateHook?.trim()) {
    lines.push(
      `candidateHook (MUST use as the core of the opening): ${body.candidateHook.trim()}`
    );
  }

  if (body.keySellingPoint?.trim()) {
    lines.push(
      `keySellingPoint (use only if completely natural): ${body.keySellingPoint.trim()}`
    );
  }

  lines.push(
    "Return ONLY the message in Norwegian. No preamble, no quotes, no labels."
  );

  return lines.join("\n");
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

    const userPrompt = buildUserPrompt(body, variant);

    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 200,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    const data = (await res.json()) as AnthropicResponse;

    if (!res.ok || data.error) {
      console.error("Anthropic error:", data.error ?? data);
      return Response.json(
        { error: data.error?.message ?? "Failed to generate message" },
        { status: 502 }
      );
    }

    const rawMessage =
      data.content?.find((c) => c.type === "text")?.text ?? "";
    const cleaned = stripPrefixes(rawMessage);
    const message = enforceMaxLength(cleaned, MAX_MESSAGE_LENGTH);

    if (!message) {
      return Response.json(
        { error: "Empty response from model" },
        { status: 502 }
      );
    }

    const days = Number(body.daysSinceContact ?? 0);

    return Response.json(
      {
        message,
        strategyType: strategyFor(days, variant),
        messageVariant: String(variant),
        angle: body.angle ?? null,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("POST /api/generate-message failed:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
