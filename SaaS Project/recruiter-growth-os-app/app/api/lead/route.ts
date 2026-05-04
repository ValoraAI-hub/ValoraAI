import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();

  const candidate = await prisma.candidate.create({
    data: {
      userId: "test-user",
      name: body.name,
      role: body.role,
      company: body.company,
      interactionType: body.interactionType ?? "manual",
    },
  });

  return Response.json(candidate);
}