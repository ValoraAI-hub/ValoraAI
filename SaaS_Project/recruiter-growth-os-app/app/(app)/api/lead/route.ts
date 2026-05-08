import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = user.id;

  const body = await req.json();

  const candidate = await prisma.candidate.create({
    data: {
      userId,
      name: body.name,
      role: body.role,
      company: body.company,
      interactionType: body.interactionType ?? "manual",
    },
  });

  return Response.json(candidate);
}