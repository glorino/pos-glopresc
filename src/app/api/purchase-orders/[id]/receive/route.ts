import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { Prisma, UserRole, PurchaseStatus } from "@prisma/client";

interface ReceiveItem {
  id: string;
  receivedQty: number;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(["OWNER", "MANAGER", "PROCUREMENT_MANAGER", "WAREHOUSE_MANAGER", "WAREHOUSE_REP"]);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const { items, notes } = body as { items: ReceiveItem[]; notes?: string };

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

    if (purchaseOrder.status === "RECEIVED" || purchaseOrder.status === "CANCELLED") {
      return NextResponse.json(
        { error: `Cannot receive a ${purchaseOrder.status.toLowerCase()} order` },
        { status: 400 }
      );
    }

    // Update each item's received quantity and product stock
    const updatedItems: Array<{ id: string; receivedQty: number }> = [];
    for (const item of items || []) {
      const poItem = purchaseOrder.items.find((i) => i.id === item.id);
      if (!poItem) continue;

      const newReceivedQty = Math.min(item.receivedQty, poItem.quantity);
      
      await db.purchaseOrderItem.update({
        where: { id: item.id },
        data: { receivedQty: newReceivedQty }
      });

      // Update product stock
      await db.product.update({
        where: { id: poItem.productId },
        data: {
          stockQuantity: {
            increment: newReceivedQty
          }
        }
      });

      updatedItems.push({ ...poItem, receivedQty: newReceivedQty });
    }

    // Check if all items are fully received
    const allReceived = purchaseOrder.items.every(
      (item) => {
        const updated = updatedItems.find((u) => u.id === item.id);
        return (updated?.receivedQty ?? item.receivedQty) >= item.quantity;
      }
    );

    const newStatus: PurchaseStatus = allReceived ? "RECEIVED" : "PARTIALLY_RECEIVED";

    const updatedOrder = await db.purchaseOrder.update({
      where: { id },
      data: {
        status: newStatus,
        notes: notes ? `${purchaseOrder.notes || ""}\n\nReceipt notes: ${notes}` : purchaseOrder.notes
      },
      include: {
        supplier: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } }
          }
        }
      }
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: "system",
        action: "RECEIVE_PURCHASE_ORDER",
        resource: "PurchaseOrder",
        resourceId: id,
        details: { items: updatedItems.map(i => ({ id: i.id, receivedQty: i.receivedQty })) }
      }
    });

    // Notify relevant users
    const notifyRoles: UserRole[] = ["OWNER", "MANAGER", "PROCUREMENT_MANAGER"];
    const notifyUsers = await db.user.findMany({
      where: { role: { in: notifyRoles }, isActive: true },
      select: { id: true },
    });
    if (notifyUsers.length > 0) {
      await db.notification.createMany({
        data: notifyUsers.map((u) => ({
          userId: u.id,
          title: `Purchase Order ${newStatus === "RECEIVED" ? "Fully Received" : "Partially Received"}`,
          message: `PO ${purchaseOrder.orderNumber} has been ${newStatus === "RECEIVED" ? "fully received" : "partially received"}.`,
          type: newStatus === "RECEIVED" ? "SUCCESS" : "INFO",
          link: "/dashboard/procurement/purchase-orders",
        })),
      });
    }

    return NextResponse.json({
      ...updatedOrder,
      total: Number(updatedOrder.total),
      items: updatedOrder.items.map((item) => ({
        ...item,
        unitCost: Number(item.unitCost),
        total: Number(item.total),
      })),
    });
  } catch (error: any) {
    console.error("Receive purchase order error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to receive purchase order" },
      { status: 500 }
    );
  }
}