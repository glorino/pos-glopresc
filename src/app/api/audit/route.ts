import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getBranchFilterFromSession } from "@/lib/branch-filter";
import { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { error, session } = await requireAuth(["OWNER", "MANAGER", "AUDITOR"]);
  if (error) return error;
  try {
    const branchFilter = session?.user
      ? getBranchFilterFromSession(session)
      : ({ branchId: "__NONE__" } as any);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "30");
    const action = searchParams.get("action");
    const userId = searchParams.get("userId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const search = searchParams.get("search");
    const section = searchParams.get("section"); // optional: "sales", "inventory", "finance", "procurement", "users", "overview"

    const where: Record<string, any> = {};

    if (action) {
      where.action = { contains: action, mode: "insensitive" };
    }
    if (userId) {
      where.userId = userId;
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo + "T23:59:59");
    }
    if (search) {
      where.OR = [
        { action: { contains: search, mode: "insensitive" } },
        { resource: { contains: search, mode: "insensitive" } },
        { user: { firstName: { contains: search, mode: "insensitive" } } },
        { user: { lastName: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (branchFilter) {
      where.user = branchFilter;
    }

    const skip = (page - 1) * limit;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Build branch-scoped where helpers
    const branchProductWhere: Record<string, any> = {};
    if (branchFilter) {
      branchProductWhere.OR = [
        { branchId: branchFilter.OR?.[0]?.branchId },
        { branchId: null },
      ];
    }
    const branchSaleWhere: Record<string, any> = {};
    if (branchFilter) {
      branchSaleWhere.OR = [
        { branchId: branchFilter.OR?.[0]?.branchId },
        { branchId: null },
      ];
    }
    const branchExpenseWhere: Record<string, any> = {};
    if (branchFilter) {
      branchExpenseWhere.OR = [
        { branchId: branchFilter.OR?.[0]?.branchId },
        { branchId: null },
      ];
    }

    const [
      auditLogs,
      total,
      // Audit Log stats
      totalLogs,
      todayActivities,
      failedLogins,
      modifiedRecords,
      systemAlerts,
      // Sales audit
      totalSales,
      completedSales,
      refundedSales,
      cancelledSales,
      salesRevenueAgg,
      // Inventory audit
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      totalStockMovements,
      // Financial audit
      totalExpensesAgg,
      approvedExpensesAgg,
      pendingExpenses,
      totalInvoices,
      pendingInvoices,
      paidInvoicesAgg,
      // Procurement audit
      totalSuppliers,
      pendingPurchaseOrders,
      totalOrderValueAgg,
      // User activity
      activeUsers,
      loginsToday,
      newUsersThisMonth,
    ] = await Promise.all([
      // Audit logs with pagination
      db.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
      db.auditLog.count({ where }),

      // Audit Log counts
      db.auditLog.count({
        where: { ...(branchFilter ? { user: branchFilter } : {}) },
      }),
      db.auditLog.count({
        where: {
          createdAt: { gte: todayStart },
          ...(branchFilter ? { user: branchFilter } : {}),
        },
      }),
      db.auditLog.count({
        where: {
          action: { contains: "LOGIN_FAILED", mode: "insensitive" },
          ...(branchFilter ? { user: branchFilter } : {}),
        },
      }),
      db.auditLog.count({
        where: {
          action: { contains: "UPDATE", mode: "insensitive" },
          ...(branchFilter ? { user: branchFilter } : {}),
        },
      }),
      db.auditLog.count({
        where: {
          OR: [
            { action: { contains: "ALERT", mode: "insensitive" } },
            { action: { contains: "ERROR", mode: "insensitive" } },
          ],
          ...(branchFilter ? { user: branchFilter } : {}),
        },
      }),

      // Sales audit
      db.sale.count({ where: branchSaleWhere }),
      db.sale.count({ where: { status: "COMPLETED", ...branchSaleWhere } }),
      db.sale.count({ where: { status: "REFUNDED", ...branchSaleWhere } }),
      db.sale.count({ where: { status: "CANCELLED", ...branchSaleWhere } }),
      db.sale.aggregate({
        _sum: { total: true },
        where: { status: "COMPLETED", ...branchSaleWhere },
      }),

      // Inventory audit
      db.product.count({ where: branchProductWhere }),
      Promise.resolve(0),
      db.product.count({
        where: { stockQuantity: 0, ...branchProductWhere },
      }),
      db.stockAdjustment.count({
        where: {
          createdAt: { gte: monthStart },
          ...(branchFilter ? { user: branchFilter } : {}),
        },
      }),

      // Financial audit
      db.expense.aggregate({
        _sum: { amount: true },
        where: branchExpenseWhere,
      }),
      db.expense.aggregate({
        _sum: { amount: true },
        where: { status: "APPROVED", ...branchExpenseWhere },
      }),
      db.expense.count({
        where: { status: "PENDING", ...branchExpenseWhere },
      }),
      db.invoice.count({ where: branchExpenseWhere }),
      db.invoice.count({
        where: { status: "PENDING", ...branchExpenseWhere },
      }),
      db.invoice.aggregate({
        _sum: { total: true },
        where: { status: "PAID", ...branchExpenseWhere },
      }),

      // Procurement audit
      db.supplier.count({ where: { isActive: true } }),
      db.purchaseOrder.count({
        where: { status: "PENDING" },
      }),
      db.purchaseOrder.aggregate({
        _sum: { total: true },
        where: { status: { in: ["PENDING", "APPROVED", "ORDERED"] } },
      }),

      // User activity
      db.user.count({ where: { isActive: true, ...(branchFilter ? branchFilter : {}) } }),
      db.user.count({
        where: {
          lastLoginAt: { gte: todayStart },
          ...(branchFilter ? branchFilter : {}),
        },
      }),
      db.user.count({
        where: {
          createdAt: { gte: monthStart },
          ...(branchFilter ? branchFilter : {}),
        },
      }),
    ]);

    // Low stock: use raw query since we need column comparison
    const lowStockResult = await db.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM "Product"
      WHERE "stockQuantity" > 0
        AND "stockQuantity" <= "minStockLevel"
        AND "isActive" = true
        ${branchFilter ? Prisma.sql`AND ("branchId" = ${branchFilter.OR?.[0]?.branchId} OR "branchId" IS NULL)` : Prisma.sql``}
    `;
    const lowStockCount = Number(lowStockResult[0]?.count ?? 0);

    // Daily activity breakdown by department (past 7 days)
    const dailyDepartmentData: {
      day: string;
      sales: number;
      inventory: number;
      finance: number;
      procurement: number;
      users: number;
    }[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayLabel = dayStart.toLocaleDateString("en-NG", {
        weekday: "short",
        day: "numeric",
      });

      const [salesCount, inventoryCount, financeCount, procurementCount, usersCount] =
        await Promise.all([
          db.sale.count({
            where: {
              createdAt: { gte: dayStart, lt: dayEnd },
              ...branchSaleWhere,
            },
          }),
          db.stockAdjustment.count({
            where: {
              createdAt: { gte: dayStart, lt: dayEnd },
              ...(branchFilter ? { user: branchFilter } : {}),
            },
          }),
          db.expense.count({
            where: {
              createdAt: { gte: dayStart, lt: dayEnd },
              ...branchExpenseWhere,
            },
          }),
          db.purchaseOrder.count({
            where: {
              createdAt: { gte: dayStart, lt: dayEnd },
            },
          }),
          db.auditLog.count({
            where: {
              createdAt: { gte: dayStart, lt: dayEnd },
              action: { contains: "LOGIN", mode: "insensitive" },
              ...(branchFilter ? { user: branchFilter } : {}),
            },
          }),
        ]);

      dailyDepartmentData.push({
        day: dayLabel,
        sales: salesCount,
        inventory: inventoryCount,
        finance: financeCount,
        procurement: procurementCount,
        users: usersCount,
      });
    }

    return NextResponse.json({
      auditLogs: auditLogs.map((log) => ({
        ...log,
        details: log.details,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: {
        totalLogs,
        todayActivities,
        failedLogins,
        modifiedRecords,
        systemAlerts,
        // Sales
        totalSales,
        completedSales,
        refundedSales,
        cancelledSales,
        salesRevenue: Number(salesRevenueAgg._sum.total ?? 0),
        // Inventory
        totalProducts,
        lowStockProducts: lowStockCount,
        outOfStockProducts,
        totalStockMovements,
        // Financial
        totalExpenses: Number(totalExpensesAgg._sum.amount ?? 0),
        approvedExpenses: Number(approvedExpensesAgg._sum.amount ?? 0),
        pendingExpenses,
        totalInvoices,
        pendingInvoices,
        paidInvoicesValue: Number(paidInvoicesAgg._sum.total ?? 0),
        // Procurement
        totalSuppliers,
        pendingPurchaseOrders,
        totalOrderValue: Number(totalOrderValueAgg._sum.total ?? 0),
        // Users
        activeUsers,
        loginsToday,
        newUsersThisMonth,
      },
      dailyDepartmentActivity: dailyDepartmentData,
      departments: {
        sales: {
          name: "Sales",
          totalTransactions: totalSales,
          completed: completedSales,
          refunded: refundedSales,
          cancelled: cancelledSales,
          revenue: Number(salesRevenueAgg._sum.total ?? 0),
        },
        inventory: {
          name: "Inventory",
          totalProducts,
          lowStock: lowStockCount,
          outOfStock: outOfStockProducts,
          stockMovements: totalStockMovements,
        },
        finance: {
          name: "Finance",
          totalExpenses: Number(totalExpensesAgg._sum.amount ?? 0),
          approvedExpenses: Number(approvedExpensesAgg._sum.amount ?? 0),
          pendingExpenses,
          totalInvoices,
          pendingInvoices,
          paidInvoicesValue: Number(paidInvoicesAgg._sum.total ?? 0),
        },
        procurement: {
          name: "Procurement",
          totalSuppliers,
          pendingOrders: pendingPurchaseOrders,
          totalOrderValue: Number(totalOrderValueAgg._sum.total ?? 0),
        },
        users: {
          name: "Users",
          activeUsers,
          loginsToday,
          newUsersThisMonth,
        },
      },
    });
  } catch (error) {
    console.error("Audit GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit data" },
      { status: 500 }
    );
  }
}
