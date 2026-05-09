import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = user.id;

    const body = await req.json();

    const {
      name,
      role,
      company,
      linkedinUrl,
      interactionType,
      tags,
      signals,
      daysSinceContact,
    } = body ?? {};

    if (!name || !role || !company || !interactionType) {
      return Response.json(
        {
          error:
            "Missing required fields: name, role, company, interactionType",
        },
        { status: 400 }
      );
    }

    let lastContactedAt: Date | null = null;
    if (typeof daysSinceContact === "number" && daysSinceContact >= 0) {
      lastContactedAt = new Date(Date.now() - daysSinceContact * DAY_MS);
    }

    const candidate = await prisma.candidate.create({
      data: {
        userId,
        name,
        role,
        company,
        linkedinUrl: linkedinUrl ?? null,
        interactionType,
        tags: Array.isArray(tags) ? tags : [],
        signals: signals ?? {},
        lastContactedAt,
      },
    });

    return Response.json(candidate, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      return Response.json(
        { error: "Database error", code: err.code },
        { status: 400 }
      );
    }
    console.error("POST /api/candidates failed:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const candidates = await prisma.candidate.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        actions: {
          where: {
            messageContent: { not: "" },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const result = (candidates ?? []).map((c) => {
      const { actions, ...rest } = c;
      return {
        ...rest,
        lastAction: actions[0] ?? null,
      };
    });

    return NextResponse.json(result ?? [], { status: 200 });
  } catch (err) {
    console.error("GET /api/candidates failed:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
