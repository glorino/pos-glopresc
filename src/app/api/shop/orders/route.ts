import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const txRef = searchParams.get("txRef");
    const invoiceNumber = searchParams.get("invoiceNumber");

    if (!txRef && !invoiceNumber) {
      return NextResponse.json(
        { error: "txRef or invoiceNumber is required" },
        { status: 400 }
      );
    }

    const where: Record<string, any> = {};
    if (txRef) where.txRef = txRef;
    if (invoiceNumber) where.invoiceNumber = invoiceNumber;

    const sale = await db.sale.findFirst({
      where,
      include: {
        items: {
          include: {
            product: { select: { name: true, sku: true, image: true } },
          },
        },
        payments: {
          select: { method: true, reference: true, status: true, amount: true },
        },
      },
    });

    if (!sale) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: sale.id,
      invoiceNumber: sale.invoiceNumber,
      status: sale.status,
      paymentMethod: sale.paymentMethod,
      subtotal: Number(sale.subtotal),
      discount: Number(sale.discount),
      tax: Number(sale.tax),
      total: Number(sale.total),
      amountPaid: Number(sale.amountPaid),
      changeDue: Number(sale.changeDue),
      txRef: sale.txRef,
      notes: sale.notes,
      createdAt: sale.createdAt,
      items: sale.items.map((item) => ({
        name: item.product.name,
        sku: item.product.sku,
        image: item.product.image,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })),
      payments: sale.payments,
    });
  } catch (error) {
    console.error("Order lookup error:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}
