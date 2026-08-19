import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      branchRanking,
      recentExpenses,
      categorySalesData,
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
      db.$queryRaw<
        { id: string; name: string; revenue: number; salesCount: number }[]
      >`
        SELECT
          b."id",
          b."name",
          COALESCE(SUM(s."total"), 0)::float AS revenue,
          COUNT(s."id")::int AS "salesCount"
        FROM "Branch" b
        LEFT JOIN "Sale" s ON s."branchId" = b."id" AND s."status" = 'COMPLETED'
        GROUP BY b."id", b."name"
        ORDER BY revenue DESC
      `,
      db.expense.findMany({
        take: 5,
        orderBy: { date: "desc" },
        select: {
          id: true,
          description: true,
          amount: true,
          status: true,
          date: true,
        },
      }),
      db.$queryRaw<
        { category: string; total: number }[]
      >`
        SELECT
          c."name" AS category,
          COALESCE(SUM(si."total"), 0)::float AS total
        FROM "SaleItem" si
        JOIN "Product" p ON p."id" = si."productId"
        JOIN "Category" c ON c."id" = p."categoryId"
        JOIN "Sale" s ON s."id" = si."saleId"
        WHERE s."status" = 'COMPLETED'
        GROUP BY c."name"
        ORDER BY total DESC
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

    const recentActivityItems: { type: string; label: string; detail: string; time: string }[] = [];
    for (const sale of recentSales.slice(0, 3)) {
      const diffMs = Date.now() - new Date(sale.createdAt).getTime();
      const mins = Math.floor(diffMs / 60000);
      const timeLabel = mins < 60 ? `${mins}m ago` : mins < 1440 ? `${Math.floor(mins / 60)}h ago` : `${Math.floor(mins / 1440)}d ago`;
      recentActivityItems.push({
        type: "sale",
        label: "New Sale Recorded",
        detail: `Invoice ${sale.invoiceNumber} - ${formatCurrency(Number(sale.total))}`,
        time: timeLabel,
      });
    }
    for (const exp of recentExpenses.slice(0, 2)) {
      const diffMs = Date.now() - new Date(exp.date).getTime();
      const mins = Math.floor(diffMs / 60000);
      const timeLabel = mins < 60 ? `${mins}m ago` : mins < 1440 ? `${Math.floor(mins / 60)}h ago` : `${Math.floor(mins / 1440)}d ago`;
      recentActivityItems.push({
        type: "expense",
        label: exp.status === "APPROVED" ? "Expense Approved" : "Expense Submitted",
        detail: `${exp.description} - ${formatCurrency(Number(exp.amount))}`,
        time: timeLabel,
      });
    }

    const totalCategoryRevenue = categorySalesData.reduce((sum, c) => sum + Number(c.total), 0);
    const salesBreakdown = categorySalesData.map((c) => ({
      name: c.category,
      value: totalCategoryRevenue > 0 ? Math.round((Number(c.total) / totalCategoryRevenue) * 100) : 0,
    }));

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
      branchRanking: branchRanking.map((b) => ({
        id: b.id,
        name: b.name,
        revenue: Number(b.revenue),
        salesCount: b.salesCount,
      })),
      recentActivity: recentActivityItems,
      salesBreakdown,
    });
  } catch (error) {
    console.error("Owner dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
