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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const saleDateFilter = startDate || endDate
      ? Prisma.sql`
          AND "createdAt" >= ${startDate ? new Date(startDate) : new Date("2000-01-01")}
          AND "createdAt" <= ${endDate ? new Date(endDate + "T23:59:59") : new Date()}
        `
      : Prisma.sql``;

    const expenseDateFilter = startDate || endDate
      ? Prisma.sql`
          AND e."date" >= ${startDate ? new Date(startDate) : new Date("2000-01-01")}
          AND e."date" <= ${endDate ? new Date(endDate + "T23:59:59") : new Date()}
        `
      : Prisma.sql``;

    const expenseDateFilterDirect = startDate || endDate
      ? Prisma.sql`
          AND "date" >= ${startDate ? new Date(startDate) : new Date("2000-01-01")}
          AND "date" <= ${endDate ? new Date(endDate + "T23:59:59") : new Date()}
        `
      : Prisma.sql``;

    const branchSql = branchId
      ? Prisma.sql`AND "branchId" = ${branchId}`
      : Prisma.sql``;

    const [
      salesResult,
      expensesResult,
      expensesByCategory,
      outstandingInvoices,
      pendingExpenses,
      recentExpenses,
      monthlyRevenue,
      monthlyExpenses,
    ] = await Promise.all([
      db.sale.aggregate({
        _sum: { total: true, discount: true, tax: true },
        _count: true,
        where: { status: "COMPLETED", ...(branchFilter || {}) },
      }),
      db.expense.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { ...(branchFilter || {}) },
      }),
      db.$queryRaw<{ category: string; total: number; count: number }[]>(Prisma.sql`
        SELECT
          ec."name" AS category,
          SUM(e."amount")::float AS total,
          COUNT(e."id")::int AS count
        FROM "Expense" e
        JOIN "ExpenseCategory" ec ON e."categoryId" = ec."id"
        WHERE 1=1 ${expenseDateFilter} ${branchSql}
        GROUP BY ec."name"
        ORDER BY total DESC
      `),
      db.invoice.aggregate({
        _sum: { total: true },
        _count: true,
        where: { status: { in: ["PENDING", "OVERDUE"] } },
      }),
      db.expense.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { status: "PENDING", ...(branchFilter || {}) },
      }),
      db.expense.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        where: { ...(branchFilter || {}) },
        include: {
          user: { select: { firstName: true, lastName: true } },
          category: { select: { name: true } },
        },
      }),
      db.$queryRaw<{ month: string; revenue: number }[]>(Prisma.sql`
        SELECT
          TO_CHAR("createdAt", 'YYYY-MM') AS month,
          SUM("total")::float AS revenue
        FROM "Sale"
        WHERE "status" = 'COMPLETED'
          AND "createdAt" >= ${new Date(new Date().getFullYear(), 0, 1)}
          ${branchSql}
        GROUP BY month
        ORDER BY month ASC
      `),
      db.$queryRaw<{ month: string; expenses: number }[]>(Prisma.sql`
        SELECT
          TO_CHAR("date", 'YYYY-MM') AS month,
          SUM("amount")::float AS expenses
        FROM "Expense"
        WHERE "date" >= ${new Date(new Date().getFullYear(), 0, 1)}
          ${branchSql}
        GROUP BY month
        ORDER BY month ASC
      `),
    ]);

    const totalRevenue = Number(salesResult._sum.total ?? 0);
    const totalDiscounts = Number(salesResult._sum.discount ?? 0);
    const totalTax = Number(salesResult._sum.tax ?? 0);
    const totalExpenses = Number(expensesResult._sum.amount ?? 0);
    const grossProfit = totalRevenue - totalExpenses;
    const netProfit = totalRevenue - totalExpenses - totalDiscounts;
    const outstandingAmount = Number(outstandingInvoices._sum.total ?? 0);
    const pendingExpenseAmount = Number(pendingExpenses._sum.amount ?? 0);

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const currentYear = new Date().getFullYear();
    const cashFlow = monthNames.map((name, i) => {
      const monthKey = `${currentYear}-${String(i + 1).padStart(2, "0")}`;
      const rev = monthlyRevenue.find((m) => m.month === monthKey);
      const exp = monthlyExpenses.find((m) => m.month === monthKey);
      const revenue = rev ? Number(rev.revenue) : 0;
      const expenses = exp ? Number(exp.expenses) : 0;
      return { name, revenue, expenses, net: revenue - expenses };
    });

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalExpenses,
        totalDiscounts,
        totalTax,
        grossProfit,
        netProfit,
        totalTransactions: salesResult._count,
        outstandingInvoices: outstandingAmount,
        outstandingCount: outstandingInvoices._count,
        pendingExpenses: pendingExpenseAmount,
        pendingExpensesCount: pendingExpenses._count,
      },
      expensesByCategory: expensesByCategory.map((e) => ({
        category: e.category,
        total: Number(e.total),
        count: e.count,
      })),
      cashFlow,
      recentExpenses: recentExpenses.map((e) => ({
        id: e.id,
        description: e.description,
        amount: Number(e.amount),
        category: e.category.name,
        status: e.status,
        recordedBy: `${e.user.firstName} ${e.user.lastName}`,
        date: e.date.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Financial report GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch financial report" },
      { status: 500 }
    );
  }
}
