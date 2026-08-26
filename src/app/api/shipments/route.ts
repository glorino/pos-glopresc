import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const saleId = searchParams.get("saleId");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (saleId) where.saleId = saleId;
  if (status) where.status = status;

  const shipments = await db.shipment.findMany({
    where,
    include: {
      sale: { select: { id: true, invoiceNumber: true, total: true } },
      customer: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(shipments);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { saleId, carrier, trackingNumber } = body;

  if (!saleId) {
    return NextResponse.json({ error: "saleId is required" }, { status: 400 });
  }

  const shipment = await db.shipment.create({
    data: {
      saleId,
      carrier: carrier || null,
      trackingNumber: trackingNumber || null,
      status: "PENDING",
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
  });

  // Notify warehouse
  const warehouseUsers = await db.user.findMany({
    where: { role: { in: ["OWNER", "WAREHOUSE_MANAGER"] }, isActive: true },
  });
  for (const u of warehouseUsers) {
    await db.notification.create({
      data: {
        userId: u.id,
        title: "New Shipment",
        message: `Shipment created for order ${shipment.saleId?.slice(0, 8)}...`,
        type: "INFO",
      },
    });
  }

  return NextResponse.json(shipment, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, status: newStatus, carrier, trackingNumber, notes } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (newStatus) {
    updateData.status = newStatus;
    if (newStatus === "DELIVERED") updateData.actualDelivery = new Date();
  }
  if (carrier) updateData.carrier = carrier;
  if (trackingNumber) updateData.trackingNumber = trackingNumber;
  if (notes !== undefined) updateData.notes = notes;

  const shipment = await db.shipment.update({
    where: { id },
    data: updateData,
  });

  // Notify sale owner if delivered
  if (newStatus === "DELIVERED" && shipment.saleId) {
    const sale = await db.sale.findUnique({ where: { id: shipment.saleId } });
    if (sale?.userId) {
      await db.notification.create({
        data: {
          userId: sale.userId,
          title: "Order Delivered",
          message: `Your order has been delivered.`,
          type: "SUCCESS",
        },
      });
    }
  }

  return NextResponse.json(shipment);
}
