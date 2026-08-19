import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const saleId = searchParams.get("saleId");

    const where: Record<string, any> = {};

    if (saleId) where.saleId = saleId;

    const refunds = await db.refund.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        sale: {
          select: {
            id: true,
            invoiceNumber: true,
            total: true,
            status: true,
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            method: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json(refunds.map((r) => ({
      ...r,
      amount: Number(r.amount),
      sale: {
        ...r.sale,
        total: Number(r.sale.total),
      },
      payment: r.payment
        ? { ...r.payment, amount: Number(r.payment.amount) }
        : null,
    })));
  } catch (error) {
    console.error("Refunds GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch refunds" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { saleId, paymentId, amount, reason, status, processedBy } = body;

    if (!saleId) {
      return NextResponse.json(
        { error: "saleId is required" },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "A positive refund amount is required" },
        { status: 400 }
      );
    }

    const sale = await db.sale.findUnique({ where: { id: saleId } });
    if (!sale) {
      return NextResponse.json(
        { error: "Sale not found" },
        { status: 404 }
      );
    }

    const refund = await db.$transaction(async (tx) => {
      const newRefund = await tx.refund.create({
        data: {
          saleId,
          paymentId: paymentId || null,
          amount: Number(amount),
          reason: reason || null,
          status: status || "PENDING",
          processedBy: processedBy || null,
        },
        include: {
          sale: {
            select: { id: true, invoiceNumber: true, total: true, status: true },
          },
          payment: {
            select: { id: true, amount: true, method: true, status: true },
          },
        },
      });

      const totalRefunded = await tx.refund.aggregate({
        where: { saleId },
        _sum: { amount: true },
      });

      const refundedAmount = Number(totalRefunded._sum.amount || 0);
      if (refundedAmount >= Number(sale.total)) {
        await tx.sale.update({
          where: { id: saleId },
          data: { status: "REFUNDED" },
        });
      }

      return newRefund;
    });

    return NextResponse.json(refund, { status: 201 });
  } catch (error: any) {
    console.error("Refunds POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create refund" },
      { status: 500 }
    );
  }
}
