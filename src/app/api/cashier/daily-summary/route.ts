import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { getBranchFilter } from "@/lib/branch-filter";

export async function GET(request: Request) {
  try {
    const token = await getToken({ req: request as any });
    if (!token?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = token.id as string;
    const branchFilter = await getBranchFilter(request as any);
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    const startOfDay = new Date(date + "T00:00:00");
    const endOfDay = new Date(date + "T23:59:59");

    const [sales, drawerSession, paymentBreakdown] = await Promise.all([
      db.sale.findMany({
        where: {
          userId,
          status: "COMPLETED",
          createdAt: { gte: startOfDay, lte: endOfDay },
          ...(branchFilter || {}),
        },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          invoiceNumber: true,
          total: true,
          paymentMethod: true,
          createdAt: true,
          amountPaid: true,
          changeDue: true,
        },
      }),
      db.cashDrawer.findFirst({
        where: {
          userId,
          openedAt: { gte: startOfDay, lte: endOfDay },
        },
        orderBy: { openedAt: "desc" },
        select: {
          status: true,
          openingBalance: true,
          closingBalance: true,
          actualBalance: true,
          difference: true,
          openedAt: true,
          closedAt: true,
        },
      }),
      db.sale.groupBy({
        by: ["paymentMethod"],
        _sum: { total: true },
        _count: true,
        where: {
          userId,
          status: "COMPLETED",
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
    ]);

    const totalSales = sales.reduce((sum, s) => sum + Number(s.total), 0);
    const totalTransactions = sales.length;
    const cashSales = sales.filter((s) => s.paymentMethod === "CASH").reduce((sum, s) => sum + Number(s.total), 0);
    const cardSales = sales.filter((s) => s.paymentMethod === "CARD").reduce((sum, s) => sum + Number(s.total), 0);
    const transferSales = sales.filter((s) => s.paymentMethod === "TRANSFER").reduce((sum, s) => sum + Number(s.total), 0);
    const otherSales = totalSales - cashSales - cardSales - transferSales;
    const totalCashReceived = sales.filter((s) => s.paymentMethod === "CASH").reduce((sum, s) => sum + Number(s.amountPaid), 0);
    const totalChangeGiven = sales.filter((s) => s.paymentMethod === "CASH").reduce((sum, s) => sum + Number(s.changeDue), 0);

    return NextResponse.json({
      date,
      totalSales,
      totalTransactions,
      averageSale: totalTransactions > 0 ? Math.round(totalSales / totalTransactions) : 0,
      cashSales,
      cardSales,
      transferSales,
      otherSales,
      totalCashReceived,
      totalChangeGiven,
      drawer: drawerSession ? {
        status: drawerSession.status,
        openingBalance: Number(drawerSession.openingBalance),
        closingBalance: drawerSession.closingBalance ? Number(drawerSession.closingBalance) : null,
        actualBalance: drawerSession.actualBalance ? Number(drawerSession.actualBalance) : null,
        difference: drawerSession.difference ? Number(drawerSession.difference) : null,
        openedAt: drawerSession.openedAt?.toISOString(),
        closedAt: drawerSession.closedAt?.toISOString(),
      } : null,
      recentSales: sales.slice(-10).map((s) => ({
        ...s,
        total: Number(s.total),
      })),
    });
  } catch (error) {
    console.error("Daily summary error:", error);
    return NextResponse.json({ error: "Failed to fetch daily summary" }, { status: 500 });
  }
}
