import { db } from "./db";

export interface AIInsight {
  id: string;
  type: "trend" | "alert" | "opportunity" | "performance" | "forecast" | "summary";
  severity: "info" | "success" | "warning" | "critical";
  title: string;
  description: string;
  metric?: { value: string; label: string; change?: string };
  action?: { label: string; href: string };
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function currency(n: number): string {
  return `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export async function getOwnerInsights(): Promise<AIInsight[]> {
  const insights: AIInsight[] = [];
  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const yesterdayStart = daysAgo(1);
  const weekAgo = daysAgo(7);
  const twoWeeksAgo = daysAgo(14);

  const [todaySales, yesterdaySales, weekSales, prevWeekSales, totalProducts, lowStock, totalCustomers, pendingExpenses, cashDrawers] = await Promise.all([
    db.sale.aggregate({ where: { status: "COMPLETED", createdAt: { gte: todayStart } }, _sum: { total: true }, _count: { id: true } }),
    db.sale.aggregate({ where: { status: "COMPLETED", createdAt: { gte: yesterdayStart, lt: todayStart } }, _sum: { total: true }, _count: { id: true } }),
    db.sale.aggregate({ where: { status: "COMPLETED", createdAt: { gte: weekAgo } }, _sum: { total: true }, _count: { id: true } }),
    db.sale.aggregate({ where: { status: "COMPLETED", createdAt: { gte: twoWeeksAgo, lt: weekAgo } }, _sum: { total: true }, _count: { id: true } }),
    db.product.count({ where: { isActive: true } }),
    db.product.count({ where: { isActive: true, stockQuantity: { lte: db.product.fields.minStockLevel as any } } }).catch(() => 0),
    db.customer.count({ where: { isActive: true } }),
    db.expense.count({ where: { status: "PENDING" } }),
    db.cashDrawer.findMany({ where: { status: "CLOSED", closedAt: { gte: daysAgo(7) } }, select: { difference: true } }),
  ]);

  const todayRevenue = Number(todaySales._sum.total || 0);
  const yesterdayRevenue = Number(yesterdaySales._sum.total || 0);
  const weekRevenue = Number(weekSales._sum.total || 0);
  const prevWeekRevenue = Number(prevWeekSales._sum.total || 0);
  const weekChange = prevWeekRevenue > 0 ? ((weekRevenue - prevWeekRevenue) / prevWeekRevenue * 100) : 0;

  insights.push({
    id: "revenue-summary",
    type: "summary",
    severity: "info",
    title: "Revenue Overview",
    description: `Today: ${currency(todayRevenue)} from ${todaySales._count.id} sales. This week: ${currency(weekRevenue)}.`,
    metric: { value: currency(weekRevenue), label: "Weekly Revenue", change: `${weekChange >= 0 ? "+" : ""}${weekChange.toFixed(1)}%` },
  });

  if (weekChange > 10) {
    insights.push({
      id: "revenue-growth",
      type: "trend",
      severity: "success",
      title: "Strong Revenue Growth",
      description: `Revenue is up ${weekChange.toFixed(1)}% compared to last week. Keep up the momentum!`,
      metric: { value: `+${weekChange.toFixed(1)}%`, label: "Week-over-Week" },
    });
  } else if (weekChange < -10) {
    insights.push({
      id: "revenue-decline",
      type: "alert",
      severity: "warning",
      title: "Revenue Declining",
      description: `Revenue dropped ${Math.abs(weekChange).toFixed(1)}% vs last week. Consider running promotions or reviewing pricing.`,
      metric: { value: `${weekChange.toFixed(1)}%`, label: "Week-over-Week" },
      action: { label: "View Reports", href: "/dashboard/owner/reports" },
    });
  }

  const totalOverage = cashDrawers.reduce((sum, d) => sum + Math.max(0, Number(d.difference || 0)), 0);
  const totalShortage = cashDrawers.reduce((sum, d) => sum + Math.abs(Math.min(0, Number(d.difference || 0))), 0);

  if (totalShortage > 0) {
    insights.push({
      id: "cash-shortage",
      type: "alert",
      severity: totalShortage > 10000 ? "critical" : "warning",
      title: "Cash Shortages Detected",
      description: `Total cash shortages this week: ${currency(totalShortage)}. Overage: ${currency(totalOverage)}. Review cash drawer reports for details.`,
      metric: { value: currency(totalShortage), label: "Total Shortage" },
      action: { label: "Cash Drawer Reports", href: "/dashboard/accounting" },
    });
  }

  if (lowStock > 0) {
    insights.push({
      id: "low-stock",
      type: "alert",
      severity: "warning",
      title: "Low Stock Alert",
      description: `${lowStock} product${lowStock > 1 ? "s are" : " is"} below minimum stock level and need restocking.`,
      metric: { value: String(lowStock), label: "Low Stock Items" },
      action: { label: "View Inventory", href: "/dashboard/inventory/stock" },
    });
  }

  if (pendingExpenses > 0) {
    insights.push({
      id: "pending-expenses",
      type: "opportunity",
      severity: "info",
      title: "Pending Expense Approvals",
      description: `${pendingExpenses} expense${pendingExpenses > 1 ? "s" : ""} awaiting approval.`,
      metric: { value: String(pendingExpenses), label: "Pending" },
      action: { label: "Review Expenses", href: "/dashboard/accounting" },
    });
  }

  const topProducts = await db.saleItem.groupBy({
    by: ["productId"],
    where: { sale: { status: "COMPLETED", createdAt: { gte: weekAgo } } },
    _sum: { total: true, quantity: true },
    orderBy: { _sum: { total: "desc" } },
    take: 3,
  });

  if (topProducts.length > 0) {
    const names = await Promise.all(
      topProducts.map(async (p) => {
        const prod = await db.product.findUnique({ where: { id: p.productId }, select: { name: true } });
        return prod?.name ?? "Unknown";
      })
    );
    insights.push({
      id: "top-products",
      type: "performance",
      severity: "success",
      title: "Top Selling Products This Week",
      description: names.map((n, i) => `${i + 1}. ${n}`).join(", "),
    });
  }

  return insights;
}

export async function getManagerInsights(): Promise<AIInsight[]> {
  const insights: AIInsight[] = [];
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const weekAgo = daysAgo(7);

  const [todaySales, lowStock, pendingExpenses, staffSales] = await Promise.all([
    db.sale.aggregate({ where: { status: "COMPLETED", createdAt: { gte: todayStart } }, _sum: { total: true }, _count: { id: true } }),
    db.product.count({ where: { isActive: true, stockQuantity: { lte: 5 } } }),
    db.expense.count({ where: { status: "PENDING" } }),
    db.sale.groupBy({
      by: ["userId"],
      where: { status: "COMPLETED", createdAt: { gte: todayStart } },
      _sum: { total: true },
      _count: { id: true },
      orderBy: { _sum: { total: "desc" } },
      take: 5,
    }),
  ]);

  const todayRevenue = Number(todaySales._sum.total || 0);
  insights.push({
    id: "mgr-revenue",
    type: "summary",
    severity: "info",
    title: "Today's Performance",
    description: `${currency(todayRevenue)} revenue from ${todaySales._count.id} transactions today.`,
    metric: { value: currency(todayRevenue), label: "Today's Revenue" },
  });

  if (staffSales.length > 0) {
    const topStaff = await db.user.findUnique({ where: { id: staffSales[0].userId }, select: { firstName: true, lastName: true } });
    const topName = topStaff ? `${topStaff.firstName} ${topStaff.lastName}` : "N/A";
    const topRevenue = Number(staffSales[0]._sum.total || 0);
    insights.push({
      id: "mgr-top-staff",
      type: "performance",
      severity: "success",
      title: "Top Performer Today",
      description: `${topName} leads with ${currency(topRevenue)} in sales.`,
      metric: { value: currency(topRevenue), label: topName },
    });
  }

  if (lowStock > 0) {
    insights.push({
      id: "mgr-low-stock",
      type: "alert",
      severity: "warning",
      title: "Inventory Needs Attention",
      description: `${lowStock} items critically low on stock.`,
      action: { label: "View Stock", href: "/dashboard/inventory/stock" },
    });
  }

  if (pendingExpenses > 0) {
    insights.push({
      id: "mgr-expenses",
      type: "opportunity",
      severity: "info",
      title: "Expense Approvals Pending",
      description: `${pendingExpenses} expense(s) need your review.`,
      action: { label: "Review", href: "/dashboard/accounting" },
    });
  }

  return insights;
}

export async function getAccountantInsights(): Promise<AIInsight[]> {
  const insights: AIInsight[] = [];
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const prevMonthStart = new Date(monthStart); prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);

  const [monthSales, prevMonthSales, monthExpenses, pendingInvoices, overdueInvoices] = await Promise.all([
    db.sale.aggregate({ where: { status: "COMPLETED", createdAt: { gte: monthStart } }, _sum: { total: true } }),
    db.sale.aggregate({ where: { status: "COMPLETED", createdAt: { gte: prevMonthStart, lt: monthStart } }, _sum: { total: true } }),
    db.expense.aggregate({ where: { date: { gte: monthStart } }, _sum: { amount: true } }),
    db.invoice.count({ where: { status: "PENDING" } }),
    db.invoice.count({ where: { status: "OVERDUE" } }),
  ]);

  const monthRevenue = Number(monthSales._sum.total || 0);
  const prevRevenue = Number(prevMonthSales._sum.total || 0);
  const monthExp = Number(monthExpenses._sum.amount || 0);
  const profit = monthRevenue - monthExp;
  const revenueChange = prevRevenue > 0 ? ((monthRevenue - prevRevenue) / prevRevenue * 100) : 0;

  insights.push({
    id: "acc-profit",
    type: "summary",
    severity: profit >= 0 ? "success" : "critical",
    title: "Monthly Profitability",
    description: `Revenue: ${currency(monthRevenue)}. Expenses: ${currency(monthExp)}. Net: ${currency(profit)}.`,
    metric: { value: currency(profit), label: "Net Profit", change: `${revenueChange >= 0 ? "+" : ""}${revenueChange.toFixed(1)}%` },
  });

  if (overdueInvoices > 0) {
    insights.push({
      id: "acc-overdue",
      type: "alert",
      severity: "critical",
      title: "Overdue Invoices",
      description: `${overdueInvoices} invoice(s) are past due. Follow up required.`,
      metric: { value: String(overdueInvoices), label: "Overdue" },
      action: { label: "View Invoices", href: "/dashboard/accounting/invoices" },
    });
  }

  if (pendingInvoices > 0) {
    insights.push({
      id: "acc-pending-inv",
      type: "opportunity",
      severity: "info",
      title: "Pending Invoices",
      description: `${pendingInvoices} invoice(s) awaiting payment.`,
      metric: { value: String(pendingInvoices), label: "Pending" },
    });
  }

  return insights;
}

export async function getCashierInsights(userId: string): Promise<AIInsight[]> {
  const insights: AIInsight[] = [];
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const weekAgo = daysAgo(7);

  const [todaySales, weekSales, drawer] = await Promise.all([
    db.sale.aggregate({ where: { status: "COMPLETED", userId, createdAt: { gte: todayStart } }, _sum: { total: true, amountPaid: true }, _count: { id: true } }),
    db.sale.aggregate({ where: { status: "COMPLETED", userId, createdAt: { gte: weekAgo } }, _sum: { total: true }, _count: { id: true } }),
    db.cashDrawer.findFirst({ where: { userId, status: "OPEN" }, select: { openingBalance: true, openedAt: true } }),
  ]);

  const todayRevenue = Number(todaySales._sum.total || 0);
  const todayCount = todaySales._count.id;
  const avgSale = todayCount > 0 ? todayRevenue / todayCount : 0;
  const weekRevenue = Number(weekSales._sum.total || 0);

  insights.push({
    id: "cash-today",
    type: "summary",
    severity: "info",
    title: "Today's Performance",
    description: `${currency(todayRevenue)} from ${todayCount} sales. Average: ${currency(avgSale)}.`,
    metric: { value: currency(todayRevenue), label: "Today's Sales" },
  });

  if (drawer) {
    const expectedInDrawer = Number(drawer.openingBalance) + todayRevenue;
    insights.push({
      id: "cash-drawer",
      type: "performance",
      severity: "info",
      title: "Cash Drawer Status",
      description: `Drawer opened. Expected cash: ${currency(expectedInDrawer)}. Don't forget to close your register.`,
      metric: { value: currency(expectedInDrawer), label: "Expected in Drawer" },
    });
  }

  if (todayCount === 0) {
    insights.push({
      id: "cash-no-sales",
      type: "alert",
      severity: "warning",
      title: "No Sales Yet Today",
      description: "You haven't recorded any sales today. Head to the POS terminal to start.",
      action: { label: "Open POS", href: "/dashboard/cashier/pos" },
    });
  }

  return insights;
}

