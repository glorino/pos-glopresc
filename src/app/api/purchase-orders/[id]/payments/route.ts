import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { UserRole } from "@prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(["OWNER", "MANAGER", "ACCOUNTANT", "CFO"]);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const { amount, method, reference, notes, paidBy } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valid amount is required" },
        { status: 400 }
      );
    }

    if (!method) {
      return NextResponse.json(
        { error: "Payment method is required" },
        { status: 400 }
      );
    }

    const purchaseOrder = await db.purchaseOrder.findUnique({
      where: { id },
      include: { payments: true }
    });

    if (!purchaseOrder) {
      return NextResponse.json(
        { error: "Purchase order not found" },
        { status: 404 }
      );
    }

    if (purchaseOrder.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Cannot pay a cancelled order" },
        { status: 400 }
      );
    }

    // Calculate total paid so far
    const totalPaid = purchaseOrder.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const newTotalPaid = totalPaid + amount;

    // Check if payment exceeds order total
    if (newTotalPaid > Number(purchaseOrder.total)) {
      return NextResponse.json(
        { error: `Payment exceeds order total. Already paid: ${totalPaid}, Order total: ${purchaseOrder.total}` },
        { status: 400 }
      );
    }

    const payment = await db.procurementPayment.create({
      data: {
        purchaseOrderId: id,
        amount,
        method,
        reference: reference || null,
        notes: notes || null,
        paidBy: paidBy || "system",
      },
      include: {
        purchaseOrder: true,
        payer: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    // Update order status based on payment completion
    let newStatus = purchaseOrder.status;
    if (newTotalPaid >= Number(purchaseOrder.total)) {
      newStatus = "PAID";
    } else if (purchaseOrder.status === "PENDING" || purchaseOrder.status === "APPROVED") {
      newStatus = "PAID"; // Partial payment - but status should reflect payment
    }

    if (newStatus !== purchaseOrder.status) {
      await db.purchaseOrder.update({
        where: { id },
        data: { status: newStatus }
      });
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: paidBy || "system",
        action: "CREATE_PROCUREMENT_PAYMENT",
        resource: "ProcurementPayment",
        resourceId: payment.id,
        details: { amount, method, purchaseOrderId: id }
      }
    });

    // Notify procurement and warehouse staff
    const notifyRoles: UserRole[] = ["OWNER", "MANAGER", "PROCUREMENT_MANAGER", "WAREHOUSE_MANAGER"];
    const notifyUsers = await db.user.findMany({
      where: { role: { in: notifyRoles }, isActive: true },
      select: { id: true },
    });
    if (notifyUsers.length > 0) {
      await db.notification.createMany({
        data: notifyUsers.map((u) => ({
          userId: u.id,
          title: newStatus === "PAID" ? "Purchase Order Fully Paid" : "Payment Recorded",
          message: `Payment of ${amount} recorded for PO ${purchaseOrder.orderNumber}. ${newStatus === "PAID" ? "Order is now fully paid." : ""}`,
          type: "SUCCESS",
          link: "/dashboard/procurement/purchase-orders",
        })),
      });
    }

    return NextResponse.json({
      ...payment,
      amount: Number(payment.amount),
    }, { status: 201 });
  } catch (error: any) {
    console.error("Create procurement payment error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create payment" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(["OWNER", "MANAGER", "PROCUREMENT_MANAGER", "ACCOUNTANT", "CFO"]);
  if (error) return error;

  try {
    const { id } = await params;
    const purchaseOrder = await db.purchaseOrder.findUnique({
      where: { id },
      include: {
        payments: {
          include: {
            payer: { select: { id: true, firstName: true, lastName: true } }
          },
          orderBy: { paidAt: "desc" }
        }
      }
    });

    if (!purchaseOrder) {
      return NextResponse.json(
        { error: "Purchase order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      purchaseOrder: {
        ...purchaseOrder,
        total: Number(purchaseOrder.total),
        payments: purchaseOrder.payments.map(p => ({
          ...p,
          amount: Number(p.amount)
        }))
      }
    });
  } catch (error: any) {
    console.error("Get procurement payments error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch payments" },
      { status: 500 }
    );
  }
}