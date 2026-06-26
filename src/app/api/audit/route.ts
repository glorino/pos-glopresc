import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getBranchFilter } from "@/lib/branch-filter";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const branchFilter = session?.user ? (() => {
      if ((session.user as any).role === "OWNER") return null;
      const bid = (session.user as any).branchId;
      return bid ? { branchId: bid } : { branchId: "__NONE__" };
    })() : { branchId: "__NONE__" };

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "30");
    const action = searchParams.get("action");
    const userId = searchParams.get("userId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const search = searchParams.get("search");

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
      where.user = { branchId: branchFilter.branchId };
    }

    const skip = (page - 1) * limit;

    const [auditLogs, total] = await Promise.all([
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
    ]);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [totalLogs, todayActivities, failedLogins, modifiedRecords, systemAlerts] =
      await Promise.all([
        db.auditLog.count({
          where: {
            ...(branchFilter ? { user: { branchId: branchFilter.branchId } } : {}),
          },
        }),
        db.auditLog.count({
          where: {
            createdAt: { gte: todayStart },
            ...(branchFilter ? { user: { branchId: branchFilter.branchId } } : {}),
          },
        }),
        db.auditLog.count({
          where: {
            action: { contains: "LOGIN_FAILED", mode: "insensitive" },
            ...(branchFilter ? { user: { branchId: branchFilter.branchId } } : {}),
          },
        }),
        db.auditLog.count({
          where: {
            action: { contains: "UPDATE", mode: "insensitive" },
            ...(branchFilter ? { user: { branchId: branchFilter.branchId } } : {}),
          },
        }),
        db.auditLog.count({
          where: {
            OR: [
              { action: { contains: "ALERT", mode: "insensitive" } },
              { action: { contains: "ERROR", mode: "insensitive" } },
            ],
            ...(branchFilter ? { user: { branchId: branchFilter.branchId } } : {}),
          },
        }),
      ]);

    const dailyActions: { name: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const count = await db.auditLog.count({
        where: {
          createdAt: { gte: dayStart, lt: dayEnd },
          ...(branchFilter ? { user: { branchId: branchFilter.branchId } } : {}),
        },
      });

      dailyActions.push({
        name: dayStart.toLocaleDateString("en-NG", { weekday: "short", day: "numeric" }),
        count,
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
      },
      dailyActions,
    });
  } catch (error) {
    console.error("Audit GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
