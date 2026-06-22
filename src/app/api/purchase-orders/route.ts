import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateOrderNumber } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const status = searchParams.get("status");
    const supplierId = searchParams.get("supplierId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Record<string, any> = {};

    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate + "T23:59:59");
    }

    const skip = (page - 1) * limit;

    const [purchaseOrders, total] = await Promise.all([
      db.purchaseOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          supplier: { select: { id: true, name: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true } },
            },
          },
          _count: { select: { items: true } },
        },
      }),
      db.purchaseOrder.count({ where }),
    ]);

    return NextResponse.json({
      purchaseOrders: purchaseOrders.map((po) => ({
        ...po,
        total: Number(po.total),
        items: po.items.map((item) => ({
          ...item,
          unitCost: Number(item.unitCost),
          total: Number(item.total),
        })),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Purchase Orders GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchase orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { supplierId, items, expectedDate, notes, createdBy } = body;

    if (!supplierId || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Supplier ID and at least one item are required" },
        { status: 400 }
      );
    }

    const orderNumber = generateOrderNumber();

    const total = items.reduce(
      (sum: number, item: any) => sum + item.quantity * item.unitCost,
      0
    );

    const purchaseOrder = await db.purchaseOrder.create({
      data: {
        orderNumber,
        supplierId,
        total,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        notes: notes || null,
        createdBy: createdBy || "system",
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitCost: item.unitCost,
            total: item.quantity * item.unitCost,
          })),
        },
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

    return NextResponse.json(
      {
        ...purchaseOrder,
        total: Number(purchaseOrder.total),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Purchase Orders POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create purchase order" },
      { status: 500 }
    );
  }
}
