import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getBranchFilterFromSession } from "@/lib/branch-filter";

const PIE_COLORS = ["#d4a843", "#3b82f6", "#8b5cf6", "#10b981", "#f43f5e", "#06b6d4"];

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const branchFilter = getBranchFilterFromSession(session);

    const url = new URL(request.url);
    const dateFrom = url.searchParams.get("dateFrom");
    const dateTo = url.searchParams.get("dateTo");

    const totalPaymentsWhere: any = {
      status: "COMPLETED",
      ...(branchFilter || {}),
    };
    if (dateFrom) {
      totalPaymentsWhere.createdAt = { ...(totalPaymentsWhere.createdAt || {}), gte: new Date(dateFrom) };
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59);
      totalPaymentsWhere.createdAt = { ...(totalPaymentsWhere.createdAt || {}), lte: to };
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - now.getDay());
    startOfThisWeek.setHours(0, 0, 0, 0);

    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
    const endOfLastWeek = new Date(startOfThisWeek);
    endOfLastWeek.setSeconds(endOfLastWeek.getSeconds() - 1);

    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const [
      todayRevenueResult,
      todaySales,
      staffPerformance,
      categorySalesRaw,
      topProductsRaw,
      recentTransactionsRaw,
      weeklySalesData,
      totalPaymentsResult,
    ] = await Promise.all([
      db.sale.aggregate({
        _sum: { total: true },
        where: {
          status: "COMPLETED",
          createdAt: { gte: startOfToday, lte: endOfToday },
          ...(branchFilter || {}),
        },
      }),
      db.sale.count({
        where: {
          status: "COMPLETED",
          createdAt: { gte: startOfToday, lte: endOfToday },
          ...(branchFilter || {}),
        },
      }),
      db.user.findMany({
        where: {
          isActive: true,
          role: { in: ["SALES_REP", "SALES_MANAGER"] },
          ...(branchFilter || {}),
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          sales: {
            where: { status: "COMPLETED", createdAt: { gte: startOfThisWeek } },
            select: { total: true },
          },
        },
      }),
      db.saleItem.groupBy({
        by: ["productId"],
        _sum: { total: true },
        where: {
          sale: {
            status: "COMPLETED",
            createdAt: { gte: startOfThisWeek },
            ...(branchFilter || {}),
          },
        },
      }),
      db.saleItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { total: "desc" } },
        take: 5,
        where: {
          sale: {
            status: "COMPLETED",
            ...(branchFilter || {}),
          },
        },
      }),
      db.sale.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        where: {
          status: "COMPLETED",
          ...(branchFilter || {}),
        },
        select: {
          id: true,
          invoiceNumber: true,
          total: true,
          createdAt: true,
          status: true,
          paymentMethod: true,
          customer: {
            select: { firstName: true, lastName: true },
          },
        },
      }),
      db.sale.findMany({
        where: {
          status: "COMPLETED",
          createdAt: { gte: startOfThisWeek, lte: now },
          ...(branchFilter || {}),
        },
        select: { total: true, createdAt: true },
      }),
      db.sale.aggregate({
        _sum: { total: true },
        where: totalPaymentsWhere,
      }),
    ]);

    const todayRevenue = Number(todayRevenueResult._sum.total ?? 0);
    const averageSaleValue = todaySales > 0 ? Math.round(todayRevenue / todaySales) : 0;

    const topCashierEntry = staffPerformance
      .map((s) => ({
        name: `${s.firstName} ${s.lastName}`,
        revenue: s.sales.reduce((acc, sale) => acc + Number(sale.total), 0),
      }))
      .sort((a, b) => b.revenue - a.revenue)[0];
    const topCashier = topCashierEntry?.name ?? "N/A";

    const totalReturned = await db.sale.count({
      where: {
        status: "RETURNED",
        createdAt: { gte: startOfThisWeek },
        ...(branchFilter || {}),
      },
    });
    const totalWeekSales = await db.sale.count({
      where: {
        status: { in: ["COMPLETED", "RETURNED"] },
        createdAt: { gte: startOfThisWeek },
        ...(branchFilter || {}),
      },
    });
    const returnRate = totalWeekSales > 0
      ? Math.round((totalReturned / totalWeekSales) * 100 * 10) / 10
      : 0;

    // Category sales: resolve product -> category, group by category name
    const productIds = categorySalesRaw.map((c) => c.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, categoryId: true, category: { select: { name: true } } },
    });
    const productCategoryMap = new Map(
      products.map((p) => [p.id, p.category?.name ?? "Uncategorized"])
    );

    const categoryMap = new Map<string, number>();
    for (const entry of categorySalesRaw) {
      const catName = productCategoryMap.get(entry.productId) ?? "Uncategorized";
      const current = categoryMap.get(catName) ?? 0;
      categoryMap.set(catName, current + Number(entry._sum.total ?? 0));
    }
    const categorySales = Array.from(categoryMap.entries())
      .map(([name, value], index) => ({
        name,
        value,
        color: PIE_COLORS[index % PIE_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);

    // Top products: resolve names
    const topProductIds = topProductsRaw.map((p) => p.productId);
    const topProductsMeta = await db.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true },
    });
    const topProductNameMap = new Map(topProductsMeta.map((p) => [p.id, p.name]));
    const topProducts = topProductsRaw.map((tp) => ({
      name: topProductNameMap.get(tp.productId) ?? "Unknown",
      quantity: Number(tp._sum.quantity ?? 0),
      revenue: Number(tp._sum.total ?? 0),
    }));

    // Recent transactions
    const recentTransactions = recentTransactionsRaw.map((s) => ({
      id: s.id,
      invoiceNumber: s.invoiceNumber,
      customer: s.customer
        ? `${s.customer.firstName} ${s.customer.lastName}`
        : "Walk-in",
      total: Number(s.total),
      createdAt: s.createdAt.toISOString(),
      status: s.status,
      paymentMethod: s.paymentMethod,
    }));

    // Sales trend: group this week's sales by day-of-week
    const salesTrend = weekDays.map((name, i) => {
      const dayDate = new Date(startOfThisWeek);
      dayDate.setDate(dayDate.getDate() + i);
      const dayStart = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59);

      const daySales = weeklySalesData.filter((s) => {
        const d = new Date(s.createdAt);
        return d >= dayStart && d <= dayEnd;
      });

      return {
        name,
        revenue: daySales.reduce((acc, s) => acc + Number(s.total), 0),
        transactions: daySales.length,
      };
    });

    return NextResponse.json({
      todayRevenue,
      todayTransactions: todaySales,
      averageSaleValue,
      topCashier,
      returnRate,
      totalPayments: Number(totalPaymentsResult._sum.total ?? 0),
      salesTrend,
      categorySales,
      topProducts,
      recentTransactions,
    });
  } catch (error) {
    console.error("Sales Manager dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
