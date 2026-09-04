import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { UserRole, PaymentMethod } from "@prisma/client";

const PAYABLE_STATUSES = ["APPROVED", "ORDERED", "PAID", "PARTIALLY_RECEIVED"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAuth(["OWNER", "MANAGER", "ACCOUNTANT", "CFO"]);
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
    const { amount, method, reference, notes } = body;

    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
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

    const validMethods = Object.values(PaymentMethod) as string[];
    if (!validMethods.includes(String(method).toUpperCase())) {
      return NextResponse.json(
        { error: `Invalid payment method. Must be one of: ${validMethods.join(", ")}` },
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

    if (purchaseOrder.status === "CANCELLED" || purchaseOrder.status === "RECEIVED") {
      return NextResponse.json(
        { error: `Cannot pay a ${purchaseOrder.status.toLowerCase()} order` },
        { status: 400 }
      );
    }

    if (!PAYABLE_STATUSES.includes(purchaseOrder.status)) {
      return NextResponse.json(
        { error: `Cannot pay an order in ${purchaseOrder.status} status` },
        { status: 400 }
      );
    }

    // Atomic payment + status update so concurrent payments can't overpay
    const result = await db.$transaction(async (tx) => {
      const current = await tx.purchaseOrder.findUnique({
        where: { id },
        include: { payments: { select: { amount: true } } },
      });
      if (!current) {
        throw new Error("Purchase order not found");
      }

      const totalPaid = current.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const orderTotal = Number(current.total);
      const newTotalPaid = totalPaid + amountNum;

      if (newTotalPaid > orderTotal) {
        const error: any = new Error("Payment exceeds order total");
        error.status = 400;
        error.expose = true;
        error.details = { totalPaid, orderTotal };
        throw error;
      }

      const payment = await tx.procurementPayment.create({
        data: {
          purchaseOrderId: id,
          amount: amountNum,
          method: String(method).toUpperCase() as PaymentMethod,
          reference: reference || null,
          notes: notes || null,
          paidBy: userId,
        },
        include: {
          purchaseOrder: true,
          payer: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      // Only mark PAID when fully paid
      let newStatus = current.status;
      if (newTotalPaid >= orderTotal) {
        newStatus = "PAID";
      }

      const order = await tx.purchaseOrder.update({
        where: { id },
        data: { status: newStatus },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: "CREATE_PROCUREMENT_PAYMENT",
          resource: "ProcurementPayment",
          resourceId: payment.id,
          details: { amount: amountNum, method, purchaseOrderId: id },
        },
      });

      return { payment, newStatus, orderNumber: order.orderNumber };
    });

    // Notify procurement and warehouse staff (best-effort, outside transaction)
    const notifyRoles: UserRole[] = ["OWNER", "MANAGER", "PROCUREMENT_MANAGER", "WAREHOUSE_MANAGER"];
    const notifyUsers = await db.user.findMany({
      where: { role: { in: notifyRoles }, isActive: true },
      select: { id: true },
    });
    if (notifyUsers.length > 0) {
      await db.notification.createMany({
        data: notifyUsers.map((u) => ({
          userId: u.id,
          title: result.newStatus === "PAID" ? "Purchase Order Fully Paid" : "Payment Recorded",
          message: `Payment of ${amountNum} recorded for PO ${result.orderNumber}. ${result.newStatus === "PAID" ? "Order is now fully paid." : ""}`,
          type: "SUCCESS",
          link: "/dashboard/procurement/purchase-orders",
        })),
      });
    }

    return NextResponse.json({
      ...result.payment,
      amount: Number(result.payment.amount),
    }, { status: 201 });
  } catch (error: any) {
    console.error("Create procurement payment error:", error);
    if (error?.status) {
      return NextResponse.json(
        { error: error.details ? `Payment exceeds order total. Already paid: ${error.details.totalPaid}, Order total: ${error.details.orderTotal}` : error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: "Failed to create payment" },
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
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}