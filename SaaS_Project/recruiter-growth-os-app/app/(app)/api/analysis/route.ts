import { prisma } from "@/lib/prisma";

export async function GET() {
  const actions = await prisma.action.findMany();

  const total = actions.length;

  const replied = actions.filter(a => a.status === "replied").length;

  const positive = actions.filter(a => a.replyType === "positive").length;

  const byVariant = actions.reduce((acc, a) => {
    const key = a.messageVariant || "unknown";

    if (!acc[key]) {
      acc[key] = { total: 0, replies: 0 };
    }

    acc[key].total += 1;

    if (a.status === "replied") {
      acc[key].replies += 1;
    }

    return acc;
  }, {} as Record<string, { total: number; replies: number }>);

  return Response.json({
    total,
    replied,
    positive,
    replyRate: total ? replied / total : 0,
    byVariant,
  });
}