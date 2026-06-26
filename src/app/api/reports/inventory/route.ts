import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchFilterFromSession, getBranchIdFromSession } from "@/lib/branch-filter";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const branchFilter = getBranchFilterFromSession(session);
    const branchId = getBranchIdFromSession(session);

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const lowStockOnly = searchParams.get("lowStockOnly") === "true";

    const productWhere: Record<string, any> = { isActive: true };
    if (categoryId) productWhere.categoryId = categoryId;

    const catFilter = categoryId
      ? Prisma.sql`AND p."categoryId" = ${categoryId}`
      : Prisma.sql``;

    const branchSql = branchId
      ? Prisma.sql`AND "branchId" = ${branchId}`
      : Prisma.sql``;

    const branchSqlP = branchId
      ? Prisma.sql`AND p."branchId" = ${branchId}`
      : Prisma.sql``;

    const [
      totalProducts,
      totalStockValue,
      lowStockItems,
      outOfStockItems,
      stockByCategory,
      recentAdjustments,
      topMovingProducts,
      products,
    ] = await Promise.all([
      db.product.count({ where: { ...productWhere, ...(branchFilter || {}) } }),
      db.$queryRaw<[{ total: number }]>(Prisma.sql`
        SELECT SUM("stockQuantity" * "costPrice")::float AS total
        FROM "Product"
        WHERE "isActive" = true ${catFilter} ${branchSql}
      `).then((r) => r[0].total ?? 0),
      db.$queryRaw<[{ count: number }]>(Prisma.sql`
        SELECT COUNT(*)::int AS count
        FROM "Product"
        WHERE "isActive" = true
          AND "stockQuantity" <= "minStockLevel"
          AND "stockQuantity" > 0 ${catFilter} ${branchSql}
      `).then((r) => r[0].count),
      db.$queryRaw<[{ count: number }]>(Prisma.sql`
        SELECT COUNT(*)::int AS count
        FROM "Product"
        WHERE "isActive" = true
          AND "stockQuantity" = 0 ${catFilter} ${branchSql}
      `).then((r) => r[0].count),
      db.$queryRaw<{ category: string; count: number; stockValue: number }[]>(Prisma.sql`
        SELECT
          c."name" AS category,
          COUNT(p."id")::int AS count,
          COALESCE(SUM(p."stockQuantity" * p."costPrice")::float, 0) AS stockValue
        FROM "Product" p
        LEFT JOIN "Category" c ON p."categoryId" = c."id"
        WHERE p."isActive" = true ${branchSqlP}
        GROUP BY c."name"
        ORDER BY stockValue DESC
      `),
      db.stockAdjustment.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          product: { select: { name: true, sku: true } },
          user: { select: { firstName: true, lastName: true } },
        },
      }),
      db.saleItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 10,
      }),
      db.product.findMany({
        where: lowStockOnly
          ? { ...productWhere, stockQuantity: { lte: 5 }, ...(branchFilter || {}) }
          : { ...productWhere, ...(branchFilter || {}) },
        include: {
          category: { select: { name: true } },
          supplier: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    const lowStockProducts = await db.product.findMany({
      where: {
        isActive: true,
        stockQuantity: { lte: 5 },
        ...(branchFilter || {}),
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stockQuantity: true,
        minStockLevel: true,
        costPrice: true,
        category: { select: { name: true } },
      },
    });

    const resolvedTopMoving = await Promise.all(
      topMovingProducts.map(async (tp) => {
        const product = await db.product.findUnique({
          where: { id: tp.productId },
          select: { name: true, sku: true, stockQuantity: true, price: true },
        });
        return {
          name: product?.name ?? "Unknown",
          sku: product?.sku ?? "",
          currentStock: product?.stockQuantity ?? 0,
          totalSold: tp._sum.quantity ?? 0,
          price: Number(product?.price ?? 0),
        };
      })
    );

    return NextResponse.json({
      summary: {
        totalProducts,
        totalStockValue: Number(totalStockValue),
        lowStockItems,
        outOfStockItems,
        totalCategories: stockByCategory.length,
      },
      stockByCategory: stockByCategory.map((s) => ({
        category: s.category ?? "Uncategorized",
        productCount: s.count,
        stockValue: Number(s.stockValue),
      })),
      lowStockProducts: lowStockProducts.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        currentStock: p.stockQuantity,
        minStock: p.minStockLevel,
        deficit: p.minStockLevel - p.stockQuantity,
        category: p.category?.name ?? "Uncategorized",
      })),
      topMovingProducts: resolvedTopMoving,
      recentAdjustments: recentAdjustments.map((a) => ({
        id: a.id,
        productName: a.product.name,
        productSku: a.product.sku,
        type: a.type,
        quantity: a.quantity,
        reason: a.reason,
        reference: a.reference,
        performedBy: `${a.user.firstName} ${a.user.lastName}`,
        createdAt: a.createdAt.toISOString(),
      })),
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        stockQuantity: p.stockQuantity,
        minStockLevel: p.minStockLevel,
        maxStockLevel: p.maxStockLevel,
        costPrice: Number(p.costPrice),
        price: Number(p.price),
        stockValue: p.stockQuantity * Number(p.costPrice),
        category: p.category?.name ?? "Uncategorized",
        supplier: p.supplier?.name ?? "No supplier",
        unit: p.unit,
        isLowStock: p.stockQuantity <= p.minStockLevel,
        isOutOfStock: p.stockQuantity === 0,
      })),
    });
  } catch (error) {
    console.error("Inventory report GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory report" },
      { status: 500 }
    );
  }
}
