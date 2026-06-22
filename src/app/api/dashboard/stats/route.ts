import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      todaySalesResult,
      monthSalesResult,
      yearSalesResult,
      todayTransactions,
      monthTransactions,
      totalProducts,
      lowStockProducts,
      activeCustomers,
      pendingExpensesResult,
      openDrawer,
      recentSales,
    ] = await Promise.all([
      db.sale.aggregate({
        _sum: { total: true },
        _count: true,
        where: { status: "COMPLETED", createdAt: { gte: startOfDay } },
      }),
      db.sale.aggregate({
        _sum: { total: true },
        _count: true,
        where: { status: "COMPLETED", createdAt: { gte: startOfMonth } },
      }),
      db.sale.aggregate({
        _sum: { total: true },
        _count: true,
        where: { status: "COMPLETED", createdAt: { gte: startOfYear } },
      }),
      db.sale.count({ where: { status: "COMPLETED", createdAt: { gte: startOfDay } } }),
      db.sale.count({ where: { status: "COMPLETED", createdAt: { gte: startOfMonth } } }),
      db.product.count({ where: { isActive: true } }),
      db.$queryRaw<[{ count: number }]>`
        SELECT COUNT(*)::int AS count
        FROM "Product"
        WHERE "isActive" = true
          AND "stockQuantity" <= "minStockLevel"
      `.then((r) => r[0].count),
      db.customer.count({ where: { isActive: true } }),
      db.expense.aggregate({
        _sum: { amount: true },
        where: { status: "PENDING", createdAt: { gte: startOfMonth } },
      }),
      db.cashDrawer.findFirst({
        where: { status: "OPEN" },
        orderBy: { openedAt: "desc" },
      }),
      db.sale.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { firstName: true, lastName: true } },
          customer: { select: { firstName: true, lastName: true } },
          items: { include: { product: { select: { name: true } } } },
        },
      }),
    ]);

    const todayRevenue = Number(todaySalesResult._sum.total ?? 0);
    const monthRevenue = Number(monthSalesResult._sum.total ?? 0);
    const yearRevenue = Number(yearSalesResult._sum.total ?? 0);
    const pendingExpenses = Number(pendingExpensesResult._sum.amount ?? 0);

    return NextResponse.json({
      today: {
        revenue: todayRevenue,
        transactions: todayTransactions,
        averageSale: todayTransactions > 0 ? todayRevenue / todayTransactions : 0,
      },
      month: {
        revenue: monthRevenue,
        transactions: monthTransactions,
        averageSale: monthTransactions > 0 ? monthRevenue / monthTransactions : 0,
      },
      year: {
        revenue: yearRevenue,
        transactions: yearSalesResult._count,
      },
      totals: {
        products: totalProducts,
        lowStockItems: lowStockProducts,
        activeCustomers,
        pendingExpenses,
      },
      cashDrawer: openDrawer
        ? {
            id: openDrawer.id,
            openingBalance: Number(openDrawer.openingBalance),
            openedAt: openDrawer.openedAt.toISOString(),
          }
        : null,
      recentSales: recentSales.map((s) => ({
        id: s.id,
        invoiceNumber: s.invoiceNumber,
        cashier: `${s.user.firstName} ${s.user.lastName}`,
        customer: s.customer
          ? `${s.customer.firstName} ${s.customer.lastName}`
          : "Walk-in",
        total: Number(s.total),
        paymentMethod: s.paymentMethod,
        createdAt: s.createdAt.toISOString(),
        itemCount: s.items.length,
      })),
    });
  } catch (error) {
    console.error("Dashboard stats GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
