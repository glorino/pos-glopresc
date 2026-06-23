import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

    const [
      totalRevenueResult,
      totalSales,
      activeProducts,
      totalCustomers,
      pendingExpenses,
      lowStockItemsCount,
      monthlyRevenueData,
      recentSales,
      topProducts,
      lowStockProducts,
    ] = await Promise.all([
      db.sale.aggregate({
        _sum: { total: true },
        where: { status: "COMPLETED" },
      }),
      db.sale.count({ where: { status: "COMPLETED" } }),
      db.product.count({ where: { isActive: true } }),
      db.customer.count({ where: { isActive: true } }),
      db.expense.count({ where: { status: "PENDING" } }),
      db.$queryRaw<[{ count: number }]>`
        SELECT COUNT(*)::int AS count
        FROM "Product"
        WHERE "isActive" = true
          AND "stockQuantity" <= "minStockLevel"
      `.then((r) => r[0].count),
      db.$queryRaw<
        { month: string; revenue: number }[]
      >`
        SELECT
          TO_CHAR("createdAt", 'YYYY-MM') AS month,
          SUM("total")::float AS revenue
        FROM "Sale"
        WHERE "status" = 'COMPLETED'
          AND "createdAt" >= ${startOfYear}
          AND "createdAt" <= ${endOfYear}
        GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
        ORDER BY month ASC
      `,
      db.sale.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { firstName: true, lastName: true } },
          items: true,
        },
      }),
      db.saleItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
      db.$queryRaw<
        { id: string; name: string; sku: string; stockQuantity: number; minStockLevel: number }[]
      >`
        SELECT "id", "name", "sku", "stockQuantity", "minStockLevel"
        FROM "Product"
        WHERE "isActive" = true
          AND "stockQuantity" <= "minStockLevel"
        ORDER BY "stockQuantity" ASC
      `,
    ]);

    const totalRevenue = Number(totalRevenueResult._sum.total ?? 0);

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const monthlyRevenue = monthNames.map((name, i) => {
      const monthKey = `${currentYear}-${String(i + 1).padStart(2, "0")}`;
      const found = monthlyRevenueData.find((m) => m.month === monthKey);
      return { name, revenue: found ? Number(found.revenue) : 0 };
    });

    const resolvedTopProducts = await Promise.all(
      topProducts.map(async (tp) => {
        const product = await db.product.findUnique({
          where: { id: tp.productId },
          select: { name: true, price: true },
        });
        return {
          name: product?.name ?? "Unknown",
          totalSold: tp._sum.quantity ?? 0,
          totalRevenue: Number(tp._sum.total ?? 0),
        };
      })
    );

    return NextResponse.json({
      totalRevenue,
      totalSales,
      activeProducts,
      totalCustomers,
      pendingExpenses,
      lowStockItems: lowStockItemsCount,
      monthlyRevenue,
      recentSales: recentSales.map((s) => ({
        id: s.id,
        invoiceNumber: s.invoiceNumber,
        customer: s.customer
          ? `${s.customer.firstName} ${s.customer.lastName}`
          : "Walk-in",
        total: Number(s.total),
        createdAt: s.createdAt.toISOString(),
        status: s.status,
      })),
      topProducts: resolvedTopProducts,
      lowStockProducts: lowStockProducts.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        stockQuantity: p.stockQuantity,
        minStockLevel: p.minStockLevel,
      })),
    });
  } catch (error) {
    console.error("Owner dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