export async function getSalesManagerInsights(): Promise<AIInsight[]> {
  const insights: AIInsight[] = [];
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const weekAgo = daysAgo(7);

  const [todaySales, topProducts, categorySales] = await Promise.all([
    db.sale.aggregate({ where: { status: "COMPLETED", createdAt: { gte: todayStart } }, _sum: { total: true, discount: true }, _count: { id: true } }),
    db.saleItem.groupBy({
      by: ["productId"],
      where: { sale: { status: "COMPLETED", createdAt: { gte: weekAgo } } },
      _sum: { total: true, quantity: true },
      orderBy: { _sum: { total: "desc" } },
      take: 5,
    }),
    db.saleItem.groupBy({
      by: ["productId"],
      where: { sale: { status: "COMPLETED", createdAt: { gte: weekAgo } } },
      _sum: { total: true },
    }),
  ]);

  const todayRevenue = Number(todaySales._sum.total || 0);
  const totalDiscount = Number(todaySales._sum.discount || 0);

  insights.push({
    id: "sm-revenue",
    type: "summary",
    severity: "info",
    title: "Sales Overview",
    description: `${currency(todayRevenue)} today from ${todaySales._count.id} transactions. Discount given: ${currency(totalDiscount)}.`,
    metric: { value: currency(todayRevenue), label: "Today's Revenue" },
  });

  if (totalDiscount > todayRevenue * 0.1 && todayRevenue > 0) {
    insights.push({
      id: "sm-high-discount",
      type: "alert",
      severity: "warning",
      title: "High Discount Rate",
      description: `Discounts are ${((totalDiscount / todayRevenue) * 100).toFixed(1)}% of revenue today. Consider reviewing discount policies.`,
      metric: { value: `${((totalDiscount / todayRevenue) * 100).toFixed(1)}%`, label: "Discount Rate" },
    });
  }

  if (topProducts.length > 0) {
    const names = await Promise.all(
      topProducts.slice(0, 3).map(async (p) => {
        const prod = await db.product.findUnique({ where: { id: p.productId }, select: { name: true } });
        return `${prod?.name ?? "?"} (${currency(Number(p._sum.total || 0))})`;
      })
    );
    insights.push({
      id: "sm-top-products",
      type: "performance",
      severity: "success",
      title: "Top Products This Week",
      description: names.join(" • "),
    });
  }

  return insights;
}

