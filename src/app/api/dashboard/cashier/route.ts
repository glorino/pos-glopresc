import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const token = await getToken({ req: request as any });
    if (!token?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = token.id as string;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const [todaySalesResult, todayTransactions, recentSales, drawerStatus, pendingOrders, paymentMethods] = await Promise.all([
      db.sale.aggregate({
        _sum: { total: true },
        where: {
          userId,
          status: "COMPLETED",
          createdAt: { gte: startOfToday, lte: endOfToday },
        },
      }),
      db.sale.count({
        where: {
          userId,
          status: "COMPLETED",
          createdAt: { gte: startOfToday, lte: endOfToday },
        },
      }),
      db.sale.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          invoiceNumber: true,
          total: true,
          createdAt: true,
          paymentMethod: true,
          status: true,
        },
      }),
      db.cashDrawer.findFirst({
        where: { userId, status: "OPEN" },
        orderBy: { openedAt: "desc" },
        select: {
          status: true,
          openingBalance: true,
          openedAt: true,
        },
      }),
      db.sale.count({
        where: { userId, status: "PENDING" },
      }),
      db.sale.groupBy({
        by: ["paymentMethod"],
        _count: true,
        where: {
          userId,
          status: "COMPLETED",
          createdAt: { gte: startOfToday, lte: endOfToday },
        },
      }),
    ]);

    const todaySales = Number(todaySalesResult._sum.total ?? 0);
    const averageSale = todayTransactions > 0 ? Math.round(todaySales / todayTransactions) : 0;

    return NextResponse.json({
      todaySales,
      transactions: todayTransactions,
      averageSale,
      pendingOrders,
      recentSales: recentSales.map((s: any) => ({
        ...s,
        total: Number(s.total),
      })),
      drawerStatus: {
        isOpen: drawerStatus?.status === "OPEN",
        openingBalance: Number(drawerStatus?.openingBalance ?? 0),
        openedAt: drawerStatus?.openedAt?.toISOString() ?? null,
      },
      paymentMethods: paymentMethods.map((pm: any) => ({
        name: pm.paymentMethod,
        count: pm._count,
      })),
    });
  } catch (error) {
    console.error("Cashier dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
