import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

const SYSTEM_PROMPT = `Svar alltid på norsk (bokmål). You are analyzing a candidate profile for a recruiter. Return ONLY a valid JSON object with exactly these fields:
{
  keySellingPoint: string (one sentence: why this candidate is relevant for outreach — specific, no fluff),
  candidateHook: string (one sentence: what likely motivates this person based on their background),
  tension: string (one sentence: the psychological gap between where they are and where they could be)
}
Be specific. Use details from the notes. No generic statements.
Pure JSON only, no markdown.`;

type AnthropicTextBlock = { type?: string; text?: string };
type AnthropicResponse = {
  content?: AnthropicTextBlock[];
  error?: { message?: string };
};

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

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = user.id;

    const { id } = await ctx.params;
    if (!id) {
      return NextResponse.json(
        { error: "Missing candidate id" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawNotes =
      typeof (body as { rawNotes?: unknown })?.rawNotes === "string"
        ? ((body as { rawNotes: string }).rawNotes as string)
        : "";

    if (!rawNotes.trim()) {
      return NextResponse.json(
        { error: "rawNotes is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    const candidate = await prisma.candidate.findFirst({
      where: { id, userId },
      select: { id: true, name: true, role: true, company: true },
    });

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("analyze: ANTHROPIC_API_KEY missing");
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const userPrompt = `Candidate: ${candidate.name}, ${candidate.role} at ${candidate.company}\n\nNotes:\n${rawNotes}`;

    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    const data = (await res.json()) as AnthropicResponse;

    if (!res.ok || data.error) {
      console.error("Anthropic analyze error:", data.error ?? data);
      return NextResponse.json(
        { error: data.error?.message ?? "Failed to analyze candidate" },
        { status: 500 }
      );
    }

    const rawText = data.content?.find((c) => c.type === "text")?.text ?? "";
    const blob = extractJsonBlob(rawText);

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(blob) as Record<string, unknown>;
    } catch (err) {
      console.error("analyze: JSON parse failed:", err, "raw preview:", rawText.slice(0, 400));
      return NextResponse.json(
        { error: "Could not parse analysis response" },
        { status: 500 }
      );
    }

    const keySellingPoint =
      typeof parsed.keySellingPoint === "string" ? parsed.keySellingPoint : "";
    const candidateHook =
      typeof parsed.candidateHook === "string" ? parsed.candidateHook : "";
    const tension =
      typeof parsed.tension === "string" ? parsed.tension : "";

    if (!keySellingPoint || !candidateHook || !tension) {
      return NextResponse.json(
        { error: "Analysis response is missing required fields" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { keySellingPoint, candidateHook, tension },
      { status: 200 }
    );
  } catch (err) {
    console.error("POST /api/candidates/[id]/analyze failed:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
