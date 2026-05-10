import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

const SYSTEM_PROMPT = `You are extracting structured role intelligence from recruiter notes. Return ONLY a valid JSON object with these exact fields:
{
  salary_range: string or null,
  team_size: string or null,
  stack: string[] or [],
  ownership: string or null,
  culture: string or null,
  mission: string or null,
  selling_points: string[] or [],
  objections: string[] or [],
  seniority: string or null,
  candidate_fit: string or null,
  urgency: string or null
}
No markdown. No explanation. Pure JSON only.`;

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

async function runExtraction(searchId: string, rawContext: string, apiKey: string) {
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
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: rawContext }],
      }),
    });

    const data = (await res.json()) as AnthropicResponse;

    if (!res.ok || data.error) {
      console.error("Anthropic extract error:", data.error ?? data);
      await prisma.search.update({
        where: { id: searchId },
        data: { extractionStatus: "error" },
      });
      return;
    }

    const rawText = data.content?.find((c) => c.type === "text")?.text ?? "";
    const blob = extractJsonBlob(rawText);
    const parsed = JSON.parse(blob) as Record<string, unknown>;

    await prisma.search.update({
      where: { id: searchId },
      data: {
        structuredContext: parsed as import('@prisma/client').Prisma.InputJsonValue,
        extractionStatus: "ready",
      },
    });
  } catch (err) {
    console.error("Extraction failed for search", searchId, err);
    try {
      await prisma.search.update({
        where: { id: searchId },
        data: { extractionStatus: "error" },
      });
    } catch (updateErr) {
      console.error("Failed to mark extraction as error:", updateErr);
    }
  }
}

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = user.id;

    const { id } = await ctx.params;
    if (!id) {
      return NextResponse.json({ error: "Missing search id" }, { status: 400 });
    }

    const search = await prisma.search.findFirst({
      where: { id, userId },
    });

    if (!search) {
      return NextResponse.json({ error: "Search not found" }, { status: 404 });
    }

    if (!search.rawContext || search.rawContext.trim() === "") {
      return NextResponse.json(
        { error: "rawContext is empty — nothing to extract" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("extract: ANTHROPIC_API_KEY missing");
      await prisma.search.update({
        where: { id },
        data: { extractionStatus: "error" },
      });
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 500 }
      );
    }

    await prisma.search.update({
      where: { id },
      data: { extractionStatus: "extracting" },
    });

    void runExtraction(id, search.rawContext, apiKey);

    return NextResponse.json(
      { ok: true, extractionStatus: "extracting" },
      { status: 202 }
    );
  } catch (err) {
    console.error("POST /api/searches/[id]/extract failed:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
