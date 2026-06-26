import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getBranchFilter } from "@/lib/branch-filter";

export async function GET(request: NextRequest) {
  try {
    const branchFilter = await getBranchFilter(request);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const [
      totalRevenueResult,
      totalExpensesResult,
      pendingInvoices,
      pendingExpenses,
      overdueInvoices,
    ] = await Promise.all([
      db.sale.aggregate({
        _sum: { total: true },
        where: {
          status: "COMPLETED",
          ...(branchFilter ? { branchId: branchFilter.branchId } : {}),
        },
      }),
      db.expense.aggregate({
        _sum: { amount: true },
        where: {
          status: { in: ["APPROVED", "PAID"] },
          ...(branchFilter ? { branchId: branchFilter.branchId } : {}),
        },
      }),
      db.invoice.count({
        where: { status: "PENDING" },
      }),
      db.expense.count({
        where: { status: "PENDING" },
      }),
      db.invoice.count({
        where: { status: "OVERDUE" },
      }),
    ]);

    const totalRevenue = Number(totalRevenueResult._sum.total ?? 0);
    const totalExpenses = Number(totalExpensesResult._sum.amount ?? 0);
    const netProfit = totalRevenue - totalExpenses;

    const monthlyCashFlow: { name: string; income: number; expenses: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(currentYear, currentMonth - i, 1);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);

      const [incomeResult, expenseResult] = await Promise.all([
        db.sale.aggregate({
          _sum: { total: true },
          where: {
            status: "COMPLETED",
            createdAt: { gte: monthStart, lte: monthEnd },
            ...(branchFilter ? { branchId: branchFilter.branchId } : {}),
          },
        }),
        db.expense.aggregate({
          _sum: { amount: true },
          where: {
            status: { in: ["APPROVED", "PAID"] },
            createdAt: { gte: monthStart, lte: monthEnd },
            ...(branchFilter ? { branchId: branchFilter.branchId } : {}),
          },
        }),
      ]);

      monthlyCashFlow.push({
        name: monthDate.toLocaleDateString("en-NG", { month: "short" }),
        income: Number(incomeResult._sum.total ?? 0),
        expenses: Number(expenseResult._sum.amount ?? 0),
      });
    }

    const expenseCategories = await db.expenseCategory.findMany({
      include: {
        expenses: {
          where: {
            status: { in: ["APPROVED", "PAID"] },
            ...(branchFilter ? { branchId: branchFilter.branchId } : {}),
          },
          select: { amount: true },
        },
      },
    });

    const expenseByCategory = expenseCategories
      .map((cat) => ({
        name: cat.name,
        value: cat.expenses.reduce((sum, exp) => sum + Number(exp.amount), 0),
      }))
      .filter((cat) => cat.value > 0)
      .sort((a, b) => b.value - a.value);

    const recentExpenses = await db.expense.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      where: {
        ...(branchFilter ? { branchId: branchFilter.branchId } : {}),
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    });

    const recentPayments = await db.payment.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { firstName: true, lastName: true } },
      },
    });

    const recentTransactions = [
      ...recentExpenses.map((exp) => ({
        id: exp.id,
        description: exp.description,
        amount: Number(exp.amount),
        type: "EXPENSE" as const,
        date: exp.createdAt.toISOString(),
        status: exp.status,
      })),
      ...recentPayments.map((pay) => ({
        id: pay.id,
        description: pay.description ?? `Payment from ${pay.customer?.firstName ?? "Customer"}`,
        amount: Number(pay.amount),
        type: "INCOME" as const,
        date: pay.createdAt.toISOString(),
        status: pay.status,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    const pendingExpenseApprovals = recentExpenses
      .filter((exp) => exp.status === "PENDING")
      .map((exp) => ({
        id: exp.id,
        description: exp.description,
        amount: Number(exp.amount),
        status: exp.status,
        date: exp.createdAt.toISOString(),
        user: `${exp.user.firstName} ${exp.user.lastName}`,
      }));

    return NextResponse.json({
      totalRevenue,
      totalExpenses,
      netProfit,
      pendingInvoices,
      pendingExpenses,
      overdueInvoices,
      monthlyCashFlow,
      expenseByCategory,
      recentTransactions,
      pendingExpenseApprovals,
    });
  } catch (error) {
    console.error("Accounting Summary GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounting summary" },
      { status: 500 }
    );
  }
}
