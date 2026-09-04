import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAuth();
    if (error) return error;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const date = searchParams.get("date");

    const where: Record<string, any> = {};

    if (userId) where.userId = userId;

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      where.clockIn = { gte: start, lte: end };
    }

    const records = await db.attendance.findMany({
      where,
      orderBy: { clockIn: "desc" },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error("Attendance GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance records" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAuth();
    if (error) return error;
    const body = await request.json();
    const { action, userId, notes } = body;

    if (!action) {
      return NextResponse.json(
        { error: "action is required (clockIn or clockOut)" },
        { status: 400 }
      );
    }

    if (action === "clockIn") {
      if (!userId) {
        return NextResponse.json(
          { error: "userId is required to clock in" },
          { status: 400 }
        );
      }

      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      const existingToday = await db.attendance.findFirst({
        where: {
          userId,
          clockIn: { gte: startOfDay, lte: endOfDay },
          status: "ACTIVE",
        },
      });

      if (existingToday) {
        return NextResponse.json(
          { error: "User is already clocked in today" },
          { status: 400 }
        );
      }

      const record = await db.attendance.create({
        data: {
          userId,
          notes: notes || null,
          status: "ACTIVE",
        },
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      return NextResponse.json(record, { status: 201 });
    }

    if (action === "clockOut") {
      if (!userId) {
        return NextResponse.json(
          { error: "userId is required to clock out" },
          { status: 400 }
        );
      }

      const activeRecord = await db.attendance.findFirst({
        where: {
          userId,
          status: "ACTIVE",
        },
      });

      if (!activeRecord) {
        return NextResponse.json(
          { error: "No active clock-in record found" },
          { status: 400 }
        );
      }

      const record = await db.attendance.update({
        where: { id: activeRecord.id },
        data: {
          clockOut: new Date(),
          status: "ClockedOut",
        },
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      return NextResponse.json(record);
    }

    return NextResponse.json(
      { error: "Invalid action. Must be 'clockIn' or 'clockOut'" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Attendance POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process attendance" },
      { status: 500 }
    );
  }
}
