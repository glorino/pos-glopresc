import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { error } = await requireAuth(["OWNER", "MANAGER", "ACCOUNTANT"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month") || new Date().toISOString().slice(0, 7);

    const startOfMonth = new Date(month + "-01T00:00:00");
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const drawers = await db.cashDrawer.findMany({
      where: {
        status: "CLOSED",
        closedAt: { gte: startOfMonth, lt: endOfMonth },
        difference: { not: null },
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { closedAt: "desc" },
    });

    const userShortages: Record<string, { name: string; email: string; totalShortage: number; entries: any[] }> = {};
    const userOverages: Record<string, { name: string; email: string; totalOverage: number; entries: any[] }> = {};

    for (const d of drawers) {
      const diff = Number(d.difference);
      const uid = d.userId;
      const entry = {
        id: d.id,
        date: d.closedAt?.toISOString(),
        openingBalance: Number(d.openingBalance),
        closingBalance: Number(d.closingBalance),
        actualBalance: Number(d.actualBalance),
      };

      if (diff < 0) {
        if (!userShortages[uid]) {
          userShortages[uid] = {
            name: `${d.user.firstName} ${d.user.lastName}`,
            email: d.user.email,
            totalShortage: 0,
            entries: [],
          };
        }
        userShortages[uid].totalShortage += Math.abs(diff);
        userShortages[uid].entries.push({ ...entry, shortage: Math.abs(diff) });
      } else if (diff > 0) {
        if (!userOverages[uid]) {
          userOverages[uid] = {
            name: `${d.user.firstName} ${d.user.lastName}`,
            email: d.user.email,
            totalOverage: 0,
            entries: [],
          };
        }
        userOverages[uid].totalOverage += diff;
        userOverages[uid].entries.push({ ...entry, overage: diff });
      }
    }

    const totalShortage = Object.values(userShortages).reduce((sum, u) => sum + u.totalShortage, 0);
    const totalOverage = Object.values(userOverages).reduce((sum, u) => sum + u.totalOverage, 0);
    const netDifference = totalOverage - totalShortage;
    const balancedDrawers = drawers.filter((d) => Number(d.difference) === 0).length;

    return NextResponse.json({
      month,
      totalShortage,
      totalOverage,
      netDifference,
      balancedDrawers,
      totalDrawers: drawers.length,
      users: Object.values(userShortages),
      overageUsers: Object.values(userOverages),
      allDrawers: drawers.map((d) => ({
        id: d.id,
        user: `${d.user.firstName} ${d.user.lastName}`,
        userId: d.userId,
        date: d.closedAt?.toISOString(),
        openingBalance: Number(d.openingBalance),
        closingBalance: Number(d.closingBalance),
        actualBalance: Number(d.actualBalance),
        difference: Number(d.difference),
      })),
    });
  } catch (error: any) {
    console.error("Cash shortages report error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
