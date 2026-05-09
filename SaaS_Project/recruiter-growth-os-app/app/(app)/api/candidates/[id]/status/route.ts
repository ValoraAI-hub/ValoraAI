import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["new", "contacted", "replied", "booked", "rejected"] as const;
type CandidateStatus = (typeof VALID_STATUSES)[number];

function isValidStatus(value: unknown): value is CandidateStatus {
  return (
    typeof value === "string" &&
    (VALID_STATUSES as readonly string[]).includes(value)
  );
}

export async function PATCH(
  req: Request,
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

    const body = await req.json();
    const { status } = (body ?? {}) as { status?: unknown };

    if (!isValidStatus(status)) {
      return Response.json(
        {
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const candidate = await prisma.candidate.update({
      where: { id },
      data: { status },
    });

    return Response.json(candidate, { status: 200 });
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
    console.error("PATCH /api/candidates/[id]/status failed:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
