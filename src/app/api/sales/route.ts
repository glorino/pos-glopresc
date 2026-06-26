import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateInvoiceNumber } from "@/lib/utils";
import { sendSMS } from "@/lib/sms";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const status = searchParams.get("status");
    const paymentMethod = searchParams.get("paymentMethod");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");

    const where: Record<string, any> = {};

    if (status) where.status = status;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate + "T23:59:59");
    }
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { customer: { firstName: { contains: search, mode: "insensitive" } } },
        { customer: { lastName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const skip = (page - 1) * limit;

    const [sales, total] = await Promise.all([
      db.sale.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { firstName: true, lastName: true } },
          customer: { select: { firstName: true, lastName: true, phone: true } },
          items: {
            include: { product: { select: { name: true, sku: true } } },
          },
        },
      }),
      db.sale.count({ where }),
    ]);

    return NextResponse.json({
      sales: sales.map((s) => ({
        ...s,
        subtotal: Number(s.subtotal),
        discount: Number(s.discount),
        tax: Number(s.tax),
        total: Number(s.total),
        amountPaid: Number(s.amountPaid),
        changeDue: Number(s.changeDue),
        items: s.items.map((i) => ({
          ...i,
          unitPrice: Number(i.unitPrice),
          total: Number(i.total),
        })),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Sales GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, customerId, items, paymentMethod, amountPaid, notes, discount = 0, tax = 0 } = body;

    const token = await getToken({ req: request as any });
    const branchId = token?.branchId as string | undefined || null;

    if (!userId || !items || items.length === 0) {
      return NextResponse.json(
        { error: "User ID and at least one item are required" },
        { status: 400 }
      );
    }

    const productIds = items.map((item: { productId: string }) => item.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    const saleItems = items.map((item: { productId: string; quantity: number }) => {
      const product = productMap.get(item.productId);
      if (!product) throw new Error(`Product ${item.productId} not found`);
      const unitPrice = Number(product.price);
      const total = unitPrice * item.quantity;
      subtotal += total;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        total,
      };
    });

    const total = subtotal - Number(discount) + Number(tax);
    const invoiceNumber = generateInvoiceNumber();

    const sale = await db.$transaction(async (tx) => {
      const newSale = await tx.sale.create({
        data: {
          invoiceNumber,
          userId,
          branchId,
          customerId: customerId || null,
          subtotal,
          discount: Number(discount),
          tax: Number(tax),
          total,
          amountPaid: Number(amountPaid ?? total),
          changeDue: Number(amountPaid ?? total) - total,
          paymentMethod: paymentMethod ?? "CASH",
          status: "COMPLETED",
          notes: notes || null,
          items: {
            create: saleItems,
          },
        },
        include: {
          items: { include: { product: { select: { name: true, sku: true } } } },
          customer: { select: { firstName: true, lastName: true } },
          user: { select: { firstName: true, lastName: true } },
        },
      });

      for (const item of saleItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { decrement: item.quantity } },
        });
      }

      if (customerId) {
        await tx.customer.update({
          where: { id: customerId },
          data: { totalSpent: { increment: total } },
        });
      }

      return newSale;
    });

    if (sale.customer) {
      const customerPhone = await db.customer.findUnique({
        where: { id: customerId },
        select: { phone: true },
      });
      if (customerPhone?.phone) {
        const message = `SSV Shop Receipt: Invoice ${sale.invoiceNumber}, Total: \u20A6${Number(sale.total).toLocaleString("en-NG", { minimumFractionDigits: 2 })}. Thank you for your purchase!`;
        sendSMS(customerPhone.phone, message);
      }
    }

    return NextResponse.json(sale, { status: 201 });
  } catch (error: any) {
    console.error("Sales POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create sale" },
      { status: 500 }
    );
  }
}