export async function getAuditorInsights(): Promise<AIInsight[]> {
  const insights: AIInsight[] = [];
  const weekAgo = daysAgo(7);

  const [auditLogs, uniqueUsers, anomalousDrawers] = await Promise.all([
    db.auditLog.count({ where: { createdAt: { gte: weekAgo } } }),
    db.auditLog.findMany({ where: { createdAt: { gte: weekAgo } }, select: { userId: true }, distinct: ["userId"] }),
    db.cashDrawer.findMany({
      where: { status: "CLOSED", closedAt: { gte: weekAgo } },
      select: { difference: true, user: { select: { firstName: true, lastName: true } } },
    }),
  ]);

  const shortages = anomalousDrawers.filter((d) => Number(d.difference || 0) < 0);
  const totalShortage = shortages.reduce((sum, d) => sum + Math.abs(Number(d.difference || 0)), 0);

  insights.push({
    id: "aud-activity",
    type: "summary",
    severity: "info",
    title: "Weekly Audit Activity",
    description: `${auditLogs} audit events from ${uniqueUsers.length} unique users this week.`,
    metric: { value: String(auditLogs), label: "Audit Events" },
  });

  if (shortages.length > 0) {
    const names = shortages.map((d) => d.user.firstName).join(", ");
    insights.push({
      id: "aud-shortages",
      type: "alert",
      severity: totalShortage > 5000 ? "critical" : "warning",
      title: "Cash Drawer Discrepancies",
      description: `${shortages.length} session(s) with shortages totaling ${currency(totalShortage)}. Reps: ${names}.`,
      metric: { value: currency(totalShortage), label: "Total Shortage" },
      action: { label: "View Details", href: "/dashboard/accounting" },
    });
  }

  return insights;
}
