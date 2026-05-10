import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = user.id;

    const searches = await prisma.search.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { candidates: true },
        },
      },
    });

    return NextResponse.json(searches, { status: 200 });
  } catch (err) {
    console.error("GET /api/searches failed:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = user.id;

    const body = await req.json().catch(() => ({}));
    const { title, company, rawContext } = (body ?? {}) as {
      title?: unknown;
      company?: unknown;
      rawContext?: unknown;
    };

    if (typeof title !== "string" || title.trim() === "") {
      return NextResponse.json(
        { error: "title is required and must be a non-empty string" },
        { status: 400 }
      );
    }
    if (typeof company !== "string" || company.trim() === "") {
      return NextResponse.json(
        { error: "company is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    const rawContextStr =
      typeof rawContext === "string" && rawContext.trim() !== ""
        ? rawContext
        : null;

    const search = await prisma.search.create({
      data: {
        userId,
        title: title.trim(),
        company: company.trim(),
        rawContext: rawContextStr,
        extractionStatus: rawContextStr ? "pending" : "idle",
      },
    });

    return NextResponse.json(search, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: "Database error", code: err.code },
        { status: 400 }
      );
    }
    console.error("POST /api/searches failed:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
