import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = [
  "DRAFT",
  "SENT",
  "REPLIED",
  "NO_RESPONSE",
  "NOT_INTERESTED",
  "BOOKED",
  "FAILED",
] as const;
type ActionStatus = (typeof VALID_STATUSES)[number];

function isValidStatus(value: unknown): value is ActionStatus {
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
    const body = await req.json();

    const { status, replyType, replyContent } = body ?? {};

    if (!isValidStatus(status)) {
      return Response.json(
        {
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const data: Prisma.ActionUpdateInput = { status };

    if (status === "DRAFT") {
      data.sentAt = null;
      data.repliedAt = null;
    }

    if (status === "SENT") {
      data.sentAt = new Date();
    }

    if (status === "REPLIED") {
      data.repliedAt = new Date();
      if (replyType !== undefined) data.replyType = replyType;
      if (replyContent !== undefined) data.replyContent = replyContent;
    }

    const action = await prisma.action.update({
      where: { id },
      data,
    });

    return Response.json(action, { status: 200 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      // P2025 = record to update not found
      if (err.code === "P2025") {
        return Response.json(
          { error: "Action not found" },
          { status: 404 }
        );
      }
      return Response.json(
        { error: "Database error", code: err.code },
        { status: 400 }
      );
    }
    console.error("PATCH /api/actions/[id]/status failed:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }

}