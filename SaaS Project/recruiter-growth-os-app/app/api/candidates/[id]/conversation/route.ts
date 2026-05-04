import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id: candidateId } = await ctx.params;

    if (!candidateId) {
      return Response.json(
        { error: "Missing candidate id" },
        { status: 400 }
      );
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { id: true },
    });
    if (!candidate) {
      return Response.json({ error: "Candidate not found" }, { status: 404 });
    }

    const turns = await prisma.conversationTurn.findMany({
      where: { candidateId },
      orderBy: { turn: "asc" },
    });

    return Response.json(turns, { status: 200 });
  } catch (err) {
    console.error("GET /api/candidates/[id]/conversation failed:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id: candidateId } = await ctx.params;

    if (!candidateId) {
      return Response.json(
        { error: "Missing candidate id" },
        { status: 400 }
      );
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { id: true },
    });
    if (!candidate) {
      return Response.json({ error: "Candidate not found" }, { status: 404 });
    }

    const body = (await req.json()) as {
      direction?: unknown;
      content?: unknown;
      strategyType?: unknown;
      replyType?: unknown;
    };

    const direction =
      typeof body.direction === "string" ? body.direction.trim() : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";

    if (!direction || !content) {
      return Response.json(
        { error: "Missing required fields: direction, content" },
        { status: 400 }
      );
    }

    const strategyType =
      typeof body.strategyType === "string"
        ? body.strategyType.trim() || undefined
        : undefined;
    const replyType =
      typeof body.replyType === "string"
        ? body.replyType.trim() || undefined
        : undefined;

    const created = await prisma.$transaction(async (tx) => {
      const agg = await tx.conversationTurn.aggregate({
        where: { candidateId },
        _max: { turn: true },
      });
      const nextTurn = (agg._max.turn ?? 0) + 1;
      return tx.conversationTurn.create({
        data: {
          candidateId,
          turn: nextTurn,
          direction,
          content,
          ...(strategyType !== undefined ? { strategyType } : {}),
          ...(replyType !== undefined ? { replyType } : {}),
        },
      });
    });

    return Response.json(created, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      return Response.json(
        { error: "Database error", code: err.code },
        { status: 400 }
      );
    }
    console.error("POST /api/candidates/[id]/conversation failed:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id: candidateId } = await ctx.params;

    if (!candidateId) {
      return Response.json(
        { error: "Missing candidate id" },
        { status: 400 }
      );
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { id: true },
    });
    if (!candidate) {
      return Response.json({ error: "Candidate not found" }, { status: 404 });
    }

    await prisma.conversationTurn.deleteMany({
      where: { candidateId },
    });

    return Response.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("DELETE /api/candidates/[id]/conversation failed:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
