import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateOrderNumber } from "@/lib/utils";
import { requireAuth } from "@/lib/api-auth";
import { UserRole } from "@prisma/client";

const RECEIVABLE_STATUSES = ["PAID", "PARTIALLY_RECEIVED"];

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["APPROVED", "CANCELLED"],
  APPROVED: ["ORDERED", "CANCELLED"],
  ORDERED: ["PAID", "CANCELLED"],
  PAID: ["PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"],
  PARTIALLY_RECEIVED: ["RECEIVED", "PARTIALLY_RECEIVED", "CANCELLED"],
  RECEIVED: [],
  CANCELLED: [],
};

function isValidTransition(current: string, next: string): boolean {
  if (current === next) return true;
  return (ALLOWED_TRANSITIONS[current] || []).includes(next);
}

export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20") || 20));
    const status = searchParams.get("status");
    const supplierId = searchParams.get("supplierId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");

    const where: Record<string, any> = {};

    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate + "T23:59:59");
    }
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { supplier: { name: { contains: search, mode: "insensitive" } } },
      ];
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
          payments: { select: { id: true, amount: true } },
          _count: { select: { items: true } },
        },
      }),
      db.purchaseOrder.count({ where }),
    ]);

    return NextResponse.json({
      purchaseOrders: purchaseOrders.map((po) => ({
        ...po,
        total: Number(po.total),
        payments: po.payments.map((p) => ({ ...p, amount: Number(p.amount) })),
        items: po.items.map((item) => ({
          ...item,
          unitCost: Number(item.unitCost),
          total: Number(item.total),
        })),
      })),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
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
  const { error, session } = await requireAuth(["OWNER", "MANAGER", "PROCUREMENT_MANAGER"]);
  if (error) return error;
  try {
    const userId = (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json(
        { error: "User ID not found in session" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { supplierId, items, expectedDate, notes } = body;

    if (!supplierId || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Supplier ID and at least one item are required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Items must be an array" }, { status: 400 });
    }

    const supplier = await db.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 400 });
    }

    const productIds = items.map((i: any) => i.productId);
    if (new Set(productIds).size !== productIds.length) {
      return NextResponse.json(
        { error: "Duplicate products in purchase order items" },
        { status: 400 }
      );
    }

    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true },
    });
    const foundIds = new Set(products.map((p) => p.id));
    for (const pid of productIds) {
      if (!foundIds.has(pid)) {
        return NextResponse.json(
          { error: `Product not found: ${pid}` },
          { status: 400 }
        );
      }
    }

    const validatedItems = items.map((item: any) => {
      const quantity = Number(item.quantity);
      const unitCost = Number(item.unitCost);
      if (!Number.isFinite(quantity) || !Number.isInteger(quantity) || quantity < 1) {
        throw new Error("Each item must have a positive integer quantity");
      }
      if (!Number.isFinite(unitCost) || unitCost < 0) {
        throw new Error("Each item must have a valid unit cost");
      }
      return { ...item, quantity, unitCost };
    });

    const orderNumber = generateOrderNumber();

    const total = validatedItems.reduce(
      (sum: number, item: any) => sum + Math.round(item.quantity * item.unitCost * 100) / 100,
      0
    );

    let expectedDateValue: Date | null = null;
    if (expectedDate) expectedDateValue = new Date(expectedDate);

    const purchaseOrder = await db.purchaseOrder.create({
      data: {
        orderNumber,
        supplierId,
        total,
        expectedDate: expectedDateValue,
        notes: notes || null,
        createdBy: userId,
        items: {
          create: validatedItems.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitCost: item.unitCost,
            total: Math.round(item.quantity * item.unitCost * 100) / 100,
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
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create purchase order" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const { error, session } = await requireAuth(["OWNER", "MANAGER", "PROCUREMENT_MANAGER"]);
  if (error) return error;
  try {
    const userId = (session?.user as { id?: string })?.id;

    const body = await request.json();
    const { id, ...rawData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Purchase order ID is required" },
        { status: 400 }
      );
    }

    const existing = await db.purchaseOrder.findUnique({
      where: { id },
      include: {
        items: { select: { receivedQty: true, quantity: true } },
        payments: { select: { amount: true } },
      },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Purchase order not found" },
        { status: 404 }
      );
    }

    const ALLOWED_FIELDS = ["status", "expectedDate", "notes"] as const;
    const data: Record<string, any> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in rawData) data[key] = rawData[key];
    }

    if (data.expectedDate === "" || data.expectedDate === null) {
      data.expectedDate = null;
    } else if (data.expectedDate) {
      data.expectedDate = new Date(data.expectedDate);
    }

    if (data.status) {
      if (typeof data.status !== "string") {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      const validStatuses = ["PENDING", "APPROVED", "ORDERED", "PAID", "PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"];
      if (!validStatuses.includes(data.status)) {
        return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
      }

      if (data.status === "CANCELLED") {
        const totalReceived = existing.items.reduce((s, i) => s + i.receivedQty, 0);
        const totalPaid = existing.payments.reduce((s, p) => s + Number(p.amount), 0);
        if (totalReceived > 0) {
          return NextResponse.json(
            { error: "Cannot cancel an order that has received goods" },
            { status: 400 }
          );
        }
        if (totalPaid > 0) {
          return NextResponse.json(
            { error: "Cannot cancel an order that has payments recorded" },
            { status: 400 }
          );
        }
      }

      if (data.status === "RECEIVED") {
        return NextResponse.json(
          { error: "Use the receive goods endpoint to mark an order as received" },
          { status: 400 }
        );
      }

      if (!isValidTransition(existing.status, data.status)) {
        return NextResponse.json(
          { error: `Cannot transition purchase order from ${existing.status} to ${data.status}` },
          { status: 400 }
        );
      }
    }

    const purchaseOrder = await db.purchaseOrder.update({
      where: { id },
      data,
      include: {
        supplier: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
      },
    });

    // Notify on status change
    if (data.status) {
      const notifyRoles: UserRole[] = [];
      if (data.status === "APPROVED") notifyRoles.push("PROCUREMENT_MANAGER", "WAREHOUSE_MANAGER");
      if (data.status === "ORDERED") notifyRoles.push("OWNER", "MANAGER");
      if (data.status === "CANCELLED") notifyRoles.push("OWNER", "MANAGER", "ACCOUNTANT");

      if (notifyRoles.length > 0) {
        const notifyUsers = await db.user.findMany({
          where: { role: { in: notifyRoles }, isActive: true },
          select: { id: true },
        });
        if (notifyUsers.length > 0) {
          await db.notification.createMany({
            data: notifyUsers.map((u) => ({
              userId: u.id,
              title: `PO ${data.status}`,
              message: `Purchase Order ${purchaseOrder.orderNumber} has been ${data.status.toLowerCase()}.`,
              type: data.status === "CANCELLED" ? "WARNING" : "INFO",
              link: "/dashboard/procurement/purchase-orders",
            })),
          });
        }
      }
    }

    if (userId) {
      await db.auditLog.create({
        data: {
          userId,
          action: "UPDATE_PURCHASE_ORDER",
          resource: "PurchaseOrder",
          resourceId: id,
          details: { changes: data },
        },
      });
    }

    return NextResponse.json({
      ...purchaseOrder,
      total: Number(purchaseOrder.total),
    });
  } catch (error: any) {
    console.error("Purchase Orders PUT error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update purchase order" },
      { status: 500 }
    );
  }
}