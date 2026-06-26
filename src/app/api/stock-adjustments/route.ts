import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

type UserRole = "OWNER" | "MANAGER" | "WAREHOUSE_MANAGER" | "WAREHOUSE_REP";

const MANAGER_ROLES: UserRole[] = ["OWNER", "MANAGER", "WAREHOUSE_MANAGER"];

function isManagerRole(role: string): role is UserRole {
  return (MANAGER_ROLES as string[]).includes(role);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const productId = searchParams.get("productId");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Record<string, any> = {};

    if (productId) where.productId = productId;
    if (type) where.type = type;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate + "T23:59:59");
    }

    const skip = (page - 1) * limit;

    const [adjustments, total] = await Promise.all([
      db.stockAdjustment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          product: { select: { id: true, name: true, sku: true, stockQuantity: true } },
          user: { select: { firstName: true, lastName: true } },
        },
      }),
      db.stockAdjustment.count({ where }),
    ]);

    return NextResponse.json({
      adjustments: adjustments.map((a) => ({
        id: a.id,
        productName: a.product.name,
        productSku: a.product.sku,
        currentStock: a.product.stockQuantity,
        type: a.type,
        quantity: a.quantity,
        reason: a.reason,
        reference: a.reference,
        status: a.status,
        performedBy: `${a.user.firstName} ${a.user.lastName}`,
        createdAt: a.createdAt.toISOString(),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Stock adjustments GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock adjustments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { productId, type, quantity, reason, reference } = body;

    if (!productId || !type || !quantity || !reason) {
      return NextResponse.json(
        { error: "Product ID, type, quantity, and reason are required" },
        { status: 400 }
      );
    }

    if (quantity <= 0) {
      return NextResponse.json(
        { error: "Quantity must be a positive number" },
        { status: 400 }
      );
    }

    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const isWarehouseRep = user.role === "WAREHOUSE_REP";
    const adjustmentStatus = isWarehouseRep ? "PENDING" : "APPROVED";

    if (!isWarehouseRep) {
      const adjustment = await db.$transaction(async (tx) => {
        let stockChange: number;

        switch (type) {
          case "ADDITION":
            stockChange = quantity;
            break;
          case "SUBTRACTION":
          case "DAMAGE":
          case "EXPIRED":
            if (product.stockQuantity < quantity) {
              throw new Error(`Insufficient stock. Current: ${product.stockQuantity}, Requested: ${quantity}`);
            }
            stockChange = -quantity;
            break;
          case "RETURN":
            stockChange = quantity;
            break;
          case "TRANSFER":
            if (product.stockQuantity < quantity) {
              throw new Error(`Insufficient stock for transfer. Current: ${product.stockQuantity}, Requested: ${quantity}`);
            }
            stockChange = -quantity;
            break;
          default:
            throw new Error("Invalid adjustment type");
        }

        const newStock = product.stockQuantity + stockChange;
        if (newStock < 0) {
          throw new Error("Stock cannot go below zero");
        }

        await tx.product.update({
          where: { id: productId },
          data: { stockQuantity: newStock },
        });

        const adj = await tx.stockAdjustment.create({
          data: {
            productId,
            userId: session.user.id,
            type,
            quantity,
            reason,
            reference: reference || null,
            status: "APPROVED",
          },
          include: {
            product: { select: { name: true, sku: true, stockQuantity: true } },
            user: { select: { firstName: true, lastName: true } },
          },
        });

        await tx.auditLog.create({
          data: {
            userId: session.user.id,
            action: "STOCK_ADJUSTMENT",
            resource: "product",
            resourceId: productId,
            details: {
              type,
              quantity,
              reason,
              previousStock: product.stockQuantity,
              newStock,
            },
          },
        });

        if (newStock <= product.minStockLevel) {
          const procurementUsers = await tx.user.findMany({
            where: {
              isActive: true,
              role: { in: ["PROCUREMENT_MANAGER", "PROCUREMENT_REP"] },
            },
            select: { id: true },
          });

          const notifications = procurementUsers.map((u) => ({
            userId: u.id,
            title: "Low Stock Alert",
            message: `${product.name} (${product.sku}) is low on stock. Current: ${newStock}, Min: ${product.minStockLevel}`,
            type: "WARNING" as const,
            link: "/dashboard/inventory/stock",
          }));

          if (notifications.length > 0) {
            await tx.notification.createMany({ data: notifications });
          }
        }

        return adj;
      });

      return NextResponse.json(
        {
          id: adjustment.id,
          productName: adjustment.product.name,
          productSku: adjustment.product.sku,
          currentStock: adjustment.product.stockQuantity,
          type: adjustment.type,
          quantity: adjustment.quantity,
          reason: adjustment.reason,
          reference: adjustment.reference,
          status: adjustment.status,
          performedBy: `${adjustment.user.firstName} ${adjustment.user.lastName}`,
          createdAt: adjustment.createdAt.toISOString(),
        },
        { status: 201 }
      );
    }

    const adj = await db.stockAdjustment.create({
      data: {
        productId,
        userId: session.user.id,
        type,
        quantity,
        reason,
        reference: reference || null,
        status: "PENDING",
      },
      include: {
        product: { select: { name: true, sku: true, stockQuantity: true } },
        user: { select: { firstName: true, lastName: true } },
      },
    });

    const managers = await db.user.findMany({
      where: {
        isActive: true,
        role: { in: MANAGER_ROLES },
      },
      select: { id: true },
    });

    if (managers.length > 0) {
      await db.notification.createMany({
        data: managers.map((m) => ({
          userId: m.id,
          title: "Pending Stock Adjustment",
          message: `${session.user.id} requests a ${type} of ${quantity} for ${product.name} (${product.sku}). Reason: ${reason}`,
          type: "INFO" as const,
          link: "/dashboard/inventory/stock",
        })),
      });
    }

    return NextResponse.json(
      {
        id: adj.id,
        productName: adj.product.name,
        productSku: adj.product.sku,
        currentStock: adj.product.stockQuantity,
        type: adj.type,
        quantity: adj.quantity,
        reason: adj.reason,
        reference: adj.reference,
        status: adj.status,
        performedBy: `${adj.user.firstName} ${adj.user.lastName}`,
        createdAt: adj.createdAt.toISOString(),
        message: "Adjustment pending manager approval",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Stock adjustments POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create stock adjustment" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (!user || !isManagerRole(user.role)) {
      return NextResponse.json(
        { error: "Only managers can approve or reject adjustments" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "Adjustment ID and status are required" },
        { status: 400 }
      );
    }

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be APPROVED or REJECTED" },
        { status: 400 }
      );
    }

    const adjustment = await db.stockAdjustment.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!adjustment) {
      return NextResponse.json(
        { error: "Adjustment not found" },
        { status: 404 }
      );
    }

    if (adjustment.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending adjustments can be approved or rejected" },
        { status: 400 }
      );
    }

    if (status === "APPROVED") {
      let stockChange: number;

      switch (adjustment.type) {
        case "ADDITION":
          stockChange = adjustment.quantity;
          break;
        case "SUBTRACTION":
        case "DAMAGE":
        case "EXPIRED":
          if (adjustment.product.stockQuantity < adjustment.quantity) {
            return NextResponse.json(
              { error: `Insufficient stock. Current: ${adjustment.product.stockQuantity}, Requested: ${adjustment.quantity}` },
              { status: 400 }
            );
          }
          stockChange = -adjustment.quantity;
          break;
        case "RETURN":
          stockChange = adjustment.quantity;
          break;
        case "TRANSFER":
          if (adjustment.product.stockQuantity < adjustment.quantity) {
            return NextResponse.json(
              { error: `Insufficient stock for transfer. Current: ${adjustment.product.stockQuantity}, Requested: ${adjustment.quantity}` },
              { status: 400 }
            );
          }
          stockChange = -adjustment.quantity;
          break;
        default:
          return NextResponse.json({ error: "Invalid adjustment type" }, { status: 400 });
      }

      const newStock = adjustment.product.stockQuantity + stockChange;
      if (newStock < 0) {
        return NextResponse.json(
          { error: "Stock cannot go below zero" },
          { status: 400 }
        );
      }

      await db.$transaction(async (tx) => {
        await tx.product.update({
          where: { id: adjustment.productId },
          data: { stockQuantity: newStock },
        });

        await tx.stockAdjustment.update({
          where: { id },
          data: {
            status: "APPROVED",
            approvedBy: session.user.id,
            approvedAt: new Date(),
          },
        });

        await tx.auditLog.create({
          data: {
            userId: session.user.id,
            action: "STOCK_ADJUSTMENT_APPROVED",
            resource: "product",
            resourceId: adjustment.productId,
            details: {
              adjustmentId: id,
              type: adjustment.type,
              quantity: adjustment.quantity,
              reason: adjustment.reason,
              previousStock: adjustment.product.stockQuantity,
              newStock,
              requestedBy: adjustment.userId,
            },
          },
        });

        if (newStock <= adjustment.product.minStockLevel) {
          const procurementUsers = await tx.user.findMany({
            where: {
              isActive: true,
              role: { in: ["PROCUREMENT_MANAGER", "PROCUREMENT_REP"] },
            },
            select: { id: true },
          });

          const notifications = procurementUsers.map((u) => ({
            userId: u.id,
            title: "Low Stock Alert",
            message: `${adjustment.product.name} (${adjustment.product.sku}) is low on stock. Current: ${newStock}, Min: ${adjustment.product.minStockLevel}`,
            type: "WARNING" as const,
            link: "/dashboard/inventory/stock",
          }));

          if (notifications.length > 0) {
            await tx.notification.createMany({ data: notifications });
          }
        }
      });
    } else {
      await db.stockAdjustment.update({
        where: { id },
        data: {
          status: "REJECTED",
          approvedBy: session.user.id,
          approvedAt: new Date(),
        },
      });

      await db.auditLog.create({
        data: {
          userId: session.user.id,
          action: "STOCK_ADJUSTMENT_REJECTED",
          resource: "product",
          resourceId: adjustment.productId,
          details: {
            adjustmentId: id,
            type: adjustment.type,
            quantity: adjustment.quantity,
            reason: adjustment.reason,
            requestedBy: adjustment.userId,
          },
        },
      });
    }

    return NextResponse.json({ message: `Adjustment ${status.toLowerCase()} successfully` });
  } catch (error: any) {
    console.error("Stock adjustments PATCH error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update adjustment" },
      { status: 500 }
    );
  }
}
