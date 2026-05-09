import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function startOfTodayUTC(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}

function startOfWeekUTC(): Date {
  const now = new Date();
  // getUTCDay(): 0=Sun 1=Mon … 6=Sat. Roll back to Monday.
  const dayOfWeek = now.getUTCDay();
  const daysBack = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - daysBack
    )
  );
}

export async function GET() {
  try {
    const todayStart = startOfTodayUTC();
    const weekStart = startOfWeekUTC();

    const [totalCandidates, sentCount, positiveCount, actionsToday, positiveReplies] =
      await Promise.all([
        // Total candidates
        prisma.candidate.count(),

        // Denominator for reply rate: all actions with status = "SENT"
        prisma.action.count({
          where: { status: "SENT" },
        }),

        // Numerator for reply rate: SENT actions that have a positive signal
        prisma.action.count({
          where: {
            status: "SENT",
            OR: [
              { replyType: "POSITIVE" },
              { outcome: "replied" },
              { outcome: "booked" },
            ],
          },
        }),

        // Actions today: status = "SENT" and sentAt >= start of today UTC
        prisma.action.count({
          where: {
            status: "SENT",
            sentAt: { gte: todayStart },
          },
        }),

        // Positive replies this week: outcome replied/booked, created this week
        prisma.action.count({
          where: {
            OR: [{ outcome: "replied" }, { outcome: "booked" }],
            createdAt: { gte: weekStart },
          },
        }),
      ]);

    const replyRate =
      sentCount === 0 ? 0 : Math.round((positiveCount / sentCount) * 100);

    return NextResponse.json({
      totalCandidates,
      replyRate,
      actionsToday,
      positiveReplies,
    });
  } catch (err) {
    console.error("GET /api/stats failed:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
