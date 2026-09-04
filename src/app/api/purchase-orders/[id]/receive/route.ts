import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { UserRole, PurchaseStatus } from "@prisma/client";

interface ReceiveItem {
  id: string;
  receivedQty: number;
}

const RECEIVABLE_STATUSES = ["PAID", "PARTIALLY_RECEIVED"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAuth(["OWNER", "MANAGER", "PROCUREMENT_MANAGER", "WAREHOUSE_MANAGER", "WAREHOUSE_REP"]);
  if (error) return error;

  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json(
      { error: "User ID not found in session" },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { items, notes } = body as { items?: ReceiveItem[]; notes?: string };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Items with received quantities are required" },
        { status: 400 }
      );
    }

    const purchaseOrder = await db.purchaseOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    if (!purchaseOrder) {
      return NextResponse.json(
        { error: "Purchase order not found" },
        { status: 404 }
      );
    }

    if (purchaseOrder.status !== "PAID" && purchaseOrder.status !== "PARTIALLY_RECEIVED") {
      return NextResponse.json(
        { error: "Goods can only be received on a PAID order" },
        { status: 400 }
      );
    }

    // Validate all submitted item IDs belong to this order
    const orderItemIds = new Set(purchaseOrder.items.map((i) => i.id));
    for (const item of items) {
      if (!orderItemIds.has(item.id)) {
        return NextResponse.json(
          { error: `Item ${item.id} does not belong to this purchase order` },
          { status: 400 }
        );
      }
    }

    const receiptUpdates: Array<{ id: string; receivedQty: number; delta: number }> = [];

    // Apply all updates atomically
    const result = await db.$transaction(async (tx) => {
      for (const item of items) {
        const poItem = purchaseOrder.items.find((i) => i.id === item.id);
        if (!poItem) continue;

        const submitted = Number(item.receivedQty);
        if (!Number.isFinite(submitted) || !Number.isInteger(submitted)) {
          throw new Error(`Invalid received quantity for item ${poItem.product.name}`);
        }

        const newReceivedQty = Math.max(0, Math.min(submitted, poItem.quantity - 0));
        // Idempotency: only increment stock by the delta from the stored value
        const delta = newReceivedQty - poItem.receivedQty;
        if (delta === 0) continue;

        await tx.purchaseOrderItem.update({
          where: { id: poItem.id },
          data: { receivedQty: newReceivedQty },
        });

        await tx.product.update({
          where: { id: poItem.productId },
          data: {
            stockQuantity: {
              increment: delta,
            },
          },
        });

        receiptUpdates.push({ id: poItem.id, receivedQty: newReceivedQty, delta });
      }

      // Recompute all items from the DB state inside the transaction
      const updatedItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: id },
        select: { id: true, receivedQty: true, quantity: true },
      });

      const allReceived = updatedItems.every((i) => i.receivedQty >= i.quantity);

      const newStatus: PurchaseStatus = allReceived ? "RECEIVED" : "PARTIALLY_RECEIVED";

      const updatedOrder = await tx.purchaseOrder.update({
        where: { id },
        data: {
          status: newStatus,
          notes: notes ? `${purchaseOrder.notes || ""}\n\nReceipt notes: ${notes}` : purchaseOrder.notes,
        },
        include: {
          supplier: { select: { id: true, name: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true } },
            },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: "RECEIVE_PURCHASE_ORDER",
          resource: "PurchaseOrder",
          resourceId: id,
          details: {
            items: receiptUpdates,
            status: newStatus,
          },
        },
      });

      return { updatedOrder, newStatus };
    });

    // Notify relevant users (outside the transaction, best-effort)
    const notifyRoles: UserRole[] = ["OWNER", "MANAGER", "PROCUREMENT_MANAGER"];
    const notifyUsers = await db.user.findMany({
      where: { role: { in: notifyRoles }, isActive: true },
      select: { id: true },
    });
    if (notifyUsers.length > 0) {
      await db.notification.createMany({
        data: notifyUsers.map((u) => ({
          userId: u.id,
          title: `Purchase Order ${result.newStatus === "RECEIVED" ? "Fully Received" : "Partially Received"}`,
          message: `PO ${purchaseOrder.orderNumber} has been ${result.newStatus === "RECEIVED" ? "fully received" : "partially received"}.`,
          type: result.newStatus === "RECEIVED" ? "SUCCESS" : "INFO",
          link: "/dashboard/procurement/purchase-orders",
        })),
      });
    }

    return NextResponse.json({
      ...result.updatedOrder,
      total: Number(result.updatedOrder.total),
      items: result.updatedOrder.items.map((item) => ({
        ...item,
        unitCost: Number(item.unitCost),
        total: Number(item.total),
      })),
    });
  } catch (error: any) {
    console.error("Receive purchase order error:", error);
    if (error instanceof Error && error.message.startsWith("Invalid received quantity")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to receive purchase order" },
      { status: 500 }
    );
  }
}