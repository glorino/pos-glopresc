import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const resolved = searchParams.get("resolved");

  const where: Record<string, unknown> = {};
  if (resolved !== null) where.resolved = resolved === "true";

  const reports = await db.damageReport.findMany({
    where,
    include: {
      product: { select: { id: true, name: true, sku: true } },
      reporter: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reports);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { productId, quantity, reason, severity } = body;

  if (!productId || !quantity || !reason) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const report = await db.damageReport.create({
    data: {
      productId,
      quantity: parseInt(quantity),
      reason,
      severity: severity || "LOW",
      reportedBy: (session.user as { id: string }).id,
    },
    include: {
      product: { select: { name: true } },
    },
  });

  // Notify managers
  const managers = await db.user.findMany({
    where: { role: { in: ["OWNER", "MANAGER", "WAREHOUSE_MANAGER"] }, isActive: true },
  });
  for (const m of managers) {
    await db.notification.create({
      data: {
        userId: m.id,
        title: "Damage Report",
        message: `${quantity}x ${report.product.name} reported as damaged (${severity || "LOW"})`,
        type: severity === "CRITICAL" ? "ERROR" : "WARNING",
      },
    });
  }

  return NextResponse.json(report, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, resolved } = body;

  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const report = await db.damageReport.update({
    where: { id },
    data: { resolved: !!resolved },
  });

  return NextResponse.json(report);
}
