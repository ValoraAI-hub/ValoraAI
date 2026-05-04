import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    if (!id) {
      return Response.json(
        { error: "Missing candidate id" },
        { status: 400 }
      );
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: {
        actions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!candidate) {
      return Response.json({ error: "Candidate not found" }, { status: 404 });
    }

    const { actions, ...rest } = candidate;
    return Response.json(
      {
        ...rest,
        lastAction: actions[0] ?? null,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("GET /api/candidates/[id] failed:", err);
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
    const { id } = await ctx.params;

    if (!id) {
      return Response.json(
        { error: "Missing candidate id" },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.action.deleteMany({ where: { candidateId: id } }),
      prisma.candidate.delete({ where: { id } }),
    ]);

    return Response.json({ ok: true }, { status: 200 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        return Response.json(
          { error: "Candidate not found" },
          { status: 404 }
        );
      }
      return Response.json(
        { error: "Database error", code: err.code },
        { status: 400 }
      );
    }
    console.error("DELETE /api/candidates/[id] failed:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
