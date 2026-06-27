import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { error } = await requireAuth(["OWNER", "MANAGER", "ACCOUNTANT", "AUDITOR"]);
  if (error) return error;
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "50");

    const where: Record<string, any> = { status: "CLOSED" };
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.closedAt = {};
      if (startDate) where.closedAt.gte = new Date(startDate);
      if (endDate) where.closedAt.lte = new Date(endDate + "T23:59:59");
    }

    const skip = (page - 1) * limit;

    const [drawers, total] = await Promise.all([
      db.cashDrawer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { closedAt: "desc" },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, role: true } },
        },
      }),
      db.cashDrawer.count({ where }),
    ]);

    const enrichedDrawers = drawers.map((d) => ({
      id: d.id,
      userId: d.userId,
      cashier: `${d.user.firstName} ${d.user.lastName}`,
      role: d.user.role,
      openingBalance: Number(d.openingBalance),
      closingBalance: d.closingBalance ? Number(d.closingBalance) : null,
      actualBalance: d.actualBalance ? Number(d.actualBalance) : null,
      difference: d.difference ? Number(d.difference) : null,
      notes: d.notes,
      openedAt: d.openedAt.toISOString(),
      closedAt: d.closedAt?.toISOString() ?? null,
      overage: d.difference ? Math.max(0, Number(d.difference)) : 0,
      shortage: d.difference ? Math.abs(Math.min(0, Number(d.difference))) : 0,
    }));

    const summary = await db.cashDrawer.groupBy({
      by: ["userId"],
      where: { status: "CLOSED", ...(userId ? { userId } : {}) },
      _count: { id: true },
      _sum: { difference: true, openingBalance: true, closingBalance: true, actualBalance: true },
      _avg: { difference: true },
    });

    const usersSummary = await Promise.all(
      summary.map(async (s) => {
        const user = await db.user.findUnique({
          where: { id: s.userId },
          select: { firstName: true, lastName: true, role: true },
        });
        const totalDiff = s._sum.difference ? Number(s._sum.difference) : 0;
        return {
          userId: s.userId,
          cashier: user ? `${user.firstName} ${user.lastName}` : "Unknown",
          role: user?.role ?? "UNKNOWN",
          sessions: s._count.id,
          totalOverage: Math.max(0, totalDiff),
          totalShortage: Math.abs(Math.min(0, totalDiff)),
          netDifference: totalDiff,
          avgDifference: s._avg.difference ? Number(s._avg.difference) : 0,
        };
      })
    );

    return NextResponse.json({
      drawers: enrichedDrawers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      usersSummary: usersSummary.sort((a, b) => a.netDifference - b.netDifference),
    });
  } catch (error) {
    console.error("Cash drawer reports GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cash drawer reports" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const { error } = await requireAuth(["OWNER", "MANAGER", "ACCOUNTANT"]);
  if (error) return error;
  try {
    const body = await request.json();
    const { drawerId, notes } = body;

    if (!drawerId) {
      return NextResponse.json({ error: "Drawer ID is required" }, { status: 400 });
    }

    const drawer = await db.cashDrawer.update({
      where: { id: drawerId },
      data: { notes: notes || null },
      include: { user: { select: { firstName: true, lastName: true } } },
    });

    return NextResponse.json({
      id: drawer.id,
      notes: drawer.notes,
    });
  } catch (error: any) {
    console.error("Cash drawer reports PUT error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update drawer notes" },
      { status: 500 }
    );
  }
}
