import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();

  const interaction = await prisma.action.update({
    where: {
      id: body.actionId,
    },
    data: {
      replyType: body.replyType,
      replyContent: body.replyContent,
      repliedAt: new Date(),
      status: "replied",
    },
  });

  return Response.json(interaction);
}