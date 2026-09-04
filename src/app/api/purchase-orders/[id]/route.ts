import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(["OWNER", "MANAGER", "PROCUREMENT_MANAGER", "PROCUREMENT_REP", "ACCOUNTANT", "CFO", "AUDITOR", "WAREHOUSE_MANAGER", "WAREHOUSE_REP"]);
  if (error) return error;

  try {
    const { id } = await params;

    const purchaseOrder = await db.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: { select: { id: true, name: true, contactName: true, email: true, phone: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
        payments: {
          include: {
            payer: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { paidAt: "desc" },
        },
      },
    });

    if (!purchaseOrder) {
      return NextResponse.json(
        { error: "Purchase order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...purchaseOrder,
      total: Number(purchaseOrder.total),
      items: purchaseOrder.items.map((item) => ({
        ...item,
        unitCost: Number(item.unitCost),
        total: Number(item.total),
      })),
      payments: purchaseOrder.payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
      })),
    });
  } catch (error) {
    console.error("Purchase Order GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchase order" },
      { status: 500 }
    );
  }
}