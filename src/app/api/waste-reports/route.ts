import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reports = await db.wasteReport.findMany({
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
  const { productId, quantity, reason, notes } = body;

  if (!productId || !quantity || !reason) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const report = await db.wasteReport.create({
    data: {
      productId,
      quantity: parseInt(quantity),
      reason,
      reportedBy: (session.user as { id: string }).id,
      notes: notes || null,
    },
    include: {
      product: { select: { name: true } },
    },
  });

  // Update product stock
  await db.product.update({
    where: { id: productId },
    data: { stockQuantity: { decrement: parseInt(quantity) } },
  });

  // Notify manager
  const managers = await db.user.findMany({
    where: { role: { in: ["OWNER", "MANAGER"] }, isActive: true },
  });
  for (const m of managers) {
    await db.notification.create({
      data: {
        userId: m.id,
        title: "Waste Report",
        message: `${quantity}x ${report.product.name} reported as ${reason.toLowerCase()}`,
        type: "WARNING",
      },
    });
  }

  return NextResponse.json(report, { status: 201 });
}
