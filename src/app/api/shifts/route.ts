import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");

    const where: Record<string, any> = {};

    if (userId) where.userId = userId;
    if (status) where.status = status;

    const shifts = await db.shift.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(shifts.map((s) => ({
      ...s,
      totalSales: s.totalSales ? Number(s.totalSales) : null,
    })));
  } catch (error) {
    console.error("Shifts GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch shifts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, branchId, shiftId } = body;

    if (!action) {
      return NextResponse.json(
        { error: "action is required (start or end)" },
        { status: 400 }
      );
    }

    if (action === "start") {
      if (!userId) {
        return NextResponse.json(
          { error: "userId is required to start a shift" },
          { status: 400 }
        );
      }

      const activeShift = await db.shift.findFirst({
        where: { userId, status: "ACTIVE" },
      });

      if (activeShift) {
        return NextResponse.json(
          { error: "User already has an active shift" },
          { status: 400 }
        );
      }

      const shift = await db.shift.create({
        data: {
          userId,
          branchId: branchId || null,
          status: "ACTIVE",
        },
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
          branch: { select: { id: true, name: true } },
        },
      });

      return NextResponse.json(shift, { status: 201 });
    }

    if (action === "end") {
      if (!shiftId) {
        return NextResponse.json(
          { error: "shiftId is required to end a shift" },
          { status: 400 }
        );
      }

      const existingShift = await db.shift.findUnique({
        where: { id: shiftId },
      });

      if (!existingShift) {
        return NextResponse.json(
          { error: "Shift not found" },
          { status: 404 }
        );
      }

      if (existingShift.status !== "ACTIVE") {
        return NextResponse.json(
          { error: "Shift is not active" },
          { status: 400 }
        );
      }

      const now = new Date();

      const shiftSales = await db.sale.aggregate({
        where: {
          userId: existingShift.userId,
          createdAt: {
            gte: existingShift.startTime,
            lte: now,
          },
          status: "COMPLETED",
        },
        _sum: { total: true },
        _count: true,
      });

      const shift = await db.shift.update({
        where: { id: shiftId },
        data: {
          endTime: now,
          status: "CLOSED",
          totalSales: shiftSales._sum.total || 0,
          totalOrders: shiftSales._count,
        },
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
          branch: { select: { id: true, name: true } },
        },
      });

      return NextResponse.json({
        ...shift,
        totalSales: shift.totalSales ? Number(shift.totalSales) : null,
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Must be 'start' or 'end'" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Shifts POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process shift" },
      { status: 500 }
    );
  }
}
