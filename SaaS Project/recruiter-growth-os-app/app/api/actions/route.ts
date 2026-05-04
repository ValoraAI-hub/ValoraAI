import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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
