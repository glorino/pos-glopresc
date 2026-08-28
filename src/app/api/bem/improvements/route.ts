import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["BUSINESS_EFFICIENCY_MANAGER", "OWNER", "MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const improvements = await db.processImprovement.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(improvements);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["BUSINESS_EFFICIENCY_MANAGER", "OWNER", "MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { process: proc, description, impact } = body;

  if (!proc || !description) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const improvement = await db.processImprovement.create({
    data: {
      process: proc,
      description,
      impact: impact || "LOW",
    },
  });

  return NextResponse.json(improvement, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["BUSINESS_EFFICIENCY_MANAGER", "OWNER", "MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { id, status: newStatus, impact } = body;

  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (newStatus) data.status = newStatus;
  if (impact) data.impact = impact;

  const improvement = await db.processImprovement.update({ where: { id }, data });
  return NextResponse.json(improvement);
}
