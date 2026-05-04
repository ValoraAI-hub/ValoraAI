const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

const MAX_MESSAGE_LENGTH = 200;

const SYSTEM_PROMPT = `You are a recruiter writing short LinkedIn reply messages in Norwegian.

HARD LIMIT: Maximum 200 characters. Count every character.

---

TONE RULES (always):
- Sounds like a real person texting, not writing an email
- Direct, simple, human
- No corporate language, no exclamation marks
- Never use: "spennende mulighet", "kan være interessant", "passer perfekt", "høres bra ut", "mulighet", "rolle" as vague standalone words

---

CONVERSATION MEMORY (critical):
Your reply MUST directly connect to what the candidate just wrote.
Do NOT ignore their message.
Do NOT reset the conversation.
Do NOT respond to a generic version of what they said — respond to what they actually said.

If candidateMessage is provided: your reply must feel like a direct response to it.

---

REPLY TYPE RULES:

If replyType = positive:
→ They want to talk. Move fast. Do not over-explain.
Structure: [One-word or short acknowledgment] + [specific day and time this week] + [simple confirm question]
Example: "Bra. Passer mandag eller tirsdag denne uken, rundt kl 10–11?"
Do NOT: say "hyggelig", repeat the role, add unnecessary context

If replyType = neutral:
→ They are hesitant or need more. The goal is to reduce friction — not to pitch.
Structure: [Acknowledge without pressure] + [ONE concrete reason using keySellingPoint or candidateHook] + [simple yes/no question]
Example: "Forstår det. Grunnen til at jeg tok kontakt er [keySellingPoint] — gir det mening?"
If no keySellingPoint: "Er du åpen for en 10-minutters prat bare for å høre hva det handler om?"
Do NOT: convince, oversell, explain the role, repeat what you already said
This is the conversion point. Make it feel low-risk to say yes.

If replyType = negative:
→ They said no. Respect it immediately. Keep the door open with ONE soft question.
Structure: [Very brief acknowledgment] + [one open question about timing or fit — not about the role]
Example: "Greit, setter pris på det. Er det mer et timing-spørsmål, eller er det ikke riktig type stilling?"
Do NOT: try to convince, apologize, ask multiple questions, explain anything

---

CONTEXT USAGE:
- candidateMessage: the most important input — respond directly to what they wrote
- keySellingPoint: use for neutral replies as the single concrete reason
- candidateHook: use to personalize if it fits naturally
- originalMessage: stay consistent with the original angle, do not contradict it

---

ANTI-BULLSHIT FILTER:
Prefer concrete references over vague generalities.
One thing said precisely beats two things said loosely.

---

Return ONLY the reply message in Norwegian. No preamble, no quotes, no labels.`;

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

type ReplyType = "positive" | "neutral" | "negative";

type Body = {
  name?: string;
  role?: string;
  company?: string;
  replyType?: ReplyType;
  candidateMessage?: string;
  originalMessage?: string;
  keySellingPoint?: string;
  candidateHook?: string;
};

type AnthropicResponse = {
  content?: Array<{ type: string; text?: string }>;
  error?: { type: string; message: string };
};

function isReplyType(value: unknown): value is ReplyType {
  return value === "positive" || value === "neutral" || value === "negative";
}

function buildUserPrompt(body: Body): string {
  const lines: string[] = [];

  lines.push(`Candidate: ${body.name}, ${body.role} at ${body.company}.`);
  lines.push(`replyType: ${body.replyType}`);

  if (body.candidateMessage?.trim()) {
    lines.push(`Candidate wrote: "${body.candidateMessage.trim()}"`);
    lines.push("Your reply must directly respond to what they wrote above.");
  }

  if (body.originalMessage?.trim()) {
    lines.push(`Original outreach: ${body.originalMessage.trim()}`);
  }

  if (body.keySellingPoint?.trim()) {
    lines.push(`keySellingPoint: ${body.keySellingPoint.trim()}`);
  }

  if (body.candidateHook?.trim()) {
    lines.push(`candidateHook: ${body.candidateHook.trim()}`);
  }

  lines.push(
    "Return ONLY the reply message in Norwegian. No preamble, no quotes, no labels."
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
    const { name, role, company, replyType } = body;

    if (!name || !role || !company) {
      return Response.json(
        { error: "Missing required fields: name, role, company" },
        { status: 400 }
      );
    }

    if (!isReplyType(replyType)) {
      return Response.json(
        {
          error:
            "Missing or invalid replyType. Must be 'positive', 'neutral', or 'negative'.",
        },
        { status: 400 }
      );
    }

    const userPrompt = buildUserPrompt(body);

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
        { error: data.error?.message ?? "Failed to generate reply" },
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

    return Response.json({ message, replyType }, { status: 200 });
  } catch (err) {
    console.error("POST /api/generate-reply failed:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
