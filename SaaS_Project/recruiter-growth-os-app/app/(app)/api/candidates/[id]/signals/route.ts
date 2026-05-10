import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
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

    const body = (await req.json().catch(() => ({}))) as {
      keySellingPoint?: unknown;
      candidateHook?: unknown;
      tension?: unknown;
    };

    const keySellingPoint =
      typeof body.keySellingPoint === "string" ? body.keySellingPoint : "";
    const candidateHook =
      typeof body.candidateHook === "string" ? body.candidateHook : "";
    const tension = typeof body.tension === "string" ? body.tension : "";

    const existing = await prisma.candidate.findFirst({
      where: { id, userId },
      select: { signals: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    const existingSignals =
      (existing.signals as Record<string, unknown>) ?? {};

    const updated = await prisma.candidate.update({
      where: { id },
      data: {
        signals: {
          ...existingSignals,
          keySellingPoint,
          candidateHook,
          tension,
        } as import("@prisma/client").Prisma.InputJsonValue,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    console.error("PATCH /api/candidates/[id]/signals failed:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
