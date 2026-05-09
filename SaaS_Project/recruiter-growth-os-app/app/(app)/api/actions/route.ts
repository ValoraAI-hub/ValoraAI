import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const VALID_OUTCOMES = ["replied", "ghosted", "booked", "rejected"] as const;
type ActionOutcome = (typeof VALID_OUTCOMES)[number];

function isValidOutcome(value: unknown): value is ActionOutcome {
  return (
    typeof value === "string" &&
    (VALID_OUTCOMES as readonly string[]).includes(value)
  );
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { actionId, outcome } = (body ?? {}) as {
      actionId?: unknown;
      outcome?: unknown;
    };

    if (typeof actionId !== "string" || !actionId.trim()) {
      return Response.json(
        { error: "Missing or invalid actionId" },
        { status: 400 }
      );
    }

    if (!isValidOutcome(outcome)) {
      return Response.json(
        {
          error: `Invalid outcome. Must be one of: ${VALID_OUTCOMES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const action = await prisma.action.update({
      where: { id: actionId },
      data: { outcome },
    });

    return Response.json(action, { status: 200 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
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
    console.error("PATCH /api/actions failed:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      candidateId,
      messageContent,
      strategyType,
      messageVariant,
      signalsSnapshot,
      angle,
      tensionType,
    }: {
      candidateId?: string;
      messageContent?: string;
      strategyType?: string;
      messageVariant?: string;
      signalsSnapshot?: unknown;
      angle?: string;
      tensionType?: string;
    } = body ?? {};

    if (
      !candidateId ||
      !messageContent ||
      !strategyType ||
      !messageVariant
    ) {
      return Response.json(
        {
          error:
            "Missing required fields: candidateId, messageContent, strategyType, messageVariant",
        },
        { status: 400 }
      );
    }

    const action = await prisma.action.create({
      data: {
        candidateId,
        messageContent,
        strategyType,
        messageVariant,
        signalsSnapshot: (signalsSnapshot ?? {}) as Prisma.InputJsonValue,
        status: "DRAFT",
        angle: angle ?? null,
        tensionType: tensionType ?? null,
      },
    });

    return Response.json(action, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      // P2003 = foreign key constraint failed (e.g. unknown candidateId)
      if (err.code === "P2003") {
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
    console.error("POST /api/actions failed:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
