import { prisma } from "@/lib/prisma";

export async function GET() {
  const actions = await prisma.action.findMany();

  const stats = actions.reduce((acc, a) => {
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

  let bestVariant = "A";
  let bestRate = 0;

  for (const variant in stats) {
    const rate = stats[variant].replies / stats[variant].total;

    if (rate > bestRate) {
      bestRate = rate;
      bestVariant = variant;
    }
  }

  return Response.json({
    recommendedVariant: bestVariant,
    confidence: bestRate,
  });
}