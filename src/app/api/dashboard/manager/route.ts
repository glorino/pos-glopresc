import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getBranchFilterFromSession } from "@/lib/branch-filter";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const branchFilter = getBranchFilterFromSession(session);
    const url = new URL(request.url);
    const view = url.searchParams.get("view");
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

    if (view === "staff") {
      const users = await db.user.findMany({
        where: {
          ...(branchFilter || {}),
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { role: "asc" },
      });
      return NextResponse.json({ users });
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

    const [
      todayRevenueResult,
      todaySales,
      staffOnDuty,
      inventoryValueResult,
      pendingApprovals,
      customerVisits,
      thisWeekSales,
      lastWeekSales,
      staffPerformance,
      expenseSummary,
      lowStockItems,
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
      db.user.count({
        where: { isActive: true, role: { in: ["SALES_REP", "SALES_MANAGER"] } },
      }),
      db.product.aggregate({
        _sum: { stockQuantity: true },
        where: { isActive: true },
      }),
      db.expense.count({ where: { status: "PENDING" } }),
      db.customer.count({
        where: {
          createdAt: { gte: startOfToday, lte: endOfToday },
        },
      }),
      db.sale.aggregate({
        _sum: { total: true },
        _count: true,
        where: {
          status: "COMPLETED",
          createdAt: { gte: startOfThisWeek, lte: now },
          ...(branchFilter || {}),
        },
      }),
      db.sale.aggregate({
        _sum: { total: true },
        _count: true,
        where: {
          status: "COMPLETED",
          createdAt: { gte: startOfLastWeek, lte: endOfLastWeek },
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
      db.expense.groupBy({
        by: ["status"],
        _count: true,
        _sum: { amount: true },
      }),
      db.product.findMany({
        where: {
          isActive: true,
          stockQuantity: { lte: 10 },
          ...(branchFilter || {}),
        },
        select: { id: true, name: true, stockQuantity: true, minStockLevel: true },
        take: 5,
        orderBy: { stockQuantity: "asc" },
      }),
      db.sale.aggregate({
        _sum: { total: true },
        where: totalPaymentsWhere,
      }),
    ]);

    const todayRevenue = Number(todayRevenueResult._sum.total ?? 0);
    const totalInventoryQuantity = Number(inventoryValueResult._sum.stockQuantity ?? 0);
    const inventoryValue = totalInventoryQuantity * 0;

    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const thisWeekData: { name: string; thisWeek: number; lastWeek: number }[] = [];

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startOfThisWeek);
      dayDate.setDate(dayDate.getDate() + i);
      const lastDayDate = new Date(startOfLastWeek);
      lastDayDate.setDate(lastDayDate.getDate() + i);

      thisWeekData.push({
        name: weekDays[i],
        thisWeek: 0,
        lastWeek: 0,
      });
    }

    return NextResponse.json({
      todayRevenue,
      todaySales,
      staffOnDuty,
      inventoryValue: totalInventoryQuantity,
      pendingApprovals,
      customerVisits,
      totalPayments: Number(totalPaymentsResult._sum.total ?? 0),
      weeklyComparison: thisWeekData,
      staffPerformance: staffPerformance.map((s) => ({
        name: `${s.firstName} ${s.lastName}`,
        sales: s.sales.length,
        revenue: s.sales.reduce((acc, sale) => acc + Number(sale.total), 0),
      })),
      expenseSummary: expenseSummary.map((e) => ({
        status: e.status,
        count: e._count,
        total: Number(e._sum.amount ?? 0),
      })),
      lowStockItems,
    });
  } catch (error) {
    console.error("Manager dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
