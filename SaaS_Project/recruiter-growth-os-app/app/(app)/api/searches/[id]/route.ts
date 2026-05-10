import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(
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
      include: {
        candidates: {
          select: {
            id: true,
            name: true,
            role: true,
            company: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!search) {
      return NextResponse.json({ error: "Search not found" }, { status: 404 });
    }

    return NextResponse.json(search, { status: 200 });
  } catch (err) {
    console.error("GET /api/searches/[id] failed:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
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

    const body = await req.json().catch(() => ({}));
    const { rawContext, structuredContext, title, company } = (body ?? {}) as {
      rawContext?: unknown;
      structuredContext?: unknown;
      title?: unknown;
      company?: unknown;
    };

    const existing = await prisma.search.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Search not found" }, { status: 404 });
    }

    const data: Prisma.SearchUpdateInput = {};

    if (typeof title === "string") {
      data.title = title;
    }
    if (typeof company === "string") {
      data.company = company;
    }
    if (typeof rawContext === "string") {
      data.rawContext = rawContext;
      data.extractionStatus = "pending";
    }
    if (
      structuredContext !== undefined &&
      structuredContext !== null &&
      typeof structuredContext === "object"
    ) {
      data.structuredContext = structuredContext as Prisma.InputJsonValue;
    }

    const updated = await prisma.search.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        return NextResponse.json(
          { error: "Search not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: "Database error", code: err.code },
        { status: 400 }
      );
    }
    console.error("PATCH /api/searches/[id] failed:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
