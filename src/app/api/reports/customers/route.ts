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

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const dateFilter: Record<string, any> = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.lte = new Date(endDate + "T23:59:59");
    }

    const [
      totalCustomers,
      newCustomersCount,
      activeCustomers,
      topCustomers,
      loyaltySummary,
      customerGrowth,
      customersByState,
      recentCustomers,
      totalRevenueFromCustomers,
    ] = await Promise.all([
      db.customer.count({ where: { isActive: true } }),
      db.customer.count({
        where: { isActive: true, ...dateFilter },
      }),
      db.customer.count({
        where: {
          isActive: true,
          sales: { some: { status: "COMPLETED" } },
        },
      }),
      db.customer.findMany({
        where: { isActive: true },
        orderBy: { totalSpent: "desc" },
        take: 10,
        include: {
          _count: { select: { sales: true } },
        },
      }),
      db.customer.aggregate({
        _sum: { loyaltyPoints: true, totalSpent: true },
        _avg: { loyaltyPoints: true, totalSpent: true },
        where: { isActive: true },
      }),
      db.$queryRaw<{ month: string; count: number }[]>`
        SELECT
          TO_CHAR("createdAt", 'YYYY-MM') AS month,
          COUNT(*)::int AS count
        FROM "Customer"
        WHERE "isActive" = true
          AND "createdAt" >= ${new Date(new Date().getFullYear(), 0, 1)}
        GROUP BY month
        ORDER BY month ASC
      `,
      db.$queryRaw<{ state: string; count: number }[]>`
        SELECT
          COALESCE("state", 'Unknown') AS state,
          COUNT(*)::int AS count
        FROM "Customer"
        WHERE "isActive" = true
        GROUP BY state
        ORDER BY count DESC
      `,
      db.customer.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          _count: { select: { sales: true } },
        },
      }),
      db.customer.aggregate({
        _sum: { totalSpent: true },
        where: { isActive: true, totalSpent: { gt: 0 } },
      }),
    ]);

    const resolvedTopCustomers = topCustomers.map((c) => ({
      id: c.id,
      name: `${c.firstName} ${c.lastName}`,
      email: c.email,
      phone: c.phone,
      totalSpent: Number(c.totalSpent),
      loyaltyPoints: c.loyaltyPoints,
      orderCount: c._count.sales,
    }));

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const currentYear = new Date().getFullYear();
    const growthData = monthNames.map((name, i) => {
      const monthKey = `${currentYear}-${String(i + 1).padStart(2, "0")}`;
      const found = customerGrowth.find((m) => m.month === monthKey);
      return { name, count: found ? found.count : 0 };
    });

    return NextResponse.json({
      summary: {
        totalCustomers,
        newCustomers: newCustomersCount,
        activeCustomers,
        inactiveCustomers: totalCustomers - activeCustomers,
        totalLoyaltyPoints: Number(loyaltySummary._sum.loyaltyPoints ?? 0),
        totalRevenueFromCustomers: Number(totalRevenueFromCustomers._sum.totalSpent ?? 0),
        avgLoyaltyPoints: Number(loyaltySummary._avg.loyaltyPoints ?? 0),
        avgSpendPerCustomer: Number(loyaltySummary._avg.totalSpent ?? 0),
      },
      topCustomers: resolvedTopCustomers,
      customerGrowth: growthData,
      customersByState: customersByState.map((s) => ({
        state: s.state,
        count: s.count,
      })),
      recentCustomers: recentCustomers.map((c) => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        email: c.email,
        phone: c.phone,
        city: c.city,
        state: c.state,
        totalSpent: Number(c.totalSpent),
        loyaltyPoints: c.loyaltyPoints,
        orderCount: c._count.sales,
        createdAt: c.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Customer report GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer report" },
      { status: 500 }
    );
  }
}
