import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["BUSINESS_EFFICIENCY_MANAGER", "OWNER", "MANAGER", "CFO"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const kpis = await db.kPI.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(kpis);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["BUSINESS_EFFICIENCY_MANAGER", "OWNER", "MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, target, current, unit } = body;

  if (!name || target === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const kpi = await db.kPI.create({
    data: {
      name,
      target: parseFloat(target),
      current: current ? parseFloat(current) : 0,
      unit: unit || "count",
    },
  });

  return NextResponse.json(kpi, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["BUSINESS_EFFICIENCY_MANAGER", "OWNER", "MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { id, current, target, trend } = body;

  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (current !== undefined) data.current = parseFloat(current);
  if (target !== undefined) data.target = parseFloat(target);
  if (trend) data.trend = trend;

  const kpi = await db.kPI.update({ where: { id }, data });
  return NextResponse.json(kpi);
}
